import { apiHelper, publicFetch, saveAuthToken } from "./api-helper";

// ============================================
// TYPES (Matching Backend API)
// ============================================

export interface CreateIntentResponse {
  state: string;      // Opaque token to identify this intent
  nonce: string;      // Nonce for the signing request
  message: string;    // Message to be signed by the wallet (base58 or utf8)
}

export interface CallbackRequest {
  state: string;           // State token from intent
  publicKey: string;       // Base58 Solana public key
  signature: string;       // Base58 Ed25519 signature of the message
}

export interface CallbackResponse {
  success: boolean;
  walletAddress: string;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Create a wallet connect intent
 * Returns state token and message to be signed
 */
export async function createWalletConnectIntent(): Promise<CreateIntentResponse> {
  return apiHelper.post<CreateIntentResponse>("wallet-connect/intents", {});
}

/**
 * Process wallet callback - PUBLIC endpoint
 * Verifies the signature and links wallet to user
 * Returns new auth tokens for session recovery
 */
export async function processWalletCallback(
  params: CallbackRequest
): Promise<CallbackResponse> {
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

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

const INTENT_STATE_KEY = "wallet_connect_state";
const INTENT_MESSAGE_KEY = "wallet_connect_message";
const DAPP_SECRET_KEY = "wallet_connect_dapp_secret";

export function storeIntentLocally(intent: CreateIntentResponse, dappSecretKey?: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(INTENT_STATE_KEY, intent.state);
  localStorage.setItem(INTENT_MESSAGE_KEY, intent.message);
  if (dappSecretKey) {
    localStorage.setItem(DAPP_SECRET_KEY, dappSecretKey);
  }
}

export function getStoredIntent(): { state: string; message: string; dappSecretKey?: string } | null {
  if (typeof localStorage === "undefined") return null;
  const state = localStorage.getItem(INTENT_STATE_KEY);
  const message = localStorage.getItem(INTENT_MESSAGE_KEY);
  const dappSecretKey = localStorage.getItem(DAPP_SECRET_KEY);
  if (!state || !message) return null;
  return { state, message, dappSecretKey: dappSecretKey || undefined };
}

export function getStoredIntentId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(INTENT_STATE_KEY);
}

export function clearStoredIntent(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(INTENT_STATE_KEY);
  localStorage.removeItem(INTENT_MESSAGE_KEY);
  localStorage.removeItem(DAPP_SECRET_KEY);
}

// ============================================
// PHANTOM DEEP LINK HELPERS
// ============================================

import nacl from "tweetnacl";
import bs58 from "bs58";

/**
 * Build Phantom signMessage deep link URL
 * Uses signMessage instead of connect because it returns both publicKey AND signature
 */
export function buildPhantomSignMessageUrl(
  message: string,
  redirectUrl: string,
  dappPublicKey: string
): string {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Encode message as base58
  const messageBytes = new TextEncoder().encode(message);
  const messageBase58 = bs58.encode(messageBytes);

  const params = new URLSearchParams({
    app_url: appUrl,
    dapp_encryption_public_key: dappPublicKey,
    redirect_link: redirectUrl,
    message: messageBase58,
    cluster: "mainnet-beta",
  });

  return `https://phantom.app/ul/v1/signMessage?${params.toString()}`;
}

/**
 * Generate encryption keypair for Phantom deep link communication
 */
export function generateDappKeypair(): { publicKey: string; secretKey: string } {
  const keypair = nacl.box.keyPair();
  return {
    publicKey: bs58.encode(keypair.publicKey),
    secretKey: bs58.encode(keypair.secretKey),
  };
}

/**
 * Decrypt Phantom signMessage response
 * Returns { publicKey, signature } or null if decryption fails
 */
export function decryptPhantomResponse(
  phantomEncryptionPublicKey: string,
  encryptedData: string,
  nonce: string,
  dappSecretKey: string
): { publicKey: string; signature: string } | null {
  try {
    const dappSecret = bs58.decode(dappSecretKey);
    const phantomPubKey = bs58.decode(phantomEncryptionPublicKey);
    const data = bs58.decode(encryptedData);
    const nonceBytes = bs58.decode(nonce);

    const sharedSecret = nacl.box.before(phantomPubKey, dappSecret);
    const decrypted = nacl.box.open.after(data, nonceBytes, sharedSecret);

    if (!decrypted) {
      console.error("Failed to decrypt Phantom response");
      return null;
    }

    const response = JSON.parse(new TextDecoder().decode(decrypted));

    // signMessage response contains public_key and signature
    if (response.public_key && response.signature) {
      return {
        publicKey: response.public_key,
        signature: response.signature,
      };
    }

    console.error("Missing public_key or signature in response");
    return null;
  } catch (err) {
    console.error("Failed to decrypt Phantom response:", err);
    return null;
  }
}
