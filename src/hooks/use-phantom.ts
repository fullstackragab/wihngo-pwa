"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { detectPlatform, isMobileDevice } from "@/lib/phantom/platform";

// Storage keys for mobile deep link flow
const PHANTOM_CONNECT_PENDING_KEY = "phantom_connect_pending";
const PHANTOM_DAPP_KEYPAIR_KEY = "phantom_dapp_keypair";

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
    const handleDeepLinkCallback = (): PublicKey | null => {
      if (typeof window === "undefined") return null;

      const url = new URL(window.location.href);
      const phantomEncryptionPubKey = url.searchParams.get("phantom_encryption_public_key");
      const errorCode = url.searchParams.get("errorCode");
      const data = url.searchParams.get("data");
      const nonce = url.searchParams.get("nonce");

      // If there's an error from Phantom, log it and clean up
      if (errorCode) {
        console.error("Phantom connect error:", errorCode, url.searchParams.get("errorMessage"));
        // Clean up storage (both localStorage and sessionStorage)
        localStorage.removeItem(PHANTOM_CONNECT_PENDING_KEY);
        localStorage.removeItem(PHANTOM_DAPP_KEYPAIR_KEY);
        localStorage.removeItem("phantom_return_url");
        sessionStorage.removeItem(PHANTOM_CONNECT_PENDING_KEY);
        sessionStorage.removeItem(PHANTOM_DAPP_KEYPAIR_KEY);
        // Clean URL but preserve non-Phantom params
        const cleanUrl = new URL(url);
        cleanUrl.searchParams.delete("errorCode");
        cleanUrl.searchParams.delete("errorMessage");
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
        return null;
      }

      // If we got encrypted data back from Phantom deep link
      if (phantomEncryptionPubKey && data && nonce) {
        try {
          // Retrieve our stored keypair (try localStorage first, then sessionStorage for backwards compat)
          const storedKeypair = localStorage.getItem(PHANTOM_DAPP_KEYPAIR_KEY) ||
                                sessionStorage.getItem(PHANTOM_DAPP_KEYPAIR_KEY);
          if (!storedKeypair) {
            console.error("No stored keypair found for decryption");
            // Clean URL but preserve query params that aren't Phantom-specific
            const cleanUrl = new URL(url);
            cleanUrl.searchParams.delete("phantom_encryption_public_key");
            cleanUrl.searchParams.delete("data");
            cleanUrl.searchParams.delete("nonce");
            window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
            return null;
          }

          const dappSecretKey = bs58.decode(storedKeypair);
          const phantomPubKeyBytes = bs58.decode(phantomEncryptionPubKey);
          const encryptedData = bs58.decode(data);
          const nonceBytes = bs58.decode(nonce);

          // Derive shared secret using X25519
          const sharedSecret = nacl.box.before(phantomPubKeyBytes, dappSecretKey);

          // Decrypt the data
          const decryptedData = nacl.box.open.after(encryptedData, nonceBytes, sharedSecret);
          if (!decryptedData) {
            console.error("Failed to decrypt Phantom response");
            const cleanUrl = new URL(url);
            cleanUrl.searchParams.delete("phantom_encryption_public_key");
            cleanUrl.searchParams.delete("data");
            cleanUrl.searchParams.delete("nonce");
            window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
            return null;
          }

          // Parse the JSON response
          const response = JSON.parse(new TextDecoder().decode(decryptedData));
          console.log("Phantom deep link response:", response);

          if (response.public_key) {
            const walletPubKey = new PublicKey(response.public_key);

            // Clean up storage (both localStorage and sessionStorage)
            localStorage.removeItem(PHANTOM_CONNECT_PENDING_KEY);
            localStorage.removeItem(PHANTOM_DAPP_KEYPAIR_KEY);
            localStorage.removeItem("phantom_return_url");
            sessionStorage.removeItem(PHANTOM_CONNECT_PENDING_KEY);
            sessionStorage.removeItem(PHANTOM_DAPP_KEYPAIR_KEY);

            // Clean URL - remove Phantom params but preserve app params
            const cleanUrl = new URL(url);
            cleanUrl.searchParams.delete("phantom_encryption_public_key");
            cleanUrl.searchParams.delete("data");
            cleanUrl.searchParams.delete("nonce");
            window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);

            return walletPubKey;
          }
        } catch (err) {
          console.error("Failed to parse Phantom callback:", err);
        }

        // Clean up URL even on error - preserve non-Phantom params
        const cleanUrl = new URL(url);
        cleanUrl.searchParams.delete("phantom_encryption_public_key");
        cleanUrl.searchParams.delete("data");
        cleanUrl.searchParams.delete("nonce");
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
      }

      return null;
    };

    const initializeProvider = async () => {
      setIsLoading(true);

      // Check for deep link callback first (returns wallet public key if present)
      const deepLinkPubKey = handleDeepLinkCallback();
      if (deepLinkPubKey) {
        setPublicKey(deepLinkPubKey);
        setIsConnected(true);
        setIsPhantomInstalled(true);
        setConnectionMethod("deeplink");
        setIsLoading(false);
        return;
      }

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
      // Generate a keypair for encrypted communication with Phantom
      const dappKeyPair = nacl.box.keyPair();
      const dappPublicKeyBase58 = bs58.encode(dappKeyPair.publicKey);
      const dappSecretKeyBase58 = bs58.encode(dappKeyPair.secretKey);

      // Store the secret key for decryption when Phantom redirects back
      // Use localStorage instead of sessionStorage so it persists across browser contexts
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(PHANTOM_DAPP_KEYPAIR_KEY, dappSecretKeyBase58);
        localStorage.setItem(PHANTOM_CONNECT_PENDING_KEY, Date.now().toString());
        // Store the current URL so user can return to it
        localStorage.setItem("phantom_return_url", window.location.href);
      }

      // Build redirect URL - preserve existing query params
      const currentUrl = new URL(window.location.href);
      const redirectUrl = encodeURIComponent(currentUrl.toString());
      const appUrl = encodeURIComponent(window.location.origin);

      // Use Phantom Universal Link for mobile with encryption public key
      // This will open the Phantom app if installed, or redirect to app store
      const phantomConnectUrl = `https://phantom.app/ul/v1/connect?app_url=${appUrl}&dapp_encryption_public_key=${dappPublicKeyBase58}&redirect_link=${redirectUrl}&cluster=mainnet-beta`;

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
