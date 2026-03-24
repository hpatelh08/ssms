/**
 * components/FloatingTimer.tsx
 * ═══════════════════════════════════════════════════
 * Floating bottom-left timer for full-screen game pages
 * (Space War, Eco System) that cover the sidebar.
 * Same visual style as SidebarTimer — read-only display.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playtimeManager } from '../services/playtimeManager';

/* ── Rolling Digit ── */

const Digit: React.FC<{ value: number; prev: number; color: string }> = ({ value, prev, color }) => {
  const changed = value !== prev;
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
            color,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/* ── Floating Timer ── */

export const FloatingTimer: React.FC = React.memo(() => {
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

  if (!enabled) return null;

  const expired = !hasTime;
  const low = time.minutes < 2 && !expired;

  const textColor = expired ? '#991B1B' : low ? '#B45309' : '#5B21B6';
  const bg = expired
    ? 'rgba(254,226,226,0.85)'
    : low
      ? 'rgba(254,243,199,0.85)'
      : 'rgba(237,233,254,0.85)';
  const border = expired
    ? 'rgba(220,38,38,0.25)'
    : low
      ? 'rgba(245,158,11,0.25)'
      : 'rgba(124,58,237,0.2)';

  const mT = Math.floor(time.minutes / 10);
  const mO = time.minutes % 10;
  const sT = Math.floor(time.seconds / 10);
  const sO = time.seconds % 10;
  const pmT = Math.floor(prev.minutes / 10);
  const pmO = prev.minutes % 10;
  const psT = Math.floor(prev.seconds / 10);
  const psO = prev.seconds % 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        zIndex: 9998,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: bg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 20,
        padding: '10px 16px',
        border: `1.5px solid ${border}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
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
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: textColor }}>
            {expired ? 'Time Finished' : 'Play Time Left'}
          </p>
          {expired ? (
            <p style={{ margin: 0, fontSize: 9, color: '#DC2626', fontWeight: 600 }}>Come back tomorrow!</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
              <Digit value={mT} prev={pmT} color={textColor} />
              <Digit value={mO} prev={pmO} color={textColor} />
              <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, marginTop: -2, color: textColor }}>:</span>
              <Digit value={sT} prev={psT} color={textColor} />
              <Digit value={sO} prev={psO} color={textColor} />
              <span style={{ fontSize: 9, fontWeight: 600, marginLeft: 4, opacity: 0.6, color: textColor }}>remaining</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

FloatingTimer.displayName = 'FloatingTimer';
