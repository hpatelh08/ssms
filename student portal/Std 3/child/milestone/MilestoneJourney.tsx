/**
 * child/milestone/MilestoneJourney.tsx
 * ─────────────────────────────────────────────────────
 * Full-screen Space Academy — AAA immersive galaxy journey map.
 *
 * Architecture:
 *  • 260px space-station sidebar with glow effects
 *  • 94px mission-control glass header with starfield
 *  • Transform-based camera (no native scroll) via framer-motion spring
 *  • 100ms delayed camera follow for cinematic feel
 *  • ParallaxLayer system (bg 0.6x, mid 0.8x, edge 0.85x, main 1.0x)
 *  • Continuous mascot glide (no step-by-step micro-stopping)
 *  • Sound effects: thruster loop, warp pop, sparkle
 *  • AnimatedRoadSVG constellation path with progressive fill
 *  • Memoized LevelNode grid (planets), sector banners, star particles
 *  • GPU-accelerated: will-change, translateZ(0)
 *
 * Continuous Glide:
 *  When a level is tapped, mascot glides DIRECTLY from current
 *  to target with duration proportional to distance.
 *  No pauses, no intermediate stops.
 */

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LevelNode from './LevelNode';
import AnimatedRoadSVG, { buildPathD } from './AnimatedRoadSVG';
import MascotWalker from './MascotWalker';
import type { MascotProps } from './MascotWalker';
import RewardModal from './RewardModal';
import { TimeUpModal } from '../../components/TimeUpModal';
import { FloatingTimer } from '../../components/FloatingTimer';
import { usePlaytimeControl } from '../../hooks/usePlaytimeControl';
import { useLevelEngine } from './useLevelEngine';
import type { LevelView } from './useLevelEngine';
import {
  computeAllPositions,
  MAP_HEIGHT,
  WORLD_THEMES,
  getTheme,
  BANNER_H,
  WORLD_GAP,
  MAP_TOP,
} from './WorldThemeManager';
import type { NodePos, DecoItem } from './WorldThemeManager';
import { WORLDS, TOTAL_LEVELS } from './levelData';
import { useCameraScroll } from './CameraScrollController';

/* ═══════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════ */

const HEADER_H = 94;
const SIDEBAR_W = 260;
/** ms per level of distance for the glide */
const MS_PER_LEVEL = 180;
/** Minimum glide duration in ms */
const MIN_GLIDE_MS = 500;
/** Maximum glide duration in ms */
const MAX_GLIDE_MS = 3500;
/** Camera follow delay in ms */
const CAMERA_DELAY_MS = 100;
/** Camera easing duration in ms */
const CAMERA_EASE_MS = 1100;
const EASING = [0.22, 1, 0.36, 1] as const;

/* ═══════════════════════════════════════════════════
   JOURNEY SOUND EFFECTS (Web Audio based, low volume)
   ═══════════════════════════════════════════════════ */

class JourneySounds {
  private ctx: AudioContext | null = null;
  private walkOsc: OscillatorNode | null = null;
  private walkGain: GainNode | null = null;
  private isWalking = false;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /** Soft walking loop — gentle oscillating tone */
  startWalk() {
    if (this.isWalking) return;
    try {
      const ctx = this.getCtx();
      this.walkGain = ctx.createGain();
      this.walkGain.gain.value = 0;
      this.walkGain.connect(ctx.destination);

      this.walkOsc = ctx.createOscillator();
      this.walkOsc.type = 'sine';
      this.walkOsc.frequency.value = 380;
      this.walkOsc.connect(this.walkGain);
      this.walkOsc.start();

      // Gentle volume wobble for walking feel
      const now = ctx.currentTime;
      this.walkGain.gain.setValueAtTime(0, now);
      this.walkGain.gain.linearRampToValueAtTime(0.04, now + 0.15);

      // Create wobble for walking sound
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 4; // 4Hz wobble
      lfoGain.gain.value = 20; // ±20Hz
      lfo.connect(lfoGain);
      lfoGain.connect(this.walkOsc.frequency);
      lfo.start();

      this.isWalking = true;
    } catch {}
  }

  stopWalk() {
    if (!this.isWalking || !this.walkGain || !this.walkOsc) return;
    try {
      const ctx = this.getCtx();
      this.walkGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      const osc = this.walkOsc;
      setTimeout(() => { try { osc.stop(); } catch {} }, 250);
      this.walkOsc = null;
      this.walkGain = null;
      this.isWalking = false;
    } catch {}
  }

  /** Cosmic arrival chime */
  playArrival() {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }

  /** Sparkle sound on level glow */
  playSparkle() {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  /** Chest open sound — ascending arpeggio chime */
  playChestOpen() {
    try {
      const ctx = this.getCtx();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + i * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.6);
      });
    } catch {}
  }

  /** Victory fanfare — triumphant ascending sweep */
  playVictory() {
    try {
      const ctx = this.getCtx();
      const notes = [392, 523, 659, 784, 1047, 1319];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 1);
      });
    } catch {}
  }

  dispose() {
    this.stopWalk();
    this.ctx?.close();
  }
}

/* ═══════════════════════════════════════════════════
   CONTINUOUS GLIDE HOOK — no step-by-step
   ═══════════════════════════════════════════════════ */

