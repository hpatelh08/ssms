/**
 * child/EcoSystemPage.tsx
 * ─────────────────────────────────────────────────────
 * Eco System Module — Pyramid-layout topic selection
 *
 * Flow: Splash → Pyramid (10 topics) → SpaceLevelMap (40 levels) → Playing → Complete → (Locked)
 *
 * Features:
 *  • 10 eco topics in a centered pyramid layout (1-2-3-4)
 *  • Each topic → SpaceLevelMap with 40 levels
 *  • Topic-specific questions (4 content + 1 math per level)
 *  • Sequential level unlock, star rating (3★/2★/1★/fail)
 *  • Daily limit: 10 levels/day, 24h cooldown
 *  • Progress saved per topic
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMascotTrigger } from './useMascotController';
import { TimeUpModal } from '../components/TimeUpModal';
import { FloatingTimer } from '../components/FloatingTimer';
import { usePlaytimeControl } from '../hooks/usePlaytimeControl';
import {
  ECO_TOPICS, generateEcoLevel, QUESTIONS_PER_LEVEL, LEVELS_PER_TOPIC,
  loadEcoProgress, saveEcoProgress, getEcoDailyStatus, recordEcoLevelComplete,
  getStarRating, isLevelPassed, getEcoTopicProgress, getEcoCurrentLevel,
  type EcoTopic, type EcoQuestion, type EcoDailyProgress, type EcoDailyStatus,
} from './ecoSystemData';

/* ── Asset imports for space level map ── */
import bgImg from '../assets/background/space-background.png';
import roleImg from '../assets/characters/role.png';
import planetGreenImg from '../assets/planets/planet-green-ring.png';
import planetOrangeImg from '../assets/planets/planet-orange-ring.png';
import rocketImg from '../assets/vehicles/rocket-blue-red.png';
import satelliteImg from '../assets/space-objects/satellite.png';
import asteroidImg from '../assets/space-objects/asteroid.png';
import galaxyPurpleImg from '../assets/galaxies/galaxy-purple-blue.png';
import galaxyGoldenImg from '../assets/galaxies/galaxy-golden.png';
import nebulaImg from '../assets/nebula/nebula-pink-purple.png';

/* ── Sound helpers ──────────────────────────────── */

const audioCtx = typeof window !== 'undefined'
  ? new (window.AudioContext || (window as any).webkitAudioContext)()
  : null;

function playSelect() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'sine'; osc.frequency.value = 520;
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

function playCorrect() {
  if (!audioCtx) return;
  [660, 880].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.12 + 0.25);
    osc.start(audioCtx.currentTime + i * 0.12);
    osc.stop(audioCtx.currentTime + i * 0.12 + 0.25);
  });
}

function playWrong() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'square'; osc.frequency.value = 180;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

/* ── Eco-themed Background ──────────────────────── */

const EcoBackground: React.FC = React.memo(() => {
  /* Floating nature particles: leaves, butterflies, bubbles */
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => {
      const kind = i % 5;
      return {
        id: i,
        emoji: kind === 0 ? '🍃' : kind === 1 ? '🌿' : kind === 2 ? '🦋' : kind === 3 ? '💧' : '✨',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 12 + 10,
        dur: Math.random() * 8 + 6,
        delay: Math.random() * 4,
        drift: (Math.random() - 0.5) * 30,
      };
    })
  , []);

  return (
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(180deg, #0d3b1e 0%, #14532d 20%, #0f4a2e 40%, #134e3a 60%, #1a3c34 80%, #0c2e1e 100%)',
    }}>
      {/* Soft radial glows for depth */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 50% at 30% 20%, rgba(34,197,94,0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 40% at 70% 70%, rgba(59,130,246,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(251,191,36,0.05) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Floating nature particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            pointerEvents: 'none',
            opacity: 0.35,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, p.drift, 0],
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, p.drift > 0 ? 20 : -20, 0],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
});
EcoBackground.displayName = 'EcoBackground';

/* ── Pyramid Topic Map ─────────────────────────── */

const PYRAMID_ROWS = [
  ECO_TOPICS.filter(t => t.row === 1),
  ECO_TOPICS.filter(t => t.row === 2),
  ECO_TOPICS.filter(t => t.row === 3),
  ECO_TOPICS.filter(t => t.row === 4),
];

