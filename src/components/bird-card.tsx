"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Users } from "lucide-react";
import { Bird } from "@/types/bird";

interface BirdCardProps {
  bird: Bird;
  variant?: "default" | "compact" | "gallery";
}

export function BirdCard({ bird, variant = "default" }: BirdCardProps) {
  // Compact variant for inline lists
  if (variant === "compact") {
    return (
      <Link href={`/bird/${bird.birdId}`}>
        <div className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border hover:shadow-sm transition-all">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {bird.imageUrl ? (
              <Image
                src={bird.imageUrl}
                alt={bird.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{bird.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{bird.species}</p>
          </div>
          <div className="flex items-center gap-1 text-heart-red">
            <Heart className="w-4 h-4 fill-current" />
            <span className="text-sm">{bird.lovedBy}</span>
          </div>
        </div>
      </Link>
    );
  }

  // Gallery variant - matches Figma BirdGalleryScreen card
  if (variant === "gallery") {
    return (
      <Link href={`/bird/${bird.birdId}`}>
        <button className="w-full bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all hover:scale-[1.01] text-left">
          <div className="flex gap-4">
            {/* Image */}
            <div className="w-32 h-32 flex-shrink-0 overflow-hidden">
              {bird.imageUrl ? (
                <Image
                  src={bird.imageUrl}
                  alt={bird.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-3xl">🐦</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 py-4 pr-4 space-y-2">
              <h3 className="text-lg font-medium text-foreground">{bird.name}</h3>

              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {bird.tagline || bird.description || `A beautiful ${bird.species}`}
              </p>

              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                {bird.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{bird.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>{bird.supportedBy} supporters</span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </Link>
    );
  }

  // Default variant - card with image
  return (
    <Link href={`/bird/${bird.birdId}`}>
      <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all">
        <div className="relative aspect-[4/3] bg-muted">
          {bird.imageUrl ? (
            <Image
              src={bird.imageUrl}
              alt={bird.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-4xl">🐦</span>
            </div>
          )}
          {bird.isMemorial && (
            <div className="absolute top-2 left-2 bg-foreground/70 text-card px-2 py-1 rounded-full text-xs">
              In Memory
            </div>
          )}
        </div>
        <div className="p-5 space-y-2">
          <h3 className="font-medium text-foreground text-lg">{bird.name}</h3>
          {bird.tagline && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {bird.tagline}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {bird.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{bird.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{bird.supportedBy} supporters</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
