/**
 * 🚀 SpaceLevelMap — Premium Space-themed Level Map
 * ===================================================
 * Vertical scrollable level path with:
 * - space-background.png as full background
 * - Cartoon astronaut near the current level (idle float + movement)
 * - Decorative parallax assets (planets, galaxies, nebula, rocket, etc.)
 * - Glowing cosmic curved path with shimmer
 * - Completed = green glow, Current = purple pulse, Locked = blue dim
 * - Shooting star effects, twinkling stars, parallax scroll layers
 */

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import type { Difficulty } from './engine/questionGenerator';
import { DIFF_META, LEVEL_CONFIG, QUESTIONS_PER_MINI, XP_PER_DIFFICULTY, XP_MINI_BONUS } from './DifficultySelector';

/* ── Asset imports ── */
import bgImg from '../assets/background/space-background.png';
import astronautImg from '../assets/characters/astronaut.png';
import planetGreenImg from '../assets/planets/planet-green-ring.png';
import planetOrangeImg from '../assets/planets/planet-orange-ring.png';
import rocketImg from '../assets/vehicles/rocket-blue-red.png';
import satelliteImg from '../assets/space-objects/satellite.png';
import asteroidImg from '../assets/space-objects/asteroid.png';
import galaxyPurpleImg from '../assets/galaxies/galaxy-purple-blue.png';
import galaxyGoldenImg from '../assets/galaxies/galaxy-golden.png';
import shootingStarImg from '../assets/effects/shooting-star.png';
import nebulaImg from '../assets/nebula/nebula-pink-purple.png';

const ASSETS = {
  bg: bgImg,
  astronaut: astronautImg,
  planetGreen: planetGreenImg,
  planetOrange: planetOrangeImg,
  rocket: rocketImg,
  satellite: satelliteImg,
  asteroid: asteroidImg,
  galaxyPurple: galaxyPurpleImg,
  galaxyGolden: galaxyGoldenImg,
  shootingStar: shootingStarImg,
  nebula: nebulaImg,
};

