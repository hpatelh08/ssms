/**
 * 🌳 TreeOverviewCard — Parent Dashboard Tree Summary
 * ────────────────────────────────────────────────────
 * Elegant read-only card showing the child's tree status.
 * Consumed via TreeContext (shared with ChildLayout).
 *
 * Shows:
 *   • Current stage with icon & label
 *   • Overall growth %
 *   • Attendance %, Homework %, Game Engagement %
 *   • Growth trend indicator
 *
 * Uses framer-motion (available in ParentLayout) + Tailwind.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTree } from '../../context/TreeContext';
import { STAGE_META, getStatColor } from '../../utils/treeEngine';
import type { TreeStage } from '../../utils/treeEngine';

/* ── Stat row sub-component ─────────────────────── */

const Stat: React.FC<{ label: string; icon: string; value: number }> = React.memo(({ label, icon, value }) => {
  const color = getStatColor(value);
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs font-semibold text-gray-600">{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{Math.round(value)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
});
Stat.displayName = 'Stat';

/* ── Stage journey dots ─────────────────────────── */

const STAGES: TreeStage[] = ['seed', 'sprout', 'plant', 'young', 'flowering', 'fruit'];

const StageJourney: React.FC<{ current: TreeStage }> = React.memo(({ current }) => {
  const currentIdx = STAGES.indexOf(current);
  return (
    <div className="flex items-center justify-between mt-3 px-1">
      {STAGES.map((s, i) => {
        const meta = STAGE_META[s];
        const isReached = i <= currentIdx;
        return (
          <div key={s} className="flex flex-col items-center gap-0.5">
            <span
              className="text-sm transition-all duration-300"
              style={{
                opacity: isReached ? 1 : 0.3,
                transform: s === current ? 'scale(1.25)' : 'scale(1)',
                filter: s === current ? `drop-shadow(0 0 4px ${meta.color})` : 'none',
              }}
            >
              {meta.icon}
            </span>
            {i < STAGES.length - 1 && (
              <div
                className="hidden"
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
});
StageJourney.displayName = 'StageJourney';

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */

export const TreeOverviewCard: React.FC = () => {
  const { tree, overallGrowth, stageMeta } = useTree();

  const trendLabel = useMemo(() => {
    if (overallGrowth >= 80) return { text: 'Thriving! 🌟', color: '#16a34a' };
    if (overallGrowth >= 60) return { text: 'Growing well', color: '#22c55e' };
    if (overallGrowth >= 40) return { text: 'Developing', color: '#f59e0b' };
    if (overallGrowth >= 20) return { text: 'Getting started', color: '#f97316' };
    return { text: 'Just planted', color: '#9ca3af' };
  }, [overallGrowth]);

  return (
    <motion.div
      className="rounded-3xl p-5 border"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor: 'rgba(255,255,255,0.5)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{stageMeta.icon}</span>
          <div>
            <div className="text-sm font-bold text-gray-800">{tree.treeName}</div>
            <div
              className="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${stageMeta.color}18`,
                color: stageMeta.color,
              }}
            >
              {stageMeta.label}
            </div>
          </div>
        </div>

        {/* Circular progress */}
        <div className="relative flex items-center justify-center">
          <svg width={52} height={52} viewBox="0 0 52 52">
            <circle cx={26} cy={26} r={22} fill="none" stroke="#e5e7eb" strokeWidth={4} />
            <circle
              cx={26} cy={26} r={22} fill="none"
              stroke={stageMeta.color}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 22}
              strokeDashoffset={2 * Math.PI * 22 * (1 - overallGrowth / 100)}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '26px 26px', transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <text x={26} y={29} textAnchor="middle" fontSize={11} fontWeight={700} fill={stageMeta.color}>
              {Math.round(overallGrowth)}%
            </text>
          </svg>
        </div>
      </div>

      {/* Trend */}
      <div className="text-xs font-semibold mb-3" style={{ color: trendLabel.color }}>
        {trendLabel.text}
      </div>

      {/* Stats */}
      <div className="space-y-2.5">
        <Stat label="Attendance" icon="📅" value={tree.attendanceRate} />
        <Stat label="Homework" icon="📝" value={tree.homeworkCompleted} />
        <Stat label="Games" icon="🎮" value={tree.gamesEngagement} />
      </div>

      {/* Stage journey */}
      <StageJourney current={tree.stage} />
    </motion.div>
  );
};

export default TreeOverviewCard;
