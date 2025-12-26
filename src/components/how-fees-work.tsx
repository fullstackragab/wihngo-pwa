"use client";

import { TopBar } from "./top-bar";
import { Card } from "./ui/card";

interface HowFeesWorkProps {
  onBack: () => void;
}

export function HowFeesWork({ onBack }: HowFeesWorkProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="How Fees Work" onBack={onBack} />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground leading-relaxed">
            We believe in being completely transparent about costs.
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-foreground font-medium">When you support a bird</h3>
            <p className="text-muted-foreground leading-relaxed">
              100% of your chosen amount goes directly to the bird&apos;s owner. If you send $1, they receive $1.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Optional platform support</h3>
            <p className="text-muted-foreground leading-relaxed">
              You can choose to add 5¢ to help keep Wihngo running. This covers:
            </p>
            <ul className="space-y-1 ml-4 text-muted-foreground">
              <li>• Cloud storage for photos and videos</li>
              <li>• Server hosting and maintenance</li>
              <li>• Platform development and improvements</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Transaction fees</h3>
            <p className="text-muted-foreground leading-relaxed">
              We use USDC on Solana for near-zero transaction fees—typically less than a penny.
              This means more of your support reaches the birds.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-medium">Why digital dollars?</h3>
            <p className="text-muted-foreground leading-relaxed">
              USDC is a stable digital currency equal to $1 USD. It enables fast, affordable payments
              without the complexity or volatility of traditional cryptocurrencies.
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="space-y-2">
            <h4 className="text-foreground font-medium">Example</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Support amount:</span>
                <span className="text-foreground">$1.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform support (optional):</span>
                <span className="text-foreground">$0.05</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network fee:</span>
                <span className="text-foreground">~$0.001</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-primary/20">
                <span className="font-medium text-foreground">Total you pay:</span>
                <span className="font-medium text-primary">$1.05</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-foreground">Bird receives:</span>
                <span className="font-medium text-primary">$1.00</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-accent/30 border-accent">
          <p className="text-sm text-foreground leading-relaxed">
            We never take a percentage of support sent to birds. The optional 5¢ is a flat fee—
            whether you send $1 or $100, it&apos;s always just 5¢.
          </p>
        </Card>
      </div>
    </div>
  );
}
