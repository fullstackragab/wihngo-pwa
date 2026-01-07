"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

export default function MyPoorChickenPage() {
  const router = useRouter();
  const t = useTranslations("myPoorChicken");

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </button>
          <h1 className="text-xl font-semibold text-neutral-900">
            {t("title")}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm space-y-6"
        >
          {/* The Story */}
          <div className="prose prose-neutral max-w-none">
            <p className="text-lg leading-relaxed text-neutral-700 whitespace-pre-line">
              {t("story")}
            </p>
          </div>

          {/* Responsibility */}
          <div className="pt-4">
            <p className="text-lg leading-relaxed text-neutral-700 font-medium whitespace-pre-line">
              {t("responsibility")}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
