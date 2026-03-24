/**
 * components/PlaytimeTimer.tsx
 * ═══════════════════════════════════════════════════
 * Animated countdown timer with rolling digit effect
 * 
 * Features:
 * - MM:SS format display
 * - Smooth rolling digit animations
 * - Auto-updates every second
 * - Responsive sizing
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playtimeManager } from '../services/playtimeManager';

interface Props {
  variant?: 'large' | 'small' | 'inline';
  className?: string;
}

export const PlaytimeTimer: React.FC<Props> = ({ variant = 'large', className = '' }) => {
  const [time, setTime] = useState(() => playtimeManager.formatTime());
  const prevTimeRef = useRef(time);

  useEffect(() => {
    // Subscribe to playtime updates
    const unsubscribe = playtimeManager.subscribe(() => {
      setTime(playtimeManager.formatTime());
    });

    return unsubscribe;
  }, []);

  // Track which digits changed for animations
  const prevTime = prevTimeRef.current;
  prevTimeRef.current = time;

  const minutesTens = Math.floor(time.minutes / 10);
  const minutesOnes = time.minutes % 10;
  const secondsTens = Math.floor(time.seconds / 10);
  const secondsOnes = time.seconds % 10;

  const prevMinutesTens = Math.floor(prevTime.minutes / 10);
  const prevMinutesOnes = prevTime.minutes % 10;
  const prevSecondsTens = Math.floor(prevTime.seconds / 10);
  const prevSecondsOnes = prevTime.seconds % 10;

  // Size variants
  const sizes = {
    large: { fontSize: 48, digitWidth: 32, digitHeight: 56 },
    small: { fontSize: 24, digitWidth: 16, digitHeight: 28 },
    inline: { fontSize: 18, digitWidth: 12, digitHeight: 21 },
  };

  const size = sizes[variant];

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {/* Minutes Tens */}
      <RollingDigit 
        value={minutesTens} 
        prevValue={prevMinutesTens}
        size={size}
      />
      
      {/* Minutes Ones */}
      <RollingDigit 
        value={minutesOnes} 
        prevValue={prevMinutesOnes}
        size={size}
      />

      {/* Colon */}
      <span 
        style={{ 
          fontSize: size.fontSize, 
          fontWeight: 900, 
          color: '#7C3AED',
          lineHeight: 1,
          marginTop: -4,
        }}
      >
        :
      </span>

      {/* Seconds Tens */}
      <RollingDigit 
        value={secondsTens} 
        prevValue={prevSecondsTens}
        size={size}
      />
      
      {/* Seconds Ones */}
      <RollingDigit 
        value={secondsOnes} 
        prevValue={prevSecondsOnes}
        size={size}
      />
    </div>
  );
};

/* ── Rolling Digit Component ── */

interface DigitProps {
  value: number;
  prevValue: number;
  size: { fontSize: number; digitWidth: number; digitHeight: number };
}

const RollingDigit: React.FC<DigitProps> = ({ value, prevValue, size }) => {
  const changed = value !== prevValue;
  
  return (
    <div 
      style={{ 
        width: size.digitWidth, 
        height: size.digitHeight,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={changed ? { y: -20, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            duration: 0.3,
          }}
          style={{
            fontSize: size.fontSize,
            fontWeight: 900,
            color: '#7C3AED',
            lineHeight: 1,
            position: 'absolute',
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default PlaytimeTimer;
