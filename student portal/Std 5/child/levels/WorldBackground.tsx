/**
 * child/levels/WorldBackground.tsx
 * ══════════════════════════════════════════════════════
 * THEMED WORLD ATMOSPHERE ENGINE
 *
 * Layers:
 *  1. Full-screen base gradient
 *  2. Radial glow accent
 *  3. Themed floating decorations per world:
 *       World 0 (Coral)   — rising bubbles, drifting fish, swaying coral
 *       World 1 (Enchanted)— crystal sparkles, mystical orbs
 *       World 2 (Forest)  — falling leaves, birds, light rays
 *       World 3 (Cosmic)  — star sparkles, prismatic orbs
 *       World 4 (Royal)   — golden dust, royal emblems
 *  4. Depth shadow overlay at bottom
 *
 * All decorations use CSS @keyframes with transform+opacity ONLY.
 * GPU-composited. Max 12 elements per world.
 * Crossfades between worlds via AnimatePresence.
 * ══════════════════════════════════════════════════════
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWorldTheme } from './worldConfig';

/* ═══════════════════════════════════════════════════
   CSS KEYFRAME ANIMATIONS — transform + opacity ONLY
   ═══════════════════════════════════════════════════ */

const DecoKeyframes: React.FC = React.memo(() => (
  <style>{`
    @keyframes cm-rise {
      0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
      6%   { opacity: 0.45; }
      88%  { opacity: 0.18; }
      100% { transform: translateY(-112vh) translateX(22px) scale(0.45); opacity: 0; }
    }
    @keyframes cm-fall {
      0%   { transform: translateY(-30px) rotate(0deg); opacity: 0; }
      7%   { opacity: 0.5; }
      90%  { opacity: 0.1; }
      100% { transform: translateY(112vh) rotate(420deg); opacity: 0; }
    }
    @keyframes cm-drift {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.18; }
      25%  { transform: translate(22px, -14px) scale(1.04); opacity: 0.38; }
      50%  { transform: translate(38px, 5px) scale(0.96); opacity: 0.28; }
      75%  { transform: translate(14px, 16px) scale(1.02); opacity: 0.33; }
    }
    @keyframes cm-shimmer {
      0%, 100% { transform: scale(0.65); opacity: 0.08; }
      50%      { transform: scale(1.35); opacity: 0.48; }
    }
    @keyframes cm-sway {
      0%, 100% { transform: rotate(-7deg) scaleY(1); }
      50%      { transform: rotate(7deg) scaleY(1.07); }
    }
  `}</style>
));
DecoKeyframes.displayName = 'DecoKeyframes';

/* ═══════════════════════════════════════════════════
   SINGLE DECORATION ELEMENT
   ═══════════════════════════════════════════════════ */

interface DecoItem {
  emoji?: string;
  size: number;
  left: string;
  top: string;
  anim: string;
  dur: number;
  delay: number;
  color?: string;
}

