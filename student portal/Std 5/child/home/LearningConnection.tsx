/**
 * child/home/LearningConnection.tsx
 * ─────────────────────────────────────────────────────
 * Student–Parent Sync Module.
 *
 * Student view: Last parent review, weekly progress, encouragement.
 * Parent view:  Detailed analytics, activity heatmap, strengths.
 *
 * Same backend (localStorage), different UI presentation.
 *
 * Performance: React.memo, useCallback, transform+opacity only.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useXP } from '../XPProvider';
import { useAuth } from '../../auth/AuthContext';

/* ── Design tokens ──────────────────────────────── */

const T = {
  primary: '#5a4bff',
  secondary: '#ff8bd6',
  success: '#4cd964',
  warning: '#ffb347',
  textPrimary: '#2f6f3a',
  textSecondary: '#6b7cff',
  textBody: '#7d86ff',
  cardShadow: '0 12px 30px rgba(90, 75, 255, 0.08)',
} as const;

/* ── Shared data helpers ─────────────────────────── */

interface SyncData {
  lastReview: string;
  weeklyMinutes: number;
  encouragement: string;
  activeDays: number[];
  strengths: string[];
  improvements: string[];
  weeklyXP: number;
  completionPct: number;
}

function loadSyncData(): SyncData {
  try {
    const raw = localStorage.getItem('ssms_learning_sync');
    if (raw) return JSON.parse(raw) as SyncData;
  } catch { /* ignore */ }
  // Default demo data
  return {
    lastReview: 'Yesterday',
    weeklyMinutes: 45,
    encouragement: 'You\'re doing amazing! Keep it up! 🌟',
    activeDays: [1, 1, 0, 1, 1, 0, 1], // Mon-Sun
    strengths: ['Math Games', 'Color Recognition'],
    improvements: ['Reading Practice', 'Garden Care'],
    weeklyXP: 120,
    completionPct: 72,
  };
}

/* ── Day names ───────────────────────────────────── */

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/* ── Activity Heatmap (mini) ─────────────────────── */

