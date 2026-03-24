/**
 * child/journey/GameProgressDetail.tsx
 * ─────────────────────────────────────────────────────
 * Detailed progress page for a specific game category.
 * Opened when the user taps a game chip in JourneyPage.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getJourneyProgress, LEVELS_PER_ACHIEVEMENT } from './journeyProgress';
import { loadMastery } from '../../games/subjects/engine/progressStore';
import { MATHS_CHAPTERS, ENGLISH_CHAPTERS } from '../../games/subjects/engine/types';
import { GAME_CONFIGS } from '../../games/types';

/* ── Types ────────────────────────────────────────── */
export type GameKey = 'arcade' | 'math' | 'english' | 'odd-one-out' | 'word-builder';

interface GameProgressDetailProps {
  gameKey: GameKey;
  onBack: () => void;
}

/* ── Meta ─────────────────────────────────────────── */
const GAME_META: Record<GameKey, { icon: string; label: string; color: string; bg: string }> = {
  'arcade':       { icon: '🎮', label: 'Arcade Games',    color: '#ff7f50', bg: 'linear-gradient(135deg,#ff7f50,#e74c3c)' },
  'math':         { icon: '🔢', label: 'Maths World',     color: '#ffd166', bg: 'linear-gradient(135deg,#f0b429,#e67e22)' },
  'english':      { icon: '📚', label: 'English Kingdom', color: '#a8e6cf', bg: 'linear-gradient(135deg,#43b89c,#2ecc71)' },
  'odd-one-out':  { icon: '🚗', label: 'Odd One Out',     color: '#c084fc', bg: 'linear-gradient(135deg,#9b59b6,#8e44ad)' },
  'word-builder': { icon: '🔤', label: 'Word Builder',    color: '#38bdf8', bg: 'linear-gradient(135deg,#3498db,#2980b9)' },
};

/* ── Difficulty completion colors ─────────────────── */
const DIFF_COLORS = {
  easy:         { label: 'Easy',         icon: '⭐', color: '#4ade80', dim: 'rgba(74,222,128,0.15)' },
  intermediate: { label: 'Intermediate', icon: '🥈', color: '#fbbf24', dim: 'rgba(251,191,36,0.15)' },
  difficult:    { label: 'Difficult',    icon: '🏆', color: '#f87171', dim: 'rgba(248,113,113,0.15)' },
};

const BOX_CATEGORY_CYCLE: GameKey[] = ['arcade', 'english', 'math', 'odd-one-out', 'word-builder'];

function getCategoryForBox(boxNum: number): GameKey {
  const safe = Math.max(1, Math.floor(boxNum));
  return BOX_CATEGORY_CYCLE[(safe - 1) % BOX_CATEGORY_CYCLE.length] ?? 'arcade';
}

