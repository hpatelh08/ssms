import React from 'react';
import { motion } from 'framer-motion';

type LoadingPhase = 'searching' | 'sources-found' | 'generating';

interface LoadingSkeletonProps {
  lines?: number;
  phase?: LoadingPhase;
  sourcesCount?: number;
}

const PHASE_CONFIG: Record<LoadingPhase, { icon: string; text: string; color: string }> = {
  searching: { icon: '🔍', text: 'Searching textbooks...', color: 'from-blue-400 to-cyan-400' },
  'sources-found': { icon: '📚', text: 'Found relevant sources', color: 'from-green-400 to-emerald-400' },
  generating: { icon: '✍️', text: 'Writing answer...', color: 'from-purple-400 to-pink-400' },
};

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 4,
  phase = 'searching',
  sourcesCount = 0,
}) => {
  const cfg = PHASE_CONFIG[phase];

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-blue-100/30 p-5 space-y-3">
      {/* Phase indicator */}
      <div className="flex items-center gap-3 mb-2">
        <motion.div
          className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${cfg.color} flex items-center justify-center shadow-lg`}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <span className="text-lg">{cfg.icon}</span>
        </motion.div>
        <div>
          <p className="text-xs font-bold text-gray-700">{cfg.text}</p>
          {phase === 'sources-found' && sourcesCount > 0 && (
            <p className="text-[9px] text-green-500 font-medium">{sourcesCount} source{sourcesCount !== 1 ? 's' : ''} matched</p>
          )}
        </div>
        {/* Typing dots */}
        <div className="ml-auto flex gap-0.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-400"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>

      {/* Shimmer lines */}
      {Array.from({ length: lines }, (_, i) => (
        <motion.div
          key={i}
          className="h-3 rounded-lg overflow-hidden"
          style={{ width: `${90 - i * 10}%` }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-100/20 via-blue-200/50 to-blue-100/20 rounded-lg"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.12, ease: 'linear' }}
            style={{ width: '50%' }}
          />
        </motion.div>
      ))}

      {/* Bottom tags skeleton */}
      <div className="flex gap-2 mt-3">
        <div className="h-5 w-16 bg-blue-100/30 rounded-full" />
        <div className="h-5 w-12 bg-blue-100/30 rounded-full" />
      </div>
    </div>
  );
};
