"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBird } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const PRESET_AMOUNTS = [1, 3, 5];

function DonationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const birdId = searchParams.get("birdId");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(1);
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

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const currentAmount = selectedAmount || parseFloat(customAmount) || 0;
  const isValidAmount = currentAmount >= 0.01 && currentAmount <= 1000;

  const handleContinue = () => {
    if (!isValidAmount) return;
    router.push(`/donation/pay?birdId=${birdId}&amount=${currentAmount}`);
  };

  return (
    <div className="min-h-screen-safe flex flex-col px-6 py-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Header - Figma SendSupportScreen style */}
        <div className="space-y-2">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl pt-2 font-medium">You're helping a bird 💛</h1>
        </div>

        {/* Bird Card - Figma style */}
        {bird && (
          <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {bird.imageUrl ? (
                <Image
                  src={bird.imageUrl}
                  alt={bird.name}
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
              <p className="text-muted-foreground text-sm mt-1">
                Your support helps provide food, shelter, and care
              </p>
            </div>
          </div>
        )}

        {/* Amount Selector - Figma style */}
        <div className="space-y-4">
          <label className="block font-medium">Select amount</label>

          {/* Preset Pills */}
          <div className="flex gap-3">
            {PRESET_AMOUNTS.map((amount) => (
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
            <label className="text-sm text-muted-foreground">Or enter custom amount</label>
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
                min="0.01"
                max="1000"
                step="0.01"
              />
            </div>
            {!isValidAmount && customAmount && (
              <p className="text-sm text-destructive">Amount must be between $0.01 and $1,000</p>
            )}
          </div>
        </div>

        {/* Fee Info - Figma accent box style */}
        <div className="bg-accent/30 rounded-2xl p-4 border border-accent">
          <p className="text-sm text-accent-foreground">
            <span className="font-medium">Small amounts make a big difference.</span> Network fees are minimal, and 100% of your donation goes to bird care.
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex justify-between items-center mb-3">
            <span className="text-muted-foreground">Donation</span>
            <span className="font-medium text-foreground">${currentAmount.toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-border">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="font-medium text-secondary">Sponsored</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-medium text-xl text-primary">${currentAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Continue Button - Figma style */}
        <Button
          onClick={handleContinue}
          disabled={!isValidAmount}
          fullWidth
          size="lg"
          variant="secondary"
        >
          Send ${currentAmount.toFixed(2)} Support
        </Button>

        {/* Note */}
        <p className="text-xs text-center text-muted-foreground">
          Your contribution helps create a better world for birds
        </p>
      </div>
    </div>
  );
}

export default function DonationPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DonationContent />
    </Suspense>
  );
}
