/**
 * child/levels/ColorMagicLevels.tsx
 * ══════════════════════════════════════════════════════
 * 🐍 PREMIUM ANIMATED CREATURE ENGINE — AAA Mode
 *
 * Structured, mathematical, clean serpentine path system.
 * Every node placed via getPointAtLength on a master path.
 *
 * Architecture:
 *   • Mathematical S-curve generator with controlled amplitude
 *   • getPointAtLength node distribution (exact path placement)
 *   • 4-layer creature body:
 *       L1  Shadow depth   (darkest, widest, +6px Y offset)
 *       L2  Main body     (thick 110px, round-capped, world color)
 *       L3  Scale texture (subtle white dashed overlay)
 *       L4  Belly stripe  (55px lighter center stripe)
 *   • Structured kawaii head (wider than body, eyes, blink, breath)
 *   • Tapered tail with animated flick
 *   • Progress overlay (completed portion tinted)
 *   • Fullscreen: position:fixed, 100vw, vertical scroll
 *   • Virtualized rendering: ~40 nodes max in DOM
 *   • Camera auto-scroll to current level on mount
 *   • 60fps: transform+opacity only, no blur, no animated shadows
 *
 * Layout rules:
 *   • Left margin  = 120px
 *   • Right margin = 120px
 *   • Row spacing  = 220px
 *   • Amplitude    = 140px
 *   • 5–6 nodes per row, even distribution
 *   • Perfect symmetry, engineered feel
 * ══════════════════════════════════════════════════════
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  getWorldMeta,
  getEffectiveLevelHi,
  PHASE_META,
  type PlayerProgress,
} from '../colorMagicEngine';
import { getWorldTheme, isWorldDark } from './worldConfig';
import { WorldBackground } from './WorldBackground';
import { WorldHeader } from './WorldHeader';
import { LevelNode, type NodeState } from './LevelNode';
import { useSmoothScroll } from '../hooks/useSmoothScroll';

/* ── Dev flag ── */
const DEV_UNLOCK_ALL = true;

/* ═══════════════════════════════════════════════════
   LAYOUT CONSTANTS — structured mathematical grid
   ═══════════════════════════════════════════════════ */

const NODES_PER_ROW = 5;       // even distribution per serpentine row
const ROW_SPACING   = 220;     // vertical distance between row centerlines
const S_AMPLITUDE   = 140;     // horizontal S-curve wave amplitude (px)
const MARGIN_LR     = 120;     // left/right screen edge padding
const MAP_PAD_TOP   = 80;      // top padding in map canvas
const MAP_PAD_BOT   = 160;     // bottom padding in map canvas
const HEADER_H      = 240;     // header area height estimate
const VIRT_BUFFER   = 800;     // render buffer above/below viewport (px)

/* ═══════════════════════════════════════════════════
   SNAKE NODE TYPE
   ═══════════════════════════════════════════════════ */

interface SnakeNode {
  x: number;
  y: number;
  level: number;
  isBoss: boolean;
  row: number;
  t: number;  // 0..1 parametric position along path
}

/* ═══════════════════════════════════════════════════
   1️⃣ MASTER PATH GENERATOR
   Mathematical serpentine S-pattern generator.
   Produces clean cubic bezier SVG path string.

   Row 1 → left to right
   Row 2 → right to left  (perfect mirror)
   Row 3 → left to right
   ...
   Each row has a smooth S-curve, connected by
   rounded U-turn beziers between rows.
   ═══════════════════════════════════════════════════ */

