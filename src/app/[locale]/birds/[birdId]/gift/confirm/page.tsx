"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getBird } from "@/services/bird.service";
import {
  createGiftIntent,
  submitSupport,
  checkWalletBalance,
  linkWallet,
  clearPaymentCache,
} from "@/services/support.service";
import {
  MINIMUM_SOL_FOR_GAS,
  SupportIntentResponse,
} from "@/types/support";
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
  Gift,
  ExternalLink,
  AlertCircle,
  Info,
} from "lucide-react";
import Image from "next/image";
import { ApiError } from "@/services/api-helper";
import { isMobileDevice } from "@/lib/phantom/platform";
import { useTranslations } from "next-intl";

type GiftStep =
  | "connect_wallet"
  | "waiting_for_phantom"
  | "checking_balance"
  | "insufficient_funds"
  | "ready"
  | "creating_intent"
  | "signing"
  | "submitting"
  | "success"
  | "error";

function parseApiError(err: unknown): string {
  if (err instanceof ApiError) {
    const data = err.data as {
      message?: string;
      errors?: { message: string }[];
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

function GiftConfirmContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations("birds");

  const birdId = params.birdId as string;
  const giftAmount = parseFloat(searchParams.get("amount") || "0");

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const {
    isPhantomInstalled,
    isConnected,
    connect,
    signTransaction,
    walletAddress,
  } = usePhantom();

  const [step, setStep] = useState<GiftStep>("connect_wallet");
  const [error, setError] = useState<string>("");
  const [giftIntent, setGiftIntent] = useState<SupportIntentResponse | null>(null);
  const [solanaSignature, setSolanaSignature] = useState<string>("");
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
    mutationFn: (params: { recipientUserId: string; amount: number; birdId: string; userId?: string }) =>
      createGiftIntent({
        recipientUserId: params.recipientUserId,
        amount: params.amount,
        birdId: params.birdId,
        userId: params.userId,
      }),
  });

  const submitMutation = useMutation({
    mutationFn: (data: { intentId: string; signedTransaction: string }) =>
      submitSupport(data.intentId, data.signedTransaction),
  });

  const isMobile = isMobileDevice();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (isConnected && walletAddress && step === "connect_wallet" && giftAmount > 0) {
      linkWallet(walletAddress)
        .then(() => checkBalanceAndProceed())
        .catch((err) => {
          console.error("Wallet link failed:", err);
          const apiError = err as { data?: { error?: string }; message?: string };
          const errorMsg = apiError.data?.error || apiError.message || "Failed to link wallet";
          setError(errorMsg);
        });
    }
  }, [authLoading, isAuthenticated, isConnected, walletAddress, step, giftAmount]);

  const checkBalanceAndProceed = async () => {
    if (!walletAddress) return;

    setStep("checking_balance");
    setError("");

    try {
      const onChainBalance = await checkWalletBalance(walletAddress);

      setBalanceInfo({
        solBalance: onChainBalance.solBalance || 0,
        usdcBalance: onChainBalance.usdcBalance || 0,
      });

      const hasEnoughUsdc = onChainBalance.usdcBalance >= giftAmount;
      const hasEnoughSol = onChainBalance.solBalance >= MINIMUM_SOL_FOR_GAS;

      if (!hasEnoughUsdc || !hasEnoughSol) {
        setStep("insufficient_funds");
        return;
      }

      setStep("ready");
    } catch (err) {
      console.error("Balance check error:", err);
      setError("Failed to check wallet balance. Please try again.");
      setStep("connect_wallet");
    }
  };

  const handleConnectWallet = async () => {
    try {
      setError("");

      const publicKey = await connect();
      if (publicKey) {
        try {
          await linkWallet(publicKey.toBase58());
        } catch (linkErr) {
          console.error("Wallet link failed:", linkErr);
          const apiError = linkErr as { data?: { error?: string }; message?: string };
          const errorMsg = apiError.data?.error || apiError.message || "Failed to link wallet";
          setError(errorMsg);
          return;
        }
      } else if (isMobile) {
        setStep("waiting_for_phantom");
        return;
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handleConfirmGift = async () => {
    if (!walletAddress || !bird?.ownerId) {
      setError("Unable to process gift. Please try again.");
      setStep("error");
      return;
    }

    try {
      setError("");
      setStep("creating_intent");

      // Create gift intent
      const intent = await createIntentMutation.mutateAsync({
        recipientUserId: bird.ownerId,
        amount: giftAmount,
        birdId: birdId,
        userId: user?.userId,
      });
      setGiftIntent(intent);

      // Sign the transaction
      setStep("signing");
      const signedTransaction = await signTransaction(intent.serializedTransaction);

      // Submit to backend
      setStep("submitting");
      const result = await submitMutation.mutateAsync({
        intentId: intent.intentId,
        signedTransaction,
      });

      if (result.solanaSignature) {
        setSolanaSignature(result.solanaSignature);
      }

      if (result.status === "Completed" || result.status === "Confirming" || result.status === "Processing") {
        clearPaymentCache(birdId);
        setStep("success");
      } else if (result.status === "Failed") {
        setError(result.message || "Transaction failed");
        setStep("error");
      } else {
        clearPaymentCache(birdId);
        setStep("success");
      }
    } catch (err) {
      console.error("Gift error:", err);
      setError(parseApiError(err));
      setStep("error");
    }
  };

  if (giftAmount <= 0) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Invalid gift amount</p>
          <Button onClick={() => router.push(`/birds/${birdId}`)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const recipientName = bird?.ownerName || "Caretaker";

  const renderContent = () => {
    switch (step) {
      case "connect_wallet":
        if (error) {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Unable to Connect Wallet
                </h2>
                <p className="text-destructive">{error}</p>
              </div>
              <Button fullWidth variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-muted-foreground">
                Connect your Phantom wallet to send a gift to {recipientName}
              </p>
            </div>

            {!isPhantomInstalled && (
              <Card variant="outlined" padding="md" className="bg-secondary/50 border-secondary">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-foreground/70 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground font-medium">
                      Phantom Wallet Required
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Install Phantom to send USDC on Solana.
                    </p>
                    <a
                      href="https://phantom.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-2 hover:underline"
                    >
                      Get Phantom <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </Card>
            )}

            <Button fullWidth size="lg" onClick={handleConnectWallet}>
              <Wallet className="w-5 h-5 mr-2" />
              Connect Phantom Wallet
            </Button>
          </div>
        );

      case "waiting_for_phantom":
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <LoadingSpinner className="mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Waiting for Phantom
              </h2>
              <p className="text-muted-foreground">
                Please approve the connection request in the Phantom app.
              </p>
            </div>
            <Button fullWidth variant="ghost" onClick={() => {
              setStep("connect_wallet");
              setError("");
            }}>
              Cancel
            </Button>
          </div>
        );

      case "checking_balance":
        return (
          <div className="text-center py-8">
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
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-foreground/70" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Insufficient Balance
              </h2>
            </div>

            <Card variant="outlined" padding="md" className="text-left">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">USDC Balance</span>
                  <span className={`font-medium ${(balanceInfo?.usdcBalance || 0) < giftAmount ? "text-destructive" : "text-foreground"}`}>
                    ${balanceInfo?.usdcBalance?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required</span>
                  <span className="font-medium text-foreground">${giftAmount.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <Button fullWidth onClick={() => checkBalanceAndProceed()}>
                Re-check Balance
              </Button>
              <Button fullWidth variant="outline" onClick={() => window.open("https://jup.ag/", "_blank")}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Get USDC on Jupiter
              </Button>
              <Button variant="ghost" fullWidth onClick={() => router.push(`/birds/${birdId}`)}>
                Cancel
              </Button>
            </div>
          </div>
        );

      case "ready":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Confirm Gift
              </h2>
              <p className="text-muted-foreground">
                Review your gift to {recipientName}
              </p>
            </div>

            {/* Gift Disclaimer */}
            <div className="bg-accent/30 rounded-2xl p-4 border border-accent flex gap-3">
              <Info className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent-foreground">
                {t("giftDisclaimer")}
              </p>
            </div>

            {walletAddress && (
              <Card variant="outlined" padding="md" className="bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Connected Wallet</p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                    </p>
                  </div>
                  {balanceInfo && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">USDC Balance</p>
                      <p className="text-sm font-medium text-foreground">
                        ${balanceInfo.usdcBalance.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card variant="outlined" padding="md">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Gift to {recipientName}</span>
                  <span className="font-medium">${giftAmount.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="font-medium">Total</span>
                  <span className="font-medium text-primary">${giftAmount.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="text-support-green">Minimal (~$0.001)</span>
                </div>
              </div>
            </Card>

            <Button fullWidth size="lg" onClick={handleConfirmGift}>
              <Gift className="w-5 h-5 mr-2" />
              Send ${giftAmount.toFixed(2)} Gift
            </Button>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        );

      case "creating_intent":
        return (
          <div className="text-center py-8">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Preparing Gift
            </h2>
            <p className="text-muted-foreground">Setting up your transaction...</p>
          </div>
        );

      case "signing":
        return (
          <div className="text-center py-8">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Approve Transaction
            </h2>
            <p className="text-muted-foreground">
              Please approve the ${giftAmount.toFixed(2)} USDC transfer in your Phantom wallet
            </p>
          </div>
        );

      case "submitting":
        return (
          <div className="text-center py-8">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Processing Gift
            </h2>
            <p className="text-muted-foreground">
              Submitting your transaction to the blockchain...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Do not close this page
            </p>
          </div>
        );

      case "success":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Gift Sent!</h2>
              <p className="text-muted-foreground">
                Your ${giftAmount.toFixed(2)} gift to {recipientName} was successful!
              </p>
            </div>

            <Card variant="outlined" padding="md" className="text-left">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gift to {recipientName}</span>
                  <span className="font-medium">${giftAmount.toFixed(2)}</span>
                </div>
                {solanaSignature && (
                  <div className="pt-3 border-t border-border">
                    <a
                      href={`https://solscan.io/tx/${solanaSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View on Solscan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-3">
              <Button fullWidth onClick={() => router.push(`/birds/${birdId}`)}>
                <Gift className="w-4 h-4 mr-2" />
                Back to {bird?.name || "Bird"}
              </Button>
              <Button variant="outline" fullWidth onClick={() => router.push("/birds")}>
                Explore More Birds
              </Button>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Gift Failed</h2>
              <p className="text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please try again or contact us if the issue persists.
              </p>
            </div>

            <div className="space-y-3">
              <Button fullWidth onClick={() => setStep("ready")}>
                Try Again
              </Button>
              <Button variant="outline" fullWidth onClick={() => router.push(`/birds/${birdId}`)}>
                Cancel
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen-safe bg-background">
      <header className="border-b border-border pt-safe">
        <div className="px-4 py-4 max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2"
            disabled={step === "signing" || step === "submitting" || step === "creating_intent"}
          >
            <ArrowLeft className="w-6 h-6 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Confirm Gift</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 pb-safe max-w-lg mx-auto">
        {!["success", "error"].includes(step) && bird && (
          <Card variant="outlined" padding="md" className="flex items-center gap-4 mb-6">
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
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground truncate">{bird.name}</h2>
              <p className="text-sm text-muted-foreground">Cared for by {recipientName}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-primary">${giftAmount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Gift</p>
            </div>
          </Card>
        )}

        {renderContent()}
      </main>
    </div>
  );
}

export default function GiftConfirmPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <GiftConfirmContent />
    </Suspense>
  );
}
