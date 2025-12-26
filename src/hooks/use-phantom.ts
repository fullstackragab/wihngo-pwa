"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

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

export function usePhantom() {
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);

  useEffect(() => {
    const getProvider = () => {
      if (typeof window === "undefined") return null;

      const phantom = window.phantom?.solana || window.solana;

      if (phantom?.isPhantom) {
        return phantom;
      }
      return null;
    };

    const checkProvider = () => {
      const provider = getProvider();
      setProvider(provider);
      setIsPhantomInstalled(!!provider);

      if (provider?.publicKey) {
        setPublicKey(provider.publicKey);
        setIsConnected(true);
      }
    };

    // Check immediately
    checkProvider();

    // Check again after a short delay (Phantom may load async)
    const timeout = setTimeout(checkProvider, 100);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!provider) return;

    const handleConnect = (publicKey: PublicKey) => {
      setPublicKey(publicKey);
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setPublicKey(null);
      setIsConnected(false);
    };

    const handleAccountChanged = (publicKey: PublicKey | null) => {
      if (publicKey) {
        setPublicKey(publicKey);
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

  const connect = useCallback(async () => {
    if (!provider) {
      // Open Phantom website if not installed
      window.open("https://phantom.app/", "_blank");
      throw new Error("Phantom wallet not installed");
    }

    try {
      const response = await provider.connect();
      setPublicKey(response.publicKey);
      setIsConnected(true);
      return response.publicKey;
    } catch (error) {
      console.error("Failed to connect:", error);
      throw error;
    }
  }, [provider]);

  const disconnect = useCallback(async () => {
    if (!provider) return;

    try {
      await provider.disconnect();
      setPublicKey(null);
      setIsConnected(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
      throw error;
    }
  }, [provider]);

  const signTransaction = useCallback(
    async (serializedTransaction: string): Promise<string> => {
      if (!provider || !isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        // Decode the base64 transaction
        const transactionBuffer = Buffer.from(serializedTransaction, "base64");
        const transaction = Transaction.from(transactionBuffer);

        // Sign the transaction
        const signedTransaction = await provider.signTransaction(transaction);

        // Serialize and return as base64
        const signedBuffer = signedTransaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });

        return Buffer.from(signedBuffer).toString("base64");
      } catch (error) {
        console.error("Failed to sign transaction:", error);
        throw error;
      }
    },
    [provider, isConnected]
  );

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!provider || !isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        const encodedMessage = new TextEncoder().encode(message);
        const response = await provider.signMessage(encodedMessage);
        return bs58.encode(response.signature);
      } catch (error) {
        console.error("Failed to sign message:", error);
        throw error;
      }
    },
    [provider, isConnected]
  );

  return {
    provider,
    publicKey,
    isConnected,
    isPhantomInstalled,
    connect,
    disconnect,
    signTransaction,
    signMessage,
    walletAddress: publicKey?.toBase58() || null,
  };
}
