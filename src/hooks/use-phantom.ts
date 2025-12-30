"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { detectPlatform, isMobileDevice } from "@/lib/phantom/platform";
import {
  createWalletConnectIntent,
  processWalletCallback,
  buildPhantomConnectUrl,
  buildPhantomSignMessageUrl,
  generateDappKeypair,
  decryptConnectResponse,
  decryptSignMessageResponse,
  storeIntentLocally,
  getStoredIntent,
  clearStoredIntent,
  storeDappKeypair,
  getStoredDappPublicKey,
  getStoredDappSecretKey,
  storePhantomPublicKey,
  getStoredPhantomPublicKey,
  storePhantomSession,
  getStoredPhantomSession,
  storeWalletPublicKey,
  getStoredWalletPublicKey,
  setConnectStep,
  getConnectStep,
  storeRedirectUrl,
  getStoredRedirectUrl,
  clearRedirectUrl,
} from "@/services/wallet-connect.service";

// Try to import the SDK hooks
let useSolanaSDK: (() => { solana: SolanaSDK }) | undefined;
let usePhantomSDK: (() => PhantomSDKState) | undefined;

try {
  const sdk = require("@phantom/react-sdk");
  useSolanaSDK = sdk.useSolana;
  usePhantomSDK = sdk.usePhantom;
} catch {
  // SDK not available
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
  user?: { addresses: string[] };
}

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  isConnected?: boolean;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    phantom?: { solana?: PhantomProvider };
    solana?: PhantomProvider;
  }
}

export type ConnectionMethod = "extension" | "deeplink" | "sdk";

export interface UsePhantomResult {
  publicKey: PublicKey | null;
  isConnected: boolean;
  isPhantomInstalled: boolean;
  isLoading: boolean;
  walletAddress: string | null;
  connectionMethod: ConnectionMethod;
  platform: ReturnType<typeof detectPlatform>;
  connect: () => Promise<PublicKey | null>;
  disconnect: () => Promise<void>;
  signTransaction: (serializedTransaction: string) => Promise<string>;
  signAndSendTransaction: (transaction: Transaction | VersionedTransaction) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
}

