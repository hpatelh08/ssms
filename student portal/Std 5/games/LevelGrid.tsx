/**
 * 🎮 LevelGrid — Subway Surfers-Style Vertical Level Map
 * ========================================================
 * 9:16 mobile game level map with jungle stone path background.
 * Top-down 90° camera view. Levels follow the curved jungle path.
 *
 * Assets used:
 *   assets/background/jungle-path-background.png
 *   assets/ui/level-node-completed.png  → green completed node
 *   assets/ui/level-node-current.png    → purple current node
 *   assets/ui/level-node-locked.png     → grey locked node
 *   assets/characters/player-jake.png   → avatar beside current level
 *
 * Level States:
 *   Completed → Green tinted node + 3 golden stars with glow/shadow
 *   Current   → Purple glowing node + avatar beside it + PLAY button
 *   Locked    → Grey tinted node + lock icon + not clickable
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import type { Difficulty } from './engine/questionGenerator';
import { DIFF_META, LEVEL_CONFIG, QUESTIONS_PER_MINI, XP_PER_DIFFICULTY, XP_MINI_BONUS, DEV_UNLOCK_ALL } from './DifficultySelector';

/* ── Asset imports (Vite handles bundling) ── */
import bgImg        from '../assets/background/jungle-path-background.png';
import playerImg    from '../assets/characters/player-jake.png';
import nodeLockedImg    from '../assets/ui/level-node-locked.png';
import nodeCurrentImg   from '../assets/ui/level-node-current.png';
import nodeCompletedImg from '../assets/ui/level-node-completed.png';

/* ── Asset map ── */
const ASSETS = {
  bg:            bgImg,
  player:        playerImg,
  nodeLocked:    nodeLockedImg,
  nodeCurrent:   nodeCurrentImg,
  nodeCompleted: nodeCompletedImg,
};

/* ── CSS (injected once) ── */
const LG_ID = 'lg-subway-css-v4';
if (typeof document !== 'undefined' && !document.getElementById(LG_ID)) {
  const s = document.createElement('style');
  s.id = LG_ID;
  s.textContent = `
    @keyframes lg-pulse-current {
      0%,100% { transform: scale(1);    filter: drop-shadow(0 0 10px rgba(122,163,68,0.7)) drop-shadow(0 0 20px rgba(122,163,68,0.4)); }
      50%     { transform: scale(1.06); filter: drop-shadow(0 0 20px rgba(122,163,68,1.0)) drop-shadow(0 0 40px rgba(122,163,68,0.5)); }
    }
    @keyframes lg-float-player {
      0%,100% { transform: translateX(-50%) translateY(0px); }
      50%     { transform: translateX(-50%) translateY(-8px); }
    }
    @keyframes lg-sparkle {
      0%,100% { opacity:0; transform:scale(0.4) rotate(0deg); }
      50%     { opacity:1; transform:scale(1.3) rotate(180deg); }
    }
    @keyframes lg-star-pop {
      0%   { transform: scale(0) rotate(-20deg); opacity:0; }
      70%  { transform: scale(1.3) rotate(5deg);  opacity:1; }
      100% { transform: scale(1) rotate(0deg);    opacity:1; }
    }
    @keyframes lg-panda-bounce {
      0%   { transform: scale(0) rotate(-30deg); opacity:0; }
      55%  { transform: scale(1.4) rotate(8deg);  opacity:1; }
      78%  { transform: scale(0.88) rotate(-4deg); opacity:1; }
      100% { transform: scale(1) rotate(0deg);    opacity:1; }
    }
    @keyframes lg-bar-fill { from { width: 0; } }
    @keyframes lg-bar-fill { from { width: 0; } }
    .lg-map-scroll {
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #000000 #F8FAFC;
    }
    .lg-map-scroll::-webkit-scrollbar { width: 12px; }
    .lg-map-scroll::-webkit-scrollbar-track {
      background: #F8FAFC;
      border-radius: 10px;
    }
    .lg-map-scroll::-webkit-scrollbar-thumb {
      background: #5F8B3D;
      border-radius: 10px;
      border: 3px solid #F8FAFC;
    }
    .lg-map-scroll::-webkit-scrollbar-thumb:hover {
      background: #4D7A38;
    }
    .lg-node-wrap {
      transition: transform 0.18s cubic-bezier(.34,1.56,.64,1);
    }
    .lg-node-wrap:not(.lg-node-locked):hover  { transform: scale(1.1); }
    .lg-node-wrap:not(.lg-node-locked):active { transform: scale(0.9); }
    .lg-node-wrap.lg-node-locked  { cursor: not-allowed; }
    .lg-node-wrap.lg-node-current { animation: lg-pulse-current 2.2s ease-in-out infinite; }
    .lg-player-icon {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      animation: lg-float-player 2.4s ease-in-out infinite;
    }
    .lg-header-back { transition: transform 0.15s ease; }
    .lg-header-back:hover  { transform: translateX(-3px); }
    .lg-header-back:active { transform: scale(0.95); }
    .lg-star {
      position: absolute;
      line-height: 1;
      pointer-events: none;
      user-select: none;
      animation: lg-star-pop 0.4s ease-out both;
    }
    .lg-panda {
      position: absolute;
      line-height: 1;
      pointer-events: none;
      user-select: none;
      animation: lg-panda-bounce 0.55s cubic-bezier(.34,1.56,.64,1) both;
    }
    .lg-play-btn {
      position: absolute;
      bottom: -54px;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      min-width: 200px;
      text-align: center;
      font-size: 18px;
      font-weight: 900;
      color: #fff;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      background: linear-gradient(135deg, #7aa344 0%, #4d7a38 100%);
      padding: 14px 32px;
      border-radius: 36px;
      box-shadow: 0 8px 24px rgba(122,163,68,0.7), 0 3px 8px rgba(0,0,0,0.4);
      pointer-events: none;
      z-index: 4;
      border: 2.5px solid rgba(255,255,255,0.5);
    }
  `;
  document.head.appendChild(s);
}