function generateSnakePath(
  levelCount: number,
  rowSize: number,
  amplitude: number,
  spacing: number,
  containerWidth: number,
): string {
  const totalRows = Math.ceil(levelCount / rowSize);
  if (totalRows < 1) return '';

  const leftX  = MARGIN_LR;
  const rightX = Math.max(leftX + 200, containerWidth - MARGIN_LR);
  const centerX = (leftX + rightX) / 2;

  // Build array of row endpoints + control points
  let d = '';

  for (let row = 0; row < totalRows; row++) {
    const y = MAP_PAD_TOP + row * spacing;
    const goingRight = row % 2 === 0;

    const startX = goingRight ? leftX : rightX;
    const endX   = goingRight ? rightX : leftX;

    if (row === 0) {
      // Move to first point
      d = `M ${startX} ${y}`;
    }

    // S-curve across the row using cubic bezier
    // Control points create the smooth S shape
    const cp1x = centerX + (goingRight ? -amplitude : amplitude);
    const cp1y = y;
    const cp2x = centerX + (goingRight ? amplitude : -amplitude);
    const cp2y = y;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${y}`;

    // U-turn to next row (if not last)
    if (row < totalRows - 1) {
      const nextY = MAP_PAD_TOP + (row + 1) * spacing;
      const turnX = endX;
      // Smooth vertical U-turn with rounded bezier
      const midTurnY = y + spacing * 0.5;
      d += ` C ${turnX} ${midTurnY}, ${turnX} ${midTurnY}, ${turnX} ${nextY}`;
    }
  }

  return d;
}

/* ═══════════════════════════════════════════════════
   🎯 NODE DISTRIBUTION via getPointAtLength
   Every node is placed EXACTLY on the path center.
   No manual positioning — pure mathematical precision.
   ═══════════════════════════════════════════════════ */

function distributeNodesOnPath(
  levels: number[],
  pathD: string,
): SnakeNode[] {
  if (!levels.length || !pathD) return [];

  // Create offscreen SVG path element for measurement
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.style.position = 'absolute';
  svg.style.left = '-9999px';
  svg.style.top = '-9999px';
  const pathEl = document.createElementNS(ns, 'path');
  pathEl.setAttribute('d', pathD);
  svg.appendChild(pathEl);
  document.body.appendChild(svg);

  const totalLen = pathEl.getTotalLength();
  const count = levels.length;

  const nodes: SnakeNode[] = levels.map((lv, idx) => {
    const t   = count > 1 ? idx / (count - 1) : 0.5;
    const len = t * totalLen;
    const pt  = pathEl.getPointAtLength(len);
    const row = Math.floor(idx / NODES_PER_ROW);

    return {
      x: pt.x,
      y: pt.y,
      level: lv,
      isBoss: lv % 10 === 0,
      row,
      t,
    };
  });

  document.body.removeChild(svg);
  return nodes;
}

/* ═══════════════════════════════════════════════════
   🐍 STRUCTURED HEAD SYSTEM
   • Wider than body (r=34 vs body 55px half-width)
   • Rounded front with eyes, blinking, breathing
   • Tongue, blush cheeks, no cartoon excess
   ═══════════════════════════════════════════════════ */

const CreatureHead: React.FC<{
  x: number;
  y: number;
  facing: 'left' | 'right';
  bodyColor: string;
  accentColor: string;
}> = React.memo(({ x, y, facing, bodyColor, accentColor }) => {
  const sx = facing === 'left' ? -1 : 1;
  const [blinkOpen, setBlinkOpen] = useState(true);

  // Blink every 3–5 seconds
  useEffect(() => {
    const blink = () => {
      setBlinkOpen(false);
      setTimeout(() => setBlinkOpen(true), 150);
    };
    const id = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  const eyeH = blinkOpen ? 8 : 1.5;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <motion.g
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Idle breathing */}
        <motion.g
          animate={{ scaleY: [1, 1.03, 1], y: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: `0px 0px` }}
        >
          <g transform={`scale(${sx}, 1)`}>
            {/* Ground shadow */}
            <ellipse cx="0" cy="14" rx="34" ry="10" fill="rgba(0,0,0,0.10)" />

            {/* Head shape — slightly wider than body */}
            <ellipse cx="0" cy="0" rx="34" ry="30" fill={bodyColor} />

            {/* Top highlight gloss */}
            <ellipse cx="-2" cy="-10" rx="22" ry="14" fill="rgba(255,255,255,0.14)" />

            {/* Left eye */}
            <ellipse cx="-12" cy="-4" rx="9" ry={eyeH} fill="white" />
            {blinkOpen && <>
              <circle cx="-10" cy="-4" r="4.5" fill="#1a1a2e" />
              <circle cx="-8.5" cy="-6.5" r="2" fill="white" />
            </>}

            {/* Right eye */}
            <ellipse cx="12" cy="-4" rx="9" ry={eyeH} fill="white" />
            {blinkOpen && <>
              <circle cx="14" cy="-4" r="4.5" fill="#1a1a2e" />
              <circle cx="15.5" cy="-6.5" r="2" fill="white" />
            </>}

            {/* Subtle mouth curve */}
            <path
              d="M -8 8 Q 0 16 8 8"
              fill="none"
              stroke="#1a1a2e"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Blush cheeks */}
            <ellipse cx="-24" cy="4" rx="6" ry="4" fill="rgba(255,130,140,0.30)" />
            <ellipse cx="24" cy="4" rx="6" ry="4" fill="rgba(255,130,140,0.30)" />

            {/* Forked tongue */}
            <motion.g
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M 1 20 L 1 32 L -4 38"
                fill="none" stroke="#ff6b8a" strokeWidth="2.8" strokeLinecap="round"
              />
              <path
                d="M 1 20 L 1 32 L 6 38"
                fill="none" stroke="#ff6b8a" strokeWidth="2.8" strokeLinecap="round"
              />
            </motion.g>

            {/* Small crown hat */}
            <ellipse cx="0" cy="-30" rx="9" ry="7" fill={accentColor} opacity={0.75} />
            <ellipse cx="0" cy="-30" rx="5" ry="4" fill="white" opacity={0.35} />
          </g>
        </motion.g>
      </motion.g>
    </g>
  );
});
CreatureHead.displayName = 'CreatureHead';

/* ═══════════════════════════════════════════════════
   🐍 TAPERED TAIL — smooth end with animated flick
   ═══════════════════════════════════════════════════ */

const CreatureTail: React.FC<{
  x: number;
  y: number;
  color: string;
  facing: 'left' | 'right';
}> = React.memo(({ x, y, color, facing }) => {
  const sx = facing === 'left' ? -1 : 1;
  return (
    <g transform={`translate(${x}, ${y}) scale(${sx}, 1)`}>
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        {/* Animated tail flick every ~3s */}
        <motion.g
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '0px 0px' }}
        >
          {/* Tapered tail shape */}
          <path
            d="M 0 0 Q -20 -8 -30 0 Q -35 8 -25 14 Q -10 18 0 10 Z"
            fill={color}
          />
          <path
            d="M -5 2 Q -18 0 -24 6"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.g>
      </motion.g>
    </g>
  );
});
CreatureTail.displayName = 'CreatureTail';

/* ═══════════════════════════════════════════════════
   🐍 4-LAYER CREATURE BODY SVG
   All layers drawn as thick stroked paths (round caps).
   No blur filters. No canvas. Pure SVG.

   L1  Shadow depth    (T+24px wide, rgba dark, +6Y)
   L2  Main body       (T px wide, solid world color)
   L3  Scale texture   (T*0.7 wide, subtle dashed white)
   L4  Belly stripe    (T*0.45 wide, lighter belly color)
   +   Progress tint   (completed ratio overlay)
   +   Head            (at current level)
   +   Tail            (at first level)
   ═══════════════════════════════════════════════════ */

const CreatureBodySVG: React.FC<{
  pathD: string;
  width: number;
  height: number;
  completedRatio: number;
  headX: number;
  headY: number;
  headFacing: 'left' | 'right';
  tailX: number;
  tailY: number;
  tailFacing: 'left' | 'right';
  worldId: number;
}> = React.memo(({
  pathD, width, height, completedRatio,
  headX, headY, headFacing,
  tailX, tailY, tailFacing,
  worldId,
}) => {
  const theme   = getWorldTheme(worldId);
  const sp      = theme.snakePath;
  const hasGrad = sp.gradientId !== null;
  const T       = sp.thickness;

  if (!pathD) return null;

  const resolvedBodyColor = sp.body.startsWith('url') ? theme.accentColor : sp.body;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute', top: 0, left: 0,
        pointerEvents: 'none', zIndex: 0,
        overflow: 'visible',
      }}
    >
      <defs>
        {/* Rainbow gradient for Neon Sky world */}
        {hasGrad && (
          <linearGradient id="snakeRainbowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#a855f7" />
            <stop offset="15%"  stopColor="#ec4899" />
            <stop offset="30%"  stopColor="#f59e0b" />
            <stop offset="50%"  stopColor="#22c55e" />
            <stop offset="70%"  stopColor="#3b82f6" />
            <stop offset="85%"  stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        )}
      </defs>

      {/* ── L1: Shadow depth (widest, darkest, offset down) ── */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={sp.shadow}
        strokeWidth={T + 24}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.35}
        transform="translate(0, 6)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* ── L2: Main body (full thickness, core color) ── */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={sp.body}
        strokeWidth={T}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      />

      {/* ── L3: Scale texture (subtle dashed pattern) ── */}
      <motion.path
        d={pathD}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={T * 0.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8 24"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      />

      {/* ── L4: Belly stripe (lighter, narrower, centered) ── */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={sp.belly}
        strokeWidth={T * 0.45}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.10 }}
      />

      {/* ── Progress overlay (completed tint) ── */}
      {completedRatio > 0 && (
        <motion.path
          d={pathD}
          fill="none"
          stroke={sp.progressTint}
          strokeWidth={T * 0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.30}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: completedRatio }}
          transition={{ duration: 1.0, ease: 'easeOut', delay: 0.6 }}
        />
      )}

      {/* ── Tail (tapered end at first node) ── */}
      <CreatureTail
        x={tailX}
        y={tailY}
        color={resolvedBodyColor}
        facing={tailFacing}
      />

      {/* ── Head (at current level) ── */}
      <CreatureHead
        x={headX}
        y={headY}
        facing={headFacing}
        bodyColor={resolvedBodyColor}
        accentColor={theme.accentColor}
      />
    </svg>
  );
});
CreatureBodySVG.displayName = 'CreatureBodySVG';

/* ═══════════════════════════════════════════════════
   PHASE BANNER
   ═══════════════════════════════════════════════════ */

const PhaseBanner: React.FC<{
  phaseNum: number;
  dark: boolean;
  accent: string;
}> = React.memo(({ phaseNum, dark, accent }) => {
  const meta = PHASE_META[phaseNum];
  if (!meta) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 18px', borderRadius: 14,
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        width: 'fit-content',
      }}
    >
      <span style={{ fontSize: 16 }}>{meta.emoji}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: accent, letterSpacing: '0.03em' }}>
        Phase {phaseNum}: {meta.name}
      </span>
    </motion.div>
  );
});
PhaseBanner.displayName = 'PhaseBanner';

/* ═══════════════════════════════════════════════════
   BOSS HINT
   ═══════════════════════════════════════════════════ */

const BossHint: React.FC<{
  levelsAway: number;
  dark: boolean;
  accent: string;
}> = React.memo(({ levelsAway, dark, accent }) => {
  if (levelsAway <= 0 || levelsAway > 20) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.45 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 12,
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${accent}30`,
        width: 'fit-content',
      }}
    >
      <span style={{ fontSize: 14 }}>👑</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>
        Boss in {levelsAway} level{levelsAway !== 1 ? 's' : ''}!
      </span>
    </motion.div>
  );
});
BossHint.displayName = 'BossHint';

