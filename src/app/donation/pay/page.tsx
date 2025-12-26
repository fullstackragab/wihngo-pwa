"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getBird } from "@/services/bird.service";
import { createPaymentIntent, submitPayment } from "@/services/payment.service";
import { useAuth } from "@/contexts/auth-context";
import { usePhantom } from "@/hooks/use-phantom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import { ArrowLeft, Wallet, CheckCircle2, XCircle, Heart, ExternalLink, AlertCircle } from "lucide-react";
import Image from "next/image";
import { ApiError } from "@/services/api-helper";

type PaymentStep =
  | "connect_wallet"
  | "checking_balance"
  | "insufficient_funds"
  | "ready"
  | "signing"
  | "submitting"
  | "success"
  | "error";

interface ValidationError {
  field?: string;
  message: string;
}

const MINIMUM_SOL_FOR_GAS = 0.005; // ~0.005 SOL needed for transaction fees

function parseApiError(err: unknown): string {
  if (err instanceof ApiError) {
    const data = err.data as { message?: string; errors?: ValidationError[]; error?: string };
    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.map(e => e.message).join(". ");
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
  const amountStr = searchParams.get("amount");
  const amount = parseFloat(amountStr || "0");

  const { isAuthenticated } = useAuth();
  const {
    isPhantomInstalled,
    isConnected,
    connect,
    signTransaction,
    walletAddress
  } = usePhantom();

  const [step, setStep] = useState<PaymentStep>("connect_wallet");
  const [error, setError] = useState<string>("");
  const [paymentId, setPaymentId] = useState<string>("");
  const [serializedTx, setSerializedTx] = useState<string>("");
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
    mutationFn: () => createPaymentIntent({
      birdId: birdId!,
      supportAmount: amount,
      platformSupportAmount: 0,
      currency: "USDC",
      walletAddress: walletAddress!,
    }),
  });

  const submitMutation = useMutation({
    mutationFn: submitPayment,
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
      // Call backend to check wallet balances
      const response = await fetch(`/api/wallets/${walletAddress}/balance`);
      if (!response.ok) {
        throw new Error("Failed to check balance");
      }
      const data = await response.json();

      setBalanceInfo({
        solBalance: data.solBalance || 0,
        usdcBalance: data.usdcBalance || 0,
      });

      const hasEnoughSol = data.solBalance >= MINIMUM_SOL_FOR_GAS;
      const hasEnoughUsdc = data.usdcBalance >= amount;

      if (!hasEnoughSol || !hasEnoughUsdc) {
        setStep("insufficient_funds");
      } else {
        setStep("ready");
      }
    } catch (err) {
      console.error("Balance check error:", err);
      // If balance check fails, still allow proceeding - backend will validate
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
    try {
      setError("");
      setStep("signing");

      // Create payment intent with wallet address
      const intent = await createIntentMutation.mutateAsync();
      setPaymentId(intent.paymentId);

      if (!intent.serializedTransaction) {
        throw new Error("No transaction to sign");
      }

      setSerializedTx(intent.serializedTransaction);

      // Sign the transaction
      const signedTx = await signTransaction(intent.serializedTransaction);

      setStep("submitting");

      // Submit signed transaction
      const result = await submitMutation.mutateAsync({
        paymentId: intent.paymentId,
        signedTransaction: signedTx,
      });

      if (result.status === "Completed" || result.status === "Confirmed" || result.solanaSignature) {
        setStep("success");
      } else if (result.errorMessage) {
        setError(result.errorMessage);
        setStep("error");
      } else {
        setStep("success");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(parseApiError(err));
      setStep("error");
    }
  };

  if (!birdId || !amount || amount <= 0) {
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
              <h2 className="text-xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground">
                Connect your Phantom wallet to support {bird?.name}
              </p>
            </div>

            {!isPhantomInstalled && (
              <Card variant="outlined" className="mb-6 bg-amber-50 border-amber-200">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Phantom Wallet Required</p>
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

            {error && <p className="mt-4 text-sm text-destructive text-center">{error}</p>}
          </>
        );

      case "checking_balance":
        return (
          <div className="text-center py-12">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Checking Balance</h2>
            <p className="text-muted-foreground">Verifying your wallet has enough USDC...</p>
          </div>
        );

      case "insufficient_funds":
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Insufficient Balance</h2>

            <Card variant="outlined" className="text-left mb-6 mt-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">USDC Balance</span>
                  <span className={`font-medium ${(balanceInfo?.usdcBalance || 0) < amount ? 'text-destructive' : 'text-foreground'}`}>
                    ${balanceInfo?.usdcBalance?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required</span>
                  <span className="font-medium text-foreground">${amount.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SOL (for gas)</span>
                    <span className={`font-medium ${(balanceInfo?.solBalance || 0) < MINIMUM_SOL_FOR_GAS ? 'text-destructive' : 'text-foreground'}`}>
                      {balanceInfo?.solBalance?.toFixed(4) || '0'} SOL
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <p className="text-sm text-muted-foreground mb-6">
              You need at least ${amount.toFixed(2)} USDC and ~0.005 SOL for transaction fees.
            </p>

            <div className="space-y-3">
              <Button
                fullWidth
                variant="outline"
                onClick={() => window.open('https://jup.ag/', '_blank')}
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
              <h2 className="text-xl font-bold text-foreground mb-2">Confirm Support</h2>
              <p className="text-muted-foreground">
                You're about to support {bird?.name} with ${amount.toFixed(2)} USDC
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Support Amount</span>
                  <span className="font-medium">${amount.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="font-medium text-green-600">Minimal (~$0.001)</span>
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
              Sign & Send ${amount.toFixed(2)}
            </Button>

            {error && <p className="mt-4 text-sm text-destructive text-center">{error}</p>}
          </>
        );

      case "signing":
        return (
          <div className="text-center py-12">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Approve in Wallet</h2>
            <p className="text-muted-foreground">
              Please approve the transaction in your Phantom wallet
            </p>
          </div>
        );

      case "submitting":
        return (
          <div className="text-center py-12">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Processing</h2>
            <p className="text-muted-foreground">Submitting your support to the blockchain...</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your support of ${amount.toFixed(2)} for {bird?.name} was successful!
            </p>

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
              <Button fullWidth onClick={() => setStep("ready")}>Try Again</Button>
              <Button variant="outline" fullWidth onClick={() => router.push(`/bird/${birdId}`)}>
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
            disabled={step === "signing" || step === "submitting"}
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
                <Image src={bird.imageUrl} alt={bird.name || "Bird"} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🐦</div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">{bird.name}</h2>
              <p className="text-sm text-muted-foreground">{bird.species}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">${amount.toFixed(2)}</p>
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
