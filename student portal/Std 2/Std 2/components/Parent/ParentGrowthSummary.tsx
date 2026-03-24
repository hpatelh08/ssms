/**
 * 📊 ParentGrowthSummary — Structured Growth Analytics Card
 * ──────────────────────────────────────────────────────────
 * Shows the same growth data used by the student's tree,
 * but displayed as a clean, analytical summary card.
 *
 * No animations. Numbers & tiers visible. Meant for parent
 * dashboard context — quick at-a-glance child progress.
 */

import React from 'react';
import {
  useGrowthSystem,
  type GrowthData,
  type TreeSize,
  type HealthTier,
  type EngagementTier,
  type HomeworkTier,
} from '../../hooks/useGrowthSystem';

/* ── Tier labels & colors ────────────────────────── */

const TREE_SIZE_LABELS: Record<TreeSize, { label: string; icon: string }> = {
  seedling: { label: 'Seedling',    icon: '🌱' },
  sprout:   { label: 'Sprout',      icon: '🌿' },
  sapling:  { label: 'Sapling',     icon: '🪴' },
  young:    { label: 'Young Tree',  icon: '🌲' },
  mature:   { label: 'Mature Tree', icon: '🌳' },
  mighty:   { label: 'Mighty Tree', icon: '✨' },
};

const HEALTH_COLORS: Record<HealthTier, string> = {
  poor:      '#ef4444',
  fair:      '#f59e0b',
  good:      '#22c55e',
  excellent: '#10b981',
};

const ENGAGEMENT_COLORS: Record<EngagementTier, string> = {
  inactive:  '#9ca3af',
  casual:    '#60a5fa',
  active:    '#a78bfa',
  dedicated: '#f472b6',
};

const HOMEWORK_COLORS: Record<HomeworkTier, string> = {
  none:     '#9ca3af',
  started:  '#f59e0b',
  halfway:  '#60a5fa',
  complete: '#22c55e',
};

/* ── Metric row component ────────────────────────── */

interface MetricRowProps {
  label: string;
  value: string;
  subValue?: string;
  color?: string;
  icon: string;
}

const MetricRow: React.FC<MetricRowProps> = React.memo(({ label, value, subValue, color, icon }) => (
  <div style={rowStyle}>
    <span style={rowIconStyle}>{icon}</span>
    <div style={{ flex: 1 }}>
      <div style={rowLabelStyle}>{label}</div>
      {subValue && <div style={rowSubStyle}>{subValue}</div>}
    </div>
    <span style={{ ...rowValueStyle, color: color || '#1e293b' }}>{value}</span>
  </div>
));
MetricRow.displayName = 'MetricRow';

/* ── Progress bar ────────────────────────────────── */

const MiniBar: React.FC<{ percent: number; color: string }> = React.memo(({ percent, color }) => (
  <div style={barTrackStyle}>
    <div style={{ ...barFillStyle, width: `${Math.min(100, Math.max(0, percent))}%`, background: color }} />
  </div>
));
MiniBar.displayName = 'MiniBar';

/* ── Main component ──────────────────────────────── */

interface ParentGrowthSummaryProps {
  /** Optional overrides to inject specific values (e.g., from parent state) */
  overrides?: Parameters<typeof useGrowthSystem>[0];
}

export const ParentGrowthSummary: React.FC<ParentGrowthSummaryProps> = React.memo(({ overrides }) => {
  const g: GrowthData = useGrowthSystem(overrides);

  const treeMeta = TREE_SIZE_LABELS[g.treeSize];
  const healthColor = HEALTH_COLORS[g.healthTier];
  const engagementColor = ENGAGEMENT_COLORS[g.engagementTier];
  const homeworkColor = HOMEWORK_COLORS[g.homeworkTier];

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontSize: '20px' }}>{treeMeta.icon}</span>
        <div>
          <h3 style={headerTitleStyle}>Growth Summary</h3>
          <span style={headerSubStyle}>Connected to child's tree</span>
        </div>
      </div>

      {/* Metrics */}
      <div style={metricsStyle}>
        <MetricRow
          icon="📈"
          label="Growth Level"
          value={`Lv ${g.level}`}
          subValue={`${treeMeta.label} stage`}
        />

        <MetricRow
          icon="📅"
          label="Attendance Health"
          value={`${g.attendancePercent}%`}
          subValue={capitalize(g.healthTier)}
          color={healthColor}
        />

        {/* Attendance bar */}
        <div style={{ padding: '0 0 4px 28px' }}>
          <MiniBar percent={g.attendancePercent} color={healthColor} />
        </div>

        <MetricRow
          icon="🔥"
          label="Active Streak"
          value={`${g.streak} day${g.streak !== 1 ? 's' : ''}`}
          subValue={g.flowerCount > 0 ? `${g.flowerCount} flower${g.flowerCount !== 1 ? 's' : ''} on tree` : 'No flowers yet'}
        />

        <MetricRow
          icon="🎮"
          label="Games Completed"
          value={`${g.completedGames}`}
          subValue={capitalize(g.engagementTier)}
          color={engagementColor}
        />

        {/* Games engagement bar */}
        <div style={{ padding: '0 0 4px 28px' }}>
          <MiniBar percent={Math.min(100, g.completedGames * 5)} color={engagementColor} />
        </div>

        <MetricRow
          icon="🍎"
          label="Tree Fruits"
          value={`${g.fruitCount}`}
          subValue={g.fruitCount > 0 ? 'Earned from games' : 'Complete games to grow fruit'}
        />

        <MetricRow
          icon="📝"
          label="Homework Done"
          value={`${g.homeworkPercent}%`}
          subValue={capitalize(g.homeworkTier)}
          color={homeworkColor}
        />

        {/* Homework bar */}
        <div style={{ padding: '0 0 4px 28px' }}>
          <MiniBar percent={g.homeworkPercent} color={homeworkColor} />
        </div>

        <MetricRow
          icon="🌱"
          label="Garden Seeds"
          value={`${g.homeworkSeeds}`}
          subValue={g.homeworkSeeds > 0 ? 'Planted from homework' : 'Homework unlocks seeds'}
        />
      </div>

      {/* Footer note */}
      <div style={footerStyle}>
        This data mirrors the interactive garden your child uses. Activities are gated by real progress.
      </div>
    </div>
  );
});

ParentGrowthSummary.displayName = 'ParentGrowthSummary';

/* ── Helpers ─────────────────────────────────────── */

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ── Styles ──────────────────────────────────────── */

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '16px 20px 12px',
  borderBottom: '1px solid #f3f4f6',
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#1e293b',
  margin: 0,
};

const headerSubStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
  marginTop: '1px',
};

const metricsStyle: React.CSSProperties = {
  padding: '12px 20px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const rowIconStyle: React.CSSProperties = {
  fontSize: '16px',
  width: '22px',
  textAlign: 'center',
  flexShrink: 0,
};

const rowLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
};

const rowSubStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
  marginTop: '1px',
};

const rowValueStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  flexShrink: 0,
};

const barTrackStyle: React.CSSProperties = {
  height: '4px',
  borderRadius: '2px',
  background: '#f3f4f6',
  overflow: 'hidden',
};

const barFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.3s ease',
};

const footerStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
  padding: '10px 20px 14px',
  borderTop: '1px solid #f3f4f6',
  textAlign: 'center',
};
