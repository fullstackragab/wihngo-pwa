# Backend Payment API - Current vs Required

This document compares what the frontend expects vs what the backend currently provides.

---

## Summary

| Required Endpoint | Backend Status | Notes |
|------------------|----------------|-------|
| `POST /api/payments/intent` | ⚠️ Different | Backend uses `/intents` for bird support |
| `POST /api/payments/confirm` | ❌ Missing | Backend uses `/intents/{id}/submit` |
| `GET /api/wallets/{address}/on-chain-balance` | ✅ Added | Public endpoint for on-chain balances |
| `GET /api/payments/intents/{id}` | ✅ Exists | Works as expected |
| `GET /api/payments` | ✅ Exists | Paginated history |
| Wallet linking | ✅ Exists | All endpoints present |

---

## 1. Create Payment Intent

### Frontend Expects:
```
POST /api/payments/intent
{
  "type": "BIRD_SUPPORT",
  "birdId": "uuid",
  "birdAmount": 5.00,
  "wihngoAmount": 0.25
}
```

### Backend Has:
```
POST /api/payments/intents
{
  "birdId": "uuid",
  "birdAmount": 5.00,
  "wihngoSupportAmount": 0.25,
  "currency": "USDC"
}
```

### Response Mapping:
| Frontend Expects | Backend Returns | Notes |
|-----------------|-----------------|-------|
| `intentId` | `intentId` | ✅ Same |
| `birdWallet` | `birdWalletAddress` | ⚠️ Rename |
| `wihngoWallet` | `wihngoWalletAddress` | ⚠️ Rename |
| `usdcMint` | `usdcMintAddress` | ⚠️ Rename |
| `expiresAt` | `expiresAt` | ✅ Same |

### Frontend Service Update:
```typescript
// services/payment.service.ts

export async function createPaymentIntent(params: {
  birdId: string;
  birdAmount: number;
  wihngoAmount: number;
}) {
  const response = await api.post('/payments/intents', {
    birdId: params.birdId,
    birdAmount: params.birdAmount,
    wihngoSupportAmount: params.wihngoAmount,
    currency: 'USDC'
  });

  // Map response to expected format
  return {
    intentId: response.data.intentId,
    birdWallet: response.data.birdWalletAddress,
    wihngoWallet: response.data.wihngoWalletAddress,
    usdcMint: response.data.usdcMintAddress,
    expiresAt: response.data.expiresAt,
    serializedTransaction: response.data.serializedTransaction
  };
}
```

---

## 2. Submit Signed Transaction

### Frontend Expects:
```
POST /api/payments/confirm
{
  "intentId": "uuid",
  "transactions": [
    { "type": "BIRD", "signature": "..." },
    { "type": "WIHNGO", "signature": "..." }
  ]
}
```

### Backend Has:
```
POST /api/payments/intents/{intentId}/submit
{
  "signedTransaction": "base64-encoded-signed-tx"
}
```

### Key Difference:
- Frontend sends multiple transaction signatures after on-chain submission
- Backend expects single signed transaction BEFORE on-chain submission
- **Backend builds the transaction, frontend signs it, backend submits it**

### Frontend Service Update:
```typescript
// The flow is different - backend submits to chain, not frontend

export async function submitPayment(intentId: string, signedTransaction: string) {
  const response = await api.post(`/payments/intents/${intentId}/submit`, {
    signedTransaction
  });

  return {
    success: response.data.status !== 'Failed',
    signature: response.data.solanaSignature,
    status: response.data.status
  };
}
```

---

## 3. Check Wallet Balance (Public)

### Frontend Expects:
```
GET /api/wallets/{walletAddress}/balance
(No auth required)
```

### Backend Has:
```
GET /api/wallets/{walletAddress}/on-chain-balance
(No auth required - ✅ IMPLEMENTED)
```

### Response:
```json
{
  "walletAddress": "...",
  "solBalance": 0.05,
  "usdcBalance": 10.00,
  "minimumSolRequired": 0.005
}
```

### Frontend Service:
```typescript
export async function getWalletBalance(walletAddress: string) {
  const response = await api.get(`/wallets/${walletAddress}/on-chain-balance`);
  return response.data;
}
```

---

## 4. Get Payment Status

### Frontend Expects:
```
GET /api/payments/intents/{intentId}
```

### Backend Has:
```
GET /api/payments/intents/{intentId}
```

**✅ Works as expected**

### Response:
```json
{
  "intentId": "uuid",
  "birdId": "uuid",
  "birdName": "Mango",
  "recipientUserId": "uuid",
  "recipientName": "Owner Name",
  "birdWalletAddress": "...",
  "wihngoWalletAddress": "...",
  "birdAmount": 5.00,
  "wihngoSupportAmount": 0.25,
  "totalAmount": 5.25,
  "currency": "USDC",
  "status": "Completed",
  "serializedTransaction": "...",
  "expiresAt": "...",
  "createdAt": "..."
}
```

