/**
 * child/home/MagicalActionCard.tsx
 * ─────────────────────────────────────────────────────
 * Two action cards (Play Games + My Garden).
 * Unified 24px radius, soft hover lift, sparkle burst on tap.
 */

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundPlay } from '../SoundProvider';
import type { ChildScreen } from '../ChildLayout';

/* ── Action Definitions ──────────────────────────── */

export interface MagicalAction {
  icon: string;
  label: string;
  desc: string;
  xpHint: string;
  gradient: string;
  glowColor: string;
  bgGradient: string;
  screen: ChildScreen;
}

export const MAGICAL_ACTIONS: MagicalAction[] = [
  {
    icon: '🎮',
    label: 'Play Games',
    desc: 'Learn & have fun!',
    xpHint: '+10 XP per game',
    gradient: 'from-purple-400 via-pink-400 to-purple-500',
    glowColor: 'rgba(200, 180, 255, 0.35)',
    bgGradient: 'linear-gradient(145deg, var(--pastel-purple-soft) 0%, var(--pastel-purple) 50%, var(--pastel-pink-soft) 100%)',
    screen: 'play',
  },
  {
    icon: '🌈',
    label: 'My Garden',
    desc: 'Grow and watch magic!',
    xpHint: 'Tap to grow',
    gradient: 'from-green-400 via-emerald-400 to-green-500',
    glowColor: 'rgba(180, 234, 200, 0.35)',
    bgGradient: 'linear-gradient(145deg, var(--pastel-peach-soft) 0%, var(--pastel-peach) 50%, var(--pastel-yellow-soft) 100%)',
    screen: 'garden',
  },
];

/* ── Sparkle Burst Effect ────────────────────────── */

const SparkleParticle: React.FC<{ index: number }> = React.memo(({ index }) => {
  const angle = (index * 45) * Math.PI / 180;
  const dist = 28 + (index % 3) * 12;
  const colors = ['#fbbf24', '#f472b6', '#a78bfa', '#4ade80', '#60a5fa', '#f97316', '#34d399', '#fb923c'];

  return (
    <motion.span
      className="absolute text-sm pointer-events-none"
      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
      animate={{
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        scale: [0, 1.2, 0],
        opacity: [1, 1, 0],
      }}
      transition={{ duration: 0.6, delay: index * 0.03, ease: 'easeOut' }}
      style={{ color: colors[index % colors.length] }}
    >
      ✦
    </motion.span>
  );
});
SparkleParticle.displayName = 'SparkleParticle';

/* ── Single Action Card ──────────────────────────── */

interface CardProps {
  action: MagicalAction;
  onNavigate: (screen: ChildScreen) => void;
  index: number;
}

const SingleActionCard: React.FC<CardProps> = React.memo(({ action, onNavigate, index }) => {
  const play = useSoundPlay();
  const [showSparkle, setShowSparkle] = useState(false);

  const handleClick = useCallback(() => {
    play('click');
    setShowSparkle(true);
    setTimeout(() => {
      setShowSparkle(false);
      onNavigate(action.screen);
    }, 400);
  }, [play, onNavigate, action.screen]);

  return (
    <motion.button
      onClick={handleClick}
      className="relative flex flex-col items-center gap-4 backdrop-blur-sm w-full touch-manipulation"
      style={{
        padding: '32px 22px',
        background: action.bgGradient,
        boxShadow: '0 15px 40px rgba(120,140,240,0.10), 0 4px 12px rgba(120,140,240,0.06)',
        border: '1px solid rgba(255,255,255,0.5)',
        borderRadius: 28,
      }}
      initial={{ opacity: 0, y: 24, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.2 + index * 0.1,
        type: 'spring',
        stiffness: 180,
        damping: 20,
      }}
      whileHover={{ scale: 1.04, y: -6, boxShadow: '0 20px 40px rgba(120,140,240,0.14)' }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Icon Circle — flat, no border stroke */}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: 64, height: 64,
          background: `linear-gradient(135deg, ${action.glowColor.replace('0.35', '0.15')}, ${action.glowColor.replace('0.35', '0.25')})`,
          boxShadow: `0 4px 16px ${action.glowColor.replace('0.35', '0.12')}`,
        }}
      >
        <span style={{ fontSize: 30 }}>{action.icon}</span>

        {/* Sparkle burst on click */}
        <AnimatePresence>
          {showSparkle && (
            <div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: 8 }, (_, i) => (
                <SparkleParticle key={i} index={i} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Label */}
      <div className="text-center">
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{action.label}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-soft)', marginTop: 4 }}>{action.desc}</div>
      </div>

      {/* XP Badge */}
      <span style={{
        position: 'absolute', top: 12, right: 12,
        fontSize: 10, fontWeight: 800, color: 'var(--text-accent-purple)',
        background: 'var(--pastel-purple-soft)', padding: '4px 10px',
        borderRadius: 10, border: '1px solid rgba(200,180,240,0.25)',
      }}>
        {action.xpHint}
      </span>
    </motion.button>
  );
});
SingleActionCard.displayName = 'SingleActionCard';

/* ── Section Component ───────────────────────────── */

interface MagicalActionCardsProps {
  onNavigate: (screen: ChildScreen) => void;
}

export const MagicalActionCards: React.FC<MagicalActionCardsProps> = React.memo(({ onNavigate }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.3 }}
  >
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">🚀</span>
      <h2 className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--text-secondary)' }}>
        What do you want to do?
      </h2>
    </div>
    <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'stretch' }}>
      {MAGICAL_ACTIONS.map((action, i) => (
        <SingleActionCard
          key={action.label}
          action={action}
          onNavigate={onNavigate}
          index={i}
        />
      ))}
    </div>
  </motion.div>
));

MagicalActionCards.displayName = 'MagicalActionCards';
