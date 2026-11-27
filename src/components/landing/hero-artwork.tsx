"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, FileText } from "@/components/icons";

function IconDoc() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden className="text-foreground">
      <rect x="14" y="8" width="36" height="48" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M22 22h20M22 30h16M22 38h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden className="text-foreground">
      <path
        d="M14 18c0-4 3.5-7 8-7h20c4.5 0 8 3 8 7v16c0 4-3.5 7-8 7H28l-8 8v-8h-6c-4.5 0-8-3-8-7V18z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="28" r="2.2" fill="currentColor" />
      <circle cx="32" cy="28" r="2.2" fill="currentColor" />
      <circle cx="38" cy="28" r="2.2" fill="currentColor" />
    </svg>
  );
}
function IconCite() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden className="text-foreground">
      <path d="M18 20h28v28H22l-4 6V20z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M26 30h12M26 38h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="44" cy="18" r="8" style={{ fill: "var(--theme-primary)" }} />
      <path d="M41 18l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden className="text-foreground">
      <circle cx="28" cy="28" r="12" stroke="currentColor" strokeWidth="2.5" />
      <path d="M37 37l11 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M24 28h8M28 24v8"
        stroke="var(--theme-secondary)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconPeople() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden className="text-foreground">
      <circle cx="24" cy="22" r="7" stroke="currentColor" strokeWidth="2.5" />
      <path d="M10 46c1.5-8 7-12 14-12s12.5 4 14 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="42" cy="24" r="5.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M36 46c1-6 4.5-9 10-9 4 0 7 2 9 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden className="text-foreground">
      <path
        d="M10 22c0-3 2.5-5 5.5-5H26l4 4h18.5c3 0 5.5 2 5.5 5v22c0 3-2.5 5-5.5 5h-33c-3 0-5.5-2-5.5-5V22z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M18 34h28" stroke="var(--theme-tertiary)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function IconSpark() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden className="text-foreground">
      <path
        d="M32 8l3.5 16.5L52 28l-16.5 3.5L32 48l-3.5-16.5L12 28l16.5-3.5L32 8z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="14" r="3" style={{ fill: "var(--theme-secondary)" }} />
    </svg>
  );
}

const ICONS = [
  { node: <IconDoc />, delay: "0ms", y: 0, soft: "landing-soft-primary" },
  { node: <IconChat />, delay: "70ms", y: 10, soft: "landing-soft-secondary" },
  { node: <IconCite />, delay: "140ms", y: 0, soft: "landing-soft-tertiary" },
  { node: <IconSearch />, delay: "210ms", y: 12, soft: "landing-soft-primary" },
  { node: <IconPeople />, delay: "280ms", y: 2, soft: "landing-soft-secondary" },
  { node: <IconFolder />, delay: "350ms", y: 10, soft: "landing-soft-tertiary" },
  { node: <IconSpark />, delay: "420ms", y: 0, soft: "landing-soft-primary" },
];

export function HeroIconRow() {
  return (
    <div className="mx-auto flex max-w-full items-end justify-center gap-2 overflow-visible px-1 sm:gap-3" aria-hidden>
      {ICONS.map((icon, i) => (
        <span
          key={i}
          className={`landing-icon-pop inline-flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-black/10 sm:h-16 sm:w-16 dark:bg-surface-elevated dark:ring-white/10 ${icon.soft}`}
          style={{
            animationDelay: icon.delay,
            marginBottom: icon.y,
          }}
        >
          {icon.node}
        </span>
      ))}
    </div>
  );
}

export function RotatingAccent() {
  const { i18n } = useTranslation();
  const words = i18n.language?.startsWith("vi")
    ? ["hỏi", "tìm", "kiểm chứng"]
    : ["ask", "find", "verify"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((v) => (v + 1) % words.length), 2200);
    return () => window.clearInterval(id);
  }, [words.length]);

  return (
    <span className="landing-chip landing-chip-primary inline-flex items-center gap-2 px-3 py-1 text-[0.95em]">
      <span className="h-2 w-2 rounded-full bg-white" />
      <span key={words[index]} className="landing-word-swap inline-block min-w-[6.5ch] text-left font-bold text-white">
        {words[index]}
      </span>
    </span>
  );
}

