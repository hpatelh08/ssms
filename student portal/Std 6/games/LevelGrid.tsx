/**
 * ðŸŽ® LevelGrid â€” Full-Height Static Grid (No Scroll)
 * =====================================================
 * All levels visible at once. No internal scroll container.
 *
 * Layout:
 *   Easy (40 levels) â†’ 8 columns Ã— 5 rows
 *   Intermediate (30) â†’ 6 columns Ã— 5 rows
 *   Difficult (30) â†’ 6 columns Ã— 5 rows
 *
 * Circle size: 110-120px, 22px font, 3px border, 30px gap.
 * Responsive: shrinks to 90px circles on small screens.
 *
 * States:
 *   Completed â†’ Filled gradient + white number + gold star + soft glow
 *   Current â†’ Pulsing + scale(1.05) + bright gradient
 *   Not Played â†’ White bg + colored border + hover lift
 *   Locked â†’ Faded + lock icon
 */

import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import type { Difficulty } from './engine/questionGenerator';
import { DIFF_META, LEVEL_CONFIG, QUESTIONS_PER_MINI, XP_PER_DIFFICULTY, XP_MINI_BONUS, DEV_UNLOCK_ALL } from './DifficultySelector';

/** Format level for display â€” safe for 10,000+ levels */
function formatLevel(level: number): string {
  if (level > 9999) return `${Math.floor(level / 1000)}K+`;
  return String(level);
}

/* â”€â”€ CSS (injected once) â”€â”€ */
/* Helpers */
/** Candy-Crush style "snake" ordering (alternate row direction) */
function toSnakeOrder(levels: number[], columns: number): number[] {
  if (columns <= 1) return levels;
  const ordered: number[] = [];
  for (let rowStart = 0, row = 0; rowStart < levels.length; rowStart += columns, row++) {
    const slice = levels.slice(rowStart, rowStart + columns);
    if (row % 2 === 1) slice.reverse();
    ordered.push(...slice);
  }
  return ordered;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (event: { matches: boolean }) => setMatches(event.matches);

    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);

    setMatches(mql.matches);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

