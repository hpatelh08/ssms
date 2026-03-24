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

  const textColor = expired ? '#991B1B' : low ? '#B45309' : '#5B21B6';
  const bgColor = expired
    ? 'rgba(254,226,226,0.7)'
    : low
      ? 'rgba(254,243,199,0.7)'
      : 'rgba(237,233,254,0.6)';
  const borderColor = expired
    ? 'rgba(220,38,38,0.2)'
    : low
      ? 'rgba(245,158,11,0.2)'
      : 'rgba(124,58,237,0.15)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: bgColor,
      borderRadius: 20, padding: '12px 16px',
      boxShadow: '0 2px 10px rgba(124,58,237,0.06)',
      border: `1px solid ${borderColor}`,
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      <motion.span
        style={{ fontSize: 18 }}
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
          <p style={{ margin: 0, fontSize: 9, color: '#DC2626', fontWeight: 600 }}>Come back tomorrow!</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 2, color: textColor }}>
            <SidebarDigit value={mT} prevValue={pmT} />
            <SidebarDigit value={mO} prevValue={pmO} />
            <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, marginTop: -2 }}>:</span>
            <SidebarDigit value={sT} prevValue={psT} />
            <SidebarDigit value={sO} prevValue={psO} />
            <span style={{ fontSize: 9, fontWeight: 600, marginLeft: 4, opacity: 0.6 }}>remaining</span>
          </div>
        )}
      </div>
    </div>
  );
});

SidebarTimer.displayName = 'SidebarTimer';
export default SidebarTimer;
