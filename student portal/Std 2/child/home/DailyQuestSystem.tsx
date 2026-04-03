/**
 * child/home/DailyQuestSystem.tsx
 * ─────────────────────────────────────────────────────
 * "Today's Mission" — structured quest panel inside a premium card.
 *
 * Each quest row has icon chip + progress bar + claim button.
 * Overall progress bar + all-done celebration.
 * Wrapped in an elevated card panel (not floating loose text).
 *
 * Performance: transform + opacity only. React.memo + useCallback.
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAddXP } from '../XPProvider';
import { useCelebrate } from '../useCelebrationController';

/* ── Design tokens ──────────────────────────────── */

const T = {
  primary: '#48cae4',
  secondary: '#72efdd',
  success: '#80ed99',
  warning: '#90dbf4',
  textPrimary: '#023047',
  textSecondary: '#0b3c5d',
  textBody: '#245b74',
} as const;

/* ── Quest definitions ───────────────────────────── */

interface QuestDef {
  id: string;
  icon: string;
  title: string;
  target: number;
  xpReward: number;
  color: string;
  barGradient: string;
}

const QUESTS: QuestDef[] = [
  {
    id: 'q_games',
    icon: '🎮',
    title: 'Complete 2 games',
    target: 2,
    xpReward: 15,
    color: T.primary,
    barGradient: 'linear-gradient(90deg, #48cae4, #90dbf4)',
  },
  {
    id: 'q_garden',
    icon: '🌱',
    title: 'Water the garden',
    target: 1,
    xpReward: 10,
    color: T.success,
    barGradient: 'linear-gradient(90deg, #48cae4, #90dbf4)',
  },
  {
    id: 'q_letters',
    icon: '📖',
    title: 'Learn 5 letters',
    target: 5,
    xpReward: 20,
    color: T.warning,
    barGradient: 'linear-gradient(90deg, #48cae4, #90dbf4)',
  },
  {
    id: 'q_journey',
    icon: '🗺️',
    title: 'Finish 1 level',
    target: 1,
    xpReward: 25,
    color: T.secondary,
    barGradient: 'linear-gradient(90deg, #48cae4, #90dbf4)',
  },
];

/* ── localStorage ────────────────────────────────── */

const QUEST_KEY = 'ssms_daily_quests';

function getTodayKey(): string { return new Date().toISOString().split('T')[0]; }

interface QuestProgress {
  date: string;
  progress: Record<string, number>;
  claimed: Record<string, boolean>;
}

function loadQuestProgress(): QuestProgress {
  try {
    const raw = localStorage.getItem(QUEST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QuestProgress;
      if (parsed.date === getTodayKey()) return parsed;
    }
  } catch { /* */ }
  return { date: getTodayKey(), progress: {}, claimed: {} };
}

function saveQuestProgress(data: QuestProgress): void {
  try { localStorage.setItem(QUEST_KEY, JSON.stringify(data)); } catch { /* */ }
}

/* ── Mini confetti ───────────────────────────────── */

const MiniConfetti: React.FC = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: 18 }}>
    {Array.from({ length: 8 }, (_, i) => {
      const angle = (i * 45) * Math.PI / 180;
      const dist = 25 + (i % 3) * 10;
      const colors = ['#6bc8d9', '#97e0d0', '#f0c4d5', '#efd18a', '#91d7ea', '#f8dfb0', '#a5e5d6', '#dcb8d1'];
      return (
        <motion.div
          key={i}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: 5, height: 5, borderRadius: '50%',
            background: colors[i], pointerEvents: 'none',
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.6, delay: i * 0.03, ease: 'easeOut' }}
        />
      );
    })}
  </div>
));
MiniConfetti.displayName = 'MiniConfetti';

/* ── Single Quest Row ────────────────────────────── */

interface QuestRowProps {
  quest: QuestDef;
  progress: number;
  claimed: boolean;
  onClaim: (id: string) => void;
  index: number;
}

