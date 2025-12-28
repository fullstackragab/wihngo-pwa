"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { guides, guideCategories, getGuidesByCategory } from "@/data/guides";
import type { GuideCategory } from "@/types/knowledge";

function GuidesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") as GuideCategory | null;
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory | null>(
    categoryParam
  );

  const displayedGuides = selectedCategory
    ? getGuidesByCategory(selectedCategory)
    : guides;

  const categories = Object.entries(guideCategories) as [
    GuideCategory,
    (typeof guideCategories)[GuideCategory]
  ][];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Guides" onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            className="rounded-full flex-shrink-0"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(([key, category]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              className="rounded-full flex-shrink-0"
              onClick={() => setSelectedCategory(key)}
            >
              {category.title}
            </Button>
          ))}
        </div>

        {/* Guides List */}
        <div className="space-y-3">
          {displayedGuides.map((guide, index) => (
            <motion.div
              key={guide.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/knowledge/guides/${guide.slug}`}>
                <Card className="p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {guide.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {guide.summary}
                      </p>
                      {!guide.isReady && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                          Being prepared
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {displayedGuides.length === 0 && (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No guides in this category yet.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function GuidesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <GuidesContent />
    </Suspense>
  );
}
