"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KindWordItem } from "./kind-word-item";
import type { KindWord, KindWordsListResponse } from "@/types/kind-word";

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
  birdName,
  initialData,
}: KindWordsSectionProps) {
  const [items] = useState<KindWord[]>(initialData?.items ?? []);

  // Don't render anything if kind words are disabled or data not loaded
  if (!initialData?.isEnabled) {
    return null;
  }

  return (
    <Card variant="ghost" className="bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg">Kind words</CardTitle>
        <p className="text-sm text-muted-foreground">
          Archived kind words from the community.
        </p>
      </CardHeader>

      <CardContent className="px-0 space-y-4">
        {/* Kind words list - read-only archive */}
        {items.length > 0 ? (
          <div className="divide-y divide-border">
            {items.map((kindWord, index) => (
              <KindWordItem
                key={kindWord.id || `kind-word-${index}`}
                kindWord={kindWord}
                canDelete={false}
                isOwner={false}
                onDelete={() => {}}
                isDeleting={false}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            No archived kind words for {birdName}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
