/**
 * parent/components/attendance/WeeklyPresenceTimeline.tsx
 * ─────────────────────────────────────────────────────
 * Horizontal glowing day capsules (Mon→Sun).
 *
 * Each day is a large rounded pill showing:
 *  • Day label
 *  • Present = glowing green halo
 *  • Absent = soft faded pastel
 *  • Today = elevated scale + ring
 *  • Small stats underneath (time, games)
 *
 * Consumes useAttendance() — must be inside AttendanceProvider.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useAttendance } from '../../../context/AttendanceContext';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

/* ── Single Day Capsule ────────────────────────────── */

const DayCapsule: React.FC<{
  day: string;
  date: string;
  present: boolean;
  isToday: boolean;
  isFuture: boolean;
  games: number;
  timeSpent: number;
  totalActivities: number;
  index: number;
}> = ({ day, present, isToday, isFuture, games, timeSpent, totalActivities, index }) => {
  const bg = isFuture
    ? 'bg-white/30'
    : present
      ? 'bg-gradient-to-br from-green-200 to-emerald-400'
      : 'bg-white/40';

  const shadow = present && !isFuture
    ? '0 4px 20px rgba(34,197,94,0.3), 0 0 12px rgba(34,197,94,0.15)'
    : '0 2px 10px rgba(0,0,0,0.04)';

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring, delay: 0.06 + index * 0.05 }}
    >
      {/* Day label */}
      <span className="text-[10px] font-bold text-gray-400 select-none uppercase tracking-wider">
        {day}
      </span>

      {/* Main capsule */}
      <motion.div
        className={[
          'w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center',
          'transition-all duration-300 cursor-default select-none relative',
          bg,
          isToday ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-transparent' : '',
        ].join(' ')}
        style={{
          boxShadow: shadow,
          border: isFuture ? '1px dashed rgba(200,200,220,0.4)' : '1px solid rgba(255,255,255,0.5)',
        }}
        whileHover={!isFuture ? { scale: 1.1, y: -4 } : {}}
      >
        {isFuture ? (
          <span className="text-gray-300 text-lg">·</span>
        ) : present ? (
          <>
            <motion.span
              className="text-xl"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
            >
              ✓
            </motion.span>
            <span className="text-[9px] font-bold text-white/90 mt-0.5">
              {totalActivities > 0 ? `${totalActivities} acts` : 'Active'}
            </span>
          </>
        ) : (
          <>
            <span className="text-lg text-gray-300">✗</span>
            <span className="text-[9px] font-medium text-gray-300 mt-0.5">Rest</span>
          </>
        )}

        {/* Today badge */}
        {isToday && (
          <motion.div
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center"
            style={{ boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-[8px] text-white font-black">Now</span>
          </motion.div>
        )}
      </motion.div>

      {/* Stats below capsule */}
      {!isFuture && present && (
        <div className="flex flex-col items-center gap-0.5">
          {timeSpent > 0 && (
            <span className="text-[9px] font-semibold text-gray-400">
              ⏱ {timeSpent}m
            </span>
          )}
          {games > 0 && (
            <span className="text-[9px] font-semibold text-gray-400">
              🎮 {games}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

/* ── Main Export ────────────────────────────────────── */

export const WeeklyPresenceTimeline: React.FC = () => {
  const { weekBubbles, days } = useAttendance();
  const todayIso = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">📅</span>
        <h2 className="text-sm font-black text-gray-700">This Week</h2>
      </div>

      {/* Capsule row */}
      <div className="flex items-start justify-between gap-2 overflow-x-auto pb-2">
        {weekBubbles.map((b, i) => {
          const dayData = days[i];
          const isToday = b.date === todayIso;
          const isFuture = b.date > todayIso;
          const totalActivities = dayData
            ? dayData.games + dayData.spaceWar + dayData.ncertUsage + dayData.gardenActions
            : 0;

          return (
            <DayCapsule
              key={b.day}
              day={b.day}
              date={b.date}
              present={b.present}
              isToday={isToday}
              isFuture={isFuture}
              games={dayData?.games ?? 0}
              timeSpent={dayData?.timeSpent ?? 0}
              totalActivities={totalActivities}
              index={i}
            />
          );
        })}
      </div>
    </div>
  );
};
