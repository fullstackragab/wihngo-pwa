"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCommunityStories } from "@/services/community-story.service";
import {
  extractYouTubeId,
  getYouTubeThumbnail,
} from "@/types/community-story";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Heart, Plus, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

export default function CommunityStoriesPage() {
  const t = useTranslations("communityStories");
  const tCommon = useTranslations("common");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["communityStories", page],
    queryFn: () => getCommunityStories({ page, pageSize: 20 }),
  });

  return (
    <div className="min-h-screen-safe bg-neutral-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-4 pt-safe sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{t("title")}</h1>
            <p className="text-sm text-neutral-500">{t("subtitle")}</p>
          </div>
          <Link href="/community-stories/submit">
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              {t("shareStory")}
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{t("loadError")}</p>
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {t("noStoriesYet")}
            </h3>
            <p className="text-neutral-500 mb-6">{t("beFirstToShare")}</p>
            <Link href="/community-stories/submit">
              <Button>{t("shareStory")}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.items.map((story, index) => {
              const videoId = story.youtubeUrl
                ? extractYouTubeId(story.youtubeUrl)
                : null;
              const youtubeThumbnail = videoId
                ? getYouTubeThumbnail(videoId)
                : null;

              // Determine what media to display
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
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Media Preview */}
                      {(hasYouTube || hasUploadedMedia) ? (
                        <div className="aspect-video relative bg-neutral-200">
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
                              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="w-8 h-8 text-neutral-900 ml-1" />
                              </div>
                            </div>
                          )}
                          {/* Badge */}
                          <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 bg-white/90 text-xs font-medium text-neutral-700 rounded-full">
                              {t("communityStoryLabel")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Text-only story - no media */
                        <div className="aspect-[3/1] relative bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                          <Heart className="w-12 h-12 text-primary/30" />
                          <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 bg-white/90 text-xs font-medium text-neutral-700 rounded-full">
                              {t("communityStoryLabel")}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      {story.description && (
                        <div className="p-4">
                          <p className="text-sm text-neutral-600 line-clamp-2">
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
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-full mt-6 py-3 text-primary font-medium"
          >
            {tCommon("loadMore")}
          </button>
        )}

        {/* Pooled Support CTA - always visible */}
        {data && data.items.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl p-6 text-center shadow-sm">
            <h3 className="font-semibold text-neutral-900 mb-2">
              {t("supportBirdsTitle")}
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              {t("supportBirdsDesc")}
            </p>
            <Link href="/birds/needs-support">
              <Button className="w-full">{t("supportAllBirds")}</Button>
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
