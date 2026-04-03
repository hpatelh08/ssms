/**
 * garden/Birds.tsx
 * ──────────────────────────────────────────────────
 * Lightweight birds AND butterflies that fly across the screen.
 *
 *  - 3 ambient birds (always present, loop)
 *  - User-spawned birds (max 5, single pass then remove)
 *  - Butterflies (ambient + spawnable, flutter around garden)
 *  - Click → chirp sound + feather sparkle
 *  - Uses CSS transform animation ONLY (no JS animation frames)
 *  - SVG birds/butterflies with wing-flap keyframe
 *
 * Performance: ~8 DOM nodes per creature, will-change: transform.
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
  kind: 'bird' | 'butterfly';
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
  { body: '#5f8b3d', head: '#a7c97f', wing: '#4d7a38', beak: '#c2410c' },
  { body: '#10b981', head: '#34d399', wing: '#059669', beak: '#f97316' },
];

export const BUTTERFLY_PALETTES: BirdPalette[] = [
  { body: '#1e293b', head: '#1e293b', wing: '#f472b6', beak: '#fbbf24' },
  { body: '#1e293b', head: '#1e293b', wing: '#8fcf94', beak: '#fde047' },
  { body: '#1e293b', head: '#1e293b', wing: '#fb923c', beak: '#fbbf24' },
  { body: '#1e293b', head: '#1e293b', wing: '#34d399', beak: '#fde047' },
  { body: '#1e293b', head: '#1e293b', wing: '#f87171', beak: '#fbbf24' },
  { body: '#1e293b', head: '#1e293b', wing: '#a7c97f', beak: '#fde047' },
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
    kind: 'bird',
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
    kind: 'bird',
  };
}

/** Create ambient butterfly (looping) */
export function makeAmbientButterfly(index: number): BirdData {
  const palette = BUTTERFLY_PALETTES[index % BUTTERFLY_PALETTES.length];
  return {
    id: _birdId++,
    palette,
    top: 20 + index * 12,
    duration: 18 + index * 4,
    delay: index * 5,
    size: 26 + index * 4,
    direction: index % 2 === 0 ? 'ltr' : 'rtl',
    loop: true,
    kind: 'butterfly',
  };
}

/** Create spawned butterfly (single pass) */
export function makeSpawnedButterfly(): BirdData {
  const id = _birdId++;
  const palette = BUTTERFLY_PALETTES[id % BUTTERFLY_PALETTES.length];
  const direction = Math.random() > 0.5 ? 'ltr' : 'rtl' as const;
  return {
    id,
    palette,
    top: 15 + Math.random() * 35,
    duration: 12 + Math.random() * 8,
    delay: 0,
    size: 22 + Math.random() * 14,
    direction,
    loop: false,
    kind: 'butterfly',
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

/* ── Single Butterfly SVG ────────────────────── */

const ButterflySvg: React.FC<{
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
      className={`garden-butterfly-flutter ${isLtr ? 'garden-bird-fly-ltr' : 'garden-bird-fly-rtl'}`}
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: `${bird.top}%`,
        pointerEvents: onClick ? 'auto' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        zIndex: 9,
        animationDuration: `${bird.duration}s`,
        animationDelay: `${bird.delay}s`,
        animationIterationCount: bird.loop ? 'infinite' : '1',
        animationFillMode: 'forwards',
      }}
    >
      <svg viewBox="0 0 40 30" width={bird.size} height={bird.size * 0.75}
        className="garden-butterfly-wings">
        {/* Left wing top */}
        <ellipse cx="14" cy="10" rx="10" ry="7" fill={bird.palette.wing} opacity={0.85}
          transform="rotate(-10, 14, 10)" />
        {/* Left wing bottom */}
        <ellipse cx="13" cy="20" rx="7" ry="5" fill={bird.palette.wing} opacity={0.7}
          transform="rotate(10, 13, 20)" />
        {/* Right wing top */}
        <ellipse cx="26" cy="10" rx="10" ry="7" fill={bird.palette.wing} opacity={0.85}
          transform="rotate(10, 26, 10)" />
        {/* Right wing bottom */}
        <ellipse cx="27" cy="20" rx="7" ry="5" fill={bird.palette.wing} opacity={0.7}
          transform="rotate(-10, 27, 20)" />
        {/* Wing dots */}
        <circle cx="12" cy="9" r="2.5" fill="white" opacity={0.4} />
        <circle cx="28" cy="9" r="2.5" fill="white" opacity={0.4} />
        <circle cx="12" cy="19" r="1.5" fill="white" opacity={0.3} />
        <circle cx="28" cy="19" r="1.5" fill="white" opacity={0.3} />
        {/* Body */}
        <ellipse cx="20" cy="15" rx="1.8" ry="9" fill={bird.palette.body} />
        {/* Head */}
        <circle cx="20" cy="5" r="2.2" fill={bird.palette.head} />
        {/* Antennae */}
        <path d="M19 4 Q16 0 14 1" fill="none" stroke={bird.palette.head} strokeWidth={0.6} />
        <path d="M21 4 Q24 0 26 1" fill="none" stroke={bird.palette.head} strokeWidth={0.6} />
        <circle cx="14" cy="1" r="0.8" fill={bird.palette.beak} />
        <circle cx="26" cy="1" r="0.8" fill={bird.palette.beak} />
      </svg>
    </div>
  );
});
ButterflySvg.displayName = 'ButterflySvg';

/* ── Birds Container ─────────────────────────── */

export const Birds: React.FC<BirdsProps> = React.memo(({ birds, onBirdClick }) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 8 }}>
    {birds.map(b => (
      b.kind === 'butterfly'
        ? <ButterflySvg key={b.id} bird={b} onClick={onBirdClick} />
        : <BirdSvg key={b.id} bird={b} onClick={onBirdClick} />
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

/* Butterfly flutter — gentler flutter with wobble */
@keyframes gardenButterflyWings {
  0%   { transform: scaleX(1); }
  50%  { transform: scaleX(0.3); }
  100% { transform: scaleX(1); }
}
.garden-butterfly-wings {
  animation: gardenButterflyWings 0.35s ease-in-out infinite;
  transform-origin: center center;
}

/* Butterfly flutter bob overlay — vertical wobble */
.garden-butterfly-flutter {
  animation-timing-function: ease-in-out !important;
}
`;
