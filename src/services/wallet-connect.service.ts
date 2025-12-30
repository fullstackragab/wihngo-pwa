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
const DAPP_PUBLIC_KEY = "wallet_connect_dapp_public";
const PHANTOM_PUBLIC_KEY = "wallet_connect_phantom_public";
const PHANTOM_SESSION_KEY = "wallet_connect_phantom_session";
const WALLET_PUBLIC_KEY = "wallet_connect_wallet_public";
const CONNECT_STEP_KEY = "wallet_connect_step"; // "connect" | "sign"
const REDIRECT_URL_KEY = "wallet_connect_redirect_url"; // Full URL to return to

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
  localStorage.removeItem(DAPP_PUBLIC_KEY);
  localStorage.removeItem(PHANTOM_PUBLIC_KEY);
  localStorage.removeItem(PHANTOM_SESSION_KEY);
  localStorage.removeItem(WALLET_PUBLIC_KEY);
  localStorage.removeItem(CONNECT_STEP_KEY);
  localStorage.removeItem(REDIRECT_URL_KEY);
}

// Store dapp keypair for session
export function storeDappKeypair(publicKey: string, secretKey: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DAPP_PUBLIC_KEY, publicKey);
  localStorage.setItem(DAPP_SECRET_KEY, secretKey);
}

export function getStoredDappPublicKey(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(DAPP_PUBLIC_KEY);
}

export function getStoredDappSecretKey(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(DAPP_SECRET_KEY);
}

// Store Phantom encryption public key (returned from connect)
export function storePhantomPublicKey(publicKey: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PHANTOM_PUBLIC_KEY, publicKey);
}

export function getStoredPhantomPublicKey(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(PHANTOM_PUBLIC_KEY);
}

// Store session from connect response
export function storePhantomSession(session: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PHANTOM_SESSION_KEY, session);
}

export function getStoredPhantomSession(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(PHANTOM_SESSION_KEY);
}

// Store wallet public key from connect response
export function storeWalletPublicKey(publicKey: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(WALLET_PUBLIC_KEY, publicKey);
}

export function getStoredWalletPublicKey(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(WALLET_PUBLIC_KEY);
}

// Track which step we're on in the flow
export function setConnectStep(step: "connect" | "sign"): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CONNECT_STEP_KEY, step);
}

export function getConnectStep(): "connect" | "sign" | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(CONNECT_STEP_KEY) as "connect" | "sign" | null;
}

// Store the original page URL (with query params) to redirect back after Phantom
export function storeRedirectUrl(url: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(REDIRECT_URL_KEY, url);
}

export function getStoredRedirectUrl(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(REDIRECT_URL_KEY);
}

export function clearRedirectUrl(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(REDIRECT_URL_KEY);
}

// ============================================
// PHANTOM DEEP LINK HELPERS
// ============================================

import nacl from "tweetnacl";
import bs58 from "bs58";

/**
 * Build Phantom connect deep link URL
 * First step: establishes session and returns publicKey
 */
export function buildPhantomConnectUrl(
  redirectUrl: string,
  dappPublicKey: string
): string {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const params = new URLSearchParams({
    app_url: appUrl,
    dapp_encryption_public_key: dappPublicKey,
    redirect_link: redirectUrl,
    cluster: "mainnet-beta",
  });

  return `https://phantom.app/ul/v1/connect?${params.toString()}`;
}

/**
 * Build Phantom signMessage deep link URL
 * Second step: requires session from connect, returns signature
 */
export function buildPhantomSignMessageUrl(
  message: string,
  redirectUrl: string,
  dappPublicKey: string,
  session: string,
  nonce: string
): string {
  // Create the payload to encrypt
  const payload = {
    message: bs58.encode(new TextEncoder().encode(message)),
    session,
  };

  // Encrypt the payload
  const dappSecretKey = getStoredDappSecretKey();
  if (!dappSecretKey) {
    throw new Error("No dapp secret key for encryption");
  }

  const sharedSecret = nacl.box.before(
    bs58.decode(getStoredPhantomPublicKey() || ""),
    bs58.decode(dappSecretKey)
  );

  const nonceBytes = nacl.randomBytes(24);
  const encryptedPayload = nacl.box.after(
    new TextEncoder().encode(JSON.stringify(payload)),
    nonceBytes,
    sharedSecret
  );

  const params = new URLSearchParams({
    dapp_encryption_public_key: dappPublicKey,
    redirect_link: redirectUrl,
    nonce: bs58.encode(nonceBytes),
    payload: bs58.encode(encryptedPayload),
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
 * Decrypt Phantom connect response
 * Returns { publicKey, session } or null if decryption fails
 */
export function decryptConnectResponse(
  phantomEncryptionPublicKey: string,
  encryptedData: string,
  nonce: string,
  dappSecretKey: string
): { publicKey: string; session: string } | null {
  try {
    const dappSecret = bs58.decode(dappSecretKey);
    const phantomPubKey = bs58.decode(phantomEncryptionPublicKey);
    const data = bs58.decode(encryptedData);
    const nonceBytes = bs58.decode(nonce);

    const sharedSecret = nacl.box.before(phantomPubKey, dappSecret);
    const decrypted = nacl.box.open.after(data, nonceBytes, sharedSecret);

    if (!decrypted) {
      console.error("Failed to decrypt Phantom connect response");
      return null;
    }

    const response = JSON.parse(new TextDecoder().decode(decrypted));

    // connect response contains public_key and session
    if (response.public_key && response.session) {
      return {
        publicKey: response.public_key,
        session: response.session,
      };
    }

    console.error("Missing public_key or session in connect response");
    return null;
  } catch (err) {
    console.error("Failed to decrypt Phantom connect response:", err);
    return null;
  }
}

/**
 * Decrypt Phantom signMessage response
 * Returns { signature } or null if decryption fails
 */
export function decryptSignMessageResponse(
  phantomEncryptionPublicKey: string,
  encryptedData: string,
  nonce: string,
  dappSecretKey: string
): { signature: string } | null {
  try {
    const dappSecret = bs58.decode(dappSecretKey);
    const phantomPubKey = bs58.decode(phantomEncryptionPublicKey);
    const data = bs58.decode(encryptedData);
    const nonceBytes = bs58.decode(nonce);

    const sharedSecret = nacl.box.before(phantomPubKey, dappSecret);
    const decrypted = nacl.box.open.after(data, nonceBytes, sharedSecret);

    if (!decrypted) {
      console.error("Failed to decrypt Phantom signMessage response");
      return null;
    }

    const response = JSON.parse(new TextDecoder().decode(decrypted));

    // signMessage response contains signature
    if (response.signature) {
      return {
        signature: response.signature,
      };
    }

    console.error("Missing signature in signMessage response");
    return null;
  } catch (err) {
    console.error("Failed to decrypt Phantom signMessage response:", err);
    return null;
  }
}

/**
 * @deprecated Use decryptConnectResponse or decryptSignMessageResponse instead
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
