'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PaymentFlowState,
  INITIAL_PAYMENT_FLOW_STATE,
} from '@/types/payment';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  getPaymentConfig,
} from '@/services/payment.service';
import {
  connectPhantomDesktop,
  disconnectPhantom,
  getConnectedWallet,
  isPhantomInstalled,
  executePayment,
  executeDualPayment,
} from '@/lib/solana/phantom';

/**
 * usePaymentFlow — Payment flow state machine hook
 *
 * Manages the USDC/Solana payment flow:
 * idle → wallet_connected → payment_pending → payment_submitted → payment_confirmed
 *
 * IMPORTANT RULES:
 * - Frontend NEVER unlocks content directly
 * - Frontend NEVER infers success from tx hash alone
 * - Frontend constructs transaction, Phantom signs
 * - All verification happens on backend
 */

interface UsePaymentFlowOptions {
  birdId: string;
  amountCents: number;
  wihngoAmountCents?: number;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

interface UsePaymentFlowReturn {
  state: PaymentFlowState;
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  initiatePayment: () => Promise<void>;
  submitTransaction: (txHash: string) => Promise<void>;
  retry: () => void;
  // Helpers
  isWalletConnected: boolean;
  canPay: boolean;
  isProcessing: boolean;
  isConnecting: boolean;
  formattedAmount: string | null;
  isPhantomAvailable: boolean;
}

export function usePaymentFlow({
  birdId,
  amountCents,
  wihngoAmountCents = 0,
  onSuccess,
  onError,
}: UsePaymentFlowOptions): UsePaymentFlowReturn {
  const router = useRouter();
  const [state, setState] = useState<PaymentFlowState>(INITIAL_PAYMENT_FLOW_STATE);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Connect lock to prevent double-tap
  const connectLockRef = useRef(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const isPhantomAvailable = isPhantomInstalled();

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const existingWallet = getConnectedWallet();
    if (existingWallet) {
      setState(prev => ({
        ...prev,
        status: 'wallet_connected',
        walletAddress: existingWallet,
      }));
    }
  }, []);

