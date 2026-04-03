/**
 * components/InGameTimer.tsx
 * ═══════════════════════════════════════════════════
 * Floating in-game timer displayed during active gameplay
 * Auto-starts/pauses based on game state
 * Positioned at top-center with semi-transparent background
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaytimeTimer } from './PlaytimeTimer';
import { playtimeManager } from '../services/playtimeManager';

interface InGameTimerProps {
  isActive: boolean; // Whether gameplay is active (not paused/menu)
  onTimeExpired?: () => void; // Callback when time runs out
}

export const InGameTimer: React.FC<InGameTimerProps> = ({ isActive, onTimeExpired }) => {
  const [visible, setVisible] = useState(false);
  const [lowTime, setLowTime] = useState(false);

  useEffect(() => {
    const updateState = () => {
      const remaining = playtimeManager.getRemainingSeconds();
      const settings = playtimeManager.getSettings();
      
      // Only show timer if limit is enabled
      setVisible(settings.enabled);
      
      // Low time warning when < 2 minutes
      setLowTime(remaining <= 120 && remaining > 0);

      // Hide timer when time is up
      if (remaining <= 0 && visible) {
        setVisible(false);
        onTimeExpired?.();
      }
    };

    updateState();
    const unsubscribe = playtimeManager.subscribe(updateState);

    // Handle playtime expiration event
    const handleExpired = () => {
      setVisible(false);
      onTimeExpired?.();
    };

    window.addEventListener('playtimeExpired', handleExpired);

    return () => {
      unsubscribe();
      window.removeEventListener('playtimeExpired', handleExpired);
    };
  }, [visible, onTimeExpired]);

  // Start/pause timer based on game activity
  useEffect(() => {
    if (isActive) {
      playtimeManager.startTimer();
    } else {
      playtimeManager.pauseTimer();
    }
  }, [isActive]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <motion.div
          animate={lowTime ? {
            scale: [1, 1.05, 1],
            boxShadow: [
              '0 4px 20px rgba(239,68,68,0.3)',
              '0 6px 28px rgba(239,68,68,0.5)',
              '0 4px 20px rgba(239,68,68,0.3)',
            ],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: lowTime ? Infinity : 0,
            ease: 'easeInOut',
          }}
          style={{
            background: lowTime
              ? 'linear-gradient(135deg, rgba(254,226,226,0.95), rgba(252,165,165,0.95))'
              : 'linear-gradient(135deg, rgba(237,233,254,0.95), rgba(221,214,254,0.95))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 20,
            padding: '12px 20px',
            border: lowTime
              ? '2px solid rgba(239,68,68,0.4)'
              : '2px solid rgba(124,58,237,0.25)',
            boxShadow: lowTime
              ? '0 4px 20px rgba(239,68,68,0.3)'
              : '0 4px 20px rgba(124,58,237,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <motion.span
            animate={lowTime ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5, repeat: lowTime ? Infinity : 0, repeatDelay: 2 }}
            style={{ fontSize: 20 }}
          >
            {lowTime ? '⏰' : '⏱️'}
          </motion.span>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              color: lowTime ? '#991B1B' : '#5B21B6',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              {lowTime ? 'Time Running Out!' : 'Play Time'}
            </div>
            <PlaytimeTimer variant="inline" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InGameTimer;
