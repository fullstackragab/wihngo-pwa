'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePhantom } from './use-phantom';
import {
  preflightCheck,
  createSupportIntent,
  createWihngoSupportIntent,
  submitSupport,
  getSupportStatus,
  cancelSupport,
  clearPaymentCache,
} from '@/services/support.service';
import type {
  PreflightResponse,
  SupportIntent,
  SupportIntentStatus,
} from '@/types/support';
import { TERMINAL_STATUSES } from '@/types/support';

/**
 * useSupportFlow — Support flow state machine hook
 *
 * Manages the USDC/Solana support flow for birds and Wihngo platform:
 * idle → preflight → creating_intent → awaiting_signature → submitting → confirming → completed
 *
 * Key differences from old payment flow:
 * - Backend builds the transaction (serializedTransaction)
 * - Frontend only signs, doesn't build transactions
 * - Backend submits to Solana after receiving signed transaction
 */

// Flow status
export type SupportFlowStatus =
  | 'idle'
  | 'connecting_wallet'
  | 'wallet_connected'
  | 'preflight'
  | 'creating_intent'
  | 'awaiting_signature'
  | 'submitting'
  | 'confirming'
  | 'completed'
  | 'failed';

// Flow state
export interface SupportFlowState {
  status: SupportFlowStatus;
  walletAddress: string | null;
  preflight: PreflightResponse | null;
  intent: SupportIntent | null;
  solanaSignature: string | null;
  error: string | null;
  errorCode: string | null;
  completedAt: string | null;
}

const INITIAL_STATE: SupportFlowState = {
  status: 'idle',
  walletAddress: null,
  preflight: null,
  intent: null,
  solanaSignature: null,
  error: null,
  errorCode: null,
  completedAt: null,
};

interface UseSupportFlowOptions {
  /** Bird ID for bird support (omit for Wihngo-only support) */
  birdId?: string;
  /** Amount for bird owner in USDC */
  birdAmount: number;
  /** Optional platform support amount in USDC (default 0.05) */
  wihngoAmount?: number;
  /** User ID for idempotency key generation */
  userId?: string;
  /** Callback on successful support */
  onSuccess?: (intentId: string, signature: string) => void;
  /** Callback on error */
  onError?: (error: string, errorCode?: string) => void;
}

interface UseSupportFlowReturn {
  state: SupportFlowState;
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  runPreflight: () => Promise<boolean>;
  initiateSupport: () => Promise<void>;
  cancelIntent: () => Promise<void>;
  retry: () => void;
  // Helpers
  isWalletConnected: boolean;
  canSupport: boolean;
  isProcessing: boolean;
  isConnecting: boolean;
  formattedAmount: string;
  formattedTotal: string;
}

