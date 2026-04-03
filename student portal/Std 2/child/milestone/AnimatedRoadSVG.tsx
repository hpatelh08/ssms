/**
 * child/milestone/AnimatedRoadSVG.tsx
 * ─────────────────────────────────────────────────────
 * Fluid Water Path — zero-lag, 60fps GPU-only animations.
 *
 * Layers (bottom to top):
 *  1. Soft river border (subtle opacity, no blur)
 *  2. Base water road (blue gradient)
 *  3. Animated water flow ripples (CSS keyframe, no JS)
 *  4. Water sparkle dashes (CSS keyframe, no JS)
 *  5. Green progress fill behind mascot (Framer for smooth fill)
 *  6. Lightweight shimmer highlight (CSS keyframe, no JS)
 *
 * REMOVED: feGaussianBlur, pulsing outer glow, heavy sparkle particles.
 * All animations are transform/opacity-only or stroke-dashoffset (GPU composited).
 */

import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import type { NodePos } from './WorldThemeManager';
import { WORLD_THEMES, MAP_HEIGHT } from './WorldThemeManager';

interface Props {
  points: NodePos[];
  /** 0→1 progress (completedCount / 50). */
  progress: number;
  /** 0→1 mascot position along path (for per-level fill). */
  mascotProgress?: number;
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

/* CSS for water flow animations (injected once) */
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

const AnimatedRoadSVG: React.FC<Props> = ({ points, progress, mascotProgress }) => {
  const pathD = useMemo(() => buildPathD(points), [points]);
  const fillProgress = mascotProgress ?? progress;
  const dashOffset = Math.max(0, PATH_LEN - fillProgress * PATH_LEN);

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
          {/* Water blue gradient */}
          <linearGradient id="water-base" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="35%" stopColor="#7dd3fc" />
            <stop offset="65%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </linearGradient>

          {/* Water edge / bank gradient */}
          <linearGradient id="water-bank" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.15" />
          </linearGradient>

          {/* Green fill gradient */}
          <linearGradient id="road-green-fill" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>

          {/* Shimmer gradient */}
          <linearGradient id="road-shimmer" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="white" stopOpacity="0" />
            <stop offset="40%"  stopColor="white" stopOpacity="0.4" />
            <stop offset="60%"  stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ── 1. River bank / soft border ── */}
        <path
          d={pathD}
          stroke="url(#water-bank)"
          strokeWidth={40}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.5}
        />

        {/* ── 2. Base water road (soft blue) ── */}
        <path
          d={pathD}
          stroke="url(#water-base)"
          strokeWidth={34}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* ── 3. Water flow ripples (CSS-animated dashes) ── */}
        <path
          className="water-flow-ripple"
          d={pathD}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={3}
          strokeDasharray="8 16"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pathLength={PATH_LEN}
        />

        {/* ── 4. Water sparkle dashes (CSS-animated, smaller) ── */}
        <path
          className="water-sparkle-dash"
          d={pathD}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1.5}
          strokeDasharray="3 20"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pathLength={PATH_LEN}
        />

        {/* ── 5. Green progress fill (behind mascot) ── */}
        <motion.path
          d={pathD}
          stroke="url(#road-green-fill)"
          strokeWidth={32}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={PATH_LEN}
          strokeDasharray={PATH_LEN}
          initial={{ strokeDashoffset: PATH_LEN }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.4, ease: [0.25, 0.8, 0.25, 1] }}
        />

        {/* ── 6. Shimmer highlight (CSS-animated, no JS) ── */}
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
