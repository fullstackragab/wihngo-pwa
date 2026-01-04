'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import {
  Wallet,
  DollarSign,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { useSupportFlow } from '@/hooks/useSupportFlow';
import { SUPPORT_UI_COPY } from '@/types/support';
import { usePhantom } from '@/hooks/use-phantom';
import { MobilePaymentFlow } from './MobilePaymentFlow';
import './payment-flow.css';

/**
 * Detect mobile device
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * PaymentFlow — USDC payment component for bird support
 */

interface PaymentFlowProps {
  birdId: string;
  birdName: string;
  amountCents: number;
  wihngoAmountCents?: number;
  onSuccess?: () => void;
}

export function PaymentFlow({
  birdId,
  birdName,
  amountCents,
  wihngoAmountCents = 0,
  onSuccess,
}: PaymentFlowProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Show loading state until device is detected
  if (isMobile === null) {
    return (
      <div className="payment-flow">
        <div className="payment-flow__loading">
          <Loader2 className="payment-flow__loading-spinner" />
        </div>
      </div>
    );
  }

  // On mobile: Show mobile payment flow (QR code / address)
  if (isMobile) {
    return (
      <MobilePaymentFlow
        birdId={birdId}
        birdName={birdName}
        amountCents={amountCents}
        wihngoAmountCents={wihngoAmountCents}
      />
    );
  }

  // Desktop: Full payment flow
  return (
    <DesktopPaymentFlow
      birdId={birdId}
      birdName={birdName}
      amountCents={amountCents}
      wihngoAmountCents={wihngoAmountCents}
      onSuccess={onSuccess}
    />
  );
}

/**
 * DesktopPaymentFlow — Desktop-only payment component
 * Uses the new useSupportFlow hook with correct backend endpoints
 */
function DesktopPaymentFlow({
  birdId,
  birdName,
  amountCents,
  wihngoAmountCents = 0,
  onSuccess,
}: PaymentFlowProps) {
  // Convert cents to USDC (dollars)
  const birdAmount = amountCents / 100;
  const wihngoAmount = wihngoAmountCents / 100;
  const priceFormatted = `$${birdAmount.toFixed(2)}`;

  // Check if Phantom is available
  const { isPhantomInstalled } = usePhantom();

  const {
    state,
    connectWallet,
    disconnectWallet,
    initiateSupport,
    retry,
    isWalletConnected,
    isConnecting,
    isProcessing,
    formattedAmount,
    formattedTotal,
  } = useSupportFlow({
    birdId,
    birdAmount,
    wihngoAmount,
    onSuccess: (intentId, signature) => {
      console.log('[PaymentFlow] Support completed:', intentId, signature);
      onSuccess?.();
    },
    onError: (error, errorCode) => {
      console.error('[PaymentFlow] Support failed:', error, errorCode);
    },
  });

  const handlePayClick = useCallback(async () => {
    if (!isWalletConnected) {
      await connectWallet();
    } else if (state.status === 'wallet_connected') {
      await initiateSupport();
    }
  }, [isWalletConnected, state.status, connectWallet, initiateSupport]);

  // Map new statuses to UI states
  const isIdle = state.status === 'idle';
  const isWalletConnectedState = state.status === 'wallet_connected';
  const isPending = ['preflight', 'creating_intent', 'awaiting_signature'].includes(state.status);
  const isSubmitting = ['submitting', 'confirming'].includes(state.status);
  const isCompleted = state.status === 'completed';
  const isFailed = state.status === 'failed';

  return (
    <div className="payment-flow">
      {/* Early access notice */}
      <div className="payment-flow__notice">
        <DollarSign className="payment-flow__notice-icon" />
        <span>Pay with digital dollars (card payments coming soon)</span>
      </div>

      {/* Price display */}
      <div className="payment-flow__price">
        <span className="payment-flow__price-label">Support amount</span>
        <span className="payment-flow__price-value">
          {formattedTotal || priceFormatted}
        </span>
      </div>

      {/* State-based content */}
      {isIdle && (
        <IdleState
          onConnect={handlePayClick}
          isConnecting={isConnecting}
          isPhantomAvailable={isPhantomInstalled}
        />
      )}

      {isWalletConnectedState && (
        <WalletConnectedState
          walletAddress={state.walletAddress}
          onPay={handlePayClick}
          onDisconnect={disconnectWallet}
          isLoading={isProcessing}
        />
      )}

      {isPending && (
        <SupportPendingState
          birdName={birdName}
          amount={formattedAmount}
          status={state.status}
        />
      )}

      {isSubmitting && (
        <SupportSubmittingState />
      )}

      {isCompleted && (
        <SupportConfirmedState intentId={state.intent?.intentId} />
      )}

      {isFailed && (
        <SupportFailedState
          error={state.error}
          errorCode={state.errorCode}
          onRetry={retry}
          onConnectWallet={connectWallet}
        />
      )}

      {/* Help link */}
      {!isCompleted && (
        <DigitalDollarsHelp />
      )}
    </div>
  );
}

