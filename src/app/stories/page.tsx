"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStories } from "@/services/story.service";
import { useAuth } from "@/contexts/auth-context";
import { StoryCard } from "@/components/story-card";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StoriesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["stories", page],
    queryFn: () => getStories(page, 20),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen-safe bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 pt-safe sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Stories</h1>
          <Link href="/story/create">
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Failed to load stories</p>
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No stories yet
            </h3>
            <p className="text-gray-500 mb-6">
              Be the first to share a story about your feathered friend
            </p>
            <Link href="/story/create">
              <Button>Create Story</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.items.map((story) => (
              <StoryCard key={story.storyId} story={story} />
            ))}
          </div>
        )}

        {/* Load More */}
        {data && data.items.length > 0 && data.totalCount > page * 20 && (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-full mt-6 py-3 text-primary font-medium"
          >
            Load more
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
