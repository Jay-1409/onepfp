# AWS S3 and SQS Setup Guide

This guide sets up the AWS side of `onepfp`: direct image uploads to S3 and asynchronous upload-completion events through SQS.

The app signs upload URLs for this S3 object key:

```text
{user_id}/{session_id}/{image_id}
```

Example:

```text
testuser/0072a13c81e726f485b2f461da0fbaad/avatar.jpg
```

Keep that key format in mind when choosing S3 event prefixes. For the current app, the easiest correct setup is to leave the event prefix empty.

---

## Flow

```text
Client requests upload URL
        ↓
Express API inserts an images row with status=pending
        ↓
Client uploads directly to S3 with the presigned URL
        ↓
S3 publishes an ObjectCreated event to SQS
        ↓
Worker polls SQS and parses the object key
        ↓
Worker updates the matching images row to status=completed
        ↓
Worker deletes the SQS message
```

AWS notes verified against the Amazon S3 documentation:

- S3 event notifications can publish new-object events to SQS.
- S3 event notifications are delivered at least once, so worker processing should be idempotent.
- Direct S3 event notifications do not support SQS FIFO queues. Use a Standard queue, or use EventBridge if you need FIFO.
- S3 must be allowed to call `SQS:SendMessage` on the destination queue.
- If the SQS queue uses a customer-managed KMS key, the key policy must also allow the S3 service principal.

---

## 1. Choose Names and Region

Pick these values first so every policy uses the same names:

```text
AWS account ID: <ACCOUNT_ID>
AWS region: ap-south-1
S3 bucket name: onepfp-bkt
SQS queue name: onepfp-upload-events
```

Use one AWS region for both S3 and SQS. The examples below use `ap-south-1`.

---

## 2. Create the S3 Bucket

Go to:

```text
AWS Console -> S3 -> Create bucket
```

Use:

```text
Bucket name: onepfp-bkt
AWS Region: ap-south-1
Object Ownership: ACLs disabled / Bucket owner enforced
Block Public Access: keep enabled unless you intentionally serve images directly from public S3 URLs
```

The app redirects active image requests to either:

```text
CDN_URL/{user_id}/{session_id}/{image_id}
```

or, if `CDN_URL` is not set:

```text
https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{user_id}/{session_id}/{image_id}
```

For production, prefer a CDN or another controlled serving layer. If you use direct public S3 URLs for a small demo, you must intentionally allow public read access in the bucket policy and ensure Block Public Access is not blocking that policy.

### Optional Public Read Policy

