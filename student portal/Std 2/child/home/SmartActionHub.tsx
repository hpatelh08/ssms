/**
 * child/home/SmartActionHub.tsx
 * ─────────────────────────────────────────────────────
 * 2×2 Premium Action Card Grid — brighter, shinier, premium.
 *
 * Each card: min-height 200 px, borderRadius 28, brighter gradients,
 * shine sweep overlay, stronger shadow (0 20px 50px rgba(0,0,0,0.08)),
 * hover: translateY(-8px) scale(1.02).
 * Gap: 28 px between cards.
 *
 * Performance: transform + opacity only. React.memo + useCallback.
 */

import React, { useCallback, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundPlay } from '../SoundProvider';
import type { ChildScreen } from '../ChildLayout';

/* ── Design tokens ──────────────────────────────── */

const T = {
  primary: '#48cae4',
  secondary: '#72efdd',
  success: '#80ed99',
  warning: '#90dbf4',
  textPrimary: '#023047',
  textSecondary: '#0b3c5d',
  textBody: '#245b74',
} as const;

/* ── Tile definitions — BRIGHTER gradients ────────── */

interface TileDef {
  icon: string;
  watermark: string;
  label: string;
  desc: string;
  xp: string;
  screen: ChildScreen;
  gradient: string;
  iconBg: string;
  accentColor: string;
  shineTint: string;
}

const TILES: TileDef[] = [
  {
    icon: '🎮',
    watermark: '🎮',
    label: 'Play Games',
    desc: 'Learn & have fun!',
    xp: '+10 XP',
    screen: 'play',
    gradient: 'linear-gradient(145deg, #a0e9ff 0%, #80ed99 52%, #72efdd 100%)',
    iconBg: 'rgba(255,255,255,0.28)',
    accentColor: T.primary,
    shineTint: 'rgba(255,255,255,0.38)',
  },
  {
    icon: '🌈',
    watermark: '🌿',
    label: 'My Garden',
    desc: 'Grow & discover!',
    xp: '+5 XP',
    screen: 'garden',
    gradient: 'linear-gradient(145deg, #a0e9ff 0%, #80ed99 52%, #72efdd 100%)',
    iconBg: 'rgba(255,255,255,0.28)',
    accentColor: T.success,
    shineTint: 'rgba(255,255,255,0.38)',
  },
  {
    icon: '🌊',
    watermark: '🌊',
    label: 'Save the Ocean',
    desc: 'Clean the ocean!',
    xp: '+10 XP',
    screen: 'save-ocean',
    gradient: 'linear-gradient(145deg, #a0e9ff 0%, #80ed99 52%, #72efdd 100%)',
    iconBg: 'rgba(255,255,255,0.28)',
    accentColor: '#48bfd8',
    shineTint: 'rgba(255,255,255,0.38)',
  },
  {    icon: '🐟',
    watermark: '🐠',
    label: 'Count the Fish',
    desc: 'Count only fish!',
    xp: '+10 XP',
    screen: 'count-fish',
    gradient: 'linear-gradient(145deg, #a0e9ff 0%, #80ed99 52%, #72efdd 100%)',
    iconBg: 'rgba(255,255,255,0.28)',
    accentColor: '#58c9b8',
    shineTint: 'rgba(255,255,255,0.38)',
  },
  {    icon: '🏰',
    watermark: '🗺️',
    label: 'Journey',
    desc: 'Adventure awaits!',
    xp: '+15 XP',
    screen: 'journey',
    gradient: 'linear-gradient(145deg, #a0e9ff 0%, #80ed99 52%, #72efdd 100%)',
    iconBg: 'rgba(255,255,255,0.28)',
    accentColor: T.secondary,
    shineTint: 'rgba(255,255,255,0.38)',
  },
];

/* ── "Recommended Today" — based on day-of-year ──── */

function useRecommendedTile(): number {
  return useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) % TILES.length;
  }, []);
}

/* ── Ripple ───────────────────────────────────────── */

