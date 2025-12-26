"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

interface TopBarProps {
  title: string;
  onBack?: () => void;
  showLogo?: boolean;
}

export function TopBar({ title, onBack, showLogo }: TopBarProps) {
  return (
    <div className="sticky top-0 bg-background border-b border-border z-40">
      <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
        {onBack ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-foreground hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <div className="w-10" />
        )}

        {showLogo ? (
          <h1 className="text-primary flex items-center gap-2 text-xl font-medium">
            Wihngo
          </h1>
        ) : (
          <h2 className="text-foreground font-medium">{title}</h2>
        )}

        <div className="w-10" />
      </div>
    </div>
  );
}