/* CSS (injected once) â€” scoped to .lg-* game section classes only */
const LG_ID = 'lg-pro-css-v2';
if (typeof document !== 'undefined' && !document.getElementById(LG_ID)) {
  const s = document.createElement('style');
  s.id = LG_ID;
  s.textContent = `
    /* â”€â”€ keyframes â”€â”€ */
    @keyframes lg-badge-glow {
      0%,100% { filter: drop-shadow(0 0 4px var(--lg-glow,#FFB300)); }
      50%      { filter: drop-shadow(0 0 14px var(--lg-glow,#FFB300)); }
    }
    @keyframes lg-node-bob {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-5px); }
    }
    @keyframes lg-mine-current-pulse {
      0%,100% {
        box-shadow:
          inset 0 3px 8px rgba(255,255,255,0.55),
          0 8px 28px rgba(255,120,0,0.65),
          0 0 22px rgba(255,200,0,0.45);
      }
      50% {
        box-shadow:
          inset 0 3px 8px rgba(255,255,255,0.55),
          0 8px 36px rgba(255,120,0,0.9),
          0 0 40px rgba(255,200,0,0.75);
      }
    }
    @keyframes lg-mine-done-bob {
      0%,100% { transform: translateY(0) scale(1); }
      50%      { transform: translateY(-5px) scale(1.03); }
    }
    /* â”€â”€ mine node buttons â”€â”€ */
    .lg-mine-node {
      transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      will-change: transform;
    }
    .lg-mine-node:not(.lg-locked-v2):hover  { transform: scale(1.15) translateY(-6px); }
    .lg-mine-node:not(.lg-locked-v2):active { transform: scale(0.93); }
    .lg-mine-node.lg-locked-v2  { opacity: 0.5; cursor: not-allowed; }
    .lg-mine-node.lg-mine-current { animation: lg-mine-current-pulse 1.8s ease-in-out infinite; }
    .lg-mine-node.lg-mine-done    { animation: lg-mine-done-bob 2.8s ease-in-out infinite; }
    /* â”€â”€ header â”€â”€ */
    .lg-bar-v2   { transition: width 0.65s ease-out; }
    .lg-back-v2  { transition: transform 0.15s ease; }
    .lg-back-v2:hover  { transform: translateX(-3px); }
    .lg-back-v2:active { transform: scale(0.95); }
    /* â”€â”€ gold mine map container â”€â”€ */
    .lg-mine-map {
      position: relative;
      width: 100%;

      margin: 0 auto;
      border-radius: 20px;
      overflow: hidden;
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

/* â”€â”€ Difficulty color palettes â”€â”€ */
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
/* ── Image-based Level Cell ── */
// Maps level status to the correct button image
const BTN_IMG: Record<string, string> = {
  current:   '/assets/buttons/play level button.png',
  locked:    '/assets/buttons/next level button.png',
  available: '/assets/buttons/next level button.png',
};

const LevelCell: React.FC<{
  level: number;
  status: 'completed' | 'current' | 'locked' | 'available';
  stars: number;
  difficulty: Difficulty;
  meta: typeof DIFF_META.easy;
  onClick: () => void;
}> = React.memo(({ level, status, stars, onClick }) => {
  const completedImg =
    stars >= 3
      ? '/assets/buttons/three-star-button.png'
      : stars === 2
        ? '/assets/buttons/two-star-button.png'
        : '/assets/buttons/one-star-button.png';
  const imgSrc = status === 'completed' ? completedImg : (BTN_IMG[status] ?? BTN_IMG.locked);

  const cls =
    status === 'locked'    ? 'lg-mine-node lg-locked-v2'   :
    status === 'current'   ? 'lg-mine-node lg-mine-current' :
    status === 'completed' ? 'lg-mine-node lg-mine-done'    :
    'lg-mine-node';

  return (
    <button
      onClick={status !== 'locked' ? onClick : undefined}
      disabled={status === 'locked'}
      className={cls}
      style={{
        position: 'relative',
        width: 96, height: 96,
        padding: 0,
        background: 'none',
        border: 'none',
        borderRadius: '50%',
        cursor: status === 'locked' ? 'not-allowed' : 'pointer',
        opacity: status === 'locked' ? 0.55 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Button image fills the entire circle */}
      <img
        src={imgSrc}
        alt={`level ${level} ${status}`}
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Level number or lock icon -- layered above the image */}
      <span style={{
        position: 'relative',
        zIndex: 2,
        fontWeight: 900,
        fontSize: status === 'locked' ? 18 : 17,
        lineHeight: 1,
        color: '#FFFFFF',
        textShadow: '0 1px 5px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.6)',
        maxWidth: '70%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {status === 'locked' ? String.fromCodePoint(0x1F512) : formatLevel(level)}
      </span>

      {/* Checkmark -- completed level */}
      {status === 'completed' && (
        <span style={{
          position: 'relative',
          zIndex: 2,
          fontSize: 10, fontWeight: 800,
          color: 'rgba(255,255,255,0.85)',
          marginTop: 2,
          textShadow: '0 1px 3px rgba(0,0,0,0.7)',
        }}>{String.fromCodePoint(0x2713)}</span>
      )}
    </button>
  );
});
LevelCell.displayName = 'LevelCell';

/**
 * MINE_ROAD_POSITIONS â€” 40 hand-tuned coordinates that align with the
 * bright dirt road S-curve in the gold mine background image.
 *
 * top  : % of the 5200px tall container (edit to shift a button up/down)
 * left : % of container width           (edit to shift a button left/right)
 *
 * Road landmarks (to aid future tuning):
 *   Levels  1-10  â†’ sweeps rightâ†’left  (60% â†’ 40%)
 *   Levels 11-20  â†’ sweeps leftâ†’right  (40% â†’ 58%)
 *   Levels 21-30  â†’ sweeps rightâ†’left  (58% â†’ 40%)
 *   Levels 31-40  â†’ sweeps leftâ†’right  (40% â†’ 55%)
 */
// Coordinates follow the bright lit dirt path winding through the cave.
// top = % of 3800px container | left = % of container width
// Sweep 1 (1-10):  right-to-left (cave narrows)
// Sweep 2 (11-20): left-to-right (waterfall glow zone)
// Sweep 3 (21-30): right-to-left (lower cavern)
// Sweep 4 (31-40): centre recovery (deep mine floor)
const MINE_ROAD_POSITIONS: { top: number; left: number }[] = [
  { top:  16.0, left: 62 }, // 1  -- cave entrance, upper-right
  { top:  18.5, left: 58 }, // 2
  { top:  20.0, left: 45 }, // 3
  { top:  22.0, left: 40 }, // 4
  { top: 24.5, left: 40 }, // 5
  { top: 27.0, left: 44 }, // 6
  { top: 28.5, left: 60 }, // 7
  { top: 30.5, left: 48 }, // 8
  { top: 32.0, left: 70 }, // 9
  { top: 33.5, left: 44 }, // 10 -- left apex
  { top: 35.0, left: 60 }, // 11
  { top: 37.0, left: 40 }, // 12
  { top: 39.5, left: 45 }, // 13
  { top: 42.5, left: 45 }, // 14
  { top: 45.0, left: 30 }, // 15
  { top: 46.5, left: 50 }, // 16
  { top: 48.0, left: 70 }, // 17
  { top: 50.5, left: 60 }, // 18
  { top: 52.0, left: 40 }, // 19
  { top: 54.5, left: 30 }, // 20 -- right apex
  { top: 57.0, left: 48 }, // 21
  { top: 58, left: 78 }, // 22
  { top: 61.0, left: 71 }, // 23
  { top: 63, left: 52 }, // 24
  { top: 64.5, left: 71 }, // 25
  { top: 67.5, left: 70 }, // 26
  { top: 70.0, left: 60 }, // 27
  { top: 72.5, left: 70 }, // 28
  { top: 74.0, left: 50 }, // 29
  { top: 76.5, left: 60 }, // 30 -- left apex
  { top: 79.0, left: 58 }, // 31
  { top: 81.7, left: 52 }, // 32
  { top: 84.0, left: 38 }, // 33
  { top: 86.5, left: 50 }, // 34
  { top: 88.5, left: 40 }, // 35
  { top: 91.2, left: 36 }, // 36
  { top: 93.5, left: 44 }, // 37
  { top: 95.5, left: 56 }, // 38
  { top: 97.5, left: 65 }, // 39
  { top: 99.0, left: 80 }, // 40 -- deep mine floor
];

/* ── Gold Mine Level Map ──────────────────────────────────────────────────
 * Uses MINE_ROAD_POSITIONS (above) for pixel-accurate road alignment.
 * No SVG, no getPointAtLength — just absolute % coordinates on the image.
 * Container is 3800px tall so every level gets ~90px of vertical space.
 * ─────────────────────────────────────────────────────────────────────── */
const RailwayLevelMap: React.FC<{
  total: number;
  cols: number;
  difficulty: Difficulty;
  meta: typeof DIFF_META.easy;
  getStatus: (l:number) => 'completed'|'current'|'available'|'locked';
  getStars: (l:number) => number;
  onSelect: (l:number) => void;
}> = React.memo(({ total, difficulty, meta, getStatus, getStars, onSelect }) => {
  const positions = MINE_ROAD_POSITIONS.slice(0, total);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const CONTAINER_H = 3800;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width || 600);
    return () => ro.disconnect();
  }, []);


  return (
    <div
      ref={containerRef}
      className="lg-mine-map"
      style={{
        position: 'relative',
        width: '100%',
        margin: '0 auto',
        height: '3800px',
        backgroundImage: 'url("/assets/background/background.png")',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top center',
        borderRadius: 20,
        boxShadow:
          '0 0 0 3px rgba(255,195,50,0.55),' +
          '0 12px 48px rgba(60,30,0,0.65),' +
          '0 2px 8px rgba(0,0,0,0.4)',
        border: '2.5px solid rgba(255,195,50,0.5)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Golden mine heading banner */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        padding: '16px 16px 36px',
        background:
          'linear-gradient(180deg, rgba(5,2,0,0.95) 0%, rgba(25,10,0,0.82) 55%, transparent 100%)',
        zIndex: 10,
        pointerEvents: 'none',
        textAlign: 'center',
      }}>
        <p style={{
          margin: '0 0 4px', fontSize: 11, fontWeight: 700,
          color: '#FFB300',
          textShadow: '0 1px 6px rgba(0,0,0,0.95)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          ⛏️ {total} Levels
        </p>
        <h2 style={{
          margin: 0,
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 900,
          fontStyle: 'italic',
          color: '#FFD700',
          textShadow:
            '0 0 10px rgba(255,200,0,0.9),' +
            '0 2px 14px rgba(0,0,0,0.98),' +
            '0 0 32px rgba(255,150,0,0.55)',
          letterSpacing: '0.05em',
        }}>
          ✨ Level Path ✨
        </h2>
      </div>
      {/* ── Image chain connectors ── */}
      {positions.slice(0, -1).map((pos, idx) => {
        const next = positions[idx + 1];
        const x1 = (pos.left  / 100) * containerWidth;
        const y1 = (pos.top   / 100) * CONTAINER_H;
        const x2 = (next.left / 100) * containerWidth;
        const y2 = (next.top  / 100) * CONTAINER_H;
        const dx = x2 - x1, dy = y2 - y1;
        const dist  = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return (
          <img
            key={`conn-${idx}`}
            src="/assets/buttons/join the level.png"
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: mx,
              top: my,
              width: dist,
              height: 52,
              objectFit: 'fill',
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              transformOrigin: 'center center',
              zIndex: 3,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        );
      })}

      {positions.map((pos, i) => {
        const level = i + 1;
        const status = getStatus(level);
        const stars = getStars(level);
        return (
          <div
            key={level}
            style={{
              position: 'absolute',
              top:  `${pos.top}%`,
              left: `${pos.left}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              zIndex: 5,
            }}
          >
            <LevelCell level={level} status={status} stars={stars} difficulty={difficulty} meta={meta} onClick={() => onSelect(level)} />
          </div>
        );
      })}
    </div>
  );
});
RailwayLevelMap.displayName = 'RailwayLevelMap';

