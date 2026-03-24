/**
 * child/SaveTheOcean.tsx
 * ─────────────────────────────────────────────────────
 * Save the Ocean — Ocean cleanup claw game page
 *
 * Page layout:
 *  • Stats bar (score, trash collected, mistakes, restart button)
 *  • Landscape game container with ship, claw, and underwater objects
 *
 * Styling: Soft pastel dashboard aesthetic with ocean-blue theme
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import OceanClawGame from './OceanClawGame';
import type { ChildScreen } from './ChildLayout';

interface SaveTheOceanProps {
  onNavigate?: (screen: ChildScreen) => void;
}

const SaveTheOcean: React.FC<SaveTheOceanProps> = ({ onNavigate }) => {
  const [gameKey, setGameKey] = useState(0);
  const [gameStats, setGameStats] = useState({
    score: 0,
    trashCollected: 0,
    mistakes: 0,
  });

  const handleRestart = useCallback(() => {
    setGameKey(prev => prev + 1);
    setGameStats({ score: 0, trashCollected: 0, mistakes: 0 });
  }, []);

  const handleStatsUpdate = useCallback((stats: {
    score: number;
    trashCollected: number;
    mistakes: number;
  }) => {
    setGameStats(stats);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 28px',
        background: 'linear-gradient(180deg, #dbeafe 0%, #e0f2fe 40%, #cceeff 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: '1500px',
          margin: '0 auto',
        }}
      >
        {/* ── Polished Stats Bar with Title ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))',
            backdropFilter: 'blur(12px)',
            borderRadius: '28px',
            padding: '28px 36px',
            marginBottom: '28px',
            boxShadow: '0 12px 40px rgba(6,182,212,0.15), 0 0 0 1px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
            border: '1px solid rgba(226,232,240,0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap', flex: 1 }}>
            {/* Game Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <motion.span 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '48px' }}
              >
                🌊
              </motion.span>
              <div>
                <h1
                  style={{
                    fontSize: '32px',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #0284c7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'Nunito, sans-serif',
                    margin: 0,
                    lineHeight: 1.2,
                    letterSpacing: '-0.8px',
                  }}
                >
                  Save the Ocean
                </h1>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#64748b',
                    margin: 0,
                    marginTop: '4px',
                    fontFamily: 'Nunito, sans-serif',
                    letterSpacing: '0.3px',
                  }}
                >
                  🐠 Clean the ocean • Protect sea life • Collect trash!
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <StatCard label="Score" value={gameStats.score} icon="⭐" color="#f59e0b" />
              <StatCard label="Trash" value={gameStats.trashCollected} icon="🗑️" color="#10b981" />
              <StatCard label="Mistakes" value={gameStats.mistakes} icon="❌" color="#ef4444" />
            </div>
          </div>

          {/* Restart Button - More polished */}
          <motion.button
            onClick={handleRestart}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.94 }}
            style={{
              padding: '16px 32px',
              borderRadius: '18px',
              border: 'none',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 50%, #0284c7 100%)',
              color: 'white',
              fontSize: '17px',
              fontWeight: 900,
              fontFamily: 'Nunito, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(6,182,212,0.35), 0 0 0 2px rgba(6,182,212,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              letterSpacing: '0.3px',
              textShadow: '0 1px 2px rgba(0,0,0,0.15)',
            }}
          >
            <span style={{ fontSize: '20px' }}>🔄</span>
            Restart Game
          </motion.button>
        </motion.div>

        {/* ── Game Container ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <OceanClawGame 
            key={gameKey} 
            onStatsUpdate={handleStatsUpdate}
            onNavigateHome={() => onNavigate?.('home')}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

/** Stat card component - Polished and modern */
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  color: string;
}> = ({ label, value, icon, color }) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.02 }}
    style={{
      padding: '12px 20px',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, rgba(255,255,255,1), rgba(248,250,252,0.95))',
      boxShadow: '0 3px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
      border: '1px solid rgba(226,232,240,0.8)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '130px',
      transition: 'all 0.2s ease',
    }}
  >
    <span style={{ fontSize: '26px', lineHeight: 1 }}>{icon}</span>
    <div>
      <p
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#94a3b8',
          marginBottom: '3px',
          fontFamily: 'Nunito, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: '24px',
          fontWeight: 900,
          color: color,
          fontFamily: 'Nunito, sans-serif',
          lineHeight: 1,
          textShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {value}
      </p>
    </div>
  </motion.div>
);

export default SaveTheOcean;
