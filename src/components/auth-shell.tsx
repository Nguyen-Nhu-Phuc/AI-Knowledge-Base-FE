"use client";

import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="auth-panel relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="relative z-10 animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            {t("nav.workspace")}
          </p>
          <h1 className="font-display mt-5 max-w-md text-5xl font-semibold leading-[1.05] tracking-tight">
            {t("nav.appName")}
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-white/75">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="relative z-10 space-y-3 text-sm text-white/65">
          <p className="font-medium text-white/85">{t("auth.panelTagline")}</p>
          <p>{t("auth.panelSubtitle")}</p>
        </div>
      </section>

      <section className="app-canvas relative flex min-h-[100dvh] items-center justify-center px-4 py-12 sm:py-16">
        <div className="absolute right-4 top-[max(1rem,var(--safe-top))] z-10 md:right-6 md:top-6">
          <LanguageSwitcher />
        </div>
        <div className="page-enter relative z-[1] w-full max-w-[420px]">
          <div className="mb-6 sm:mb-8 lg:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              {t("nav.workspace")}
            </p>
            <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("nav.appName")}
            </h1>
          </div>
          <div className="surface-panel rounded-2xl p-5 shadow-panel sm:rounded-3xl sm:p-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
