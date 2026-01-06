"use client";

import { useState, useEffect } from "react";
import { TopBar } from "./top-bar";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { ArrowLeft } from "lucide-react";
import { PRESET_BIRD_AMOUNTS, DEFAULT_WIHNGO_SUPPORT, MIN_WIHNGO_SUPPORT, MIN_BIRD_AMOUNT, MAX_BIRD_AMOUNT } from "@/types/support";
import { useTranslations } from "next-intl";
import { createWeeklySupportSubscription, hasExistingSubscription } from "@/services/weekly-support.service";

interface SupportFlowProps {
  birdId: string;
  birdName: string;
  onBack: () => void;
  onComplete: () => void;
}

// Donation option component matching Figma design
function DonationOption({
  amount,
  isSelected,
  isDefault,
  onClick,
}: {
  amount: number;
  isSelected: boolean;
  isDefault?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-6 py-4 rounded-xl border-2 transition-all text-center ${
        isSelected
          ? "border-primary bg-green-50 shadow-sm"
          : "border-neutral-200 bg-white hover:border-green-300"
      } ${isDefault && !isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      {isDefault && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
          Recommended
        </span>
      )}
      <div className="text-2xl font-bold text-neutral-900">${amount}</div>
    </button>
  );
}

export function SupportFlow({ birdId, birdName, onBack, onComplete }: SupportFlowProps) {
  const t = useTranslations("support");
  const [step, setStep] = useState<"amount" | "wihngo" | "confirm" | "success">("amount");
  const [birdAmount, setBirdAmount] = useState(1);
  const [customAmountValue, setCustomAmountValue] = useState("");
  const [makeWeekly, setMakeWeekly] = useState(false);
  const [supportWihngo, setSupportWihngo] = useState(true);
  const [wihngoAmount, setWihngoAmount] = useState(DEFAULT_WIHNGO_SUPPORT);
  const [hasExistingSub, setHasExistingSub] = useState(false);
  const [subscriptionCreated, setSubscriptionCreated] = useState(false);

  // Check if user already has a weekly subscription for this bird
  useEffect(() => {
    async function checkSubscription() {
      try {
        const exists = await hasExistingSubscription(birdId);
        setHasExistingSub(exists);
        if (exists) {
          setMakeWeekly(false); // Don't show toggle if already subscribed
        }
      } catch {
        // Ignore - user may not be logged in
      }
    }
    checkSubscription();
  }, [birdId]);

  // Create weekly subscription when payment succeeds and makeWeekly is enabled
  const handlePaymentSuccess = async () => {
    if (makeWeekly && !hasExistingSub) {
      try {
        const currentWihngoAmount = supportWihngo ? wihngoAmount : 0;
        await createWeeklySupportSubscription({
          birdId,
          amountUsdc: birdAmount,
          wihngoSupportAmount: currentWihngoAmount,
        });
        setSubscriptionCreated(true);
      } catch (err) {
        console.error("Failed to create weekly subscription:", err);
        // Don't block success - subscription can be set up later
      }
    }
    setStep("success");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmountValue(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= MIN_BIRD_AMOUNT && parsed <= MAX_BIRD_AMOUNT) {
      setBirdAmount(parsed);
    }
  };

  const selectPresetAmount = (value: number) => {
    setCustomAmountValue("");
    setBirdAmount(value);
  };

  // Screen 1: Choose Bird Support Amount (Figma design)
  if (step === "amount") {
    const isValidAmount = birdAmount >= MIN_BIRD_AMOUNT && birdAmount <= MAX_BIRD_AMOUNT;
    const finalAmount = customAmountValue ? parseFloat(customAmountValue) : birdAmount;

    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </button>
            <h1 className="text-xl font-semibold text-neutral-900">
              Support {birdName}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Donation Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              Choose Your Support
            </h3>

            {/* Preset Amounts Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {PRESET_BIRD_AMOUNTS.map((amount) => (
                <DonationOption
                  key={amount}
                  amount={amount}
                  isSelected={birdAmount === amount && !customAmountValue}
                  isDefault={amount === 1}
                  onClick={() => selectPresetAmount(amount)}
                />
              ))}
            </div>

            {/* Custom Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t("customAmount")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmountValue}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-8 py-6 rounded-xl"
                  min={MIN_BIRD_AMOUNT}
                  max={MAX_BIRD_AMOUNT}
                  step="0.01"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                {t("customAmountHint")}
              </p>
            </div>

            {/* Weekly Reminder Toggle - hide if already subscribed */}
            {!hasExistingSub ? (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl mb-6">
                <div>
                  <p className="font-medium text-neutral-900">Weekly reminder</p>
                  <p className="text-sm text-neutral-600">
                    Get reminded to support {birdName} each week
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    You approve each payment in Phantom - never automatic
                  </p>
                </div>
                <Switch checked={makeWeekly} onCheckedChange={setMakeWeekly} />
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-xl mb-6">
                <p className="text-sm text-primary font-medium">
                  Weekly reminders already active for {birdName}
                </p>
              </div>
            )}

            {/* Support Button */}
            <Button
              onClick={() => setStep("wihngo")}
              className="w-full bg-primary hover:bg-primary-hover text-white py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              disabled={!isValidAmount}
            >
              Support {birdName}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 2: Optional Wihngo Support
  if (step === "wihngo") {
    const currentWihngoAmount = supportWihngo ? wihngoAmount : 0;
    const total = birdAmount + currentWihngoAmount;

    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => setStep("amount")}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </button>
            <h1 className="text-xl font-semibold text-neutral-900">
              Support {birdName}
            </h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="text-center mb-6">
            <p className="text-neutral-900">
              <span className="font-medium text-primary">${birdAmount}</span> will go to {birdName}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            {/* Toggle for Wihngo support */}
            <div className="flex items-start justify-between gap-4 p-4 bg-green-50 rounded-xl">
              <div className="flex-1 space-y-1">
                <p className="font-medium text-neutral-900">Support Wihngo too?</p>
                <p className="text-sm text-neutral-600">Optional and added on top</p>
                <p className="text-xs text-neutral-500 leading-relaxed">
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
              <div className="pt-4 border-t border-neutral-200">
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500">$</span>
                  <Input
                    type="number"
                    value={wihngoAmount}
                    onChange={(e) => setWihngoAmount(parseFloat(e.target.value) || MIN_WIHNGO_SUPPORT)}
                    className="flex-1 py-6 rounded-xl"
                    min={MIN_WIHNGO_SUPPORT}
                    step="0.01"
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="pt-4 border-t border-neutral-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">To {birdName}</span>
                <span className="text-neutral-900">${birdAmount.toFixed(2)}</span>
              </div>
              {supportWihngo && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">To Wihngo (optional)</span>
                  <span className="text-neutral-900">${wihngoAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                <p className="font-medium text-neutral-900">Total</p>
                <p className="text-2xl font-medium text-primary">
                  ${total.toFixed(2)}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setStep("confirm")}
              className="w-full bg-primary hover:bg-primary-hover text-white py-6 text-lg rounded-xl"
            >
              Continue
            </Button>

            <p className="text-center text-xs text-neutral-500">
              Bird money is sacred - {birdName} gets exactly ${birdAmount}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Screen 3: Confirm Support
  if (step === "confirm") {
    const currentWihngoAmount = supportWihngo ? wihngoAmount : 0;
    const total = birdAmount + currentWihngoAmount;

    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => setStep("wihngo")}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </button>
            <h1 className="text-xl font-semibold text-neutral-900">
              Confirm Support
            </h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="text-center mb-6">
            <p className="text-neutral-600">Using USDC on Solana</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-3 py-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">To {birdName}</span>
                <span className="text-neutral-900">${birdAmount.toFixed(2)}</span>
              </div>
              {supportWihngo && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">To Wihngo (optional)</span>
                  <span className="text-neutral-900">${wihngoAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
                <span className="font-medium text-neutral-900">Total</span>
                <span className="font-medium text-primary">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
              <p className="text-sm text-neutral-900">Near-zero network costs</p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Transfers are processed on Solana for fast, affordable transactions (~$0.001)
              </p>
            </div>

            <Button
              onClick={handlePaymentSuccess}
              className="w-full bg-primary hover:bg-primary-hover text-white py-6 text-lg rounded-xl shadow-lg"
            >
              Send ${total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 4: Confirmation (Figma design)
  const currentWihngoAmount = supportWihngo ? wihngoAmount : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6 text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">
            Thank you for feeding {birdName}!
          </h1>

          <div className="bg-green-50 rounded-xl p-6 mb-4">
            <p className="text-lg text-neutral-900 mb-2">
              Your <span className="font-bold">${birdAmount.toFixed(2)}</span>{" "}
              supports food for {makeWeekly ? "this week" : "one week"}.
            </p>
            {(makeWeekly || subscriptionCreated) && (
              <p className="text-sm text-primary font-medium">
                ✓ Weekly reminders on - approve with 1 tap in Phantom
              </p>
            )}
          </div>

          <p className="text-neutral-600 leading-relaxed">
            {birdName} will receive nutritious food and clean water thanks to
            your support. Every dollar makes a real difference in the life of a
            bird in need.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onComplete}
            className="w-full bg-primary hover:bg-primary-hover text-white py-6 rounded-xl"
          >
            Support Another Bird
          </Button>

          <Button
            onClick={onComplete}
            variant="outline"
            className="w-full py-6 rounded-xl border-neutral-300"
          >
            Back to Home
          </Button>
        </div>

        {/* Impact Statement */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500">
            You&apos;re part of a caring community helping domestic birds thrive.
          </p>
        </div>
      </div>
    </div>
  );
}
