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
