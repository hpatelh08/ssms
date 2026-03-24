/**
 * MiniLevelTracker – 5-dot progress indicator with active pulse
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Difficulty, DIFF_META } from '../engine/types';

interface Props {
  currentLevel: number;       // 1-5
  completedLevels: number[];  // e.g. [1, 2]
  difficulty: Difficulty;
}

export const MiniLevelTracker: React.FC<Props> = React.memo(({ currentLevel, completedLevels, difficulty }) => {
  const meta = DIFF_META[difficulty];

  return (
    <div className="flex items-center gap-1.5 w-full max-w-xs mx-auto">
      {[1, 2, 3, 4, 5].map(n => {
        const isDone = completedLevels.includes(n);
        const isCurrent = n === currentLevel;
        const isFuture = n > currentLevel && !isDone;

        return (
          <React.Fragment key={n}>
            <motion.div
              className={`relative flex items-center justify-center rounded-full font-bold text-[10px] transition-all duration-300
                ${isDone
                  ? 'w-7 h-7 bg-green-400 text-white shadow-md'
                  : isCurrent
                  ? `w-8 h-8 bg-gradient-to-br ${meta.gradient} text-white shadow-lg`
                  : 'w-7 h-7 bg-gray-200/60 text-gray-400'}`}
              animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
              transition={isCurrent ? { duration: 1.5, repeat: Infinity } : {}}
            >
              {isDone ? '✓' : n}
              {isCurrent && (
                <motion.div
                  className={`absolute inset-0 rounded-full border-2 ${meta.ring}`}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Connector line */}
            {n < 5 && (
              <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                isDone ? 'bg-green-300' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

MiniLevelTracker.displayName = 'MiniLevelTracker';
