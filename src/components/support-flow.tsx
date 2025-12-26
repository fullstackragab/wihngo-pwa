"use client";

import { useState } from "react";
import { TopBar } from "./top-bar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";

interface SupportFlowProps {
  birdId: string;
  birdName: string;
  onBack: () => void;
  onComplete: () => void;
}

export function SupportFlow({ birdId, birdName, onBack, onComplete }: SupportFlowProps) {
  const [step, setStep] = useState<"amount" | "fee" | "payment" | "confirmation">("amount");
  const [amount, setAmount] = useState(1);
  const [includeFee, setIncludeFee] = useState(true);

  // Screen 1: Choose Support Amount
  if (step === "amount") {
    return (
      <div className="min-h-screen bg-background">
        <TopBar title="Support" onBack={onBack} />

        <div className="max-w-lg mx-auto p-6 space-y-8 pt-12">
          <div className="text-center space-y-2">
            <h2 className="text-foreground text-xl font-medium">Support {birdName}</h2>
            <p className="text-muted-foreground">
              This goes to the bird&apos;s owner to buy food or care.
            </p>
          </div>

          <Card className="p-8 space-y-6">
            {/* Amount buttons */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 3, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setAmount(value)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    amount === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className={`text-2xl font-medium ${amount === value ? "text-primary" : "text-foreground"}`}>
                    ${value}
                  </p>
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep("fee")}
              className="w-full h-12"
            >
              Continue
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Screen 2: Fee Coverage
  if (step === "fee") {
    const platformFee = 0.05;
    const total = includeFee ? amount + platformFee : amount;

    return (
      <div className="min-h-screen bg-background">
        <TopBar title="Support" onBack={() => setStep("amount")} />

        <div className="max-w-lg mx-auto p-6 space-y-8 pt-12">
          <div className="text-center space-y-2">
            <p className="text-foreground">
              You&apos;re sending <span className="font-medium text-primary">${amount}</span> to {birdName}
            </p>
          </div>

          <Card className="p-6 space-y-6">
            {/* Toggle for fee coverage */}
            <div className="flex items-start justify-between gap-4 py-2">
              <div className="flex-1 space-y-1">
                <p className="font-medium text-foreground">Help support Wihngo</p>
                <p className="text-sm text-muted-foreground">Add 5¢</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Covers storage, hosting, and maintenance
                </p>
              </div>
              <Switch
                checked={includeFee}
                onCheckedChange={setIncludeFee}
                className="mt-1"
              />
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-foreground">Total</p>
                <p className="text-2xl font-medium text-primary">
                  ${total.toFixed(2)}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setStep("payment")}
              className="w-full h-12"
            >
              Continue to pay
            </Button>

            <button
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How fees work
            </button>
          </Card>
        </div>
      </div>
    );
  }

  // Screen 3: Payment
  if (step === "payment") {
    return (
      <div className="min-h-screen bg-background">
        <TopBar title="Payment" onBack={() => setStep("fee")} />

        <div className="max-w-lg mx-auto p-6 space-y-8 pt-12">
          <div className="text-center space-y-2">
            <h2 className="text-foreground text-xl font-medium">Confirm Payment</h2>
            <p className="text-muted-foreground">
              Using digital dollars (USDC)
            </p>
          </div>

          <Card className="p-6 space-y-6">
            <div className="space-y-3 py-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount to {birdName}</span>
                <span className="text-foreground">${amount}</span>
              </div>
              {includeFee && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Platform support</span>
                  <span className="text-foreground">$0.05</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-medium text-primary">
                  ${(includeFee ? amount + 0.05 : amount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-foreground">
                Near-zero transaction fees
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Payments are processed on Solana for fast, affordable transactions
              </p>
            </div>

            <Button
              onClick={() => setStep("confirmation")}
              className="w-full h-12"
            >
              Send ${(includeFee ? amount + 0.05 : amount).toFixed(2)}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Screen 4: Confirmation
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-4xl">❤️</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-medium">Sent!</h2>
          <p className="text-lg text-muted-foreground">
            ${amount} is on its way to {birdName}.
          </p>
          {includeFee && (
            <p className="text-sm text-muted-foreground">
              Thanks for helping keep Wihngo running.
            </p>
          )}
        </div>

        <Button
          onClick={onComplete}
          className="w-full"
        >
          Back to Feed
        </Button>
      </div>
    </div>
  );
}
