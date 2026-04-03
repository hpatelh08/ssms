/**
 * components/SidebarTimer.tsx
 * ═══════════════════════════════════════════════════
 * Compact timer card for the left sidebar bottom area.
 * Always visible across all student pages.
 * Shows paused time — never starts/stops the timer itself.
 * Reads from the shared playtimeManager singleton.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playtimeManager } from '../services/playtimeManager';

/* ── Rolling Digit (sidebar-sized) ── */

const SidebarDigit: React.FC<{ value: number; prevValue: number }> = ({ value, prevValue }) => {
  const changed = value !== prevValue;
  return (
    <span style={{
      display: 'inline-block',
      width: 13,
      height: 20,
      position: 'relative',
      overflow: 'hidden',
      textAlign: 'center',
    }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={changed ? { y: -14, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 14, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28, duration: 0.25 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const getPillTheme = (expired: boolean, low: boolean) => {
  if (expired) {
    return {
      bg: 'radial-gradient(circle at 22% 20%, rgba(239,68,68,0.24), rgba(127,29,29,0.2) 38%, rgba(15,23,42,0.92) 100%)',
      border: 'rgba(248,113,113,0.4)',
      text: '#FECACA',
      sub: '#FCA5A5',
      glow: 'rgba(239,68,68,0.24)',
      iconBg: 'radial-gradient(circle at 30% 28%, rgba(254,202,202,0.55), rgba(127,29,29,0.9) 70%)',
    };
  }
  if (low) {
    return {
      bg: 'radial-gradient(circle at 24% 22%, rgba(251,191,36,0.24), rgba(120,53,15,0.22) 42%, rgba(15,23,42,0.92) 100%)',
      border: 'rgba(251,191,36,0.42)',
      text: '#FDE68A',
      sub: '#FCD34D',
      glow: 'rgba(251,191,36,0.24)',
      iconBg: 'radial-gradient(circle at 30% 28%, rgba(254,240,138,0.5), rgba(120,53,15,0.9) 70%)',
    };
  }
  return {
    bg: 'radial-gradient(circle at 22% 20%, rgba(129,140,248,0.2), rgba(88,28,135,0.18) 40%, rgba(15,23,42,0.92) 100%)',
    border: 'rgba(129,140,248,0.35)',
    text: '#E2E8F0',
    sub: '#C4B5FD',
    glow: 'rgba(129,140,248,0.22)',
    iconBg: 'radial-gradient(circle at 30% 28%, rgba(196,181,253,0.45), rgba(76,29,149,0.9) 70%)',
  };
};

/* ── Main Sidebar Timer Card ── */

export const SidebarTimer: React.FC = React.memo(() => {
  const [time, setTime] = useState(() => playtimeManager.formatTime());
  const [prev, setPrev] = useState(time);
  const [enabled, setEnabled] = useState(() => playtimeManager.getSettings().enabled);
  const [hasTime, setHasTime] = useState(() => playtimeManager.hasTimeRemaining());

  useEffect(() => {
    const unsub = playtimeManager.subscribe(() => {
      setPrev(time);
      setTime(playtimeManager.formatTime());
      setEnabled(playtimeManager.getSettings().enabled);
      setHasTime(playtimeManager.hasTimeRemaining());
    });
    return unsub;
  });

  if (!enabled) {
    // Unlimited mode — simple indicator
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(209,250,229,0.6)',
        borderRadius: 20, padding: '12px 16px',
        boxShadow: '0 2px 10px rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.15)',
      }}>
        <motion.span
          style={{ fontSize: 18 }}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          ♾️
        </motion.span>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#065F46' }}>Unlimited Play</p>
          <p style={{ margin: 0, fontSize: 9, color: '#10B981', fontWeight: 600 }}>No daily limit set</p>
        </div>
      </div>
    );
  }

  const mT = Math.floor(time.minutes / 10);
  const mO = time.minutes % 10;
  const sT = Math.floor(time.seconds / 10);
  const sO = time.seconds % 10;

  const pmT = Math.floor(prev.minutes / 10);
  const pmO = prev.minutes % 10;
  const psT = Math.floor(prev.seconds / 10);
  const psO = prev.seconds % 10;

  const expired = !hasTime;
  const low = time.minutes < 2 && !expired;

  const theme = getPillTheme(expired, low);
  const textColor = theme.text;

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      display: 'flex', alignItems: 'center', gap: 10,
      background: theme.bg,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 20, padding: '12px 16px',
      boxShadow: `0 12px 28px ${theme.glow}, 0 4px 12px rgba(2,6,23,0.28), inset 0 1px 0 rgba(255,255,255,0.08)`,
      border: `1px solid ${theme.border}`,
      transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
    }}>
      <div style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: 'rgba(2,6,23,0.26)', right: 18, top: 10 }} />
      <div style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: 'rgba(2,6,23,0.2)', right: 34, top: 26 }} />

      <motion.span
        style={{
          fontSize: 16,
          width: 28,
          height: 28,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.iconBg,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 3px 10px rgba(2,6,23,0.3)',
          border: '1px solid rgba(255,255,255,0.28)',
          flexShrink: 0,
        }}
        animate={low ? { rotate: [0, -8, 8, -8, 0] } : { y: [0, -2, 0] }}
        transition={low
          ? { duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }
          : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {expired ? '🌙' : low ? '⏰' : '⏱️'}
      </motion.span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: textColor }}>
          {expired ? 'Time Finished' : 'Play Time Left'}
        </p>
        {expired ? (
          <p style={{ margin: 0, fontSize: 9, color: theme.sub, fontWeight: 600 }}>Come back tomorrow!</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 2, color: textColor }}>
            <SidebarDigit value={mT} prevValue={pmT} />
            <SidebarDigit value={mO} prevValue={pmO} />
            <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, marginTop: -2 }}>:</span>
            <SidebarDigit value={sT} prevValue={psT} />
            <SidebarDigit value={sO} prevValue={psO} />
            <span style={{ fontSize: 9, fontWeight: 700, marginLeft: 4, opacity: 0.9, color: theme.sub }}>remaining</span>
          </div>
        )}
      </div>
    </div>
  );
});

SidebarTimer.displayName = 'SidebarTimer';
export default SidebarTimer;
