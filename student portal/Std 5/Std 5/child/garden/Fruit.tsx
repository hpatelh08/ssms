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

export type FruitKind = 'apple' | 'orange' | 'lemon' | 'grape' | 'peach' | 'cherry' | 'mango' | 'banana' | 'strawberry' | 'watermelon';

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
  apple:      '\uD83C\uDF4E',
  orange:     '\uD83C\uDF4A',
  lemon:      '\uD83C\uDF4B',
  grape:      '\uD83C\uDF47',
  peach:      '\uD83C\uDF51',
  cherry:     '\uD83C\uDF52',
  mango:      '\uD83E\uDD6D',
  banana:     '\uD83C\uDF4C',
  strawberry: '\uD83C\uDF53',
  watermelon: '\uD83C\uDF49',
};

const FRUIT_KINDS: FruitKind[] = ['apple', 'orange', 'lemon', 'grape', 'peach', 'cherry', 'mango', 'banana', 'strawberry', 'watermelon'];

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
    { x: 35, y: 48 },
    { x: 55, y: 42 },
    { x: 65, y: 56 },
    { x: 45, y: 68 },
  ],
  /* layer 1 — mid canopy */
  [
    { x: 22, y: 42 },
    { x: 40, y: 50 },
    { x: 55, y: 38 },
    { x: 72, y: 46 },
    { x: 30, y: 65 },
    { x: 62, y: 68 },
    { x: 80, y: 58 },
  ],
  /* layer 2 — bottom canopy (widest) */
  [
    { x: 14, y: 36 },
    { x: 30, y: 44 },
    { x: 46, y: 38 },
    { x: 62, y: 42 },
    { x: 78, y: 36 },
    { x: 22, y: 60 },
    { x: 38, y: 66 },
    { x: 54, y: 62 },
    { x: 70, y: 58 },
    { x: 86, y: 52 },
  ],
];

/* ── Component ───────────────────────────────── */

export const Fruit: React.FC<FruitProps> = React.memo(({ fruit, onClick }) => {
  const [shaking, setShaking] = useState(false);
  const [collected, setCollected] = useState(false);
  const ref = React.useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    if (shaking) return;
    setShaking(true);
    setCollected(true);

    const rect = ref.current?.getBoundingClientRect() ?? null;
    onClick(fruit, rect);

    setTimeout(() => { setShaking(false); setCollected(false); }, 600);
  }, [fruit, onClick, shaking]);

  return (
    <button
      ref={ref}
      className={`garden-fruit-grow ${shaking ? 'garden-fruit-shake' : ''} ${collected ? 'garden-fruit-collected' : ''}`}
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
        fontSize: 30,
        zIndex: 5,
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        userSelect: 'none',
        filter: collected ? 'brightness(1.3) saturate(1.4)' : 'none',
        transition: 'filter 0.2s ease',
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
  0%   { transform: translate(-50%,-50%) scale(0) rotate(-12deg); opacity: 0; }
  50%  { transform: translate(-50%,-50%) scale(1.2) rotate(4deg); opacity: 1; }
  70%  { transform: translate(-50%,-50%) scale(0.9) rotate(-2deg); }
  85%  { transform: translate(-50%,-50%) scale(1.05) rotate(1deg); }
  100% { transform: translate(-50%,-50%) scale(1) rotate(0deg); opacity: 1; }
}
.garden-fruit-grow {
  animation: gardenFruitGrowIn 0.65s cubic-bezier(0.34,1.56,0.64,1) both;
  will-change: transform, opacity;
}

/* Hover bounce */
@media (hover: hover) {
  .garden-fruit-grow:hover .garden-fruit-inner {
    transform: scale(1.22) translateY(-3px) rotate(5deg);
  }
}
.garden-fruit-inner {
  display: inline-block;
  transition: transform 0.18s ease;
}

/* Shake on click */
@keyframes gardenFruitShake {
  0%, 100% { transform: translate(-50%,-50%) rotate(0deg); }
  10%      { transform: translate(-50%,-50%) rotate(10deg) scale(1.1); }
  25%      { transform: translate(-50%,-50%) rotate(-8deg) scale(1.15); }
  40%      { transform: translate(-50%,-50%) rotate(6deg) scale(1.08); }
  55%      { transform: translate(-50%,-50%) rotate(-5deg); }
  70%      { transform: translate(-50%,-50%) rotate(3deg); }
  85%      { transform: translate(-50%,-50%) rotate(-1deg); }
}
.garden-fruit-shake {
  animation: gardenFruitShake 0.6s ease forwards !important;
}

/* Collected flash effect */
@keyframes gardenFruitCollected {
  0%   { text-shadow: 0 0 0 transparent; }
  40%  { text-shadow: 0 0 16px rgba(255,215,0,0.8), 0 0 30px rgba(255,215,0,0.4); }
  100% { text-shadow: 0 0 0 transparent; }
}
.garden-fruit-collected .garden-fruit-inner {
  animation: gardenFruitCollected 0.6s ease !important;
}

/* Active fruit soft glow */
.garden-fruit-grow:active .garden-fruit-inner {
  text-shadow: 0 0 14px rgba(255,200,50,0.6), 0 0 28px rgba(255,200,50,0.3);
}

/* Idle gentle bob for fruits */
@keyframes gardenFruitBob {
  0%, 100% { transform: translate(-50%,-50%) translateY(0); }
  50%      { transform: translate(-50%,-50%) translateY(-2px); }
}
`;
