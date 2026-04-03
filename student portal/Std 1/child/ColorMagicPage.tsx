/**
 * child/ColorMagicPage.tsx — 🎨 Color Magic — Structured AAA Game Interface
 * ════════════════════════════════════════════════════════════════════════════
 *
 * STRUCTURED · BALANCED · CHILD-FRIENDLY · PREMIUM · GAME-LIKE
 *
 * 4-ZONE LAYOUT (LevelPlay):
 *   ┌──────────────────────────────────────┐
 *   │  ZONE 1 — Anchored Header Panel     │  Instruction + progress + back
 *   ├──────────────────────────────────────┤
 *   │                                      │
 *   │  ZONE 2 — Glass Shape Stage          │  Centered shapes in glass card
 *   │                                      │
 *   ├──────────────────────────────────────┤
 *   │  ZONE 3 — Bottom Palette Dock        │  Color buttons in dock bar
 *   └──────────────────────────────────────┘
 *   ZONE 4 — Subtle animated background behind all zones
 *
 * Shape sizes:  Early = 380px | Mid = 260px | Hard = 180px
 * Instructions: 30px bold, glowing target word
 * Spacing:      8px grid system (8/16/24/32/40/48)
 * Confetti:     Minimal (24 pieces) — no visual clutter
 * Palette:      Dock bar with glass effect, 80px bubbles
 * Background:   Subtle, non-distracting rays + soft particles
 * GPU:          will-change + translateZ(0) on all animated layers
 *
 * Screens: WorldPicker → WorldLevels → LevelPlay → LevelComplete
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundPlay } from './SoundProvider';
import { useMascotTrigger } from './useMascotController';
import {
  pickRandomShapes,
  pickShapeClones,
  pickDistractorShapes,
  shuffleArray,
  getSegmentedObject,
  SHAPE_LIBRARY,
  type GameShape,
  type SegmentedObject,
  type SegmentedPartDef,
} from './colorMagicShapes';
import {
  ALL_COLORS, ALL_COLOR_NAMES,
  NAME_TO_HEX, NAME_TO_LETTER,
} from './colorSystem';
import {
  generateLevel,
  loadProgress,
  saveProgress,
  updateStreak,
  completeLevel,
  getPhase,
  getWorld,
  getWorldMeta,
  getMilestoneReward,
  WORLDS,
  PHASE_META,
  BOSS_TITLES,
  type LevelConfig,
  type PlayerProgress,
  type PhaseType,
  type MilestoneReward,
} from './colorMagicEngine';
import { ColorMagicWorlds } from './levels/ColorMagicWorlds';
import { ColorMagicLevels } from './levels/ColorMagicLevels';

/* ═══════════════════════════════════════════════════
   �  DEV FLAG — set true to unlock all levels/worlds
   ═══════════════════════════════════════════════════ */
const DEV_UNLOCK_ALL = true;

/* ═══════════════════════════════════════════════════
   🔊  WEB AUDIO SYNTHESIZER
   ═══════════════════════════════════════════════════ */


class ColorSounds {
  private ctx: AudioContext | null = null;
  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed')
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.18) {
    const c = this.getCtx(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  paintPop() {
    const c = this.getCtx(), o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(320, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(960, c.currentTime + 0.08);
    g.gain.setValueAtTime(0.22, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.2);
  }
  sparkleChime() { [1200, 1500, 1800, 2200].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'sine', 0.12), i * 60)); }
  happyFish() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, 'triangle', 0.14), i * 70)); }
  tryAgain() { this.tone(440, 0.15, 'square', 0.08); setTimeout(() => this.tone(330, 0.25, 'square', 0.08), 120); }
  xpGain() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'sine', 0.1), i * 80)); }
  bubblePop() {
    const c = this.getCtx(), o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(600, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.1);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.15);
  }
  roundStart() { [392, 494, 587, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, 'triangle', 0.13), i * 90)); }
  worldUnlock() { [262, 330, 392, 523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sine', 0.14), i * 100)); }
  bossVictory() { [523, 659, 784, 880, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'triangle', 0.16), i * 120)); }
}

/* ═══════════════════════════════════════════════════
   �  COLOR MAGIC INTRO SPLASH
   ═══════════════════════════════════════════════════
   Watery blue splash on first entry. Auto-dismisses
   after 2.5s. Web Speech "Color Magic!" voice.
   ═══════════════════════════════════════════════════ */

