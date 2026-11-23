"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE, setAppLocale, type AppLocale } from "@/i18n/config";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep SSR + first client paint on the same default until mounted.
  const current = (
    !mounted
      ? DEFAULT_LOCALE
      : i18n.language?.startsWith("vi")
        ? "vi"
        : "en"
  ) as AppLocale;

  return (
    <label className={`inline-flex items-center gap-1 ${className}`}>
      <span className="sr-only">{t("common.language")}</span>
      <select
        className="h-9 rounded-xl border border-border bg-surface-elevated px-2.5 text-xs font-semibold tracking-wide text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={current}
        aria-label={t("common.language")}
        onChange={(e) => void setAppLocale(e.target.value as AppLocale)}
        suppressHydrationWarning
      >
        <option value="vi">{t("common.localeVi")}</option>
        <option value="en">{t("common.localeEn")}</option>
      </select>
    </label>
  );
}
