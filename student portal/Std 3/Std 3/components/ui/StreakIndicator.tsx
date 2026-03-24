import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StreakIndicatorProps {
  streak: number;
  compact?: boolean;
}

const STREAK_TIERS = [
  { min: 0, label: 'Start a streak!', color: 'text-gray-400', bg: 'from-gray-100 to-gray-50', flame: '🔥' },
  { min: 1, label: 'Warming up!', color: 'text-orange-500', bg: 'from-orange-100/80 to-amber-50/60', flame: '🔥' },
  { min: 3, label: 'On fire!', color: 'text-orange-600', bg: 'from-orange-200/80 to-amber-100/60', flame: '🔥' },
  { min: 7, label: 'BLAZING!', color: 'text-red-600', bg: 'from-red-200/80 to-orange-100/60', flame: '🔥' },
  { min: 14, label: 'LEGENDARY!', color: 'text-red-700', bg: 'from-red-300/80 to-orange-200/60', flame: '🔥' },
];

function getStreakTier(streak: number) {
  return [...STREAK_TIERS].reverse().find(t => streak >= t.min) || STREAK_TIERS[0];
}

export const StreakIndicator: React.FC<StreakIndicatorProps> = React.memo(({ streak, compact = false }) => {
  const tier = getStreakTier(streak);

  if (compact) {
    return (
      <motion.div
        className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${tier.bg} backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-orange-200/30`}
        whileHover={{ scale: 1.06 }}
      >
        <motion.span
          className="text-lg"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -8, 8, 0],
          }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
        >
          {tier.flame}
        </motion.span>
        <span className={`font-black text-sm ${tier.color}`}>{streak}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`relative bg-gradient-to-r ${tier.bg} rounded-3xl p-5 overflow-hidden border border-orange-200/30`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Background flame glow */}
      {streak >= 3 && (
        <motion.div
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-400/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative z-10 flex items-center gap-4">
        {/* Animated flame */}
        <motion.div
          className="relative flex-shrink-0"
          animate={{
            y: [0, -4, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.span
            className="text-4xl block"
            style={{ filter: streak >= 3 ? 'drop-shadow(0 0 12px rgba(239,68,68,0.5))' : 'none' }}
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, -5, 5, 0],
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            {tier.flame}
          </motion.span>
          {/* Flame particles */}
          {streak >= 5 && (
            <>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full"
                  style={{ left: 12 + i * 6, top: 4 }}
                  animate={{
                    y: [-5, -20],
                    x: [(i - 1) * 3, (i - 1) * 8],
                    opacity: [0.8, 0],
                    scale: [1, 0.3],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.25,
                  }}
                />
              ))}
            </>
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={streak}
                className={`text-3xl font-black ${tier.color}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {streak}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm font-bold text-orange-800/60">day streak</span>
          </div>
          <p className={`text-xs font-semibold ${tier.color} opacity-70 mt-0.5`}>
            {tier.label}
          </p>
        </div>

        {/* Streak milestone dots */}
        <div className="flex gap-1">
          {[1, 3, 7, 14].map(milestone => (
            <motion.div
              key={milestone}
              className={`w-2.5 h-2.5 rounded-full ${
                streak >= milestone
                  ? 'bg-gradient-to-br from-orange-400 to-red-400 shadow-sm shadow-orange-400/30'
                  : 'bg-gray-200/50'
              }`}
              initial={streak >= milestone ? { scale: 0 } : {}}
              animate={streak >= milestone ? { scale: 1 } : {}}
              transition={{ type: 'spring', delay: milestone * 0.05 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
});

StreakIndicator.displayName = 'StreakIndicator';
