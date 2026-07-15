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
- **Fast and Efficient Uploads:** Upload your images quickly and directly without lagging the main application servers.
- **Seamless Integration:** Display your profile picture directly in any application using a simple, unified link.

## Features

- **Instant Multi-Platform Avatar Synchronization:** Enables users to upload profile pictures and have their active avatars updated automatically across all connected locations.

## Quick Start Guide

To get the application up and running locally, please follow the detailed steps in the [Quick Start Guide](./docs/quickstart.md) (covers database schema scripts, server startup, background queue workers, and Bruno tests).

---

## Documentation Links

- [Quick Start Guide](./docs/quickstart.md)
- [System Architecture Guide](./docs/architecture.md)
- [API Endpoints Guide](./docs/endpoints.md)
- [Configuration & Setup Guide](./docs/configuration.md)
- [AWS S3 and SQS Event Notification Setup Guide](./docs/aws_guide.md)

## License

Distributed under the ISC License. See `package.json` for details.
