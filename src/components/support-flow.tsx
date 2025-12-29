"use client";

import { useState } from "react";
import { TopBar } from "./top-bar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import { PRESET_BIRD_AMOUNTS, DEFAULT_WIHNGO_SUPPORT, MIN_WIHNGO_SUPPORT } from "@/types/support";

interface SupportFlowProps {
  birdId: string;
  birdName: string;
  onBack: () => void;
  onComplete: () => void;
}

export function SupportFlow({ birdId, birdName, onBack, onComplete }: SupportFlowProps) {
  const [step, setStep] = useState<"amount" | "wihngo" | "confirm" | "success">("amount");
  const [birdAmount, setBirdAmount] = useState(1);
  const [supportWihngo, setSupportWihngo] = useState(true);
  const [wihngoAmount, setWihngoAmount] = useState(DEFAULT_WIHNGO_SUPPORT);

  // Screen 1: Choose Bird Support Amount
  if (step === "amount") {
    return (
      <div className="min-h-screen bg-background">
        <TopBar title="Support" onBack={onBack} />

        <div className="max-w-lg mx-auto p-6 space-y-8 pt-12">
          <div className="text-center space-y-2">
            <h2 className="text-foreground text-xl font-medium">Support {birdName}</h2>
            <p className="text-muted-foreground">
              100% goes directly to {birdName}&apos;s care
            </p>
          </div>

          <Card className="p-8 space-y-6">
            {/* Amount buttons */}
            <div className="grid grid-cols-3 gap-3">
              {PRESET_BIRD_AMOUNTS.map((value) => (
                <button
                  key={value}
                  onClick={() => setBirdAmount(value)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    birdAmount === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className={`text-2xl font-medium ${birdAmount === value ? "text-primary" : "text-foreground"}`}>
                    ${value}
                  </p>
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep("wihngo")}
              className="w-full h-12"
            >
              Continue
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Screen 2: Optional Wihngo Support
  if (step === "wihngo") {
    const currentWihngoAmount = supportWihngo ? wihngoAmount : 0;
    const total = birdAmount + currentWihngoAmount;

    return (
      <div className="min-h-screen bg-background">
        <TopBar title="Support" onBack={() => setStep("amount")} />

        <div className="max-w-lg mx-auto p-6 space-y-8 pt-12">
          <div className="text-center space-y-2">
            <p className="text-foreground">
              <span className="font-medium text-primary">${birdAmount}</span> will go to {birdName}
            </p>
          </div>

          <Card className="p-6 space-y-6">
            {/* Toggle for Wihngo support */}
            <div className="flex items-start justify-between gap-4 py-2">
              <div className="flex-1 space-y-1">
                <p className="font-medium text-foreground">Support Wihngo too?</p>
                <p className="text-sm text-muted-foreground">Optional and added on top</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Helps cover hosting, storage, and platform development
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
                    onChange={(e) => setWihngoAmount(parseFloat(e.target.value) || MIN_WIHNGO_SUPPORT)}
                    className="flex-1 h-10 px-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
                    min={MIN_WIHNGO_SUPPORT}
                    step="0.01"
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">To {birdName}</span>
                <span className="text-foreground">${birdAmount.toFixed(2)}</span>
              </div>
              {supportWihngo && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">To Wihngo (optional)</span>
                  <span className="text-foreground">${wihngoAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="font-medium text-foreground">Total</p>
                <p className="text-2xl font-medium text-primary">
                  ${total.toFixed(2)}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setStep("confirm")}
              className="w-full h-12"
            >
              Continue
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Bird money is sacred - {birdName} gets exactly ${birdAmount}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Screen 3: Confirm Support
  if (step === "confirm") {
    const currentWihngoAmount = supportWihngo ? wihngoAmount : 0;
    const total = birdAmount + currentWihngoAmount;

    return (
      <div className="min-h-screen bg-background">
        <TopBar title="Confirm" onBack={() => setStep("wihngo")} />

        <div className="max-w-lg mx-auto p-6 space-y-8 pt-12">
          <div className="text-center space-y-2">
            <h2 className="text-foreground text-xl font-medium">Confirm Support</h2>
            <p className="text-muted-foreground">
              Using USDC on Solana
            </p>
          </div>

          <Card className="p-6 space-y-6">
            <div className="space-y-3 py-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">To {birdName}</span>
                <span className="text-foreground">${birdAmount.toFixed(2)}</span>
              </div>
              {supportWihngo && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">To Wihngo (optional)</span>
                  <span className="text-foreground">${wihngoAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-medium text-primary">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-foreground">
                Near-zero network costs
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Transfers are processed on Solana for fast, affordable transactions (~$0.001)
              </p>
            </div>

            <Button
              onClick={() => setStep("success")}
              className="w-full h-12"
            >
              Send ${total.toFixed(2)}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Screen 4: Confirmation
  const currentWihngoAmount = supportWihngo ? wihngoAmount : 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-4xl">&#10084;&#65039;</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-medium">Sent!</h2>
          <p className="text-lg text-muted-foreground">
            ${birdAmount.toFixed(2)} is on its way to {birdName}
          </p>
          {supportWihngo && (
            <p className="text-sm text-muted-foreground">
              Thanks for supporting Wihngo too!
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
