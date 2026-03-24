/**
 * child/milestone/WorldThemeManager.ts
 * ─────────────────────────────────────────────────────
 * Space / Galaxy theme system with RICH layered decor.
 *
 * Each world (galaxy sector) has:
 *  • Full-viewport CSS gradient background (deep space tones)
 *  • Constellation path color + glow
 *  • Background layer decor (distant stars & nebulae)
 *  • Mid layer decor (planets, satellites, space objects)
 *  • Edge decor (asteroids, space debris near path edges)
 *  • Ambient particle emoji (star dust)
 *  • Sector banner styling
 */

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

export interface DecoItem {
  emoji: string;
  /** 0-100% from left */
  xPct: number;
  /** Offset from world top in px */
  yOffset: number;
  /** Scale multiplier */
  scale: number;
  /** Float animation amplitude in px */
  floatAmp: number;
  /** Layer: bg = slow parallax, mid = normal, edge = near road sides */
  layer: 'bg' | 'mid' | 'edge';
  /** Opacity 0-1 */
  opacity: number;
  /** Animation speed multiplier */
  speed: number;
}

export interface WorldTheme {
  id: string;
  /** CSS gradient string for the full-height world slice */
  bgGradient: string;
  /** Road fill color (hex) */
  roadColor: string;
  /** Road glow (rgba) */
  roadGlow: string;
  /** Locked road color */
  roadLocked: string;
  /** Layered decorations */
  decos: DecoItem[];
  /** Floating ambient particle emoji */
  particleEmoji: string;
  /** Number of ambient particles per world */
  particleCount: number;
  /** Banner ribbon gradient (Tailwind classes) */
  bannerGradient: string;
  /** Text color class for world name */
  bannerTextColor: string;
}

/* ═══════════════════════════════════════════════════
   DECO GENERATOR — creates RICH layered decor per world
   ═══════════════════════════════════════════════════ */

function makeDecos(
  bgEmojis: string[],
  midEmojis: string[],
  edgeEmojis: string[],
): DecoItem[] {
  const items: DecoItem[] = [];

  // Background layer — large, slow, low opacity, spread wide (MORE items)
  bgEmojis.forEach((emoji, i) => {
    const count = 5;
    for (let j = 0; j < count; j++) {
      const idx = i * count + j;
      items.push({
        emoji,
        xPct: 2 + ((idx * 37 + 7) % 96),
        yOffset: 60 + ((idx * 173 + 31) % 1200),
        scale: 1.1 + (idx % 4) * 0.35,
        floatAmp: 3 + (idx % 3) * 2,
        layer: 'bg',
        opacity: 0.09 + (idx % 4) * 0.025,
        speed: 0.5 + (idx % 3) * 0.12,
      });
    }
  });

  // Mid layer — medium size, themed, visible (MORE items, fills blank areas)
  midEmojis.forEach((emoji, i) => {
    const count = 5;
    for (let j = 0; j < count; j++) {
      const idx = i * count + j;
      items.push({
        emoji,
        xPct: 1 + ((idx * 23 + 11) % 98),
        yOffset: 60 + ((idx * 147 + 53) % 1200),
        scale: 0.85 + (idx % 4) * 0.2,
        floatAmp: 4 + (idx % 5) * 3,
        layer: 'mid',
        opacity: 0.16 + (idx % 4) * 0.04,
        speed: 0.7 + (idx % 3) * 0.2,
      });
    }
  });

  // Edge layer — positioned near left/right edges (MORE items filling gaps)
  edgeEmojis.forEach((emoji, i) => {
    const count = 4;
    for (let j = 0; j < count; j++) {
      const idx = i * count + j;
      const isLeft = idx % 2 === 0;
      items.push({
        emoji,
        xPct: isLeft ? 1 + (idx * 3) % 14 : 86 + (idx * 4) % 13,
        yOffset: 40 + ((idx * 191 + 67) % 1200),
        scale: 0.95 + (idx % 3) * 0.3,
        floatAmp: 2 + (idx % 3) * 2,
        layer: 'edge',
        opacity: 0.20 + (idx % 3) * 0.05,
        speed: 0.5 + (idx % 2) * 0.3,
      });
    }
  });

  return items;
}

/* ═══════════════════════════════════════════════════
   THEMES
   ═══════════════════════════════════════════════════ */

