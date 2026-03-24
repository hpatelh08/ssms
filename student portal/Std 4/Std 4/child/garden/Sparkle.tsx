/**
 * garden/Sparkle.tsx
 * ──────────────────────────────────────────────────
 * Lightweight star-sparkle effect that appears at a specific
 * coordinate, animates scale + opacity, then auto-removes.
 *
 * Uses CSS transform & opacity only — zero blur / shadow.
 * ~4 DOM nodes per sparkle instance.
 */

import React, { useEffect, useState } from 'react';

/* ── Types ───────────────────────────────────── */

export interface SparkleData {
  id: number;
  x: number;      // px from left of parent
  y: number;      // px from top of parent
  color?: string;  // default gold
  size?: number;   // px, default 24
}

interface SparkleProps {
  sparkle: SparkleData;
  onDone: (id: number) => void;
}

/* ── Component ───────────────────────────────── */

export const Sparkle: React.FC<SparkleProps> = React.memo(({ sparkle, onDone }) => {
  const { id, x, y, color = '#fbbf24', size = 24 } = sparkle;

  useEffect(() => {
    const t = setTimeout(() => onDone(id), 700);
    return () => clearTimeout(t);
  }, [id, onDone]);

  const half = size / 2;
  const arm  = size * 0.42;

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

  const spawn = React.useCallback((x: number, y: number, color?: string, size?: number) => {
    const id = ++_sparkleId;
    setSparkles(prev => [...prev, { id, x, y, color, size }]);
  }, []);

  const remove = React.useCallback((id: number) => {
    setSparkles(prev => prev.filter(s => s.id !== id));
  }, []);

  return { sparkles, spawn, remove };
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
  animation: gardenSparklePop 0.7s ease-out forwards;
  will-change: transform, opacity;
}
`;
