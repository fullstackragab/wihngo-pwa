"use client";

import { useState, useEffect } from "react";
import { Clock, ExternalLink } from "lucide-react";

interface SubmissionTimeoutProps {
  signature?: string;
  startTime: number;
  network?: "mainnet-beta" | "devnet";
}

/**
 * Shows helpful UI when a transaction takes longer than expected.
 * Displays a warning after 30 seconds and provides a Solscan link after 60 seconds.
 */
export function SubmissionTimeout({
  signature,
  startTime,
  network = "mainnet-beta",
}: SubmissionTimeoutProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const showWarning = elapsed >= 30;
  const showSolscan = elapsed >= 60 && signature;

  if (!showWarning) return null;

  const solscanUrl = signature
    ? `https://solscan.io/tx/${signature}${network === "devnet" ? "?cluster=devnet" : ""}`
    : null;

  return (
    <div className="mt-4 p-4 bg-secondary border border-border rounded-lg">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-foreground/70 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Taking longer than usual ({elapsed}s)
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            The network might be busy. Your payment is being processed.
          </p>
          {showSolscan && solscanUrl && (
            <a
              href={solscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            >
              Check on Solscan <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format elapsed time as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Compact version that just shows elapsed time
 */
export function ElapsedTimer({
  startTime,
  className = "",
}: {
  startTime: number;
  className?: string;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (elapsed < 5) return null;

  return (
    <span className={`text-sm text-muted-foreground tabular-nums ${className}`}>
      {formatTime(elapsed)}
    </span>
  );
}

export default SubmissionTimeout;
