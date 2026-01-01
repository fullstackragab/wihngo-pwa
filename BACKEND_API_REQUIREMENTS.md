# Backend API Requirements for Payment Flow

## Overview

The frontend has implemented a production-grade Phantom → USDC payment flow with:
- Session recovery for interrupted payments
- iOS PWA special handling
- Idempotency to prevent duplicate payments
- User-friendly error mapping
- Retry logic with exponential backoff
- Timeout handling

This document outlines what the frontend expects from the backend API.

**Note:** Backend has two endpoint groups:
- `/support/intents/*` - Bird support flow (used by frontend)
- `/support/transfers/*` - P2P transfer flow (separate feature)

---

## Current Frontend Implementation

### 1. Idempotency Keys

**Frontend generates idempotency keys for intent creation:**

```typescript
// Format: SHA-256 hash of "{userId}|{birdId}|{birdAmount}|{wihngoAmount}|{minuteBucket}"
// Example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
// Length: 32 characters (first 32 chars of SHA-256 hex)
```

**Key characteristics:**
- Same inputs within the same minute = same key
- Cached in localStorage for 1 minute to survive page refreshes
- Cleared after successful payment

**Frontend sends this in `POST /support/intents`:**
```json
{
  "birdId": "uuid",
  "birdAmount": 5.00,
  "wihngoSupportAmount": 1.00,
  "currency": "USDC",
  "idempotencyKey": "a1b2c3d4e5f6g7h8..."  // Optional, 32 chars
}
```

---

## API Endpoints Expected by Frontend

### 1. Preflight Check

**Endpoint:** `POST /support/birds/preflight`

**Request:**
```json
{
  "birdId": "uuid",
  "birdAmount": 5.00,
  "wihngoSupportAmount": 1.00,
  "walletAddress": "SolanaPublicKey..."
}
```

**Expected Response:**
```json
{
  "canSupport": true,
  "message": "OK",
  "bird": {
    "id": "uuid",
    "name": "Bird Name"
  }
}
```

**Error Response (if cannot support):**
```json
{
  "canSupport": false,
  "message": "This bird is not currently accepting support"
}
```

---

### 2. Create Support Intent

**Endpoint:** `POST /support/intents`

**Request:**
```json
{
  "birdId": "uuid",
  "birdAmount": 5.00,
  "wihngoSupportAmount": 1.00,
  "currency": "USDC",
  "idempotencyKey": "a1b2c3d4e5f6g7h8..."  // Optional
}
```

**Expected Response:**
```json
{
  "intentId": "uuid",
  "birdWalletAddress": "SolanaPublicKey...",
  "wihngoWalletAddress": "SolanaPublicKey...",
  "usdcMintAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "serializedTransaction": "base64-encoded-transaction...",
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

**Backend Requirements:**
1. If `idempotencyKey` is provided and matches an existing pending intent, return the existing intent
2. Transaction should be partially signed by backend (fee payer)
3. Transaction should include transfers to both bird and wihngo wallets
4. Intent should expire after reasonable time (e.g., 10 minutes)

---

### 3. Submit Signed Transaction

**Endpoint:** `POST /support/intents/{intentId}/submit`

**Current Request:**
```json
{
  "signedTransaction": "base64-encoded-signed-transaction..."
}
```

**Expected Response:**
```json
{
  "status": "Completed" | "Confirming" | "Processing" | "Failed",
  "solanaSignature": "tx-signature...",
  "message": "Optional message"
}
```

**Backend Requirements:**
1. Validate the signed transaction
2. Submit to Solana
3. Return status and signature
4. Handle duplicate submissions gracefully (return existing result)

---

### 4. Get Intent Status (for recovery)

**Endpoint:** `GET /support/intents/{intentId}`

**Expected Response:**
```json
{
  "intentId": "uuid",
  "status": "pending" | "signed" | "submitted" | "confirmed" | "failed" | "expired",
  "solanaSignature": "tx-signature...",  // If submitted
  "serializedTransaction": "base64...",  // If pending (for resume)
  "supportParams": {
    "birdId": "uuid",
    "birdAmount": 5.00,
    "wihngoAmount": 1.00
  }
}
```

**Frontend uses this for:**
- Session recovery (checking if payment completed while user was away)
- Resuming interrupted payments

---

### 5. Check Wallet Balance (Public)

**Endpoint:** `GET /wallets/{walletAddress}/on-chain-balance`

**Expected Response:**
```json
{
  "solBalance": 0.5,
  "usdcBalance": 100.00
}
```

**Note:** This is a public endpoint (no auth required)

---

## Error Handling

### Expected Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {}  // Optional additional info
}
```

