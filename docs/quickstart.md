# Quick Start Guide

This guide walkthroughs the complete step-by-step setup required to run both the `onepfp` API server and SQS background worker locally.

---

## Prerequisites

Ensure you have the following installed and configured:
- **Node.js** (v20.12 or higher)
- **Oracle Database 21c XE**
- **AWS Services** (An S3 bucket and an SQS Standard Queue with S3 ObjectCreated event notifications configured)

---

## Setup Steps

### 1. Database Table Initialization
Log into your Oracle Database instance and execute the table schema definition scripts in order:
1. Run [users.sql](../db/schema/users.sql)
2. Run [sessions.sql](../db/schema/sessions.sql)
3. Run [images.sql](../db/schema/images.sql)
4. Run [active.sql](../db/schema/active.sql)

### 2. Configure Environment Variables
Create a `.env` file in the project root directory using the following template (for variable descriptions, refer to the [Configuration Guide](./configuration.md)):
```env
PORT=9991
JWT_SECRET=your_jwt_secret

ORACLE_USERNAME=onepfp
ORACLE_PASSWORD=onepfp
CONNECTION_STRING=localhost:1521/XEPDB1

S3_BUCKET=onepfp-bkt
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
SQS_QUEUE_URL=your_sqs_queue_url
```

### 3. Install Dependencies
Navigate to the root directory and install npm packages:
```bash
npm install
```

### 4. Run the API Server
Start the Express server:
```bash
node server.cjs
```

### 5. Run the Background Worker
In a new terminal window, start the SQS worker:
```bash
npm run worker
```

---

## Verifying and Testing the Flow

The project provides a pre-configured [Bruno](https://www.usebruno.com/) API collection in the `bruno/` directory:

1. **Register a User:** Send the **Signup** request to create a credentials record.
2. **Authenticate:** Send the **Login** request. This creates a session in Oracle DB and returns a JWT token.
3. **Get Upload Link:** Send the **Get Presigned URL** request. This generates an S3 upload link and registers a `pending` image state in your database.
4. **Upload Image File:** Open the **Upload Image** request, choose a local image in the **Body -> File** tab, and send. The image is uploaded directly to S3.
5. **Background Event Sync:** The S3 upload triggers an S3 notification -> SQS message. The polling background worker picks up the message, connects to Oracle DB, and sets the image status to `completed`.
6. **Set Profile Picture:** Send the **Set Active Image** request to mark the completed upload as the active image.
7. **Verify Retrieval:** Send the **Get Active Image** request or embed the endpoint directly in a browser tag:
   ```html
   <img src="http://localhost:9991/images/testuser" />
   ```
   This will return an HTTP `302 Redirect` to render the active profile picture directly.
