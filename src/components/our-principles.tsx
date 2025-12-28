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

        {/* Core Principle - All Birds Are Equal */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="space-y-2">
            <h3 className="text-primary font-medium">All birds are equal</h3>
            <p className="text-foreground/80 leading-relaxed">
              No bird can be promoted, boosted, or prioritized by money.
              Every bird deserves the same chance to be seen, cared for, and supported.
            </p>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Bird money is sacred</h3>
            <p className="text-muted-foreground leading-relaxed">
              100% of what you give to a bird goes directly to their care.
              Wihngo never takes a cut from bird support.
            </p>
          </div>

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
              Optional Wihngo support helps us keep running. It&apos;s honest, minimal, and always on top—never taken from bird money.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
