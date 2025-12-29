"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Bell,
  Shield,
  HelpCircle,
  FileText,
  ChevronRight,
  Globe,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("settings");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const settingsItems = [
    { href: "/settings/notifications", icon: Bell, label: t("notifications") },
    { href: "/settings/privacy", icon: Shield, label: t("privacySecurity") },
    { href: "/settings/help", icon: HelpCircle, label: t("helpSupport") },
    { href: "/terms", icon: FileText, label: t("termsOfService") },
    { href: "/privacy", icon: FileText, label: t("privacyPolicy") },
  ];

  return (
    <div className="min-h-screen-safe bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 pt-safe sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Language Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">{t("language")}</h3>
          <Card padding="none">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">{t("language")}</span>
              </div>
              <LanguageSwitcher variant="buttons" />
            </div>
          </Card>
        </div>

        {/* Other Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">{t("general")}</h3>
          <Card padding="none">
            {settingsItems.map((item, index) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    index !== settingsItems.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-900">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </Card>
        </div>

        {/* App Version */}
        <p className="text-center text-sm text-gray-400 mt-8">
          {t("version")} 1.0.0
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
