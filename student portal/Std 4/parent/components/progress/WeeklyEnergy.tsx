/**
 * parent/components/progress/WeeklyEnergy.tsx
 * ─────────────────────────────────────────────────────
 * "Weekly Energy" — pastel mini-cards showing activities,
 * stars, games, consistency. No red negatives.
 *
 * If a metric dropped → encouraging message instead of
 * red percentage.
 *
 * Data sourced from ssms_audit_log + arcade_game_stars.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/* ── Data helpers ──────────────────────────────────── */

interface AuditEntry {
  action: string;
  category: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

function readAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function readTotalStars(): number {
  try {
    const raw = localStorage.getItem('arcade_game_stars');
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, number>;
      return Object.values(obj).reduce((a, b) => a + b, 0);
    }
  } catch { /* ignore */ }
  return 0;
}

interface WeekRange {
  activities: number;
  games: number;
}

function computeWeek(log: AuditEntry[], weeksAgo: number): WeekRange {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - now.getDay() - weeksAgo * 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  let activities = 0;
  let games = 0;

  for (const e of log) {
    const d = new Date(e.timestamp);
    if (d >= weekStart && d < weekEnd) {
      activities++;
      if (e.action === 'game_complete' || e.action === 'game_selected') games++;
    }
  }

  return { activities, games };
}

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

/* ── Stat tile config ──────────────────────────────── */

interface StatConfig {
  key: string;
  label: string;
  icon: string;
  gradient: string;
  textColor: string;
  getValue: (thisWeek: WeekRange, stars: number, log: AuditEntry[]) => number;
  suffix?: string;
}

const STAT_CONFIGS: StatConfig[] = [
  {
    key: 'activities',
    label: 'Activities Done',
    icon: '🎯',
    gradient: '-amber-/80 -orange-/60',
    textColor: '-amber-',
    getValue: (w) => w.activities,
  },
  {
    key: 'stars',
    label: 'Stars Earned',
    icon: '⭐',
    gradient: 'from-amber-50/80 to-yellow-50/60',
    textColor: 'text-amber-600',
    getValue: (_w, stars) => stars,
  },
  {
    key: 'games',
    label: 'Games Played',
    icon: '🎮',
    gradient: 'from-pink-50/80 to-rose-50/60',
    textColor: 'text-pink-600',
    getValue: (w) => w.games,
  },
  {
    key: 'consistency',
    label: 'Consistency',
    icon: '📅',
    gradient: 'from-emerald-50/80 to-green-50/60',
    textColor: 'text-emerald-600',
    getValue: (w) => Math.min(100, Math.round((w.activities / Math.max(7, 1)) * 100)),
    suffix: '%',
  },
];

/* ── Single Mini Card ──────────────────────────────── */

const MiniCard: React.FC<{
  config: StatConfig;
  value: number;
  lastWeekValue: number;
  index: number;
}> = ({ config, value, lastWeekValue, index }) => {
  const isUp = value >= lastWeekValue;
  const encourageMsg = isUp
    ? (value > 0 ? 'Great momentum! 🌟' : 'Time to get started!')
    : "Let's boost this next week 💪";

  return (
    <motion.div
      className={`rounded-3xl bg-gradient-to-br ${config.gradient} backdrop-blur-md p-5 shadow-md relative overflow-hidden`}
      style={{
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.1 + index * 0.06 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      {/* Decorative glow */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.08] blur-2xl bg-white" />

      <div className="flex items-center gap-2.5 mb-2">
        <motion.span
          className="text-xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
        >
          {config.icon}
        </motion.span>
        <span className="text-[11px] font-bold text-gray-500">{config.label}</span>
      </div>

      <p className={`text-2xl font-black ${config.textColor} mb-1`}>
        {value}{config.suffix || ''}
      </p>

      {/* Encouraging message — no red negatives! */}
      <p className="text-[10px] font-semibold text-gray-400">
        {encourageMsg}
      </p>
    </motion.div>
  );
};

/* ── Main Export ────────────────────────────────────── */

export const WeeklyEnergy: React.FC = () => {
  const log = useMemo(readAuditLog, []);
  const stars = useMemo(readTotalStars, []);
  const thisWeek = useMemo(() => computeWeek(log, 0), [log]);
  const lastWeek = useMemo(() => computeWeek(log, 1), [log]);

  return (
    <div className="space-y-3">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">⚡</span>
        <h2 className="text-sm font-black text-gray-700">Weekly Energy</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CONFIGS.map((cfg, i) => {
          const value = cfg.getValue(thisWeek, stars, log);
          const prevValue = cfg.getValue(lastWeek, Math.max(0, stars - 2), log);
          return (
            <MiniCard
              key={cfg.key}
              config={cfg}
              value={value}
              lastWeekValue={prevValue}
              index={i}
            />
          );
        })}
      </div>
    </div>
  );
};
