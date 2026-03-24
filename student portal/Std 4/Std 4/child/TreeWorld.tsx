/**
 * 🌳 TreeWorld — Interactive Growth Garden
 * ──────────────────────────────────────────────────
 * SVG garden that grows from real learning metrics.
 * Interactive: water, sunshine, plant activities.
 *
 * Visual mapping (deterministic):
 *   Level          → tree height & size
 *   Attendance     → leaf density
 *   Streak         → flowers
 *   Games played   → fruits
 *   Homework done  → seeds in ground
 *
 * Animations: CSS keyframes only (transform/opacity).
 * No canvas. No heavy libs. React.memo throughout.
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useGrowthSystem, type TreeSize } from '../hooks/useGrowthSystem';
import { useGardenActivity, type ActivityResult } from '../hooks/useGardenActivity';
import { useSoundPlay } from './SoundProvider';
import { useMascotTrigger } from './useMascotController';
import { useAddXP } from './XPProvider';

/* ── Tree dimension configs per size ─────────────── */

interface TreeConfig {
  trunkH: number;
  trunkW: number;
  crownRx: number;
  crownRy: number;
  crownCy: number;
  groundY: number;
}

const TREE_CONFIGS: Record<TreeSize, TreeConfig> = {
  seedling: { trunkH: 25, trunkW: 6,  crownRx: 18, crownRy: 16, crownCy: 140, groundY: 165 },
  sprout:   { trunkH: 40, trunkW: 9,  crownRx: 28, crownRy: 24, crownCy: 125, groundY: 165 },
  sapling:  { trunkH: 55, trunkW: 12, crownRx: 40, crownRy: 35, crownCy: 108, groundY: 165 },
  young:    { trunkH: 70, trunkW: 16, crownRx: 52, crownRy: 46, crownCy: 92,  groundY: 165 },
  mature:   { trunkH: 88, trunkW: 20, crownRx: 64, crownRy: 56, crownCy: 76,  groundY: 165 },
  mighty:   { trunkH: 100,trunkW: 24, crownRx: 78, crownRy: 66, crownCy: 60,  groundY: 165 },
};

/* ── Deterministic element placement (golden angle) ── */