export function useSupportFlow({
  birdId,
  birdAmount,
  wihngoAmount = 0.05,
  userId,
  onSuccess,
  onError,
}: UseSupportFlowOptions): UseSupportFlowReturn {
  const [state, setState] = useState<SupportFlowState>(INITIAL_STATE);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Use the Phantom hook for wallet operations
  const {
    walletAddress,
    isConnected: isWalletConnected,
    isLoading: isWalletLoading,
    connect: phantomConnect,
    disconnect: phantomDisconnect,
    signTransaction,
  } = usePhantom();

  // Sync wallet address to state
  useEffect(() => {
    if (walletAddress && state.walletAddress !== walletAddress) {
      setState(prev => ({
        ...prev,
        walletAddress,
        status: prev.status === 'idle' ? 'wallet_connected' : prev.status,
      }));
    }
  }, [walletAddress, state.walletAddress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  // Helper to update state
  const updateState = useCallback((updates: Partial<SupportFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper to set error
  const setError = useCallback((error: string, errorCode?: string) => {
    updateState({
      status: 'failed',
      error,
      errorCode: errorCode || null,
    });
    onError?.(error, errorCode);
  }, [updateState, onError]);

  /**
   * Connect wallet
   */
  const connectWallet = useCallback(async () => {
    try {
      updateState({ status: 'connecting_wallet', error: null });
      await phantomConnect();
      // State will be updated by the useEffect that syncs walletAddress
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
    }
  }, [phantomConnect, updateState, setError]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(async () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    await phantomDisconnect();
    setState(INITIAL_STATE);
  }, [phantomDisconnect]);

  /**
   * Run preflight check
   */
  const runPreflight = useCallback(async (): Promise<boolean> => {
    if (!birdId) {
      // Skip preflight for Wihngo-only support
      return true;
    }

    if (!walletAddress) {
      setError('Please connect your wallet first');
      return false;
    }

    try {
      updateState({ status: 'preflight', error: null });

      const response = await preflightCheck({
        birdId,
        birdAmount,
        wihngoSupportAmount: wihngoAmount,
        walletAddress,
      });

      updateState({ preflight: response });

      if (!response.canSupport) {
        setError(response.message || 'Cannot support this bird', response.errorCode);
        return false;
      }

      updateState({ status: 'wallet_connected' });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Preflight check failed';
      setError(message);
      return false;
    }
  }, [birdId, birdAmount, wihngoAmount, walletAddress, updateState, setError]);

  /**
   * Poll for support status
   */
  const startPolling = useCallback((intentId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    let attempts = 0;
    const maxAttempts = 60; // 2 minutes at 2s intervals

    pollingRef.current = setInterval(async () => {
      attempts++;

      try {
        const result = await getSupportStatus(intentId);

        if (result.status === 'Completed') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          // Clear idempotency cache on success
          if (birdId) {
            clearPaymentCache(birdId);
          }

          updateState({
            status: 'completed',
            intent: result,
            solanaSignature: result.solanaSignature || null,
            completedAt: new Date().toISOString(),
          });

          onSuccess?.(intentId, result.solanaSignature || '');

        } else if (TERMINAL_STATUSES.includes(result.status)) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          setError(`Support ${result.status.toLowerCase()}`);
        }

        if (attempts >= maxAttempts) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          setError('Confirmation timed out. Please check your transaction status.');
        }

      } catch {
        if (attempts >= maxAttempts) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          setError('Failed to check support status. Please try again.');
        }
      }
    }, 2000);
  }, [birdId, updateState, setError, onSuccess]);

  /**
   * Initiate support flow
   */
  const initiateSupport = useCallback(async () => {
    if (!isWalletConnected || !walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      // Step 1: Run preflight (for bird support)
      if (birdId) {
        updateState({ status: 'preflight', error: null });

        const preflightResponse = await preflightCheck({
          birdId,
          birdAmount,
          wihngoSupportAmount: wihngoAmount,
          walletAddress,
        });

        updateState({ preflight: preflightResponse });

        if (!preflightResponse.canSupport) {
          setError(preflightResponse.message || 'Cannot support this bird', preflightResponse.errorCode);
          return;
        }
      }

      // Step 2: Create support intent
      updateState({ status: 'creating_intent' });

      let intentResponse;
      if (birdId) {
        intentResponse = await createSupportIntent({
          birdId,
          birdAmount,
          wihngoAmount,
          userId,
        });
      } else {
        // Wihngo-only support
        intentResponse = await createWihngoSupportIntent({
          amount: birdAmount + wihngoAmount,
          userId,
        });
      }

      console.log('[useSupportFlow] Intent created:', intentResponse.intentId);

      // Step 3: Sign the transaction
      updateState({ status: 'awaiting_signature' });

      const signedTx = await signTransaction(intentResponse.serializedTransaction);

      console.log('[useSupportFlow] Transaction signed');

      // Step 4: Submit signed transaction to backend
      updateState({ status: 'submitting' });

      const submitResponse = await submitSupport(intentResponse.intentId, signedTx);

      console.log('[useSupportFlow] Transaction submitted:', submitResponse);

      if (submitResponse.status === 'Completed') {
        // Immediate confirmation
        if (birdId) {
          clearPaymentCache(birdId);
        }

        updateState({
          status: 'completed',
          solanaSignature: submitResponse.solanaSignature,
          completedAt: new Date().toISOString(),
        });

        onSuccess?.(intentResponse.intentId, submitResponse.solanaSignature || '');

      } else if (submitResponse.message) {
        // Error from backend
        setError(submitResponse.message);

      } else {
        // Start polling for confirmation
        updateState({ status: 'confirming' });
        startPolling(intentResponse.intentId);
      }

    } catch (err) {
      console.error('[useSupportFlow] Error:', err);
      const message = err instanceof Error ? err.message : 'Support failed. Please try again.';
      setError(message);
    }
  }, [
    isWalletConnected,
    walletAddress,
    birdId,
    birdAmount,
    wihngoAmount,
    userId,
    signTransaction,
    updateState,
    setError,
    onSuccess,
    startPolling,
  ]);

  /**
   * Cancel pending intent
   */
  const cancelIntent = useCallback(async () => {
    const intentId = state.intent?.intentId;
    if (!intentId) return;

    try {
      await cancelSupport(intentId);
      updateState({
        status: 'wallet_connected',
        intent: null,
        error: null,
      });
    } catch (err) {
      console.error('[useSupportFlow] Cancel failed:', err);
    }
  }, [state.intent?.intentId, updateState]);

  /**
   * Retry from failed state
   */
  const retry = useCallback(() => {
    if (walletAddress) {
      updateState({
        status: 'wallet_connected',
        intent: null,
        error: null,
        errorCode: null,
        solanaSignature: null,
        completedAt: null,
      });
    } else {
      setState(INITIAL_STATE);
    }
  }, [walletAddress, updateState]);

  // Computed helpers
  const isConnecting = state.status === 'connecting_wallet' || isWalletLoading;
  const canSupport = isWalletConnected && (
    state.status === 'wallet_connected' ||
    state.status === 'failed'
  );
  const isProcessing = [
    'preflight',
    'creating_intent',
    'awaiting_signature',
    'submitting',
    'confirming',
  ].includes(state.status);

  const totalAmount = birdAmount + wihngoAmount;
  const formattedAmount = `$${birdAmount.toFixed(2)}`;
  const formattedTotal = `$${totalAmount.toFixed(2)}`;

  return {
    state,
    connectWallet,
    disconnectWallet,
    runPreflight,
    initiateSupport,
    cancelIntent,
    retry,
    isWalletConnected,
    canSupport,
    isProcessing,
    isConnecting,
    formattedAmount,
    formattedTotal,
  };
}

export default useSupportFlow;
