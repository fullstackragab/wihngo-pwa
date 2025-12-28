"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getBird } from "@/services/bird.service";
import { createPaymentIntent, confirmPayment, checkWalletBalance } from "@/services/payment.service";
import {
  MINIMUM_SOL_FOR_GAS,
  TransactionConfirmation,
  PaymentIntentResponse,
} from "@/types/payment";
import { useAuth } from "@/contexts/auth-context";
import { usePhantom } from "@/hooks/use-phantom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import {
  ArrowLeft,
  Wallet,
  CheckCircle2,
  XCircle,
  Heart,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { ApiError } from "@/services/api-helper";
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

type PaymentStep =
  | "connect_wallet"
  | "checking_balance"
  | "insufficient_funds"
  | "ready"
  | "creating_intent"
  | "signing_bird"
  | "signing_wihngo"
  | "confirming"
  | "success"
  | "error";

interface ValidationError {
  field?: string;
  message: string;
}

function parseApiError(err: unknown): string {
  if (err instanceof ApiError) {
    const data = err.data as {
      message?: string;
      errors?: ValidationError[];
      error?: string;
    };
    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.map((e) => e.message).join(". ");
    }
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return `Error ${err.status}: ${err.statusText}`;
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}

// USDC has 6 decimals
const USDC_DECIMALS = 6;

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const birdId = searchParams.get("birdId");
  const birdAmountStr = searchParams.get("birdAmount");
  const wihngoAmountStr = searchParams.get("wihngoAmount");
  const birdAmount = parseFloat(birdAmountStr || "0");
  const wihngoAmount = parseFloat(wihngoAmountStr || "0");
  const totalAmount = birdAmount + wihngoAmount;

  const { isAuthenticated } = useAuth();
  const {
    isPhantomInstalled,
    isConnected,
    connect,
    signAndSendTransaction,
    walletAddress,
    publicKey,
  } = usePhantom();

  const [step, setStep] = useState<PaymentStep>("connect_wallet");
  const [error, setError] = useState<string>("");
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null);
  const [birdSignature, setBirdSignature] = useState<string>("");
  const [wihngoSignature, setWihngoSignature] = useState<string>("");
  const [balanceInfo, setBalanceInfo] = useState<{
    solBalance: number;
    usdcBalance: number;
  } | null>(null);

  const { data: bird } = useQuery({
    queryKey: ["bird", birdId],
    queryFn: () => getBird(birdId!),
    enabled: !!birdId && isAuthenticated,
  });

  const createIntentMutation = useMutation({
    mutationFn: () =>
      createPaymentIntent({
        type: "BIRD_SUPPORT",
        birdId: birdId!,
        birdAmount,
        wihngoAmount,
      }),
  });

  const confirmMutation = useMutation({
    mutationFn: (data: { intentId: string; transactions: TransactionConfirmation[] }) =>
      confirmPayment(data),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isAuthenticated, router]);

  // Auto-advance if wallet is already connected
  useEffect(() => {
    if (isConnected && walletAddress && step === "connect_wallet") {
      checkBalanceAndProceed();
    }
  }, [isConnected, walletAddress, step]);

  const checkBalanceAndProceed = async () => {
    if (!walletAddress) return;

    setStep("checking_balance");
    setError("");

    try {
      const data = await checkWalletBalance(walletAddress);

      setBalanceInfo({
        solBalance: data.solBalance || 0,
        usdcBalance: data.usdcBalance || 0,
      });

      const hasEnoughSol = data.solBalance >= MINIMUM_SOL_FOR_GAS;
      const hasEnoughUsdc = data.usdcBalance >= totalAmount;

      if (!hasEnoughSol || !hasEnoughUsdc) {
        setStep("insufficient_funds");
      } else {
        setStep("ready");
      }
    } catch (err) {
      console.error("Balance check error:", err);
      // If balance check fails, still allow proceeding - will validate on-chain
      setStep("ready");
    }
  };

  const handleConnectWallet = async () => {
    try {
      setError("");
      await connect();
      // useEffect will handle the rest when isConnected changes
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const buildUsdcTransferTransaction = async (
    connection: Connection,
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    usdcMint: PublicKey,
    amountUsdc: number
  ): Promise<Transaction> => {
    const fromAta = await getAssociatedTokenAddress(usdcMint, fromPubkey);
    const toAta = await getAssociatedTokenAddress(usdcMint, toPubkey);

    const transaction = new Transaction();

    // Check if destination ATA exists, create if needed
    try {
      await getAccount(connection, toAta);
    } catch {
      // ATA doesn't exist, add instruction to create it
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey, // payer
          toAta, // ata
          toPubkey, // owner
          usdcMint, // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    // Convert amount to USDC units (6 decimals)
    const amountUnits = Math.round(amountUsdc * Math.pow(10, USDC_DECIMALS));

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromAta, // source
        toAta, // destination
        fromPubkey, // owner
        amountUnits // amount
      )
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    return transaction;
  };

  const handleProceedToPayment = async () => {
    if (!publicKey || !walletAddress) {
      setError("Wallet not connected");
      return;
    }

    try {
      setError("");
      setStep("creating_intent");

      // Create payment intent
      const intent = await createIntentMutation.mutateAsync();
      setPaymentIntent(intent);

      // Connect to Solana
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta"),
        "confirmed"
      );

      const usdcMint = new PublicKey(intent.usdcMint);
      const transactions: TransactionConfirmation[] = [];

      // Send bird transfer if there's a bird amount
      if (birdAmount > 0 && intent.birdWallet) {
        setStep("signing_bird");

        const birdWalletPubkey = new PublicKey(intent.birdWallet);
        const birdTx = await buildUsdcTransferTransaction(
          connection,
          publicKey,
          birdWalletPubkey,
          usdcMint,
          birdAmount
        );

        const birdSig = await signAndSendTransaction(birdTx);
        setBirdSignature(birdSig);
        transactions.push({ type: "BIRD", signature: birdSig });
      }

      // Send wihngo transfer if there's a wihngo amount
      if (wihngoAmount > 0) {
        setStep("signing_wihngo");

        const wihngoWalletPubkey = new PublicKey(intent.wihngoWallet);
        const wihngoTx = await buildUsdcTransferTransaction(
          connection,
          publicKey,
          wihngoWalletPubkey,
          usdcMint,
          wihngoAmount
        );

        const wihngoSig = await signAndSendTransaction(wihngoTx);
        setWihngoSignature(wihngoSig);
        transactions.push({ type: "WIHNGO", signature: wihngoSig });
      }

      // Confirm with backend
      setStep("confirming");
      const result = await confirmMutation.mutateAsync({
        intentId: intent.intentId,
        transactions,
      });

      if (result.success) {
        setStep("success");
      } else {
        setError(result.message || "Payment confirmation failed");
        setStep("error");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(parseApiError(err));
      setStep("error");
    }
  };

  if (!birdId || birdAmount <= 0) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Invalid payment details</p>
          <Button onClick={() => router.push("/birds")}>Browse Birds</Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (step) {
      case "connect_wallet":
        return (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-muted-foreground">
                Connect your Phantom wallet to support {bird?.name}
              </p>
            </div>

            {!isPhantomInstalled && (
              <Card variant="outlined" className="mb-6 bg-amber-50 border-amber-200">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">
                      Phantom Wallet Required
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Install Phantom to pay with USDC on Solana.
                    </p>
                    <a
                      href="https://phantom.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-purple-600 font-medium mt-2"
                    >
                      Get Phantom <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </Card>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={handleConnectWallet}
              disabled={!isPhantomInstalled}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Phantom Wallet
            </Button>

            {error && (
              <p className="mt-4 text-sm text-destructive text-center">{error}</p>
            )}
          </>
        );

      case "checking_balance":
        return (
          <div className="text-center py-12">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Checking Balance
            </h2>
            <p className="text-muted-foreground">
              Verifying your wallet has enough USDC...
            </p>
          </div>
        );

      case "insufficient_funds":
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Insufficient Balance
            </h2>

            <Card variant="outlined" className="text-left mb-6 mt-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">USDC Balance</span>
                  <span
                    className={`font-medium ${
                      (balanceInfo?.usdcBalance || 0) < totalAmount
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    ${balanceInfo?.usdcBalance?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required</span>
                  <span className="font-medium text-foreground">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SOL (for gas)</span>
                    <span
                      className={`font-medium ${
                        (balanceInfo?.solBalance || 0) < MINIMUM_SOL_FOR_GAS
                          ? "text-destructive"
                          : "text-foreground"
                      }`}
                    >
                      {balanceInfo?.solBalance?.toFixed(4) || "0"} SOL
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <p className="text-sm text-muted-foreground mb-6">
              You need at least ${totalAmount.toFixed(2)} USDC and ~0.005 SOL for
              transaction fees.
            </p>

            <div className="space-y-3">
              <Button
                fullWidth
                variant="outline"
                onClick={() => window.open("https://jup.ag/", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get USDC on Jupiter
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => router.push(`/bird/${birdId}`)}
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      case "ready":
        return (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Confirm Support
              </h2>
              <p className="text-muted-foreground">
                Review your support for {bird?.name}
              </p>
            </div>

            {walletAddress && (
              <Card variant="outlined" className="mb-6 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Connected Wallet</p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                    </p>
                  </div>
                  {balanceInfo && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">USDC Balance</p>
                      <p className="text-sm font-medium text-foreground">
                        ${balanceInfo.usdcBalance.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card variant="outlined" className="mb-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">To {bird?.name}</span>
                  <span className="font-medium">${birdAmount.toFixed(2)} USDC</span>
                </div>
                {wihngoAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">To Wihngo (optional)</span>
                    <span className="font-medium">${wihngoAmount.toFixed(2)} USDC</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="font-medium">Total</span>
                  <span className="font-medium text-primary">
                    ${totalAmount.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="text-green-600">Minimal (~$0.001)</span>
                </div>
              </div>
            </Card>

            <Button
              fullWidth
              size="lg"
              onClick={handleProceedToPayment}
              className="bg-primary hover:bg-primary/90"
            >
              <Heart className="w-5 h-5 mr-2" />
              Sign & Send ${totalAmount.toFixed(2)}
            </Button>

            {error && (
              <p className="mt-4 text-sm text-destructive text-center">{error}</p>
            )}
          </>
        );

      case "creating_intent":
        return (
          <div className="text-center py-12">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Preparing Payment
            </h2>
            <p className="text-muted-foreground">Setting up your transactions...</p>
          </div>
        );

      case "signing_bird":
        return (
          <div className="text-center py-12">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Approve Transfer to {bird?.name}
            </h2>
            <p className="text-muted-foreground">
              Please approve the ${birdAmount.toFixed(2)} USDC transfer in your Phantom
              wallet
            </p>
          </div>
        );

      case "signing_wihngo":
        return (
          <div className="text-center py-12">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Approve Wihngo Support
            </h2>
            <p className="text-muted-foreground">
              Please approve the ${wihngoAmount.toFixed(2)} USDC transfer in your Phantom
              wallet
            </p>
          </div>
        );

      case "confirming":
        return (
          <div className="text-center py-12">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Confirming Payment
            </h2>
            <p className="text-muted-foreground">
              Verifying your transactions on the blockchain...
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-2">
              Your support for {bird?.name} was successful!
            </p>

            <Card variant="outlined" className="text-left mb-6 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To {bird?.name}</span>
                  <span className="font-medium">${birdAmount.toFixed(2)}</span>
                </div>
                {wihngoAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To Wihngo</span>
                    <span className="font-medium">${wihngoAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-medium">Total</span>
                  <span className="font-medium text-primary">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <Button fullWidth onClick={() => router.push(`/bird/${birdId}`)}>
                <Heart className="w-4 h-4 mr-2" />
                Back to {bird?.name}
              </Button>
              <Button variant="outline" fullWidth onClick={() => router.push("/birds")}>
                Support More Birds
              </Button>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Payment Failed</h2>
            <p className="text-destructive mb-2">{error}</p>
            <p className="text-sm text-muted-foreground mb-6">
              Please try again or contact support if the issue persists.
            </p>

            <div className="space-y-3">
              <Button fullWidth onClick={() => setStep("ready")}>
                Try Again
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push(`/bird/${birdId}`)}
              >
                Cancel
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen-safe bg-background">
      <header className="px-4 py-4 pt-safe border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2"
            disabled={
              step === "signing_bird" ||
              step === "signing_wihngo" ||
              step === "confirming" ||
              step === "creating_intent"
            }
          >
            <ArrowLeft className="w-6 h-6 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Complete Payment</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {bird && !["success", "error"].includes(step) && (
          <Card variant="outlined" className="flex items-center gap-4 mb-8">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
              {bird.imageUrl ? (
                <Image
                  src={bird.imageUrl}
                  alt={bird.name || "Bird"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">
                  🐦
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">{bird.name}</h2>
              <p className="text-sm text-muted-foreground">{bird.species}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">${totalAmount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">USDC</p>
            </div>
          </Card>
        )}

        {renderContent()}
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PaymentContent />
    </Suspense>
  );
}
