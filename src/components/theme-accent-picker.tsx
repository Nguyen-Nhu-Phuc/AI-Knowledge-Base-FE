"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "@/components/icons";
import { useThemePrefs } from "@/components/theme-prefs-provider";
import {
  THEME_PRESETS,
  type AccentPresetId,
} from "@/lib/theme-prefs";
import { cn } from "@/lib/utils";

const PRESET_IDS = Object.keys(THEME_PRESETS) as AccentPresetId[];

export function ThemeAccentPicker({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const { prefs, colors, setAccentPreset } = useThemePrefs();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-accent-picker]");
      if (!el) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div data-accent-picker className={cn("relative", className)}>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-2 text-foreground transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("settings.accentColor")}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex h-5 w-5 overflow-hidden rounded-full ring-1 ring-border" aria-hidden>
          <span className="h-full w-1/3" style={{ backgroundColor: colors.primary }} />
          <span className="h-full w-1/3" style={{ backgroundColor: colors.secondary }} />
          <span className="h-full w-1/3" style={{ backgroundColor: colors.tertiary }} />
        </span>
        <span className="hidden text-xs font-medium sm:inline">{t("settings.accentColor")}</span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t("settings.accentColor")}
          className="absolute right-0 z-50 mt-2 w-[17.5rem] rounded-xl border border-border bg-surface-elevated p-2 shadow-panel"
        >
          <p className="px-1.5 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            {t("settings.accentColor")}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_IDS.map((id) => {
              const preset = THEME_PRESETS[id];
              const active = prefs.accentId === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  title={t(preset.labelKey)}
                  onClick={() => {
                    setAccentPreset(id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2 py-2 text-left transition",
                    active
                      ? "border-foreground bg-ink-100 dark:bg-ink-800"
                      : "border-transparent hover:border-border hover:bg-ink-100 dark:hover:bg-ink-800",
                  )}
                >
                  <span className="grid h-8 w-8 shrink-0 grid-cols-3 gap-px overflow-hidden rounded-md border border-border">
                    <span style={{ backgroundColor: preset.colors.primary }} />
                    <span style={{ backgroundColor: preset.colors.secondary }} />
                    <span style={{ backgroundColor: preset.colors.tertiary }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">
                    {t(preset.labelKey)}
                  </span>
                  {active ? <Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
