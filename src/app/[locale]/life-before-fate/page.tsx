"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function LifeBeforeFatePage() {
  const router = useRouter();
  const t = useTranslations("lifeBeforeFate");

  const points = [
    { title: t("point1Title"), content: t("point1Content"), number: "1" },
    { title: t("point2Title"), content: t("point2Content"), number: "2" },
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

        {/* Images with Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 space-y-4">
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <Image
                src="/chicken.jpg"
                alt="Chicken"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <Image
                src="/cock.jpg"
                alt="Cock"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-foreground font-medium text-center text-lg">
              {t("agreeToLive")}
            </p>
          </Card>
        </motion.div>

        {/* How Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-medium text-foreground text-center pt-2"
        >
          {t("howTitle")}
        </motion.h2>

        {/* Points */}
        {points.map((point, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + index * 0.1 }}
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

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
