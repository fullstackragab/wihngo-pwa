"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBirds, searchBirds } from "@/services/bird.service";
import { BirdCard } from "@/components/bird-card";
import { BottomNav } from "@/components/bottom-nav";
import { BirdGridSkeleton } from "@/components/ui/skeleton";
import { PlatformPauseNotice, LegalDisclaimer } from "@/components/platform-pause-notice";
import { Bird as BirdIcon, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";

export default function BirdsPage() {
  const [page] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("birds");

  // Fetch all birds (archived view)
  const {
    data: allBirdsData,
    isLoading: allBirdsLoading,
  } = useQuery({
    queryKey: ["birds", page],
    queryFn: () => getBirds(page, 20),
    enabled: !searchQuery,
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

  // Determine which birds to show
  const displayBirds = useMemo(() => {
    if (searchQuery.length >= 2) {
      return searchResults || [];
    }
    return allBirdsData?.items || [];
  }, [searchQuery, searchResults, allBirdsData?.items]);

  const isLoading = searchQuery.length >= 2 ? searchLoading : allBirdsLoading;

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Platform Pause Notice */}
      <PlatformPauseNotice />

      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-neutral-800 mb-3">Archived Bird Profiles</h1>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <p>{searchQuery ? t("tryDifferentSearch") : "No archived bird profiles available."}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={searchQuery}
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
      </div>

      {/* Legal Disclaimer */}
      <LegalDisclaimer />

      {/* Bottom Nav spacer */}
      <div className="h-20" />
      <BottomNav />
    </div>
  );
}
