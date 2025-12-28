import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Use locale prefix for all routes (SEO-friendly)
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
