"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { detectPlatform, isMobileDevice } from "@/lib/phantom/platform";

// Storage keys for mobile deep link flow
const PHANTOM_CONNECT_PENDING_KEY = "phantom_connect_pending";
const PHANTOM_DAPP_KEYPAIR_KEY = "phantom_dapp_keypair";
const PHANTOM_CONNECTION_ID_KEY = "phantom_connection_id";

// Server-side decryption for cross-browser support
async function serverDecrypt(
  connectionId: string,
  phantomEncryptionPublicKey: string,
  data: string,
  nonce: string
): Promise<string | null> {
  try {
    const response = await fetch("/api/phantom?action=decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectionId,
        phantomEncryptionPublicKey,
        data,
        nonce,
      }),
    });

    if (!response.ok) {
      console.error("Server decrypt failed:", response.status);
      return null;
    }

    const result = await response.json();
    if (result.success && result.walletAddress) {
      return result.walletAddress;
    }
    return null;
  } catch (err) {
    console.error("Server decrypt error:", err);
    return null;
  }
}

// Initialize connection on server (generates keypair server-side)
async function initServerConnection(): Promise<{ connectionId: string; dappPublicKey: string } | null> {
  try {
    const response = await fetch("/api/phantom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error("Server init failed:", response.status);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error("Server init error:", err);
    return null;
  }
}

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

    // Clean Phantom params from URL while preserving other params
    const cleanPhantomParams = (url: URL) => {
      const cleanUrl = new URL(url);
      cleanUrl.searchParams.delete("phantom_encryption_public_key");
      cleanUrl.searchParams.delete("data");
      cleanUrl.searchParams.delete("nonce");
      cleanUrl.searchParams.delete("errorCode");
      cleanUrl.searchParams.delete("errorMessage");
      cleanUrl.searchParams.delete("phantom_connection_id");
      window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
    };

    // Clean up all storage
    const cleanupStorage = () => {
      localStorage.removeItem(PHANTOM_CONNECT_PENDING_KEY);
      localStorage.removeItem(PHANTOM_DAPP_KEYPAIR_KEY);
      localStorage.removeItem(PHANTOM_CONNECTION_ID_KEY);
      localStorage.removeItem("phantom_return_url");
      sessionStorage.removeItem(PHANTOM_CONNECT_PENDING_KEY);
      sessionStorage.removeItem(PHANTOM_DAPP_KEYPAIR_KEY);
      sessionStorage.removeItem(PHANTOM_CONNECTION_ID_KEY);
    };

    // Check for Phantom deep link callback (mobile flow) - now async for server decryption
    const handleDeepLinkCallback = async (): Promise<PublicKey | null> => {
      if (typeof window === "undefined") return null;

      const url = new URL(window.location.href);
      const phantomEncryptionPubKey = url.searchParams.get("phantom_encryption_public_key");
      const errorCode = url.searchParams.get("errorCode");
      const data = url.searchParams.get("data");
      const nonce = url.searchParams.get("nonce");
      // Connection ID can come from URL param or localStorage
      const connectionIdFromUrl = url.searchParams.get("phantom_connection_id");
      const connectionIdFromStorage = localStorage.getItem(PHANTOM_CONNECTION_ID_KEY) ||
                                      sessionStorage.getItem(PHANTOM_CONNECTION_ID_KEY);
      const connectionId = connectionIdFromUrl || connectionIdFromStorage;

      // If there's an error from Phantom, log it and clean up
      if (errorCode) {
        console.error("Phantom connect error:", errorCode, url.searchParams.get("errorMessage"));
        cleanupStorage();
        cleanPhantomParams(url);
        return null;
      }

      // If we got encrypted data back from Phantom deep link
      if (phantomEncryptionPubKey && data && nonce) {
        let walletAddress: string | null = null;

        // First, try local decryption (same browser that started the flow)
        const storedKeypair = localStorage.getItem(PHANTOM_DAPP_KEYPAIR_KEY) ||
                              sessionStorage.getItem(PHANTOM_DAPP_KEYPAIR_KEY);

        if (storedKeypair) {
          try {
            const dappSecretKey = bs58.decode(storedKeypair);
            const phantomPubKeyBytes = bs58.decode(phantomEncryptionPubKey);
            const encryptedData = bs58.decode(data);
            const nonceBytes = bs58.decode(nonce);

            const sharedSecret = nacl.box.before(phantomPubKeyBytes, dappSecretKey);
            const decryptedData = nacl.box.open.after(encryptedData, nonceBytes, sharedSecret);

            if (decryptedData) {
              const response = JSON.parse(new TextDecoder().decode(decryptedData));
              console.log("Phantom deep link response (local decrypt):", response);
              walletAddress = response.public_key;
            }
          } catch (err) {
            console.error("Local decryption failed:", err);
          }
        }

        // If local decryption failed and we have a connection ID, try server-side decryption
        // This handles the cross-browser case (PWA -> Samsung Browser)
        if (!walletAddress && connectionId) {
          console.log("Trying server-side decryption with connection ID:", connectionId);
          walletAddress = await serverDecrypt(connectionId, phantomEncryptionPubKey, data, nonce);
          if (walletAddress) {
            console.log("Server decryption successful:", walletAddress);
          }
        }

        // Clean up and return result
        cleanupStorage();
        cleanPhantomParams(url);

        if (walletAddress) {
          // Store wallet address for cross-browser access
          localStorage.setItem("phantom_wallet_address", walletAddress);
          return new PublicKey(walletAddress);
        }

        // If we couldn't decrypt but have the encrypted data, we're in the wrong browser
        // Store a flag so the original browser/PWA knows to check
        if (!walletAddress) {
          console.log("Could not decrypt - likely wrong browser. Storing pending state.");
          localStorage.setItem("phantom_pending_wallet_check", "true");
        }
      }

      // Check if there's a stored wallet address from a successful cross-browser connection
      const storedWalletAddress = localStorage.getItem("phantom_wallet_address");
      if (storedWalletAddress) {
        try {
          const pubKey = new PublicKey(storedWalletAddress);
          // Clear it after use
          localStorage.removeItem("phantom_wallet_address");
          return pubKey;
        } catch {
          localStorage.removeItem("phantom_wallet_address");
        }
      }

      return null;
    };

    const initializeProvider = async () => {
      setIsLoading(true);

      // Check for deep link callback first (returns wallet public key if present)
      const deepLinkPubKey = await handleDeepLinkCallback();
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
      // Try server-side keypair generation first (for cross-browser support)
      const serverInit = await initServerConnection();

      let dappPublicKeyBase58: string;
      let connectionId: string | null = null;

      if (serverInit) {
        // Server-side keypair - works across browsers
        dappPublicKeyBase58 = serverInit.dappPublicKey;
        connectionId = serverInit.connectionId;
        localStorage.setItem(PHANTOM_CONNECTION_ID_KEY, connectionId);
      } else {
        // Fallback to local keypair generation
        const dappKeyPair = nacl.box.keyPair();
        dappPublicKeyBase58 = bs58.encode(dappKeyPair.publicKey);
        const dappSecretKeyBase58 = bs58.encode(dappKeyPair.secretKey);
        localStorage.setItem(PHANTOM_DAPP_KEYPAIR_KEY, dappSecretKeyBase58);
      }

      // Store pending state
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(PHANTOM_CONNECT_PENDING_KEY, Date.now().toString());
        localStorage.setItem("phantom_return_url", window.location.href);
      }

      // Build redirect URL - include connection_id if we have one
      const currentUrl = new URL(window.location.href);
      if (connectionId) {
        currentUrl.searchParams.set("phantom_connection_id", connectionId);
      }
      const redirectUrl = encodeURIComponent(currentUrl.toString());
      const appUrl = encodeURIComponent(window.location.origin);

      // Use Phantom Universal Link for mobile with encryption public key
      const phantomConnectUrl = `https://phantom.app/ul/v1/connect?app_url=${appUrl}&dapp_encryption_public_key=${dappPublicKeyBase58}&redirect_link=${redirectUrl}&cluster=mainnet-beta`;

      // Use window.location.href for better mobile compatibility
      window.location.href = phantomConnectUrl;

      // Return null - the app will redirect back after connection
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
