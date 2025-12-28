"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getBirds, searchBirds } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { BirdCard } from "@/components/bird-card";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Bird } from "lucide-react";

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
            <h2>Explore Birds</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search birds..."
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
              Load more
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
