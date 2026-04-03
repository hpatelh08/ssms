/**
 * parent/pages/PuzzleZoneProgressPage.tsx
 * ─────────────────────────────────────────────────────
 * Parent-facing Puzzle Zone analytics.
 * Shows stats for the 3 Puzzle Zone games:
 *   findThePair · brainMaze · logicPuzzle
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useGameProgress } from '../analytics/useGameProgress';

/* ── Design Tokens ─────────────────────────────── */
const CLR = {
  primary:  '#3B3FAF',
  muted:    '#8F94D4',
  green:    '#10B981',
  teal:     '#14b8a6',
  sky:      '#38BDF8',
  amber:    '#F59E0B',
  purple:   '#7aa344',
};
const CARD_BG     = 'rgba(255,255,255,0.72)';
const CARD_BORDER = '1px solid rgba(127,174,101,0.12)';
const CARD_SHADOW = '0 2px 16px rgba(92,106,196,0.06)';
const R = 18;

const PUZZLE_GAMES = ['findThePair', 'brainMaze', 'logicPuzzle'];
const pctFromRatio = (ratio: number): number => Math.round(Math.max(0, Math.min(1, ratio)) * 100);

const GAME_META: Record<string, { icon: string; label: string; color: string }> = {
  findThePair: { icon: '🧩', label: 'Find the Pair',  color: CLR.teal   },
  brainMaze:   { icon: '🔀', label: 'Brain Maze',     color: CLR.green  },
  logicPuzzle: { icon: '🧠', label: 'Logic Puzzle',   color: CLR.purple },
};

/* ── Small hero stat card ───────────────────────── */
const Stat: React.FC<{ icon: string; label: string; value: string | number; clr: string }> = ({ icon, label, value, clr }) => (
  <motion.div
    initial={{ y: 14, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    style={{
      flex: '1 1 120px', minWidth: 120,
      background: CARD_BG, borderRadius: R,
      border: CARD_BORDER, boxShadow: CARD_SHADOW,
      padding: '16px 14px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>{label}</span>
    </div>
    <p style={{ fontSize: 26, fontWeight: 800, color: clr, margin: 0 }}>{value}</p>
  </motion.div>
);

/* ── Per-game card ──────────────────────────────── */
const GameCard: React.FC<{
  icon: string; label: string; color: string;
  sessions: number; attempts: number; accuracy: number; stars: number; lastPlayed: string;
  delay: number;
}> = ({ icon, label, color, sessions, attempts, accuracy, stars, lastPlayed, delay }) => (
  <motion.div
    initial={{ y: 16, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay, type: 'spring', stiffness: 240, damping: 26 }}
    style={{
      background: CARD_BG, borderRadius: R,
      border: CARD_BORDER, boxShadow: CARD_SHADOW,
      padding: '18px 16px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: CLR.primary }}>{label}</p>
        <p style={{ margin: 0, fontSize: 10, color: CLR.muted }}>{sessions > 0 ? `Last played: ${lastPlayed}` : 'Not played yet'}</p>
      </div>
      <div style={{ marginLeft: 'auto', fontSize: 13 }}>{'⭐'.repeat(Math.min(stars, 3))}</div>
    </div>

    <div style={{ display: 'flex', gap: 8 }}>
      {/* Sessions */}
      <div style={{
        flex: 1, borderRadius: 10, padding: '10px 12px',
        background: `${CLR.teal}0d`,
      }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: CLR.muted }}>SESSIONS</p>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: CLR.teal }}>{sessions}</p>
      </div>
      {/* Accuracy */}
      <div style={{
        flex: 1, borderRadius: 10, padding: '10px 12px',
        background: `${CLR.green}0d`,
      }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: CLR.muted }}>ACCURACY</p>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: CLR.green }}>{attempts > 0 ? `${accuracy}%` : '—'}</p>
      </div>
    </div>

    {/* Accuracy bar */}
    {attempts > 0 && (
      <div style={{ marginTop: 10, height: 5, borderRadius: 4, background: 'rgba(20,184,166,0.12)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${accuracy}%` }}
          transition={{ delay: delay + 0.2, duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${CLR.teal}, ${CLR.sky})` }}
        />
      </div>
    )}
  </motion.div>
);

/* ── Page ───────────────────────────────────────── */
export const PuzzleZoneProgressPage: React.FC = () => {
  const { games, totalSessions, overallAccuracy } = useGameProgress();

  const puzzleGames = games.filter(g => PUZZLE_GAMES.includes(g.config.id));
  const totalPlayed  = puzzleGames.reduce((s, g) => s + g.totalSessions, 0);
  const totalAttempts = puzzleGames.reduce((s, g) => s + g.totalAttempts, 0);
  const totalCorrect = puzzleGames.reduce((s, g) => s + g.totalCorrect, 0);
  const avgAccuracy = totalAttempts > 0 ? pctFromRatio(totalCorrect / totalAttempts) : 0;
  const totalStars   = puzzleGames.reduce((s, g) => s + g.stars, 0);

  void totalSessions; void overallAccuracy;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '24px 20px', maxWidth: 1000, margin: '0 auto' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg, #d7f5e8, #b8f0d5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>🧩</div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: CLR.primary }}>Puzzle Zone</h2>
          <p style={{ margin: 0, fontSize: 12, color: CLR.muted }}>Find the Pair · Brain Maze · Logic Puzzle</p>
        </div>
      </div>

      {/* Hero stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Stat icon="🎮" label="TOTAL SESSIONS"  value={totalPlayed}                          clr={CLR.teal}   />
        <Stat icon="🎯" label="AVG ACCURACY"    value={avgAccuracy > 0 ? `${avgAccuracy}%` : '—'} clr={CLR.green}  />
        <Stat icon="⭐" label="TOTAL STARS"     value={totalStars}                           clr={CLR.amber}  />
      </div>

      {/* Per-game cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {PUZZLE_GAMES.map((id, i) => {
          const entry = puzzleGames.find(g => g.config.id === id);
          const meta  = GAME_META[id];
          return (
            <GameCard
              key={id}
              icon={meta.icon}
              label={meta.label}
              color={meta.color}
              sessions={entry?.totalSessions ?? 0}
              attempts={entry?.totalAttempts ?? 0}
              accuracy={entry ? pctFromRatio(entry.overallAccuracy) : 0}
              stars={entry?.stars ?? 0}
              lastPlayed={entry?.lastPlayedAt ? new Date(entry.lastPlayedAt).toLocaleDateString('en', { day: 'numeric', month: 'short' }) : '—'}
              delay={0.1 + i * 0.08}
            />
          );
        })}
      </div>

      {totalPlayed === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ textAlign: 'center', color: CLR.muted, fontSize: 13, marginTop: 32 }}
        >
          No Puzzle Zone activity yet. Solve puzzles to see stats here! 🧩
        </motion.p>
      )}
    </motion.div>
  );
};

export default PuzzleZoneProgressPage;
