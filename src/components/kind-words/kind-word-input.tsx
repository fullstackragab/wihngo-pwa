"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import {
  KIND_WORD_MAX_LENGTH,
  validateKindWordText,
} from "@/types/kind-word";

interface KindWordInputProps {
  onSubmit: (text: string) => Promise<void>;
  isSubmitting?: boolean;
  remainingToday: number;
  disabled?: boolean;
}

export function KindWordInput({
  onSubmit,
  isSubmitting = false,
  remainingToday,
  disabled = false,
}: KindWordInputProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const charCount = text.trim().length;
  const isAtLimit = remainingToday <= 0;

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || disabled || isAtLimit) return;

    const validation = validateKindWordText(text);
    if (!validation.valid) {
      setError(validation.error || "Please check your message.");
      return;
    }

    setError(null);
    try {
      await onSubmit(text.trim());
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }, [text, onSubmit, isSubmitting, disabled, isAtLimit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isAtLimit) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        You&apos;ve shared your kind words for today. Come back tomorrow!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Share something kind..."
            className="min-h-[80px] resize-none pr-12"
            maxLength={KIND_WORD_MAX_LENGTH + 50}
            disabled={disabled || isSubmitting}
          />
          <span
            className={`absolute bottom-2 right-3 text-xs ${
              charCount > KIND_WORD_MAX_LENGTH
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {charCount}/{KIND_WORD_MAX_LENGTH}
          </span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isSubmitting || disabled}
          size="icon"
          className="h-[80px] w-12 shrink-0"
          aria-label="Send kind word"
        >
          <Send className="size-5" />
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {remainingToday < 3 && remainingToday > 0 && (
        <p className="text-xs text-muted-foreground">
          {remainingToday} kind {remainingToday === 1 ? "word" : "words"} remaining today
        </p>
      )}
    </div>
  );
}
