"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toggleKindWords } from "@/services/kind-words.service";
import { toast } from "sonner";

interface KindWordsOwnerControlsProps {
  birdId: string;
  isEnabled: boolean;
  onToggle?: (isEnabled: boolean) => void;
}

export function KindWordsOwnerControls({
  birdId,
  isEnabled: initialEnabled,
  onToggle,
}: KindWordsOwnerControlsProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = useCallback(async (checked: boolean) => {
    setIsUpdating(true);
    const previousValue = isEnabled;
    setIsEnabled(checked); // Optimistic update

    try {
      await toggleKindWords(birdId, checked);
      onToggle?.(checked);
      toast.success(checked ? "Kind words enabled" : "Kind words disabled");
    } catch (err) {
      setIsEnabled(previousValue); // Revert on error
      toast.error("Failed to update settings. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }, [birdId, isEnabled, onToggle]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kind Words Settings</CardTitle>
        <CardDescription>
          Control how supporters can share kind words on your bird&apos;s page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="kind-words-toggle" className="flex flex-col gap-1">
            <span className="font-medium">Allow kind words</span>
            <span className="text-sm text-muted-foreground font-normal">
              Let supporters share messages of care
            </span>
          </Label>
          <Switch
            id="kind-words-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        </div>
      </CardContent>
    </Card>
  );
}