const ColorMagicSplash: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 2500);
    // Web Speech API — speak title once per session
    try {
      const KEY = 'cm_splash_spoken';
      if (!sessionStorage.getItem(KEY) && 'speechSynthesis' in window) {
        // Sparkle chime before speech
        try {
          const sCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          [1200, 1500, 1800, 2200].forEach((f, idx) => {
            const osc = sCtx.createOscillator(); const gn = sCtx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(f, sCtx.currentTime);
            gn.gain.setValueAtTime(0.1, sCtx.currentTime);
            gn.gain.exponentialRampToValueAtTime(0.001, sCtx.currentTime + 0.25);
            osc.connect(gn).connect(sCtx.destination);
            osc.start(sCtx.currentTime + idx * 0.06);
            osc.stop(sCtx.currentTime + idx * 0.06 + 0.25);
          });
        } catch { /* audio not available */ }
        setTimeout(() => {
          const u = new SpeechSynthesisUtterance('Coloooor Magic!');
          u.rate = 0.9; u.pitch = 1.4; u.volume = 0.7;
          speechSynthesis.speak(u);
        }, 300);
        sessionStorage.setItem(KEY, '1');
      }
    } catch { /* speech not available */ }
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(170deg, #0f2027 0%, #203a43 30%, #2c5364 60%, #1a8bc4 100%)',
        overflow: 'hidden',
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.12 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Floating bubbles */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <motion.div key={i}
          style={{
            position: 'absolute',
            width: 10 + i * 6, height: 10 + i * 6, borderRadius: '50%',
            background: `rgba(147,197,253,${0.08 + (i % 3) * 0.04})`,
            border: '1px solid rgba(147,197,253,0.15)',
            left: `${8 + i * 12}%`, bottom: -20,
          }}
          animate={{ y: [0, -(200 + i * 80)], opacity: [0, 0.7, 0] }}
          transition={{ duration: 2.5 + i * 0.3, delay: i * 0.15, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}

      {/* Title icon */}
      <motion.span style={{ fontSize: 80 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >🎨</motion.span>

      {/* Title */}
      <motion.h1 style={{
        fontSize: 'clamp(36px, 8vw, 56px)', fontWeight: 900, color: '#fff',
        textShadow: '0 0 30px rgba(59,130,246,0.8), 0 0 60px rgba(59,130,246,0.4)',
        letterSpacing: '-0.02em', marginTop: 12,
      }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >Color Magic</motion.h1>

      {/* Subtitle */}
      <motion.p style={{
        fontSize: 18, color: 'rgba(147,197,253,0.7)', fontWeight: 600, marginTop: 8,
      }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >Paint your magical world…</motion.p>

      {/* Sparkle particles */}
      {[0, 1, 2, 3, 4].map(i => (
        <motion.span key={`sp-${i}`} style={{
          position: 'absolute', fontSize: 22,
          left: `${12 + i * 20}%`, top: `${25 + (i * 17) % 45}%`,
        }}
          animate={{ y: [0, -24, 0], opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.8 + i * 0.3, delay: i * 0.25 }}
        >{['✨', '🫧', '💫', '🌊', '✨'][i]}</motion.span>
      ))}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   �🎨  PALETTE COLORS
   ═══════════════════════════════════════════════════ */

interface PaletteColor { name: string; hex: string; glow: string; glossLight: string; }

/** Auto-built from COLOR_SYSTEM — single source of truth */
const PALETTE: PaletteColor[] = ALL_COLORS.map(c => ({
  name: c.name, hex: c.hex, glow: c.glow, glossLight: c.glossLight,
}));

const getHex = (name: string) => NAME_TO_HEX[name] || '#fff';
const getColor = (name: string) => PALETTE.find(c => c.name === name) || PALETTE[0];

/* ═══════════════════════════════════════════════════
   🏷️  DIFFICULTY TIER BADGES
   ═══════════════════════════════════════════════════ */

const TIER_COLORS: Record<number, { bg: string; border: string; text: string; label: string }> = {
  1: { bg: 'rgba(34,197,94,0.18)',  border: 'rgba(34,197,94,0.5)',  text: '#fff', label: '🌱 Starter' },
  2: { bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.5)', text: '#fff', label: '🔍 Explorer' },
  3: { bg: 'rgba(251,191,36,0.18)', border: 'rgba(251,191,36,0.5)', text: '#fff', label: '🎯 Painter' },
  4: { bg: 'rgba(249,115,22,0.18)', border: 'rgba(249,115,22,0.5)', text: '#fff', label: '🔢 Counter' },
  5: { bg: 'rgba(236,72,153,0.18)', border: 'rgba(236,72,153,0.5)', text: '#fff', label: '🌈 Colorist' },
  6: { bg: 'rgba(139,92,246,0.18)', border: 'rgba(139,92,246,0.5)', text: '#fff', label: '🧠 Master' },
  7: { bg: 'rgba(251,191,36,0.22)', border: 'rgba(251,191,36,0.6)', text: '#fff', label: '🏆 Legend' },
};

const DifficultyBadge: React.FC<{ phase: number }> = ({ phase }) => {
  const tier = TIER_COLORS[phase] || TIER_COLORS[1];
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: tier.bg, border: `2px solid ${tier.border}`,
        borderRadius: 16, padding: '4px 16px',
        fontSize: 16, fontWeight: 800, color: tier.text,
        boxShadow: `0 0 12px ${tier.border}`,
      }}
    >{tier.label}</motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   💬  MASCOT MESSAGES
   ═══════════════════════════════════════════════════ */

const PRAISE = ['Great job! ⭐','Beautiful! 🌟','Amazing! 🎨','Wonderful! 🎉','Perfect! 💎','Super! 🌈','Fantastic! ✨','Brilliant! 💫','So pretty! 🦋','Love it! 🫧'];
const WRONG_MSGS = ['Try a different colour! 🎨','Not that one — look again! 👀','Pick the right colour first! 🖌️','Almost! Check the instruction 😊'];
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

/* ═══════════════════════════════════════════════════
   🧠  DYNAMIC INSTRUCTION BUILDER
   ═══════════════════════════════════════════════════
   Builds shape-name-aware instructions AFTER shapes
   are picked. Formula: Action + Object + Color + Count
   ═══════════════════════════════════════════════════ */

function buildDynamicInstruction(
  config: LevelConfig,
  shapes: GameShape[],
  targetShapeId: string | null,
): string {
  const c = config.targetColors[0] || '';
  const names = shapes.map(s => s.name.toUpperCase());

  switch (config.phaseType) {
    case 'single_recognition': {
      if (shapes.length === 1) {
        return `🎨 Tap the ${names[0]}. Paint it ${c}!`;
      }
      return `🎨 Tap the shape. Paint it ${c}!`;
    }

    case 'find_and_paint': {
      const target = shapes.find(s => s.id === targetShapeId);
      if (target) {
        return `🔍 Find the ${target.name.toUpperCase()}. Paint it ${c}!`;
      }
      return `🔍 Find the right shape. Paint it ${c}!`;
    }

    case 'paint_all_type': {
      const typeName = (config.targetShapeType || 'shape').toUpperCase();
      const count = shapes.filter(s => s.name === config.targetShapeType).length;
      if (count === 1) return `🎨 Paint the ${typeName} ${c}!`;
      return `🎨 Paint ALL ${count} ${typeName}S ${c}!`;
    }

    case 'count_target': {
      const typeName = (config.targetShapeType || 'shape').toUpperCase();
      const ct = config.targetCount || 2;
      return `🔢 Paint ${ct} ${typeName}${ct > 1 ? 'S' : ''} ${c}!`;
    }

    case 'multi_color':
      return '\uD83C\uDFA8 Each shape says what color it wants!\nPaint them all!';

    case 'mega_master':
      return '🏆 Paint by letter! Match each letter to its color.';

    case 'advanced_logic': {
      if (config.avoidColor) return `🚫 Skip the ${config.avoidColor} shapes!\nPaint all others ${c}.`;
      if (config.sizeRule) return `📐 Paint ONLY the ${config.sizeRule.toUpperCase()} shapes ${c}!`;
      if (config.toneOptions) return `🎯 Pick only ${c}. Not the similar colors!`;
      if (config.letterHint) return `🔤 "${config.letterHint}" = ${c}. Paint ALL shapes ${c}!`;
      if (config.colorAssignments !== undefined) return '\uD83C\uDFA8 Read each bubble.\nPaint each shape its color!';
      return `🧠 Paint ALL shapes ${c}!`;
    }

    default:
      return config.instruction;
  }
}

/* ═══════════════════════════════════════════════════
   ✨  GLOWING INSTRUCTION TEXT RENDERER
   ═══════════════════════════════════════════════════
   Contrast-safe: detects warm-hue backgrounds and
   shifts red/orange text to white-with-glow to avoid
   Red-on-Red invisibility (Master Kingdom fix).
   ═══════════════════════════════════════════════════ */

/** Returns true if the world background is warm (red / orange / amber) */
function isWarmBackground(worldId: number): boolean {
  return worldId === 3; // Master Kingdom has red/orange gradient
}

/**
 * Contrast-aware text color for transparent headers.
 * Since headers are now transparent, text must contrast against the world gradient:
 *   World 0 (Coral Cove): deep blue → white text ✔
 *   World 1 (Rainbow Reef): purple → white text ✔
 *   World 2 (Puzzle Palace): green/teal → white text ✔
 *   World 3 (Master Kingdom): red/orange/amber → slightly brighter white with text-shadow
 *   World 4 (Mega Master): deep blue → white text ✔
 */
function getContrastText(worldId: number): React.CSSProperties {
  if (worldId === 3) {
    // Master Kingdom: warm amber-orange gradient — pure white + strong shadow
    return {
      color: '#fff',
      textShadow: '0 1px 10px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.3)',
    };
  }
  if (worldId === 2) {
    // Puzzle Palace: green-teal gradient — white with subtle teal shadow
    return {
      color: '#f0fdf4',
      textShadow: '0 1px 8px rgba(0,0,0,0.4), 0 0 16px rgba(5,150,105,0.2)',
    };
  }
  // Default (deep blue worlds): standard light blue-white
  return {
    color: '#e0e7ff',
    textShadow: '0 1px 8px rgba(59,130,246,0.3)',
  };
}

const GlowInstruction: React.FC<{ text: string; targetColors: string[]; worldId?: number }> = ({ text, targetColors, worldId }) => {
  const warmBg = worldId !== undefined && isWarmBackground(worldId);
  // Split lines on \n for multi-line instructions
  const lines = text.split('\n');

  return (
    <span style={{ display: 'inline' }}>
      {lines.map((line, lineIdx) => {
        const parts: React.ReactNode[] = [];
        const colorPattern = new RegExp(`\\b(${ALL_COLOR_NAMES.join('|')})\\b`, 'gi');
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = colorPattern.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(<span key={`t-${lineIdx}-${lastIndex}`}>{line.slice(lastIndex, match.index)}</span>);
          }
          const colorName = match[1];
          const c = getColor(colorName);
          const isTarget = targetColors.some(tc => tc.toLowerCase() === colorName.toLowerCase());

          const isWarmColor = ['Red', 'Orange', 'Pink'].some(wc => wc.toLowerCase() === colorName.toLowerCase());
          const needsContrastShift = warmBg && isWarmColor;

          parts.push(
            <span key={`c-${lineIdx}-${match.index}`} className={isTarget ? 'cm-glow-word' : ''}
              style={{
                color: needsContrastShift ? '#fff' : c.hex,
                fontWeight: 900,
                textShadow: needsContrastShift
                  ? `0 0 12px ${c.hex}, 0 0 24px ${c.hex}, 0 2px 6px rgba(0,0,0,0.5)`
                  : isTarget
                    ? `0 0 16px ${c.glow}, 0 0 32px ${c.glow}, 0 2px 4px rgba(0,0,0,0.25)`
                    : `0 0 6px ${c.glow}`,
                ...(needsContrastShift ? {
                  background: `linear-gradient(135deg, ${c.hex}30, ${c.hex}15)`,
                  borderRadius: 6, padding: '0 4px',
                  border: `1px solid ${c.hex}50`,
                } : {}),
              }}
            >{colorName}</span>
          );
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < line.length) {
          parts.push(<span key={`t-${lineIdx}-end`}>{line.slice(lastIndex)}</span>);
        }
        return (
          <React.Fragment key={`line-${lineIdx}`}>
            {lineIdx > 0 && <br />}
            {parts}
          </React.Fragment>
        );
      })}
    </span>
  );
};

/* ═══════════════════════════════════════════════════
   ZONE 4 — SUBTLE ANIMATED BACKGROUND
   ═══════════════════════════════════════════════════ */

const SubtleBackground = React.memo(({ gradient }: { gradient: string }) => {
  const data = useRef({
    rays: Array.from({ length: 5 }, (_, i) => ({
      id: i, left: 10 + i * 20, width: 80 + Math.random() * 60,
      opacity: 0.03 + Math.random() * 0.04, delay: i * 1.5,
    })),
    dots: Array.from({ length: 16 }, (_, i) => ({
      id: i, left: Math.random() * 100, top: Math.random() * 100,
      size: 2 + Math.random() * 3, dur: 5 + Math.random() * 7, delay: Math.random() * 6,
    })),
  });
  const d = data.current;

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      zIndex: 0, background: gradient, willChange: 'transform', transform: 'translateZ(0)',
    }}>
      {/* Soft light rays */}
      {d.rays.map(r => (
        <div key={r.id} className="cm-light-ray" style={{
          position: 'absolute', top: -20, left: `${r.left}%`, width: r.width, height: '120%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 60%)',
          opacity: r.opacity, transformOrigin: 'top center',
          transform: `rotate(${-8 + r.id * 4}deg) translateZ(0)`,
          animationDelay: `${r.delay}s`,
        }} />
      ))}
      {/* Soft floating dots */}
      {d.dots.map(p => (
        <div key={p.id} className="cm-sea-particle" style={{
          position: 'absolute', left: `${p.left}%`, top: `${p.top}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
          willChange: 'transform, opacity',
        }} />
      ))}
    </div>
  );
});

/* ═══════════════════════════════════════════════════
   🎊  MINIMAL CONFETTI (24 PIECES)
   ═══════════════════════════════════════════════════ */

const CC = ['#ef4444', '#3b82f6', '#fbbf24', '#22c55e', '#ec4899', '#8b5cf6', '#f97316'];
const Confetti: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 50 }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div key={i}
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
            y: -20, rotate: Math.random() * 360, opacity: 1,
          }}
          animate={{
            y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 40,
            rotate: Math.random() * 540, opacity: 0,
          }}
          transition={{ duration: 2.2 + Math.random() * 1.2, delay: Math.random() * 0.4, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            width: 8 + Math.random() * 6, height: 8 + Math.random() * 6,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
            background: CC[Math.floor(Math.random() * CC.length)],
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   🐾  MASCOT BUBBLE (ANCHORED TO STAGE)
   ═══════════════════════════════════════════════════ */

/* FoxMascot — imported from shared component */

/* ═══════════════════════════════════════════════════
   🗺️  WORLD PICKER & LEVEL GRID
   ═══════════════════════════════════════════════════
   Moved to:
     child/levels/ColorMagicWorlds.tsx   — World selection screen
     child/levels/ColorMagicLevels.tsx   — Per-world level grid
     child/levels/worldConfig.ts          — World theme data
     child/levels/WorldBackground.tsx     — Dynamic atmosphere
     child/levels/WorldHeader.tsx         — Floating world banner
     child/levels/LevelTile.tsx           — Premium level tile
   ═══════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════
   ✅  LEVEL COMPLETE SCREEN
   ═══════════════════════════════════════════════════ */

const LevelComplete: React.FC<{
  config: LevelConfig; starsEarned: number; xpEarned: number; isBoss: boolean;
  onNext: () => void; onMap: () => void;
}> = ({ config, starsEarned, xpEarned, isBoss, onNext, onMap }) => {
  const world = getWorldMeta(Math.max(0, config.world));
  const milestone = getMilestoneReward(config.level);
  return (
    <div style={S.wrapper}>
      <SubtleBackground gradient={world.themeGradient} />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flex: 1, gap: 24, zIndex: 2, padding: 32,
      }}>
        <motion.div
          initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          style={{ fontSize: isBoss ? 96 : 72 }}
        >{isBoss ? '🏆' : '⭐'}</motion.div>

        <motion.div initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
          style={{ fontSize: 34, fontWeight: 900, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.3)', textAlign: 'center' }}
        >{isBoss ? '🎖️ Boss Defeated!' : 'Level Complete!'}</motion.div>

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 14 }}
          style={{ display: 'flex', gap: 12, fontSize: 44 }}
        >
          {[1, 2, 3].map(s => (
            <motion.span key={s} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + s * 0.16, type: 'spring', stiffness: 300 }}
            >{s <= starsEarned ? '⭐' : '☆'}</motion.span>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          style={{
            fontSize: 26, fontWeight: 900, color: '#fbbf24',
            textShadow: '0 0 16px rgba(251,191,36,0.4)',
          }}
        >+{xpEarned} XP</motion.div>

        {/* Milestone reward celebration */}
        {milestone && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.95, type: 'spring', stiffness: 200, damping: 14 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))',
              border: '2px solid rgba(251,191,36,0.35)',
              borderRadius: 20, padding: '10px 28px',
              boxShadow: '0 0 24px rgba(251,191,36,0.2)',
            }}
          >
            <span style={{ fontSize: 36 }}>{milestone.emoji}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fde68a' }}>🎉 {milestone.title}!</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24' }}>+{milestone.xpBonus} Bonus XP</span>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: milestone ? 1.2 : 1.0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>Level {config.level}</span>
          <DifficultyBadge phase={config.phase} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
          style={{ display: 'flex', gap: 16, marginTop: 16 }}
        >
          <button onClick={onMap} style={S.btnSecondary}>
            <span style={{ fontSize: 24 }}>🗺️</span> Map
          </button>
          <button onClick={onNext} style={S.btnPrimary}>
            <span style={{ fontSize: 24 }}>▶</span> Next Level
          </button>
        </motion.div>
      </div>
      <Confetti show />
      <style>{PAGE_CSS}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   🃏  SHAPE CARD — CLEAN CENTERED DESIGN
   ═══════════════════════════════════════════════════ */

const ShapeCard: React.FC<{
  shape: GameShape; isFilled: boolean; isGolden: boolean; isWrong: boolean;
  showSplash: boolean; fillHex: string; size: number; delay: number;
  label?: string; sizeTag?: 'big' | 'small'; colorLabel?: string;
  onTap: () => void;
}> = ({ shape, isFilled, isGolden, isWrong, showSplash, fillHex, size, delay, label, sizeTag, colorLabel, onTap }) => {
  const fillColor = isFilled ? fillHex : 'rgba(255,255,255,0.08)';
  const svgScale = sizeTag === 'big' ? '85%' : sizeTag === 'small' ? '55%' : '78%';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isWrong ? [1, 1.06, 0.94, 1.03, 1] : 1, opacity: 1 }}
      transition={{
        default: { delay, type: 'spring', stiffness: 280, damping: 18 },
        scale: isWrong ? { duration: 0.4, ease: 'easeInOut' } : undefined,
      }}
      onClick={isFilled ? undefined : onTap}
      whileHover={isFilled ? {} : { scale: 1.04, y: -4 }}
      whileTap={isFilled ? {} : { scale: 0.92 }}
      style={{
        width: '100%', maxWidth: 320, aspectRatio: '1/1',
        cursor: isFilled ? 'default' : 'pointer',
        position: 'relative',
        borderRadius: 24,
        background: isFilled
          ? `radial-gradient(circle at 40% 35%, ${fillHex}25, ${fillHex}08, transparent 70%)`
          : 'rgba(255,255,255,0.03)',
        boxShadow: isGolden && !isFilled
          ? '0 0 24px rgba(251,191,36,0.35), inset 0 0 16px rgba(251,191,36,0.06)'
          : isFilled
            ? `0 0 20px ${fillHex}40, 0 4px 16px rgba(0,0,0,0.1)`
            : '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
        border: isGolden && !isFilled
          ? '2.5px solid rgba(251,191,36,0.45)'
          : isFilled ? `2.5px solid ${fillHex}50` : '2px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 8,
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' as const,
        overflow: 'visible', willChange: 'transform', transform: 'translateZ(0)',
      }}
    >
      {/* Shape SVG — centered, responsive */}
      <div style={{ width: svgScale, height: svgScale, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.2s, height 0.2s' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
          {shape.render(fillColor)}
        </svg>
      </div>

      {/* Paint splash — quick, clean */}
      {showSplash && (
        <motion.div initial={{ scale: 0, opacity: 0.7 }} animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute', width: '40%', height: '40%', borderRadius: '50%',
            background: `radial-gradient(circle, ${fillHex}90, ${fillHex}30, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Size tag badge — HIGH CONTRAST */}
      {sizeTag && (
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          borderRadius: 10, padding: '3px 10px',
          fontSize: 14, fontWeight: 900, color: '#fff',
          border: '1.5px solid rgba(255,255,255,0.25)', textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}>{sizeTag === 'big' ? '🔷 BIG' : '🔹 SMALL'}</div>
      )}

      {/* Paint-me speech bubble — direct command mode for per-shape colors */}
      {colorLabel && !isFilled ? (
        <div style={{
          position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none', zIndex: 4,
          display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)',
            borderRadius: 14, padding: '5px 14px',
            border: `2px solid ${getHex(colorLabel)}60`,
            boxShadow: `0 0 14px ${getHex(colorLabel)}30, 0 4px 12px rgba(0,0,0,0.4)`,
            whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>Paint me</span>
            <span style={{
              fontSize: 15, fontWeight: 900, color: getHex(colorLabel),
              textShadow: `0 0 10px ${getHex(colorLabel)}80`,
            }}>{colorLabel}</span>
            <span style={{ fontSize: 13 }}>🖌️</span>
          </div>
          {/* Bubble pointer */}
          <div style={{
            width: 0, height: 0,
            borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
            borderTop: '7px solid rgba(0,0,0,0.82)',
            marginTop: -1,
          }} />
        </div>
      ) : null}

      {/* Label: shape name or colour — HIGH CONTRAST WHITE PILL */}
      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        fontSize: 14, fontWeight: 900, color: '#fff',
        whiteSpace: 'nowrap', pointerEvents: 'none', textAlign: 'center',
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        borderRadius: 10, padding: '3px 12px',
        border: '1.5px solid rgba(255,255,255,0.2)',
        letterSpacing: '0.02em',
      }}>
        {colorLabel ? (
          <span style={{
            color: '#fff', fontWeight: 900, fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
              background: getHex(colorLabel), border: '1.5px solid rgba(255,255,255,0.5)',
              flexShrink: 0,
            }} />
            {colorLabel}
          </span>
        ) : label ? label : `${shape.emoji} ${shape.name}`}
      </div>

      {/* ✓ Checkmark — 16px inward, circular badge with strong shadow */}
      {isFilled && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.3 }}
          style={{
            position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#fff', fontWeight: 900,
            boxShadow: '0 3px 12px rgba(34,197,94,0.55), 0 0 0 3px rgba(255,255,255,0.9)',
            border: '3px solid #fff',
          }}>✓</motion.div>
      )}

      {/* Golden badge */}
      {isGolden && !isFilled && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 12, -12, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute', top: -6, left: -6, fontSize: 22, pointerEvents: 'none',
            filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))',
          }}>⭐</motion.div>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   🎮  LEVEL PLAY SCREEN — 4-ZONE STRUCTURED LAYOUT
   ═══════════════════════════════════════════════════ */

