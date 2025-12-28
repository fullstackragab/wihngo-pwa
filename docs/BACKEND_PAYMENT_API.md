# Backend Payment API Requirements

This document outlines the API endpoints required by the frontend for Phantom wallet payments.

## Overview

The payment flow uses USDC on Solana mainnet. Bird support is 100% to bird owner; Wihngo support is optional and additive.

---

## Required Endpoints

### 1. Create Payment Intent

Creates a payment intent before the user signs transactions.

```
POST /api/payments/intent
Authorization: Bearer {token}
```

**Request:**
```json
{
  "type": "BIRD_SUPPORT",
  "birdId": "uuid-of-bird",
  "birdAmount": 5.00,
  "wihngoAmount": 0.25
}
```

**Response:**
```json
{
  "intentId": "uuid-of-intent",
  "birdWallet": "Solana-pubkey-of-bird-owner",
  "wihngoWallet": "Solana-pubkey-of-wihngo",
  "usdcMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "expiresAt": "2024-12-28T15:00:00Z"
}
```

**Notes:**
- `birdWallet` can be null if bird owner hasn't linked a wallet
- `usdcMint` should be the mainnet USDC mint address
- Intent should expire after ~10 minutes

---

### 2. Confirm Payment

Called after user signs and submits transactions on-chain.

```
POST /api/payments/confirm
Authorization: Bearer {token}
```

**Request:**
```json
{
  "intentId": "uuid-of-intent",
  "transactions": [
    { "type": "BIRD", "signature": "solana-tx-signature" },
    { "type": "WIHNGO", "signature": "solana-tx-signature" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "birdTransactionVerified": true,
  "wihngoTransactionVerified": true
}
```

**Backend should:**
1. Verify each transaction signature on Solana RPC
2. Confirm amounts match the intent
3. Confirm destination wallets are correct
4. Update payment status in database
5. Credit bird owner's balance (if applicable)

---

### 3. Check Wallet Balance (Public)

Checks if a wallet has enough USDC and SOL for the transaction.

```
GET /api/wallets/{walletAddress}/balance
```

**Response:**
```json
{
  "walletAddress": "user-solana-pubkey",
  "solBalance": 0.05,
  "usdcBalance": 25.50,
  "minimumSolRequired": 0.005
}
```

**Notes:**
- This should be a public endpoint (no auth required)
- Query Solana RPC for actual balances
- `minimumSolRequired` is for transaction fees (~0.005 SOL)

---

### 4. Get Payment Status

```
GET /api/payments/intents/{intentId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "paymentId": "uuid",
  "status": "Completed",
  "amountUsdc": 5.25,
  "feeUsdc": 0,
  "solanaSignature": "tx-signature",
  "confirmations": 32,
  "requiredConfirmations": 32,
  "createdAt": "2024-12-28T14:00:00Z",
  "confirmedAt": "2024-12-28T14:01:00Z"
}
```

**Status values:**
- `Pending` - Intent created, waiting for signatures
- `AwaitingSignature` - Intent ready for user to sign
- `Submitted` - Transactions submitted to Solana
- `Confirming` - Waiting for blockchain confirmations
- `Confirmed` - Transaction confirmed on-chain
- `Completed` - Payment fully processed
- `Failed` - Transaction failed
- `Expired` - Intent expired before completion
- `Cancelled` - User cancelled

---

### 5. Payment History

```
GET /api/payments?page=1&pageSize=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "items": [
    {
      "paymentId": "uuid",
      "status": "Completed",
      "amountUsdc": 5.00,
      "memo": "Support for Mango",
      "createdAt": "2024-12-28T14:00:00Z",
      "isSender": true,
      "otherParty": {
        "userId": "owner-uuid",
        "name": "Bird Owner",
        "profileImage": "https://..."
      }
    }
  ],
  "totalCount": 15,
  "page": 1,
  "pageSize": 20
}
```

---

## Wallet Linking (Optional)

For bird owners to receive payments:

### Link Wallet
```
POST /api/wallets/link
Authorization: Bearer {token}
```

**Request:**
```json
{
  "publicKey": "solana-pubkey",
  "signature": "signed-message-signature",
  "message": "Link wallet to Wihngo: {timestamp}"
}
```

### Get Linked Wallets
```
GET /api/wallets
Authorization: Bearer {token}
```

### Unlink Wallet
```
DELETE /api/wallets/{walletId}
Authorization: Bearer {token}
```

---

## Configuration

The frontend expects these values:

| Config | Value | Notes |
|--------|-------|-------|
| USDC Mint | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | Mainnet USDC |
| Network | `mainnet-beta` | Solana mainnet |
| Min SOL for gas | `0.005` | For transaction fees |
| Min bird amount | `0.01` | USDC |
| Max bird amount | `1000` | USDC |

---

## Transaction Verification

When verifying transactions, the backend should:

1. **Fetch transaction from Solana RPC:**
   ```
   connection.getTransaction(signature, { commitment: 'confirmed' })
   ```

2. **Verify:**
   - Transaction is finalized/confirmed
   - Source wallet matches user's wallet
   - Destination wallet matches intent (bird or wihngo)
   - Amount matches intent amount
   - Token mint is USDC

3. **Handle edge cases:**
   - Transaction not found (pending or invalid)
   - Transaction failed
   - Amount mismatch
   - Wrong destination

---

## Error Responses

Use consistent error format:

```json
{
  "error": "INSUFFICIENT_BALANCE",
  "message": "Not enough USDC in wallet",
  "details": {
    "required": 5.25,
    "available": 2.00
  }
}
```

Common error codes:
- `INTENT_NOT_FOUND`
- `INTENT_EXPIRED`
- `TRANSACTION_FAILED`
- `TRANSACTION_NOT_FOUND`
- `AMOUNT_MISMATCH`
- `INVALID_DESTINATION`
- `INSUFFICIENT_BALANCE`
- `WALLET_NOT_LINKED`
