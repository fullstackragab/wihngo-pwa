"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, BookOpen, Info } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

type TabId = "home" | "explore" | "knowledge" | "about";

const tabs: { id: TabId; icon: typeof House; path: string }[] = [
  { id: "home", icon: House, path: "/" },
  { id: "explore", icon: Search, path: "/birds" },
  { id: "knowledge", icon: BookOpen, path: "/knowledge" },
  { id: "about", icon: Info, path: "/about" },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  const getActiveTab = () => {
    // Remove locale prefix from pathname for matching (e.g., /en/birds -> /birds)
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";

    if (pathWithoutLocale.startsWith("/birds")) return "explore";
    if (pathWithoutLocale.startsWith("/knowledge")) return "knowledge";
    if (pathWithoutLocale.startsWith("/about")) return "about";
    return "home";
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border/50 safe-area-inset-bottom">
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className="flex flex-col items-center gap-1 py-2 px-4 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative z-10 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span
                  className={`text-xs relative z-10 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {t(tab.id)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
