"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Eye, Heart, Shield, Leaf } from "lucide-react";

export default function ChickenFearPage() {
  const router = useRouter();
  const t = useTranslations("chickenFear");

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t("title")} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Intro Question */}
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

        {/* Validation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("validation")}
            </p>
          </Card>
        </motion.div>

        {/* Answer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground font-medium leading-relaxed text-center">
              {t("answer")}
            </p>
          </Card>
        </motion.div>

        {/* Prey Animal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-6">
            <h3 className="text-foreground font-medium mb-4 text-center">
              {t("preyAnimalTitle")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-foreground/80">{t("preyPoint1")}</p>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-foreground/80">{t("preyPoint2")}</p>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-foreground/80">{t("preyPoint3")}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Not Philosophy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed text-center italic">
              {t("notPhilosophy")}
            </p>
          </Card>
        </motion.div>

        {/* World View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-6">
            <h3 className="text-foreground font-medium mb-3">
              {t("worldViewTitle")}
            </h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("worldView")}
            </p>
          </Card>
        </motion.div>

        {/* Chicken Perspective */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <h3 className="text-foreground font-medium mb-3 text-center">
              {t("perspectiveTitle")}
            </h3>
            <p className="text-foreground/80 leading-relaxed text-center">
              {t("perspective")}
            </p>
          </Card>
        </motion.div>

        {/* Important Distinction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="p-6">
            <h3 className="text-foreground font-medium mb-3">
              {t("distinctionTitle")}
            </h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("distinction")}
            </p>
          </Card>
        </motion.div>

        {/* Living in the Moment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-foreground font-medium mb-3 text-center">
              {t("momentTitle")}
            </h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("moment")}
            </p>
          </Card>
        </motion.div>

        {/* Safe Place */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Leaf className="w-5 h-5 text-primary" />
              <h3 className="text-foreground font-medium">
                {t("safePlaceTitle")}
              </h3>
            </div>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("safePlace")}
            </p>
          </Card>
        </motion.div>

        {/* Your Empathy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <h3 className="text-foreground font-medium mb-3 text-center">
              {t("empathyTitle")}
            </h3>
            <p className="text-foreground/80 leading-relaxed text-center">
              {t("empathy")}
            </p>
          </Card>
        </motion.div>

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card className="p-6">
            <p className="text-foreground font-medium leading-relaxed text-center">
              {t("conclusion")}
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