interface GlideState {
  currentIdx: number;
  targetIdx: number;
  isGliding: boolean;
  mascotProgress: number;       // 0→1 for road fill behind mascot
  glideDurationMs: number;      // how long current glide takes
}

function useContinuousGlide(totalLevels: number) {
  const [state, setState] = useState<GlideState>({
    currentIdx: 0,
    targetIdx: 0,
    isGliding: false,
    mascotProgress: 0,
    glideDurationMs: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const glideTo = useCallback(
    (targetIdx: number) => {
      // Cancel previous glide timer
      if (timerRef.current) clearTimeout(timerRef.current);

      setState(prev => {
        const distance = Math.abs(targetIdx - prev.currentIdx);
        if (distance === 0) return prev;

        // Duration proportional to distance
        const duration = Math.min(MAX_GLIDE_MS, Math.max(MIN_GLIDE_MS, distance * MS_PER_LEVEL));

        return {
          currentIdx: targetIdx,        // Set target immediately — mascot glides via CSS transition
          targetIdx,
          isGliding: true,
          mascotProgress: (targetIdx + 1) / totalLevels,
          glideDurationMs: duration,
        };
      });

      // Determine when to stop the "gliding" flag
      setState(prev => {
        const distance = Math.abs(targetIdx - prev.currentIdx || targetIdx);
        const duration = Math.min(MAX_GLIDE_MS, Math.max(MIN_GLIDE_MS, Math.max(distance, 1) * MS_PER_LEVEL));

        timerRef.current = setTimeout(() => {
          setState(s => ({ ...s, isGliding: false }));
        }, duration + 100);

        return prev;
      });
    },
    [totalLevels],
  );

  /** Jump immediately (no animation) — for initial placement */
  const jumpTo = useCallback(
    (idx: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState({
        currentIdx: idx,
        targetIdx: idx,
        isGliding: false,
        mascotProgress: (idx + 1) / totalLevels,
        glideDurationMs: 0,
      });
    },
    [totalLevels],
  );

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { ...state, glideTo, jumpTo };
}

/* ═══════════════════════════════════════════════════
   PARALLAX LAYER
   ═══════════════════════════════════════════════════ */

interface ParallaxProps {
  offsetY: number;
  speed: number;
  children: React.ReactNode;
  className?: string;
  zIndex?: number;
}

const ParallaxLayer: React.FC<ParallaxProps> = memo(
  ({ offsetY, speed, children, className = '', zIndex = 0 }) => (
    <div
      className={`absolute inset-x-0 top-0 ${className}`}
      style={{
        height: MAP_HEIGHT,
        transform: `translate3d(0, ${offsetY * speed}px, 0)`,
        willChange: 'transform',
        zIndex,
        pointerEvents: zIndex >= 10 ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  ),
);
ParallaxLayer.displayName = 'ParallaxLayer';

/* ═══════════════════════════════════════════════════
   DECO ITEM COMPONENT — floating emoji decoration
   ═══════════════════════════════════════════════════ */

const DecoEmoji: React.FC<{ item: DecoItem; worldY: number }> = memo(
  ({ item, worldY }) => (
    <span
      className="absolute select-none pointer-events-none"
      style={{
        left: `${item.xPct}%`,
        top: worldY + item.yOffset,
        fontSize: `${item.scale * 24}px`,
        opacity: item.opacity,
        willChange: 'transform',
        transform: 'translateZ(0)',
        '--float-amp': `-${item.floatAmp}px`,
        animation: `deco-float ${4 / item.speed}s ease-in-out infinite`,
      } as React.CSSProperties}
    >
      {item.emoji}
    </span>
  ),
);
DecoEmoji.displayName = 'DecoEmoji';

/* ═══════════════════════════════════════════════════
   AMBIENT PARTICLES
   ═══════════════════════════════════════════════════ */

const AmbientParticle: React.FC<{ emoji: string; idx: number; worldY: number }> = memo(
  ({ emoji, idx, worldY }) => {
    const x = (idx * 41 + 13) % 100;
    const startY = worldY + (idx * 127 + 37) % 1000;
    return (
      <span
        className="absolute pointer-events-none select-none text-xl"
        style={{
          left: `${x}%`,
          top: startY,
          opacity: 0,
          willChange: 'transform, opacity',
          '--drift-x': `${idx % 2 === 0 ? 20 : -20}px`,
          animation: `particle-rise ${5 + (idx % 3) * 2}s ease-out ${idx * 1.3}s infinite`,
        } as React.CSSProperties}
      >
        {emoji}
      </span>
    );
  },
);
AmbientParticle.displayName = 'AmbientParticle';

/* ═══════════════════════════════════════════════════
   WORLD BANNER
   ═══════════════════════════════════════════════════ */

const WorldBanner: React.FC<{
  world: typeof WORLDS[0];
  yStart: number;
  theme: typeof WORLD_THEMES[0];
  idx: number;
}> = memo(({ world, yStart, theme, idx }) => (
  <div
    className="absolute left-1/2"
    style={{
      top: yStart + BANNER_H,
      zIndex: 45,
      transform: 'translate(-130%, -75%)',
      width: 'fit-content',
      pointerEvents: 'none',
    }}
  >
    <motion.div
      className={`px-6 py-2.5 rounded-2xl bg-gradient-to-r ${theme.bannerGradient} border-2 border-white/30`}
      style={{
        display: 'inline-flex',
        willChange: 'transform',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      }}
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 18,
        delay: idx * 0.1,
      }}
    >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            position: 'relative',
            width: 'fit-content',
          }}
        >
        <span
          className="text-3xl"
          style={{
            position: 'relative',
            zIndex: 5,
            flexShrink: 0,
          }}
        >
          {world.emoji}
        </span>
        <div
          style={{
            marginLeft: 14,
            marginRight: 0,
            width: 'fit-content',
            position: 'relative',
            zIndex: 5,
            background: 'rgba(0,0,0,0.4)',
            padding: '6px 12px',
            borderRadius: 10,
            boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
          }}
        >
          <h3
            className="text-lg font-extrabold text-white leading-tight whitespace-nowrap"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}
          >
            {world.name}
          </h3>
          <p
            className="text-xs text-white/80 whitespace-nowrap"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
          >
            {world.tagline}
          </p>
        </div>
      </div>
    </motion.div>
  </div>
));
WorldBanner.displayName = 'WorldBanner';

