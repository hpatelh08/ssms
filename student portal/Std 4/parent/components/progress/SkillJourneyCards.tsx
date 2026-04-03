/**
 * parent/components/progress/SkillJourneyCards.tsx
 * ─────────────────────────────────────────────────────
 * Large rounded story cards for each skill area.
 *
 * Each card: big icon, skill name, growth %, animated
 * gradient shimmer progress bar, motivational subtitle.
 *
 * Data sourced from arcade_game_stars in localStorage.
 * No hardcoded percentages — everything computed live.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/* ── Data helpers ──────────────────────────────────── */

function readGameStars(): Record<string, number> {
  try {
    const raw = localStorage.getItem('arcade_game_stars');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

interface SkillInfo {
  label: string;
  icon: string;
  percent: number;
  gradient: string;
  barGradient: string;
  glowColor: string;
  games: string[];
}

function computeSkills(stars: Record<string, number>): SkillInfo[] {
  const maxStars = 3;
  const pct = (ids: string[]) => {
    const total = ids.length * maxStars;
    const earned = ids.reduce((s, id) => s + (stars[id] || 0), 0);
    return total > 0 ? Math.round((earned / total) * 100) : 0;
  };

  return [
    {
      label: 'Shapes',
      icon: '🔺',
      percent: pct(['shapeQuest']),
      gradient: '-emerald-/80 -yellow-/60',
      barGradient: '-emerald- -yellow-',
      glowColor: 'rgba(6,182,212,0.15)',
      games: ['shapeQuest'],
    },
    {
      label: 'Numbers',
      icon: '🔢',
      percent: pct(['numberTap', 'mathPuzzle', 'countObjects']),
      gradient: '-orange-/80 -amber-/60',
      barGradient: '-orange- -amber-',
      glowColor: 'rgba(139,92,246,0.15)',
      games: ['numberTap', 'mathPuzzle', 'countObjects'],
    },
    {
      label: 'Words',
      icon: '🔤',
      percent: pct(['wordBuilder', 'guessTheWord', 'matchLetters']),
      gradient: 'from-amber-50/80 to-orange-50/60',
      barGradient: 'from-amber-300 to-orange-500',
      glowColor: 'rgba(245,158,11,0.15)',
      games: ['wordBuilder', 'guessTheWord', 'matchLetters'],
    },
    {
      label: 'Logic',
      icon: '🧩',
      percent: pct(['pictureIdentify']),
      gradient: 'from-emerald-50/80 to-green-50/60',
      barGradient: 'from-emerald-300 to-green-500',
      glowColor: 'rgba(16,185,129,0.15)',
      games: ['pictureIdentify'],
    },
  ];
}

function getMotivation(pct: number): string {
  if (pct >= 100) return 'Mastered beautifully! ✨';
  if (pct >= 80) return 'Almost there — amazing!';
  if (pct >= 50) return 'Growing steadily!';
  if (pct > 0) return 'Getting started!';
  return 'Ready to explore!';
}

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

/* ── Shimmer keyframe (CSS-in-JS) ─────────────────── */
const shimmerStyle: React.CSSProperties = {
  backgroundSize: '200% 100%',
  animation: 'shimmer 2s ease-in-out infinite',
};

/* ── Single Skill Card ─────────────────────────────── */

const SkillCard: React.FC<{ skill: SkillInfo; index: number }> = ({ skill, index }) => (
  <motion.div
    className={`rounded-3xl bg-gradient-to-br ${skill.gradient} backdrop-blur-md p-6 shadow-md relative overflow-hidden`}
    style={{ boxShadow: `0 4px 24px ${skill.glowColor}, 0 1px 4px rgba(0,0,0,0.03)` }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay: 0.08 + index * 0.08 }}
    whileHover={{ scale: 1.02, y: -2 }}
  >
    {/* Decorative blob */}
    <div
      className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-[0.08] blur-2xl"
      style={{ background: `linear-gradient(135deg, ${skill.glowColor}, transparent)` }}
    />

    <div className="flex items-center gap-4 relative z-10">
      {/* Big icon */}
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/50 shadow-sm"
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
      >
        <span className="text-2xl">{skill.icon}</span>
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[15px] font-black text-gray-800">{skill.label}</h3>
          <span className="text-[15px] font-black text-gray-700">{skill.percent}%</span>
        </div>

        {/* Animated progress bar with gradient shimmer */}
        <div className="relative h-3 rounded-full overflow-hidden bg-white/50">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${skill.barGradient}`}
            style={shimmerStyle}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(skill.percent, 2)}%` }}
            transition={{ duration: 0.8, delay: 0.15 + index * 0.08, ease: 'easeOut' }}
          />
        </div>

        {/* Motivational subtitle */}
        <p className="text-[11px] font-semibold text-gray-400 mt-1.5">
          {getMotivation(skill.percent)}
        </p>
      </div>
    </div>
  </motion.div>
);

/* ── Main Export ────────────────────────────────────── */

export const SkillJourneyCards: React.FC = () => {
  const stars = useMemo(readGameStars, []);
  const skills = useMemo(() => computeSkills(stars), [stars]);

  return (
    <div className="space-y-3">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">🎯</span>
        <h2 className="text-sm font-black text-gray-700">Skill Journey</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {skills.map((skill, i) => (
          <SkillCard key={skill.label} skill={skill} index={i} />
        ))}
      </div>

      {/* Shimmer animation keyframe */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};
