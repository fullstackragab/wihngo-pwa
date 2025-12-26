"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Mail, Bird } from "lucide-react";
import Image from "next/image";

interface OnboardingProps {
  onComplete: (email: string, password: string, name: string) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<"welcome" | "signup">("welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-8 text-center">
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="bg-primary rounded-full p-4">
                <Bird className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-primary text-3xl font-medium">Wihngo</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              A community for bird lovers, focused on care, kindness, and small acts of support.
            </p>
          </div>

          <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-lg relative">
            <Image
              src="https://images.unsplash.com/photo-1518992028580-6d57bd80f2dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMGJpcmR8ZW58MXx8fHwxNzY2NzU2MzI1fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Bird"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <Button
            onClick={() => setStep("signup")}
            className="w-full h-12"
          >
            Get Started
          </Button>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Support bird care with as little as $1 using digital dollars (USDC)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-sm mx-auto pt-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-foreground text-xl font-medium">Create Your Account</h2>
          <p className="text-muted-foreground">
            Join the Wihngo community
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-foreground font-medium">
              Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-foreground font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-foreground font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
            />
          </div>

          <Button
            onClick={() => onComplete(email, password, name)}
            disabled={!name || !email || !password}
            className="w-full"
          >
            <Mail className="w-4 h-4" />
            Create Account
          </Button>
        </Card>

        <p className="text-sm text-center text-muted-foreground leading-relaxed">
          By continuing, you agree to our principles of care, kindness, and transparency.
        </p>
      </div>
    </div>
  );
}
