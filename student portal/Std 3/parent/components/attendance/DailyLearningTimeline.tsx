/**
 * parent/components/attendance/DailyLearningTimeline.tsx
 * ─────────────────────────────────────────────────────
 * Vertical timeline of daily learning activity.
 *
 * Each day renders as a timeline node with:
 *  • Date badge on the left
 *  • Activity stats (games, space war, AI buddy, time)
 *  • Soft pastel card background
 *  • If absent: encouraging lavender message
 *
 * Consumes useAttendance() — must be inside AttendanceProvider.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAttendance, type DayAttendance } from '../../../context/AttendanceContext';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

/* ── Activity stat items ───────────────────────────── */

interface StatItem {
  icon: string;
  label: string;
  value: number;
  color: string;
}

function getStats(day: DayAttendance): StatItem[] {
  return [
    { icon: '🎮', label: 'Games Played', value: day.games, color: 'text-indigo-500' },
    { icon: '🚀', label: 'Space War', value: day.spaceWar, color: 'text-red-500' },
    { icon: '🤖', label: 'AI Buddy Sessions', value: day.ncertUsage, color: 'text-blue-500' },
  ];
}

/* ── Single Timeline Day Node ──────────────────────── */

const DayNode: React.FC<{
  day: DayAttendance;
  isToday: boolean;
  isExpanded: boolean;
  toggle: () => void;
  index: number;
}> = ({ day, isToday, isExpanded, toggle, index }) => {
  const dateObj = new Date(day.dateKey + 'T00:00:00');
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNum = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const stats = getStats(day);
  const totalActs = day.games + day.spaceWar + day.ncertUsage;

  return (
    <motion.div
      className="flex gap-4 relative"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring, delay: 0.1 + index * 0.05 }}
    >
      {/* ── Timeline line ── */}
      <div className="flex flex-col items-center">
        {/* Date badge */}
        <motion.div
          className={[
            'w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 relative z-10',
            isToday
              ? 'bg-gradient-to-br from-indigo-400 to-purple-500'
              : day.present
                ? 'bg-gradient-to-br from-emerald-200 to-green-300'
                : 'bg-white/60',
          ].join(' ')}
          style={{
            border: isToday ? 'none' : '1px solid rgba(255,255,255,0.5)',
            boxShadow: isToday
              ? '0 4px 16px rgba(99,102,241,0.3)'
              : day.present
                ? '0 3px 12px rgba(34,197,94,0.15)'
                : '0 2px 8px rgba(0,0,0,0.04)',
          }}
          whileHover={{ scale: 1.06 }}
        >
          <span className={`text-[10px] font-bold ${isToday ? 'text-white/80' : day.present ? 'text-emerald-700' : 'text-gray-400'}`}>
            {weekday}
          </span>
          <span className={`text-[15px] font-black leading-tight ${isToday ? 'text-white' : day.present ? 'text-emerald-800' : 'text-gray-500'}`}>
            {dateNum}
          </span>
          <span className={`text-[8px] font-bold ${isToday ? 'text-white/70' : day.present ? 'text-emerald-600' : 'text-gray-300'}`}>
            {month}
          </span>
        </motion.div>

        {/* Connecting line */}
        <div
          className="w-px flex-1 min-h-[16px]"
          style={{ background: 'linear-gradient(180deg, rgba(199,210,254,0.5) 0%, transparent 100%)' }}
        />
      </div>

      {/* ── Content card ── */}
      <div className="flex-1 pb-4">
        <motion.button
          className="w-full text-left rounded-2xl p-4 transition-all duration-200"
          style={{
            background: day.present
              ? 'rgba(255,255,255,0.55)'
              : 'linear-gradient(135deg, rgba(237,233,254,0.5), rgba(252,231,243,0.4))',
            border: '1px solid rgba(255,255,255,0.45)',
            boxShadow: '0 3px 16px rgba(0,0,0,0.03)',
          }}
          onClick={toggle}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {isToday && (
                <span className="text-[10px] font-black text-indigo-500 bg-indigo-100/60 px-2 py-0.5 rounded-full">
                  📌 Today
                </span>
              )}
              {day.present ? (
                <span className="text-[11px] font-bold text-gray-500">
                  {totalActs} activities · ~{day.timeSpent} min
                </span>
              ) : (
                <span className="text-[11px] font-bold text-gray-400">
                  No activity
                </span>
              )}
            </div>
            <motion.span
              className="text-gray-300 text-xs"
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▾
            </motion.span>
          </div>

          {/* Collapsed preview — show icons */}
          {!isExpanded && day.present && (
            <div className="flex items-center gap-3 mt-1.5">
              {stats.filter(s => s.value > 0).map(s => (
                <span key={s.label} className="text-[10px] font-semibold text-gray-400">
                  {s.icon} {s.value}
                </span>
              ))}
            </div>
          )}

          {/* Absent message */}
          {!day.present && !isExpanded && (
            <p className="text-[11px] text-purple-300 font-medium mt-1">
              Tomorrow is a new chance 🌈
            </p>
          )}
        </motion.button>

        {/* Expanded detail */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-2xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.45)',
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
              >
                {day.present ? (
                  <div className="space-y-2.5">
                    {stats.map(s => (
                      <div key={s.label} className="flex items-center gap-3">
                        <span className="text-base w-6 text-center">{s.icon}</span>
                        <span className="text-[12px] text-gray-600 font-medium flex-1">{s.label}</span>
                        <span className={`text-[13px] font-black ${s.color}`}>{s.value}</span>
                      </div>
                    ))}
                    {/* Time row */}
                    <div className="flex items-center gap-3 pt-1 border-t border-white/30">
                      <span className="text-base w-6 text-center">⏱</span>
                      <span className="text-[12px] text-gray-600 font-medium flex-1">Time Spent</span>
                      <span className="text-[13px] font-black text-gray-600">~{day.timeSpent} min</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <span className="text-2xl block mb-1.5">🌈</span>
                    <p className="text-[12px] text-gray-400 font-medium">
                      No learning recorded this day.
                    </p>
                    <p className="text-[11px] text-purple-300 font-medium mt-1">
                      Every journey has rest days — tomorrow is a fresh start!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/* ── Main Export ────────────────────────────────────── */

export const DailyLearningTimeline: React.FC = () => {
  const { days } = useAttendance();
  const todayIso = new Date().toISOString().split('T')[0];
  const [expandedDate, setExpandedDate] = useState<string | null>(todayIso);

  // Show days in reverse (most recent first), skip future
  const visibleDays = [...days]
    .filter(d => d.dateKey <= todayIso)
    .reverse();

  return (
    <div className="space-y-3">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">🧠</span>
        <h2 className="text-sm font-black text-gray-700">Daily Learning Activity</h2>
      </div>

      {visibleDays.length > 0 ? (
        <div className="flex flex-col">
          {visibleDays.map((day, i) => (
            <DayNode
              key={day.dateKey}
              day={day}
              isToday={day.dateKey === todayIso}
              isExpanded={expandedDate === day.dateKey}
              toggle={() =>
                setExpandedDate(prev => prev === day.dateKey ? null : day.dateKey)
              }
              index={i}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <span className="text-3xl block mb-2">🌈</span>
          <p className="text-sm text-gray-400 font-medium">
            Activities will appear here once exploration begins!
          </p>
        </div>
      )}
    </div>
  );
};
