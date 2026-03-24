/**
 * 🌳 TreeDashboard — Student Tree Module (Dashboard Style)
 * ────────────────────────────────────────────────────
 * Rebuilt to match Parent dashboard layout system exactly.
 *
 * Grid: lg:grid-cols-3
 *   LEFT (col-span-2):
 *    • Header card: Tree name + stage badge + circular growth %
 *    • AnimatedTree visual (card-premium container)
 *    • Action buttons row
 *   RIGHT:
 *    • Growth Stats card (water, sunlight, happiness)
 *    • Growth Insights card (attendance, homework, games)
 *    • Stage Journey card
 *
 * No floating particles, no glassmorphism inline styles.
 * Uses card-premium, Tailwind classes, framer-motion — same as parent.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTree } from '../context/TreeContext';
import { AnimatedTree } from '../components/tree/AnimatedTree';
import { getStatColor, STAGE_META } from '../utils/treeEngine';
import { DashboardCard } from '../components/ui/DashboardCard';

/* ── Child-specific hooks (safe imports) ────────── */
let useSoundPlay: () => (type: string) => void;
let useMascotTrigger: () => (state: string, duration?: number) => void;
let useCelebrate: () => (type: string) => void;

try {
  const sound = require('./SoundProvider');
  useSoundPlay = sound.useSoundPlay ?? (() => () => {});
} catch { useSoundPlay = () => () => {}; }

try {
  const mascot = require('./useMascotController');
  useMascotTrigger = mascot.useMascotTrigger ?? (() => () => {});
} catch { useMascotTrigger = () => () => {}; }

try {
  const cele = require('./useCelebrationController');
  useCelebrate = cele.useCelebrate ?? (() => () => {});
} catch { useCelebrate = () => () => {}; }

/* ── Stat Bar ────────────────────────────────────── */

const StatBar: React.FC<{ label: string; icon: string; value: number; color?: string }> = React.memo(
  ({ label, icon, value, color }) => {
    const fill = color ?? getStatColor(value);
    return (
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-[90px]">
          <span className="text-base">{icon}</span>
          <span className="text-[13px] font-semibold text-gray-700">{label}</span>
        </div>
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(0, value))}%`,
              background: `linear-gradient(90deg, ${fill}88, ${fill})`,
              transition: 'width 0.8s ease-out',
            }}
          />
        </div>
        <span className="text-xs font-bold min-w-[36px] text-right" style={{ color: fill }}>
          {Math.round(value)}%
        </span>
      </div>
    );
  },
);
StatBar.displayName = 'StatBar';

/* ── Circular Progress ───────────────────────────── */

const CircularProgress: React.FC<{ value: number }> = React.memo(({ value }) => {
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <svg width={80} height={80} viewBox="0 0 80 80">
      <circle cx={40} cy={40} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6} />
      <circle
        cx={40} cy={40} r={r} fill="none"
        stroke="url(#treeGrowth)" strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 1s ease-out',
          transform: 'rotate(-90deg)',
          transformOrigin: '40px 40px',
        }}
      />
      <defs>
        <linearGradient id="treeGrowth" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <text x={40} y={44} textAnchor="middle" fontSize={16} fontWeight={700} fill="#16a34a">
        {Math.round(value)}%
      </text>
    </svg>
  );
});
CircularProgress.displayName = 'CircularProgress';

/* ── Action Button ───────────────────────────────── */

const ActionButton: React.FC<{
  icon: string;
  label: string;
  gradient: string;
  onClick: () => void;
  disabled?: boolean;
}> = React.memo(({ icon, label, gradient, onClick, disabled }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 max-w-[140px] flex flex-col items-center justify-center gap-1 py-3.5 px-5 rounded-2xl border-none text-white shadow-lg ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    }`}
    style={{ background: disabled ? '#d1d5db' : gradient }}
    whileHover={disabled ? {} : { scale: 1.05, y: -2 }}
    whileTap={disabled ? {} : { scale: 0.95 }}
  >
    <span className="text-[26px]">{icon}</span>
    <span className="text-xs font-bold tracking-wide">{label}</span>
  </motion.button>
));
ActionButton.displayName = 'ActionButton';

/* ── Insight Bar ─────────────────────────────────── */

