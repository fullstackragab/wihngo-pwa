"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Bird } from "@/types/bird";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

interface BirdCardProps {
  bird: Bird;
  onSupport?: (bird: Bird) => void;
  variant?: "default" | "compact" | "feed";
}

export function BirdCard({ bird, onSupport, variant = "default" }: BirdCardProps) {
  // Compact variant for inline lists
  if (variant === "compact") {
    return (
      <Link href={`/bird/${bird.birdId}`}>
        <div className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border/50 hover:shadow-sm transition-all">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {bird.imageUrl ? (
              <Image
                src={bird.imageUrl}
                alt={bird.name || "Bird"}
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
          <div className="flex items-center gap-1 text-primary">
            <Heart className="w-4 h-4" />
            <span className="text-sm">{bird.lovedBy || bird.supportedBy || 0}</span>
          </div>
        </div>
      </Link>
    );
  }

  // Feed variant - matches Figma BirdCard design
  if (variant === "feed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <Link href={`/bird/${bird.birdId}`}>
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {bird.imageUrl ? (
                <Image
                  src={bird.imageUrl}
                  alt={bird.name || "Bird"}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-4xl">🐦</span>
                </div>
              )}
            </div>
          </Link>
          <div className="p-5 space-y-3">
            <Link href={`/bird/${bird.birdId}`}>
              <h3>{bird.name}</h3>
            </Link>
            <p className="text-muted-foreground line-clamp-2">
              {bird.tagline || bird.description || `A beautiful ${bird.species} who needs your support.`}
            </p>
            {bird.supportedBy !== undefined && bird.supportedBy > 0 && (
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <Heart className="w-4 h-4 text-primary" />
                <span>{bird.supportedBy} supporters</span>
              </div>
            )}
            <Button
              onClick={(e) => {
                e.preventDefault();
                if (onSupport) {
                  onSupport(bird);
                } else {
                  window.location.href = `/birds/${bird.birdId}/support`;
                }
              }}
              className="w-full rounded-full gap-2"
              variant="default"
            >
              <Heart className="w-4 h-4" />
              Support {bird.name}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant - card with image (original design)
  return (
    <Link href={`/bird/${bird.birdId}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {bird.imageUrl ? (
            <Image
              src={bird.imageUrl}
              alt={bird.name || "Bird"}
              width={400}
              height={300}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-4xl">🐦</span>
            </div>
          )}
        </div>
        <div className="p-5 space-y-3">
          <h3>{bird.name}</h3>
          <p className="text-muted-foreground line-clamp-2">
            {bird.tagline || bird.description || `A beautiful ${bird.species}`}
          </p>
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <Heart className="w-4 h-4 text-primary" />
            <span>{bird.supportedBy || 0} supporters</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
