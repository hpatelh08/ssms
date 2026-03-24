/**
 * garden/Birds.tsx
 * ──────────────────────────────────────────────────
 * Lightweight birds that fly across the screen.
 *
 *  - 3 ambient birds (always present, loop)
 *  - User-spawned birds (max 5, single pass then remove)
 *  - Click → chirp sound + feather sparkle
 *  - Uses CSS transform animation ONLY (no JS animation frames)
 *  - SVG birds with wing-flap keyframe
 *
 * Performance: ~8 DOM nodes per bird, will-change: transform.
 */

import React, { useCallback } from 'react';

/* ── Types ───────────────────────────────────── */

export interface BirdData {
  id: number;
  palette: BirdPalette;
  top: number;       // %
  duration: number;   // seconds
  delay: number;      // seconds
  size: number;       // px width
  direction: 'ltr' | 'rtl';
  loop: boolean;      // ambient = true, spawned = false
}

interface BirdPalette {
  body: string;
  head: string;
  wing: string;
  beak: string;
}

interface BirdsProps {
  birds: BirdData[];
  onBirdClick?: (bird: BirdData, rect: DOMRect | null) => void;
}

/* ── Palettes ────────────────────────────────── */

export const BIRD_PALETTES: BirdPalette[] = [
  { body: '#f59e0b', head: '#fbbf24', wing: '#eab308', beak: '#ea580c' },
  { body: '#3b82f6', head: '#60a5fa', wing: '#2563eb', beak: '#f97316' },
  { body: '#ef4444', head: '#f87171', wing: '#dc2626', beak: '#c2410c' },
  { body: '#ec4899', head: '#f472b6', wing: '#db2777', beak: '#be123c' },
  { body: '#14b8a6', head: '#2dd4bf', wing: '#0d9488', beak: '#0f766e' },
];

/* ── Helpers ──────────────────────────────────── */

let _birdId = 100;

/** Create ambient bird (looping) */
export function makeAmbientBird(index: number): BirdData {
  const palette = BIRD_PALETTES[index % BIRD_PALETTES.length];
  const sizes = [32, 44, 54];
  return {
    id: _birdId++,
    palette,
    top: 4 + index * 5,
    duration: 14 + index * 6,
    delay: index * 3,
    size: sizes[index % sizes.length],
    direction: index % 2 === 0 ? 'ltr' : 'rtl',
    loop: true,
  };
}

/** Create spawned bird (single pass) */
export function makeSpawnedBird(): BirdData {
  const id = _birdId++;
  const palette = BIRD_PALETTES[id % BIRD_PALETTES.length];
  const direction = Math.random() > 0.5 ? 'ltr' : 'rtl' as const;
  return {
    id,
    palette,
    top: 4 + Math.random() * 18,
    duration: 8 + Math.random() * 7,
    delay: 0,
    size: 38 + Math.random() * 17,
    direction,
    loop: false,
  };
}

/* ── Single Bird SVG ─────────────────────────── */

const BirdSvg: React.FC<{
  bird: BirdData;
  onClick?: (bird: BirdData, rect: DOMRect | null) => void;
}> = React.memo(({ bird, onClick }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isLtr = bird.direction === 'ltr';

  const handleClick = useCallback(() => {
    if (!onClick) return;
    const rect = ref.current?.getBoundingClientRect() ?? null;
    onClick(bird, rect);
  }, [bird, onClick]);

  return (
    <div
      ref={ref}
      className={isLtr ? 'garden-bird-fly-ltr' : 'garden-bird-fly-rtl'}
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: `${bird.top}%`,
        pointerEvents: onClick ? 'auto' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        zIndex: 8,
        animationDuration: `${bird.duration}s`,
        animationDelay: `${bird.delay}s`,
        animationIterationCount: bird.loop ? 'infinite' : '1',
        animationFillMode: 'forwards',
      }}
    >
      <svg viewBox="0 0 34 26" width={bird.size} height={bird.size * 0.76}
        className="garden-wing-flap">
        {/* body */}
        <ellipse cx="17" cy="13" rx="8" ry="6" fill={bird.palette.body} />
        {/* head */}
        <circle cx={isLtr ? 22 : 12} cy="9" r="5" fill={bird.palette.head} />
        {/* eye */}
        <circle cx={isLtr ? 23 : 11} cy="8.5" r="1.3" fill="#4a5568" />
        <circle cx={isLtr ? 22.7 : 11.3} cy="8" r="0.45" fill="white" />
        {/* beak */}
        {isLtr
          ? <polygon points="26,9 30,8 26,10.5" fill={bird.palette.beak} />
          : <polygon points="8,9 4,8 8,10.5" fill={bird.palette.beak} />
        }
        {/* wings */}
        <path d="M10 11 Q7 4 14 9" fill={bird.palette.wing} />
        <path d="M20 11 Q23 4 17 9" fill={bird.palette.wing} />
      </svg>
    </div>
  );
});
BirdSvg.displayName = 'BirdSvg';

/* ── Birds Container ─────────────────────────── */

export const Birds: React.FC<BirdsProps> = React.memo(({ birds, onBirdClick }) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 8 }}>
    {birds.map(b => (
      <BirdSvg key={b.id} bird={b} onClick={onBirdClick} />
    ))}
  </div>
));

Birds.displayName = 'Birds';

/* ── CSS ─────────────────────────────────────── */

export const BIRDS_CSS = `
/* LTR flight */
@keyframes gardenBirdFlyLtr {
  0%   { left: -12%; transform: translateY(0); opacity: 0; }
  5%   { opacity: 1; }
  15%  { transform: translateY(-16px) rotate(-3deg); }
  30%  { transform: translateY(8px) rotate(2deg); }
  45%  { transform: translateY(-12px) rotate(-2deg); }
  60%  { transform: translateY(6px) rotate(1deg); }
  75%  { transform: translateY(-10px) rotate(-1deg); }
  95%  { opacity: 1; }
  100% { left: 110%; transform: translateY(0); opacity: 0; }
}
.garden-bird-fly-ltr {
  animation: gardenBirdFlyLtr linear infinite;
  will-change: left, transform;
}

/* RTL flight */
@keyframes gardenBirdFlyRtl {
  0%   { right: -12%; transform: translateY(0) scaleX(-1); opacity: 0; }
  5%   { opacity: 1; }
  15%  { transform: translateY(-18px) scaleX(-1) rotate(3deg); }
  30%  { transform: translateY(10px) scaleX(-1) rotate(-2deg); }
  45%  { transform: translateY(-14px) scaleX(-1) rotate(2deg); }
  60%  { transform: translateY(8px) scaleX(-1) rotate(-1deg); }
  75%  { transform: translateY(-10px) scaleX(-1) rotate(1deg); }
  95%  { opacity: 1; }
  100% { right: 110%; transform: translateY(0) scaleX(-1); opacity: 0; }
}
.garden-bird-fly-rtl {
  animation: gardenBirdFlyRtl linear forwards;
  will-change: right, transform;
}

/* Wing flap */
@keyframes gardenWingFlap {
  0%, 100% { transform: scaleY(1); }
  50%      { transform: scaleY(0.45); }
}
.garden-wing-flap {
  animation: gardenWingFlap 0.28s ease-in-out infinite;
  transform-origin: center 70%;
}
`;
