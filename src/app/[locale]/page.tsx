"use client";

import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bird, CircleCheck, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("home");

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="px-6 pt-16 pb-12 text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Bird className="w-10 h-10 text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4"
        >
          {t("tagline")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-neutral-600 mb-8"
        >
          {t("description")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link href="/birds">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary-hover text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {t("supportBird")}
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* How It Works Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-6 py-16 max-w-5xl mx-auto"
      >
        <h2 className="text-2xl font-semibold text-center text-neutral-900 mb-12">
          {t("howItWorks")}
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bird className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
              1
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">{t("step1Title")}</h3>
            <p className="text-sm text-neutral-600">{t("step1Desc")}</p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
              2
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">{t("step2Title")}</h3>
            <p className="text-sm text-neutral-600">{t("step2Desc")}</p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CircleCheck className="w-8 h-8 text-primary" />
            </div>
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
              3
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">{t("step3Title")}</h3>
            <p className="text-sm text-neutral-600">{t("step3Desc")}</p>
          </div>
        </div>
      </motion.div>

      {/* Mission Statement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="px-6 py-12 bg-green-50 mt-8"
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-neutral-700 leading-relaxed">{t("missionStatement")}</p>
        </div>
      </motion.div>

      {/* Auth Links */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center py-8"
        >
          <p className="text-muted-foreground text-sm">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              {t("signIn")}
            </Link>
          </p>
        </motion.div>
      )}

      {/* Bottom Nav - only show when authenticated */}
      {isAuthenticated && (
        <>
          <div className="h-20" />
          <BottomNav />
        </>
      )}
    </div>
  );
}
