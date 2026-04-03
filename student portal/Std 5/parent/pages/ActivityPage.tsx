/**
 * parent/pages/ActivityPage.tsx
 * ─────────────────────────────────────────────────────
 * Timeline-style recent activity list + screen time summary.
 * Reads from ssms_audit_log in localStorage.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/* ── Types & Helpers ── */

interface LogEntry {
  action: string;
  category: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

function readAuditLog(): LogEntry[] {
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function formatRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

function actionLabel(action: string): { label: string; icon: string; color: string } {
  const map: Record<string, { label: string; icon: string; color: string }> = {
    game_selected: { label: 'Started a game', icon: '🎮', color: '#5f8b3d' },
    game_complete: { label: 'Completed a game', icon: '🏆', color: '#10b981' },
    xp_earned: { label: 'Earned XP', icon: '⚡', color: '#3b82f6' },
    daily_login: { label: 'Logged in', icon: '📅', color: '#f59e0b' },
    badge_unlocked: { label: 'Earned a badge', icon: '🏅', color: '#f59e0b' },
    navigation: { label: 'Navigated', icon: '🧭', color: '#64748b' },
    next_game: { label: 'Played next game', icon: '➡️', color: '#06b6d4' },
    parent_authenticated: { label: 'Parent accessed', icon: '🔒', color: '#64748b' },
    tree_watered: { label: 'Watered tree', icon: '💧', color: '#06b6d4' },
    garden_activity: { label: 'Garden activity', icon: '🌱', color: '#10b981' },
  };
  return map[action] || { label: action.replace(/_/g, ' '), icon: '📌', color: '#94a3b8' };
}

function estimateScreenTime(log: LogEntry[]): { today: number; weekAvg: number } {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Rough estimate: each logged action ≈ 2 minutes of engagement
  const todayActions = log.filter(e => e.timestamp?.startsWith(todayStr)).length;
  const weekActions = log.filter(e => new Date(e.timestamp) >= weekAgo).length;

  return {
    today: Math.round(todayActions * 2),
    weekAvg: Math.round((weekActions * 2) / 7),
  };
}

/* ── Timeline Entry ── */

const TimelineEntry: React.FC<{ entry: LogEntry; index: number }> = ({ entry, index }) => {
  const info = actionLabel(entry.action);

  return (
    <motion.div
      className="relative flex items-start gap-3 pl-6"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 200, damping: 22 }}
    >
      {/* Timeline line */}
      <div className="absolute left-[11px] top-8 bottom-0 w-px bg-slate-100" />

      {/* Dot */}
      <div
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 relative z-10"
        style={{ background: `${info.color}15`, border: `2px solid ${info.color}30` }}
      >
        {info.icon}
      </div>

      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-slate-700">{info.label}</p>
          <span className="text-[10px] text-slate-400 font-medium">{formatRelative(entry.timestamp)}</span>
        </div>
        {entry.data && (
          <p className="text-[10px] text-slate-400 mt-0.5">
            {entry.data.game && `Game: ${entry.data.game}`}
            {entry.data.amount && ` • +${entry.data.amount} XP`}
            {entry.data.badge && `Badge: ${entry.data.badge}`}
          </p>
        )}
      </div>
    </motion.div>
  );
};

/* ── Screen Time Card ── */

const ScreenTimeCard: React.FC<{ today: number; weekAvg: number }> = ({ today, weekAvg }) => (
  <motion.div
    className="bg-white rounded-2xl p-5"
    style={{ border: '1px solid rgba(226,232,240,0.5)', boxShadow: '0 1px 8px rgba(0,0,0,0.03)' }}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
  >
    <div className="flex items-center gap-2 mb-4">
      <span className="text-lg">⏱️</span>
      <h3 className="text-sm font-bold text-slate-700">Screen Time Estimate</h3>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-emerald-50/70 rounded-xl p-3.5 text-center">
        <p className="text-2xl font-extrabold text-emerald-700">{today}m</p>
        <p className="text-[10px] font-semibold text-emerald-500 mt-0.5">Today</p>
      </div>
      <div className="bg-lime-50/70 rounded-xl p-3.5 text-center">
        <p className="text-2xl font-extrabold text-lime-700">{weekAvg}m</p>
        <p className="text-[10px] font-semibold text-lime-500 mt-0.5">Daily Avg (7d)</p>
      </div>
    </div>
    <p className="text-[10px] text-slate-400 mt-3 text-center">
      Based on activity patterns. Actual usage may vary.
    </p>
  </motion.div>
);

/* ── Main Component ── */

export const ActivityPage: React.FC = () => {
  const log = useMemo(readAuditLog, []);
  const recentLog = useMemo(() =>
    [...log]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30),
  [log]);
  const screenTime = useMemo(() => estimateScreenTime(log), [log]);

  return (
    <div className="max-w-[1100px] mx-auto space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Activity</h1>
        <p className="text-sm text-slate-400 mt-0.5">Recent activity timeline and screen time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <motion.div
            className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid rgba(226,232,240,0.5)', boxShadow: '0 1px 8px rgba(0,0,0,0.03)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="text-sm font-bold text-slate-700 mb-4">Recent Activity</h3>
            {recentLog.length > 0 ? (
              <div className="max-h-[480px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {recentLog.map((entry, i) => (
                  <TimelineEntry key={`${entry.timestamp}-${i}`} entry={entry} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <span className="text-3xl block mb-2">📭</span>
                <p className="text-sm text-slate-400">No activity recorded yet</p>
                <p className="text-xs text-slate-300 mt-1">Activity will appear as your child uses the platform</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Screen Time */}
        <div className="space-y-4">
          <ScreenTimeCard today={screenTime.today} weekAvg={screenTime.weekAvg} />

          {/* Activity heatmap placeholder */}
          <motion.div
            className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid rgba(226,232,240,0.5)', boxShadow: '0 1px 8px rgba(0,0,0,0.03)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">📊</span>
              <h3 className="text-sm font-bold text-slate-700">Activity Summary</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Actions Today</span>
                <span className="font-bold text-slate-700">{log.filter(e => e.timestamp?.startsWith(new Date().toISOString().split('T')[0])).length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Games Completed</span>
                <span className="font-bold text-slate-700">{log.filter(e => e.action === 'game_complete').length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">XP Earned Events</span>
                <span className="font-bold text-slate-700">{log.filter(e => e.action === 'xp_earned').length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Badges Unlocked</span>
                <span className="font-bold text-slate-700">{log.filter(e => e.action === 'badge_unlocked').length}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