/* ═══════════════════════════════════════════════════
   MEMOIZED LEVEL NODE WRAPPER
   ═══════════════════════════════════════════════════ */

const MemoLevelNode: React.FC<{
  level: LevelView;
  pos: NodePos;
  onTap: (lv: LevelView) => void;
  isCurrent: boolean;
}> = memo(({ level, pos, onTap, isCurrent }) => (
  <div
    className="absolute"
    style={{
      left: `${pos.x}%`,
      top: pos.y,
      transform: 'translate(-50%, -50%)',
      willChange: 'transform',
    }}
  >
    <LevelNode level={level} onTap={onTap} isCurrent={isCurrent} />
  </div>
));
MemoLevelNode.displayName = 'MemoLevelNode';

/* ═══════════════════════════════════════════════════
   MINI FOX ICON (for header)
   ═══════════════════════════════════════════════════ */

const MiniFoxIcon: React.FC<{ size?: number }> = memo(({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
    <path d="M14 28 L8 6 L26 22Z" fill="#f97316" />
    <path d="M15 26 L11 10 L24 22Z" fill="#fde68a" />
    <path d="M58 28 L64 6 L46 22Z" fill="#f97316" />
    <path d="M57 26 L61 10 L48 22Z" fill="#fde68a" />
    <ellipse cx="36" cy="38" rx="24" ry="22" fill="#f97316" />
    <ellipse cx="22" cy="42" rx="8" ry="7" fill="#fff7ed" />
    <ellipse cx="50" cy="42" rx="8" ry="7" fill="#fff7ed" />
    <ellipse cx="36" cy="46" rx="12" ry="10" fill="#fff7ed" />
    <circle cx="26" cy="34" r="3" fill="#1c1917" />
    <circle cx="27" cy="32.5" r="1" fill="white" />
    <circle cx="46" cy="34" r="3" fill="#1c1917" />
    <circle cx="47" cy="32.5" r="1" fill="white" />
    <ellipse cx="36" cy="40" rx="3" ry="2" fill="#1c1917" />
    <circle cx="18" cy="40" r="3" fill="#fda4af" opacity="0.35" />
    <circle cx="54" cy="40" r="3" fill="#fda4af" opacity="0.35" />
  </svg>
));
MiniFoxIcon.displayName = 'MiniFoxIcon';

/* ═══════════════════════════════════════════════════
   GLASS HEADER — rocket icon + satellite + starfield glow
   ═══════════════════════════════════════════════════ */

const GlassHeader: React.FC<{
  totalStars: number;
  totalCompleted: number;
  overallNodeProgress01: number;
  onBack: () => void;
}> = memo(({ totalStars, totalCompleted, overallNodeProgress01, onBack }) => {
  const progress = Math.max(0, Math.min(1, overallNodeProgress01));

  return (
    <div
      className="fixed top-0 right-0 z-[100] flex items-center gap-4 px-5"
      style={{
        left: SIDEBAR_W,
        height: HEADER_H,
        background: 'linear-gradient(135deg, rgba(10,6,24,0.97) 0%, rgba(26,16,64,0.95) 50%, rgba(45,27,107,0.93) 100%)',
        borderBottom: '1px solid rgba(103,232,249,0.15)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Back button */}
      <motion.button
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-bold
                   bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-lg">←</span> Back
      </motion.button>

      {/* Space title */}
      <div className="flex items-center gap-2.5 flex-1">
        <span
          className="text-3xl"
          style={{ animation: 'gentle-bob 3s ease-in-out infinite' }}
        >
          🚀
        </span>
        <div>
          <h1
            className="text-[28px] font-black text-white leading-tight tracking-tight"
            style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            Space Academy
          </h1>
          <p className="text-[14px] text-cyan-200/80 font-medium">
            {totalCompleted}/{TOTAL_LEVELS} missions completed
          </p>
        </div>
      </div>

      {/* Satellite animation */}
      <span
        className="text-xl"
        style={{ animation: 'sparkle-rotate 3s ease-in-out infinite' }}
      >
        🛰️
      </span>

      {/* Progress bar with star milestones */}
      <div className="flex items-center gap-3">
        <div className="w-40 h-3.5 rounded-full bg-white/15 overflow-hidden border border-white/20 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1.5, ease: EASING }}
          />
        </div>
        <div className="flex items-center gap-1 bg-yellow-400/20 rounded-full px-3 py-1.5 border border-yellow-300/30">
          <span
            className="text-lg"
            style={{ animation: 'star-twinkle 2s ease-in-out infinite' }}
          >
            ⭐
          </span>
          <span className="text-[16px] font-black text-yellow-200"><AnimatedStarCounter target={totalStars} /></span>
        </div>
      </div>

      {/* Rocket icon */}
      <div className="ml-1 opacity-90">
        <span className="text-3xl">🛸</span>
      </div>
    </div>
  );
});
GlassHeader.displayName = 'GlassHeader';

/* ═══════════════════════════════════════════════════
   SPACE STATION SIDEBAR — 260px wide, deep space gradient
   ═══════════════════════════════════════════════════ */

const SpaceSidebar: React.FC<{
  worlds: ReturnType<typeof useLevelEngine>['worlds'];
  currentWorldIdx: number;
  onWorldClick: (worldIdx: number) => void;
  totalStars: number;
}> = memo(({ worlds, currentWorldIdx, onWorldClick, totalStars }) => (
  <div
    className="fixed left-0 top-0 bottom-0 z-[110] flex flex-col overflow-hidden"
    style={{
      width: SIDEBAR_W,
      background: 'linear-gradient(180deg, #0a0618 0%, #140e30 30%, #1a1040 70%, #0a0618 100%)',
      borderRight: '1px solid rgba(103,232,249,0.2)',
      boxShadow: '2px 0 12px rgba(0,0,0,0.4)',
    }}
  >
    {/* ── Glow logo area ── */}
    <div className="px-5 pt-6 pb-4">
      <motion.div
        className="flex items-center gap-3 mb-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.span
          className="text-4xl"
          animate={{ y: [0, -4, 0], scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          🚀
        </motion.span>
        <div>
          <h2
            className="text-[22px] font-black text-white tracking-tight leading-tight"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            Space Academy
          </h2>
          <p className="text-[13px] text-cyan-300/70 font-medium">Your Galaxy Sectors</p>
        </div>
      </motion.div>

      {/* Star count */}
      <motion.div
        className="flex items-center gap-2 mt-3 bg-gradient-to-r from-cyan-500/20 to-sky-500/10 rounded-xl px-4 py-2.5 border border-cyan-400/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.span
          className="text-2xl"
          animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          ⭐
        </motion.span>
        <div>
          <span className="text-[20px] font-black text-yellow-300"><AnimatedStarCounter target={totalStars} /></span>
          <p className="text-[11px] text-yellow-200/50 font-medium -mt-0.5">Stars Earned</p>
        </div>
      </motion.div>
    </div>

    {/* ── Divider ── */}
    <div className="mx-4 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

    {/* ── World navigation ── */}
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2 sidebar-scroll">
      <p className="text-[11px] font-bold text-cyan-300/40 uppercase tracking-widest px-2 mb-2">
        Galaxy Sectors
      </p>
      {worlds.map((w, idx) => {
        const theme = getTheme(w.worldId);
        const isActive = idx === currentWorldIdx;
        const emoji = WORLDS[idx]?.emoji ?? '🌍';
        const pct = w.levels.length > 0
          ? Math.round((w.levels.reduce((sum, level) => sum + level.nodeProgress01, 0) / w.levels.length) * 100)
          : 0;

        return (
          <motion.button
            key={w.worldId}
            onClick={() => onWorldClick(idx)}
            className={`w-full rounded-xl px-3.5 py-3 text-left transition-all duration-200 relative overflow-hidden group ${
              isActive
                ? 'bg-white/15 border border-purple-300/30 shadow-lg'
                : 'bg-transparent hover:bg-white/8 border border-transparent'
            }`}
            whileHover={{ x: 4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.08 }}
          >
            {/* Glow effect for active */}
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${theme.roadColor}22 0%, transparent 60%)`,
                }}
                layoutId="sidebar-active-glow"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}

            <div className="relative flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[16px] font-bold leading-tight truncate ${
                  isActive ? 'text-white' : 'text-cyan-100/80'
                }`}>
                  {w.worldName}
                </p>
                <p className={`text-[12px] mt-0.5 ${
                  isActive ? 'text-cyan-200/70' : 'text-cyan-300/40'
                }`}>
                  {w.completedCount}/{w.totalCount} missions
                </p>
              </div>
              <span
                className={`text-[14px] font-black min-w-[36px] text-center ${
                  pct === 100
                    ? 'text-green-300'
                    : isActive
                      ? 'text-cyan-200'
                      : 'text-cyan-300/50'
                }`}
              >
                {pct}%
              </span>
            </div>

            {/* Mini progress bar */}
            <div className="relative mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${theme.roadColor}, ${theme.roadColor}cc)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: EASING, delay: 0.5 + idx * 0.1 }}
              />
            </div>
          </motion.button>
        );
      })}
    </nav>

    {/* ── Bottom space badge ── */}
    <div className="px-4 pb-5 pt-2">
      <div className="mx-auto h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent mb-3" />
      <motion.div
        className="flex items-center gap-3 bg-cyan-500/10 rounded-xl px-3 py-3 border border-cyan-400/15"
        style={{ boxShadow: '0 2px 8px rgba(34,211,238,0.08)' }}
      >
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <MiniFoxIcon size={44} />
        </motion.div>
        <div>
          <p className="text-[15px] font-bold text-cyan-200">Captain Spark</p>
          <p className="text-[12px] text-cyan-300/50">Space Guide 🛸</p>
        </div>
      </motion.div>
    </div>
  </div>
));
SpaceSidebar.displayName = 'SpaceSidebar';

/* ═══════════════════════════════════════════════════
   INTRO SPLASH SCREEN
   ═══════════════════════════════════════════════════ */

const IntroSplash: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 2200);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0a0618 0%, #1a1040 50%, #2d1b6b 100%)',
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.15 }}
      transition={{ duration: 0.6, ease: EASING }}
    >
      <motion.span
        className="text-7xl mb-4"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        🚀
      </motion.span>
      <motion.h1
        className="text-4xl font-black text-white tracking-tight"
        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Space Academy
      </motion.h1>
      <motion.p
        className="text-lg text-cyan-200/70 mt-2 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Your galactic mission awaits…
      </motion.p>

      {/* Floating space elements — CSS only */}
      {[0, 1, 2, 3, 4].map(i => (
        <span
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${15 + i * 18}%`,
            top: `${30 + (i * 23) % 40}%`,
            animation: `sparkle-rotate ${2 + i * 0.3}s ease-in-out ${i * 0.3}s infinite`,
          }}
        >
          {['🛸', '⭐', '🪐', '🌟', '🛰️'][i]}
        </span>
      ))}

      {/* Fox mascot */}
      <motion.div
        className="mt-6"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
      >
        <MiniFoxIcon />
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   WORLD COMPLETION CINEMATIC
   ═══════════════════════════════════════════════════ */

const WorldCompletionCinematic: React.FC<{
  world: { worldId: string; worldName: string; emoji: string } | null;
  onDismiss: () => void;
}> = ({ world, onDismiss }) => {
  const [phase, setPhase] = useState<'zoom' | 'badge' | 'fox' | 'done'>('zoom');
  const soundRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!world) return;
    // Victory fanfare
    try {
      const ctx = new AudioContext();
      soundRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const notes = [392, 523, 659, 784, 1047, 1319];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + i * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 1.3);
      });
    } catch {}

    const t1 = setTimeout(() => setPhase('badge'), 600);
    const t2 = setTimeout(() => setPhase('fox'), 1800);
    const t3 = setTimeout(() => setPhase('done'), 3200);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      soundRef.current?.close();
    };
  }, [world]);

  if (!world) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[250] flex flex-col items-center justify-center"
      style={{ willChange: 'opacity' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Brightened backdrop */}
      <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.25)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

      {/* Confetti rain */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }, (_, i) => {
          const x = (i * 31 + 7) % 100;
          const colors = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
          return (
            <motion.div
              key={`wc-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: `${x}%`, top: '-2%',
                width: 10, height: 6, borderRadius: 2,
                background: colors[i % colors.length],
                willChange: 'transform',
              }}
              animate={{
                y: ['0', '110vh'],
                opacity: [0, 1, 1, 0],
                rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
                x: [0, (i % 2 === 0 ? 25 : -25)],
              }}
              transition={{ duration: 3 + (i % 4) * 0.5, delay: 0.5 + i * 0.05, ease: 'easeIn' }}
            />
          );
        })}
      </div>

      {/* Giant gold badge */}
      <AnimatePresence>
        {(phase === 'badge' || phase === 'fox' || phase === 'done') && (
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          >
            <motion.div
              className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 flex items-center justify-center border-4 border-yellow-200"
              style={{
                boxShadow: '0 8px 24px rgba(255,215,0,0.25)',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="text-7xl">{world.emoji}</span>
            </motion.div>
            <motion.h2
              className="mt-6 text-4xl font-black text-white text-center"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              🏆 Sector Complete!
            </motion.h2>
            <motion.p
              className="text-xl text-cyan-200 font-bold mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {world.worldName} Conquered!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fox jump animation */}
      <AnimatePresence>
        {(phase === 'fox' || phase === 'done') && (
          <motion.div
            className="mt-4"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: [0, -30, 0, -15, 0], opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <MiniFoxIcon size={56} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue button */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.button
            onClick={onDismiss}
            className="mt-8 px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xl font-black"
            style={{ boxShadow: '0 4px 12px rgba(245,158,11,0.2)' }}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            ✨ Continue Mission
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   STAR COUNTER (count-up animation)
   ═══════════════════════════════════════════════════ */

const AnimatedStarCounter: React.FC<{ target: number }> = memo(({ target }) => {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) return;

    const frames = Math.min(30, Math.abs(diff));
    const stepTime = Math.max(30, 600 / frames);
    let frame = 0;

    const iv = setInterval(() => {
      frame++;
      const progress = frame / frames;
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + diff * eased));
      if (frame >= frames) {
        clearInterval(iv);
        setDisplayed(target);
        prevRef.current = target;
      }
    }, stepTime);

    return () => clearInterval(iv);
  }, [target]);

  return <span>{displayed}</span>;
});
AnimatedStarCounter.displayName = 'AnimatedStarCounter';

/* ═══════════════════════════════════════════════════
   VIGNETTE OVERLAY — soft dark edges for cinematic feel
   ═══════════════════════════════════════════════════ */

const VignetteOverlay: React.FC = memo(() => (
  <div
    className="fixed inset-0 pointer-events-none z-[90]"
    style={{
      background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.15) 100%)',
      willChange: 'auto',
    }}
  />
));
VignetteOverlay.displayName = 'VignetteOverlay';

