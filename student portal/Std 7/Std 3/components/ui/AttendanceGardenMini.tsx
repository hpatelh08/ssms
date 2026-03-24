import React from 'react';
import { motion } from 'framer-motion';
import { GardenAnimation } from './GardenAnimation';
import { StreakIndicator } from './StreakIndicator';

interface AttendanceGardenMiniProps {
  attendance: string[];
  streak: number;
  onViewFull: () => void;
}

export const AttendanceGardenMini: React.FC<AttendanceGardenMiniProps> = React.memo(({
  attendance,
  streak,
  onViewFull,
}) => {
  return (
    <motion.div
      className="card-premium p-6 lg:p-8 relative overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Background nature glow */}
      <motion.div
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-400/10 flex items-center justify-center"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.3))' }}>🌱</span>
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-blue-900">My Garden</h3>
            <p className="text-[10px] text-green-500 font-medium">{attendance.length} days of growth</p>
          </div>
        </div>
        <motion.button
          onClick={onViewFull}
          className="text-xs font-bold text-blue-400 hover:text-blue-600 bg-blue-50/50 px-3 py-1.5 rounded-xl transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View Full →
        </motion.button>
      </div>

      {/* Streak Banner */}
      <div className="mb-4 relative z-10">
        <StreakIndicator streak={streak} />
      </div>

      {/* Garden Week View */}
      <div className="relative z-10">
        <GardenAnimation attendance={attendance} streak={streak} />
      </div>
    </motion.div>
  );
});

AttendanceGardenMini.displayName = 'AttendanceGardenMini';
