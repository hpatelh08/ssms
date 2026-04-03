/**
 * 📊 Game Insights Panel (Parent View)
 * ────────────────────────────────────────────
 * Read-only summary of game activity and XP earned.
 * No playable games — parents see metrics only.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { GAME_CONFIGS } from '../../games/types';
import type { UserStats } from '../../types';

interface GameInsightsPanelProps {
  stats: UserStats;
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const GameInsightsPanel: React.FC<GameInsightsPanelProps> = React.memo(({ stats }) => {
  const totalGames = GAME_CONFIGS.length;

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="text-2xl font-black text-blue-900 flex items-center gap-3">
          <span className="text-3xl">📊</span> Game Insights
        </h2>
        <p className="text-blue-400 text-sm mt-1">
          Overview of your child's game activity and progress.
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard icon="🎮" label="Games Available" value={totalGames} gradient="from-purple-400 to-pink-400" />
        <MetricCard icon="⭐" label="Total XP" value={stats.xp} gradient="from-amber-400 to-yellow-400" />
        <MetricCard icon="🏆" label="Level" value={stats.level} gradient="from-blue-400 to-cyan-400" />
        <MetricCard icon="🎖️" label="Badges" value={stats.badges.length} gradient="from-green-400 to-emerald-400" />
      </motion.div>

      {/* Game Catalog (read-only) */}
      <motion.div variants={item}>
        <h3 className="text-lg font-bold text-blue-900 mb-4">Available Games</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GAME_CONFIGS.map(game => (
            <motion.div
              key={game.id}
              variants={item}
              className="bg-white/60 backdrop-blur-md border border-white/30 rounded-2xl p-4 relative overflow-hidden"
            >
              <div
                className={`absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br ${game.gradient} opacity-15 blur-xl pointer-events-none`}
              />
              <div className="text-3xl mb-2">{game.icon}</div>
              <p className="font-bold text-blue-900 text-sm">{game.title}</p>
              <p className="text-blue-400 text-xs mt-0.5">{game.desc}</p>
              <span
                className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${game.gradient} text-white`}
              >
                {game.tag}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        variants={item}
        className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100/40 rounded-2xl p-5 flex items-start gap-4"
      >
        <span className="text-2xl">💡</span>
        <div>
          <p className="font-bold text-purple-900 text-sm">Games are played in Student Mode</p>
          <p className="text-purple-500 text-xs mt-1">
            Switch to the student view to play learning games. XP earned there
            will automatically appear in your dashboard.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
});

GameInsightsPanel.displayName = 'GameInsightsPanel';

/* ── Metric Card ──────────────────────────────── */

const MetricCard: React.FC<{
  icon: string;
  label: string;
  value: number;
  gradient: string;
}> = React.memo(({ icon, label, value, gradient }) => (
  <motion.div
    className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-center relative overflow-hidden"
    whileHover={{ scale: 1.03 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <div
      className={`absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-lg pointer-events-none`}
    />
    <span className="text-2xl">{icon}</span>
    <p className="text-2xl font-black text-blue-900 mt-1">{value}</p>
    <p className="text-[11px] text-blue-400 font-semibold mt-0.5">{label}</p>
  </motion.div>
));

MetricCard.displayName = 'MetricCard';