Use this only if you want direct public S3 object URLs to work:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadProfileImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::onepfp-bkt/*"
    }
  ]
}
```

Replace `onepfp-bkt` with your bucket name.

---

## 3. Configure S3 CORS

If uploads come from a browser or Bruno-like client, configure bucket CORS.

Go to:

```text
S3 -> bucket -> Permissions -> Cross-origin resource sharing (CORS)
```

For local development:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": ["http://localhost:9991"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

If a separate frontend uploads the file, replace `http://localhost:9991` with that frontend origin, for example `http://localhost:5173`.

For quick testing only, you can allow all origins:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 4. Create a Standard SQS Queue

Go to:

```text
AWS Console -> SQS -> Create queue
```

Use:

```text
Queue type: Standard
Name: onepfp-upload-events
Visibility timeout: 60 seconds
Message retention period: 4 days
Receive message wait time: 20 seconds
```

Do not choose a FIFO queue for direct S3 event notifications.

After creating the queue, copy:

```text
Queue URL
Queue ARN
```

Example:

```text
Queue URL: https://sqs.ap-south-1.amazonaws.com/123456789012/onepfp-upload-events
Queue ARN: arn:aws:sqs:ap-south-1:123456789012:onepfp-upload-events
```

---

## 5. Allow S3 to Send Messages to SQS

Now that both the bucket and queue exist, add the queue policy.

Go to:

```text
SQS -> queue -> Access policy -> Edit
```

Use:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ObjectCreatedEvents",
      "Effect": "Allow",
      "Principal": {
        "Service": "s3.amazonaws.com"
      },
      "Action": "SQS:SendMessage",
      "Resource": "arn:aws:sqs:ap-south-1:123456789012:onepfp-upload-events",
      "Condition": {
        "ArnLike": {
          "aws:SourceArn": "arn:aws:s3:::onepfp-bkt"
        },
        "StringEquals": {
          "aws:SourceAccount": "123456789012"
        }
      }
    }
  ]
}
```

Replace:

```text
123456789012          -> your AWS account ID
ap-south-1            -> your AWS region
onepfp-upload-events  -> your SQS queue name
onepfp-bkt            -> your S3 bucket name
```

Important details:

- `Resource` must be the SQS queue ARN, not the SQS queue URL.
- `aws:SourceArn` must be the S3 bucket ARN, not an object ARN with `/*`.
- If S3 reports that it cannot validate the destination, this policy is the first thing to re-check.

---

## 6. Add the S3 Event Notification

Go to:

```text
S3 -> bucket -> Properties -> Event notifications -> Create event notification
```

Use:

```text
Event name: onepfp-object-created
Event types: All object create events
Destination: SQS queue
SQS queue: onepfp-upload-events
Prefix: leave empty
Suffix: leave empty, or use .jpg only if every upload uses that suffix
```

Why leave the prefix empty? The app uploads keys like:

```text
testuser/0072a13c81e726f485b2f461da0fbaad/avatar.jpg
```

A prefix such as `images/` would not match the current app and the worker would never receive upload events.

---

## 7. Configure `.env`

Add the AWS values to your project `.env`:

```env
S3_BUCKET=onepfp-bkt
AWS_REGION=ap-south-1
SQS_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/123456789012/onepfp-upload-events

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

The AWS SDK can also use other credential providers, such as an AWS profile or IAM role. The app only needs credentials that can:

- Generate S3 presigned `PutObject` URLs for the configured bucket.
- Poll and delete messages from the configured SQS queue.

---

## 8. Test the AWS Path

1. Start the API:

   ```bash
   node server.cjs
   ```

2. Start the worker:

   ```bash
   npm run worker
   ```

3. Use the Bruno collection or API endpoints:

   ```text
   Signup -> Login -> Get Presigned URL -> Upload Image
   ```

4. Watch the worker logs. A successful upload should produce logs like:

   ```text
   Processing S3 key: testuser/0072a13c81e726f485b2f461da0fbaad/avatar.jpg
   Updated database status for key: ...
   Successfully processed and deleted message: ...
   ```

5. Confirm the database row moved from:

   ```text
   pending -> completed
   ```

---

## 9. Troubleshooting

### Unable to validate destination configuration

Check:

```text
[ ] SQS queue is Standard, not FIFO
[ ] S3 bucket and SQS queue are in the same region
[ ] SQS access policy Principal is s3.amazonaws.com
[ ] SQS access policy Action is SQS:SendMessage
[ ] Resource is the exact SQS queue ARN
[ ] aws:SourceArn is the exact S3 bucket ARN
[ ] aws:SourceAccount is the bucket owner's AWS account ID
[ ] Customer-managed KMS keys allow the S3 service principal
```

### Worker does not receive messages

Check:

```text
[ ] The S3 event notification exists on the correct bucket
[ ] The event type includes ObjectCreated events
[ ] Prefix/suffix filters match the actual uploaded object key
[ ] The object was uploaded after the event notification was created
[ ] SQS queue URL in .env matches the destination queue
```

For the current app, this key should match the event notification:

```text
{user_id}/{session_id}/{image_id}
```

### Image redirects return AccessDenied

The upload completed, but the image is not readable from the URL returned by `GET /images/:user_id`.

Choose one serving approach:

```text
Option A: Set CDN_URL and serve images through your CDN/origin policy.
Option B: Allow public S3 reads for demo use.
Option C: Change the API later to return signed download URLs instead of public redirects.
```

### Upload fails because of CORS

Check:

```text
[ ] AllowedOrigins includes the browser app origin
[ ] AllowedMethods includes PUT
[ ] AllowedHeaders allows the headers sent by the upload request
[ ] The upload request uses the same Content-Type that was signed
```

The current code signs uploads with:

```text
Content-Type: image/jpeg
```

Use a JPEG upload while testing unless the code is updated to sign dynamic content types.

---

## AWS References

- [Amazon S3 Event Notifications](https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html)
- [Granting permissions to publish event notification messages to a destination](https://docs.aws.amazon.com/AmazonS3/latest/userguide/grant-destinations-permissions-to-s3.html)
- [Elements of an S3 CORS configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ManageCorsUsing.html)
- [Blocking public access to your Amazon S3 storage](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)
