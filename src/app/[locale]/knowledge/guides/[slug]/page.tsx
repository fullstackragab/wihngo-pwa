"use client";

import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { getGuideBySlug, guideCategories } from "@/data/guides";
import Link from "next/link";

export default function GuideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar title="Guide" onBack={() => router.back()} />
        <div className="max-w-lg mx-auto p-4">
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-medium text-foreground mb-2">Guide not found</h2>
            <p className="text-muted-foreground mb-4">
              This guide may have been moved or doesn&apos;t exist.
            </p>
            <Link href="/knowledge/guides">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Guides
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const category = guideCategories[guide.category];

  // Guide is not ready - show "being prepared" state
  if (!guide.isReady) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar title={guide.title} onBack={() => router.back()} />

        <div className="max-w-lg mx-auto p-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-xl font-medium text-foreground mb-2">
              {guide.title}
            </h1>
            <p className="text-muted-foreground mb-4">{guide.summary}</p>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {category.title}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-accent/30 border-accent text-center">
              <Clock className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">
                This guide is being carefully prepared
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We prefer accuracy and care over speed. This guide will be
                available once it has been properly researched and reviewed.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <Link href="/knowledge/guides">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Explore Other Guides
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Guide is ready - show full content
  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={guide.title} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {category.title}
            </span>
            {guide.readingTime && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {guide.readingTime} min read
              </span>
            )}
          </div>
          <h1 className="text-2xl font-medium text-foreground mb-2">
            {guide.title}
          </h1>
          <p className="text-muted-foreground">{guide.summary}</p>
        </motion.div>

        {guide.content && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="prose prose-sm max-w-none text-foreground/80">
                {guide.content}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
