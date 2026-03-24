/**
 * 🎮 LevelGrid — Full-Height Static Grid (No Scroll)
 * =====================================================
 * All levels visible at once. No internal scroll container.
 *
 * Layout:
 *   Easy (40 levels) → 8 columns × 5 rows
 *   Intermediate (30) → 6 columns × 5 rows
 *   Difficult (30) → 6 columns × 5 rows
 *
 * Circle size: 110-120px, 22px font, 3px border, 30px gap.
 * Responsive: shrinks to 90px circles on small screens.
 *
 * States:
 *   Completed → Filled gradient + white number + gold star + soft glow
 *   Current → Pulsing + scale(1.05) + bright gradient
 *   Not Played → White bg + colored border + hover lift
 *   Locked → Faded + lock icon
 */

import React, { useMemo, useCallback } from 'react';
import type { Difficulty } from './engine/questionGenerator';
import { DIFF_META, LEVEL_CONFIG, QUESTIONS_PER_MINI, XP_PER_DIFFICULTY, XP_MINI_BONUS, DEV_UNLOCK_ALL } from './DifficultySelector';
import { GamePathMap } from './GamePathMap';

/** Format level for display — safe for 10,000+ levels */
function formatLevel(level: number): string {
  if (level > 9999) return `${Math.floor(level / 1000)}K+`;
  return String(level);
}

/* ── CSS (injected once) ── */
const LG_ID = 'lg-pro-css-v2';
if (typeof document !== 'undefined' && !document.getElementById(LG_ID)) {
  const s = document.createElement('style');
  s.id = LG_ID;
  s.textContent = `
    /* Global flex overflow safety */
    .lg-grid-wrapper *, .lg-grid-wrapper { min-width: 0; }
    @keyframes lg-pulse {
      0%,100% { box-shadow: 0 0 0 0 var(--lg-glow); }
      50% { box-shadow: 0 0 0 10px transparent; }
    }
    @keyframes lg-float {
      0%,100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    @keyframes lg-badge-glow {
      0%,100% { filter: drop-shadow(0 0 4px var(--lg-glow)); }
      50% { filter: drop-shadow(0 0 12px var(--lg-glow)); }
    }
    @keyframes lg-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .lg-cell-v2 {
      transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease, opacity 0.2s ease;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      will-change: transform;
    }
    .lg-cell-v2:not(.lg-locked-v2):hover {
      transform: scale(1.08) translateY(-4px);
    }
    .lg-cell-v2:not(.lg-locked-v2):active { transform: scale(0.95); }
    .lg-cell-v2.lg-locked-v2 { opacity: 0.3; cursor: not-allowed; }
    .lg-cell-v2.lg-current-v2 {
      animation: lg-pulse 2s ease-in-out infinite;
      transform: scale(1.05);
    }
    .lg-cell-v2.lg-current-v2:hover { transform: scale(1.12) translateY(-4px); }
    .lg-cell-v2.lg-done-v2 {
      box-shadow: 0 6px 24px var(--lg-glow);
    }
    .lg-cell-v2.lg-done-v2:hover {
      box-shadow: 0 8px 30px var(--lg-glow);
    }
    .lg-bar-v2 { 
      transition: width 0.6s ease-out;
      position: relative;
      overflow: hidden;
    }
    .lg-bar-v2::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      background-size: 200% 100%;
      animation: lg-shimmer 2.5s ease-in-out infinite;
    }
    .lg-back-v2 { transition: transform 0.15s ease; }
    .lg-back-v2:hover { transform: translateX(-3px); }
    .lg-back-v2:active { transform: scale(0.95); }
    .lg-grid-wrapper {
      display: grid;
      justify-content: center;
      align-items: center;
    }
    @media (max-width: 900px) {
      .lg-cell-v2 { width: 90px !important; height: 90px !important; }
      .lg-grid-wrapper { gap: 16px !important; }
    }
    @media (max-width: 600px) {
      .lg-cell-v2 { width: 72px !important; height: 72px !important; }
      .lg-grid-wrapper { gap: 12px !important; grid-template-columns: repeat(5, 1fr) !important; }
    }
  `;
  document.head.appendChild(s);
}

