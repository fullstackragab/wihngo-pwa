"use client";

import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
}

// Base skeleton element with shimmer animation
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-neutral-200 rounded",
        className
      )}
    />
  );
}

// Story card skeleton (for home page and community stories)
export function StoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="aspect-video bg-neutral-200 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-neutral-200 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

// Bird card skeleton (for birds page grid)
export function BirdCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-200">
      <div className="aspect-[4/3] bg-neutral-200 animate-pulse" />
      <div className="p-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <div className="h-6 bg-neutral-200 rounded w-24 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse" />
        </div>
        <div className="h-12 bg-neutral-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

// Profile skeleton (for profile page loading)
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* User Info Card */}
        <div className="p-6 bg-card rounded-2xl border border-border/50 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-neutral-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-neutral-200 rounded w-32 animate-pulse" />
              <div className="h-4 bg-neutral-200 rounded w-48 animate-pulse" />
            </div>
          </div>
          {/* Wallet Status */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-neutral-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse" />
                <div className="h-3 bg-neutral-200 rounded w-48 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <div className="w-5 h-5 bg-neutral-200 rounded animate-pulse flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-28 animate-pulse" />
                <div className="h-3 bg-neutral-200 rounded w-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Story detail skeleton
export function StoryDetailSkeleton() {
  return (
    <div className="min-h-screen-safe bg-white pb-20">
      {/* Header */}
      <header className="px-4 py-4 pt-safe border-b border-gray-100 sticky top-0 bg-white z-40">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-neutral-200 rounded animate-pulse" />
          <div className="w-9 h-9 bg-neutral-200 rounded animate-pulse" />
        </div>
      </header>

      {/* Media */}
      <div className="aspect-video bg-neutral-200 animate-pulse" />

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse" />
            <div className="h-3 bg-neutral-200 rounded w-20 animate-pulse" />
          </div>
        </div>

        {/* Birds tags */}
        <div className="flex flex-wrap gap-2">
          <div className="h-8 bg-neutral-200 rounded-full w-24 animate-pulse" />
          <div className="h-8 bg-neutral-200 rounded-full w-20 animate-pulse" />
        </div>

        {/* Content lines */}
        <div className="space-y-3">
          <div className="h-4 bg-neutral-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 py-4 border-y border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-neutral-200 rounded animate-pulse" />
            <div className="w-8 h-4 bg-neutral-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-neutral-200 rounded animate-pulse" />
            <div className="w-8 h-4 bg-neutral-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Comments section */}
        <div className="space-y-4">
          <div className="h-5 bg-neutral-200 rounded w-24 animate-pulse" />
          <div className="flex gap-2">
            <div className="flex-1 h-11 bg-neutral-200 rounded-xl animate-pulse" />
            <div className="w-16 h-11 bg-neutral-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Comment skeleton
export function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 bg-neutral-200 rounded w-20 animate-pulse" />
          <div className="h-3 bg-neutral-200 rounded w-16 animate-pulse" />
        </div>
        <div className="h-4 bg-neutral-200 rounded w-full animate-pulse" />
      </div>
    </div>
  );
}

// Bird detail skeleton
export function BirdDetailSkeleton() {
  return (
    <div className="min-h-screen-safe bg-white pb-20">
      {/* Header */}
      <header className="px-4 py-4 pt-safe border-b border-gray-100 sticky top-0 bg-white z-40">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-neutral-200 rounded animate-pulse" />
          <div className="w-9 h-9 bg-neutral-200 rounded animate-pulse" />
        </div>
      </header>

      {/* Image */}
      <div className="aspect-square bg-neutral-200 animate-pulse" />

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Name & Species */}
        <div className="space-y-2">
          <div className="h-8 bg-neutral-200 rounded w-40 animate-pulse" />
          <div className="h-5 bg-neutral-200 rounded w-24 animate-pulse" />
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex-1 p-4 bg-neutral-100 rounded-xl">
            <div className="h-6 bg-neutral-200 rounded w-8 mx-auto mb-2 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded w-16 mx-auto animate-pulse" />
          </div>
          <div className="flex-1 p-4 bg-neutral-100 rounded-xl">
            <div className="h-6 bg-neutral-200 rounded w-8 mx-auto mb-2 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded w-16 mx-auto animate-pulse" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <div className="h-4 bg-neutral-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse" />
        </div>

        {/* Action button */}
        <div className="h-14 bg-neutral-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

// Home page hero skeleton (for auth loading)
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="px-6 pt-16 pb-12 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-neutral-200 rounded-full mx-auto mb-6 animate-pulse" />
        <div className="h-10 bg-neutral-200 rounded w-3/4 mx-auto mb-4 animate-pulse" />
        <div className="h-5 bg-neutral-200 rounded w-2/3 mx-auto mb-8 animate-pulse" />
        <div className="h-14 bg-neutral-200 rounded-xl w-40 mx-auto animate-pulse" />
      </div>

      {/* How It Works */}
      <div className="px-6 py-16 max-w-5xl mx-auto">
        <div className="h-7 bg-neutral-200 rounded w-40 mx-auto mb-12 animate-pulse" />
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 bg-neutral-200 rounded-full mx-auto mb-4 animate-pulse" />
              <div className="w-8 h-8 bg-neutral-200 rounded-full mx-auto mb-3 animate-pulse" />
              <div className="h-5 bg-neutral-200 rounded w-24 mx-auto mb-2 animate-pulse" />
              <div className="h-4 bg-neutral-200 rounded w-32 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Community story detail skeleton
export function CommunityStoryDetailSkeleton() {
  return (
    <div className="min-h-screen-safe bg-neutral-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 shadow-sm sticky top-0 z-40 pt-safe">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-200 rounded animate-pulse" />
            <div className="h-6 bg-neutral-200 rounded w-32 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Video/Image placeholder */}
        <div className="aspect-video bg-neutral-200 rounded-2xl animate-pulse" />

        {/* Description */}
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse" />
        </div>

        {/* Author info */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-neutral-200 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 bg-neutral-200 rounded w-24 animate-pulse" />
              <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Generic list item skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50 animate-pulse">
      <div className="w-5 h-5 bg-neutral-200 rounded flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-neutral-200 rounded w-28" />
        <div className="h-3 bg-neutral-200 rounded w-full" />
      </div>
    </div>
  );
}

// Grid skeleton for multiple cards
export function BirdGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <BirdCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Stories grid skeleton
export function StoriesGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
