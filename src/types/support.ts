// Support Types - Aligned with Backend API
// Bird money is sacred: 100% goes to bird owner
// Wihngo support is optional, transparent, and additive

export type SupportIntentStatus =
  | "Pending"
  | "AwaitingConfirmation"
  | "Processing"
  | "Confirming"
  | "Completed"
  | "Failed"
  | "Expired"
  | "Cancelled";

export const TERMINAL_STATUSES: SupportIntentStatus[] = [
  "Completed",
  "Failed",
  "Expired",
  "Cancelled",
];

export const SUCCESS_STATUSES: SupportIntentStatus[] = ["Completed"];

// Create Support Intent - Request to backend
export interface CreateSupportIntentRequest {
  birdId: string;
  birdAmount: number;
  wihngoSupportAmount: number;
  currency: "USDC";
}

// Support Intent - Full response from backend
export interface SupportIntent {
  intentId: string;
  birdId: string;
  birdName: string;
  recipientUserId: string;
  recipientName: string;
  birdWalletAddress: string;
  wihngoWalletAddress: string | null;
  birdAmount: number;
  wihngoSupportAmount: number;
  totalAmount: number;
  currency: string;
  usdcMintAddress: string;
  status: SupportIntentStatus;
  serializedTransaction: string;
  solanaSignature?: string;
  expiresAt: string;
  createdAt: string;
}

// Mapped response for frontend convenience
export interface SupportIntentResponse {
  intentId: string;
  birdWallet: string | null;
  wihngoWallet: string | null;
  usdcMint: string;
  serializedTransaction: string;
  expiresAt: string;
}

// Submit signed transaction
export interface SubmitSupportRequest {
  signedTransaction: string;
}

export interface SubmitSupportResponse {
  intentId: string;
  status: SupportIntentStatus;
  solanaSignature?: string;
  message?: string;
}

// Preflight check before support
export interface PreflightRequest {
  birdId: string;
  birdAmount: number;
  wihngoSupportAmount: number;
  walletAddress?: string; // Connected Phantom wallet address
}

export interface PreflightResponse {
  canSupport: boolean;
  hasWallet: boolean;
  usdcBalance: number;
  solBalance: number;
  birdAmount: number;
  wihngoSupportAmount: number;
  totalUsdcRequired: number;
  solRequired: number;
  errorCode?: string;
  message?: string;
  bird: {
    birdId: string;
    name: string;
    imageUrl?: string;
  };
  recipient: {
    userId: string;
    name: string;
    walletAddress?: string;
  };
  usdcMintAddress: string;
  wihngoWalletAddress: string;
}

// On-chain balance check (public endpoint)
export interface OnChainBalanceResponse {
  walletAddress: string;
  solBalance: number;
  usdcBalance: number;
  minimumSolRequired: number;
}

// Support status polling
export interface SupportStatus {
  intentId: string;
  status: SupportIntentStatus;
  birdAmount: number;
  wihngoSupportAmount: number;
  totalAmount: number;
  solanaSignature?: string;
  createdAt: string;
  confirmedAt?: string;
}

// Support history
export interface SupportHistoryItem {
  supportId: string;
  type: "P2P" | "BIRD_SUPPORT";
  status: SupportIntentStatus;
  amount: number;
  currency: string;
  createdAt: string;
  otherParty: {
    userId: string;
    name: string;
    profileImage?: string;
  };
  bird?: {
    birdId: string;
    name: string;
    imageUrl?: string;
  };
}

