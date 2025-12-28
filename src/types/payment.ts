// Payment Intent Types - Bird-first payment model
// Bird money is sacred: 100% goes to bird owner
// Wihngo support is optional, transparent, and additive

export type PaymentIntentStatus =
  | "Pending"
  | "AwaitingSignature"
  | "Submitted"
  | "Confirming"
  | "Confirmed"
  | "Completed"
  | "Failed"
  | "Expired"
  | "Cancelled";

export const TERMINAL_STATUSES: PaymentIntentStatus[] = [
  "Completed",
  "Confirmed",
  "Failed",
  "Expired",
  "Cancelled",
];

export const SUCCESS_STATUSES: PaymentIntentStatus[] = ["Completed", "Confirmed"];

// Payment Intent Types
export type PaymentIntentType = "BIRD_SUPPORT" | "WIHNGO_SUPPORT";

export interface CreatePaymentIntentRequest {
  type: PaymentIntentType;
  birdId?: string;
  birdAmount: number;
  wihngoAmount: number;
}

export interface PaymentIntentResponse {
  intentId: string;
  birdWallet: string | null;
  wihngoWallet: string;
  usdcMint: string;
  expiresAt: string;
}

export interface TransactionConfirmation {
  type: "BIRD" | "WIHNGO";
  signature: string;
}

export interface ConfirmPaymentRequest {
  intentId: string;
  transactions: TransactionConfirmation[];
}

export interface ConfirmPaymentResponse {
  success: boolean;
  message: string;
  birdTransactionVerified?: boolean;
  wihngoTransactionVerified?: boolean;
}

// Wallet Balance Types
export interface WalletBalance {
  walletAddress: string;
  solBalance: number;
  usdcBalance: number;
  hasMinimumSol: boolean;
  canAfford: (amount: number) => boolean;
}

export interface BalanceCheckResponse {
  walletAddress: string;
  solBalance: number;
  usdcBalance: number;
  minimumSolRequired: number;
}

// Legacy types for backwards compatibility
export interface PaymentIntent {
  paymentId: string;
  status: PaymentIntentStatus;
  supportAmount: number;
  platformSupportAmount?: number;
  totalAmount: number;
  currency: string;
  birdId: string;
  birdName?: string;
  serializedTransaction?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: PaymentIntentStatus;
  amountUsdc: number;
  feeUsdc: number;
  solanaSignature?: string;
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
  confirmedAt?: string;
  memo?: string;
}

export interface SubmitPaymentRequest {
  paymentId: string;
  signedTransaction: string;
}

export interface SubmitPaymentResponse {
  paymentId: string;
  status: PaymentIntentStatus;
  solanaSignature?: string;
  errorMessage?: string;
}

export interface UserBalance {
  balanceUsdc: number;
  availableUsdc: number;
  pendingUsdc: number;
  hasGas: boolean;
  walletAddress: string;
}

export interface PaymentHistoryItem {
  paymentId: string;
  status: PaymentIntentStatus;
  amountUsdc: number;
  memo?: string;
  createdAt: string;
  isSender: boolean;
  otherParty: {
    userId: string;
    name: string;
    profileImage?: string;
  };
}

export interface PaymentHistoryResponse {
  items: PaymentHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

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

// Constants - Bird-first values
export const PRESET_BIRD_AMOUNTS = [1, 3, 5] as const;
export type PresetBirdAmount = (typeof PRESET_BIRD_AMOUNTS)[number];

export const DEFAULT_WIHNGO_SUPPORT = 0.05; // $0.05 - minimum suggested
export const MIN_WIHNGO_SUPPORT = 0.05; // Minimum if user chooses to support
export const MIN_BIRD_AMOUNT = 0.01;
export const MAX_BIRD_AMOUNT = 1000;
export const MINIMUM_SOL_FOR_GAS = 0.005; // SOL needed for transaction fees
