/**
 * 🌳 AnimatedTree — Premium SVG Tree Component
 * ────────────────────────────────────────────────────
 * Renders a living, animated SVG tree that grows
 * through 6 stages based on tree state.
 *
 * Visual effects (CSS keyframes only):
 *   • Height transition on stage change
 *   • Sparkle burst on level-up
 *   • Rain overlay when watering
 *   • Floating butterflies when happiness > 80
 *   • Gentle sway animation always
 *   • Moving clouds in background
 *
 * Performance: React.memo, useMemo, CSS transforms only.
 */

import React, { useMemo } from 'react';
import type { TreeStage } from '../../utils/treeEngine';

/* ── Stage → Tree dimensions ─────────────────────── */

interface StageDims {
  trunkH: number;
  trunkW: number;
  crownRx: number;
  crownRy: number;
  crownCy: number;
  leafCount: number;
  flowerCount: number;
  fruitCount: number;
  crownFill: string;
  trunkFill: string;
}

const STAGE_DIMS: Record<TreeStage, StageDims> = {
  seed:      { trunkH: 0,   trunkW: 0,  crownRx: 0,  crownRy: 0,  crownCy: 230, leafCount: 0,  flowerCount: 0, fruitCount: 0,  crownFill: '#92400e', trunkFill: '#78350f' },
  sprout:    { trunkH: 30,  trunkW: 5,  crownRx: 14, crownRy: 12, crownCy: 195, leafCount: 4,  flowerCount: 0, fruitCount: 0,  crownFill: '#86efac', trunkFill: '#a3e635' },
  plant:     { trunkH: 55,  trunkW: 8,  crownRx: 28, crownRy: 24, crownCy: 170, leafCount: 10, flowerCount: 0, fruitCount: 0,  crownFill: '#4ade80', trunkFill: '#65a30d' },
  young:     { trunkH: 80,  trunkW: 12, crownRx: 45, crownRy: 38, crownCy: 145, leafCount: 18, flowerCount: 0, fruitCount: 0,  crownFill: '#22c55e', trunkFill: '#92400e' },
  flowering: { trunkH: 100, trunkW: 16, crownRx: 58, crownRy: 48, crownCy: 122, leafCount: 24, flowerCount: 8, fruitCount: 0,  crownFill: '#16a34a', trunkFill: '#92400e' },
  fruit:     { trunkH: 115, trunkW: 20, crownRx: 68, crownRy: 56, crownCy: 105, leafCount: 30, flowerCount: 6, fruitCount: 10, crownFill: '#15803d', trunkFill: '#92400e' },
};

/* ── Deterministic placement (golden angle spiral) ── */

function spiralPoints(cx: number, cy: number, rx: number, ry: number, n: number, shrink = 0.82): Array<[number, number]> {
  if (n === 0) return [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt((i + 0.5) / n) * shrink;
    const theta = i * golden;
    pts.push([
      cx + r * rx * Math.cos(theta),
      cy + r * ry * Math.sin(theta),
    ]);
  }
  return pts;
}

/* ── Color palettes ──────────────────────────────── */

