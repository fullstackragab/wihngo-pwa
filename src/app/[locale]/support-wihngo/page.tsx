"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/bottom-nav";
import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function SupportWihngoPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("1.00");

  const amountNum = parseFloat(amount) || 0;

  const handleSendSupport = () => {
    // Navigate to payment with wihngo-only support
    router.push(`/donation/pay?birdId=wihngo&birdAmount=0&wihngoAmount=${amountNum}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2>Support Wihngo</h2>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-12 space-y-8">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-3"
        >
          <h1>Support Wihngo</h1>
          <p className="text-foreground/70 leading-relaxed">
            Your support helps Wihngo grow while keeping bird support untouched.
            Every contribution helps us build a better platform for birds and
            their caretakers.
          </p>
        </motion.div>

        {/* Amount Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Label htmlFor="amount">Support Amount (USDC)</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8 text-lg rounded-2xl bg-input-background border-border/50"
            />
          </div>
        </motion.div>

        {/* Quick Amounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-2"
        >
          {[1, 5, 10].map((value) => (
            <Button
              key={value}
              variant="outline"
              onClick={() => setAmount(value.toFixed(2))}
              className="rounded-xl"
            >
              ${value}
            </Button>
          ))}
        </motion.div>

        {/* Send Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleSendSupport}
            size="lg"
            className="w-full rounded-full gap-2"
            disabled={amountNum <= 0}
          >
            <Sparkles className="w-4 h-4" />
            Support Wihngo
          </Button>
        </motion.div>

        {/* Gratitude */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-5 bg-secondary/30 rounded-2xl text-center"
        >
          <p className="text-sm text-foreground/70">
            Thank you for helping us build a kinder world for birds
          </p>
        </motion.div>
      </div>

      {/* Bottom Nav spacer */}
      <div className="h-20" />
      <BottomNav />
    </div>
  );
}