const ACHIEVEMENTS_BY_GAME: Record<GameKey, Array<{ emoji: string; name: string }>> = {
  arcade: [
    { emoji: '🎮', name: 'Arcade Starter' },
    { emoji: '🕹️', name: 'Arcade Player' },
    { emoji: '🚀', name: 'Arcade Explorer' },
    { emoji: '⚡', name: 'Arcade Challenger' },
    { emoji: '🎯', name: 'Arcade Sharpshooter' },
    { emoji: '🔥', name: 'Arcade Blazer' },
    { emoji: '🧠', name: 'Arcade Strategist' },
    { emoji: '🏅', name: 'Arcade Skilled' },
    { emoji: '🏆', name: 'Arcade Champion' },
    { emoji: '💎', name: 'Arcade Elite' },
    { emoji: '👑', name: 'Arcade King' },
    { emoji: '🌟', name: 'Arcade Legend' },
    { emoji: '⚔️', name: 'Arcade Warrior' },
    { emoji: '🛡️', name: 'Arcade Defender' },
    { emoji: '🏹', name: 'Arcade Master' },
    { emoji: '🌠', name: 'Arcade Ultimate' },
  ],
  math: [
    { emoji: '🔢', name: 'Number Starter' },
    { emoji: '➕', name: 'Addition Explorer' },
    { emoji: '➖', name: 'Subtraction Solver' },
    { emoji: '✖️', name: 'Multiplication Master' },
    { emoji: '➗', name: 'Division Expert' },
    { emoji: '🧮', name: 'Math Learner' },
    { emoji: '📊', name: 'Data Explorer' },
    { emoji: '📈', name: 'Pattern Finder' },
    { emoji: '📉', name: 'Number Analyzer' },
    { emoji: '🔍', name: 'Logic Thinker' },
    { emoji: '🧠', name: 'Smart Calculator' },
    { emoji: '💡', name: 'Idea Solver' },
    { emoji: '🧩', name: 'Equation Builder' },
    { emoji: '📐', name: 'Geometry Starter' },
    { emoji: '📏', name: 'Measurement Master' },
    { emoji: '🔺', name: 'Shape Identifier' },
    { emoji: '🔷', name: 'Polygon Explorer' },
    { emoji: '🟦', name: 'Area Finder' },
    { emoji: '🟩', name: 'Perimeter Master' },
    { emoji: '🧠', name: 'Math Strategist' },
    { emoji: '⚡', name: 'Quick Calculator' },
    { emoji: '🎯', name: 'Accurate Solver' },
    { emoji: '📊', name: 'Math Analyst' },
    { emoji: '🔬', name: 'Number Scientist' },
    { emoji: '🧭', name: 'Logic Navigator' },
    { emoji: '🏆', name: 'Math Achiever' },
    { emoji: '🥇', name: 'Math Champion' },
    { emoji: '💎', name: 'Math Elite' },
    { emoji: '👑', name: 'Math King' },
    { emoji: '🌟', name: 'Math Legend' },
    { emoji: '🚀', name: 'Math Explorer' },
    { emoji: '⚙️', name: 'Math Engineer' },
    { emoji: '🔢', name: 'Number Genius' },
    { emoji: '📊', name: 'Math Mastermind' },
    { emoji: '🧮', name: 'Math Grandmaster' },
    { emoji: '🏆', name: 'Ultimate Mathematician' },
  ],
  english: [
    { emoji: '🔤', name: 'Alphabet Starter' },
    { emoji: '📖', name: 'Word Reader' },
    { emoji: '✏️', name: 'Sentence Builder' },
    { emoji: '📝', name: 'Grammar Learner' },
    { emoji: '📚', name: 'Story Reader' },
    { emoji: '🔍', name: 'Vocabulary Finder' },
    { emoji: '🗣️', name: 'Speaker Starter' },
    { emoji: '🎤', name: 'Pronunciation Master' },
    { emoji: '📘', name: 'Chapter Explorer' },
    { emoji: '📖', name: 'Story Analyzer' },
    { emoji: '🧠', name: 'Language Thinker' },
    { emoji: '💬', name: 'Conversation Builder' },
    { emoji: '✍️', name: 'Writing Starter' },
    { emoji: '📝', name: 'Paragraph Writer' },
    { emoji: '📑', name: 'Essay Builder' },
    { emoji: '📖', name: 'Reading Expert' },
    { emoji: '🧩', name: 'Word Puzzle Solver' },
    { emoji: '🔡', name: 'Spelling Master' },
    { emoji: '🧠', name: 'Language Strategist' },
    { emoji: '📚', name: 'Knowledge Reader' },
    { emoji: '⚡', name: 'Fast Reader' },
    { emoji: '🎯', name: 'Accurate Writer' },
    { emoji: '📘', name: 'Book Explorer' },
    { emoji: '🔍', name: 'Meaning Finder' },
    { emoji: '🗝️', name: 'Word Unlocker' },
    { emoji: '🏆', name: 'English Achiever' },
    { emoji: '🥇', name: 'English Champion' },
    { emoji: '💎', name: 'English Elite' },
    { emoji: '👑', name: 'English King' },
    { emoji: '🌟', name: 'English Legend' },
    { emoji: '🚀', name: 'Language Explorer' },
    { emoji: '📜', name: 'Literature Lover' },
    { emoji: '✨', name: 'Creative Writer' },
    { emoji: '🧠', name: 'Word Genius' },
    { emoji: '📚', name: 'Language Master' },
    { emoji: '🏆', name: 'Ultimate English Master' },
  ],
  'odd-one-out': [
    { emoji: '🧩', name: 'Pattern Finder' },
    { emoji: '🔍', name: 'Odd Detector' },
    { emoji: '🧠', name: 'Logic Master' },
    { emoji: '🏆', name: 'Puzzle Champion' },
  ],
  'word-builder': [
    { emoji: '🧱', name: 'Builder Starter' },
    { emoji: '🏗️', name: 'Structure Creator' },
    { emoji: '🌆', name: 'City Designer' },
    { emoji: '👑', name: 'World Architect' },
  ],
};

