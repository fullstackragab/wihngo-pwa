"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function NoFearBeforeDeathPage() {
  const router = useRouter();
  const t = useTranslations("noFearBeforeDeath");

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t("title")} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Shared Fate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("sharedFate")}
            </p>
          </Card>
        </motion.div>

        {/* No Justification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("noJustification")}
            </p>
          </Card>
        </motion.div>

        {/* If Fear Were Logical */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("ifFearLogical")}
            </p>
          </Card>
        </motion.div>

        {/* Now Is Safe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed text-center text-lg">
              {t("nowIsSafe")}
            </p>
          </Card>
        </motion.div>

        {/* Chicken Deprived */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("chickenDeprived")}
            </p>
          </Card>
        </motion.div>

        {/* Not Asking Immortality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("notAskingImmortality")}
            </p>
          </Card>
        </motion.div>

        {/* Fear Is Not Fate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground font-bold leading-relaxed text-center text-lg">
              {t("fearIsNotFate")}
            </p>
          </Card>
        </motion.div>

        {/* Fear Is Man-Made */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("fearIsManMade")}
            </p>
          </Card>
        </motion.div>

        {/* Chicken Doesn't Understand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("chickenDoesntUnderstand")}
            </p>
          </Card>
        </motion.div>

        {/* Conscious Beings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("consciousBeings")}
            </p>
          </Card>
        </motion.div>

        {/* What Happens In The End */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {t("whatHappensInEnd")}
            </p>
          </Card>
        </motion.div>

        {/* What We Know */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <p className="text-foreground font-medium leading-relaxed whitespace-pre-line text-center">
              {t("whatWeKnow")}
            </p>
          </Card>
        </motion.div>

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
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
