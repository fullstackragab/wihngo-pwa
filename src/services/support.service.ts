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

// ============================================
// SUPPORT INTENT FLOW
// ============================================

// Step 1: Preflight check - verify user can support
export async function preflightCheck(
  data: PreflightRequest
): Promise<PreflightResponse> {
  return apiHelper.post<PreflightResponse>("payments/support/preflight", data);
}

// Step 2: Create support intent - backend builds the transaction
export async function createSupportIntent(params: {
  birdId: string;
  birdAmount: number;
  wihngoAmount: number;
}): Promise<SupportIntentResponse> {
  const response = await apiHelper.post<SupportIntent>("payments/intents", {
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
export async function submitSupport(
  intentId: string,
  signedTransaction: string
): Promise<SubmitSupportResponse> {
  return apiHelper.post<SubmitSupportResponse>(
    `payments/intents/${intentId}/submit`,
    { signedTransaction }
  );
}

// Step 4: Poll for support status
export async function getSupportStatus(intentId: string): Promise<SupportIntent> {
  return apiHelper.get<SupportIntent>(`payments/intents/${intentId}`);
}

// Cancel a pending support intent
export async function cancelSupport(intentId: string): Promise<void> {
  return apiHelper.post(`payments/intents/${intentId}/cancel`, {});
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
