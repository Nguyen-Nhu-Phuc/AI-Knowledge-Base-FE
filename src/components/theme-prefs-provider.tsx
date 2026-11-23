"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTheme } from "next-themes";
import {
  applyThemeToDocument,
  DEFAULT_THEME_PREFS,
  normalizeHex,
  readThemePrefs,
  resolveThemeColors,
  writeThemePrefs,
  type AccentPresetId,
  type AppearanceMode,
  type ThemeColorSlot,
  type ThemeColors,
  type ThemePrefs,
} from "@/lib/theme-prefs";

type ThemePrefsContextValue = {
  prefs: ThemePrefs;
  colors: ThemeColors;
  accentHex: string;
  setAppearance: (appearance: AppearanceMode) => void;
  setAccentPreset: (id: AccentPresetId) => void;
  setCustomColor: (slot: ThemeColorSlot, hex: string) => boolean;
  setCustomColors: (colors: ThemeColors) => boolean;
  /** @deprecated use setCustomColor('primary', hex) */
  setCustomAccent: (hex: string) => boolean;
  resetTheme: () => void;
};

const ThemePrefsContext = createContext<ThemePrefsContextValue | null>(null);

export function ThemePrefsProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const [prefs, setPrefs] = useState<ThemePrefs>(DEFAULT_THEME_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readThemePrefs();
    setPrefs(stored);
    applyThemeToDocument(resolveThemeColors(stored));
    setTheme(stored.appearance);
    setReady(true);
  }, [setTheme]);

  const commit = useCallback(
    (next: ThemePrefs) => {
      setPrefs(next);
      writeThemePrefs(next);
      applyThemeToDocument(resolveThemeColors(next));
      setTheme(next.appearance);
    },
    [setTheme],
  );

  const setAppearance = useCallback(
    (appearance: AppearanceMode) => {
      commit({ ...prefs, appearance });
    },
    [commit, prefs],
  );

  const setAccentPreset = useCallback(
    (id: AccentPresetId) => {
      commit({ ...prefs, accentId: id });
    },
    [commit, prefs],
  );

  const setCustomColor = useCallback(
    (slot: ThemeColorSlot, hex: string) => {
      const normalized = normalizeHex(hex);
      if (!normalized) return false;
      commit({
        ...prefs,
        accentId: "custom",
        customColors: { ...prefs.customColors, [slot]: normalized },
      });
      return true;
    },
    [commit, prefs],
  );

  const setCustomColors = useCallback(
    (colors: ThemeColors) => {
      const primary = normalizeHex(colors.primary);
      const secondary = normalizeHex(colors.secondary);
      const tertiary = normalizeHex(colors.tertiary);
      if (!primary || !secondary || !tertiary) return false;
      commit({
        ...prefs,
        accentId: "custom",
        customColors: { primary, secondary, tertiary },
      });
      return true;
    },
    [commit, prefs],
  );

  const setCustomAccent = useCallback(
    (hex: string) => setCustomColor("primary", hex),
    [setCustomColor],
  );

  const resetTheme = useCallback(() => {
    commit(DEFAULT_THEME_PREFS);
  }, [commit]);

  const colors = resolveThemeColors(prefs);

  const value = useMemo<ThemePrefsContextValue>(
    () => ({
      prefs,
      colors,
      accentHex: colors.primary,
      setAppearance,
      setAccentPreset,
      setCustomColor,
      setCustomColors,
      setCustomAccent,
      resetTheme,
    }),
    [
      prefs,
      colors,
      setAppearance,
      setAccentPreset,
      setCustomColor,
      setCustomColors,
      setCustomAccent,
      resetTheme,
    ],
  );

  void ready;

  return (
    <ThemePrefsContext.Provider value={value}>{children}</ThemePrefsContext.Provider>
  );
}

export function useThemePrefs() {
  const ctx = useContext(ThemePrefsContext);
  if (!ctx) {
    throw new Error("useThemePrefs must be used within ThemePrefsProvider");
  }
  return ctx;
}
