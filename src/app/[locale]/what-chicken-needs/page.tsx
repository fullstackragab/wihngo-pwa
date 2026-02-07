"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function WhatChickenNeedsPage() {
  const router = useRouter();
  const t = useTranslations("whatChickenNeeds");

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t("title")} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Simple Needs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("simpleNeeds")}
            </p>
          </Card>
        </motion.div>

        {/* Weak Creature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("weakCreature")}
            </p>
          </Card>
        </motion.div>

        {/* Natural Routine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("naturalRoutine")}
            </p>
          </Card>
        </motion.div>

        {/* Minimal Needs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("minimalNeeds")}
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
