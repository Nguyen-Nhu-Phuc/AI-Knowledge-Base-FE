"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, RotateCcw } from "@/components/icons";
import { useThemePrefs } from "@/components/theme-prefs-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  THEME_PRESETS,
  normalizeHex,
  type AccentPresetId,
  type AppearanceMode,
  type ThemeColorSlot,
  type ThemeColors,
} from "@/lib/theme-prefs";
import { cn } from "@/lib/utils";
import { toast } from "@/components/feedback";

const APPEARANCE: AppearanceMode[] = ["light", "dark", "system"];
const SLOTS: ThemeColorSlot[] = ["primary", "secondary", "tertiary"];

function ColorTriplePreview({
  colors,
  labels,
}: {
  colors: ThemeColors;
  labels: Record<ThemeColorSlot, string>;
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border">
      {/* Use CSS vars so preview always matches applied theme tokens */}
      <div className="theme-color-preview grid h-16 grid-cols-3 gap-0.5 bg-slate-300 p-0.5 dark:bg-slate-700">
        <span className="theme-swatch-primary block h-full w-full rounded-md" />
        <span className="theme-swatch-secondary block h-full w-full rounded-md" />
        <span className="theme-swatch-tertiary block h-full w-full rounded-md" />
      </div>
      <div className="grid grid-cols-3 gap-2 bg-surface-elevated px-2 py-2 text-center text-[11px]">
        {SLOTS.map((slot) => (
          <div key={slot}>
            <p className="font-medium text-foreground">{labels[slot]}</p>
            <p className="font-mono uppercase text-muted">{colors[slot]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThemeCustomizer() {
  const { t } = useTranslation();
  const {
    prefs,
    colors,
    setAppearance,
    setAccentPreset,
    setCustomColor,
    setCustomColors,
    resetTheme,
  } = useThemePrefs();

  const [drafts, setDrafts] = useState<ThemeColors>(colors);
  const [errors, setErrors] = useState<Partial<Record<ThemeColorSlot, boolean>>>(
    {},
  );

  useEffect(() => {
    setDrafts(colors);
    setErrors({});
  }, [colors]);

  function applySlot(slot: ThemeColorSlot, raw: string, announce = true) {
    const normalized = normalizeHex(raw);
    if (!normalized) {
      setErrors((e) => ({ ...e, [slot]: true }));
      toast.error(t("settings.hexInvalid"));
      return;
    }
    setErrors((e) => ({ ...e, [slot]: false }));
    setDrafts((d) => ({ ...d, [slot]: normalized }));
    setCustomColor(slot, normalized);
    if (announce) {
      toast.success(
        t("feedback.themeSaved"),
        `${t(`settings.color_${slot}`)} ${normalized}`,
      );
    }
  }

  function onApplyAll(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Partial<Record<ThemeColorSlot, boolean>> = {};
    let ok = true;
    for (const slot of SLOTS) {
      if (!normalizeHex(drafts[slot])) {
        nextErrors[slot] = true;
        ok = false;
      }
    }
    setErrors(nextErrors);
    if (!ok) {
      toast.error(t("settings.hexInvalid"));
      return;
    }
    if (!setCustomColors(drafts)) {
      toast.error(t("settings.hexInvalid"));
      return;
    }
    toast.success(t("feedback.themeSaved"), t("settings.threeColorsApplied"));
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{t("settings.appearance")}</h3>
          <p className="mt-1 text-xs text-foreground/75">
            {t("settings.appearanceHint")}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            resetTheme();
            toast.info(t("feedback.themeResetOk"));
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("settings.resetTheme")}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {APPEARANCE.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setAppearance(mode);
              toast.success(t("feedback.themeSaved"));
            }}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition",
              prefs.appearance === mode
                ? "accent-soft border-accent-600 dark:border-accent-400"
                : "border-border bg-surface-elevated text-foreground/80 hover:text-foreground",
            )}
          >
            {t(`settings.mode_${mode}`)}
          </button>
        ))}
      </div>

      <h4 className="mt-6 text-sm font-medium">{t("settings.accentColor")}</h4>
      <p className="mt-1 text-xs text-foreground/75">{t("settings.accentHint")}</p>

      {/* Live 3-color strip — always visible */}
      <div className="mt-3">
        <ColorTriplePreview
          colors={colors}
          labels={{
            primary: t("settings.color_primary"),
            secondary: t("settings.color_secondary"),
            tertiary: t("settings.color_tertiary"),
          }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(THEME_PRESETS) as AccentPresetId[]).map((id) => {
          const preset = THEME_PRESETS[id];
          const active = prefs.accentId === id;
          return (
            <button
              key={id}
              type="button"
              title={t(preset.labelKey)}
              aria-label={t(preset.labelKey)}
              onClick={() => {
                setAccentPreset(id);
                toast.success(t("feedback.themeSaved"), t(preset.labelKey));
              }}
              className={cn(
                "overflow-hidden rounded-xl border-2 text-left transition",
                active
                  ? "border-foreground shadow-soft"
                  : "border-border hover:border-foreground/40",
              )}
            >
              <div className="grid h-11 grid-cols-3 gap-0.5 bg-border p-0.5">
                <span
                  className="rounded-md"
                  style={{ backgroundColor: preset.colors.primary }}
                />
                <span
                  className="rounded-md"
                  style={{ backgroundColor: preset.colors.secondary }}
                />
                <span
                  className="rounded-md"
                  style={{ backgroundColor: preset.colors.tertiary }}
                />
              </div>
              <div className="flex items-center justify-between gap-1 bg-surface-elevated px-2 py-1.5">
                <span className="truncate text-[11px] font-semibold">
                  {t(preset.labelKey)}
                </span>
                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>

      <form onSubmit={onApplyAll} className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-sm font-medium">{t("settings.threeColorsTitle")}</h5>
          {prefs.accentId === "custom" && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
              {t("settings.customActive")}
            </span>
          )}
        </div>
        <p className="text-xs text-muted">{t("settings.threeColorsHint")}</p>

        {/* Always 1 column on narrow screens so all 3 cards are obvious */}
        <div className="flex flex-col gap-3">
          {SLOTS.map((slot) => (
            <div
              key={slot}
              className="rounded-xl border border-border bg-surface-elevated p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-8 w-8 shrink-0 rounded-lg border border-border shadow-inner"
                  style={{
                    backgroundColor:
                      normalizeHex(drafts[slot]) || colors[slot],
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {t(`settings.color_${slot}`)}
                  </p>
                  <p className="text-[11px] text-muted">
                    {slot === "primary"
                      ? t("settings.colorRole_primary")
                      : slot === "secondary"
                        ? t("settings.colorRole_secondary")
                        : t("settings.colorRole_tertiary")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={normalizeHex(drafts[slot]) || colors[slot]}
                  onChange={(e) => {
                    setDrafts((d) => ({ ...d, [slot]: e.target.value }));
                    setErrors((er) => ({ ...er, [slot]: false }));
                    setCustomColor(slot, e.target.value);
                  }}
                  className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-surface p-1"
                  aria-label={t(`settings.color_${slot}`)}
                />
                <Input
                  value={drafts[slot]}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="#000000"
                  aria-invalid={!!errors[slot]}
                  className={cn(
                    "font-mono uppercase",
                    errors[slot] &&
                      "border-rose-500 focus-visible:ring-rose-500",
                  )}
                  onChange={(e) => {
                    setDrafts((d) => ({ ...d, [slot]: e.target.value }));
                    setErrors((er) => ({ ...er, [slot]: false }));
                  }}
                  onBlur={() => {
                    if (
                      drafts[slot].trim() &&
                      drafts[slot] !== colors[slot]
                    ) {
                      applySlot(slot, drafts[slot], true);
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button type="submit" variant="outline">
            {t("settings.applyHex")}
          </Button>
          <p className="text-[11px] text-muted">{t("settings.hexHint")}</p>
        </div>
      </form>
    </Card>
  );
}
