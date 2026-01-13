"use client";

import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getCommunityStories } from "@/services/community-story.service";
import { extractYouTubeId, getYouTubeThumbnail } from "@/types/community-story";
import { BottomNav } from "@/components/bottom-nav";
import { HomePageSkeleton, StoriesGridSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Bird, CircleCheck, DollarSign, Heart, Play, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("home");
  const tStories = useTranslations("communityStories");

  // Fetch recent stories for the home page
  const { data: storiesData, isLoading: storiesLoading } = useQuery({
    queryKey: ["communityStories", "home"],
    queryFn: () => getCommunityStories({ page: 1, pageSize: 3 }),
  });

  if (authLoading) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="px-6 pt-16 pb-12 text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Bird className="w-10 h-10 text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4"
        >
          {t("tagline")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-neutral-600 mb-8"
        >
          {t("description")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link href="/birds">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary-hover text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {t("supportBird")}
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* How It Works Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-6 py-16 max-w-5xl mx-auto"
      >
        <h2 className="text-2xl font-semibold text-center text-neutral-900 mb-12">
          {t("howItWorks")}
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bird className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
              1
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">{t("step1Title")}</h3>
            <p className="text-sm text-neutral-600">{t("step1Desc")}</p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
              2
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">{t("step2Title")}</h3>
            <p className="text-sm text-neutral-600">{t("step2Desc")}</p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CircleCheck className="w-8 h-8 text-primary" />
            </div>
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
              3
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">{t("step3Title")}</h3>
            <p className="text-sm text-neutral-600">{t("step3Desc")}</p>
          </div>
        </div>
      </motion.div>

      {/* Mission Statement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="px-6 py-12 bg-green-50 mt-8"
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-neutral-700 leading-relaxed">{t("missionStatement")}</p>
        </div>
      </motion.div>

      {/* Love Stories Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="px-6 py-16 max-w-5xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">
              {tStories("title")}
            </h2>
            <p className="text-neutral-600 mt-1">{tStories("subtitle")}</p>
          </div>
          <Link href="/community-stories">
            <Button variant="ghost" size="sm">
              {t("viewAll")}
            </Button>
          </Link>
        </div>

        {storiesLoading ? (
          <StoriesGridSkeleton count={3} />
        ) : !storiesData?.items || storiesData.items.length === 0 ? (
          /* Warm empty state */
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <Heart className="w-12 h-12 text-primary/30 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">{t("storiesWillAppear")}</p>
            <Link href="/community-stories/submit">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                {tStories("shareStory")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {storiesData.items.map((story) => {
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
                  <Link key={story.id} href={`/community-stories/${story.id}`}>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {(hasYouTube || hasUploadedMedia) ? (
                        <div className="aspect-video relative bg-neutral-200">
                          {hasYouTube && youtubeThumbnail ? (
                            <Image
                              src={youtubeThumbnail}
                              alt={tStories("communityStoryLabel")}
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
                              alt={tStories("communityStoryLabel")}
                              fill
                              className="object-cover"
                            />
                          ) : null}
                          {showPlayButton && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors">
                              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="w-6 h-6 text-neutral-900 ml-0.5" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-[3/2] relative bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                          <Heart className="w-8 h-8 text-primary/30" />
                        </div>
                      )}
                      {story.description && (
                        <div className="p-3">
                          <p className="text-neutral-600 line-clamp-2 text-sm">
                            {story.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Share a story CTA */}
            <div className="text-center pt-4">
              <Link href="/community-stories/submit">
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  {tStories("shareStory")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </motion.div>

      {/* Auth Links */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center py-8"
        >
          <p className="text-muted-foreground text-sm">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              {t("signIn")}
            </Link>
          </p>
        </motion.div>
      )}

      {/* Bottom Nav - only show when authenticated */}
      {isAuthenticated && (
        <>
          <div className="h-20" />
          <BottomNav />
        </>
      )}
    </div>
  );
}
