/**
 * components/PlayTimeLeftCard.tsx
 * ═══════════════════════════════════════════════════
 * Replaces "Keep Learning!" card on student home
 * Shows remaining playtime with animated timer
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlaytimeTimer } from './PlaytimeTimer';
import { playtimeManager } from '../services/playtimeManager';

export const PlayTimeLeftCard: React.FC = () => {
  const [hasTime, setHasTime] = useState(true);
  const [isUnlimited, setIsUnlimited] = useState(false);

  useEffect(() => {
    const updateState = () => {
      const settings = playtimeManager.getSettings();
      const remaining = playtimeManager.getRemainingSeconds();
      
      setIsUnlimited(!settings.enabled);
      setHasTime(remaining > 0);
    };

    updateState();
    const unsubscribe = playtimeManager.subscribe(updateState);

    return unsubscribe;
  }, []);

  if (isUnlimited) {
    // Show unlimited playtime indicator
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
          borderRadius: 24,
          padding: '20px 24px',
          border: '2px solid rgba(16,185,129,0.2)',
          boxShadow: '0 4px 20px rgba(16,185,129,0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
          }}>
            ∞
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 900,
              color: '#065F46',
              letterSpacing: '-0.01em',
            }}>
              Unlimited Play Time
            </h3>
            <p style={{
              margin: '4px 0 0',
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(6,95,70,0.7)',
            }}>
              No daily limit set
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      style={{
        background: hasTime 
          ? 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)'
          : 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
        borderRadius: 24,
        padding: '20px 24px',
        border: hasTime
          ? '2px solid rgba(124,58,237,0.2)'
          : '2px solid rgba(220,38,38,0.2)',
        boxShadow: hasTime
          ? '0 4px 20px rgba(124,58,237,0.12)'
          : '0 4px 20px rgba(220,38,38,0.12)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: '50%',
          background: hasTime
            ? 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)'
            : 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
        }}>
          {hasTime ? '⏱️' : '🌙'}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 900,
            color: hasTime ? '#5B21B6' : '#991B1B',
            letterSpacing: '-0.01em',
          }}>
            {hasTime ? 'Play Time Left' : 'Time Finished'}
          </h3>
          <p style={{
            margin: '4px 0 0',
            fontSize: 13,
            fontWeight: 600,
            color: hasTime ? 'rgba(91,33,182,0.7)' : 'rgba(153,27,27,0.7)',
          }}>
            {hasTime ? 'Today\'s game time remaining' : 'Come back tomorrow!'}
          </p>
        </div>
      </div>

      {hasTime && (
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid rgba(124,58,237,0.15)',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <PlaytimeTimer variant="large" />
        </div>
      )}

      {!hasTime && (
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid rgba(220,38,38,0.15)',
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: '#991B1B',
        }}>
          🌟 Great job playing today!
        </div>
      )}
    </motion.div>
  );
};

export default PlayTimeLeftCard;
