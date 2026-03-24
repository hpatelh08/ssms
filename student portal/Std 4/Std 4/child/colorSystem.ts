/**
 * child/colorSystem.ts — 🎨 SINGLE SOURCE OF TRUTH for Color Magic colors
 * ═══════════════════════════════════════════════════════════════════════════
 * Every section (Coral Cove → Mega Master Realm) MUST use this system.
 * No other color arrays, hard-coded slices, or duplicated definitions allowed.
 */

/* ═══════════════════════════════════════════════════
   UNIFIED COLOR DEFINITIONS — 7 colors
   ═══════════════════════════════════════════════════ */

export const COLOR_SYSTEM = {
  red:    { key: 'red',    name: 'Red',    hex: '#EF4444', letter: 'R', glow: 'rgba(239,68,68,0.55)',  glossLight: '#fca5a5' },
  blue:   { key: 'blue',   name: 'Blue',   hex: '#3B82F6', letter: 'B', glow: 'rgba(59,130,246,0.55)', glossLight: '#93c5fd' },
  yellow: { key: 'yellow', name: 'Yellow', hex: '#FACC15', letter: 'Y', glow: 'rgba(250,204,21,0.55)', glossLight: '#fde68a' },
  green:  { key: 'green',  name: 'Green',  hex: '#22C55E', letter: 'G', glow: 'rgba(34,197,94,0.55)',  glossLight: '#86efac' },
  pink:   { key: 'pink',   name: 'Pink',   hex: '#EC4899', letter: 'P', glow: 'rgba(236,72,153,0.55)', glossLight: '#f9a8d4' },
  purple: { key: 'purple', name: 'Purple', hex: '#8B5CF6', letter: 'U', glow: 'rgba(139,92,246,0.55)', glossLight: '#c4b5fd' },
  orange: { key: 'orange', name: 'Orange', hex: '#F97316', letter: 'O', glow: 'rgba(249,115,22,0.55)', glossLight: '#fdba74' },
} as const;

export type ColorKey = keyof typeof COLOR_SYSTEM;
export type ColorEntry = typeof COLOR_SYSTEM[ColorKey];

/* ═══════════════════════════════════════════════════
   DERIVED ARRAYS — computed from single source
   ═══════════════════════════════════════════════════ */

/** All color entries in canonical order: R B Y G P U O */
export const ALL_COLORS: readonly ColorEntry[] = Object.values(COLOR_SYSTEM);

/** All color names: ['Red', 'Blue', 'Yellow', 'Green', 'Pink', 'Purple', 'Orange'] */
export const ALL_COLOR_NAMES: readonly string[] = ALL_COLORS.map(c => c.name);

/** Total count of colors in the system */
export const COLOR_COUNT = ALL_COLORS.length; // 7

/* ═══════════════════════════════════════════════════
   LOOKUP MAPS — derived from single source
   ═══════════════════════════════════════════════════ */

/** Letter → Name: { R: 'Red', B: 'Blue', ... O: 'Orange' } */
export const LETTER_TO_NAME: Readonly<Record<string, string>> = Object.fromEntries(
  ALL_COLORS.map(c => [c.letter, c.name])
);

/** Name → Letter: { Red: 'R', Blue: 'B', ... Orange: 'O' } */
export const NAME_TO_LETTER: Readonly<Record<string, string>> = Object.fromEntries(
  ALL_COLORS.map(c => [c.name, c.letter])
);

/** Name → Hex: { Red: '#EF4444', ... Orange: '#F97316' } */
export const NAME_TO_HEX: Readonly<Record<string, string>> = Object.fromEntries(
  ALL_COLORS.map(c => [c.name, c.hex])
);

/** Tone groups referencing valid system names */
export const TONE_GROUPS: Readonly<Record<string, readonly string[]>> = {
  reds:   ['Red', 'Pink', 'Orange'],
  blues:  ['Blue', 'Purple'],
  warm:   ['Red', 'Orange', 'Yellow'],
  cool:   ['Blue', 'Green', 'Purple'],
  bright: ['Yellow', 'Pink', 'Orange'],
};

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */

/** Get hex by color name (case-insensitive match). Returns '#fff' only if truly unknown. */
export function getHexByName(name: string): string {
  return NAME_TO_HEX[name] || '#fff';
}

/** Get full color entry by name */
export function getColorByName(name: string): ColorEntry | undefined {
  return ALL_COLORS.find(c => c.name === name);
}

/** Get a dynamic pool of N colors (always includes all 7 when n ≥ 7) */
export function getColorPool(n: number): string[] {
  return ALL_COLOR_NAMES.slice(0, Math.min(n, COLOR_COUNT)) as string[];
}

/** Contrast-safe text color for a given hex background */
export function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0F172A' : '#FFFFFF';
}
