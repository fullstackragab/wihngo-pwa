"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBird } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading";
import { Check, Info, Gift, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  PRESET_GIFT_AMOUNTS,
  MIN_BIRD_AMOUNT,
  MAX_BIRD_AMOUNT,
} from "@/types/support";
import { isMobileDevice } from "@/lib/phantom/platform";

function GiftContent() {
  const router = useRouter();
  const params = useParams();
  const birdId = params.birdId as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("birds");

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");

  const { data: bird, isLoading } = useQuery({
    queryKey: ["bird", birdId],
    queryFn: () => getBird(birdId!),
    enabled: !!birdId && isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (!birdId) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No bird selected</p>
          <Link href="/birds">
            <Button>Browse Birds</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Check if bird can receive support
  if (bird && (bird.canSupport === false || bird.isMemorial)) {
    return (
      <div className="min-h-screen-safe flex flex-col items-center justify-center px-6 py-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Gift className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-medium">Gift Unavailable</h1>
            <p className="text-muted-foreground">
              {bird.isMemorial
                ? `${bird.name} is remembered with love. This bird is no longer accepting gifts.`
                : `${bird.name} is not currently accepting gifts.`}
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Link href={`/birds/${birdId}`}>
              <Button variant="outline" fullWidth>
                Back to {bird.name}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const giftAmount = selectedAmount || parseFloat(customAmount) || 0;
  const isValidAmount = giftAmount >= MIN_BIRD_AMOUNT && giftAmount <= MAX_BIRD_AMOUNT;

  const handleContinue = () => {
    if (!isValidAmount) return;

    // On mobile, use manual QR payment flow
    if (isMobileDevice()) {
      const amountCents = Math.round(giftAmount * 100);
      router.push(
        `/payments/manual?birdId=${birdId}&amountCents=${amountCents}&type=gift`
      );
      return;
    }

    // On desktop, use wallet connection flow
    router.push(
      `/birds/${birdId}/gift/confirm?amount=${giftAmount}`
    );
  };

  return (
    <div className="min-h-screen-safe flex flex-col px-6 py-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3 pt-2">
            <Gift className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-medium">{t("sendOneTimeGift")}</h1>
          </div>
          <p className="text-muted-foreground">
            Send a one-time gift to {bird?.ownerName || "this caretaker"}
          </p>
        </div>

        {/* Gift Disclaimer */}
        <div className="bg-accent/30 rounded-2xl p-4 border border-accent flex gap-3">
          <Info className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-accent-foreground">
            {t("giftDisclaimer")}
          </p>
        </div>

        {/* Bird Card */}
        {bird && (
          <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {bird.imageUrl ? (
                <Image
                  src={bird.imageUrl}
                  alt={bird.name || "Bird"}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <span className="text-5xl">🐦</span>
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-medium">{bird.name}</h2>
              {bird.ownerName && (
                <p className="text-muted-foreground text-sm mt-1">
                  Cared for by {bird.ownerName}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Gift Amount Selector */}
        <div className="space-y-4">
          <label className="block font-medium">{t("selectGiftAmount")}</label>

          {/* Preset Pills */}
          <div className="flex gap-3">
            {PRESET_GIFT_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleAmountSelect(amount)}
                className={`flex-1 h-14 rounded-2xl border-2 transition-all font-medium ${
                  selectedAmount === amount
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  ${amount}
                  {selectedAmount === amount && (
                    <Check className="w-4 h-4" />
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">{t("customGiftAmount")}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 h-14 rounded-2xl bg-input-background border border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
                min={MIN_BIRD_AMOUNT}
                max={MAX_BIRD_AMOUNT}
                step="0.01"
              />
            </div>
            {!isValidAmount && customAmount && (
              <p className="text-sm text-destructive">
                Amount must be between ${MIN_BIRD_AMOUNT} and ${MAX_BIRD_AMOUNT.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Summary Card */}
        {giftAmount > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Gift for {bird?.name}</span>
              <span className="font-medium text-foreground">${giftAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-medium text-xl text-primary">${giftAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!isValidAmount || giftAmount <= 0}
          fullWidth
          size="lg"
          className="gap-2"
        >
          <Gift className="w-5 h-5" />
          {t("confirmGift")}
        </Button>

        {/* Note */}
        <p className="text-xs text-center text-muted-foreground">
          Gifts are sent via USDC on Solana using Phantom Wallet
        </p>
      </div>
    </div>
  );
}

export default function GiftPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <GiftContent />
    </Suspense>
  );
}