/**
 * Digital Dollars Help — Calm, reassuring explainer
 */
function DigitalDollarsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const { digitalDollarsExplainer } = SUPPORT_UI_COPY;

  return (
    <div className="payment-flow__help-wrapper" ref={popoverRef}>
      <button
        className="payment-flow__help"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <HelpCircle className="payment-flow__help-icon" />
        <span>{SUPPORT_UI_COPY.learnMore}</span>
      </button>

      {isOpen && (
        <div className="payment-flow__explainer">
          <button
            className="payment-flow__explainer-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <h4 className="payment-flow__explainer-title">
            {digitalDollarsExplainer.title}
          </h4>
          <p className="payment-flow__explainer-desc">
            {digitalDollarsExplainer.description}
          </p>

          <ul className="payment-flow__explainer-benefits">
            {digitalDollarsExplainer.benefits.map((benefit, index) => (
              <li key={index} className="payment-flow__explainer-benefit">
                <span className="payment-flow__explainer-icon">{benefit.icon}</span>
                <span>{benefit.text}</span>
              </li>
            ))}
          </ul>

          <p className="payment-flow__explainer-footer">
            {digitalDollarsExplainer.footer}
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// State Components
// ─────────────────────────────────────────────────────────────

function IdleState({
  onConnect,
  isConnecting,
  isPhantomAvailable,
}: {
  onConnect: () => void;
  isConnecting: boolean;
  isPhantomAvailable: boolean;
}) {
  if (!isPhantomAvailable) {
    return (
      <div className="payment-flow__state">
        <div className="payment-flow__install-prompt">
          <p className="payment-flow__install-text">
            You&apos;ll need a digital wallet to pay
          </p>
          <a
            href="https://phantom.app/download"
            target="_blank"
            rel="noopener noreferrer"
            className="payment-flow__button payment-flow__button--phantom"
          >
            <ExternalLink className="payment-flow__button-icon" />
            <span>Get Phantom Wallet</span>
          </a>
          <p className="payment-flow__install-hint">
            Free browser extension &bull; Takes 30 seconds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-flow__state">
      <button
        className="payment-flow__button payment-flow__button--primary"
        onClick={onConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader2 className="payment-flow__button-spinner" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="payment-flow__button-icon" />
            <span>{SUPPORT_UI_COPY.walletButton}</span>
          </>
        )}
      </button>
      <p className="payment-flow__hint">
        Connect your digital wallet to continue
      </p>
    </div>
  );
}

function WalletConnectedState({
  walletAddress,
  onPay,
  onDisconnect,
  isLoading,
}: {
  walletAddress: string | null;
  onPay: () => void;
  onDisconnect: () => void;
  isLoading: boolean;
}) {
  const displayAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <div className="payment-flow__state">
      <div className="payment-flow__wallet-info">
        <div className="payment-flow__wallet-connected">
          <CheckCircle className="payment-flow__wallet-icon" />
          <span>{SUPPORT_UI_COPY.walletConnected}</span>
        </div>
        {displayAddress && (
          <span className="payment-flow__wallet-address">{displayAddress}</span>
        )}
        <button
          className="payment-flow__wallet-disconnect"
          onClick={onDisconnect}
        >
          Disconnect
        </button>
      </div>

      <button
        className="payment-flow__button payment-flow__button--primary"
        onClick={onPay}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="payment-flow__button-spinner" />
            <span>Preparing support...</span>
          </>
        ) : (
          <>
            <DollarSign className="payment-flow__button-icon" />
            <span>{SUPPORT_UI_COPY.supportButton}</span>
          </>
        )}
      </button>
    </div>
  );
}

