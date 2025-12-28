"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PublicKey, Transaction, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { detectPlatform, isMobileDevice, getPhantomDeepLink, getRedirectUrl } from "@/lib/phantom/platform";
import { SOLANA_CONFIG } from "@/lib/config";

// Try to import the SDK hooks - they may not be available in all contexts
let useSolanaSDK: (() => { solana: SolanaSDK }) | undefined;
let usePhantomSDK: (() => PhantomSDKState) | undefined;

try {
  // Dynamic import to avoid build errors if SDK context isn't available
  const sdk = require("@phantom/react-sdk");
  useSolanaSDK = sdk.useSolana;
  usePhantomSDK = sdk.usePhantom;
} catch {
  // SDK not available, will use fallback
}

interface SolanaSDK {
  getPublicKey: () => Promise<string | null>;
  signAndSendTransaction: (
    transaction: VersionedTransaction | Transaction
  ) => Promise<{ signature: string }>;
  signTransaction: (transaction: VersionedTransaction | Transaction) => Promise<VersionedTransaction | Transaction>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
}

interface PhantomSDKState {
  isConnected: boolean;
  isLoading: boolean;
  user?: {
    addresses: string[];
  };
}

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  isConnected?: boolean;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAndSendTransaction: (
    transaction: Transaction
  ) => Promise<{ signature: string }>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
    solana?: PhantomProvider;
  }
}

export type ConnectionMethod = "extension" | "deeplink" | "sdk";

export interface UsePhantomResult {
  // State
  publicKey: PublicKey | null;
  isConnected: boolean;
  isPhantomInstalled: boolean;
  isLoading: boolean;
  walletAddress: string | null;
  connectionMethod: ConnectionMethod;
  platform: ReturnType<typeof detectPlatform>;

  // Actions
  connect: () => Promise<PublicKey | null>;
  disconnect: () => Promise<void>;
  signTransaction: (serializedTransaction: string) => Promise<string>;
  signAndSendTransaction: (transaction: Transaction | VersionedTransaction) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
}