const PyramidMap: React.FC<{
  daily: EcoDailyProgress;
  status: EcoDailyStatus;
  onSelect: (t: EcoTopic) => void;
  onBack: () => void;
}> = React.memo(({ daily, status, onSelect, onBack }) => {
  let cardIndex = 0;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col p-4"
      style={{ zIndex: 30, overflowY: 'auto' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Back + Stats */}
      <div className="flex items-center justify-between mb-2 mt-1 shrink-0">
        <motion.button
          onClick={onBack}
          className="cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '8px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e2e8f0', fontSize: 14, fontWeight: 700,
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          ← Back
        </motion.button>
        <div className="flex items-center gap-2">
          <div style={{
            padding: '4px 12px', borderRadius: 10,
            background: status.canPlay ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${status.canPlay ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: status.canPlay ? '#22c55e' : '#ef4444',
            fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
          }}>
            🎮 {status.remaining} left today
          </div>
          <div style={{
            padding: '4px 12px', borderRadius: 10,
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.3)',
            color: '#a855f7', fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
          }}>
            ⭐ {daily.totalCompleted}
          </div>
        </div>
      </div>

      {/* Title */}
      <motion.h2
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 900,
          textAlign: 'center', margin: '8px 0 4px',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        <span>{'\u{1F30D}'}</span>{' '}
        <span style={{
          background: 'linear-gradient(135deg, #22c55e, #3b82f6, #fbbf24)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Eco System</span>
      </motion.h2>
      <p style={{
        color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 20,
        fontFamily: 'Nunito, sans-serif',
      }}>
        Choose a topic to explore
      </p>

      {/* Pyramid Layout */}
      <div className="flex flex-col items-center gap-4 pb-20 mx-auto w-full" style={{ maxWidth: 720 }}>
        {PYRAMID_ROWS.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="flex justify-center gap-3 w-full"
            style={{ flexWrap: 'wrap' }}
          >
            {row.map((topic) => {
              const tp = getEcoTopicProgress(daily, topic.id);
              const currentLvl = Math.min(tp.highestLevel + 1, LEVELS_PER_TOPIC);
              const totalStars = Object.values(tp.levels).reduce((s, l) => s + l.stars, 0);
              const thisIndex = cardIndex++;

              return (
                <motion.button
                  key={topic.id}
                  onClick={() => { playSelect(); onSelect(topic); }}
                  className="cursor-pointer text-center"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: thisIndex * 0.06 }}
                  whileHover={{
                    scale: 1.08,
                    boxShadow: `0 0 35px ${topic.glowColor}`,
                  }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '16px 12px',
                    borderRadius: 20,
                    background: `linear-gradient(135deg, ${topic.color}18, ${topic.color}08)`,
                    border: `2px solid ${topic.color}35`,
                    backdropFilter: 'blur(8px)',
                    fontFamily: 'Nunito, sans-serif',
                    transition: 'box-shadow 0.3s, border-color 0.3s',
                    width: rowIdx <= 1 ? 'clamp(140px, 40vw, 180px)' : 'clamp(130px, 23vw, 160px)',
                    minHeight: 140,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Glow ring */}
                  <div style={{
                    position: 'absolute', inset: -2, borderRadius: 22,
                    background: `radial-gradient(circle at 50% 0%, ${topic.color}20, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />

                  {/* Icon */}
                  <motion.div
                    style={{ fontSize: 38, lineHeight: 1, position: 'relative' }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: thisIndex * 0.3 }}
                  >
                    {topic.icon}
                  </motion.div>

                  {/* Name */}
                  <div style={{
                    color: '#f1f5f9', fontSize: 13, fontWeight: 900,
                    lineHeight: 1.2, position: 'relative',
                  }}>
                    {topic.name}
                  </div>

                  {/* Level + Stars */}
                  <div style={{
                    color: topic.color, fontSize: 11, fontWeight: 700,
                    position: 'relative',
                  }}>
                    Lvl {currentLvl}{totalStars > 0 ? ` • ⭐${totalStars}` : ''}
                  </div>
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
});
PyramidMap.displayName = 'PyramidMap';

/* ═══════════════════════════════════════════════════
   ECO SPACE LEVEL MAP — SpaceLevelMap-style level selection
   Purple=current, Green=completed, Red=locked
   Space background, glowing curved path, 3D nodes, role.png avatar
   ═══════════════════════════════════════════════════ */

const SLM_ASSETS = {
  bg: bgImg, role: roleImg,
  planetGreen: planetGreenImg, planetOrange: planetOrangeImg,
  rocket: rocketImg, satellite: satelliteImg, asteroid: asteroidImg,
  galaxyPurple: galaxyPurpleImg, galaxyGolden: galaxyGoldenImg, nebula: nebulaImg,
};

/* ── CSS keyframes (injected once) ── */
const SLM_CSS_ID = 'eco-slm-css';
const SLM_KEYFRAMES = `
@keyframes eslm-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes eslm-glow{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
@keyframes eslm-neon-ring{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.8;transform:scale(1.1)}}
@keyframes eslm-sparkle{0%,100%{opacity:0;transform:scale(0) rotate(0deg)}50%{opacity:1;transform:scale(1.2) rotate(180deg)}}
@keyframes eslm-star-shine{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.25);opacity:1}}
@keyframes eslm-twinkle{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
@keyframes eslm-path-particles{0%{stroke-dashoffset:22}100%{stroke-dashoffset:0}}
@keyframes eslm-shimmer{0%{stroke-dashoffset:18}100%{stroke-dashoffset:0}}
@keyframes eslm-drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes eslm-orbit{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-8px) rotate(5deg)}}
@keyframes eslm-nebula-breathe{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
@keyframes eslm-role-idle{0%,100%{transform:translate(-50%,-100%) translateY(0)}50%{transform:translate(-50%,-100%) translateY(-10px)}}
@keyframes eslm-role-glow{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.7;transform:scale(1.1)}}
@keyframes eslm-bounce-land{0%{transform:translate(-50%,-100%) translateY(-20px);opacity:.5}60%{transform:translate(-50%,-100%) translateY(4px)}100%{transform:translate(-50%,-100%) translateY(0);opacity:1}}
.eslm-scroll::-webkit-scrollbar{display:none}
.eslm-scroll{-ms-overflow-style:none;scrollbar-width:none}
`;

/* ── Layout constants ── */
const NODE_SIZE = 70;
const NODE_GAP_Y = 110;
const MAP_PADDING_TOP = 260;
const MAP_PADDING_BOTTOM = 160;
const PATH_AMPLITUDE = 0.28;

type EcoNodeStatus = 'completed' | 'current' | 'locked';

function computeEcoPositions(total: number, containerWidth: number) {
  const positions: { x: number; y: number }[] = [];
  const cx = containerWidth / 2;
  const amplitude = containerWidth * PATH_AMPLITUDE;
  for (let i = 0; i < total; i++) {
    const y = MAP_PADDING_TOP + i * NODE_GAP_Y;
    const x = cx + Math.sin((i / total) * Math.PI * 6) * amplitude;
    positions.push({ x, y });
  }
  return positions;
}

function buildEcoCurvedPath(positions: { x: number; y: number }[]) {
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

/* ── Twinkling Stars ── */
const EcoTwinklingStars: React.FC<{ mapHeight: number; containerWidth: number }> = React.memo(({ mapHeight, containerWidth }) => {
  const stars = useMemo(() => {
    const result: { x: number; y: number; size: number; delay: number; dur: number }[] = [];
    for (let i = 0; i < 100; i++) {
      const hash = (i * 2654435761) >>> 0;
      result.push({
        x: hash % containerWidth,
        y: (hash * 3) % mapHeight,
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
            position: 'absolute', left: s.x, top: s.y,
            width: s.size, height: s.size, borderRadius: '50%',
            background: i % 5 === 0 ? '#C4B5FD' : i % 3 === 0 ? '#93C5FD' : '#fff',
            animation: `eslm-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
});
EcoTwinklingStars.displayName = 'EcoTwinklingStars';

/* ── Parallax Decorations ── */
interface EcoDecorItem {
  src: string; x: string; y: number; width: number;
  opacity: number; parallaxSpeed: number; animation?: string; zIndex: number; rotate?: number;
}

const EcoParallaxDecor: React.FC<{ items: EcoDecorItem[]; scrollY: number }> = React.memo(({ items, scrollY }) => (
  <>
    {items.map((item, i) => {
      const parallaxOffset = scrollY * (1 - item.parallaxSpeed);
      return (
        <img key={i} src={item.src} alt="" draggable={false} style={{
          position: 'absolute', left: item.x, top: item.y + parallaxOffset,
          width: item.width, height: 'auto', opacity: item.opacity,
          zIndex: item.zIndex, pointerEvents: 'none',
          animation: item.animation,
          transform: item.rotate ? `rotate(${item.rotate}deg)` : undefined,
          userSelect: 'none',
        }} />
      );
    })}
  </>
));
EcoParallaxDecor.displayName = 'EcoParallaxDecor';

/* ── Level Node (3D glossy circle) ── */
const EcoLevelNode: React.FC<{
  level: number; status: EcoNodeStatus; x: number; y: number; isCurrent: boolean;
  stars: number; onClick: () => void;
}> = React.memo(({ level, status, x, y, isCurrent, stars, onClick }) => {
  const bg =
    status === 'completed'
      ? 'linear-gradient(160deg, #6EE7B7 0%, #34D399 35%, #059669 100%)'
      : status === 'current'
        ? 'linear-gradient(160deg, #C4B5FD 0%, #A78BFA 30%, #7C3AED 70%, #6D28D9 100%)'
        : 'linear-gradient(160deg, #7f1d1d 0%, #991b1b 40%, #b91c1c 100%)';

  const border =
    status === 'completed' ? '3px solid rgba(110,231,183,0.7)'
    : status === 'current' ? '3px solid rgba(196,181,253,0.8)'
    : '3px solid rgba(185,28,28,0.6)';

  const shadow =
    status === 'completed'
      ? '0 6px 20px rgba(5,150,105,0.45), 0 0 30px rgba(52,211,153,0.25), inset 0 -3px 6px rgba(0,0,0,0.15)'
    : status === 'current'
      ? '0 0 35px rgba(124,58,237,0.6), 0 0 60px rgba(168,85,247,0.3), 0 6px 20px rgba(0,0,0,0.35), inset 0 -3px 6px rgba(0,0,0,0.2)'
    : '0 2px 8px rgba(127,29,29,0.5), 0 0 15px rgba(185,28,28,0.2), inset 0 -2px 4px rgba(0,0,0,0.25)';

  return (
    <div style={{
      position: 'absolute', left: x - NODE_SIZE / 2, top: y - NODE_SIZE / 2,
      width: NODE_SIZE, height: NODE_SIZE, zIndex: isCurrent ? 20 : 10, overflow: 'visible',
    }}>
      {/* Neon outer ring for current */}
      {status === 'current' && (
        <div style={{
          position: 'absolute', inset: -10, borderRadius: '50%',
          border: '2px solid rgba(168,85,247,0.5)',
          animation: 'eslm-neon-ring 2s ease-in-out infinite', pointerEvents: 'none',
        }} />
      )}
      {/* Glow aura for current */}
      {status === 'current' && (
        <div style={{
          position: 'absolute', inset: -18, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(124,58,237,0.15) 45%, transparent 70%)',
          animation: 'eslm-glow 2.5s ease-in-out infinite', pointerEvents: 'none',
        }} />
      )}
      {/* Sparkle particles for current */}
      {status === 'current' && [0,1,2,3,4,5].map(i => (
        <span key={i} style={{
          position: 'absolute', fontSize: 8 + (i % 3) * 2,
          top: `${-10 + (i * 20) % 110}%`, left: `${-20 + (i * 28) % 120}%`,
          animation: `eslm-sparkle ${1.2 + i * 0.25}s ease-in-out ${i * 0.2}s infinite`,
          pointerEvents: 'none', opacity: 0.8,
        }}>✦</span>
      ))}

      <button
        onClick={status !== 'locked' ? onClick : undefined}
        disabled={status === 'locked'}
        style={{
          width: NODE_SIZE, height: NODE_SIZE, borderRadius: '50%',
          border, background: bg,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: status === 'locked' ? 'not-allowed' : 'pointer',
          boxShadow: shadow, padding: 0, position: 'relative',
          animation: status === 'current' ? 'eslm-pulse 2s ease-in-out infinite' : undefined,
          opacity: status === 'locked' ? 0.55 : 1, overflow: 'hidden',
        }}
      >
        {/* Glossy highlight */}
        {status !== 'locked' && (
          <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: '45%',
            borderRadius: '50% 50% 50% 50% / 100% 100% 0% 0%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)',
            pointerEvents: 'none',
          }} />
        )}

        {status === 'locked' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}>
            <rect x="4" y="11" width="16" height="11" rx="2" fill="rgba(255,255,255,0.3)" />
            <path d="M8 11V7a4 4 0 018 0v4" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : status === 'completed' ? (
          <>
            <span style={{ fontWeight: 900, fontSize: 21, color: '#fff', lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.25)', position: 'relative', zIndex: 1 }}>
              {level}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginTop: 1, position: 'relative', zIndex: 1 }}>
              <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }} />
            </svg>
          </>
        ) : (
          <span style={{
            fontWeight: 900, fontSize: 24, color: '#fff', lineHeight: 1,
            textShadow: '0 2px 6px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1,
          }}>
            {level}
          </span>
        )}
      </button>

      {/* PLAY badge for current */}
      {isCurrent && (
        <div style={{
          position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #C4B5FD 0%, #7C3AED 100%)',
          color: '#fff', fontSize: 10, fontWeight: 900, padding: '4px 14px', borderRadius: 12,
          letterSpacing: '0.1em',
          boxShadow: '0 3px 14px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
          whiteSpace: 'nowrap' as const, textTransform: 'uppercase' as const,
        }}>
          ▶ PLAY
        </div>
      )}

      {/* Stars for completed */}
      {status === 'completed' && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 2, pointerEvents: 'none',
        }}>
          {[1, 2, 3].map(i => (
            <svg key={i} width="14" height="14" viewBox="0 0 24 24" style={{
              animation: `eslm-star-shine ${1.8 + i * 0.3}s ease-in-out ${i * 0.15}s infinite`,
              opacity: i <= stars ? 1 : 0.2,
            }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                fill={i <= stars ? '#FBBF24' : '#555'} stroke={i <= stars ? '#F59E0B' : '#444'} strokeWidth="0.5" />
            </svg>
          ))}
        </div>
      )}
    </div>
  );
});
EcoLevelNode.displayName = 'EcoLevelNode';

