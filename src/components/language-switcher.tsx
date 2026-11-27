"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { setAppLocale } from "@/i18n/config";
import { DEFAULT_LOCALE, type AppLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

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

  function select(locale: AppLocale) {
    if (locale === current) return;
    void setAppLocale(locale);
  }

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={cn(
        "inline-flex h-9 items-center rounded-full border border-border bg-surface-elevated p-0.5",
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={current === "vi"}
        onClick={() => select("vi")}
        className={cn(
          "inline-flex h-8 min-w-[2.4rem] items-center justify-center rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors",
          current === "vi"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted hover:text-foreground",
        )}
      >
        VI
      </button>
      <button
        type="button"
        aria-pressed={current === "en"}
        onClick={() => select("en")}
        className={cn(
          "inline-flex h-8 min-w-[2.4rem] items-center justify-center rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors",
          current === "en"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted hover:text-foreground",
        )}
      >
        EN
      </button>
    </div>
  );
}