const MiniHeatmap: React.FC<{ days: number[] }> = React.memo(({ days }) => (
  <div className="flex items-center gap-1.5">
    {days.map((active, i) => (
      <div key={i} className="flex flex-col items-center gap-1">
        <div style={{
          width: 20, height: 20, borderRadius: 6,
          background: active
            ? `linear-gradient(135deg, ${T.primary}20, ${T.success}25)`
            : `${T.primary}06`,
          border: `1px solid ${active ? `${T.success}20` : 'transparent'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {active ? (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.success }} />
          ) : null}
        </div>
        <span style={{ fontSize: 8, fontWeight: 700, color: T.textBody }}>{DAYS[i]}</span>
      </div>
    ))}
  </div>
));
MiniHeatmap.displayName = 'MiniHeatmap';

/* ── Stat Chip ───────────────────────────────────── */

const StatChip: React.FC<{
  icon: string; value: string | number; label: string; color: string;
}> = React.memo(({ icon, value, label, color }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '12px 14px', borderRadius: 14,
    background: `${color}08`, border: `1px solid ${color}10`,
    minWidth: 80,
  }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span style={{ fontSize: 16, fontWeight: 900, color, marginTop: 4 }}>{value}</span>
    <span style={{ fontSize: 9, fontWeight: 700, color: T.textBody, marginTop: 2 }}>{label}</span>
  </div>
));
StatChip.displayName = 'StatChip';

/* ── Student View ────────────────────────────────── */

const StudentView: React.FC<{ data: SyncData }> = React.memo(({ data }) => (
  <div className="flex flex-col gap-4">
    {/* Top row: sync status + encouragement */}
    <div className="flex items-center gap-3">
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: `${T.success}10`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 20 }}>👨‍👩‍👧</span>
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>
          Parent checked in: {data.lastReview}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textBody, marginTop: 2 }}>
          {data.encouragement}
        </div>
      </div>
    </div>

    {/* Weekly activity heatmap */}
    <div>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginBottom: 6, display: 'block' }}>
        This Week's Activity
      </span>
      <MiniHeatmap days={data.activeDays} />
    </div>

    {/* Progress bar */}
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary }}>Weekly Progress</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: T.primary }}>{data.completionPct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: `${T.primary}10`, overflow: 'hidden' }}>
        <motion.div
          style={{
            height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg, ${T.primary}, ${T.success})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${data.completionPct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  </div>
));
StudentView.displayName = 'StudentView';

/* ── Parent View ─────────────────────────────────── */

const ParentView: React.FC<{ data: SyncData }> = React.memo(({ data }) => (
  <div className="flex flex-col gap-4">
    {/* Stats row */}
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      <StatChip icon="⏱️" value={`${data.weeklyMinutes}m`} label="Time" color={T.primary} />
      <StatChip icon="💎" value={data.weeklyXP} label="XP" color={T.textSecondary} />
      <StatChip icon="📊" value={`${data.completionPct}%`} label="Goals" color={T.success} />
      <StatChip icon="📅" value={data.activeDays.filter(Boolean).length} label="Days" color={T.warning} />
    </div>

    {/* Activity heatmap */}
    <div>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginBottom: 6, display: 'block' }}>
        Activity Heatmap
      </span>
      <MiniHeatmap days={data.activeDays} />
    </div>

    {/* Strengths & Improvements */}
    <div className="grid grid-cols-2 gap-3">
      <div style={{
        padding: '12px 14px', borderRadius: 14,
        background: `${T.success}06`, border: `1px solid ${T.success}10`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: T.success, display: 'block', marginBottom: 6 }}>
          💪 Strengths
        </span>
        {data.strengths.map((s, i) => (
          <div key={i} style={{ fontSize: 11, fontWeight: 600, color: T.textPrimary, marginTop: i === 0 ? 0 : 3 }}>
            • {s}
          </div>
        ))}
      </div>
      <div style={{
        padding: '12px 14px', borderRadius: 14,
        background: `${T.warning}06`, border: `1px solid ${T.warning}10`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: T.warning, display: 'block', marginBottom: 6 }}>
          🎯 Focus Areas
        </span>
        {data.improvements.map((s, i) => (
          <div key={i} style={{ fontSize: 11, fontWeight: 600, color: T.textPrimary, marginTop: i === 0 ? 0 : 3 }}>
            • {s}
          </div>
        ))}
      </div>
    </div>
  </div>
));
ParentView.displayName = 'ParentView';

/* ── Main Component ──────────────────────────────── */

export const LearningConnection: React.FC = React.memo(() => {
  const { user } = useAuth();
  const isParent = user.role === 'parent';
  const data = useMemo(loadSyncData, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontSize: 18 }}>🔗</span>
        <h2 style={{
          fontSize: 15, fontWeight: 800, margin: 0,
          background: `linear-gradient(90deg, ${T.primary}, ${T.secondary})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Learning Connection
        </h2>
        {/* Sync badge */}
        <div className="flex items-center gap-1 ml-auto" style={{
          padding: '3px 8px', borderRadius: 8,
          background: `${T.success}10`, border: `1px solid ${T.success}15`,
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%', background: T.success,
            animation: 'eliteSyncPulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: T.success }}>Synced</span>
        </div>
      </div>

      {/* Card */}
      <div style={{
        padding: '22px 20px',
        borderRadius: 22,
        background: isParent
          ? 'linear-gradient(135deg, #f8f7ff 0%, #f2f0ff 50%, #eef0ff 100%)'
          : 'linear-gradient(135deg, #f0fff4 0%, #f0f8ff 50%, #fff8f0 100%)',
        boxShadow: T.cardShadow,
        border: '1px solid rgba(90,75,255,0.06)',
      }}>
        {isParent ? <ParentView data={data} /> : <StudentView data={data} />}
      </div>
    </motion.div>
  );
});

LearningConnection.displayName = 'LearningConnection';
