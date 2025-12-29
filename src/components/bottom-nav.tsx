"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, Heart, User } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

type TabId = "home" | "explore" | "support" | "profile";

const tabs: { id: TabId; icon: typeof House; path: string }[] = [
  { id: "home", icon: House, path: "/" },
  { id: "explore", icon: Search, path: "/birds" },
  { id: "support", icon: Heart, path: "/support-wihngo" },
  { id: "profile", icon: User, path: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  const getActiveTab = () => {
    if (pathname === "/") return "home";
    // Check for support pages first (birds/.../support)
    if (pathname.includes("/support")) return "support";
    if (pathname.startsWith("/birds")) return "explore";
    if (pathname.startsWith("/support-wihngo")) return "support";
    if (pathname.startsWith("/profile")) return "profile";
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