const LevelPlay: React.FC<{
  config: LevelConfig; progress: PlayerProgress;
  onComplete: (stars: number, xp: number) => void; onBack: () => void;
}> = ({ config, progress, onComplete, onBack }) => {
  const play = useSoundPlay();
  const triggerMascot = useMascotTrigger();
  const sounds = useRef(new ColorSounds());

  /* ── state ── */
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [shapes, setShapes] = useState<GameShape[]>([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [filledSet, setFilledSet] = useState<Set<string>>(new Set());
  const [lastFilledId, setLastFilledId] = useState<string | null>(null);
  const [wrongShakeId, setWrongShakeId] = useState<string | null>(null);
  const [goldenId, setGoldenId] = useState<string | null>(null);
  const [mascotMsg, setMascotMsg] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [shapeSizes, setShapeSizes] = useState<Record<string, 'big' | 'small'>>({});
  const [shapeColorMap, setShapeColorMap] = useState<Record<string, string>>({});
  const [targetShapeId, setTargetShapeId] = useState<string | null>(null);
  const [dynamicInstruction, setDynamicInstruction] = useState('');

  /* ── Mega Master state ── */
  const [megaObject, setMegaObject] = useState<SegmentedObject | null>(null);
  const [megaPartFills, setMegaPartFills] = useState<Record<string, string>>({});
  const [megaAssignments, setMegaAssignments] = useState<Record<string, string>>({});
  const [wrongPartId, setWrongPartId] = useState<string | null>(null);
  const isMegaMaster = config.phaseType === 'mega_master';

  const timers = useRef<number[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  const later = (fn: () => void, ms: number) => { const id = window.setTimeout(fn, ms); timers.current.push(id); return id; };

  const world = getWorldMeta(Math.max(0, config.world));
  const availableColors = useMemo(() => {
    // Dynamic: show exactly the colors the level uses (config.colorCount),
    // always drawn from the central palette in canonical order.
    return PALETTE.slice(0, config.colorCount);
  }, [config.colorCount]);
  const targetHex = getHex(config.targetColors[0]);

  /* ── dynamic shape sizing — responsive for single horizontal row ── */
  const shapeCardSize = useMemo(() => {
    const n = config.shapeCount;
    // Scale shapes so they always fit in one row across the viewport
    if (n <= 1) return 'clamp(240px, 28vw, 340px)';
    if (n <= 2) return 'clamp(200px, 22vw, 300px)';
    if (n <= 3) return 'clamp(180px, 18vw, 260px)';
    if (n <= 4) return 'clamp(160px, 16vw, 240px)';
    if (n <= 6) return 'clamp(130px, 13vw, 200px)';
    return 'clamp(110px, 11vw, 170px)';
  }, [config.shapeCount]);

  /* ── initialise level ── */
  useEffect(() => {
    /* ── MEGA MASTER: segmented object setup ── */
    if (config.phaseType === 'mega_master' && config.segmentedObjectId) {
      const obj = getSegmentedObject(config.segmentedObjectId);
      if (obj) {
        setMegaObject(obj);
        // Assign colors to parts randomly from available palette
        const assignments: Record<string, string> = {};
        const shuffledColors = [...config.targetColors].sort(() => Math.random() - 0.5);
        obj.parts.forEach((part, i) => {
          assignments[part.id] = shuffledColors[i % shuffledColors.length];
        });
        setMegaAssignments(assignments);
        setMegaPartFills({});
        setWrongPartId(null);
      }
      setShapes([]);
      setDynamicInstruction(buildDynamicInstruction(config, [], null));
      sounds.current.roundStart();
      later(() => setPhase('playing'), 1800);
      return;
    }

    let s: GameShape[];

    /* Shape picking — Tier 3 & 4 need controlled composition */
    if ((config.phaseType === 'paint_all_type' || config.phaseType === 'count_target') && config.targetShapeType) {
      let targetOfType: number;
      if (config.phaseType === 'count_target' && config.targetCount) {
        const extra = 1 + Math.floor(Math.random() * 2);
        targetOfType = Math.min(config.targetCount + extra, config.shapeCount - 1);
        targetOfType = Math.max(targetOfType, config.targetCount);
      } else {
        targetOfType = Math.max(2, Math.ceil(config.shapeCount * 0.4));
      }
      const distractorCount = Math.max(1, config.shapeCount - targetOfType);
      const targets = pickShapeClones(config.targetShapeType, targetOfType, config.maxShapeDifficulty);
      const distractors = pickDistractorShapes(config.targetShapeType, distractorCount, config.maxShapeDifficulty);
      s = shuffleArray([...targets, ...distractors]);
    } else {
      s = pickRandomShapes(config.shapeCount, config.maxShapeDifficulty);
    }
    setShapes(s);

    let localTargetShapeId: string | null = null;

    if (config.phaseType === 'find_and_paint') {
      const t = s[Math.floor(Math.random() * s.length)];
      localTargetShapeId = t.id;
      setTargetShapeId(t.id);
    }

    if (config.sizeRule) {
      const sizeMap: Record<string, 'big' | 'small'> = {};
      s.forEach(sh => { sizeMap[sh.id] = Math.random() > 0.5 ? 'big' : 'small'; });
      const targetSize = config.sizeRule;
      if (!Object.values(sizeMap).includes(targetSize) && s.length > 0) sizeMap[s[0].id] = targetSize;
      setShapeSizes(sizeMap);
    }

    if (config.phaseType === 'multi_color' || config.colorAssignments !== undefined) {
      const colMap: Record<string, string> = {};
      const availColors = config.targetColors.length > 0 ? config.targetColors : ALL_COLOR_NAMES.slice(0, 3) as string[];
      s.forEach((sh, i) => { colMap[sh.id] = availColors[i % availColors.length]; });
      setShapeColorMap(colMap);
    }

    const golden = config.goldenChance > 0 && Math.random() < config.goldenChance && s.length > 0
      ? s[Math.floor(Math.random() * s.length)].id : null;
    setGoldenId(golden);

    if (config.autoSelectColor) setSelectedColor(config.targetColors[0]);

    setDynamicInstruction(buildDynamicInstruction(config, s, localTargetShapeId));

    sounds.current.roundStart();
    later(() => setPhase('playing'), 1800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.level]);

  /* ── correct tap check ── */
  const isCorrectTap = useCallback((shape: GameShape): boolean => {
    switch (config.phaseType) {
      case 'single_recognition': return selectedColor === config.targetColors[0];
      case 'find_and_paint':     return shape.id === targetShapeId && selectedColor === config.targetColors[0];
      case 'paint_all_type':     return shape.name === config.targetShapeType && selectedColor === config.targetColors[0];
      case 'count_target':       return shape.name === config.targetShapeType && selectedColor === config.targetColors[0];
      case 'multi_color':        return selectedColor === shapeColorMap[shape.id];
      case 'advanced_logic': {
        if (config.avoidColor) return selectedColor === config.targetColors[0] && selectedColor !== config.avoidColor;
        if (config.sizeRule) return shapeSizes[shape.id] === config.sizeRule && selectedColor === config.targetColors[0];
        if (config.toneOptions) return selectedColor === config.targetColors[0];
        if (config.colorAssignments !== undefined && Object.keys(shapeColorMap).length > 0) return selectedColor === shapeColorMap[shape.id];
        if (config.letterHint) return selectedColor === config.targetColors[0];
        return selectedColor === config.targetColors[0];
      }
      default: return selectedColor === config.targetColors[0];
    }
  }, [config, selectedColor, targetShapeId, shapeSizes, shapeColorMap]);

  /* ── should this shape be painted? ── */
  const shouldPaint = useCallback((shape: GameShape): boolean => {
    switch (config.phaseType) {
      case 'find_and_paint':  return shape.id === targetShapeId;
      case 'paint_all_type':  return shape.name === config.targetShapeType;
      case 'count_target':    return shape.name === config.targetShapeType;
      case 'advanced_logic':  {
        if (config.sizeRule) return shapeSizes[shape.id] === config.sizeRule;
        return true;
      }
      default:                return true;
    }
  }, [config.phaseType, config.sizeRule, config.targetShapeType, targetShapeId, shapeSizes]);

  const totalToPaint = useMemo(() => {
    if (config.phaseType === 'mega_master') {
      return Object.keys(megaAssignments).length;
    }
    if (config.phaseType === 'count_target' && config.targetCount) {
      return config.targetCount;
    }
    return shapes.filter(s => shouldPaint(s)).length;
  }, [shapes, shouldPaint, config.phaseType, config.targetCount, megaAssignments]);
  const correctFilled = useMemo(() => {
    if (config.phaseType === 'mega_master') {
      return Object.keys(megaPartFills).length;
    }
    return shapes.filter(s => filledSet.has(s.id) && shouldPaint(s)).length;
  }, [shapes, filledSet, shouldPaint, config.phaseType, megaPartFills]);

  /* ── handle shape tap ── */
  const handleShapeTap = useCallback((shape: GameShape) => {
    if (phase !== 'playing' || filledSet.has(shape.id)) return;

    if (!selectedColor) {
      sounds.current.tryAgain();
      setMascotMsg('Pick a colour first! 🎨');
      later(() => setMascotMsg(''), 2200);
      return;
    }

    if (!shouldPaint(shape)) {
      sounds.current.tryAgain(); play('wrong');
      setMistakes(m => m + 1);
      setWrongShakeId(shape.id); later(() => setWrongShakeId(null), 550);
      triggerMascot('thinking');
      if (config.phaseType === 'paint_all_type' || config.phaseType === 'count_target') {
        setMascotMsg(`Only color the ${config.targetShapeType || 'correct shape'}s! 🎯`);
      } else if (config.phaseType === 'find_and_paint') {
        setMascotMsg('Find the right shape! 🔍');
      } else if (config.sizeRule) {
        setMascotMsg(`Only the ${config.sizeRule} shapes! 📐`);
      } else {
        setMascotMsg(pick(WRONG_MSGS));
      }
      later(() => setMascotMsg(''), 2400);
      return;
    }

    if (!isCorrectTap(shape)) {
      sounds.current.tryAgain(); play('wrong');
      setMistakes(m => m + 1);
      setWrongShakeId(shape.id); later(() => setWrongShakeId(null), 550);
      triggerMascot('thinking');
      if (config.avoidColor && selectedColor === config.avoidColor) {
        setMascotMsg(`NOT ${config.avoidColor}! Pick ${config.targetColors[0]}! 🧠`);
      } else if ((config.phaseType === 'multi_color' || config.colorAssignments !== undefined) && shapeColorMap[shape.id]) {
        setMascotMsg(`This shape needs ${shapeColorMap[shape.id]}! 🌈`);
      } else {
        setMascotMsg(pick(WRONG_MSGS));
      }
      later(() => setMascotMsg(''), 2400);
      return;
    }

    /* correct! paint it */
    sounds.current.paintPop(); play('correct');
    const newFilled = new Set(filledSet);
    newFilled.add(shape.id);
    setFilledSet(newFilled);
    setLastFilledId(shape.id); later(() => setLastFilledId(null), 650);

    const pts = goldenId === shape.id ? 30 : 10;
    setXpAmount(pts); setShowXP(true); later(() => setShowXP(false), 750);

    const newCorrectCount = shapes.filter(s => newFilled.has(s.id) && shouldPaint(s)).length;
    if (newCorrectCount < totalToPaint) {
      setMascotMsg(pick(PRAISE)); triggerMascot('happy');
      later(() => setMascotMsg(''), 1800);
    }
    if (newCorrectCount >= totalToPaint) handleLevelComplete();
  }, [phase, filledSet, selectedColor, shapes, shouldPaint, isCorrectTap, goldenId, totalToPaint, config]);

  /* ── level complete ── */
  const handleLevelComplete = useCallback(() => {
    setPhase('done');
    sounds.current.sparkleChime(); play('celebrate'); triggerMascot('celebrate');
    setShowConfetti(true); later(() => setShowConfetti(false), 3000);
    setMascotMsg('Amazing! 🎉'); later(() => setMascotMsg(''), 2400);

    const starsEarned = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : mistakes <= 3 ? 2 : 1;
    const xp = config.xpReward + (goldenId && filledSet.has(goldenId) ? 20 : 0);
    if (config.isBoss) sounds.current.bossVictory();
    later(() => onComplete(starsEarned, xp), 2600);
  }, [mistakes, config, goldenId, filledSet, onComplete]);

  /* ── colour tap ── */
  const handleColorTap = (c: PaletteColor) => {
    if (phase !== 'playing' || config.autoSelectColor) return;
    setSelectedColor(c.name);
    sounds.current.bubblePop();
  };

  /* ── Mega Master: handle part tap ── */
  const handlePartTap = useCallback((partId: string) => {
    if (phase !== 'playing' || megaPartFills[partId]) return;

    if (!selectedColor) {
      sounds.current.tryAgain();
      setMascotMsg('Pick a colour first! 🎨');
      later(() => setMascotMsg(''), 2200);
      return;
    }

    const assignedColor = megaAssignments[partId];
    if (selectedColor !== assignedColor) {
      sounds.current.tryAgain(); play('wrong');
      setMistakes(m => m + 1);
      setWrongPartId(partId);
      later(() => setWrongPartId(null), 550);
      triggerMascot('thinking');
      const letter = NAME_TO_LETTER[assignedColor] || assignedColor[0];
      setMascotMsg(`Check the letter! "${letter}" = ${assignedColor}! 🔤`);
      later(() => setMascotMsg(''), 2800);
      return;
    }

    /* correct! paint the part */
    sounds.current.paintPop(); play('correct');
    const newFills = { ...megaPartFills, [partId]: getHex(assignedColor) };
    setMegaPartFills(newFills);

    const pts = 15;
    setXpAmount(pts); setShowXP(true); later(() => setShowXP(false), 750);

    const filledCount = Object.keys(newFills).length;
    const totalParts = Object.keys(megaAssignments).length;

    /* Silent validation — no per-part praise or checkmark.
       Only trigger celebration when ALL parts are correctly filled. */
    if (filledCount >= totalParts) handleLevelComplete();
  }, [phase, megaPartFills, megaAssignments, selectedColor, handleLevelComplete]);

  const getFillHex = (shape: GameShape): string => {
    // multi_color and advanced_logic with colorAssignments: each shape has its own assigned color
    if (
      (config.phaseType === 'multi_color' || (config.phaseType === 'advanced_logic' && config.colorAssignments !== undefined))
      && filledSet.has(shape.id)
      && shapeColorMap[shape.id]
    ) {
      return getHex(shapeColorMap[shape.id]);
    }
    return targetHex;
  };

  /* ═══════════════════════════════════════════════════
     RENDER — SINGLE IMMERSIVE GAME SURFACE
     ═══════════════════════════════════════════════════ */

  return (
    <div style={S.wrapper}>

      {/* ══════════════════════════════════════════════
          ZONE 4 — SUBTLE BACKGROUND (behind all)
          ══════════════════════════════════════════════ */}
      <SubtleBackground gradient={world.themeGradient} />

      {/* ═══ GAME TOP — Compact Navigation ═══ */}
      <div style={S.gameTop}>
        <div style={S.worldHeaderRow}>
          <motion.button onClick={onBack} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={S.backBtn}>
            <span style={{ fontSize: 22 }}>←</span>
          </motion.button>
          <div style={S.worldHeaderInfo}>
            <span style={{ fontSize: 24 }}>{world.emoji}</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{world.name}</span>
          </div>
          <DifficultyBadge phase={config.phase} />
          <div style={S.levelPill}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: '0.05em' }}>LEVEL</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#fde68a' }}>{config.level}</span>
          </div>
        </div>
      </div>

      {/* ═══ GAME CONTENT — Single Immersive Surface ═══ */}
      <div style={S.gameContent}>
        {/* Floating question text — no container */}
        {phase !== 'intro' && (
          <p style={{ ...S.questionText, ...getContrastText(config.world) }}>
            <span style={{ marginRight: 6, flexShrink: 0 }}>{PHASE_META[config.phase]?.emoji || '🎨'}</span>
            <GlowInstruction text={dynamicInstruction || config.instruction} targetColors={config.targetColors} worldId={config.world} />
          </p>
        )}

        {/* Progress */}
        {phase !== 'intro' && (
          <div style={S.progressRow}>
            <div style={S.progressTrack}>
              <motion.div
                animate={{ width: `${totalToPaint > 0 ? (correctFilled / totalToPaint) * 100 : 0}%` }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                style={S.progressFill}
              />
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24', minWidth: 36, textAlign: 'center' }}>
              {correctFilled}/{totalToPaint}
            </span>
          </div>
        )}

        {/* Phase-specific hints */}
        {config.phaseType === 'advanced_logic' && config.letterHint && phase === 'playing' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 16 }}
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: targetHex,
              textShadow: `0 0 24px ${getColor(config.targetColors[0]).glow}`,
              borderRadius: 14, padding: '2px 20px',
              textAlign: 'center',
            }}
          >
            {config.letterHint} = <span className="cm-glow-word">{config.targetColors[0]}</span>
          </motion.div>
        )}

        {config.phaseType === 'advanced_logic' && config.avoidColor && !config.letterHint && phase === 'playing' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 16 }}
            style={{
              fontSize: 18, fontWeight: 900, color: '#ef4444',
              borderRadius: 12, padding: '4px 16px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: 24 }}>🚫</span>
            NOT <span style={{
              color: getHex(config.avoidColor),
              textShadow: `0 0 10px ${getColor(config.avoidColor).glow}`,
            }}>{config.avoidColor}</span>!
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 16, width: '100%', height: '100%',
              }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 14 }}
                style={{ fontSize: 52, fontWeight: 900, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.3)', textAlign: 'center' }}
              >
                {config.isBoss ? pick(BOSS_TITLES) : `Level ${config.level}`}
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                style={{
                  fontSize: 24, fontWeight: 800, color: '#e0e7ff',
                  padding: '10px 32px', borderRadius: 20, textAlign: 'center',
                }}
              >
                {config.title} {PHASE_META[config.phase]?.emoji}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <DifficultyBadge phase={config.phase} />
              </motion.div>
              <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.7, duration: 0.35 }}
                style={{ fontSize: 48 }}
              >{isMegaMaster ? '🏆' : '🖌️'}</motion.div>
            </motion.div>
          )}

          {/* ─── MEGA MASTER: Balanced Centered Layout ─── */}
          {(phase === 'playing' || phase === 'done') && isMegaMaster && megaObject && (
            <motion.div key="mega" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 40,
                maxWidth: 1100,
                margin: '0 auto',
                width: '100%',
                padding: '12px 24px',
              }}
            >
              {/* Color Legend — close to figure */}
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 10,
                  padding: '14px 16px', borderRadius: 18,
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.6)', textAlign: 'center', letterSpacing: '0.05em' }}>🔤 COLOR KEY</span>
                {config.targetColors.map(colorName => {
                  const letter = NAME_TO_LETTER[colorName] || colorName[0].toUpperCase();
                  const hex = getHex(colorName);
                  return (
                    <div key={colorName} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1,
                        background: hex, width: 40, height: 40, borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2.5px solid rgba(255,255,255,0.55)',
                        boxShadow: `0 0 10px ${hex}60`,
                        flexShrink: 0,
                      }}>{letter}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{colorName}</span>
                    </div>
                  );
                })}
              </motion.div>

              {/* Segmented Figure */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 12, flex: 1, maxWidth: 500,
              }}>
                {/* Segmented Object Card */}
                <motion.div
                  style={{
                    width: '100%', maxWidth: 480,
                    aspectRatio: '1/1', maxHeight: '60vh',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 24, padding: 20,
                    border: '2.5px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 2px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'visible',
                  }}
                >
                  <svg viewBox={megaObject.viewBox} width="100%" height="100%" style={{ overflow: 'visible' }}>
                    {megaObject.parts.map((part) => {
                      const isFilled = !!megaPartFills[part.id];
                      const fill = isFilled ? megaPartFills[part.id] : 'rgba(200,210,230,0.15)';
                      const isWrong = wrongPartId === part.id;
                      const assignedColor = megaAssignments[part.id];
                      const letter = NAME_TO_LETTER[assignedColor] || (assignedColor ? assignedColor[0].toUpperCase() : '?');

                      return (
                        <g key={part.id}
                          onClick={() => !isFilled && handlePartTap(part.id)}
                          style={{ cursor: isFilled ? 'default' : 'pointer' }}
                        >
                          {/* Part shape */}
                          <g style={{
                            transition: 'opacity 0.2s',
                            opacity: isWrong ? 0.5 : 1,
                          }}>
                            {part.renderPart(fill)}
                          </g>

                          {/* Clean readable letter — no circle badge */}
                          {!isFilled && (
                            <text x={part.labelX} y={part.labelY}
                              textAnchor="middle" dominantBaseline="central"
                              fontFamily="system-ui, sans-serif"
                              fontSize="18" fontWeight="600" fill="#fff"
                              style={{ pointerEvents: 'none', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7)) drop-shadow(0 0 6px rgba(0,0,0,0.4))' }}
                            >{letter}</text>
                          )}

                          {/* Part fully painted — no per-part checkmark, silent validation */}
                        </g>
                      );
                    })}
                  </svg>
                </motion.div>

                {/* Object name */}
                <div style={{
                  fontSize: 18, fontWeight: 900, color: '#fff',
                  borderRadius: 12, padding: '4px 16px',
                }}>
                  {megaObject.emoji} {megaObject.name} — {Object.keys(megaPartFills).length}/{Object.keys(megaAssignments).length} parts
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Shapes Row — SINGLE HORIZONTAL ROW (never wraps) ─── */}
          {(phase === 'playing' || phase === 'done') && !isMegaMaster && (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'clamp(20px, 3vw, 60px)',
                padding: '8px 24px',
                width: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollBehavior: 'smooth' as const,
              }}
            >
              {shapes.map((shape, i) => (
                <div key={shape.id} style={{ flex: '0 0 auto', width: shapeCardSize, aspectRatio: '1/1' }}>
                  <ShapeCard
                    shape={shape}
                    isFilled={filledSet.has(shape.id)}
                    isGolden={goldenId === shape.id}
                    isWrong={wrongShakeId === shape.id}
                    showSplash={lastFilledId === shape.id}
                    fillHex={getFillHex(shape)}
                    size={config.shapeSize}
                    delay={i * 0.06}
                    sizeTag={config.sizeRule ? shapeSizes[shape.id] : undefined}
                    colorLabel={
                      (config.phaseType === 'multi_color' || (config.phaseType === 'advanced_logic' && config.colorAssignments !== undefined))
                        ? shapeColorMap[shape.id]
                        : undefined
                    }
                    onTap={() => handleShapeTap(shape)}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* XP popup */}
        <AnimatePresence>
          {showXP && (
            <motion.div initial={{ y: 8, opacity: 0, scale: 0.6 }}
              animate={{ y: -24, opacity: 1, scale: 1 }}
              exit={{ y: -48, opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={S.xpPopup}
            >+{xpAmount} XP</motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ COLOR PALETTE ═══ */}
      <div style={S.paletteDock}>
        <div style={S.dockBar}>
          {availableColors.map((c) => {
            const isActive = selectedColor === c.name;
            const isDimmed = config.autoSelectColor && c.name !== config.targetColors[0];
            const isAvoid = config.phaseType === 'advanced_logic' && c.name === config.avoidColor;
            return (
              <motion.button key={c.name}
                onClick={() => handleColorTap(c)}
                className="cm-color-bubble"
                style={{
                  ...S.colorBubble,
                  background: `radial-gradient(circle at 30% 25%, ${c.glossLight}, ${c.hex} 60%, ${c.hex}cc 100%)`,
                  boxShadow: isActive
                    ? `0 0 0 3px rgba(255,255,255,0.85), 0 0 0 7px ${c.hex}, 0 0 28px ${c.glow}`
                    : `0 4px 16px ${c.glow}, inset 0 -3px 8px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.2)`,
                  opacity: isDimmed ? 0.2 : 1,
                  pointerEvents: isDimmed ? 'none' as const : 'auto' as const,
                }}
                animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -8 : 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 16 }}
                whileHover={isDimmed ? {} : { scale: isActive ? 1.12 : 1.06, y: -3 }}
                whileTap={isDimmed ? {} : { scale: 0.85 }}
                aria-label={c.name}
              >
                {/* Gloss */}
                <div style={{
                  position: 'absolute', top: '8%', left: '14%', width: '48%', height: '36%',
                  borderRadius: '50%', background: 'rgba(255,255,255,0.45)', filter: 'blur(3px)', pointerEvents: 'none',
                }} />

                {/* Active ring pulse */}
                {isActive && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0.2, 0.55, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      position: 'absolute', inset: -6, borderRadius: '50%',
                      border: `2.5px solid ${c.hex}`, boxShadow: `0 0 16px ${c.glow}`, pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Avoid overlay */}
                {isAvoid && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, color: '#fff', fontWeight: 900,
                    textShadow: '0 0 8px rgba(0,0,0,0.5)', pointerEvents: 'none',
                  }}>✕</div>
                )}

                {/* Colour name — HIGH CONTRAST white pill */}
                <span style={{
                  position: 'absolute', bottom: -22,
                  fontSize: 13, fontWeight: 900,
                  color: '#fff',
                  background: isActive ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)',
                  padding: '2px 8px', borderRadius: 8,
                  border: isActive ? `1.5px solid ${c.hex}` : '1px solid rgba(255,255,255,0.15)',
                  whiteSpace: 'nowrap', pointerEvents: 'none',
                  letterSpacing: '0.02em',
                }}>{c.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ══════ OVERLAYS ══════ */}
      <Confetti show={showConfetti} />
      <style>{PAGE_CSS}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   🎮  MAIN CONTROLLER
   ═══════════════════════════════════════════════════ */

type Screen = 'picker' | 'world' | 'play' | 'complete';

const ColorMagicPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const sounds = useRef(new ColorSounds());
  const [screen, setScreen] = useState<Screen>('picker');
  const [selectedWorldId, setSelectedWorldId] = useState<number>(0);
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    const p = loadProgress();
    return updateStreak(p);
  });
  const [currentConfig, setCurrentConfig] = useState<LevelConfig | null>(null);
  const [lastStars, setLastStars] = useState(0);
  const [lastXP, setLastXP] = useState(0);

  useEffect(() => { saveProgress(progress); }, [progress]);

  useEffect(() => {
    const updated = updateStreak(progress);
    if (updated.streak !== progress.streak) setProgress(updated);
  }, []);

  const handleSelectWorld = useCallback((worldId: number) => {
    setSelectedWorldId(worldId);
    setScreen('world');
  }, []);

  const handleSelectLevel = useCallback((level: number) => {
    const config = generateLevel(level);
    setCurrentConfig(config);
    setScreen('play');
    sounds.current.roundStart();
  }, []);

  const handleLevelComplete = useCallback((stars: number, xp: number) => {
    if (!currentConfig) return;
    setLastStars(stars); setLastXP(xp);
    const updated = completeLevel(progress, currentConfig.level, stars, xp);
    setProgress(updated);
    setScreen('complete');
  }, [currentConfig, progress]);

  const handleNext = useCallback(() => {
    if (!currentConfig) return;
    const nextLv = currentConfig.level + 1;
    const oldWorld = getWorld(currentConfig.level);
    const newWorld = getWorld(nextLv);
    if (newWorld !== oldWorld && newWorld >= 0) sounds.current.worldUnlock();
    handleSelectLevel(nextLv);
  }, [currentConfig, handleSelectLevel]);

  return (
    <>
      {/* ── Color Magic Entry Splash ── */}
      <AnimatePresence>
        {showSplash && <ColorMagicSplash onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      {screen === 'picker' && (
        <ColorMagicWorlds progress={progress} onSelectWorld={handleSelectWorld} onExit={onBack} />
      )}
      {screen === 'world' && (
        <ColorMagicLevels worldId={selectedWorldId} progress={progress} onSelectLevel={handleSelectLevel} onBack={() => setScreen('picker')} />
      )}
      {screen === 'play' && currentConfig && (
        <LevelPlay config={currentConfig} progress={progress} onComplete={handleLevelComplete} onBack={() => setScreen('world')} />
      )}
      {screen === 'complete' && currentConfig && (
        <LevelComplete config={currentConfig} starsEarned={lastStars} xpEarned={lastXP} isBoss={currentConfig.isBoss} onNext={handleNext} onMap={() => setScreen('world')} />
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════
   🎨  STYLES — 8px GRID · STRUCTURED · BALANCED
   ═══════════════════════════════════════════════════ */

const S: Record<string, React.CSSProperties> = {
  /* ── Root wrapper ── */
  wrapper: {
    display: 'flex', flexDirection: 'column',
    width: '100%', minHeight: '100vh',
    overflowX: 'hidden' as const, overflowY: 'auto' as const,
    userSelect: 'none', position: 'relative',
    background: 'linear-gradient(170deg, #050d1e 0%, #0a1a3a 15%, #0e2d5e 30%, #103d7a 50%, #1556a0 68%, #1a6db8 82%, #1e80c8 100%)',
  },

  /* ── Minimal Topbar (WorldPicker) — transparent, inherits world gradient ── */
  miniTopbar: {
    flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', zIndex: 10,
    background: 'transparent',
  },
  exitBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 14, cursor: 'pointer',
    background: 'rgba(255,255,255,0.08)', color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.12)',
    outline: 'none', fontWeight: 800, fontSize: 14,
    backdropFilter: 'blur(4px)',
  },

  /* ── WorldPicker + WorldLevels styles ── */
  statBadge: {
    fontSize: 15, fontWeight: 800, color: '#fde68a',
    background: 'rgba(5,13,30,0.5)', backdropFilter: 'blur(8px)',
    borderRadius: 16, padding: '4px 14px',
    border: '1.5px solid rgba(59,130,246,0.15)',
    display: 'inline-flex', alignItems: 'center', gap: 4,
    boxShadow: '0 0 12px rgba(59,130,246,0.08)',
  },
  streakBanner: {
    fontSize: 16, fontWeight: 800, color: '#fbbf24',
    background: 'rgba(251,191,36,0.1)', borderRadius: 14, padding: '4px 16px',
    border: '2px solid rgba(251,191,36,0.25)',
  },
  worldPathScroll: {
    flex: 1, overflowY: 'auto' as const,
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    padding: '32px 24px 80px', gap: 20, position: 'relative' as const, zIndex: 2,
  },
  worldCard: {
    display: 'flex', flexDirection: 'row' as const, alignItems: 'center',
    gap: 28, padding: '32px 40px', borderRadius: 24, minHeight: 200,
    background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.04) 100%)',
    backdropFilter: 'blur(16px)',
    border: '1.5px solid rgba(59,130,246,0.18)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
    cursor: 'pointer', outline: 'none', width: '100%', maxWidth: 1100,
    zIndex: 1, position: 'relative' as const,
    WebkitTapHighlightColor: 'transparent',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
  },
  worldIconWrap: {
    width: 96, height: 96, borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.12) 100%)',
    border: '3px solid rgba(59,130,246,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 44, boxShadow: '0 4px 24px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  worldProgressTrack: {
    width: '100%', height: 12, borderRadius: 6,
    background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
  },
  worldProgressFill: {
    height: '100%', borderRadius: 6,
    background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)',
    boxShadow: '0 0 14px rgba(59,130,246,0.5), 0 0 6px rgba(59,130,246,0.3)',
    transition: 'width 0.4s ease',
  },
  worldLevelHeader: {
    flex: '0 0 auto', display: 'flex', alignItems: 'center',
    gap: 12, padding: '14px 20px',
    background: 'transparent',
    zIndex: 10,
    flexWrap: 'wrap' as const,
  },
  phaseInfo: {
    flex: '0 0 auto', display: 'flex', gap: 8, padding: '4px 16px',
    justifyContent: 'center', flexWrap: 'wrap' as const, zIndex: 2,
  },
  phaseCard: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(59,130,246,0.06)', borderRadius: 16, padding: '6px 16px',
    border: '1.5px solid rgba(59,130,246,0.12)',
    boxShadow: '0 0 12px rgba(59,130,246,0.05)',
  },
  levelGrid: {
    flex: 1, display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 150px)', gap: 32,
    padding: '24px 32px', overflowY: 'auto' as const,
    alignContent: 'start', justifyContent: 'center', zIndex: 2,
  },
  levelBtn: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    gap: 4, borderRadius: 24, padding: 12,
    width: 150, height: 150,
    outline: 'none', WebkitTapHighlightColor: 'transparent',
    position: 'relative' as const, overflow: 'visible' as const,
    backdropFilter: 'blur(8px)',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  },
  paginationRow: {
    flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: '4px 16px', zIndex: 2,
  },
  pageBtn: {
    fontSize: 14, fontWeight: 800, color: '#e0e7ff',
    background: 'rgba(59,130,246,0.12)', backdropFilter: 'blur(6px)',
    border: '1.5px solid rgba(59,130,246,0.2)', borderRadius: 14,
    padding: '6px 18px', cursor: 'pointer', outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: '0 0 10px rgba(59,130,246,0.06)',
  },

  /* ══════════════════════════════════════════════════
     GAME TOP — Compact Navigation Bar
     ══════════════════════════════════════════════════ */
  gameTop: {
    flex: '0 0 auto',
    display: 'flex', alignItems: 'center',
    padding: '20px 20px 12px', gap: 12,
    zIndex: 3,
    position: 'sticky' as const, top: 0,
    background: 'rgba(10,26,58,0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '0 0 20px 20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
  },
  worldHeaderRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', maxWidth: 900,
    justifyContent: 'center',
  },
  worldHeaderInfo: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '6px 16px',
    border: '1.5px solid rgba(255,255,255,0.12)',
    flexShrink: 0,
    backdropFilter: 'blur(4px)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: '50%', fontWeight: 900,
    background: 'rgba(255,255,255,0.08)', color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.12)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', backdropFilter: 'blur(4px)', flexShrink: 0,
  },
  questionText: {
    fontSize: 'clamp(16px, 2.6vw, 24px)', fontWeight: 700,
    color: '#e0e7ff',
    textAlign: 'center' as const,
    display: 'flex', alignItems: 'baseline', gap: 5,
    flexWrap: 'wrap' as const, justifyContent: 'center',
    lineHeight: 1.3,
    margin: 0, padding: '0 8px',
  },
  levelPill: {
    background: 'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.2) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: 14, padding: '4px 14px',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 0,
    border: '1.5px solid rgba(59,130,246,0.3)', flexShrink: 0,
    boxShadow: '0 0 14px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  progressRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', maxWidth: 480, padding: '0 4px',
  },
  progressTrack: {
    flex: 1, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden', position: 'relative' as const,
    border: '1.5px solid rgba(255,255,255,0.04)',
  },
  progressFill: {
    height: '100%', borderRadius: 5,
    background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)',
    boxShadow: '0 0 10px rgba(59,130,246,0.45)',
  },

  /* ══════════════════════════════════════════════════
     GAME CONTENT — Single Immersive Surface
     ══════════════════════════════════════════════════ */
  gameContent: {
    flex: '1 1 auto',
    minHeight: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 12,
    padding: '8px 20px',
    zIndex: 1,
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    position: 'relative' as const,
  },
  xpPopup: {
    position: 'absolute' as const, top: '38%', left: '50%', transform: 'translateX(-50%)',
    fontSize: 28, fontWeight: 900, color: '#fbbf24',
    textShadow: '0 0 16px rgba(251,191,36,0.5)',
    pointerEvents: 'none' as const, zIndex: 30,
  },

  /* ══════════════════════════════════════════════════
     COLOR PALETTE
     ══════════════════════════════════════════════════ */
  paletteDock: {
    flex: '0 0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '6px 12px 16px', zIndex: 3,
    background: 'transparent',
  },
  dockBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 'clamp(6px, 1.2vw, 12px)', padding: '10px 20px 22px',
    background: 'rgba(5,13,30,0.5)',
    backdropFilter: 'blur(16px)',
    borderRadius: 24,
    border: '1.5px solid rgba(59,130,246,0.15)',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.2), 0 0 20px rgba(59,130,246,0.06)',
    flexWrap: 'wrap' as const,
  },
  colorBubble: {
    width: 'clamp(48px, 9vw, 80px)', height: 'clamp(48px, 9vw, 80px)', borderRadius: '50%',
    border: '3.5px solid rgba(255,255,255,0.8)',
    cursor: 'pointer', transition: 'box-shadow 0.2s ease',
    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' as const,
    outline: 'none', position: 'relative' as const, overflow: 'visible',
    willChange: 'transform', transform: 'translateZ(0)',
  },

  /* ── Complete screen ── */
  btnPrimary: {
    padding: '12px 32px', borderRadius: 20, fontSize: 20, fontWeight: 900,
    background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
    border: '2.5px solid rgba(255,255,255,0.2)', cursor: 'pointer',
    boxShadow: '0 6px 24px rgba(34,197,94,0.35), 0 2px 8px rgba(0,0,0,0.15)',
    outline: 'none', display: 'flex', alignItems: 'center', gap: 8,
  },
  btnSecondary: {
    padding: '12px 24px', borderRadius: 20, fontSize: 20, fontWeight: 900,
    background: 'rgba(255,255,255,0.08)', color: '#fff',
    border: '2.5px solid rgba(255,255,255,0.15)', cursor: 'pointer',
    backdropFilter: 'blur(6px)',
    outline: 'none', display: 'flex', alignItems: 'center', gap: 8,
  },
};