/* ── Player Avatar (role.png) ── */
const EcoPlayerAvatar: React.FC<{ x: number; y: number; isMoving: boolean }> = React.memo(({ x, y, isMoving }) => (
  <div style={{
    position: 'absolute', left: x, top: y, transform: 'translate(-50%, -100%)',
    zIndex: 30, pointerEvents: 'none', width: 200, height: 200,
    transition: isMoving ? 'left 0.8s cubic-bezier(0.4,0,0.2,1), top 0.8s cubic-bezier(0.4,0,0.2,1)' : undefined,
    animation: isMoving ? 'eslm-bounce-land 0.5s ease 0.8s both' : 'eslm-role-idle 2.5s ease-in-out infinite',
  }}>
    <div style={{
      position: 'absolute', inset: -10, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
      animation: 'eslm-role-glow 2.5s ease-in-out infinite',
    }} />
    <img src={SLM_ASSETS.role} alt="Player" draggable={false} style={{
      width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1,
      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
    }} />
  </div>
));
EcoPlayerAvatar.displayName = 'EcoPlayerAvatar';

/* ── Main EcoSpaceLevelMap ── */
const EcoSpaceLevelMap: React.FC<{
  topic: EcoTopic; daily: EcoDailyProgress;
  onSelectLevel: (lvl: number) => void; onBack: () => void;
}> = React.memo(({ topic, daily, onSelectLevel, onBack }) => {
  /* Inject CSS once */
  useEffect(() => {
    if (!document.getElementById(SLM_CSS_ID)) {
      const style = document.createElement('style');
      style.id = SLM_CSS_ID;
      style.textContent = SLM_KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  const tp = getEcoTopicProgress(daily, topic.id);
  const currentLvl = getEcoCurrentLevel(daily, topic.id);
  const completedCount = Object.values(tp.levels).filter(l => l.stars >= 1).length;
  const totalStars = Object.values(tp.levels).reduce((s, l) => s + l.stars, 0);
  const pct = Math.round((completedCount / LEVELS_PER_TOPIC) * 100);

  const containerWidth = 480;
  const mapHeight = MAP_PADDING_TOP + LEVELS_PER_TOPIC * NODE_GAP_Y + MAP_PADDING_BOTTOM;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const prevLevelRef = useRef<number | null>(null);

  const positions = useMemo(() => computeEcoPositions(LEVELS_PER_TOPIC, containerWidth), []);
  const pathD = useMemo(() => buildEcoCurvedPath(positions), [positions]);
  const levels = useMemo(() => Array.from({ length: LEVELS_PER_TOPIC }, (_, i) => i + 1), []);

  /* Detect level change */
  useEffect(() => {
    if (prevLevelRef.current !== null && prevLevelRef.current !== currentLvl) {
      setIsMoving(true);
      const timer = setTimeout(() => setIsMoving(false), 1400);
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = currentLvl;
  }, [currentLvl]);

  /* Auto-scroll to current level */
  useEffect(() => {
    if (scrollRef.current && positions[currentLvl - 1]) {
      const nodeY = positions[currentLvl - 1].y;
      const viewportH = scrollRef.current.clientHeight;
      scrollRef.current.scrollTop = Math.max(0, nodeY - viewportH / 2);
    }
  }, [currentLvl, positions]);

  /* Track scroll for parallax */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const getStatus = useCallback((level: number): EcoNodeStatus => {
    const result = tp.levels[level];
    if (result && result.stars >= 1) return 'completed';
    if (level === currentLvl) return 'current';
    return 'locked';
  }, [tp, currentLvl]);

  const PATH_LEN = 1000;
  const fillFraction = currentLvl > 1 ? (currentLvl - 1) / LEVELS_PER_TOPIC : 0;
  const dashOffset = PATH_LEN - fillFraction * PATH_LEN;
  const currentPos = positions[currentLvl - 1] || { x: containerWidth / 2, y: MAP_PADDING_TOP };

  /* Parallax decorations */
  const decorItems = useMemo<EcoDecorItem[]>(() => {
    const h = mapHeight;
    return [
      { src: SLM_ASSETS.galaxyPurple, x: '-30%', y: h * 0.08, width: 1960, opacity: 1, parallaxSpeed: 0.3, zIndex: 0, animation: 'eslm-nebula-breathe 8s ease-in-out infinite' },
      { src: SLM_ASSETS.nebula, x: '-50%', y: h * 0.35, width: 400, opacity: 1, parallaxSpeed: 0.35, zIndex: 0, animation: 'eslm-nebula-breathe 9s ease-in-out 1s infinite' },
      { src: SLM_ASSETS.planetGreen, x: '-75%', y: h * 0.15, width: 900, opacity: 1, parallaxSpeed: 0.55, zIndex: 2, animation: 'eslm-drift 6s ease-in-out infinite' },
      { src: SLM_ASSETS.satellite, x: '-50%', y: h * 0.55, width: 315, opacity: 1, parallaxSpeed: 0.65, zIndex: 2, animation: 'eslm-orbit 7s ease-in-out infinite' },
      { src: SLM_ASSETS.asteroid, x: '-70%', y: h * 0.82, width: 350, opacity: 1, parallaxSpeed: 0.55, zIndex: 2, animation: 'eslm-orbit 8s ease-in-out 1s infinite' },
      { src: SLM_ASSETS.galaxyGolden, x: '55%', y: h * 0.55, width: 1680, opacity: 1, parallaxSpeed: 0.25, zIndex: 0, animation: 'eslm-nebula-breathe 10s ease-in-out 2s infinite' },
      { src: SLM_ASSETS.nebula, x: '70%', y: h * 0.78, width: 380, opacity: 1, parallaxSpeed: 0.3, zIndex: 0, rotate: 180, animation: 'eslm-nebula-breathe 11s ease-in-out 3s infinite' },
      { src: SLM_ASSETS.planetOrange, x: '72%', y: h * 0.42, width: 800, opacity: 1, parallaxSpeed: 0.5, zIndex: 2, animation: 'eslm-drift 7s ease-in-out 1s infinite' },
      { src: SLM_ASSETS.rocket, x: '75%', y: h * 0.2, width: 400, opacity: 1, parallaxSpeed: 0.6, zIndex: 2, animation: 'eslm-drift 5s ease-in-out infinite', rotate: -15 },
      { src: SLM_ASSETS.asteroid, x: '78%', y: h * 0.62, width: 400, opacity: 1, parallaxSpeed: 0.6, zIndex: 2, animation: 'eslm-orbit 6s ease-in-out 2s infinite' },
    ];
  }, [mapHeight]);

  return (
    <motion.div
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        width: '100%', height: '100%', zIndex: 35,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: '#070b1a',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* ── Header Card ── */}
      <div style={{
        width: '100%', background: '#ffffff', flexShrink: 0, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px 12px', background: '#ffffff',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button onClick={onBack} style={{
            width: 42, height: 42, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, background: 'rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer',
            fontWeight: 700, color: 'rgba(0,0,0,0.6)', flexShrink: 0,
          }}>←</button>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
            background: `linear-gradient(135deg, ${topic.color}40, ${topic.color}20)`,
            boxShadow: `0 4px 16px ${topic.glowColor}`,
          }}>{topic.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1a1a2e', letterSpacing: '0.02em', fontFamily: 'Nunito, sans-serif' }}>
              {topic.name}
            </h3>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(0,0,0,0.45)', fontWeight: 600 }}>
              {completedCount}/{LEVELS_PER_TOPIC} completed • ⭐ {totalStars}
            </p>
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#A78BFA' }}>{pct}%</span>
        </div>
        <div style={{ padding: '0 20px 12px', background: '#ffffff' }}>
          <div style={{ width: '100%', height: 6, borderRadius: 99, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: `linear-gradient(90deg, ${topic.color}, ${topic.color}cc)`,
              width: `${pct}%`, transition: 'width 0.6s ease',
              boxShadow: `0 0 14px ${topic.glowColor}`,
            }} />
          </div>
        </div>
      </div>

      {/* ── Space Map ── */}
      <div
        ref={scrollRef}
        className="eslm-scroll"
        style={{
          width: '100%', flex: 1,
          overflowY: 'auto', overflowX: 'hidden',
          position: 'relative', WebkitOverflowScrolling: 'touch',
          backgroundColor: '#070b1a',
          backgroundImage: `url(${SLM_ASSETS.bg})`,
          backgroundSize: 'contain', backgroundPosition: 'top center', backgroundRepeat: 'repeat-y',
        }}
      >
        <div style={{ width: containerWidth, height: mapHeight, margin: '0 auto', position: 'relative' }}>
          <EcoTwinklingStars mapHeight={mapHeight} containerWidth={containerWidth} />
          <EcoParallaxDecor items={decorItems} scrollY={scrollY} />

          {/* Path SVG */}
          <svg
            style={{ position: 'absolute', inset: 0, width: containerWidth, height: mapHeight, zIndex: 5, pointerEvents: 'none' }}
            viewBox={`0 0 ${containerWidth} ${mapHeight}`} fill="none"
          >
            <defs>
              <linearGradient id="eslm-path-outer" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="eslm-path-glow" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#67E8F9" />
                <stop offset="30%" stopColor="#22D3EE" />
                <stop offset="60%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#67E8F9" />
              </linearGradient>
              <linearGradient id="eslm-path-fill" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#6EE7B7" />
                <stop offset="50%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
              <filter id="eslm-path-blur"><feGaussianBlur in="SourceGraphic" stdDeviation="8" /></filter>
            </defs>
            <path d={pathD} stroke="url(#eslm-path-outer)" strokeWidth={42} strokeLinecap="round" strokeLinejoin="round" filter="url(#eslm-path-blur)" />
            <path d={pathD} stroke="url(#eslm-path-glow)" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
            <path d={pathD} stroke="rgba(103,232,249,0.3)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <path d={pathD} stroke="rgba(255,255,255,0.35)" strokeWidth={3} strokeDasharray="4 18" strokeLinecap="round"
              style={{ animation: 'eslm-path-particles 1.5s linear infinite' }} pathLength={PATH_LEN} />
            <path d={pathD} stroke="rgba(103,232,249,0.2)" strokeWidth={2} strokeDasharray="6 12" strokeLinecap="round"
              style={{ animation: 'eslm-shimmer 2.5s linear infinite' }} pathLength={PATH_LEN} />
            <path d={pathD} stroke="url(#eslm-path-fill)" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round"
              pathLength={PATH_LEN} strokeDasharray={PATH_LEN} strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            <path d={pathD} stroke="rgba(52,211,153,0.35)" strokeWidth={24} strokeLinecap="round" strokeLinejoin="round"
              pathLength={PATH_LEN} strokeDasharray={PATH_LEN} strokeDashoffset={dashOffset}
              filter="url(#eslm-path-blur)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          </svg>

          {/* Level nodes */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            {levels.map(level => {
              const pos = positions[level - 1];
              if (!pos) return null;
              const status = getStatus(level);
              const result = tp.levels[level];
              return (
                <EcoLevelNode
                  key={level} level={level} status={status}
                  x={pos.x} y={pos.y} isCurrent={level === currentLvl}
                  stars={result?.stars ?? 0}
                  onClick={() => onSelectLevel(level)}
                />
              );
            })}
          </div>

          {/* Player avatar */}
          <EcoPlayerAvatar x={currentPos.x} y={currentPos.y - NODE_SIZE / 4} isMoving={isMoving} />
        </div>
      </div>
    </motion.div>
  );
});
EcoSpaceLevelMap.displayName = 'EcoSpaceLevelMap';

/* ── Level Complete Overlay ────────────────────── */

const LevelCompleteOverlay: React.FC<{
  topic: EcoTopic;
  levelNum: number;
  score: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  canPlayMore: boolean;
  passed: boolean;
}> = ({ topic, levelNum, score, total, onNext, onBack, canPlayMore, passed }) => {
  const stars = getStarRating(score, total);
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center p-6"
      style={{ zIndex: 55, background: 'rgba(7,11,26,0.95)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0.5, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{ maxWidth: 400 }}
      >
        <motion.div
          style={{ fontSize: 64, marginBottom: 12 }}
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {!passed ? '😢' : stars === 3 ? '🏆' : stars === 2 ? '🌟' : '✨'}
        </motion.div>
        <h2 style={{
          fontSize: 28, fontWeight: 900, color: '#f1f5f9',
          fontFamily: 'Nunito, sans-serif', marginBottom: 4,
        }}>
          {passed ? `Level ${levelNum} Complete!` : `Level ${levelNum} — Try Again!`}
        </h2>
        <p style={{
          color: topic.color, fontSize: 16, fontWeight: 700,
          marginBottom: 4, fontFamily: 'Nunito, sans-serif',
        }}>
          {topic.icon} {topic.name}
        </p>
        {!passed && (
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12, fontFamily: 'Nunito, sans-serif' }}>
            Need at least 3/{total} correct to pass
          </p>
        )}

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-4">
          {[1, 2, 3].map(s => (
            <motion.span
              key={s}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5 + s * 0.2, type: 'spring', stiffness: 200 }}
              style={{ fontSize: 40, opacity: s <= stars ? 1 : 0.15 }}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        <p style={{
          color: '#94a3b8', fontSize: 14, marginBottom: 20,
          fontFamily: 'Nunito, sans-serif',
        }}>
          {score}/{total} correct
        </p>

        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={onBack}
            className="cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '12px 24px', borderRadius: 14,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#e2e8f0', fontSize: 16, fontWeight: 700,
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            🗺️ Topics
          </motion.button>
          {canPlayMore && passed && (
            <motion.button
              onClick={onNext}
              className="cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '12px 24px', borderRadius: 14,
                background: `linear-gradient(135deg, ${topic.color}, ${topic.color}cc)`,
                border: 'none', color: '#fff', fontSize: 16, fontWeight: 800,
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              🚀 Next Level
            </motion.button>
          )}
          {!passed && canPlayMore && (
            <motion.button
              onClick={onNext}
              className="cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '12px 24px', borderRadius: 14,
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                border: 'none', color: '#fff', fontSize: 16, fontWeight: 800,
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              🔄 Retry
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Daily Limit Overlay ───────────────────────── */

const DailyLimitOverlay: React.FC<{
  unlockTime: number;
  totalCompleted: number;
  onBack: () => void;
}> = ({ unlockTime, totalCompleted, onBack }) => {
  const [remaining, setRemaining] = React.useState('');

  useEffect(() => {
    const tick = () => {
      const maxCooldown = 24 * 60 * 60 * 1000;
      const diff = Math.min(Math.max(0, unlockTime - Date.now()), maxCooldown);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [unlockTime]);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center p-6"
      style={{ zIndex: 60, background: 'rgba(7,11,26,0.97)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <motion.div
          style={{ fontSize: 72, marginBottom: 16 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          😴
        </motion.div>
        <h2 style={{
          fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: 900,
          color: '#f1f5f9', fontFamily: 'Nunito, sans-serif', marginBottom: 8,
        }}>
          Great job today!
        </h2>
        <p style={{
          color: '#94a3b8', fontSize: 16,
          fontFamily: 'Nunito, sans-serif', marginBottom: 8,
        }}>
          You completed 10 levels! Come back tomorrow 🌅
        </p>
        <div style={{
          fontSize: 'clamp(28px, 7vw, 44px)', fontWeight: 900,
          color: '#3b82f6', fontFamily: 'monospace', margin: '16px 0',
        }}>
          {remaining}
        </div>
        <p style={{
          color: '#a855f7', fontSize: 14, fontWeight: 700,
          marginBottom: 24, fontFamily: 'Nunito, sans-serif',
        }}>
          ⭐ Total levels completed: {totalCompleted}
        </p>
        <motion.button
          onClick={onBack}
          className="cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '14px 32px', borderRadius: 14,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#e2e8f0', fontSize: 16, fontWeight: 700,
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          ← Back to Home
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

/* ── MAIN COMPONENT ─────────────────────────────── */

type Phase = 'splash' | 'pyramid' | 'spaceMap' | 'playing' | 'complete' | 'locked';

interface Props {
  onBack: () => void;
}

const EcoSystemPage: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<Phase>('splash');
  const [daily, setDaily] = useState<EcoDailyProgress>(() => loadEcoProgress());
  const [topic, setTopic] = useState<EcoTopic | null>(null);
  const [levelNum, setLevelNum] = useState(1);
  const [questions, setQuestions] = useState<EcoQuestion[]>([]);
  const [sub, setSub] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionResults, setQuestionResults] = useState<Array<boolean | null>>(() => Array(QUESTIONS_PER_LEVEL).fill(null));
  const [lastPassed, setLastPassed] = useState(true);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const triggerMascot = useMascotTrigger();

  const status = useMemo<EcoDailyStatus>(() => getEcoDailyStatus(daily), [daily]);

  /* Auto-dismiss splash */
  useEffect(() => {
    const t = setTimeout(() => setPhase('pyramid'), 2200);
    return () => clearTimeout(t);
  }, []);

  const resetQuestionState = useCallback(() => {
    setPicked(null);
    setCorrect(null);
    setShowFeedback(false);
  }, []);

  /* Select a topic → show level map */
  const selectTopic = useCallback((t: EcoTopic) => {
    const fresh = loadEcoProgress();
    const st = getEcoDailyStatus(fresh);
    setDaily(fresh);
    if (!st.canPlay) { setPhase('locked'); return; }
    if (fresh.levelsToday >= 10 && st.canPlay) {
      fresh.levelsToday = 0;
      fresh.lastBatchTimestamp = 0;
      saveEcoProgress(fresh);
      setDaily(fresh);
    }
    resetQuestionState();
    setQuestionResults(Array(QUESTIONS_PER_LEVEL).fill(null));
    setTopic(t);
    setPhase('spaceMap');
  }, [resetQuestionState]);

  /* Start a level */
  const startLevel = useCallback((lvl: number) => {
    if (!topic) return;
    const currentLvl = getEcoCurrentLevel(daily, topic.id);
    if (lvl > currentLvl) return; // locked
    const qs = generateEcoLevel(topic.id, lvl);
    setLevelNum(lvl);
    setQuestions(qs);
    setSub(0);
    setScore(0);
    resetQuestionState();
    setQuestionResults(Array(QUESTIONS_PER_LEVEL).fill(null));
    setLastPassed(true);
    setPhase('playing');
  }, [topic, daily, resetQuestionState]);

  /* Handle answer */
  const handleAnswer = useCallback((idx: number) => {
    const currentQuestion = questions[sub];
    if (picked !== null || showFeedback || !currentQuestion) return;
    if (audioCtx?.state === 'suspended') audioCtx.resume();

    const selectedAnswer = currentQuestion.options[idx] ?? String(idx);
    const correctAnswerIndex = currentQuestion.correct;
    const correctAnswer = currentQuestion.options[correctAnswerIndex] ?? String(correctAnswerIndex);
    const isRight = idx === correctAnswerIndex;

    console.debug('[GameValidation] eco-system', {
      topicId: topic?.id,
      levelNum,
      questionIndex: sub,
      selectedAnswer,
      correctAnswer,
      isCorrect: isRight,
    });

    setPicked(idx);
    setCorrect(isRight);
    setShowFeedback(true);
    setQuestionResults(prev => {
      const next = [...prev];
      next[sub] = isRight;
      return next;
    });
    if (isRight) { playCorrect(); setScore(s => s + 1); triggerMascot('happy'); }
    else { playWrong(); triggerMascot('encourage'); }

    setTimeout(() => {
      resetQuestionState();
      if (sub < QUESTIONS_PER_LEVEL - 1) {
        setSub(s => s + 1);
      } else {
        if (topic) {
          const finalScore = score + (isRight ? 1 : 0);
          const passed = isLevelPassed(finalScore, QUESTIONS_PER_LEVEL);
          setLastPassed(passed);
          if (passed && finalScore >= QUESTIONS_PER_LEVEL * 0.6) triggerMascot('celebrate', 2500);
          const updated = recordEcoLevelComplete(daily, topic.id, levelNum, finalScore, QUESTIONS_PER_LEVEL);
          saveEcoProgress(updated);
          setDaily(updated);
          const nextStatus = getEcoDailyStatus(updated);
          setPhase(nextStatus.canPlay ? 'complete' : 'locked');
        }
      }
    }, 1500);
  }, [picked, questions, sub, showFeedback, score, topic, levelNum, daily, triggerMascot, resetQuestionState]);

  /* Play next or retry */
  const playNext = useCallback(() => {
    if (!topic) return;
    if (lastPassed) {
      resetQuestionState();
      setQuestionResults(Array(QUESTIONS_PER_LEVEL).fill(null));
      setPhase('spaceMap');
    } else {
      const qs = generateEcoLevel(topic.id, levelNum);
      setQuestions(qs);
      setSub(0);
      setScore(0);
      resetQuestionState();
      setQuestionResults(Array(QUESTIONS_PER_LEVEL).fill(null));
      setLastPassed(true);
      setPhase('playing');
    }
  }, [topic, lastPassed, levelNum, resetQuestionState]);

  /* Navigation */
  const backToPyramid = useCallback(() => {
    resetQuestionState();
    setQuestionResults(Array(QUESTIONS_PER_LEVEL).fill(null));
    setPhase('pyramid');
    setTopic(null);
  }, [resetQuestionState]);

  const backToMap = useCallback(() => {
    resetQuestionState();
    setQuestionResults(Array(QUESTIONS_PER_LEVEL).fill(null));
    setPhase('spaceMap');
  }, [resetQuestionState]);

  /* Time expiration */
  const handleTimeExpired = useCallback(() => { setShowTimeUpModal(true); }, []);
  const handleTimeUpGoHome = useCallback(() => { setShowTimeUpModal(false); onBack(); }, [onBack]);

  const q = questions[sub];
  const isPlaying = phase === 'playing';

  usePlaytimeControl({
    isActive: isPlaying && !showTimeUpModal,
    onTimeExpired: handleTimeExpired,
  });

  return (
    <div className="fixed inset-0 overflow-hidden" style={{
      fontFamily: 'Nunito, sans-serif',
      borderRadius: 0, margin: 0, padding: 0,
      width: '100vw', height: '100vh',
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    }}>
      <style>{`
        body, html, #root {
          border-radius: 0 !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>
      <EcoBackground />

      {/* ── Splash ── */}
      <AnimatePresence>
        {phase === 'splash' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 60, background: 'rgba(7,11,26,0.97)' }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              style={{ fontSize: 80 }}
            >
              {'\u{1F30D}'}
            </motion.div>
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: 'clamp(28px, 7vw, 44px)', fontWeight: 900,
                background: 'linear-gradient(135deg, #22c55e, #3b82f6, #fbbf24)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textAlign: 'center',
              }}
            >
              ECO SYSTEM
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ color: '#94a3b8', fontSize: 16 }}
            >
              10 topics of nature & EVS await!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pyramid Topic Screen ── */}
      <AnimatePresence>
        {phase === 'pyramid' && (
          <PyramidMap daily={daily} status={status} onSelect={selectTopic} onBack={onBack} />
        )}
      </AnimatePresence>

      {/* ── Space Level Map ── */}
      <AnimatePresence>
        {phase === 'spaceMap' && topic && (
          <EcoSpaceLevelMap
            key={`levels-${topic.id}`}
            topic={topic}
            daily={daily}
            onSelectLevel={startLevel}
            onBack={backToPyramid}
          />
        )}
      </AnimatePresence>

      {/* ── Level Play ── */}
      <AnimatePresence>
        {phase === 'playing' && topic && q && (
          <motion.div
            key="eco-playing"
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              width: '100%', height: '100%',
              zIndex: 40,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: 20,
              background: 'linear-gradient(180deg, #070b1a 0%, #0f1629 30%, #131b33 60%, #070b1a 100%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* HUD */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between" style={{ zIndex: 42 }}>
              <motion.button
                onClick={backToMap}
                className="cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '6px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#e2e8f0', fontSize: 13, fontWeight: 700,
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                ← Map
              </motion.button>
              <div style={{
                padding: '4px 12px', borderRadius: 10,
                background: `${topic.color}18`,
                border: `1px solid ${topic.color}40`,
                color: topic.color, fontSize: 12, fontWeight: 700,
                fontFamily: 'Nunito, sans-serif',
              }}>
                {topic.icon} Level {levelNum}
              </div>
            </div>

            {/* Sub-level dots */}
            <div className="flex items-center gap-3 mb-6">
              {Array.from({ length: QUESTIONS_PER_LEVEL }, (_, i) => {
                const result = questionResults[i];
                const isCurrent = i === sub;
                const isPending = result === null;

                return (
                  <motion.div
                    key={i}
                    animate={{ scale: isCurrent && isPending ? 1.3 : 1 }}
                    style={{
                      width: 16, height: 16, borderRadius: '50%',
                      background: result === true ? '#22c55e' : result === false ? '#ef4444' : isCurrent ? topic.color : 'rgba(255,255,255,0.15)',
                      border: isCurrent && isPending ? `2px solid ${topic.color}` : 'none',
                      transition: 'background 0.3s',
                    }}
                  />
                );
              })}
            </div>

            {/* Topic icon */}
            <motion.div
              style={{ fontSize: 56, marginBottom: 12 }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {topic.icon}
            </motion.div>

            {/* Question */}
            <motion.h2
              key={`q-${sub}`}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              style={{
                color: '#f1f5f9', fontSize: 'clamp(22px, 5.5vw, 32px)', fontWeight: 900,
                fontFamily: 'Nunito, sans-serif', textAlign: 'center',
                marginBottom: 28, maxWidth: 680, lineHeight: 1.45,
                padding: '0 12px',
              }}
            >
              {q.question}
            </motion.h2>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4 w-full" style={{ maxWidth: 640 }}>
              {q.options.map((opt, i) => {
                let bg = 'rgba(255,255,255,0.08)';
                let border = 'rgba(255,255,255,0.15)';
                if (showFeedback) {
                  if (i === q.correct) { bg = 'rgba(34,197,94,0.3)'; border = '#22c55e'; }
                  else if (i === picked && !correct) { bg = 'rgba(239,68,68,0.3)'; border = '#ef4444'; }
                }
                return (
                  <motion.button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={showFeedback}
                    className="cursor-pointer"
                    whileHover={!showFeedback ? { scale: 1.04 } : {}}
                    whileTap={!showFeedback ? { scale: 0.96 } : {}}
                    style={{
                      padding: '18px 16px', borderRadius: 16,
                      background: bg, border: `2px solid ${border}`,
                      color: '#e2e8f0', fontSize: 'clamp(16px, 4vw, 20px)',
                      fontWeight: 800, fontFamily: 'Nunito, sans-serif',
                      transition: 'all 0.3s',
                    }}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {showFeedback && picked !== null && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center mt-4"
                >
                  <p style={{
                    color: correct ? '#22c55e' : '#ef4444', fontSize: 22,
                    fontWeight: 800, fontFamily: 'Nunito, sans-serif', marginBottom: 6,
                  }}>
                    {correct ? '✓ Correct!' : `✗ ${q.options[q.correct]}`}
                  </p>
                  <p style={{
                    color: '#94a3b8', fontSize: 15,
                    fontFamily: 'Nunito, sans-serif', maxWidth: 500,
                    lineHeight: 1.5,
                  }}>
                    💡 {q.tip}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Level Complete ── */}
      <AnimatePresence>
        {phase === 'complete' && topic && (
          <LevelCompleteOverlay
            topic={topic}
            levelNum={levelNum}
            score={score}
            total={QUESTIONS_PER_LEVEL}
            onNext={playNext}
            onBack={backToPyramid}
            canPlayMore={getEcoDailyStatus(daily).canPlay}
            passed={lastPassed}
          />
        )}
      </AnimatePresence>

      {/* ── Daily Limit ── */}
      <AnimatePresence>
        {phase === 'locked' && (
          <DailyLimitOverlay
            unlockTime={status.unlockTime || Date.now() + 86400000}
            totalCompleted={daily.totalCompleted}
            onBack={onBack}
          />
        )}
      </AnimatePresence>

      {/* ── Floating Timer ── */}
      <FloatingTimer />

      {/* ── Time Up Modal ── */}
      <TimeUpModal
        isOpen={showTimeUpModal}
        onGoHome={handleTimeUpGoHome}
      />
    </div>
  );
};

export default EcoSystemPage;
