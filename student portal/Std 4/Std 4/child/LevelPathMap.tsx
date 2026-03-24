/**
 * child/LevelPathMap.tsx
 * ──────────────────────────────────────────────────────────
 * Candy Crush–style winding level path map.
 * 200 levels divided into Easy (1-67) / Intermediate (68-134) / Difficult (135-200).
 * Uses button images from /assets/buttons/.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './LevelPathMap.css';

/* ── Layout ──────────────────────────────────────────────── */
const TOTAL_LEVELS  = 200;
const EASY_END      = 67;   // levels 1–67
const INTER_END     = 134;  // levels 68–134
// Difficult: 135–200
const NODES_PER_ROW = 5;
const LEVEL_STEP    = 125;  // px per level (vertical spacing)
const NODE_SIZE     = 76;   // button diameter px
const TOP_PAD       = 80;   // px above first node centre
const BREAK_EXTRA   = 90;   // extra px added at each section boundary

/* ── X fractions (0–1 of canvas width) ──────────────────── */
const LTR_F = [0.13, 0.30, 0.50, 0.70, 0.87];
const RTL_F = [0.87, 0.70, 0.50, 0.30, 0.13];

/* ── Difficulty config ───────────────────────────────────── */
const DIFF_CFG = {
  easy:         { label: '🌟 EASY MODE',         sub: 'Levels 1 – 67',    color: '#22c55e', bg: 'rgba(34,197,94,0.18)',  border: 'rgba(34,197,94,0.6)'  },
  intermediate: { label: '⚡ INTERMEDIATE MODE', sub: 'Levels 68 – 134',  color: '#f59e0b', bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.6)' },
  difficult:    { label: '🔥 EXPERT MODE',        sub: 'Levels 135 – 200', color: '#ef4444', bg: 'rgba(239,68,68,0.18)',  border: 'rgba(239,68,68,0.6)'  },
} as const;

/* ── Button images ───────────────────────────────────────── */
const IMG_UPCOMING = '/assets/buttons/upcoming-level.png';
const IMG_CURRENT  = '/assets/buttons/current-level.png';
const IMG_DONE     = '/assets/buttons/three-star-button.png';

/* ── Position helpers ────────────────────────────────────── */
function extraBreaks(i: number): number {
  const lv = i + 1;
  return (lv > EASY_END ? 1 : 0) + (lv > INTER_END ? 1 : 0);
}

function levelPos(i: number, mapW: number) {
  const row      = Math.floor(i / NODES_PER_ROW);
  const posInRow = i % NODES_PER_ROW;
  const isRTL    = row % 2 === 1;
  const xFrac    = (isRTL ? RTL_F : LTR_F)[posInRow];
  return {
    x: xFrac * mapW,
    y: TOP_PAD + i * LEVEL_STEP + NODE_SIZE / 2 + extraBreaks(i) * BREAK_EXTRA,
  };
}

function getDifficulty(level: number): keyof typeof DIFF_CFG {
  if (level <= EASY_END)  return 'easy';
  if (level <= INTER_END) return 'intermediate';
  return 'difficult';
}

/* ── Props ───────────────────────────────────────────────── */
export interface LevelPathMapProps {
  currentLevel?:  number;
  totalLevels?:   number;   // accepted but map always shows 200 levels
  onSelectLevel?: (level: number) => void;
  onBack?:        () => void;
  title?:         string;
  storageKey?:    string;   // accepted but unused — keeps callers happy
}

