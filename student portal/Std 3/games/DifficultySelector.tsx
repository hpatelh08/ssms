/**
 * 🎚️ DifficultySelector — Premium Interactive Cards
 * =====================================================
 * 140–160px tall gradient cards with glass effect, 60px circular icons,
 * animated progress bars, play arrow with hover glow.
 * CSS-only transitions. ONE component used by ALL game types.
 *
 * DEV_UNLOCK_ALL flag: Set true to bypass 70% threshold.
 */

import React from 'react';
import type { Difficulty } from './engine/questionGenerator';

/* ═══════════════════════════════════════════
   🔓 DEV FLAG — set false for production
   ═══════════════════════════════════════════ */
export const DEV_UNLOCK_ALL = true;

export const DIFFICULTIES: Difficulty[] = ['easy', 'intermediate', 'difficult'];

export const DIFF_META: Record<Difficulty, {
  label: string; emoji: string; gradient: string; ring: string; bg: string;
  warmGrad: string; glowColor: string; accentColor: string; lightBg: string;
  cardGrad: string; cardGradHover: string;
}> = {
  easy: {
    label: 'Easy', emoji: '🌿', gradient: 'from-green-400 to-emerald-400', ring: 'ring-green-400', bg: 'bg-green-50',
    warmGrad: 'linear-gradient(135deg, #10B981, #34D399)', glowColor: 'rgba(16,185,129,0.3)', accentColor: '#6EE7B7', lightBg: 'rgba(167,243,208,0.15)',
    cardGrad: 'linear-gradient(135deg, rgba(16,185,129,0.24) 0%, rgba(16,185,129,0.08) 45%, rgba(15,23,42,0.84) 100%)',
    cardGradHover: 'linear-gradient(135deg, rgba(16,185,129,0.32) 0%, rgba(16,185,129,0.12) 45%, rgba(15,23,42,0.9) 100%)',
  },
  intermediate: {
    label: 'Intermediate', emoji: '⭐', gradient: 'from-amber-400 to-yellow-400', ring: 'ring-amber-400', bg: 'bg-amber-50',
    warmGrad: 'linear-gradient(135deg, #F59E0B, #FBBF24)', glowColor: 'rgba(245,158,11,0.3)', accentColor: '#FCD34D', lightBg: 'rgba(253,230,138,0.15)',
    cardGrad: 'linear-gradient(135deg, rgba(245,158,11,0.24) 0%, rgba(245,158,11,0.08) 45%, rgba(15,23,42,0.84) 100%)',
    cardGradHover: 'linear-gradient(135deg, rgba(245,158,11,0.32) 0%, rgba(245,158,11,0.12) 45%, rgba(15,23,42,0.9) 100%)',
  },
  difficult: {
    label: 'Hard', emoji: '🔥', gradient: 'from-rose-400 to-orange-400', ring: 'ring-red-400', bg: 'bg-red-50',
    warmGrad: 'linear-gradient(135deg, #F43F5E, #FB7185)', glowColor: 'rgba(244,63,94,0.25)', accentColor: '#FDA4AF', lightBg: 'rgba(254,202,202,0.15)',
    cardGrad: 'linear-gradient(135deg, rgba(244,63,94,0.24) 0%, rgba(244,63,94,0.08) 45%, rgba(15,23,42,0.84) 100%)',
    cardGradHover: 'linear-gradient(135deg, rgba(244,63,94,0.32) 0%, rgba(244,63,94,0.12) 45%, rgba(15,23,42,0.9) 100%)',
  },
};

export const XP_PER_DIFFICULTY: Record<Difficulty, number> = { easy: 2, intermediate: 5, difficult: 10 };
export const XP_MINI_BONUS = 20;
export const XP_DIFF_BONUS = 50;
export const XP_ALL_BONUS = 150;
export const QUESTIONS_PER_MINI = 5;

/** 40 Easy / 30 Intermediate / 30 Difficult = 100 levels per game */
export const LEVEL_CONFIG: Record<Difficulty, number> = { easy: 40, intermediate: 30, difficult: 30 };

/** @deprecated Use LEVEL_CONFIG[difficulty] instead */
export const MINI_LEVELS = 5;

/** 70% of previous difficulty must be completed to unlock next */
export const UNLOCK_THRESHOLD = 0.7;

/** Check if a difficulty is unlocked based on progress.
 *  Respects DEV_UNLOCK_ALL flag for development. */