export function HeroProductStage() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto mt-12 max-w-[980px] pb-6">
      <div className="pointer-events-none absolute -left-1 top-10 z-10 hidden w-44 rotate-[-8deg] rounded-2xl border border-border bg-surface-elevated p-3 shadow-panel sm:block landing-float-a">
        <div className="mb-2 h-1 overflow-hidden rounded-full">
          <div className="flex h-full w-full">
            <span className="w-1/3 theme-swatch-primary" />
            <span className="w-1/3 theme-swatch-secondary" />
            <span className="w-1/3 theme-swatch-tertiary" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg landing-soft-primary">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">{t("landing.mockCite1")}</p>
            <p className="text-[11px] text-muted">{t("landing.mockReady")}</p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-1 top-20 z-10 hidden w-48 rotate-[7deg] rounded-2xl border border-border bg-surface-elevated p-3 shadow-panel md:block landing-float-b">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          {t("landing.mockSources")}
        </p>
        <div className="mt-2 space-y-1.5">
          {[t("landing.mockCite1"), t("landing.mockCite2")].map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${i === 0 ? "landing-soft-secondary" : "landing-soft-tertiary"}`}
            >
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[22px] border border-border bg-surface p-3 sm:p-5">
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full blur-2xl"
          style={{ background: "color-mix(in srgb, var(--theme-secondary) 30%, transparent)" }}
        />
        <div
          className="absolute -bottom-10 -left-6 h-44 w-44 rounded-full blur-2xl"
          style={{ background: "color-mix(in srgb, var(--theme-tertiary) 28%, transparent)" }}
        />
        <div
          className="absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full blur-2xl"
          style={{ background: "color-mix(in srgb, var(--theme-primary) 18%, transparent)" }}
        />

        <div className="relative overflow-hidden rounded-[16px] border border-border bg-surface-elevated shadow-panel">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-sm font-medium text-muted">{t("nav.aiChat")}</span>
            <span className="ml-auto rounded-full landing-soft-primary px-2.5 py-0.5 text-[11px] font-semibold">
              {t("landing.mockKb")}
            </span>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3 p-4 sm:p-6">
              <div className="landing-float-c ml-auto max-w-[88%] rounded-2xl rounded-br-md landing-soft-secondary px-4 py-3 text-left text-[15px] leading-relaxed">
                {t("landing.mockQuestion")}
              </div>
              <div className="mr-auto max-w-[95%] rounded-2xl rounded-bl-md border border-border bg-surface-elevated px-4 py-3 text-left text-[15px] leading-relaxed shadow-sm">
                {t("landing.mockAnswer")}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md landing-soft-primary px-2 py-1 text-xs font-semibold">
                    <FileText className="h-3 w-3" />
                    {t("landing.mockCite1")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md landing-soft-tertiary px-2 py-1 text-xs font-semibold">
                    <FileText className="h-3 w-3" />
                    {t("landing.mockCite2")}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-muted">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white"
                  style={{ background: "var(--theme-primary)" }}
                >
                  +
                </span>
                {t("dashboard.askPlaceholder")}
              </div>
            </div>

            <div className="border-t border-border bg-background p-4 sm:p-5 lg:border-l lg:border-t-0">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">{t("landing.mockSources")}</p>
                <span className="inline-flex items-center gap-1 rounded-md landing-soft-secondary px-2 py-0.5 text-xs font-semibold">
                  <Check className="h-3.5 w-3.5" />
                  {t("landing.mockReady")}
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { label: t("landing.mockCite1"), score: "94%", bar: "var(--theme-primary)" },
                  { label: t("landing.mockCite2"), score: "88%", bar: "var(--theme-secondary)" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-surface-elevated p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" style={{ color: item.bar }} />
                      <span className="truncate font-medium">{item.label}</span>
                      <span className="ml-auto text-xs font-semibold" style={{ color: item.bar }}>
                        {item.score}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                      <div
                        className="landing-bar h-full rounded-full"
                        style={{ width: item.score, background: item.bar }}
                      />
                    </div>
                  </div>
                ))}
                <div className="rounded-xl border border-dashed border-border p-3">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="h-2 w-2 rounded-full theme-swatch-tertiary" />
                    {t("settings.color_tertiary")} · {t("landing.mockSources")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-2 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft sm:flex landing-float-a">
        <span className="h-2 w-2 animate-pulse rounded-full theme-swatch-primary" />
        <span className="h-2 w-2 rounded-full theme-swatch-secondary" />
        <span className="h-2 w-2 rounded-full theme-swatch-tertiary" />
        RAG · {t("landing.proof2")} · {t("landing.proof1")}
      </div>
    </div>
  );
}
