/**
 * components/TopBar.tsx
 * ─────────────────────────────────────────────────────
 * Parent-dashboard glass header.
 *
 * Layout: Logo/avatar + child name (left) ·
 *         Sound toggle · DashboardSwitch · Profile avatar (right)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useSound } from '../child/SoundProvider';
import { useAuth } from '../auth/AuthContext';
import { DashboardSwitch } from './DashboardSwitch';

interface TopBarProps {
  childName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ childName = 'Tiny Learner' }) => {
  const { muted, toggleMute } = useSound();
  const { user } = useAuth();
  const firstName = user.name?.split(' ')[0] || childName;

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 h-20 glass-strong z-40 px-4 lg:px-8"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <div className="h-full max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* ── Left: Avatar + Name ── */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <div className="relative">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-2xl shadow-lg shadow-blue-300/30"
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              🐣
            </motion.div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">✓</span>
            </div>
          </div>
          <div className="hidden sm:block">
            <h2 className="font-bold text-blue-900 text-sm leading-tight">{childName}</h2>
            <p className="text-[10px] text-blue-400 font-medium">Parent Dashboard</p>
          </div>
        </div>

        {/* ── Right: Sound · DashboardSwitch · Avatar ── */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Sound toggle */}
          <motion.button
            onClick={toggleMute}
            className="w-9 h-9 rounded-[14px] flex items-center justify-center transition-all border"
            style={{
              background: 'rgba(255,255,255,0.55)',
              borderColor: 'rgba(255,255,255,0.45)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            }}
            whileHover={{ scale: 1.08, background: 'rgba(255,255,255,0.8)' }}
            whileTap={{ scale: 0.92 }}
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          >
            <span className="text-base">{muted ? '🔇' : '🔊'}</span>
          </motion.button>

          {/* Dashboard Switch */}
          <DashboardSwitch />

          {/* Profile Avatar */}
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-sm cursor-pointer"
            style={{ boxShadow: '0 2px 10px rgba(59,130,246,0.2)' }}
          >
            <span className="text-xs font-black text-white">{firstName[0]}</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
