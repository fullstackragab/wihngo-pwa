"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function AreWeMonstersPage() {
  const router = useRouter();
  const t = useTranslations("areWeMonsters");

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t("title")} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Childhood Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("childhoodStory")}
            </p>
          </Card>
        </motion.div>

        {/* Are We Monsters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <p className="text-foreground leading-relaxed whitespace-pre-line text-center">
              {t("areWeMonsters")}
            </p>
          </Card>
        </motion.div>

        {/* Apex Predator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("apexPredator")}
            </p>
          </Card>
        </motion.div>

        {/* Empty Gaze */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("emptyGaze")}
            </p>
          </Card>
        </motion.div>

        {/* Caring From Afar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("caringFromAfar")}
            </p>
          </Card>
        </motion.div>

        {/* World Sadness */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("worldSadness")}
            </p>
          </Card>
        </motion.div>

        {/* The Alternative */}

      </div>
    </div>
  );
}