/* ── Shared BG ────────────────────────────────────── */
const BG_SRC = '/assets/journy/background/background.png';

/* ── Stat card ────────────────────────────────────── */
const StatCard: React.FC<{ icon: string; label: string; value: string | number; color: string }> = ({
  icon, label, value, color,
}) => (
  <div style={{
    background: 'rgba(255,255,255,0.07)',
    border: `1px solid ${color}44`,
    borderRadius: 16,
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minWidth: 90,
    flex: 1,
  }}>
    <span style={{ fontSize: 24 }}>{icon}</span>
    <span style={{ color, fontSize: 22, fontWeight: 900, fontFamily: 'Nunito, sans-serif' }}>{value}</span>
    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700, textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>{label}</span>
  </div>
);

/* ── Chapter card (Maths / English) ────────────────── */
const ChapterCard: React.FC<{
  icon: string;
  title: string;
  gradient: string;
  games: Array<{
    id: string;
    title: string;
    icon: string;
    easy: { completed: boolean; done: number; total: number };
    intermediate: { completed: boolean; done: number; total: number };
    difficult: { completed: boolean; done: number; total: number };
  }>;
  idx: number;
}> = ({ icon, title, gradient, games, idx }) => {
  const totalGames = games.length;
  const fullyDone = games.filter(g => g.easy.completed && g.intermediate.completed && g.difficult.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      style={{
        background: 'rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {/* Chapter header */}
      <div style={{
        background: `linear-gradient(135deg,${gradient.replace('from-','').replace(' to-','')})`,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 14, fontFamily: 'Nunito, sans-serif', flex: 1 }}>{title}</span>
        <span style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 12,
          padding: '2px 10px',
          color: '#fff',
          fontSize: 11,
          fontWeight: 800,
        }}>
          {fullyDone}/{totalGames} mastered
        </span>
      </div>

      {/* Games list */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {games.map(g => {
          const difficulties = ['easy', 'intermediate', 'difficult'] as const;
          const anyStarted = g.easy.done > 0 || g.intermediate.done > 0 || g.difficult.done > 0;
          return (
            <div key={g.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 10px',
              background: anyStarted ? 'rgba(255,255,255,0.05)' : 'transparent',
              borderRadius: 12,
              border: anyStarted ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
            }}>
              {/* Game title */}
              <span style={{ fontSize: 14, flexShrink: 0 }}>{g.icon}</span>
              <span style={{
                color: anyStarted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                fontSize: 12,
                fontWeight: 700,
                flex: 1,
                fontFamily: 'Nunito, sans-serif',
              }}>{g.title}</span>

              {/* Difficulty badges */}
              <div style={{ display: 'flex', gap: 5 }}>
                {difficulties.map(diff => {
                  const d = g[diff];
                  const meta = DIFF_COLORS[diff];
                  const pct = d.total > 0 ? Math.round((d.done / d.total) * 100) : 0;
                  return (
                    <div key={diff} title={`${meta.label}: ${d.done}/${d.total}`} style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: d.completed ? meta.color : meta.dim,
                      border: `2px solid ${d.completed ? meta.color : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: d.completed ? 14 : 9,
                      fontWeight: 900,
                      color: d.completed ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontFamily: 'Nunito, sans-serif',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {d.completed ? (
                        meta.icon
                      ) : d.done > 0 ? (
                        <>
                          {/* mini progress bar */}
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            height: `${pct}%`,
                            background: `${meta.color}55`,
                          }} />
                          <span style={{ position: 'relative', zIndex: 1, fontSize: 9 }}>{Math.round(pct)}%</span>
                        </>
                      ) : (
                        '·'
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

/* ── Level grid (OddOneOut / WordBuilder) ─────────── */
const LevelGrid: React.FC<{ currentLevel: number; color: string; maxShow?: number }> = ({
  currentLevel, color, maxShow = 60,
}) => {
  const levels = Math.min(Math.max(currentLevel + 5, 20), maxShow);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', padding: '0 4px' }}>
      {Array.from({ length: levels }, (_, i) => {
        const n = i + 1;
        const done = n < currentLevel;
        const current = n === currentLevel;
        return (
          <motion.div
            key={n}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: Math.min(i * 0.015, 0.5) }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: current ? 13 : 12,
              fontWeight: 900,
              fontFamily: 'Nunito, sans-serif',
              background: current
                ? color
                : done
                  ? `${color}33`
                  : 'rgba(255,255,255,0.05)',
              border: `2px solid ${current ? color : done ? `${color}66` : 'rgba(255,255,255,0.1)'}`,
              color: current ? '#fff' : done ? color : 'rgba(255,255,255,0.3)',
              boxShadow: current ? `0 0 12px ${color}88` : 'none',
              position: 'relative',
            }}
          >
            {current && (
              <motion.div
                style={{
                  position: 'absolute', inset: -4,
                  borderRadius: 16,
                  border: `2px solid ${color}`,
                  pointerEvents: 'none',
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            {done ? '✓' : n}
          </motion.div>
        );
      })}
    </div>
  );
};

/* ── Main Component ────────────────────────────────── */
const GameProgressDetail: React.FC<GameProgressDetailProps> = ({ gameKey, onBack }) => {
  const meta = GAME_META[gameKey];
  const progress = getJourneyProgress();
  const journeyCount = progress.breakdown[gameKey] ?? 0;

  /* ── Per-game data ── */
  const mathsData = useMemo(() => {
    if (gameKey !== 'math') return null;
    const store = loadMastery();
    return MATHS_CHAPTERS.map(ch => ({
      icon: ch.icon,
      title: ch.title,
      gradient: ch.gradient,
      games: ch.games.map(g => {
        const key = `maths_${ch.id}_${g.id}`;
        const gp = store[key];
        const LEVEL_COUNTS: Record<string, number> = { easy: 40, intermediate: 30, difficult: 30 };
        const mkDiff = (diff: string) => {
          if (!gp) return { completed: false, done: 0, total: LEVEL_COUNTS[diff] ?? 5 };
          const dp = gp[diff as 'easy' | 'intermediate' | 'difficult'];
          return {
            completed: dp?.completed ?? false,
            done: Object.values(dp?.miniLevels ?? {}).filter((m: unknown) => (m as { completed: boolean }).completed).length,
            total: LEVEL_COUNTS[diff] ?? 5,
          };
        };
        return { id: g.id, title: g.title, icon: g.icon, easy: mkDiff('easy'), intermediate: mkDiff('intermediate'), difficult: mkDiff('difficult') };
      }),
    }));
  }, [gameKey]);

  const englishData = useMemo(() => {
    if (gameKey !== 'english') return null;
    const store = loadMastery();
    return ENGLISH_CHAPTERS.map(ch => ({
      icon: ch.icon,
      title: ch.title,
      gradient: ch.gradient,
      games: ch.games.map(g => {
        const key = `english_${ch.id}_${g.id}`;
        const gp = store[key];
        const LEVEL_COUNTS: Record<string, number> = { easy: 40, intermediate: 30, difficult: 30 };
        const mkDiff = (diff: string) => {
          if (!gp) return { completed: false, done: 0, total: LEVEL_COUNTS[diff] ?? 5 };
          const dp = gp[diff as 'easy' | 'intermediate' | 'difficult'];
          return {
            completed: dp?.completed ?? false,
            done: Object.values(dp?.miniLevels ?? {}).filter((m: unknown) => (m as { completed: boolean }).completed).length,
            total: LEVEL_COUNTS[diff] ?? 5,
          };
        };
        return { id: g.id, title: g.title, icon: g.icon, easy: mkDiff('easy'), intermediate: mkDiff('intermediate'), difficult: mkDiff('difficult') };
      }),
    }));
  }, [gameKey]);

  const ooLevel = useMemo(() => {
    if (gameKey !== 'odd-one-out') return 1;
    return Math.max(1, parseInt(localStorage.getItem('oddOneOut_currentLevel') ?? '1', 10));
  }, [gameKey]);

  const wbLevel = useMemo(() => {
    if (gameKey !== 'word-builder') return 1;
    return Math.max(1, parseInt(localStorage.getItem('wordBuilder_currentLevel') ?? '1', 10));
  }, [gameKey]);

  const arcadeData = useMemo(() => {
    if (gameKey !== 'arcade') return null;
    const store = loadMastery();
    const arcadeKeys = Object.keys(store).filter(k => !k.startsWith('maths_') && !k.startsWith('english_'));
    return arcadeKeys.map(k => {
      const gp = store[k];
      const parts = k.split('_');
      const gameTypeId = parts[parts.length - 1] ?? '';
      const gameMeta = GAME_CONFIGS.find(g => g.id === gameTypeId);
      const title = gameMeta?.title ?? k;
      const icon = gameMeta?.icon ?? '🎮';
      const LEVEL_COUNTS: Record<string, number> = { easy: 40, intermediate: 30, difficult: 30 };
      const mkDiff = (diff: string) => {
        const dp = gp[diff as 'easy' | 'intermediate' | 'difficult'];
        return {
          completed: dp?.completed ?? false,
          done: Object.values(dp?.miniLevels ?? {}).filter((m: unknown) => (m as { completed: boolean }).completed).length,
          total: LEVEL_COUNTS[diff] ?? 5,
        };
      };
      return {
        key: k,
        title,
        icon,
        easy: mkDiff('easy'),
        intermediate: mkDiff('intermediate'),
        difficult: mkDiff('difficult'),
        badges: gp.badges ?? [],
      };
    });
  }, [gameKey]);

  const achievementList = ACHIEVEMENTS_BY_GAME[gameKey] ?? [];
  const achievementCount = useMemo(() => {
    const opened = Array.isArray(progress.openedBoxes) ? progress.openedBoxes : [];
    const unlockedForThisGame = opened.filter((boxNum) => getCategoryForBox(boxNum) === gameKey).length;
    return Math.min(achievementList.length, unlockedForThisGame);
  }, [achievementList.length, gameKey, progress.openedBoxes]);

  /* ── Aggregate stats ── */
  const totalCompleted = useMemo(() => {
    const chapters = mathsData ?? englishData ?? [];
    return chapters.reduce((acc, ch) => {
      return acc + ch.games.reduce((a, g) => {
        return a + (g.easy.completed ? 1 : 0) + (g.intermediate.completed ? 1 : 0) + (g.difficult.completed ? 1 : 0);
      }, 0);
    }, 0);
  }, [mathsData, englishData]);

  const totalBadges = useMemo(() => {
    const chapters = mathsData ?? englishData ?? [];
    return chapters.reduce((acc, ch) => {
      return acc + ch.games.reduce((a, g) => {
        return a + (g.easy.completed ? 1 : 0) + (g.intermediate.completed ? 1 : 0) + (g.difficult.completed ? 1 : 0);
      }, 0);
    }, 0);
  }, [mathsData, englishData]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 80px)',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Nunito, sans-serif',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${BG_SRC})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 0,
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,15,0.7)', zIndex: 1 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '2px solid rgba(255,255,255,0.08)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}
        >
          {/* Back button */}
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              color: '#fff',
              fontSize: 18,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ←
          </button>

          {/* Game icon badge */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: meta.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            boxShadow: `0 0 16px ${meta.color}66`,
            flexShrink: 0,
          }}>
            {meta.icon}
          </div>

          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>{meta.label}</div>
            <div style={{ color: meta.color, fontSize: 12, fontWeight: 700 }}>
              {journeyCount} levels contributed to journey
            </div>
          </div>
        </motion.div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{ display: 'flex', gap: 10, marginBottom: 18 }}
          >
            <StatCard icon="🏅" label="Journey Levels" value={journeyCount} color={meta.color} />
            {(mathsData || englishData) && (
              <StatCard icon="🏆" label="Difficulties Done" value={totalCompleted} color="#ffd166" />
            )}
            {gameKey === 'odd-one-out' && (
              <StatCard icon="🚗" label="Current Level" value={ooLevel} color={meta.color} />
            )}
            {gameKey === 'word-builder' && (
              <StatCard icon="🔤" label="Current Level" value={wbLevel} color={meta.color} />
            )}
            {gameKey === 'arcade' && (
              <StatCard icon="🎯" label="Games Started" value={arcadeData?.length ?? 0} color={meta.color} />
            )}
            <StatCard icon="⭐" label="Achievements" value={achievementCount} color="#a8e6cf" />
          </motion.div>

          {/* Difficulty legend */}
          {(mathsData || englishData) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 14,
                justifyContent: 'flex-end',
              }}
            >
              {(['easy', 'intermediate', 'difficult'] as const).map(d => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 6,
                    background: DIFF_COLORS[d].color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10,
                  }}>
                    {DIFF_COLORS[d].icon}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700 }}>
                    {DIFF_COLORS[d].label}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 800, marginBottom: 10, textAlign: 'center' }}>
              {meta.label} Achievements ({achievementCount}/{achievementList.length})
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10,
              marginBottom: 16,
            }}>
              {achievementList.map((ach, idx) => {
                const unlocked = idx < achievementCount;
                return (
                  <div
                    key={ach.name}
                    style={{
                      background: unlocked ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${unlocked ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: 12,
                      padding: '10px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 78,
                      opacity: unlocked ? 1 : 0.65,
                    }}
                  >
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{unlocked ? ach.emoji : '🔒'}</span>
                    <span style={{
                      marginTop: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      textAlign: 'center',
                      color: unlocked ? '#FFE08A' : 'rgba(255,255,255,0.7)',
                      lineHeight: 1.3,
                    }}>
                      {ach.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Maths chapters ── */}
          {mathsData && mathsData.map((ch, i) => (
            <ChapterCard key={ch.title} {...ch} idx={i} />
          ))}

          {/* ── English chapters ── */}
          {englishData && englishData.map((ch, i) => (
            <ChapterCard key={ch.title} {...ch} idx={i} />
          ))}

          {/* ── Odd One Out level grid ── */}
          {gameKey === 'odd-one-out' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div style={{
                color: meta.color, fontSize: 14, fontWeight: 900,
                marginBottom: 14, textAlign: 'center',
              }}>
                Level Progress — Currently on Level {ooLevel}
              </div>
              <LevelGrid currentLevel={ooLevel} color={meta.color} maxShow={60} />
            </motion.div>
          )}

          {/* ── Word Builder level grid ── */}
          {gameKey === 'word-builder' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div style={{
                color: meta.color, fontSize: 14, fontWeight: 900,
                marginBottom: 14, textAlign: 'center',
              }}>
                Level Progress — Currently on Level {wbLevel}
              </div>
              <LevelGrid currentLevel={wbLevel} color={meta.color} maxShow={50} />
            </motion.div>
          )}

          {/* ── Arcade ── */}
          {gameKey === 'arcade' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {arcadeData && arcadeData.length > 0 ? (
                <>
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
                    Games Played
                  </div>
                  {arcadeData.map((item, i) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        padding: '12px 16px',
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, textTransform: 'capitalize' }}>
                          {item.title}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>
                          {item.badges.length} badges
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['easy', 'intermediate', 'difficult'] as const).map(d => {
                          const dd = item[d];
                          const m = DIFF_COLORS[d];
                          return (
                            <div key={d} style={{
                              width: 28, height: 28, borderRadius: 8,
                              background: dd.completed ? m.color : m.dim,
                              border: `2px solid ${dd.completed ? m.color : 'rgba(255,255,255,0.1)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12,
                            }}>
                              {dd.completed ? m.icon : '·'}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: 700,
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
                  No arcade games played yet. Head to the Play screen to get started!
                </div>
              )}
            </motion.div>
          )}

          {/* Empty journey state */}
          {journeyCount === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                textAlign: 'center',
                marginTop: 20,
                padding: '16px',
                background: 'rgba(255,215,0,0.07)',
                border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: 16,
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              🌟 Play this game to earn journey levels and unlock treasure boxes!
            </motion.div>
          )}

          {/* Bottom padding */}
          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  );
};

export default GameProgressDetail;
