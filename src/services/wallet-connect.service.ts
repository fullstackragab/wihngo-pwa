import { apiHelper, publicFetch, saveAuthToken } from "./api-helper";

// ============================================
// TYPES
// ============================================

export interface WalletConnectIntent {
  id: string;
  state: string;
  nonce: string;
  callbackUrl: string;
  dappPublicKey: string;
  status: "pending" | "completed" | "expired" | "cancelled";
  purpose?: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateIntentResponse {
  intentId: string;
  state: string;
  nonce: string;
  callbackUrl: string;
  dappPublicKey: string;
  expiresAt: string;
}

export interface CallbackResponse {
  success: boolean;
  walletAddress: string;
  accessToken: string;
  refreshToken: string;
  message?: string;
}

export interface CallbackInfoResponse {
  callbackUrl: string;
  appUrl: string;
}

export interface PendingIntentResponse {
  hasPending: boolean;
  intent?: WalletConnectIntent;
}

// ============================================
// AUTHENTICATED ENDPOINTS
// ============================================

/**
 * Create a wallet connect intent
 * Stores keypair server-side for cross-browser decryption
 */
export async function createWalletConnectIntent(
  purpose: string = "connect"
): Promise<CreateIntentResponse> {
  return apiHelper.post<CreateIntentResponse>("wallet-connect/intents", {
    purpose,
  });
}

/**
 * Get intent status by ID
 */
export async function getIntentStatus(intentId: string): Promise<WalletConnectIntent> {
  return apiHelper.get<WalletConnectIntent>(`wallet-connect/intents/${intentId}`);
}

/**
 * Check for pending wallet connect intents (recovery)
 */
export async function getPendingIntent(): Promise<PendingIntentResponse> {
  return apiHelper.get<PendingIntentResponse>("wallet-connect/pending");
}

/**
 * Cancel a pending intent
 */
export async function cancelIntent(intentId: string): Promise<void> {
  return apiHelper.post(`wallet-connect/intents/${intentId}/cancel`, {});
}

// ============================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================

/**
 * Process Phantom callback - PUBLIC endpoint
 * Called from any browser after Phantom redirects back
 * Returns new tokens for session recovery
 */
export async function processCallback(params: {
  state: string;
  phantomEncryptionPublicKey: string;
  data: string;
  nonce: string;
}): Promise<CallbackResponse> {
  const response = await publicFetch("wallet-connect/callback", {
    method: "POST",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Callback failed" }));
    throw new Error(error.message || "Failed to process wallet callback");
  }

  const result = await response.json();

  // Store new tokens for session recovery
  if (result.accessToken) {
    saveAuthToken(result.accessToken);
  }
  if (result.refreshToken && typeof window !== "undefined") {
    localStorage.setItem("auth_refresh_token", result.refreshToken);
  }

  return result;
}

/**
 * Get callback URL info - PUBLIC endpoint
 */
export async function getCallbackInfo(): Promise<CallbackInfoResponse> {
  const response = await publicFetch("wallet-connect/callback-info", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to get callback info");
  }

  return response.json();
}

// ============================================
// HELPER: Build Phantom Connect URL
// ============================================

/**
 * Build the Phantom universal link for wallet connection
 */
export function buildPhantomConnectUrl(intent: CreateIntentResponse): string {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Build redirect URL with state parameter
  const redirectUrl = new URL(intent.callbackUrl);
  redirectUrl.searchParams.set("state", intent.state);

  const params = new URLSearchParams({
    app_url: appUrl,
    dapp_encryption_public_key: intent.dappPublicKey,
    redirect_link: redirectUrl.toString(),
    cluster: "mainnet-beta",
  });

  return `https://phantom.app/ul/v1/connect?${params.toString()}`;
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

const INTENT_ID_KEY = "wallet_connect_intent_id";
const INTENT_STATE_KEY = "wallet_connect_state";

export function storeIntentLocally(intent: CreateIntentResponse): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(INTENT_ID_KEY, intent.intentId);
  localStorage.setItem(INTENT_STATE_KEY, intent.state);
}

export function getStoredIntentId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(INTENT_ID_KEY);
}

export function getStoredState(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(INTENT_STATE_KEY);
}

export function clearStoredIntent(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(INTENT_ID_KEY);
  localStorage.removeItem(INTENT_STATE_KEY);
}
