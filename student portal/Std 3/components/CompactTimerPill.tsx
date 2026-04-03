/**
 * components/CompactTimerPill.tsx
 * ═══════════════════════════════════════════════════
 * Small timer pill for difficulty / level selection screens.
 * Always paused — just reads and displays the shared remaining time.
 * Never calls startTimer / pauseTimer.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playtimeManager } from '../services/playtimeManager';

/* ── Tiny Rolling Digit ── */

const PillDigit: React.FC<{ value: number; prevValue: number }> = ({ value, prevValue }) => {
  const changed = value !== prevValue;
  return (
    <span style={{
      display: 'inline-block',
      width: 10,
      height: 16,
      position: 'relative',
      overflow: 'hidden',
      textAlign: 'center',
    }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={changed ? { y: -10, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28, duration: 0.2 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
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
      bg: 'radial-gradient(circle at 20% 20%, rgba(239,68,68,0.26), rgba(127,29,29,0.24) 38%, rgba(15,23,42,0.92) 100%)',
      border: 'rgba(248,113,113,0.4)',
      text: '#FECACA',
      sub: '#FCA5A5',
      iconBg: 'radial-gradient(circle at 30% 28%, rgba(254,202,202,0.55), rgba(127,29,29,0.9) 70%)',
      glow: 'rgba(239,68,68,0.22)',
    };
  }
  if (low) {
    return {
      bg: 'radial-gradient(circle at 20% 20%, rgba(251,191,36,0.26), rgba(120,53,15,0.24) 38%, rgba(15,23,42,0.92) 100%)',
      border: 'rgba(251,191,36,0.42)',
      text: '#FDE68A',
      sub: '#FCD34D',
      iconBg: 'radial-gradient(circle at 30% 28%, rgba(254,240,138,0.55), rgba(120,53,15,0.9) 70%)',
      glow: 'rgba(251,191,36,0.22)',
    };
  }
  return {
    bg: 'radial-gradient(circle at 20% 20%, rgba(129,140,248,0.22), rgba(88,28,135,0.22) 38%, rgba(15,23,42,0.92) 100%)',
    border: 'rgba(129,140,248,0.35)',
    text: '#E2E8F0',
    sub: '#C4B5FD',
    iconBg: 'radial-gradient(circle at 30% 28%, rgba(196,181,253,0.5), rgba(76,29,149,0.9) 70%)',
    glow: 'rgba(129,140,248,0.2)',
  };
};

/* ── Main Pill ── */

export const CompactTimerPill: React.FC = React.memo(() => {
  const [time, setTime] = useState(() => playtimeManager.formatTime());
  const [prev, setPrev] = useState(time);
  const [enabled, setEnabled] = useState(() => playtimeManager.getSettings().enabled);
  const [hasTime, setHasTime] = useState(() => playtimeManager.hasTimeRemaining());

  useEffect(() => {
    const sync = () => {
      const nextTime = playtimeManager.formatTime();
      setTime(previousTime => {
        setPrev(previousTime);
        return nextTime;
      });
      setEnabled(playtimeManager.getSettings().enabled);
      setHasTime(playtimeManager.hasTimeRemaining());
    };

    sync();
    const unsub = playtimeManager.subscribe(sync);
    return unsub;
  }, []);

  if (!enabled) return null; // Don't show pill when unlimited

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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: theme.bg,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 14,
        padding: '6px 14px',
        border: `1px solid ${theme.border}`,
        boxShadow: `0 8px 18px ${theme.glow}, 0 2px 10px rgba(2,6,23,0.26), inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: 'rgba(2,6,23,0.22)', right: 10, top: 7 }} />
      <span
        style={{
          fontSize: 12,
          width: 22,
          height: 22,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.iconBg,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 8px rgba(2,6,23,0.25)',
          border: '1px solid rgba(255,255,255,0.28)',
          flexShrink: 0,
        }}
      >
        {expired ? '🌙' : low ? '⏰' : '⏱️'}
      </span>

      {expired ? (
        <span style={{ fontSize: 11, fontWeight: 700, color: textColor }}>Time's up!</span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', color: textColor }}>
          <PillDigit value={mT} prevValue={pmT} />
          <PillDigit value={mO} prevValue={pmO} />
          <span style={{ fontSize: 12, fontWeight: 900, marginTop: -1 }}>:</span>
          <PillDigit value={sT} prevValue={psT} />
          <PillDigit value={sO} prevValue={psO} />
          <span style={{ fontSize: 8, fontWeight: 700, marginLeft: 4, color: theme.sub }}>left</span>
        </span>
      )}
    </motion.div>
  );
});

CompactTimerPill.displayName = 'CompactTimerPill';
export default CompactTimerPill;