/* ═══════════════════════════════════════════════════
   CUSTOM SCROLLBAR STYLES (injected once)
   ═══════════════════════════════════════════════════ */

const scrollbarCSS = `
  .journey-scroll::-webkit-scrollbar { width: 10px; }
  .journey-scroll::-webkit-scrollbar-track {
    background: linear-gradient(180deg, #0f0a2e 0%, #1a1145 50%, #0a0618 100%);
    border-radius: 10px;
  }
  .journey-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #22d3ee 0%, #0891b2 50%, #164e63 100%);
    border-radius: 10px;
    border: 2px solid rgba(14,10,40,0.4);
    box-shadow: 0 0 8px rgba(34,211,238,0.4);
  }
  .journey-scroll::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #67e8f9, #22d3ee, #0891b2);
  }
  .journey-scroll { scrollbar-width: thin; scrollbar-color: #22d3ee #0f0a2e; }

  .sidebar-scroll::-webkit-scrollbar { width: 4px; }
  .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
  .sidebar-scroll::-webkit-scrollbar-thumb {
    background: rgba(34,211,238,0.3);
    border-radius: 4px;
  }
  .sidebar-scroll { scrollbar-width: thin; scrollbar-color: rgba(34,211,238,0.3) transparent; }
`;

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

interface JourneyProps {
  onBack: () => void;
}

