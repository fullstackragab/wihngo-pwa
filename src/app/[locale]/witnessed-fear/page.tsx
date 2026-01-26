"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Eye, Clock, Lock, Heart } from "lucide-react";

export default function WitnessedFearPage() {
  const router = useRouter();
  const t = useTranslations("witnessedFear");

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t("title")} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Intro - The Scene */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("intro")}
            </p>
          </Card>
        </motion.div>

        {/* The Scene Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("scene")}
            </p>
          </Card>
        </motion.div>

        {/* The Fear Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground font-bold leading-relaxed text-center text-xl">
              {t("fearStatement")}
            </p>
          </Card>
        </motion.div>

        {/* Not Afraid Without Reason */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Eye className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <h3 className="text-foreground font-medium">
                {t("notWithoutReasonTitle")}
              </h3>
            </div>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("notWithoutReason")}
            </p>
          </Card>
        </motion.div>

        {/* Inherited Memory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <h3 className="text-foreground font-medium">
                {t("inheritedMemoryTitle")}
              </h3>
            </div>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("inheritedMemory")}
            </p>
          </Card>
        </motion.div>

        {/* Prison Metaphor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-destructive" />
              <h3 className="text-foreground font-medium">
                {t("prisonTitle")}
              </h3>
            </div>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-center">
              {t("prison")}
            </p>
          </Card>
        </motion.div>

        {/* Silent Fear */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("silentFear")}
            </p>
          </Card>
        </motion.div>

        {/* Fear Needs No Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <h3 className="text-foreground font-medium">
                {t("noLanguageTitle")}
              </h3>
            </div>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-center">
              {t("noLanguage")}
            </p>
          </Card>
        </motion.div>

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground font-medium leading-relaxed text-center italic">
              {t("conclusion")}
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
