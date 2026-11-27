"use client";

import { useTranslation } from "react-i18next";
import { BackLink } from "@/components/back-link";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="app-canvas flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">
        {t("common.notFoundTitle", { defaultValue: "Page not found" })}
      </h1>
      <p className="max-w-md text-sm text-muted">
        {t("common.notFoundDesc", {
          defaultValue:
            "The page you are looking for does not exist or has been moved.",
        })}
      </p>
      <BackLink
        href="/"
        label={t("landing.backHome")}
        className="rounded-lg bg-[var(--theme-primary)] px-4 text-white hover:bg-[var(--theme-primary)] hover:opacity-90 hover:text-white"
      />
    </div>
  );
}
