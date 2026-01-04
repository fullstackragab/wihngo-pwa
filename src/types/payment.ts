/**
 * Payment Flow Types — USDC/Solana via Phantom
 *
 * Adapted from ulomira-style payment system for bird support.
 */

/**
 * Payment provider enum (extensible for future providers)
 */
export type PaymentProvider = 'USDC_SOLANA';

/**
 * Payment flow UI states
 *
 * Flow:
 * idle → wallet_connected → payment_pending → payment_submitted → payment_confirmed
 *                                          ↘ payment_failed
 */
export type PaymentFlowStatus =
  | 'idle'                // Initial state, no wallet connected
  | 'wallet_connected'    // Wallet connected, ready to pay
  | 'payment_pending'     // Payment intent created, awaiting user signature
  | 'payment_submitted'   // Transaction signed and sent, awaiting confirmation
  | 'payment_confirmed'   // Backend confirmed payment, access granted
  | 'payment_failed';     // Payment failed (user rejected, insufficient funds, etc.)

/**
 * Payment intent from backend
 * POST /api/payments/intents
 *
 * Supports dual transfers: bird support + optional platform support
 */
export interface PaymentIntent {
  paymentId: string;              // Internal payment ID for tracking
  amountCents: number;            // Bird support amount in USD cents
  wihngoAmountCents?: number;     // Optional platform support amount in USD cents
  currency: string;               // Currency code (USD)
  destinationWallet: string;      // Bird's receiving wallet address
  tokenMint: string;              // USDC token mint address (for verification)
  expiresAt: string;              // ISO timestamp, intent expires after this
  birdId: string;                 // Bird being supported
  birdName?: string;              // For display in wallet
  returnUrl?: string;             // Return URL for mobile flow
}

/**
 * Payment confirmation request
 * POST /api/payments/confirm
 */
export interface PaymentConfirmRequest {
  paymentId: string;              // From PaymentIntent
  txHash: string;                 // Solana transaction signature
}

/**
 * Payment confirmation response
 * POST /api/payments/confirm
 */
export interface PaymentConfirmResponse {
  paymentId: string;
  status: 'confirmed' | 'pending' | 'failed' | 'expired';
  isSuccess: boolean;
  failureReason?: string;
  confirmedAt?: string;
}

/**
 * Payment flow state object
 * Used by usePaymentFlow hook to track UI state.
 */
export interface PaymentFlowState {
  status: PaymentFlowStatus;
  walletAddress: string | null;   // Connected wallet's public key
  paymentIntent: PaymentIntent | null;
  txHash: string | null;          // After user signs
  error: string | null;           // Error message for display
  confirmedAt: string | null;     // When payment was confirmed
}

/**
 * Initial payment flow state
 */
export const INITIAL_PAYMENT_FLOW_STATE: PaymentFlowState = {
  status: 'idle',
  walletAddress: null,
  paymentIntent: null,
  txHash: null,
  error: null,
  confirmedAt: null,
};

/**
 * Payment configuration from backend
 */
export interface PaymentConfig {
  network: string;
  rpcUrl: string;
  usdcMint: string;
  platformWallet: string;
}

/**
 * Public payment intent status (no auth required)
 */
export interface PublicPaymentStatus {
  paymentId: string;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  birdId?: string;
  birdName?: string;
  amountCents: number;
  message?: string;
  confirmedAt?: string;
  claimRequired?: boolean;
  claimUrl?: string;
}

/**
 * Manual payment intent for mobile users
 */
export interface ManualPaymentIntent {
  paymentId: string;
  amountCents: number;
  currency: string;
  network: string;
  destinationAddress: string;
  expiresAt: string;
  claimUrl: string;
  message: string;
}

/**
 * Create manual payment request
 */
export interface CreateManualPaymentRequest {
  birdId: string;
  amountCents: number;
  email: string;
  wihngoAmountCents?: number;
}

/**
 * Claim payment response
 * POST /api/payments/{id}/claim
 */
export interface ClaimPaymentResponse {
  success: boolean;
  paymentId: string;
  birdId: string;
  amountCents: number;
}

/**
 * User-friendly copy for payment UI
 * Avoids crypto jargon per requirements.
 */
export const PAYMENT_UI_COPY = {
  walletButton: 'Connect digital wallet',
  walletConnected: 'Digital wallet connected',
  payButton: 'Pay with digital dollars',
  paymentPending: 'Waiting for payment...',
  paymentSubmitted: 'Confirming payment...',
  paymentConfirmed: 'Payment confirmed',
  paymentFailed: 'Payment failed',
  earlyAccess: 'Pay with digital dollars (card payments coming soon)',
  retry: 'Try again',
  learnMore: 'What are digital dollars?',
  // Digital dollars explainer - calm, reassuring, no crypto jargon
  digitalDollarsExplainer: {
    title: 'Digital dollars',
    description: 'US dollars that you pay digitally — just like using a card or PayPal.',
    benefits: [
      { icon: '💵', text: 'Pegged 1:1 to the US dollar' },
      { icon: '🔒', text: 'Stable (no price changes)' },
      { icon: '⚡', text: 'Instant and secure' },
    ],
    footer: "You're not investing or trading. You're simply supporting a bird.",
  },
  // Error messages
  errors: {
    walletNotConnected: "We couldn't start the payment. Please connect your wallet first.",
    transactionFailed: "The payment didn't go through. Please try again.",
    invalidAmount: "There was a problem with the payment amount. Please refresh and try again.",
    networkError: "Connection issue. Please check your internet and try again.",
    generic: "Something went wrong. Please try again.",
  },
} as const;
