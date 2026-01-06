"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getBirds, searchBirds } from "@/services/bird.service";
import { BirdCard } from "@/components/bird-card";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bird as BirdIcon, HandHeart, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

type FilterType = "all" | "needs-support" | "funded";

export default function BirdsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const t = useTranslations("birds");

  // Birds are publicly viewable - "All birds are equal"
  const { data, isLoading, error } = useQuery({
    queryKey: ["birds", page],
    queryFn: () => getBirds(page, 20),
  });

  const birds = data?.items;
  const loading = isLoading;

  // Filter tabs configuration
  const filterTabs: { key: FilterType; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "needs-support", label: t("filterNeedsSupport") },
    { key: "funded", label: t("filterFunded") },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </button>
            <h1 className="text-2xl font-semibold text-neutral-900">
              {t("chooseToSupport")}
            </h1>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab.key
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Birds Need Support Banner */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <Link href="/birds/needs-support">
          <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <HandHeart className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-neutral-900">{t("filterNeedsSupport")}</p>
              <p className="text-sm text-neutral-600">
                Help birds that need support this week - fair round-based system
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </div>
        </Link>
      </div>

      {/* Bird Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{t("loadFailed")}</p>
          </div>
        ) : !birds || birds.length === 0 ? (
          <div className="text-center py-16 text-neutral-600">
            <BirdIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {t("noBirdsYet")}
            </h3>
            <p>{t("checkBackSoon")}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {birds.map((bird) => (
              <BirdCard key={bird.birdId} bird={bird} variant="feed" />
            ))}
          </div>
        )}

        {/* Load More */}
        {data?.items && data.items.length > 0 && data.totalCount > page * 20 && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl px-8"
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
