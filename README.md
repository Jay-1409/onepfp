# onepfp

*A unified profile picture service that keeps your avatar synchronized everywhere.*

![Node.js Version](https://img.shields.io/badge/node.js-%3E%3D20.12-green.svg)
![Framework](https://img.shields.io/badge/framework-Express-black.svg)
![Database](https://img.shields.io/badge/database-Oracle_21_XE-red.svg)
![Storage](https://img.shields.io/badge/storage-AWS_S3-blueviolet.svg)
![Queue](https://img.shields.io/badge/queue-AWS_SQS-orange.svg)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

## What it does

- **Single Source of Truth:** Set and update your profile picture once, ensuring a consistent look across all of your active locations.
- **Fast and Efficient Uploads:** Upload your images quickly and directly without lagging the main application servers.
- **Seamless Integration:** Display your profile picture directly in any application using a simple, unified link.

## How it works

```text
Client
  -> Express API issues a JWT and presigned S3 upload URL
  -> Client uploads the image directly to S3
  -> S3 sends an ObjectCreated event to SQS
  -> Worker consumes the SQS event and marks the image completed
  -> API redirects /images/:user_id to the active S3 or CDN URL
```
> Note: Currently CDN support is not availiable.

The S3 object key used by the app is:

```text
{user_id}/{session_id}/{image_id}
```
> This key helps us uniquely identify a image in the bucket 

Keep AWS event notification prefixes aligned with that key format.

## Quick Start Guide

Start with the [Quick Start Guide](./docs/quickstart.md). It walks through the expected setup order:

1. Create the Oracle schema.
2. Create the S3 bucket.
3. Create the SQS queue.
4. Add the SQS destination policy for S3.
5. Add the S3 event notification.
6. Configure `.env`.
7. Run the API server and worker.

---

## Documentation Links

- [Quick Start Guide](./docs/quickstart.md)
- [Configuration & Setup Guide](./docs/configuration.md)
- [AWS S3 and SQS Event Notification Setup Guide](./docs/aws_guide.md)
- [API Endpoints Guide](./docs/endpoints.md)
- [System Architecture Guide](./docs/architecture.md)

## License

Distributed under the ISC License. See `package.json` for details.
