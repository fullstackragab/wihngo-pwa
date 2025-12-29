# Backend Requirements for Bird Creation Feature

## Overview
The frontend now has a "Create Bird" page at `/birds/create` that allows users to add their birds to the platform. This document outlines the backend API requirements.

---

## Required Endpoints

### 1. Upload Bird Image
**Endpoint:** `POST /api/birds/upload-image`

**Purpose:** Upload a bird's profile image and get back an S3 key.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (image file)
- Max size: 5MB
- Accepted types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**Response:**
```json
{
  "s3Key": "birds/images/uuid-filename.jpg",
  "url": "https://cdn.wihngo.com/birds/images/uuid-filename.jpg"
}
```

**Notes:**
- Should resize/optimize images for web (recommended max 1200x1200)
- Generate thumbnail if needed
- Return both S3 key (for storage reference) and public URL

---

### 2. Create Bird (Already Exists - Verify)
**Endpoint:** `POST /api/birds`

**Request Body:**
```json
{
  "name": "string (required, max 50)",
  "species": "string (required, max 100)",
  "description": "string (optional, max 1000)",
  "location": "string (optional, max 100)",
  "age": "string (optional, max 50)",
  "walletAddress": "string (required, Solana address)",
  "imageS3Key": "string (optional, from upload endpoint)",
  "coverImageS3Key": "string (optional)",
  "videoS3Key": "string (optional)"
}
```

**Response:**
```json
{
  "birdId": "uuid",
  "name": "string",
  "species": "string",
  "description": "string",
  "location": "string",
  "age": "string",
  "imageUrl": "https://cdn.wihngo.com/...",
  "ownerWalletAddress": "string",
  "ownerId": "userId",
  "ownerName": "string",
  "lovedBy": 0,
  "supportedBy": 0,
  "totalSupport": 0,
  "canSupport": true,
  "supportEnabled": true,
  "isMemorial": false,
  "tagline": "string"
}
```

**Notes:**
- `ownerId` should be set from the authenticated user
- `tagline` can be auto-generated from description or set to a default
- Validate that `walletAddress` is a valid Solana address

---

## Validation Requirements

### Name
- Required
- 1-50 characters
- No special characters that could cause XSS

### Species
- Required
- 1-100 characters

### Description
- Optional
- Max 1000 characters

### Location
- Optional
- Max 100 characters

### Age
- Optional
- Max 50 characters
- Free text (e.g., "2 years", "6 months", "Unknown")

### Wallet Address
- Required
- Must be a valid Solana public key (base58, 32-44 characters)
- Should validate it's a real address format

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "errors": [
    { "field": "name", "message": "Name is required" },
    { "field": "walletAddress", "message": "Invalid Solana wallet address" }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 413 Payload Too Large (for image upload)
```json
{
  "error": "File too large",
  "message": "Maximum file size is 5MB"
}
```

---

### 3. Mark Bird as Memorial
**Endpoint:** `POST /api/birds/{birdId}/memorial`

**Purpose:** Mark a bird as a memorial (permanent, cannot be undone).

**Request:**
- No body required (empty object `{}`)
- Bird must be owned by the authenticated user
- Bird must not already be a memorial

**Response:**
```json
{
  "birdId": "uuid",
  "name": "string",
  "isMemorial": true,
  "canSupport": false,
  ... // full Bird object
}
```

**Side Effects:**
- Set `isMemorial = true` on the bird
- Set `canSupport = false` on the bird
- Send memorial notification email to all past supporters
- Create memorial record with date

**Error Cases:**
- `403 Forbidden` - User doesn't own this bird
- `400 Bad Request` - Bird is already a memorial
- `404 Not Found` - Bird doesn't exist

---

## Questions for Backend

1. **Image Upload Endpoint:** Does `POST /api/birds/upload-image` exist? If not, what endpoint should the frontend use for bird image uploads?

2. **Tagline Generation:** How is the `tagline` field populated? Is it:
   - Auto-generated from description?
   - A separate field the user should fill?
   - A default value?

3. **Common Name / Scientific Name:** The `CreateBirdDto` includes `commonName` and `scientificName` optional fields. Should these be exposed in the UI, or are they for admin/future use?

4. **Cover Image & Video:** The DTO supports `coverImageS3Key` and `videoS3Key`. Should the create form include these, or are they edit-only features?

5. **Rate Limiting:** Are there any rate limits on bird creation to prevent spam?

---

## Current Frontend Assumptions

The frontend currently assumes:
- Image upload endpoint is `POST /api/birds/upload-image`
- Response format includes `s3Key` and `url`
- Bird creation endpoint is `POST /api/birds` (confirmed exists)
- Authentication is via Bearer token in Authorization header

Please confirm or correct these assumptions.
