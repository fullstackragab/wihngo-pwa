"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCommunityStory } from "@/services/community-story.service";
import {
  extractYouTubeId,
  getYouTubeEmbedUrl,
} from "@/types/community-story";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

export default function CommunityStoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.storyId as string;
  const t = useTranslations("communityStories");

  const { data: story, isLoading, error } = useQuery({
    queryKey: ["communityStory", storyId],
    queryFn: () => getCommunityStory(storyId),
    enabled: !!storyId,
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{t("loadError")}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const videoId = story.youtubeUrl ? extractYouTubeId(story.youtubeUrl) : null;
  const embedUrl = videoId ? getYouTubeEmbedUrl(videoId) : null;

  // Determine media type
  const hasYouTube = !!embedUrl;
  const hasUploadedMedia = !!story.mediaUrl;
  const isUploadedVideo = story.mediaType === "video";
  const hasAnyMedia = hasYouTube || hasUploadedMedia;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/community-stories")}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </button>
          <span className="text-sm text-neutral-500 uppercase tracking-wide">
            {t("communityStoryLabel")}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Media Display */}
        {hasAnyMedia && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl overflow-hidden mb-6 bg-black"
          >
            {hasYouTube ? (
              <div className="aspect-video">
                <iframe
                  src={embedUrl!}
                  title={t("communityStoryLabel")}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : hasUploadedMedia && isUploadedVideo ? (
              <div className="aspect-video">
                <video
                  src={story.mediaUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            ) : hasUploadedMedia ? (
              <div className="relative">
                <Image
                  src={story.mediaUrl!}
                  alt={t("communityStoryLabel")}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Story Info */}
        {story.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 mb-6 shadow-sm"
          >
            <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">
              {story.description}
            </p>
            <p className="text-sm text-neutral-500 mt-4">{t("submittedBy")}</p>
          </motion.div>
        )}

        {/* Pooled Support CTA - ONLY option, no individual bird support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm text-center"
        >
          <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-2">
            {t("supportBirdsTitle")}
          </h3>
          <p className="text-sm text-neutral-600 mb-4">
            {t("supportBirdsDesc")}
          </p>
          <Link href="/birds/needs-support">
            <Button size="lg" className="w-full">
              {t("supportAllBirds")}
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
