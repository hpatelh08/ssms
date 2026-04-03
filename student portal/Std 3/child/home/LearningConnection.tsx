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
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textBody: '#cbd5e1',
  cardShadow: '0 18px 44px rgba(2, 6, 23, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
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
    improvements: ['Reading Practice', 'Writing Practice'],
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
            ? `linear-gradient(135deg, ${T.primary}36, ${T.success}3e)`
            : 'rgba(15,23,42,0.72)',
          border: `1px solid ${active ? `${T.success}45` : 'rgba(148,163,184,0.18)'}`,
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
    background: `linear-gradient(118deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.08) 100%), radial-gradient(circle at top right, ${color}30, transparent 36%), linear-gradient(180deg, rgba(10,16,30,0.84), rgba(15,23,42,0.76))`,
    border: `1px solid ${color}40`,
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
        background: `${T.success}22`,
        border: `1px solid ${T.success}40`,
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
      <div style={{ height: 6, borderRadius: 99, background: `${T.primary}10`, overflow: 'hidden' }}>
        <motion.div
          style={{
            height: '100%', borderRadius: 99,
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
        background: `linear-gradient(118deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.08) 100%), radial-gradient(circle at top right, ${T.success}2a, transparent 36%), linear-gradient(180deg, rgba(10,16,30,0.84), rgba(15,23,42,0.76))`,
        border: `1px solid ${T.success}40`,
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
        background: `linear-gradient(118deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.08) 100%), radial-gradient(circle at top right, ${T.warning}2a, transparent 36%), linear-gradient(180deg, rgba(10,16,30,0.84), rgba(15,23,42,0.76))`,
        border: `1px solid ${T.warning}40`,
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
          background: `${T.success}22`, border: `1px solid ${T.success}45`,
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
        margin: '0 8px 10px',
        padding: '22px 20px',
        borderRadius: 22,
        background: isParent
          ? 'linear-gradient(118deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 38%, rgba(255,255,255,0.08) 100%), radial-gradient(circle at top right, rgba(99,102,241,0.22), transparent 36%), radial-gradient(circle at bottom left, rgba(244,114,182,0.14), transparent 30%), linear-gradient(180deg, rgba(7,12,28,0.94), rgba(15,23,42,0.92))'
          : 'linear-gradient(118deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 38%, rgba(255,255,255,0.08) 100%), radial-gradient(circle at top right, rgba(34,197,94,0.22), transparent 36%), radial-gradient(circle at bottom left, rgba(56,189,248,0.14), transparent 30%), linear-gradient(180deg, rgba(7,12,28,0.94), rgba(15,23,42,0.92))',
        boxShadow: T.cardShadow,
        border: '1px solid rgba(148,163,184,0.24)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}>
        {isParent ? <ParentView data={data} /> : <StudentView data={data} />}
      </div>
    </motion.div>
  );
});

LearningConnection.displayName = 'LearningConnection';
