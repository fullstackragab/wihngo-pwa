"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getBird } from "@/services/bird.service";
import {
  preflightCheck,
  createPaymentIntent,
  submitPayment,
} from "@/services/payment.service";
import {
  MINIMUM_SOL_FOR_GAS,
  PaymentIntentResponse,
  PreflightResponse,
  SubmitPaymentResponse,
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

type PaymentStep =
  | "connect_wallet"
  | "checking_balance"
  | "insufficient_funds"
  | "ready"
  | "creating_intent"
  | "signing"
  | "submitting"
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
    signTransaction,
    walletAddress,
  } = usePhantom();

  const [step, setStep] = useState<PaymentStep>("connect_wallet");
  const [error, setError] = useState<string>("");
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null);
  const [preflightData, setPreflightData] = useState<PreflightResponse | null>(null);
  const [solanaSignature, setSolanaSignature] = useState<string>("");
  const [balanceInfo, setBalanceInfo] = useState<{
    solBalance: number;
    usdcBalance: number;
  } | null>(null);

  const { data: bird } = useQuery({
    queryKey: ["bird", birdId],
    queryFn: () => getBird(birdId!),
    enabled: !!birdId && birdId !== "wihngo" && isAuthenticated,
  });

  const preflightMutation = useMutation({
    mutationFn: () =>
      preflightCheck({
        birdId: birdId!,
        birdAmount,
        wihngoSupportAmount: wihngoAmount,
      }),
  });

  const createIntentMutation = useMutation({
    mutationFn: () =>
      createPaymentIntent({
        birdId: birdId!,
        birdAmount,
        wihngoAmount,
      }),
  });

  const submitMutation = useMutation({
    mutationFn: (data: { intentId: string; signedTransaction: string }) =>
      submitPayment(data.intentId, data.signedTransaction),
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
      // Use preflight endpoint to check if user can make payment
      const data = await preflightMutation.mutateAsync();
      setPreflightData(data);

      setBalanceInfo({
        solBalance: data.solBalance || 0,
        usdcBalance: data.usdcBalance || 0,
      });

      if (!data.canSupport) {
        // Backend tells us user can't support
        if (data.errorCode) {
          setError(data.message || "Unable to process payment");
        }
        setStep("insufficient_funds");
      } else {
        setStep("ready");
      }
    } catch (err) {
      console.error("Preflight check error:", err);
      // If preflight fails, still allow proceeding - will validate on create intent
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

  const handleProceedToPayment = async () => {
    if (!walletAddress) {
      setError("Wallet not connected");
      return;
    }

    try {
      setError("");
      setStep("creating_intent");

      // Step 1: Create payment intent - backend builds the transaction
      const intent = await createIntentMutation.mutateAsync();
      setPaymentIntent(intent);

      // Step 2: Sign the transaction with Phantom (just sign, don't send)
      setStep("signing");
      const signedTransaction = await signTransaction(intent.serializedTransaction);

      // Step 3: Submit signed transaction to backend - backend submits to Solana
      setStep("submitting");
      const result = await submitMutation.mutateAsync({
        intentId: intent.intentId,
        signedTransaction,
      });

      // Store the Solana signature for display
      if (result.solanaSignature) {
        setSolanaSignature(result.solanaSignature);
      }

      // Check status
      if (result.status === "Completed" || result.status === "Confirming" || result.status === "Processing") {
        setStep("success");
      } else if (result.status === "Failed") {
        setError(result.message || "Payment failed");
        setStep("error");
      } else {
        // For other statuses, treat as success (backend is processing)
        setStep("success");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(parseApiError(err));
      setStep("error");
    }
  };

  // Allow bird support (birdAmount > 0) or wihngo-only support (wihngoAmount > 0)
  const isWihngoOnly = birdId === "wihngo" && wihngoAmount > 0;
  const isBirdSupport = birdId && birdId !== "wihngo" && birdAmount > 0;

  // Display name for UI
  const recipientName = isWihngoOnly ? "Wihngo" : (bird?.name || preflightData?.bird?.name || "Bird");

  if (!isWihngoOnly && !isBirdSupport) {
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
                Connect your Phantom wallet to support {recipientName}
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
                Review your support for {recipientName}
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
                {birdAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">To {recipientName}</span>
                    <span className="font-medium">${birdAmount.toFixed(2)} USDC</span>
                  </div>
                )}
                {wihngoAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {isWihngoOnly ? "To Wihngo" : "To Wihngo (optional)"}
                    </span>
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

      case "signing":
        return (
          <div className="text-center py-12">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Approve Transaction
            </h2>
            <p className="text-muted-foreground">
              Please approve the ${totalAmount.toFixed(2)} USDC transfer in your Phantom wallet
            </p>
          </div>
        );

      case "submitting":
        return (
          <div className="text-center py-12">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Processing Payment
            </h2>
            <p className="text-muted-foreground">
              Submitting your transaction to the blockchain...
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
              Your support for {recipientName} was successful!
            </p>

            <Card variant="outlined" className="text-left mb-6 mt-4">
              <div className="space-y-2">
                {birdAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To {recipientName}</span>
                    <span className="font-medium">${birdAmount.toFixed(2)}</span>
                  </div>
                )}
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
                {solanaSignature && (
                  <div className="pt-2 border-t border-border">
                    <a
                      href={`https://solscan.io/tx/${solanaSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline"
                    >
                      View on Solscan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-3">
              <Button fullWidth onClick={() => router.push(isWihngoOnly ? "/" : `/bird/${birdId}`)}>
                <Heart className="w-4 h-4 mr-2" />
                {isWihngoOnly ? "Back to Home" : `Back to ${recipientName}`}
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
              step === "signing" ||
              step === "submitting" ||
              step === "creating_intent"
            }
          >
            <ArrowLeft className="w-6 h-6 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Complete Payment</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {!["success", "error"].includes(step) && (
          <Card variant="outlined" className="flex items-center gap-4 mb-8">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
              {isWihngoOnly ? (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
              ) : bird?.imageUrl ? (
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
              <h2 className="font-semibold text-foreground">{recipientName}</h2>
              <p className="text-sm text-muted-foreground">
                {isWihngoOnly ? "Platform Support" : bird?.species || "Bird"}
              </p>
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