/* ═══════════════════════════════════════════════════
   🎬  CSS ANIMATIONS — SUBTLE & GPU-ACCELERATED
   ═══════════════════════════════════════════════════ */

const PAGE_CSS = `
@keyframes cmLightRay {
  0%   { opacity: 0.2; }
  50%  { opacity: 0.55; }
  100% { opacity: 0.2; }
}
.cm-light-ray {
  animation: cmLightRay 10s ease-in-out infinite;
  will-change: opacity;
}

@keyframes cmSeaParticle {
  0%   { transform: translate(0, 0) translateZ(0); opacity: 0; }
  20%  { opacity: 0.6; }
  50%  { transform: translate(20px, -16px) translateZ(0); }
  80%  { opacity: 0.6; }
  100% { transform: translate(-12px, 12px) translateZ(0); opacity: 0; }
}
.cm-sea-particle {
  animation: cmSeaParticle ease-in-out infinite;
  will-change: transform, opacity;
}

@keyframes cmGlowPulse {
  0%   { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor; }
  50%  { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor, 0 0 56px currentColor; }
  100% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor; }
}
.cm-glow-word {
  animation: cmGlowPulse 2s ease-in-out infinite;
}

@media (hover: hover) {
  .cm-color-bubble:hover { filter: brightness(1.12) saturate(1.1); }
}

@media (prefers-reduced-motion: reduce) {
  *, .cm-light-ray, .cm-sea-particle, .cm-glow-word {
    animation-duration: 0.01ms !important;
  }
}

/* Scrollbar */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 5px; }
`;

export default ColorMagicPage;
