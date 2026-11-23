export type AppearanceMode = "light" | "dark" | "system";

export type AccentPresetId =
  | "teal"
  | "blue"
  | "indigo"
  | "violet"
  | "rose"
  | "amber"
  | "emerald"
  | "slate";

export type ThemeColorSlot = "primary" | "secondary" | "tertiary";

export type ThemeColors = {
  primary: string;
  secondary: string;
  tertiary: string;
};

export type ThemePrefs = {
  appearance: AppearanceMode;
  accentId: AccentPresetId | "custom";
  /** @deprecated kept for migration from older prefs */
  customHex?: string;
  customColors: ThemeColors;
};

export const THEME_PREFS_KEY = "akb-theme-prefs";

export const THEME_PRESETS: Record<
  AccentPresetId,
  { colors: ThemeColors; labelKey: string }
> = {
  // primary (actions) · secondary (brighter glow) · tertiary (deep)
  teal: {
    labelKey: "settings.accent_teal",
    colors: { primary: "#0d9488", secondary: "#2dd4bf", tertiary: "#115e59" },
  },
  blue: {
    labelKey: "settings.accent_blue",
    colors: { primary: "#2563eb", secondary: "#38bdf8", tertiary: "#1e3a8a" },
  },
  indigo: {
    labelKey: "settings.accent_indigo",
    colors: { primary: "#4f46e5", secondary: "#818cf8", tertiary: "#312e81" },
  },
  violet: {
    labelKey: "settings.accent_violet",
    colors: { primary: "#7c3aed", secondary: "#c084fc", tertiary: "#581c87" },
  },
  rose: {
    labelKey: "settings.accent_rose",
    colors: { primary: "#e11d48", secondary: "#fb7185", tertiary: "#9f1239" },
  },
  amber: {
    labelKey: "settings.accent_amber",
    colors: { primary: "#d97706", secondary: "#fbbf24", tertiary: "#92400e" },
  },
  emerald: {
    labelKey: "settings.accent_emerald",
    colors: { primary: "#059669", secondary: "#34d399", tertiary: "#064e3b" },
  },
  slate: {
    labelKey: "settings.accent_slate",
    colors: { primary: "#64748b", secondary: "#94a3b8", tertiary: "#1e293b" },
  },
};

/** @deprecated use THEME_PRESETS */
export const ACCENT_PRESETS = Object.fromEntries(
  Object.entries(THEME_PRESETS).map(([id, p]) => [
    id,
    { hex: p.colors.primary, labelKey: p.labelKey },
  ]),
) as Record<AccentPresetId, { hex: string; labelKey: string }>;

export const DEFAULT_COLORS: ThemeColors = THEME_PRESETS.teal.colors;

export const DEFAULT_THEME_PREFS: ThemePrefs = {
  appearance: "system",
  accentId: "teal",
  customColors: { ...DEFAULT_COLORS },
};

const LIGHTNESS: Record<string, number> = {
  "50": 97,
  "100": 94,
  "200": 86,
  "300": 76,
  "400": 64,
  "500": 53,
  "600": 45,
  "700": 37,
  "800": 29,
  "900": 22,
  "950": 12,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
      break;
    case gn:
      h = ((bn - rn) / d + 2) / 6;
      break;
    default:
      h = ((rn - gn) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number) {
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function normalizeHex(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function normalizeColors(colors: Partial<ThemeColors> | undefined): ThemeColors {
  return {
    primary:
      normalizeHex(colors?.primary || "") || DEFAULT_COLORS.primary,
    secondary:
      normalizeHex(colors?.secondary || "") || DEFAULT_COLORS.secondary,
    tertiary:
      normalizeHex(colors?.tertiary || "") || DEFAULT_COLORS.tertiary,
  };
}

export function resolveThemeColors(prefs: ThemePrefs): ThemeColors {
  if (prefs.accentId === "custom") {
    return normalizeColors(prefs.customColors);
  }
  return THEME_PRESETS[prefs.accentId]?.colors || DEFAULT_COLORS;
}

/** Primary color — used for accent scale / buttons. */
export function resolveAccentHex(prefs: ThemePrefs): string {
  return resolveThemeColors(prefs).primary;
}

export function buildAccentScale(baseHex: string): Record<string, string> {
  const rgb = hexToRgb(baseHex) || hexToRgb(DEFAULT_COLORS.primary)!;
  const { h, s } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const sat = clamp(s, 35, 85);
  const scale: Record<string, string> = {};
  for (const [step, light] of Object.entries(LIGHTNESS)) {
    const stepSat =
      step === "50" || step === "100"
        ? clamp(sat * 0.55, 20, 60)
        : step === "950"
          ? clamp(sat * 0.85, 30, 70)
          : sat;
    scale[step] = hslToHex(h, stepSat, light);
  }
  return scale;
}

export function applyThemeToDocument(colors: ThemeColors) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const normalized = normalizeColors(colors);
  const scale = buildAccentScale(normalized.primary);
  for (const [step, value] of Object.entries(scale)) {
    root.style.setProperty(`--accent-${step}`, value);
  }
  root.style.setProperty("--theme-primary", normalized.primary);
  root.style.setProperty("--theme-secondary", normalized.secondary);
  root.style.setProperty("--theme-tertiary", normalized.tertiary);
  root.style.setProperty("--panel-from", normalized.tertiary);
  root.style.setProperty("--panel-to", normalized.secondary);
  root.style.setProperty(
    "--canvas-glow",
    `color-mix(in srgb, ${normalized.secondary} 16%, transparent)`,
  );
}

/** @deprecated use applyThemeToDocument */
export function applyAccentToDocument(baseHex: string) {
  applyThemeToDocument({
    primary: baseHex,
    secondary: baseHex,
    tertiary: baseHex,
  });
}

export function readThemePrefs(): ThemePrefs {
  if (typeof window === "undefined") return DEFAULT_THEME_PREFS;
  try {
    const raw = window.localStorage.getItem(THEME_PREFS_KEY);
    if (!raw) return DEFAULT_THEME_PREFS;
    const parsed = JSON.parse(raw) as Partial<ThemePrefs> & {
      customHex?: string;
    };
    const accentId =
      parsed.accentId === "custom" ||
      (parsed.accentId && parsed.accentId in THEME_PRESETS)
        ? parsed.accentId
        : DEFAULT_THEME_PREFS.accentId;
    const appearance: AppearanceMode =
      parsed.appearance === "light" ||
      parsed.appearance === "dark" ||
      parsed.appearance === "system"
        ? parsed.appearance
        : DEFAULT_THEME_PREFS.appearance;

    const migratedPrimary =
      normalizeHex(parsed.customColors?.primary || "") ||
      normalizeHex(parsed.customHex || "") ||
      DEFAULT_COLORS.primary;

    const customColors = normalizeColors({
      primary: migratedPrimary,
      secondary:
        parsed.customColors?.secondary ||
        THEME_PRESETS.teal.colors.secondary,
      tertiary:
        parsed.customColors?.tertiary || THEME_PRESETS.teal.colors.tertiary,
    });

    return {
      appearance,
      accentId,
      customColors,
    };
  } catch {
    return DEFAULT_THEME_PREFS;
  }
}

export function writeThemePrefs(prefs: ThemePrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_PREFS_KEY, JSON.stringify(prefs));
}
