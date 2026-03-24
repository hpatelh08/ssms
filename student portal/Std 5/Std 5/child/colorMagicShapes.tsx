/**
 * child/colorMagicShapes.tsx — 🎨 Color Magic Shape Library
 * ════════════════════════════════════════════════════════════
 * 50+ unique shapes organised in 6 categories for the Color Magic game.
 * Every shape is a simple bold SVG outline (viewBox 0 0 100 100) that
 * fills cleanly with any palette colour.
 *
 * Categories:
 *   basic   (8)  — circle, square, triangle, star, heart …
 *   animal  (10) — fish, cat, dog, bird, butterfly …
 *   nature  (8)  — flower, tree, sun, cloud, leaf …
 *   object  (10) — house, car, balloon, rocket, boat …
 *   food    (8)  — apple, cupcake, ice cream, pizza …
 *   fantasy (6)  — unicorn, dragon, wand, castle …
 */

import React from 'react';

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

export type ShapeCategory = 'basic' | 'animal' | 'nature' | 'object' | 'food' | 'fantasy';

export interface GameShape {
  id: string;
  name: string;
  category: ShapeCategory;
  emoji: string;
  /** 1 = easiest (unlocked from round 1), 4 = expert (round 30+) */
  difficulty: number;
  /** Returns SVG children inside a viewBox="0 0 100 100" wrapper.
   *  `f` = fill colour (hex or rgba for unfilled state). */
  render: (f: string) => React.ReactNode;
}

