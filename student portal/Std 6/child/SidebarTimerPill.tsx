/**
 * child/SidebarTimerPill.tsx
 * ─────────────────────────────────────────────────────
 * Sidebar playtime countdown pill with animated gradient.
 *
 * States:
 *   limitEnabled = false → shows the classic "Keep Learning" card
 *   Normal (>10 min)     → purple gradient
 *   Warning (<10 min)    → orange gradient
 *   Critical (<3 min)    → red gradient
 *   Under 30 s           → pulsing glow
 *   Expired              → red + lock message
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGlobalPlayTimer } from '../context/GlobalTimerContext';

/* ── Format seconds → MM:SS ─────────────────────── */
function fmt(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ── Gradient helpers ───────────────────────────── */
interface ThemeColors {
  gradient: string;
  glow: string;
}

function getTheme(remaining: number, expired: boolean): ThemeColors {
  if (expired || remaining < 180) {
    return {
      gradient: 'linear-gradient(135deg, rgba(245,114,88,0.92), rgba(220,67,67,0.90))',
      glow: 'rgba(239,102,84,0.38)',
    };
  }
  if (remaining < 600) {
    return {
      gradient: 'linear-gradient(135deg, rgba(255,169,96,0.92), rgba(255,133,91,0.90))',
      glow: 'rgba(255,163,99,0.34)',
    };
  }
  return {
    gradient: 'linear-gradient(135deg, rgba(32,164,206,0.94), rgba(12,105,145,0.92))',
    glow: 'rgba(15,126,168,0.34)',
  };
}

/* ── Component ──────────────────────────────────── */

export const SidebarTimerPill: React.FC = React.memo(() => {
  const {
    remainingSeconds,
    isRunning,
    isExpired,
    limitEnabled,
    limitMinutes,
    readRemainingSeconds,
    readIsRunning,
    readIsExpired,
    readLimitEnabled,
    readLimitMinutes,
  } = useGlobalPlayTimer();

  /* When both limits are disabled, fall back to original "Keep Learning" card */
  if (!limitEnabled && !readLimitEnabled) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.76), rgba(227,248,252,0.92))',
        borderRadius: 20, padding: '12px 16px',
        boxShadow: 'var(--shadow-soft)',
        border: '1px solid rgba(228,247,251,0.9)',
      }}>
        <motion.span
          style={{ fontSize: 20 }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >🎒</motion.span>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--sidebar-text)' }}>
            Keep Learning!
          </p>
          <p style={{ margin: 0, fontSize: 9, color: 'var(--sidebar-text-muted)', fontWeight: 500 }}>
            Explore &amp; have fun
          </p>
        </div>
      </div>
    );
  }

  const { gradient, glow } = useMemo(
    () => getTheme(remainingSeconds, isExpired),
    [remainingSeconds, isExpired],
  );
  const readTheme = useMemo(
    () => getTheme(readRemainingSeconds, readIsExpired),
    [readRemainingSeconds, readIsExpired],
  );

  const pct = limitMinutes > 0 ? remainingSeconds / (limitMinutes * 60) : 0;
  const readPct = readLimitMinutes > 0 ? readRemainingSeconds / (readLimitMinutes * 60) : 0;
  const isPulsing = remainingSeconds < 30 && !isExpired;

  return (
    <motion.div
      style={{
        background: gradient,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 20,
        padding: '14px 16px',
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: `0 8px 22px ${glow}`,
        overflow: 'hidden',
        position: 'relative',
      }}
      animate={isPulsing ? {
        boxShadow: [
          `0 8px 22px ${glow}`,
          `0 8px 36px rgba(239,68,68,0.65)`,
          `0 8px 22px ${glow}`,
        ],
      } : {}}
      transition={isPulsing ? { duration: 0.8, repeat: Infinity } : {}}
    >
      {/* Soft inner highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '40%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)',
        borderRadius: '20px 20px 0 0',
        pointerEvents: 'none',
      }} />

      {/* Label */}
      <p style={{
        margin: '0 0 3px',
        fontSize: 9, fontWeight: 800,
        color: 'rgba(255,255,255,0.72)',
        textTransform: 'uppercase', letterSpacing: '0.14em',
      }}>
        ⏱ Game Time Left
      </p>

      {/* Countdown number */}
      <motion.p
        style={{
          margin: '0 0 8px',
          fontSize: 24, fontWeight: 900,
          color: '#FFFFFF',
          textShadow: '0 2px 8px rgba(0,0,0,0.28)',
          letterSpacing: '0.05em',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
        animate={isPulsing ? { scale: [1, 1.1, 1] } : {}}
        transition={isPulsing ? { duration: 0.8, repeat: Infinity } : {}}
      >
        {isExpired ? '00:00' : fmt(remainingSeconds)}
      </motion.p>

      {/* Progress bar */}
      <div style={{
        width: '100%', height: 4, borderRadius: 99,
        background: 'rgba(255,255,255,0.22)',
        overflow: 'hidden',
      }}>
        <motion.div
          style={{
            height: '100%', borderRadius: 99,
            background: 'rgba(255,255,255,0.80)',
          }}
          animate={{ width: `${Math.max(0, Math.min(100, pct * 100))}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Status line */}
      <p style={{
        margin: '6px 0 0',
        fontSize: 9, fontWeight: 700,
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
      }}>
        {isExpired
          ? '🔒 Time limit reached'
          : isRunning
            ? '▶ Playing now'
            : '⏸ Paused'}
      </p>

      {/* Read-time section */}
      <div style={{
        marginTop: 10,
        paddingTop: 10,
        borderTop: '1px solid rgba(255,255,255,0.22)',
      }}>
        <p style={{
          margin: '0 0 3px',
          fontSize: 9, fontWeight: 800,
          color: 'rgba(255,255,255,0.72)',
          textTransform: 'uppercase', letterSpacing: '0.14em',
        }}>
          📚 Read Time Left
        </p>

        <motion.p
          style={{
            margin: '0 0 8px',
            fontSize: 18, fontWeight: 900,
            color: '#FFFFFF',
            textShadow: '0 2px 8px rgba(0,0,0,0.28)',
            letterSpacing: '0.05em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
          animate={readRemainingSeconds < 30 && !readIsExpired ? { scale: [1, 1.08, 1] } : {}}
          transition={readRemainingSeconds < 30 && !readIsExpired ? { duration: 0.8, repeat: Infinity } : {}}
        >
          {!readLimitEnabled ? '--:--' : readIsExpired ? '00:00' : fmt(readRemainingSeconds)}
        </motion.p>

        <div style={{
          width: '100%', height: 4, borderRadius: 99,
          background: 'rgba(255,255,255,0.22)',
          overflow: 'hidden',
        }}>
          <motion.div
            style={{
              height: '100%', borderRadius: 99,
              background: readLimitEnabled
                ? 'rgba(255,255,255,0.80)'
                : 'rgba(255,255,255,0.35)',
              boxShadow: readLimitEnabled ? `0 0 8px ${readTheme.glow}` : 'none',
            }}
            animate={{ width: `${Math.max(0, Math.min(100, readLimitEnabled ? readPct * 100 : 0))}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        <p style={{
          margin: '6px 0 0',
          fontSize: 9, fontWeight: 700,
          color: 'rgba(255,255,255,0.65)',
          textAlign: 'center',
        }}>
          {!readLimitEnabled
            ? 'Read limit off'
            : readIsExpired
              ? '🔒 Read limit reached'
              : readIsRunning
                ? '📖 Reading now'
                : '⏸ Not reading'}
        </p>
      </div>
    </motion.div>
  );
});
SidebarTimerPill.displayName = 'SidebarTimerPill';
