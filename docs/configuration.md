# Configuration & Setup Guide

This guide explains the environment variables used by the `onepfp` API server and SQS worker.

---

## Environment Variables (.env)

Create a `.env` file in the project root. Both `server.cjs` and `worker/worker.js` load this file.

### Server Config

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `9991` | The port the Express application server listens on. |
| `JWT_SECRET` | *(Required)* | Secret key used to sign and verify JSON Web Tokens (JWT) for authentication. |
| `CDN_URL` | *(Optional)* | Custom CDN origin, such as CloudFront, used by `GET /images/:user_id` instead of a direct S3 object URL. Do not include a trailing slash. |

### Oracle Database Config

| Variable | Default | Description |
| :--- | :--- | :--- |
| `ORACLE_USERNAME` | `onepfp` | Username to connect to the Oracle Database. |
| `ORACLE_PASSWORD` | `onepfp` | Password for the Oracle Database user. |
| `CONNECTION_STRING` | `localhost:1521/XEPDB1` | Easy Connect connection string to connect to the database instance. |

### AWS Storage & Queue Config

| Variable | Default | Description |
| :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | *(Required unless another AWS SDK credential provider is configured)* | AWS access key for an IAM identity with the S3/SQS permissions needed by this app. |
| `AWS_SECRET_ACCESS_KEY` | *(Required unless another AWS SDK credential provider is configured)* | AWS secret access key for the same IAM identity. |
| `AWS_REGION` | `ap-south-1` | AWS region where your S3 bucket and SQS queue reside. |
| `S3_BUCKET` | `onepfp-bkt` | The name of the S3 bucket where avatars are stored. |
| `AWS_S3_UPLOAD_WINDOW_SECONDS` | `300` | Expiration time (in seconds) for S3 presigned upload URLs. |
| `SQS_QUEUE_URL` | *(Required)* | The URL of your SQS queue that receives S3 event notifications. |

### Object Key Format

The API signs uploads with this S3 key format:

```text
{user_id}/{session_id}/{image_id}
```

Example:

```text
testuser/0072a13c81e726f485b2f461da0fbaad/avatar.jpg
```

Use an S3 event notification prefix only if it matches the first part of this key. For the current app, leaving the prefix empty is the simplest setup.

---

## Detailed Local Setup

### 1. Database Schema Initialization
Make sure your database schema is initialized. You can find the SQL table structures under:
- [users.sql](../db/schema/users.sql)
- [sessions.sql](../db/schema/sessions.sql)
- [images.sql](../db/schema/images.sql)
- [active.sql](../db/schema/active.sql)

### 2. AWS Setup
Ensure that your S3 bucket is configured to send `ObjectCreated` events to your SQS queue. For the full setup sequence and policies, refer to the [AWS Event Setup Guide](./aws_guide.md).
