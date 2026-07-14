# API Endpoints Guide

This document describes the API endpoints provided by the `onepfp` backend service.

---

## 1. User Registration (Signup)

Creates a new user record in the system with hashed credentials.

- **Path:** `/users/signup` (Accepts `PUT /users/singup` as a fallback)
- **Method:** `POST`
- **Content-Type:** `application/json`

### Parameters

| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | String | Yes | Unique ID identifying the user. |
| `password` | String | Yes | Password to be hashed and stored. |

### Example Request

```bash
curl -X POST http://localhost:9991/users/signup \
  -H "Content-Type: application/json" \
  -d '{"user_id": "testuser", "password": "mypassword"}'
```

### Responses

#### Success (201 Created)
```json
{
  "message": "User created successfully"
}
```

#### Duplicate User (409 Conflict)
```json
{
  "error": "User already exists"
}
```

#### Bad Request (400 Bad Request)
```json
{
  "error": "user_id and password are required"
}
```

---

## 2. User Authentication (Login)

Authenticates the user and returns a JWT token tied to a generated user session.

- **Path:** `/users/login`
- **Method:** `POST`
- **Content-Type:** `application/json`

### Parameters

| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | String | Yes | The user ID to authenticate. |
| `password` | String | Yes | The user password. |

### Example Request

```bash
curl -X POST http://localhost:9991/users/login \
  -H "Content-Type: application/json" \
  -d '{"user_id": "testuser", "password": "mypassword"}'
```

### Responses

#### Success (200 OK)
```json
{
  "message": "Login successful",
  "user_id": "testuser",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Invalid Credentials (401 Unauthorized)
```json
{
  "error": "Invalid credentials"
}
```

---

## 3. Generate S3 Presigned URL

Requests a secure S3 upload URL. Calling this registers a `pending` image state in the database.

- **Path:** `/images/upload`
- **Method:** `POST`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Content-Type:** `application/json`

### Parameters

| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `image_id` | String | Yes | Desired filename or suffix for the image upload (e.g., `avatar.jpg`). |

### Example Request

```bash
curl -X POST http://localhost:9991/images/upload \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"image_id": "avatar.jpg"}'
```

### Responses

#### Success (200 OK)
```json
{
  "presignedUrl": "https://onepfp-bkt.s3.ap-south-1.amazonaws.com/testuser/session_id/avatar.jpg?AWSAccessKeyId=..."
}
```

#### Unauthorized (401 Unauthorized)
```json
{
  "error": "Unauthorized"
}
```

#### Bad Request (400 Bad Request)
```json
{
  "error": "Not all fields required for constructing the S3Key available, missing image_id"
}
```