/* ── Section banner ──────────────────────────────────────── */
const SectionBanner: React.FC<{
  cfg: typeof DIFF_CFG[keyof typeof DIFF_CFG];
  y:   number;
}> = ({ cfg, y }) => (
  <div
    className="lpm-banner"
    style={{ top: y, background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
  >
    <span className="lpm-banner-label">{cfg.label}</span>
    <span className="lpm-banner-sub">{cfg.sub}</span>
  </div>
);



/* ── Main component ──────────────────────────────────────── */
const LevelPathMap: React.FC<LevelPathMapProps> = ({
  currentLevel  = 1,
  onSelectLevel,
  onBack,
  title = 'Level Map',
}) => {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLDivElement>(null);
  const activeRef  = useRef<HTMLButtonElement>(null);

  /* Responsive map width */
  const [mapW, setMapW] = useState(360);
  useEffect(() => {
    if (!canvasRef.current) return;
    setMapW(canvasRef.current.offsetWidth);
    const ro = new ResizeObserver(([e]) => setMapW(Math.round(e.contentRect.width)));
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  /* Node positions & total canvas height */
  const allPos = useMemo(
    () => Array.from({ length: TOTAL_LEVELS }, (_, i) => levelPos(i, mapW)),
    [mapW],
  );
  const totalH = useMemo(() => {
    const last = allPos[TOTAL_LEVELS - 1];
    return last.y + NODE_SIZE / 2 + 160;
  }, [allPos]);

  /* SVG bezier path segments */
  const segs = useMemo(() => (
    Array.from({ length: TOTAL_LEVELS - 1 }, (_, i) => {
      const A = allPos[i], B = allPos[i + 1];
      const cy = (B.y - A.y) * 0.42;
      return {
        d:    `M${A.x},${A.y} C${A.x},${A.y + cy} ${B.x},${B.y - cy} ${B.x},${B.y}`,
        done: i + 1 < currentLevel,
      };
    })
  ), [allPos, currentLevel]);

  /* Section banner y positions */
  const interBannerY = (allPos[EASY_END  - 1]?.y ?? 0) + NODE_SIZE / 2 + 8;
  const diffBannerY  = (allPos[INTER_END - 1]?.y ?? 0) + NODE_SIZE / 2 + 8;

  /* Auto-scroll to active level */
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentLevel]);

  const diff    = getDifficulty(currentLevel);
  const diffCfg = DIFF_CFG[diff];

  return (
    <div className="lpm-root">
      <div className="lpm-bg" />
      <div className="lpm-bg-dim" />

      {/* ── Sticky header ── */}
      <div className="lpm-header">
        <button className="lpm-back-btn" onClick={onBack}>← Back</button>
        <div className="lpm-header-info">
          <span className="lpm-title">{title}</span>
          <span className="lpm-subtitle" style={{ color: diffCfg.color }}>
            {diffCfg.label} · {diffCfg.sub}
          </span>
        </div>
        <div
          className="lpm-pill"
          style={{ background: diffCfg.bg, borderColor: diffCfg.border, color: diffCfg.color }}
        >
          {currentLevel} / {TOTAL_LEVELS}
        </div>
      </div>

      {/* ── Scrollable map ── */}
      <div className="lpm-scroll" ref={scrollRef}>
        <div ref={canvasRef} className="lpm-canvas" style={{ height: totalH }}>

          {/* Orange winding path SVG */}
          <svg
            className="lpm-svg"
            viewBox={`0 0 ${mapW} ${totalH}`}
            width={mapW}
            height={totalH}
          >
            {/* Shadow layer */}
            {segs.map(({ d, done }, i) => (
              <path
                key={`sh${i}`} d={d}
                stroke={done ? 'rgba(180,83,9,0.5)' : 'rgba(15,15,15,0.3)'}
                strokeWidth={16} fill="none" strokeLinecap="round"
              />
            ))}
            {/* Colour layer */}
            {segs.map(({ d, done }, i) => (
              <path
                key={`ln${i}`} d={d}
                stroke={done ? '#fbbf24' : '#94a3b8'}
                strokeWidth={10} fill="none" strokeLinecap="round"
                strokeDasharray={done ? undefined : '9 7'}
              />
            ))}
          </svg>

          {/* ── Section banners ── */}
          <SectionBanner cfg={DIFF_CFG.easy}         y={TOP_PAD - 60}   />
          <SectionBanner cfg={DIFF_CFG.intermediate} y={interBannerY}   />
          <SectionBanner cfg={DIFF_CFG.difficult}    y={diffBannerY}    />

          {/* ── Level nodes ── */}
          {allPos.map((pos, i) => {
            const lv     = i + 1;
            const done   = lv < currentLevel;
            const active = lv === currentLevel;
            const locked = lv > currentLevel;
            const imgSrc = active ? IMG_CURRENT : done ? IMG_DONE : IMG_UPCOMING;
            return (
              <div
                key={lv}
                className="lpm-pin"
                style={{ left: pos.x, top: pos.y - NODE_SIZE / 2 }}
              >
                <button
                  ref={active ? activeRef : undefined}
                  className={[
                    'lpm-node',
                    active ? 'lpm-node--active' : '',
                    locked ? 'lpm-node--locked' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={locked}
                  aria-label={`Level ${lv}${locked ? ' (locked)' : ''}`}
                  onClick={() => !locked && onSelectLevel?.(lv)}
                >
                  <img src={imgSrc} alt="" className="lpm-node-img" />
                  <span className="lpm-node-num">{lv}</span>
                  {locked && <span className="lpm-lock">🔒</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LevelPathMap;
