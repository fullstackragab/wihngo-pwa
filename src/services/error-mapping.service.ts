/**
 * Error Mapping Service
 *
 * Maps all possible payment flow errors to user-friendly messages.
 * Provides consistent error handling across the application.
 */

export type PaymentErrorCode =
  | "WALLET_REJECTED"
  | "TX_REJECTED"
  | "PHANTOM_NOT_INSTALLED"
  | "USER_CANCELLED"
  | "INSUFFICIENT_BALANCE"
  | "INSUFFICIENT_GAS"
  | "NETWORK_CONGESTION"
  | "INTENT_EXPIRED"
  | "TX_FAILED"
  | "NETWORK_ERROR"
  | "BLOCKHASH_EXPIRED"
  | "WALLET_NOT_CONNECTED"
  | "INVALID_TRANSACTION"
  | "UNKNOWN_ERROR";

export interface ErrorAction {
  label: string;
  href?: string; // External link
  action?: "retry" | "start_over" | "close" | "connect_wallet";
}

export interface MappedError {
  code: PaymentErrorCode;
  title: string;
  message: string;
  recoverable: boolean;
  primaryAction?: ErrorAction;
  secondaryAction?: ErrorAction;
}

// Error configurations
const ERROR_MAP: Record<PaymentErrorCode, Omit<MappedError, "code">> = {
  WALLET_REJECTED: {
    title: "Connection Declined",
    message: "You declined the wallet connection. Tap 'Try Again' to reconnect.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
  TX_REJECTED: {
    title: "Transaction Declined",
    message: "You declined the transaction in Phantom. No funds were sent.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
  PHANTOM_NOT_INSTALLED: {
    title: "Phantom Not Found",
    message: "Install the Phantom wallet app to continue.",
    recoverable: true,
    primaryAction: { label: "Get Phantom", href: "https://phantom.app/download" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
  USER_CANCELLED: {
    title: "Payment Cancelled",
    message: "You cancelled the payment. No funds were sent.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Close", action: "close" },
  },
  INSUFFICIENT_BALANCE: {
    title: "Insufficient USDC",
    message: "You don't have enough USDC in your wallet for this payment.",
    recoverable: false,
    primaryAction: { label: "Get USDC", href: "https://jup.ag/" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
  INSUFFICIENT_GAS: {
    title: "Need SOL for Fees",
    message: "You need a small amount of SOL (~$0.01) to pay network fees.",
    recoverable: false,
    primaryAction: { label: "Get SOL", href: "https://phantom.app/" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
  NETWORK_CONGESTION: {
    title: "Network Busy",
    message: "The Solana network is congested. Please try again in a moment.",
    recoverable: true,
    primaryAction: { label: "Retry", action: "retry" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
  INTENT_EXPIRED: {
    title: "Session Expired",
    message: "Your payment session timed out. Please start a new payment.",
    recoverable: true,
    primaryAction: { label: "Start Over", action: "start_over" },
  },
  TX_FAILED: {
    title: "Transaction Failed",
    message: "The transaction failed on the blockchain. Please try again.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
  NETWORK_ERROR: {
    title: "Connection Error",
    message: "Unable to connect. Please check your internet and try again.",
    recoverable: true,
    primaryAction: { label: "Retry", action: "retry" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
  BLOCKHASH_EXPIRED: {
    title: "Transaction Expired",
    message: "The transaction took too long and expired. Please try again.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
  WALLET_NOT_CONNECTED: {
    title: "Wallet Not Connected",
    message: "Please connect your wallet to continue.",
    recoverable: true,
    primaryAction: { label: "Connect Wallet", action: "connect_wallet" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
  INVALID_TRANSACTION: {
    title: "Invalid Transaction",
    message: "The transaction could not be processed. Please try again.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
  UNKNOWN_ERROR: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
    recoverable: true,
    primaryAction: { label: "Try Again", action: "retry" },
    secondaryAction: { label: "Cancel", action: "close" },
  },
};

/**
 * Map any error to a user-friendly MappedError
 */
export function mapError(error: unknown): MappedError {
  // Already a MappedError with a known code
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code as PaymentErrorCode;
    if (ERROR_MAP[code]) {
      return { code, ...ERROR_MAP[code] };
    }
  }

  // Standard Error object - try to detect error type from message
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Wallet connection errors
    if (message.includes("user rejected") || message.includes("user denied")) {
      return { code: "WALLET_REJECTED", ...ERROR_MAP.WALLET_REJECTED };
    }
    if (message.includes("rejected") || message.includes("declined")) {
      return { code: "TX_REJECTED", ...ERROR_MAP.TX_REJECTED };
    }
    if (message.includes("cancelled") || message.includes("canceled")) {
      return { code: "USER_CANCELLED", ...ERROR_MAP.USER_CANCELLED };
    }

    // Balance errors
    if (message.includes("insufficient") && message.includes("balance")) {
      return { code: "INSUFFICIENT_BALANCE", ...ERROR_MAP.INSUFFICIENT_BALANCE };
    }
    if (message.includes("insufficient") && (message.includes("sol") || message.includes("gas"))) {
      return { code: "INSUFFICIENT_GAS", ...ERROR_MAP.INSUFFICIENT_GAS };
    }

    // Network/connection errors
    if (message.includes("network") || message.includes("fetch") || message.includes("connection")) {
      return { code: "NETWORK_ERROR", ...ERROR_MAP.NETWORK_ERROR };
    }
    if (message.includes("congestion") || message.includes("busy")) {
      return { code: "NETWORK_CONGESTION", ...ERROR_MAP.NETWORK_CONGESTION };
    }

    // Transaction errors
    if (message.includes("expired") || message.includes("timeout")) {
      if (message.includes("blockhash")) {
        return { code: "BLOCKHASH_EXPIRED", ...ERROR_MAP.BLOCKHASH_EXPIRED };
      }
      return { code: "INTENT_EXPIRED", ...ERROR_MAP.INTENT_EXPIRED };
    }
    if (message.includes("failed") && message.includes("transaction")) {
      return { code: "TX_FAILED", ...ERROR_MAP.TX_FAILED };
    }

    // Wallet errors
    if (message.includes("not connected") || message.includes("wallet not")) {
      return { code: "WALLET_NOT_CONNECTED", ...ERROR_MAP.WALLET_NOT_CONNECTED };
    }
    if (message.includes("phantom") && (message.includes("not installed") || message.includes("not found"))) {
      return { code: "PHANTOM_NOT_INSTALLED", ...ERROR_MAP.PHANTOM_NOT_INSTALLED };
    }
  }

  // Phantom-specific error codes (from wallet provider)
  if (error && typeof error === "object" && "code" in error) {
    const phantomCode = (error as { code: number }).code;
    switch (phantomCode) {
      case 4001: // User rejected request
        return { code: "TX_REJECTED", ...ERROR_MAP.TX_REJECTED };
      case 4100: // Unauthorized
        return { code: "WALLET_REJECTED", ...ERROR_MAP.WALLET_REJECTED };
      case -32603: // Internal error
        return { code: "TX_FAILED", ...ERROR_MAP.TX_FAILED };
    }
  }

  // Default fallback
  return { code: "UNKNOWN_ERROR", ...ERROR_MAP.UNKNOWN_ERROR };
}

/**
 * Create an error with a specific code
 * Useful for creating errors programmatically
 */
export function createError(
  code: PaymentErrorCode,
  customMessage?: string
): MappedError {
  const base = ERROR_MAP[code] || ERROR_MAP.UNKNOWN_ERROR;
  return {
    code,
    ...base,
    message: customMessage || base.message,
  };
}

/**
 * Check if an error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  const mapped = mapError(error);
  return mapped.recoverable;
}

/**
 * Get error code from any error
 */
export function getErrorCode(error: unknown): PaymentErrorCode {
  return mapError(error).code;
}
