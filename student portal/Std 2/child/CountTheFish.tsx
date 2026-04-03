/**
 * child/CountTheFish.tsx
 * ─────────────────────────────────────────────────────
 * Count the Fish Game Page - Wrapper with stats bar
 * Educational counting game for kids
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountFishGame from './CountFishGame';
import type { ChildScreen } from './ChildLayout';
import { useGlobalPlayTimer } from './GlobalPlayTimerProvider';
import { useGameplayTimer } from './useGameplayTimer';

interface CountTheFishProps {
  onNavigate?: (screen: ChildScreen) => void;
}

const CountTheFish: React.FC<CountTheFishProps> = ({ onNavigate }) => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [timerNotice, setTimerNotice] = useState('');

  const { canEnterGameplay, isTimeUp, timeUpMessage } = useGlobalPlayTimer();
  const canPlayNow = canEnterGameplay();

  useGameplayTimer({
    isGameplayActive: canPlayNow,
    onBlocked: () => setTimerNotice(timeUpMessage),
  });

  useEffect(() => {
    if (!isTimeUp) return;
    setTimerNotice(timeUpMessage);
  }, [isTimeUp, timeUpMessage]);

  const handleStatsUpdate = useCallback((stats: {
    score: number;
    level: number;
    round: number;
    mistakes: number;
  }) => {
    setScore(stats.score);
    setLevel(stats.level);
    setRound(stats.round);
    setMistakes(stats.mistakes);
  }, []);

  const handleRestart = useCallback(() => {
    setScore(0);
    setLevel(1);
    setRound(1);
    setMistakes(0);
    setGameKey(prev => prev + 1);
  }, []);

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      padding: '32px 24px',
      background: 'transparent',
    }}>
      {/* Title and Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          maxWidth: '1400px',
          margin: '0 auto 32px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))',
          borderRadius: '24px',
          padding: '28px 36px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(226,232,240,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <motion.span
            animate={{ rotate: [0, 10, 0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '48px', lineHeight: 1 }}
          >
            🐟
          </motion.span>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 900,
              fontFamily: 'Nunito, sans-serif',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
              marginBottom: '4px',
            }}>
              Count the Fish
            </h1>
            <p style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#64748b',
              fontFamily: 'Nunito, sans-serif',
            }}>
              Count only the fish! 🐠
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Score */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(245,158,11,0.15)',
              minWidth: '100px',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#92400e',
              fontFamily: 'Nunito, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}>
              Score
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#f59e0b',
              fontFamily: 'Nunito, sans-serif',
            }}>
              {score}
            </div>
          </motion.div>

          {/* Level */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #ddd6fe, #c4b5fd)',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(139,92,246,0.15)',
              minWidth: '100px',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#5b21b6',
              fontFamily: 'Nunito, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}>
              Level
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#8b5cf6',
              fontFamily: 'Nunito, sans-serif',
            }}>
              {level}
            </div>
          </motion.div>

          {/* Round */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #bfdbfe, #93c5fd)',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(59,130,246,0.15)',
              minWidth: '100px',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#1e40af',
              fontFamily: 'Nunito, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}>
              Round
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#3b82f6',
              fontFamily: 'Nunito, sans-serif',
            }}>
              {round}
            </div>
          </motion.div>

          {/* Mistakes */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #fecaca, #fca5a5)',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(239,68,68,0.15)',
              minWidth: '100px',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#991b1b',
              fontFamily: 'Nunito, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}>
              Mistakes
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#ef4444',
              fontFamily: 'Nunito, sans-serif',
            }}>
              {mistakes}
            </div>
          </motion.div>

          {/* Restart Button */}
          <motion.button
            onClick={handleRestart}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 800,
              fontFamily: 'Nunito, sans-serif',
              background: 'linear-gradient(135deg, #64748b, #475569)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(100,116,139,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>🔄</span>
            Restart
          </motion.button>
        </div>
      </motion.div>

      {/* Game Component */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        {!canPlayNow ? (
          <div
            style={{
              maxWidth: '980px',
              margin: '0 auto',
              borderRadius: 24,
              padding: '34px 28px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(254,226,226,0.98), rgba(252,165,165,0.9))',
              border: '1px solid rgba(239,68,68,0.35)',
              boxShadow: '0 12px 28px rgba(239,68,68,0.14)',
            }}
          >
            <p style={{ margin: 0, fontSize: 26 }}>⏰</p>
            <h3 style={{ margin: '6px 0 8px', fontSize: 24, fontWeight: 900, color: '#991b1b', fontFamily: 'Nunito, sans-serif' }}>
              Playtime Ended
            </h3>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#7f1d1d', fontFamily: 'Nunito, sans-serif' }}>
              {timerNotice || timeUpMessage}
            </p>
          </div>
        ) : (
          <CountFishGame
            key={gameKey}
            onStatsUpdate={handleStatsUpdate}
            onNavigateHome={() => onNavigate?.('home')}
          />
        )}
      </motion.div>
    </div>
  );
};

export default CountTheFish;
