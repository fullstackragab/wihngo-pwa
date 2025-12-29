"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBird, loveBird, unloveBird } from "@/services/bird.service";
import { getBirdStories } from "@/services/story.service";
import { getKindWords } from "@/services/kind-words.service";
import { useAuth } from "@/contexts/auth-context";
import { StoryCard } from "@/components/story-card";
import { KindWordsSection } from "@/components/kind-words";
import { Button } from "@/components/ui/button";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import { ArrowLeft, Heart, MapPin, Flower2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* Bird Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl overflow-hidden shadow-lg mb-6"
        >
          {bird.coverImageUrl || bird.imageUrl ? (
            <Image
              src={bird.coverImageUrl || bird.imageUrl || ""}
              alt={bird.name || "Bird"}
              width={600}
              height={480}
              className="w-full h-80 object-cover"
            />
          ) : (
            <div className="w-full h-80 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-6xl">🐦</span>
            </div>
          )}
          {bird.isMemorial && (
            <Link href={`/birds/${bird.birdId}/memorial`}>
              <div className="absolute top-4 right-4 bg-foreground/70 text-card px-3 py-1 rounded-full text-sm hover:bg-foreground/80 transition-colors cursor-pointer">
                {t("inMemory")}
              </div>
            </Link>
          )}
        </motion.div>

        {/* Bird Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2">{bird.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{bird.location || t("safeHavenNeeded")}</span>
              </div>
            </div>
            <button
              onClick={() => loveMutation.mutate()}
              disabled={loveMutation.isPending}
              className="p-2"
            >
              <Heart
                className={`w-7 h-7 transition-colors ${
                  bird.isLoved
                    ? "text-primary fill-primary"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          </div>

          {/* Story */}
          {(bird.tagline || bird.description) && (
            <div className="space-y-2">
              <h3 className="text-foreground/90">{t("story")}</h3>
              <p className="text-foreground/70 leading-relaxed">
                {bird.description || bird.tagline}
              </p>
            </div>
          )}

          {/* Needs/Info */}
          {bird.species && (
            <div className="space-y-2">
              <h3 className="text-foreground/90">{t("species")}</h3>
              <p className="text-foreground/70">{bird.species}</p>
            </div>
          )}

          {/* Support Button */}
          {bird.canSupport !== false && !bird.isMemorial && (
            <div className="pt-4">
              <Link href={`/birds/${bird.birdId}/support`}>
                <Button size="lg" className="w-full rounded-full gap-2">
                  <Heart className="w-4 h-4" />
                  {t("supportBird", { name: bird.name })}
                </Button>
              </Link>
            </div>
          )}

          {/* Memorial Button */}
          {bird.isMemorial && (
            <div className="pt-4">
              <Link href={`/birds/${bird.birdId}/memorial`}>
                <Button size="lg" variant="outline" className="w-full rounded-full gap-2">
                  <Flower2 className="w-4 h-4" />
                  {t("viewTributes")}
                </Button>
              </Link>
            </div>
          )}

          {bird.supportUnavailableMessage && !bird.isMemorial && (
            <div className="bg-muted/50 rounded-2xl p-4 border border-border">
              <p className="text-sm text-muted-foreground text-center">
                {bird.supportUnavailableMessage}
              </p>
            </div>
          )}

          {/* Reassurance */}
          {bird.canSupport !== false && !bird.isMemorial && (
            <p className="text-center text-sm text-muted-foreground">
              {t("support100Percent")}
            </p>
          )}

          {/* Kind Words Section */}
          {kindWordsData?.isEnabled && (
            <div className="pt-4">
              <KindWordsSection
                birdId={birdId}
                birdName={bird.name}
                initialData={kindWordsData}
                currentUserId={user?.userId}
                isOwner={isOwner}
              />
            </div>
          )}

          {/* Stories Section */}
          <div className="pt-4">
            <h2 className="font-medium text-foreground mb-4">{t("stories")}</h2>
            {storiesLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : !storiesData?.items || storiesData.items.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border/50 text-center py-8">
                <p className="text-muted-foreground">{t("noStoriesYet")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {storiesData.items.map((story) => (
                  <StoryCard key={story.storyId} story={story} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
