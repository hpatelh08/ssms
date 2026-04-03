/**
 * child/home/SmartActionHub.tsx
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * 2Ã—2 Premium Action Card Grid â€” brighter, shinier, premium.
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

/* â”€â”€ Design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const T = {
  primary: '#1987b7',
  secondary: '#1b78ab',
  success: '#18b3a3',
  warning: '#ffae68',
  textPrimary: '#125f82',
  textSecondary: '#237aa0',
  textBody: '#4d95b3',
} as const;

/* â”€â”€ Tile definitions â€” BRIGHTER gradients â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
    icon: '\u{1F3AE}',
    watermark: '\u{1F3AE}',
    label: 'Play Games',
    desc: 'Learn & have fun!',
    xp: '+10 XP',
    screen: 'play',
    gradient: 'linear-gradient(135deg, #e7fbff 0%, #c6effc 100%)',
    iconBg: 'rgba(21,152,199,0.12)',
    accentColor: T.primary,
    shineTint: 'rgba(255,255,255,0.45)',
  },
  {
    icon: '\u{1F4D6}',
    watermark: '\u{1F4DA}',
    label: 'Fun Facts',
    desc: 'Grammar, reading, vocabulary',
    xp: '+12 XP',
    screen: 'funfacts',
    gradient: 'linear-gradient(135deg, #ecffff 0%, #d7f7f1 100%)',
    iconBg: 'rgba(24,179,163,0.14)',
    accentColor: T.success,
    shineTint: 'rgba(255,255,255,0.45)',
  },
  {
    icon: '\u{1F3F0}',
    watermark: '\u{1F5FA}\u{FE0F}',
    label: 'Journey',
    desc: 'Adventure awaits!',
    xp: '+15 XP',
    screen: 'journey',
    gradient: 'linear-gradient(135deg, #e5f7ff 0%, #c7deff 100%)',
    iconBg: 'rgba(27,120,171,0.14)',
    accentColor: T.secondary,
    shineTint: 'rgba(255,255,255,0.45)',
  },
  {
    icon: '📐',
    watermark: '➗',
    label: 'Brain Puzzle',
    desc: 'Std 6 chapter-wise questions',
    xp: '+12 XP',
    screen: 'puzzles',
    gradient: 'linear-gradient(135deg, #fff7e4 0%, #ffe3bf 100%)',
    iconBg: 'rgba(255,174,104,0.16)',
    accentColor: T.warning,
    shineTint: 'rgba(255,255,255,0.45)',
  },
];

/* â”€â”€ "Recommended Today" â€” based on day-of-year â”€â”€â”€â”€ */

function useRecommendedTile(): number {
  return useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) % TILES.length;
  }, []);
}

/* â”€â”€ Ripple â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

/* â”€â”€ Single Smart Tile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
        boxShadow: '0 20px 50px rgba(18,95,130,0.10)',
        border: '1px solid rgba(255,255,255,0.72)',
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
        boxShadow: '0 32px 64px rgba(18,95,130,0.16)',
        transition: { duration: 0.25 },
      }}
      whileTap={{ scale: 0.96 }}
    >
      {/* â”€â”€ Shine overlay sweep â”€â”€ */}
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

      {/* Watermark icon â€” background accent */}
      <div style={{
        position: 'absolute', bottom: -10, right: -10,
        fontSize: 78, opacity: 0.08, pointerEvents: 'none',
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
            background: `linear-gradient(90deg, ${T.primary}, ${T.success})`,
            color: '#fff', fontSize: 8, fontWeight: 800,
            padding: '3px 32px',
            letterSpacing: '0.04em',
            boxShadow: `0 4px 12px ${T.primary}35`,
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
          boxShadow: `0 8px 20px ${tile.accentColor}18`,
          borderRadius: 22,
        }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.3, ease: 'easeInOut' }}
      >
        <span style={{ fontSize: 38 }}>{tile.icon}</span>
      </motion.div>

      {/* Label + desc */}
      <div className="text-center">
        <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary }}>
          {tile.label}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textBody, marginTop: 4 }}>
          {tile.desc}
        </div>
      </div>

      {/* XP badge */}
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

      {/* Ripple */}
      <AnimatePresence>
        {ripple && <Ripple key={ripple.id} x={ripple.x} y={ripple.y} color={`${tile.accentColor}20`} />}
      </AnimatePresence>
    </motion.button>
  );
});
SmartTile.displayName = 'SmartTile';

/* â”€â”€ Section Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: T.textPrimary }}>
          What do you want to do?
        </h2>
      </div>
      <div className="grid grid-cols-2 w-full" style={{ gap: 28 }}>
        {TILES.map((tile, i) => (
          <SmartTile
            key={tile.label}
            tile={tile}
            index={i}
            isRecommended={i === recIdx}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </motion.div>
  );
});

SmartActionHub.displayName = 'SmartActionHub';


