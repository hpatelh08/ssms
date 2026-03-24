import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../../types';
import { AnimatedBadge } from './AnimatedBadge';
import { ALL_BADGES } from '../../utils/badgeEngine';

interface BadgesPanelProps {
  earnedBadges: Badge[];
}

export const BadgesPanel: React.FC<BadgesPanelProps> = React.memo(({ earnedBadges }) => {
  const lockedBadges = ALL_BADGES.filter(b => !earnedBadges.find(eb => eb.id === b.id));
  const totalBadges = ALL_BADGES.length;

  return (
    <motion.div
      className="card-premium p-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-400/10 flex items-center justify-center"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xl" style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.4))' }}>🎖️</span>
          </motion.div>
          <div>
            <h3 className="font-bold text-blue-900 text-base">My Badges</h3>
            <p className="text-[10px] text-blue-400 font-medium">
              {earnedBadges.length}/{totalBadges} collected
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalBadges }, (_, i) => (
            <motion.div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i < earnedBadges.length
                  ? 'bg-amber-400 shadow-sm shadow-amber-400/30'
                  : 'bg-gray-200/50'
              }`}
              initial={i < earnedBadges.length ? { scale: 0 } : {}}
              animate={i < earnedBadges.length ? { scale: 1 } : {}}
              transition={{ delay: i * 0.05, type: 'spring' }}
            />
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {earnedBadges.map((badge, i) => (
          <AnimatedBadge key={badge.id} badge={badge} index={i} size="md" />
        ))}
        {lockedBadges.slice(0, Math.max(0, 4 - earnedBadges.length)).map((badge, i) => (
          <AnimatedBadge
            key={badge.id}
            badge={badge}
            index={earnedBadges.length + i}
            isLocked
            size="md"
          />
        ))}
      </div>

      {/* Encouragement message */}
      {lockedBadges.length > 0 && (
        <motion.p
          className="text-[10px] text-center text-blue-400/60 font-medium mt-3 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Keep learning to unlock {lockedBadges.length} more {lockedBadges.length === 1 ? 'badge' : 'badges'}!
        </motion.p>
      )}
    </motion.div>
  );
});

BadgesPanel.displayName = 'BadgesPanel';
