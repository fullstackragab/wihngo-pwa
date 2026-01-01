"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react";

export type IOSPWAStatus = "waiting" | "checking" | "complete" | "failed" | "expired";

interface IOSPWAWaitingProps {
  /**
   * Function to check the current status
   * Returns the status: pending, completed, failed, expired
   */
  onStatusCheck: () => Promise<"pending" | "completed" | "failed" | "expired">;

  /**
   * Called when status becomes complete
   */
  onComplete: () => void;

  /**
   * Called when status expires (timeout)
   */
  onExpired: () => void;

  /**
   * Called when user manually triggers a check
   */
  onManualCheck?: () => void;

  /**
   * Optional: Poll interval in milliseconds (default: 3000)
   */
  pollInterval?: number;

  /**
   * Optional: Maximum number of poll attempts (default: 100 = 5 minutes at 3s interval)
   */
  maxPollAttempts?: number;

  /**
   * Optional: Custom title
   */
  title?: string;

  /**
   * Optional: Custom waiting message
   */
  waitingMessage?: string;
}

/**
 * Component shown while waiting for iOS PWA users to return from Phantom.
 *
 * iOS PWA has unique challenges:
 * - Phantom opens Safari instead of returning to PWA
 * - User must manually return to PWA after approving
 * - This component polls for completion and provides a manual check button
 */
export function IOSPWAWaiting({
  onStatusCheck,
  onComplete,
  onExpired,
  onManualCheck,
  pollInterval = 3000,
  maxPollAttempts = 100,
  title = "Waiting for Phantom",
  waitingMessage = "After approving in Phantom, tap the button below to continue.",
}: IOSPWAWaitingProps) {
  const [status, setStatus] = useState<IOSPWAStatus>("waiting");
  const [checkCount, setCheckCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [isManualChecking, setIsManualChecking] = useState(false);

  // Perform a status check
  const performCheck = useCallback(async (isManual: boolean = false) => {
    if (status === "complete" || status === "failed" || status === "expired") {
      return;
    }

    try {
      if (isManual) {
        setIsManualChecking(true);
      }
      setStatus("checking");
      setLastCheckTime(new Date());

      const result = await onStatusCheck();
      setCheckCount((c) => c + 1);

      switch (result) {
        case "completed":
          setStatus("complete");
          onComplete();
          break;
        case "failed":
          setStatus("failed");
          break;
        case "expired":
          setStatus("expired");
          onExpired();
          break;
        default:
          setStatus("waiting");
          break;
      }
    } catch (error) {
      console.error("Status check failed:", error);
      setStatus("waiting");
    } finally {
      if (isManual) {
        setIsManualChecking(false);
      }
    }
  }, [status, onStatusCheck, onComplete, onExpired]);

  // Auto-poll for status changes
  useEffect(() => {
    if (status !== "waiting" && status !== "checking") {
      return;
    }

    if (checkCount >= maxPollAttempts) {
      setStatus("expired");
      onExpired();
      return;
    }

    const interval = setInterval(() => {
      performCheck(false);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [status, checkCount, maxPollAttempts, pollInterval, performCheck, onExpired]);

  // Handle manual check button
  const handleManualCheck = async () => {
    onManualCheck?.();
    await performCheck(true);
  };

  // Handle retry/start over
  const handleStartOver = () => {
    window.location.reload();
  };

  // Render status icon
  const renderIcon = () => {
    switch (status) {
      case "waiting":
        return (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <LoadingSpinner className="w-8 h-8" />
          </div>
        );
      case "checking":
        return (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        );
      case "complete":
        return (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
        );
      case "failed":
      case "expired":
        return (
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
        );
    }
  };

  // Render status title
  const getStatusTitle = () => {
    switch (status) {
      case "waiting":
        return title;
      case "checking":
        return "Checking status...";
      case "complete":
        return "Approved!";
      case "failed":
        return "Something went wrong";
      case "expired":
        return "Session expired";
    }
  };

  // Render status message
  const getStatusMessage = () => {
    switch (status) {
      case "waiting":
        return waitingMessage;
      case "checking":
        return "Verifying your approval...";
      case "complete":
        return "Redirecting...";
      case "failed":
        return "The transaction was rejected or failed. Please try again.";
      case "expired":
        return "Your session timed out. Please start a new payment.";
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-6">
      {/* Status Icon */}
      <div className="mb-4">{renderIcon()}</div>

      {/* Status Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {getStatusTitle()}
      </h3>

      {/* Status Message */}
      <p className="text-muted-foreground mb-6 max-w-xs">
        {getStatusMessage()}
      </p>

      {/* iOS PWA specific instruction card */}
      {(status === "waiting" || status === "checking") && (
        <Card variant="outlined" padding="md" className="mb-6 bg-secondary/50 text-left max-w-sm">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Using iOS?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                After approving in Phantom, you may need to manually return to this app from your home screen.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Manual Check Button */}
      {(status === "waiting" || status === "checking") && (
        <Button
          onClick={handleManualCheck}
          disabled={isManualChecking}
          isLoading={isManualChecking}
          fullWidth
          className="max-w-xs"
        >
          {isManualChecking ? "Checking..." : "I approved in Phantom"}
        </Button>
      )}

      {/* Retry/Start Over for failed states */}
      {(status === "failed" || status === "expired") && (
        <Button onClick={handleStartOver} fullWidth className="max-w-xs">
          Start Over
        </Button>
      )}

      {/* Status indicator */}
      {(status === "waiting" || status === "checking") && (
        <p className="text-xs text-muted-foreground mt-4">
          {lastCheckTime
            ? `Last checked: ${lastCheckTime.toLocaleTimeString()}`
            : "Checking automatically every few seconds..."}
        </p>
      )}

      {/* Poll count indicator (for debugging) */}
      {process.env.NODE_ENV === "development" && (
        <p className="text-xs text-muted-foreground mt-2">
          Checks: {checkCount}/{maxPollAttempts}
        </p>
      )}
    </div>
  );
}

export default IOSPWAWaiting;
