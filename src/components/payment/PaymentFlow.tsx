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
  Terminal,
  X,
  ExternalLink,
} from 'lucide-react';
import { usePaymentFlow } from '@/hooks/usePaymentFlow';
import { PAYMENT_UI_COPY } from '@/types/payment';
import { getPaymentConfig } from '@/services/payment.service';
import { MobilePaymentFlow } from './MobilePaymentFlow';
import './payment-flow.css';

const IS_DEV = process.env.NODE_ENV === 'development';

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
 */
function DesktopPaymentFlow({
  birdId,
  birdName,
  amountCents,
  wihngoAmountCents = 0,
  onSuccess,
}: PaymentFlowProps) {
  const priceFormatted = `$${(amountCents / 100).toFixed(2)}`;
  const [isDevnet, setIsDevnet] = useState(false);

  // Fetch network from backend config
  useEffect(() => {
    getPaymentConfig()
      .then((config) => {
        setIsDevnet(config.network === 'devnet');
      })
      .catch(() => {
        // Default to mainnet on error
        setIsDevnet(false);
      });
  }, []);

  const {
    state,
    connectWallet,
    disconnectWallet,
    initiatePayment,
    submitTransaction,
    retry,
    isWalletConnected,
    isConnecting,
    formattedAmount,
    isPhantomAvailable,
  } = usePaymentFlow({
    birdId,
    amountCents,
    wihngoAmountCents,
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const handlePayClick = useCallback(async () => {
    if (!isWalletConnected) {
      await connectWallet();
    } else if (state.status === 'wallet_connected') {
      await initiatePayment();
    }
  }, [isWalletConnected, state.status, connectWallet, initiatePayment]);

  const handleTxHashSubmit = useCallback(async (txHash: string) => {
    await submitTransaction(txHash);
  }, [submitTransaction]);

  return (
    <div className="payment-flow">
      {/* Devnet indicator */}
      {isDevnet && (
        <div className="payment-flow__network-badge">
          <span>Test Mode</span>
        </div>
      )}

      {/* Early access notice */}
      <div className="payment-flow__notice">
        <DollarSign className="payment-flow__notice-icon" />
        <span>{PAYMENT_UI_COPY.earlyAccess}</span>
      </div>

      {/* Price display */}
      <div className="payment-flow__price">
        <span className="payment-flow__price-label">Support amount</span>
        <span className="payment-flow__price-value">
          {formattedAmount || priceFormatted}
        </span>
      </div>

      {/* State-based content */}
      {state.status === 'idle' && (
        <IdleState
          onConnect={handlePayClick}
          isConnecting={isConnecting}
          isPhantomAvailable={isPhantomAvailable}
        />
      )}

      {state.status === 'wallet_connected' && (
        <WalletConnectedState
          walletAddress={state.walletAddress}
          onPay={handlePayClick}
          onDisconnect={disconnectWallet}
          isLoading={false}
        />
      )}

      {state.status === 'payment_pending' && (
        <PaymentPendingState
          birdName={birdName}
          amount={formattedAmount || priceFormatted}
          destinationWallet={state.paymentIntent?.destinationWallet || null}
          onSubmitTxHash={handleTxHashSubmit}
        />
      )}

      {state.status === 'payment_submitted' && (
        <PaymentSubmittedState />
      )}

      {state.status === 'payment_confirmed' && (
        <PaymentConfirmedState paymentId={state.paymentIntent?.paymentId} />
      )}

      {state.status === 'payment_failed' && (
        <PaymentFailedState
          error={state.error}
          onRetry={retry}
          onConnectWallet={connectWallet}
        />
      )}

      {/* Help link */}
      {state.status !== 'payment_confirmed' && (
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

  const { digitalDollarsExplainer } = PAYMENT_UI_COPY;

  return (
    <div className="payment-flow__help-wrapper" ref={popoverRef}>
      <button
        className="payment-flow__help"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <HelpCircle className="payment-flow__help-icon" />
        <span>{PAYMENT_UI_COPY.learnMore}</span>
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
            <span>{PAYMENT_UI_COPY.walletButton}</span>
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
          <span>{PAYMENT_UI_COPY.walletConnected}</span>
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
            <span>Preparing payment...</span>
          </>
        ) : (
          <>
            <DollarSign className="payment-flow__button-icon" />
            <span>{PAYMENT_UI_COPY.payButton}</span>
          </>
        )}
      </button>
    </div>
  );
}

function PaymentPendingState({
  birdName,
  amount,
  destinationWallet,
  onSubmitTxHash,
}: {
  birdName: string;
  amount: string;
  destinationWallet: string | null;
  onSubmitTxHash: (txHash: string) => void;
}) {
  const [manualTxHash, setManualTxHash] = useState('');
  const [showDevInput, setShowDevInput] = useState(false);

  const handleSubmit = () => {
    if (manualTxHash.trim()) {
      onSubmitTxHash(manualTxHash.trim());
    }
  };

  return (
    <div className="payment-flow__state">
      <div className="payment-flow__pending">
        <Loader2 className="payment-flow__pending-spinner" />
        <p className="payment-flow__pending-text">
          {PAYMENT_UI_COPY.paymentPending}
        </p>
        <p className="payment-flow__pending-detail">
          Confirm {amount} to support {birdName} in your wallet
        </p>
        {destinationWallet && (
          <p className="payment-flow__pending-wallet">
            Send to: <code>{destinationWallet.slice(0, 8)}...{destinationWallet.slice(-6)}</code>
          </p>
        )}
      </div>

      {/* Dev mode: Manual txHash input */}
      {IS_DEV && (
        <div className="payment-flow__dev">
          <button
            className="payment-flow__dev-toggle"
            onClick={() => setShowDevInput(!showDevInput)}
            type="button"
          >
            <Terminal className="payment-flow__dev-icon" />
            <span>Dev: Manual tx submission</span>
          </button>

          {showDevInput && (
            <div className="payment-flow__dev-input">
              <input
                type="text"
                placeholder="Enter transaction hash..."
                value={manualTxHash}
                onChange={(e) => setManualTxHash(e.target.value)}
                className="payment-flow__dev-field"
              />
              <button
                className="payment-flow__button payment-flow__button--secondary"
                onClick={handleSubmit}
                disabled={!manualTxHash.trim()}
              >
                <ArrowRight className="payment-flow__button-icon" />
                <span>Submit tx hash</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentSubmittedState() {
  return (
    <div className="payment-flow__state">
      <div className="payment-flow__submitted">
        <Loader2 className="payment-flow__submitted-spinner" />
        <p className="payment-flow__submitted-text">
          {PAYMENT_UI_COPY.paymentSubmitted}
        </p>
        <p className="payment-flow__submitted-detail">
          Verifying your payment...
        </p>
      </div>
    </div>
  );
}

function PaymentConfirmedState({ paymentId }: { paymentId?: string }) {
  const claimUrl = paymentId ? `/payments/claim?pi=${paymentId}` : '/payments/claim';

  return (
    <div className="payment-flow__state payment-flow__state--success">
      <div className="payment-flow__confirmed">
        <CheckCircle className="payment-flow__confirmed-icon" />
        <p className="payment-flow__confirmed-text">
          {PAYMENT_UI_COPY.paymentConfirmed}
        </p>

        <div className="payment-flow__claim-notice">
          <AlertTriangle size={16} />
          <span>
            <strong>Your support is not complete until you claim it.</strong>
          </span>
        </div>

        <a
          href={claimUrl}
          className="payment-flow__button payment-flow__button--primary payment-flow__button--large"
          style={{ marginTop: '0.75rem', textDecoration: 'none' }}
        >
          <ArrowRight className="payment-flow__button-icon" />
          <span>Claim your support now</span>
        </a>
      </div>
    </div>
  );
}

function PaymentFailedState({
  error,
  onRetry,
  onConnectWallet,
}: {
  error: string | null;
  onRetry: () => void;
  onConnectWallet?: () => void;
}) {
  const errorLower = error?.toLowerCase() || '';
  const isWalletIssue = errorLower.includes('wallet') || errorLower.includes('connect');
  const isInsufficientBalance = errorLower.includes('insufficient') || errorLower.includes('balance');
  const isUserRejected = errorLower.includes('rejected') || errorLower.includes('cancelled');
  const isNetworkError = errorLower.includes('network') || errorLower.includes('timeout');

  let errorTitle = "We couldn't complete the payment";
  let errorHint = '';

  if (isInsufficientBalance) {
    errorTitle = 'Insufficient USDC balance';
    errorHint = 'Add USDC to your wallet and try again.';
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

  const displayError = error || PAYMENT_UI_COPY.errors.generic;

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
          <span>{PAYMENT_UI_COPY.retry}</span>
        </button>
      )}
    </div>
  );
}

export default PaymentFlow;
