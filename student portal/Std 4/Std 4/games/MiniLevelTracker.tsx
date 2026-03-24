/**
 * 📊 MiniLevelTracker — Level Progress Indicator (CSS-only)
 * ===========================================================
 * Shows current level, difficulty badge, compact progress bar.
 * Zero framer-motion — pure CSS transitions for performance.
 */

import React from 'react';
import { DIFF_META, LEVEL_CONFIG } from './DifficultySelector';
import type { Difficulty } from './engine/questionGenerator';

/** Format level for display — safe for 10,000+ levels */
function formatLevel(level: number): string {
  if (level > 9999) return `${Math.floor(level / 1000)}K+`;
  return String(level);
}

/* ── CSS (injected once) ── */
const MLT_ID = 'mlt-css';
if (typeof document !== 'undefined' && !document.getElementById(MLT_ID)) {
  const s = document.createElement('style');
  s.id = MLT_ID;
  s.textContent = `
    @keyframes mlt-glow { 0%,100%{box-shadow:0 0 8px var(--mlt-glow)} 50%{box-shadow:0 0 16px var(--mlt-glow)} }
    .mlt-bar { transition: width 0.6s ease-out; }
  `;
  document.head.appendChild(s);
}

interface Props {
  currentLevel: number;
  completedLevels: number[];
  difficulty: Difficulty;
}

export const MiniLevelTracker: React.FC<Props> = React.memo(({ currentLevel, completedLevels, difficulty }) => {
  const meta = DIFF_META[difficulty];
  const totalLevels = LEVEL_CONFIG[difficulty];
  const completedCount = completedLevels.length;
  const pct = totalLevels > 0 ? Math.round((completedCount / totalLevels) * 100) : 0;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', maxWidth: '75%', minWidth: 320, margin: '0 auto',
        padding: '10px 18px', borderRadius: 16,
        background: 'rgba(255,255,255,0.7)',
        border: '1.5px solid rgba(255,255,255,0.45)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* Badge */}
      <div
        style={{
          width: 38, height: 38, borderRadius: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: meta.warmGrad, fontSize: 18, flexShrink: 0,
          ['--mlt-glow' as any]: meta.glowColor,
          animation: 'mlt-glow 3s ease-in-out infinite',
        }}
      >
        {meta.emoji}
      </div>

      {/* Info + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3, gap: 8 }}>
          <span style={{ fontWeight: 900, fontSize: 13, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>Level {formatLevel(currentLevel)}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap', minWidth: 50, textAlign: 'right', flexShrink: 0 }}>{completedCount}/{totalLevels} done</span>
        </div>
        <div style={{ width: '100%', height: 5, borderRadius: 99, background: 'rgba(226,232,240,0.5)', overflow: 'hidden' }}>
          <div className="mlt-bar" style={{ height: '100%', borderRadius: 99, background: meta.warmGrad, width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
});

MiniLevelTracker.displayName = 'MiniLevelTracker';
