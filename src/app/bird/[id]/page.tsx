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
import { Card } from "@/components/ui/card";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import { ArrowLeft, Heart, Users, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function BirdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const birdId = params.id as string;

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
      <div className="min-h-screen-safe flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load bird</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.userId === bird.ownerId;

  return (
    <div className="min-h-screen-safe flex flex-col">
      {/* Bird Image - Figma BirdProfileScreen style */}
      <div className="relative">
        <div className="aspect-[3/4] max-h-[60vh] overflow-hidden">
          {bird.coverImageUrl || bird.imageUrl ? (
            <Image
              src={bird.coverImageUrl || bird.imageUrl || ""}
              alt={bird.name || "Bird"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-6xl">🐦</span>
            </div>
          )}
        </div>

        {/* Back Button Overlay */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 pt-safe bg-card/90 backdrop-blur-sm text-foreground px-4 py-2 rounded-full shadow-lg hover:bg-card transition-colors"
        >
          ← Back
        </button>

        {/* Memorial Badge */}
        {bird.isMemorial && (
          <div className="absolute top-6 right-6 pt-safe bg-foreground/70 text-card px-3 py-1 rounded-full text-sm">
            In Memory
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 bg-background rounded-t-[2rem] -mt-6 relative z-10 px-6 py-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-medium">{bird.name}</h1>
              <button
                onClick={() => loveMutation.mutate()}
                disabled={loveMutation.isPending}
                className="p-2 -mr-2"
              >
                <Heart
                  className={`w-7 h-7 transition-colors ${
                    bird.isLoved
                      ? "text-heart-red fill-heart-red"
                      : "text-muted"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {bird.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{bird.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{bird.supportedBy} supporters</span>
              </div>
            </div>
          </div>

          {/* Story Card - Figma style */}
          {(bird.tagline || bird.description) && (
            <div className="bg-card rounded-2xl p-5 border border-border space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4" />
                <span>Story</span>
              </div>
              <p className="leading-relaxed text-foreground">
                {bird.description || bird.tagline}
              </p>
            </div>
          )}

          {/* Support Info - Figma accent box style */}
          {bird.canSupport !== false && !bird.isMemorial && (
            <div className="bg-accent/30 rounded-2xl p-4 border border-accent">
              <p className="text-sm text-accent-foreground">
                Your support helps provide daily care, food, and a safe environment for {bird.name}.
              </p>
            </div>
          )}

          {bird.supportUnavailableMessage && (
            <div className="bg-muted/50 rounded-2xl p-4 border border-border">
              <p className="text-sm text-muted-foreground text-center">
                {bird.supportUnavailableMessage}
              </p>
            </div>
          )}

          {/* Support Button - Figma style */}
          {bird.canSupport !== false && !bird.isMemorial && (
            <Link href={`/donation?birdId=${bird.birdId}&birdName=${encodeURIComponent(bird.name)}&birdImage=${encodeURIComponent(bird.imageUrl || "")}`}>
              <Button
                fullWidth
                size="lg"
                variant="secondary"
              >
                <span className="flex items-center gap-2">
                  Support {bird.name}
                  <span className="text-lg">🐦</span>
                </span>
              </Button>
            </Link>
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
            <h2 className="font-medium text-foreground mb-4">Stories</h2>
            {storiesLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : !storiesData?.items || storiesData.items.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border text-center py-8">
                <p className="text-muted-foreground">No stories yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {storiesData.items.map((story) => (
                  <StoryCard key={story.storyId} story={story} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
