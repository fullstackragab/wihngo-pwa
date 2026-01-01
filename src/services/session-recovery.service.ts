/**
 * Session Recovery Service
 *
 * Detects and recovers incomplete payment/wallet connection sessions.
 * This handles cases where users:
 * - Close browser during wallet connection
 * - Get interrupted during Phantom redirect (mobile)
 * - Return to app after Phantom callback fails
 */

import {
  getStoredSupportParams,
  clearSupportParams,
  getStoredIntentId,
  clearStoredIntent,
  getConnectStep,
} from "./wallet-connect.service";

// Storage keys for payment intent tracking
const PAYMENT_INTENT_ID_KEY = "pending_payment_intent_id";
const PAYMENT_INTENT_CREATED_KEY = "pending_payment_intent_created";
const WALLET_CONNECT_TIMESTAMP_KEY = "wallet_connect_timestamp";

// Timeouts
const WALLET_CONNECT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const PAYMENT_INTENT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export type RecoveryStatus =
  | "no_session" // Nothing to recover
  | "already_completed" // Payment already went through
  | "awaiting_confirmation" // Waiting for blockchain confirmation
  | "resume_submission" // Signed, needs submit
  | "resume_signing" // Intent created, needs signature
  | "resume_wallet_connect" // Wallet connection in progress
  | "incomplete" // Partial state, can try to continue
  | "expired" // Session timed out
  | "offline_recovery"; // Can't reach backend, use localStorage

export interface RecoveryResult {
  status: RecoveryStatus;
  intentId?: string;
  walletAddress?: string;
  supportParams?: {
    birdId: string;
    birdAmount: number;
    wihngoAmount: number;
  };
  solanaSignature?: string;
  serializedTransaction?: string;
  message?: string;
  connectStep?: "connect" | "sign";
}

/**
 * Store payment intent ID for recovery
 */
export function storePaymentIntent(intentId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PAYMENT_INTENT_ID_KEY, intentId);
  localStorage.setItem(PAYMENT_INTENT_CREATED_KEY, Date.now().toString());
}

/**
 * Get stored payment intent ID
 */
export function getStoredPaymentIntentId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(PAYMENT_INTENT_ID_KEY);
}

/**
 * Clear stored payment intent
 */
export function clearPaymentIntent(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(PAYMENT_INTENT_ID_KEY);
  localStorage.removeItem(PAYMENT_INTENT_CREATED_KEY);
}

/**
 * Store wallet connect timestamp for stale detection
 */
export function storeWalletConnectTimestamp(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(WALLET_CONNECT_TIMESTAMP_KEY, Date.now().toString());
}

/**
 * Get wallet connect timestamp
 */
export function getWalletConnectTimestamp(): number | null {
  if (typeof localStorage === "undefined") return null;
  const timestamp = localStorage.getItem(WALLET_CONNECT_TIMESTAMP_KEY);
  return timestamp ? parseInt(timestamp, 10) : null;
}

/**
 * Clear wallet connect timestamp
 */
export function clearWalletConnectTimestamp(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(WALLET_CONNECT_TIMESTAMP_KEY);
}

/**
 * Check if wallet connection is stale (>5 minutes old)
 */
export function isWalletConnectStale(): boolean {
  const timestamp = getWalletConnectTimestamp();
  if (!timestamp) return false;

  const age = Date.now() - timestamp;
  return age > WALLET_CONNECT_TIMEOUT_MS;
}

/**
 * Check if payment intent is stale (>30 minutes old)
 */
export function isPaymentIntentStale(): boolean {
  if (typeof localStorage === "undefined") return false;

  const created = localStorage.getItem(PAYMENT_INTENT_CREATED_KEY);
  if (!created) return false;

  const age = Date.now() - parseInt(created, 10);
  return age > PAYMENT_INTENT_TIMEOUT_MS;
}

/**
 * Check if there's any pending session that needs recovery
 */
export function hasPendingSession(): boolean {
  if (typeof localStorage === "undefined") return false;

  return !!(
    getStoredPaymentIntentId() ||
    getConnectStep() ||
    getStoredSupportParams() ||
    getStoredIntentId()
  );
}

/**
 * Clear all local state related to payment/wallet connection
 */
export function clearAllLocalState(): void {
  if (typeof localStorage === "undefined") return;

  // Payment intent state
  clearPaymentIntent();

  // Wallet connection state (from wallet-connect.service)
  clearStoredIntent();

  // Support params
  clearSupportParams();

  // Wallet connect timestamp
  clearWalletConnectTimestamp();
}

/**
 * Check for incomplete sessions and determine recovery action
 */
