/**
 * garden/Sparkle.tsx
 * ──────────────────────────────────────────────────
 * Multi-type particle effects:
 *  - Star sparkle (default)
 *  - Heart burst
 *  - Leaf flutter
 *
 * Uses CSS transform & opacity only — zero blur / shadow.
 */

import React, { useEffect, useState } from 'react';

/* ── Types ───────────────────────────────────── */

export type SparkleType = 'star' | 'heart' | 'leaf';

export interface SparkleData {
  id: number;
  x: number;      // px from left of parent
  y: number;      // px from top of parent
  color?: string;  // default gold
  size?: number;   // px, default 24
  type?: SparkleType; // default star
}

interface SparkleProps {
  sparkle: SparkleData;
  onDone: (id: number) => void;
}

/* ── Component ───────────────────────────────── */

export const Sparkle: React.FC<SparkleProps> = React.memo(({ sparkle, onDone }) => {
  const { id, x, y, color = '#fbbf24', size = 24, type = 'star' } = sparkle;

  useEffect(() => {
    const t = setTimeout(() => onDone(id), 800);
    return () => clearTimeout(t);
  }, [id, onDone]);

  const half = size / 2;
  const arm  = size * 0.42;

  if (type === 'heart') {
    return (
      <span
        className="garden-sparkle-heart"
        style={{
          position: 'absolute',
          left: x - half,
          top: y - half,
          fontSize: size,
          pointerEvents: 'none',
          zIndex: 40,
          color,
          lineHeight: 1,
        }}
      >
        {'\u2764\uFE0F'}
      </span>
    );
  }

  if (type === 'leaf') {
    return (
      <span
        className="garden-sparkle-leaf"
        style={{
          position: 'absolute',
          left: x - half,
          top: y - half,
          fontSize: size * 0.8,
          pointerEvents: 'none',
          zIndex: 40,
          lineHeight: 1,
        }}
      >
        {'\uD83C\uDF43'}
      </span>
    );
  }

  return (
    <svg
      className="garden-sparkle-pop"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: 'absolute',
        left: x - half,
        top: y - half,
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      {/* 4-pointed star */}
      <path
        d={`M${half} ${half - arm} L${half + 3} ${half} L${half} ${half + arm} L${half - 3} ${half} Z`}
        fill={color}
        opacity={0.9}
      />
      <path
        d={`M${half - arm} ${half} L${half} ${half + 3} L${half + arm} ${half} L${half} ${half - 3} Z`}
        fill={color}
        opacity={0.9}
      />
      {/* centre glow dot */}
      <circle cx={half} cy={half} r={3} fill="white" opacity={0.7} />
    </svg>
  );
});

Sparkle.displayName = 'Sparkle';

/* ── Sparkle Manager Hook ─────────────────────── */

let _sparkleId = 0;

export function useSparkleManager() {
  const [sparkles, setSparkles] = useState<SparkleData[]>([]);

  const spawn = React.useCallback((x: number, y: number, color?: string, size?: number, type?: SparkleType) => {
    const id = ++_sparkleId;
    setSparkles(prev => [...prev, { id, x, y, color, size, type }]);
  }, []);

  const remove = React.useCallback((id: number) => {
    setSparkles(prev => prev.filter(s => s.id !== id));
  }, []);

  /** Spawn a burst of multiple sparkles at once */
  const burst = React.useCallback((cx: number, cy: number, count: number, color?: string) => {
    const types: SparkleType[] = ['star', 'heart', 'leaf'];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 15 + Math.random() * 20;
      const bx = cx + Math.cos(angle) * radius;
      const by = cy + Math.sin(angle) * radius;
      const sid = ++_sparkleId;
      const t = types[i % types.length];
      setSparkles(prev => [...prev, {
        id: sid, x: bx, y: by,
        color: color || ['#fbbf24', '#ec4899', '#22c55e', '#5f8b3d'][i % 4],
        size: 16 + Math.random() * 12,
        type: t,
      }]);
    }
  }, []);

  return { sparkles, spawn, remove, burst };
}

/* ── CSS (injected once) ──────────────────────── */

export const SPARKLE_CSS = `
@keyframes gardenSparklePop {
  0%   { transform: scale(0) rotate(0deg); opacity: 0; }
  40%  { transform: scale(1.4) rotate(45deg); opacity: 1; }
  70%  { transform: scale(0.8) rotate(80deg); opacity: 0.8; }
  100% { transform: scale(0) rotate(120deg); opacity: 0; }
}
.garden-sparkle-pop {
  animation: gardenSparklePop 0.8s ease-out forwards;
  will-change: transform, opacity;
}

/* Heart sparkle */
@keyframes gardenSparkleHeart {
  0%   { transform: scale(0) translateY(0); opacity: 0; }
  30%  { transform: scale(1.3) translateY(-8px); opacity: 1; }
  60%  { transform: scale(0.9) translateY(-16px); opacity: 0.8; }
  100% { transform: scale(0.4) translateY(-30px); opacity: 0; }
}
.garden-sparkle-heart {
  animation: gardenSparkleHeart 0.8s ease-out forwards;
  will-change: transform, opacity;
  display: inline-block;
}

/* Leaf sparkle */
@keyframes gardenSparkleLeaf {
  0%   { transform: scale(0) rotate(0deg) translateY(0); opacity: 0; }
  30%  { transform: scale(1.2) rotate(30deg) translateY(-5px); opacity: 1; }
  60%  { transform: scale(1) rotate(-20deg) translateY(-12px); opacity: 0.7; }
  100% { transform: scale(0.3) rotate(45deg) translateY(-25px); opacity: 0; }
}
.garden-sparkle-leaf {
  animation: gardenSparkleLeaf 0.8s ease-out forwards;
  will-change: transform, opacity;
  display: inline-block;
}
`;
