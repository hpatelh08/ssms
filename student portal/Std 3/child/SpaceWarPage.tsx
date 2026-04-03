/**
 * child/SpaceWarPage.tsx
 * ─────────────────────────────────────────────────────
 * Space War Education Game — Std 3
 *
 * Full-screen immersive space battle where students
 * answer Maths/English/Science questions by shooting
 * the correct asteroid. Features:
 *  • Animated starfield background
 *  • Spaceship at bottom, asteroids falling from top
 *  • Boss battles every 10 levels
 *  • 5 sectors (Mercury→Saturn) progression
 *  • XP integration via context
 *  • Sound effects via Web Audio
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMascotTrigger } from './useMascotController';
import { TimeUpModal } from '../components/TimeUpModal';
import { FloatingTimer } from '../components/FloatingTimer';
import { usePlaytimeControl } from '../hooks/usePlaytimeControl';
import {
  createInitialState,
  handleAnswer,
  handleBossAnswer,
  nextLevel,
  getSector,
  saveProgress,
  loadProgress,
  generateQuestion,
  generateAsteroids,
  SECTORS,
  type SpaceWarState,
  type Asteroid,
} from './spaceWarEngine';

/* ── Sound helpers (Web Audio) ──────────────────── */

const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playLaser() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

function playExplosion() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'square'; osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}

function playWrong() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'square'; osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
  osc.start(); osc.stop(audioCtx.currentTime + 0.25);
}

function playVictory() {
  if (!audioCtx) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.12 + 0.3);
    osc.start(audioCtx.currentTime + i * 0.12);
    osc.stop(audioCtx.currentTime + i * 0.12 + 0.3);
  });
}

/* ── Starfield Background ──────────────────────── */

const Starfield: React.FC = React.memo(() => {
  const stars = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.6 + 0.3,
      duration: Math.random() * 3 + 2,
    }))
  , []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a2e 0%, #1a0a3e 30%, #0d1b2a 100%)' }}>
      {stars.map(s => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: '#fff',
          }}
          animate={{ opacity: [s.opacity, s.opacity * 0.3, s.opacity] }}
          transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Nebula glow */}
      <div className="absolute" style={{
        width: '60%', height: '60%', left: '20%', top: '10%',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
    </div>
  );
});
Starfield.displayName = 'Starfield';

/* ── Meteor Shower Celebration (5 Streak) ──────── */

