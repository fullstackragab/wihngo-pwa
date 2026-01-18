"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBird } from "@/services/bird.service";
import { getBirdStories } from "@/services/story.service";
import { getKindWords } from "@/services/kind-words.service";
import { StoryCard } from "@/components/story-card";
import { KindWordsSection } from "@/components/kind-words";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { BirdDetailSkeleton } from "@/components/ui/skeleton";
import { PlatformPauseNotice, LegalDisclaimer } from "@/components/platform-pause-notice";
import { ArrowLeft, Flower2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function BirdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const birdId = params.birdId as string;
  const t = useTranslations("birds");

  const { data: bird, isLoading, error } = useQuery({
    queryKey: ["bird", birdId],
    queryFn: () => getBird(birdId),
    enabled: !!birdId,
  });

  const { data: storiesData, isLoading: storiesLoading } = useQuery({
    queryKey: ["birdStories", birdId],
    queryFn: () => getBirdStories(birdId),
    enabled: !!birdId,
  });

  const { data: kindWordsData } = useQuery({
    queryKey: ["kindWords", birdId],
    queryFn: () => getKindWords(birdId),
    enabled: !!birdId,
  });

  if (isLoading) {
    return <BirdDetailSkeleton />;
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

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Platform Pause Notice */}
      <PlatformPauseNotice />

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
            {bird.name || "Bird"} (Archived)
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
            <span className="text-lg text-neutral-600">{bird.species || ""}</span>
          </div>

          {(bird.tagline || bird.description) && (
            <p className="text-neutral-700 leading-relaxed">
              {bird.description || bird.tagline}
            </p>
          )}

          {/* Archive notice */}
          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <p className="text-amber-800 text-sm">
              This is an archived bird profile. Support features are currently unavailable.
            </p>
          </div>
        </motion.div>

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

        {/* Kind Words Section (read-only) */}
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

      {/* Legal Disclaimer */}
      <LegalDisclaimer />
    </div>
  );
}
