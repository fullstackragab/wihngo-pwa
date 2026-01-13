"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getBirdsNeedingSupport } from "@/services/bird.service";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { BirdGridSkeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Heart,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { BirdNeedsSupportDto } from "@/types/bird";

function BirdNeedsSupportCard({ bird }: { bird: BirdNeedsSupportDto }) {
  const t = useTranslations("birdsNeedSupport");

  return (
    <Link href={`/birds/${bird.birdId}`}>
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-md transition-shadow">
        {/* Bird Image */}
        <div className="relative aspect-[4/3] bg-muted">
          {bird.imageUrl ? (
            <Image
              src={bird.imageUrl}
              alt={bird.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <span className="text-5xl">🐦</span>
            </div>
          )}
        </div>

        {/* Bird Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground">{bird.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {bird.species && <span>{bird.species}</span>}
              {bird.species && bird.location && <span>•</span>}
              {bird.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {bird.location}
                </span>
              )}
            </div>
          </div>

          {bird.tagline && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              "{bird.tagline}"
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("owner")}: {bird.ownerName}
            </span>
          </div>

          {/* Support Button */}
          <Button
            className="w-full bg-primary hover:bg-primary-hover text-white rounded-xl"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/birds/${bird.birdId}`;
            }}
          >
            <Heart className="w-4 h-4 mr-2" />
            {t("supportButton")}
          </Button>
        </div>
      </div>
    </Link>
  );
}

export default function BirdsNeedSupportPage() {
  const router = useRouter();
  const t = useTranslations("birdsNeedSupport");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["birdsNeedingSupport"],
    queryFn: getBirdsNeedingSupport,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="h-8 bg-neutral-200 rounded w-48 animate-pulse" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <BirdGridSkeleton count={6} />
        </div>
      </div>
    );
  }

  const birds = data?.birds || [];
  const allComplete = data?.allComplete || false;
  const thankYouMessage = data?.thankYouMessage;
  const howItWorks = data?.howItWorks;
  const birdsSupportedThisWeek = data?.birdsSupportedThisWeek || 0;
  const birdsRemainingThisWeek = data?.birdsRemainingThisWeek || 0;
  const totalBirdsParticipating = data?.totalBirdsParticipating || 0;
  const weekStartDate = data?.weekStartDate;
  const weekEndDate = data?.weekEndDate;

  // Format week dates
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const weekRange = weekStartDate && weekEndDate
    ? `${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}`
    : "";

  // Progress percentage
  const progressPercent = totalBirdsParticipating > 0
    ? (birdsSupportedThisWeek / totalBirdsParticipating) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/birds")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{t("title")}</h2>
            </div>
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* How It Works Expandable */}
        <AnimatePresence>
          {showHowItWorks && howItWorks && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-green-50 rounded-2xl p-5 space-y-4 border border-green-200">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-2">
                      {t("howItWorksTitle")}
                    </h3>
                    <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                      {howItWorks}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="flex items-center gap-1 text-sm text-primary font-medium mt-2"
                >
                  <ChevronUp className="w-4 h-4" />
                  {t("hideExplanation")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weekly Progress Banner */}
        {!allComplete && birds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border/50"
          >
            {/* Week dates */}
            {weekRange && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Calendar className="w-3.5 h-3.5" />
                <span>{t("thisWeek")}: {weekRange}</span>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-neutral-900">
                {t("weeklyProgress")}
              </p>
              <span className="text-sm text-muted-foreground">
                {birdsRemainingThisWeek} {birdsRemainingThisWeek === 1 ? t("birdRemaining") : t("birdsRemaining")}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {birdsSupportedThisWeek}/{totalBirdsParticipating} {t("birdsSupportedThisWeek")}
            </p>
          </motion.div>
        )}

        {/* All Complete - Thank You Message */}
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            {thankYouMessage ? (
              <div className="space-y-4">
                <p className="text-neutral-700 max-w-sm mx-auto leading-relaxed whitespace-pre-line">
                  {thankYouMessage}
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                  {t("allCompleteTitle")}
                </h2>
                <p className="text-neutral-600 max-w-sm mx-auto mb-6 leading-relaxed">
                  {t("allCompleteDesc")}
                </p>
              </>
            )}
            <div className="bg-green-50 rounded-xl p-6 max-w-sm mx-auto mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-primary fill-primary" />
                <Heart className="w-5 h-5 text-primary fill-primary" />
              </div>
              <p className="text-sm text-neutral-700">
                {t("comeBackSunday")}
              </p>
            </div>
            <Link href="/birds">
              <Button className="bg-primary hover:bg-primary-hover text-white rounded-full">
                {t("browseBirds")}
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Birds Grid */}
        {!allComplete && birds.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {birds.map((bird, index) => (
              <motion.div
                key={bird.birdId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <BirdNeedsSupportCard bird={bird} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No Birds Need Support */}
        {!allComplete && birds.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {t("noBirdsNeedSupport")}
            </h3>
            <p className="text-neutral-600 mb-6 max-w-sm mx-auto">
              {t("noBirdsNeedSupportDesc")}
            </p>
            <Link href="/birds">
              <Button className="bg-primary hover:bg-primary-hover text-white rounded-full">
                {t("browseBirds")}
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{t("loadError")}</p>
            <Button onClick={() => refetch()} variant="outline">
              {tCommon("retry")}
            </Button>
          </div>
        )}

        {/* Bottom How It Works Link */}
        {!showHowItWorks && !allComplete && birds.length > 0 && (
          <button
            onClick={() => setShowHowItWorks(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground mx-auto py-4"
          >
            <HelpCircle className="w-4 h-4" />
            {t("howDoesItWork")}
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bottom Nav spacer */}
      <div className="h-20" />
      <BottomNav />
    </div>
  );
}
