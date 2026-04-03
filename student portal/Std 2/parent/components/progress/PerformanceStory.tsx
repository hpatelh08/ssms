/**
 * parent/components/progress/PerformanceStory.tsx
 * ─────────────────────────────────────────────────────
 * Emotional performance insight card.
 *
 * Large soft lavender card with a small mascot illustration,
 * dynamic narrative generated from skill data.
 *
 * Example:
 *  "Yash shows strong shape recognition.
 *   Encourage number practice this week to balance skills."
 *
 * Data from arcade_game_stars — no hardcoded text.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../auth/AuthContext';

/* ── Helpers ───────────────────────────────────────── */

function readGameStars(): Record<string, number> {
  try {
    const raw = localStorage.getItem('arcade_game_stars');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

interface SkillPct {
  label: string;
  percent: number;
}

function computeSkillPcts(stars: Record<string, number>): SkillPct[] {
  const maxStars = 3;
  const pct = (ids: string[]) => {
    const total = ids.length * maxStars;
    const earned = ids.reduce((s, id) => s + (stars[id] || 0), 0);
    return total > 0 ? Math.round((earned / total) * 100) : 0;
  };

  return [
    { label: 'shape recognition', percent: pct(['shapeQuest']) },
    { label: 'number skills', percent: pct(['numberTap', 'mathPuzzle', 'countObjects']) },
    { label: 'word building', percent: pct(['wordBuilder', 'guessTheWord', 'matchLetters']) },
    { label: 'logical thinking', percent: pct(['pictureIdentify']) },
  ];
}

function generateStory(name: string, skills: SkillPct[]): string {
  const sorted = [...skills].sort((a, b) => b.percent - a.percent);
  const best = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // All skills balanced
  if (best.percent - weakest.percent <= 15 && best.percent > 30) {
    return `${name} is showing well-rounded growth across all areas! Keep up this beautiful balance — every skill is blooming together. 🌈`;
  }

  // No activity yet
  if (best.percent === 0) {
    return `${name} hasn't started exploring yet — but every great journey starts with a single step! Encourage them to try a fun game today. 🚀`;
  }

  // Has a strong area
  const bestPhrase = `${name} shows strong ${best.label}`;

  if (weakest.percent === 0) {
    return `${bestPhrase}. Gently introduce ${weakest.label} activities this week to unlock new adventures! 🌱`;
  }

  if (weakest.percent < 30) {
    return `${bestPhrase}. Encourage ${weakest.label} practice this week to balance skills and watch everything grow together. 🌸`;
  }

  return `${bestPhrase} with solid progress in ${weakest.label} too! Keep playing and exploring — wonderful things are blooming. ✨`;
}

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

/* ── Main Export ────────────────────────────────────── */

export const PerformanceStory: React.FC = () => {
  const { user } = useAuth();
  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Your child', [user.name]);
  const stars = useMemo(readGameStars, []);
  const skills = useMemo(() => computeSkillPcts(stars), [stars]);
  const story = useMemo(() => generateStory(firstName, skills), [firstName, skills]);

  return (
    <motion.div
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(237,233,254,0.8) 0%, rgba(252,231,243,0.7) 100%)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 6px 32px rgba(168,85,247,0.08), 0 2px 8px rgba(0,0,0,0.03)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.25 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-10 -left-10 w-36 h-36 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-[0.07] blur-3xl" />
      <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-gradient-to-br from-indigo-300 to-purple-300 rounded-full opacity-[0.06] blur-3xl" />

      <div className="relative z-10 flex items-start gap-4">
        {/* Mascot illustration */}
        <motion.div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white/40"
          style={{ boxShadow: '0 2px 12px rgba(168,85,247,0.1)' }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-2xl">🦉</span>
        </motion.div>

        <div className="flex-1">
          {/* Section label */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💡</span>
            <h3 className="text-sm font-black text-gray-700">Insight</h3>
          </div>

          {/* Story text */}
          <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
            {story}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
