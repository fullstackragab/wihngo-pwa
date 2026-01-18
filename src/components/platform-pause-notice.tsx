"use client";

import { useTranslations } from "next-intl";
import { Info } from "lucide-react";

interface PlatformPauseNoticeProps {
  variant?: "banner" | "card";
}

export function PlatformPauseNotice({ variant = "banner" }: PlatformPauseNoticeProps) {
  const t = useTranslations("platformPause");

  if (variant === "card") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-medium">{t("title")}</p>
            <p className="text-amber-700 text-sm mt-1">{t("message")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-amber-800 text-sm">
          <span className="font-medium">{t("title")}</span>
          {" "}{t("message")}
        </p>
      </div>
    </div>
  );
}

export function LegalDisclaimer() {
  const t = useTranslations("platformPause");

  return (
    <div className="bg-neutral-100 border-t border-neutral-200 px-4 py-6 mt-8">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-neutral-600 text-xs leading-relaxed">
          {t("legalDisclaimer")}
        </p>
      </div>
    </div>
  );
}
