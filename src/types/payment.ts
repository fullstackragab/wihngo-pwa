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
  recipientUserId: string;
  amountUsdc: number;
  memo?: string;
}

export interface PaymentIntent {
  paymentId: string;
  serializedTransaction: string;
  amountUsdc: number;
  feeUsdc: number;
  totalUsdc: number;
  gasSponsored: boolean;
  expiresAt: string;
  recipientName: string;
  recipientWallet: string;
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
