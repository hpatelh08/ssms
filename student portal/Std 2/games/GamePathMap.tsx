/**
 * 🗺️ GamePathMap — Jungle River Adventure Path
 * =====================================================
 * Interactive jungle river adventure with floating ship for current level.
 *
 * Features:
 *   • Flowing river with water animations
 *   • Ship floating on current level
 *   • Circular level nodes along river path
 *   • Jungle environment decorations (trees, rocks, animals)
 *   • Water effects (ripples, fish, dolphins)
 *   • Smooth animations and hover effects
 *
 * Inspired by Duolingo-style progression with adventure theme.
 */

import React, { useMemo, useEffect, useRef } from 'react';
import type { Difficulty } from './engine/questionGenerator';
import { DIFF_META } from './DifficultySelector';

/** Format level for display */
function formatLevel(level: number): string {
  if (level > 9999) return `${Math.floor(level / 1000)}K+`;
  return String(level);
}

/* ── CSS for animations ── */
const PATH_STYLE_ID = 'game-path-map-css';
if (typeof document !== 'undefined' && !document.getElementById(PATH_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = PATH_STYLE_ID;
  s.textContent = `
    @keyframes floatNode {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
    @keyframes floatBoat {
      0%, 100% { transform: translateX(-50%) translateY(0px) rotate(-2deg); }
      50% { transform: translateX(-50%) translateY(-8px) rotate(2deg); }
    }
    .river-ship {
      position: absolute;
      left: 50%;
      top: -65px;
      width: 85px;
      height: auto;
      transform: translateX(-50%);
      z-index: 6;
      pointer-events: none;
      display: block;
      animation: floatBoat 3.5s ease-in-out infinite;
      filter: drop-shadow(0 8px 16px rgba(0,0,0,0.35));
    }
    @media (max-width: 768px) {
      .river-ship {
        width: 70px;
        top: -50px;
      }
    }
    .completion-badge {
      position: absolute;
      top: -38px;
      right: -34px;
      width: 100px;
      height: 82px;
      z-index: 56;
      pointer-events: none;
    }
    .completion-flag {
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      height: auto;
      z-index: 50;
      pointer-events: none;
      filter: drop-shadow(0 5px 12px rgba(0,0,0,0.45));
      animation: float-gentle 3s ease-in-out infinite;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
    @media (max-width: 768px) {
      .completion-badge {
        width: 74px;
        height: 62px;
        top: -30px;
        right: -24px;
      }
      .completion-flag {
        width: 100%;
      }
    }
    @keyframes swimFish {
      0% { transform: translateX(0px); }
      50% { transform: translateX(20px); }
      100% { transform: translateX(0px); }
    }
    @keyframes jumpDolphin {
      0%, 90%, 100% { transform: translateY(0px) rotate(0deg); }
      30% { transform: translateY(-40px) rotate(-10deg); }
      60% { transform: translateY(-20px) rotate(10deg); }
    }
    @keyframes waveFlow {
      0% { transform: translateX(0); }
      100% { transform: translateX(-100px); }
    }
    @keyframes sparkle {
      0%, 100% { opacity: 0; transform: scale(0); }
      50% { opacity: 1; transform: scale(1); }
    }
    @keyframes float-gentle {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-5px) rotate(2deg); }
      66% { transform: translateY(-2px) rotate(-2deg); }
    }
    @keyframes flow {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: 200; }
    }
    @keyframes wavePattern {
      0% { transform: translateX(0); }
      100% { transform: translateX(50px); }
    }
    @keyframes flyButterfly {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(15px, -10px) rotate(5deg); }
      50% { transform: translate(30px, -5px) rotate(-5deg); }
      75% { transform: translate(15px, -15px) rotate(5deg); }
    }
    @keyframes flyBird {
      0% { transform: translateX(-100px) translateY(0); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateX(100vw) translateY(-30px); opacity: 0; }
    }
    @keyframes driftLeaf {
      0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
      100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
    }
    @keyframes lightRay {
      0%, 100% { opacity: 0.1; }
      50% { opacity: 0.3; }
    }
    @keyframes lilyFloat {
      0%, 100% { transform: translateY(0) rotate(-2deg); }
      50% { transform: translateY(-3px) rotate(2deg); }
    }
    @keyframes sailShip {
      0% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(30px, 10px) rotate(2deg); }
      50% { transform: translate(60px, 20px) rotate(-2deg); }
      75% { transform: translate(90px, 30px) rotate(2deg); }
      100% { transform: translate(120px, 40px) rotate(0deg); }
    }
    @keyframes star-glint {
      0%, 100% { transform: scale(1) rotate(-4deg); }
      50% { transform: scale(1.06) rotate(4deg); }
    }
    .path-node {
      animation: floatNode 3s ease-in-out infinite;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
    .path-node:hover {
      transform: scale(1.1) translateY(-8px);
      box-shadow: 0 0 20px rgba(52, 211, 153, 0.6), 0 12px 30px rgba(0,0,0,0.2);
    }
    .path-node:active {
      transform: scale(0.95) translateY(0px);
    }
    .path-node.locked {
      opacity: 0.35;
      cursor: not-allowed;
      animation: none;
    }
    .path-node.completed {
      animation: floatNode 3s ease-in-out infinite;
    }
    .star-icon {
      animation: star-glint 3.2s ease-in-out infinite;
    }
    .decoration {
      animation: float-gentle 4s ease-in-out infinite;
      pointer-events: none;
    }
    .path-river {
      stroke-dasharray: 200;
      animation: flow 8s linear infinite;
    }
    .path-scroll-container {
      scrollbar-width: thin;
      scrollbar-color: rgba(52, 211, 153, 0.3) rgba(229, 231, 235, 0.3);
    }
    .path-scroll-container::-webkit-scrollbar {
      width: 8px;
    }
    .path-scroll-container::-webkit-scrollbar-track {
      background: rgba(229, 231, 235, 0.3);
      border-radius: 10px;
    }
    .path-scroll-container::-webkit-scrollbar-thumb {
      background: rgba(52, 211, 153, 0.4);
      border-radius: 10px;
    }
    .path-scroll-container::-webkit-scrollbar-thumb:hover {
      background: rgba(52, 211, 153, 0.6);
    }
    .level-tooltip {
      position: absolute;
      bottom: -38px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(5, 150, 105, 0.95));
      color: white;
      padding: 8px 14px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .path-node:hover .level-tooltip {
      opacity: 1;
      transform: translateX(-50%) translateY(-5px);
    }
    .island-checkpoint {
      animation: float-gentle 4s ease-in-out infinite;
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25));
    }
    @media (max-width: 768px) {
      .path-node {
        width: 70px !important;
        height: 70px !important;
      }
      .path-node .level-number {
        font-size: 18px !important;
      }
    }
  `;
  document.head.appendChild(s);
}

interface LevelNodeProps {
  level: number;
  status: 'completed' | 'current' | 'available' | 'locked';
  difficulty: Difficulty;
  position: { x: number; y: number };
   mapWidth: number;
  onClick: () => void;
  nodeRef?: React.RefObject<HTMLDivElement | null>;
}

const LevelNode: React.FC<LevelNodeProps> = React.memo(
  ({ level, status, difficulty, position, mapWidth, onClick, nodeRef }) => {
    const _meta = DIFF_META[difficulty];
    const isLocked = status === 'locked';
    const isActive = status === 'current';
    const isCompleted = status === 'completed';

    const bgColor =
      isCompleted ? '#ffffff'
      : isActive ? '#ffffff'
      : isLocked ? '#e5e7eb'
      : '#ffffff';

    const borderColor =
      isCompleted || isActive ? 'none'
      : isLocked ? '#d1d5db'
      : '#10b981';

    const textColor =
      isCompleted || isActive ? '#10b981'
      : isLocked ? '#9ca3af'
      : '#047857';

    const glowColor = isActive ? 'rgba(52, 211, 153, 0.3)' : 'transparent';

    return (
      <div
        ref={nodeRef}
        onClick={!isLocked ? onClick : undefined}
        className={`path-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
        style={{
          position: 'absolute',
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
          width: 90,
          height: 90,
          borderRadius: '50%',
          backgroundColor: bgColor,
          border: borderColor !== 'none' ? `6px solid ${borderColor}` : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          ['--glow-color' as any]: glowColor,
          zIndex: isActive ? 30 : isCompleted ? 20 : 10,
          animationDelay: `${level * 0.05}s`,
          boxShadow: isLocked
            ? '0 4px 10px rgba(0, 0, 0, 0.15)'
            : '0 8px 20px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Ship above current level */}
        {isActive && (
          <img
            src="/background/ship.png"
            alt="Ship"
            className="river-ship"
          />
        )}

        <span
          className="level-number"
          style={{
            fontSize: isLocked ? 28 : 28,
            fontWeight: 900,
            color: isLocked ? '#c0c0c0' : textColor,
            lineHeight: 1,
            textShadow: isCompleted || isActive 
              ? '0 2px 0 rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.4), 0 -1px 0 rgba(16,185,129,0.15)'
              : undefined,
            position: 'relative',
            zIndex: 15,
          }}
        >
          {isLocked ? '🔒' : formatLevel(level)}
        </span>



        {/* Completed badge cluster: larger flag + gently glinting star */}
        {isCompleted && (
          <div className="completion-badge">
            <img
              src="/background/flag.png"
              alt="Completed"
              className="completion-flag"
            />
            <span
              className="star-icon"
              style={{
                position: 'absolute',
                top: -10,
                left: -12,
                fontSize: 34,
                zIndex: 65,
                filter: 'drop-shadow(0 3px 8px rgba(245,158,11,0.55))',
              }}
            >
              ⭐
            </span>
          </div>
        )}

        {isCompleted && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.8)',
              marginTop: 2,
            }}
          >
            ✓
          </span>
        )}

        <div className="level-tooltip">
          {isCompleted ? 'Completed!' : isActive ? 'Current Level' : isLocked ? 'Locked' : `Level ${level}`}
        </div>
      </div>
    );
  }
);

LevelNode.displayName = 'LevelNode';

interface PathMapProps {
  difficulty: Difficulty;
  totalLevels: number;
  progress: any;
  currentLevel: number;
  onSelectLevel: (level: number) => void;
  getStatus: (level: number) => 'completed' | 'current' | 'available' | 'locked';
}

export const GamePathMap: React.FC<PathMapProps> = React.memo(({
  difficulty,
  totalLevels,
  progress,
  currentLevel,
  onSelectLevel,
  getStatus,
}) => {
  const _meta = DIFF_META[difficulty];
  const _progress = progress;

  const containerRef = useRef<HTMLDivElement>(null);
  const activeNodeRef = useRef<HTMLDivElement>(null);

  const mapWidth = 900;
  const mapHeight = Math.max(1400, totalLevels * 170 + 260);
  const bgAspectRatio = 992 / 1536;

  useEffect(() => {
    if (activeNodeRef.current && containerRef.current) {
      const container = containerRef.current;
      const node = activeNodeRef.current;
      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();

      const scrollTop =
        node.offsetTop - container.offsetTop - (containerRect.height / 2) + (nodeRect.height / 2);

      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      });
    }
  }, [currentLevel]);

  const positions = useMemo(() => {
    const points: Array<{ x: number; y: number }> = [];

    // River path pattern - alternating left and right with smooth curves
    const riverPattern = [
      50, 38, 62, 35, 65, 38, 62, 40, 60, 42,
      58, 44, 62, 46, 60, 48, 62, 50, 60, 52,
      58, 54, 62, 56, 60, 58, 62, 60, 60, 62
    ];

    const verticalSpacing = totalLevels > 1 ? 94 / (totalLevels - 1) : 0;

    for (let i = 0; i < totalLevels; i++) {
      // Use river pattern, cycling if we have more levels
      const patternIndex = i % riverPattern.length;
      const x = riverPattern[patternIndex];
      
      // Vertical position as percentage: start at 3%, end at 97%
      const y = 3 + (i * verticalSpacing);

      points.push({ x, y });
    }

    return points;
  }, [totalLevels]);

  const pathData = useMemo(() => {
    if (positions.length === 0) return '';

    // Convert percentage positions to viewBox coordinates
    const scaleX = (x: number) => (x / 100) * mapWidth;
    const scaleY = (y: number) => (y / 100) * mapHeight;

    let d = `M ${scaleX(positions[0].x)} ${scaleY(positions[0].y)}`;

    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];

      const controlPoint1X = scaleX(prev.x) + (scaleX(curr.x) - scaleX(prev.x)) * 0.4;
      const controlPoint1Y = scaleY(prev.y) + (scaleY(curr.y) - scaleY(prev.y)) * 0.3;
      const controlPoint2X = scaleX(prev.x) + (scaleX(curr.x) - scaleX(prev.x)) * 0.6;
      const controlPoint2Y = scaleY(prev.y) + (scaleY(curr.y) - scaleY(prev.y)) * 0.7;

      d += ` C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${scaleX(curr.x)} ${scaleY(curr.y)}`;
    }

    return d;
  }, [positions, mapWidth, mapHeight]);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0px',
        background: 'transparent',
      }}
    >
     <div
  ref={containerRef}
  className="path-scroll-container"
  style={{
    width: `92vw`,
    maxWidth: '1100px',
    height: '85vh',
    overflowY: 'auto',
    overflowX: 'hidden',
    borderRadius: 24,
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    position: 'relative',
    margin: 0,
    padding: 0,
  }}
>
        <div
  style={{
    width: '100%',
    minWidth: '100%',
    height: `${mapHeight}px`,
    position: 'relative',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    borderRadius: 24,
  }}
>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              backgroundColor: '#8ed9e8',
              backgroundImage: "url('/background/background.png')",
              backgroundSize: '100% auto',
              backgroundPosition: 'top center',
              backgroundRepeat: 'repeat-y',
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 100%)',
            }}
          />

          <div style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none', zIndex: 2 }}>
            <div className="decoration" style={{ position: 'absolute', left: '5%', top: '8%', fontSize: 56, animationDelay: '0s' }}>🌴</div>
            <div className="decoration" style={{ position: 'absolute', right: '7%', top: '15%', fontSize: 52, animationDelay: '0.5s' }}>🌴</div>
            <div className="decoration" style={{ position: 'absolute', left: '8%', top: '28%', fontSize: 48, animationDelay: '1s' }}>🌴</div>
            <div className="decoration" style={{ position: 'absolute', right: '6%', top: '42%', fontSize: 54, animationDelay: '1.5s' }}>🌴</div>
            <div className="decoration" style={{ position: 'absolute', left: '6%', top: '58%', fontSize: 50, animationDelay: '2s' }}>🌴</div>
            <div className="decoration" style={{ position: 'absolute', right: '8%', top: '72%', fontSize: 52, animationDelay: '2.5s' }}>🌴</div>
            <div className="decoration" style={{ position: 'absolute', left: '7%', top: '86%', fontSize: 48, animationDelay: '3s' }}>🌴</div>

            <div className="decoration" style={{ position: 'absolute', left: '12%', top: '20%', fontSize: 38, animationDelay: '0.7s' }}>🪨</div>
            <div className="decoration" style={{ position: 'absolute', right: '14%', top: '35%', fontSize: 36, animationDelay: '1.3s' }}>🌿</div>
            <div className="decoration" style={{ position: 'absolute', left: '15%', top: '50%', fontSize: 40, animationDelay: '1.8s' }}>🪨</div>
            <div className="decoration" style={{ position: 'absolute', right: '13%', top: '65%', fontSize: 34, animationDelay: '2.3s' }}>🌿</div>
            <div className="decoration" style={{ position: 'absolute', left: '14%', top: '78%', fontSize: 38, animationDelay: '2.8s' }}>🪨</div>

            <div className="decoration" style={{ position: 'absolute', right: '10%', top: '24%', fontSize: 32, animationDelay: '1.1s' }}>🌺</div>
            <div className="decoration" style={{ position: 'absolute', left: '11%', top: '38%', fontSize: 30, animationDelay: '1.6s' }}>🌸</div>
            <div className="decoration" style={{ position: 'absolute', right: '12%', top: '55%', fontSize: 34, animationDelay: '2.1s' }}>🌺</div>
            <div className="decoration" style={{ position: 'absolute', left: '10%', top: '68%', fontSize: 28, animationDelay: '2.6s' }}>🌸</div>

            <div className="decoration" style={{ position: 'absolute', left: '18%', top: '14%', fontSize: 40, animationDelay: '0.8s', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))' }}>🛖</div>
            <div className="decoration" style={{ position: 'absolute', left: '16%', top: '56%', fontSize: 38, animationDelay: '2.2s', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))' }}>🛖</div>

            <div className="decoration" style={{ position: 'absolute', right: '16%', top: '18%', fontSize: 36, animationDelay: '0.9s', filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.35))' }}>💎</div>
            <div className="decoration" style={{ position: 'absolute', right: '18%', top: '48%', fontSize: 38, animationDelay: '1.9s', filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.35))' }}>🏆</div>
            <div className="decoration" style={{ position: 'absolute', right: '15%', top: '78%', fontSize: 40, animationDelay: '2.9s', filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.35))' }}>💰</div>

            <div className="island-checkpoint" style={{ position: 'absolute', left: '20%', top: '33%', fontSize: 44, animationDelay: '1.4s' }}>🏝️</div>
            <div className="island-checkpoint" style={{ position: 'absolute', right: '22%', top: '68%', fontSize: 42, animationDelay: '2.4s' }}>🏝️</div>
          </div>

          <div style={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none', zIndex: 3 }}>
            <div style={{ position: 'absolute', left: '20%', top: '15%', fontSize: 32, animation: 'swimFish 5s ease-in-out infinite', animationDelay: '0s' }}>🐟</div>
            <div style={{ position: 'absolute', right: '25%', top: '30%', fontSize: 28, animation: 'swimFish 5s ease-in-out infinite', animationDelay: '1s' }}>🐠</div>
            <div style={{ position: 'absolute', left: '30%', top: '48%', fontSize: 30, animation: 'swimFish 5s ease-in-out infinite', animationDelay: '2s' }}>🐟</div>
            <div style={{ position: 'absolute', right: '28%', top: '62%', fontSize: 26, animation: 'swimFish 5s ease-in-out infinite', animationDelay: '3s' }}>🐠</div>
            <div style={{ position: 'absolute', left: '24%', top: '78%', fontSize: 32, animation: 'swimFish 5s ease-in-out infinite', animationDelay: '4s' }}>🐟</div>
          </div>

          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', zIndex: 4 }}>
            <div style={{ position: 'absolute', left: '18%', top: '35%', fontSize: 24, animation: 'waveFlow 6s ease-in-out infinite', animationDelay: '0s' }}>⛵</div>
            <div style={{ position: 'absolute', right: '22%', top: '60%', fontSize: 22, animation: 'waveFlow 6s ease-in-out infinite', animationDelay: '3s' }}>⛵</div>
          </div>

          <svg
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <defs>
              <linearGradient id={`path-gradient-${difficulty}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6ED6FF" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#5CCEF5" stopOpacity="1" />
                <stop offset="100%" stopColor="#4FC3F7" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id={`water-fill-${difficulty}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#6ED6FF" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#4FC3F7" stopOpacity="0.6" />
              </linearGradient>
              <filter id={`glow-${difficulty}`}>
                <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`shadow-${difficulty}`}>
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.25" />
              </filter>
            </defs>

            <path
              d={pathData}
              stroke={`url(#water-fill-${difficulty})`}
              strokeWidth="120"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
            />
            <path
              d={pathData}
              stroke="#6ED6FF"
              strokeWidth="80"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
              filter={`url(#shadow-${difficulty})`}
            />
            <path
              className="path-river"
              d={pathData}
              stroke={`url(#path-gradient-${difficulty})`}
              strokeWidth="65"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#glow-${difficulty})`}
              opacity="0.85"
            />
            <path
              d={pathData}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="12 8"
              opacity="0.7"
            />
            <path
              d={pathData}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8 12"
              style={{ animation: 'wavePattern 4s linear infinite' }}
            />
          </svg>

          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
            {positions.map((pos, index) => {
              const level = index + 1;
              const status = getStatus(level);

              return (
                <LevelNode
                  key={level}
                  level={level}
                  status={status}
                  difficulty={difficulty}
                  position={pos}
                  mapWidth={mapWidth}
                  onClick={() => onSelectLevel(level)}
                  nodeRef={status === 'current' ? activeNodeRef : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

GamePathMap.displayName = 'GamePathMap';