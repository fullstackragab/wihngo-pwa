"use client";

import Link from "next/link";
import Image from "next/image";
import { Bird } from "@/types/bird";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface BirdCardProps {
  bird: Bird;
  onSupport?: (bird: Bird) => void;
  variant?: "default" | "compact" | "feed";
}

// Default weekly goal is $1
const WEEKLY_GOAL = 1;

export function BirdCard({ bird, onSupport, variant = "default" }: BirdCardProps) {
  const t = useTranslations("birds");
  const router = useRouter();

  // Calculate funding progress (using totalSupport or default to 0)
  const currentFunding = bird.totalSupport || 0;
  const weeklyGoal = WEEKLY_GOAL;
  const progressPercentage = Math.min((currentFunding / weeklyGoal) * 100, 100);
  const isFunded = currentFunding >= weeklyGoal;

  // Compact variant for inline lists
  if (variant === "compact") {
    return (
      <Link href={`/birds/${bird.birdId}`}>
        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-neutral-200 hover:shadow-sm transition-all">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0">
            {bird.imageUrl ? (
              <Image
                src={bird.imageUrl}
                alt={bird.name || "Bird"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-neutral-900 truncate">{bird.name}</h3>
            <p className="text-sm text-neutral-600 truncate">{bird.species}</p>
          </div>
        </div>
      </Link>
    );
  }

  // Feed variant - matches Figma BirdCard design with progress bar
  if (variant === "feed") {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
        <Link href={`/birds/${bird.birdId}`}>
          <div className="aspect-[4/3] overflow-hidden">
            {bird.imageUrl ? (
              <Image
                src={bird.imageUrl}
                alt={bird.name || "Bird"}
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                <span className="text-4xl">🐦</span>
              </div>
            )}
          </div>
        </Link>
        <div className="p-5">
          {/* Name + Type */}
          <div className="flex items-baseline justify-between mb-2">
            <Link href={`/birds/${bird.birdId}`}>
              <h3 className="text-xl font-semibold text-neutral-900">{bird.name}</h3>
            </Link>
            <span className="text-sm text-neutral-600">{bird.species}</span>
          </div>

          {/* Weekly Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neutral-600">{t("weeklyGoal")}</span>
              <span className="font-medium text-neutral-900">${weeklyGoal}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Action Button or Funded Badge */}
          {bird.isMemorial ? (
            <Button
              onClick={() => router.push(`/birds/${bird.birdId}/memorial`)}
              className="w-full rounded-xl py-6"
              variant="outline"
            >
              {t("inMemory")}
            </Button>
          ) : isFunded ? (
            <div className="flex items-center gap-2 text-sm text-primary bg-green-50 px-4 py-3 rounded-lg">
              <span>✓ {t("fundedThisWeek")}</span>
            </div>
          ) : bird.canSupport !== false ? (
            <Button
              onClick={() => {
                if (onSupport) {
                  onSupport(bird);
                } else {
                  router.push(`/birds/${bird.birdId}/support`);
                }
              }}
              className="w-full bg-primary hover:bg-primary-hover text-white rounded-xl py-6"
            >
              {t("supportFor1")}
            </Button>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-3">
              Not accepting support
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default variant - simple card with image
  return (
    <Link href={`/birds/${bird.birdId}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
        <div className="aspect-[4/3] overflow-hidden">
          {bird.imageUrl ? (
            <Image
              src={bird.imageUrl}
              alt={bird.name || "Bird"}
              width={400}
              height={300}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
              <span className="text-4xl">🐦</span>
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-xl font-semibold text-neutral-900">{bird.name}</h3>
            <span className="text-sm text-neutral-600">{bird.species}</span>
          </div>
          <p className="text-neutral-600 line-clamp-2">
            {bird.tagline || bird.description || `A beautiful ${bird.species}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
