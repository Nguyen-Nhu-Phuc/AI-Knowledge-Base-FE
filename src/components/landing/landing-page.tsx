"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeAccentPicker } from "@/components/theme-accent-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroIconRow, HeroProductStage, RotatingAccent } from "@/components/landing/hero-artwork";
import {
  ArrowRight,
  Bot,
  Check,
  FileText,
  Menu,
  Search,
  Sparkles,
  Upload,
  Users,
  X,
} from "@/components/icons";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#product", key: "landing.navProduct" },
  { href: "#flow", key: "landing.navFlow" },
  { href: "#access", key: "landing.navAccess" },
] as const;

const shell = "mx-auto w-full max-w-[1100px] px-5 sm:px-8";

const RAILS = ["landing-rail-primary", "landing-rail-secondary", "landing-rail-tertiary"] as const;
const SOFTS = ["landing-soft-primary", "landing-soft-secondary", "landing-soft-tertiary"] as const;

export function LandingPage() {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const signedIn = Boolean(hasHydrated && token);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 6);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const trusts = [
    { title: t("landing.trust1Title"), body: t("landing.trust1Body"), soft: SOFTS[0] },
    { title: t("landing.trust2Title"), body: t("landing.trust2Body"), soft: SOFTS[1] },
    { title: t("landing.trust3Title"), body: t("landing.trust3Body"), soft: SOFTS[2] },
    { title: t("landing.trust4Title"), body: t("landing.trust4Body"), soft: SOFTS[0] },
  ];

  const steps = [
    { title: t("landing.step1Title"), body: t("landing.step1Body"), rail: RAILS[0], soft: SOFTS[0] },
    { title: t("landing.step2Title"), body: t("landing.step2Body"), rail: RAILS[1], soft: SOFTS[1] },
    { title: t("landing.step3Title"), body: t("landing.step3Body"), rail: RAILS[2], soft: SOFTS[2] },
  ];

  const roles = [
    { title: t("landing.roleOwnerTitle"), body: t("landing.roleOwnerBody"), chip: "landing-chip-tertiary" },
    { title: t("landing.roleAdminTitle"), body: t("landing.roleAdminBody"), chip: "landing-chip-primary" },
    { title: t("landing.roleMemberTitle"), body: t("landing.roleMemberBody"), chip: "landing-chip-secondary" },
    { title: t("landing.roleViewerTitle"), body: t("landing.roleViewerBody"), chip: "landing-chip-primary" },
  ];

  const moreFeatures = [
    {
      label: t("landing.featurePeopleTitle"),
      body: t("landing.featurePeopleBody"),
      icon: Users,
      soft: SOFTS[0],
    },
    {
      label: t("landing.featureConnectTitle"),
      body: t("landing.featureConnectBody"),
      icon: Upload,
      soft: SOFTS[1],
    },
    {
      label: t("landing.featureInsightTitle"),
      body: t("landing.featureInsightBody"),
      icon: Sparkles,
      soft: SOFTS[2],
    },
  ];

  const palette = [
    { key: "settings.color_primary", swatch: "theme-swatch-primary", rail: RAILS[0] },
    { key: "settings.color_secondary", swatch: "theme-swatch-secondary", rail: RAILS[1] },
    { key: "settings.color_tertiary", swatch: "theme-swatch-tertiary", rail: RAILS[2] },
  ] as const;

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] landing-aurora" aria-hidden />
      <div
        className="pointer-events-none absolute -left-24 top-40 hidden h-64 w-64 rounded-full blur-3xl landing-orb opacity-50 dark:block"
        style={{ background: "color-mix(in srgb, var(--theme-tertiary) 35%, transparent)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-24 hidden h-72 w-72 rounded-full blur-3xl landing-orb-delay opacity-45 dark:block"
        style={{ background: "color-mix(in srgb, var(--theme-secondary) 40%, transparent)" }}
        aria-hidden
      />

      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md",
          scrolled ? "border-border" : "border-transparent",
        )}
      >
        <div className={cn(shell, "flex h-[60px] items-center gap-3")}>
          <BrandLogo href="/" />
          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label={t("landing.navProduct")}>
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-[15px] text-muted transition-colors hover:bg-ink-100 hover:text-foreground dark:hover:bg-ink-800"
              >
                {t(item.key)}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <ThemeAccentPicker />
            <ThemeToggle />
            {!signedIn ? (
              <Link
                href="/login"
                className="hidden text-[15px] font-medium text-muted hover:text-foreground md:inline"
              >
                {t("landing.signIn")}
              </Link>
            ) : null}
            <Link
              href={signedIn ? "/app" : "/register"}
              className="akb-landing-btn-primary inline-flex h-9 items-center rounded-md px-3.5 text-sm font-medium"
            >
              {signedIn ? t("landing.enterWorkspace") : t("landing.getStarted")}
            </Link>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-elevated text-foreground lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t("landing.closeMenu") : t("landing.openMenu")}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div className="border-t border-border bg-background px-5 py-3 lg:hidden">
            <nav className="flex flex-col">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2 py-2.5 text-[15px] text-foreground hover:bg-ink-100 dark:hover:bg-ink-800"
                  onClick={() => setMenuOpen(false)}
                >
                  {t(item.key)}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex items-center gap-2 sm:hidden">
              <LanguageSwitcher />
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative z-[1]">
        <section className="px-5 pb-12 pt-12 text-center sm:pt-16">
          <div className="mx-auto max-w-[860px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-700 shadow-sm dark:bg-surface-elevated dark:text-muted">
              <span className="h-2 w-2 rounded-full theme-swatch-secondary" />
              {t("landing.eyebrow")}
            </p>
            <div className="mt-7">
              <HeroIconRow />
            </div>
            <h1 className="mt-8 text-[clamp(2.2rem,5.8vw,3.85rem)] font-bold leading-[1.08] tracking-[-0.04em] text-foreground">
              {t("landing.titleBefore")}{" "}
              <RotatingAccent />{" "}
              {t("landing.titleAfter")}
            </h1>
            <p className="landing-copy mx-auto mt-5 max-w-[36rem] text-[17px] leading-relaxed sm:text-lg">
              {t("landing.subtitle")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {signedIn ? (
                <Link
                  href="/app"
                  className="akb-landing-btn-primary inline-flex h-11 min-w-[180px] items-center justify-center gap-2 rounded-md px-5 text-[15px] font-medium"
                >
                  {t("landing.enterWorkspace")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="akb-landing-btn-primary inline-flex h-11 min-w-[180px] items-center justify-center gap-2 rounded-md px-5 text-[15px] font-medium"
                  >
                    {t("landing.primaryCta")}
                  </Link>
                  <Link
                    href="/login"
                    className="akb-landing-btn-secondary inline-flex h-11 min-w-[160px] items-center justify-center rounded-md px-5 text-[15px] font-medium"
                  >
                    {t("landing.secondaryCta")}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Live 3-color palette — above fold after CTAs */}
          <div className={cn(shell, "mt-10")}>
            <div className="landing-palette-bar mx-auto max-w-xl">
              <span className="theme-swatch-primary" />
              <span className="theme-swatch-secondary" />
              <span className="theme-swatch-tertiary" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">{t("landing.paletteTitle")}</p>
            <p className="landing-copy mt-1 text-sm">{t("landing.paletteSubtitle")}</p>
            <ul className="mx-auto mt-5 grid max-w-2xl gap-3 sm:grid-cols-3">
              {palette.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated/90 px-3 py-3 text-left shadow-sm"
                >
                  <span className={cn("h-11 w-11 shrink-0 rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10", item.swatch)} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{t(item.key)}</p>
                    <p className={cn("mt-1.5 h-2 w-20 rounded-full", item.rail)} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <HeroProductStage />

          <div className={cn(shell, "mt-14")}>
            <p className="landing-copy text-sm font-medium">{t("landing.proofLabel")}</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {trusts.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-border bg-white p-4 text-left shadow-sm dark:bg-surface-elevated"
                >
                  <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg", item.soft)}>
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="landing-copy mt-1 text-sm leading-relaxed">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="product" className="scroll-mt-20 px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-[760px] text-center">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-[-0.03em] text-foreground">
              {t("landing.featuresTitle")}
            </h2>
            <p className="landing-copy mx-auto mt-4 max-w-xl text-[17px] leading-relaxed">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div className={cn(shell, "mt-12 space-y-5")}>
            <FeatureCard
              label={t("landing.featureChatLabel")}
              title={t("landing.featureChatTitle")}
              body={t("landing.featureChatBody")}
              rail={RAILS[0]}
            >
              <div className="rounded-xl border border-border bg-surface-elevated p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-muted">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md landing-soft-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                  {t("landing.mockKb")}
                </div>
                <p className="mt-4 rounded-xl landing-soft-secondary px-3 py-2 text-sm font-medium text-foreground">
                  {t("landing.mockQuestion")}
                </p>
                <p className="landing-copy mt-2 text-sm leading-relaxed">{t("landing.mockAnswer")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md landing-soft-tertiary px-2 py-1 text-xs font-semibold">
                    <FileText className="h-3 w-3" />
                    {t("landing.mockCite1")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md landing-soft-primary px-2 py-1 text-xs font-semibold">
                    <FileText className="h-3 w-3" />
                    {t("landing.mockCite2")}
                  </span>
                </div>
              </div>
            </FeatureCard>

            <FeatureCard
              label={t("landing.featureSearchLabel")}
              title={t("landing.featureSearchTitle")}
              body={t("landing.featureSearchBody")}
              rail={RAILS[1]}
            >
              <div className="rounded-xl border border-border bg-surface-elevated p-4 shadow-sm">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-ink-700 dark:text-muted">
                  <Search className="h-4 w-4" style={{ color: "var(--theme-primary)" }} />
                  {t("landing.mockQuestion")}
                </div>
                <ul className="mt-3 space-y-2">
                  {[t("landing.mockCite1"), t("landing.mockCite2")].map((label, i) => (
                    <li
                      key={label}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                        i === 0 ? "landing-soft-primary" : "landing-soft-secondary",
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </FeatureCard>

            <FeatureCard
              label={t("landing.featureKbLabel")}
              title={t("landing.featureKbTitle")}
              body={t("landing.featureKbBody")}
              rail={RAILS[2]}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {[t("landing.mockKb"), t("nav.knowledgeBases")].map((name, i) => (
                  <div
                    key={name}
                    className="overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-sm"
                  >
                    <div className={cn("h-1.5", i === 0 ? RAILS[0] : RAILS[1])} />
                    <div className="p-4">
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium landing-soft-tertiary rounded-md px-2 py-1">
                        <Check className="h-3.5 w-3.5" />
                        {t("landing.mockReady")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </FeatureCard>
          </div>

          <div className={cn(shell, "mt-14")}>
            <div className="mx-auto max-w-[760px] text-center">
              <h3 className="text-[clamp(1.35rem,2.6vw,1.85rem)] font-bold tracking-[-0.03em]">
                {t("landing.moreFeaturesTitle")}
              </h3>
              <p className="landing-copy mx-auto mt-3 max-w-xl text-[15px] leading-relaxed">
                {t("landing.moreFeaturesSubtitle")}
              </p>
            </div>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {moreFeatures.map((item) => (
                <li
                  key={item.label}
                  className="rounded-2xl border border-border bg-white p-5 text-left shadow-sm dark:bg-surface-elevated"
                >
                  <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", item.soft)}>
                    <item.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-[15px] font-semibold text-foreground">{item.label}</p>
                  <p className="landing-copy mt-2 text-sm leading-relaxed">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="flow"
          className="scroll-mt-20 border-y border-border bg-surface px-5 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-[760px] text-center">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-[-0.03em]">
              {t("landing.flowTitle")}
            </h2>
            <p className="landing-copy mx-auto mt-4 max-w-xl text-[17px] leading-relaxed">
              {t("landing.flowSubtitle")}
            </p>
          </div>
          <ol className={cn(shell, "mt-12 grid gap-4 md:grid-cols-3")}>
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="overflow-hidden rounded-[16px] border border-border bg-white shadow-sm dark:bg-surface-elevated"
              >
                <div className={cn("h-1.5", step.rail)} />
                <div className="p-6">
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                      step.soft,
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="landing-copy mt-2 text-[15px] leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="access" className="scroll-mt-20 px-5 py-16 sm:py-24">
          <div className={shell}>
            <div className="max-w-[640px]">
              <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-[-0.03em]">
                {t("landing.rolesTitle")}
              </h2>
              <p className="landing-copy mt-4 text-[17px] leading-relaxed">{t("landing.rolesSubtitle")}</p>
            </div>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {roles.map((role) => (
                <li
                  key={role.title}
                  className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-surface-elevated"
                >
                  <span className={cn("landing-chip", role.chip)}>{role.title}</span>
                  <p className="landing-copy mt-3 text-[15px] leading-relaxed">{role.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-5 pb-20">
          <div
            className={cn(
              shell,
              "landing-panel-gradient relative overflow-hidden rounded-[22px] px-6 pb-12 pt-14 text-center sm:px-10 sm:pb-16 sm:pt-16",
            )}
          >
            <div className="relative">
              <div className="mx-auto mb-6 flex h-2.5 w-44 overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/10">
                <span className="w-1/3 theme-swatch-primary" />
                <span className="w-1/3 theme-swatch-secondary" />
                <span className="w-1/3 theme-swatch-tertiary" />
              </div>
              <h2 className="mx-auto max-w-2xl text-[clamp(1.7rem,3.2vw,2.4rem)] font-bold tracking-[-0.03em] text-foreground">
                {t("landing.ctaTitle")}
              </h2>
              <p className="landing-copy mx-auto mt-4 max-w-lg text-[16px] font-medium leading-relaxed">
                {t("landing.ctaSubtitle")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={signedIn ? "/app" : "/register"}
                  className="akb-landing-btn-primary inline-flex h-11 min-w-[180px] items-center justify-center gap-2 rounded-md px-5 text-[15px]"
                >
                  {signedIn ? t("landing.enterWorkspace") : t("landing.primaryCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!signedIn ? (
                  <Link
                    href="/login"
                    className="akb-landing-btn-secondary inline-flex h-11 min-w-[140px] items-center justify-center rounded-md px-5 text-[15px]"
                  >
                    {t("landing.secondaryCta")}
                  </Link>
                ) : null}
              </div>
              <p className="landing-copy mt-5 text-sm font-medium">{t("landing.ctaNote")}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-copy relative z-[1] border-t border-border py-10">
        <div className="mb-6 h-1 w-full">
          <div className="landing-palette-bar mx-auto max-w-[1100px] rounded-none px-5 sm:px-8">
            <span className="theme-swatch-primary !rounded-none" />
            <span className="theme-swatch-secondary !rounded-none" />
            <span className="theme-swatch-tertiary !rounded-none" />
          </div>
        </div>
        <div className={cn(shell, "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between")}>
          <div>
            <BrandLogo href="/" className="text-foreground" />
            <p className="mt-3 max-w-sm text-sm leading-relaxed">{t("landing.footerNote")}</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
            <a href="#product" className="hover:text-foreground">
              {t("landing.navProduct")}
            </a>
            <Link href="/login" className="hover:text-foreground">
              {t("landing.signIn")}
            </Link>
            <Link href="/register" className="hover:text-foreground">
              {t("landing.getStarted")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  label,
  title,
  body,
  rail,
  children,
}: {
  label: string;
  title: string;
  body: string;
  rail: string;
  children: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-[18px] border border-border bg-surface shadow-sm">
      <div className={cn("h-1.5", rail)} />
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-ink-700 dark:text-muted">{label}</p>
          <h3 className="mt-2 text-[clamp(1.35rem,2.4vw,1.75rem)] font-bold tracking-[-0.025em] text-foreground">
            {title}
          </h3>
          <p className="landing-copy mt-3 max-w-md text-[15px] leading-relaxed">{body}</p>
        </div>
        <div>{children}</div>
      </div>
    </article>
  );
}
