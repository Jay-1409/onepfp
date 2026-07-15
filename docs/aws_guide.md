# S3 to SQS Event Notification Setup Guide

This guide explains how to connect an **Amazon S3 bucket** to an **Amazon SQS queue** so that whenever a file is uploaded to S3, S3 sends an event message to SQS.

This is useful for systems like image upload pipelines, background workers, processing queues, and async database updates.

---

## Architecture

```text
Client uploads file
        ↓
Amazon S3 bucket
        ↓
S3 ObjectCreated event
        ↓
Amazon SQS queue
        ↓
Worker service
        ↓
Database / processing logic
```

Example use case:

```text
User uploads profile picture → S3 sends event → SQS stores message → Worker updates DB
```

---

## 1. Create an SQS Queue

Go to:

```text
AWS Console → SQS → Create queue
```

Choose:

```text
Queue type: Standard
Name: onepfp
```

> Direct S3 event notifications work with **Standard SQS queues**.  
> Do not use a FIFO queue like `onepfp.fifo` unless you are using EventBridge in between.

Recommended basic settings:

```text
Visibility timeout: 60 seconds
Message retention period: 4 days
Receive message wait time: 20 seconds
Maximum message size: 256 KB
Delivery delay: 0 seconds
```

For a worker-based system, long polling is recommended:

```text
Receive message wait time: 20 seconds
```

---

## 2. Get the SQS Queue ARN

Open your queue:

```text
SQS → your queue → Details
```

Copy the ARN.

Example:

```text
arn:aws:sqs:ap-south-1:213180001668:onepfp
```

You will need this ARN in the SQS access policy.

---

## 3. Add SQS Access Policy for S3

S3 needs permission to send messages into your SQS queue.

Go to:

```text
SQS → your queue → Access policy → Edit
```

Use this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ToSendMessage",
      "Effect": "Allow",
      "Principal": {
        "Service": "s3.amazonaws.com"
      },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:ap-south-1:213180001668:onepfp",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "213180001668"
        },
        "ArnLike": {
          "aws:SourceArn": "arn:aws:s3:::onepfp-bkt"
        }
      }
    }
  ]
}
```

Replace these values:

```text
213180001668        → your AWS account ID
ap-south-1          → your AWS region
onepfp              → your SQS queue name
onepfp-bkt          → your S3 bucket name
```

Important:

```text
Resource must be the SQS queue ARN, not the SQS URL.
```

Correct:

```text
arn:aws:sqs:ap-south-1:213180001668:onepfp
```

Wrong:

```text
https://sqs.ap-south-1.amazonaws.com/213180001668/onepfp
```

---

## 4. Create an S3 Bucket

Go to:

```text
AWS Console → S3 → Create bucket
```

Example bucket name:

```text
onepfp-bkt
```

Make sure the S3 bucket and SQS queue are in the **same AWS region**.

Example:

```text
S3 bucket region: ap-south-1
SQS queue region: ap-south-1
```

### Enable Public Read Access & CORS Configurations

To allow profile pictures to be uploaded directly from the browser (CORS) and publicly readable via their S3 key URLs:

1. **Disable "Block public access":**
   - In S3, select your bucket.
   - Go to the **Permissions** tab.
   - Under **Block public access (bucket settings)**, click **Edit**.
   - **Uncheck all blocks** (turn off Block all public access and all individual block public access settings):
     - [ ] **Block all public access**
     - [ ] **Block public access to buckets and objects granted through new access control lists (ACLs)**
     - [ ] **Block public access to buckets and objects granted through any access control lists (ACLs)**
     - [ ] **Block public access to buckets and objects granted through new public bucket or access point policies**
     - [ ] **Block public and cross-account access to buckets and objects through any public bucket or access point policies**
   - Click **Save changes**.

2. **Add a Bucket Policy:**
   - Scroll down to **Bucket policy** and click **Edit**.
   - Paste the following policy:
     ```json
     {
         "Version": "2012-10-17",
         "Statement": [
             {
                 "Sid": "PublicReadGetObject",
                 "Effect": "Allow",
                 "Principal": "*",
                 "Action": "s3:GetObject",
                 "Resource": "arn:aws:s3:::onepfp-bkt/*"
             }
         ]
     }
     ```
     *(Note: Replace `onepfp-bkt` with your actual bucket name.)*
   - Click **Save changes**.

3. **Configure CORS (Cross-Origin Resource Sharing):**
   - Scroll to the bottom of the **Permissions** tab to the **Cross-origin resource sharing (CORS)** section and click **Edit**.
   - Paste the following JSON rules array to allow PUT/POST file uploads from client applications:
     ```json
     [
         {
             "AllowedHeaders": [
                 "*"
             ],
             "AllowedMethods": [
                 "GET",
                 "PUT",
                 "POST",
                 "HEAD"
             ],
             "AllowedOrigins": [
                 "*"
             ],
             "ExposeHeaders": [],
             "MaxAgeSeconds": 3000
         }
     ]
     ```
   - Click **Save changes**.

---

## 5. Add S3 Event Notification

Go to:

```text
S3 → your bucket → Properties → Event notifications → Create event notification
```

Use these values:

```text
Event name: image-uploaded-to-sqs
Prefix: images/
Suffix: optional
Event types: All object create events
Destination: SQS queue
SQS queue: onepfp
```

For an image-upload project, this is usually enough:

```text
Event type: s3:ObjectCreated:*
Prefix: images/
Destination: SQS queue
```

The prefix means only objects uploaded under this path will trigger the event:

```text
images/
```

Example object key:

```text
images/user123/image456.png
```

---

## 6. Test the Connection

Upload a file to the bucket under the configured prefix.

Example:

```text
images/test-user/test-image.png
```

Then go to:

```text
SQS → your queue → Send and receive messages → Poll for messages
```

You should receive a message with a body similar to this:

```json
{
  "Records": [
    {
      "eventName": "ObjectCreated:Put",
      "s3": {
        "bucket": {
          "name": "onepfp-bkt"
        },
        "object": {
          "key": "images/test-user/test-image.png",
          "size": 12345
        }
      }
    }
  ]
}
```

---

## 7. Worker Flow

Your backend worker should:

```text
1. Poll SQS.
2. Parse the message body.
3. Extract bucket name and object key.
4. Update the database or start processing.
5. Delete the SQS message only after successful processing.
```

Do not delete the message before your database update succeeds.

If the worker crashes before deleting the message, SQS will make it visible again after the visibility timeout.

---

## 8. Example Node.js Worker

Install AWS SDK:

```bash
npm install @aws-sdk/client-sqs
```

Example worker:

```js
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: "ap-south-1" });

