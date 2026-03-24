/**
 * parent/components/AttendanceSection.tsx
 * ─────────────────────────────────────────────────────
 * 🎒 Learning Attendance — single unified section that
 * merges attendance + activity into one magical card.
 *
 * Sub-sections:
 *  1. WeeklyBubbles — Mon-Sun presence circles
 *  2. AttendanceSummary — 3 pastel mini-cards (rate, streak, monthly)
 *  3. ActivitySubSection — daily learning activity per tracked day
 *
 * Self-contained: wraps itself in <AttendanceProvider>
 * so OverviewPage doesn't need to know about the provider.
 *
 * Design: rounded-3xl, pastel gradients, framer-motion springs.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AttendanceProvider,
  useAttendance,
  type DayAttendance,
} from '../../context/AttendanceContext';

/* ── Constants ──────────────────────────────────── */

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

/* ═══════════════════════════════════════════════════
   1. WEEKLY BUBBLES
   ═══════════════════════════════════════════════════ */

const WeeklyBubbles: React.FC = () => {
  const { weekBubbles, days } = useAttendance();
  const todayIso = new Date().toISOString().split('T')[0];
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2">
        {weekBubbles.map((b, i) => {
          const isToday = b.date === todayIso;
          const isFuture = b.date > todayIso;
          const dayData = days[i];

          return (
            <motion.div
              key={b.day}
              className="flex flex-col items-center gap-1.5 relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: 0.06 + i * 0.04 }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span className="text-[10px] font-bold text-gray-400 select-none">
                {b.day}
              </span>

              <motion.div
                className={[
                  'w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold',
                  'transition-all duration-300 cursor-default select-none',
                  isFuture
                    ? 'bg-gray-100/60 text-gray-300'
                    : b.present
                      ? 'bg-green-300 text-white'
                      : 'bg-red-300 text-white/80',
                  isToday ? 'ring-2 ring-indigo-400 ring-offset-2' : '',
                ].join(' ')}
                style={
                  b.present && !isFuture
                    ? { boxShadow: '0 3px 12px rgba(34,197,94,0.3)' }
                    : {}
                }
                whileHover={{ y: -4, scale: 1.08 }}
              >
                {isFuture ? '·' : b.present ? '✓' : '✗'}
              </motion.div>

              {/* Hover tooltip with quick stats */}
              <AnimatePresence>
                {hoveredIdx === i && !isFuture && (
                  <motion.div
                    className="absolute top-[68px] z-20 w-36 rounded-xl p-2.5 text-[10px] space-y-0.5 pointer-events-none"
                    style={{
                      background: 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.6)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <p className="font-black text-gray-700 text-[11px] mb-1">{b.date}</p>
                    {dayData?.present ? (
                      <>
                        <p className="text-gray-500">🎮 {dayData.games} games</p>
                        <p className="text-gray-500">🎨 {dayData.colorMagic} color magic</p>
                        <p className="text-gray-500">🤖 {dayData.ncertUsage} AI uses</p>
                        <p className="text-gray-500">🌳 {dayData.gardenActions} garden</p>
                        <p className="text-gray-500">⏱ ~{dayData.timeSpent} min</p>
                      </>
                    ) : (
                      <p className="text-red-400 font-semibold">No activity recorded</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   2. ATTENDANCE SUMMARY CARDS
   ═══════════════════════════════════════════════════ */

const summaryCards = [
  { key: 'rate', icon: '📊', label: 'Attendance Rate', suffix: '%' },
  { key: 'streak', icon: '🔥', label: 'Current Streak', suffix: ' days' },
  { key: 'monthly', icon: '📅', label: 'Monthly Present', suffix: ' days' },
] as const;

const cardStyles: Record<string, { bg: string; text: string }> = {
  rate:    { bg: 'bg-emerald-50/60', text: 'text-emerald-600' },
  streak:  { bg: 'bg-amber-50/60',   text: 'text-amber-600' },
  monthly: { bg: 'bg-blue-50/60',    text: 'text-blue-600' },
};

const AttendanceSummary: React.FC = () => {
  const { rate, streak, monthlyDays } = useAttendance();

  const values: Record<string, number> = {
    rate,
    streak,
    monthly: monthlyDays,
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {summaryCards.map((c, i) => {
        const st = cardStyles[c.key];
        return (
          <motion.div
            key={c.key}
            className={`flex flex-col items-center gap-1 px-3 py-3 rounded-2xl ${st.bg} border border-white/40`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.35 + i * 0.06 }}
            whileHover={{ y: -2, scale: 1.03 }}
          >
            <span className="text-xl">{c.icon}</span>
            <span className={`text-lg font-black ${st.text}`}>
              {values[c.key]}{c.suffix}
            </span>
            <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">
              {c.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   3. ACTIVITY SUB-SECTION (merged into Attendance)
   ═══════════════════════════════════════════════════ */

/** Stat row — single metric inside a day card */
const StatRow: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-2.5 py-1">
    <span className="text-sm">{icon}</span>
    <span className="text-[11px] text-gray-600 font-medium flex-1">{label}</span>
    <span className={`text-[12px] font-black ${color}`}>{value}</span>
  </div>
);

/** Individual day card (accordion item) */
const DayCard: React.FC<{
  day: DayAttendance;
  isOpen: boolean;
  toggle: () => void;
  index: number;
}> = ({ day, isOpen, toggle, index }) => {
  const isToday = day.dateKey === new Date().toISOString().split('T')[0];
  const isFuture = day.dateKey > new Date().toISOString().split('T')[0];
  const dayLabel = new Date(day.dateKey + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  if (isFuture) return null;

  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.5)',
        border: '1px solid rgba(255,255,255,0.35)',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.4 + index * 0.04 }}
    >
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/30 transition-colors"
        onClick={toggle}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              day.present ? 'bg-emerald-400' : 'bg-red-400'
            }`}
          />
          <span className="text-xs font-black text-gray-700">
            {isToday ? '📌 Today' : dayLabel}
          </span>
          {day.present && (
            <span className="text-[10px] font-medium text-gray-400">
              {day.games + day.colorMagic + day.ncertUsage + day.gardenActions} activities
            </span>
          )}
        </div>
        <motion.span
          className="text-gray-400 text-xs"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              {day.present ? (
                <div className="space-y-0.5">
                  <StatRow icon="🎮" label="Games Played" value={day.games} color="text-indigo-500" />
                  <StatRow icon="🎨" label="Color Magic Completed" value={day.colorMagic} color="text-pink-500" />
                  <StatRow icon="🤖" label="NCERT AI Used" value={day.ncertUsage} color="text-blue-500" />
                  <StatRow icon="🌳" label="Garden Actions" value={day.gardenActions} color="text-emerald-500" />
                  <StatRow icon="⏱" label="Time Spent" value={`~${day.timeSpent} min`} color="text-gray-600" />
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2">
                  <span className="w-2 h-2 rounded-full bg-red-300" />
                  <span className="text-[11px] text-red-400 font-semibold">
                    No Activity Recorded
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ActivitySubSection: React.FC = () => {
  const { days } = useAttendance();
  const todayIso = new Date().toISOString().split('T')[0];
  const [openDate, setOpenDate] = useState<string | null>(todayIso);

  // Show days in reverse (most recent first), skip future days
  const visibleDays = [...days]
    .filter(d => d.dateKey <= todayIso)
    .reverse();

  return (
    <div className="bg-white/50 rounded-2xl p-4 space-y-4">
      {/* Sub-section title */}
      <div className="flex items-center gap-2">
        <span
          className="text-base"
          style={{ filter: 'drop-shadow(0 0 4px rgba(99,102,241,0.2))' }}
        >
          🧠
        </span>
        <h4 className="text-[13px] font-black text-gray-800">
          Daily Learning Activity
        </h4>
      </div>

      {visibleDays.length > 0 ? (
        <div className="flex flex-col gap-2">
          {visibleDays.map((day, i) => (
            <DayCard
              key={day.dateKey}
              day={day}
              isOpen={openDate === day.dateKey}
              toggle={() =>
                setOpenDate(prev => (prev === day.dateKey ? null : day.dateKey))
              }
              index={i}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <span className="text-2xl block mb-1.5">🌈</span>
          <p className="text-xs text-gray-400 font-medium">
            Activities will appear here once your child starts exploring!
          </p>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN SECTION (inner, consumes context)
   ═══════════════════════════════════════════════════ */

const AttendanceSectionInner: React.FC = () => (
  <motion.div
    className="rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 p-6 shadow-md space-y-6 relative overflow-hidden"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay: 0.16 }}
  >
    {/* Decorative blob */}
    <div className="absolute -top-14 -left-14 w-44 h-44 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-[0.07] blur-3xl" />
    <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full opacity-[0.06] blur-3xl" />

    {/* Section heading */}
    <div className="relative flex items-center gap-2.5">
      <span
        className="text-xl"
        style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.25))' }}
      >
        🎒
      </span>
      <div>
        <h3 className="text-[15px] font-black text-gray-800">
          Learning Attendance
        </h3>
        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
          Weekly status, summary & daily activity — all in one place
        </p>
      </div>
    </div>

    {/* 1. Weekly Bubbles */}
    <WeeklyBubbles />

    {/* 2. Attendance Summary */}
    <AttendanceSummary />

    {/* 3. Activity Sub-Section */}
    <ActivitySubSection />
  </motion.div>
);

/* ═══════════════════════════════════════════════════
   EXPORT — self-wrapping with AttendanceProvider
   ═══════════════════════════════════════════════════ */

/**
 * Drop-in attendance section for the Parent Dashboard.
 * Self-provides AttendanceContext — no changes to App.tsx needed.
 */
const AttendanceSection: React.FC = () => (
  <AttendanceProvider>
    <AttendanceSectionInner />
  </AttendanceProvider>
);

export default AttendanceSection;