const MilestoneJourney: React.FC<JourneyProps> = ({ onBack }) => {
  /* ── Engine + positions ── */
  const engine = useLevelEngine();
  const { positions, worldYStarts } = useMemo(() => computeAllPositions(), []);

  /* ── Sound effects ── */
  const soundsRef = useRef<JourneySounds | null>(null);
  useEffect(() => {
    soundsRef.current = new JourneySounds();
    return () => { soundsRef.current?.dispose(); soundsRef.current = null; };
  }, []);

  /* ── Playtime modal ── */
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  /* ── All levels flat ── */
  const allLevels = useMemo(
    () => engine.worlds.flatMap(w => w.levels),
    [engine.worlds],
  );

  /* ── Find first active level index (for initial placement) ── */
  const firstActiveIdx = useMemo(() => {
    const idx = allLevels.findIndex(l => l.state === 'active');
    return idx >= 0 ? idx : 0;
  }, [allLevels]);

  /* ── Continuous glide state (replaces sequential walk) ── */
  const glide = useContinuousGlide(TOTAL_LEVELS);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && allLevels.length > 0) {
      initializedRef.current = true;
      glide.jumpTo(firstActiveIdx);
    }
  }, [firstActiveIdx, allLevels.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Camera scroll ── */
  const viewportH = typeof window !== 'undefined' ? window.innerHeight - HEADER_H : 800;
  const camera = useCameraScroll({
    mapHeight: MAP_HEIGHT,
    viewportHeight: viewportH,
    initialFocusY: positions[firstActiveIdx]?.y,
  });

  /* ── Camera follow with 100ms delay for cinematic feel ── */
  const cameraDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const pos = positions[glide.currentIdx];
    if (pos && glide.isGliding) {
      if (cameraDelayRef.current) clearTimeout(cameraDelayRef.current);
      cameraDelayRef.current = setTimeout(() => {
        camera.centerOn(pos.y);
      }, CAMERA_DELAY_MS);
    }
    return () => {
      if (cameraDelayRef.current) clearTimeout(cameraDelayRef.current);
    };
  }, [glide.currentIdx, glide.isGliding]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Sound effects tied to glide state ── */
  const wasGlidingRef = useRef(false);
  useEffect(() => {
    if (glide.isGliding && !wasGlidingRef.current) {
      // Started gliding
      soundsRef.current?.startWalk();
    } else if (!glide.isGliding && wasGlidingRef.current) {
      // Stopped gliding — arrival
      soundsRef.current?.stopWalk();
      soundsRef.current?.playArrival();
      setTimeout(() => soundsRef.current?.playSparkle(), 200);
    }
    wasGlidingRef.current = glide.isGliding;
  }, [glide.isGliding]);

  /* ── Current world index (for sidebar highlight) ── */
  const currentWorldIdx = useMemo(() => {
    const lv = allLevels[glide.currentIdx];
    if (!lv) return 0;
    return WORLDS.findIndex(w => w.id === lv.worldId);
  }, [glide.currentIdx, allLevels]);
  const [selectedWorldIdx, setSelectedWorldIdx] = useState(0);

  useEffect(() => {
    setSelectedWorldIdx(currentWorldIdx);
  }, [currentWorldIdx]);

  /* ── Wheel / touch scroll handler ── */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      camera.scrollBy(e.deltaY);
    },
    [camera],
  );

  /* ── Touch scroll ── */
  const touchRef = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = e.touches[0].clientY;
  }, []);
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchRef.current == null) return;
      const delta = touchRef.current - e.touches[0].clientY;
      touchRef.current = e.touches[0].clientY;
      camera.scrollBy(delta);
    },
    [camera],
  );

  /* ── Clicks disabled while gliding ── */
  const clicksDisabled = useRef(false);

  /* ── Level tap handler → continuous glide ── */
  const handleLevelTap = useCallback(
    (lv: LevelView) => {
      if (lv.state === 'locked' || clicksDisabled.current) return;

      const targetIdx = allLevels.findIndex(l => l.id === lv.id);
      if (targetIdx < 0 || targetIdx === glide.currentIdx) return;

      clicksDisabled.current = true;

      // Calculate glide duration
      const distance = Math.abs(targetIdx - glide.currentIdx);
      const duration = Math.min(MAX_GLIDE_MS, Math.max(MIN_GLIDE_MS, distance * MS_PER_LEVEL));

      // Glide directly to the target
      glide.glideTo(targetIdx);

      // Re-enable clicks after glide completes
      setTimeout(() => {
        clicksDisabled.current = false;
      }, duration + 200);
    },
    [allLevels, glide],
  );

  /* ── Sidebar world click → jump camera to world start ── */
  const handleWorldClick = useCallback(
    (worldIdx: number) => {
      setSelectedWorldIdx(worldIdx);
      const y = worldYStarts[worldIdx];
      if (y != null) camera.centerOn(y + 100);
    },
    [worldYStarts, camera],
  );

  /* ── Mascot props ── */
  const mascotPos = positions[glide.currentIdx];
  const prevIdxRef = useRef(glide.currentIdx);
  const mascotDirection: MascotProps['direction'] = useMemo(() => {
    const d = glide.currentIdx >= prevIdxRef.current ? 'right' : 'left';
    prevIdxRef.current = glide.currentIdx;
    return d;
  }, [glide.currentIdx]);

  /* ── Completion progress (for road completed fill) ── */
  const completedProgress = useMemo(() => {
    const lastCompleted = allLevels.reduce((acc, lv, i) => (lv.state === 'completed' ? i : acc), -1);
    return lastCompleted >= 0 ? (lastCompleted + 1) / TOTAL_LEVELS : 0;
  }, [allLevels]);

  const overallNodeProgress01 = useMemo(() => {
    if (allLevels.length === 0) return 0;
    const sum = allLevels.reduce((acc, lv) => acc + lv.nodeProgress01, 0);
    return Math.max(0, Math.min(1, sum / allLevels.length));
  }, [allLevels]);

  /* ── Background gradients by world ── */
  const bgGradient = useMemo(() => {
    const stops = WORLD_THEMES.map((t, i) => {
      const pct = (worldYStarts[i] / MAP_HEIGHT) * 100;
      return `${t.bgGradient.match(/,\s*([^\s]+)\s+0%/)?.[1] ?? '#ecfccb'} ${pct}%`;
    });
    return `linear-gradient(180deg, ${stops.join(', ')})`;
  }, [worldYStarts]);

  /* ── Intro splash ── */
  const [showSplash, setShowSplash] = useState(true);

  /* ── World completion cinematic ── */
  const [completedWorld, setCompletedWorld] = useState<{ worldId: string; worldName: string; emoji: string } | null>(null);
  const prevCompletedWorldsRef = useRef<Set<string>>(new Set());

  /* ── Playtime expiration handlers ── */
  const handleTimeExpired = useCallback(() => {
    setShowTimeUpModal(true);
  }, []);

  usePlaytimeControl({
    isActive: false,
    onTimeExpired: handleTimeExpired,
  });

  const handleTimeUpGoHome = useCallback(() => {
    setShowTimeUpModal(false);
    onBack();
  }, [onBack]);

  // Track world completions
  useEffect(() => {
    const currentlyCompleted = new Set<string>();
    engine.worlds.forEach(w => {
      if (w.completedCount === w.totalCount && w.totalCount > 0) {
        currentlyCompleted.add(w.worldId);
      }
    });

    // Check for newly completed worlds
    if (prevCompletedWorldsRef.current.size > 0) {
      for (const wId of currentlyCompleted) {
        if (!prevCompletedWorldsRef.current.has(wId)) {
          const world = engine.worlds.find(w => w.worldId === wId);
          if (world) {
            const worldDef = WORLDS.find(wd => wd.id === wId);
            setCompletedWorld({
              worldId: wId,
              worldName: world.worldName,
              emoji: worldDef?.emoji ?? '🏆',
            });
          }
        }
      }
    }
    prevCompletedWorldsRef.current = currentlyCompleted;
  }, [engine.worlds]);

  /* ── Decos grouped by layer ── */
  const { bgDecos, midDecos, edgeDecos, particles } = useMemo(() => {
    const bg: { item: DecoItem; wy: number }[] = [];
    const mid: { item: DecoItem; wy: number }[] = [];
    const edge: { item: DecoItem; wy: number }[] = [];
    const part: { emoji: string; idx: number; wy: number }[] = [];

    WORLD_THEMES.forEach((theme, wi) => {
      const wy = worldYStarts[wi] ?? 0;
      theme.decos.forEach(d => {
        const entry = { item: d, wy };
        if (d.layer === 'bg') bg.push(entry);
        else if (d.layer === 'mid') mid.push(entry);
        else edge.push(entry);
      });
      for (let p = 0; p < theme.particleCount; p++) {
        part.push({ emoji: theme.particleEmoji, idx: wi * 10 + p, wy });
      }
    });

    return { bgDecos: bg, midDecos: mid, edgeDecos: edge, particles: part };
  }, [worldYStarts]);

  return (
    <>
      {/* Inject scrollbar CSS */}
      <style dangerouslySetInnerHTML={{ __html: scrollbarCSS }} />

      {/* Intro splash */}
      <AnimatePresence>
        {showSplash && <IntroSplash onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      {/* World completion cinematic */}
      <AnimatePresence>
        {completedWorld && (
          <WorldCompletionCinematic
            world={completedWorld}
            onDismiss={() => setCompletedWorld(null)}
          />
        )}
      </AnimatePresence>

      {/* Soft vignette edges for cinematic feel */}
      <VignetteOverlay />

      {/* Full-screen container */}
      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          background: '#080515',
          willChange: 'transform',
          borderRadius: 0,
        }}
      >
        {/* ── Space Sidebar ── */}
        <SpaceSidebar
          worlds={engine.worlds}
          currentWorldIdx={selectedWorldIdx}
          onWorldClick={handleWorldClick}
          totalStars={engine.totalStars}
        />

        {/* ── Glass Header ── */}
        <GlassHeader
          totalStars={engine.totalStars}
          totalCompleted={engine.totalCompleted}
          overallNodeProgress01={overallNodeProgress01}
          onBack={onBack}
        />

        {/* ── Map viewport (right of sidebar, below header) ── */}
        <div
          className="absolute overflow-hidden journey-scroll"
          style={{
            left: SIDEBAR_W,
            top: HEADER_H,
            right: 0,
            bottom: 0,
          }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {/* Camera transform container — 1100ms easing, GPU */}
          <motion.div
            className="relative w-full"
            style={{
              height: MAP_HEIGHT,
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
            animate={{ y: camera.offsetY }}
            transition={{
              duration: CAMERA_EASE_MS / 1000,
              ease: EASING,
            }}
          >
            {/* ── World background gradients ── */}
            <div
              className="absolute inset-0"
              style={{
                background: bgGradient,
                willChange: 'transform',
                transform: 'translateZ(0)',
              }}
            />

            {/* ── Parallax: BG decos (0.6×) ── */}
            <ParallaxLayer offsetY={camera.offsetY} speed={0.6} zIndex={1}>
              {bgDecos.map((d, i) => (
                <DecoEmoji key={`bg-${i}`} item={d.item} worldY={d.wy} />
              ))}
            </ParallaxLayer>

            {/* ── Parallax: Mid decos (0.8×) ── */}
            <ParallaxLayer offsetY={camera.offsetY} speed={0.8} zIndex={2}>
              {midDecos.map((d, i) => (
                <DecoEmoji key={`mid-${i}`} item={d.item} worldY={d.wy} />
              ))}
            </ParallaxLayer>

            {/* ── Parallax: Edge decos (0.85×) ── */}
            <ParallaxLayer offsetY={camera.offsetY} speed={0.85} zIndex={3}>
              {edgeDecos.map((d, i) => (
                <DecoEmoji key={`edge-${i}`} item={d.item} worldY={d.wy} />
              ))}
            </ParallaxLayer>

            {/* ── Ambient particles ── */}
            <div className="absolute inset-0 z-[4] pointer-events-none">
              {particles.map((p, i) => (
                <AmbientParticle key={`ap-${i}`} emoji={p.emoji} idx={p.idx} worldY={p.wy} />
              ))}
            </div>

            {/* ── Road SVG ── */}
            <div className="absolute inset-0 z-[5]">
              <AnimatedRoadSVG
                points={positions}
                progress={completedProgress}
                mascotNodeIdx={glide.currentIdx}
                glideDurationMs={glide.glideDurationMs}
              />
            </div>

            {/* ── World banners ── */}
            <div className="absolute inset-0 z-[6] pointer-events-none">
              {WORLDS.map((w, wi) => (
                <WorldBanner
                  key={w.id}
                  world={w}
                  yStart={worldYStarts[wi]}
                  theme={WORLD_THEMES[wi]}
                  idx={wi}
                />
              ))}
            </div>

            {/* ── Level nodes ── */}
            <div className="absolute inset-0 z-[10]">
              {allLevels.map((lv, i) => (
                <MemoLevelNode
                  key={lv.id}
                  level={lv}
                  pos={positions[i]}
                  onTap={handleLevelTap}
                  isCurrent={i === glide.currentIdx}
                />
              ))}
            </div>

            {/* ── Mascot ── */}
            {mascotPos && (
              <div className="absolute inset-0 z-[30] pointer-events-none">
                <MascotWalker
                  x={mascotPos.x}
                  y={mascotPos.y}
                  direction={mascotDirection}
                  isMoving={glide.isGliding}
                  glideDuration={glide.glideDurationMs}
                  isCelebrating={false}
                  isJumping={!glide.isGliding && glide.currentIdx > 0}
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Reward modal ── */}
      <RewardModal
        level={engine.pendingReward}
        onDismiss={engine.dismissReward}
      />

      {/* ── Floating Timer (bottom-left) ──────── */}
      <FloatingTimer />

      {/* ── Time Up Modal ─────────────────────── */}
      <TimeUpModal 
        isOpen={showTimeUpModal}
        onGoHome={handleTimeUpGoHome}
      />
    </>
  );
};

export default MilestoneJourney;
