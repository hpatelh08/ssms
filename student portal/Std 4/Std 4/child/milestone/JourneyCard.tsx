/**
 * child/milestone/JourneyCard.tsx
 * ─────────────────────────────────────────────────────
 * Home-dashboard card that shows kingdom progress at a glance
 * and invites the child to enter the Magical Learning Kingdom.
 *
 * Design:
 * - Soft gradient card with animated stars
 * - World progress dots (5 dots, colored when completed)
 * - "Continue your adventure!" CTA
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ChildScreen } from '../ChildLayout';
import { cumulativeXP, xpToStars, WORLDS, LEVELS } from './levelData';
import { useXP } from '../XPProvider';

interface Props {
  onNavigate: (screen: ChildScreen) => void;
}

/* ── Quick progress read (no full engine, lightweight) ──────── */
function useQuickProgress() {
  const { state } = useXP();
  const totalXP = useMemo(
    () => cumulativeXP(state.level, state.xp),
    [state.level, state.xp],
  );
  const totalStars = useMemo(() => xpToStars(totalXP), [totalXP]);

  // Count completed levels from localStorage
  const completedCount = useMemo(() => {
    try {
      const raw = localStorage.getItem('child_kingdom_progress');
      if (!raw) return 0;
      const map = JSON.parse(raw) as Record<string, { state: string }>;
      return Object.values(map).filter(v => v.state === 'completed').length;
    } catch { return 0; }
  }, []); // one read on mount is fine

  // Per-world completed status (boss completed = world done)
  const worldDots = useMemo(() => {
    try {
      const raw = localStorage.getItem('child_kingdom_progress');
      const map = raw ? (JSON.parse(raw) as Record<string, { state: string }>) : {};
      return WORLDS.map(w => {
        const boss = LEVELS.find(l => l.worldId === w.id && l.type === 'boss');
        return {
          id: w.id,
          emoji: w.emoji,
          done: boss ? map[boss.id]?.state === 'completed' : false,
        };
      });
    } catch {
      return WORLDS.map(w => ({ id: w.id, emoji: w.emoji, done: false }));
    }
  }, []);

  return { totalStars, completedCount, worldDots };
}

/* ══════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════ */

export const JourneyCard: React.FC<Props> = ({ onNavigate }) => {
  const { totalStars, completedCount, worldDots } = useQuickProgress();

  return (
    <motion.button
      onClick={() => onNavigate('journey')}
      className="w-full rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 border border-purple-200/50 shadow-md text-left p-4 hover:shadow-lg transition-shadow"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏰</span>
          <div>
            <h3 className="text-sm font-bold text-purple-800 leading-tight">
              My Kingdom
            </h3>
            <p className="text-[11px] text-purple-500">
              Magical Learning Adventure
            </p>
          </div>
        </div>
        {/* Star badge */}
        <div className="flex items-center gap-1 bg-yellow-100/80 rounded-full px-2.5 py-1 text-xs font-bold text-amber-700">
          <span>⭐</span>
          {totalStars}
        </div>
      </div>

      {/* World progress dots */}
      <div className="flex items-center gap-2 mb-3">
        {worldDots.map(wd => (
          <div
            key={wd.id}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-base ${
              wd.done
                ? 'bg-green-100 border-2 border-green-400'
                : 'bg-gray-100 border border-gray-200'
            }`}
          >
            {wd.emoji}
          </div>
        ))}
      </div>

      {/* Progress bar + CTA */}
      <div className="flex items-center gap-3">
        {/* Mini progress bar */}
        <div className="flex-1 h-2 bg-gray-200/70 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (completedCount / 50) * 100)}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
          {completedCount}/50
        </span>
      </div>

      <p className="text-xs text-purple-600 font-semibold mt-2 text-center">
        {completedCount === 0
          ? '✨ Start your adventure!'
          : completedCount >= 50
            ? '👑 Kingdom Complete!'
            : '🚀 Continue your adventure!'}
      </p>
    </motion.button>
  );
};

export default JourneyCard;
