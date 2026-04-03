import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatTimer, useGlobalPlayTimer } from './GlobalPlayTimerProvider';

export const SidebarTimerPill: React.FC = React.memo(() => {
  const {
    limitEnabled,
    remainingSeconds,
    sessionLimitMinutes,
    running,
    isTimeUp,
    timeUpMessage,
  } = useGlobalPlayTimer();

  const status = useMemo(() => {
    if (!limitEnabled) {
      return {
        gradient: 'linear-gradient(135deg, rgba(90,196,217,0.86), rgba(114,219,204,0.82))',
        glow: '0 10px 24px rgba(90,196,217,0.28)',
        label: 'No Limit',
      };
    }

    if (remainingSeconds <= 180) {
      return {
        gradient: 'linear-gradient(135deg, rgba(241,145,145,0.9), rgba(223,112,112,0.88))',
        glow: '0 8px 22px rgba(239,68,68,0.35)',
        label: 'Critical',
      };
    }

    if (remainingSeconds <= 600) {
      return {
        gradient: 'linear-gradient(135deg, rgba(245,190,118,0.9), rgba(239,168,120,0.88))',
        glow: '0 8px 22px rgba(239,168,120,0.3)',
        label: 'Low Time',
      };
    }

    return {
      gradient: 'linear-gradient(135deg, rgba(128,188,230,0.88), rgba(93,206,206,0.86))',
      glow: '0 10px 24px rgba(108,193,219,0.3)',
      label: running ? 'Active' : 'Paused',
    };
  }, [limitEnabled, remainingSeconds, running]);

  const totalSeconds = Math.max(1, sessionLimitMinutes * 60);
  const progress = limitEnabled ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100)) : 100;
  const pulse = limitEnabled && remainingSeconds <= 30 && remainingSeconds > 0;

  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: status.gradient,
        borderRadius: 20,
        padding: '12px 14px',
        border: '1px solid rgba(255,255,255,0.35)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: `${status.glow}, inset 0 1px 0 rgba(255,255,255,0.28)`,
        color: '#ffffff',
      }}
      animate={pulse ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={pulse ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', opacity: 0.95 }}>
            TIME LEFT
          </p>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, opacity: 0.85 }}>
            {status.label}
          </p>
        </div>

        <motion.p
          key={limitEnabled ? remainingSeconds : -1}
          initial={{ opacity: 0.55, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            margin: '2px 0 6px',
            fontSize: 22,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '0.6px',
            fontFamily: 'Nunito, sans-serif',
            textShadow: '0 2px 8px rgba(15,23,42,0.25)',
          }}
        >
          {limitEnabled ? formatTimer(remainingSeconds) : 'UNLIMITED'}
        </motion.p>

        <div style={{
          width: '100%',
          height: 6,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.28)',
          overflow: 'hidden',
        }}>
          <motion.div
            style={{
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.96), rgba(255,244,200,0.96), rgba(219,255,252,0.95))',
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {isTimeUp && (
          <p style={{ margin: '6px 0 0', fontSize: 9, fontWeight: 700, opacity: 0.95 }}>
            {timeUpMessage}
          </p>
        )}
      </div>
    </motion.div>
  );
});

SidebarTimerPill.displayName = 'SidebarTimerPill';
