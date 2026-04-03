/**
 * parent/analytics/parentTheme.ts
 * ─────────────────────────────────────────────────────
 * Professional design tokens for the Parent Analytics Dashboard.
 *
 * Visual tone: Analytical, institutional, muted indigo.
 * Think Apple UI + Power BI hybrid.
 * No playful gradients. No cartoon icons.
 */

/* ── Color System ───────────────────────────────── */

export const colors = {
  primary:       '#2F6F3A',
  primaryLight:  '#3F8F3A',
  primaryMuted:  '#8FCF94',
  primaryBg:     '#ECF8E7',

  background:    '#EEF6EA',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F4FAF0',

  textPrimary:   '#1F3D2A',
  textSecondary: '#3E5F49',
  textMuted:     '#6D8A76',
  textOnPrimary: '#FFFFFF',

  success:       '#16A34A',
  successLight:  '#DCFCE7',
  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',
  danger:        '#DC2626',
  dangerLight:   '#FEE2E2',
  info:          '#2F7B68',
  infoLight:     '#E1F3EC',

  border:        '#D5E6D2',
  borderLight:   '#EAF4E7',
  divider:       '#D9EAD6',

  /* Chart palette */
  chart: {
    indigo:  '#2F6F3A',
    blue:    '#2F7B68',
    cyan:    '#4FA08C',
    emerald: '#10B981',
    amber:   '#F59E0B',
    rose:    '#F43F5E',
    purple:  '#5F8B3D',
    slate:   '#64748B',
  },
} as const;

/* ── Spacing (8px base) ─────────────────────────── */

export const space = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/* ── Radius ─────────────────────────────────────── */

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
} as const;

/* ── Shadows ────────────────────────────────────── */

export const shadows = {
  sm:   '0 1px 2px rgba(0,0,0,0.04)',
  card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  md:   '0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)',
  lg:   '0 10px 15px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.02)',
  xl:   '0 20px 25px rgba(0,0,0,0.05), 0 8px 10px rgba(0,0,0,0.02)',
} as const;

/* ── Typography ─────────────────────────────────── */

export const font = {
  xs:  { size: '11px', weight: 500, lineHeight: '16px' },
  sm:  { size: '13px', weight: 500, lineHeight: '20px' },
  base:{ size: '14px', weight: 500, lineHeight: '22px' },
  md:  { size: '16px', weight: 600, lineHeight: '24px' },
  lg:  { size: '20px', weight: 700, lineHeight: '28px' },
  xl:  { size: '24px', weight: 700, lineHeight: '32px' },
  '2xl': { size: '32px', weight: 800, lineHeight: '40px' },
  metric: { size: '28px', weight: 800, lineHeight: '34px' },
} as const;

/* ── Card Styles ────────────────────────────────── */

export const cardStyle: React.CSSProperties = {
  background: colors.surface,
  borderRadius: radius.lg,
  padding: space[6],
  boxShadow: shadows.card,
  border: `1px solid ${colors.borderLight}`,
};

/* ── Animation Tokens ───────────────────────────── */

export const transition = {
  fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  base: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  spring: { type: 'spring' as const, stiffness: 260, damping: 28 },
} as const;

/* ── Grid Helpers ───────────────────────────────── */

export const grid = {
  cols12: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: space[5],
  },
} as const;
