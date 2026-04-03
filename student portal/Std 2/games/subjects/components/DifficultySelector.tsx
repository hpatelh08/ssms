/**
 * DifficultySelector – 3-button row with progress indicators
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Difficulty, DIFFICULTIES, DIFF_META, DifficultyProgress, MiniLevelProgress } from '../engine/types';

interface Props {
  onSelect: (d: Difficulty) => void;
  progress: Record<Difficulty, DifficultyProgress>;
}

export const DifficultySelector: React.FC<Props> = React.memo(({ onSelect, progress }) => (
  <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
    <h3 className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">
      Choose Difficulty
    </h3>
    {DIFFICULTIES.map((d, i) => {
      const meta = DIFF_META[d];
      const dp = progress[d];
      const completed = dp?.completed;
      const miniDone = dp ? (Object.values(dp.miniLevels) as MiniLevelProgress[]).filter(m => m.completed).length : 0;

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
                  {completed ? '✅ Completed!' : miniDone > 0 ? `${miniDone}/5 levels done` : '5 levels • 25 questions'}
                </p>
              </div>
            </div>

            {/* Mini-level dots */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <div
                  key={n}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    dp?.miniLevels[n]?.completed
                      ? 'bg-green-400'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Completed badge */}
          {completed && (
            <motion.div
              className="absolute top-1.5 right-2 text-[10px] font-black bg-green-400 text-white px-2 py-0.5 rounded-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              ✓ DONE
            </motion.div>
          )}
        </motion.button>
      );
    })}
  </div>
));

DifficultySelector.displayName = 'DifficultySelector';