/* â”€â”€ Main Grid â”€â”€ */
export const LevelGrid: React.FC<Props> = React.memo(({ difficulty, progress, onSelectLevel, onBack }) => {
  const meta = DIFF_META[difficulty];
  const pal = PALETTE[difficulty];
  const totalLevels = 40; // Fixed for your requirement
  const completedCount = progress
    ? (Object.values(progress.miniLevels) as MiniLevelProgress[]).filter(m => m.completed).length
    : 0;

  // 8 cols for wide, 4 for narrow â€” keeps node spacing balanced on the track
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const columns = isSmallScreen ? 4 : 8;

  const currentLevel = useMemo(() => {
    for (let i = 1; i <= totalLevels; i++) {
      if (!progress?.miniLevels[i]?.completed) return i;
    }
    return totalLevels;
  }, [progress, totalLevels]);

  const getStars = useCallback((level: number): number => {
    const ml = progress?.miniLevels[level];
    if (!ml?.completed) return 0;
    const ratio = ml.total > 0 ? ml.score / ml.total : 0;
    if (ratio >= 0.85) return 3;
    if (ratio >= 0.60) return 2;
    return 1;
  }, [progress]);

  const getStatus = useCallback((level: number): 'completed' | 'current' | 'available' | 'locked' => {
    if (progress?.miniLevels[level]?.completed) return 'completed';
    if (level === currentLevel) return 'current';
    if (DEV_UNLOCK_ALL) return 'available';
    return 'locked';
  }, [progress, currentLevel]);

  const pct = totalLevels > 0 ? Math.round((completedCount / totalLevels) * 100) : 0;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1400,
        margin: '0 auto',
        padding: 'clamp(16px, 3vw, 40px) clamp(16px, 4vw, 60px)',
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
      }}
    >
      {/* â”€â”€ Difficulty Header Card â”€â”€ */}
      <div style={{
        width: '100%',
        background: meta.cardGrad,
        border: '1.5px solid rgba(255,255,255,0.6)',
        borderRadius: 24,
        padding: 'clamp(16px, 2vw, 28px) clamp(20px, 3vw, 36px)',
        marginBottom: 32,
        boxShadow: `0 4px 24px rgba(0,0,0,0.04), 0 2px 8px ${meta.glowColor}`,
        position: 'relative',
        boxSizing: 'border-box',
        ['--lg-glow' as any]: meta.glowColor,
        animation: 'lg-badge-glow 3s ease-in-out infinite',
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
            {'<'}
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
              +{XP_PER_DIFFICULTY[difficulty]} XP per question
            </span>
          </div>
        </div>

        {/* Full-width progress bar */}
        <div style={{
          width: '100%', height: 12, borderRadius: 99,
          background: 'rgba(226,232,240,0.4)',
          overflow: 'hidden', marginBottom: 12,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div
            className="lg-bar-v2"
            style={{
              height: '100%', borderRadius: 99,
              background: meta.warmGrad,
              width: `${pct}%`,
              boxShadow: `0 0 12px ${meta.glowColor}`,
            }}
          />
        </div>

        {/* XP reward line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
            Level goal:
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
            {QUESTIONS_PER_MINI} questions per level
          </span>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: meta.accentColor + 'BB' }}>
            Bonus: +{XP_MINI_BONUS} XP per level
          </span>
        </div>
      </div>

      {/* â”€â”€ Railway Track Level Map (game section only) â”€â”€ */}
      <RailwayLevelMap
        total={totalLevels}
        cols={columns}
        difficulty={difficulty}
        meta={meta}
        getStatus={getStatus}
        getStars={getStars}
        onSelect={onSelectLevel}
      />
    </div>
  );
});

LevelGrid.displayName = 'LevelGrid';
