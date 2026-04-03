/**
 * garden/Tree.tsx
 * ──────────────────────────────────────────────────
 * Layered Tree with 6 growth stages:
 *  - Stage 1: Seedling — small trunk + 1 canopy
 *  - Stage 2: Sapling — trunk + 2 canopy layers + fairy lights
 *  - Stage 3: Young — 3 canopy tiers + ground flowers
 *  - Stage 4: Mature — full canopy + golden star + mushrooms
 *  - Stage 5: Grand — hanging vines + squirrel + firefly lights
 *  - Stage 6: Magical — crown glow + owl + sparkling aura
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
  /** 1-6 growth stage (controls tiers + features) */
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
  { cx: 88, cy: 152, color: '#5f8b3d' },
  { cx: 162, cy: 152, color: '#f97316' },
  { cx: 68, cy: 192, color: '#fbbf24' },
  { cx: 182, cy: 192, color: '#ef4444' },
  { cx: 98, cy: 82, color: '#22c55e' },
  { cx: 152, cy: 82, color: '#ec4899' },
  { cx: 125, cy: 52, color: '#60a5fa' },
  { cx: 110, cy: 120, color: '#a7c97f' },
  { cx: 140, cy: 120, color: '#fb923c' },
  { cx: 75, cy: 210, color: '#34d399' },
  { cx: 175, cy: 210, color: '#f472b6' },
];

/* ── Garden creatures positions ──────────────── */

