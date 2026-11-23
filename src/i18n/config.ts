"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import vi from "./locales/vi";

export const SUPPORTED_LOCALES = ["en", "vi"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_STORAGE_KEY = "akb-locale";
/** Fixed default so SSR HTML and the first client render always match. */
export const DEFAULT_LOCALE: AppLocale = "en";

export function detectStoredLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved === "en" || saved === "vi") return saved;
  const nav = window.navigator.language?.toLowerCase() ?? "";
  return nav.startsWith("vi") ? "vi" : "en";
}

let initialized = false;

export function initI18n() {
  if (initialized) return i18n;
  initialized = true;

  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    // Never read localStorage/navigator here — that desyncs SSR vs client.
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    returnNull: false,
    react: {
      useSuspense: false,
    },
  });

  return i18n;
}

export async function setAppLocale(locale: AppLocale) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }
  if (!i18n.isInitialized) initI18n();
  await i18n.changeLanguage(locale);
}

export default i18n;
