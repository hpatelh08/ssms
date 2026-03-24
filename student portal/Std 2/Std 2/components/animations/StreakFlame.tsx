/**
 * components/animations/StreakFlame.tsx
 * ─────────────────────────────────────────────────────
 * Animated streak flame with intensity scaling.
 *
 * Props:
 *   streak   — current day streak (0+)
 *   size     — base size in px (default 56)
 *
 * Behaviour:
 *   streak === 0  → dimmed ember with gentle glow
 *   streak  1-4   → warm flame, gentle flicker
 *   streak >= 5   → intense flame, stronger glow + scale pulse
 *   streak >= 7   → maximum glow, continuous pulse
 *
 * Uses framer-motion for smooth keyframe animation
 * and a CSS keyframe `flameFlicker` injected via <style>.
 */

import React from 'react';
import { motion } from 'framer-motion';

interface StreakFlameProps {
  streak: number;
  size?: number;
}

export const StreakFlame: React.FC<StreakFlameProps> = ({
  streak,
  size = 56,
}) => {
  const isActive = streak > 0;
  const isStrong = streak >= 5;
  const isLegendary = streak >= 7;

  /* ── Glow intensity ─────────────────────────────── */
  const glowColor = isLegendary
    ? 'rgba(245,158,11,0.7)'
    : isStrong
      ? 'rgba(245,158,11,0.5)'
      : 'rgba(245,158,11,0.25)';

  const glowSpread = isLegendary ? 24 : isStrong ? 16 : 8;

  /* ── Scale pulse for strong streaks ─────────────── */
  const scaleAnim = isStrong
    ? { scale: [1, 1.15, 1], rotate: [0, 3, -3, 0] }
    : isActive
      ? { scale: [1, 1.06, 1], rotate: [0, 2, -2, 0] }
      : { scale: [0.9, 0.95, 0.9] };

  const duration = isStrong ? 1.2 : 1.8;

  return (
    <>
      {/* Inject flameFlicker keyframe once */}
      <style>{`
        @keyframes flameFlicker {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.1) rotate(1deg); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Outer glow ring */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              filter: `blur(${glowSpread}px)`,
            }}
            animate={{
              opacity: isStrong ? [0.5, 0.9, 0.5] : [0.3, 0.6, 0.3],
              scale: isStrong ? [0.9, 1.1, 0.9] : [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: isStrong ? 1.4 : 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Main flame */}
        <motion.div
          className="relative z-10 flex items-center justify-center"
          style={{
            width: size * 0.75,
            height: size * 0.75,
            filter: isActive
              ? `drop-shadow(0 0 ${glowSpread}px ${glowColor})`
              : 'grayscale(0.5) opacity(0.5)',
            animation: isActive ? 'flameFlicker 1.5s ease-in-out infinite' : undefined,
          }}
          animate={scaleAnim}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <span
            style={{ fontSize: size * 0.55, lineHeight: 1 }}
            role="img"
            aria-label="streak flame"
          >
            🔥
          </span>
        </motion.div>

        {/* Ember particles for strong streaks */}
        {isStrong && (
          <>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  background: 'rgba(251,191,36,0.7)',
                  bottom: '35%',
                  left: `${35 + i * 15}%`,
                }}
                animate={{
                  y: [-2, -18 - i * 6, -2],
                  x: [0, (i - 1) * 6, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1, 0.3],
                }}
                transition={{
                  duration: 1.5 + i * 0.3,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: i * 0.4,
                }}
              />
            ))}
          </>
        )}

        {/* Streak count badge */}
        {isActive && (
          <motion.span
            className="absolute -bottom-1 -right-1 text-[10px] font-black bg-amber-100/90 text-amber-700 rounded-full flex items-center justify-center z-20"
            style={{
              width: size * 0.35,
              height: size * 0.35,
              minWidth: 20,
              minHeight: 20,
              boxShadow: `0 2px 8px ${glowColor}`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
          >
            {streak}
          </motion.span>
        )}
      </div>
    </>
  );
};