export function isDifficultyUnlocked(
  progress: Record<Difficulty, DifficultyProgress>,
  difficulty: Difficulty,
): boolean {
  if (DEV_UNLOCK_ALL) return true;
  if (difficulty === 'easy') return true;
  if (difficulty === 'intermediate') {
    const easyDone = progress.easy ? Object.values(progress.easy.miniLevels).filter(m => m.completed).length : 0;
    return easyDone >= Math.ceil(LEVEL_CONFIG.easy * UNLOCK_THRESHOLD);
  }
  // difficult
  const intDone = progress.intermediate ? Object.values(progress.intermediate.miniLevels).filter(m => m.completed).length : 0;
  return intDone >= Math.ceil(LEVEL_CONFIG.intermediate * UNLOCK_THRESHOLD);
}

/** Get unlock requirement text */
function getUnlockText(difficulty: Difficulty): string {
  if (difficulty === 'intermediate') {
    return 'Complete Easy first to unlock Intermediate';
  }
  return 'Complete Intermediate first to unlock Hard';
}

interface MiniLevelProgress { completed: boolean; score: number; total: number; }
export interface DifficultyProgress { miniLevels: Record<number, MiniLevelProgress>; completed: boolean; bestScore: number; timeTaken: number; }
export type DifficultyUnlockState = Record<Difficulty, boolean>;

interface Props {
  onSelect: (d: Difficulty) => void;
  onLockedSelect?: (d: Difficulty) => void;
  progress: Record<Difficulty, DifficultyProgress>;
  unlockState?: DifficultyUnlockState;
}

/* ── CSS keyframes — injected once ── */
const DS_STYLE_ID = 'ds-pro-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(DS_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = DS_STYLE_ID;
  s.textContent = `
    @keyframes ds-glow-pulse {
      0%,100% { box-shadow: 0 0 16px var(--ds-glow), 0 4px 12px rgba(0,0,0,0.04); }
      50% { box-shadow: 0 0 32px var(--ds-glow), 0 6px 20px rgba(0,0,0,0.06); }
    }
    @keyframes ds-play-glow {
      0%,100% { box-shadow: 0 0 0 0 var(--ds-glow); }
      50% { box-shadow: 0 0 16px 4px var(--ds-glow); }
    }
    @keyframes ds-icon-float {
      0%,100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    .ds-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      -webkit-tap-highlight-color: transparent;
      outline: none;
    }
    .ds-card:not(.ds-locked):hover { transform: translateY(-4px) scale(1.01); }
    .ds-card:not(.ds-locked):active { transform: scale(0.98); }
    .ds-card.ds-locked { opacity: 0.82; cursor: not-allowed; filter: saturate(0.85); }
    .ds-bar-fill { transition: width 0.8s ease-out; }
    .ds-play-btn {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .ds-card:not(.ds-locked):hover .ds-play-btn {
      transform: scale(1.1);
      animation: ds-play-glow 1.5s ease-in-out infinite;
    }
  `;
  document.head.appendChild(s);
}