/* ── Layout constants ── */
const NODE_SIZE      = 220;   /* px — diameter of each level button          */
const NODE_SPACING   = 370;   /* px — vertical distance between node centers */
const MAP_PAD_TOP    = 150;   /* px — space above first node                 */
const MAP_PAD_BOTTOM = 150;   /* px — space below last node                  */
const AVATAR_SIZE    = 340;   /* px — avatar width/height                    */

/* Zigzag offsets (px, relative to center column) */
const ZIGZAG = [-56, 56, -56, 56, -56, 56, -56, 56];

interface MiniLevelProgress { completed: boolean; score: number; total: number; stars?: number; pandaCount?: number; }
interface DifficultyProgress { miniLevels: Record<number, MiniLevelProgress>; completed: boolean; bestScore: number; timeTaken: number; }

interface Props {
  difficulty: Difficulty;
  progress: DifficultyProgress;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

/* ── Panda reward icons shown on completed nodes (1–3 based on stars earned) ── */
function PandaArc({ size, pandaCount }: { size: number; pandaCount: number }) {
  const allPos = [
    { bottom: size * 0.76, left: -18,             delay: '0s',    scale: 0.88 },
    { bottom: size * 0.94, left: size / 2 - 21,   delay: '0.08s', scale: 1.0  },
    { bottom: size * 0.76, left: size - 22,        delay: '0.16s', scale: 0.88 },
  ];
  /* 1 panda → center; 2 pandas → left + right; 3 pandas → all three */
  const indices = pandaCount === 1 ? [1] : pandaCount === 2 ? [0, 2] : [0, 1, 2];
  return (
    <>
      {indices.map(posIdx => {
        const p = allPos[posIdx];
        return (
          <span
            key={posIdx}
            className="lg-panda"
            style={{
              bottom: p.bottom,
              left:   p.left,
              fontSize: 56 * p.scale,
              animationDelay: p.delay,
              filter: [
                'drop-shadow(0 0 6px rgba(200,240,200,0.9))',
                'drop-shadow(0 2px 6px rgba(0,0,0,0.55))',
              ].join(' '),
              zIndex: 7,
            }}
          >
            💎
          </span>
        );
      })}
    </>
  );
}

/* ── ConnectorDot — small dot drawn between nodes to suggest a path ── */
/* ── Single Level Node ── */
const LevelNodeBtn: React.FC<{
  level: number;
  status: 'completed' | 'current' | 'locked' | 'available';
  stars?: number;
  onSelect: () => void;
}> = React.memo(({ level, status, stars = 0, onSelect }) => {
  const isLocked    = status === 'locked';
  const isCurrent   = status === 'current';
  const isCompleted = status === 'completed';

  /* Pandas: completed levels show 1-3 based on earned stars; old data defaults to 3 */
  const pandaCount = isCompleted ? (stars > 0 ? stars : 3) : 0;
  const showStars = isCompleted && pandaCount > 0;

  /* Node image */
  const nodeSrc = isCompleted ? ASSETS.nodeCompleted
    : isCurrent   ? ASSETS.nodeCurrent
    : status === 'available' ? ASSETS.nodeCurrent
    : ASSETS.nodeLocked;

  /* Colour tint for visual differentiation */
  const tintFilter = isCompleted
    ? 'saturate(1.3) brightness(1.05) hue-rotate(0deg)'   /* green — keep original */
    : isCurrent
    ? 'hue-rotate(84deg) saturate(1.2) brightness(1.08)'                      /* purple — keep original */
    : 'grayscale(0.85) brightness(0.65)';                  /* grey locked            */

  const cls = [
    'lg-node-wrap',
    isLocked  ? 'lg-node-locked'  : '',
    isCurrent ? 'lg-node-current' : '',
  ].filter(Boolean).join(' ');

  /* Outer wrapper handles hover/pulse animations */
  return (
    <div
      className={cls}
      style={{
        position: 'relative',
        width:  NODE_SIZE,
        height: NODE_SIZE,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        /* Extra top padding so stars above don't clip */
        marginTop: showStars ? 110 : 0,
      }}
      onClick={!isLocked ? onSelect : undefined}
    >
      {/* ── Panda reward arc (1–3 based on earned stars) ── */}
      {showStars && <PandaArc size={NODE_SIZE} pandaCount={pandaCount} />}

      {/* ── Node image ── */}
      <img
        src={nodeSrc}
        alt={`Level ${level}`}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          filter: tintFilter,
          borderRadius: '50%',
        }}
      />

      {/* ── Level number ── */}
      {!isLocked && (
        <span style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontWeight: 900,
          fontSize: 40,
          color: '#fff',
          textShadow: '0 3px 10px rgba(0,0,0,0.7), 0 0 4px rgba(0,0,0,0.5)',
          WebkitTextStroke: '2px rgba(0,0,0,0.25)',
          lineHeight: 1,
          pointerEvents: 'none',
          zIndex: 2,
        }}>
          {level}
        </span>
      )}

      {/* ── Lock icon for locked levels ── */}

      {/* ── Avatar beside current level (positioned to the right, above node) ── */}
      {isCurrent && (
        <img
          src={ASSETS.player}
          alt="Player"
          draggable={false}
          className="lg-player-icon"
          style={{
            top: -(AVATAR_SIZE * 0.55),
            width:  AVATAR_SIZE,
            height: AVATAR_SIZE,
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 6,
            filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(122,163,68,0.4))',
          }}
        />
      )}

      {/* ── Sparkles around current level ── */}
      {isCurrent && [0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top:  [-16, NODE_SIZE - 10, -6][i],
            left: [-20, NODE_SIZE + 2,  NODE_SIZE - 8][i],
            fontSize: 16,
            animation: `lg-sparkle ${1.4 + i * 0.35}s ease-in-out infinite`,
            animationDelay: `${i * 0.45}s`,
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >✨</span>
      ))}
    </div>
  );
});
LevelNodeBtn.displayName = 'LevelNodeBtn';

