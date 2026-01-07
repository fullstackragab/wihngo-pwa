"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCommunityStories } from "@/services/community-story.service";
import {
  extractYouTubeId,
  getYouTubeThumbnail,
} from "@/types/community-story";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Heart, Plus, Play, RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

// Skeleton component for loading state
function StoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-video bg-neutral-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-neutral-200 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function CommunityStoriesPage() {
  const t = useTranslations("communityStories");
  const tCommon = useTranslations("common");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["communityStories", page],
    queryFn: () => getCommunityStories({ page, pageSize: 20 }),
    retry: 1,
  });

  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error("[CommunityStories] Failed to load stories:", {
        error: error.message,
        endpoint: "/community-stories",
        page,
        timestamp: new Date().toISOString(),
      });
    }
  }, [error, page]);

  return (
    <div className="min-h-screen-safe bg-neutral-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 shadow-sm sticky top-0 z-40 pt-safe">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
                {t("title")}
              </h1>
              <p className="text-sm text-neutral-500 mt-0.5 hidden sm:block">
                {t("subtitle")}
              </p>
            </div>
            <Link href="/community-stories/submit" className="shrink-0 hidden sm:block">
              <Button size="sm" className="gap-2 rounded-full px-5 h-9">
                <Plus className="w-4 h-4" />
                {t("shareStory")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Floating Action Button - Mobile only */}
      <Link
        href="/community-stories/submit"
        className="sm:hidden fixed bottom-24 right-4 z-50 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </Link>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Loading State - Skeleton Cards */}
        {isLoading ? (
          <div className="space-y-4">
            <StoryCardSkeleton />
            <StoryCardSkeleton />
            <StoryCardSkeleton />
          </div>
        ) : error ? (
          /* Error State - Friendly UI with retry */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
              <WifiOff className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2 text-center">
              {t("errorTitle")}
            </h3>
            <p className="text-neutral-500 text-center mb-8 max-w-xs leading-relaxed">
              {t("errorDescription")}
            </p>
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-2 rounded-full px-6 h-11"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
              {isRefetching ? t("retrying") : t("tryAgain")}
            </Button>
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          /* Empty State - Inviting and friendly */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2 text-center">
              {t("noStoriesYet")}
            </h3>
            <p className="text-neutral-500 text-center mb-8 max-w-xs leading-relaxed">
              {t("beFirstToShare")}
            </p>
            <Link href="/community-stories/submit">
              <Button className="gap-2 rounded-full px-6 h-11">
                <Plus className="w-4 h-4" />
                {t("shareStory")}
              </Button>
            </Link>
          </div>
        ) : (
          /* Success State - Stories List */
          <div className="space-y-4">
            {data.items.map((story, index) => {
              const videoId = story.youtubeUrl
                ? extractYouTubeId(story.youtubeUrl)
                : null;
              const youtubeThumbnail = videoId
                ? getYouTubeThumbnail(videoId)
                : null;

              const hasYouTube = !!videoId;
              const hasUploadedMedia = !!story.mediaUrl;
              const isUploadedVideo = story.mediaType === "video";
              const showPlayButton = hasYouTube || isUploadedVideo;

              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/community-stories/${story.id}`}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-neutral-100">
                      {/* Media Preview */}
                      {(hasYouTube || hasUploadedMedia) ? (
                        <div className="aspect-video relative bg-neutral-100">
                          {hasYouTube && youtubeThumbnail ? (
                            <Image
                              src={youtubeThumbnail}
                              alt={t("communityStoryLabel")}
                              fill
                              className="object-cover"
                            />
                          ) : hasUploadedMedia && isUploadedVideo ? (
                            <video
                              src={story.mediaUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : hasUploadedMedia ? (
                            <Image
                              src={story.mediaUrl!}
                              alt={t("communityStoryLabel")}
                              fill
                              className="object-cover"
                            />
                          ) : null}
                          {/* Play overlay for videos */}
                          {showPlayButton && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors">
                              <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-sm">
                                <Play className="w-7 h-7 text-neutral-900 ml-0.5" />
                              </div>
                            </div>
                          )}
                          {/* Badge */}
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 bg-white/95 text-xs font-medium text-neutral-700 rounded-full shadow-sm">
                              {t("communityStoryLabel")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Text-only story - no media */
                        <div className="aspect-[3/1] relative bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                          <Heart className="w-10 h-10 text-primary/30" />
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 bg-white/95 text-xs font-medium text-neutral-700 rounded-full shadow-sm">
                              {t("communityStoryLabel")}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      {story.description && (
                        <div className="px-4 py-3">
                          <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
                            {story.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {data && data.items.length > 0 && data.totalCount > page * 20 && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setPage((p) => p + 1)}
              className="text-primary font-medium"
            >
              {tCommon("loadMore")}
            </Button>
          </div>
        )}

        {/* Pooled Support CTA */}
        {data && data.items.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl p-6 text-center shadow-sm border border-neutral-100">
            <h3 className="font-semibold text-neutral-900 mb-2">
              {t("supportBirdsTitle")}
            </h3>
            <p className="text-sm text-neutral-500 mb-5 leading-relaxed">
              {t("supportBirdsDesc")}
            </p>
            <Link href="/birds/needs-support">
              <Button className="w-full sm:w-auto px-8 rounded-full">
                {t("supportAllBirds")}
              </Button>
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
