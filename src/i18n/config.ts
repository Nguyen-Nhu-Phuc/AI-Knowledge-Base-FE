"use client";

import i18n, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import vi from "./locales/vi";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  LOCALE_STORAGE_KEY,
  isAppLocale,
  type AppLocale,
} from "./locale";

export function detectStoredLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isAppLocale(saved)) return saved;
  const nav = window.navigator.language?.toLowerCase() ?? "";
  return nav.startsWith("vi") ? "vi" : "en";
}

function writeLocaleCookie(locale: AppLocale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale};path=/;max-age=31536000;samesite=lax`;
}

/** Fresh instance — used on the server per Providers mount. */
export function createI18nInstance(locale: AppLocale = DEFAULT_LOCALE): I18nInstance {
  const instance = i18n.createInstance();
  void instance.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    returnNull: false,
    react: {
      useSuspense: false,
    },
  });
  return instance;
}

let clientSingleton: I18nInstance | null = null;

/** Shared browser instance so LanguageSwitcher / setAppLocale stay in sync. */
export function getClientI18n(locale: AppLocale = DEFAULT_LOCALE): I18nInstance {
  if (typeof window === "undefined") {
    return createI18nInstance(locale);
  }
  if (!clientSingleton) {
    clientSingleton = createI18nInstance(locale);
  } else if (
    clientSingleton.language !== locale &&
    !clientSingleton.language.startsWith(locale)
  ) {
    void clientSingleton.changeLanguage(locale);
  }
  return clientSingleton;
}

export async function setAppLocale(locale: AppLocale) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    writeLocaleCookie(locale);
    document.documentElement.lang = locale;
  }
  const instance = getClientI18n(locale);
  await instance.changeLanguage(locale);
}

export default i18n;
