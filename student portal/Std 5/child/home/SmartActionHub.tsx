/**
 * child/home/SmartActionHub.tsx
 * -----------------------------------------------------
 * 2x2 Premium Action Card Grid - forest/nature theme.
 */

import React, { useCallback, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundPlay } from '../SoundProvider';
import type { ChildScreen } from '../ChildLayout';

const T = {
  primary: '#3c8d43',
  secondary: '#d98258',
  success: '#5aaf63',
  warning: '#e8b44f',
  textPrimary: '#2f5f3d',
  textSecondary: '#3f7a52',
  textBody: '#567564',
} as const;

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
    icon: '🦊',
    watermark: '🌲',
    label: 'Play Games',
    desc: 'Learn & have fun!',
    xp: '+10 XP',
    screen: 'play',
    gradient: 'linear-gradient(135deg, #dff4dc 0%, #cae9c7 100%)',
    iconBg: 'rgba(55,128,58,0.14)',
    accentColor: '#3f8f3a',
    shineTint: 'rgba(255,255,255,0.32)',
  },
  {
    icon: '⚛️',
    watermark: '🦉',
    label: 'Brain Boost',
    desc: 'Tiny atoms, big ideas!',
    xp: '+15 XP',
    screen: 'brain-boost',
    gradient: 'linear-gradient(135deg, #fff0d6 0%, #ffe3bf 100%)',
    iconBg: 'rgba(139,96,56,0.14)',
    accentColor: '#8b6038',
    shineTint: 'rgba(255,255,255,0.34)',
  },
  {
    icon: '🌸',
    watermark: '🌼',
    label: 'Puzzle Zone',
    desc: 'Solve in flower power!',
    xp: '+20 XP',
    screen: 'puzzle-zone',
    gradient: 'linear-gradient(135deg, #ffe3f0 0%, #ffd1e8 100%)',
    iconBg: 'rgba(190,106,143,0.16)',
    accentColor: '#c06a8f',
    shineTint: 'rgba(255,255,255,0.34)',
  },
  {
    icon: '🐦',
    watermark: '🍃',
    label: 'Journey',
    desc: 'Follow your forest trail!',
    xp: '+25 XP',
    screen: 'journey',
    gradient: 'linear-gradient(135deg, #dceff9 0%, #c8e3f2 100%)',
    iconBg: 'rgba(59,127,168,0.15)',
    accentColor: '#3b7fa8',
    shineTint: 'rgba(255,255,255,0.34)',
  },
];

function useRecommendedTile(): number {
  return useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) % TILES.length;
  }, []);
}

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
        boxShadow: '0 20px 50px rgba(45, 96, 53, 0.12)',
        border: '1px solid rgba(255,255,255,0.6)',
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
        boxShadow: '0 28px 60px rgba(34, 74, 43, 0.16)',
        transition: { duration: 0.25 },
      }}
      whileTap={{ scale: 0.96 }}
      type="button"
    >
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

      <div style={{
        position: 'absolute', bottom: -10, right: -10,
        fontSize: 78, opacity: 0.08, pointerEvents: 'none',
        lineHeight: 1, transform: 'rotate(-12deg)',
      }}>
        {tile.watermark}
      </div>

      {isRecommended && (
        <div
          className="absolute"
          style={{
            top: 10, right: -28,
            transform: 'rotate(35deg)',
            background: `linear-gradient(90deg, ${T.primary}, ${T.secondary})`,
            color: '#fff', fontSize: 8, fontWeight: 800,
            padding: '3px 32px',
            letterSpacing: '0.04em',
            boxShadow: `0 2px 8px ${T.primary}30`,
          }}
        >
          TODAY *
        </div>
      )}

      <motion.div
        className="flex items-center justify-center"
        style={{
          width: 72, height: 72,
          background: tile.iconBg,
          boxShadow: `0 8px 20px ${tile.accentColor}1f`,
          borderRadius: 22,
        }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.3, ease: 'easeInOut' }}
      >
        <span style={{ fontSize: 38 }}>{tile.icon}</span>
      </motion.div>

      <div className="text-center">
        <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary }}>
          {tile.label}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textBody, marginTop: 4 }}>
          {tile.desc}
        </div>
      </div>

      <span style={{
        position: 'absolute', top: 12, left: 12,
        fontSize: 10, fontWeight: 800,
        color: tile.accentColor,
        background: `${tile.accentColor}12`,
        padding: '4px 10px', borderRadius: 10,
        border: `1px solid ${tile.accentColor}18`,
      }}>
        {tile.xp}
      </span>

      <AnimatePresence>
        {ripple && <Ripple key={ripple.id} x={ripple.x} y={ripple.y} color={`${tile.accentColor}20`} />}
      </AnimatePresence>
    </motion.button>
  );
});
SmartTile.displayName = 'SmartTile';

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
        <span style={{ fontSize: 22 }}>🌿</span>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: T.textPrimary }}>
          What do you want to do?
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 w-full" style={{ gap: 20 }}>
        {TILES.map((tile, i) => (
          <div key={tile.label}>
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