const Ripple: React.FC<{ x: number; y: number; color: string }> = React.memo(({ x, y, color }) => (
  <motion.div
    style={{
      position: 'absolute', left: x - 20, top: y - 20,
      width: 40, height: 40, borderRadius: '50%',
      background: color, pointerEvents: 'none',
    }}
    initial={{ scale: 0, opacity: 0.35 }}
    animate={{ scale: 3, opacity: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  />
));
Ripple.displayName = 'Ripple';

/* ── Single Smart Tile ───────────────────────────── */

interface TileProps {
  tile: TileDef;
  index: number;
  isRecommended: boolean;
  onNavigate: (screen: ChildScreen) => void;
}

const SmartTile: React.FC<TileProps> = React.memo(({ tile, index, isRecommended, onNavigate }) => {
  const play = useSoundPlay();
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    play('click');
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
    }
    setTimeout(() => onNavigate(tile.screen), 200);
  }, [play, onNavigate, tile.screen]);

  return (
    <motion.button
      ref={btnRef}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-center justify-center gap-3.5 w-full overflow-hidden touch-manipulation"
      style={{
        padding: '34px 20px 28px',
        minHeight: 200,
        background: tile.gradient,
        boxShadow: '0 10px 30px rgba(0, 150, 199, 0.2)',
        border: '1px solid rgba(255,255,255,0.58)',
        borderRadius: 28,
        cursor: 'pointer',
      }}
      initial={{ opacity: 0, y: 22, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.15 + index * 0.08,
        type: 'spring', stiffness: 180, damping: 20,
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        boxShadow: '0 14px 34px rgba(0, 150, 199, 0.24)',
        transition: { duration: 0.25 },
      }}
      whileTap={{ scale: 0.96 }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 28,
          pointerEvents: 'none',
          background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.3))',
        }}
      />
      {/* ── Shine overlay sweep ── */}
      <div
        style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          borderRadius: 28, pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-100%', left: '-50%',
            width: '200%', height: '200%',
            background: `linear-gradient(120deg, transparent 40%, ${tile.shineTint} 50%, transparent 60%)`,
            transform: hovered ? 'rotate(25deg) translateX(60%)' : 'rotate(25deg) translateX(-80%)',
            transition: 'transform 0.8s ease-out',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Watermark icon — background accent */}
      <div style={{
        position: 'absolute', bottom: -10, right: -10,
        fontSize: 78, opacity: 0.07, pointerEvents: 'none',
        lineHeight: 1, transform: 'rotate(-12deg)',
      }}>
        {tile.watermark}
      </div>

      {/* Recommended ribbon */}
      {isRecommended && (
        <div
          className="absolute"
          style={{
            top: 10, right: -28,
            transform: 'rotate(35deg)',
             background: 'linear-gradient(90deg, #48cae4, #90dbf4)',
            color: '#fff', fontSize: 8, fontWeight: 800,
            padding: '3px 32px',
            letterSpacing: '0.04em',
             boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          TODAY ★
        </div>
      )}

      {/* Icon with subtle float */}
      <motion.div
        className="flex items-center justify-center"
        style={{
          width: 72, height: 72,
          background: tile.iconBg,
          boxShadow: '0 8px 18px rgba(255,255,255,0.25)',
          borderRadius: 22,
        }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.3, ease: 'easeInOut' }}
      >
        <span style={{ fontSize: 38 }}>{tile.icon}</span>
      </motion.div>

      {/* Label + desc */}
      <div className="text-center">
        <div style={{ fontSize: 16, fontWeight: 800, color: '#023047' }}>
          {tile.label}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0b3c5d', marginTop: 4 }}>
          {tile.desc}
        </div>
      </div>

      {/* XP badge */}
      <span style={{
        position: 'absolute', top: 12, left: 12,
        fontSize: 10, fontWeight: 800,
        color: '#023047',
        background: 'rgba(255,255,255,0.28)',
        padding: '4px 10px', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.4)',
      }}>
        {tile.xp}
      </span>

      {/* Ripple */}
      <AnimatePresence>
        {ripple && <Ripple key={ripple.id} x={ripple.x} y={ripple.y} color={`${tile.accentColor}20`} />}
      </AnimatePresence>
    </motion.button>
  );
});
SmartTile.displayName = 'SmartTile';

/* ── Section Component ───────────────────────────── */

interface SmartActionHubProps {
  onNavigate: (screen: ChildScreen) => void;
}

export const SmartActionHub: React.FC<SmartActionHubProps> = React.memo(({ onNavigate }) => {
  const recIdx = useRecommendedTile();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
    >
      <div className="flex items-center gap-2 mb-5 justify-center">
        <span style={{ fontSize: 22 }}>�</span>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: T.textPrimary }}>
          What do you want to do?
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 w-full" style={{ gap: 20 }}>
        {TILES.map((tile, i) => (
          <div
            key={tile.label}
            className={i === TILES.length - 1 && TILES.length % 2 !== 0 ? 'col-span-2 lg:col-span-1' : ''}
          >
            <SmartTile
              tile={tile}
              index={i}
              isRecommended={i === recIdx}
              onNavigate={onNavigate}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
});

SmartActionHub.displayName = 'SmartActionHub';
