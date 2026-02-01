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

        {/* First and Second Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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

        {/* Deeper Meaning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("deeperMeaning")}
            </p>
          </Card>
        </motion.div>

        {/* Not Because of Cruelty */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("notCruelty")}
            </p>
          </Card>
        </motion.div>

        {/* World Pressure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("worldPressure")}
            </p>
          </Card>
        </motion.div>

        {/* When Human Drowns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("whenHumanDrowns")}
            </p>
          </Card>
        </motion.div>

        {/* They Depend On Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("theyDependOnUs")}
            </p>
          </Card>
        </motion.div>

        {/* Improving Lives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("improvingLives")}
            </p>
          </Card>
        </motion.div>

        {/* Human With Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("humanWithTime")}
            </p>
          </Card>
        </motion.div>

        {/* Exhausted Human */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {t("exhaustedHuman")}
            </p>
          </Card>
        </motion.div>

        {/* Not Just A Chicken */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
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
          transition={{ delay: 0.8 }}
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
