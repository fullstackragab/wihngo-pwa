/**
 * Payment Service — API calls for payment system
 *
 * Handles all payment-related API interactions with the backend.
 */

import {
  publicGet,
  authenticatedGet,
  authenticatedPost,
  publicFetch,
} from './api-helper';
import type {
  PaymentConfig,
  PaymentIntent,
  PaymentConfirmRequest,
  PaymentConfirmResponse,
  PublicPaymentStatus,
  ManualPaymentIntent,
  CreateManualPaymentRequest,
  ClaimPaymentResponse,
} from '@/types/payment';

/**
 * Get payment configuration from backend
 * Endpoint: GET /api/payments/config
 *
 * Returns network info to ensure frontend/backend alignment.
 */
export async function getPaymentConfig(): Promise<PaymentConfig> {
  return publicGet<PaymentConfig>('/payments/config');
}

/**
 * Create payment intent request
 */
export interface CreatePaymentIntentRequest {
  birdId: string;
  amountCents: number;
  wihngoAmountCents?: number;
}

/**
 * Create a payment intent for bird support
 * Endpoint: POST /api/payments/intents
 * Requires: authentication
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<PaymentIntent> {
  return authenticatedPost<PaymentIntent>('/payments/intents', request);
}

/**
 * Confirm a payment after user signs transaction
 * Endpoint: POST /api/payments/confirm
 * Requires: authentication
 *
 * Backend verifies on-chain:
 * - Token mint matches USDC
 * - Amount matches payment intent
 * - Destination matches platform wallet
 * - Tx not already used (idempotent)
 */
export async function confirmPayment(
  request: PaymentConfirmRequest
): Promise<PaymentConfirmResponse> {
  return authenticatedPost<PaymentConfirmResponse>('/payments/confirm', request);
}

/**
 * Get payment status (for polling)
 * Endpoint: GET /api/payments/{paymentId}
 * Requires: authentication
 */
export async function getPaymentStatus(
  paymentId: string
): Promise<PaymentConfirmResponse> {
  return authenticatedGet<PaymentConfirmResponse>(`/payments/${paymentId}`);
}

/**
 * Public payment intent status (no auth required)
 * Endpoint: GET /api/payments/intents/{id}/status
 *
 * Used by mobile return flow where user may be logged out.
 */
export async function getPublicPaymentStatus(
  paymentIntentId: string
): Promise<PublicPaymentStatus> {
  return publicGet<PublicPaymentStatus>(`/payments/intents/${paymentIntentId}/status`);
}

/**
 * Create manual payment intent for mobile users
 * Endpoint: POST /api/payments/manual
 *
 * Returns unique address for USDC transfer.
 * Backend monitors blockchain for incoming transfers.
 */
export async function createManualPaymentIntent(
  request: CreateManualPaymentRequest
): Promise<ManualPaymentIntent> {
  // Manual payments can be anonymous (public endpoint)
  const response = await publicFetch('/payments/manual', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create payment');
  }

  return response.json();
}

/**
 * Claim a confirmed payment
 * Endpoint: POST /api/payments/{paymentId}/claim
 * Requires: authentication
 *
 * Links the payment to the authenticated user.
 */
export async function claimPayment(paymentId: string): Promise<ClaimPaymentResponse> {
  return authenticatedPost<ClaimPaymentResponse>(`/payments/${paymentId}/claim`, {});
}
