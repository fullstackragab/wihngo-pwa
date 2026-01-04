'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  Heart,
  LogIn,
  RefreshCw,
  Shield,
  Info,
} from 'lucide-react';
import {
  getPublicPaymentStatus,
  createManualPaymentIntent,
} from '@/services/payment.service';
import type { ManualPaymentIntent, PublicPaymentStatus } from '@/types/payment';
import { useAuth } from '@/contexts/auth-context';
import { QRCodeSVG } from 'qrcode.react';
import './manual-payment.css';

/**
 * Manual Payment Page — Mobile-Safe Crypto Payments
 *
 * Shows address + QR code for manual USDC transfer.
 * No wallet deep links, works in any mobile browser.
 */

type PageStatus = 'collect_email' | 'loading' | 'ready' | 'pending' | 'confirmed' | 'expired' | 'failed' | 'error';

interface PaymentInfo extends ManualPaymentIntent {
  birdId: string;
  amountUsdc: number;
}

function ManualPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const birdIdParam = searchParams.get('birdId');
  const amountCentsParam = searchParams.get('amountCents');
  const wihngoAmountCentsParam = searchParams.get('wihngoAmountCents');
  const existingPaymentId = searchParams.get('pi');

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<PageStatus>('loading');
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PublicPaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedClaimUrl, setCopiedClaimUrl] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const paymentInitiatedRef = useRef(false);

  const amountCents = amountCentsParam ? parseInt(amountCentsParam, 10) : 0;
  const wihngoAmountCents = wihngoAmountCentsParam ? parseInt(wihngoAmountCentsParam, 10) : 0;

  // Create payment intent with provided email
  const createPaymentWithEmail = useCallback(async (emailToUse: string) => {
    if (!birdIdParam || !amountCents) {
      setStatus('error');
      setError('Missing payment details. Please try again from the bird page.');
      return;
    }

    setStatus('loading');
    setIsCreating(true);

    try {
      const intent = await createManualPaymentIntent({
        birdId: birdIdParam,
        amountCents,
        email: emailToUse,
        wihngoAmountCents,
      });

      const paymentInfo: PaymentInfo = {
        ...intent,
        birdId: birdIdParam,
        amountUsdc: intent.amountCents / 100,
      };

      setPayment(paymentInfo);
      setStatus('ready');

      // Update URL with payment ID
      const url = new URL(window.location.href);
      url.searchParams.set('pi', intent.paymentId);
      url.searchParams.delete('birdId');
      url.searchParams.delete('amountCents');
      url.searchParams.delete('wihngoAmountCents');
      window.history.replaceState({}, '', url.toString());
    } catch (err) {
      console.error('[ManualPayment] Error creating intent:', err);
      setStatus('error');
      setError('Unable to create payment. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [birdIdParam, amountCents, wihngoAmountCents]);

  // Initialize page state
  useEffect(() => {
    if (authLoading) return;

    if (existingPaymentId) {
      setStatus('pending');
      return;
    }

    if (!birdIdParam || !amountCents) {
      setStatus('error');
      setError('Missing payment details. Please try again from the bird page.');
      return;
    }

    if (paymentInitiatedRef.current) return;

    if (isAuthenticated && user?.email) {
      paymentInitiatedRef.current = true;
      createPaymentWithEmail(user.email);
    } else {
      setStatus('collect_email');
    }
  }, [birdIdParam, amountCents, existingPaymentId, authLoading, isAuthenticated, user?.email, createPaymentWithEmail]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    createPaymentWithEmail(email.trim());
  };

  // Poll for payment status
  const pollStatus = useCallback(async () => {
    const paymentId = existingPaymentId || payment?.paymentId;
    if (!paymentId) return;

    try {
      const result = await getPublicPaymentStatus(paymentId);
      setPaymentStatus(result);

      if (result.status === 'confirmed') {
        setStatus('confirmed');
      } else if (result.status === 'expired') {
        setStatus('expired');
      } else if (result.status === 'failed') {
        setStatus('failed');
      }
    } catch (err) {
      console.error('[ManualPayment] Error polling status:', err);
    }
  }, [existingPaymentId, payment?.paymentId]);

  // Start polling when ready or pending
  useEffect(() => {
    if (status !== 'ready' && status !== 'pending') return;

    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [status, pollStatus]);

  // Countdown timer
  useEffect(() => {
    if (!payment?.expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(payment.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setStatus('expired');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [payment?.expiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = useCallback(async () => {
    if (!payment?.destinationAddress) return;

    try {
      await navigator.clipboard.writeText(payment.destinationAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = payment.destinationAddress;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [payment?.destinationAddress]);

  const claimUrl = payment?.claimUrl
    || (existingPaymentId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/payments/claim?pi=${existingPaymentId}` : '')
    || (paymentStatus?.claimUrl ?? '');

  const handleCopyClaimUrl = useCallback(async () => {
    if (!claimUrl) return;

    try {
      await navigator.clipboard.writeText(claimUrl);
      setCopiedClaimUrl(true);
      setTimeout(() => setCopiedClaimUrl(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = claimUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedClaimUrl(true);
      setTimeout(() => setCopiedClaimUrl(false), 2000);
    }
  }, [claimUrl]);

  const handleRetry = useCallback(() => {
    const birdId = payment?.birdId || paymentStatus?.birdId;
    if (birdId) {
      router.push(`/birds/${birdId}/support`);
    }
  }, [payment?.birdId, paymentStatus?.birdId, router]);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Generate Solana Pay QR data
  const qrData = payment
    ? `solana:${payment.destinationAddress}?amount=${payment.amountUsdc}&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&label=Wihngo&message=Bird%20Support`
    : '';

  return (
    <div className="manual-payment">
      <div className="manual-payment__card">
        {/* Email Collection State */}
        {status === 'collect_email' && (
          <div className="manual-payment__content">
            <h1 className="manual-payment__title">Enter your email</h1>
            <p className="manual-payment__subtitle">
              We&apos;ll use this to link your support so you can claim it later.
            </p>
            <form onSubmit={handleCreatePayment} className="manual-payment__email-form">
              <div className="manual-payment__email-field">
                <label htmlFor="email" className="manual-payment__email-label">Email address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`manual-payment__email-input ${emailError ? 'manual-payment__email-input--error' : ''}`}
                  disabled={isCreating}
                  autoFocus
                />
                {emailError && (
                  <p className="manual-payment__email-error">{emailError}</p>
                )}
              </div>
              <button
                type="submit"
                className="manual-payment__btn manual-payment__btn--primary manual-payment__btn--full"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="manual-payment__btn-spinner" />
                    Setting up payment...
                  </>
                ) : (
                  'Continue to payment'
                )}
              </button>
            </form>
            <p className="manual-payment__note">
              Already have an account? <Link href={`/auth/login?returnTo=/payments/manual?birdId=${birdIdParam}&amountCents=${amountCents}`}>Log in</Link> for faster checkout.
            </p>
          </div>
        )}

        {/* Loading State */}
        {status === 'loading' && (
          <div className="manual-payment__status">
            <Loader2 className="manual-payment__icon manual-payment__icon--loading" />
            <h1 className="manual-payment__title">Setting up payment...</h1>
            <p className="manual-payment__subtitle">Please wait while we prepare your payment.</p>
          </div>
        )}

        {/* Ready / Pending State */}
        {(status === 'ready' || status === 'pending') && payment && (
          <div className="manual-payment__content">
            {/* Amount */}
            <div className="manual-payment__amount-section">
              <p className="manual-payment__amount-label">Send exactly</p>
              <p className="manual-payment__amount">
                {payment.amountUsdc.toFixed(2)} <span>USDC</span>
              </p>
              <p className="manual-payment__amount-usd">
                ({formatPrice(payment.amountCents)} USD)
              </p>
            </div>

            {/* Bird info */}
            {paymentStatus?.birdName && (
              <p className="manual-payment__bird-title">
                to support <strong>{paymentStatus.birdName}</strong>
              </p>
            )}

            {/* QR Code */}
            <div className="manual-payment__qr-container">
              <QRCodeSVG value={qrData} size={200} />
              <p className="manual-payment__qr-hint">
                Scan with your Phantom or Solana wallet
              </p>
            </div>

            {/* Network badge */}
            <div className="manual-payment__network">
              <span className="manual-payment__network-badge">Solana Network</span>
            </div>

            {/* Address */}
            <div className="manual-payment__address-section">
              <p className="manual-payment__address-label">Or send to this address:</p>
              <div className="manual-payment__address-box">
                <code className="manual-payment__address">
                  {payment.destinationAddress}
                </code>
                <button
                  className="manual-payment__copy-btn"
                  onClick={handleCopy}
                  aria-label="Copy address"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Trust explainer */}
            <div className="manual-payment__trust-section">
              <div className="manual-payment__trust-badge">
                <Shield size={16} />
                <span>Secure one-time address</span>
              </div>
              <p className="manual-payment__trust-text">
                This unique address was created specifically for your support and belongs to Wihngo.
              </p>
              <div className="manual-payment__trust-note">
                <Info size={14} />
                <span>
                  Your wallet may show this as a &quot;new&quot; or &quot;unused&quot; address — this is normal and safe.
                </span>
              </div>
            </div>

            {/* Warning */}
            <div className="manual-payment__warning">
              <AlertTriangle size={16} />
              <span>
                Only send USDC on the <strong>Solana</strong> network.
                Sending other tokens or networks may result in loss.
              </span>
            </div>

            {/* Timer */}
            {timeRemaining !== null && timeRemaining > 0 && (
              <div className="manual-payment__timer">
                <Clock size={16} />
                <span>
                  Expires in <strong>{formatTime(timeRemaining)}</strong>
                </span>
              </div>
            )}

            {/* Status indicator */}
            <div className="manual-payment__waiting">
              <Loader2 className="manual-payment__waiting-spinner" />
              <span>Waiting for payment...</span>
            </div>

            <p className="manual-payment__auto-update">
              This page will update automatically when payment is confirmed.
            </p>

            {/* Claim URL */}
            {claimUrl && (
              <div className="manual-payment__claim-url-section manual-payment__claim-url-section--waiting">
                <p className="manual-payment__claim-url-label">
                  <strong>Save this link now</strong> — you&apos;ll need it to claim your support after payment:
                </p>
                <div className="manual-payment__claim-url-box">
                  <code className="manual-payment__claim-url">
                    {claimUrl}
                  </code>
                  <button
                    className="manual-payment__copy-btn"
                    onClick={handleCopyClaimUrl}
                    aria-label="Copy claim URL"
                  >
                    {copiedClaimUrl ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                {copiedClaimUrl && (
                  <p className="manual-payment__claim-url-hint">Link copied!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Confirmed State */}
        {status === 'confirmed' && paymentStatus && (
          <div className="manual-payment__status">
            <CheckCircle className="manual-payment__icon manual-payment__icon--success" />
            <h1 className="manual-payment__title">Payment confirmed</h1>
            <p className="manual-payment__subtitle">
              Your support for <strong>{paymentStatus.birdName}</strong> has been received.
            </p>

            <div className="manual-payment__claim-notice">
              <AlertTriangle size={18} />
              <span>
                <strong>Your support is not complete until you claim it.</strong>
              </span>
            </div>

            <div className="manual-payment__actions">
              <Link
                href={`/payments/claim?pi=${paymentStatus.paymentId}`}
                className="manual-payment__btn manual-payment__btn--primary manual-payment__btn--large"
              >
                <Heart size={20} />
                Claim your support now
              </Link>
            </div>

            {/* Claim URL Section */}
            <div className="manual-payment__claim-url-section manual-payment__claim-url-section--prominent">
              <p className="manual-payment__claim-url-label">
                <strong>Save this link</strong> — you&apos;ll need it to claim your support:
              </p>
              <div className="manual-payment__claim-url-box">
                <code className="manual-payment__claim-url">
                  {claimUrl}
                </code>
                <button
                  className="manual-payment__copy-btn"
                  onClick={handleCopyClaimUrl}
                  aria-label="Copy claim URL"
                >
                  {copiedClaimUrl ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="manual-payment__claim-url-hint">
                {copiedClaimUrl ? 'Link copied!' : 'Click the button to copy this link'}
              </p>
            </div>

            <p className="manual-payment__note">
              Your payment is safely stored. You can return and claim it anytime using the link above.
            </p>
          </div>
        )}

        {/* Expired State */}
        {status === 'expired' && (
          <div className="manual-payment__status">
            <XCircle className="manual-payment__icon manual-payment__icon--warning" />
            <h1 className="manual-payment__title">Payment expired</h1>
            <p className="manual-payment__subtitle">
              This payment session has expired. Please start a new support.
            </p>
            <div className="manual-payment__actions">
              <button
                onClick={handleRetry}
                className="manual-payment__btn manual-payment__btn--primary"
              >
                <RefreshCw size={18} />
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Failed State */}
        {status === 'failed' && (
          <div className="manual-payment__status">
            <XCircle className="manual-payment__icon manual-payment__icon--error" />
            <h1 className="manual-payment__title">Payment failed</h1>
            <p className="manual-payment__subtitle">
              {paymentStatus?.message || 'Something went wrong with this payment.'}
            </p>
            <div className="manual-payment__actions">
              <button
                onClick={handleRetry}
                className="manual-payment__btn manual-payment__btn--primary"
              >
                <RefreshCw size={18} />
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="manual-payment__status">
            <XCircle className="manual-payment__icon manual-payment__icon--error" />
            <h1 className="manual-payment__title">Something went wrong</h1>
            <p className="manual-payment__subtitle">{error}</p>
            <div className="manual-payment__actions">
              <Link href="/birds" className="manual-payment__btn manual-payment__btn--primary">
                Browse birds
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManualPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="manual-payment">
          <div className="manual-payment__card">
            <div className="manual-payment__status">
              <Loader2 className="manual-payment__icon manual-payment__icon--loading" />
              <h1 className="manual-payment__title">Loading...</h1>
            </div>
          </div>
        </div>
      }
    >
      <ManualPaymentContent />
    </Suspense>
  );
}
