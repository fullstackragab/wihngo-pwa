// Payment Types - Aligned with Backend API
// Bird money is sacred: 100% goes to bird owner
// Wihngo support is optional, transparent, and additive

export type PaymentIntentStatus =
  | "Pending"
  | "AwaitingPayment"
  | "Processing"
  | "Confirming"
  | "Completed"
  | "Failed"
  | "Expired"
  | "Cancelled";

export const TERMINAL_STATUSES: PaymentIntentStatus[] = [
  "Completed",
  "Failed",
  "Expired",
  "Cancelled",
];

export const SUCCESS_STATUSES: PaymentIntentStatus[] = ["Completed"];

// Create Payment Intent - Request to backend
export interface CreatePaymentIntentRequest {
  birdId: string;
  birdAmount: number;
  wihngoSupportAmount: number;
  currency: "USDC";
}

// Payment Intent - Full response from backend
export interface PaymentIntent {
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
  status: PaymentIntentStatus;
  serializedTransaction: string;
  solanaSignature?: string;
  expiresAt: string;
  createdAt: string;
}

// Mapped response for frontend convenience
export interface PaymentIntentResponse {
  intentId: string;
  birdWallet: string | null;
  wihngoWallet: string | null;
  usdcMint: string;
  serializedTransaction: string;
  expiresAt: string;
}

// Submit signed transaction
export interface SubmitPaymentRequest {
  signedTransaction: string;
}

export interface SubmitPaymentResponse {
  intentId: string;
  status: PaymentIntentStatus;
  solanaSignature?: string;
  message?: string;
}

// Preflight check before payment
export interface PreflightRequest {
  birdId: string;
  birdAmount: number;
  wihngoSupportAmount: number;
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

// Payment status polling
export interface PaymentStatus {
  intentId: string;
  status: PaymentIntentStatus;
  birdAmount: number;
  wihngoSupportAmount: number;
  totalAmount: number;
  solanaSignature?: string;
  createdAt: string;
  confirmedAt?: string;
}

// Payment history
export interface PaymentHistoryItem {
  paymentId: string;
  type: "P2P" | "BIRD_SUPPORT";
  status: PaymentIntentStatus;
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

export interface PaymentHistoryResponse {
  items: PaymentHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Wallet linking
export interface LinkWalletRequest {
  publicKey: string;
  signature: string;
  message: string;
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

// Legacy exports for backwards compatibility
export type TransactionConfirmation = {
  type: "BIRD" | "WIHNGO";
  signature: string;
};

export type ConfirmPaymentRequest = {
  intentId: string;
  transactions: TransactionConfirmation[];
};

export type ConfirmPaymentResponse = {
  success: boolean;
  message: string;
};

// Alias for backwards compatibility
export type BalanceCheckResponse = OnChainBalanceResponse;
