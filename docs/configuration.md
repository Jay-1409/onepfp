# Configuration & Setup Guide

This guide explains how to configure and run the `onepfp` application, including all required environment variables and service setups.

---

## Environment Variables (.env)

Create a `.env` file in the project root. Below is a detailed description of all supported environment variables.

### Server Config

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `9991` | The port the Express application server listens on. |
| `JWT_SECRET` | *(Required)* | Secret key used to sign and verify JSON Web Tokens (JWT) for authentication. |

### Oracle Database Config

| Variable | Default | Description |
| :--- | :--- | :--- |
| `ORACLE_USERNAME` | `onepfp` | Username to connect to the Oracle Database. |
| `ORACLE_PASSWORD` | `onepfp` | Password for the Oracle Database user. |
| `CONNECTION_STRING` | `localhost:1521/XEPDB1` | Easy Connect connection string to connect to the database instance. |

### AWS Storage & Queue Config

| Variable | Default | Description |
| :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | *(Required)* | AWS Access Key ID for IAM user with access to S3 and SQS. |
| `AWS_SECRET_ACCESS_KEY` | *(Required)* | AWS Secret Access Key for the IAM user. |
| `AWS_REGION` | `ap-south-1` | AWS region where your S3 bucket and SQS queue reside. |
| `S3_BUCKET` | `onepfp-bkt` | The name of the S3 bucket where avatars are stored. |
| `AWS_S3_UPLOAD_WINDOW_SECONDS` | `300` | Expiration time (in seconds) for S3 presigned upload URLs. |
| `SQS_QUEUE_URL` | *(Required)* | The URL of your SQS queue that receives S3 event notifications. |

---

## Detailed Local Setup

### 1. Database Schema Initialization
Make sure your database schema is initialized. You can find the SQL table structures under:
- [users.sql](file:///Users/jay/Desktop/Personal%20Projects/onepfp/db/schema/users.sql)
- [sessions.sql](file:///Users/jay/Desktop/Personal%20Projects/onepfp/db/schema/sessions.sql)
- [images.sql](file:///Users/jay/Desktop/Personal%20Projects/onepfp/db/schema/images.sql)

### 2. AWS Setup
Ensure that your S3 bucket is configured to send `ObjectCreated` events to your SQS queue. For a step-by-step setup walkthrough, refer to the [AWS Event Setup Guide](file:///Users/jay/Desktop/Personal%20Projects/onepfp/docs/aws_guide.md).