const MUSHROOM_POSITIONS = [
  { x: 40, y: 338, size: 16, color: '#ef4444', spots: '#fecaca' },
  { x: 195, y: 342, size: 14, color: '#f59e0b', spots: '#fef3c7' },
  { x: 60, y: 345, size: 12, color: '#5f8b3d', spots: '#ede9fe' },
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

  /* Scale the visible tree by stage (6 stages now) */
  const treeScale = [0.5, 0.62, 0.75, 0.87, 0.94, 1.0][Math.min(stage, 6) - 1] ?? 0.5;

  /* Clamped stage for rendering */
  const s = Math.min(stage, 6);

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
    const count = Math.min(level, 8);
    const flowers: Array<{ x: number; emoji: string; delay: number }> = [];
    const emojis = ['\uD83C\uDF3C', '\uD83C\uDF3B', '\uD83C\uDF37', '\uD83C\uDF3A', '\uD83C\uDF38', '\uD83C\uDF39', '\uD83C\uDFF5\uFE0F', '\uD83C\uDF3C'];
    for (let i = 0; i < count; i++) {
      flowers.push({
        x: 20 + i * 9 - (count * 3),
        emoji: emojis[i % emojis.length],
        delay: i * 0.1,
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

        {/* GOLDEN STAR (stage 4+) */}
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
        {stage >= 2 && FAIRY_LIGHTS.slice(0, stage >= 5 ? 16 : 12).map((light, i) => {
          const lit = litLights.has(i);
          return (
            <circle
              key={`fl-${i}`}
              cx={light.cx} cy={light.cy}
              r={lit ? (s >= 5 ? 5 : 4) : 2.5}
              fill={light.color}
              opacity={lit ? 0.95 : 0.25}
              style={{ transition: 'r 0.3s ease, opacity 0.3s ease' }}
            />
          );
        })}

        {/* MUSHROOMS (stage 4+) */}
        {s >= 4 && MUSHROOM_POSITIONS.slice(0, s >= 5 ? 3 : 1).map((m, i) => (
          <g key={`mush-${i}`} className="garden-mushroom-grow" style={{ animationDelay: `${i * 0.2}s` }}>
            {/* stem */}
            <rect x={m.x - 3} y={m.y - 4} width={6} height={10} rx={2}
              fill="#f0e6d2" />
            {/* cap */}
            <ellipse cx={m.x} cy={m.y - 6} rx={m.size / 2} ry={m.size / 2.5}
              fill={m.color} />
            {/* spots */}
            <circle cx={m.x - 3} cy={m.y - 8} r={1.5} fill={m.spots} opacity={0.8} />
            <circle cx={m.x + 2} cy={m.y - 7} r={1} fill={m.spots} opacity={0.6} />
          </g>
        ))}

        {/* HANGING VINES (stage 5+) */}
        {s >= 5 && (
          <>
            <path d="M60 250 Q55 280 65 310" fill="none" stroke="#4ade80" strokeWidth={1.5}
              opacity={0.5} className="garden-vine-sway" />
            <path d="M190 240 Q195 270 185 300" fill="none" stroke="#22c55e" strokeWidth={1.5}
              opacity={0.5} className="garden-vine-sway" style={{ animationDelay: '0.5s' }} />
            <path d="M75 160 Q68 185 80 210" fill="none" stroke="#4ade80" strokeWidth={1.2}
              opacity={0.4} className="garden-vine-sway" style={{ animationDelay: '1s' }} />
            {/* vine leaves */}
            <circle cx={65} cy={310} r={3} fill="#4ade80" opacity={0.6} />
            <circle cx={185} cy={300} r={3} fill="#22c55e" opacity={0.6} />
            <circle cx={80} cy={210} r={2.5} fill="#4ade80" opacity={0.5} />
          </>
        )}

        {/* SQUIRREL (stage 5+) */}
        {s >= 5 && (
          <g className="garden-squirrel-idle" style={{ transformOrigin: '200px 260px' }}>
            {/* body */}
            <ellipse cx={200} cy={265} rx={8} ry={10} fill="#d97706" />
            {/* head */}
            <circle cx={204} cy={254} r={6} fill="#f59e0b" />
            {/* ear */}
            <ellipse cx={208} cy={249} rx={2} ry={3} fill="#d97706" />
            {/* eye */}
            <circle cx={206} cy={253} r={1.5} fill="#1e293b" />
            <circle cx={206.5} cy={252.5} r={0.5} fill="white" />
            {/* tail */}
            <path d="M194 262 Q182 248 190 240 Q198 235 196 255" fill="#f59e0b" opacity={0.9} />
            {/* acorn */}
            <circle cx={210} cy={260} r={2.5} fill="#92400e" />
            <ellipse cx={210} cy={258} rx={2.8} ry={1.5} fill="#78350f" />
          </g>
        )}

        {/* OWL (stage 6 — magical) */}
        {s >= 6 && (
          <g className="garden-owl-blink" style={{ transformOrigin: '50px 165px' }}>
            {/* body */}
            <ellipse cx={50} cy={170} rx={10} ry={13} fill="#78716c" />
            {/* head */}
            <circle cx={50} cy={157} r={8} fill="#a8a29e" />
            {/* ears */}
            <path d="M43 150 L45 143 L48 150" fill="#78716c" />
            <path d="M52 150 L55 143 L57 150" fill="#78716c" />
            {/* eyes */}
            <circle cx={47} cy={156} r={3} fill="#fef3c7" />
            <circle cx={53} cy={156} r={3} fill="#fef3c7" />
            <circle cx={47} cy={156} r={1.5} fill="#1e293b" />
            <circle cx={53} cy={156} r={1.5} fill="#1e293b" />
            {/* beak */}
            <polygon points="49,159 50,162 51,159" fill="#f59e0b" />
            {/* wing */}
            <path d="M40 168 Q34 175 40 182" fill="#57534e" />
          </g>
        )}

        {/* MAGICAL AURA (stage 6) */}
        {s >= 6 && (
          <>
            <circle cx={125} cy={180} r={120} fill="none"
              stroke="url(#gStar)" strokeWidth={2} opacity={0.15}
              className="garden-aura-pulse" />
            <circle cx={125} cy={180} r={100} fill="none"
              stroke="#a7c97f" strokeWidth={1.5} opacity={0.1}
              className="garden-aura-pulse" style={{ animationDelay: '0.5s' }} />
          </>
        )}

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

/* Leaf shimmer */
@keyframes gardenLeafShimmer {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.92; }
}

/* Mushroom grow-in */
@keyframes gardenMushroomGrow {
  0%   { transform: scale(0) translateY(5px); opacity: 0; }
  60%  { transform: scale(1.2) translateY(-2px); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
.garden-mushroom-grow {
  animation: gardenMushroomGrow 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
}

/* Vine sway */
@keyframes gardenVineSway {
  0%, 100% { transform: rotate(0deg); }
  50%      { transform: rotate(2deg); }
}
.garden-vine-sway {
  animation: gardenVineSway 4s ease-in-out infinite;
  transform-origin: top center;
}

/* Squirrel idle */
@keyframes gardenSquirrelIdle {
  0%, 100% { transform: translateY(0); }
  40%      { transform: translateY(-2px); }
  70%      { transform: translateY(1px); }
}
.garden-squirrel-idle {
  animation: gardenSquirrelIdle 3s ease-in-out infinite;
}

/* Owl blink */
@keyframes gardenOwlBlink {
  0%, 90%, 100% { transform: scaleY(1); }
  93%            { transform: scaleY(0.1); }
  96%            { transform: scaleY(1); }
}
.garden-owl-blink {
  animation: gardenOwlBlink 5s ease-in-out infinite;
}

/* Magical aura pulse */
@keyframes gardenAuraPulse {
  0%, 100% { transform: scale(1); opacity: 0.1; }
  50%      { transform: scale(1.05); opacity: 0.2; }
}
.garden-aura-pulse {
  animation: gardenAuraPulse 3s ease-in-out infinite;
}
`;