function ellipsePoints(cx: number, cy: number, rx: number, ry: number, n: number, shrink = 0.85): Array<[number, number]> {
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

/* ── Colors ──────────────────────────────────────── */

const LEAF_GREENS = ['#22c55e', '#16a34a', '#4ade80', '#15803d', '#86efac'];
const FLOWER_COLORS = ['#f472b6', '#fb923c', '#a78bfa', '#facc15', '#f87171', '#38bdf8', '#34d399', '#e879f9'];
const FRUIT_COLORS  = ['#ef4444', '#f59e0b', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4', '#10b981', '#e11d48', '#d946ef', '#0ea5e9', '#14b8a6', '#f43f5e'];
const SEED_COLORS   = ['#92400e', '#a16207', '#854d0e', '#78350f', '#713f12', '#65400e'];

const TRUNK_FILL = '#92400e';
const TRUNK_STROKE = '#78350f';
const CROWN_BASE = '#16a34a';
const GROUND_FILL = '#86efac';

/* ── SVG Sub-components ──────────────────────────── */

const Leaf: React.FC<{ cx: number; cy: number; idx: number }> = React.memo(({ cx, cy, idx }) => (
  <ellipse
    cx={cx} cy={cy} rx={3.5} ry={2.2}
    fill={LEAF_GREENS[idx % LEAF_GREENS.length]}
    opacity={0.7 + (idx % 3) * 0.1}
    transform={`rotate(${(idx * 37) % 360} ${cx} ${cy})`}
  />
));
Leaf.displayName = 'Leaf';

const Flower: React.FC<{ cx: number; cy: number; idx: number }> = React.memo(({ cx, cy, idx }) => {
  const color = FLOWER_COLORS[idx % FLOWER_COLORS.length];
  return (
    <g>
      {Array.from({ length: 5 }, (_, p) => {
        const angle = (p * 72) * Math.PI / 180;
        return <circle key={p} cx={cx + 3 * Math.cos(angle)} cy={cy + 3 * Math.sin(angle)} r={2} fill={color} opacity={0.85} />;
      })}
      <circle cx={cx} cy={cy} r={1.8} fill="#fde68a" />
    </g>
  );
});
Flower.displayName = 'Flower';

const Fruit: React.FC<{ cx: number; cy: number; idx: number }> = React.memo(({ cx, cy, idx }) => (
  <g>
    <circle cx={cx} cy={cy} r={3.8} fill={FRUIT_COLORS[idx % FRUIT_COLORS.length]} />
    <circle cx={cx - 1} cy={cy - 1.2} r={1.2} fill="rgba(255,255,255,0.35)" />
    <line x1={cx} y1={cy - 3.8} x2={cx + 0.5} y2={cy - 5.5} stroke="#78350f" strokeWidth={0.8} />
  </g>
));
Fruit.displayName = 'Fruit';

const Seed: React.FC<{ cx: number; cy: number; idx: number }> = React.memo(({ cx, cy, idx }) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={2.5} ry={1.8} fill={SEED_COLORS[idx % SEED_COLORS.length]} opacity={0.8} />
    <line x1={cx} y1={cy - 1.8} x2={cx} y2={cy - 4} stroke="#22c55e" strokeWidth={0.7} strokeLinecap="round" />
    <circle cx={cx} cy={cy - 4.5} r={1} fill="#4ade80" opacity={0.9} />
  </g>
));
Seed.displayName = 'Seed';

/* ── Rain drops (CSS-animated in SVG) ─────────────── */

const RainOverlay: React.FC = React.memo(() => (
  <g className="gardenRainGroup">
    {Array.from({ length: 12 }, (_, i) => {
      const x = 15 + (i * 16) % 180;
      const delay = (i * 0.18) % 1;
      return (
        <line
          key={i}
          x1={x} y1={-5} x2={x - 2} y2={8}
          stroke="#60a5fa" strokeWidth={1.2} strokeLinecap="round" opacity={0.6}
          style={{ animation: `gardenRainFall 0.7s linear ${delay}s infinite` }}
        />
      );
    })}
  </g>
));
RainOverlay.displayName = 'RainOverlay';

/* ── Sunshine glow (CSS-animated) ────────────────── */

const SunshineOverlay: React.FC = React.memo(() => (
  <g>
    <circle cx={170} cy={20} r={16} fill="#fbbf24" opacity={0.9} style={{ animation: 'gardenSunPulse 1.5s ease-in-out infinite' }} />
    <circle cx={170} cy={20} r={24} fill="#fbbf24" opacity={0.15} style={{ animation: 'gardenSunGlow 2s ease-in-out infinite' }} />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * 45) * Math.PI / 180;
      return (
        <line
          key={i}
          x1={170 + 18 * Math.cos(a)} y1={20 + 18 * Math.sin(a)}
          x2={170 + 28 * Math.cos(a)} y2={20 + 28 * Math.sin(a)}
          stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round"
          opacity={0.5}
          style={{ animation: `gardenRayFade 1.2s ease-in-out ${i * 0.15}s infinite` }}
        />
      );
    })}
  </g>
));
SunshineOverlay.displayName = 'SunshineOverlay';

/* ── Planting sparkle ─────────────────────────────── */

const PlantSparkle: React.FC<{ groundY: number }> = React.memo(({ groundY }) => (
  <g>
    {['\u2728', '\uD83C\uDF31', '\u2728', '\uD83C\uDF31', '\u2728'].map((emoji, i) => {
      const x = 40 + i * 30;
      return (
        <text
          key={i} x={x} y={groundY + 5}
          fontSize={8} opacity={0.8}
          style={{ animation: `gardenSparkleRise 1.2s ease-out ${i * 0.15}s forwards` }}
        >
          {emoji}
        </text>
      );
    })}
  </g>
));
PlantSparkle.displayName = 'PlantSparkle';

/* ── CSS keyframes ───────────────────────────────── */

