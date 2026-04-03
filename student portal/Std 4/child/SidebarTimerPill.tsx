/**
 * child/SidebarTimerPill.tsx
 * ─────────────────────────────────────────────────────
 * Sidebar playtime countdown pill — replaces "Keep Learning" card.
 *
 * States:
 *  • Limit disabled    → falls back to original "Keep Learning" card
 *  • Normal (>10 min)  → purple gradient (matches dashboard theme)
 *  • Low   (<10 min)   → orange gradient
 *  • Critical (<3 min) → red gradient
 *  • Under 30 sec      → pulse glow animation
 *  • Expired           → red lock state
 *
 * Design matches dashboard glass-card system:
 *  background:      linear-gradient(135deg, rgba(99,102,241,0.88), rgba(139,92,246,0.88))
 *  backdrop-filter: blur(12px)
 *  border:          1px solid rgba(255,255,255,0.35)
 *  box-shadow:      0 8px 22px rgba(79,70,229,0.35)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGlobalPlayTimer } from './GlobalTimerContext';

/* ── Helpers ─────────────────────────────────────── */

function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

interface Theme {
  gradient: string;
  glow: string;
  pulseGlow: string;
  label: string;
  time: string;
  bar: string;
  border: string;
}

function getTheme(seconds: number): Theme {
  if (seconds <= 0) {
    return {
      gradient: 'linear-gradient(135deg, rgba(185,28,28,0.92), rgba(239,68,68,0.88))',
      glow: '0 8px 22px rgba(239,68,68,0.5)',
      pulseGlow: '0 8px 30px rgba(239,68,68,0.75)',
      label: 'rgba(255,220,220,0.95)', time: '#fff',
      bar: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.25)',
    };
  }
  if (seconds <= 180) { // < 3 min — RED
    return {
      gradient: 'linear-gradient(135deg, rgba(220,38,38,0.90), rgba(239,68,68,0.85))',
      glow: '0 8px 22px rgba(239,68,68,0.45)',
      pulseGlow: '0 8px 32px rgba(239,68,68,0.7)',
      label: 'rgba(255,220,220,0.95)', time: '#fff',
      bar: '#fca5a5', border: 'rgba(255,255,255,0.3)',
    };
  }
  if (seconds <= 600) { // < 10 min — ORANGE
    return {
      gradient: 'linear-gradient(135deg, rgba(234,88,12,0.90), rgba(249,115,22,0.85))',
      glow: '0 8px 22px rgba(249,115,22,0.42)',
      pulseGlow: '0 8px 28px rgba(249,115,22,0.65)',
      label: 'rgba(255,237,213,0.95)', time: '#fff',
      bar: '#fdba74', border: 'rgba(255,255,255,0.3)',
    };
  }
  // Normal — PURPLE
  return {
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.88), rgba(139,92,246,0.88))',
    glow: '0 8px 22px rgba(79,70,229,0.35)',
    pulseGlow: '0 8px 28px rgba(79,70,229,0.55)',
    label: 'rgba(224,231,255,0.92)', time: '#fff',
    bar: 'rgba(255,255,255,0.65)', border: 'rgba(255,255,255,0.35)',
  };
}

/* ── Component ──────────────────────────────────── */

const SidebarTimerPill: React.FC = () => {
  const { limitEnabled, remainingSeconds, limitMinutes, isRunning, isExpired } = useGlobalPlayTimer();

  const limitSeconds = limitMinutes * 60;
  const theme = useMemo(() => getTheme(remainingSeconds), [remainingSeconds]);
  const progress = limitSeconds > 0 ? Math.max(0, remainingSeconds / limitSeconds) : 0;
  const isPulsing = remainingSeconds <= 30 && limitEnabled && remainingSeconds > 0;

  /* ── Disabled / no limit: show original Keep Learning card ── */
  if (!limitEnabled) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.5)',
        borderRadius: 20, padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(200,180,255,0.2)',
      }}>
        <motion.span
          style={{ fontSize: 20 }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          🎒
        </motion.span>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--sidebar-text)' }}>Keep Learning!</p>
          <p style={{ margin: 0, fontSize: 9, color: 'var(--sidebar-text-muted)', fontWeight: 500 }}>Explore & have fun</p>
        </div>
      </div>
    );
  }

  /* ── Timer pill ─────────────────────────────────── */
  return (
    <motion.div
      style={{
        borderRadius: 18,
        padding: '13px 15px',
        background: theme.gradient,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.glow,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
      animate={isPulsing ? {
        boxShadow: [theme.glow, theme.pulseGlow, theme.glow],
      } : {}}
      transition={isPulsing ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      {/* Gloss shimmer overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)',
        pointerEvents: 'none',
      }} />

      {/* ── Header row: label + running indicator ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 6, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <motion.span
            style={{ fontSize: 13, lineHeight: 1 }}
            animate={isExpired
              ? { scale: [1, 1.25, 1] }
              : isRunning
                ? { rotate: [0, 12, -12, 0] }
                : {}
            }
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {isExpired ? '⛔' : '⏱️'}
          </motion.span>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: 1.8,
            color: theme.label, textTransform: 'uppercase' as const,
          }}>
            {isExpired ? 'Time Up!' : 'Time Left'}
          </span>
        </div>

        {/* Live indicator dot */}
        {isRunning && !isExpired && (
          <motion.div
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#4ade80',
              boxShadow: '0 0 7px #4ade80',
              flexShrink: 0,
            }}
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* ── Time display ─────────────────────────── */}
      <motion.div
        style={{
          fontSize: 24, fontWeight: 900,
          color: theme.time,
          letterSpacing: 2,
          fontFamily: 'ui-monospace, "Courier New", monospace',
          lineHeight: 1,
          marginBottom: 10,
          position: 'relative',
        }}
        animate={isPulsing ? { scale: [1, 1.05, 1] } : {}}
        transition={isPulsing ? { duration: 0.8, repeat: Infinity } : {}}
      >
        {formatTime(remainingSeconds)}
      </motion.div>

      {/* ── Progress bar ─────────────────────────── */}
      <div style={{
        height: 3, borderRadius: 2,
        background: 'rgba(255,255,255,0.18)',
        overflow: 'hidden',
      }}>
        <motion.div
          style={{ height: '100%', borderRadius: 2, background: theme.bar }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>

      {/* Limit label */}
      <div style={{
        marginTop: 5, fontSize: 9, fontWeight: 600,
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 0.5,
      }}>
        {limitMinutes} min daily limit
      </div>
    </motion.div>
  );
};

export default SidebarTimerPill;
