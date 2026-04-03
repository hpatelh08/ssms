/**
 * child/levels/LevelNode.tsx
 * ══════════════════════════════════════════════════════
 * ELITE LEVEL NODE — Circular interactive node for path map.
 *
 * States:
 *  LOCKED     — Dimmed, lock icon, low opacity
 *  AVAILABLE  — Bright gradient, subtle pulse, hover bounce
 *  COMPLETED  — Golden ring, 3 star animation, soft shimmer
 *  BOSS       — Larger, crown icon, outer animated ring, breathing
 *
 * Size: 80px (boss: 100px) circular
 * Stars: 3 mini stars with pop-in animation
 *
 * Performance: transform + opacity ONLY. React.memo.
 * ══════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { WorldTheme } from './worldConfig';

/* ── Types ── */
export type NodeState = 'locked' | 'available' | 'completed';

interface LevelNodeProps {
  level: number;
  state: NodeState;
  stars: number;
  isBoss: boolean;
  isCurrent: boolean;
  theme: WorldTheme;
  onSelect: (level: number) => void;
}

/* ── Mini Star Row ── */
const StarRow: React.FC<{ stars: number; color: string }> = React.memo(({ stars, color }) => (
  <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
    {[1, 2, 3].map(s => (
      <motion.span
        key={s}
        style={{
          fontSize: 12, lineHeight: 1,
          color: stars >= s ? color : 'rgba(255,255,255,0.25)',
          willChange: 'transform',
        }}
        initial={stars >= s ? { scale: 0 } : false}
        animate={stars >= s ? { scale: 1 } : {}}
        transition={stars >= s ? { delay: s * 0.06, type: 'spring', stiffness: 400, damping: 14 } : undefined}
      >
        {stars >= s ? '⭐' : '☆'}
      </motion.span>
    ))}
  </div>
));
StarRow.displayName = 'StarRow';

/* ── Boss Crown ── */
const BossCrown: React.FC = React.memo(() => (
  <motion.span
    style={{
      position: 'absolute', top: -12, right: -4,
      fontSize: 22, zIndex: 5, pointerEvents: 'none',
      willChange: 'transform',
    }}
    animate={{ y: [0, -2, 0], rotate: [0, 3, -3, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  >
    👑
  </motion.span>
));
BossCrown.displayName = 'BossCrown';

/* ── Boss Outer Ring ── */
const BossRing: React.FC<{ color: string; size: number }> = React.memo(({ color, size }) => (
  <motion.div
    style={{
      position: 'absolute',
      top: -5, left: -5,
      width: size + 10, height: size + 10,
      borderRadius: '50%',
      border: `2.5px solid ${color}`,
      pointerEvents: 'none',
      willChange: 'transform, opacity',
    }}
    animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.25, 0.6] }}
    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
  />
));
BossRing.displayName = 'BossRing';

/* ── Completed Glow Ring ── */
const CompletedGlow: React.FC<{ color: string; size: number }> = React.memo(({ color, size }) => (
  <motion.div
    style={{
      position: 'absolute',
      top: -3, left: -3,
      width: size + 6, height: size + 6,
      borderRadius: '50%',
      border: `2.5px solid ${color}`,
      pointerEvents: 'none',
      willChange: 'opacity',
    }}
    animate={{ opacity: [0.4, 0.8, 0.4] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  />
));
CompletedGlow.displayName = 'CompletedGlow';

/* ── Current Level Pulse ── */
const CurrentPulse: React.FC<{ color: string; size: number }> = React.memo(({ color, size }) => (
  <motion.div
    style={{
      position: 'absolute',
      top: -7, left: -7,
      width: size + 14, height: size + 14,
      borderRadius: '50%',
      border: `2px solid ${color}`,
      pointerEvents: 'none',
      willChange: 'transform, opacity',
    }}
    animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.15, 0.5] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  />
));
CurrentPulse.displayName = 'CurrentPulse';

/* ══════════════════════════════════════════════════
   MAIN LEVEL NODE
   ══════════════════════════════════════════════════ */

export const LevelNode: React.FC<LevelNodeProps> = React.memo(({
  level, state, stars, isBoss, isCurrent, theme, onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const isInteractive = state !== 'locked';
  const nc = theme.nodeColors;

  const handleClick = useCallback(() => {
    if (isInteractive) onSelect(level);
  }, [isInteractive, onSelect, level]);

  const size = isBoss ? 100 : 80;

  const bg = isBoss && state !== 'locked'
    ? nc.boss
    : state === 'completed' ? nc.completed
    : state === 'available' ? nc.available
    : 'rgba(255,255,255,0.04)';

  const borderColor = isCurrent
    ? theme.accentColor
    : state === 'completed' ? theme.ringColor + '80'
    : state === 'available' ? nc.border
    : 'rgba(255,255,255,0.06)';

  const textColor = state === 'locked'
    ? 'rgba(255,255,255,0.2)'
    : isCurrent ? theme.accentColor
    : state === 'completed' ? (theme.id === 0 ? '#7c5600' : '#fff')
    : nc.text;

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', justifyContent: 'center',
        width: size, height: size,
        borderRadius: '50%',
        background: bg,
        border: `2.5px solid ${borderColor}`,
        cursor: isInteractive ? 'pointer' : 'not-allowed',
        opacity: state === 'locked' ? 0.35 : 1,
        outline: 'none',
        padding: 0,
        overflow: 'visible',
        WebkitTapHighlightColor: 'transparent',
        willChange: 'transform',
        boxShadow: state === 'completed'
          ? `0 0 20px ${nc.completedGlow}`
          : state === 'available' && hovered
            ? `0 0 16px ${theme.glowColor}`
            : 'none',
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{
        opacity: state === 'locked' ? 0.35 : 1,
        scale: 1,
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={isInteractive ? {
        y: -5, scale: 1.1,
        transition: { duration: 0.2 },
      } : {}}
      whileTap={isInteractive ? { scale: 0.9 } : {}}
    >
      {/* Boss outer ring */}
      {isBoss && state !== 'locked' && <BossRing color={theme.ringColor} size={size} />}

      {/* Boss crown */}
      {isBoss && state !== 'locked' && <BossCrown />}

      {/* Completed golden glow ring */}
      {state === 'completed' && !isBoss && <CompletedGlow color={theme.ringColor} size={size} />}

      {/* Current level pulse */}
      {isCurrent && <CurrentPulse color={theme.accentColor} size={size} />}

      {/* Lock icon for locked state */}
      {state === 'locked' && (
        <span style={{ fontSize: 24, opacity: 0.6, lineHeight: 1 }}>🔒</span>
      )}

      {/* Level number */}
      {state !== 'locked' && (
        <span style={{
          fontSize: isBoss ? 28 : 24,
          fontWeight: 700,
          color: textColor,
          lineHeight: 1,
          position: 'relative', zIndex: 2,
        }}>
          {level}
        </span>
      )}

      {/* Stars */}
      {state !== 'locked' && (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <StarRow stars={stars} color={theme.starColor} />
        </div>
      )}

      {/* Boss label */}
      {isBoss && state !== 'locked' && (
        <span style={{
          position: 'absolute', bottom: -14,
          fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
          color: theme.ringColor,
          textTransform: 'uppercase' as const,
        }}>
          BOSS
        </span>
      )}
    </motion.button>
  );
});

LevelNode.displayName = 'LevelNode';

/* ══════════════════════════════════════════════════
   ALSO EXPORT OLD NAME FOR BACKWARD COMPAT
   ══════════════════════════════════════════════════ */
export type TileState = NodeState;
export const LevelTile = LevelNode;