const QuestRow: React.FC<QuestRowProps> = React.memo(({ quest, progress, claimed, onClaim, index }) => {
  const pct = Math.min(progress / quest.target, 1) * 100;
  const isComplete = progress >= quest.target;
  const [justClaimed, setJustClaimed] = useState(false);

  const handleClaim = useCallback(() => {
    if (!isComplete || claimed) return;
    setJustClaimed(true);
    onClaim(quest.id);
    setTimeout(() => setJustClaimed(false), 1000);
  }, [isComplete, claimed, onClaim, quest.id]);

  return (
    <motion.div
      className="relative flex items-center gap-3"
      style={{
        padding: '16px 18px',
        background: claimed ? 'rgba(72,202,228,0.12)' : 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(221,246,252,0.94))',
        borderRadius: 18,
        boxShadow: claimed ? 'none' : '0 10px 24px rgba(0, 150, 199, 0.12)',
        border: `1px solid ${claimed ? 'rgba(72,202,228,0.18)' : 'rgba(144,219,244,0.5)'}`,
      }}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.07, type: 'spring', stiffness: 200, damping: 24 }}
    >
      <AnimatePresence>{justClaimed && <MiniConfetti />}</AnimatePresence>

      {/* Icon chip */}
      <div style={{
        width: 40, height: 40, borderRadius: 13,
        background: `${quest.color}10`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        border: `1px solid ${quest.color}15`,
      }}>
        <span style={{ fontSize: 19 }}>{quest.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: claimed ? T.textBody : T.textPrimary,
            textDecoration: claimed ? 'line-through' : 'none',
          }}>
            {quest.title}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: quest.color }}>
            {progress}/{quest.target}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: 7, height: 7, borderRadius: 4,
          background: 'rgba(216,236,242,0.8)',
          overflow: 'hidden',
        }}>
          <motion.div
            style={{ height: '100%', borderRadius: 4, background: quest.barGradient, boxShadow: `0 0 8px ${quest.color}22` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Claim / Done */}
      {claimed ? (
        <motion.span
          style={{ fontSize: 18 }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.4 }}
        >✅</motion.span>
      ) : isComplete ? (
        <motion.button
          onClick={handleClaim}
          className="touch-manipulation"
          style={{
            background: 'linear-gradient(135deg, #48cae4, #90dbf4)',
            color: '#ffffff', fontSize: 10, fontWeight: 800,
            padding: '6px 14px', borderRadius: 11,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Claim +{quest.xpReward}
        </motion.button>
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255,255,255,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            border: `2px solid ${quest.color}25`,
          }} />
        </div>
      )}
    </motion.div>
  );
});
QuestRow.displayName = 'QuestRow';

/* ── Main Component ──────────────────────────────── */

export const DailyQuestSystem: React.FC = React.memo(() => {
  const addXP = useAddXP();
  const celebrate = useCelebrate();
  const [questData, setQuestData] = useState<QuestProgress>(loadQuestProgress);

  useEffect(() => {
    const data = loadQuestProgress();
    if (Object.keys(data.progress).length === 0) {
      data.progress = { q_games: 1, q_garden: 1, q_letters: 3, q_journey: 0 };
      saveQuestProgress(data);
      setQuestData(data);
    }
  }, []);

  const totalQuests = QUESTS.length;
  const completedQuests = useMemo(
    () => QUESTS.filter(q => questData.claimed[q.id]).length,
    [questData],
  );

  const handleClaim = useCallback((id: string) => {
    const quest = QUESTS.find(q => q.id === id);
    if (!quest) return;
    addXP(quest.xpReward);
    celebrate('confetti');
    setQuestData(prev => {
      const next = { ...prev, claimed: { ...prev.claimed, [id]: true } };
      saveQuestProgress(next);
      return next;
    });
  }, [addXP, celebrate]);

  const overallPct = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 20 }}>✨</span>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: T.textPrimary }}>
            Today's Missions
          </h2>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 800,
          color: '#023047',
          background: overallPct === 100 ? 'rgba(178,247,239,0.75)' : 'rgba(255,255,255,0.78)',
          padding: '5px 12px', borderRadius: 10,
          border: `1px solid ${overallPct === 100 ? 'rgba(128,237,153,0.32)' : 'rgba(144,219,244,0.45)'}`,
        }}>
          {completedQuests}/{totalQuests} {overallPct === 100 ? '🎉' : ''}
        </span>
      </div>

      {/* Quests card container */}
      <div style={{
        padding: '20px 18px',
        borderRadius: 26,
         background: 'linear-gradient(145deg, rgba(231,248,255,0.96) 0%, rgba(210,244,250,0.96) 52%, rgba(224,251,252,0.98) 100%)',
         boxShadow: '0 12px 30px rgba(0, 150, 199, 0.14)',
         border: '1px solid rgba(144,219,244,0.44)',
      }}>
        {/* Overall progress bar */}
        <div style={{
          height: 6, borderRadius: 3, marginBottom: 16,
          background: 'rgba(216,236,242,0.85)',
          overflow: 'hidden',
        }}>
          <motion.div
            style={{
              height: '100%', borderRadius: 3,
              background: 'linear-gradient(90deg, #48cae4, #90dbf4)',
              boxShadow: '0 0 8px rgba(72,202,228,0.28)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        {/* Quest rows */}
        <div className="flex flex-col gap-3">
          {QUESTS.map((q, i) => (
            <QuestRow
              key={q.id}
              quest={q}
              progress={questData.progress[q.id] ?? 0}
              claimed={questData.claimed[q.id] ?? false}
              onClaim={handleClaim}
              index={i}
            />
          ))}
        </div>

        {/* All-done */}
        <AnimatePresence>
          {overallPct === 100 && (
            <motion.div
              className="flex items-center justify-center gap-2 mt-4"
              style={{
                padding: '14px 22px', borderRadius: 18,
                background: 'linear-gradient(135deg, rgba(178,247,239,0.82), rgba(224,251,252,0.96))',
                border: '1px solid rgba(144,219,244,0.36)',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <span style={{ fontSize: 22 }}>🏆</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: T.success }}>
                All Missions Complete! Amazing job!
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

DailyQuestSystem.displayName = 'DailyQuestSystem';