const MeteorShowerCelebration: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'shake' | 'cockpit' | 'shower'>('shake');
  
  const meteors = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        startX: Math.random() * 100,
        startY: -10 - Math.random() * 20,
        endX: Math.random() * 100,
        endY: 110 + Math.random() * 20,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 2,
        duration: 1 + Math.random() * 1.5,
        color: ['#fbbf24', '#f59e0b', '#f97316', '#60a5fa', '#3b82f6', '#a78bfa'][Math.floor(Math.random() * 6)],
      })),
    []
  );

  useEffect(() => {
    // Screen shake phase
    const t1 = setTimeout(() => setPhase('cockpit'), 500);
    // Cockpit view + meteor shower phase
    const t2 = setTimeout(() => setPhase('shower'), 800);
    // Complete animation
    const t3 = setTimeout(onComplete, 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0" style={{ zIndex: 100 }}>
      {/* Screen shake effect */}
      <motion.div
        className="fixed inset-0"
        animate={phase === 'shake' ? {
          x: [0, -10, 10, -8, 8, -5, 5, 0],
          y: [0, -8, 8, -5, 5, -3, 3, 0],
        } : {}}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Cockpit window frame overlay */}
        {(phase === 'cockpit' || phase === 'shower') && (
          <motion.div
            className="fixed inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ zIndex: 101 }}
          >
            {/* Cockpit frame */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at center, transparent 0%, transparent 35%, rgba(20,20,40,0.7) 50%, rgba(10,10,20,0.95) 70%, rgba(5,5,15,1) 100%)',
              pointerEvents: 'none',
            }} />
            
            {/* Dashboard elements */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '25%',
              background: 'linear-gradient(180deg, transparent 0%, rgba(15,15,30,0.8) 20%, rgba(10,10,20,0.95) 100%)',
              borderTop: '2px solid rgba(99,102,241,0.3)',
            }}>
              {/* Control panels */}
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  style={{
                    position: 'absolute',
                    bottom: '15%',
                    left: `${20 + i * 20}%`,
                    width: 60,
                    height: 40,
                    borderRadius: 8,
                    background: 'rgba(99,102,241,0.2)',
                    border: '1px solid rgba(99,102,241,0.4)',
                  }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>

            {/* Side frame bars */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: '20%',
              bottom: '25%',
              width: '8%',
              background: 'linear-gradient(90deg, rgba(10,10,20,1) 0%, rgba(20,20,40,0.8) 50%, transparent 100%)',
            }} />
            <div style={{
              position: 'absolute',
              right: 0,
              top: '20%',
              bottom: '25%',
              width: '8%',
              background: 'linear-gradient(270deg, rgba(10,10,20,1) 0%, rgba(20,20,40,0.8) 50%, transparent 100%)',
            }} />
          </motion.div>
        )}

        {/* Meteor shower */}
        {phase === 'shower' && meteors.map(meteor => (
          <motion.div
            key={meteor.id}
            className="fixed"
            style={{
              width: meteor.size,
              height: meteor.size * 20,
              borderRadius: meteor.size / 2,
              background: `linear-gradient(180deg, ${meteor.color} 0%, transparent 100%)`,
              boxShadow: `0 0 ${meteor.size * 4}px ${meteor.color}`,
              zIndex: 102,
            }}
            initial={{
              left: `${meteor.startX}%`,
              top: `${meteor.startY}%`,
              opacity: 0,
              rotate: 30,
            }}
            animate={{
              left: `${meteor.endX}%`,
              top: `${meteor.endY}%`,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: meteor.duration,
              delay: meteor.delay,
              ease: 'linear',
            }}
          />
        ))}

        {/* Star trails */}
        {phase === 'shower' && Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="fixed rounded-full"
            style={{
              width: 2 + Math.random() * 2,
              height: 2 + Math.random() * 2,
              background: '#fff',
              zIndex: 102,
            }}
            initial={{
              left: `${50 + (Math.random() - 0.5) * 80}%`,
              top: `${-10 - Math.random() * 10}%`,
              opacity: 0,
            }}
            animate={{
              top: `${110 + Math.random() * 10}%`,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5 + Math.random() * 1,
              delay: Math.random() * 2.5,
              ease: 'linear',
            }}
          />
        ))}

        {/* Celebration text */}
        {phase === 'shower' && (
          <motion.div
            className="fixed"
            style={{
              top: '30%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 103,
              textAlign: 'center',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          >
            <div style={{
              fontSize: 'clamp(48px, 10vw, 80px)',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #f97316, #fbbf24)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Nunito, sans-serif',
              textShadow: '0 0 40px rgba(251,191,36,0.5)',
              animation: 'gradient-shift 2s ease infinite',
            }}>
              🔥 STREAK x5! 🔥
            </div>
            <motion.div
              style={{
                fontSize: 'clamp(20px, 4vw, 32px)',
                fontWeight: 700,
                color: '#60a5fa',
                marginTop: 16,
                fontFamily: 'Nunito, sans-serif',
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              ⚡ HYPERSPEED ACTIVATED! ⚡
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Gradient animation keyframes */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};

/* ── Spaceship Component (Vertical Rocket 🚀) ─── */

const Spaceship: React.FC = React.memo(() => (
  <motion.div
    style={{
      position: 'absolute',
      bottom: 24,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      zIndex: 20,
    }}
    animate={{ y: [0, -6, 0] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    {/* Rocket emoji with gentle tilt */}
    <motion.span
      style={{ fontSize: 56, lineHeight: 1, display: 'block', filter: 'drop-shadow(0 0 12px rgba(96,165,250,0.5))' }}
      animate={{ rotate: [-45, -40, -45] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >🚀</motion.span>
  </motion.div>
));
Spaceship.displayName = 'Spaceship';

/* ── Fireball Projectile (flies from rocket → asteroid) ── */

const Fireball: React.FC<{ targetX: number; targetY: number; onHit: () => void }> = ({ targetX, targetY, onHit }) => {
  // Rocket is at bottom-6 (24px), centered horizontally, emoji 56px, tilted -45°
  // The visual center of the rocket emoji sits at roughly:
  const shipX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
  const shipY = typeof window !== 'undefined' ? window.innerHeight - 24 - 28 : 700; // bottom-6 + half emoji
  const dx = targetX - shipX;
  const dy = targetY - shipY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

  useEffect(() => {
    const t = setTimeout(onHit, 350);
    return () => clearTimeout(t);
  }, [onHit]);

  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{ zIndex: 22 }}
      initial={{ left: shipX - 20, top: shipY - 20 }}
      animate={{ left: targetX - 20, top: targetY - 20 }}
      transition={{ duration: 0.32, ease: 'easeIn' }}
    >
      <div style={{
        width: 40, height: 40, position: 'relative',
        transform: `rotate(${angle}deg)`,
      }}>
        {/* Fireball core */}
        <div style={{
          position: 'absolute', left: 6, top: 2, width: 28, height: 28, borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #fff 0%, #fde047 25%, #f97316 55%, #ef4444 80%, transparent 100%)',
          boxShadow: '0 0 18px 6px rgba(251,191,36,0.7), 0 0 40px 12px rgba(249,115,22,0.4)',
        }} />
        {/* Flame trail particles */}
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: 14 + (Math.random() - 0.5) * 10,
              top: 28 + i * 3,
              width: 8 - i,
              height: 8 - i,
              borderRadius: '50%',
              background: ['#fde047', '#f97316', '#ef4444', '#dc2626', '#991b1b'][i],
              filter: 'blur(1px)',
            }}
            animate={{
              opacity: [0.9, 0],
              scale: [1, 0.3],
              y: [0, 12 + i * 4],
            }}
            transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.04 }}
          />
        ))}
      </div>
    </motion.div>
  );
};

/* ── Asteroid Crack & Float Animation (Right Answer) ── */