const QUEUE_URL = process.env.SQS_QUEUE_URL;

async function pollQueue() {
  while (true) {
    const response = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 60,
      })
    );

    const messages = response.Messages ?? [];

    for (const message of messages) {
      try {
        const body = JSON.parse(message.Body);

        for (const record of body.Records ?? []) {
          const bucket = record.s3.bucket.name;

          const key = decodeURIComponent(
            record.s3.object.key.replace(/\+/g, " ")
          );

          console.log("New S3 upload:", {
            bucket,
            key,
          });

          // Example:
          // key = images/user123/image456.png
          //
          // TODO:
          // 1. Extract user_id / image_id from key
          // 2. Update database row
          // 3. Trigger image processing if needed
        }

        await sqs.send(
          new DeleteMessageCommand({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
          })
        );
      } catch (error) {
        console.error("Failed to process SQS message:", error);

        // Do not delete the message here.
        // It will become visible again after the visibility timeout.
      }
    }
  }
}

pollQueue().catch(console.error);
```

Example `.env`:

```env
SQS_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/213180001668/onepfp
AWS_REGION=ap-south-1
```

---

## 9. Recommended S3 Object Key Format

For an image upload system:

```text
images/{user_id}/{image_id}.{extension}
```

Example:

```text
images/user_123/img_456.png
```

This makes worker-side parsing easy:

```text
images/user_123/img_456.png
       ↓
user_id = user_123
image_id = img_456
```

---

## 10. Common Error: Unable to Validate Destination

Error:

```text
Unable to validate the following destination configurations
```

This usually means S3 could not validate the SQS queue as a destination.

Check these:

### Queue ARN typo

Make sure the SQS policy `Resource` matches the actual queue ARN.

Example mistake:

```text
onpfp
```

Instead of:

```text
onepfp
```

### Bucket ARN typo

Make sure this matches the exact bucket name:

```json
"aws:SourceArn": "arn:aws:s3:::onepfp-bkt"
```

### Region mismatch

Both S3 and SQS should be in the same region.

```text
S3: ap-south-1
SQS: ap-south-1
```

### FIFO queue

Direct S3 event notifications do not work with FIFO queues.

Use a Standard queue.

### KMS encryption issue

If the SQS queue uses a customer-managed KMS key, S3 may fail validation unless the KMS key policy allows S3 to use it.

For initial setup, prefer:

```text
SQS-managed encryption
```

or disable custom KMS encryption while testing.

---

## 11. Final Checklist

Before saving the S3 event notification:

```text
[ ] SQS queue is Standard, not FIFO
[ ] S3 bucket and SQS queue are in the same region
[ ] SQS access policy allows s3.amazonaws.com
[ ] Resource is the exact SQS queue ARN
[ ] aws:SourceArn is the exact S3 bucket ARN
[ ] aws:SourceAccount is the correct AWS account ID
[ ] SQS encryption is not blocking S3
[ ] S3 event prefix matches uploaded object keys
```

---

## 12. Final Flow for OnePFP / OnePic

```text
Client uploads image to S3 using presigned URL
        ↓
S3 stores object under images/{user_id}/{image_id}.png
        ↓
S3 sends ObjectCreated event to SQS
        ↓
Worker polls SQS
        ↓
Worker extracts bucket and key
        ↓
Worker updates SQL database
        ↓
Worker deletes SQS message
```

This keeps upload handling async and fault-tolerant.