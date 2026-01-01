import { apiHelper, publicGet } from "./api-helper";
import {
  SupportIntent,
  SupportIntentResponse,
  SubmitSupportResponse,
  SupportStatus,
  SupportHistoryResponse,
  LinkWalletRequest,
  LinkedWallet,
  UserBalance,
  OnChainBalanceResponse,
  PreflightRequest,
  PreflightResponse,
} from "@/types/support";
import {
  getOrCreateIdempotencyKey,
  clearIdempotencyKey,
  generateSubmitIdempotencyKey,
  clearSubmitAttempts,
} from "@/lib/idempotency";
import { withRetry, RETRY_PRESETS } from "@/lib/retry";

// ============================================
// STATUS NORMALIZATION
// ============================================

/**
 * Normalize status values from backend (lowercase) to frontend (PascalCase)
 */
function normalizeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    completed: "Completed",
    confirming: "Confirming",
    submitted: "Processing",
    processing: "Processing",
    failed: "Failed",
    pending: "Pending",
    expired: "Expired",
    cancelled: "Cancelled",
    timeout: "Failed",
  };
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Backend response format for submit
 */
interface BackendSubmitResponse {
  paymentId: string;
  solanaSignature?: string;
  status: string;
  errorMessage?: string;
  wasAlreadySubmitted?: boolean;
}

// ============================================
// SUPPORT INTENT FLOW (Bird Support)
// ============================================

// Step 1: Preflight check - verify user can support a bird
// Retries on network failure
export async function preflightCheck(
  data: PreflightRequest
): Promise<PreflightResponse> {
  return withRetry(
    () => apiHelper.post<PreflightResponse>("support/birds/preflight", data),
    RETRY_PRESETS.network
  );
}

// Step 2a: Create support intent for BIRD support
// Uses idempotency key to prevent duplicate payments
// Retries on network failure (safe due to idempotency key)
export async function createSupportIntent(params: {
  birdId: string;
  birdAmount: number;
  wihngoAmount: number;
  userId?: string; // Optional: for idempotency key generation
}): Promise<SupportIntentResponse> {
  // Generate idempotency key if we have a user ID
  let idempotencyKey: string | undefined;
  if (params.userId) {
    idempotencyKey = await getOrCreateIdempotencyKey({
      userId: params.userId,
      birdId: params.birdId,
      birdAmount: params.birdAmount,
      wihngoAmount: params.wihngoAmount,
    });
  }

  const requestBody: Record<string, unknown> = {
    birdId: params.birdId,
    birdAmount: params.birdAmount,
    wihngoSupportAmount: params.wihngoAmount,
    currency: "USDC",
  };

  // Include idempotency key if generated
  if (idempotencyKey) {
    requestBody.idempotencyKey = idempotencyKey;
  }

  // Retry on network failure - safe due to idempotency key
  const response = await withRetry(
    () => apiHelper.post<SupportIntent>("support/intents", requestBody),
    RETRY_PRESETS.network
  );

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

// Step 2b: Create support intent for WIHNGO-ONLY support
// Dedicated endpoint for supporting Wihngo without a bird
export async function createWihngoSupportIntent(params: {
  amount: number;
  userId?: string;
}): Promise<SupportIntentResponse> {
  // Generate idempotency key if we have a user ID
  let idempotencyKey: string | undefined;
  if (params.userId) {
    idempotencyKey = await getOrCreateIdempotencyKey({
      userId: params.userId,
      birdId: "wihngo", // Use "wihngo" as identifier for idempotency
      birdAmount: 0,
      wihngoAmount: params.amount,
    });
  }

  const requestBody: Record<string, unknown> = {
    amount: params.amount,
  };

  if (idempotencyKey) {
    requestBody.idempotencyKey = idempotencyKey;
  }

  // Retry on network failure - safe due to idempotency key
  const response = await withRetry(
    () => apiHelper.post<SupportIntent>("support/wihngo", requestBody),
    RETRY_PRESETS.network
  );

  // Map backend response to frontend-friendly format
  return {
    intentId: response.intentId,
    birdWallet: null, // No bird wallet for Wihngo-only support
    wihngoWallet: response.wihngoWalletAddress,
    usdcMint: response.usdcMintAddress,
    serializedTransaction: response.serializedTransaction,
    expiresAt: response.expiresAt,
  };
}

/**
 * Clear idempotency cache after successful payment
 * Should be called when payment is confirmed
 */
export function clearPaymentCache(birdId: string): void {
  clearIdempotencyKey(birdId);
}

// Step 3: Submit signed transaction - backend submits to Solana
// Uses idempotency key to prevent double submissions
export async function submitSupport(
  intentId: string,
  signedTransaction: string
): Promise<SubmitSupportResponse> {
  // Generate idempotency key for this submission attempt
  // Format: {paymentId}-{attemptNumber}-{timestamp}
  const idempotencyKey = generateSubmitIdempotencyKey(intentId);

  const response = await apiHelper.post<BackendSubmitResponse>(
    `support/intents/${intentId}/submit`,
    {
      paymentId: intentId,
      signedTransaction,
      idempotencyKey,
    }
  );

  // Clear attempt counter on successful submission
  if (response.status === "completed" || response.status === "confirming" || response.status === "submitted") {
    clearSubmitAttempts(intentId);
  }

  // Normalize response to frontend format
  return {
    intentId,
    status: normalizeStatus(response.status) as SubmitSupportResponse["status"],
    solanaSignature: response.solanaSignature,
    message: response.errorMessage,
  };
}

// Step 4: Poll for support status
export async function getSupportStatus(intentId: string): Promise<SupportIntent> {
  return apiHelper.get<SupportIntent>(`support/intents/${intentId}`);
}

// Cancel a pending support intent
export async function cancelSupport(intentId: string): Promise<void> {
  return apiHelper.post(`support/intents/${intentId}/cancel`, {});
}

// ============================================
// SUPPORT HISTORY
// ============================================

// Get support history
export async function getSupportHistory(
  page = 1,
  pageSize = 20
): Promise<SupportHistoryResponse> {
  return apiHelper.get<SupportHistoryResponse>(
    `support/history?page=${page}&pageSize=${pageSize}`
  );
}

// ============================================
// WALLET MANAGEMENT
// ============================================

// Link a new wallet to user account
export async function linkWallet(publicKey: string): Promise<LinkedWallet> {
  return apiHelper.post<LinkedWallet>("wallets/link", { publicKey });
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
// Retries on network failure with quick preset
export async function checkWalletBalance(
  walletAddress: string
): Promise<OnChainBalanceResponse> {
  return withRetry(
    () =>
      publicGet<OnChainBalanceResponse>(
        `wallets/${walletAddress}/on-chain-balance`
      ),
    RETRY_PRESETS.balance
  );
}