export const DifficultySelector: React.FC<Props> = React.memo(({ onSelect, onLockedSelect, progress, unlockState }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 760, margin: '0 auto', padding: '0 clamp(8px, 2vw, 20px)' }}>
    {/* Title */}
    <div style={{ textAlign: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 36, display: 'inline-block', marginBottom: 6 }}>🎯</span>
      <h3 style={{ fontSize: 15, fontWeight: 900, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.18em', margin: 0 }}>
        Choose Difficulty
      </h3>
      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>100 levels per game &bull; 5 questions each</p>
    </div>

    {DIFFICULTIES.map((d) => {
      const meta = DIFF_META[d];
      const dp = progress[d];
      const isComplete = dp?.completed;
      const totalLevels = LEVEL_CONFIG[d];
      const doneLevels = dp ? (Object.values(dp.miniLevels) as MiniLevelProgress[]).filter(m => m.completed).length : 0;
      const pct = totalLevels > 0 ? Math.round((doneLevels / totalLevels) * 100) : 0;
      const locked = unlockState ? !unlockState[d] : !isDifficultyUnlocked(progress, d);

      return (
        <button
          key={d}
          onClick={() => {
            if (locked) {
              onLockedSelect?.(d);
              return;
            }
            onSelect(d);
          }}
          className={`ds-card ${locked ? 'ds-locked' : ''}`}
          style={{
            position: 'relative',
            width: '100%',
            textAlign: 'left',
            overflow: 'hidden',
            borderRadius: 24,
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: locked ? 'not-allowed' : 'pointer',
            ['--ds-glow' as any]: meta.glowColor,
          }}
        >
          {/* Card body — 140–160px tall, glass effect */}
          <div
            style={{
              position: 'relative',
              minHeight: 148,
              padding: '22px 28px',
              borderRadius: 24,
              background: meta.cardGrad,
              border: `1px solid ${isComplete ? `${meta.accentColor}80` : 'rgba(148,163,184,0.2)'}`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              animation: !locked ? 'ds-glow-pulse 3.5s ease-in-out infinite' : 'none',
              boxShadow: locked
                ? '0 10px 26px rgba(2,6,23,0.22)'
                : `0 16px 36px rgba(2,6,23,0.3), 0 1px 0 inset rgba(255,255,255,0.08)`,
              overflow: 'hidden',
            }}
          >
            {/* Glass shimmer overlay */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
              borderRadius: '24px 24px 0 0',
              pointerEvents: 'none',
            }} />

            {/* Crown badge for completed */}
            {isComplete && (
              <div style={{
                position: 'absolute', top: -2, right: -2, zIndex: 20,
                width: 40, height: 40, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, background: meta.warmGrad,
                boxShadow: `0 4px 16px ${meta.glowColor}`,
                border: '2px solid rgba(255,255,255,0.6)',
              }}>
                👑
              </div>
            )}

            {/* Main content row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 2 }}>
              {/* Big circular icon (60px) */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, flexShrink: 0, position: 'relative',
                background: locked ? 'rgba(71,85,105,0.5)' : meta.warmGrad,
                boxShadow: locked ? 'none' : `0 6px 20px ${meta.glowColor}`,
                border: '2px solid rgba(255,255,255,0.45)',
                animation: locked ? 'none' : 'ds-icon-float 3s ease-in-out infinite',
              }}>
                {locked ? '🔒' : meta.emoji}
              </div>

              {/* Text + progress bar (center section) */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                  <p style={{
                    fontWeight: 900, fontSize: 20, margin: 0,
                    color: locked ? '#64748B' : isComplete ? meta.accentColor : '#F8FAFC',
                    letterSpacing: '-0.01em',
                  }}>
                    {meta.label}
                  </p>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: '#94A3B8',
                    background: 'rgba(15,23,42,0.6)', borderRadius: 8, padding: '2px 8px', border: '1px solid rgba(148,163,184,0.2)',
                  }}>
                    {totalLevels} levels
                  </span>
                </div>

                <p style={{ fontSize: 12, fontWeight: 600, margin: 0, marginBottom: 10, color: locked ? '#64748B' : '#CBD5E1' }}>
                  {locked
                    ? getUnlockText(d)
                    : isComplete
                      ? '🏆 All levels cleared!'
                      : doneLevels > 0
                        ? `${doneLevels}/${totalLevels} levels completed`
                        : `${totalLevels * QUESTIONS_PER_MINI} questions to explore`
                  }
                </p>

                {/* Full-width animated progress bar */}
                <div style={{ width: '100%', height: 10, borderRadius: 99, background: 'rgba(15,23,42,0.68)', border: '1px solid rgba(148,163,184,0.16)', overflow: 'hidden' }}>
                  <div
                    className="ds-bar-fill"
                    style={{
                      height: '100%',
                      borderRadius: 99,
                      background: meta.warmGrad,
                      width: `${pct}%`,
                      boxShadow: pct > 0 ? `0 0 8px ${meta.glowColor}` : 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>
                    ✨ +{XP_PER_DIFFICULTY[d]} XP/question &bull; +{XP_MINI_BONUS} XP/level
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: meta.accentColor }}>{pct}%</span>
                </div>
              </div>

              {/* Play arrow button with hover glow */}
              <div
                className="ds-play-btn"
                style={{
                  flexShrink: 0, width: 52, height: 52, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                  background: locked
                    ? 'rgba(71,85,105,0.45)'
                    : isComplete
                      ? meta.warmGrad
                      : 'rgba(15,23,42,0.72)',
                  color: locked ? '#94A3B8' : isComplete ? '#fff' : meta.accentColor,
                  boxShadow: locked
                    ? 'none'
                    : isComplete
                      ? `0 4px 16px ${meta.glowColor}`
                      : '0 8px 20px rgba(2,6,23,0.25)',
                  border: locked ? '1px solid rgba(148,163,184,0.24)' : `2px solid ${meta.glowColor}`,
                  ['--ds-glow' as any]: meta.glowColor,
                }}
              >
                {locked ? '🔒' : isComplete ? '✓' : '▶'}
              </div>
            </div>
          </div>
        </button>
      );
    })}
  </div>
));

DifficultySelector.displayName = 'DifficultySelector';
