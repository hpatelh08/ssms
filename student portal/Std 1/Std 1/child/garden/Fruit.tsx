/**
 * garden/Fruit.tsx
 * ──────────────────────────────────────────────────
 * Single fruit component — positioned absolutely INSIDE
 * its parent canopy layer via anchor coordinates.
 *
 * Features:
 *  - grow-in animation (scale 0 → 1)
 *  - hover bounce
 *  - click → shake + sparkle + XP + sound
 *  - soft text-shadow glow (no filter)
 *  - remains attached — NEVER floats / falls
 *
 * Performance: CSS transform & opacity only.
 */

import React, { useState, useCallback } from 'react';

/* ── Types ───────────────────────────────────── */

export type FruitKind = 'apple' | 'orange' | 'lemon' | 'grape' | 'peach' | 'cherry';

export interface FruitData {
  id: number;
  kind: FruitKind;
  /** % from left of canopy container */
  anchorX: number;
  /** % from top of canopy container */
  anchorY: number;
  /** Which canopy layer: 0=top 1=mid 2=bottom */
  layer: number;
}

interface FruitProps {
  fruit: FruitData;
  /** Called when fruit is tapped */
  onClick: (fruit: FruitData, rect: DOMRect | null) => void;
}

/* ── Emoji map ───────────────────────────────── */

const EMOJI: Record<FruitKind, string> = {
  apple:  '\uD83C\uDF4E',
  orange: '\uD83C\uDF4A',
  lemon:  '\uD83C\uDF4B',
  grape:  '\uD83C\uDF47',
  peach:  '\uD83C\uDF51',
  cherry: '\uD83C\uDF52',
};

const FRUIT_KINDS: FruitKind[] = ['apple', 'orange', 'lemon', 'grape', 'peach', 'cherry'];

/* ── Helpers ──────────────────────────────────── */

let _fruitId = 0;

/** Create a new fruit data object for a specific canopy layer */
export function makeFruit(layer: number, anchorX: number, anchorY: number, kind?: FruitKind): FruitData {
  const id = ++_fruitId;
  return {
    id,
    kind: kind ?? FRUIT_KINDS[id % FRUIT_KINDS.length],
    anchorX,
    anchorY,
    layer,
  };
}

/* Anchor positions PER LAYER — fruits attach here */
export const CANOPY_ANCHORS: Array<Array<{ x: number; y: number }>> = [
  /* layer 0 — top canopy (small) */
  [
    { x: 38, y: 52 },
    { x: 62, y: 48 },
    { x: 50, y: 68 },
  ],
  /* layer 1 — mid canopy */
  [
    { x: 25, y: 45 },
    { x: 50, y: 55 },
    { x: 75, y: 42 },
    { x: 35, y: 68 },
    { x: 65, y: 70 },
  ],
  /* layer 2 — bottom canopy (widest) */
  [
    { x: 18, y: 40 },
    { x: 42, y: 50 },
    { x: 60, y: 38 },
    { x: 80, y: 46 },
    { x: 30, y: 66 },
    { x: 55, y: 72 },
    { x: 72, y: 65 },
  ],
];

/* ── Component ───────────────────────────────── */

export const Fruit: React.FC<FruitProps> = React.memo(({ fruit, onClick }) => {
  const [shaking, setShaking] = useState(false);
  const ref = React.useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    if (shaking) return;
    setShaking(true);

    const rect = ref.current?.getBoundingClientRect() ?? null;
    onClick(fruit, rect);

    setTimeout(() => setShaking(false), 500);
  }, [fruit, onClick, shaking]);

  return (
    <button
      ref={ref}
      className={`garden-fruit-grow ${shaking ? 'garden-fruit-shake' : ''}`}
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: `${fruit.anchorX}%`,
        top: `${fruit.anchorY}%`,
        transform: 'translate(-50%, -50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        lineHeight: 1,
        fontSize: 28,
        zIndex: 5,
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        userSelect: 'none',
      }}
      aria-label={`Pick the ${fruit.kind}`}
    >
      <span className="garden-fruit-inner">{EMOJI[fruit.kind]}</span>
    </button>
  );
});

Fruit.displayName = 'Fruit';

/* ── CSS ─────────────────────────────────────── */

export const FRUIT_CSS = `
/* Grow-in from scale(0) when fruit appears */
@keyframes gardenFruitGrowIn {
  0%   { transform: translate(-50%,-50%) scale(0); opacity: 0; }
  60%  { transform: translate(-50%,-50%) scale(1.18); opacity: 1; }
  80%  { transform: translate(-50%,-50%) scale(0.92); }
  100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
}
.garden-fruit-grow {
  animation: gardenFruitGrowIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both;
  will-change: transform, opacity;
}

/* Hover bounce */
@media (hover: hover) {
  .garden-fruit-grow:hover .garden-fruit-inner {
    transform: scale(1.18) translateY(-2px);
  }
}
.garden-fruit-inner {
  display: inline-block;
  transition: transform 0.18s ease;
}

/* Shake on click */
@keyframes gardenFruitShake {
  0%, 100% { transform: translate(-50%,-50%) rotate(0deg); }
  15%      { transform: translate(-50%,-50%) rotate(8deg); }
  30%      { transform: translate(-50%,-50%) rotate(-7deg); }
  45%      { transform: translate(-50%,-50%) rotate(5deg); }
  60%      { transform: translate(-50%,-50%) rotate(-4deg); }
  75%      { transform: translate(-50%,-50%) rotate(2deg); }
}
.garden-fruit-shake {
  animation: gardenFruitShake 0.5s ease forwards !important;
}

/* Active fruit soft glow (text-shadow, no filter) */
.garden-fruit-grow:active .garden-fruit-inner {
  text-shadow: 0 0 10px rgba(255,200,50,0.5);
}
`;
