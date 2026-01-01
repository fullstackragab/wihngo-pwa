"use client";

import { Loader2, CheckCircle, Wallet, FileCheck, Send, Clock } from "lucide-react";
import { isMobileDevice } from "@/lib/phantom/platform";

export type PaymentStep =
  | "connecting_wallet"
  | "checking_balance"
  | "creating_intent"
  | "awaiting_signature"
  | "submitting"
  | "confirming"
  | "complete";

interface PaymentProgressProps {
  currentStep: PaymentStep;
  className?: string;
}

interface StepConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  mobileLabel?: string;
  hint?: string;
  mobileHint?: string;
  progress: number;
}

const STEPS: Record<PaymentStep, StepConfig> = {
  connecting_wallet: {
    icon: Wallet,
    label: "Connecting wallet...",
    mobileLabel: "Approve in Phantom app",
    hint: "Please approve in your wallet extension",
    mobileHint: "After approving, return to this page",
    progress: 15,
  },
  checking_balance: {
    icon: FileCheck,
    label: "Checking balance...",
    hint: "Verifying your wallet has enough USDC",
    progress: 30,
  },
  creating_intent: {
    icon: FileCheck,
    label: "Preparing payment...",
    hint: "Setting up your transaction",
    progress: 45,
  },
  awaiting_signature: {
    icon: Wallet,
    label: "Waiting for signature...",
    mobileLabel: "Sign in Phantom",
    hint: "Please sign the transaction in your wallet",
    mobileHint: "Approve in Phantom, then return here",
    progress: 60,
  },
  submitting: {
    icon: Send,
    label: "Sending payment...",
    hint: "Do not close this page",
    progress: 75,
  },
  confirming: {
    icon: Clock,
    label: "Confirming on Solana...",
    hint: "Usually 1-2 seconds",
    progress: 90,
  },
  complete: {
    icon: CheckCircle,
    label: "Payment complete!",
    progress: 100,
  },
};

export function PaymentProgress({
  currentStep,
  className = "",
}: PaymentProgressProps) {
  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isMobile = isMobileDevice();

  const label = isMobile && step.mobileLabel ? step.mobileLabel : step.label;
  const hint = isMobile && step.mobileHint ? step.mobileHint : step.hint;
  const isComplete = currentStep === "complete";

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Progress bar */}
      <div className="w-full h-2 bg-secondary rounded-full mb-6 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            isComplete ? "bg-support-green" : "bg-primary"
          }`}
          style={{ width: `${step.progress}%` }}
        />
      </div>

      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          isComplete ? "bg-support-green/10" : "bg-primary/10"
        }`}
      >
        {isComplete ? (
          <Icon className="w-8 h-8 text-support-green" />
        ) : (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        )}
      </div>

      {/* Label */}
      <p
        className={`text-lg font-semibold ${
          isComplete ? "text-support-green" : "text-foreground"
        }`}
      >
        {label}
      </p>

      {/* Hint */}
      {hint && !isComplete && (
        <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function PaymentProgressInline({
  currentStep,
  className = "",
}: PaymentProgressProps) {
  const step = STEPS[currentStep];
  const isComplete = currentStep === "complete";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Progress bar */}
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            isComplete ? "bg-support-green" : "bg-primary"
          }`}
          style={{ width: `${step.progress}%` }}
        />
      </div>

      {/* Percentage */}
      <span
        className={`text-sm font-medium tabular-nums ${
          isComplete ? "text-support-green" : "text-muted-foreground"
        }`}
      >
        {step.progress}%
      </span>
    </div>
  );
}

export default PaymentProgress;
