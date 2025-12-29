"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function AboutPage() {
  const router = useRouter();
  const t = useTranslations("about");

  const values = [
    {
      title: t("value1Title"),
      content: t("value1Content"),
    },
    {
      title: t("value2Title"),
      content: t("value2Content"),
    },
    {
      title: t("value3Title"),
      content: t("value3Content"),
    },
    {
      title: t("value4Title"),
      content: t("value4Content"),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t("title")} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="text-primary font-medium mb-3">{t("missionTitle")}</h3>
            <p className="text-foreground/80 leading-relaxed">
              {t("missionContent")}
            </p>
          </Card>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-foreground text-center">{t("valuesTitle")}</h2>
          <div className="grid gap-4">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="p-5">
                  <h3 className="text-foreground font-medium mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.content}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Vision Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <h3 className="text-foreground font-medium mb-3">{t("visionTitle")}</h3>
            <p className="text-foreground/80 leading-relaxed">
              {t("visionContent")}
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
