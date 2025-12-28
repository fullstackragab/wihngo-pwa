"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bird, HandHeart, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
  const router = useRouter();

  const steps = [
    {
      icon: Bird,
      title: "Choose a bird",
      description: "Browse bird profiles and learn their stories. Each one needs care and support.",
      color: "bg-primary/20 text-primary",
    },
    {
      icon: HandHeart,
      title: "Send a small amount",
      description: "Contribute any amount you're comfortable with. Even $1 makes a real difference.",
      color: "bg-secondary/20 text-secondary",
    },
    {
      icon: Sparkles,
      title: "Help care continue",
      description: "Your kindness provides food, shelter, and medical care. Watch your impact grow.",
      color: "bg-accent/40 text-accent-foreground",
    },
  ];

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
          <h1 className="text-3xl pt-2 font-medium">How Wihngo Works</h1>
          <p className="text-muted-foreground leading-relaxed">
            Simple, transparent, and built for compassionate action
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-card rounded-3xl p-6 border border-border shadow-sm space-y-4"
              >
                {/* Step Number & Icon */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">
                      Step {index + 1}
                    </div>
                    <div className={`${step.color} rounded-2xl p-4`}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2 pt-7">
                    <h3 className="text-xl font-medium">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-accent/30 rounded-2xl p-5 border border-accent space-y-2">
          <p className="font-medium">Why small amounts matter</p>
          <p className="text-sm text-accent-foreground leading-relaxed">
            We believe in accessible giving. Whether it's $1 or $10, every contribution is valued equally. There's no minimum, no pressure—just care.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <Link href="/birds">
            <Button fullWidth size="lg">
              Get started
            </Button>
          </Link>

          <p className="text-xs text-center text-muted-foreground">
            Join a community of compassionate bird supporters
          </p>
        </div>
      </div>
    </div>
  );
}