/* ═══════════════════════════════════════════════════════
   MAIN — LevelGrid (Subway Surfers Level Map)
   ═══════════════════════════════════════════════════════ */

export const LevelGrid: React.FC<Props> = React.memo(({ difficulty, progress, onSelectLevel, onBack }) => {
  const meta = DIFF_META[difficulty];
  const totalLevels = LEVEL_CONFIG[difficulty];
  const completedCount = progress
    ? (Object.values(progress.miniLevels) as MiniLevelProgress[]).filter(m => m.completed).length
    : 0;
  const pct = totalLevels > 0 ? Math.round((completedCount / totalLevels) * 100) : 0;

  const scrollRef = useRef<HTMLDivElement>(null);

  /* First incomplete level = current */
  const currentLevel = useMemo(() => {
    for (let i = 1; i <= totalLevels; i++) {
      if (!progress?.miniLevels[i]?.completed) return i;
    }
    return totalLevels;
  }, [progress, totalLevels]);

  const getStatus = useCallback(
    (level: number): 'completed' | 'current' | 'available' | 'locked' => {
      if (progress?.miniLevels[level]?.completed) return 'completed';
      if (level === currentLevel) return 'current';
      if (DEV_UNLOCK_ALL) return 'available';
      return 'locked';
    },
    [progress, currentLevel],
  );

  const levels = useMemo(() => Array.from({ length: totalLevels }, (_, i) => i + 1), [totalLevels]);

  /* ── Node center positions (absolute coords inside map canvas) ── */
  const nodePositions = useMemo(() => {
    return levels.map((_, idx) => {
      const offsetX = ZIGZAG[idx % ZIGZAG.length];
      const y = MAP_PAD_TOP + idx * NODE_SPACING + NODE_SIZE / 2;
      return { offsetX, y };
    });
  }, [levels]);

  /* Total canvas height */
  const mapHeight = MAP_PAD_TOP + totalLevels * NODE_SPACING + MAP_PAD_BOTTOM;

  /* Auto-scroll to current level */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pos = nodePositions[currentLevel - 1];
    if (!pos) return;
    const targetY = pos.y - el.clientHeight * 0.55;
    const timer = setTimeout(() => {
      el.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }, 350);
    return () => clearTimeout(timer);
  }, [currentLevel, nodePositions]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: 'transparent',
      boxSizing: 'border-box',
      padding: '0 0',
    }}>

      {/* ═══ Header ═══ */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        background: 'rgba(248,255,244,0.94)',
        border: '1.5px solid rgba(153,187,136,0.35)',
        borderRadius: '24px',
        padding: '14px 20px 12px',
        boxShadow: `0 2px 16px rgba(88,129,74,0.16), 0 4px 20px ${meta.glowColor}44`,
        flexShrink: 0,
        boxSizing: 'border-box',
        width: '100%',
      }}>
        {/* Row: Back + Icon + Title + Pct */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <button
            onClick={onBack}
            className="lg-header-back"
            style={{
              width: 38, height: 38, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, background: 'rgba(241,250,234,0.95)',
              border: '1.5px solid rgba(153,187,136,0.4)',
              cursor: 'pointer', fontWeight: 800, color: '#2f5f3d', flexShrink: 0,
            }}
          >←</button>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, background: meta.warmGrad, flexShrink: 0,
            boxShadow: `0 3px 12px ${meta.glowColor}`,
          }}>{meta.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#2f5f3d' }}>
              {meta.label} Levels
            </h3>
            <p style={{ margin: 0, fontSize: 11, color: '#6f9074', fontWeight: 700 }}>
              {completedCount} / {totalLevels} completed
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{
              fontSize: 21, fontWeight: 900,
              background: meta.warmGrad,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>{pct}%</span>
            <div style={{ fontSize: 10, fontWeight: 700, color: meta.accentColor + 'AA' }}>
              ✨ +{XP_PER_DIFFICULTY[difficulty]} XP/Q
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 9, borderRadius: 99,
          background: 'rgba(209,225,194,0.55)', overflow: 'hidden', marginBottom: 7,
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: meta.warmGrad,
            width: `${pct}%`,
            boxShadow: `0 0 10px ${meta.glowColor}`,
            animation: 'lg-bar-fill 0.9s ease-out',
          }} />
        </div>

        {/* Info chips */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11 }}>🎯</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#5f8668' }}>{QUESTIONS_PER_MINI} Qs/level</span>
          <span style={{ color: '#a7bfa2' }}>•</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: meta.accentColor + 'BB' }}>+{XP_MINI_BONUS} XP/level</span>
        </div>
      </div>

      {/* ═══ Scrollable Map ═══ */}
      <div style={{ position: 'relative', flex: 1, marginTop: 20, minHeight: 0, display: 'flex', justifyContent: 'center' }}>
        {/* Constrain to map width so scrollbar hugs the right edge of the jungle */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 1400, height: '100%' }}>
        <div
          ref={scrollRef}
          className="lg-map-scroll"
          style={{
            height: '100%',
            position: 'relative',
            zIndex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            background: 'transparent',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
        {/* Full-height canvas */}
        <div style={{ position: 'relative', width: '100%', height: mapHeight, overflow: 'hidden' }}>

          {/* ── BG: jungle path tiled ── */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${ASSETS.bg})`,
            backgroundSize: '100% auto',
            backgroundPosition: 'center top',
            backgroundRepeat: 'repeat-y',
            zIndex: 0,
          }} />

          {/* ── Dim overlay ── */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.04) 100%)',
            pointerEvents: 'none',
            zIndex: 4,
          }} />

          {/* ── Level nodes (absolutely positioned) ── */}
          {levels.map((level, idx) => {
            const { offsetX, y } = nodePositions[idx];
            const status = getStatus(level);
            const isCompleted = status === 'completed';
            /* Extra top space for stars */
            const starSpace = isCompleted ? 110 : 0;
            return (
              <div
                key={level}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${offsetX}px - ${NODE_SIZE / 2}px)`,
                  top: y - NODE_SIZE / 2 + starSpace,
                  zIndex: 10,
                }}
              >
                <LevelNodeBtn
                  level={level}
                  status={status}
                  stars={progress?.miniLevels[level]?.stars ?? (status === 'completed' ? 3 : 0)}
                  onSelect={() => onSelectLevel(level)}
                />
              </div>
            );
          })}
        </div>
        </div>
        </div>
      </div>
    </div>
  );
});

LevelGrid.displayName = 'LevelGrid';

