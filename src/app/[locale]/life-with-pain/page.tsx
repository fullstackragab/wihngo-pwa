"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function LifeWithPainPage() {
  const router = useRouter();
  const t = useTranslations("lifeWithPain");

  const points = [
    { title: t("point1Title"), content: t("point1Content"), number: "1" },
    { title: t("point2Title"), content: t("point2Content"), number: "2" },
    { title: t("point3Title"), content: t("point3Content"), number: "3" },
    { title: t("point4Title"), content: t("point4Content"), number: "4" },
    { title: t("point5Title"), content: t("point5Content"), number: "5" },
    { title: t("point6Title"), content: t("point6Content"), number: "6" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t("title")} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("intro")}
            </p>
          </Card>
        </motion.div>

        {/* Main Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed text-center text-lg">
              {t("mainQuestion")}
            </p>
          </Card>
        </motion.div>

        {/* Points */}
        {points.map((point, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                  {point.number}
                </span>
                <div className="flex-1">
                  <h3 className="text-foreground font-medium mb-2">
                    {point.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed whitespace-pre-line">
                    {point.content}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Final Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-center font-medium">
              {t("finalStatement")}
            </p>
          </Card>
        </motion.div>

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-center">
              {t("conclusion")}
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
