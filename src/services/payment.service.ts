import { apiHelper, publicGet } from "./api-helper";
import {
  PaymentIntent,
  PaymentIntentResponse,
  SubmitPaymentResponse,
  PaymentStatus,
  PaymentHistoryResponse,
  LinkWalletRequest,
  LinkedWallet,
  UserBalance,
  OnChainBalanceResponse,
  PreflightRequest,
  PreflightResponse,
} from "@/types/payment";

// ============================================
// PAYMENT INTENT FLOW
// ============================================

// Step 1: Preflight check - verify user can make payment
export async function preflightCheck(
  data: PreflightRequest
): Promise<PreflightResponse> {
  return apiHelper.post<PreflightResponse>("payments/support/preflight", data);
}

// Step 2: Create payment intent - backend builds the transaction
export async function createPaymentIntent(params: {
  birdId: string;
  birdAmount: number;
  wihngoAmount: number;
}): Promise<PaymentIntentResponse> {
  const response = await apiHelper.post<PaymentIntent>("payments/intents", {
    birdId: params.birdId,
    birdAmount: params.birdAmount,
    wihngoSupportAmount: params.wihngoAmount,
    currency: "USDC",
  });

  // Map backend response to frontend-friendly format
  return {
    intentId: response.intentId,
    birdWallet: response.birdWalletAddress,
    wihngoWallet: response.wihngoWalletAddress,
    usdcMint: response.usdcMintAddress,
    serializedTransaction: response.serializedTransaction,
    expiresAt: response.expiresAt,
  };
}

// Step 3: Submit signed transaction - backend submits to Solana
export async function submitPayment(
  intentId: string,
  signedTransaction: string
): Promise<SubmitPaymentResponse> {
  return apiHelper.post<SubmitPaymentResponse>(
    `payments/intents/${intentId}/submit`,
    { signedTransaction }
  );
}

// Step 4: Poll for payment status
export async function getPaymentStatus(intentId: string): Promise<PaymentIntent> {
  return apiHelper.get<PaymentIntent>(`payments/intents/${intentId}`);
}

// Cancel a pending payment intent
export async function cancelPayment(intentId: string): Promise<void> {
  return apiHelper.post(`payments/intents/${intentId}/cancel`, {});
}

// ============================================
// PAYMENT HISTORY
// ============================================

// Get P2P payment history
export async function getPaymentHistory(
  page = 1,
  pageSize = 20
): Promise<PaymentHistoryResponse> {
  return apiHelper.get<PaymentHistoryResponse>(
    `payments?page=${page}&pageSize=${pageSize}`
  );
}

// Get bird support history
export async function getSupportHistory(
  page = 1,
  pageSize = 20
): Promise<PaymentHistoryResponse> {
  return apiHelper.get<PaymentHistoryResponse>(
    `payments/support-history?page=${page}&pageSize=${pageSize}`
  );
}

// ============================================
// WALLET MANAGEMENT
// ============================================

// Link a new wallet (requires signature verification)
export async function linkWallet(data: LinkWalletRequest): Promise<LinkedWallet> {
  return apiHelper.post<LinkedWallet>("wallets/link", data);
}

// Get user's linked wallets
export async function getLinkedWallets(): Promise<LinkedWallet[]> {
  return apiHelper.get<LinkedWallet[]>("wallets");
}

// Unlink a wallet
export async function unlinkWallet(walletId: string): Promise<void> {
  return apiHelper.delete(`wallets/${walletId}`);
}

// Set wallet as primary
export async function setPrimaryWallet(walletId: string): Promise<void> {
  return apiHelper.post(`wallets/${walletId}/primary`, {});
}

// Get authenticated user's balance
export async function getBalance(): Promise<UserBalance> {
  return apiHelper.get<UserBalance>("wallets/balance");
}

// ============================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================

// Check on-chain balance for any wallet address
export async function checkWalletBalance(
  walletAddress: string
): Promise<OnChainBalanceResponse> {
  return publicGet<OnChainBalanceResponse>(
    `wallets/${walletAddress}/on-chain-balance`
  );
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

// Legacy confirm payment - now uses submitPayment internally
export async function confirmPayment(data: {
  intentId: string;
  transactions: { type: string; signature: string }[];
}): Promise<{ success: boolean; message: string }> {
  // For backwards compatibility, but the new flow uses submitPayment
  console.warn(
    "confirmPayment is deprecated. Use submitPayment with backend-signed transaction flow."
  );
  return {
    success: false,
    message: "Please update to new payment flow using submitPayment",
  };
}
