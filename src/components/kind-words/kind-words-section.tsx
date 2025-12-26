"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KindWordItem } from "./kind-word-item";
import { KindWordInput } from "./kind-word-input";
import type { KindWord, KindWordsListResponse } from "@/types/kind-word";
import { postKindWord, deleteKindWord, blockUserFromKindWords } from "@/services/kind-words.service";
import { toast } from "sonner";

interface KindWordsSectionProps {
  birdId: string;
  birdName: string;
  initialData: KindWordsListResponse;
  currentUserId?: string;
  isOwner?: boolean;
  onKindWordAdded?: (kindWord: KindWord) => void;
  onKindWordDeleted?: (kindWordId: string) => void;
  onUserBlocked?: (userId: string) => void;
}

export function KindWordsSection({
  birdId,
  birdName,
  initialData,
  currentUserId,
  isOwner = false,
  onKindWordAdded,
  onKindWordDeleted,
  onUserBlocked,
}: KindWordsSectionProps) {
  const [items, setItems] = useState<KindWord[]>(initialData.items);
  const [remainingToday, setRemainingToday] = useState(initialData.remainingToday);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Don't render anything if kind words are disabled
  if (!initialData.isEnabled) {
    return null;
  }

  const handleSubmit = useCallback(async (text: string) => {
    setIsSubmitting(true);
    try {
      const newKindWord = await postKindWord({ birdId, text });
      setItems((prev) => [newKindWord, ...prev]);
      setRemainingToday((prev) => Math.max(0, prev - 1));
      onKindWordAdded?.(newKindWord);
      toast.success("Your kind words have been shared!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to post. Please try again.";
      toast.error(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [birdId, onKindWordAdded]);

  const handleDelete = useCallback(async (kindWordId: string) => {
    setDeletingId(kindWordId);
    try {
      await deleteKindWord(birdId, kindWordId);
      setItems((prev) => prev.filter((item) => item.id !== kindWordId));
      onKindWordDeleted?.(kindWordId);
      toast.success("Kind word removed");
    } catch (err) {
      toast.error("Failed to remove. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }, [birdId, onKindWordDeleted]);

  const handleBlockUser = useCallback(async (userId: string) => {
    try {
      await blockUserFromKindWords(birdId, userId);
      // Remove all kind words from this user (they won't see the change)
      setItems((prev) => prev.filter((item) => item.authorUserId !== userId));
      onUserBlocked?.(userId);
      toast.success("User blocked from posting kind words");
    } catch (err) {
      toast.error("Failed to block user. Please try again.");
    }
  }, [birdId, onUserBlocked]);

  const canDeleteKindWord = (kindWord: KindWord) => {
    return isOwner || kindWord.authorUserId === currentUserId;
  };

  return (
    <Card variant="ghost" className="bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg">Kind words</CardTitle>
        <p className="text-sm text-muted-foreground">
          Please share kind words only. No advice or questions.
        </p>
      </CardHeader>

      <CardContent className="px-0 space-y-4">
        {/* Input section - only shown if user can post */}
        {initialData.canPost && (
          <KindWordInput
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            remainingToday={remainingToday}
          />
        )}

        {/* Kind words list */}
        {items.length > 0 ? (
          <div className="divide-y divide-border">
            {items.map((kindWord) => (
              <KindWordItem
                key={kindWord.id}
                kindWord={kindWord}
                canDelete={canDeleteKindWord(kindWord)}
                isOwner={isOwner}
                onDelete={handleDelete}
                onBlockUser={isOwner ? handleBlockUser : undefined}
                isDeleting={deletingId === kindWord.id}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Be the first to leave a kind word for {birdName}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
