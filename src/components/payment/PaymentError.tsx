"use client";

import { Button } from "@/components/ui/button";
import { MappedError, PaymentErrorCode } from "@/services/error-mapping.service";
import {
  AlertCircle,
  XCircle,
  WifiOff,
  Clock,
  Wallet,
  Ban,
  RefreshCw,
} from "lucide-react";

interface PaymentErrorProps {
  error: MappedError;
  onRetry?: () => void;
  onStartOver?: () => void;
  onConnectWallet?: () => void;
  onClose?: () => void;
}

// Icon mapping for different error types
const ERROR_ICONS: Record<PaymentErrorCode, React.ComponentType<{ className?: string }>> = {
  WALLET_REJECTED: Wallet,
  TX_REJECTED: XCircle,
  PHANTOM_NOT_INSTALLED: Wallet,
  USER_CANCELLED: Ban,
  INSUFFICIENT_BALANCE: Wallet,
  INSUFFICIENT_GAS: Wallet,
  NETWORK_CONGESTION: WifiOff,
  INTENT_EXPIRED: Clock,
  TX_FAILED: XCircle,
  NETWORK_ERROR: WifiOff,
  BLOCKHASH_EXPIRED: Clock,
  WALLET_NOT_CONNECTED: Wallet,
  INVALID_TRANSACTION: AlertCircle,
  UNKNOWN_ERROR: AlertCircle,
};

// Background color mapping based on error severity
const getIconBackground = (code: PaymentErrorCode, recoverable: boolean): string => {
  // Non-recoverable errors (balance issues)
  if (!recoverable) {
    return "bg-destructive/10";
  }

  // Timeout/expiration errors
  if (code === "INTENT_EXPIRED" || code === "BLOCKHASH_EXPIRED") {
    return "bg-secondary";
  }

  // Network errors
  if (code === "NETWORK_ERROR" || code === "NETWORK_CONGESTION") {
    return "bg-secondary";
  }

  // User-initiated cancellations
  if (code === "USER_CANCELLED" || code === "TX_REJECTED" || code === "WALLET_REJECTED") {
    return "bg-secondary";
  }

  // Default
  return "bg-destructive/10";
};

const getIconColor = (code: PaymentErrorCode, recoverable: boolean): string => {
  if (!recoverable) {
    return "text-destructive";
  }
  if (code === "USER_CANCELLED" || code === "TX_REJECTED" || code === "WALLET_REJECTED") {
    return "text-foreground/70";
  }
  return "text-foreground/70";
};

/**
 * Payment Error Display Component
 *
 * Shows user-friendly error messages with appropriate icons and actions.
 * Handles different error types with relevant recovery options.
 */
export function PaymentError({
  error,
  onRetry,
  onStartOver,
  onConnectWallet,
  onClose,
}: PaymentErrorProps) {
  const Icon = ERROR_ICONS[error.code] || AlertCircle;
  const iconBg = getIconBackground(error.code, error.recoverable);
  const iconColor = getIconColor(error.code, error.recoverable);

  // Handle primary action click
  const handlePrimaryAction = () => {
    if (!error.primaryAction) return;

    // External link
    if (error.primaryAction.href) {
      window.open(error.primaryAction.href, "_blank");
      return;
    }

    // Internal actions
    switch (error.primaryAction.action) {
      case "retry":
        onRetry?.();
        break;
      case "start_over":
        onStartOver?.();
        break;
      case "connect_wallet":
        onConnectWallet?.();
        break;
      case "close":
        onClose?.();
        break;
    }
  };

  // Handle secondary action click
  const handleSecondaryAction = () => {
    if (!error.secondaryAction) return;

    switch (error.secondaryAction.action) {
      case "close":
        onClose?.();
        break;
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-6">
      {/* Icon */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${iconBg}`}
      >
        <Icon className={`w-10 h-10 ${iconColor}`} />
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-foreground mb-2">{error.title}</h2>

      {/* Message */}
      <p className="text-muted-foreground mb-6 max-w-sm">{error.message}</p>

      {/* Recovery hint for non-recoverable errors */}
      {!error.recoverable && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Once you have enough funds, return here to try again.
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {error.primaryAction && (
          <Button onClick={handlePrimaryAction} fullWidth>
            {error.primaryAction.href && (
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            )}
            {error.primaryAction.action === "retry" && (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {error.primaryAction.label}
          </Button>
        )}
        {error.secondaryAction && (
          <Button onClick={handleSecondaryAction} variant="outline" fullWidth>
            {error.secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

export default PaymentError;
