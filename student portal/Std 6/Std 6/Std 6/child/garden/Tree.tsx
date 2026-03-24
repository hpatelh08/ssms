/**
 * garden/Tree.tsx
 * ──────────────────────────────────────────────────
 * Layered Tree with:
 *  - trunk (brown gradient)
 *  - 3 canopy layers (bottom / mid / top) as rounded shapes
 *  - fruit anchor containers positioned over each canopy layer
 *  - golden star on stage 4
 *  - 12 twinkling fairy lights
 *  - subtle CSS sway animation
 *  - small flowers near trunk base at higher growth
 *
 * Canopy layers are positioned <div> containers —
 * <Fruit /> components render INSIDE them via anchor coords.
 *
 * Performance: React.memo, CSS transform/opacity only, <80 DOM nodes.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Fruit, type FruitData } from './Fruit';

/* ── Types ───────────────────────────────────── */

export interface TreeProps {
  /** 1-4 growth stage (controls tiers + features) */
  stage: number;
  /** XP-based level (controls flowers near trunk) */
  level: number;
  /** Active fruits to render inside canopy layers */
  fruits: FruitData[];
  /** Clicked a fruit */
  onFruitClick: (fruit: FruitData, rect: DOMRect | null) => void;
  /** Canopy glow pulse (after watering) */
  glowing?: boolean;
  /** Extra sway (sun interaction) */
  swayBoost?: boolean;
}

/* ── Fairy-light positions ───────────────────── */

const FAIRY_LIGHTS = [
  { cx: 78, cy: 232, color: '#ef4444' },
  { cx: 172, cy: 232, color: '#fbbf24' },
  { cx: 52, cy: 266, color: '#22c55e' },
  { cx: 198, cy: 266, color: '#3b82f6' },
  { cx: 125, cy: 280, color: '#ec4899' },
  { cx: 88, cy: 152, color: '#8b5cf6' },
  { cx: 162, cy: 152, color: '#f97316' },
  { cx: 68, cy: 192, color: '#fbbf24' },
  { cx: 182, cy: 192, color: '#ef4444' },
  { cx: 98, cy: 82, color: '#22c55e' },
  { cx: 152, cy: 82, color: '#ec4899' },
  { cx: 125, cy: 52, color: '#60a5fa' },
];

/* ── Component ───────────────────────────────── */