export const WORLD_THEMES: WorldTheme[] = [
  /* ── W1: Star Nursery (Alphabet) ─────────────── */
  {
    id: 'w1',
    bgGradient: 'linear-gradient(180deg, #0f0a2e 0%, #1a1145 25%, #1e1550 60%, #120d35 100%)',
    roadColor: '#67e8f9',
    roadGlow: 'rgba(103,232,249,0.5)',
    roadLocked: '#374151',
    decos: makeDecos(
      /* bg  */ ['🌌', '✨', '💫'],
      /* mid */ ['🛸', '🌠', '⭐', '🪐', '💫', '🌟'],
      /* edge*/ ['☄️', '🌑', '✨', '🔭', '⭐'],
    ),
    particleEmoji: '✨',
    particleCount: 8,
    bannerGradient: 'from-cyan-400 to-sky-500',
    bannerTextColor: 'text-cyan-900',
  },
  /* ── W2: Asteroid Belt (Numbers) ─────────────── */
  {
    id: 'w2',
    bgGradient: 'linear-gradient(180deg, #1a0f30 0%, #251545 25%, #1c1040 60%, #150c30 100%)',
    roadColor: '#f59e0b',
    roadGlow: 'rgba(245,158,11,0.5)',
    roadLocked: '#374151',
    decos: makeDecos(
      /* bg  */ ['🌑', '🪨', '💫'],
      /* mid */ ['☄️', '🛰️', '🪐', '🔢', '🌠', '⭐'],
      /* edge*/ ['🌑', '🪨', '🛸', '💎', '☄️'],
    ),
    particleEmoji: '💫',
    particleCount: 6,
    bannerGradient: 'from-amber-400 to-orange-500',
    bannerTextColor: 'text-amber-900',
  },
  /* ── W3: Saturn's Library (Stories) ──────────── */
  {
    id: 'w3',
    bgGradient: 'linear-gradient(180deg, #180e38 0%, #221550 25%, #2a1a5a 60%, #160c30 100%)',
    roadColor: '#a78bfa',
    roadGlow: 'rgba(167,139,250,0.5)',
    roadLocked: '#4b5563',
    decos: makeDecos(
      /* bg  */ ['🌌', '🌙', '🪐'],
      /* mid */ ['📖', '🛸', '🌟', '🔮', '📚', '💜'],
      /* edge*/ ['🌠', '✨', '🌙', '🔭', '⭐'],
    ),
    particleEmoji: '🌟',
    particleCount: 7,
    bannerGradient: 'from-violet-400 to-purple-600',
    bannerTextColor: 'text-violet-900',
  },
  /* ── W4: Nebula Lab (Science) ────────────────── */
  {
    id: 'w4',
    bgGradient: 'linear-gradient(180deg, #0c0820 0%, #16103a 25%, #1a1445 60%, #0e0a28 100%)',
    roadColor: '#22d3ee',
    roadGlow: 'rgba(34,211,238,0.5)',
    roadLocked: '#4b5563',
    decos: makeDecos(
      /* bg  */ ['🌌', '🔬', '💎'],
      /* mid */ ['🛰️', '🧪', '🌠', '🔭', '🧲', '⚡'],
      /* edge*/ ['🪐', '☄️', '🌑', '⭐', '🛸'],
    ),
    particleEmoji: '⚡',
    particleCount: 8,
    bannerGradient: 'from-cyan-400 to-teal-500',
    bannerTextColor: 'text-cyan-900',
  },
  /* ── W5: Galactic Core (Champion) ────────────── */
  {
    id: 'w5',
    bgGradient: 'linear-gradient(180deg, #0a0618 0%, #1a1040 25%, #2d1b6b 60%, #0a0618 100%)',
    roadColor: '#fbbf24',
    roadGlow: 'rgba(251,191,36,0.6)',
    roadLocked: '#374151',
    decos: makeDecos(
      /* bg  */ ['🌌', '🌟', '💫'],
      /* mid */ ['👑', '🏆', '🚀', '🛸', '🌠', '⭐'],
      /* edge*/ ['💎', '✨', '🪐', '☄️', '🛰️'],
    ),
    particleEmoji: '⭐',
    particleCount: 10,
    bannerGradient: 'from-yellow-400 to-amber-500',
    bannerTextColor: 'text-yellow-900',
  },
];

/** Get theme by world id. */
export function getTheme(worldId: string): WorldTheme {
  return WORLD_THEMES.find(t => t.id === worldId) ?? WORLD_THEMES[0];
}

/* ═══════════════════════════════════════════════════
   LAYOUT CONSTANTS
   ═══════════════════════════════════════════════════ */

/** Row height between two consecutive level nodes (px). */
export const ROW_H = 130;

/** Height reserved for one world banner. */
export const BANNER_H = 80;

/** Gap between worlds. */
export const WORLD_GAP = 60;

/** Top padding above entire map — keeps first node 140px below header. */
export const MAP_TOP = 140;

/** Height of the entire map in px. */
export const MAP_HEIGHT =
  MAP_TOP + 5 * (BANNER_H + 10 * ROW_H + WORLD_GAP) - WORLD_GAP + 100;

/**
 * WIDER zigzag x-positions (% of container width) for 10 levels within a world.
 * Creates a FULL-WIDTH S-curve: center→far right→far right→right→center→far left→far left→left→center→right
 * NO empty gradient areas — road reaches edges.
 */
export const ZIG_X = [50, 82, 90, 76, 50, 24, 10, 24, 50, 72];

/* ═══════════════════════════════════════════════════
   POSITION CALCULATION
   ═══════════════════════════════════════════════════ */

export interface NodePos {
  x: number; // 0-100 %
  y: number; // px from top
}

export function computeAllPositions(): {
  positions: NodePos[];
  worldYStarts: number[];
} {
  const positions: NodePos[] = [];
  const worldYStarts: number[] = [];
  let y = MAP_TOP;

  for (let w = 0; w < 5; w++) {
    worldYStarts.push(y);
    y += BANNER_H;
    for (let l = 0; l < 10; l++) {
      positions.push({ x: ZIG_X[l], y });
      y += ROW_H;
    }
    y += WORLD_GAP;
  }

  return { positions, worldYStarts };
}