const gardenKeyframes = `
@keyframes gardenSway {
  0%, 100% { transform: rotate(-1deg); }
  50%      { transform: rotate(1deg); }
}
@keyframes gardenFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}
@keyframes gardenRainFall {
  0%   { transform: translateY(-10px); opacity: 0; }
  20%  { opacity: 0.6; }
  100% { transform: translateY(180px); opacity: 0; }
}
@keyframes gardenSunPulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.1); }
}
@keyframes gardenSunGlow {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50%      { opacity: 0.3; transform: scale(1.2); }
}
@keyframes gardenRayFade {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 0.15; }
}
@keyframes gardenSparkleRise {
  0%   { transform: translateY(0); opacity: 0.8; }
  100% { transform: translateY(-20px); opacity: 0; }
}
@keyframes gardenBtnPop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.08); }
  100% { transform: scale(1); }
}
`;

/* ── Labels ──────────────────────────────────────── */

const TREE_LABELS: Record<TreeSize, string> = {
  seedling: '\uD83C\uDF31 Seedling',
  sprout:   '\uD83C\uDF3F Sprout',
  sapling:  '\uD83E\uDEB4 Sapling',
  young:    '\uD83C\uDF32 Young Tree',
  mature:   '\uD83C\uDF33 Mature Tree',
  mighty:   '\u2728 Mighty Tree',
};

/* ── Action Button ───────────────────────────────── */

interface ActionBtnProps {
  icon: string;
  label: string;
  done: boolean;
  disabled: boolean;
  onClick: () => void;
  color: string;
}

const ActionBtn: React.FC<ActionBtnProps> = React.memo(({ icon, label, done, disabled, onClick, color }) => (
  <button
    onClick={onClick}
    disabled={disabled || done}
    style={{
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 2,
      padding: '8px 12px',
      borderRadius: 16,
      border: `2px solid ${done ? '#d1d5db' : color}`,
      background: done ? '#f3f4f6' : '#fff',
      cursor: disabled || done ? 'default' : 'pointer',
      opacity: disabled && !done ? 0.45 : 1,
      transition: 'all 0.15s ease',
      minWidth: 76,
      ...((!disabled && !done) ? { animation: 'gardenBtnPop 2s ease-in-out infinite' } : {}),
    }}
  >
    <span style={{ fontSize: 20 }}>{done ? '\u2705' : icon}</span>
    <span style={{ fontSize: 10, fontWeight: 600, color: done ? '#9ca3af' : '#374151' }}>
      {done ? 'Done!' : label}
    </span>
  </button>
));
ActionBtn.displayName = 'ActionBtn';

/* ── Toast ───────────────────────────────────────── */

const Toast: React.FC<{ message: string; onDone: () => void }> = React.memo(({ message, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={toastStyle}>
      {message}
    </div>
  );
});
Toast.displayName = 'Toast';

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */

