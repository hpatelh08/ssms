/**
 * child/home/TinyWins.tsx
 * ─────────────────────────────────────────────────────
 * My Wins — Equal-size stat cards in a responsive grid.
 * Clean icons, no black borders, soft card backgrounds.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useXP } from '../XPProvider';

/* ── Types ──────────────────────────────────────── */

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface TinyWinsProps {
  streak?: number;
  badges?: Badge[];
}

/* ── Stat Card ──────────────────────────────────── */

const StatCard: React.FC<{
  icon: string;
  value: string | number;
  label: string;
  bg: string;
  accent: string;
  animClass?: string;
  delay?: number;
}> = React.memo(({ icon, value, label, bg, accent, animClass, delay = 0 }) => (
  <motion.div
    className="flex flex-col items-center justify-center"
    style={{
      padding: '22px 14px',
      background: bg,
      boxShadow: 'var(--shadow-card)',
      border: '1px solid rgba(255,255,255,0.5)',
      borderRadius: 24,
      minHeight: 110,
    }}
    initial={{ opacity: 0, scale: 0.85, y: 12 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 240, damping: 22, delay }}
  >
    <span className={animClass ?? ''} style={{ fontSize: 26, lineHeight: 1 }}>{icon}</span>
    <div style={{
      fontSize: 20, fontWeight: 800, color: accent,
      lineHeight: 1.2, marginTop: 8,
    }}>
      {value}
    </div>
    <div style={{
      fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4,
    }}>
      {label}
    </div>
  </motion.div>
));
StatCard.displayName = 'StatCard';

/* ── Main Component ──────────────────────────────── */

export const TinyWins: React.FC<TinyWinsProps> = React.memo(({ streak = 0, badges = [] }) => {
  const { state, justGained } = useXP();
  const recentBadges = useMemo(() => badges.slice(-4), [badges]);
  const hasAnything = state.level > 0 || streak > 0 || recentBadges.length > 0;

  if (!hasAnything) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>🏆</span>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
          My Wins
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Level */}
        <StatCard
          icon="⭐"
          value={`Lv ${state.level}`}
          label="Level"
          bg="linear-gradient(145deg, var(--pastel-yellow-soft), var(--pastel-yellow))"
          accent="#b47a09"
          delay={0.65}
        />

        {/* XP */}
        <div className="relative">
          <StatCard
            icon="💎"
            value={state.xp}
            label="Total XP"
            bg="linear-gradient(145deg, var(--pastel-purple-soft), var(--pastel-lavender))"
            accent="var(--text-accent-purple)"
            delay={0.7}
          />
          <AnimatePresence>
            {justGained && (
              <motion.span
                className="xp-float-up absolute"
                style={{ top: -4, right: 8, fontSize: 11, fontWeight: 800, color: '#a7c97f' }}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -24 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                +XP!
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <StatCard
            icon="🔥"
            value={streak}
            label="Day Streak"
            bg="linear-gradient(145deg, var(--pastel-peach-soft), var(--pastel-peach))"
            accent="var(--text-accent-orange)"
            animClass="fire-pulse"
            delay={0.75}
          />
        )}

        {/* Badges count or individual badges */}
        {recentBadges.length > 0 ? (
          <StatCard
            icon="🎖️"
            value={recentBadges.length}
            label="Badges"
            bg="linear-gradient(145deg, var(--pastel-pink-soft), var(--pastel-pink))"
            accent="var(--text-accent-pink)"
            delay={0.8}
          />
        ) : (
          <StatCard
            icon="🎯"
            value="0"
            label="Badges"
            bg="linear-gradient(145deg, var(--pastel-green-soft), var(--pastel-green))"
            accent="var(--text-accent-green)"
            delay={0.8}
          />
        )}
      </div>
    </motion.div>
  );
});

TinyWins.displayName = 'TinyWins';
