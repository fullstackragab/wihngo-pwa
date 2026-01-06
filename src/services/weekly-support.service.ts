import { apiHelper } from "./api-helper";
import {
  CreateWeeklySupportRequest,
  WeeklySupportSubscriptionResponse,
  WeeklySupportSubscriptionListItem,
  UpdateWeeklySupportRequest,
  PendingWeeklyPayment,
  ApproveWeeklyPaymentRequest,
  ApproveWeeklyPaymentResponse,
  SubmitWeeklyPaymentRequest,
  SubmitWeeklyPaymentResponse,
  WeeklySupportSummary,
  WeeklySupportPaymentHistoryItem,
} from "@/types/weekly-support";
import { withRetry, RETRY_PRESETS } from "@/lib/retry";

const BASE_URL = "weekly-support";

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Create a new weekly support subscription
 * User will receive weekly reminders and approve each payment in Phantom
 */
export async function createWeeklySupportSubscription(
  data: CreateWeeklySupportRequest
): Promise<WeeklySupportSubscriptionResponse> {
  return withRetry(
    () => apiHelper.post<WeeklySupportSubscriptionResponse>(`${BASE_URL}/subscriptions`, data),
    RETRY_PRESETS.network
  );
}

/**
 * Get all weekly support subscriptions for current user
 */
export async function getWeeklySupportSubscriptions(): Promise<WeeklySupportSubscriptionListItem[]> {
  return apiHelper.get<WeeklySupportSubscriptionListItem[]>(`${BASE_URL}/subscriptions`);
}

/**
 * Get subscription details
 */
export async function getWeeklySupportSubscription(
  subscriptionId: string
): Promise<WeeklySupportSubscriptionResponse> {
  return apiHelper.get<WeeklySupportSubscriptionResponse>(`${BASE_URL}/subscriptions/${subscriptionId}`);
}

/**
 * Update subscription settings (amount, day, hour)
 */
export async function updateWeeklySupportSubscription(
  subscriptionId: string,
  data: UpdateWeeklySupportRequest
): Promise<WeeklySupportSubscriptionResponse> {
  return apiHelper.put<WeeklySupportSubscriptionResponse>(`${BASE_URL}/subscriptions/${subscriptionId}`, data);
}

/**
 * Pause a subscription - stops reminders temporarily
 */
export async function pauseWeeklySupportSubscription(subscriptionId: string): Promise<void> {
  return apiHelper.post(`${BASE_URL}/subscriptions/${subscriptionId}/pause`, {});
}

/**
 * Resume a paused subscription
 */
export async function resumeWeeklySupportSubscription(subscriptionId: string): Promise<void> {
  return apiHelper.post(`${BASE_URL}/subscriptions/${subscriptionId}/resume`, {});
}

/**
 * Cancel a subscription permanently
 */
export async function cancelWeeklySupportSubscription(subscriptionId: string): Promise<void> {
  return apiHelper.delete(`${BASE_URL}/subscriptions/${subscriptionId}`);
}

// ============================================
// PENDING APPROVALS & PAYMENT
// ============================================

/**
 * Get all pending payments waiting for user approval
 */
export async function getPendingWeeklyPayments(): Promise<PendingWeeklyPayment[]> {
  return apiHelper.get<PendingWeeklyPayment[]>(`${BASE_URL}/pending`);
}

/**
 * Approve a pending payment - creates pre-filled support intent
 * Returns serialized transaction for Phantom signing
 */
export async function approveWeeklyPayment(
  data: ApproveWeeklyPaymentRequest
): Promise<ApproveWeeklyPaymentResponse> {
  return withRetry(
    () => apiHelper.post<ApproveWeeklyPaymentResponse>(`${BASE_URL}/approve`, data),
    RETRY_PRESETS.network
  );
}

/**
 * Submit signed transaction after Phantom approval
 */
export async function submitWeeklyPayment(
  data: SubmitWeeklyPaymentRequest
): Promise<SubmitWeeklyPaymentResponse> {
  return apiHelper.post<SubmitWeeklyPaymentResponse>(`${BASE_URL}/submit`, data);
}

// ============================================
// SUMMARY & HISTORY
// ============================================

/**
 * Get weekly support statistics for current user
 */
export async function getWeeklySupportSummary(): Promise<WeeklySupportSummary> {
  return apiHelper.get<WeeklySupportSummary>(`${BASE_URL}/summary`);
}

/**
 * Get payment history for a subscription
 */
export async function getWeeklyPaymentHistory(
  subscriptionId: string,
  limit = 20
): Promise<WeeklySupportPaymentHistoryItem[]> {
  return apiHelper.get<WeeklySupportPaymentHistoryItem[]>(
    `${BASE_URL}/subscriptions/${subscriptionId}/payments?limit=${limit}`
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a subscription for this bird already exists
 */
export async function hasExistingSubscription(birdId: string): Promise<boolean> {
  const subscriptions = await getWeeklySupportSubscriptions();
  return subscriptions.some(
    (sub) => sub.birdId === birdId && sub.status === "active"
  );
}

/**
 * Get the count of pending approvals
 */
export async function getPendingApprovalsCount(): Promise<number> {
  const pending = await getPendingWeeklyPayments();
  return pending.filter((p) => !p.isExpired).length;
}
