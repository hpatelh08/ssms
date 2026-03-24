import React from 'react';
import { motion } from 'framer-motion';
import { Difficulty, DIFF_META } from '../engine/types';

interface Props {
  currentLevel: number;
  completedLevels: number[];
  totalLevels: number;
  difficulty: Difficulty;
}

export const MiniLevelTracker: React.FC<Props> = React.memo(({ currentLevel, completedLevels, totalLevels, difficulty }) => {
  const meta = DIFF_META[difficulty];
  const done = completedLevels.length;
  const pct = Math.min(100, Math.round((done / totalLevels) * 100));

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-1">
        <span>Level {currentLevel}/{totalLevels}</span>
        <span>{done}/{totalLevels} done</span>
      </div>
      <div className="h-2.5 bg-gray-200/70 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${meta.gradient} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>
    </div>
  );
});

MiniLevelTracker.displayName = 'MiniLevelTracker';
