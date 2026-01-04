'use client';

import { Smartphone, QrCode, ArrowRight, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import './mobile-payment-flow.css';

/**
 * MobilePaymentFlow — Mobile Payment Options
 *
 * Shown on mobile instead of Phantom wallet integration.
 * Offers manual payment via QR code / address.
 *
 * Flow:
 * 1. User taps "Pay with QR Code"
 * 2. Redirected to /payments/manual with birdId
 * 3. Manual payment page shows address + QR
 * 4. User sends USDC from their wallet app
 * 5. Backend confirms automatically
 */

interface MobilePaymentFlowProps {
  birdId: string;
  birdName: string;
  amountCents: number;
  wihngoAmountCents?: number;
}

export function MobilePaymentFlow({
  birdId,
  birdName,
  amountCents,
  wihngoAmountCents = 0,
}: MobilePaymentFlowProps) {
  const router = useRouter();
  const priceFormatted = `$${(amountCents / 100).toFixed(2)}`;

  const handleStartPayment = useCallback(() => {
    const params = new URLSearchParams({
      birdId,
      amountCents: amountCents.toString(),
    });
    if (wihngoAmountCents > 0) {
      params.set('wihngoAmountCents', wihngoAmountCents.toString());
    }
    router.push(`/payments/manual?${params.toString()}`);
  }, [router, birdId, amountCents, wihngoAmountCents]);

  return (
    <div className="mobile-payment-flow">
      {/* Header */}
      <div className="mobile-payment-flow__header">
        <Smartphone className="mobile-payment-flow__header-icon" />
        <h3 className="mobile-payment-flow__title">Mobile Payment</h3>
      </div>

      {/* Bird info */}
      <div className="mobile-payment-flow__bird-info">
        <span className="mobile-payment-flow__bird-name">{birdName}</span>
        <span className="mobile-payment-flow__bird-price">{priceFormatted}</span>
      </div>

      {/* Explanation */}
      <p className="mobile-payment-flow__text">
        Pay using your Solana wallet app. We&apos;ll show you a QR code and address to send USDC.
      </p>

      {/* Primary CTA */}
      <button
        className="mobile-payment-flow__btn mobile-payment-flow__btn--primary"
        onClick={handleStartPayment}
      >
        <QrCode size={20} />
        <span>Pay with QR Code</span>
        <ArrowRight size={18} />
      </button>

      {/* How it works */}
      <div className="mobile-payment-flow__steps">
        <p className="mobile-payment-flow__steps-title">How it works:</p>
        <ol className="mobile-payment-flow__steps-list">
          <li>Scan QR code with your Phantom or Solana wallet</li>
          <li>Confirm the USDC transfer in your wallet</li>
          <li>Payment confirms automatically</li>
        </ol>
      </div>

      {/* Wallet requirement note */}
      <div className="mobile-payment-flow__note">
        <Wallet size={16} />
        <span>Requires a Solana wallet app with USDC</span>
      </div>
    </div>
  );
}

export default MobilePaymentFlow;