const LEAF_COLORS = ['#22c55e', '#16a34a', '#4ade80', '#15803d', '#86efac', '#bbf7d0'];
const FLOWER_COLORS = ['#f472b6', '#fb923c', '#a78bfa', '#facc15', '#f87171', '#38bdf8', '#e879f9', '#34d399'];
const FRUIT_COLORS = ['#ef4444', '#f59e0b', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4'];

/* ── Sub-components ──────────────────────────────── */

const TreeLeaf: React.FC<{ cx: number; cy: number; idx: number }> = React.memo(({ cx, cy, idx }) => (
  <ellipse
    cx={cx} cy={cy} rx={4} ry={2.5}
    fill={LEAF_COLORS[idx % LEAF_COLORS.length]}
    opacity={0.65 + (idx % 3) * 0.12}
    transform={`rotate(${(idx * 43) % 360} ${cx} ${cy})`}
  />
));
TreeLeaf.displayName = 'TreeLeaf';

const TreeFlower: React.FC<{ cx: number; cy: number; idx: number }> = React.memo(({ cx, cy, idx }) => {
  const color = FLOWER_COLORS[idx % FLOWER_COLORS.length];
  return (
    <g>
      {Array.from({ length: 5 }, (_, p) => {
        const a = (p * 72) * Math.PI / 180;
        return <circle key={p} cx={cx + 3.5 * Math.cos(a)} cy={cy + 3.5 * Math.sin(a)} r={2.2} fill={color} opacity={0.85} />;
      })}
      <circle cx={cx} cy={cy} r={2} fill="#fef08a" />
    </g>
  );
});
TreeFlower.displayName = 'TreeFlower';

const TreeFruit: React.FC<{ cx: number; cy: number; idx: number }> = React.memo(({ cx, cy, idx }) => (
  <g>
    <circle cx={cx} cy={cy} r={4.5} fill={FRUIT_COLORS[idx % FRUIT_COLORS.length]} />
    <circle cx={cx - 1.2} cy={cy - 1.5} r={1.4} fill="rgba(255,255,255,0.35)" />
    <line x1={cx} y1={cy - 4.5} x2={cx + 0.5} y2={cy - 7} stroke="#78350f" strokeWidth={0.9} strokeLinecap="round" />
  </g>
));
TreeFruit.displayName = 'TreeFruit';

/* ── Seed SVG ────────────────────────────────────── */

const SeedSVG: React.FC = React.memo(() => (
  <g>
    <ellipse cx={150} cy={232} rx={12} ry={8} fill="#92400e" opacity={0.8} />
    <ellipse cx={150} cy={232} rx={8} ry={5} fill="#a16207" opacity={0.5} />
    <text x={150} y={216} textAnchor="middle" fontSize={10} opacity={0.6} style={{ animation: 'atFloat 3s ease-in-out infinite' }}>
      {'🌰'}
    </text>
  </g>
));
SeedSVG.displayName = 'SeedSVG';

/* ── Cloud layer ─────────────────────────────────── */

const Clouds: React.FC = React.memo(() => (
  <g opacity={0.4}>
    <ellipse cx={40} cy={35} rx={22} ry={10} fill="#fff" style={{ animation: 'atCloudDrift 18s linear infinite' }} />
    <ellipse cx={55} cy={30} rx={16} ry={8} fill="#fff" style={{ animation: 'atCloudDrift 18s linear infinite' }} />
    <ellipse cx={220} cy={50} rx={20} ry={9} fill="#fff" style={{ animation: 'atCloudDrift2 22s linear infinite' }} />
    <ellipse cx={240} cy={45} rx={15} ry={7} fill="#fff" style={{ animation: 'atCloudDrift2 22s linear infinite' }} />
  </g>
));
Clouds.displayName = 'Clouds';

/* ── Butterflies (when happiness > 80) ───────────── */

const Butterflies: React.FC = React.memo(() => (
  <g>
    {[
      { x: 80, y: 100, delay: '0s', color: '#f472b6' },
      { x: 200, y: 130, delay: '1.5s', color: '#a78bfa' },
      { x: 140, y: 80, delay: '3s', color: '#fbbf24' },
    ].map((b, i) => (
      <g key={i} style={{ animation: `atButterflyFloat 4s ease-in-out ${b.delay} infinite` }}>
        {/* Left wing */}
        <ellipse cx={b.x - 3} cy={b.y} rx={4} ry={3} fill={b.color} opacity={0.7}
          style={{ animation: `atWingFlap 0.4s ease-in-out ${b.delay} infinite alternate`, transformOrigin: `${b.x}px ${b.y}px` }} />
        {/* Right wing */}
        <ellipse cx={b.x + 3} cy={b.y} rx={4} ry={3} fill={b.color} opacity={0.7}
          style={{ animation: `atWingFlap 0.4s ease-in-out ${b.delay} infinite alternate-reverse`, transformOrigin: `${b.x}px ${b.y}px` }} />
        {/* Body */}
        <ellipse cx={b.x} cy={b.y} rx={1} ry={2.5} fill="#374151" />
      </g>
    ))}
  </g>
));
Butterflies.displayName = 'Butterflies';

/* ── Rain overlay (when watering) ────────────────── */

const RainEffect: React.FC = React.memo(() => (
  <g>
    {Array.from({ length: 15 }, (_, i) => {
      const x = 20 + (i * 19) % 260;
      const delay = (i * 0.15) % 1.2;
      return (
        <line key={i}
          x1={x} y1={-5} x2={x - 2} y2={10}
          stroke="#93c5fd" strokeWidth={1.5} strokeLinecap="round" opacity={0.5}
          style={{ animation: `atRainDrop 0.8s linear ${delay}s infinite` }}
        />
      );
    })}
  </g>
));
RainEffect.displayName = 'RainEffect';

/* ── Sparkle effect (on level-up) ────────────────── */

const SparkleEffect: React.FC = React.memo(() => (
  <g>
    {Array.from({ length: 10 }, (_, i) => {
      const angle = (i * 36) * Math.PI / 180;
      const dist = 60 + (i % 3) * 20;
      const x = 150 + dist * Math.cos(angle);
      const y = 150 + dist * Math.sin(angle);
      return (
        <circle key={i}
          cx={x} cy={y} r={2 + (i % 3)}
          fill={i % 2 === 0 ? '#fbbf24' : '#f472b6'}
          style={{ animation: `atSparkleBurst 1.5s ease-out ${i * 0.1}s forwards` }}
        />
      );
    })}
  </g>
));
SparkleEffect.displayName = 'SparkleEffect';

/* ── Glow border (on level-up) ───────────────────── */

const GlowBorder: React.FC = React.memo(() => (
  <rect
    x={2} y={2} width={296} height={276} rx={20} ry={20}
    fill="none" stroke="#fbbf24" strokeWidth={3}
    opacity={0.6}
    style={{ animation: 'atGlowPulse 1.5s ease-in-out infinite' }}
  />
));
GlowBorder.displayName = 'GlowBorder';

/* ── Grass / Ground ──────────────────────────────── */

const Ground: React.FC = React.memo(() => (
  <g>
    {/* Main ground */}
    <ellipse cx={150} cy={242} rx={130} ry={14} fill="#86efac" opacity={0.6} />
    <ellipse cx={150} cy={242} rx={100} ry={10} fill="#bbf7d0" opacity={0.3} />
    {/* Grass tufts */}
    {[30, 60, 90, 120, 180, 210, 240, 270].map((gx, i) => (
      <g key={i} opacity={0.45}>
        <line x1={gx} y1={238} x2={gx - 2} y2={232} stroke="#22c55e" strokeWidth={1.2} strokeLinecap="round" />
        <line x1={gx} y1={238} x2={gx + 2} y2={231} stroke="#16a34a" strokeWidth={1.2} strokeLinecap="round" />
      </g>
    ))}
  </g>
));
Ground.displayName = 'Ground';

/* ── CSS keyframes ───────────────────────────────── */

const animatedTreeKeyframes = `
@keyframes atSway {
  0%, 100% { transform: rotate(-1.5deg); }
  50%      { transform: rotate(1.5deg); }
}
@keyframes atFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}
@keyframes atCloudDrift {
  0%   { transform: translateX(0); }
  100% { transform: translateX(300px); opacity: 0; }
}
@keyframes atCloudDrift2 {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-300px); opacity: 0; }
}
@keyframes atRainDrop {
  0%   { transform: translateY(-20px); opacity: 0; }
  15%  { opacity: 0.5; }
  100% { transform: translateY(260px); opacity: 0; }
}
@keyframes atButterflyFloat {
  0%, 100% { transform: translate(0, 0); }
  25%      { transform: translate(15px, -10px); }
  50%      { transform: translate(-10px, -20px); }
  75%      { transform: translate(20px, -5px); }
}
@keyframes atWingFlap {
  0%   { transform: scaleX(1); }
  100% { transform: scaleX(0.3); }
}
@keyframes atSparkleBurst {
  0%   { opacity: 1; transform: scale(0); }
  50%  { opacity: 1; transform: scale(1.5); }
  100% { opacity: 0; transform: scale(0.5); }
}
@keyframes atGlowPulse {
  0%, 100% { opacity: 0.3; stroke-width: 2; }
  50%      { opacity: 0.8; stroke-width: 4; }
}
@keyframes atGrowIn {
  0%   { transform: scaleY(0); opacity: 0; }
  100% { transform: scaleY(1); opacity: 1; }
}
`;

/* ── Props ────────────────────────────────────────── */

interface AnimatedTreeProps {
  stage: TreeStage;
  happiness: number;
  showRain?: boolean;
  showSparkle?: boolean;
  showGlow?: boolean;
}

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */

export const AnimatedTree: React.FC<AnimatedTreeProps> = React.memo(({
  stage,
  happiness,
  showRain = false,
  showSparkle = false,
  showGlow = false,
}) => {
  const dims = STAGE_DIMS[stage];
  const CX = 150;
  const GROUND_Y = 240;

  const leafPts = useMemo(
    () => spiralPoints(CX, dims.crownCy, dims.crownRx - 5, dims.crownRy - 5, dims.leafCount),
    [dims],
  );
  const flowerPts = useMemo(
    () => spiralPoints(CX, dims.crownCy - 3, dims.crownRx * 0.7, dims.crownRy * 0.6, dims.flowerCount, 0.7),
    [dims],
  );
  const fruitPts = useMemo(
    () => spiralPoints(CX, dims.crownCy + dims.crownRy * 0.25, dims.crownRx * 0.75, dims.crownRy * 0.5, dims.fruitCount, 0.75),
    [dims],
  );

  return (
    <div style={{ width: '100%', maxWidth: 360, margin: '0 auto', position: 'relative' }}>
      <style>{animatedTreeKeyframes}</style>
      <svg viewBox="0 0 300 280" width="100%" style={{ display: 'block' }}>
        {/* Sky gradient */}
        <defs>
          <linearGradient id="atSkyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfdbfe" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#bbf7d0" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={300} height={280} rx={20} fill="url(#atSkyGrad)" />

        {/* Glow border */}
        {showGlow && <GlowBorder />}

        {/* Clouds */}
        <Clouds />

        {/* Ground */}
        <Ground />

        {/* Seed stage — show seed only */}
        {stage === 'seed' && <SeedSVG />}

        {/* Tree (visible for all stages except seed) */}
        {stage !== 'seed' && (
          <g style={{
            transformOrigin: `${CX}px ${GROUND_Y}px`,
            animation: 'atSway 5s ease-in-out infinite',
          }}>
            {/* Trunk */}
            <rect
              x={CX - dims.trunkW / 2}
              y={GROUND_Y - dims.trunkH}
              width={dims.trunkW}
              height={dims.trunkH}
              rx={dims.trunkW * 0.2}
              fill={dims.trunkFill}
              stroke="#78350f"
              strokeWidth={0.8}
              style={{ transformOrigin: `${CX}px ${GROUND_Y}px`, animation: 'atGrowIn 0.8s ease-out forwards' }}
            />

            {/* Branches for bigger trees */}
            {dims.trunkH >= 80 && (
              <>
                <line
                  x1={CX - dims.trunkW / 2} y1={GROUND_Y - dims.trunkH * 0.55}
                  x2={CX - dims.trunkW * 2} y2={GROUND_Y - dims.trunkH * 0.72}
                  stroke={dims.trunkFill} strokeWidth={dims.trunkW * 0.18} strokeLinecap="round"
                />
                <line
                  x1={CX + dims.trunkW / 2} y1={GROUND_Y - dims.trunkH * 0.45}
                  x2={CX + dims.trunkW * 1.8} y2={GROUND_Y - dims.trunkH * 0.65}
                  stroke={dims.trunkFill} strokeWidth={dims.trunkW * 0.15} strokeLinecap="round"
                />
              </>
            )}

            {/* Crown */}
            <ellipse
              cx={CX} cy={dims.crownCy}
              rx={dims.crownRx} ry={dims.crownRy}
              fill={dims.crownFill} opacity={0.85}
            />
            {/* Crown highlight */}
            <ellipse
              cx={CX - dims.crownRx * 0.15} cy={dims.crownCy - dims.crownRy * 0.2}
              rx={dims.crownRx * 0.5} ry={dims.crownRy * 0.4}
              fill="#4ade80" opacity={0.35}
            />

            {/* Leaves */}
            {leafPts.map(([x, y], i) => (
              <TreeLeaf key={`l${i}`} cx={x} cy={y} idx={i} />
            ))}

            {/* Flowers */}
            {flowerPts.map(([x, y], i) => (
              <TreeFlower key={`f${i}`} cx={x} cy={y} idx={i} />
            ))}

            {/* Fruits */}
            {fruitPts.map(([x, y], i) => (
              <TreeFruit key={`fr${i}`} cx={x} cy={y} idx={i} />
            ))}
          </g>
        )}

        {/* Rain effect overlay */}
        {showRain && <RainEffect />}

        {/* Butterflies when happy */}
        {happiness > 80 && <Butterflies />}

        {/* Sparkle on level up */}
        {showSparkle && <SparkleEffect />}
      </svg>
    </div>
  );
});

AnimatedTree.displayName = 'AnimatedTree';