export const Tree: React.FC<TreeProps> = React.memo(({
  stage, level, fruits, onFruitClick, glowing = false, swayBoost = false,
}) => {
  /* Fairy-light twinkle */
  const [litLights, setLitLights] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (stage < 2) return;
    const iv = setInterval(() => {
      setLitLights(() => {
        const s = new Set<number>();
        FAIRY_LIGHTS.forEach((_, i) => { if (Math.random() > 0.4) s.add(i); });
        return s;
      });
    }, 600);
    return () => clearInterval(iv);
  }, [stage]);

  /* Scale the visible tree by stage */
  const treeScale = [0.55, 0.72, 0.87, 1.0][Math.min(stage, 4) - 1] ?? 0.55;

  /* Split fruits by layer */
  const fruitsByLayer = useMemo(() => {
    const layers: [FruitData[], FruitData[], FruitData[]] = [[], [], []];
    fruits.forEach(f => {
      if (f.layer >= 0 && f.layer <= 2) layers[f.layer].push(f);
    });
    return layers;
  }, [fruits]);

  /* Small flowers near trunk base (XP level driven) */
  const groundFlowers = useMemo(() => {
    if (level < 2) return [];
    const count = Math.min(level - 1, 5);
    const flowers: Array<{ x: number; emoji: string; delay: number }> = [];
    const emojis = ['\uD83C\uDF3C', '\uD83C\uDF3B', '\uD83C\uDF37', '\uD83C\uDF3A', '\uD83C\uDF38'];
    for (let i = 0; i < count; i++) {
      flowers.push({
        x: 35 + i * 8 - (count * 4),
        emoji: emojis[i % emojis.length],
        delay: i * 0.12,
      });
    }
    return flowers;
  }, [level]);

  return (
    <div
      className={`garden-tree-sway ${swayBoost ? 'garden-tree-sway-boost' : ''}`}
      style={{
        position: 'relative',
        width: 280,
        height: 400,
        transformOrigin: 'bottom center',
        transform: `scale(${treeScale})`,
        transition: 'transform 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        willChange: 'transform',
      }}
    >
      {/* ─── SVG Tree Structure ─────────────────── */}
      <svg
        viewBox="0 0 250 380"
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        <defs>
          {/* Canopy gradients */}
          <radialGradient id="gcBot" cx="30%" cy="30%" r="70%">
            <stop offset="0%"  stopColor="#baf5cc" />
            <stop offset="45%" stopColor="#a2e4b8" />
            <stop offset="100%" stopColor="#7fe0a5" />
          </radialGradient>
          <radialGradient id="gcMid" cx="30%" cy="30%" r="70%">
            <stop offset="0%"  stopColor="#c8fada" />
            <stop offset="45%" stopColor="#a8ecc2" />
            <stop offset="100%" stopColor="#7fe0a5" />
          </radialGradient>
          <radialGradient id="gcTop" cx="30%" cy="30%" r="70%">
            <stop offset="0%"  stopColor="#d7f8e8" />
            <stop offset="45%" stopColor="#bdecc6" />
            <stop offset="100%" stopColor="#96e8b0" />
          </radialGradient>
          {/* Inner highlight overlay (white glow at top-left) */}
          <radialGradient id="gcHighlight" cx="25%" cy="20%" r="50%">
            <stop offset="0%"  stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          {/* Depth overlay */}
          <linearGradient id="gcTierShadow" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%"  stopColor="#22c55e" stopOpacity="0" />
            <stop offset="70%" stopColor="#22c55e" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.15" />
          </linearGradient>
          {/* Trunk */}
          <linearGradient id="gTrunk" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#c9873a" />
            <stop offset="18%" stopColor="#b87a30" />
            <stop offset="45%" stopColor="#a86d28" />
            <stop offset="75%" stopColor="#966020" />
            <stop offset="100%" stopColor="#7a4e18" />
          </linearGradient>
          {/* Star */}
          <radialGradient id="gStar" cx="40%" cy="35%">
            <stop offset="0%"  stopColor="#fef08a" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>

        {/* TRUNK */}
        <rect x={108} y={270} width={34} height={75} rx={8} fill="url(#gTrunk)" />
        <rect x={110} y={273} width={5} height={70} rx={3} fill="white" opacity={0.08} />

        {/* BOTTOM CANOPY (always visible) */}
        <path
          d="M125,175 L214,273 Q224,283 209,283 L41,283 Q26,283 36,273 Z"
          fill="url(#gcBot)" stroke="rgba(134,239,172,0.35)" strokeWidth={1.5}
          className={glowing ? 'garden-canopy-glow' : ''}
        />
        <path
          d="M125,175 L214,273 Q224,283 209,283 L41,283 Q26,283 36,273 Z"
          fill="url(#gcHighlight)"
        />
        <path
          d="M125,175 L214,273 Q224,283 209,283 L41,283 Q26,283 36,273 Z"
          fill="url(#gcTierShadow)"
        />

        {/* MID CANOPY (stage 2+) */}
        {stage >= 2 && (
          <>
            <path
              d="M125,100 L196,193 Q206,203 191,203 L59,203 Q44,203 54,193 Z"
              fill="url(#gcMid)" stroke="rgba(134,239,172,0.35)" strokeWidth={1.5}
              className={glowing ? 'garden-canopy-glow' : ''}
            />
            <path
              d="M125,100 L196,193 Q206,203 191,203 L59,203 Q44,203 54,193 Z"
              fill="url(#gcHighlight)"
            />
            <path
              d="M125,100 L196,193 Q206,203 191,203 L59,203 Q44,203 54,193 Z"
              fill="url(#gcTierShadow)"
            />
          </>
        )}

        {/* TOP CANOPY (stage 3+) */}
        {stage >= 3 && (
          <>
            <path
              d="M125,32 L178,123 Q186,133 173,133 L77,133 Q64,133 72,123 Z"
              fill="url(#gcTop)" stroke="rgba(134,239,172,0.35)" strokeWidth={1.5}
              className={glowing ? 'garden-canopy-glow' : ''}
            />
            <path
              d="M125,32 L178,123 Q186,133 173,133 L77,133 Q64,133 72,123 Z"
              fill="url(#gcHighlight)"
            />
            <path
              d="M125,32 L178,123 Q186,133 173,133 L77,133 Q64,133 72,123 Z"
              fill="url(#gcTierShadow)"
            />
          </>
        )}

        {/* GOLDEN STAR (stage 4) */}
        {stage >= 4 && (
          <g className="garden-star-pulse" style={{ transformOrigin: '125px 18px' }}>
            <polygon
              points={Array.from({ length: 10 }, (_, i) => {
                const r = i % 2 === 0 ? 14 : 6;
                const a = (i * 36 - 90) * Math.PI / 180;
                return `${125 + r * Math.cos(a)},${18 + r * Math.sin(a)}`;
              }).join(' ')}
              fill="url(#gStar)" stroke="#f59e0b" strokeWidth={0.8}
            />
            <circle cx={122} cy={14} r={3} fill="white" opacity={0.35} />
          </g>
        )}

        {/* FAIRY LIGHTS (stage 2+) */}
        {stage >= 2 && FAIRY_LIGHTS.map((light, i) => {
          const lit = litLights.has(i);
          return (
            <circle
              key={`fl-${i}`}
              cx={light.cx} cy={light.cy}
              r={lit ? 4 : 2.5}
              fill={light.color}
              opacity={lit ? 0.95 : 0.25}
              style={{ transition: 'r 0.3s ease, opacity 0.3s ease' }}
            />
          );
        })}

        {/* Ground shadow under tree (soft grounding) */}
        <ellipse cx={125} cy={350} rx={90} ry={10} fill="#2d6a2d" opacity={0.08} />
        <ellipse cx={125} cy={348} rx={60} ry={6} fill="#1a3a1a" opacity={0.05} />
      </svg>

      {/* ─── CANOPY FRUIT CONTAINERS ───────────── */}
      {/* These are positioned ON TOP of the SVG canopy shapes.   */}
      {/* Fruits are absolutely positioned INSIDE these divs.     */}

      {/* Layer 2 — Bottom canopy */}
      <div style={canopyStyle.bottom}>
        {fruitsByLayer[2].map(f => (
          <Fruit key={f.id} fruit={f} onClick={onFruitClick} />
        ))}
      </div>

      {/* Layer 1 — Mid canopy (stage 2+) */}
      {stage >= 2 && (
        <div style={canopyStyle.mid}>
          {fruitsByLayer[1].map(f => (
            <Fruit key={f.id} fruit={f} onClick={onFruitClick} />
          ))}
        </div>
      )}

      {/* Layer 0 — Top canopy (stage 3+) */}
      {stage >= 3 && (
        <div style={canopyStyle.top}>
          {fruitsByLayer[0].map(f => (
            <Fruit key={f.id} fruit={f} onClick={onFruitClick} />
          ))}
        </div>
      )}

      {/* ─── Ground flowers near trunk ──────────── */}
      {groundFlowers.map((fl, i) => (
        <span
          key={`gfl-${i}`}
          className="garden-ground-flower"
          style={{
            position: 'absolute',
            bottom: '4%',
            left: `${fl.x}%`,
            fontSize: 18,
            animationDelay: `${fl.delay}s`,
            pointerEvents: 'none',
          }}
        >
          {fl.emoji}
        </span>
      ))}
    </div>
  );
});

