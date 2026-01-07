"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBird, loveBird, unloveBird } from "@/services/bird.service";
import { getBirdStories } from "@/services/story.service";
import { getKindWords } from "@/services/kind-words.service";
import { useAuth } from "@/contexts/auth-context";
import { useEligibility } from "@/hooks/useEligibility";
import { StoryCard } from "@/components/story-card";
import { KindWordsSection } from "@/components/kind-words";
import { Button } from "@/components/ui/button";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import { ArrowLeft, Heart, Flower2, Gift, Info, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { isMobileDevice } from "@/lib/phantom/platform";

export default function BirdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const birdId = params.birdId as string;
  const t = useTranslations("birds");

  const { data: bird, isLoading, error } = useQuery({
    queryKey: ["bird", birdId],
    queryFn: () => getBird(birdId),
    enabled: !!birdId && isAuthenticated,
  });

  const { data: storiesData, isLoading: storiesLoading } = useQuery({
    queryKey: ["birdStories", birdId],
    queryFn: () => getBirdStories(birdId),
    enabled: !!birdId && isAuthenticated,
  });

  const { data: kindWordsData } = useQuery({
    queryKey: ["kindWords", birdId],
    queryFn: () => getKindWords(birdId),
    enabled: !!birdId && isAuthenticated,
  });

  // Fetch caretaker's weekly eligibility (for baseline support cap)
  const {
    canReceiveBaseline,
    hasReachedCap,
    remaining,
    weeklyCap,
    isLoading: eligibilityLoading,
  } = useEligibility(bird?.ownerId);

  const loveMutation = useMutation({
    mutationFn: () => (bird?.isLoved ? unloveBird(birdId) : loveBird(birdId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bird", birdId] });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !bird) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{t("loadFailed")}</p>
          <Button onClick={() => router.back()}>{t("goBack")}</Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.userId === bird.ownerId;

  // Share with pooled impact messaging - "Help more birds", not "Share this bird"
  const handleShare = async () => {
    const shareData = {
      title: "Help feed birds on Wihngo",
      text: `${bird.name || "This bird"} represents many others. Your support feeds birds equally - $1 keeps a bird fed for a week.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
        // Could show a toast here
      } catch {
        // Clipboard failed
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/birds")}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </button>
          <h1 className="text-xl font-semibold text-neutral-900">
            {bird.name || "Bird"}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Bird Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="aspect-[16/9] rounded-2xl overflow-hidden mb-6"
        >
          {bird.coverImageUrl || bird.imageUrl ? (
            <Image
              src={bird.coverImageUrl || bird.imageUrl || ""}
              alt={bird.name || "Bird"}
              width={800}
              height={450}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
              <span className="text-6xl">🐦</span>
            </div>
          )}
        </motion.div>

        {/* Bird Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 mb-6 shadow-sm"
        >
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-3xl font-bold text-neutral-900">{bird.name || "Bird"}</h2>
            <div className="flex items-center gap-3">
              <span className="text-lg text-neutral-600">{bird.species || ""}</span>
              <button
                onClick={() => loveMutation.mutate()}
                disabled={loveMutation.isPending}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <Heart
                  className={`w-6 h-6 transition-colors ${
                    bird.isLoved
                      ? "text-red-500 fill-red-500"
                      : "text-neutral-400"
                  }`}
                />
              </button>
            </div>
          </div>

          {(bird.tagline || bird.description) && (
            <p className="text-neutral-700 leading-relaxed">
              {bird.description || bird.tagline}
            </p>
          )}

          {/* Share button - "Help more birds" not "Share this bird" */}
          <button
            onClick={handleShare}
            className="mt-4 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>{t("helpMoreBirds")}</span>
          </button>
        </motion.div>

        {/* Support Section */}
        {bird.canSupport !== false && !bird.isMemorial && !isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm mb-6 space-y-4"
          >
            {/* PRIMARY CTA: Support all birds (pooled impact) */}
            <Link href="/birds/needs-support">
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary-hover text-white py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {t("supportAllBirds")}
              </Button>
            </Link>

            {/* SECONDARY CTA: Support this bird only (de-emphasized) */}
            {canReceiveBaseline ? (
              <Link href={`/birds/${bird.birdId}/support`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground py-3 text-sm"
                >
                  {t("supportThisBirdOnly")}
                </Button>
              </Link>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="w-full py-3 text-sm opacity-50 cursor-not-allowed"
                >
                  {t("supportThisBirdOnly")}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {t("caretakerCapReached")}
                </p>
              </div>
            )}

            {/* TERTIARY: One-Time Gift */}
            <Link href={`/birds/${bird.birdId}/gift`}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground py-3 text-sm gap-2"
              >
                <Gift className="w-4 h-4" />
                {t("sendOneTimeGift")}
              </Button>
            </Link>

            {/* Pooled distribution explanation - calm, not preachy */}
            <p className="text-center text-sm text-neutral-500">
              {t("supportDistributed")}
            </p>
          </motion.div>
        )}

        {/* Memorial Button */}
        {bird.isMemorial && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm mb-6"
          >
            <Link href={`/birds/${bird.birdId}/memorial`}>
              <Button
                size="lg"
                variant="outline"
                className="w-full py-6 text-lg rounded-xl gap-2"
              >
                <Flower2 className="w-5 h-5" />
                {t("viewTributes")}
              </Button>
            </Link>
          </motion.div>
        )}

        {bird.supportUnavailableMessage && !bird.isMemorial && (
          <div className="bg-neutral-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-neutral-600 text-center">
              {bird.supportUnavailableMessage}
            </p>
          </div>
        )}

        {/* Kind Words Section */}
        {kindWordsData?.isEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <KindWordsSection
              birdId={birdId}
              birdName={bird.name}
              initialData={kindWordsData}
              currentUserId={user?.userId}
              isOwner={isOwner}
            />
          </motion.div>
        )}

        {/* Stories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">{t("stories")}</h2>
          {storiesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !storiesData?.items || storiesData.items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 text-center py-8">
              <p className="text-neutral-500">{t("noStoriesYet")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {storiesData.items.map((story) => (
                <StoryCard key={story.storyId} story={story} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
