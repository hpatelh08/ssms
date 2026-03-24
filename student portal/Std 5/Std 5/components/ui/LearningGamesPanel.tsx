import React from 'react';
import { motion } from 'framer-motion';
import { XP_REWARDS } from '../../utils/xpEngine';

interface LearningGamesPanelProps {
  onPlayGames: () => void;
}

const GAME_CARDS = [
  {
    id: 'math',
    icon: '➕',
    title: 'Math Puzzle',
    subtitle: 'Addition & Counting',
    gradient: 'from-purple-500 to-indigo-600',
    shadowColor: 'rgba(168,85,247,0.3)',
    hoverGradient: 'from-purple-400 to-indigo-500',
    iconGlow: 'rgba(168,85,247,0.5)',
  },
  {
    id: 'words',
    icon: '🔤',
    title: 'Word Builder',
    subtitle: 'Spelling & Letters',
    gradient: 'from-orange-500 to-amber-600',
    shadowColor: 'rgba(245,158,11,0.3)',
    hoverGradient: 'from-orange-400 to-amber-500',
    iconGlow: 'rgba(245,158,11,0.5)',
  },
  {
    id: 'shapes',
    icon: '🔷',
    title: 'Shape Quest',
    subtitle: 'Geometry Fun',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'rgba(6,182,212,0.3)',
    hoverGradient: 'from-cyan-400 to-blue-500',
    iconGlow: 'rgba(6,182,212,0.5)',
  },
  {
    id: 'numbers',
    icon: '🔢',
    title: 'Number Tap',
    subtitle: 'Counting Fun',
    gradient: 'from-indigo-500 to-violet-600',
    shadowColor: 'rgba(99,102,241,0.3)',
    hoverGradient: 'from-indigo-400 to-violet-500',
    iconGlow: 'rgba(99,102,241,0.5)',
  },
];

export const LearningGamesPanel: React.FC<LearningGamesPanelProps> = React.memo(({ onPlayGames }) => {
  return (
    <motion.div
      className="card-premium p-6 lg:p-8 relative overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      {/* Background glow */}
      <motion.div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: -4 }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <motion.div
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400/20 to-pink-400/10 flex items-center justify-center"
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.4))' }}>🎮</span>
        </motion.div>
        <div>
          <h3 className="text-xl font-bold text-blue-900">Learning Games</h3>
          <p className="text-xs text-blue-400 font-medium">Play, learn & earn XP!</p>
        </div>
      </div>

      {/* Game cards grid with 3D tilt */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        {GAME_CARDS.map((game, i) => (
          <motion.button
            key={game.id}
            onClick={onPlayGames}
            className={`card-game-3d bg-gradient-to-br ${game.gradient} rounded-2xl p-5 text-white text-center relative overflow-hidden group`}
            style={{
              boxShadow: `0 8px 24px ${game.shadowColor}`,
            }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            whileHover={{ y: -6, scale: 1.03, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.96 }}
          >
            {/* Gradient lighting overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${game.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />

            {/* Shine effect */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <motion.div
                className="absolute -top-[100%] -left-[100%] w-[200%] h-[200%] opacity-0 group-hover:opacity-10"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, white 50%, transparent 70%)',
                }}
                animate={{}}
              />
            </div>

            {/* Icon */}
            <motion.span
              className="text-4xl block mb-2 relative z-10"
              style={{ filter: `drop-shadow(0 0 10px ${game.iconGlow})` }}
              whileHover={{ rotate: [0, -12, 12, 0], transition: { duration: 0.5 } }}
            >
              {game.icon}
            </motion.span>

            <span className="font-bold text-sm block relative z-10">{game.title}</span>
            <span className="text-[10px] text-white/70 block mt-0.5 relative z-10">{game.subtitle}</span>
            <span className="text-[10px] text-white/50 font-bold block mt-1 relative z-10">
              +{XP_REWARDS.GAME_WIN} XP
            </span>
          </motion.button>
        ))}
      </div>

      {/* Play all CTA */}
      <motion.button
        onClick={onPlayGames}
        className="w-full mt-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-purple-700 font-bold py-3 rounded-2xl text-sm transition-colors border border-purple-200/20 relative z-10"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        🚀 Explore All Games
      </motion.button>
    </motion.div>
  );
});

LearningGamesPanel.displayName = 'LearningGamesPanel';
