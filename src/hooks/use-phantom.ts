"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { detectPlatform, isMobileDevice } from "@/lib/phantom/platform";

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

    // Check for Phantom deep link callback (mobile flow)
    const handleDeepLinkCallback = () => {
      if (typeof window === "undefined") return false;

      const url = new URL(window.location.href);
      const phantomPublicKey = url.searchParams.get("phantom_encryption_public_key");
      const errorCode = url.searchParams.get("errorCode");

      // If there's an error from Phantom, log it
      if (errorCode) {
        console.error("Phantom connect error:", errorCode, url.searchParams.get("errorMessage"));
        // Clean up the URL
        window.history.replaceState({}, "", url.pathname);
        return false;
      }

      // If we got a public key back from Phantom deep link
      if (phantomPublicKey) {
        try {
          // The phantom_encryption_public_key is for encryption, not the wallet address
          // For the connect flow, Phantom returns data in an encrypted format
          // However, for basic connect without encryption, we can check for the public key in data
          const data = url.searchParams.get("data");
          const nonce = url.searchParams.get("nonce");

          if (data && nonce) {
            // For now, store that we initiated a connection
            // The actual public key would need to be decrypted
            // For simpler implementation, we'll rely on the SDK to handle this
            console.log("Phantom returned from deep link, checking SDK state...");
          }

          // Clean up the URL parameters
          window.history.replaceState({}, "", url.pathname);
          return true;
        } catch (err) {
          console.error("Failed to parse Phantom callback:", err);
        }
      }

      return false;
    };

    const initializeProvider = async () => {
      setIsLoading(true);

      // Check for deep link callback first
      handleDeepLinkCallback();

      // On mobile, we can't detect if Phantom app is installed
      // But we can always try to use it via deep links / SDK
      // So we mark it as "available" on mobile
      if (isMobile) {
        setIsPhantomInstalled(true);
      }

      // Check for SDK connection first (handles both desktop and mobile)
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

      // Check for browser extension (desktop)
      const phantomProvider = getProvider();
      setProvider(phantomProvider);
      if (phantomProvider) {
        setIsPhantomInstalled(true);
      }

      if (phantomProvider?.publicKey) {
        setPublicKey(phantomProvider.publicKey);
        setIsConnected(true);
        setConnectionMethod("extension");
      }

      setIsLoading(false);
    };

    initializeProvider();

    // Re-check after a delay (Phantom SDK or extension may load async)
    const timeout = setTimeout(initializeProvider, 100);
    // Also check after SDK state changes settle
    const timeout2 = setTimeout(initializeProvider, 500);
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [sdkState?.isConnected, sdkState?.isLoading, isMobile]);

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
    // Try SDK first - the SDK handles both desktop and mobile (including deep links)
    // This should be the primary connection method as it handles all the complexity
    if (solanaSDK) {
      try {
        // getPublicKey triggers connect flow if not connected
        // On mobile, this will handle the deep link flow automatically
        const pubKeyStr = await solanaSDK.getPublicKey();
        if (pubKeyStr) {
          const pubKey = new PublicKey(pubKeyStr);
          setPublicKey(pubKey);
          setIsConnected(true);
          setConnectionMethod("sdk");
          // Clear any pending state
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem("phantom_connect_pending");
          }
          return pubKey;
        }
      } catch (err) {
        console.warn("SDK connect failed, trying alternatives:", err);
        // Fall through to other methods
      }
    }

    // Try browser extension (desktop only)
    if (provider && !isMobile) {
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

    // On mobile, use Phantom deep link to open the app
    if (isMobile) {
      const currentUrl = window.location.href;
      const appUrl = encodeURIComponent(window.location.origin);
      const redirectUrl = encodeURIComponent(currentUrl);

      // Mark that we're waiting for Phantom to respond
      // This prevents showing errors when the user returns before completing
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("phantom_connect_pending", Date.now().toString());
      }

      // Use Phantom Universal Link for mobile
      // This will open the Phantom app if installed, or redirect to app store
      const phantomConnectUrl = `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirectUrl}&cluster=mainnet-beta`;

      // Use window.location.href for better mobile compatibility
      window.location.href = phantomConnectUrl;

      // Return null - the app will redirect back after connection
      // Don't throw an error - this is expected behavior for mobile deep links
      return null;
    }

    // Desktop without extension - open Phantom website to download
    window.open("https://phantom.app/", "_blank");
    throw new Error("Phantom wallet not installed. Please install Phantom to continue.");
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
