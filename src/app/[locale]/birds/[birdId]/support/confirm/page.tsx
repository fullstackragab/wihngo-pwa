"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getBird } from "@/services/bird.service";
import {
  preflightCheck,
  createSupportIntent,
  submitSupport,
  checkWalletBalance,
  linkWallet,
} from "@/services/support.service";
import {
  MINIMUM_SOL_FOR_GAS,
  SupportIntentResponse,
  PreflightResponse,
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
  Heart,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { ApiError } from "@/services/api-helper";
import { isMobileDevice } from "@/lib/phantom/platform";

type SupportStep =
  | "connect_wallet"
  | "waiting_for_phantom"
  | "checking_balance"
  | "insufficient_funds"
  | "validation_failed"
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

function SupportConfirmContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Get birdId from route params
  const birdId = params.birdId as string;
  // Get amounts from query params
  const birdAmountStr = searchParams.get("birdAmount");
  const wihngoAmountStr = searchParams.get("wihngoAmount");
  const birdAmount = parseFloat(birdAmountStr || "0");
  const wihngoAmount = parseFloat(wihngoAmountStr || "0");
  const totalAmount = birdAmount + wihngoAmount;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    isPhantomInstalled,
    isConnected,
    connect,
    signTransaction,
    walletAddress,
  } = usePhantom();

  const [step, setStep] = useState<SupportStep>("connect_wallet");
  const [error, setError] = useState<string>("");
  const [supportIntent, setSupportIntent] = useState<SupportIntentResponse | null>(null);
  const [preflightData, setPreflightData] = useState<PreflightResponse | null>(null);
  const [solanaSignature, setSolanaSignature] = useState<string>("");
  const [balanceInfo, setBalanceInfo] = useState<{
    solBalance: number;
    usdcBalance: number;
  } | null>(null);

  // Check if this is Wihngo-only support (special case)
  const isWihngoOnly = birdId === "wihngo" && wihngoAmount > 0;

  const { data: bird } = useQuery({
    queryKey: ["bird", birdId],
    queryFn: () => getBird(birdId!),
    enabled: !!birdId && !isWihngoOnly && isAuthenticated,
  });

  const preflightMutation = useMutation({
    mutationFn: (params: {
      walletAddr: string;
      birdAmt: number;
      wihngoAmt: number;
    }) =>
      preflightCheck({
        birdId: birdId!,
        birdAmount: params.birdAmt,
        wihngoSupportAmount: params.wihngoAmt,
        walletAddress: params.walletAddr,
      }),
  });

  const createIntentMutation = useMutation({
    mutationFn: (params: { birdAmt: number; wihngoAmt: number }) =>
      createSupportIntent({
        birdId: birdId!,
        birdAmount: params.birdAmt,
        wihngoAmount: params.wihngoAmt,
      }),
  });

  const submitMutation = useMutation({
    mutationFn: (data: { intentId: string; signedTransaction: string }) =>
      submitSupport(data.intentId, data.signedTransaction),
  });

  const isMobile = isMobileDevice();

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  // Check for pending Phantom mobile connection on mount
  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;

    const pendingTimestamp = sessionStorage.getItem("phantom_connect_pending");
    if (pendingTimestamp) {
      const elapsed = Date.now() - parseInt(pendingTimestamp, 10);
      // If pending for less than 5 minutes, show waiting state
      if (elapsed < 5 * 60 * 1000) {
        setStep("waiting_for_phantom");
        // If wallet is now connected, clear pending and proceed
        if (isConnected && walletAddress) {
          sessionStorage.removeItem("phantom_connect_pending");
          linkWallet(walletAddress)
            .then(() => checkBalanceAndProceed())
            .catch((err) => {
              console.warn("Wallet link failed, proceeding anyway:", err);
              checkBalanceAndProceed();
            });
        }
      } else {
        // Pending expired, clear it
        sessionStorage.removeItem("phantom_connect_pending");
      }
    }
  }, [isConnected, walletAddress]);

  // Auto-advance if wallet is already connected and amounts are valid
  useEffect(() => {
    // Wait for auth to load first
    if (authLoading || !isAuthenticated) return;

    // Wait for amounts to be parsed from URL
    const hasValidAmounts = totalAmount > 0;
    // Also handle the case where we're waiting for Phantom and the wallet connected
    if (isConnected && walletAddress && (step === "connect_wallet" || step === "waiting_for_phantom") && hasValidAmounts) {
      // Clear any pending mobile state
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("phantom_connect_pending");
      }
      // Ensure wallet is linked to backend, then proceed
      linkWallet(walletAddress)
        .then(() => checkBalanceAndProceed())
        .catch((err) => {
          console.warn("Wallet link failed, proceeding anyway:", err);
          checkBalanceAndProceed();
        });
    }
  }, [authLoading, isAuthenticated, isConnected, walletAddress, step, totalAmount]);

  const checkBalanceAndProceed = async () => {
    if (!walletAddress) return;

    setStep("checking_balance");
    setError("");

    try {
      // First, get on-chain balance directly (more reliable)
      const onChainBalance = await checkWalletBalance(walletAddress);

      setBalanceInfo({
        solBalance: onChainBalance.solBalance || 0,
        usdcBalance: onChainBalance.usdcBalance || 0,
      });

      // Check if user has enough balance
      const hasEnoughUsdc = onChainBalance.usdcBalance >= totalAmount;
      const hasEnoughSol = onChainBalance.solBalance >= MINIMUM_SOL_FOR_GAS;

      if (!hasEnoughUsdc || !hasEnoughSol) {
        setStep("insufficient_funds");
        return;
      }

      // Also run preflight for additional validation (bird exists, etc.)
      try {
        const data = await preflightMutation.mutateAsync({
          walletAddr: walletAddress,
          birdAmt: birdAmount,
          wihngoAmt: wihngoAmount,
        });
        setPreflightData(data);

        if (!data.canSupport) {
          setError(data.message || "Unable to process support");
          setStep("validation_failed");
          return;
        }
      } catch (preflightErr) {
        // Preflight failed but we have balance, allow proceeding
        console.warn("Preflight check failed, proceeding with on-chain balance:", preflightErr);
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
        // Link wallet to user account in backend
        await linkWallet(publicKey.toBase58());
      } else if (isMobile) {
        // On mobile, connect() returns null because it redirects to Phantom app
        // Set waiting state - the page will reload when user returns
        setStep("waiting_for_phantom");
        return; // Don't show error, this is expected
      }
      // useEffect will handle the rest when isConnected changes
    } catch (err) {
      console.error("Wallet connection error:", err);
      // On mobile, don't show error if we're in the middle of a redirect flow
      const isPendingMobile = typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("phantom_connect_pending");
      if (isPendingMobile && isMobile) {
        setStep("waiting_for_phantom");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handleConfirmSupport = async () => {
    if (!walletAddress) {
      setError("Wallet not connected");
      return;
    }

    try {
      setError("");
      setStep("creating_intent");

      // Step 1: Create support intent - backend builds the transaction
      const intent = await createIntentMutation.mutateAsync({
        birdAmt: birdAmount,
        wihngoAmt: wihngoAmount,
      });
      setSupportIntent(intent);

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
        setError(result.message || "Support failed");
        setStep("error");
      } else {
        // For other statuses, treat as success (backend is processing)
        setStep("success");
      }
    } catch (err) {
      console.error("Support error:", err);
      setError(parseApiError(err));
      setStep("error");
    }
  };

  // Allow bird support (birdAmount > 0) or wihngo-only support (wihngoAmount > 0)
  const isBirdSupport = birdId && !isWihngoOnly && birdAmount > 0;

  // Display name for UI
  const recipientName = isWihngoOnly ? "Wihngo" : (bird?.name || preflightData?.bird?.name || "Bird");

  if (!isWihngoOnly && !isBirdSupport) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Invalid support details</p>
          <Button onClick={() => router.push("/birds")}>Browse Birds</Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (step) {
      case "connect_wallet":
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
                Connect your Phantom wallet to support {recipientName}
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

            <Button
              fullWidth
              size="lg"
              onClick={handleConnectWallet}
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Phantom Wallet
            </Button>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
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
              <p className="text-sm text-muted-foreground mt-4">
                Return here after approving in Phantom.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                fullWidth
                variant="outline"
                onClick={() => {
                  // Try to open Phantom again
                  const currentUrl = window.location.href;
                  const appUrl = encodeURIComponent(window.location.origin);
                  const redirectUrl = encodeURIComponent(currentUrl);
                  window.location.href = `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirectUrl}&cluster=mainnet-beta`;
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Phantom App
              </Button>
              <Button
                fullWidth
                variant="ghost"
                onClick={() => {
                  sessionStorage.removeItem("phantom_connect_pending");
                  setStep("connect_wallet");
                  setError("");
                }}
              >
                Cancel
              </Button>
            </div>
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

            <p className="text-sm text-muted-foreground text-center">
              You need at least ${totalAmount.toFixed(2)} USDC and ~0.005 SOL for
              transaction fees.
            </p>

            <div className="space-y-3">
              <Button
                fullWidth
                onClick={() => checkBalanceAndProceed()}
              >
                Re-check Balance
              </Button>
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
                onClick={() => router.push(`/birds/${birdId}`)}
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      case "validation_failed":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Heart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Support Temporarily Unavailable
              </h2>
              <p className="text-muted-foreground">
                {error || "This bird is not currently able to receive support. Please check back later or explore other birds."}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                fullWidth
                onClick={() => router.push("/birds")}
              >
                Explore Other Birds
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push(`/birds/${birdId}`)}
              >
                View {recipientName}&apos;s Profile
              </Button>
            </div>
          </div>
        );

      case "ready":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Confirm Support
              </h2>
              <p className="text-muted-foreground">
                Review your support for {recipientName}
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
                  <span className="text-support-green">Minimal (~$0.001)</span>
                </div>
              </div>
            </Card>

            <Button
              fullWidth
              size="lg"
              onClick={handleConfirmSupport}
            >
              <Heart className="w-5 h-5 mr-2" />
              Sign & Send ${totalAmount.toFixed(2)}
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
              Preparing Support
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
              Please approve the ${totalAmount.toFixed(2)} USDC transfer in your Phantom wallet
            </p>
          </div>
        );

      case "submitting":
        return (
          <div className="text-center py-8">
            <LoadingSpinner className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Processing
            </h2>
            <p className="text-muted-foreground">
              Submitting your transaction to the blockchain...
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
              <h2 className="text-xl font-bold text-foreground mb-2">Thank You!</h2>
              <p className="text-muted-foreground">
                Your support for {recipientName} was successful!
              </p>
            </div>

            <Card variant="outlined" padding="md" className="text-left">
              <div className="space-y-3">
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
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-medium">Total</span>
                  <span className="font-medium text-primary">
                    ${totalAmount.toFixed(2)}
                  </span>
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
              <Button fullWidth onClick={() => router.push(isWihngoOnly ? "/" : `/birds/${birdId}`)}>
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
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Support Failed</h2>
              <p className="text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please try again or contact us if the issue persists.
              </p>
            </div>

            <div className="space-y-3">
              <Button fullWidth onClick={() => setStep("ready")}>
                Try Again
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push(`/birds/${birdId}`)}
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
      <header className="border-b border-border pt-safe">
        <div className="px-4 py-4 max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2"
            disabled={
              step === "signing" ||
              step === "submitting" ||
              step === "creating_intent" ||
              step === "waiting_for_phantom"
            }
          >
            <ArrowLeft className="w-6 h-6 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Confirm Support</h1>
        </div>
      </header>

      <main className="px-4 py-6 pb-safe max-w-lg mx-auto">
        {!["success", "error"].includes(step) && (
          <Card variant="outlined" padding="md" className="flex items-center gap-4 mb-6">
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
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground truncate">{recipientName}</h2>
              <p className="text-sm text-muted-foreground">
                {isWihngoOnly ? "Platform Support" : bird?.species || "Bird"}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
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

export default function SupportConfirmPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SupportConfirmContent />
    </Suspense>
  );
}
