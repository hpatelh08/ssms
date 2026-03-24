/**
 * child/milestone/AnimatedRoadSVG.tsx
 * ─────────────────────────────────────────────────────
 * Constellation Star Path — zero-lag, 60fps GPU-only animations.
 *
 * Layers (bottom to top):
 *  1. Soft cosmic glow border (subtle opacity)
 *  2. Base constellation path (starlight gradient)
 *  3. Animated star flow particles (CSS keyframe, no JS)
 *  4. Star sparkle dashes (CSS keyframe, no JS)
 *  5. Gold progress fill behind mascot (Framer for smooth fill)
 *  6. Cosmic shimmer highlight (CSS keyframe, no JS)
 *
 * All animations are transform/opacity-only or stroke-dashoffset (GPU composited).
 */

import React, { useMemo, memo } from 'react';
import type { NodePos } from './WorldThemeManager';
import { WORLD_THEMES, MAP_HEIGHT } from './WorldThemeManager';

interface Props {
  points: NodePos[];
  /** 0→1 progress (completedCount / 50). */
  progress: number;
  /** Node index where the mascot currently sits (fill ends exactly here). */
  mascotNodeIdx?: number;
  /** Glide duration in ms — syncs gold fill transition with mascot movement. */
  glideDurationMs?: number;
}

/* ── Smooth cubic bezier path builder ─────────── */
export function buildPathD(pts: NodePos[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const midY = (p.y + c.y) / 2;
    d += ` C ${p.x},${midY} ${c.x},${midY} ${c.x},${c.y}`;
  }
  return d;
}

/**
 * Compute cumulative arc-length fractions for each node along the bezier path.
 * Returns array of length pts.length, where [0]=0 and [last]≈1.
 * Uses subdivision sampling for accurate bezier segment lengths.
 */
function computeNodeFractions(pts: NodePos[]): number[] {
  if (pts.length < 2) return pts.map(() => 0);
  const cumLengths = [0];
  let cumulative = 0;

  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const midY = (p.y + c.y) / 2;
    // Cubic bezier: P0=(p.x,p.y) P1=(p.x,midY) P2=(c.x,midY) P3=(c.x,c.y)
    const SAMPLES = 20;
    let segLen = 0;
    let px = p.x, py = p.y;
    for (let s = 1; s <= SAMPLES; s++) {
      const t = s / SAMPLES;
      const it = 1 - t;
      const x = it * it * it * p.x + 3 * it * it * t * p.x + 3 * it * t * t * c.x + t * t * t * c.x;
      const y = it * it * it * p.y + 3 * it * it * t * midY + 3 * it * t * t * midY + t * t * t * c.y;
      segLen += Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      px = x;
      py = y;
    }
    cumulative += segLen;
    cumLengths.push(cumulative);
  }

  const total = cumulative;
  return cumLengths.map(l => (total > 0 ? l / total : 0));
}

/* CSS for star flow animations (injected once) */
const waterCSS = `
  .water-flow-ripple {
    animation: road-march 3s linear infinite;
  }
  .water-sparkle-dash {
    animation: road-march 2s linear infinite;
  }
  .water-shimmer {
    animation: road-shimmer-slide 5s linear infinite;
  }
`;

/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */

const PATH_LEN = 1000;

/* Must match MascotWalker GLIDE_EASE for perfect sync */
const GLIDE_EASE = [0.22, 1, 0.36, 1] as const;

const AnimatedRoadSVG: React.FC<Props> = ({ points, progress, mascotNodeIdx, glideDurationMs = 0 }) => {
  const pathD = useMemo(() => buildPathD(points), [points]);
  const nodeFractions = useMemo(() => computeNodeFractions(points), [points]);
  const fillProgress =
    mascotNodeIdx != null && nodeFractions[mascotNodeIdx] != null
      ? nodeFractions[mascotNodeIdx]
      : progress;
  const dashOffset = Math.max(0, PATH_LEN - fillProgress * PATH_LEN);
  /* Duration synced with fox mascot — both use GLIDE_EASE */
  const fillDuration = glideDurationMs > 0 ? Math.max(0.4, glideDurationMs / 1000) : 0.5;

  /* Per-world road gradient stops */
  const stops = useMemo(
    () =>
      WORLD_THEMES.map((t, i) => ({
        offset: `${(i / 4) * 100}%`,
        color: t.roadColor,
      })),
    [],
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: waterCSS }} />
      <svg
        className="absolute inset-0 w-full pointer-events-none"
        style={{ height: MAP_HEIGHT }}
        viewBox={`0 0 100 ${MAP_HEIGHT}`}
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          {/* Constellation starlight gradient */}
          <linearGradient id="water-base" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="35%" stopColor="#a78bfa" />
            <stop offset="65%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>

          {/* Cosmic glow border gradient */}
          <linearGradient id="water-bank" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
          </linearGradient>

          {/* Shimmer gradient */}
          <linearGradient id="road-shimmer" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="white" stopOpacity="0" />
            <stop offset="40%"  stopColor="white" stopOpacity="0.5" />
            <stop offset="60%"  stopColor="white" stopOpacity="0.5" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ── 1. Cosmic glow border ── */}
        <path
          d={pathD}
          stroke="url(#water-bank)"
          strokeWidth={40}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.5}
        />

        {/* ── 2. Base constellation path (starlight) ── */}
        <path
          d={pathD}
          stroke="url(#water-base)"
          strokeWidth={34}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* ── 3. Star flow particles (CSS-animated) ── */}
        <path
          className="water-flow-ripple"
          d={pathD}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={3}
          strokeDasharray="8 16"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pathLength={PATH_LEN}
        />

        {/* ── 4. Star sparkle dashes (CSS-animated) ── */}
        <path
          className="water-sparkle-dash"
          d={pathD}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1.5}
          strokeDasharray="3 20"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pathLength={PATH_LEN}
        />

        {/* ── 5. Cosmic shimmer highlight (CSS-animated) ── */}
        {progress > 0 && (
          <path
            className="water-shimmer"
            d={pathD}
            stroke="url(#road-shimmer)"
            strokeWidth={16}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pathLength={PATH_LEN}
            strokeDasharray={`${PATH_LEN * 0.06} ${PATH_LEN * 0.94}`}
            opacity={0.5}
          />
        )}
      </svg>
    </>
  );
};

export default memo(AnimatedRoadSVG);
