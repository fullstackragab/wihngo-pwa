"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBirds, getBirdsNeedingSupport, searchBirds } from "@/services/bird.service";
import { BirdCard } from "@/components/bird-card";
import { BottomNav } from "@/components/bottom-nav";
import { BirdGridSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bird as BirdIcon, Search, X, Heart, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bird, BirdNeedsSupportDto } from "@/types/bird";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

type FilterType = "needsSupport" | "all";

export default function BirdsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("needsSupport");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const t = useTranslations("birds");
  const tProfile = useTranslations("profile");

  // Fetch birds needing support (default view)
  const {
    data: needsSupportData,
    isLoading: needsSupportLoading,
  } = useQuery({
    queryKey: ["birdsNeedingSupport"],
    queryFn: getBirdsNeedingSupport,
    enabled: filter === "needsSupport" && !searchQuery,
  });

  // Fetch all birds
  const {
    data: allBirdsData,
    isLoading: allBirdsLoading,
  } = useQuery({
    queryKey: ["birds", page],
    queryFn: () => getBirds(page, 20),
    enabled: filter === "all" && !searchQuery,
  });

  // Search birds
  const {
    data: searchResults,
    isLoading: searchLoading,
  } = useQuery({
    queryKey: ["searchBirds", searchQuery],
    queryFn: () => searchBirds(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  // Convert needs support birds to regular bird format for BirdCard
  const needsSupportBirds: Bird[] = useMemo(() => {
    if (!needsSupportData?.birds) return [];
    return needsSupportData.birds.map((b: BirdNeedsSupportDto) => ({
      birdId: b.birdId,
      name: b.name,
      species: b.species || "",
      tagline: b.tagline || "",
      imageUrl: b.imageUrl,
      location: b.location || undefined,
      ownerName: b.ownerName,
      ownerId: b.ownerId,
      lovedBy: 0,
      supportedBy: b.totalSupportCount,
      needsSupport: true,
    }));
  }, [needsSupportData?.birds]);

  // Determine which birds to show
  const displayBirds = useMemo(() => {
    if (searchQuery.length >= 2) {
      return searchResults || [];
    }
    if (filter === "needsSupport") {
      return needsSupportBirds;
    }
    return allBirdsData?.items || [];
  }, [searchQuery, searchResults, filter, needsSupportBirds, allBirdsData?.items]);

  const isLoading = searchQuery.length >= 2
    ? searchLoading
    : filter === "needsSupport"
      ? needsSupportLoading
      : allBirdsLoading;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t("searchBirds")}
              className="w-full pl-10 pr-10 py-2.5 bg-neutral-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-200 rounded-full"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          {!isSearching && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setFilter("needsSupport");
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === "needsSupport"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {t("filterNeedsSupport")}
              </button>
              <button
                onClick={() => {
                  setFilter("all");
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {t("filterAll")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bird Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <BirdGridSkeleton count={6} />
        ) : displayBirds.length === 0 ? (
          <div className="text-center py-16 text-neutral-600">
            <BirdIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {searchQuery ? t("noBirdsFound") : t("noBirdsYet")}
            </h3>
            <p>{searchQuery ? t("tryDifferentSearch") : t("checkBackSoon")}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter + searchQuery}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {displayBirds.map((bird) => (
                <BirdCard key={bird.birdId} bird={bird} variant="feed" />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Load More - only for "all" filter */}
        {filter === "all" &&
          !searchQuery &&
          allBirdsData?.items &&
          allBirdsData.items.length > 0 &&
          allBirdsData.totalCount > page * 20 && (
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

      {/* Our Ethical Position Section */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            {tProfile("ethicalPosition")}
          </h3>

          <Link href="/my-poor-chicken">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{tProfile("myPoorChicken")}</h4>
                <p className="text-sm text-muted-foreground">
                  {tProfile("myPoorChickenDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/chicken-happiness">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{tProfile("chickenHappiness")}</h4>
                <p className="text-sm text-muted-foreground">
                  {tProfile("chickenHappinessDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/life-before-fate">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{tProfile("lifeBeforeFate")}</h4>
                <p className="text-sm text-muted-foreground">
                  {tProfile("lifeBeforeFateDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/what-chicken-does">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{tProfile("whatChickenDoes")}</h4>
                <p className="text-sm text-muted-foreground">
                  {tProfile("whatChickenDoesDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/chicken-fear">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{tProfile("chickenFear")}</h4>
                <p className="text-sm text-muted-foreground">
                  {tProfile("chickenFearDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/witnessed-fear">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{tProfile("witnessedFear")}</h4>
                <p className="text-sm text-muted-foreground">
                  {tProfile("witnessedFearDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/no-fear-before-death">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{tProfile("noFearBeforeDeath")}</h4>
                <p className="text-sm text-muted-foreground">
                  {tProfile("noFearBeforeDeathDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/when-humans-tire">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{tProfile("whenHumansTire")}</h4>
                <p className="text-sm text-muted-foreground">
                  {tProfile("whenHumansTireDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/what-chicken-needs">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{tProfile("whatChickenNeeds")}</h4>
                <p className="text-sm text-muted-foreground">
                  {tProfile("whatChickenNeedsDesc")}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Bottom Nav spacer */}
      <div className="h-20" />
      <BottomNav />
    </div>
  );
}
