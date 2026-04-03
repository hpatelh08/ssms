/**
 * 🚂 LevelGrid — Train-route themed level selection
 * =================================================
 * Keeps the same props + unlock rules, but renders a playful
 * S-shaped railway journey map instead of a static circle grid.
 */

import React, { useMemo } from 'react';
import type { Difficulty } from './engine/questionGenerator';
import {
  DIFF_META,
  LEVEL_CONFIG,
  QUESTIONS_PER_MINI,
  XP_PER_DIFFICULTY,
  XP_MINI_BONUS,
  DEV_UNLOCK_ALL,
} from './DifficultySelector';
import { TrainRouteLevelMap } from './TrainRouteLevelMap';

interface MiniLevelProgress { completed: boolean; score: number; total: number; }
interface DifficultyProgress { miniLevels: Record<number, MiniLevelProgress>; completed: boolean; bestScore: number; timeTaken: number; }

interface Props {
  difficulty: Difficulty;
  progress: DifficultyProgress;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

type LevelStatus = 'completed' | 'current' | 'available' | 'locked';

function getFirstIncomplete(progress: DifficultyProgress, totalLevels: number): number {
  for (let i = 1; i <= totalLevels; i++) {
    if (!progress?.miniLevels[i]?.completed) return i;
  }
  return totalLevels;
}

export const LevelGrid: React.FC<Props> = React.memo(({ difficulty, progress, onSelectLevel, onBack }) => {
  const meta = DIFF_META[difficulty];
  const totalLevels = LEVEL_CONFIG[difficulty];
  const completedCount = progress ? Object.values(progress.miniLevels).filter(m => m.completed).length : 0;
  const pct = totalLevels > 0 ? Math.round((completedCount / totalLevels) * 100) : 0;

  const current = useMemo(() => getFirstIncomplete(progress, totalLevels), [progress, totalLevels]);

  const levels = useMemo(() => {
    const items: Array<{ id: string; number: number; status: LevelStatus; stars?: number }> = [];
    for (let i = 1; i <= totalLevels; i++) {
      let status: LevelStatus = 'locked';
      if (DEV_UNLOCK_ALL) {
        status = progress?.miniLevels[i]?.completed ? 'completed' : i === current ? 'current' : 'available';
      } else if (progress?.miniLevels[i]?.completed) {
        status = 'completed';
      } else if (i === current) {
        status = 'current';
      } else if (i < current) {
        status = 'available';
      } else {
        status = 'locked';
      }
      let stars: number | undefined;
      if (status === 'completed' && progress?.miniLevels[i]) {
        const { score, total } = progress.miniLevels[i]!;
        const perfect = score === total;
        const great = score >= Math.ceil(total * 0.6);
        stars = perfect ? 3 : great ? 2 : 1;
      }
      items.push({ id: `${difficulty}-${i}`, number: i, status, stars });
    }
    return items;
  }, [difficulty, progress, current, totalLevels]);

  return (
    <div style={{
      maxWidth: 1400,
      margin: '0 auto',
      padding: '0 clamp(16px, 4vw, 60px) clamp(16px, 3vw, 40px)',
      minHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Difficulty Header Card (kept) */}
      <div style={{
        width: '100%',
        background: meta.cardGrad,
        border: '1.5px solid rgba(255,255,255,0.6)',
        borderRadius: 24,
        padding: 'clamp(16px, 2vw, 28px) clamp(20px, 3vw, 36px)',
        marginBottom: 18,
        boxShadow: `0 4px 24px rgba(0,0,0,0.04), 0 2px 8px ${meta.glowColor}`,
        position: 'relative',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap', minWidth: 0 }}>
          <button
            onClick={onBack}
            style={{
              width: 48, height: 48, borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, background: 'rgba(255,255,255,0.8)',
              border: '1.5px solid rgba(226,232,240,0.5)',
              cursor: 'pointer', fontWeight: 700, color: '#6B7280',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              flexShrink: 0,
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
            aria-label="Back"
          >
            ←
          </button>
          <div
            style={{
              width: 56, height: 56, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, background: meta.warmGrad, flexShrink: 0,
              boxShadow: `0 4px 16px ${meta.glowColor}`,
            }}
          >
            {meta.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {meta.label} Levels
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7280', fontWeight: 600, marginTop: 3 }}>
              {completedCount} of {totalLevels} completed
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, minWidth: 0 }}>
            <span style={{
              fontSize: 24, fontWeight: 900,
              background: meta.warmGrad,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}>
              {pct}%
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: meta.accentColor + 'AA', whiteSpace: 'nowrap' }}>
              ✨ +{XP_PER_DIFFICULTY[difficulty]} XP/Q
            </span>
          </div>
        </div>

        <div style={{
          width: '100%', height: 12, borderRadius: 99,
          background: 'rgba(226,232,240,0.4)',
          overflow: 'hidden', marginBottom: 12,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: meta.warmGrad,
            width: `${pct}%`,
            boxShadow: `0 0 12px ${meta.glowColor}`,
            transition: 'width 0.6s ease-out',
          }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13 }}>🎯</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
            {QUESTIONS_PER_MINI} questions per level
          </span>
          <span style={{ color: '#D1D5DB' }}>•</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: meta.accentColor + 'BB' }}>
            +{XP_MINI_BONUS} XP per level
          </span>
        </div>
      </div>

      <TrainRouteLevelMap
        difficulty={difficulty}
        levels={levels}
        onSelectLevel={onSelectLevel}
      />
    </div>
  );
});

LevelGrid.displayName = 'LevelGrid';

