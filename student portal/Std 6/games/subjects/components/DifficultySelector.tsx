/**
 * DifficultySelector â€“ 3-button row with progress indicators
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Difficulty, DIFFICULTIES, DIFF_META, DifficultyProgress, LEVEL_COUNTS, MiniLevelProgress } from '../engine/types';

interface Props {
  onSelect: (d: Difficulty) => void;
  progress: Record<Difficulty, DifficultyProgress>;
}

export const DifficultySelector: React.FC<Props> = React.memo(({ onSelect, progress }) => (
  <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
    <h3 className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">
      Choose Difficulty
    </h3>
    <p className="text-center text-[11px] font-semibold text-gray-400 -mt-1 mb-1">
      Endless questions with mastery targets of 40/30/30 levels
    </p>
    {DIFFICULTIES.map((d, i) => {
      const meta = DIFF_META[d];
      const dp = progress[d];
      const completed = dp?.completed;
      const miniDone = dp ? (Object.values(dp.miniLevels) as MiniLevelProgress[]).filter(m => m.completed).length : 0;
      const totalLevels = LEVEL_COUNTS[d];
      const progressPct = Math.min(100, Math.round((miniDone / totalLevels) * 100));

      return (
        <motion.button
          key={d}
          onClick={() => onSelect(d)}
          className={`relative w-full px-5 py-4 rounded-3xl border-2 text-left transition-all
            ${completed
              ? 'border-green-300 bg-green-50/60'
              : 'border-gray-200/60 bg-white/70 hover:border-gray-300'}
            backdrop-blur-xl overflow-hidden group`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Background gradient on hover */}
          <div className={`absolute inset-0 bg-gradient-to-r ${meta.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl`} />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{meta.emoji}</span>
              <div>
                <p className="font-bold text-gray-800 text-base">{meta.label}</p>
                <p className="text-[11px] text-gray-400 font-medium">
                  {completed ? 'Mastery target cleared!' : miniDone > 0 ? `${miniDone}/${totalLevels} mastery levels done` : `${totalLevels} level target`}
                </p>
              </div>
            </div>

            <div className="w-24">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${meta.gradient} rounded-full`} style={{ width: `${progressPct}%` }} />
              </div>
              <p className="text-[9px] text-right text-gray-400 mt-1">{progressPct}%</p>
            </div>
          </div>

          {/* Completed badge */}
          {completed && (
            <motion.div
              className="absolute top-1.5 right-2 text-[10px] font-black bg-green-400 text-white px-2 py-0.5 rounded-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              âœ“ DONE
            </motion.div>
          )}
        </motion.button>
      );
    })}
  </div>
));

DifficultySelector.displayName = 'DifficultySelector';