export interface SupportHistoryResponse {
  items: SupportHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Wallet linking
export interface LinkWalletRequest {
  publicKey: string;
}

export interface LinkedWallet {
  walletId: string;
  publicKey: string;
  isPrimary: boolean;
  linkedAt: string;
}

// User balance (authenticated)
export interface UserBalance {
  balanceUsdc: number;
  availableUsdc: number;
  pendingUsdc: number;
  hasGas: boolean;
  walletAddress: string;
}

// Constants
export const PRESET_BIRD_AMOUNTS = [1, 3, 5] as const;
export type PresetBirdAmount = (typeof PRESET_BIRD_AMOUNTS)[number];

export const DEFAULT_WIHNGO_SUPPORT = 0.05;
export const MIN_WIHNGO_SUPPORT = 0.05;
export const MIN_BIRD_AMOUNT = 0.01;
export const MAX_BIRD_AMOUNT = 1000;
export const MINIMUM_SOL_FOR_GAS = 0.005;

// ============================================
// WEEKLY CAP ELIGIBILITY (Caretaker Weekly Limit)
// ============================================

/**
 * Weekly eligibility response for a caretaker (user receiving support)
 * Used to enforce: "One user = one wallet = capped baseline support"
 */
export interface WeeklyEligibilityResponse {
  /** User ID of the caretaker */
  userId: string;
  /** Maximum baseline support allowed per week (e.g., 5 USDC) */
  weeklyCap: number;
  /** Total baseline support received this week */
  receivedThisWeek: number;
  /** Remaining allowance for this week */
  remaining: number;
  /** ISO week identifier (YYYY-WW format) */
  weekId: string;
  /** Whether caretaker can receive baseline support (remaining > 0) */
  canReceiveBaseline: boolean;
  /** Whether caretaker has a linked wallet */
  hasWallet: boolean;
  /** Caretaker's wallet address */
  walletAddress?: string;
  /** Caretaker's display name */
  caretakerName?: string;
}

/**
 * Record a support transaction (after blockchain confirmation)
 */
export interface RecordSupportRequest {
  /** Solana transaction signature */
  txSignature: string;
  /** Transaction type: baseline counts toward cap, gift does not */
  type?: SupportType;
  /** Amount in USDC */
  amount: number;
  /** Recipient user ID */
  toUserId: string;
  /** Optional bird reference */
  birdId?: string;
}

/**
 * Support transaction types
 * - baseline: Counts toward weekly cap
 * - gift: One-time gift, bypasses weekly cap
 */
export type SupportType = "baseline" | "gift";

/**
 * Gift support request payload
 */
export interface GiftSupportRequest {
  type: "gift";
  amount: number;
  /** Optional bird reference (for display purposes only) */
  birdId?: string;
}

// Gift amount presets
export const PRESET_GIFT_AMOUNTS = [5, 20, 100] as const;
export type PresetGiftAmount = (typeof PRESET_GIFT_AMOUNTS)[number];

// ============================================
// LEGACY EXPORTS
// ============================================

// Legacy exports for backwards compatibility
export type TransactionConfirmation = {
  type: "BIRD" | "WIHNGO";
  signature: string;
};

export type ConfirmSupportRequest = {
  intentId: string;
  transactions: TransactionConfirmation[];
};

export type ConfirmSupportResponse = {
  success: boolean;
  message: string;
};

// Alias for backwards compatibility
export type BalanceCheckResponse = OnChainBalanceResponse;

// UI Copy - User-friendly messages (avoids crypto jargon)
export const SUPPORT_UI_COPY = {
  walletButton: 'Connect digital wallet',
  walletConnected: 'Wallet connected',
  supportButton: 'Support with digital dollars',
  supportPending: 'Waiting for approval...',
  supportSubmitted: 'Confirming support...',
  supportConfirmed: 'Support confirmed!',
  supportFailed: 'Support failed',
  retry: 'Try again',
  learnMore: 'What are digital dollars?',
  earlyAccess: 'Pay with digital dollars (card payments coming soon)',
  digitalDollarsExplainer: {
    title: 'What are digital dollars?',
    description: 'Digital dollars (USDC) are a modern way to send money online. They work just like regular dollars but move instantly and directly to who you\'re supporting.',
    benefits: [
      { icon: '💨', text: 'Instant transfers - no waiting days for banks' },
      { icon: '🎯', text: '100% goes directly to who you support' },
      { icon: '🔒', text: 'Secure and transparent on the blockchain' },
    ],
    footer: 'You\'ll need a Phantom wallet with USDC to pay. Card payments coming soon!',
  },
  errors: {
    walletNotConnected: 'Please connect your wallet first.',
    transactionFailed: 'The transaction didn\'t go through. Please try again.',
    invalidAmount: 'Invalid amount. Please check and try again.',
    networkError: 'Connection issue. Please check your internet and try again.',
    insufficientBalance: 'Not enough USDC in your wallet.',
    insufficientSol: 'Not enough SOL for transaction fees.',
    generic: 'Something went wrong. Please try again.',
  },
} as const;