/* ── Common stroke props ── */
const SP: React.SVGProps<SVGElement> = {
  stroke: '#4a5568',
  strokeWidth: 3.5,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as any;

const SP2: React.SVGProps<SVGElement> = { ...SP, strokeWidth: 2.5 } as any;

/* ═══════════════════════════════════════════════════
   ⬡  BASIC  (8 shapes)
   ═══════════════════════════════════════════════════ */

const BASIC: GameShape[] = [
  {
    id: 'circle', name: 'Circle', category: 'basic', emoji: '⭕', difficulty: 1,
    render: (f) => <circle cx="50" cy="50" r="40" fill={f} {...SP} />,
  },
  {
    id: 'square', name: 'Square', category: 'basic', emoji: '🟧', difficulty: 1,
    render: (f) => <rect x="12" y="12" width="76" height="76" rx="5" fill={f} {...SP} />,
  },
  {
    id: 'triangle', name: 'Triangle', category: 'basic', emoji: '🔺', difficulty: 1,
    render: (f) => <polygon points="50,8 94,88 6,88" fill={f} {...SP} />,
  },
  {
    id: 'star', name: 'Star', category: 'basic', emoji: '⭐', difficulty: 1,
    render: (f) => (
      <polygon
        points="50,4 61,36 96,36 68,56 79,90 50,70 21,90 32,56 4,36 39,36"
        fill={f} {...SP}
      />
    ),
  },
  {
    id: 'heart', name: 'Heart', category: 'basic', emoji: '❤️', difficulty: 1,
    render: (f) => (
      <path
        d="M50 90 C22 68 4 50 4 32 A22 22 0 0 1 50 22 A22 22 0 0 1 96 32 C96 50 78 68 50 90Z"
        fill={f} {...SP}
      />
    ),
  },
  {
    id: 'diamond', name: 'Diamond', category: 'basic', emoji: '💎', difficulty: 1,
    render: (f) => <polygon points="50,4 94,50 50,96 6,50" fill={f} {...SP} />,
  },
  {
    id: 'pentagon', name: 'Pentagon', category: 'basic', emoji: '⬠', difficulty: 2,
    render: (f) => <polygon points="50,6 95,36 78,90 22,90 5,36" fill={f} {...SP} />,
  },
  {
    id: 'hexagon', name: 'Hexagon', category: 'basic', emoji: '⬡', difficulty: 2,
    render: (f) => <polygon points="75,6 97,50 75,94 25,94 3,50 25,6" fill={f} {...SP} />,
  },
];

/* ═══════════════════════════════════════════════════
   🐾  ANIMAL  (10 shapes)
   ═══════════════════════════════════════════════════ */

const ANIMAL: GameShape[] = [
  /* ── Fish ── */
  {
    id: 'fish', name: 'Fish', category: 'animal', emoji: '🐟', difficulty: 1,
    render: (f) => (
      <>
        <ellipse cx="45" cy="52" rx="34" ry="24" fill={f} {...SP} />
        <polygon points="78,52 98,34 98,70" fill={f} {...SP} />
        <circle cx="32" cy="46" r="4" fill="#4a5568" />
        <circle cx="31" cy="44.5" r="1.2" fill="#fff" />
      </>
    ),
  },
  /* ── Cat ── */
  {
    id: 'cat', name: 'Cat', category: 'animal', emoji: '🐱', difficulty: 1,
    render: (f) => (
      <>
        <circle cx="50" cy="56" r="34" fill={f} {...SP} />
        <polygon points="22,34 14,4 40,24" fill={f} {...SP} />
        <polygon points="78,34 86,4 60,24" fill={f} {...SP} />
        <circle cx="37" cy="50" r="4.5" fill="#4a5568" />
        <circle cx="63" cy="50" r="4.5" fill="#4a5568" />
        <ellipse cx="50" cy="62" rx="5" ry="3.5" fill="#f8a0b0" />
        <line x1="24" y1="56" x2="6" y2="52" {...SP2} />
        <line x1="24" y1="62" x2="6" y2="64" {...SP2} />
        <line x1="76" y1="56" x2="94" y2="52" {...SP2} />
        <line x1="76" y1="62" x2="94" y2="64" {...SP2} />
      </>
    ),
  },
  /* ── Dog ── */
  {
    id: 'dog', name: 'Dog', category: 'animal', emoji: '🐶', difficulty: 1,
    render: (f) => (
      <>
        <circle cx="50" cy="54" r="34" fill={f} {...SP} />
        <ellipse cx="24" cy="38" rx="14" ry="22" fill={f} {...SP} />
        <ellipse cx="76" cy="38" rx="14" ry="22" fill={f} {...SP} />
        <circle cx="38" cy="48" r="4.5" fill="#4a5568" />
        <circle cx="62" cy="48" r="4.5" fill="#4a5568" />
        <ellipse cx="50" cy="62" rx="8" ry="6" fill="#4a5568" />
        <path d="M44 72 Q50 80 56 72" fill="none" {...SP2} />
      </>
    ),
  },
  /* ── Bird ── */
  {
    id: 'bird', name: 'Bird', category: 'animal', emoji: '🐦', difficulty: 1,
    render: (f) => (
      <>
        <ellipse cx="50" cy="55" rx="28" ry="24" fill={f} {...SP} />
        <circle cx="50" cy="34" r="18" fill={f} {...SP} />
        <polygon points="68,32 88,28 78,40" fill="#f59e0b" {...SP2} />
        <circle cx="55" cy="30" r="3.5" fill="#4a5568" />
        <path d="M22,55 Q5,35 18,45" fill={f} {...SP} />
        <path d="M78,55 Q95,35 82,45" fill={f} {...SP} />
        <ellipse cx="42" cy="80" rx="5" ry="10" fill="#f59e0b" {...SP2} />
        <ellipse cx="58" cy="80" rx="5" ry="10" fill="#f59e0b" {...SP2} />
      </>
    ),
  },
  /* ── Butterfly ── */
  {
    id: 'butterfly', name: 'Butterfly', category: 'animal', emoji: '🦋', difficulty: 2,
    render: (f) => (
      <>
        <ellipse cx="30" cy="35" rx="22" ry="20" fill={f} {...SP} />
        <ellipse cx="70" cy="35" rx="22" ry="20" fill={f} {...SP} />
        <ellipse cx="32" cy="65" rx="18" ry="16" fill={f} {...SP} />
        <ellipse cx="68" cy="65" rx="18" ry="16" fill={f} {...SP} />
        <ellipse cx="50" cy="50" rx="5" ry="28" fill="#4a5568" {...SP2} />
        <line x1="46" y1="22" x2="34" y2="8" {...SP2} />
        <line x1="54" y1="22" x2="66" y2="8" {...SP2} />
        <circle cx="34" cy="6" r="3" fill="#4a5568" />
        <circle cx="66" cy="6" r="3" fill="#4a5568" />
      </>
    ),
  },
  /* ── Bunny ── */
  {
    id: 'bunny', name: 'Bunny', category: 'animal', emoji: '🐰', difficulty: 1,
    render: (f) => (
      <>
        <ellipse cx="36" cy="24" rx="10" ry="24" fill={f} {...SP} />
        <ellipse cx="64" cy="24" rx="10" ry="24" fill={f} {...SP} />
        <ellipse cx="36" cy="22" rx="5" ry="14" fill="#f8a0b0" />
        <ellipse cx="64" cy="22" rx="5" ry="14" fill="#f8a0b0" />
        <circle cx="50" cy="62" r="30" fill={f} {...SP} />
        <circle cx="38" cy="56" r="4" fill="#4a5568" />
        <circle cx="62" cy="56" r="4" fill="#4a5568" />
        <ellipse cx="50" cy="68" rx="5" ry="4" fill="#f8a0b0" />
      </>
    ),
  },
  /* ── Frog ── */
  {
    id: 'frog', name: 'Frog', category: 'animal', emoji: '🐸', difficulty: 2,
    render: (f) => (
      <>
        <ellipse cx="50" cy="60" rx="38" ry="28" fill={f} {...SP} />
        <circle cx="28" cy="32" r="16" fill={f} {...SP} />
        <circle cx="72" cy="32" r="16" fill={f} {...SP} />
        <circle cx="28" cy="30" r="7" fill="#fff" {...SP2} />
        <circle cx="72" cy="30" r="7" fill="#fff" {...SP2} />
        <circle cx="30" cy="29" r="4" fill="#4a5568" />
        <circle cx="74" cy="29" r="4" fill="#4a5568" />
        <path d="M32 72 Q50 82 68 72" fill="none" {...SP2} />
      </>
    ),
  },
  /* ── Turtle ── */
  {
    id: 'turtle', name: 'Turtle', category: 'animal', emoji: '🐢', difficulty: 2,
    render: (f) => (
      <>
        <ellipse cx="50" cy="50" rx="34" ry="28" fill={f} {...SP} />
        <path d="M50 50 L30 28 M50 50 L70 28 M50 50 L30 72 M50 50 L70 72 M50 50 L50 22 M50 50 L50 78" fill="none" {...SP2} />
        <circle cx="82" cy="44" r="10" fill={f} {...SP} />
        <circle cx="3" cy="44" r="3" fill="#4a5568" />
        <circle cx="28" cy="80" r="8" fill={f} {...SP} />
        <circle cx="72" cy="80" r="8" fill={f} {...SP} />
        <circle cx="28" cy="24" r="8" fill={f} {...SP} />
        <circle cx="72" cy="24" r="8" fill={f} {...SP} />
      </>
    ),
  },
  /* ── Bear ── */
  {
    id: 'bear', name: 'Bear', category: 'animal', emoji: '🐻', difficulty: 2,
    render: (f) => (
      <>
        <circle cx="26" cy="24" r="14" fill={f} {...SP} />
        <circle cx="74" cy="24" r="14" fill={f} {...SP} />
        <circle cx="26" cy="22" r="7" fill="#8B6914" />
        <circle cx="74" cy="22" r="7" fill="#8B6914" />
        <circle cx="50" cy="56" r="36" fill={f} {...SP} />
        <circle cx="36" cy="48" r="5" fill="#4a5568" />
        <circle cx="64" cy="48" r="5" fill="#4a5568" />
        <ellipse cx="50" cy="62" rx="10" ry="8" fill="#8B6914" {...SP2} />
        <ellipse cx="50" cy="60" rx="5" ry="3.5" fill="#4a5568" />
      </>
    ),
  },
  /* ── Elephant ── */
  {
    id: 'elephant', name: 'Elephant', category: 'animal', emoji: '🐘', difficulty: 3,
    render: (f) => (
      <>
        <circle cx="50" cy="45" r="30" fill={f} {...SP} />
        <ellipse cx="18" cy="42" rx="18" ry="24" fill={f} {...SP} />
        <ellipse cx="82" cy="42" rx="18" ry="24" fill={f} {...SP} />
        <path d="M40 72 Q38 94 44 96 Q48 96 46 76" fill={f} {...SP} />
        <circle cx="38" cy="38" r="4" fill="#4a5568" />
        <circle cx="62" cy="38" r="4" fill="#4a5568" />
      </>
    ),
  },
];

/* ═══════════════════════════════════════════════════
   🌿  NATURE  (8 shapes)
   ═══════════════════════════════════════════════════ */

const NATURE: GameShape[] = [
  /* ── Flower ── */
  {
    id: 'flower', name: 'Flower', category: 'nature', emoji: '🌸', difficulty: 1,
    render: (f) => (
      <>
        <circle cx="50" cy="28" r="16" fill={f} {...SP} />
        <circle cx="72" cy="42" r="16" fill={f} {...SP} />
        <circle cx="64" cy="66" r="16" fill={f} {...SP} />
        <circle cx="36" cy="66" r="16" fill={f} {...SP} />
        <circle cx="28" cy="42" r="16" fill={f} {...SP} />
        <circle cx="50" cy="48" r="10" fill="#fbbf24" {...SP2} />
        <line x1="50" y1="58" x2="50" y2="96" stroke="#16a34a" strokeWidth={4} strokeLinecap="round" />
      </>
    ),
  },
  /* ── Tree ── */
  {
    id: 'tree', name: 'Tree', category: 'nature', emoji: '🌳', difficulty: 1,
    render: (f) => (
      <>
        <rect x="42" y="60" width="16" height="36" rx="3" fill="#8B6914" {...SP} />
        <circle cx="50" cy="38" r="32" fill={f} {...SP} />
      </>
    ),
  },
  /* ── Sun ── */
  {
    id: 'sun', name: 'Sun', category: 'nature', emoji: '☀️', difficulty: 1,
    render: (f) => (
      <>
        <circle cx="50" cy="50" r="22" fill={f} {...SP} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const rad = (a * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={50 + Math.cos(rad) * 28}
              y1={50 + Math.sin(rad) * 28}
              x2={50 + Math.cos(rad) * 44}
              y2={50 + Math.sin(rad) * 44}
              stroke="#4a5568" strokeWidth={4} strokeLinecap="round"
            />
          );
        })}
      </>
    ),
  },
  /* ── Cloud ── */
  {
    id: 'cloud', name: 'Cloud', category: 'nature', emoji: '☁️', difficulty: 1,
    render: (f) => (
      <>
        <ellipse cx="50" cy="56" rx="38" ry="20" fill={f} {...SP} />
        <circle cx="32" cy="42" r="20" fill={f} {...SP} />
        <circle cx="56" cy="34" r="24" fill={f} {...SP} />
        <circle cx="72" cy="46" r="16" fill={f} {...SP} />
      </>
    ),
  },
  /* ── Leaf ── */
  {
    id: 'leaf', name: 'Leaf', category: 'nature', emoji: '🍃', difficulty: 2,
    render: (f) => (
      <>
        <path d="M50 8 Q92 25 88 60 Q80 92 50 96 Q20 92 12 60 Q8 25 50 8Z" fill={f} {...SP} />
        <line x1="50" y1="20" x2="50" y2="90" stroke="#4a5568" strokeWidth={2.5} strokeLinecap="round" />
        <line x1="50" y1="40" x2="32" y2="30" stroke="#4a5568" strokeWidth={2} strokeLinecap="round" />
        <line x1="50" y1="55" x2="68" y2="44" stroke="#4a5568" strokeWidth={2} strokeLinecap="round" />
        <line x1="50" y1="70" x2="34" y2="62" stroke="#4a5568" strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
  /* ── Mushroom ── */
  {
    id: 'mushroom', name: 'Mushroom', category: 'nature', emoji: '🍄', difficulty: 2,
    render: (f) => (
      <>
        <rect x="38" y="55" width="24" height="38" rx="4" fill="#f5f0e1" {...SP} />
        <path d="M8 58 Q8 14 50 14 Q92 14 92 58Z" fill={f} {...SP} />
        <circle cx="36" cy="38" r="7" fill="#fff" opacity={0.5} />
        <circle cx="60" cy="30" r="5" fill="#fff" opacity={0.5} />
        <circle cx="52" cy="48" r="6" fill="#fff" opacity={0.5} />
      </>
    ),
  },
  /* ── Mountain ── */
  {
    id: 'mountain', name: 'Mountain', category: 'nature', emoji: '⛰️', difficulty: 2,
    render: (f) => (
      <>
        <polygon points="50,8 96,90 4,90" fill={f} {...SP} />
        <polygon points="50,8 38,32 62,32" fill="#fff" {...SP2} />
      </>
    ),
  },
  /* ── Raindrop ── */
  {
    id: 'raindrop', name: 'Raindrop', category: 'nature', emoji: '💧', difficulty: 2,
    render: (f) => (
      <path
        d="M50 6 Q52 6 72 46 A28 28 0 1 1 28 46 Q48 6 50 6Z"
        fill={f} {...SP}
      />
    ),
  },
];

/* ═══════════════════════════════════════════════════
   🏠  OBJECT  (10 shapes)
   ═══════════════════════════════════════════════════ */

const OBJECT: GameShape[] = [
  /* ── House ── */
  {
    id: 'house', name: 'House', category: 'object', emoji: '🏠', difficulty: 1,
    render: (f) => (
      <>
        <rect x="16" y="46" width="68" height="48" rx="3" fill={f} {...SP} />
        <polygon points="50,8 96,48 4,48" fill={f} {...SP} />
        <rect x="40" y="64" width="20" height="30" rx="2" fill="#8B6914" {...SP2} />
        <rect x="22" y="54" width="14" height="14" rx="2" fill="#87CEEB" {...SP2} />
        <rect x="64" y="54" width="14" height="14" rx="2" fill="#87CEEB" {...SP2} />
      </>
    ),
  },
  /* ── Car ── */
  {
    id: 'car', name: 'Car', category: 'object', emoji: '🚗', difficulty: 2,
    render: (f) => (
      <>
        <path d="M12 58 L12 72 Q12 78 18 78 L82 78 Q88 78 88 72 L88 58 Q88 52 82 52 L18 52 Q12 52 12 58Z" fill={f} {...SP} />
        <path d="M26 52 L32 32 Q34 28 40 28 L60 28 Q66 28 68 32 L74 52" fill={f} {...SP} />
        <rect x="36" y="32" width="12" height="18" rx="2" fill="#87CEEB" {...SP2} />
        <rect x="52" y="32" width="12" height="18" rx="2" fill="#87CEEB" {...SP2} />
        <circle cx="28" cy="78" r="10" fill="#374151" {...SP} />
        <circle cx="72" cy="78" r="10" fill="#374151" {...SP} />
        <circle cx="28" cy="78" r="4" fill="#9CA3AF" />
        <circle cx="72" cy="78" r="4" fill="#9CA3AF" />
      </>
    ),
  },
  /* ── Balloon ── */
  {
    id: 'balloon', name: 'Balloon', category: 'object', emoji: '🎈', difficulty: 1,
    render: (f) => (
      <>
        <ellipse cx="50" cy="40" rx="28" ry="34" fill={f} {...SP} />
        <polygon points="44,72 50,78 56,72 50,74" fill={f} {...SP2} />
        <line x1="50" y1="78" x2="50" y2="96" stroke="#4a5568" strokeWidth={2} strokeLinecap="round" />
        <path d="M46 24 Q48 18 54 22" fill="none" stroke="#fff" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      </>
    ),
  },
  /* ── Rocket ── */
  {
    id: 'rocket', name: 'Rocket', category: 'object', emoji: '🚀', difficulty: 2,
    render: (f) => (
      <>
        <path d="M50 4 Q36 20 36 50 L36 72 L64 72 L64 50 Q64 20 50 4Z" fill={f} {...SP} />
        <path d="M36 58 L20 76 L36 70" fill={f} {...SP} />
        <path d="M64 58 L80 76 L64 70" fill={f} {...SP} />
        <circle cx="50" cy="38" r="8" fill="#87CEEB" {...SP2} />
        <path d="M38 72 L42 92 L50 84 L58 92 L62 72" fill="#f59e0b" {...SP} />
      </>
    ),
  },
  /* ── Boat ── */
  {
    id: 'boat', name: 'Boat', category: 'object', emoji: '⛵', difficulty: 2,
    render: (f) => (
      <>
        <path d="M10 62 L18 86 L82 86 L90 62Z" fill={f} {...SP} />
        <line x1="50" y1="14" x2="50" y2="62" stroke="#8B6914" strokeWidth={3.5} strokeLinecap="round" />
        <polygon points="50,14 82,44 50,52" fill="#fff" {...SP} />
        <path d="M4 92 Q25 82 50 92 Q75 82 96 92" fill="none" stroke="#4a5568" strokeWidth={2.5} strokeLinecap="round" />
      </>
    ),
  },
  /* ── Bell ── */
  {
    id: 'bell', name: 'Bell', category: 'object', emoji: '🔔', difficulty: 2,
    render: (f) => (
      <>
        <path d="M22 68 Q22 26 50 14 Q78 26 78 68Z" fill={f} {...SP} />
        <rect x="18" y="66" width="64" height="8" rx="4" fill={f} {...SP} />
        <circle cx="50" cy="82" r="8" fill="#fbbf24" {...SP} />
        <circle cx="50" cy="10" r="5" fill="#fbbf24" {...SP2} />
      </>
    ),
  },
  /* ── Key ── */
  {
    id: 'key', name: 'Key', category: 'object', emoji: '🔑', difficulty: 3,
    render: (f) => (
      <>
        <circle cx="34" cy="34" r="22" fill={f} {...SP} />
        <circle cx="34" cy="34" r="10" fill="rgba(255,255,255,0.2)" {...SP2} />
        <rect x="54" y="28" width="38" height="12" rx="4" fill={f} {...SP} />
        <rect x="82" y="40" width="10" height="14" rx="2" fill={f} {...SP} />
        <rect x="72" y="40" width="8" height="10" rx="2" fill={f} {...SP} />
      </>
    ),
  },
  /* ── Crown ── */
  {
    id: 'crown', name: 'Crown', category: 'object', emoji: '👑', difficulty: 2,
    render: (f) => (
      <>
        <path d="M10 82 L10 42 L30 58 L50 28 L70 58 L90 42 L90 82Z" fill={f} {...SP} />
        <rect x="10" y="76" width="80" height="10" rx="3" fill={f} {...SP} />
        <circle cx="50" cy="28" r="4" fill="#fbbf24" />
        <circle cx="30" cy="58" r="3" fill="#fbbf24" />
        <circle cx="70" cy="58" r="3" fill="#fbbf24" />
      </>
    ),
  },
  /* ── Umbrella ── */
  {
    id: 'umbrella', name: 'Umbrella', category: 'object', emoji: '☂️', difficulty: 3,
    render: (f) => (
      <>
        <path d="M6 50 Q6 12 50 12 Q94 12 94 50Z" fill={f} {...SP} />
        <line x1="50" y1="12" x2="50" y2="82" stroke="#4a5568" strokeWidth={3.5} strokeLinecap="round" />
        <path d="M50 82 Q50 92 42 92 Q34 92 34 86" fill="none" stroke="#4a5568" strokeWidth={3.5} strokeLinecap="round" />
        <path d="M6 50 Q18 42 30 50 Q42 42 50 50 Q58 42 70 50 Q82 42 94 50" fill="none" stroke="#4a5568" strokeWidth={2} />
      </>
    ),
  },
  /* ── Lamp ── */
  {
    id: 'lamp', name: 'Lamp', category: 'object', emoji: '💡', difficulty: 3,
    render: (f) => (
      <>
        <path d="M30 50 Q18 50 12 30 Q8 12 50 8 Q92 12 88 30 Q82 50 70 50Z" fill={f} {...SP} />
        <rect x="36" y="50" width="28" height="8" rx="2" fill="#d1d5db" {...SP2} />
        <rect x="38" y="58" width="24" height="6" rx="2" fill="#d1d5db" {...SP2} />
        <path d="M40 64 Q50 76 60 64" fill="none" stroke="#4a5568" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M38 28 Q42 18 50 28" fill="none" stroke="#fff" strokeWidth={2} opacity={0.4} strokeLinecap="round" />
      </>
    ),
  },
];

/* ═══════════════════════════════════════════════════
   🍎  FOOD  (8 shapes)
   ═══════════════════════════════════════════════════ */

const FOOD: GameShape[] = [
  /* ── Apple ── */
  {
    id: 'apple', name: 'Apple', category: 'food', emoji: '🍎', difficulty: 1,
    render: (f) => (
      <>
        <path d="M50 22 Q24 18 14 44 Q6 68 26 86 Q40 96 50 90 Q60 96 74 86 Q94 68 86 44 Q76 18 50 22Z" fill={f} {...SP} />
        <line x1="50" y1="8" x2="50" y2="26" stroke="#8B6914" strokeWidth={3} strokeLinecap="round" />
        <path d="M52 12 Q64 6 68 14" fill="#16a34a" {...SP2} />
      </>
    ),
  },
  /* ── Cupcake ── */
  {
    id: 'cupcake', name: 'Cupcake', category: 'food', emoji: '🧁', difficulty: 1,
    render: (f) => (
      <>
        <path d="M24 52 L30 92 L70 92 L76 52Z" fill="#f5deb3" {...SP} />
        <path d="M18 52 Q18 26 50 22 Q82 26 82 52Z" fill={f} {...SP} />
        <circle cx="50" cy="18" r="5" fill="#ef4444" {...SP2} />
        <path d="M24 52 Q36 46 50 52 Q64 46 76 52" fill="none" stroke="#4a5568" strokeWidth={2} />
      </>
    ),
  },
  /* ── Ice Cream ── */
  {
    id: 'icecream', name: 'Ice Cream', category: 'food', emoji: '🍦', difficulty: 2,
    render: (f) => (
      <>
        <polygon points="34,52 50,96 66,52" fill="#f5deb3" {...SP} />
        <line x1="38" y1="58" x2="62" y2="58" stroke="#d4a574" strokeWidth={1.5} />
        <line x1="40" y1="68" x2="60" y2="68" stroke="#d4a574" strokeWidth={1.5} />
        <circle cx="50" cy="36" r="22" fill={f} {...SP} />
        <path d="M40 22 Q44 16 48 22" fill="none" stroke="#fff" strokeWidth={2} opacity={0.4} strokeLinecap="round" />
      </>
    ),
  },
  /* ── Pizza ── */
  {
    id: 'pizza', name: 'Pizza', category: 'food', emoji: '🍕', difficulty: 2,
    render: (f) => (
      <>
        <path d="M50 8 L10 88 Q50 96 90 88Z" fill={f} {...SP} />
        <path d="M10 88 Q50 96 90 88" fill="#f5deb3" {...SP} />
        <circle cx="40" cy="50" r="5" fill="#ef4444" />
        <circle cx="58" cy="62" r="5" fill="#ef4444" />
        <circle cx="48" cy="74" r="5" fill="#ef4444" />
        <circle cx="52" cy="36" r="4" fill="#16a34a" />
      </>
    ),
  },
  /* ── Banana ── */
  {
    id: 'banana', name: 'Banana', category: 'food', emoji: '🍌', difficulty: 2,
    render: (f) => (
      <path
        d="M30 14 Q22 14 18 28 Q10 56 28 80 Q40 94 56 90 Q64 88 60 78 Q50 50 50 28 Q52 14 42 10 Q36 8 30 14Z"
        fill={f} {...SP}
      />
    ),
  },
  /* ── Cherry ── */
  {
    id: 'cherry', name: 'Cherry', category: 'food', emoji: '🍒', difficulty: 2,
    render: (f) => (
      <>
        <circle cx="32" cy="68" r="22" fill={f} {...SP} />
        <circle cx="72" cy="62" r="18" fill={f} {...SP} />
        <path d="M32 46 Q34 18 50 10 Q66 18 72 44" fill="none" stroke="#16a34a" strokeWidth={3} strokeLinecap="round" />
        <path d="M50 10 Q60 4 66 10" fill="#16a34a" {...SP2} />
        <circle cx="26" cy="60" r="3" fill="#fff" opacity={0.35} />
        <circle cx="68" cy="54" r="2.5" fill="#fff" opacity={0.35} />
      </>
    ),
  },
  /* ── Cookie ── */
  {
    id: 'cookie', name: 'Cookie', category: 'food', emoji: '🍪', difficulty: 2,
    render: (f) => (
      <>
        <circle cx="50" cy="50" r="40" fill={f} {...SP} />
        <circle cx="35" cy="35" r="5" fill="#5c3d15" />
        <circle cx="60" cy="30" r="4" fill="#5c3d15" />
        <circle cx="42" cy="58" r="5" fill="#5c3d15" />
        <circle cx="65" cy="55" r="4.5" fill="#5c3d15" />
        <circle cx="50" cy="72" r="4" fill="#5c3d15" />
        <circle cx="30" cy="64" r="3.5" fill="#5c3d15" />
      </>
    ),
  },
  /* ── Watermelon ── */
  {
    id: 'watermelon', name: 'Watermelon', category: 'food', emoji: '🍉', difficulty: 3,
    render: (f) => (
      <>
        <path d="M10 58 A48 48 0 0 1 90 58Z" fill={f} {...SP} />
        <path d="M16 58 A42 42 0 0 1 84 58" fill="none" stroke="#16a34a" strokeWidth={6} />
        <ellipse cx="36" cy="44" rx="2.5" ry="4" fill="#4a5568" />
        <ellipse cx="50" cy="38" rx="2.5" ry="4" fill="#4a5568" />
        <ellipse cx="64" cy="44" rx="2.5" ry="4" fill="#4a5568" />
        <ellipse cx="44" cy="52" rx="2" ry="3.5" fill="#4a5568" />
        <ellipse cx="58" cy="52" rx="2" ry="3.5" fill="#4a5568" />
      </>
    ),
  },
];

/* ═══════════════════════════════════════════════════
   ✨  FANTASY  (6 shapes)
   ═══════════════════════════════════════════════════ */

const FANTASY: GameShape[] = [
  /* ── Unicorn head ── */
  {
    id: 'unicorn', name: 'Unicorn', category: 'fantasy', emoji: '🦄', difficulty: 3,
    render: (f) => (
      <>
        <ellipse cx="50" cy="58" rx="30" ry="32" fill={f} {...SP} />
        <ellipse cx="30" cy="36" rx="12" ry="18" fill={f} {...SP} />
        <polygon points="50,4 44,34 56,34" fill="#fbbf24" {...SP} />
        <circle cx="38" cy="52" r="4" fill="#4a5568" />
        <ellipse cx="56" cy="70" rx="8" ry="5" fill="#f8a0b0" />
        <path d="M20 76 Q15 88 8 82" fill={f} {...SP2} />
      </>
    ),
  },
  /* ── Dragon head ── */
  {
    id: 'dragon', name: 'Dragon', category: 'fantasy', emoji: '🐉', difficulty: 3,
    render: (f) => (
      <>
        <ellipse cx="50" cy="52" rx="32" ry="28" fill={f} {...SP} />
        <polygon points="18,28 8,6 30,22" fill={f} {...SP} />
        <polygon points="42,26 36,4 52,20" fill={f} {...SP} />
        <circle cx="36" cy="44" r="6" fill="#fbbf24" {...SP2} />
        <circle cx="37" cy="43" r="3" fill="#4a5568" />
        <ellipse cx="62" cy="58" rx="10" ry="6" fill="#4a5568" opacity={0.2} />
        <circle cx="60" cy="56" r="2" fill="#4a5568" />
        <circle cx="66" cy="56" r="2" fill="#4a5568" />
        <path d="M78 46 L92 38 L86 50 L96 52" fill={f} {...SP2} />
      </>
    ),
  },
  /* ── Magic Wand ── */
  {
    id: 'wand', name: 'Wand', category: 'fantasy', emoji: '🪄', difficulty: 2,
    render: (f) => (
      <>
        <line x1="28" y1="92" x2="62" y2="38" stroke="#8B6914" strokeWidth={5} strokeLinecap="round" />
        <polygon
          points="62,8 66,26 84,26 70,36 74,54 62,42 50,54 54,36 40,26 58,26"
          fill={f} {...SP}
        />
        <circle cx="40" cy="18" r="2.5" fill="#fbbf24" />
        <circle cx="78" cy="14" r="2" fill="#fbbf24" />
        <circle cx="82" cy="40" r="2.5" fill="#fbbf24" />
      </>
    ),
  },
  /* ── Castle ── */
  {
    id: 'castle', name: 'Castle', category: 'fantasy', emoji: '🏰', difficulty: 3,
    render: (f) => (
      <>
        <rect x="26" y="40" width="48" height="54" rx="2" fill={f} {...SP} />
        <rect x="10" y="32" width="18" height="62" rx="2" fill={f} {...SP} />
        <rect x="72" y="32" width="18" height="62" rx="2" fill={f} {...SP} />
        <rect x="10" y="24" width="6" height="10" fill={f} {...SP2} />
        <rect x="22" y="24" width="6" height="10" fill={f} {...SP2} />
        <rect x="72" y="24" width="6" height="10" fill={f} {...SP2} />
        <rect x="84" y="24" width="6" height="10" fill={f} {...SP2} />
        <path d="M44 94 L44 72 Q50 64 56 72 L56 94" fill="#8B6914" {...SP2} />
        <rect x="34" y="50" width="10" height="12" rx="2" fill="#87CEEB" {...SP2} />
        <rect x="56" y="50" width="10" height="12" rx="2" fill="#87CEEB" {...SP2} />
        <polygon points="50,6 38,24 62,24" fill={f} {...SP} />
      </>
    ),
  },
  /* ── Fairy ── */
  {
    id: 'fairy', name: 'Fairy', category: 'fantasy', emoji: '🧚', difficulty: 3,
    render: (f) => (
      <>
        <circle cx="50" cy="24" r="14" fill="#fdd" {...SP} />
        <polygon points="38,36 50,86 62,36" fill={f} {...SP} />
        <ellipse cx="30" cy="42" rx="18" ry="14" fill={f} {...SP} opacity={0.7} />
        <ellipse cx="70" cy="42" rx="18" ry="14" fill={f} {...SP} opacity={0.7} />
        <circle cx="46" cy="22" r="2" fill="#4a5568" />
        <circle cx="54" cy="22" r="2" fill="#4a5568" />
        <line x1="68" y1="12" x2="80" y2="4" stroke="#fbbf24" strokeWidth={2} strokeLinecap="round" />
        <polygon points="80,4 82,10 88,6 84,0 78,2" fill="#fbbf24" />
      </>
    ),
  },
  /* ── Gem ── */
  {
    id: 'gem', name: 'Gem', category: 'fantasy', emoji: '💎', difficulty: 2,
    render: (f) => (
      <>
        <polygon points="50,4 88,36 72,94 28,94 12,36" fill={f} {...SP} />
        <polygon points="50,4 36,36 64,36" fill="rgba(255,255,255,0.25)" {...SP2} />
        <line x1="36" y1="36" x2="28" y2="94" stroke="#4a5568" strokeWidth={2} />
        <line x1="64" y1="36" x2="72" y2="94" stroke="#4a5568" strokeWidth={2} />
        <line x1="50" y1="4" x2="50" y2="94" stroke="#4a5568" strokeWidth={1.5} opacity={0.5} />
        <line x1="12" y1="36" x2="88" y2="36" stroke="#4a5568" strokeWidth={2} />
      </>
    ),
  },
];

/* ═══════════════════════════════════════════════════
   MASTER LIBRARY  (50 shapes)
   ═══════════════════════════════════════════════════ */

export const SHAPE_LIBRARY: GameShape[] = [
  ...BASIC,
  ...ANIMAL,
  ...NATURE,
  ...OBJECT,
  ...FOOD,
  ...FANTASY,
];

/* ── Helpers ── */

export const CATEGORIES: ShapeCategory[] = ['basic', 'animal', 'nature', 'object', 'food', 'fantasy'];

export const CATEGORY_META: Record<ShapeCategory, { label: string; emoji: string }> = {
  basic:   { label: 'Basic Shapes', emoji: '⬡' },
  animal:  { label: 'Animals',      emoji: '🐾' },
  nature:  { label: 'Nature',       emoji: '🌿' },
  object:  { label: 'Objects',      emoji: '🏠' },
  food:    { label: 'Food',         emoji: '🍎' },
  fantasy: { label: 'Fantasy',      emoji: '✨' },
};

/** Fisher-Yates shuffle (returns a NEW array) */
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `count` random shapes, ensuring difficulty ≤ maxDifficulty */
export function pickRandomShapes(count: number, maxDifficulty: number, exclude: Set<string> = new Set()): GameShape[] {
  const eligible = SHAPE_LIBRARY.filter(s => s.difficulty <= maxDifficulty && !exclude.has(s.id));
  const shuffled = shuffleArray(eligible);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/** Clone a specific shape type N times with unique IDs (for paint-all / count-based mechanics) */
export function pickShapeClones(shapeName: string, count: number, maxDifficulty: number): GameShape[] {
  const base = SHAPE_LIBRARY.find(s => s.name === shapeName && s.difficulty <= maxDifficulty);
  if (!base) {
    const fallback = SHAPE_LIBRARY.find(s => s.difficulty <= maxDifficulty);
    if (!fallback) return [];
    return Array.from({ length: count }, (_, i) => ({
      ...fallback,
      id: `${fallback.id}_c${i}_${Math.random().toString(36).slice(2, 6)}`,
    }));
  }
  return Array.from({ length: count }, (_, i) => ({
    ...base,
    id: `${base.id}_c${i}_${Math.random().toString(36).slice(2, 6)}`,
  }));
}

/** Pick N unique distractor shapes (names ≠ excludeName), each with a unique runtime ID */
export function pickDistractorShapes(excludeName: string, count: number, maxDifficulty: number): GameShape[] {
  const eligible = SHAPE_LIBRARY.filter(s => s.name !== excludeName && s.difficulty <= maxDifficulty);
  const shuffled = shuffleArray(eligible);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((s, i) => ({
    ...s,
    id: `${s.id}_d${i}_${Math.random().toString(36).slice(2, 6)}`,
  }));
}

/* ═══════════════════════════════════════════════════
   🏆  SEGMENTED OBJECTS — MEGA MASTER MODE
   ═══════════════════════════════════════════════════
   Large objects with 6–12 individually clickable parts.
   Each part has a render function, label, and center position
   for the letter hint overlay.
   ═══════════════════════════════════════════════════ */

/** Common stroke for segmented parts */
const SEG: React.SVGProps<SVGElement> = {
  stroke: '#334155',
  strokeWidth: 2.5,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as any;

export interface SegmentedPartDef {
  id: string;
  label: string;
  labelX: number;
  labelY: number;
  renderPart: (fill: string) => React.ReactNode;
}

export interface SegmentedObject {
  id: string;
  name: string;
  emoji: string;
  viewBox: string;
  parts: SegmentedPartDef[];
}

/* ─── House ─── */
const SEG_HOUSE: SegmentedObject = {
  id: 'seg_house', name: 'House', emoji: '🏠', viewBox: '0 0 200 200',
  parts: [
    { id: 'roof', label: 'Roof', labelX: 100, labelY: 60,
      renderPart: (f) => <polygon points="100,15 20,90 180,90" fill={f} {...SEG} /> },
    { id: 'wall', label: 'Wall', labelX: 60, labelY: 140,
      renderPart: (f) => <rect x="30" y="90" width="140" height="90" fill={f} {...SEG} /> },
    { id: 'door', label: 'Door', labelX: 100, labelY: 148,
      renderPart: (f) => <rect x="80" y="120" width="40" height="60" rx="3" fill={f} {...SEG} /> },
    { id: 'win_l', label: 'Left Window', labelX: 55, labelY: 115,
      renderPart: (f) => <rect x="42" y="102" width="28" height="24" rx="2" fill={f} {...SEG} /> },
    { id: 'win_r', label: 'Right Window', labelX: 145, labelY: 115,
      renderPart: (f) => <rect x="130" y="102" width="28" height="24" rx="2" fill={f} {...SEG} /> },
    { id: 'chimney', label: 'Chimney', labelX: 152, labelY: 50,
      renderPart: (f) => <rect x="142" y="30" width="22" height="60" rx="2" fill={f} {...SEG} /> },
    { id: 'doorknob', label: 'Doorknob', labelX: 112, labelY: 152,
      renderPart: (f) => <circle cx="112" cy="152" r="4" fill={f} {...SEG} /> },
    { id: 'ground', label: 'Ground', labelX: 100, labelY: 188,
      renderPart: (f) => <rect x="5" y="180" width="190" height="16" rx="3" fill={f} {...SEG} /> },
  ],
};

/* ─── Car ─── */
const SEG_CAR: SegmentedObject = {
  id: 'seg_car', name: 'Car', emoji: '🚗', viewBox: '0 0 200 160',
  parts: [
    { id: 'body', label: 'Body', labelX: 100, labelY: 105,
      renderPart: (f) => <path d="M20,80 Q20,65 40,65 L160,65 Q180,65 180,80 L180,115 L20,115 Z" fill={f} {...SEG} /> },
    { id: 'cabin', label: 'Cabin', labelX: 100, labelY: 50,
      renderPart: (f) => <path d="M55,65 L68,30 L132,30 L145,65 Z" fill={f} {...SEG} /> },
    { id: 'window', label: 'Window', labelX: 100, labelY: 48,
      renderPart: (f) => <path d="M65,62 L75,35 L125,35 L135,62 Z" fill={f} {...SEG} /> },
    { id: 'wheel_f', label: 'Front Wheel', labelX: 55, labelY: 125,
      renderPart: (f) => <circle cx="55" cy="118" r="18" fill={f} {...SEG} /> },
    { id: 'wheel_b', label: 'Back Wheel', labelX: 145, labelY: 125,
      renderPart: (f) => <circle cx="145" cy="118" r="18" fill={f} {...SEG} /> },
    { id: 'headlight', label: 'Headlight', labelX: 15, labelY: 85,
      renderPart: (f) => <rect x="12" y="75" width="10" height="16" rx="3" fill={f} {...SEG} /> },
    { id: 'bumper', label: 'Bumper', labelX: 100, labelY: 130,
      renderPart: (f) => <rect x="15" y="113" width="170" height="8" rx="3" fill={f} {...SEG} /> },
  ],
};

/* ─── Robot ─── */
const SEG_ROBOT: SegmentedObject = {
  id: 'seg_robot', name: 'Robot', emoji: '🤖', viewBox: '0 0 200 200',
  parts: [
    { id: 'head', label: 'Head', labelX: 100, labelY: 35,
      renderPart: (f) => <rect x="60" y="15" width="80" height="50" rx="10" fill={f} {...SEG} /> },
    { id: 'body', label: 'Body', labelX: 100, labelY: 105,
      renderPart: (f) => <rect x="50" y="70" width="100" height="75" rx="8" fill={f} {...SEG} /> },
    { id: 'arm_l', label: 'Left Arm', labelX: 25, labelY: 100,
      renderPart: (f) => <rect x="12" y="75" width="32" height="50" rx="10" fill={f} {...SEG} /> },
    { id: 'arm_r', label: 'Right Arm', labelX: 175, labelY: 100,
      renderPart: (f) => <rect x="156" y="75" width="32" height="50" rx="10" fill={f} {...SEG} /> },
    { id: 'leg_l', label: 'Left Leg', labelX: 75, labelY: 168,
      renderPart: (f) => <rect x="60" y="148" width="32" height="45" rx="6" fill={f} {...SEG} /> },
    { id: 'leg_r', label: 'Right Leg', labelX: 125, labelY: 168,
      renderPart: (f) => <rect x="108" y="148" width="32" height="45" rx="6" fill={f} {...SEG} /> },
    { id: 'antenna', label: 'Antenna', labelX: 100, labelY: 8,
      renderPart: (f) => <><rect x="95" y="3" width="10" height="14" rx="5" fill={f} {...SEG} /><circle cx="100" cy="3" r="5" fill={f} {...SEG} /></> },
    { id: 'eye_l', label: 'Left Eye', labelX: 82, labelY: 38,
      renderPart: (f) => <circle cx="82" cy="38" r="10" fill={f} {...SEG} /> },
    { id: 'eye_r', label: 'Right Eye', labelX: 118, labelY: 38,
      renderPart: (f) => <circle cx="118" cy="38" r="10" fill={f} {...SEG} /> },
  ],
};

/* ─── Butterfly ─── */
const SEG_BUTTERFLY: SegmentedObject = {
  id: 'seg_butterfly', name: 'Butterfly', emoji: '🦋', viewBox: '0 0 200 180',
  parts: [
    { id: 'wing_tl', label: 'Top-Left Wing', labelX: 50, labelY: 50,
      renderPart: (f) => <ellipse cx="55" cy="55" rx="48" ry="35" transform="rotate(-15,55,55)" fill={f} {...SEG} /> },
    { id: 'wing_tr', label: 'Top-Right Wing', labelX: 150, labelY: 50,
      renderPart: (f) => <ellipse cx="145" cy="55" rx="48" ry="35" transform="rotate(15,145,55)" fill={f} {...SEG} /> },
    { id: 'wing_bl', label: 'Bottom-Left Wing', labelX: 55, labelY: 115,
      renderPart: (f) => <ellipse cx="60" cy="110" rx="38" ry="28" transform="rotate(-10,60,110)" fill={f} {...SEG} /> },
    { id: 'wing_br', label: 'Bottom-Right Wing', labelX: 145, labelY: 115,
      renderPart: (f) => <ellipse cx="140" cy="110" rx="38" ry="28" transform="rotate(10,140,110)" fill={f} {...SEG} /> },
    { id: 'body', label: 'Body', labelX: 100, labelY: 95,
      renderPart: (f) => <ellipse cx="100" cy="90" rx="8" ry="48" fill={f} {...SEG} /> },
    { id: 'head', label: 'Head', labelX: 100, labelY: 35,
      renderPart: (f) => <circle cx="100" cy="38" r="11" fill={f} {...SEG} /> },
    { id: 'ant_l', label: 'Left Antenna', labelX: 75, labelY: 18,
      renderPart: (f) => <path d="M95,38 Q70,8 58,18" fill="none" stroke={f} strokeWidth="3" strokeLinecap="round" /> },
    { id: 'ant_r', label: 'Right Antenna', labelX: 125, labelY: 18,
      renderPart: (f) => <path d="M105,38 Q130,8 142,18" fill="none" stroke={f} strokeWidth="3" strokeLinecap="round" /> },
  ],
};

/* ─── Rocket ─── */
const SEG_ROCKET: SegmentedObject = {
  id: 'seg_rocket', name: 'Rocket', emoji: '🚀', viewBox: '0 0 200 220',
  parts: [
    { id: 'nose', label: 'Nose Cone', labelX: 100, labelY: 35,
      renderPart: (f) => <polygon points="100,8 130,65 70,65" fill={f} {...SEG} /> },
    { id: 'body', label: 'Body', labelX: 100, labelY: 110,
      renderPart: (f) => <rect x="70" y="65" width="60" height="90" rx="4" fill={f} {...SEG} /> },
    { id: 'fin_l', label: 'Left Fin', labelX: 52, labelY: 155,
      renderPart: (f) => <polygon points="70,125 38,170 70,155" fill={f} {...SEG} /> },
    { id: 'fin_r', label: 'Right Fin', labelX: 148, labelY: 155,
      renderPart: (f) => <polygon points="130,125 162,170 130,155" fill={f} {...SEG} /> },
    { id: 'window', label: 'Window', labelX: 100, labelY: 95,
      renderPart: (f) => <circle cx="100" cy="95" r="14" fill={f} {...SEG} /> },
    { id: 'stripe', label: 'Stripe', labelX: 100, labelY: 130,
      renderPart: (f) => <rect x="70" y="125" width="60" height="12" fill={f} {...SEG} /> },
    { id: 'flame', label: 'Flame', labelX: 100, labelY: 185,
      renderPart: (f) => <path d="M75,155 Q88,195 100,210 Q112,195 125,155 Z" fill={f} {...SEG} /> },
  ],
};

/* ─── Castle ─── */
const SEG_CASTLE: SegmentedObject = {
  id: 'seg_castle', name: 'Castle', emoji: '🏰', viewBox: '0 0 200 200',
  parts: [
    { id: 'tower_l', label: 'Left Tower', labelX: 35, labelY: 100,
      renderPart: (f) => <><rect x="15" y="45" width="40" height="120" fill={f} {...SEG} />{[17,30,43].map(x=><rect key={x} x={x} y="35" width="10" height="14" fill={f} {...SEG} />)}</> },
    { id: 'tower_r', label: 'Right Tower', labelX: 165, labelY: 100,
      renderPart: (f) => <><rect x="145" y="45" width="40" height="120" fill={f} {...SEG} />{[147,160,173].map(x=><rect key={x} x={x} y="35" width="10" height="14" fill={f} {...SEG} />)}</> },
    { id: 'wall', label: 'Wall', labelX: 100, labelY: 110,
      renderPart: (f) => <rect x="55" y="75" width="90" height="90" fill={f} {...SEG} /> },
    { id: 'gate', label: 'Gate', labelX: 100, labelY: 145,
      renderPart: (f) => <path d="M80,165 L80,125 Q100,100 120,125 L120,165 Z" fill={f} {...SEG} /> },
    { id: 'flag', label: 'Flag', labelX: 175, labelY: 22,
      renderPart: (f) => <><line x1="165" y1="15" x2="165" y2="48" stroke="#334155" strokeWidth="2.5" /><polygon points="165,15 192,22 192,36 165,28" fill={f} {...SEG} /></> },
    { id: 'win_l', label: 'Left Window', labelX: 75, labelY: 98,
      renderPart: (f) => <rect x="68" y="90" width="15" height="18" rx="2" fill={f} {...SEG} /> },
    { id: 'win_r', label: 'Right Window', labelX: 125, labelY: 98,
      renderPart: (f) => <rect x="118" y="90" width="15" height="18" rx="2" fill={f} {...SEG} /> },
    { id: 'battlement', label: 'Top Wall', labelX: 100, labelY: 72,
      renderPart: (f) => <>{[58,72,86,100,114,128].map(x=><rect key={x} x={x} y="65" width="10" height="14" fill={f} {...SEG} />)}</> },
  ],
};

/* ─── Train ─── */
const SEG_TRAIN: SegmentedObject = {
  id: 'seg_train', name: 'Train', emoji: '🚂', viewBox: '0 0 220 160',
  parts: [
    { id: 'cabin', label: 'Cabin', labelX: 50, labelY: 80,
      renderPart: (f) => <rect x="25" y="45" width="55" height="80" rx="4" fill={f} {...SEG} /> },
    { id: 'body', label: 'Body', labelX: 130, labelY: 90,
      renderPart: (f) => <rect x="80" y="65" width="100" height="60" rx="4" fill={f} {...SEG} /> },
    { id: 'smokestack', label: 'Smokestack', labelX: 160, labelY: 45,
      renderPart: (f) => <><rect x="152" y="38" width="18" height="28" rx="3" fill={f} {...SEG} /><ellipse cx="161" cy="35" rx="12" ry="5" fill={f} {...SEG} /></> },
    { id: 'window', label: 'Window', labelX: 52, labelY: 68,
      renderPart: (f) => <rect x="35" y="55" width="35" height="25" rx="4" fill={f} {...SEG} /> },
    { id: 'wheel_1', label: 'Wheel 1', labelX: 50, labelY: 138,
      renderPart: (f) => <circle cx="50" cy="132" r="14" fill={f} {...SEG} /> },
    { id: 'wheel_2', label: 'Wheel 2', labelX: 110, labelY: 138,
      renderPart: (f) => <circle cx="110" cy="132" r="14" fill={f} {...SEG} /> },
    { id: 'wheel_3', label: 'Wheel 3', labelX: 160, labelY: 138,
      renderPart: (f) => <circle cx="160" cy="132" r="14" fill={f} {...SEG} /> },
  ],
};

/* ─── Flower ─── */
const SEG_FLOWER: SegmentedObject = {
  id: 'seg_flower', name: 'Flower', emoji: '🌸', viewBox: '0 0 200 220',
  parts: [
    { id: 'center', label: 'Center', labelX: 100, labelY: 75,
      renderPart: (f) => <circle cx="100" cy="75" r="18" fill={f} {...SEG} /> },
    { id: 'petal_1', label: 'Top Petal', labelX: 100, labelY: 38,
      renderPart: (f) => <ellipse cx="100" cy="42" rx="16" ry="25" fill={f} {...SEG} /> },
    { id: 'petal_2', label: 'Right Petal', labelX: 132, labelY: 58,
      renderPart: (f) => <ellipse cx="130" cy="60" rx="16" ry="25" transform="rotate(72,130,60)" fill={f} {...SEG} /> },
    { id: 'petal_3', label: 'Bottom-Right Petal', labelX: 122, labelY: 98,
      renderPart: (f) => <ellipse cx="118" cy="98" rx="16" ry="25" transform="rotate(144,118,98)" fill={f} {...SEG} /> },
    { id: 'petal_4', label: 'Bottom-Left Petal', labelX: 78, labelY: 98,
      renderPart: (f) => <ellipse cx="82" cy="98" rx="16" ry="25" transform="rotate(216,82,98)" fill={f} {...SEG} /> },
    { id: 'petal_5', label: 'Left Petal', labelX: 68, labelY: 58,
      renderPart: (f) => <ellipse cx="70" cy="60" rx="16" ry="25" transform="rotate(288,70,60)" fill={f} {...SEG} /> },
    { id: 'stem', label: 'Stem', labelX: 100, labelY: 150,
      renderPart: (f) => <rect x="96" y="100" width="8" height="100" rx="3" fill={f} {...SEG} /> },
    { id: 'leaf_l', label: 'Left Leaf', labelX: 75, labelY: 148,
      renderPart: (f) => <path d="M96,148 Q60,125 80,105" fill={f} {...SEG} /> },
    { id: 'leaf_r', label: 'Right Leaf', labelX: 125, labelY: 158,
      renderPart: (f) => <path d="M104,158 Q140,135 120,115" fill={f} {...SEG} /> },
  ],
};

/** All segmented objects */
export const SEGMENTED_OBJECTS: SegmentedObject[] = [
  SEG_HOUSE, SEG_CAR, SEG_ROBOT, SEG_BUTTERFLY,
  SEG_ROCKET, SEG_CASTLE, SEG_TRAIN, SEG_FLOWER,
];

/** Get a segmented object by ID */
export function getSegmentedObject(id: string): SegmentedObject | undefined {
  return SEGMENTED_OBJECTS.find(o => o.id === id);
}