  // Helper to update state
  const updateState = useCallback((updates: Partial<PaymentFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper to set error state
  const setError = useCallback((error: string) => {
    updateState({
      status: 'payment_failed',
      error,
    });
    onError?.(error);
  }, [updateState, onError]);

  /**
   * Submit transaction for verification
   */
  const submitTransactionInternal = useCallback(async (txHash: string, paymentId?: string) => {
    const intentPaymentId = paymentId || state.paymentIntent?.paymentId;

    if (!intentPaymentId) {
      setError('No payment in progress.');
      return;
    }

    console.log('[usePaymentFlow] Transaction submitted:', txHash);

    try {
      updateState({
        status: 'payment_submitted',
        txHash,
        error: null,
      });

      // Submit to backend for verification
      const result = await confirmPayment({
        paymentId: intentPaymentId,
        txHash,
      });

      console.log('[usePaymentFlow] Backend response:', result);

      if (result.status === 'confirmed') {
        updateState({
          status: 'payment_confirmed',
          confirmedAt: result.confirmedAt || new Date().toISOString(),
        });

        onSuccess?.(intentPaymentId);

      } else if (result.status === 'pending') {
        // Start polling for confirmation
        startPolling(intentPaymentId);

      } else {
        setError(result.failureReason || 'Payment verification failed.');
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify payment. Please try again.';
      setError(message);
    }
  }, [state.paymentIntent, updateState, setError, onSuccess]);

  /**
   * Connect digital wallet (Phantom)
   */
  const connectWallet = useCallback(async () => {
    if (connectLockRef.current) {
      console.log('[usePaymentFlow] Connect locked, ignoring');
      return;
    }

    connectLockRef.current = true;
    setIsConnecting(true);

    try {
      if (!isPhantomInstalled()) {
        window.open('https://phantom.app/', '_blank');
        setError('Please install Phantom wallet to continue.');
        return;
      }

      const result = await connectPhantomDesktop();

      if (result.success && result.publicKey) {
        updateState({
          status: 'wallet_connected',
          walletAddress: result.publicKey,
          error: null,
        });
      } else {
        setError(result.error || 'Failed to connect wallet.');
      }
    } catch {
      setError('Failed to connect digital wallet. Please try again.');
    } finally {
      setTimeout(() => {
        connectLockRef.current = false;
        setIsConnecting(false);
      }, 1000);
    }
  }, [updateState, setError]);

  /**
   * Disconnect wallet and reset state
   */
  const disconnectWallet = useCallback(async () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    try {
      await disconnectPhantom();
    } catch {
      // Ignore disconnect errors
    }

    setState(INITIAL_PAYMENT_FLOW_STATE);
  }, []);

  /**
   * Initiate payment - creates intent and executes transaction
   */
  const initiatePayment = useCallback(async () => {
    if (state.status !== 'wallet_connected') {
      setError('Please connect your digital wallet first.');
      return;
    }

    if (!state.walletAddress) {
      setError('Wallet not connected.');
      return;
    }

    try {
      updateState({ status: 'payment_pending', error: null });

      // Fetch payment config from backend
      let paymentConfig;
      try {
        paymentConfig = await getPaymentConfig();
        console.log('[usePaymentFlow] Payment config:', paymentConfig);
      } catch (configError) {
        console.warn('[usePaymentFlow] Could not fetch payment config:', configError);
      }

      // Create payment intent on backend
      const intent = await createPaymentIntent({
        birdId,
        amountCents,
        wihngoAmountCents,
      });
      console.log('[usePaymentFlow] Payment intent:', intent);

      // Validate amounts (in cents)
      if (!intent.amountCents || intent.amountCents <= 0) {
        throw new Error('Invalid payment amount received from server.');
      }

      // intent.destinationWallet is the bird's wallet
      const birdWallet = intent.destinationWallet;

      // Validate destination is not the user's own wallet
      if (birdWallet === state.walletAddress) {
        throw new Error('Invalid payment destination. Please contact support.');
      }

      updateState({ paymentIntent: intent });

      // Execute dual payment (bird support + optional platform support)
      // All amounts in cents - converted to USDC only for display/transaction
      const result = await executeDualPayment({
        fromWallet: state.walletAddress,
        birdWallet,
        birdAmountCents: intent.amountCents,
        platformAmountCents: intent.wihngoAmountCents,
        paymentId: intent.paymentId,
        redirectPath: `/payments/claim?pi=${intent.paymentId}`,
      });

      if (result.deepLinkUrl) {
        // Mobile: Redirect to Phantom
        window.location.href = result.deepLinkUrl;
        return;
      }

      if (result.success && result.signature) {
        // Desktop: Submit for verification
        await submitTransactionInternal(result.signature, intent.paymentId);
      } else {
        setError(result.error || 'Transaction failed.');
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create payment. Please try again.';
      setError(message);
    }
  }, [state.status, state.walletAddress, birdId, amountCents, wihngoAmountCents, updateState, setError, submitTransactionInternal]);

  /**
   * Submit signed transaction hash to backend
   */
  const submitTransaction = useCallback(async (txHash: string) => {
    await submitTransactionInternal(txHash);
  }, [submitTransactionInternal]);

  /**
   * Poll for payment confirmation
   */
  const startPolling = useCallback((paymentId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    let attempts = 0;
    const maxAttempts = 30;

    pollingRef.current = setInterval(async () => {
      attempts++;

      try {
        const result = await getPaymentStatus(paymentId);

        if (result.status === 'confirmed') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          updateState({
            status: 'payment_confirmed',
            confirmedAt: result.confirmedAt || new Date().toISOString(),
          });

          onSuccess?.(paymentId);

        } else if (result.status === 'failed') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          setError(result.failureReason || 'Payment failed.');
        }

        if (attempts >= maxAttempts && result.status === 'pending') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          setError('Payment verification timed out. Please check your transaction and contact support.');
        }

      } catch {
        if (attempts >= maxAttempts) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          setError('Failed to verify payment status. Please contact support.');
        }
      }
    }, 2000);
  }, [updateState, setError, onSuccess]);

  /**
   * Retry from failed state
   */
  const retry = useCallback(() => {
    if (state.walletAddress) {
      updateState({
        status: 'wallet_connected',
        paymentIntent: null,
        txHash: null,
        error: null,
        confirmedAt: null,
      });
    } else {
      setState(INITIAL_PAYMENT_FLOW_STATE);
    }
  }, [state.walletAddress, updateState]);

  // Computed helpers
  const isWalletConnected = state.walletAddress !== null;
  const canPay = state.status === 'wallet_connected' || state.status === 'payment_pending';
  const isProcessing = state.status === 'payment_pending' || state.status === 'payment_submitted';
  const formattedAmount = state.paymentIntent
    ? `$${(state.paymentIntent.amountCents / 100).toFixed(2)}`
    : amountCents
    ? `$${(amountCents / 100).toFixed(2)}`
    : null;

  return {
    state,
    connectWallet,
    disconnectWallet,
    initiatePayment,
    submitTransaction,
    retry,
    isWalletConnected,
    canPay,
    isProcessing,
    isConnecting,
    formattedAmount,
    isPhantomAvailable,
  };
}
