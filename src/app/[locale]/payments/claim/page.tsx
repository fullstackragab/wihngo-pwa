'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Heart,
  LogIn,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {
  claimPayment,
  getPublicPaymentStatus,
} from '@/services/payment.service';
import type { ClaimPaymentResponse, PublicPaymentStatus } from '@/types/payment';
import './claim.css';

/**
 * Payment Claim Page
 *
 * CRITICAL FLOW:
 * 1. User arrives with ?pi=paymentId
 * 2. If not logged in → show login/register (with returnTo)
 * 3. If logged in → auto-call claim API
 * 4. Handle result: success, already_claimed, wrong_user, etc.
 *
 * RULES:
 * - Never auto-grant without explicit claim
 * - Never assume session survived payment
 * - Always allow delayed claim
 */

type ClaimStatus =
  | 'checking_auth'
  | 'needs_login'
  | 'claiming'
  | 'success'
  | 'already_claimed'
  | 'wrong_user'
  | 'not_confirmed'
  | 'not_found'
  | 'expired'
  | 'error';

function ClaimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('pi');

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [status, setStatus] = useState<ClaimStatus>('checking_auth');
  const [claimResult, setClaimResult] = useState<ClaimPaymentResponse | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PublicPaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment info for display
  useEffect(() => {
    if (!paymentId) return;

    async function fetchPaymentInfo() {
      try {
        const info = await getPublicPaymentStatus(paymentId!);
        setPaymentInfo(info);
      } catch {
        // Non-critical, just for display
      }
    }

    fetchPaymentInfo();
  }, [paymentId]);

  // Check auth state and proceed
  useEffect(() => {
    if (authLoading) {
      setStatus('checking_auth');
      return;
    }

    if (!paymentId) {
      setStatus('error');
      setError('Missing payment reference. Please use the link from your payment confirmation.');
      return;
    }

    if (!isAuthenticated) {
      setStatus('needs_login');
    }
  }, [authLoading, isAuthenticated, paymentId]);

  // Auto-claim when authenticated
  const doClaim = useCallback(async () => {
    if (!paymentId || !isAuthenticated) return;

    setStatus('claiming');

    try {
      const result = await claimPayment(paymentId);
      setClaimResult(result);
      setStatus('success');
    } catch (err) {
      console.error('[Claim] Error:', err);

      let errorMessage = 'Unable to claim this payment.';

      const apiErr = err as { data?: { error?: string }; message?: string };
      if (apiErr.data?.error) {
        errorMessage = apiErr.data.error;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      const lowerMessage = errorMessage.toLowerCase();

      if (lowerMessage.includes('already claimed')) {
        setStatus('already_claimed');
      } else if (lowerMessage.includes('not confirmed')) {
        setStatus('not_confirmed');
      } else if (lowerMessage.includes('not found')) {
        setStatus('not_found');
      } else if (lowerMessage.includes('expired')) {
        setStatus('expired');
      } else {
        setStatus('error');
        setError(errorMessage);
      }
    }
  }, [paymentId, isAuthenticated]);

  // Trigger claim when auth is confirmed
  useEffect(() => {
    if (!authLoading && isAuthenticated && paymentId && status === 'needs_login') {
      doClaim();
    } else if (!authLoading && isAuthenticated && paymentId && status === 'checking_auth') {
      doClaim();
    }
  }, [authLoading, isAuthenticated, paymentId, status, doClaim]);

  // Navigate to bird
  const goToBird = useCallback(() => {
    const birdId = claimResult?.birdId || paymentInfo?.birdId;

    if (birdId) {
      router.push(`/birds/${birdId}`);
    } else {
      router.push('/birds');
    }
  }, [claimResult, paymentInfo, router]);

  // Build return URL for login
  const returnUrl = paymentId ? `/payments/claim?pi=${paymentId}` : '/payments/claim';

  return (
    <div className="claim-page">
      <div className="claim-page__card">
        {/* Checking Auth */}
        {status === 'checking_auth' && (
          <div className="claim-page__status">
            <Loader2 className="claim-page__icon claim-page__icon--loading" />
            <h1 className="claim-page__title">Checking your account...</h1>
          </div>
        )}

        {/* Needs Login */}
        {status === 'needs_login' && (
          <div className="claim-page__status">
            <LogIn className="claim-page__icon claim-page__icon--info" />
            <h1 className="claim-page__title">Claim Your Support</h1>
            {paymentInfo && (
              <p className="claim-page__subtitle">
                Your support for <strong>{paymentInfo.birdName}</strong> is ready.
              </p>
            )}
            <p className="claim-page__text">
              Log in or create an account to claim your support.
            </p>
            <div className="claim-page__actions">
              <Link
                href={`/auth/login?returnTo=${encodeURIComponent(returnUrl)}`}
                className="claim-page__btn claim-page__btn--primary"
              >
                <LogIn size={18} />
                Log in
              </Link>
              <Link
                href={`/auth/signup?returnTo=${encodeURIComponent(returnUrl)}`}
                className="claim-page__btn claim-page__btn--secondary"
              >
                <UserPlus size={18} />
                Create account
              </Link>
            </div>
            <p className="claim-page__note">
              Your support is safely stored. You can return later.
            </p>
          </div>
        )}

        {/* Claiming */}
        {status === 'claiming' && (
          <div className="claim-page__status">
            <Loader2 className="claim-page__icon claim-page__icon--loading" />
            <h1 className="claim-page__title">Claiming your support...</h1>
            <p className="claim-page__subtitle">Just a moment.</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="claim-page__status">
            <CheckCircle className="claim-page__icon claim-page__icon--success" />
            <h1 className="claim-page__title">Support claimed!</h1>
            <p className="claim-page__subtitle">
              {paymentInfo?.birdName ? (
                <>Your support for <strong>{paymentInfo.birdName}</strong> is complete!</>
              ) : (
                'Your support has been recorded. Thank you!'
              )}
            </p>
            <div className="claim-page__actions">
              <button
                onClick={goToBird}
                className="claim-page__btn claim-page__btn--primary"
              >
                <Heart size={18} />
                View bird profile
              </button>
              <Link href="/birds" className="claim-page__btn claim-page__btn--secondary">
                Browse birds
              </Link>
            </div>
          </div>
        )}

        {/* Already Claimed */}
        {status === 'already_claimed' && (
          <div className="claim-page__status">
            <CheckCircle className="claim-page__icon claim-page__icon--success" />
            <h1 className="claim-page__title">Already claimed</h1>
            <p className="claim-page__subtitle">
              {paymentInfo?.birdName
                ? `You already claimed support for "${paymentInfo.birdName}".`
                : 'You already claimed this support.'}
            </p>
            <div className="claim-page__actions">
              <button
                onClick={goToBird}
                className="claim-page__btn claim-page__btn--primary"
              >
                <Heart size={18} />
                View bird profile
              </button>
              <Link href="/birds" className="claim-page__btn claim-page__btn--secondary">
                Browse birds
              </Link>
            </div>
          </div>
        )}

        {/* Wrong User */}
        {status === 'wrong_user' && (
          <div className="claim-page__status">
            <AlertTriangle className="claim-page__icon claim-page__icon--warning" />
            <h1 className="claim-page__title">Wrong account</h1>
            <p className="claim-page__subtitle">
              This payment was started by a different account.
            </p>
            <p className="claim-page__text">
              You are logged in as <strong>{user?.email}</strong>.
              Please log out and sign in with the account you used to make this payment.
            </p>
            <div className="claim-page__actions">
              <Link href="/auth/login" className="claim-page__btn claim-page__btn--primary">
                Switch account
              </Link>
              <Link href="/about" className="claim-page__btn claim-page__btn--secondary">
                Contact support
              </Link>
            </div>
          </div>
        )}

        {/* Not Confirmed */}
        {status === 'not_confirmed' && (
          <div className="claim-page__status">
            <AlertTriangle className="claim-page__icon claim-page__icon--warning" />
            <h1 className="claim-page__title">Payment not confirmed</h1>
            <p className="claim-page__subtitle">
              We haven&apos;t received confirmation of your payment yet.
            </p>
            <p className="claim-page__text">
              If you completed the payment, please wait a few minutes and try again.
              Blockchain confirmations can take time.
            </p>
            <div className="claim-page__actions">
              <button
                onClick={() => doClaim()}
                className="claim-page__btn claim-page__btn--primary"
              >
                Try again
              </button>
              <Link href="/about" className="claim-page__btn claim-page__btn--secondary">
                Contact support
              </Link>
            </div>
          </div>
        )}

        {/* Not Found */}
        {status === 'not_found' && (
          <div className="claim-page__status">
            <XCircle className="claim-page__icon claim-page__icon--error" />
            <h1 className="claim-page__title">Payment not found</h1>
            <p className="claim-page__subtitle">
              We couldn&apos;t find this payment. The link may be invalid.
            </p>
            <div className="claim-page__actions">
              <Link href="/birds" className="claim-page__btn claim-page__btn--primary">
                Browse birds
              </Link>
              <Link href="/about" className="claim-page__btn claim-page__btn--secondary">
                Contact support
              </Link>
            </div>
          </div>
        )}

        {/* Expired */}
        {status === 'expired' && (
          <div className="claim-page__status">
            <XCircle className="claim-page__icon claim-page__icon--warning" />
            <h1 className="claim-page__title">Payment expired</h1>
            <p className="claim-page__subtitle">
              This payment session has expired. Please start a new support.
            </p>
            <div className="claim-page__actions">
              {paymentInfo?.birdId && (
                <Link
                  href={`/birds/${paymentInfo.birdId}/support`}
                  className="claim-page__btn claim-page__btn--primary"
                >
                  Try again
                </Link>
              )}
              <Link href="/birds" className="claim-page__btn claim-page__btn--secondary">
                Browse birds
              </Link>
            </div>
          </div>
        )}

        {/* Generic Error */}
        {status === 'error' && (
          <div className="claim-page__status">
            <XCircle className="claim-page__icon claim-page__icon--error" />
            <h1 className="claim-page__title">Something went wrong</h1>
            <p className="claim-page__subtitle">{error}</p>
            <div className="claim-page__actions">
              <Link href="/birds" className="claim-page__btn claim-page__btn--primary">
                Browse birds
              </Link>
              <Link href="/about" className="claim-page__btn claim-page__btn--secondary">
                Contact support
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="claim-page">
          <div className="claim-page__card">
            <div className="claim-page__status">
              <Loader2 className="claim-page__icon claim-page__icon--loading" />
              <h1 className="claim-page__title">Loading...</h1>
            </div>
          </div>
        </div>
      }
    >
      <ClaimContent />
    </Suspense>
  );
}
