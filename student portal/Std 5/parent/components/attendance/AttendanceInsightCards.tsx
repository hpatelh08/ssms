/**
 * parent/components/attendance/AttendanceInsightCards.tsx
 * ─────────────────────────────────────────────────────
 * Three large storytelling insight cards:
 *  1. Consistency Score — circular progress ring
 *  2. Learning Streak — animated flame
 *  3. Monthly Journey — magical day count
 *
 * Consumes useAttendance() — must be inside AttendanceProvider.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useAttendance } from '../../../context/AttendanceContext';
import { StreakFlame } from '../../../components/animations/StreakFlame';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

/* ── Circular Progress Ring ────────────────────────── */

const ProgressRing: React.FC<{
  value: number;
  size?: number;
  stroke?: number;
  color: string;
  bgColor?: string;
}> = ({ value, size = 72, stroke = 6, color, bgColor = '#e2e8f0' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={bgColor}
          strokeWidth={stroke}
          opacity={0.3}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-[15px] font-black text-gray-700">
        {Math.min(value, 100)}%
      </span>
    </div>
  );
};

/* ── Consistency Score Card ────────────────────────── */

const ConsistencyCard: React.FC<{ rate: number }> = ({ rate }) => {
  const label =
    rate >= 90 ? 'Outstanding consistency!' :
    rate >= 70 ? 'Strong weekly presence!' :
    rate >= 50 ? 'Building good habits!' :
    'Every day is a chance to grow!';

  return (
    <motion.div
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 6px 28px rgba(16,185,129,0.08), 0 2px 8px rgba(0,0,0,0.03)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.12 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="absolute -top-8 -right-8 w-28 h-28 bg-gradient-to-br from-emerald-200 to-green-200 rounded-full opacity-[0.08] blur-2xl" />

      <div className="flex items-center gap-5 relative z-10">
        <ProgressRing value={rate} color="#10b981" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📊</span>
            <h3 className="text-[13px] font-black text-gray-700">Consistency Score</h3>
          </div>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Learning Streak Card ──────────────────────────── */

const StreakCard: React.FC<{ streak: number }> = ({ streak }) => {
  const label =
    streak >= 7 ? 'Incredible dedication! 🏆' :
    streak >= 3 ? 'Keep it going!' :
    streak > 0 ? 'Building momentum!' :
    'Start today — every flame starts with a spark!';

  return (
    <motion.div
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 6px 28px rgba(245,158,11,0.08), 0 2px 8px rgba(0,0,0,0.03)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.18 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="absolute -top-8 -left-8 w-28 h-28 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full opacity-[0.08] blur-2xl" />

      <div className="flex items-center gap-5 relative z-10">
        {/* Animated flame — upgraded component */}
        <StreakFlame streak={streak} size={72} />

        <div className="flex-1">
          <h3 className="text-[13px] font-black text-gray-700 mb-1">
            {streak}-Day Learning Flame 🔥
          </h3>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Monthly Journey Card ──────────────────────────── */

const MonthlyCard: React.FC<{ days: number }> = ({ days }) => {
  const label =
    days >= 20 ? 'Building powerful habits.' :
    days >= 10 ? 'Wonderful progress this month!' :
    days > 0 ? 'Every day counts — keep going!' :
    'A new month full of possibilities!';

  return (
    <motion.div
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 6px 28px rgba(63,143,58,0.08), 0 2px 8px rgba(0,0,0,0.03)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.24 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-gradient-to-br from-green-200 to-lime-200 rounded-full opacity-[0.08] blur-2xl" />

      <div className="flex items-center gap-5 relative z-10">
        {/* Animated calendar */}
        <motion.div
          className="w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(237,233,254,0.7), rgba(219,234,254,0.7))',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 3px 14px rgba(63,143,58,0.1)',
          }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-2xl">📅</span>
          <span className="text-[11px] font-black text-green-600 -mt-0.5">{days}</span>
        </motion.div>

        <div className="flex-1">
          <h3 className="text-[13px] font-black text-gray-700 mb-1">
            {days} Magical Days This Month ✨
          </h3>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Main Export ────────────────────────────────────── */

export const AttendanceInsightCards: React.FC = () => {
  const { rate, streak, monthlyDays } = useAttendance();

  return (
    <div className="space-y-3">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">✨</span>
        <h2 className="text-sm font-black text-gray-700">Insights</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <ConsistencyCard rate={rate} />
        <StreakCard streak={streak} />
        <MonthlyCard days={monthlyDays} />
      </div>
    </div>
  );
};