// Clean Phantom callback params from URL
function cleanPhantomParams() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const phantomParams = ["phantom_encryption_public_key", "data", "nonce", "errorCode", "errorMessage"];
  let hasParams = false;

  for (const param of phantomParams) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      hasParams = true;
    }
  }

  if (hasParams) {
    window.history.replaceState({}, "", url.pathname + url.search);
  }
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

  // SDK hooks
  let sdkState: PhantomSDKState | undefined;
  let solanaSDK: SolanaSDK | undefined;

  try {
    if (usePhantomSDK) sdkState = usePhantomSDK();
    if (useSolanaSDK) solanaSDK = useSolanaSDK().solana;
  } catch {
    // SDK not in context
  }

  // Handle Phantom deep link callback (mobile two-step flow: connect -> signMessage)
  useEffect(() => {
    const handleCallback = async () => {
      if (typeof window === "undefined") return;

      const url = new URL(window.location.href);
      const phantomPubKey = url.searchParams.get("phantom_encryption_public_key");
      const errorCode = url.searchParams.get("errorCode");
      const encryptedData = url.searchParams.get("data");
      const nonce = url.searchParams.get("nonce");

      // Handle error
      if (errorCode) {
        console.error("Phantom error:", errorCode, url.searchParams.get("errorMessage"));
        clearStoredIntent();
        cleanPhantomParams();
        return;
      }

      // No callback params - nothing to process
      if (!phantomPubKey || !encryptedData || !nonce) {
        return;
      }

      const dappSecretKey = getStoredDappSecretKey();
      if (!dappSecretKey) {
        console.error("No stored dapp secret key for decryption");
        cleanPhantomParams();
        return;
      }

      const currentStep = getConnectStep();
      console.log("Processing Phantom callback, step:", currentStep);

      // Step 1: Handle connect response
      if (currentStep === "connect") {
        const connectResult = decryptConnectResponse(
          phantomPubKey,
          encryptedData,
          nonce,
          dappSecretKey
        );

        if (!connectResult) {
          console.error("Failed to decrypt connect response");
          clearStoredIntent();
          cleanPhantomParams();
          return;
        }

        console.log("Connect successful, wallet:", connectResult.publicKey);

        // Store session data for signMessage step
        storePhantomPublicKey(phantomPubKey);
        storePhantomSession(connectResult.session);
        storeWalletPublicKey(connectResult.publicKey);
        setConnectStep("sign");

        // Clean URL params before redirecting
        cleanPhantomParams();

        // Get stored intent for the message
        const storedIntent = getStoredIntent();
        if (!storedIntent?.message) {
          console.error("No stored message for signing");
          clearStoredIntent();
          return;
        }

        // Build and redirect to signMessage
        const dappPublicKey = getStoredDappPublicKey();
        if (!dappPublicKey) {
          console.error("No stored dapp public key");
          clearStoredIntent();
          return;
        }

        // Use clean path for redirect (original URL with params is stored separately)
        const redirectUrl = window.location.origin + window.location.pathname;
        const signMessageUrl = buildPhantomSignMessageUrl(
          storedIntent.message,
          redirectUrl,
          dappPublicKey,
          connectResult.session,
          nonce
        );

        console.log("Redirecting to signMessage:", signMessageUrl);
        window.location.assign(signMessageUrl);
        return;
      }

      // Step 2: Handle signMessage response
      if (currentStep === "sign") {
        const signResult = decryptSignMessageResponse(
          phantomPubKey,
          encryptedData,
          nonce,
          dappSecretKey
        );

        if (!signResult) {
          console.error("Failed to decrypt signMessage response");
          clearStoredIntent();
          cleanPhantomParams();
          return;
        }

        console.log("SignMessage successful");

        const storedIntent = getStoredIntent();
        const walletPublicKey = getStoredWalletPublicKey();
        const originalUrl = getStoredRedirectUrl();

        if (!storedIntent?.state || !walletPublicKey) {
          console.error("Missing state or wallet public key");
          clearStoredIntent();
          cleanPhantomParams();
          return;
        }

        try {
          // Send to backend callback
          const result = await processWalletCallback({
            state: storedIntent.state,
            publicKey: walletPublicKey,
            signature: signResult.signature,
          });

          if (result.success && result.walletAddress) {
            const walletPubKey = new PublicKey(result.walletAddress);
            setPublicKey(walletPubKey);
            setIsConnected(true);
            setConnectionMethod("deeplink");
            console.log("Wallet connected:", result.walletAddress);

            // Redirect back to original page with query params preserved
            if (originalUrl) {
              clearRedirectUrl();
              cleanPhantomParams();
              // Use replace to avoid back button issues
              window.location.replace(originalUrl);
              return;
            }
          }
        } catch (err) {
          console.error("Callback failed:", err);
        }

        clearStoredIntent();
        cleanPhantomParams();
      }
    };

    handleCallback();
  }, []);

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

      if (isMobile) {
        setIsPhantomInstalled(true);
      }

      // Check SDK first
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
          // Fall through
        }
      }

      // Check browser extension
      const phantomProvider = getProvider();
      setProvider(phantomProvider);
      if (phantomProvider) {
        setIsPhantomInstalled(true);
        if (phantomProvider.publicKey) {
          setPublicKey(phantomProvider.publicKey);
          setIsConnected(true);
          setConnectionMethod("extension");
        }
      }

      setIsLoading(false);
    };

    initializeProvider();
    const t1 = setTimeout(initializeProvider, 100);
    const t2 = setTimeout(initializeProvider, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [sdkState?.isConnected, sdkState?.isLoading, isMobile]);

  // Provider events
  useEffect(() => {
    if (!provider) return;

    const handleConnect = (pk: PublicKey) => { setPublicKey(pk); setIsConnected(true); };
    const handleDisconnect = () => { setPublicKey(null); setIsConnected(false); };
    const handleAccountChanged = (pk: PublicKey | null) => {
      pk ? handleConnect(pk) : handleDisconnect();
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
    // SDK flow
    if (solanaSDK) {
      try {
        const pubKeyStr = await solanaSDK.getPublicKey();
        if (pubKeyStr) {
          const pubKey = new PublicKey(pubKeyStr);

          // Now sign the message for backend verification
          const intent = await createWalletConnectIntent();
          const messageBytes = new TextEncoder().encode(intent.message);
          const signResult = await solanaSDK.signMessage(messageBytes);
          const signatureBase58 = bs58.encode(signResult.signature);

          // Send to backend
          const result = await processWalletCallback({
            state: intent.state,
            publicKey: pubKeyStr,
            signature: signatureBase58,
          });

          if (result.success) {
            setPublicKey(pubKey);
            setIsConnected(true);
            setConnectionMethod("sdk");
            return pubKey;
          }
        }
      } catch (err) {
        console.warn("SDK connect failed:", err);
      }
    }

    // Extension flow (desktop)
    if (provider && !isMobile) {
      try {
        const response = await provider.connect();
        const pubKey = response.publicKey;

        // Sign message for backend verification
        const intent = await createWalletConnectIntent();
        const messageBytes = new TextEncoder().encode(intent.message);
        const signResult = await provider.signMessage(messageBytes);
        const signatureBase58 = bs58.encode(signResult.signature);

        // Send to backend
        const result = await processWalletCallback({
          state: intent.state,
          publicKey: pubKey.toBase58(),
          signature: signatureBase58,
        });

        if (result.success) {
          setPublicKey(pubKey);
          setIsConnected(true);
          setConnectionMethod("extension");
          return pubKey;
        }
      } catch (error) {
        console.error("Extension connect failed:", error);
        throw error;
      }
    }

    // Mobile deep link flow (two-step: connect -> signMessage)
    if (isMobile) {
      try {
        // Create intent
        const intent = await createWalletConnectIntent();
        console.log("Created wallet connect intent");

        // Generate encryption keypair
        const dappKeypair = generateDappKeypair();

        // Store the full current URL (with query params) for restoring after callback
        const fullUrl = window.location.href;
        storeRedirectUrl(fullUrl);

        // Store for callback processing
        storeIntentLocally(intent);
        storeDappKeypair(dappKeypair.publicKey, dappKeypair.secretKey);
        setConnectStep("connect"); // Start with connect step

        // Build redirect URL (current page path only - params will be restored from storage)
        const redirectUrl = window.location.origin + window.location.pathname;

        // Build Phantom connect URL (first step)
        const phantomUrl = buildPhantomConnectUrl(
          redirectUrl,
          dappKeypair.publicKey
        );

        console.log("Redirecting to Phantom connect:", phantomUrl);
        // Redirect to Phantom - use assign for more reliable cross-platform behavior
        window.location.assign(phantomUrl);
        // Return a never-resolving promise to prevent further code execution
        return new Promise(() => {}) as unknown as null;
      } catch (err) {
        console.error("Mobile connect failed:", err);
        throw new Error("Failed to initiate wallet connection");
      }
    }

    // Desktop without extension
    window.open("https://phantom.app/", "_blank");
    throw new Error("Phantom wallet not installed.");
  }, [provider, solanaSDK, isMobile]);

  const disconnect = useCallback(async () => {
    if (provider) {
      try { await provider.disconnect(); } catch {}
    }
    setPublicKey(null);
    setIsConnected(false);
    clearStoredIntent();
  }, [provider]);

  const signTransaction = useCallback(
    async (serializedTransaction: string): Promise<string> => {
      if (!isConnected) throw new Error("Wallet not connected");

      if (solanaSDK) {
        try {
          const tx = Transaction.from(Buffer.from(serializedTransaction, "base64"));
          const signed = await solanaSDK.signTransaction(tx);
          if (signed instanceof Transaction) {
            return Buffer.from(signed.serialize({ requireAllSignatures: false, verifySignatures: false })).toString("base64");
          }
          return Buffer.from(signed.serialize()).toString("base64");
        } catch {}
      }

      if (provider) {
        const tx = Transaction.from(Buffer.from(serializedTransaction, "base64"));
        const signed = await provider.signTransaction(tx);
        return Buffer.from(signed.serialize({ requireAllSignatures: false, verifySignatures: false })).toString("base64");
      }

      throw new Error("No signing method available");
    },
    [provider, solanaSDK, isConnected]
  );

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction | VersionedTransaction): Promise<string> => {
      if (!isConnected) throw new Error("Wallet not connected");

      if (solanaSDK) {
        try {
          const result = await solanaSDK.signAndSendTransaction(transaction);
          return result.signature;
        } catch {}
      }

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
      if (!isConnected) throw new Error("Wallet not connected");

      const encoded = new TextEncoder().encode(message);

      if (solanaSDK) {
        try {
          const response = await solanaSDK.signMessage(encoded);
          return bs58.encode(response.signature);
        } catch {}
      }

      if (provider) {
        const response = await provider.signMessage(encoded);
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
