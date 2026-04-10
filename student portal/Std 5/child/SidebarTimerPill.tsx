/**
 * child/SidebarTimerPill.tsx
 * Compact timer pill for the child sidebar.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalPlayTimer } from './GlobalTimerContext';

function formatTime(ms: number): string {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const SidebarTimerPill: React.FC = () => {
  const { timerState } = useGlobalPlayTimer();
  const { remainingMs, totalMs, isRunning, hasStarted, isExpired, limitEnabled } = timerState;

  if (!limitEnabled) {
    return (
      <div
        style={{
          borderRadius: 18,
          padding: '11px 14px 10px',
          background: 'rgba(255,255,255,0.45)',
          border: '1.5px solid rgba(200,190,255,0.45)',
          boxShadow: 'var(--shadow-soft, 0 2px 8px rgba(0,0,0,0.06))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <span style={{ fontSize: 13 }}>INF</span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--sidebar-text-muted, #94a3b8)',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            Play Timer
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--sidebar-text-muted, #94a3b8)',
            fontFamily: 'Nunito, sans-serif',
            letterSpacing: '1px',
          }}
        >
          Unlimited
        </div>
      </div>
    );
  }

  const secs = Math.ceil(remainingMs / 1000);
  const isWarning = hasStarted && !isExpired && secs <= 600;
  const isCritical = hasStarted && !isExpired && secs <= 180;
  const isShaking = hasStarted && !isExpired && secs <= 30;
  const isPaused = hasStarted && !isRunning && !isExpired;

  const progressPct = totalMs > 0 ? Math.max(0, (remainingMs / totalMs) * 100) : 0;

  const gradient = isExpired
    ? 'linear-gradient(135deg, rgba(239,68,68,0.82) 0%, rgba(185,28,28,0.82) 100%)'
    : isCritical
      ? 'linear-gradient(135deg, rgba(249,115,22,0.82) 0%, rgba(239,68,68,0.82) 100%)'
      : isWarning
        ? 'linear-gradient(135deg, rgba(245,158,11,0.80) 0%, rgba(249,115,22,0.80) 100%)'
        : !hasStarted
          ? 'rgba(255,255,255,0.42)'
          : 'linear-gradient(135deg, rgba(63,143,58,0.82) 0%, rgba(95,139,61,0.82) 100%)';

  const glowShadow = isExpired
    ? '0 8px 22px rgba(239,68,68,0.30), inset 0 1px 0 rgba(255,255,255,0.22)'
    : isCritical
      ? '0 8px 22px rgba(249,115,22,0.28), inset 0 1px 0 rgba(255,255,255,0.22)'
      : isWarning
        ? '0 8px 22px rgba(245,158,11,0.24), inset 0 1px 0 rgba(255,255,255,0.22)'
        : isRunning
          ? '0 8px 22px rgba(79,70,229,0.28), inset 0 1px 0 rgba(255,255,255,0.25)'
          : '0 4px 16px rgba(63,143,58,0.10), inset 0 1px 0 rgba(255,255,255,0.55)';

  const border = !hasStarted ? '1px solid rgba(200,190,255,0.45)' : '1px solid rgba(255,255,255,0.32)';
  const backdropFilter = !hasStarted ? 'none' : 'blur(12px)';

  const label = isExpired ? "Time's Up!" : !hasStarted ? 'Play Timer' : 'Time Left';
  const timeDisplay = !hasStarted ? formatTime(totalMs) : isExpired ? '00:00' : formatTime(remainingMs);

  const textColor = !hasStarted ? 'var(--sidebar-text-muted, #94a3b8)' : '#fff';
  const labelColor = !hasStarted ? 'var(--sidebar-text-muted, #94a3b8)' : 'rgba(255,255,255,0.88)';

  return (
    <motion.div
      animate={isShaking ? { x: [0, -5, 5, -5, 5, -3, 3, 0] } : { x: 0 }}
      transition={isShaking ? { duration: 0.55, repeat: Infinity, repeatDelay: 0.8, ease: 'easeInOut' } : { duration: 0.2 }}
    >
      <motion.div
        animate={
          isWarning && !isExpired
            ? {
                boxShadow: [
                  glowShadow,
                  `0 0 0 4px ${isCritical ? 'rgba(249,115,22,0.18)' : 'rgba(245,158,11,0.18)'}`,
                  glowShadow,
                ],
              }
            : { boxShadow: glowShadow }
        }
        transition={isWarning ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
        style={{
          borderRadius: 18,
          padding: '11px 14px 10px',
          background: gradient,
          border,
          backdropFilter,
          WebkitBackdropFilter: backdropFilter,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isRunning && (
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
          <motion.span
            style={{ fontSize: 13, lineHeight: 1 }}
            animate={isRunning && !isExpired ? { rotate: [0, 20, -20, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            T
          </motion.span>

          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: labelColor,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              fontFamily: 'Nunito, sans-serif',
              flex: 1,
            }}
          >
            {label}
          </span>

          {isPaused && (
            <span
              style={{
                fontSize: 8,
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 700,
                background: 'rgba(255,255,255,0.15)',
                padding: '1px 5px',
                borderRadius: 8,
              }}
            >
              II
            </span>
          )}
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={Math.floor(remainingMs / 1000)}
            initial={{ opacity: 0.5, scale: 0.94, y: 3 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -3 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              fontSize: 22,
              fontWeight: 900,
              fontFamily: 'Nunito, monospace, sans-serif',
              color: textColor,
              letterSpacing: '2px',
              lineHeight: 1,
              marginBottom: 8,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {timeDisplay}
          </motion.div>
        </AnimatePresence>

        <div
          style={{
            width: '100%',
            height: 4,
            background: !hasStarted ? 'rgba(63,143,58,0.15)' : 'rgba(255,255,255,0.2)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: !hasStarted ? 'rgba(63,143,58,0.3)' : 'rgba(255,255,255,0.75)',
              borderRadius: 4,
            }}
          />
        </div>

        {!hasStarted && (
          <p
            style={{
              margin: '5px 0 0',
              fontSize: 8,
              color: 'var(--sidebar-text-muted, #94a3b8)',
              fontWeight: 600,
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            Starts when you play
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};
