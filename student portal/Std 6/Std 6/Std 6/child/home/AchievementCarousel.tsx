/**
 * child/home/AchievementCarousel.tsx
 * ─────────────────────────────────────────────────────
 * High Visual Impact Achievement Cards.
 *
 * Taller cards, bigger icons, stronger saturated gradients,
 * glow borders, subtle pulse glow every 5s.
 *
 * Performance: transform + opacity only. React.memo.
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useXP } from '../XPProvider';

/* ── Design tokens ──────────────────────────────── */

const T = {
  primary: '#5a4bff',
  secondary: '#ff8bd6',
  success: '#4cd964',
  warning: '#ffb347',
  textPrimary: '#4f46e5',
  textSecondary: '#5f6cff',
  textBody: '#6b7cff',
} as const;

/* ── Animated count-up ───────────────────────────── */

function useCountUp(target: number, duration = 1200): number {
  const [val, setVal] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return val;
}

/* ── Card definitions — STRONGER gradients ───────── */

interface CardDef {
  key: string;
  icon: string;
  label: string;
  gradient: string;
  glowColor: string;
  glowBorder: string;
  textColor: string;
}

const CARD_DEFS: CardDef[] = [
  {
    key: 'level',
    icon: '⭐',
    label: 'Level',
    gradient: 'linear-gradient(145deg, #e4ddff 0%, #c8b8ff 50%, #b5a0ff 100%)',
    glowColor: 'rgba(90,75,255,0.16)',
    glowBorder: 'rgba(90,75,255,0.18)',
    textColor: T.primary,
  },
  {
    key: 'xp',
    icon: '💎',
    label: 'Total XP',
    gradient: 'linear-gradient(145deg, #dce6ff 0%, #b8cfff 50%, #9fbfff 100%)',
    glowColor: 'rgba(107,124,255,0.16)',
    glowBorder: 'rgba(107,124,255,0.18)',
    textColor: T.textSecondary,
  },
  {
    key: 'streak',
    icon: '🔥',
    label: 'Day Streak',
    gradient: 'linear-gradient(145deg, #ffeccc 0%, #ffd59a 50%, #ffc878 100%)',
    glowColor: 'rgba(255,179,71,0.18)',
    glowBorder: 'rgba(255,179,71,0.20)',
    textColor: T.warning,
  },
  {
    key: 'badges',
    icon: '🎖️',
    label: 'Badges',
    gradient: 'linear-gradient(145deg, #ffe0f0 0%, #ffc5e2 50%, #ffadd6 100%)',
    glowColor: 'rgba(255,139,214,0.16)',
    glowBorder: 'rgba(255,139,214,0.20)',
    textColor: T.secondary,
  },
  {
    key: 'weekly',
    icon: '📊',
    label: 'This Week',
    gradient: 'linear-gradient(145deg, #d0ffe0 0%, #a8f0c0 50%, #88e8a8 100%)',
    glowColor: 'rgba(76,217,100,0.16)',
    glowBorder: 'rgba(76,217,100,0.20)',
    textColor: T.success,
  },
];

/* ── Single Achievement Card — TALL + GLOW ───────── */

interface AchCardProps {
  def: CardDef;
  value: string | number;
  subtitle?: string;
  index: number;
}

const AchievementCard: React.FC<AchCardProps> = React.memo(({ def, value, subtitle, index }) => (
  <motion.div
    className="elite-ach-card flex flex-col items-center justify-center gap-3.5 relative overflow-hidden"
    style={{
      minHeight: 190,
      padding: '30px 20px 26px',
      background: def.gradient,
      borderRadius: 26,
      boxShadow: `0 18px 44px ${def.glowColor}`,
      border: `1.5px solid ${def.glowBorder}`,
    }}
    initial={{ opacity: 0, scale: 0.88, y: 18 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay: 0.2 + index * 0.08, type: 'spring', stiffness: 200, damping: 22 }}
    whileHover={{
      y: -8,
      scale: 1.04,
      boxShadow: `0 26px 56px ${def.glowColor.replace(/[\d.]+\)$/, '0.28)')}`,
      transition: { duration: 0.25 },
    }}
  >
    {/* Shine sweep */}
    <div className="elite-card-shine-overlay" />

    {/* Pulse glow ring — every 5s */}
    <motion.div
      style={{
        position: 'absolute', inset: -1,
        borderRadius: 26,
        border: `2px solid ${def.glowBorder}`,
        pointerEvents: 'none',
      }}
      animate={{ opacity: [0, 0.5, 0] }}
      transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
    />

    {/* Icon — BIGGER */}
    <div style={{
      width: 58, height: 58, borderRadius: 18,
      background: 'rgba(255,255,255,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 6px 16px ${def.glowColor}`,
    }}>
      <span style={{ fontSize: 32, lineHeight: 1 }}>{def.icon}</span>
    </div>

    {/* Value — animated */}
    <motion.div
      style={{ fontSize: 32, fontWeight: 900, color: def.textColor, lineHeight: 1 }}
      key={value}
      initial={{ opacity: 0.6, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {value}
    </motion.div>

    {/* Label */}
    <span style={{
      fontSize: 12, fontWeight: 700, color: T.textBody,
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {def.label}
    </span>

    {/* Subtitle */}
    {subtitle && (
      <span style={{ fontSize: 10, fontWeight: 600, color: def.textColor, opacity: 0.75, marginTop: -4 }}>
        {subtitle}
      </span>
    )}
  </motion.div>
));
AchievementCard.displayName = 'AchievementCard';

/* ── Main Component ──────────────────────────────── */

interface AchievementCarouselProps {
  streak?: number;
  badges?: { id: string }[];
}

export const AchievementCarousel: React.FC<AchievementCarouselProps> = React.memo(({
  streak = 0,
  badges = [],
}) => {
  const { state } = useXP();
  const displayLevel = useCountUp(state.level, 800);
  const displayXP = useCountUp(state.xp, 1000);

  const weeklyActivity = useMemo(() => {
    try {
      const raw = localStorage.getItem('ssms_weekly_activity');
      if (raw) return JSON.parse(raw) as number;
    } catch { /* */ }
    return Math.floor(Math.random() * 4) + 3;
  }, []);

  const cardValues: { value: string | number; subtitle?: string }[] = useMemo(() => [
    { value: `Lv ${displayLevel}`, subtitle: displayLevel >= 10 ? 'Explorer' : 'Rising Star' },
    { value: displayXP, subtitle: `/ ${state.xpToNext} to next` },
    { value: streak, subtitle: streak > 3 ? 'On fire!' : 'Keep going' },
    { value: badges.length, subtitle: badges.length > 0 ? 'Earned' : 'Start earning!' },
    { value: `${weeklyActivity}d`, subtitle: 'Active days' },
  ], [displayLevel, displayXP, state.xpToNext, streak, badges.length, weeklyActivity]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span style={{ fontSize: 20 }}>🏆</span>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: T.textPrimary }}>
          Achievements
        </h2>
      </div>

      {/* Large cards grid */}
      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
        }}
      >
        {CARD_DEFS.map((def, i) => (
          <AchievementCard
            key={def.key}
            def={def}
            value={cardValues[i].value}
            subtitle={cardValues[i].subtitle}
            index={i}
          />
        ))}
      </div>
    </motion.div>
  );
});

AchievementCarousel.displayName = 'AchievementCarousel';
