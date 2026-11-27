/** Build 1–2 letter initials from a display name. */
export function getInitials(name?: string | null, fallback = "?") {
  const cleaned = (name || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return fallback;

  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length === 1) {
    const word = parts[0];
    return word.slice(0, Math.min(2, word.length)).toUpperCase();
  }

  const first = parts[0][0] || "";
  const last = parts[parts.length - 1][0] || "";
  return `${first}${last}`.toUpperCase() || fallback;
}

/** Distinct soft palettes — same seed (name/initials) always maps to the same pair. */
const AVATAR_PALETTES = [
  { bg: "#dbeafe", fg: "#1e3a8a" }, // blue
  { bg: "#dcfce7", fg: "#14532d" }, // green
  { bg: "#fce7f3", fg: "#9d174d" }, // pink
  { bg: "#ffedd5", fg: "#9a3412" }, // orange
  { bg: "#e0e7ff", fg: "#3730a3" }, // indigo
  { bg: "#fef9c3", fg: "#854d0e" }, // yellow
  { bg: "#ccfbf1", fg: "#115e59" }, // teal
  { bg: "#ede9fe", fg: "#5b21b6" }, // violet
  { bg: "#fee2e2", fg: "#991b1b" }, // red
  { bg: "#e0f2fe", fg: "#075985" }, // sky
  { bg: "#f3e8ff", fg: "#6b21a8" }, // purple
  { bg: "#ecfccb", fg: "#3f6212" }, // lime
] as const;

export type AvatarPalette = (typeof AVATAR_PALETTES)[number];

export function getAvatarPalette(seed?: string | null): AvatarPalette {
  const key = (seed || "?").trim().toUpperCase() || "?";
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}
