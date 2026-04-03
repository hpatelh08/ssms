/**
 * parent/analytics/parentTheme.ts
 * Shared water-themed design tokens for the parent dashboard.
 */

export const colors = {
  primary: '#1d8cb4',
  primaryLight: '#42b7d4',
  primaryMuted: '#7bcfdf',
  primaryBg: '#eaf8fd',

  background: '#f3fcff',
  surface: '#ffffff',
  surfaceAlt: '#f6feff',

  textPrimary: '#0f5f7d',
  textSecondary: '#4f8ea6',
  textMuted: '#8aafbc',
  textOnPrimary: '#ffffff',

  success: '#18a88a',
  successLight: '#e3fbf4',
  warning: '#e6a24a',
  warningLight: '#fff4df',
  danger: '#e67d74',
  dangerLight: '#ffe7e3',
  info: '#2fa8d2',
  infoLight: '#e5f7fe',

  border: '#d7edf4',
  borderLight: '#edf9fc',
  divider: '#d8edf4',

  chart: {
    indigo: '#1d8cb4',
    blue: '#3aaad3',
    cyan: '#59c8d9',
    emerald: '#27b59a',
    amber: '#e6b25c',
    rose: '#ef9f92',
    purple: '#68b5cf',
    slate: '#7ca7b5',
  },
} as const;

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(69, 149, 177, 0.06)',
  card: '0 10px 30px rgba(79, 154, 182, 0.08), 0 2px 8px rgba(79, 154, 182, 0.04)',
  md: '0 12px 28px rgba(69, 149, 177, 0.1), 0 4px 10px rgba(69, 149, 177, 0.05)',
  lg: '0 18px 40px rgba(69, 149, 177, 0.12), 0 8px 14px rgba(69, 149, 177, 0.06)',
  xl: '0 24px 52px rgba(69, 149, 177, 0.14), 0 10px 18px rgba(69, 149, 177, 0.07)',
} as const;

export const font = {
  xs: { size: '11px', weight: 500, lineHeight: '16px' },
  sm: { size: '13px', weight: 500, lineHeight: '20px' },
  base: { size: '14px', weight: 500, lineHeight: '22px' },
  md: { size: '16px', weight: 600, lineHeight: '24px' },
  lg: { size: '20px', weight: 700, lineHeight: '28px' },
  xl: { size: '24px', weight: 700, lineHeight: '32px' },
  '2xl': { size: '32px', weight: 800, lineHeight: '40px' },
  metric: { size: '28px', weight: 800, lineHeight: '34px' },
} as const;

export const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(246,254,255,0.98) 100%)',
  borderRadius: radius.lg,
  padding: space[6],
  boxShadow: shadows.card,
  border: `1px solid ${colors.borderLight}`,
};

export const transition = {
  fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  base: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  spring: { type: 'spring' as const, stiffness: 260, damping: 28 },
} as const;

export const grid = {
  cols12: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: space[5],
  },
} as const;