export const TreeWorld: React.FC = React.memo(() => {
  const growth = useGrowthSystem();
  const play = useSoundPlay();
  const triggerMascot = useMascotTrigger();
  const addXP = useAddXP();

  const garden = useGardenActivity(growth, { play, trigger: triggerMascot, addXP });

  const cfg = TREE_CONFIGS[growth.treeSize];
  const CX = 100;

  /* Effect auto-clear after animation duration */
  const effectTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (garden.activeEffect) {
      if (effectTimer.current) clearTimeout(effectTimer.current);
      effectTimer.current = setTimeout(() => garden.clearEffect(), 2500);
    }
    return () => { if (effectTimer.current) clearTimeout(effectTimer.current); };
  }, [garden.activeEffect, garden.clearEffect]);

  /* Toast state */
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  /* Action handlers */
  const handleWater = useCallback(() => {
    const r = garden.waterTree();
    if (r.success === false) setToast(r.reason);
  }, [garden]);

  const handleSunshine = useCallback(() => {
    const r = garden.sunshineBoost();
    if (r.success === false) setToast(r.reason);
  }, [garden]);

  const handlePlant = useCallback(() => {
    const r = garden.plantSeed();
    if (r.success === false) setToast(r.reason);
  }, [garden]);

  /* Memoized positions */
  const leafCount = useMemo(() => Math.round(growth.leafDensity * 30), [growth.leafDensity]);
  const leafPositions   = useMemo(() => ellipsePoints(CX, cfg.crownCy, cfg.crownRx - 4, cfg.crownRy - 4, leafCount), [cfg, leafCount]);
  const flowerPositions = useMemo(() => ellipsePoints(CX, cfg.crownCy - 2, cfg.crownRx * 0.7, cfg.crownRy * 0.65, growth.flowerCount, 0.75), [cfg, growth.flowerCount]);
  const fruitPositions  = useMemo(() => ellipsePoints(CX, cfg.crownCy + cfg.crownRy * 0.25, cfg.crownRx * 0.75, cfg.crownRy * 0.45, growth.fruitCount, 0.8), [cfg, growth.fruitCount]);
  const seedPositions   = useMemo(() => {
    const n = growth.homeworkSeeds;
    if (n === 0) return [];
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      pts.push([30 + i * 28, cfg.groundY + 5]);
    }
    return pts;
  }, [growth.homeworkSeeds, cfg.groundY]);

  return (
    <div style={containerStyle}>
      <style>{gardenKeyframes}</style>

      {/* Header */}
      <h1 style={titleStyle}>{'\uD83C\uDF33'} My Garden</h1>

      {/* SVG Garden */}
      <div style={svgWrapStyle}>
        <svg
          viewBox="0 0 200 200"
          width="100%"
          style={{ maxWidth: 340, display: 'block', margin: '0 auto' }}
        >
          {/* Sky gradient for sunshine */}
          {garden.activeEffect === 'sunshine' && (
            <rect x={0} y={0} width={200} height={cfg.groundY} fill="#fef9c3" opacity={0.35} rx={8} />
          )}

          {/* Ground */}
          <ellipse cx={CX} cy={cfg.groundY + 2} rx={90} ry={10} fill={GROUND_FILL} opacity={0.5} />

          {/* Seeds in ground */}
          {seedPositions.map(([x, y], i) => (
            <Seed key={`s${i}`} cx={x} cy={y} idx={i} />
          ))}

          {/* Tree group with sway */}
          <g style={{ transformOrigin: `${CX}px ${cfg.groundY}px`, animation: 'gardenSway 4s ease-in-out infinite' }}>
            {/* Trunk */}
            <rect
              x={CX - cfg.trunkW / 2}
              y={cfg.groundY - cfg.trunkH}
              width={cfg.trunkW}
              height={cfg.trunkH}
              rx={cfg.trunkW * 0.25}
              fill={TRUNK_FILL}
              stroke={TRUNK_STROKE}
              strokeWidth={0.8}
            />

            {/* Branches for larger trees */}
            {cfg.trunkH >= 55 && (
              <>
                <line
                  x1={CX - cfg.trunkW / 2} y1={cfg.groundY - cfg.trunkH * 0.55}
                  x2={CX - cfg.trunkW * 1.5} y2={cfg.groundY - cfg.trunkH * 0.7}
                  stroke={TRUNK_FILL} strokeWidth={cfg.trunkW * 0.2} strokeLinecap="round"
                />
                <line
                  x1={CX + cfg.trunkW / 2} y1={cfg.groundY - cfg.trunkH * 0.45}
                  x2={CX + cfg.trunkW * 1.3} y2={cfg.groundY - cfg.trunkH * 0.6}
                  stroke={TRUNK_FILL} strokeWidth={cfg.trunkW * 0.18} strokeLinecap="round"
                />
              </>
            )}

            {/* Crown */}
            <ellipse cx={CX} cy={cfg.crownCy} rx={cfg.crownRx} ry={cfg.crownRy} fill={CROWN_BASE} opacity={0.85} />
            <ellipse
              cx={CX - cfg.crownRx * 0.15} cy={cfg.crownCy - cfg.crownRy * 0.2}
              rx={cfg.crownRx * 0.55} ry={cfg.crownRy * 0.45}
              fill="#4ade80" opacity={0.4}
            />

            {/* Leaves */}
            {leafPositions.map(([x, y], i) => (
              <Leaf key={`l${i}`} cx={x} cy={y} idx={i} />
            ))}

            {/* Flowers */}
            {flowerPositions.map(([x, y], i) => (
              <Flower key={`f${i}`} cx={x} cy={y} idx={i} />
            ))}

            {/* Fruits */}
            {fruitPositions.map(([x, y], i) => (
              <Fruit key={`r${i}`} cx={x} cy={y} idx={i} />
            ))}
          </g>

          {/* Grass tufts */}
          {[25, 55, 80, 120, 145, 175].map((gx, i) => (
            <g key={`g${i}`} opacity={0.5}>
              <line x1={gx} y1={cfg.groundY + 4} x2={gx - 2} y2={cfg.groundY - 2} stroke="#22c55e" strokeWidth={1} strokeLinecap="round" />
              <line x1={gx} y1={cfg.groundY + 4} x2={gx + 1.5} y2={cfg.groundY - 3} stroke="#16a34a" strokeWidth={1} strokeLinecap="round" />
            </g>
          ))}

          {/* Effect overlays */}
          {garden.activeEffect === 'water' && <RainOverlay />}
          {garden.activeEffect === 'sunshine' && <SunshineOverlay />}
          {garden.activeEffect === 'plant' && <PlantSparkle groundY={cfg.groundY} />}
        </svg>
      </div>

      {/* Message */}
      <p style={messageStyle}>{growth.message}</p>

      {/* Tree stage badge */}
      <div style={badgeStyle}>{TREE_LABELS[growth.treeSize]}</div>

      {/* Activity Buttons */}
      <div style={actionsRowStyle}>
        <ActionBtn
          icon={'\uD83C\uDF27\uFE0F'}
          label="Water"
          done={garden.wateredToday}
          disabled={!growth.attendedToday}
          onClick={handleWater}
          color="#60a5fa"
        />
        <ActionBtn
          icon={'\u2600\uFE0F'}
          label="Sunshine"
          done={garden.sunshineToday}
          disabled={false}
          onClick={handleSunshine}
          color="#fbbf24"
        />
        <ActionBtn
          icon={'\uD83C\uDF31'}
          label="Plant"
          done={garden.plantedToday}
          disabled={growth.homeworkPercent <= 0}
          onClick={handlePlant}
          color="#22c55e"
        />
      </div>

      {/* Gating hints */}
      <div style={hintsStyle}>
        {!growth.attendedToday && <span style={hintChipStyle}>{'\uD83D\uDCC5'} Attend class to water</span>}
        {growth.homeworkPercent <= 0 && <span style={hintChipStyle}>{'\uD83D\uDCDD'} Do homework to plant</span>}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
});

