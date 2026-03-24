/**
 * child/levels/worldConfig.ts
 * ══════════════════════════════════════════════════════
 * Thematic World Configuration — visual identity for each realm.
 *
 * Each world defines:
 *  • Gradient layers (base + radial glow)
 *  • Accent particle colors (max 3)
 *  • Text & UI colors
 *  • Icon style & atmosphere
 *  • Tile gradient palettes
 *
 * Mapped by world ID from colorMagicEngine.WORLDS.
 * ══════════════════════════════════════════════════════
 */

export interface WorldTheme {
  id: number;
  name: string;
  emoji: string;
  tagline: string;
  /** Layer 1 — full-screen base gradient */
  baseGradient: string;
  /** Layer 2 — radial glow accent */
  radialGlow: string;
  /** Layer 3 — up to 3 floating accent particle colors */
  particleColors: [string, string, string];
  /** Primary text color for headings */
  headingColor: string;
  /** Secondary text color for body */
  bodyColor: string;
  /** Accent color for progress bars, badges */
  accentColor: string;
  /** Glow color for progress tip */
  glowColor: string;
  /** Tile gradients — [available, completed, boss] */
  tileGradients: {
    available: string;
    completed: string;
    boss: string;
    locked: string;
  };
  /** Star color (filled) */
  starColor: string;
  /** Golden ring color for completed tiles */
  ringColor: string;
  /** Progress bar gradient */
  progressGradient: string;
  /** Badge background */
  badgeBg: string;
  /** Level node palette — world-specific node look */
  nodeColors: {
    /** Gradient for available nodes */
    available: string;
    /** Gradient for completed nodes */
    completed: string;
    /** Gradient for boss nodes */
    boss: string;
    /** Node border when available */
    border: string;
    /** Faint connector path color */
    path: string;
    /** Text color on node */
    text: string;
    /** Completed glow shadow color */
    completedGlow: string;
  };
  /** Snake body visual theme (thick road-like body, 3 layers) */
  snakePath: {
    /** Layer 1 — dark underbody / shadow (widest) */
    shadow: string;
    /** Layer 2 — main body fill color */
    body: string;
    /** Layer 3 — lighter belly stripe overlay */
    belly: string;
    /** Completed progress tint color */
    progressTint: string;
    /** Body thickness in px (main layer) */
    thickness: number;
    /** Whether to use rainbow gradient for body — null = solid */
    gradientId: string | null;
  };
}

