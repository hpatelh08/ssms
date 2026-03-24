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

/* ── Main Pill ── */

export const CompactTimerPill: React.FC = React.memo(() => {
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

  const pillBg = expired
    ? 'rgba(254,226,226,0.9)'
    : low
      ? 'rgba(254,243,199,0.9)'
      : 'rgba(237,233,254,0.9)';
  const pillBorder = expired
    ? 'rgba(220,38,38,0.25)'
    : low
      ? 'rgba(245,158,11,0.25)'
      : 'rgba(124,58,237,0.2)';
  const textColor = expired ? '#991B1B' : low ? '#B45309' : '#5B21B6';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: pillBg,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 14,
        padding: '6px 14px',
        border: `1.5px solid ${pillBorder}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ fontSize: 14 }}>
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
        </span>
      )}
    </motion.div>
  );
});

CompactTimerPill.displayName = 'CompactTimerPill';
export default CompactTimerPill;