export function usePhantom(): UsePhantomResult {
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>("extension");

  const platform = useMemo(() => detectPlatform(), []);
  const isMobile = useMemo(() => isMobileDevice(), []);

  // Try to use SDK hooks if available
  let sdkState: PhantomSDKState | undefined;
  let solanaSDK: SolanaSDK | undefined;

  try {
    if (usePhantomSDK) {
      sdkState = usePhantomSDK();
    }
    if (useSolanaSDK) {
      const result = useSolanaSDK();
      solanaSDK = result.solana;
    }
  } catch {
    // SDK not in context, use fallback
  }

  // Initialize provider detection
  useEffect(() => {
    const getProvider = (): PhantomProvider | null => {
      if (typeof window === "undefined") return null;
      const phantom = window.phantom?.solana || window.solana;
      if (phantom?.isPhantom) return phantom;
      return null;
    };

    const initializeProvider = async () => {
      setIsLoading(true);

      // Check for SDK connection first
      if (sdkState?.isConnected && solanaSDK) {
        try {
          const pubKeyStr = await solanaSDK.getPublicKey();
          if (pubKeyStr) {
            setPublicKey(new PublicKey(pubKeyStr));
            setIsConnected(true);
            setIsPhantomInstalled(true);
            setConnectionMethod("sdk");
            setIsLoading(false);
            return;
          }
        } catch {
          // Fall through to extension check
        }
      }

      // Check for browser extension
      const phantomProvider = getProvider();
      setProvider(phantomProvider);
      setIsPhantomInstalled(!!phantomProvider);

      if (phantomProvider?.publicKey) {
        setPublicKey(phantomProvider.publicKey);
        setIsConnected(true);
        setConnectionMethod("extension");
      }

      setIsLoading(false);
    };

    initializeProvider();

    // Re-check after a delay (Phantom may load async)
    const timeout = setTimeout(initializeProvider, 100);
    return () => clearTimeout(timeout);
  }, [sdkState?.isConnected]);

  // Listen for provider events
  useEffect(() => {
    if (!provider) return;

    const handleConnect = (pubKey: PublicKey) => {
      setPublicKey(pubKey);
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setPublicKey(null);
      setIsConnected(false);
    };

    const handleAccountChanged = (pubKey: PublicKey | null) => {
      if (pubKey) {
        setPublicKey(pubKey);
        setIsConnected(true);
      } else {
        handleDisconnect();
      }
    };

    provider.on("connect", handleConnect as (...args: unknown[]) => void);
    provider.on("disconnect", handleDisconnect);
    provider.on("accountChanged", handleAccountChanged as (...args: unknown[]) => void);

    return () => {
      provider.off("connect", handleConnect as (...args: unknown[]) => void);
      provider.off("disconnect", handleDisconnect);
      provider.off("accountChanged", handleAccountChanged as (...args: unknown[]) => void);
    };
  }, [provider]);

  const connect = useCallback(async (): Promise<PublicKey | null> => {
    // Try SDK first
    if (solanaSDK) {
      try {
        const pubKeyStr = await solanaSDK.getPublicKey();
        if (pubKeyStr) {
          const pubKey = new PublicKey(pubKeyStr);
          setPublicKey(pubKey);
          setIsConnected(true);
          setConnectionMethod("sdk");
          return pubKey;
        }
      } catch {
        // Fall through
      }
    }

    // Try browser extension
    if (provider) {
      try {
        const response = await provider.connect();
        setPublicKey(response.publicKey);
        setIsConnected(true);
        setConnectionMethod("extension");
        return response.publicKey;
      } catch (error) {
        console.error("Failed to connect via extension:", error);
        throw error;
      }
    }

    // Mobile deep link fallback
    if (isMobile) {
      const redirectUrl = getRedirectUrl("/donation/pay");
      const deepLink = getPhantomDeepLink("connect", {
        app_url: window.location.origin,
        redirect_link: redirectUrl,
        cluster: SOLANA_CONFIG.network,
      });

      // Open Phantom app
      window.location.href = deepLink;
      setConnectionMethod("deeplink");
      return null;
    }

    // No provider available - open Phantom website
    window.open("https://phantom.app/", "_blank");
    throw new Error("Phantom wallet not installed");
  }, [provider, solanaSDK, isMobile]);

  const disconnect = useCallback(async () => {
    if (provider) {
      try {
        await provider.disconnect();
      } catch (error) {
        console.error("Failed to disconnect:", error);
      }
    }
    setPublicKey(null);
    setIsConnected(false);
  }, [provider]);

  const signTransaction = useCallback(
    async (serializedTransaction: string): Promise<string> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      // Try SDK first
      if (solanaSDK) {
        try {
          const transactionBuffer = Buffer.from(serializedTransaction, "base64");
          const transaction = Transaction.from(transactionBuffer);
          const signedTx = await solanaSDK.signTransaction(transaction);

          if (signedTx instanceof Transaction) {
            const signedBuffer = signedTx.serialize({
              requireAllSignatures: false,
              verifySignatures: false,
            });
            return Buffer.from(signedBuffer).toString("base64");
          }
          // VersionedTransaction
          return Buffer.from(signedTx.serialize()).toString("base64");
        } catch (error) {
          console.error("SDK sign failed:", error);
          // Fall through to extension
        }
      }

      // Try extension
      if (provider) {
        const transactionBuffer = Buffer.from(serializedTransaction, "base64");
        const transaction = Transaction.from(transactionBuffer);
        const signedTransaction = await provider.signTransaction(transaction);

        const signedBuffer = signedTransaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });
        return Buffer.from(signedBuffer).toString("base64");
      }

      throw new Error("No signing method available");
    },
    [provider, solanaSDK, isConnected]
  );

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction | VersionedTransaction): Promise<string> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      // Try SDK first
      if (solanaSDK) {
        try {
          const result = await solanaSDK.signAndSendTransaction(transaction);
          return result.signature;
        } catch (error) {
          console.error("SDK signAndSend failed:", error);
          // Fall through to extension
        }
      }

      // Try extension (only works with Transaction, not VersionedTransaction)
      if (provider && transaction instanceof Transaction) {
        const result = await provider.signAndSendTransaction(transaction);
        return result.signature;
      }

      throw new Error("No signing method available");
    },
    [provider, solanaSDK, isConnected]
  );

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      const encodedMessage = new TextEncoder().encode(message);

      // Try SDK first
      if (solanaSDK) {
        try {
          const response = await solanaSDK.signMessage(encodedMessage);
          return bs58.encode(response.signature);
        } catch {
          // Fall through
        }
      }

      // Try extension
      if (provider) {
        const response = await provider.signMessage(encodedMessage);
        return bs58.encode(response.signature);
      }

      throw new Error("No signing method available");
    },
    [provider, solanaSDK, isConnected]
  );

  return {
    publicKey,
    isConnected,
    isPhantomInstalled,
    isLoading,
    walletAddress: publicKey?.toBase58() || null,
    connectionMethod,
    platform,
    connect,
    disconnect,
    signTransaction,
    signAndSendTransaction,
    signMessage,
  };
}