/* ── CSS keyframes (injected once) ── */
const SLM_ID = 'slm-space-css';
if (typeof document !== 'undefined' && !document.getElementById(SLM_ID)) {
  const s = document.createElement('style');
  s.id = SLM_ID;
  s.textContent = `
    @keyframes slm-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.6), 0 0 30px rgba(168,85,247,0.4); }
      50% { box-shadow: 0 0 0 14px rgba(168,85,247,0), 0 0 40px rgba(168,85,247,0.6); }
    }
    @keyframes slm-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes slm-sparkle {
      0%,100% { opacity:0.2; transform:scale(0.6) rotate(0deg); }
      50% { opacity:1; transform:scale(1.3) rotate(180deg); }
    }
    @keyframes slm-glow {
      0%,100% { filter:drop-shadow(0 0 10px rgba(168,85,247,0.5)); }
      50% { filter:drop-shadow(0 0 28px rgba(168,85,247,0.9)); }
    }
    @keyframes slm-star-shine {
      0%,100% { filter: drop-shadow(0 0 3px rgba(255,200,0,0.6)); transform: scale(1); }
      50% { filter: drop-shadow(0 0 8px rgba(255,200,0,1)); transform: scale(1.15); }
    }
    @keyframes slm-twinkle { 0%,100%{opacity:0.1} 50%{opacity:0.7} }
    @keyframes slm-shimmer {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -40; }
    }
    @keyframes slm-path-particles {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -60; }
    }
    @keyframes slm-role-idle {
      0%,100% { transform: translate(-50%, -100%) translateY(0px); }
      50% { transform: translate(-50%, -100%) translateY(-8px); }
    }
    @keyframes slm-role-glow {
      0%,100% { filter: drop-shadow(0 0 8px rgba(168,85,247,0.4)); }
      50% { filter: drop-shadow(0 0 20px rgba(168,85,247,0.8)); }
    }
    @keyframes slm-bounce-land {
      0% { transform: translate(-50%, -100%) scale(1,1); }
      30% { transform: translate(-50%, -100%) scale(1.1,0.9); }
      50% { transform: translate(-50%, -100%) scale(0.95,1.05); }
      70% { transform: translate(-50%, -100%) scale(1.02,0.98); }
      100% { transform: translate(-50%, -100%) scale(1,1); }
    }
    @keyframes slm-drift {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      25% { transform: translateY(-6px) rotate(2deg); }
      75% { transform: translateY(4px) rotate(-2deg); }
    }
    @keyframes slm-orbit {
      0%,100% { transform: translateY(0px) translateX(0); }
      25% { transform: translateY(-4px) translateX(3px); }
      50% { transform: translateY(0px) translateX(0); }
      75% { transform: translateY(4px) translateX(-3px); }
    }
    @keyframes slm-shooting-star {
      0% { transform: translate(0,0) rotate(-45deg); opacity: 0; }
      10% { opacity: 1; }
      80% { opacity: 1; }
      100% { transform: translate(350px, 350px) rotate(-45deg); opacity: 0; }
    }
    @keyframes slm-nebula-breathe {
      0%,100% { opacity: 0.15; transform: scale(1); }
      50% { opacity: 0.25; transform: scale(1.05); }
    }
    @keyframes slm-neon-ring {
      0%,100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.08); }
    }
    .slm-node { transition: transform 0.2s cubic-bezier(.34,1.56,.64,1); }
    .slm-node:hover:not(.slm-locked) { transform: scale(1.12); }
    .slm-node:active:not(.slm-locked) { transform: scale(0.92); }
    .slm-locked { cursor: not-allowed !important; }
    .slm-scroll::-webkit-scrollbar { width: 6px; }
    .slm-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 6px; }
    .slm-scroll::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.4); border-radius: 6px; }
    .slm-scroll { scrollbar-width: thin; scrollbar-color: rgba(168,85,247,0.4) rgba(0,0,0,0.2); }
  `;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════ */

import { MiniLevelProgress, DifficultyProgress } from './subjects/engine/types';

interface Props {
  difficulty: Difficulty;
  progress: DifficultyProgress;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

type NodeStatus = 'completed' | 'current' | 'locked';

/* ══════════════════════════════════════════════════
   LAYOUT CONSTANTS
   ══════════════════════════════════════════════════ */

const NODE_SIZE = 70;
const NODE_GAP_Y = 110;
const MAP_PADDING_TOP = 250;
const MAP_PADDING_BOTTOM = 10;
const PATH_AMPLITUDE = 0.28;

/* ── Zig-zag position calculator ── */
function computePositions(totalLevels: number, containerWidth: number) {
  const positions: { x: number; y: number }[] = [];
  const centerX = containerWidth / 2;
  const amplitude = containerWidth * PATH_AMPLITUDE;

  for (let i = 0; i < totalLevels; i++) {
    const progress = i / Math.max(1, totalLevels - 1);
    const angle = progress * Math.PI * Math.ceil(totalLevels / 5);
    const x = centerX + Math.sin(angle) * amplitude;
    const y = MAP_PADDING_TOP + i * NODE_GAP_Y;
    positions.push({ x, y });
  }

  return positions;
}

/* ── SVG curved path between nodes ── */
function buildCurvedPath(positions: { x: number; y: number }[]): string {
  if (positions.length < 2) return '';
  let d = `M ${positions[0].x} ${positions[0].y}`;
  for (let i = 1; i < positions.length; i++) {
    const p = positions[i - 1];
    const c = positions[i];
    const midY = (p.y + c.y) / 2;
    d += ` C ${p.x},${midY} ${c.x},${midY} ${c.x},${c.y}`;
  }
  return d;
}

/* ── Interpolate position along SVG path at fraction t ── */
function getPointOnPath(svgPath: SVGPathElement | null, t: number): { x: number; y: number } | null {
  if (!svgPath) return null;
  const len = svgPath.getTotalLength();
  const pt = svgPath.getPointAtLength(t * len);
  return { x: pt.x, y: pt.y };
}

function getEarnedStars(levelProgress?: MiniLevelProgress): number {
  if (!levelProgress || !levelProgress.completed || levelProgress.total <= 0) return 0;
  const ratio = levelProgress.score / levelProgress.total;
  if (ratio >= 0.95) return 3;
  if (ratio >= 0.8) return 2;
  return 1;
}

/* ══════════════════════════════════════════════════
   LEVEL NODE
   ══════════════════════════════════════════════════ */

const LevelNode: React.FC<{
  level: number;
  status: NodeStatus;
  x: number;
  y: number;
  stars: number;
  isCurrent: boolean;
  onClick: () => void;
}> = React.memo(({ level, status, x, y, stars, isCurrent, onClick }) => {
  /* ── Gradient backgrounds ── */
  const bg =
    status === 'completed'
      ? 'linear-gradient(160deg, #6EE7B7 0%, #34D399 35%, #059669 100%)'
      : status === 'current'
        ? 'linear-gradient(160deg, #C4B5FD 0%, #A78BFA 30%, #7C3AED 70%, #6D28D9 100%)'
        : 'linear-gradient(160deg, #93C5FD 0%, #60A5FA 38%, #3B82F6 75%, #2563EB 100%)';

  const border =
    status === 'completed' ? '3px solid rgba(110,231,183,0.7)'
    : status === 'current' ? '3px solid rgba(196,181,253,0.8)'
    : '3px solid rgba(147,197,253,0.65)';

  const shadow =
    status === 'completed'
      ? '0 6px 20px rgba(5,150,105,0.45), 0 0 30px rgba(52,211,153,0.25), inset 0 -3px 6px rgba(0,0,0,0.15)'
    : status === 'current'
      ? '0 0 35px rgba(124,58,237,0.6), 0 0 60px rgba(168,85,247,0.3), 0 6px 20px rgba(0,0,0,0.35), inset 0 -3px 6px rgba(0,0,0,0.2)'
    : '0 4px 16px rgba(59,130,246,0.28), 0 0 20px rgba(96,165,250,0.18), inset 0 -3px 6px rgba(0,0,0,0.12)';

  return (
    <div
      style={{
        position: 'absolute',
        left: x - NODE_SIZE / 2,
        top: y - NODE_SIZE / 2,
        width: NODE_SIZE,
        height: NODE_SIZE,
        zIndex: isCurrent ? 20 : 10,
        overflow: 'visible',
      }}
    >
      {/* Neon outer ring for current */}
      {status === 'current' && (
        <div
          style={{
            position: 'absolute',
            inset: -10,
            borderRadius: '50%',
            border: '2px solid rgba(168,85,247,0.5)',
            animation: 'slm-neon-ring 2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Glow aura for current */}
      {status === 'current' && (
        <div
          style={{
            position: 'absolute',
            inset: -18,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(124,58,237,0.15) 45%, transparent 70%)',
            animation: 'slm-glow 2.5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Sparkle particles for current */}
      {status === 'current' && (
        <>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <span
              key={i}
              style={{
                position: 'absolute',
                fontSize: 8 + (i % 3) * 2,
                top: `${-10 + (i * 20) % 110}%`,
                left: `${-20 + (i * 28) % 120}%`,
                animation: `slm-sparkle ${1.2 + i * 0.25}s ease-in-out ${i * 0.2}s infinite`,
                pointerEvents: 'none',
                opacity: 0.8,
              }}
            >
              ✦
            </span>
          ))}
        </>
      )}

      <button
        onClick={status !== 'locked' ? onClick : undefined}
        disabled={status === 'locked'}
        className={`slm-node ${status === 'locked' ? 'slm-locked' : ''}`}
        style={{
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: '50%',
          border,
          background: bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: status === 'locked' ? 'not-allowed' : 'pointer',
          boxShadow: shadow,
          padding: 0,
          position: 'relative',
          animation: status === 'current' ? 'slm-pulse 2s ease-in-out infinite' : undefined,
          opacity: status === 'locked' ? 0.62 : 1,
          overflow: 'hidden',
        }}
      >
        {/* Glossy top highlight */}
        {status !== 'locked' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: '45%',
            borderRadius: '50% 50% 50% 50% / 100% 100% 0% 0%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)',
            pointerEvents: 'none',
          }} />
        )}

        {status === 'completed' ? (
          <>
            <span style={{
              fontWeight: 900, fontSize: 21, color: '#fff', lineHeight: 1,
              textShadow: '0 2px 4px rgba(0,0,0,0.25)',
              position: 'relative', zIndex: 1,
            }}>
              {level}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginTop: 1, position: 'relative', zIndex: 1 }}>
              <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }} />
            </svg>
          </>
        ) : (
          <span style={{
            fontWeight: 900,
            fontSize: status === 'current' ? 24 : 21,
            color: '#fff',
            lineHeight: 1,
            textShadow: '0 2px 6px rgba(0,0,0,0.28)',
            position: 'relative', zIndex: 1,
          }}>
            {level}
          </span>
        )}
      </button>

      {/* PLAY badge for current */}
      {isCurrent && (
        <div
          style={{
            position: 'absolute',
            bottom: -24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #C4B5FD 0%, #7C3AED 100%)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 900,
            padding: '4px 14px',
            borderRadius: 12,
            letterSpacing: '0.1em',
            boxShadow: '0 3px 14px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
            whiteSpace: 'nowrap' as const,
            textTransform: 'uppercase' as const,
          }}
        >
          ▶ PLAY
        </div>
      )}

      {/* Golden stars for completed */}
      {status === 'completed' && stars > 0 && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 2,
          pointerEvents: 'none',
        }}>
          {Array.from({ length: stars }).map((_, i) => (
            <svg key={i} width="14" height="14" viewBox="0 0 24 24" style={{
              animation: `slm-star-shine ${1.8 + i * 0.3}s ease-in-out ${i * 0.15}s infinite`,
            }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.5" />
            </svg>
          ))}
        </div>
      )}
    </div>
  );
});
LevelNode.displayName = 'LevelNode';

