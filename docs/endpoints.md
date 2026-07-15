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

---

## 4. Set Active Image

Sets a completed uploaded image as the active profile picture for a user session, updating the active profile picture mapping in the `active` database table.

- **Path:** `/images/active`
- **Method:** `POST`
- **Content-Type:** `application/json`

### Parameters

| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | String | Yes | Unique user identifier. |
| `session_id` | String | Yes | ID of the active user session. |
| `image_id` | String | Yes | ID of the completed image to set as active. |

### Example Request

```bash
curl -X POST http://localhost:9991/images/active \
  -H "Content-Type: application/json" \
  -d '{"user_id": "testuser", "session_id": "0072a13c81e726f485b2f461da0fbaad", "image_id": "test-avatar.jpg"}'
```

### Responses

#### Success (200 OK)
```json
{
  "message": "Image set as active successfully"
}
```

#### Image Pending Upload (400 Bad Request)
```json
{
  "error": "Image upload is pending"
}
```

#### Image Not Found (404 Not Found)
```json
{
  "error": "Image not found"
}
```

---

## 5. Get Active Profile Image

Retrieves the constructed public S3 object URL for a user's active profile picture.

- **Path:** `/images/:user_id`
- **Method:** `GET`
- **Content-Type:** `application/json`

### Parameters

| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | String | Yes | Path parameter identifying the user. |

### Example Request

```bash
curl -X GET http://localhost:9991/images/testuser
```

### Responses

#### Success (200 OK)
```json
{
  "url": "https://onepfp-bkt.s3.ap-south-1.amazonaws.com/testuser/0072a13c81e726f485b2f461da0fbaad/test-avatar.jpg"
}
```

#### Active Image Not Found (404 Not Found)
```json
{
  "error": "Active profile picture not found"
}
```

---

## 6. List User Images

Retrieves all uploaded images (metadata and S3 URLs) for the authenticated user.

- **Path:** `/images`
- **Method:** `GET`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Content-Type:** `application/json`

### Example Request

```bash
curl -X GET http://localhost:9991/images \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Responses

#### Success (200 OK)
```json
[
  {
    "image_id": "test-avatar.jpg",
    "session_id": "0072a13c81e726f485b2f461da0fbaad",
    "status": "completed",
    "url": "https://onepfp-bkt.s3.ap-south-1.amazonaws.com/testuser/0072a13c81e726f485b2f461da0fbaad/test-avatar.jpg"
  }
]
```

#### Unauthorized (401 Unauthorized)
```json
{
  "error": "Unauthorized, token is required"
}
```



