# onepfp

*A unified profile picture service that keeps your avatar synchronized everywhere.*

![Node.js Version](https://img.shields.io/badge/node.js-%3E%3D20.12-green.svg)
![Framework](https://img.shields.io/badge/framework-Express-black.svg)
![Database](https://img.shields.io/badge/database-Oracle_21_XE-red.svg)
![Storage](https://img.shields.io/badge/storage-AWS_S3-blueviolet.svg)
![Queue](https://img.shields.io/badge/queue-AWS_SQS-orange.svg)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

## What's in there for you

- **Single Source of Truth:** Set and update your profile picture once, ensuring a consistent look across all of your active locations.
- **Blazing Fast Uploads:** Securely upload files directly to cloud storage without sending heavy traffic through application servers.
- **Always Up to Date:** Real-time background sync updates your image processing status instantly.

## Features

- **Direct-to-S3 Presigned Uploads & Automatic Sync:** Generates secure presigned S3 URLs allowing direct uploads to S3, which automatically trigger status synchronization across your user sessions.

## Quick Start Guide

### 1. Setup Environment
Create a `.env` file in the root directory. For detailed configuration variables, see the [Configuration & Setup Guide](file:///Users/jay/Desktop/Personal%20Projects/onepfp/docs/configuration.md).

### 2. Run the App
```bash
# Install dependencies
npm install

# Start the API server
node server.cjs

# Start the background worker
npm run worker
```

### 3. Test the APIs
Run the [Bruno](https://www.usebruno.com/) collection inside the `bruno/` directory:
- **Signup / Login:** Authenticate and retrieve your JWT token.
- **Get Presigned URL / Upload Image:** Obtain an upload URL and upload the image file.

---

## Documentation Links

- [System Architecture Guide](file:///Users/jay/Desktop/Personal%20Projects/onepfp/docs/architecture.md)
- [API Endpoints Guide](file:///Users/jay/Desktop/Personal%20Projects/onepfp/docs/endpoints.md)
- [Configuration & Setup Guide](file:///Users/jay/Desktop/Personal%20Projects/onepfp/docs/configuration.md)
- [AWS S3 and SQS Event Notification Setup Guide](file:///Users/jay/Desktop/Personal%20Projects/onepfp/docs/aws_guide.md)

## License

Distributed under the ISC License. See `package.json` for details.
