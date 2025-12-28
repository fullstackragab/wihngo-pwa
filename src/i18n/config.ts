/**
 * i18n Configuration
 *
 * Phase 1: en + ar
 * Future: Expand to 16 languages
 *
 * Languages are designed to be added by simply:
 * 1. Adding locale code to locales array
 * 2. Creating messages/{locale}.json
 * 3. Adding locale name to localeNames
 */

export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

// RTL languages
export const rtlLocales: Locale[] = ["ar"];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// Future languages (ready to enable)
// "de", "es", "fr", "hi", "id", "it", "ja", "ko", "pl", "pt", "th", "tr", "vi", "zh"
