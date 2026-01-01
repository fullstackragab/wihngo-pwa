"use client";

import { Button } from "@/components/ui/button";
import {
  RecoveryResult,
  getRecoveryTitle,
  getRecoveryMessage,
} from "@/services/session-recovery.service";
import {
  CheckCircle2,
  Clock,
  Wallet,
  AlertCircle,
  WifiOff,
  RefreshCw,
} from "lucide-react";

interface RecoveryModalProps {
  recovery: RecoveryResult | null;
  isOpen: boolean;
  onContinue: () => void;
  onStartOver: () => void;
  onClose?: () => void;
}

/**
 * Modal shown when an incomplete payment/wallet session is detected.
 * Offers options to continue where user left off or start over.
 */
export function RecoveryModal({
  recovery,
  isOpen,
  onContinue,
  onStartOver,
  onClose,
}: RecoveryModalProps) {
  if (!isOpen || !recovery || recovery.status === "no_session") {
    return null;
  }

  const title = getRecoveryTitle(recovery.status);
  const message = getRecoveryMessage(recovery.status, recovery.message);

  // Determine icon based on status
  const getIcon = () => {
    switch (recovery.status) {
      case "already_completed":
        return (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
        );
      case "awaiting_confirmation":
        return (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        );
      case "resume_wallet_connect":
        return (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
        );
      case "resume_signing":
      case "resume_submission":
      case "incomplete":
        return (
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Clock className="w-8 h-8 text-foreground/70" />
          </div>
        );
      case "expired":
        return (
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
        );
      case "offline_recovery":
        return (
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-foreground/70" />
          </div>
        );
      default:
        return null;
    }
  };

  // Determine button configuration based on status
  const getButtons = () => {
    switch (recovery.status) {
      case "already_completed":
        // Only show "Done" button
        return {
          showContinue: false,
          continueText: "",
          startOverText: "Done",
          startOverVariant: "default" as const,
        };

      case "awaiting_confirmation":
        return {
          showContinue: true,
          continueText: "Check Status",
          startOverText: "Cancel",
          startOverVariant: "outline" as const,
        };

      case "resume_signing":
      case "resume_submission":
      case "incomplete":
        return {
          showContinue: true,
          continueText: "Continue",
          startOverText: "Start Over",
          startOverVariant: "outline" as const,
        };

      case "resume_wallet_connect":
        return {
          showContinue: true,
          continueText: "Continue Connection",
          startOverText: "Start Over",
          startOverVariant: "outline" as const,
        };

      case "expired":
        return {
          showContinue: false,
          continueText: "",
          startOverText: "Start New Payment",
          startOverVariant: "default" as const,
        };

      case "offline_recovery":
        return {
          showContinue: true,
          continueText: "Retry",
          startOverText: "Start Over",
          startOverVariant: "outline" as const,
        };

      default:
        return {
          showContinue: true,
          continueText: "Continue",
          startOverText: "Cancel",
          startOverVariant: "outline" as const,
        };
    }
  };

  const buttons = getButtons();

  // Show amount info if we have support params
  const showAmountInfo =
    recovery.supportParams &&
    (recovery.supportParams.birdAmount > 0 ||
      recovery.supportParams.wihngoAmount > 0);

  const totalAmount = recovery.supportParams
    ? recovery.supportParams.birdAmount + recovery.supportParams.wihngoAmount
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl p-6 max-w-md w-full shadow-lg border">
        {/* Icon */}
        <div className="flex justify-center mb-4">{getIcon()}</div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground text-center mb-2">
          {title}
        </h2>

        {/* Message */}
        <p className="text-muted-foreground text-center mb-4">{message}</p>

        {/* Amount info */}
        {showAmountInfo && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-semibold text-foreground">
                ${totalAmount.toFixed(2)} USDC
              </span>
            </div>
          </div>
        )}

        {/* Transaction signature link if already completed */}
        {recovery.status === "already_completed" && recovery.solanaSignature && (
          <div className="mb-6">
            <a
              href={`https://solscan.io/tx/${recovery.solanaSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
            >
              View on Solscan
              <svg
                className="w-3 h-3"
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
            </a>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {buttons.showContinue && (
            <Button onClick={onContinue} fullWidth>
              {buttons.continueText}
            </Button>
          )}
          <Button
            onClick={
              recovery.status === "already_completed"
                ? onClose || onStartOver
                : onStartOver
            }
            variant={buttons.startOverVariant}
            fullWidth
          >
            {buttons.startOverText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RecoveryModal;
