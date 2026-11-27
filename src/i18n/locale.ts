export const SUPPORTED_LOCALES = ["en", "vi"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_STORAGE_KEY = "akb-locale";
export const LOCALE_COOKIE_KEY = "akb-locale";
/** Fixed default when no cookie — keeps SSR and first paint aligned. */
export const DEFAULT_LOCALE: AppLocale = "en";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "en" || value === "vi";
}