Tree.displayName = 'Tree';

/* ── Canopy overlay styles ────────────────────── */
/* These divs sit EXACTLY over the SVG canopy paths */

const canopyStyle: Record<string, React.CSSProperties> = {
  bottom: {
    position: 'absolute',
    /* maps to SVG bottom-canopy bounding box (viewBox coords → %) */
    left: '10%',
    top: '46%',
    width: '80%',
    height: '30%',
    pointerEvents: 'none',
  },
  mid: {
    position: 'absolute',
    left: '17%',
    top: '26%',
    width: '66%',
    height: '28%',
    pointerEvents: 'none',
  },
  top: {
    position: 'absolute',
    left: '24%',
    top: '8%',
    width: '52%',
    height: '27%',
    pointerEvents: 'none',
  },
};

/* ── CSS ─────────────────────────────────────── */

export const TREE_CSS = `
/* Subtle sway */
@keyframes gardenTreeSway {
  0%, 100% { transform: rotate(0deg); }
  25%      { transform: rotate(0.4deg); }
  75%      { transform: rotate(-0.4deg); }
}
.garden-tree-sway {
  animation: gardenTreeSway 6s ease-in-out infinite;
  transform-origin: bottom center;
}

/* Boosted sway (sun interaction) */
@keyframes gardenTreeSwayBoost {
  0%, 100% { transform: rotate(0deg); }
  25%      { transform: rotate(1deg); }
  75%      { transform: rotate(-1deg); }
}
.garden-tree-sway-boost {
  animation: gardenTreeSwayBoost 3s ease-in-out infinite !important;
}

/* Canopy glow pulse (after watering) */
@keyframes gardenCanopyGlow {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.82; }
}
.garden-canopy-glow {
  animation: gardenCanopyGlow 1.5s ease-in-out 3;
}

/* Star pulse */
@keyframes gardenStarPulse {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50%      { transform: scale(1.12) rotate(8deg); }
}
.garden-star-pulse {
  animation: gardenStarPulse 2.2s ease-in-out infinite;
}

/* Ground flowers bloom */
@keyframes gardenGroundFlower {
  0%   { transform: scale(0) translateY(4px); opacity: 0; }
  60%  { transform: scale(1.15) translateY(-1px); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
.garden-ground-flower {
  animation: gardenGroundFlower 0.5s ease both;
  display: inline-block;
}

/* Leaf shimmer (applied to canopy paths optionally) */
@keyframes gardenLeafShimmer {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.92; }
}
`;
