import { apiHelper } from "./api-helper";
import {
  PaymentPreflightRequest,
  PaymentPreflightResponse,
  CreatePaymentIntentRequest,
  PaymentIntent,
  PaymentStatus,
  SubmitPaymentRequest,
  SubmitPaymentResponse,
  PaymentHistoryResponse,
  LinkWalletRequest,
  LinkedWallet,
  UserBalance,
} from "@/types/payment";

export async function preflightPayment(
  data: PaymentPreflightRequest
): Promise<PaymentPreflightResponse> {
  return apiHelper.post<PaymentPreflightResponse>("payments/preflight", data);
}

export async function createPaymentIntent(
  data: CreatePaymentIntentRequest
): Promise<PaymentIntent> {
  return apiHelper.post<PaymentIntent>("payments/intents", data);
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
  return apiHelper.get<PaymentStatus>(`payments/intents/${paymentId}`);
}

export async function submitPayment(
  data: SubmitPaymentRequest
): Promise<SubmitPaymentResponse> {
  return apiHelper.post<SubmitPaymentResponse>("payments/submit", data);
}

export async function cancelPayment(paymentId: string): Promise<void> {
  return apiHelper.post(`payments/${paymentId}/cancel`, {});
}

export async function getPaymentHistory(
  page = 1,
  pageSize = 20
): Promise<PaymentHistoryResponse> {
  return apiHelper.get<PaymentHistoryResponse>(
    `payments?page=${page}&pageSize=${pageSize}`
  );
}

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

export async function createDonationIntent(
  birdId: string,
  amountUsdc: number,
  message?: string
): Promise<PaymentIntent> {
  return apiHelper.post<PaymentIntent>("donations/intents", {
    birdId,
    amountUsdc,
    message,
  });
}

export async function getDonationStatus(donationId: string): Promise<PaymentStatus> {
  return apiHelper.get<PaymentStatus>(`donations/intents/${donationId}`);
}

export async function submitDonation(
  data: SubmitPaymentRequest
): Promise<SubmitPaymentResponse> {
  return apiHelper.post<SubmitPaymentResponse>("donations/submit", data);
}
