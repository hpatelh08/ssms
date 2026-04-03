/**
 * child/milestone/LevelNode.tsx
 * ─────────────────────────────────────────────────────
 * Space planet level node — 60fps performance build.
 *
 * Levels appear as planets/satellites in the galaxy.
 * ALL animations are CSS keyframe (transform + opacity only).
 * ZERO: backdrop-filter, blur, heavy boxShadow, drop-shadow, filter.
 * GPU composited: will-change, translateZ(0), backface-visibility.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LevelView } from './useLevelEngine';

interface Props {
  level: LevelView;
  onTap: (lv: LevelView) => void;
  isCurrent?: boolean;
}

/* ── Size tokens ──────────────────── */
const SZ_LOCKED = 88;
const SZ_NORMAL = 120;
const SZ_BOSS   = 145;

function sz(lv: LevelView) {
  if (lv.type === 'boss') return SZ_BOSS;
  if (lv.state === 'locked') return SZ_LOCKED;
  return SZ_NORMAL;
}

/* ── Star-dust particles — CSS keyframe only ──────────── */
function Sparkles() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className="absolute text-[11px] pointer-events-none select-none"
          style={{
            top: `${8 + i * 16}%`,
            left: `${3 + i * 18}%`,
            animation: `sparkle-rotate ${2.2 + i * 0.15}s ease-in-out ${i * 0.35}s infinite`,
            willChange: 'transform, opacity',
          }}
        >
          {i % 2 === 0 ? '⭐' : '✨'}
        </span>
      ))}
    </>
  );
}

/* ── Star Burst — CSS keyframe with custom properties ────── */
function StarBurst() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map(i => {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const dist = 50 + (i % 2) * 15;
        return (
          <span
            key={`sb-${i}`}
            className="absolute text-xs pointer-events-none select-none"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: -5,
              marginTop: -5,
              '--sb-x': `${Math.cos(angle) * dist}px`,
              '--sb-y': `${Math.sin(angle) * dist}px`,
              animation: `star-burst 2.5s ease-out ${i * 0.3}s infinite`,
              willChange: 'transform, opacity',
            } as React.CSSProperties}
          >
            {i % 2 === 0 ? '🌟' : '💫'}
          </span>
        );
      })}
    </>
  );
}

/* ── Active glow ring — CSS keyframe ────── */
function ActiveGlowRing({ color, size }: { color: string; size: number }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size + 20,
        height: size + 20,
        top: -10,
        left: '50%',
        marginLeft: -(size + 20) / 2,
        border: `3px solid ${color}`,
        animation: 'ring-pulse 2s ease-in-out infinite',
        willChange: 'transform, opacity',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */

const LevelNode: React.FC<Props> = ({ level, onTap, isCurrent }) => {
  const size = sz(level);
  const isBoss      = level.type === 'boss';
  const isLocked    = level.state === 'locked';
  const isActive    = level.state === 'active';
  const isNodeMastered = level.nodeProgress01 >= 0.999;
  const isMilestone = level.worldOrder === 5 || level.worldOrder === 10;

  return (
    <motion.div
      className="relative flex flex-col items-center select-none"
      style={{ width: size + 32, minHeight: size + 44, willChange: 'transform' }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
    >
      {/* Boss crown — no drop-shadow */}
      {isBoss && !isLocked && (
        <motion.span
          className="absolute -top-7 z-10 text-4xl"
          initial={{ y: -10, opacity: 0, rotate: -20 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
        >
          👑
        </motion.span>
      )}

      {/* Platform shadow — gradient instead of blur */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.7,
          height: 14,
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.1) 0%, transparent 70%)',
        }}
      />

      {/* Active glow ring — CSS keyframe */}
      {isActive && <ActiveGlowRing color={level.glowColor} size={size} />}

      {/* Star burst on milestones — CSS keyframe */}
      {isMilestone && !isLocked && <StarBurst />}

      {/* ── Main circle ─────────────────────────── */}
      <motion.button
        onClick={() => onTap(level)}
        disabled={isLocked}
        className={[
          'relative rounded-full flex items-center justify-center border-[5px]',
          isLocked
            ? 'border-gray-600/60 bg-gray-800/80 cursor-not-allowed'
            : isNodeMastered
              ? `border-cyan-300 bg-gradient-to-br ${level.gradient}`
              : `border-white/80 bg-gradient-to-br ${level.gradient} cursor-pointer`,
        ].join(' ')}
        style={{
          width: size,
          height: size,
          willChange: 'transform',
          transform: 'translateZ(0)',
          boxShadow: isActive
            ? `0 0 0 4px ${level.glowColor}44, 0 4px 16px ${level.glowColor}33`
            : isNodeMastered
              ? '0 0 0 3px rgba(34,211,238,0.25), 0 4px 12px rgba(0,0,0,0.15)'
              : '0 4px 12px rgba(0,0,0,0.15)',
          ...(isActive ? { animation: 'node-pulse 2.4s ease-in-out infinite' } : {}),
        }}
        whileHover={!isLocked ? { scale: 1.12, y: -8 } : undefined}
        whileTap={
          !isLocked
            ? { scale: 0.9 }
            : { rotate: [0, -5, 5, -5, 0], transition: { duration: 0.4 } }
        }
      >
        {/* Inner emoji or lock */}
        <span
          className={`select-none pointer-events-none leading-none ${
            isLocked ? 'grayscale opacity-30' : ''
          }`}
          style={{ fontSize: isBoss ? 52 : 42 }}
        >
          {isLocked ? '🔒' : level.emoji}
        </span>

        {/* ✓ badge */}
        {isNodeMastered && (
          <motion.div
            className="absolute -bottom-1.5 -right-1.5 w-9 h-9 bg-green-400 rounded-full flex items-center justify-center text-white text-lg font-black border-2 border-white"
            style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            ✓
          </motion.div>
        )}

        {/* Boss golden shimmer */}
        {isBoss && isActive && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,215,0,0.35) 0%, transparent 50%, rgba(255,215,0,0.25) 100%)',
            }}
            animate={{ opacity: [0.3, 0.75, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}

        {/* Completed sparkles — CSS keyframe */}
        {isNodeMastered && <Sparkles />}
      </motion.button>

      {/* ── Title — no drop-shadow ─────────────── */}
      <span
        className={[
          'mt-1.5 text-[13px] font-bold leading-tight text-center max-w-[110px]',
          isLocked
            ? 'text-gray-400/60'
            : isNodeMastered
              ? 'text-green-300'
              : 'text-white',
        ].join(' ')}
      >
        {level.title}
      </span>

      {/* Locked star hint */}
      {isLocked && level.starsRemaining > 0 && (
        <span className="text-[10px] text-gray-400/70 mt-0.5 text-center leading-tight">
          ⭐ {level.starsRemaining} more!
        </span>
      )}
    </motion.div>
  );
};

export default React.memo(LevelNode);