---

## 5. Payment History

### Frontend Expects:
```
GET /api/payments?page=1&pageSize=20
```

### Backend Has:
```
GET /api/payments?page=1&pageSize=20           // P2P payments
GET /api/payments/support-history?page=1&pageSize=20  // Bird support
```

### Frontend Service:
```typescript
// Get all payment types
export async function getPaymentHistory(page = 1, pageSize = 20) {
  const response = await api.get('/payments', { params: { page, pageSize } });
  return response.data;
}

// Get bird support history specifically
export async function getSupportHistory(page = 1, pageSize = 20) {
  const response = await api.get('/payments/support-history', { params: { page, pageSize } });
  return response.data;
}
```

---

## 6. Wallet Linking

### All endpoints exist and match:

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/wallets/link` | POST | ✅ Required |
| `/api/wallets` | GET | ✅ Required |
| `/api/wallets/{walletId}` | DELETE | ✅ Required |
| `/api/wallets/{walletId}/primary` | POST | ✅ Required |

### Link Wallet Request:
```json
{
  "publicKey": "solana-pubkey",
  "signature": "signed-message-signature",
  "message": "Link wallet to Wihngo: {timestamp}"
}
```

---

## Payment Flow Summary

### Current Backend Flow:

```
1. POST /payments/support/preflight
   → Check if user can support (balance, wallet, etc.)

2. POST /payments/intents
   → Create intent, get unsigned transaction

3. User signs transaction in Phantom wallet

4. POST /payments/intents/{id}/submit
   → Backend submits signed tx to Solana

5. Background job monitors confirmation

6. GET /payments/intents/{id}
   → Poll for status updates
```

### Frontend Implementation:
```typescript
async function supportBird(birdId: string, amount: number, wihngoTip: number) {
  // 1. Preflight check
  const preflight = await api.post('/payments/support/preflight', {
    birdId,
    birdAmount: amount,
    wihngoSupportAmount: wihngoTip
  });

  if (!preflight.data.canSupport) {
    throw new Error(preflight.data.message);
  }

  // 2. Create intent
  const intent = await api.post('/payments/intents', {
    birdId,
    birdAmount: amount,
    wihngoSupportAmount: wihngoTip,
    currency: 'USDC'
  });

  // 3. Sign with Phantom
  const signedTx = await phantom.signTransaction(
    intent.data.serializedTransaction
  );

  // 4. Submit
  const result = await api.post(`/payments/intents/${intent.data.intentId}/submit`, {
    signedTransaction: signedTx
  });

  // 5. Poll for confirmation
  return pollForCompletion(intent.data.intentId);
}
```

---

## Configuration Values

Already available in preflight response:

```json
{
  "usdcMintAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "wihngoWalletAddress": "...",
  "solRequired": 0.001
}
```

---

## Action Items

### Backend:
- [x] Add `GET /api/wallets/{address}/on-chain-balance` (public, no auth) ✅ DONE

### Frontend (use existing endpoints):
- [ ] Use `POST /payments/intents` (not `/intent`)
- [ ] Use `POST /payments/intents/{id}/submit` (not `/confirm`)
- [ ] Map response field names (`birdWalletAddress` → `birdWallet`)
- [ ] Handle the backend-submits-transaction flow
- [ ] Use `GET /wallets/{address}/on-chain-balance` for balance checks

---

## Types

```typescript
// types/payment.ts

interface PaymentIntent {
  intentId: string;
  birdId: string;
  birdName: string;
  recipientUserId: string;
  recipientName: string;
  birdWalletAddress: string;
  wihngoWalletAddress: string | null;
  birdAmount: number;
  wihngoSupportAmount: number;
  totalAmount: number;
  currency: string;
  usdcMintAddress: string;
  status: PaymentStatus;
  serializedTransaction: string;
  expiresAt: string;
  createdAt: string;
}

type PaymentStatus =
  | 'Pending'
  | 'AwaitingPayment'
  | 'Processing'
  | 'Confirming'
  | 'Completed'
  | 'Failed'
  | 'Expired'
  | 'Cancelled';

interface PreflightResponse {
  canSupport: boolean;
  hasWallet: boolean;
  usdcBalance: number;
  solBalance: number;
  birdAmount: number;
  wihngoSupportAmount: number;
  totalUsdcRequired: number;
  solRequired: number;
  errorCode?: string;
  message?: string;
  bird: { birdId: string; name: string; imageUrl?: string };
  recipient: { userId: string; name: string; walletAddress?: string };
  usdcMintAddress: string;
  wihngoWalletAddress: string;
}
```
