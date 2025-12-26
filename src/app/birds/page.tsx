"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBirds, searchBirds } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { BirdCard } from "@/components/bird-card";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading";
import { Search, Bird } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BirdsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["birds", page],
    queryFn: () => getBirds(page, 20),
    enabled: isAuthenticated,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["birdsSearch", searchQuery],
    queryFn: () => searchBirds(searchQuery),
    enabled: isAuthenticated && searchQuery.length >= 2,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const birds = searchQuery.length >= 2 ? searchResults : data?.items;
  const loading = isLoading || searchLoading;

  return (
    <div className="min-h-screen-safe pb-20">
      {/* Header - Figma BirdGalleryScreen style */}
      <header className="px-6 py-8 pt-safe">
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium">Birds to Support</h1>
            <p className="text-muted-foreground leading-relaxed">
              Choose a bird to learn their story and offer your support
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search birds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 h-14 rounded-2xl border border-border bg-input-background focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load birds</p>
          </div>
        ) : !birds || birds.length === 0 ? (
          <div className="text-center py-12">
            <Bird className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? "No birds found" : "No birds yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : "Check back soon for new birds to support"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {birds.map((bird) => (
              <BirdCard key={bird.birdId} bird={bird} variant="gallery" />
            ))}
          </div>
        )}

        {/* Load More */}
        {data?.items && data.items.length > 0 && data.totalCount > page * 20 && !searchQuery && (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-full mt-6 py-3 text-primary font-medium"
          >
            Load more
          </button>
        )}

        {/* Footer Note */}
        <p className="text-xs text-center text-muted-foreground py-8">
          More birds are added regularly as we expand our care network
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
