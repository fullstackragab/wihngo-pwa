"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  ArrowLeft,
  Target,
  AlertCircle,
  CheckCircle,
  Beaker,
  BookOpen,
} from "lucide-react";
import { motion } from "motion/react";
import { getInitiativeBySlug } from "@/data/initiatives";

export default function InitiativeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const initiative = getInitiativeBySlug(slug);

  if (!initiative) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar title="Initiative" onBack={() => router.back()} />
        <div className="max-w-lg mx-auto p-4">
          <Card className="p-8 text-center">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-medium text-foreground mb-2">
              Initiative not found
            </h2>
            <p className="text-muted-foreground mb-4">
              This initiative may have been moved or doesn&apos;t exist.
            </p>
            <Link href="/initiatives">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Initiatives
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={initiative.title} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-primary" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-xl font-medium text-foreground">
              {initiative.title}
            </h1>
          </div>
          <p className="text-muted-foreground">{initiative.tagline}</p>

          {/* Example badge */}
          {initiative.isExample && (
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full">
              <Beaker className="w-4 h-4" />
              Example initiative — for demonstration and discussion
            </div>
          )}
        </motion.div>

        {/* Progress (if active) */}
        {initiative.progress !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">
                  {initiative.progress}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${initiative.progress}%` }}
                />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Problem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <h3 className="font-medium text-foreground">The Problem</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {initiative.problem}
            </p>
          </Card>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-foreground">What We&apos;re Doing</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {initiative.description}
            </p>
          </Card>
        </motion.div>

        {/* Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-5 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-foreground">Goals</h3>
            </div>
            <ul className="space-y-3">
              {initiative.goals.map((goal, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-foreground/80">{goal}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Outcomes (if completed) */}
        {initiative.outcomes && initiative.outcomes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-foreground">Outcomes</h3>
              </div>
              <ul className="space-y-2">
                {initiative.outcomes.map((outcome, index) => (
                  <li
                    key={index}
                    className="text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary">•</span>
                    {outcome}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}

        {/* Lessons Learned (if completed) */}
        {initiative.lessonsLearned && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="p-5 bg-accent/30 border-accent">
              <h3 className="font-medium text-foreground mb-2">
                Lessons Learned
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {initiative.lessonsLearned}
              </p>
            </Card>
          </motion.div>
        )}

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center pt-4"
        >
          <Link href="/initiatives">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Initiatives
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
