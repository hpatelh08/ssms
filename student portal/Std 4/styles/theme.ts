/**
 * styles/theme.ts
 * ─────────────────────────────────────────────────────
 * Shared design tokens used by both Parent and Student dashboards.
 * Mirrors the CSS custom properties in index.css for
 * programmatic use in components.
 *
 * Single source of truth — both roles import from here.
 */

/* ── Spacing (8px grid base) ────────────────────── */

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

/* ── Border Radius ──────────────────────────────── */

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 24,
  '2xl': 32,
} as const;

/* ── Shadows ────────────────────────────────────── */

export const shadows = {
  card: '0 2px 16px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.7)',
  cardHover: '0 6px 32px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.025), inset 0 1px 0 rgba(255,255,255,0.7)',
  glass: '0 2px 20px rgba(0,0,0,0.025)',
  glow: (color: string) => `0 3px 16px ${color}`,
} as const;

/* ── Glow Colors ────────────────────────────────── */

export const glowColors = {
  blue: 'rgba(59, 130, 246, 0.25)',
  amber: 'rgba(245, 158, 11, 0.25)',
  green: 'rgba(16, 185, 129, 0.25)',
  purple: 'rgba(168, 85, 247, 0.25)',
} as const;

/* ── Font Scale ─────────────────────────────────── */

export const fontSize = {
  '2xs': '10px',
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
} as const;

/* ── Shared Tailwind Presets ────────────────────── */
/* Reusable class strings for structural parity.    */

export const tw = {
  /** Root layout wrapper — identical for parent & student */
  layoutRoot: 'min-h-screen pb-20 lg:pb-6 lg:pl-[240px] relative',

  /** Main content area — padding, z-index */
  layoutMain: 'relative z-10 p-4 lg:p-6 pt-20 lg:pt-24',

  /** Student-specific immersive main area — wider, more breathing room */
  layoutMainStudent: 'relative z-10 px-4 lg:px-6 pt-20 lg:pt-24 pb-8',

  /** Fixed top bar */
  topBar: 'fixed top-0 left-0 right-0 h-16 glass-strong z-40 px-4 lg:px-6',

  /** Navigation */
  navSidebar: 'hidden lg:flex fixed top-16 left-0 bottom-0 glass flex-col pt-6 pb-4 z-30 overflow-hidden',
  navBottom: 'fixed bottom-0 left-0 right-0 h-16 glass-strong z-40 flex items-center justify-around px-2 lg:hidden',

  /** Card presets */
  cardBase: 'card-premium rounded-3xl p-5 lg:p-7',
  cardCompact: 'card-premium rounded-3xl p-4 lg:p-5',

  /** Grid presets */
  grid3: 'grid grid-cols-1 lg:grid-cols-3 gap-5',
  grid2: 'grid grid-cols-1 lg:grid-cols-2 gap-5',
} as const;

/* ── Framer Motion Presets ──────────────────────── */

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
} as const;

export const springIn = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
};
