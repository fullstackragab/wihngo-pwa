"use client";

import { TopBar } from "./top-bar";
import { Card } from "./ui/card";

interface HowSupportWorksProps {
  onBack: () => void;
}

export function HowSupportWorks({ onBack }: HowSupportWorksProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="How Support Works" onBack={onBack} />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Bird money is sacred. We never take a cut.
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-foreground font-medium">100% goes to the bird</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you support a bird, every cent goes directly to their owner.
              Send $1, they receive $1. Send $100, they receive $100.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Wihngo support is optional</h3>
            <p className="text-muted-foreground leading-relaxed">
              You can choose to add a small amount (starting at 5 cents) to help keep Wihngo running. This is:
            </p>
            <ul className="space-y-1 ml-4 text-muted-foreground">
              <li>Completely optional</li>
              <li>Added on top of your bird support</li>
              <li>Never taken from bird money</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Tiny network costs</h3>
            <p className="text-muted-foreground leading-relaxed">
              We use USDC on Solana for near-zero transaction costs - typically less than a penny.
              This means more of your support reaches the birds.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Why USDC?</h3>
            <p className="text-muted-foreground leading-relaxed">
              USDC is a stable digital dollar equal to $1 USD. It enables fast, affordable transfers
              without the volatility of traditional cryptocurrencies.
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="space-y-2">
            <h4 className="text-foreground font-medium">Example</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">To the bird:</span>
                <span className="text-foreground">$3.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To Wihngo (optional):</span>
                <span className="text-foreground">$0.05</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network cost:</span>
                <span className="text-foreground">~$0.001</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-primary/20">
                <span className="font-medium text-foreground">Total you send:</span>
                <span className="font-medium text-primary">$3.05</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-foreground">Bird receives:</span>
                <span className="font-medium text-primary">$3.00</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-accent/30 border-accent">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>Bird money is sacred.</strong> We never take a percentage. The optional Wihngo support is a flat amount -
            whether you send $1 or $100, bird money stays untouched.
          </p>
        </Card>
      </div>
    </div>
  );
}