export const WORLD_THEMES: Record<number, WorldTheme> = {
  /* ═══ World 0: Color Garden (1–150) ═══ */
  0: {
    id: 0,
    name: 'Color Garden',
    emoji: '🌸',
    tagline: 'Where colors bloom and grow',
    baseGradient: 'linear-gradient(135deg, #ffd6f5, #ffb3ec)',
    radialGlow: 'radial-gradient(ellipse 70% 50% at 30% 40%, rgba(244,114,182,0.22), transparent 70%)',
    particleColors: ['#f9a8d4', '#c4b5fd', '#a7f3d0'],
    headingColor: '#4a3dff',
    bodyColor: '#6f75ff',
    accentColor: '#5b3fff',
    glowColor: 'rgba(255,120,220,0.5)',
    tileGradients: {
      available: 'linear-gradient(145deg, #f0e6ff 0%, #e8d5ff 50%, #ddd6fe 100%)',
      completed: 'linear-gradient(145deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
      boss: 'linear-gradient(145deg, #fecdd3 0%, #fda4af 50%, #f472b6 100%)',
      locked: 'linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)',
    },
    starColor: '#fbbf24',
    ringColor: '#fbbf24',
    progressGradient: 'linear-gradient(90deg, #ff7bd8, #ff4ecd)',
    badgeBg: 'rgba(91,63,255,0.10)',
    nodeColors: {
      available: 'linear-gradient(135deg, #c4b5fd, #a78bfa)',
      completed: 'linear-gradient(135deg, #fde68a, #fbbf24)',
      boss: 'linear-gradient(135deg, #f9a8d4, #f472b6)',
      border: 'rgba(167,139,250,0.4)',
      path: 'rgba(167,139,250,0.20)',
      text: '#5b3fff',
      completedGlow: 'rgba(251,191,36,0.4)',
    },
    snakePath: {
      shadow: '#3ea8c7',
      body: '#7ce8ff',
      belly: '#b8f4ff',
      progressTint: '#ff7ac6',
      thickness: 100,
      gradientId: null,
    },
  },

  /* ═══ World 1: Rainbow Hills (151–400) ═══ */
  1: {
    id: 1,
    name: 'Rainbow Hills',
    emoji: '🌈',
    tagline: 'Paint the hills with every hue',
    baseGradient: 'linear-gradient(170deg, #1e1b4b 0%, #312e81 20%, #4338ca 45%, #6366f1 70%, #818cf8 100%)',
    radialGlow: 'radial-gradient(ellipse 60% 50% at 70% 30%, rgba(129,140,248,0.20), transparent 70%)',
    particleColors: ['#818cf8', '#a78bfa', '#67e8f9'],
    headingColor: '#4a3dff',
    bodyColor: '#c7d2fe',
    accentColor: '#818cf8',
    glowColor: 'rgba(129,140,248,0.5)',
    tileGradients: {
      available: 'linear-gradient(145deg, rgba(99,102,241,0.20) 0%, rgba(129,140,248,0.12) 100%)',
      completed: 'linear-gradient(145deg, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.14) 100%)',
      boss: 'linear-gradient(145deg, rgba(167,139,250,0.28) 0%, rgba(139,92,246,0.18) 100%)',
      locked: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
    },
    starColor: '#fbbf24',
    ringColor: '#fbbf24',
    progressGradient: 'linear-gradient(90deg, #6366f1, #818cf8, #a5b4fc)',
    badgeBg: 'rgba(99,102,241,0.15)',
    nodeColors: {
      available: 'linear-gradient(135deg, #6c63ff, #5b3fff)',
      completed: 'linear-gradient(135deg, #fde68a, #f59e0b)',
      boss: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
      border: 'rgba(99,102,241,0.35)',
      path: 'rgba(129,140,248,0.18)',
      text: '#ffffff',
      completedGlow: 'rgba(251,191,36,0.45)',
    },
    snakePath: {
      shadow: '#4338ca',
      body: '#818cf8',
      belly: '#c7d2fe',
      progressTint: '#a78bfa',
      thickness: 100,
      gradientId: null,
    },
  },

  /* ═══ World 2: Crystal Palette (401–750) ═══ */
  2: {
    id: 2,
    name: 'Crystal Palette',
    emoji: '💎',
    tagline: 'Colors sharper than crystal light',
    baseGradient: 'linear-gradient(170deg, #042f2e 0%, #064e3b 20%, #065f46 45%, #059669 70%, #34d399 100%)',
    radialGlow: 'radial-gradient(ellipse 65% 55% at 50% 35%, rgba(52,211,153,0.16), transparent 70%)',
    particleColors: ['#34d399', '#6ee7b7', '#67e8f9'],
    headingColor: '#10b981',
    bodyColor: '#a7f3d0',
    accentColor: '#34d399',
    glowColor: 'rgba(52,211,153,0.5)',
    tileGradients: {
      available: 'linear-gradient(145deg, rgba(16,185,129,0.18) 0%, rgba(52,211,153,0.10) 100%)',
      completed: 'linear-gradient(145deg, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.14) 100%)',
      boss: 'linear-gradient(145deg, rgba(52,211,153,0.28) 0%, rgba(16,185,129,0.18) 100%)',
      locked: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
    },
    starColor: '#fbbf24',
    ringColor: '#fde68a',
    progressGradient: 'linear-gradient(90deg, #059669, #34d399, #6ee7b7)',
    badgeBg: 'rgba(16,185,129,0.15)',
    nodeColors: {
      available: 'linear-gradient(135deg, #34d399, #059669)',
      completed: 'linear-gradient(135deg, #fde68a, #f59e0b)',
      boss: 'linear-gradient(135deg, #6ee7b7, #10b981)',
      border: 'rgba(52,211,153,0.30)',
      path: 'rgba(52,211,153,0.15)',
      text: '#ffffff',
      completedGlow: 'rgba(253,224,71,0.45)',
    },
    snakePath: {
      shadow: '#1b5e20',
      body: '#2e7d32',
      belly: '#81c784',
      progressTint: '#66bb6a',
      thickness: 105,
      gradientId: null,
    },
  },

  /* ═══ World 3: Neon Sky Realm (751–900) ═══ */
  3: {
    id: 3,
    name: 'Neon Sky Realm',
    emoji: '🌌',
    tagline: 'Where neon lights meet the cosmos',
    baseGradient: 'linear-gradient(170deg, #0f0720 0%, #1e0a3e 20%, #3b0764 45%, #6b21a8 70%, #a855f7 100%)',
    radialGlow: 'radial-gradient(ellipse 55% 50% at 60% 40%, rgba(168,85,247,0.22), transparent 70%)',
    particleColors: ['#a855f7', '#e879f9', '#22d3ee'],
    headingColor: '#a855f7',
    bodyColor: '#d8b4fe',
    accentColor: '#a855f7',
    glowColor: 'rgba(168,85,247,0.5)',
    tileGradients: {
      available: 'linear-gradient(145deg, rgba(168,85,247,0.20) 0%, rgba(139,92,246,0.12) 100%)',
      completed: 'linear-gradient(145deg, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.14) 100%)',
      boss: 'linear-gradient(145deg, rgba(232,121,249,0.28) 0%, rgba(168,85,247,0.18) 100%)',
      locked: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
    },
    starColor: '#fbbf24',
    ringColor: '#e879f9',
    progressGradient: 'linear-gradient(90deg, #7c3aed, #a855f7, #d8b4fe)',
    badgeBg: 'rgba(168,85,247,0.15)',
    nodeColors: {
      available: 'linear-gradient(135deg, #a855f7, #7c3aed)',
      completed: 'linear-gradient(135deg, #e879f9, #d946ef)',
      boss: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
      border: 'rgba(168,85,247,0.35)',
      path: 'rgba(168,85,247,0.18)',
      text: '#ffffff',
      completedGlow: 'rgba(232,121,249,0.45)',
    },
    snakePath: {
      shadow: '#4c1d95',
      body: 'url(#snakeRainbowGrad)',
      belly: 'rgba(232,121,249,0.35)',
      progressTint: '#e879f9',
      thickness: 100,
      gradientId: 'snakeRainbowGrad',
    },
  },

  /* ═══ World 4: Master Kingdom (901+) ═══ */
  4: {
    id: 4,
    name: 'Master Kingdom',
    emoji: '👑',
    tagline: 'The infinite realm of color mastery',
    baseGradient: 'linear-gradient(170deg, #1c1917 0%, #292524 15%, #44403c 30%, #78350f 55%, #b45309 75%, #f59e0b 100%)',
    radialGlow: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(245,158,11,0.18), transparent 70%)',
    particleColors: ['#fbbf24', '#f59e0b', '#fb923c'],
    headingColor: '#ffb347',
    bodyColor: '#fde68a',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.5)',
    tileGradients: {
      available: 'linear-gradient(145deg, rgba(245,158,11,0.18) 0%, rgba(251,191,36,0.10) 100%)',
      completed: 'linear-gradient(145deg, rgba(251,191,36,0.28) 0%, rgba(253,224,71,0.18) 100%)',
      boss: 'linear-gradient(145deg, rgba(245,158,11,0.35) 0%, rgba(251,191,36,0.22) 100%)',
      locked: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
    },
    starColor: '#fde68a',
    ringColor: '#fbbf24',
    progressGradient: 'linear-gradient(90deg, #b45309, #f59e0b, #fbbf24)',
    badgeBg: 'rgba(245,158,11,0.15)',
    nodeColors: {
      available: 'linear-gradient(135deg, #f59e0b, #b45309)',
      completed: 'linear-gradient(135deg, #fbbf24, #fde68a)',
      boss: 'linear-gradient(135deg, #ffb347, #ffcc33)',
      border: 'rgba(245,158,11,0.35)',
      path: 'rgba(245,158,11,0.15)',
      text: '#ffffff',
      completedGlow: 'rgba(251,191,36,0.5)',
    },
    snakePath: {
      shadow: '#92400e',
      body: '#d97706',
      belly: '#fbbf24',
      progressTint: '#fde68a',
      thickness: 105,
      gradientId: null,
    },
  },
};

/** Safe theme lookup — fallback to world 0 */
export function getWorldTheme(worldId: number): WorldTheme {
  return WORLD_THEMES[worldId] ?? WORLD_THEMES[0];
}

/** Determine if a world has a dark base (for text contrast) */
export function isWorldDark(worldId: number): boolean {
  return worldId >= 1; // worlds 1–4 are dark-based
}
