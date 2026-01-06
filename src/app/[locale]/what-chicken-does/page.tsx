"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function WhatChickenDoesPage() {
  const router = useRouter();
  const t = useTranslations("whatChickenDoes");

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t("title")} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          <div className="relative flex-1 aspect-square rounded-xl overflow-hidden">
            <Image
              src="/chickens-001.jpg"
              alt="Chickens"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative flex-1 aspect-square rounded-xl overflow-hidden">
            <Image
              src="/chickens-002.webp"
              alt="Chickens"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative flex-1 aspect-square rounded-xl overflow-hidden">
            <Image
              src="/chickens-003.jpg"
              alt="Chickens"
              fill
              className="object-cover"
            />
          </div>
        </motion.div>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center text-lg">
              {t("intro")}
            </p>
          </Card>
        </motion.div>

        {/* Section 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("section1")}
            </p>
          </Card>
        </motion.div>

        {/* What Does It Do */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-foreground font-medium mb-3 text-center">
              {t("whatDoesTitle")}
            </h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("whatDoes")}
            </p>
          </Card>
        </motion.div>

        {/* Moments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("moments")}
            </p>
          </Card>
        </motion.div>

        {/* Not a Lesson */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-center">
              {t("notLesson")}
            </p>
          </Card>
        </motion.div>

        {/* We Have */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-foreground font-medium mb-3">
              {t("weHaveTitle")}
            </h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("weHave")}
            </p>
          </Card>
        </motion.div>

        {/* The Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20 text-center">
            <p className="text-foreground/70 mb-2">{t("questionTitle")}</p>
            <p className="text-foreground/50 line-through mb-3">
              {t("wrongQuestion")}
            </p>
            <p className="text-foreground/70 mb-2">{t("rightQuestionIntro")}</p>
            <p className="text-foreground font-medium text-lg">
              {t("rightQuestion")}
            </p>
          </Card>
        </motion.div>

        {/* Quiet Truth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <h3 className="text-foreground font-medium mb-3 text-center">
              {t("quietTruthTitle")}
            </h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("quietTruth")}
            </p>
          </Card>
        </motion.div>

        {/* If We Can't */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("ifWeCant")}
            </p>
          </Card>
        </motion.div>

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-center">
              {t("conclusion")}
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
