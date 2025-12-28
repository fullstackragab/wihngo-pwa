import { apiHelper } from "./api-helper";
import {
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  PaymentStatus,
  PaymentHistoryResponse,
  LinkWalletRequest,
  LinkedWallet,
  UserBalance,
  BalanceCheckResponse,
} from "@/types/payment";

// Create a payment intent for bird support or Wihngo support
export async function createPaymentIntent(
  data: CreatePaymentIntentRequest
): Promise<PaymentIntentResponse> {
  return apiHelper.post<PaymentIntentResponse>("payments/intent", data);
}

// Confirm payment after transactions are submitted on-chain
export async function confirmPayment(
  data: ConfirmPaymentRequest
): Promise<ConfirmPaymentResponse> {
  return apiHelper.post<ConfirmPaymentResponse>("payments/confirm", data);
}

// Get payment status by ID
export async function getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
  return apiHelper.get<PaymentStatus>(`payments/intents/${paymentId}`);
}

// Cancel a pending payment intent
export async function cancelPayment(paymentId: string): Promise<void> {
  return apiHelper.post(`payments/${paymentId}/cancel`, {});
}

// Get payment history
export async function getPaymentHistory(
  page = 1,
  pageSize = 20
): Promise<PaymentHistoryResponse> {
  return apiHelper.get<PaymentHistoryResponse>(
    `payments?page=${page}&pageSize=${pageSize}`
  );
}

// Wallet management
export async function linkWallet(data: LinkWalletRequest): Promise<LinkedWallet> {
  return apiHelper.post<LinkedWallet>("wallets/link", data);
}

export async function getLinkedWallets(): Promise<LinkedWallet[]> {
  return apiHelper.get<LinkedWallet[]>("wallets");
}

export async function unlinkWallet(walletId: string): Promise<void> {
  return apiHelper.delete(`wallets/${walletId}`);
}

export async function getBalance(): Promise<UserBalance> {
  return apiHelper.get<UserBalance>("wallets/balance");
}

// Check wallet balance (public endpoint - no auth required)
export async function checkWalletBalance(
  walletAddress: string
): Promise<BalanceCheckResponse> {
  return apiHelper.get<BalanceCheckResponse>(`wallets/${walletAddress}/balance`);
}