const AsteroidCrackExplosion: React.FC<{ 
  x: number; 
  y: number; 
  shape: string; 
  color: string;
  onDone: () => void 
}> = ({ x, y, shape, color, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  const pieces = useMemo(() => 
    Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      angle: (360 / 8) * i,
      distance: 80 + Math.random() * 40,
      rotation: Math.random() * 360,
      scale: 0.6 + Math.random() * 0.4,
    })), []
  );

  return (
    <div className="fixed pointer-events-none" style={{ zIndex: 32 }}>
      {/* Main asteroid cracking */}
      <motion.div
        style={{ left: x - 60, top: y - 60 }}
        className="fixed"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ 
          scale: [1, 1.1, 1.05, 1.15, 1.1],
          opacity: [1, 1, 1, 0],
          rotate: [0, -5, 5, -3, 0]
        }}
        transition={{ duration: 0.6 }}
      >
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: color,
          border: '2px solid rgba(156,163,175,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{ fontSize: 60, opacity: 0.8 }}>{shape}</div>
          {/* Crack lines */}
          {[0, 45, 90, 135].map(angle => (
            <motion.div
              key={angle}
              style={{
                position: 'absolute',
                width: 2,
                height: 60,
                background: 'rgba(239,68,68,0.8)',
                top: '50%',
                left: '50%',
                transformOrigin: 'center',
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: [0, 1] }}
              transition={{ duration: 0.3, delay: 0.2 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Explosion flash */}
      <motion.div
        style={{ left: x - 80, top: y - 80 }}
        className="fixed"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 2, 3] }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div style={{
          width: 160, height: 160, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(251,191,36,0.6) 30%, rgba(249,115,22,0.4) 50%, transparent 70%)',
          boxShadow: '0 0 60px rgba(251,191,36,0.8)',
        }} />
      </motion.div>

      {/* Floating pieces in space */}
      {pieces.map(piece => (
        <motion.div
          key={piece.id}
          style={{ left: x - 20, top: y - 20 }}
          className="fixed"
          initial={{ opacity: 1, scale: 1, rotate: 0 }}
          animate={{
            x: Math.cos((piece.angle * Math.PI) / 180) * piece.distance,
            y: Math.sin((piece.angle * Math.PI) / 180) * piece.distance,
            opacity: [1, 0.8, 0.6, 0.3, 0],
            scale: [piece.scale, piece.scale * 0.8, piece.scale * 0.5],
            rotate: [0, piece.rotation, piece.rotation * 2],
          }}
          transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: color,
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            {shape}
          </div>
        </motion.div>
      ))}

      {/* Sparkles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          style={{ left: x, top: y }}
          className="fixed"
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((i * 30 * Math.PI) / 180) * (60 + Math.random() * 40),
            y: Math.sin((i * 30 * Math.PI) / 180) * (60 + Math.random() * 40),
            opacity: [1, 0],
            scale: [1, 0],
          }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
        >
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: ['#fff', '#fbbf24', '#f97316', '#60a5fa'][i % 4],
            boxShadow: '0 0 8px currentColor',
          }} />
        </motion.div>
      ))}
    </div>
  );
};

/* ── Rocket Crash and Launch Animation ── */

const RocketCrashAndLaunch: React.FC<{ onLaunchComplete: () => void }> = ({ onLaunchComplete }) => {
  const [phase, setPhase] = useState<'crash' | 'debris' | 'launch'>('crash');
  const shipX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
  const shipY = typeof window !== 'undefined' ? window.innerHeight - 24 - 28 : 700;

  useEffect(() => {
    // Crash phase (0-0.8s)
    const t1 = setTimeout(() => setPhase('debris'), 800);
    // Debris phase (0.8s-3s)
    const t2 = setTimeout(() => setPhase('launch'), 3000);
    // Launch complete (3s-3.6s)
    const t3 = setTimeout(onLaunchComplete, 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onLaunchComplete]);

  return (
    <div className="fixed pointer-events-none" style={{ zIndex: 35 }}>
      {/* Crash explosion at rocket position */}
      {phase === 'crash' && (
        <motion.div
          style={{ left: shipX - 100, top: shipY - 100 }}
          className="fixed"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.5, 2, 2.5] }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div style={{ width: 200, height: 200, position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(251,191,36,0.7) 20%, rgba(239,68,68,0.6) 50%, transparent 80%)',
              boxShadow: '0 0 80px rgba(251,191,36,0.9)',
            }} />
            {/* Explosion particles */}
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute', width: 10, height: 10, borderRadius: '50%',
                  background: ['#fff', '#fbbf24', '#f97316', '#ef4444'][i % 4],
                  left: 95, top: 95,
                }}
                animate={{
                  x: Math.cos((i * 22.5 * Math.PI) / 180) * 80,
                  y: Math.sin((i * 22.5 * Math.PI) / 180) * 80,
                  opacity: [1, 0],
                  scale: [1, 0],
                }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Debris/smoke phase */}
      {phase === 'debris' && (
        <motion.div
          style={{ left: shipX - 40, top: shipY - 40 }}
          className="fixed"
          initial={{ opacity: 0.6, scale: 0.8 }}
          animate={{ opacity: 0, scale: 1.8, y: -30 }}
          transition={{ duration: 2.2, ease: 'easeOut' }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(120,120,120,0.4) 0%, rgba(60,60,60,0.2) 50%, transparent 100%)',
            filter: 'blur(8px)',
          }} />
        </motion.div>
      )}

      {/* New rocket launch animation */}
      {phase === 'launch' && (
        <motion.div
          style={{ left: shipX - 28, top: shipY + 200 }}
          className="fixed"
          initial={{ y: 0, opacity: 0, scale: 0.5 }}
          animate={{ y: -200, opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            style={{ fontSize: 56, transform: 'rotate(-45deg)' }}
            animate={{ rotate: [-45, -42, -45] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            🚀
          </motion.div>
          {/* Launch flames */}
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                left: 20 + i * 5,
                top: 40,
                width: 8 - i * 2,
                height: 20 + i * 10,
                borderRadius: '50%',
                background: ['#fbbf24', '#f97316', '#ef4444'][i],
                filter: 'blur(2px)',
              }}
              animate={{
                opacity: [0.8, 0.3],
                scaleY: [1, 1.4],
              }}
              transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.05 }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

/* ── Wrong Answer: Asteroid Flies to Rocket with Blast ── */

const AsteroidCrashToRocket: React.FC<{ 
  startX: number; 
  startY: number; 
  shape: string;
  color: string;
  onDone: () => void 
}> = ({ startX, startY, shape, color, onDone }) => {
  const targetX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
  const targetY = typeof window !== 'undefined' ? window.innerHeight - 24 - 28 : 700;

  useEffect(() => {
    const t = setTimeout(onDone, 800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <>
      {/* Asteroid flying to rocket */}
      <motion.div
        className="fixed pointer-events-none"
        style={{ zIndex: 30 }}
        initial={{ left: startX - 30, top: startY - 30, scale: 1, opacity: 1 }}
        animate={{ 
          left: targetX - 30, 
          top: targetY - 30, 
          scale: 0.8,
          opacity: 1,
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 0.5, ease: 'easeIn' }}
      >
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: color,
          border: '2px solid rgba(239,68,68,0.6)',
          boxShadow: '0 0 20px rgba(239,68,68,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: 36, opacity: 0.8 }}>{shape}</div>
        </div>
      </motion.div>
      {/* Blast at rocket */}
      <motion.div
        className="fixed pointer-events-none"
        style={{ left: targetX - 100, top: targetY - 100, zIndex: 31 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 1, 0.6, 0], scale: [0, 1.2, 1.8, 2.2, 2.5] }}
        transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
      >
        <div style={{ width: 200, height: 200, position: 'relative' }}>
          {/* Fire ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.9) 0%, rgba(249,115,22,0.7) 30%, rgba(239,68,68,0.6) 50%, transparent 75%)',
            boxShadow: '0 0 80px rgba(251,191,36,0.9), 0 0 120px rgba(239,68,68,0.6)',
          }} />
          {/* Inner flash */}
          <div style={{
            position: 'absolute', inset: '20%', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(251,191,36,0.7) 50%, transparent 100%)',
          }} />
          {/* Explosion sparks */}
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute', width: 10, height: 10, borderRadius: '50%',
                background: ['#fff', '#fbbf24', '#f97316', '#ef4444'][i % 4],
                left: 95, top: 95,
              }}
              animate={{
                x: Math.cos((i * 22.5 * Math.PI) / 180) * (70 + Math.random() * 30),
                y: Math.sin((i * 22.5 * Math.PI) / 180) * (70 + Math.random() * 30),
                opacity: [1, 0],
                scale: [1, 0.2],
              }}
              transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
            />
          ))}
          {/* Fire ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.8) 0%, rgba(239,68,68,0.6) 40%, transparent 70%)',
          }} />
          {/* Sparks */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute', width: 6, height: 6, borderRadius: '50%',
                background: ['#fbbf24', '#ef4444', '#f97316', '#fff'][i % 4],
                left: 57, top: 57,
              }}
              animate={{
                x: Math.cos((i * 45 * Math.PI) / 180) * 50,
                y: Math.sin((i * 45 * Math.PI) / 180) * 50,
                opacity: [1, 0],
                scale: [1, 0],
              }}
              transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
};