function SupportPendingState({
  birdName,
  amount,
  status,
}: {
  birdName: string;
  amount: string;
  status: string;
}) {
  // Show different messages based on the specific status
  let message: string = SUPPORT_UI_COPY.supportPending;
  let detail: string = `Confirm ${amount} to support ${birdName} in your wallet`;

  if (status === 'preflight') {
    message = 'Checking...';
    detail = 'Verifying your wallet balance';
  } else if (status === 'creating_intent') {
    message = 'Preparing...';
    detail = 'Setting up your support transaction';
  } else if (status === 'awaiting_signature') {
    message = 'Sign in wallet';
    detail = `Approve ${amount} to support ${birdName}`;
  }

  return (
    <div className="payment-flow__state">
      <div className="payment-flow__pending">
        <Loader2 className="payment-flow__pending-spinner" />
        <p className="payment-flow__pending-text">{message}</p>
        <p className="payment-flow__pending-detail">{detail}</p>
      </div>
    </div>
  );
}

function SupportSubmittingState() {
  return (
    <div className="payment-flow__state">
      <div className="payment-flow__submitted">
        <Loader2 className="payment-flow__submitted-spinner" />
        <p className="payment-flow__submitted-text">
          {SUPPORT_UI_COPY.supportSubmitted}
        </p>
        <p className="payment-flow__submitted-detail">
          Confirming your support on the blockchain...
        </p>
      </div>
    </div>
  );
}

function SupportConfirmedState({ intentId }: { intentId?: string }) {
  return (
    <div className="payment-flow__state payment-flow__state--success">
      <div className="payment-flow__confirmed">
        <CheckCircle className="payment-flow__confirmed-icon" />
        <p className="payment-flow__confirmed-text">
          {SUPPORT_UI_COPY.supportConfirmed}
        </p>
        <p className="payment-flow__confirmed-detail">
          Thank you for supporting this bird!
        </p>
      </div>
    </div>
  );
}

function SupportFailedState({
  error,
  errorCode,
  onRetry,
  onConnectWallet,
}: {
  error: string | null;
  errorCode: string | null;
  onRetry: () => void;
  onConnectWallet?: () => void;
}) {
  const errorLower = error?.toLowerCase() || '';
  const isWalletIssue = errorLower.includes('wallet') || errorLower.includes('connect') || errorCode === 'WALLET_REQUIRED';
  const isInsufficientBalance = errorLower.includes('insufficient') || errorCode === 'INSUFFICIENT_USDC';
  const isInsufficientSol = errorCode === 'INSUFFICIENT_SOL';
  const isUserRejected = errorLower.includes('rejected') || errorLower.includes('cancelled');
  const isNetworkError = errorLower.includes('network') || errorLower.includes('timeout');

  let errorTitle = "We couldn't complete your support";
  let errorHint = '';

  if (isInsufficientBalance) {
    errorTitle = 'Insufficient USDC balance';
    errorHint = 'Add USDC to your wallet and try again.';
  } else if (isInsufficientSol) {
    errorTitle = 'Insufficient SOL for fees';
    errorHint = 'Add a small amount of SOL (~0.01) for transaction fees.';
  } else if (isUserRejected) {
    errorTitle = 'Transaction cancelled';
    errorHint = "No problem — you weren't charged. Try again when ready.";
  } else if (isNetworkError) {
    errorTitle = 'Connection issue';
    errorHint = 'Check your internet connection and try again.';
  } else if (isWalletIssue) {
    errorTitle = 'Wallet disconnected';
    errorHint = 'Please reconnect your wallet to continue.';
  }

  const displayError = error || SUPPORT_UI_COPY.errors.generic;

  return (
    <div className="payment-flow__state">
      <div className="payment-flow__error">
        <AlertCircle className="payment-flow__error-icon" />
        <p className="payment-flow__error-text">{errorTitle}</p>
        <p className="payment-flow__error-detail">{displayError}</p>
        {errorHint && (
          <p className="payment-flow__error-hint">{errorHint}</p>
        )}
      </div>

      {isWalletIssue && onConnectWallet ? (
        <button
          className="payment-flow__button payment-flow__button--primary"
          onClick={onConnectWallet}
        >
          <Wallet className="payment-flow__button-icon" />
          <span>Reconnect wallet</span>
        </button>
      ) : (
        <button
          className="payment-flow__button payment-flow__button--secondary"
          onClick={onRetry}
        >
          <RefreshCw className="payment-flow__button-icon" />
          <span>{SUPPORT_UI_COPY.retry}</span>
        </button>
      )}
    </div>
  );
}

export default PaymentFlow;