const InsightBar: React.FC<{ label: string; value: number; color: string; icon: string }> = React.memo(
  ({ label, value, color, icon }) => (
    <div className="flex items-center gap-2.5">
      <span className="text-lg w-7 text-center">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-gray-500 font-semibold">{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{Math.round(value)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded overflow-hidden">
          <div
            className="h-full rounded"
            style={{
              width: `${Math.min(100, Math.max(0, value))}%`,
              background: `linear-gradient(90deg, ${color}99, ${color})`,
              transition: 'width 1.2s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  ),
);
InsightBar.displayName = 'InsightBar';

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */

export const TreeDashboard: React.FC = () => {
  const { tree, overallGrowth, stageMeta, waterTree, addSunshine, celebrate, justLeveledUp, syncFromData } = useTree();

  const play = useSoundPlay();
  const triggerMascot = useMascotTrigger();
  const triggerCelebrate = useCelebrate();

  const [showRain, setShowRain] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const rainTimer = useRef<ReturnType<typeof setTimeout>>();
  const sparkleTimer = useRef<ReturnType<typeof setTimeout>>();

  // Sync data on mount
  useEffect(() => {
    syncFromData();
  }, [syncFromData]);

  // Fire celebration effects on stage-up
  useEffect(() => {
    if (justLeveledUp) {
      setShowSparkle(true);
      try { play('celebrate'); } catch { /* noop */ }
      try { play('level'); } catch { /* noop */ }
      try { triggerCelebrate('confetti'); } catch { /* noop */ }
      try { triggerMascot('celebrate', 3000); } catch { /* noop */ }
      if (sparkleTimer.current) clearTimeout(sparkleTimer.current);
      sparkleTimer.current = setTimeout(() => setShowSparkle(false), 3000);
    }
  }, [justLeveledUp, play, triggerCelebrate, triggerMascot]);

  // Cleanup timers
  useEffect(() => () => {
    if (rainTimer.current) clearTimeout(rainTimer.current);
    if (sparkleTimer.current) clearTimeout(sparkleTimer.current);
  }, []);

  const handleWater = useCallback(() => {
    waterTree();
    play('click');
    triggerMascot('happy', 1500);
    setShowRain(true);
    if (rainTimer.current) clearTimeout(rainTimer.current);
    rainTimer.current = setTimeout(() => setShowRain(false), 2000);
  }, [waterTree, play, triggerMascot]);

  const handleSunshine = useCallback(() => {
    addSunshine();
    play('correct');
    triggerMascot('happy', 1500);
  }, [addSunshine, play, triggerMascot]);

  const handleCelebrate = useCallback(() => {
    celebrate();
    play('celebrate');
    triggerMascot('celebrate', 2000);
    triggerCelebrate('confetti');
  }, [celebrate, play, triggerMascot, triggerCelebrate]);

  const STAGES = ['seed', 'sprout', 'plant', 'young', 'flowering', 'fruit'] as const;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* ── Page Title ───────────────────────── */}
      <motion.div
        className="flex items-center justify-between flex-wrap gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-blue-900">🌳 My Tree</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Watch your tree grow with every achievement</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-green-50/60 border border-green-200/30">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-green-600">Synced with Parent ✓</span>
        </div>
      </motion.div>

      {/* ── Main Grid ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <DashboardCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl">{stageMeta.icon}</span>
                <div className="min-w-0">
                  <div className="text-lg font-extrabold text-gray-800 truncate">{tree.treeName}</div>
                  <span
                    className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-xl mt-0.5"
                    style={{ background: `${stageMeta.color}20`, color: stageMeta.color }}
                  >
                    {stageMeta.label}
                  </span>
                </div>
              </div>
              <CircularProgress value={overallGrowth} />
            </div>
          </DashboardCard>

          {/* Tree Visual */}
          <DashboardCard className="overflow-hidden !p-0">
            <div className="p-4">
              <AnimatedTree
                stage={tree.stage}
                happiness={tree.happiness}
                showRain={showRain}
                showSparkle={showSparkle}
                showGlow={justLeveledUp}
              />
            </div>
          </DashboardCard>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <ActionButton
              icon="💧"
              label="Water"
              gradient="linear-gradient(135deg, #60a5fa, #3b82f6)"
              onClick={handleWater}
              disabled={tree.waterLevel >= 100}
            />
            <ActionButton
              icon="☀️"
              label="Sunshine"
              gradient="linear-gradient(135deg, #fbbf24, #f59e0b)"
              onClick={handleSunshine}
              disabled={tree.sunlightLevel >= 100}
            />
            <ActionButton
              icon="🎉"
              label="Celebrate"
              gradient="linear-gradient(135deg, #f472b6, #ec4899)"
              onClick={handleCelebrate}
              disabled={tree.happiness >= 100}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Growth Stats */}
          <DashboardCard delay={0.1}>
            <div className="text-sm font-bold text-gray-700 mb-3">🌱 Growth Stats</div>
            <StatBar label="Water" icon="💧" value={tree.waterLevel} color="#3b82f6" />
            <StatBar label="Sunlight" icon="☀️" value={tree.sunlightLevel} color="#f59e0b" />
            <StatBar label="Happiness" icon="😊" value={tree.happiness} color="#ec4899" />
          </DashboardCard>

          {/* Growth Insights */}
          <DashboardCard delay={0.15}>
            <div className="text-sm font-bold text-gray-700 mb-3">📊 Growth Insights</div>
            <div className="space-y-2.5">
              <InsightBar label="Attendance" value={tree.attendanceRate} color="#22c55e" icon="📅" />
              <InsightBar label="Homework" value={tree.homeworkCompleted} color="#3b82f6" icon="📝" />
              <InsightBar label="Games" value={tree.gamesEngagement} color="#f59e0b" icon="🎮" />
            </div>
          </DashboardCard>

          {/* Stage Journey */}
          <DashboardCard delay={0.2}>
            <div className="text-sm font-bold text-gray-700 mb-3">🗺️ Stage Journey</div>
            <div className="flex justify-between items-center gap-1">
              {STAGES.map(s => {
                const meta = STAGE_META[s];
                const isCurrent = s === tree.stage;
                const isPast = STAGES.indexOf(s) < STAGES.indexOf(tree.stage);
                return (
                  <div
                    key={s}
                    className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${
                      isPast || isCurrent ? 'opacity-100' : 'opacity-35'
                    } ${isCurrent ? 'scale-125' : ''}`}
                  >
                    <span
                      className={isCurrent ? 'text-[22px]' : 'text-base'}
                      style={isCurrent ? { filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' } : {}}
                    >
                      {meta.icon}
                    </span>
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: isCurrent ? meta.color : '#9ca3af' }}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
};

export default TreeDashboard;