/* ── Asteroid Button ───────────────────────────── */

const ASTEROID_SIZE = 'clamp(96px, 15vw, 180px)';

const AsteroidBtn: React.FC<{
  asteroid: Asteroid;
  index: number;
  total: number;
  onShoot: (id: string, event: React.MouseEvent) => void;
  disabled: boolean;
  isHidden?: boolean;
}> = React.memo(({ asteroid, index, total, onShoot, disabled, isHidden = false }) => {
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!disabled) onShoot(asteroid.id, event);
  }, [asteroid.id, disabled, onShoot]);

  if (isHidden) return <div style={{ width: ASTEROID_SIZE, flexShrink: 0 }} />;

  const rawLabel = asteroid.label.trim();
  const isNumericLabel = /^-?\d+(\.\d+)?$/.test(rawLabel);
  const labelFontSize = isNumericLabel
    ? rawLabel.length <= 3
      ? 'clamp(34px, 7.2vw, 56px)'
      : 'clamp(26px, 5.8vw, 44px)'
    : 'clamp(18px, 3.7vw, 28px)';

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className="cursor-pointer"
      data-asteroid-id={asteroid.id}
      style={{
        zIndex: 15,
        borderRadius: '50%',
        background: 'none',
        border: 'none',
        padding: 0,
        flexShrink: 0,
      }}
      initial={{ y: -80, opacity: 0, scale: 0.5 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: 1,
        rotate: [0, asteroid.angle, -asteroid.angle, 0],
      }}
      transition={{
        y: { duration: 0.6, delay: index * 0.15 },
        opacity: { duration: 0.3, delay: index * 0.15 },
        scale: { duration: 0.4, delay: index * 0.15 },
        rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
      }}
      whileHover={disabled ? {} : { scale: 1.15 }}
      whileTap={disabled ? {} : { scale: 0.9 }}
    >
      <div style={{
        width: ASTEROID_SIZE,
        height: ASTEROID_SIZE,
        borderRadius: '50%',
        background: asteroid.color,
        border: '2px solid rgba(156,163,175,0.4)',
        boxShadow: '0 0 20px rgba(0,0,0,0.5), inset 0 -4px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'box-shadow 0.2s ease',
      }}
      className="asteroid-orb"
      >
        {/* Asteroid shape emoji */}
        <div style={{
          position: 'absolute',
          fontSize: 'clamp(44px, 8vw, 84px)',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
          opacity: 0.3,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
          {asteroid.shape}
        </div>
        {/* Craters */}
        <div style={{
          position: 'absolute', width: 12, height: 12, borderRadius: '50%',
          background: 'rgba(0,0,0,0.2)', top: '15%', right: '20%',
        }} />
        <div style={{
          position: 'absolute', width: 8, height: 8, borderRadius: '50%',
          background: 'rgba(0,0,0,0.15)', bottom: '25%', left: '18%',
        }} />
        {/* Label */}
        <span style={{
          fontSize: labelFontSize,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 3px 10px rgba(0,0,0,0.9)',
          textAlign: 'center',
          padding: isNumericLabel ? 6 : 10,
          lineHeight: 1.05,
          wordBreak: 'break-word',
          fontFamily: 'Nunito, sans-serif',
          position: 'relative',
          zIndex: 2,
        }}>
          {asteroid.label}
        </span>
      </div>
    </motion.button>
  );
});
AsteroidBtn.displayName = 'AsteroidBtn';

