import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../../types';

interface AnimatedBadgeProps {
  badge: Badge;
  index: number;
  isLocked?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { icon: 'text-2xl', card: 'p-2.5', name: 'text-[8px]' },
  md: { icon: 'text-3xl', card: 'p-3.5', name: 'text-[10px]' },
  lg: { icon: 'text-4xl', card: 'p-4', name: 'text-xs' },
};

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = React.memo(({
  badge,
  index,
  isLocked = false,
  size = 'md',
}) => {
  const s = sizeMap[size];

  if (isLocked) {
    return (
      <motion.div
        className={`group relative ${s.card} rounded-2xl flex flex-col items-center border border-gray-100/20 bg-gray-50/20 cursor-default`}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.45, scale: 1 }}
        transition={{ delay: index * 0.04, type: 'spring', stiffness: 200 }}
        whileHover={{ opacity: 0.65, scale: 1.05 }}
      >
        <span className={`${s.icon} mb-1 grayscale`}>🔒</span>
        <span className={`${s.name} font-bold text-gray-400 uppercase text-center leading-tight`}>
          {badge.name}
        </span>
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800/90 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-medium shadow-lg">
          {badge.description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800/90" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`group relative ${s.card} rounded-2xl flex flex-col items-center border border-amber-100/40 bg-gradient-to-br from-amber-50/70 to-orange-50/50 cursor-default overflow-hidden`}
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        delay: index * 0.06,
        type: 'spring',
        stiffness: 260,
        damping: 15,
      }}
      whileHover={{ y: -3, scale: 1.08, transition: { duration: 0.2 } }}
    >
      {/* Glow ring behind icon */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          boxShadow: '0 0 20px rgba(245,158,11,0.15), inset 0 0 20px rgba(245,158,11,0.05)',
        }}
        animate={{
          boxShadow: [
            '0 0 15px rgba(245,158,11,0.1), inset 0 0 15px rgba(245,158,11,0.03)',
            '0 0 25px rgba(245,158,11,0.25), inset 0 0 25px rgba(245,158,11,0.08)',
            '0 0 15px rgba(245,158,11,0.1), inset 0 0 15px rgba(245,158,11,0.03)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Icon with hover bounce */}
      <motion.span
        className={`${s.icon} mb-1 relative z-10 block`}
        style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.4))' }}
        whileHover={{
          rotate: [0, -15, 15, -10, 10, 0],
          transition: { duration: 0.6 },
        }}
      >
        {badge.icon}
      </motion.span>

      <span className={`${s.name} font-bold text-amber-800 uppercase text-center leading-tight relative z-10`}>
        {badge.name}
      </span>

      {/* Unlock date subtitle */}
      {badge.unlockedAt && (
        <span className="text-[7px] text-amber-500/60 font-medium mt-0.5 relative z-10">
          {new Date(badge.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-amber-800/90 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-medium shadow-lg">
        {badge.description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-amber-800/90" />
      </div>
    </motion.div>
  );
});

AnimatedBadge.displayName = 'AnimatedBadge';
