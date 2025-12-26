"use client";

import { TopBar } from "./top-bar";
import { Card } from "./ui/card";

interface OurPrinciplesProps {
  onBack: () => void;
}

export function OurPrinciples({ onBack }: OurPrinciplesProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Our Principles" onBack={onBack} />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Wihngo is built on values that put birds and their caretakers first.
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Care over growth</h3>
            <p className="text-muted-foreground leading-relaxed">
              We design for calm, warm, human experiences—never aggressive or pressuring.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Emotional safety</h3>
            <p className="text-muted-foreground leading-relaxed">
              We avoid guilt, loss framing, or pressure. Every interaction should feel kind.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Transparency</h3>
            <p className="text-muted-foreground leading-relaxed">
              We&apos;re open about how things work, without being defensive. You deserve to know.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Micro-support matters</h3>
            <p className="text-muted-foreground leading-relaxed">
              $1 is meaningful. We celebrate small acts of support because they add up to real care.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Sustainability enables care</h3>
            <p className="text-muted-foreground leading-relaxed">
              Platform fees are honest and minimal. We need to keep running to keep serving birds.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Birds come first</h3>
            <p className="text-muted-foreground leading-relaxed">
              Money stays quiet in the background. This is about connection and care.
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-accent/30 border-accent">
          <p className="text-sm text-foreground leading-relaxed">
            We&apos;re not a charity—we&apos;re a for-profit platform. But we believe profit and ethics aren&apos;t opposites.
            We can build something sustainable that genuinely serves the community.
          </p>
        </Card>
      </div>
    </div>
  );
}