/* ═══════════════════════════════════════════════════
   "▼ YOU" CURRENT INDICATOR
   ═══════════════════════════════════════════════════ */

const CurrentTag: React.FC<{ accent: string }> = React.memo(({ accent }) => (
  <motion.div
    style={{
      position: 'absolute', top: -34, left: '50%',
      transform: 'translateX(-50%)',
      fontSize: 10, fontWeight: 900, color: accent,
      background: `${accent}18`,
      padding: '3px 10px', borderRadius: 8,
      border: `1px solid ${accent}35`,
      whiteSpace: 'nowrap' as const,
      pointerEvents: 'none', zIndex: 10,
      willChange: 'transform',
    }}
    animate={{ y: [0, -4, 0] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    ▼ YOU
  </motion.div>
));
CurrentTag.displayName = 'CurrentTag';

/* ═══════════════════════════════════════════════════
   MAIN — ColorMagicLevels
   Premium Animated Creature Engine (Fullscreen)
   ═══════════════════════════════════════════════════ */

interface ColorMagicLevelsProps {
  worldId: number;
  progress: PlayerProgress;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

export const ColorMagicLevels: React.FC<ColorMagicLevelsProps> = React.memo(({
  worldId, progress, onSelectLevel, onBack,
}) => {
  const world = useMemo(() => getWorldMeta(worldId), [worldId]);
  const theme = useMemo(() => getWorldTheme(worldId), [worldId]);
  const dark  = isWorldDark(worldId);

  const effectiveHi = useMemo(
    () => getEffectiveLevelHi(worldId, progress.highestLevel),
    [worldId, progress.highestLevel],
  );

  /* ── All levels (full list — no pagination) ── */
  const allLevels = useMemo(() => {
    const arr: number[] = [];
    for (let lv = world.levelRange[0]; lv <= effectiveHi; lv++) arr.push(lv);
    return arr;
  }, [world.levelRange, effectiveHi]);

  const totalLevels  = allLevels.length;
  const currentLevel = progress.highestLevel + 1;

  /* ── Refs ── */
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ══════════════════════════════════════════════════
     RESPONSIVE WIDTH — ResizeObserver
     ══════════════════════════════════════════════════ */

  const [mapWidth, setMapWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 400,
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setMapWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ══════════════════════════════════════════════════
     MASTER PATH — mathematical serpentine S-pattern
     ══════════════════════════════════════════════════ */

  const pathD = useMemo(
    () => generateSnakePath(
      totalLevels,
      NODES_PER_ROW,
      S_AMPLITUDE,
      ROW_SPACING,
      mapWidth,
    ),
    [totalLevels, mapWidth],
  );

  /* ── Map canvas height ── */
  const totalRows = Math.ceil(totalLevels / NODES_PER_ROW);
  const mapH = MAP_PAD_TOP + Math.max(0, totalRows - 1) * ROW_SPACING + MAP_PAD_BOT;

  /* ══════════════════════════════════════════════════
     NODE DISTRIBUTION — getPointAtLength precision
     ══════════════════════════════════════════════════ */

  const snakeNodes = useMemo(
    () => distributeNodesOnPath(allLevels, pathD),
    [allLevels, pathD],
  );

  /* ── Progress stats ── */
  const completedCount = useMemo(
    () => allLevels.filter(lv => (progress.levelStars[lv] ?? 0) > 0).length,
    [allLevels, progress.levelStars],
  );
  const pct = totalLevels > 0 ? Math.round((completedCount / totalLevels) * 100) : 0;
  const completedRatio = totalLevels > 0 ? completedCount / totalLevels : 0;

  /* ── Creature head position (at current level) ── */
  const { headX, headY, headFacing } = useMemo(() => {
    const idx = snakeNodes.findIndex(n => n.level === currentLevel);
    if (idx >= 0) {
      const node   = snakeNodes[idx];
      const facing = node.row % 2 === 0 ? 'right' as const : 'left' as const;
      return { headX: node.x, headY: node.y - 64, headFacing: facing };
    }
    const last = snakeNodes[snakeNodes.length - 1];
    if (last) return { headX: last.x, headY: last.y - 64, headFacing: 'right' as const };
    return { headX: MARGIN_LR, headY: MAP_PAD_TOP, headFacing: 'right' as const };
  }, [snakeNodes, currentLevel]);

  /* ── Tail position (first node) ── */
  const { tailX, tailY, tailFacing } = useMemo(() => {
    const first = snakeNodes[0];
    if (first) {
      const f = first.row % 2 === 0 ? 'left' as const : 'right' as const;
      return { tailX: first.x, tailY: first.y, tailFacing: f };
    }
    return { tailX: MARGIN_LR, tailY: MAP_PAD_TOP, tailFacing: 'left' as const };
  }, [snakeNodes]);

  /* ── Boss hint ── */
  const nextBossLevel  = useMemo(() => Math.ceil(currentLevel / 10) * 10, [currentLevel]);
  const bossLevelsAway = nextBossLevel - currentLevel;

  /* ── Phase detection ── */
  const currPhase = useMemo(() => {
    const lv = currentLevel;
    if (lv <= 30)  return 1;
    if (lv <= 80)  return 2;
    if (lv <= 150) return 3;
    if (lv <= 400) return 4;
    if (lv <= 750) return 5;
    if (lv <= 900) return 6;
    return 7;
  }, [currentLevel]);

  /* ── Node state ── */
  const getNodeState = useCallback((lv: number): NodeState => {
    if (DEV_UNLOCK_ALL) {
      return (progress.levelStars[lv] ?? 0) > 0 ? 'completed' : 'available';
    }
    if ((progress.levelStars[lv] ?? 0) > 0) return 'completed';
    if (lv <= progress.highestLevel + 1) return 'available';
    return 'locked';
  }, [progress.levelStars, progress.highestLevel]);

  /* ══════════════════════════════════════════════════
     SMOOTH SCROLL ENGINE — RAF-based lerp scrolling
     ══════════════════════════════════════════════════ */

  const { scrollTo: smoothScrollTo } = useSmoothScroll(scrollRef, {
    lerp: 0.075,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.8,
  });

  /* ══════════════════════════════════════════════════
     VIRTUALIZED RENDERING — only ~40 nodes in DOM
     Path SVG renders fully (lightweight vectors).
     Nodes filtered by scroll proximity.
     ══════════════════════════════════════════════════ */

  const [scrollTop, setScrollTop] = useState(0);
  const [viewH, setViewH] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800,
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollTop(el.scrollTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    setViewH(el.clientHeight);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const visibleNodes = useMemo(() => {
    const localTop = scrollTop - HEADER_H;
    const top = localTop - VIRT_BUFFER;
    const bot = localTop + viewH + VIRT_BUFFER;
    return snakeNodes.filter(n => n.y >= top && n.y <= bot);
  }, [snakeNodes, scrollTop, viewH]);

  /* ══════════════════════════════════════════════════
     CAMERA — auto-scroll to current level on mount
     Feels like climbing a mountain path.
     ══════════════════════════════════════════════════ */

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !snakeNodes.length) return;
    const idx = snakeNodes.findIndex(n => n.level === currentLevel);
    if (idx < 0) return;
    const node    = snakeNodes[idx];
    const targetY = HEADER_H + node.y - el.clientHeight / 3;

    const timer = setTimeout(() => {
      smoothScrollTo(Math.max(0, targetY));
    }, 600);
    return () => clearTimeout(timer);
  }, [snakeNodes, currentLevel]);

  /* ── Derived ── */
  const rangeStr = `Levels ${world.levelRange[0]}–${effectiveHi}`;

  /* ═══════════════════════════════════════════════════
     RENDER — Fullscreen creature world
     ═══════════════════════════════════════════════════ */

  return (
    <>
      {/* ═══ Fullscreen scroll container ═══ */}
      <div
        ref={scrollRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          overflowY: 'auto',
          overflowX: 'hidden',
          borderRadius: 28,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <WorldBackground worldId={worldId} scrollY={scrollTop} />

        {/* Content layer */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          minHeight: HEADER_H + mapH,
          width: '100%',
        }}>

          {/* ── Header area ── */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '70px 16px 0',
            gap: 12,
          }}>
            <div style={{ width: '100%', maxWidth: 680 }}>
              <WorldHeader
                theme={theme}
                completed={completedCount}
                total={totalLevels}
                pct={pct}
                levelRange={rangeStr}
                phaseCount={world.phases.length}
              />
            </div>

            {/* Info bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {currPhase && (
                <PhaseBanner phaseNum={currPhase} dark={dark} accent={theme.accentColor} />
              )}
              <BossHint levelsAway={bossLevelsAway} dark={dark} accent={theme.accentColor} />
            </div>
          </div>

          {/* ═══ CREATURE MAP CANVAS — full width ═══ */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: mapH,
            marginTop: 20,
          }}>
            {/* 4-layer creature body SVG — always rendered */}
            <CreatureBodySVG
              pathD={pathD}
              width={mapWidth}
              height={mapH}
              completedRatio={completedRatio}
              headX={headX}
              headY={headY}
              headFacing={headFacing}
              tailX={tailX}
              tailY={tailY}
              tailFacing={tailFacing}
              worldId={worldId}
            />

            {/* Level nodes — virtualized, ON the body */}
            {visibleNodes.map(node => {
              const lv        = node.level;
              const state     = getNodeState(lv);
              const stars     = progress.levelStars[lv] ?? 0;
              const isCurrent = lv === currentLevel;

              return (
                <motion.div
                  key={`n-${lv}`}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isCurrent ? 5 : node.isBoss ? 3 : 1,
                  }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {isCurrent && <CurrentTag accent={theme.accentColor} />}
                  <LevelNode
                    level={lv}
                    state={state}
                    stars={stars}
                    isBoss={node.isBoss}
                    isCurrent={isCurrent}
                    theme={theme}
                    onSelect={onSelectLevel}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Fixed Back Button ═══ */}
      <motion.button
        onClick={onBack}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 18px',
          borderRadius: 16,
          background: dark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.80)',
          border: `1.5px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
          color: dark ? '#ffffff' : theme.headingColor,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          outline: 'none',
          willChange: 'transform',
        }}
        whileHover={{ scale: 1.05, x: -3 }}
        whileTap={{ scale: 0.95 }}
      >
        ← Worlds
      </motion.button>
    </>
  );
});

ColorMagicLevels.displayName = 'ColorMagicLevels';
