"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserStories } from "@/services/story.service";
import { useAuth } from "@/contexts/auth-context";
import { StoryCard } from "@/components/story-card";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyStoriesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["myStories", user?.userId],
    queryFn: () => getUserStories(user!.userId),
    enabled: isAuthenticated && !!user?.userId,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const stories = data?.items ?? [];

  return (
    <div className="min-h-screen-safe bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 pt-safe sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">My Stories</h1>
          </div>
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
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No stories yet
            </h3>
            <p className="text-gray-500 mb-6">
              Share your first story about your feathered friends
            </p>
            <Link href="/story/create">
              <Button>Create Story</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <StoryCard key={story.storyId} story={story} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