/* ══════════════════════════════════════════════════
   TWINKLING STARS BACKGROUND
   ══════════════════════════════════════════════════ */

const TwinklingStars: React.FC<{ mapHeight: number; containerWidth: number }> = React.memo(({ mapHeight, containerWidth }) => {
  const stars = useMemo(() => {
    const result: { x: number; y: number; size: number; delay: number; dur: number }[] = [];
    for (let i = 0; i < 120; i++) {
      const hash = (i * 2654435761) >>> 0;
      result.push({
        x: (hash % containerWidth),
        y: (hash * 3 % mapHeight),
        size: 1 + (hash % 3),
        delay: (hash % 5000) / 1000,
        dur: 2 + (hash % 4000) / 1000,
      });
    }
    return result;
  }, [mapHeight, containerWidth]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: i % 5 === 0 ? '#C4B5FD' : i % 3 === 0 ? '#93C5FD' : '#fff',
            animation: `slm-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
});
TwinklingStars.displayName = 'TwinklingStars';

/* ══════════════════════════════════════════════════
   SHOOTING STAR EFFECT
   ══════════════════════════════════════════════════ */

const ShootingStarEffect: React.FC<{ containerWidth: number; mapHeight: number }> = React.memo(({ containerWidth, mapHeight }) => {
  const [stars, setStars] = useState<{ id: number; x: number; y: number }[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const spawn = () => {
      const id = nextId.current++;
      const x = Math.random() * containerWidth * 0.6;
      const y = Math.random() * mapHeight * 0.7;
      setStars(prev => [...prev, { id, x, y }]);
      setTimeout(() => {
        setStars(prev => prev.filter(s => s.id !== id));
      }, 2000);
    };
    const interval = setInterval(spawn, 4000 + Math.random() * 4000);
    spawn();
    return () => clearInterval(interval);
  }, [containerWidth, mapHeight]);

  return (
    <>
      {stars.map(s => (
        <img
          key={s.id}
          src={ASSETS.shootingStar}
          alt=""
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: 60,
            height: 20,
            opacity: 0,
            animation: 'slm-shooting-star 2s ease-out forwards',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      ))}
    </>
  );
});
ShootingStarEffect.displayName = 'ShootingStarEffect';

/* ══════════════════════════════════════════════════
   PARALLAX DECORATIVE LAYER
   ══════════════════════════════════════════════════ */

interface DecorItem {
  src: string;
  x: string; // CSS left
  y: number; // absolute top in map coords
  width: number;
  opacity: number;
  parallaxSpeed: number; // 0 = no parallax, 1 = full scroll
  animation?: string;
  zIndex: number;
  rotate?: number;
}

const ParallaxDecor: React.FC<{
  items: DecorItem[];
  scrollY: number;
}> = React.memo(({ items, scrollY }) => (
  <>
    {items.map((item, i) => {
      const parallaxOffset = scrollY * (1 - item.parallaxSpeed);
      return (
        <img
          key={i}
          src={item.src}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y + parallaxOffset,
            width: item.width,
            height: 'auto',
            opacity: item.opacity,
            zIndex: item.zIndex,
            pointerEvents: 'none',
            animation: item.animation,
            transform: item.rotate ? `rotate(${item.rotate}deg)` : undefined,
            userSelect: 'none',
          }}
        />
      );
    })}
  </>
));
ParallaxDecor.displayName = 'ParallaxDecor';

/* ══════════════════════════════════════════════════
   CURRENT LEVEL ASTRONAUT
   ══════════════════════════════════════════════════ */

const CurrentAstronaut: React.FC<{
  x: number;
  y: number;
  isMoving: boolean;
}> = React.memo(({ x, y, isMoving }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: 'translate(-50%, -100%)',
      zIndex: 30,
      pointerEvents: 'none',
      width: 130,
      height: 130,
      transition: isMoving ? 'left 0.8s cubic-bezier(0.4,0,0.2,1), top 0.8s cubic-bezier(0.4,0,0.2,1)' : undefined,
      animation: isMoving
        ? 'slm-bounce-land 0.5s ease 0.8s both'
        : 'slm-role-idle 2.5s ease-in-out infinite',
    }}
  >
    {/* Glow behind avatar */}
    <div style={{
      position: 'absolute',
      inset: -10,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
      animation: 'slm-role-glow 2.5s ease-in-out infinite',
    }} />
    <img
      src={ASSETS.astronaut}
      alt="Astronaut"
      draggable={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        position: 'relative',
        zIndex: 1,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
      }}
    />
  </div>
));
CurrentAstronaut.displayName = 'CurrentAstronaut';

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════ */

export const SpaceLevelMap: React.FC<Props> = React.memo(({ difficulty, progress, onSelectLevel, onBack }) => {
  const meta = DIFF_META[difficulty];
  const totalLevels = LEVEL_CONFIG[difficulty];
  const completedCount = progress ? (Object.values(progress.miniLevels) as MiniLevelProgress[]).filter(m => m.completed).length : 0;
  const pct = totalLevels > 0 ? Math.round((completedCount / totalLevels) * 100) : 0;
  const containerWidth = 480;
  const mapHeight = MAP_PADDING_TOP + totalLevels * NODE_GAP_Y + MAP_PADDING_BOTTOM;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const prevLevelRef = useRef<number | null>(null);

  /* ── Level positions ── */
  const positions = useMemo(() => computePositions(totalLevels, containerWidth), [totalLevels, containerWidth]);
  const pathD = useMemo(() => buildCurvedPath(positions), [positions]);

  /* ── Current level ── */
  const currentLevel = useMemo(() => {
    for (let i = 1; i <= totalLevels; i++) {
      if (!progress?.miniLevels[i]?.completed) return i;
    }
    return totalLevels;
  }, [progress, totalLevels]);

  /* ── Detect level change for movement animation ── */
  useEffect(() => {
    if (prevLevelRef.current !== null && prevLevelRef.current !== currentLevel) {
      setIsMoving(true);
      const timer = setTimeout(() => setIsMoving(false), 1400);
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  /* ── Auto-scroll to current level on mount ── */
  useEffect(() => {
    if (scrollRef.current && positions[currentLevel - 1]) {
      const nodeY = positions[currentLevel - 1].y;
      const viewportH = scrollRef.current.clientHeight;
      scrollRef.current.scrollTop = Math.max(0, nodeY - viewportH / 2);
    }
  }, [currentLevel, positions]);

  /* ── Track scroll for parallax ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Status getter ── */
  const getStatus = useCallback((level: number): NodeStatus => {
    if (progress?.miniLevels[level]?.completed) return 'completed';
    if (level === currentLevel) return 'current';
    return 'locked';
  }, [progress, currentLevel]);

  /* ── Level list ── */
  const levels = useMemo(() => Array.from({ length: totalLevels }, (_, i) => i + 1), [totalLevels]);

  /* ── SVG path length for progress fill ── */
  const PATH_LEN = 1000;
  const fillFraction = totalLevels > 0 ? completedCount / totalLevels : 0;
  const dashOffset = PATH_LEN - fillFraction * PATH_LEN;

  /* ── Current node position ── */
  const currentPos = positions[currentLevel - 1] || { x: containerWidth / 2, y: MAP_PADDING_TOP };
  const astronautPos = useMemo(() => {
    const sideOffset = currentPos.x < containerWidth / 2 ? 86 : -86;
    const x = Math.max(72, Math.min(containerWidth - 72, currentPos.x + sideOffset));
    const y = currentPos.y + 20;
    return { x, y };
  }, [currentPos.x, currentPos.y, containerWidth]);

  /* ── Decorative parallax items (placed around edges) ── */
  const decorItems = useMemo<DecorItem[]>(() => {
    const h = mapHeight;
    return [
      // ─── LEFT SIDE decorations ───
      // Galaxy (left)
      { src: ASSETS.galaxyPurple, x: '-30%', y: h * 0.08, width: 1960, opacity: 1, parallaxSpeed: 0.3, zIndex: 0, animation: 'slm-nebula-breathe 8s ease-in-out infinite' },
      // Nebula (left)
      { src: ASSETS.nebula, x: '-50%', y: h * 0.35, width: 400, opacity: 1, parallaxSpeed: 0.35, zIndex: 0, animation: 'slm-nebula-breathe 9s ease-in-out 1s infinite' },
      // Planet green (left)
      { src: ASSETS.planetGreen, x: '-75%', y: h * 0.15, width: 900, opacity: 1, parallaxSpeed: 0.55, zIndex: 2, animation: 'slm-drift 6s ease-in-out infinite' },
      // Satellite (left)
      { src: ASSETS.satellite, x: '-50%', y: h * 0.55, width: 315, opacity: 1, parallaxSpeed: 0.65, zIndex: 2, animation: 'slm-orbit 7s ease-in-out infinite' },
      // Asteroid (left)
      { src: ASSETS.asteroid, x: '-70%', y: h * 0.82, width: 350, opacity: 1, parallaxSpeed: 0.55, zIndex: 2, animation: 'slm-orbit 8s ease-in-out 1s infinite' },
      // Astronaut (left)
      { src: ASSETS.astronaut, x: '-20%', y: h * 0.05, width: 200, opacity: 1, parallaxSpeed: 0.5, zIndex: 2, animation: 'slm-drift 5s ease-in-out 0.5s infinite', rotate: 10 },

      // ─── RIGHT SIDE decorations ───
      // Galaxy golden (right)
      { src: ASSETS.galaxyGolden, x: '55%', y: h * 0.55, width: 1680, opacity: 1, parallaxSpeed: 0.25, zIndex: 0, animation: 'slm-nebula-breathe 10s ease-in-out 2s infinite' },
      // Nebula (right)
      { src: ASSETS.nebula, x: '70%', y: h * 0.78, width: 380, opacity: 1, parallaxSpeed: 0.3, zIndex: 0, rotate: 180, animation: 'slm-nebula-breathe 11s ease-in-out 3s infinite' },
      // Planet orange (right)
      { src: ASSETS.planetOrange, x: '72%', y: h * 0.42, width: 800, opacity: 1, parallaxSpeed: 0.5, zIndex: 2, animation: 'slm-drift 7s ease-in-out 1s infinite' },
      // Planet green (right)
      { src: ASSETS.planetGreen, x: '70%', y: h * 0.72, width: 700, opacity: 1, parallaxSpeed: 0.5, zIndex: 2, animation: 'slm-drift 8s ease-in-out 2s infinite', rotate: 45 },
      // Rocket (right)
      { src: ASSETS.rocket, x: '75%', y: h * 0.2, width: 400, opacity: 1, parallaxSpeed: 0.6, zIndex: 2, animation: 'slm-drift 5s ease-in-out infinite', rotate: -15 },
      // Asteroid (right)
      { src: ASSETS.asteroid, x: '78%', y: h * 0.62, width: 400, opacity: 1, parallaxSpeed: 0.6, zIndex: 2, animation: 'slm-orbit 6s ease-in-out 2s infinite' },
    ];
  }, [mapHeight]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '0 20px',
    }}>
      {/* ── Shared centered parent container ── */}
      <div style={{
        width: '100%',
        maxWidth: 1400,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* ── Header Card ── */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.08) 100%), linear-gradient(180deg, rgba(7,12,28,0.92) 0%, rgba(15,23,42,0.86) 100%)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(148,163,184,0.16)',
          boxShadow: '0 18px 48px rgba(2,6,23,0.28)',
          borderRadius: 24,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{
            position: 'relative',
            zIndex: 50,
            padding: '16px 20px 12px',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <button
              onClick={onBack}
              style={{
                width: 42, height: 42, borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, background: 'rgba(15,23,42,0.72)',
                border: '1px solid rgba(148,163,184,0.2)',
                cursor: 'pointer', fontWeight: 700, color: '#CBD5E1',
                flexShrink: 0, backdropFilter: 'blur(4px)',
              }}
            >
              ←
            </button>

            <div style={{
              width: 46, height: 46, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, background: meta.warmGrad, flexShrink: 0,
              boxShadow: `0 4px 16px ${meta.glowColor}`,
            }}>
              {meta.emoji}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#E2E8F0', letterSpacing: '0.02em' }}>
                {meta.label} Levels
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                {completedCount}/{totalLevels} completed
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: meta.accentColor }}>
                {pct}%
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>
                ✨ +{XP_PER_DIFFICULTY[difficulty]} XP/Q
              </span>
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div style={{
            padding: '0 20px 12px',
            background: 'transparent',
            position: 'relative',
            zIndex: 50,
          }}>
            <div style={{
              width: '100%', height: 6, borderRadius: 99,
              background: 'rgba(15,23,42,0.66)',
              border: '1px solid rgba(148,163,184,0.16)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: meta.warmGrad,
                width: `${pct}%`,
                transition: 'width 0.6s ease',
                boxShadow: `0 0 14px ${meta.glowColor}`,
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6,
            }}>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>
                🎯 {QUESTIONS_PER_MINI} questions per level
              </span>
              <span style={{ color: 'rgba(148,163,184,0.5)' }}>•</span>
              <span style={{ fontSize: 11, color: '#C4B5FD' }}>
                +{XP_MINI_BONUS} XP per level
              </span>
            </div>
          </div>
        </div>

        {/* ── 20px gap ── */}
        <div style={{ height: 20, flexShrink: 0 }} />

        {/* ── Space Map Section ── */}
        <div
          ref={scrollRef}
          className="slm-scroll"
          style={{
            width: '100%',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            WebkitOverflowScrolling: 'touch',
            borderRadius: '24px 24px 0 0',
            backgroundColor: '#070b1a',
            backgroundImage: `url(${ASSETS.bg})`,
            backgroundSize: 'contain',
            backgroundPosition: 'top center',
            backgroundRepeat: 'repeat-y',
          }}
        >
        <div style={{
          width: containerWidth,
          height: mapHeight,
          margin: '0 auto',
          position: 'relative',
        }}>

          {/* ── Twinkling stars ── */}
          <TwinklingStars mapHeight={mapHeight} containerWidth={containerWidth} />

          {/* ── Parallax decorative assets ── */}
          <ParallaxDecor items={decorItems} scrollY={scrollY} />

          {/* ── Shooting star effects ── */}
          <ShootingStarEffect containerWidth={containerWidth} mapHeight={mapHeight} />

          {/* ── Path SVG ── */}
          <svg
            style={{ position: 'absolute', inset: 0, width: containerWidth, height: mapHeight, zIndex: 5, pointerEvents: 'none' }}
            viewBox={`0 0 ${containerWidth} ${mapHeight}`}
            fill="none"
          >
            <defs>
              <linearGradient id="slm-path-outer" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="slm-path-glow" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#67E8F9" />
                <stop offset="30%" stopColor="#22D3EE" />
                <stop offset="60%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#67E8F9" />
              </linearGradient>
              <linearGradient id="slm-path-fill" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#6EE7B7" />
                <stop offset="50%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
              <filter id="slm-path-blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
              </filter>
              <filter id="slm-path-soft">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
              </filter>
            </defs>

            {/* Wide outer glow — soft cyan aura */}
            <path d={pathD} stroke="url(#slm-path-outer)" strokeWidth={42} strokeLinecap="round" strokeLinejoin="round" filter="url(#slm-path-blur)" />
            {/* Core glowing path — thicker cyan/turquoise */}
            <path d={pathD} stroke="url(#slm-path-glow)" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
            {/* Inner bright core */}
            <path d={pathD} stroke="rgba(103,232,249,0.3)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            {/* Energy flow particles along path */}
            <path
              d={pathD}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={3}
              strokeDasharray="4 18"
              strokeLinecap="round"
              style={{ animation: 'slm-path-particles 1.5s linear infinite' }}
              pathLength={PATH_LEN}
            />
            {/* Shimmer overlay */}
            <path
              d={pathD}
              stroke="rgba(103,232,249,0.2)"
              strokeWidth={2}
              strokeDasharray="6 12"
              strokeLinecap="round"
              style={{ animation: 'slm-shimmer 2.5s linear infinite' }}
              pathLength={PATH_LEN}
            />
            {/* Completed progress fill */}
            <path
              d={pathD}
              stroke="url(#slm-path-fill)"
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={PATH_LEN}
              strokeDasharray={PATH_LEN}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            {/* Bright completed glow */}
            <path
              d={pathD}
              stroke="rgba(52,211,153,0.35)"
              strokeWidth={24}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={PATH_LEN}
              strokeDasharray={PATH_LEN}
              strokeDashoffset={dashOffset}
              filter="url(#slm-path-blur)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>

          {/* ── Level nodes ── */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            {levels.map(level => {
              const pos = positions[level - 1];
              if (!pos) return null;
              const status = getStatus(level);
              return (
                <LevelNode
                  key={level}
                  level={level}
                  status={status}
                  x={pos.x}
                  y={pos.y}
                  stars={getEarnedStars(progress?.miniLevels[level])}
                  isCurrent={level === currentLevel}
                  onClick={() => onSelectLevel(level)}
                />
              );
            })}
          </div>

          {/* ── Astronaut next to the current level ── */}
          <CurrentAstronaut
            x={astronautPos.x}
            y={astronautPos.y}
            isMoving={isMoving}
          />
        </div>
        </div>
      </div>
    </div>
  );
});

SpaceLevelMap.displayName = 'SpaceLevelMap';
export default SpaceLevelMap;
