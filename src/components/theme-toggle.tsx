"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Moon, Sun } from "@/components/icons";
import { useThemePrefs } from "@/components/theme-prefs-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { setAppearance } = useThemePrefs();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-elevated text-foreground transition-colors hover:bg-ink-100 dark:hover:bg-ink-800",
        className,
      )}
      onClick={() => setAppearance(isDark ? "light" : "dark")}
      aria-label={t("common.toggleTheme")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
