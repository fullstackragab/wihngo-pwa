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

export interface PaymentPreflightRequest {
  recipientId: string;
  amount: number;
}

export interface PaymentPreflightResponse {
  valid: boolean;
  recipientName?: string;
  recipientId?: string;
  amount: number;
  networkFee: number;
  totalAmount: number;
  gasSponsored: boolean;
  errorMessage?: string;
  errorCode?: string;
}

export interface CreatePaymentIntentRequest {
  birdId: string;
  supportAmount: number;
  platformSupportAmount?: number;
  currency?: string;
  walletAddress: string;
}

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

export const QUICK_SEND_AMOUNTS = [1, 2, 5] as const;
export type QuickSendAmount = (typeof QUICK_SEND_AMOUNTS)[number];

export const DEFAULT_NETWORK_FEE_USD = 0.01;
export const MIN_PAYMENT_USD = 0.01;
export const MAX_PAYMENT_USD = 1000;