export async function recoverSession(): Promise<RecoveryResult> {
  if (typeof localStorage === "undefined") {
    return { status: "no_session" };
  }

  // 1. Check for stale wallet connection (>5 minutes)
  const walletConnectStep = getConnectStep();
  if (walletConnectStep) {
    if (isWalletConnectStale()) {
      console.log("Clearing stale wallet connection state");
      clearAllLocalState();
      return {
        status: "expired",
        message: "Wallet connection timed out. Please try again.",
      };
    }

    // Active wallet connection in progress
    return {
      status: "resume_wallet_connect",
      connectStep: walletConnectStep,
      supportParams: getStoredSupportParams() || undefined,
    };
  }

  // 2. Check for pending payment intent
  const pendingIntentId = getStoredPaymentIntentId();
  const supportParams = getStoredSupportParams();
  const walletIntentId = getStoredIntentId();

  // No pending session
  if (!pendingIntentId && !supportParams && !walletIntentId) {
    return { status: "no_session" };
  }

  // 3. Check if payment intent is stale
  if (pendingIntentId && isPaymentIntentStale()) {
    console.log("Clearing stale payment intent");
    clearAllLocalState();
    return {
      status: "expired",
      message: "Payment session expired. Please start a new payment.",
    };
  }

  // 4. If we have an intent ID, try to check backend status
  if (pendingIntentId) {
    try {
      const response = await fetch(`/api/support/intents/${pendingIntentId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          clearAllLocalState();
          return {
            status: "expired",
            message: "Payment session not found. Please start a new payment.",
          };
        }
        throw new Error("Failed to check intent status");
      }

      const intent = await response.json();

      switch (intent.status) {
        case "Completed":
        case "confirmed":
          clearAllLocalState();
          return {
            status: "already_completed",
            solanaSignature: intent.solanaSignature,
            intentId: pendingIntentId,
          };

        case "Processing":
        case "Confirming":
        case "submitted":
          return {
            status: "awaiting_confirmation",
            intentId: pendingIntentId,
          };

        case "signed":
          return {
            status: "resume_submission",
            intentId: pendingIntentId,
          };

        case "Pending":
        case "pending":
          return {
            status: "resume_signing",
            intentId: pendingIntentId,
            serializedTransaction: intent.serializedTransaction,
            supportParams: supportParams || undefined,
          };

        case "Expired":
        case "expired":
          clearAllLocalState();
          return {
            status: "expired",
            message: "Payment session expired. Please start a new payment.",
          };

        case "Failed":
        case "failed":
          clearAllLocalState();
          return {
            status: "expired",
            message: "Previous payment failed. Please try again.",
          };

        default:
          // Unknown status - treat as incomplete
          return {
            status: "incomplete",
            supportParams: supportParams || undefined,
            intentId: pendingIntentId,
          };
      }
    } catch (error) {
      // Backend unreachable - rely on localStorage
      console.error("Failed to check intent status:", error);
      return {
        status: "offline_recovery",
        supportParams: supportParams || undefined,
        message:
          "Unable to verify payment status. Please check your connection.",
      };
    }
  }

  // 5. Only localStorage state exists (wallet intent but no payment intent)
  if (walletIntentId) {
    // Check if stale
    if (isWalletConnectStale()) {
      clearAllLocalState();
      return {
        status: "expired",
        message: "Wallet connection timed out. Please try again.",
      };
    }

    return {
      status: "resume_wallet_connect",
      supportParams: supportParams || undefined,
    };
  }

  // 6. Only support params exist
  if (supportParams) {
    return {
      status: "incomplete",
      supportParams,
    };
  }

  return { status: "no_session" };
}

/**
 * Get a user-friendly title for the recovery status
 */
export function getRecoveryTitle(status: RecoveryStatus): string {
  switch (status) {
    case "already_completed":
      return "Payment Already Complete";
    case "awaiting_confirmation":
      return "Payment Processing";
    case "resume_submission":
      return "Continue Payment?";
    case "resume_signing":
      return "Continue Payment?";
    case "resume_wallet_connect":
      return "Wallet Connection Pending";
    case "incomplete":
      return "Resume Payment?";
    case "expired":
      return "Session Expired";
    case "offline_recovery":
      return "Connection Issue";
    default:
      return "";
  }
}

/**
 * Get a user-friendly message for the recovery status
 */
export function getRecoveryMessage(
  status: RecoveryStatus,
  customMessage?: string
): string {
  if (customMessage) return customMessage;

  switch (status) {
    case "already_completed":
      return "Your previous payment was successful!";
    case "awaiting_confirmation":
      return "Your payment is being confirmed on Solana. This usually takes a few seconds.";
    case "resume_submission":
      return "Your payment was signed but not submitted. Would you like to continue?";
    case "resume_signing":
      return "You have an incomplete payment. Would you like to continue where you left off?";
    case "resume_wallet_connect":
      return "You have a pending wallet connection. Please complete the connection in Phantom.";
    case "incomplete":
      return "You have an unfinished payment. Would you like to continue where you left off?";
    case "expired":
      return "Your payment session has expired. Please start a new payment.";
    case "offline_recovery":
      return "We couldn't verify your payment status. Please check your internet connection.";
    default:
      return "";
  }
}
