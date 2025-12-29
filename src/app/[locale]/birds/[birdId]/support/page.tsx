"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBird } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingScreen } from "@/components/ui/loading";
import { Check, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  PRESET_BIRD_AMOUNTS,
  DEFAULT_WIHNGO_SUPPORT,
  MIN_WIHNGO_SUPPORT,
  MIN_BIRD_AMOUNT,
  MAX_BIRD_AMOUNT,
} from "@/types/support";

function SupportContent() {
  const router = useRouter();
  const params = useParams();
  const birdId = params.birdId as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(1);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [supportWihngo, setSupportWihngo] = useState(true);
  const [wihngoAmount, setWihngoAmount] = useState<string>(DEFAULT_WIHNGO_SUPPORT.toString());

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

  const birdAmount = selectedAmount || parseFloat(customAmount) || 0;
  const currentWihngoAmount = supportWihngo ? (parseFloat(wihngoAmount) || 0) : 0;
  const totalAmount = birdAmount + currentWihngoAmount;

  const isValidBirdAmount = birdAmount >= MIN_BIRD_AMOUNT && birdAmount <= MAX_BIRD_AMOUNT;
  const isValidWihngoAmount = !supportWihngo || currentWihngoAmount >= MIN_WIHNGO_SUPPORT;
  const isValidAmount = isValidBirdAmount && isValidWihngoAmount;

  const handleContinue = () => {
    if (!isValidAmount) return;
    router.push(
      `/birds/${birdId}/support/confirm?birdAmount=${birdAmount}&wihngoAmount=${currentWihngoAmount}`
    );
  };

  return (
    <div className="min-h-screen-safe flex flex-col px-6 py-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl pt-2 font-medium">Support {bird?.name}</h1>
          <p className="text-muted-foreground">
            100% of your bird support goes directly to their care
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
              <p className="text-muted-foreground text-sm mt-1">
                Your support helps provide food, shelter, and care
              </p>
            </div>
          </div>
        )}

        {/* Bird Amount Selector */}
        <div className="space-y-4">
          <label className="block font-medium">How much for {bird?.name}?</label>

          {/* Preset Pills */}
          <div className="flex gap-3">
            {PRESET_BIRD_AMOUNTS.map((amount) => (
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
                min={MIN_BIRD_AMOUNT}
                max={MAX_BIRD_AMOUNT}
                step="0.01"
              />
            </div>
            {!isValidBirdAmount && customAmount && (
              <p className="text-sm text-destructive">
                Amount must be between ${MIN_BIRD_AMOUNT} and ${MAX_BIRD_AMOUNT.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Wihngo Support Toggle */}
        <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <p className="font-medium text-foreground">Support Wihngo too?</p>
              <p className="text-sm text-muted-foreground">
                Optional and added on top — bird money stays untouched
              </p>
            </div>
            <Switch
              checked={supportWihngo}
              onCheckedChange={setSupportWihngo}
              className="mt-1"
            />
          </div>

          {supportWihngo && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">$</span>
                <input
                  type="number"
                  value={wihngoAmount}
                  onChange={(e) => setWihngoAmount(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
                  min={MIN_WIHNGO_SUPPORT}
                  step="0.01"
                />
              </div>
              {!isValidWihngoAmount && (
                <p className="text-sm text-destructive mt-2">
                  Minimum support is ${MIN_WIHNGO_SUPPORT.toFixed(2)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Helps cover hosting, storage, and platform development
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-accent/30 rounded-2xl p-4 border border-accent flex gap-3">
          <Info className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-accent-foreground">
            <span className="font-medium">Bird money is sacred.</span> {bird?.name} receives exactly what you choose — Wihngo never takes a cut.
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">To {bird?.name}</span>
            <span className="font-medium text-foreground">${birdAmount.toFixed(2)}</span>
          </div>
          {supportWihngo && currentWihngoAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">To Wihngo (optional)</span>
              <span className="font-medium text-foreground">${currentWihngoAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-medium text-xl text-primary">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!isValidAmount || birdAmount <= 0}
          fullWidth
          size="lg"
        >
          Continue
        </Button>

        {/* Note */}
        <p className="text-xs text-center text-muted-foreground">
          Support is sent via USDC on Solana using Phantom Wallet
        </p>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SupportContent />
    </Suspense>
  );
}
