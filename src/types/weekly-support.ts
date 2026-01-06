// Weekly Support Types - Non-custodial recurring donations
// Users subscribe to weekly reminders, approve each payment in Phantom

export type WeeklySupportPaymentStatus =
  | "pending_reminder"
  | "reminder_sent"
  | "intent_created"
  | "completed"
  | "expired"
  | "skipped";

export type WeeklySupportSubscriptionStatus =
  | "active"
  | "paused"
  | "cancelled";

// Day of week (0 = Sunday, 6 = Saturday)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

// ============================================
// CREATE SUBSCRIPTION
// ============================================

export interface CreateWeeklySupportRequest {
  birdId: string;
  amountUsdc: number;
  wihngoSupportAmount?: number;
  dayOfWeek?: DayOfWeek;
  preferredHour?: number; // UTC 0-23
}

export interface WeeklySupportSubscriptionResponse {
  subscriptionId: string;
  birdId: string;
  birdName: string;
  birdImageUrl?: string;
  birdSpecies?: string;
  recipientUserId: string;
  recipientName: string;
  amountUsdc: number;
  wihngoSupportAmount: number;
  totalAmount: number;
  currency: string;
  status: WeeklySupportSubscriptionStatus;
  dayOfWeek: DayOfWeek;
  dayOfWeekName: string;
  preferredHour: number;
  nextReminderAt?: string;
  totalPaymentsCount: number;
  createdAt: string;
}

// ============================================
// LIST SUBSCRIPTIONS
// ============================================

export interface WeeklySupportSubscriptionListItem {
  subscriptionId: string;
  birdId: string;
  birdName: string;
  birdImageUrl?: string;
  amountUsdc: number;
  status: WeeklySupportSubscriptionStatus;
  nextReminderAt?: string;
  totalPaymentsCount: number;
}

// ============================================
// UPDATE SUBSCRIPTION
// ============================================

export interface UpdateWeeklySupportRequest {
  amountUsdc?: number;
  wihngoSupportAmount?: number;
  dayOfWeek?: DayOfWeek;
  preferredHour?: number;
}

// ============================================
// PENDING APPROVALS
// ============================================

export interface PendingWeeklyPayment {
  paymentId: string;
  subscriptionId: string;
  birdId: string;
  birdName: string;
  birdImageUrl?: string;
  recipientName: string;
  amountUsdc: number;
  wihngoSupportAmount: number;
  totalAmount: number;
  weekStartDate: string;
  weekEndDate: string;
  status: WeeklySupportPaymentStatus;
  reminderSentAt?: string;
  expiresAt: string;
  isExpired: boolean;
  approveDeepLink: string;
}

// ============================================
// APPROVE PAYMENT
// ============================================

export interface ApproveWeeklyPaymentRequest {
  paymentId: string;
  idempotencyKey?: string;
}

export interface ApproveWeeklyPaymentResponse {
  intentId: string;
  paymentId: string;
  birdWalletAddress: string;
  wihngoWalletAddress?: string;
  amountUsdc: number;
  wihngoSupportAmount: number;
  totalAmount: number;
  serializedTransaction: string;
  expiresAt: string;
  wasAlreadyCreated: boolean;
}

// ============================================
// SUBMIT SIGNED TRANSACTION
// ============================================

export interface SubmitWeeklyPaymentRequest {
  intentId: string;
  signedTransaction: string;
  idempotencyKey?: string;
}

export interface SubmitWeeklyPaymentResponse {
  success: boolean;
  signature: string;
  status: string;
}

// ============================================
// USER SUMMARY
// ============================================

export interface WeeklySupportSummary {
  activeSubscriptions: number;
  pausedSubscriptions: number;
  weeklyTotalUsdc: number;
  lifetimeTotalPaidUsdc: number;
  pendingApprovals: number;
}

// ============================================
// PAYMENT HISTORY
// ============================================

export interface WeeklySupportPaymentHistoryItem {
  paymentId: string;
  subscriptionId: string;
  birdId: string;
  birdName: string;
  weekStartDate: string;
  weekEndDate: string;
  amountUsdc: number;
  totalAmount: number;
  status: WeeklySupportPaymentStatus;
  completedAt?: string;
  createdAt: string;
}

// ============================================
// UI HELPERS
// ============================================

export const WEEKLY_SUPPORT_UI_COPY = {
  reminderTitle: "Weekly support reminder",
  reminderDescription: "Tap to approve in Phantom - never automatic",
  approveButton: "Approve with Phantom",
  pauseButton: "Pause reminders",
  resumeButton: "Resume reminders",
  cancelButton: "Cancel subscription",
  subscriptionActive: "Active - weekly reminders on",
  subscriptionPaused: "Paused - no reminders",
  subscriptionCancelled: "Cancelled",
  pendingApproval: "Waiting for your approval",
  expiresIn: (days: number) => `Expires in ${days} day${days === 1 ? '' : 's'}`,
  expired: "Expired - payment skipped",
  completed: "Payment sent",
  errors: {
    createFailed: "Could not set up weekly support. Please try again.",
    approveFailed: "Could not start approval. Please try again.",
    submitFailed: "Payment failed. Please try again.",
    pauseFailed: "Could not pause subscription. Please try again.",
    resumeFailed: "Could not resume subscription. Please try again.",
    cancelFailed: "Could not cancel subscription. Please try again.",
  },
} as const;

// Default values
export const DEFAULT_WEEKLY_AMOUNT = 1.0;
export const DEFAULT_DAY_OF_WEEK: DayOfWeek = 0; // Sunday
export const DEFAULT_PREFERRED_HOUR = 10; // 10 AM UTC