/* ── Boss Health Bar ───────────────────────────── */

const BossBar: React.FC<{ hp: number; maxHP: number }> = ({ hp, maxHP }) => (
  <div className="flex items-center gap-3" style={{ padding: '8px 16px' }}>
    <span style={{ fontSize: 28 }}>👾</span>
    <div style={{
      flex: 1, height: 12, borderRadius: 8,
      background: 'rgba(255,255,255,0.1)',
      overflow: 'hidden',
    }}>
      <motion.div
        style={{
          height: '100%', borderRadius: 8,
          background: hp > maxHP * 0.5 ? 'linear-gradient(90deg, #ef4444, #f97316)' : 'linear-gradient(90deg, #dc2626, #991b1b)',
        }}
        animate={{ width: `${(hp / maxHP) * 100}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
    <span style={{ color: '#f87171', fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>
      {hp}/{maxHP}
    </span>
  </div>
);

/* ── Explosion Particles ───────────────────────── */

const ExplosionFX: React.FC = () => {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (360 / 12) * i,
      color: ['#fbbf24', '#f97316', '#ef4444', '#60a5fa'][i % 4],
    }))
  , []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 30 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            width: 6, height: 6, borderRadius: '50%',
            background: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * 80,
            y: Math.sin((p.angle * Math.PI) / 180) * 80,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
};

/* ── Splash Screen ─────────────────────────────── */

const SpaceWarSplash: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <motion.div
    className="absolute inset-0 flex flex-col items-center justify-center"
    style={{ zIndex: 50, background: 'rgba(10,10,46,0.95)' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      style={{ fontSize: 80, marginBottom: 16 }}
    >
      🚀
    </motion.div>
    <motion.h1
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      style={{
        fontSize: 'clamp(28px, 7vw, 48px)',
        fontWeight: 900,
        background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: 'Nunito, sans-serif',
        textAlign: 'center',
      }}
    >
      SPACE WAR
    </motion.h1>
    <motion.p
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      style={{ color: '#94a3b8', fontSize: 16, marginTop: 8, fontFamily: 'Nunito, sans-serif' }}
    >
      Shoot the correct answer!
    </motion.p>
    <motion.button
      onClick={onStart}
      className="cursor-pointer"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.7 }}
      whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}
      whileTap={{ scale: 0.95 }}
      style={{
        marginTop: 32,
        padding: '14px 48px',
        borderRadius: 16,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff',
        fontSize: 18,
        fontWeight: 800,
        border: 'none',
        fontFamily: 'Nunito, sans-serif',
        letterSpacing: 1,
      }}
    >
      ▶ LAUNCH
    </motion.button>
  </motion.div>
);

/* ── Level Complete Overlay ─────────────────────── */

const LevelComplete: React.FC<{
  state: SpaceWarState;
  onNext: () => void;
}> = ({ state, onNext }) => (
  <motion.div
    className="absolute inset-0 flex flex-col items-center justify-center"
    style={{ zIndex: 40, background: 'rgba(10,10,46,0.92)', backdropFilter: 'blur(8px)' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
      style={{ fontSize: 64 }}
    >
      {state.level % 10 === 0 ? '👾💥' : '⭐'}
    </motion.div>
    <h2 style={{
      color: '#fbbf24', fontSize: 28, fontWeight: 900,
      fontFamily: 'Nunito, sans-serif', marginTop: 12,
    }}>
      {state.level % 10 === 0 ? 'BOSS DEFEATED!' : 'LEVEL CLEAR!'}
    </h2>
    <div style={{
      display: 'flex', gap: 24, marginTop: 20,
      color: '#e2e8f0', fontSize: 16, fontWeight: 600,
    }}>
      <div className="text-center">
        <div style={{ fontSize: 24, color: '#fbbf24' }}>+{state.xpEarned}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>XP Earned</div>
      </div>
      <div className="text-center">
        <div style={{ fontSize: 24, color: '#60a5fa' }}>🔥 {state.streak}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>Streak</div>
      </div>
      <div className="text-center">
        <div style={{ fontSize: 24, color: '#f472b6' }}>❤️ {state.lives}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>Lives</div>
      </div>
    </div>
    <motion.button
      onClick={onNext}
      className="cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        marginTop: 28,
        padding: '12px 40px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        color: '#fff',
        fontSize: 16,
        fontWeight: 800,
        border: 'none',
        fontFamily: 'Nunito, sans-serif',
      }}
    >
      NEXT LEVEL →
    </motion.button>
  </motion.div>
);

/* ── Game Over Overlay ──────────────────────────── */

const GameOver: React.FC<{
  state: SpaceWarState;
  onRetry: () => void;
}> = ({ state, onRetry }) => (
  <motion.div
    className="absolute inset-0 flex flex-col items-center justify-center"
    style={{ zIndex: 40, background: 'rgba(10,10,46,0.95)' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1] }}
      style={{ fontSize: 64 }}
    >
      💥
    </motion.div>
    <h2 style={{
      color: '#ef4444', fontSize: 28, fontWeight: 900,
      fontFamily: 'Nunito, sans-serif', marginTop: 12,
    }}>
      SHIP DESTROYED!
    </h2>
    <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
      Score: {state.score} · Level {state.level} · ✅ {state.totalCorrect} ❌ {state.totalWrong}
    </div>
    <motion.button
      onClick={onRetry}
      className="cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        marginTop: 24,
        padding: '12px 40px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff',
        fontSize: 16,
        fontWeight: 800,
        border: 'none',
        fontFamily: 'Nunito, sans-serif',
      }}
    >
      🔄 TRY AGAIN
    </motion.button>
  </motion.div>
);

/* ── Subject Badge ─────────────────────────────── */

const subjectBadge = (s: 'maths' | 'english' | 'science') => {
  const map = {
    maths: { icon: '🔢', color: '#6366f1', label: 'Maths' },
    english: { icon: '📖', color: '#10b981', label: 'English' },
    science: { icon: '🔬', color: '#f59e0b', label: 'EVS' },
  };
  return map[s];
};

const ROCKET_TAKEOFF_DELAY_MS = 1000;
const FIREBALL_HIT_DELAY_MS = 350;
const ASTEROID_BLAST_DURATION_MS = 2000;
const POST_BLAST_BUFFER_MS = 80;
const NEXT_QUESTION_DELAY_MS =
  ROCKET_TAKEOFF_DELAY_MS + FIREBALL_HIT_DELAY_MS + ASTEROID_BLAST_DURATION_MS + POST_BLAST_BUFFER_MS;

/* ── MAIN COMPONENT ─────────────────────────────── */

interface Props {
  onBack: () => void;
}

const SpaceWarPage: React.FC<Props> = ({ onBack }) => {
  const [gameState, setGameState] = useState<SpaceWarState>(() => createInitialState());
  const [showSplash, setShowSplash] = useState(true);
  const [blastPos, setBlastPos] = useState<{ x: number; y: number } | null>(null);
  const [crashPos, setCrashPos] = useState<{ x: number; y: number } | null>(null);
  const [showRocketCrash, setShowRocketCrash] = useState(false);
  const [correctAsteroidId, setCorrectAsteroidId] = useState<string | null>(null);
  const [fireballTarget, setFireballTarget] = useState<{ x: number; y: number; asteroidId: string } | null>(null);
  const [showMeteorShower, setShowMeteorShower] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerMascot = useMascotTrigger();

  // Cleanup
  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (launchTimerRef.current) clearTimeout(launchTimerRef.current);
  }, []);

  const handleStart = useCallback(() => setShowSplash(false), []);

  const handleShoot = useCallback((asteroidId: string, event?: React.MouseEvent) => {
    if (audioCtx?.state === 'suspended') audioCtx.resume();

    // Find the clicked asteroid's DOM position for laser/crash targeting
    const clickedEl = document.querySelector(`[data-asteroid-id="${asteroidId}"]`);
    const rect = clickedEl?.getBoundingClientRect();
    const targetPos = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight * 0.45 };

    setGameState(prev => {
      const isBoss = prev.phase === 'boss';
      const clickedAsteroid = prev.asteroids.find(a => a.id === asteroidId);
      const isCorrectAnswer = clickedAsteroid?.isCorrect ?? false;
      const newState = isBoss ? handleBossAnswer(prev, asteroidId) : handleAnswer(prev, asteroidId);

      if (isCorrectAnswer) {
        // RIGHT ANSWER: Fire projectile → then crack/explode asteroid
        triggerMascot('happy');

        if (launchTimerRef.current) clearTimeout(launchTimerRef.current);
        launchTimerRef.current = setTimeout(() => {
          playLaser();
          setFireballTarget({ x: targetPos.x, y: targetPos.y, asteroidId });
        }, ROCKET_TAKEOFF_DELAY_MS);

        // Save progress
        saveProgress({
          level: newState.level,
          score: newState.score,
          totalCorrect: newState.totalCorrect,
          totalWrong: newState.totalWrong,
        });

        // Check if streak is 5 (or multiple of 5) for meteor shower celebration
        const shouldShowMeteorShower = newState.streak > 0 && newState.streak % 5 === 0;

        if (shouldShowMeteorShower) {
          // Show meteor shower celebration, then continue
          feedbackTimerRef.current = setTimeout(() => {
            setCorrectAsteroidId(null);
            setBlastPos(null);
            setShowMeteorShower(true);
          }, NEXT_QUESTION_DELAY_MS);
        } else {
          // After blast animation, generate new question and continue game
          feedbackTimerRef.current = setTimeout(() => {
            setCorrectAsteroidId(null);
            setBlastPos(null);
            setGameState(s => {
              const question = generateQuestion(s.level);
              const sector = getSector(s.level);
              return {
                ...s,
                question,
                asteroids: generateAsteroids(question, sector),
                phase: s.level % 10 === 0 && s.level > 0 ? 'level-complete' : (s.bossHP > 0 ? 'boss' : 'ready'),
              };
            });
          }, NEXT_QUESTION_DELAY_MS);
        }
      } else {
        // WRONG ANSWER: Asteroid flies to rocket with blast, then rocket crashes
        playWrong();
        setCrashPos(targetPos);
        triggerMascot('encourage');
      }

      return newState;
    });
  }, []);

  const handleNext = useCallback(() => {
    setGameState(prev => {
      const next = nextLevel(prev);
      return next;
    });
  }, []);

  const handleRetry = useCallback(() => {
    setGameState(createInitialState(loadProgress()));
  }, []);

  const handleWrongContinue = useCallback(() => {
    setShowRocketCrash(false);
    // Regenerate question and continue game
    setGameState(prev => {
      const question = generateQuestion(prev.level);
      const sector = getSector(prev.level);
      return {
        ...prev,
        question,
        asteroids: generateAsteroids(question, sector),
        phase: prev.bossHP > 0 ? 'boss' : 'ready',
      };
    });
  }, []);

  const handleMeteorShowerComplete = useCallback(() => {
    setShowMeteorShower(false);
    // Continue game after meteor shower
    setGameState(s => {
      const question = generateQuestion(s.level);
      const sector = getSector(s.level);
      return {
        ...s,
        question,
        asteroids: generateAsteroids(question, sector),
        phase: s.level % 10 === 0 && s.level > 0 ? 'level-complete' : (s.bossHP > 0 ? 'boss' : 'ready'),
      };
    });
  }, []);

  const handleTimeExpired = useCallback(() => {
    setShowTimeUpModal(true);
  }, []);

  const handleTimeUpGoHome = useCallback(() => {
    setShowTimeUpModal(false);
    onBack();
  }, [onBack]);

  const badge = subjectBadge(gameState.question.subject);
  const sector = getSector(gameState.level);
  const canShoot = gameState.phase === 'ready' || gameState.phase === 'playing' || gameState.phase === 'boss';
  const shouldShowAsteroids =
    canShoot ||
    gameState.phase === 'correct' ||
    fireballTarget !== null ||
    blastPos !== null ||
    correctAsteroidId !== null;
  const asteroidsDisabled =
    !canShoot ||
    fireballTarget !== null ||
    blastPos !== null ||
    showRocketCrash ||
    showMeteorShower;

  usePlaytimeControl({
    isActive: canShoot && !showSplash && !showTimeUpModal,
    onTimeExpired: handleTimeExpired,
  });

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ 
      fontFamily: 'Nunito, sans-serif', 
      borderRadius: 0,
      margin: 0,
      padding: 0,
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {/* Global style override for full-screen sharp edges */}
      <style>{`
        body, html, #root { 
          border-radius: 0 !important; 
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .asteroid-orb:hover { 
          box-shadow: 0 0 30px rgba(251,191,36,0.6), 0 0 60px rgba(251,191,36,0.3) !important; 
        }
      `}</style>
      <Starfield />

      {/* ── HUD Header ─────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3" style={{ zIndex: 25 }}>
        {/* Back button */}
        <motion.button
          onClick={onBack}
          className="cursor-pointer flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '8px 16px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e2e8f0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          ← Back
        </motion.button>

        {/* Sector & Level */}
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 20 }}>{sector.icon}</span>
          <div className="text-right">
            <div style={{ color: sector.color, fontWeight: 800, fontSize: 14 }}>
              {sector.name}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
              Level {gameState.level}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────── */}
      <div className="absolute top-14 left-0 right-0 flex items-center justify-center gap-6 px-4" style={{ zIndex: 25 }}>
        <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 20 }}>
          ⭐ {gameState.score}
        </div>
        <div style={{ color: '#f87171', fontWeight: 700, fontSize: 20 }}>
          {'❤️'.repeat(gameState.lives)}{'🖤'.repeat(gameState.maxLives - gameState.lives)}
        </div>
        <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: 20 }}>
          🔥 {gameState.streak}
        </div>
      </div>

      {/* ── Boss HP ─────────────────────────────── */}
      {gameState.phase === 'boss' && gameState.bossHP > 0 && (
        <div className="absolute top-24 left-4 right-4" style={{ zIndex: 25 }}>
          <BossBar hp={gameState.bossHP} maxHP={gameState.bossMaxHP} />
        </div>
      )}

      {/* ── Question ───────────────────────────── */}
      {canShoot && (
        <motion.div
          className="absolute left-0 right-0 flex justify-center px-3"
          style={{
            top: gameState.phase === 'boss' ? 140 : 110,
            zIndex: 20,
          }}
          key={gameState.question.id}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: 16,
            padding: '14px 20px',
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            display: 'inline-block',
            width: 'fit-content',
            maxWidth: 'min(92vw, 860px)',
          }}>
            {/* Subject badge */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 8,
                background: `${badge.color}20`, color: badge.color,
                fontSize: 12, fontWeight: 700,
              }}>
                {badge.icon} {badge.label}
              </span>
            </div>
            <p style={{
              color: '#f1f5f9',
              fontSize: 'clamp(18px, 3vw, 34px)',
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.25,
            }}>
              {gameState.question.question}
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Asteroids ──────────────────────────── */}
      {shouldShowAsteroids && (
        <div
          className="absolute left-0 right-0"
          style={{
            top: '38%',
            height: '30%',
            zIndex: 15,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={gameState.question.id}
              className="h-full"
              style={{
                width: 'min(96vw, 1680px)',
                margin: '0 auto',
                height: '100%',
                display: 'grid',
                gridTemplateColumns: `repeat(${gameState.asteroids.length}, minmax(0, 1fr))`,
                alignItems: 'center',
                columnGap: gameState.asteroids.length <= 3
                  ? 'clamp(20px, 3vw, 56px)'
                  : 'clamp(12px, 2vw, 38px)',
                paddingInline: 'clamp(20px, 3.5vw, 72px)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {gameState.asteroids.map((ast, i) => (
                <div key={ast.id} style={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
                  <AsteroidBtn
                    asteroid={ast}
                    index={i}
                    total={gameState.asteroids.length}
                    onShoot={handleShoot}
                    disabled={asteroidsDisabled}
                    isHidden={ast.id === correctAsteroidId}
                  />
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── Spaceship ──────────────────────────── */}
      {!showRocketCrash && <Spaceship />}

      {/* ── Fireball projectile (flies from rocket → asteroid) ───── */}
      <AnimatePresence>
        {fireballTarget && (
          <Fireball
            targetX={fireballTarget.x}
            targetY={fireballTarget.y}
            onHit={() => {
              playExplosion();
              playVictory();
              setCorrectAsteroidId(fireballTarget.asteroidId);
              setBlastPos({ x: fireballTarget.x, y: fireballTarget.y });
              setFireballTarget(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Right answer: Asteroid cracks and floats ───── */}
      <AnimatePresence>
        {blastPos && correctAsteroidId && (() => {
          const asteroid = gameState.asteroids.find(a => a.id === correctAsteroidId);
          return asteroid ? (
            <AsteroidCrackExplosion
              x={blastPos.x}
              y={blastPos.y}
              shape={asteroid.shape}
              color={asteroid.color}
              onDone={() => {}}
            />
          ) : null;
        })()}
      </AnimatePresence>

      {/* ── Wrong answer: Asteroid flies to rocket ───── */}
      <AnimatePresence>
        {crashPos && (() => {
          const clickedAsteroid = gameState.asteroids.find(a => {
            const el = document.querySelector(`[data-asteroid-id="${a.id}"]`);
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            return Math.abs(centerX - crashPos.x) < 10 && Math.abs(centerY - crashPos.y) < 10;
          }) || gameState.asteroids[0];
          
          return (
            <AsteroidCrashToRocket
              startX={crashPos.x}
              startY={crashPos.y}
              shape={clickedAsteroid.shape}
              color={clickedAsteroid.color}
              onDone={() => {
                setCrashPos(null);
                setShowRocketCrash(true);
              }}
            />
          );
        })()}
      </AnimatePresence>

      {/* ── Rocket crash and launch (wrong answer) ───── */}
      <AnimatePresence>
        {showRocketCrash && (
          <RocketCrashAndLaunch
            onLaunchComplete={() => {
              setShowRocketCrash(false);
              handleWrongContinue();
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Overlays ───────────────────────────── */}
      <AnimatePresence>
        {showSplash && <SpaceWarSplash onStart={handleStart} />}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.phase === 'level-complete' && (
          <LevelComplete state={gameState} onNext={handleNext} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.phase === 'game-over' && (
          <GameOver state={gameState} onRetry={handleRetry} />
        )}
      </AnimatePresence>

      {/* ── Meteor Shower Celebration (5 Streak) ─── */}
      <AnimatePresence>
        {showMeteorShower && (
          <MeteorShowerCelebration onComplete={handleMeteorShowerComplete} />
        )}
      </AnimatePresence>

      {/* ── Floating Timer (bottom-left) ──────── */}
      <FloatingTimer />

      {/* ── Time Up Modal ─────────────────────── */}
      <TimeUpModal 
        isOpen={showTimeUpModal}
        onGoHome={handleTimeUpGoHome}
      />
    </div>
  );
};

export default SpaceWarPage;
