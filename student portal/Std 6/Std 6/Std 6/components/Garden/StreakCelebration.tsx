// StreakCelebration.tsx — Animated streak card with milestones, fire, and petal effects
// Milestones: 5 days → flower burst, 7 → tree grown, 14 → rainbow magic
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMilestoneReached, MILESTONE_INFO, generatePetalData, type GardenState } from './GardenEngine';

interface StreakCelebrationProps {
  state: GardenState;
}

// ─── Fire Animation ───────────────────────────────────────────
const FireIcon: React.FC<{ streak: number }> = React.memo(({ streak }) => {
  const size = streak >= 14 ? 'text-5xl' : streak >= 7 ? 'text-4xl' : 'text-3xl';
  return (
    <motion.div className="relative flex-shrink-0">
      <motion.span
        className={`${size} block`}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, -6, 6, 0],
          y: [0, -4, 0],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          filter: streak >= 7
            ? 'drop-shadow(0 0 14px rgba(239,68,68,0.6))'
            : 'drop-shadow(0 0 8px rgba(251,146,60,0.5))',
        }}
      >
        🔥
      </motion.span>

      {/* Fire sparks */}
      {streak >= 5 && (
        <>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: i === 0 ? '#FF6B35' : i === 1 ? '#FFD700' : '#FF4500',
                left: `${40 + i * 10}%`,
                top: '20%',
              }}
              animate={{
                y: [-5, -25],
                x: [(i - 1) * 5, (i - 1) * 12],
                opacity: [0.9, 0],
                scale: [1, 0.3],
              }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </>
      )}

      {/* Glow ring for legendary streaks */}
      {streak >= 14 && (
        <motion.div
          className="absolute inset-0 rounded-full -z-10"
          style={{
            background: 'radial-gradient(circle, rgba(239,68,68,0.2), transparent)',
            transform: 'scale(3)',
          }}
          animate={{ scale: [2.5, 3.5, 2.5], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
});
FireIcon.displayName = 'FireIcon';

// ─── Milestone Badge ──────────────────────────────────────────
const MilestoneBadge: React.FC<{ milestone: string; reached: boolean; emoji: string; label: string }> = React.memo(
  ({ reached, emoji, label }) => (
    <motion.div
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
        reached
          ? 'bg-gradient-to-b from-white/40 to-white/20 shadow-sm border border-white/30'
          : 'bg-white/10 border border-white/10 opacity-40'
      }`}
      whileHover={reached ? { scale: 1.1, y: -2 } : {}}
      animate={reached ? { y: [0, -2, 0] } : {}}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.span
        className="text-xl"
        animate={reached ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {emoji}
      </motion.span>
      <span className={`text-[9px] font-bold ${reached ? 'text-white' : 'text-white/40'}`}>
        {label}
      </span>
    </motion.div>
  )
);
MilestoneBadge.displayName = 'MilestoneBadge';

// ─── Falling Petals ───────────────────────────────────────────
const FallingPetals: React.FC<{ active: boolean }> = React.memo(({ active }) => {
  const petals = useMemo(() => generatePetalData(active ? 8 : 0), [active]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      <AnimatePresence>
        {petals.map(petal => (
          <motion.div
            key={petal.id}
            className="absolute w-2.5 h-2.5 rounded-full"
            style={{
              background: petal.color,
              left: `${petal.startX}%`,
              filter: `blur(0.5px)`,
            }}
            initial={{ y: '-5%', opacity: 0, rotate: 0, x: 0 }}
            animate={{
              y: '110%',
              opacity: [0, 0.7, 0.7, 0],
              rotate: petal.rotation,
              x: [0, (petal.id % 2 ? 1 : -1) * 30, (petal.id % 2 ? -1 : 1) * 15],
            }}
            transition={{
              duration: petal.duration,
              repeat: Infinity,
              delay: petal.delay,
              ease: 'easeIn',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});
FallingPetals.displayName = 'FallingPetals';

// ─── Stats Row ────────────────────────────────────────────────
const StatsRow: React.FC<{ state: GardenState }> = React.memo(({ state }) => (
  <div className="grid grid-cols-3 gap-3">
    {[
      { label: 'Present', value: state.totalPresent, emoji: '✅', color: 'text-green-100' },
      { label: 'Rate', value: `${state.attendanceRate}%`, emoji: '📊', color: 'text-blue-100' },
      { label: 'Best', value: state.longestStreak, emoji: '🏆', color: 'text-amber-100' },
    ].map((stat, i) => (
      <motion.div
        key={stat.label}
        className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center border border-white/10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 + i * 0.1 }}
        whileHover={{ scale: 1.05 }}
      >
        <span className="text-sm block mb-0.5">{stat.emoji}</span>
        <span className={`text-lg font-black text-white block`}>{stat.value}</span>
        <span className="text-[9px] font-semibold text-white/60 uppercase">{stat.label}</span>
      </motion.div>
    ))}
  </div>
));
StatsRow.displayName = 'StatsRow';

// ─── Main StreakCelebration ───────────────────────────────────
export const StreakCelebration: React.FC<StreakCelebrationProps> = React.memo(({ state }) => {
  const { currentStreak, milestoneReached } = state;
  const milestoneInfo = MILESTONE_INFO[milestoneReached];

  const streakMessage = currentStreak >= 14
    ? 'LEGENDARY streak! You are unstoppable!'
    : currentStreak >= 7
    ? 'Amazing! Your garden is a forest now!'
    : currentStreak >= 5
    ? 'Beautiful flowers are blooming!'
    : currentStreak >= 3
    ? 'Growing nicely! Keep it up!'
    : currentStreak >= 1
    ? 'Great start! Come back tomorrow!'
    : 'Start your streak today!';

  return (
    <motion.div
      className={`relative bg-gradient-to-br ${milestoneInfo.color} rounded-2xl p-5 overflow-hidden shadow-xl`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring' }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Petals falling for milestone */}
      <FallingPetals active={milestoneReached !== 'none'} />

      {/* Top row: fire + streak number + message */}
      <div className="relative z-10 flex items-center gap-4 mb-4">
        <FireIcon streak={currentStreak} />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={currentStreak}
                className="text-4xl font-black text-white"
                initial={{ y: 20, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              >
                {currentStreak}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm font-bold text-white/80">day streak</span>
          </div>
          <p className="text-xs font-semibold text-white/70 mt-0.5">{streakMessage}</p>
        </div>

        {/* Milestone emoji */}
        <motion.span
          className="text-3xl"
          animate={{ y: [0, -6, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }}
        >
          {milestoneInfo.emoji}
        </motion.span>
      </div>

      {/* Milestone badges */}
      <div className="relative z-10 flex items-center justify-center gap-2 mb-4">
        <MilestoneBadge milestone="flower" reached={currentStreak >= 5} emoji="🌸" label="5 Days" />
        <MilestoneBadge milestone="tree" reached={currentStreak >= 7} emoji="🌳" label="7 Days" />
        <MilestoneBadge milestone="rainbow" reached={currentStreak >= 14} emoji="🌈" label="14 Days" />
      </div>

      {/* Stats */}
      <div className="relative z-10">
        <StatsRow state={state} />
      </div>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['-100% 0%', '200% 0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
      />
    </motion.div>
  );
});

StreakCelebration.displayName = 'StreakCelebration';