const DecoEl: React.FC<DecoItem & { worldId: number; idx: number }> = React.memo(({
  emoji, size, left, top, anim, dur, delay, color, worldId, idx,
}) => (
  <div
    key={`${worldId}-d${idx}`}
    style={{
      position: 'absolute',
      left, top,
      width: size, height: size,
      borderRadius: '50%',
      background: emoji ? 'transparent' : (color ?? 'rgba(255,255,255,0.15)'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: emoji ? Math.round(size * 0.65) : 0,
      lineHeight: 1,
      pointerEvents: 'none',
      willChange: 'transform, opacity',
      animation: `${anim} ${dur}s linear infinite`,
      animationDelay: `${delay}s`,
      opacity: 0,
    }}
  >
    {emoji ?? ''}
  </div>
));
DecoEl.displayName = 'DecoEl';

/* ═══════════════════════════════════════════════════
   THEMED DECORATION CONFIGS — max 12 per world
   ═══════════════════════════════════════════════════ */

function getDecorations(worldId: number): DecoItem[] {
  switch (worldId) {

    /* ═══ World 0 — CORAL REEF ═══ */
    case 0: return [
      // Rising bubbles (7)
      { size: 8,  left: '6%',  top: '88%', anim: 'cm-rise', dur: 11,  delay: 0,   color: 'rgba(255,200,230,0.22)' },
      { size: 13, left: '18%', top: '94%', anim: 'cm-rise', dur: 14,  delay: 2.5, color: 'rgba(255,180,220,0.18)' },
      { size: 6,  left: '33%', top: '85%', anim: 'cm-rise', dur: 10,  delay: 0.8, color: 'rgba(255,220,240,0.20)' },
      { size: 10, left: '52%', top: '91%', anim: 'cm-rise', dur: 13,  delay: 3.5, color: 'rgba(255,200,230,0.16)' },
      { size: 7,  left: '72%', top: '83%', anim: 'cm-rise', dur: 9.5, delay: 0.4, color: 'rgba(255,210,235,0.19)' },
      { size: 15, left: '88%', top: '96%', anim: 'cm-rise', dur: 15,  delay: 4,   color: 'rgba(255,190,225,0.14)' },
      { size: 9,  left: '44%', top: '89%', anim: 'cm-rise', dur: 12,  delay: 2,   color: 'rgba(255,200,230,0.17)' },
      // Fish drifting (2)
      { emoji: '🐠', size: 30, left: '8%',  top: '32%', anim: 'cm-drift', dur: 20, delay: 0 },
      { emoji: '🐟', size: 24, left: '78%', top: '54%', anim: 'cm-drift', dur: 26, delay: 6 },
      // Coral plants swaying (2)
      { emoji: '🪸', size: 36, left: '2%',  top: '76%', anim: 'cm-sway', dur: 4.5, delay: 0 },
      { emoji: '🌿', size: 28, left: '94%', top: '81%', anim: 'cm-sway', dur: 5.5, delay: 1.5 },
    ];

    /* ═══ World 1 — ENCHANTED CRYSTAL DEEP ═══ */
    case 1: return [
      // Crystal sparkles (5)
      { size: 6,  left: '10%', top: '18%', anim: 'cm-shimmer', dur: 3.2, delay: 0,   color: 'rgba(127,174,101,0.30)' },
      { size: 8,  left: '35%', top: '42%', anim: 'cm-shimmer', dur: 4,   delay: 1,   color: 'rgba(167,201,127,0.25)' },
      { size: 5,  left: '60%', top: '12%', anim: 'cm-shimmer', dur: 3.5, delay: 0.5, color: 'rgba(127,174,101,0.28)' },
      { size: 7,  left: '82%', top: '58%', anim: 'cm-shimmer', dur: 4.5, delay: 2,   color: 'rgba(167,201,127,0.22)' },
      { size: 4,  left: '48%', top: '72%', anim: 'cm-shimmer', dur: 3,   delay: 1.5, color: 'rgba(127,174,101,0.26)' },
      // Mystical orbs (3)
      { size: 45, left: '20%', top: '30%', anim: 'cm-shimmer', dur: 5.5, delay: 0,   color: 'rgba(63,143,58,0.08)' },
      { size: 35, left: '65%', top: '50%', anim: 'cm-shimmer', dur: 6.5, delay: 2,   color: 'rgba(95,139,61,0.06)' },
      { size: 50, left: '85%', top: '20%', anim: 'cm-shimmer', dur: 7,   delay: 3.5, color: 'rgba(63,143,58,0.05)' },
      // Gem floating (2)
      { emoji: '💎', size: 22, left: '12%', top: '62%', anim: 'cm-drift', dur: 24, delay: 0 },
      { emoji: '🔮', size: 26, left: '75%', top: '25%', anim: 'cm-drift', dur: 28, delay: 5 },
      // Ambient sparkle (1)
      { emoji: '✨', size: 18, left: '50%', top: '80%', anim: 'cm-shimmer', dur: 3, delay: 1 },
    ];

    /* ═══ World 2 — FOREST CANOPY ═══ */
    case 2: return [
      // Falling leaves (6)
      { emoji: '🍃', size: 20, left: '8%',  top: '-2%', anim: 'cm-fall', dur: 12,  delay: 0 },
      { emoji: '🍂', size: 18, left: '24%', top: '-3%', anim: 'cm-fall', dur: 15,  delay: 3 },
      { emoji: '🍃', size: 16, left: '46%', top: '-1%', anim: 'cm-fall', dur: 11,  delay: 1.5 },
      { emoji: '🍂', size: 22, left: '66%', top: '-4%', anim: 'cm-fall', dur: 14,  delay: 5 },
      { emoji: '🍃', size: 14, left: '84%', top: '-2%', anim: 'cm-fall', dur: 13,  delay: 2 },
      { emoji: '🍃', size: 19, left: '38%', top: '-3%', anim: 'cm-fall', dur: 16,  delay: 7.5 },
      // Birds (2)
      { emoji: '🐦', size: 24, left: '12%', top: '18%', anim: 'cm-drift', dur: 22, delay: 0 },
      { emoji: '🐦', size: 20, left: '82%', top: '38%', anim: 'cm-drift', dur: 28, delay: 8 },
      // Light rays / sparkles (3)
      { size: 5, left: '22%', top: '22%', anim: 'cm-shimmer', dur: 3,   delay: 0,   color: 'rgba(255,255,200,0.30)' },
      { size: 4, left: '56%', top: '44%', anim: 'cm-shimmer', dur: 4,   delay: 1.2, color: 'rgba(255,255,180,0.25)' },
      { size: 6, left: '78%', top: '14%', anim: 'cm-shimmer', dur: 3.5, delay: 2.5, color: 'rgba(255,255,200,0.28)' },
    ];

    /* ═══ World 3 — COSMIC RAINBOW ═══ */
    case 3: return [
      // Star sparkles (6)
      { emoji: '✨', size: 18, left: '5%',  top: '14%', anim: 'cm-shimmer', dur: 3,   delay: 0 },
      { emoji: '✨', size: 14, left: '22%', top: '42%', anim: 'cm-shimmer', dur: 2.5, delay: 0.5 },
      { emoji: '✨', size: 20, left: '48%', top: '8%',  anim: 'cm-shimmer', dur: 3.5, delay: 1 },
      { emoji: '✨', size: 16, left: '68%', top: '56%', anim: 'cm-shimmer', dur: 2.8, delay: 1.5 },
      { emoji: '✨', size: 12, left: '88%', top: '22%', anim: 'cm-shimmer', dur: 3.2, delay: 2 },
      { emoji: '⭐', size: 24, left: '92%', top: '68%', anim: 'cm-shimmer', dur: 5,   delay: 0 },
      // Cosmic orbs (2)
      { emoji: '💫', size: 22, left: '10%', top: '78%', anim: 'cm-drift', dur: 20, delay: 3 },
      { emoji: '🌟', size: 20, left: '36%', top: '68%', anim: 'cm-shimmer', dur: 4,  delay: 2.5 },
      // Prismatic glows (3)
      { size: 40, left: '26%', top: '28%', anim: 'cm-shimmer', dur: 4.5, delay: 0,   color: 'rgba(122,163,68,0.10)' },
      { size: 32, left: '62%', top: '44%', anim: 'cm-shimmer', dur: 5.5, delay: 1.5, color: 'rgba(232,121,249,0.08)' },
      { size: 28, left: '82%', top: '78%', anim: 'cm-shimmer', dur: 4,   delay: 3,   color: 'rgba(34,211,238,0.09)' },
    ];

    /* ═══ World 4 — ROYAL MASTER ═══ */
    case 4: return [
      // Golden dust (8)
      { size: 5, left: '8%',  top: '18%', anim: 'cm-shimmer', dur: 3,   delay: 0,   color: 'rgba(251,191,36,0.28)' },
      { size: 4, left: '24%', top: '52%', anim: 'cm-shimmer', dur: 4,   delay: 0.8, color: 'rgba(245,158,11,0.22)' },
      { size: 6, left: '42%', top: '12%', anim: 'cm-shimmer', dur: 3.5, delay: 1.5, color: 'rgba(251,191,36,0.24)' },
      { size: 3, left: '58%', top: '62%', anim: 'cm-shimmer', dur: 2.5, delay: 2,   color: 'rgba(245,158,11,0.30)' },
      { size: 5, left: '72%', top: '32%', anim: 'cm-shimmer', dur: 4.5, delay: 0.5, color: 'rgba(251,191,36,0.20)' },
      { size: 4, left: '90%', top: '72%', anim: 'cm-shimmer', dur: 3,   delay: 3,   color: 'rgba(245,158,11,0.26)' },
      { size: 7, left: '35%', top: '82%', anim: 'cm-shimmer', dur: 5,   delay: 1,   color: 'rgba(251,191,36,0.18)' },
      { size: 5, left: '65%', top: '8%',  anim: 'cm-shimmer', dur: 3.8, delay: 4,   color: 'rgba(253,224,71,0.22)' },
      // Royal emblems (2)
      { emoji: '👑', size: 22, left: '14%', top: '28%', anim: 'cm-drift', dur: 24, delay: 0 },
      { emoji: '💎', size: 18, left: '82%', top: '48%', anim: 'cm-drift', dur: 28, delay: 5 },
      // Sparkle accent (1)
      { emoji: '✨', size: 16, left: '52%', top: '74%', anim: 'cm-shimmer', dur: 3, delay: 2.5 },
    ];

    default: return [];
  }
}

/* ═══════════════════════════════════════════════════
   MAIN — WorldBackground
   ═══════════════════════════════════════════════════ */

interface WorldBackgroundProps {
  worldId: number;
  scrollY?: number;
}

/* ═══════════════════════════════════════════════════
   PARALLAX HILL CONFIGS — 3 silhouette layers per world
   Speed ratio: far = 0.1, mid = 0.2, near = 0.3
   ═══════════════════════════════════════════════════ */

interface HillLayer {
  color: string;
  /** SVG path for the hill silhouette (viewBox 0 0 400 80) */
  d: string;
  speed: number;
  bottomOffset: number;
}

function getHillLayers(worldId: number): HillLayer[] {
  // Base shapes (used across worlds, tinted per-theme)
  const farHill  = 'M0,80 C50,28 120,10 200,32 C280,54 350,18 400,40 L400,80 Z';
  const midHill  = 'M0,80 C70,22 140,42 200,18 C260,0 340,30 400,48 L400,80 Z';
  const nearHill = 'M0,80 C30,40 100,55 180,30 C260,6 330,38 400,55 L400,80 Z';

  switch (worldId) {
    case 0: return [ // Coral — pinkish ocean layers
      { d: farHill,  color: 'rgba(255,180,220,0.10)', speed: 0.10, bottomOffset: 22 },
      { d: midHill,  color: 'rgba(255,150,200,0.14)', speed: 0.20, bottomOffset: 12 },
      { d: nearHill, color: 'rgba(255,120,180,0.18)', speed: 0.30, bottomOffset: 0 },
    ];
    case 1: return [ // Enchanted — purple crystal layers
      { d: farHill,  color: 'rgba(127,174,101,0.10)', speed: 0.10, bottomOffset: 22 },
      { d: midHill,  color: 'rgba(95,139,61,0.14)',  speed: 0.20, bottomOffset: 12 },
      { d: nearHill, color: 'rgba(63,143,58,0.18)',  speed: 0.30, bottomOffset: 0 },
    ];
    case 2: return [ // Forest — green canopy layers
      { d: farHill,  color: 'rgba(34,197,94,0.08)',   speed: 0.10, bottomOffset: 22 },
      { d: midHill,  color: 'rgba(22,163,74,0.12)',   speed: 0.20, bottomOffset: 12 },
      { d: nearHill, color: 'rgba(21,128,61,0.16)',   speed: 0.30, bottomOffset: 0 },
    ];
    case 3: return [ // Cosmic — deep purple/cyan layers
      { d: farHill,  color: 'rgba(122,163,68,0.08)',  speed: 0.10, bottomOffset: 22 },
      { d: midHill,  color: 'rgba(232,121,249,0.12)', speed: 0.20, bottomOffset: 12 },
      { d: nearHill, color: 'rgba(34,211,238,0.14)',  speed: 0.30, bottomOffset: 0 },
    ];
    case 4: return [ // Royal — golden layers
      { d: farHill,  color: 'rgba(251,191,36,0.08)',  speed: 0.10, bottomOffset: 22 },
      { d: midHill,  color: 'rgba(245,158,11,0.12)',  speed: 0.20, bottomOffset: 12 },
      { d: nearHill, color: 'rgba(253,224,71,0.14)',  speed: 0.30, bottomOffset: 0 },
    ];
    default: return [];
  }
}

export const WorldBackground: React.FC<WorldBackgroundProps> = React.memo(({ worldId, scrollY = 0 }) => {
  const theme = useMemo(() => getWorldTheme(worldId), [worldId]);
  const decos = useMemo(() => getDecorations(worldId), [worldId]);
  const hills = useMemo(() => getHillLayers(worldId), [worldId]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`bg-${worldId}`}
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          pointerEvents: 'none',
          willChange: 'opacity',
          overflow: 'hidden',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <DecoKeyframes />

        {/* Layer 1 — Base Gradient */}
        <div style={{ position: 'absolute', inset: 0, background: theme.baseGradient }} />

        {/* Layer 2 — Radial Glow Accent */}
        <div style={{ position: 'absolute', inset: 0, background: theme.radialGlow }} />

        {/* Layer 3 — Themed Floating Decorations (parallax at 0.15×) */}
        <div style={{
          position: 'absolute', inset: 0,
          transform: `translateY(${-(scrollY * 0.15)}px) translateZ(0)`,
          willChange: 'transform',
        }}>
          {decos.map((d, i) => (
            <DecoEl key={`${worldId}-d${i}`} idx={i} worldId={worldId} {...d} />
          ))}
        </div>

        {/* Layer 4 — Parallax Hill Silhouettes (3 depth layers) */}
        {hills.map((hill, i) => (
          <svg
            key={`hill-${worldId}-${i}`}
            viewBox="0 0 400 80"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: hill.bottomOffset,
              width: '100%',
              height: '18vh',
              transform: `translateY(${-(scrollY * hill.speed)}px) translateZ(0)`,
              willChange: 'transform',
              pointerEvents: 'none',
            }}
          >
            <path d={hill.d} fill={hill.color} />
          </svg>
        ))}

        {/* Layer 5 — Depth Shadow at Bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '16%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.18), transparent)',
          pointerEvents: 'none',
        }} />
      </motion.div>
    </AnimatePresence>
  );
});

WorldBackground.displayName = 'WorldBackground';
