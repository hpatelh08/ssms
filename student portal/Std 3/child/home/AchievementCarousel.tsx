/**
 * child/home/AchievementCarousel.tsx
 * ─────────────────────────────────────────────────────
 * Game-based achievement gallery.
 *
 * Each mini-game gets its own achievement card so the
 * child sees progress tied to actual games played.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GAME_CONFIGS } from '../../games/types';

const T = {
  title: '#4f46e5',
  body: '#6673d8',
  muted: '#7c86d6',
  success: '#16a34a',
  warning: '#f59e0b',
  locked: '#94a3b8',
} as const;

const GRADIENTS = [
  'linear-gradient(145deg, #e0f2fe 0%, #bfdbfe 45%, #c4b5fd 100%)',
  'linear-gradient(145deg, #fef3c7 0%, #fdba74 45%, #f9a8d4 100%)',
  'linear-gradient(145deg, #dcfce7 0%, #86efac 45%, #67e8f9 100%)',
  'linear-gradient(145deg, #fce7f3 0%, #f9a8d4 45%, #c4b5fd 100%)',
  'linear-gradient(145deg, #ede9fe 0%, #c4b5fd 45%, #93c5fd 100%)',
];

type Difficulty = 'easy' | 'intermediate' | 'difficult';

interface StoredDifficultyProgress {
  totalAttempts?: number;
  correctAnswers?: number;
  accuracy?: number;
  bestStreak?: number;
  sessionsPlayed?: number;
  lastPlayedAt?: string;
}

interface StoredGameProgress {
  easy?: StoredDifficultyProgress & { unlockedDifficulties?: Difficulty[] };
  intermediate?: StoredDifficultyProgress;
  difficult?: StoredDifficultyProgress;
}

interface GameAchievement {
  id: string;
  icon: string;
  title: string;
  tag: string;
  gradient: string;
  played: boolean;
  stars: number;
  sessions: number;
  accuracy: number;
  bestStreak: number;
}

function readStars(): Record<string, number> {
  try {
    const raw = localStorage.getItem('arcade_game_stars');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function readProgress(gameId: string): StoredGameProgress | null {
  try {
    const raw = localStorage.getItem(`ssms_gp2_${gameId}`);
    return raw ? JSON.parse(raw) as StoredGameProgress : null;
  } catch {
    return null;
  }
}

function computeAchievements(): GameAchievement[] {
  const stars = readStars();

  return GAME_CONFIGS.map((game, index) => {
    const progress = readProgress(game.id);
    const diffs: Difficulty[] = ['easy', 'intermediate', 'difficult'];
    let sessions = 0;
    let attempts = 0;
    let correct = 0;
    let bestStreak = 0;

    for (const diff of diffs) {
      const entry = progress?.[diff];
      sessions += entry?.sessionsPlayed || 0;
      attempts += entry?.totalAttempts || 0;
      correct += entry?.correctAnswers || 0;
      bestStreak = Math.max(bestStreak, entry?.bestStreak || 0);
    }

    return {
      id: game.id,
      icon: game.icon,
      title: game.title,
      tag: game.tag,
      gradient: GRADIENTS[index % GRADIENTS.length],
      played: sessions > 0 || (stars[game.id] || 0) > 0,
      stars: stars[game.id] || 0,
      sessions,
      accuracy: attempts > 0 ? correct / attempts : 0,
      bestStreak,
    };
  }).sort((a, b) => {
    if (a.played !== b.played) return a.played ? -1 : 1;
    if (b.stars !== a.stars) return b.stars - a.stars;
    return b.sessions - a.sessions;
  });
}

const GameAchievementCard: React.FC<{ achievement: GameAchievement; index: number }> = ({ achievement, index }) => {
  const accent = achievement.played
    ? achievement.accuracy >= 0.8 ? T.success : achievement.accuracy >= 0.5 ? T.warning : T.title
    : T.locked;

  return (
    <motion.div
      style={{
        minHeight: 196,
        padding: '22px 18px 18px',
        background: achievement.gradient,
        borderRadius: 26,
        border: `1.5px solid ${achievement.played ? 'rgba(99,102,241,0.18)' : 'rgba(148,163,184,0.18)'}`,
        boxShadow: achievement.played
          ? '0 18px 44px rgba(99,102,241,0.14)'
          : '0 12px 30px rgba(148,163,184,0.10)',
        position: 'relative',
        overflow: 'hidden',
      }}
      initial={{ opacity: 0, scale: 0.9, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.04, type: 'spring', stiffness: 210, damping: 22 }}
      whileHover={{ y: -6, scale: 1.03 }}
    >
      <div
        style={{
          position: 'absolute',
          top: -32,
          right: -22,
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.45), transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.62)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 18px rgba(255,255,255,0.28)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 30, lineHeight: 1 }}>{achievement.icon}</span>
        </div>

        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: accent,
            background: 'rgba(255,255,255,0.62)',
            padding: '6px 10px',
            borderRadius: 999,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {achievement.played ? 'Unlocked' : 'Locked'}
        </span>
      </div>

      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 16, fontWeight: 900, color: T.title, margin: 0, lineHeight: 1.2 }}>
          {achievement.title}
        </p>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, margin: '4px 0 0' }}>
          {achievement.tag}
        </p>
      </div>

      <div style={{ marginTop: 18 }}>
        {achievement.played ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.42)', borderRadius: 14, padding: '10px 6px' }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: T.title, margin: 0 }}>{achievement.stars}</p>
                <p style={{ fontSize: 9, fontWeight: 700, color: T.body, margin: '3px 0 0' }}>Stars</p>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.42)', borderRadius: 14, padding: '10px 6px' }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: T.title, margin: 0 }}>{achievement.sessions}</p>
                <p style={{ fontSize: 9, fontWeight: 700, color: T.body, margin: '3px 0 0' }}>Sessions</p>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.42)', borderRadius: 14, padding: '10px 6px' }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: accent, margin: 0 }}>{Math.round(achievement.accuracy * 100)}%</p>
                <p style={{ fontSize: 9, fontWeight: 700, color: T.body, margin: '3px 0 0' }}>Accuracy</p>
              </div>
            </div>

            <p style={{ fontSize: 10, fontWeight: 700, color: T.body, margin: '12px 0 0' }}>
              Best streak: {achievement.bestStreak}
            </p>
          </>
        ) : (
          <div
            style={{
              background: 'rgba(255,255,255,0.42)',
              borderRadius: 18,
              padding: '16px 14px',
              minHeight: 78,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: T.locked, margin: 0, lineHeight: 1.5 }}>
              Play this mini-game once to unlock its achievement card.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface AchievementCarouselProps {
  streak?: number;
  badges?: { id: string }[];
}

export const AchievementCarousel: React.FC<AchievementCarouselProps> = React.memo(() => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion(v => v + 1);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const achievements = useMemo(() => computeAchievements(), [version]);
  const unlockedCount = achievements.filter(item => item.played).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 20 }}>🏆</span>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: T.title }}>
              Game Achievements
            </h2>
            <p style={{ fontSize: 11, fontWeight: 700, margin: '2px 0 0', color: T.muted }}>
              One achievement for each mini-game
            </p>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.62)',
            border: '1px solid rgba(99,102,241,0.12)',
            borderRadius: 999,
            padding: '8px 12px',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, color: T.body }}>
            {unlockedCount}/{achievements.length} unlocked
          </span>
        </div>
      </div>

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
      >
        {achievements.map((achievement, index) => (
          <GameAchievementCard
            key={achievement.id}
            achievement={achievement}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
});

AchievementCarousel.displayName = 'AchievementCarousel';
