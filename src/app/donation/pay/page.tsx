"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getBird } from "@/services/bird.service";
import { createDonationIntent, submitDonation } from "@/services/payment.service";
import { useAuth } from "@/contexts/auth-context";
import { usePhantom } from "@/hooks/use-phantom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingScreen, LoadingOverlay } from "@/components/ui/loading";
import { ArrowLeft, Wallet, CheckCircle2, XCircle, ExternalLink, AlertCircle } from "lucide-react";
import Image from "next/image";

type PaymentStep = "connect" | "signing" | "submitting" | "success" | "error";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const birdId = searchParams.get("birdId");
  const amountStr = searchParams.get("amount");
  const amount = parseFloat(amountStr || "0");

  const { isAuthenticated } = useAuth();
  const { isPhantomInstalled, isConnected, connect, signTransaction, walletAddress } = usePhantom();

  const [step, setStep] = useState<PaymentStep>("connect");
  const [error, setError] = useState<string>("");
  const [signature, setSignature] = useState<string>("");

  const { data: bird } = useQuery({
    queryKey: ["bird", birdId],
    queryFn: () => getBird(birdId!),
    enabled: !!birdId && isAuthenticated,
  });

  const createIntentMutation = useMutation({
    mutationFn: () => createDonationIntent(birdId!, amount),
  });

  const submitMutation = useMutation({
    mutationFn: submitDonation,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isConnected && step === "connect") {
      handlePayment();
    }
  }, [isConnected]);

  const handleConnect = async () => {
    try {
      setError("");
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handlePayment = async () => {
    if (!birdId || !amount) return;

    try {
      setError("");
      setStep("signing");

      const intent = await createIntentMutation.mutateAsync();
      const signedTx = await signTransaction(intent.serializedTransaction);

      setStep("submitting");

      const result = await submitMutation.mutateAsync({
        paymentId: intent.paymentId,
        signedTransaction: signedTx,
      });

      if (result.solanaSignature) {
        setSignature(result.solanaSignature);
        setStep("success");
      } else if (result.errorMessage) {
        setError(result.errorMessage);
        setStep("error");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Payment failed");
      setStep("error");
    }
  };

  if (!birdId || !amount) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Invalid payment</p>
          <Button onClick={() => router.push("/birds")}>Browse Birds</Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (step) {
      case "connect":
        return (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Connect Phantom Wallet</h2>
              <p className="text-gray-500">Connect your Phantom wallet to complete the donation</p>
            </div>

            {!isPhantomInstalled && (
              <Card variant="outlined" className="mb-6 bg-amber-50 border-amber-200">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Phantom Wallet Required</p>
                    <p className="text-sm text-amber-700 mt-1">Please install the Phantom browser extension to continue.</p>
                    <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-purple-600 font-medium mt-2">
                      Get Phantom <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </Card>
            )}

            <Button fullWidth size="lg" onClick={handleConnect} disabled={!isPhantomInstalled} className="bg-purple-600 hover:bg-purple-700">
              {isPhantomInstalled ? "Connect Wallet" : "Install Phantom First"}
            </Button>

            {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
          </>
        );

      case "signing":
        return (
          <div className="text-center py-12">
            <LoadingOverlay visible message="Waiting for signature..." />
            <p className="text-gray-600 mt-4">Please approve the transaction in your Phantom wallet</p>
          </div>
        );

      case "submitting":
        return (
          <div className="text-center py-12">
            <LoadingOverlay visible message="Processing payment..." />
            <p className="text-gray-600 mt-4">Submitting transaction to Solana network</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-500 mb-6">Your donation of ${amount.toFixed(2)} USDC to {bird?.name} was successful!</p>

            {signature && (
              <a href={`https://solscan.io/tx/${signature}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary font-medium mb-8">
                View on Solscan <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <div className="space-y-3">
              <Button fullWidth onClick={() => router.push(`/bird/${birdId}`)}>Back to {bird?.name}</Button>
              <Button variant="outline" fullWidth onClick={() => router.push("/birds")}>Browse More Birds</Button>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-500 mb-2">{error || "Something went wrong"}</p>
            <p className="text-sm text-gray-400 mb-6">Please try again or contact support if the issue persists.</p>

            <div className="space-y-3">
              <Button fullWidth onClick={() => setStep("connect")}>Try Again</Button>
              <Button variant="outline" fullWidth onClick={() => router.push(`/bird/${birdId}`)}>Cancel</Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen-safe bg-white">
      <header className="px-4 py-4 pt-safe border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2" disabled={step === "signing" || step === "submitting"}>
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Complete Payment</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {bird && step !== "success" && step !== "error" && (
          <Card variant="outlined" className="flex items-center gap-4 mb-8">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {bird.imageUrl ? (
                <Image src={bird.imageUrl} alt={bird.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🐦</div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{bird.name}</h2>
              <p className="text-sm text-gray-500">{bird.species}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">${amount.toFixed(2)}</p>
              <p className="text-xs text-gray-500">USDC</p>
            </div>
          </Card>
        )}

        {isConnected && walletAddress && step !== "success" && step !== "error" && (
          <Card variant="outlined" className="mb-6 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Connected Wallet</p>
                <p className="text-sm font-medium text-gray-900 truncate">{walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}</p>
              </div>
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
