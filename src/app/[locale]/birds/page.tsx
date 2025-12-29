"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getBirds, searchBirds } from "@/services/bird.service";
import { BirdCard } from "@/components/bird-card";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Bird } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BirdsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const t = useTranslations("birds");

  // Birds are publicly viewable - "All birds are equal"
  const { data, isLoading, error } = useQuery({
    queryKey: ["birds", page],
    queryFn: () => getBirds(page, 20),
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["birdsSearch", searchQuery],
    queryFn: () => searchBirds(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const birds = searchQuery.length >= 2 ? searchResults : data?.items;
  const loading = isLoading || searchLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2>{t("exploreBirds")}</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchBirds")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full bg-input-background border-border/50"
            />
          </div>
        </div>
      </div>

      {/* Bird Grid */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{t("loadFailed")}</p>
          </div>
        ) : !birds || birds.length === 0 ? (
          <div className="text-center py-12">
            <Bird className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? t("noBirdsFound") : t("noBirdsYet")}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? t("tryDifferentSearch")
                : t("checkBackSoon")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {birds.map((bird) => (
              <BirdCard key={bird.birdId} bird={bird} variant="feed" />
            ))}
          </div>
        )}

        {/* Load More */}
        {data?.items && data.items.length > 0 && data.totalCount > page * 20 && !searchQuery && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full"
            >
              {t("loadMore")}
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Nav spacer */}
      <div className="h-20" />
      <BottomNav />
    </div>
  );
}