interface MiniLevelProgress { completed: boolean; score: number; total: number; }
interface DifficultyProgress { miniLevels: Record<number, MiniLevelProgress>; completed: boolean; bestScore: number; timeTaken: number; }

interface Props {
  difficulty: Difficulty;
  progress: DifficultyProgress;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

/* ── Difficulty color palettes ── */
const PALETTE: Record<Difficulty, {
  completedGrad: string; currentGrad: string; borderColor: string;
  hoverShadow: string; starColor: string;
}> = {
  easy: {
    completedGrad: 'linear-gradient(135deg, #34D399, #10B981)',
    currentGrad: 'linear-gradient(135deg, #A7F3D0, #6EE7B7)',
    borderColor: '#34D399',
    hoverShadow: 'rgba(52,211,153,0.35)',
    starColor: '#F59E0B',
  },
  intermediate: {
    completedGrad: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
    currentGrad: 'linear-gradient(135deg, #FDE68A, #FCD34D)',
    borderColor: '#F59E0B',
    hoverShadow: 'rgba(245,158,11,0.35)',
    starColor: '#F59E0B',
  },
  difficult: {
    completedGrad: 'linear-gradient(135deg, #F472B6, #A855F7)',
    currentGrad: 'linear-gradient(135deg, #FECDD3, #FCA5A5)',
    borderColor: '#E11D48',
    hoverShadow: 'rgba(225,29,72,0.3)',
    starColor: '#F59E0B',
  },
};

/* ── Single Circle Cell (memoized) ── */
const LevelCell: React.FC<{
  level: number;
  status: 'completed' | 'current' | 'locked' | 'available';
  difficulty: Difficulty;
  meta: typeof DIFF_META.easy;
  onClick: () => void;
}> = React.memo(({ level, status, difficulty, meta, onClick }) => {
  const pal = PALETTE[difficulty];

  const bg =
    status === 'completed' ? pal.completedGrad
    : status === 'current' ? pal.currentGrad
    : 'rgba(255,255,255,0.85)';

  const border =
    status === 'completed' ? '3px solid rgba(255,255,255,0.5)'
    : status === 'current' ? `3px solid ${pal.borderColor}`
    : status === 'available' ? `3px solid ${pal.borderColor}55`
    : '3px solid rgba(200,200,200,0.2)';

  const cls =
    status === 'locked' ? 'lg-cell-v2 lg-locked-v2'
    : status === 'current' ? 'lg-cell-v2 lg-current-v2'
    : status === 'completed' ? 'lg-cell-v2 lg-done-v2'
    : 'lg-cell-v2';

  return (
    <button
      onClick={status !== 'locked' ? onClick : undefined}
      disabled={status === 'locked'}
      className={cls}
      style={{
        width: 115,
        height: 115,
        borderRadius: '50%',
        border,
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: status === 'locked' ? 'not-allowed' : 'pointer',
        padding: 0,
        position: 'relative',
        boxShadow: status === 'completed'
          ? `0 6px 24px ${pal.hoverShadow}`
          : status === 'current'
            ? `0 4px 20px ${pal.hoverShadow}`
            : '0 2px 8px rgba(0,0,0,0.06)',
        ['--lg-glow' as any]: meta.glowColor,
      }}
    >
      {/* Level number */}
      <span style={{
        fontWeight: 900,
        fontSize: status === 'locked' ? 18 : 22,
        color: status === 'completed' ? '#fff'
          : status === 'current' ? meta.accentColor
          : status === 'available' ? meta.accentColor + 'AA'
          : '#C0C0C0',
        lineHeight: 1,
        textShadow: status === 'completed' ? '0 1px 3px rgba(0,0,0,0.2)' : undefined,
        maxWidth: '80%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {status === 'locked' ? '🔒' : formatLevel(level)}
      </span>

      {/* PLAY badge for current */}
      {status === 'current' && (
        <span style={{
          fontSize: 9, fontWeight: 900, marginTop: 4,
          color: meta.accentColor, letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          PLAY
        </span>
      )}

      {/* Gold star for completed */}
      {status === 'completed' && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          fontSize: 16,
          filter: 'drop-shadow(0 2px 4px rgba(245,158,11,0.5))',
        }}>
          ⭐
        </span>
      )}

      {/* Checkmark overlay for completed */}
      {status === 'completed' && (
        <span style={{
          fontSize: 10, fontWeight: 800,
          color: 'rgba(255,255,255,0.7)',
          marginTop: 2,
        }}>
          ✓
        </span>
      )}
    </button>
  );
});
LevelCell.displayName = 'LevelCell';

/* ── Main Grid ── */
export const LevelGrid: React.FC<Props> = React.memo(({ difficulty, progress, onSelectLevel, onBack }) => {
  const meta = DIFF_META[difficulty];
  const pal = PALETTE[difficulty];
  const totalLevels = LEVEL_CONFIG[difficulty];
  const completedCount = progress ? Object.values(progress.miniLevels).filter(m => m.completed).length : 0;

  // Grid columns: 8 for 40 levels, 6 for 30 levels
  const columns = totalLevels === 40 ? 8 : 6;

  const currentLevel = useMemo(() => {
    for (let i = 1; i <= totalLevels; i++) {
      if (!progress?.miniLevels[i]?.completed) return i;
    }
    return totalLevels;
  }, [progress, totalLevels]);

  const getStatus = useCallback((level: number): 'completed' | 'current' | 'available' | 'locked' => {
    if (progress?.miniLevels[level]?.completed) return 'completed';
    if (level === currentLevel) return 'current';
    if (DEV_UNLOCK_ALL) return 'available';
    return 'locked';
  }, [progress, currentLevel]);

  const levels = useMemo(() => Array.from({ length: totalLevels }, (_, i) => i + 1), [totalLevels]);
  const pct = totalLevels > 0 ? Math.round((completedCount / totalLevels) * 100) : 0;

  return (
    <div style={{
      width: '100%',
      maxWidth: 1400,
      margin: '0 auto',
      padding: 'clamp(16px, 3vw, 40px) clamp(16px, 4vw, 60px)',
      minHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Difficulty Header Card ── */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(135deg, #e6f7e9, #d1f2d8)',
        border: '1.5px solid rgba(255,255,255,0.7)',
        borderRadius: 22,
        padding: '24px 36px',
        marginBottom: 32,
        boxShadow: '0 15px 40px rgba(0,0,0,0.08)',
        position: 'relative',
        boxSizing: 'border-box',
      }}>
        {/* Back + Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap', minWidth: 0 }}>
          <button
            onClick={onBack}
            className="lg-back-v2"
            style={{
              width: 48, height: 48, borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, background: 'rgba(255,255,255,0.8)',
              border: '1.5px solid rgba(226,232,240,0.5)',
              cursor: 'pointer', fontWeight: 700, color: '#6B7280',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              flexShrink: 0,
            }}
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
          {/* XP indicator */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
            flexShrink: 0, minWidth: 0,
          }}>
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

        {/* Full-width progress bar */}
        <div style={{
          width: '100%', height: 14, borderRadius: 99,
          background: 'rgba(209, 250, 229, 0.5)',
          overflow: 'hidden', marginBottom: 14,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
        }}>
          <div
            className="lg-bar-v2"
            style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, #34d399, #10b981)',
              width: `${pct}%`,
              boxShadow: '0 0 15px rgba(52, 211, 153, 0.5)',
            }}
          />
        </div>

        {/* XP reward line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13 }}>🎯</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
            {QUESTIONS_PER_MINI} questions per level
          </span>
          <span style={{ color: '#D1D5DB' }}>•</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>
            +{XP_MINI_BONUS} XP per level
          </span>
        </div>
      </div>

      {/* ── Static Level Grid (NO SCROLL) ── */}
      <GamePathMap
        difficulty={difficulty}
        totalLevels={totalLevels}
        progress={progress}
        currentLevel={currentLevel}
        onSelectLevel={onSelectLevel}
        getStatus={getStatus}
      />
    </div>
  );
});

LevelGrid.displayName = 'LevelGrid';
