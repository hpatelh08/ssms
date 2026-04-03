import React from 'react';
import { motion } from 'framer-motion';
import { xpProgress, xpToNextLevel, xpInCurrentLevel } from '../../utils/xpEngine';

interface XPProgressBarProps {
  xp: number;
  level: number;
  compact?: boolean;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({ xp, level, compact = false }) => {
  const progress = xpProgress(xp);
  const remaining = xpToNextLevel(xp);
  const current = xpInCurrentLevel(xp);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 xp-shimmer rounded-full" />
          </motion.div>
        </div>
        <span className="text-[10px] font-bold text-white/80">{current}/{100}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-blue-900">Level {level}</span>
        <span className="text-xs font-medium text-blue-400">{remaining} XP to next level</span>
      </div>
      <div className="w-full h-4 bg-blue-100/50 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="absolute inset-0 xp-shimmer rounded-full" />
        </motion.div>
      </div>
    </div>
  );
};
