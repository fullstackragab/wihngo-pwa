"use client";

import { useQuery } from "@tanstack/react-query";
import { getFeaturedBirds } from "@/services/bird.service";
import { getStories } from "@/services/story.service";
import { useAuth } from "@/contexts/auth-context";
import { BirdCard } from "@/components/bird-card";
import { StoryCard } from "@/components/story-card";
import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bird } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: featuredBirds, isLoading: birdsLoading } = useQuery({
    queryKey: ["featuredBirds"],
    queryFn: getFeaturedBirds,
    enabled: isAuthenticated,
  });

  const { data: storiesData, isLoading: storiesLoading } = useQuery({
    queryKey: ["recentStories"],
    queryFn: () => getStories(1, 5),
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return <LoadingScreen />;
  }

  // Welcome Screen for non-authenticated users (Figma design)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen-safe flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-6 shadow-sm">
              <Bird className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>

          {/* Brand Name */}
          <div className="space-y-2">
            <h1 className="text-4xl tracking-tight font-medium text-primary">Wihngo</h1>
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <span className="text-sm">A community for bird lovers</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-lg relative">
            <Image
              src="https://images.unsplash.com/photo-1518992028580-6d57bd80f2dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMGJpcmR8ZW58MXx8fHwxNzY2NzU2MzI1fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Bird"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h2 className="text-2xl leading-relaxed font-medium">
              Care for birds, one gentle action at a time.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Every small contribution helps protect and care for birds in need. Your kindness makes a difference.
            </p>
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-4">
            <Link href="/birds">
              <Button fullWidth size="lg">
                Support a Bird
              </Button>
            </Link>

            <Link href="/how-it-works">
              <Button variant="ghost" fullWidth size="lg">
                Learn how it works
              </Button>
            </Link>
          </div>

          {/* Auth Links */}
          <div className="pt-4 space-y-2">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Footer note */}
          <p className="text-xs text-muted-foreground pt-4">
            Support bird care with as little as $1 using digital dollars (USDC)
          </p>
        </div>
      </div>
    );
  }

  const isLoading = birdsLoading || storiesLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen-safe pb-20">
      {/* Header */}
      <TopBar title="Wihngo" showLogo />

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Featured Birds */}
        {featuredBirds && featuredBirds.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-foreground">Featured Birds</h2>
              <Link href="/birds" className="text-sm text-primary font-medium">
                See all
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4">
              {featuredBirds.map((bird) => (
                <div key={bird.birdId} className="flex-shrink-0 w-64">
                  <BirdCard bird={bird} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Stories */}
        {storiesData?.items && storiesData.items.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-foreground">Recent Stories</h2>
              <Link href="/stories" className="text-sm text-primary font-medium">
                See all
              </Link>
            </div>
            <div className="space-y-4">
              {storiesData.items.map((story) => (
                <StoryCard key={story.storyId} story={story} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {(!featuredBirds || featuredBirds.length === 0) &&
          (!storiesData?.items || storiesData.items.length === 0) && (
            <div className="text-center py-12">
              <Bird className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Welcome to Wihngo!
              </h3>
              <p className="text-muted-foreground mb-6">
                Start exploring birds and stories from our community.
              </p>
              <Link href="/birds">
                <Button>Explore Birds</Button>
              </Link>
            </div>
          )}
      </main>

      <BottomNav />
    </div>
  );
}
