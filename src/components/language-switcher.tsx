"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "buttons" | "list";
}

export function LanguageSwitcher({ variant = "buttons" }: LanguageSwitcherProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = (params.locale as Locale) || "en";

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Replace the locale in the pathname
    const segments = pathname.split("/");
    // The locale is typically the first segment after the initial slash
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      // If no locale in path, prepend it
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join("/") || "/";
    router.push(newPath);
  };

  // Button variant - simple toggle buttons
  if (variant === "buttons") {
    return (
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <div className="flex rounded-full border border-border overflow-hidden">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => switchLocale(locale)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                locale === currentLocale
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // List variant - for settings pages
  if (variant === "list") {
    return (
      <div className="space-y-2">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => switchLocale(locale)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
              locale === currentLocale
                ? "bg-primary/5 border-primary"
                : "bg-card border-border/50 hover:border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{locale === "ar" ? "🇸🇦" : "🇺🇸"}</span>
              <span className="font-medium">{localeNames[locale]}</span>
            </div>
            {locale === currentLocale && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className="relative">
      <select
        value={currentLocale}
        onChange={(e) => switchLocale(e.target.value as Locale)}
        className="appearance-none bg-card border border-border rounded-full px-4 py-2 pr-8 text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
      <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}