### Error Codes Frontend Handles

| Code | When to Return |
|------|----------------|
| `INSUFFICIENT_BALANCE` | User doesn't have enough USDC |
| `INSUFFICIENT_GAS` | User doesn't have enough SOL for fees |
| `INTENT_EXPIRED` | Intent has expired (timeout) |
| `TX_FAILED` | Transaction failed on Solana |
| `NETWORK_CONGESTION` | Solana network is busy |
| `BLOCKHASH_EXPIRED` | Transaction blockhash expired |
| `INVALID_TRANSACTION` | Transaction validation failed |

---

## Proposed API Change: Submit Idempotency

Based on your requirement for idempotency on submit, here's what frontend can implement:

**New Submit Request:**
```json
{
  "signedTransaction": "base64...",
  "idempotencyKey": "{intentId}-{attemptNumber}-{timestamp}"
}
```

**Example:**
```json
{
  "signedTransaction": "base64...",
  "idempotencyKey": "abc123-1-1705312345678"
}
```

**Frontend will:**
1. Generate key as `{intentId}-{attemptNumber}-{timestamp}`
2. Track attempt number in localStorage per intentId
3. Increment attempt number on each retry

**Backend should:**
1. Store the idempotency key with the submission
2. If same key submitted again, return the previous result (don't resubmit)
3. Key should be valid for reasonable time (e.g., 5 minutes)

---

## Questions for Backend

1. **Submit Idempotency:**
   - Do you want `paymentId` as a separate field, or is the `{intentId}` in the URL sufficient?
   - Should `idempotencyKey` be required or optional?

2. **Intent Status Values:**
   - Can you confirm the exact status values returned by `GET /support/intents/{intentId}`?
   - Frontend expects: `pending`, `signed`, `submitted`, `confirmed`, `failed`, `expired`

3. **Error Response Format:**
   - Is the current error format `{ error, message, details }` correct?
   - Should we use HTTP status codes or always 200 with error in body?

4. **Idempotency Key Format:**
   - Is SHA-256 hash (32 chars) acceptable for intent creation?
   - Is `{intentId}-{attemptNumber}-{timestamp}` acceptable for submit?

---

## Frontend Files Changed

| File | Purpose |
|------|---------|
| `src/lib/idempotency.ts` | Idempotency key generation & caching |
| `src/lib/retry.ts` | Retry utility with exponential backoff |
| `src/services/support.service.ts` | API calls with idempotency & retry |
| `src/services/session-recovery.service.ts` | Session recovery logic |
| `src/services/error-mapping.service.ts` | Error code to message mapping |
| `src/hooks/use-phantom.ts` | Wallet connection with timeout |
| `src/components/payment/PaymentError.tsx` | Error display component |
| `src/components/payment/PaymentProgress.tsx` | Progress indicator |
| `src/components/payment/SubmissionTimeout.tsx` | Timeout warning UI |
| `src/components/payment/RecoveryModal.tsx` | Session recovery modal |
| `src/components/phantom/IOSPWAWaiting.tsx` | iOS PWA waiting screen |

---

## Testing Scenarios

### Happy Path
- Desktop Chrome → Full payment flow
- Mobile Safari → Deep link flow
- iOS PWA → Manual return flow

### Error Recovery
- User rejects wallet connection → Retry button works
- User rejects transaction → Retry button works
- Network error during preflight → Auto-retry (3 attempts)
- Network error during intent creation → Auto-retry (3 attempts)
- Intent expires → "Start Over" button works

### Idempotency
- Double-click submit button → Same intent returned
- Page refresh during payment → Session recovery works
- Retry after error → Same intent used (within 1 minute)

---

## Next Steps

1. **Backend:** Confirm API contracts above are correct
2. **Backend:** Implement idempotency key handling for intent creation
3. **Backend:** Confirm if submit idempotency is needed (and format)
4. **Frontend:** Update submit call if new format required
5. **Both:** End-to-end testing on staging
