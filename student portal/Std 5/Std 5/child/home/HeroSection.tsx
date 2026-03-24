/**
 * child/home/HeroSection.tsx
 * ─────────────────────────────────────────────────────
 * Hero Welcome Card — dynamic greeting, XP bar, level badge.
 *
 * Polish: unified 24px radius, thicker glowing XP bar,
 * calmer animations, cleaner spacing.
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useXP } from '../XPProvider';


/* ── Count-up Hook ──────────────────────────────── */

function useCountUp(target: number, duration = 800): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setCurrent(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}

/* ── Greeting by time of day ────────────────────── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ── Main Component ──────────────────────────────── */

interface HeroSectionProps {
  streak?: number;
  studentName?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = React.memo(({ streak = 0, studentName = 'Explorer' }) => {
  const { state, justGained } = useXP();
  const displayXP = useCountUp(state.xp);
  const pct = Math.min(state.xp / state.xpToNext, 1) * 100;
  const greeting = useMemo(getGreeting, []);

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl w-full"
      style={{
        padding: '50px 48px',
        background: 'linear-gradient(135deg, #ffddee, #fff4cc)',
        boxShadow: '0 25px 50px rgba(120,140,240,0.12), 0 8px 20px rgba(120,140,240,0.06)',
        border: '1px solid rgba(255,255,255,0.5)',
        borderRadius: 40,
      }}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 140 }}
    >
      {/* Animated shine overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 40, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div className="hero-card-shine" />
      </div>
      {/* Floating decorative shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: 40 }}>
        <div className="hero-shape" style={{ top: '8%', left: '5%', fontSize: 28, opacity: 0.12 }}>⭐</div>
        <div className="hero-shape float-delay-1" style={{ top: '15%', right: '8%', fontSize: 20, opacity: 0.1 }}>✨</div>
        <div className="hero-shape float-delay-2" style={{ bottom: '12%', left: '15%', fontSize: 16, opacity: 0.08 }}>🌸</div>
        <div className="hero-shape float-delay-3" style={{ bottom: '20%', right: '12%', fontSize: 22, opacity: 0.1 }}>🎈</div>
        <div style={{ position: 'absolute', top: '10%', right: '18%', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,200,230,0.15)', animation: 'floaty 5s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '25%', width: 40, height: 40, borderRadius: '50%', background: 'rgba(200,230,255,0.12)', animation: 'floaty 4s ease-in-out 1s infinite' }} />
      </div>
      <div className="relative z-10 flex items-center gap-5">
        {/* ── Mascot Avatar ─────────────────── */}
        <motion.div
          className="relative flex-shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, var(--pastel-yellow-soft) 0%, var(--pastel-peach-soft) 100%)',
            boxShadow: '0 6px 20px rgba(255,200,150,0.2)',
          }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span style={{ fontSize: 32 }}>🦊</span>
        </motion.div>

        {/* ── Greeting + Badges ───────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 style={{
              fontSize: 28, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', margin: 0,
              fontFamily: 'Nunito, sans-serif',
              background: 'linear-gradient(90deg, #7b8cff, #9c7bff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Hello, {studentName} 🌈
            </h1>
            <span className="emoji-bounce" style={{ fontSize: 20 }}>👋</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-soft)', fontWeight: 600, margin: '8px 0 0' }}>
            Let's explore and learn! 🌟
          </p>
        </div>

        {/* ── Level & Streak Badges (right-aligned) ── */}
        <div className="flex items-center gap-2 shrink-0">
          <span style={{
            fontSize: 11, fontWeight: 800, color: 'var(--text-accent-purple)',
            background: 'var(--pastel-purple-soft)', padding: '5px 12px',
            borderRadius: 12, border: '1px solid rgba(200,180,240,0.3)',
          }}>
            ⭐ Level {state.level}
          </span>
          {streak > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 800, color: 'var(--text-accent-orange)',
              background: 'var(--pastel-peach-soft)', padding: '5px 12px',
              borderRadius: 12, border: '1px solid rgba(255,200,160,0.3)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span className="fire-pulse">🔥</span>
              {streak}d
            </span>
          )}
        </div>
      </div>

      {/* ── Full-width XP Progress Bar ── */}
      <div style={{ marginTop: 20 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-accent-purple)' }}>
            Progress
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-accent-purple)' }}>
            {displayXP} / {state.xpToNext} XP
          </span>
        </div>

        <div
          className={`relative rounded-full overflow-hidden ${pct >= 95 ? 'xp-bar-full-glow' : ''}`}
          style={{
            height: 14,
            background: 'rgba(255,255,255,0.6)',
            boxShadow: 'inset 0 1px 3px rgba(180,170,220,0.08)',
          }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--pastel-blue), var(--pastel-purple))',
              boxShadow: '0 0 14px rgba(200,180,255,0.3)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <div className="xp-shimmer" />

          <AnimatePresence>
            {justGained && (
              <>
                <span className="xp-sparkle-particle" style={{ top: -4 }}>✨</span>
                <span className="xp-sparkle-particle" style={{ top: -4 }}>⭐</span>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

HeroSection.displayName = 'HeroSection';
