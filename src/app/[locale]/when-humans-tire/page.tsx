"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function WhenHumansTirePage() {
  const router = useRouter();
  const t = useTranslations("whenHumansTire");

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t("title")} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Intro - The Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("intro")}
            </p>
          </Card>
        </motion.div>

        {/* I Was Forced - Repeated Truth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <p className="text-foreground font-bold leading-relaxed text-center text-lg">
              {t("forced")}
            </p>
          </Card>
        </motion.div>

        {/* First and Second Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("firstTime")}
            </p>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line mt-3">
              {t("secondTime")}
            </p>
          </Card>
        </motion.div>

        {/* Word Doesn't Justify */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("wordDoesnt")}
            </p>
            <p className="text-foreground font-medium leading-relaxed mt-3">
              {t("deeperTruth")}
            </p>
          </Card>
        </motion.div>

        {/* Not Because Humans Are Cruel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground leading-relaxed">
              {t("notCruelty")}
            </p>
            <p className="text-foreground font-bold leading-relaxed mt-2 text-lg">
              {t("exhausted")}
            </p>
          </Card>
        </motion.div>

        {/* World Pressure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("worldPressure")}
            </p>
          </Card>
        </motion.div>

        {/* In Exhaustion - Things Fall */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed text-center">
              {t("inExhaustion")}
            </p>
          </Card>
        </motion.div>

        {/* Small Creatures Don't Protest */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("dontProtest")}
            </p>
            <p className="text-foreground font-medium leading-relaxed mt-3">
              {t("theyTrust")}
            </p>
          </Card>
        </motion.div>

        {/* Trust Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("trustDetails")}
            </p>
          </Card>
        </motion.div>

        {/* When Human Drowns in Worry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("whenHumanDrowns")}
            </p>
          </Card>
        </motion.div>

        {/* Responsibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed">
              {t("responsibilityNot")}
            </p>
            <p className="text-foreground font-bold leading-relaxed mt-2 text-lg">
              {t("heavier")}
            </p>
          </Card>
        </motion.div>

        {/* Because We Are Responsible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("becauseResponsible")}
            </p>
          </Card>
        </motion.div>

        {/* Weak Pay The Price */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("weakPayPrice")}
            </p>
          </Card>
        </motion.div>

        {/* Improving Lives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("improvingLives")}
            </p>
            <p className="text-foreground font-bold leading-relaxed mt-3 text-lg">
              {t("condition")}
            </p>
          </Card>
        </motion.div>

        {/* Human With Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line">
              {t("humanWithTime")}
            </p>
          </Card>
        </motion.div>

        {/* Exhausted Human */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("exhaustedHuman")}
            </p>
          </Card>
        </motion.div>

        {/* The Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground leading-relaxed">
              {t("question")}
            </p>
            <p className="text-foreground font-bold leading-relaxed mt-3 text-lg text-center">
              {t("howToReduce")}
            </p>
          </Card>
        </motion.div>

        {/* How To Create */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("howToCreate")}
            </p>
          </Card>
        </motion.div>

        {/* We Are Responsible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("responsible")}
            </p>
          </Card>
        </motion.div>

        {/* Not Just A Chicken */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("notJustChicken")}
            </p>
          </Card>
        </motion.div>

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <p className="text-foreground font-bold leading-relaxed whitespace-pre-line text-center text-lg">
              {t("conclusion")}
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
