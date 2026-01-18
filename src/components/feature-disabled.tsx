"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { LegalDisclaimer } from "@/components/platform-pause-notice";
import { Archive } from "lucide-react";
import { useTranslations } from "next-intl";

interface FeatureDisabledProps {
  title?: string;
}

export function FeatureDisabled({ title }: FeatureDisabledProps) {
  const router = useRouter();
  const t = useTranslations("platformPause");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen bg-background">
      <TopBar title={title || t("featureDisabled")} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Archive className="w-10 h-10 text-amber-600" />
          </div>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3">
            {t("featureDisabled")}
          </h2>

          <p className="text-neutral-600 mb-8 max-w-sm mx-auto">
            {t("featureDisabledDesc")}
          </p>

          <Button
            variant="outline"
            onClick={() => router.push("/")}
          >
            {tCommon("goBack")}
          </Button>
        </div>
      </div>

      <LegalDisclaimer />
    </div>
  );
}