TreeWorld.displayName = 'TreeWorld';

/* ── Styles ──────────────────────────────────────── */

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '12px 16px 24px',
  minHeight: '100%',
  position: 'relative',
};

const titleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  margin: '0 0 4px',
  color: 'var(--text-primary)',
};

const svgWrapStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 340,
  animation: 'gardenFloat 6s ease-in-out infinite',
};

const messageStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#4b5563',
  textAlign: 'center',
  margin: '10px 0 6px',
  maxWidth: 260,
  lineHeight: 1.4,
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 14px',
  borderRadius: '999px',
  background: 'linear-gradient(135deg, #d9f99d 0%, #bbf7d0 100%)',
  fontSize: '13px',
  fontWeight: 600,
  color: '#166534',
  letterSpacing: '0.3px',
  marginBottom: 12,
};

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'center',
  marginTop: 4,
};

const hintsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  justifyContent: 'center',
  flexWrap: 'wrap',
  marginTop: 8,
};

const hintChipStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#9ca3af',
  background: '#f9fafb',
  padding: '3px 8px',
  borderRadius: 8,
  border: '1px solid #f3f4f6',
};

const toastStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--pastel-purple-deep)',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: 12,
  whiteSpace: 'nowrap',
  zIndex: 10,
  animation: 'gardenSparkleRise 2.2s ease-out forwards',
};
