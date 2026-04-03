/**
 * parent/pages/BrainBoostProgressPage.tsx
 * ─────────────────────────────────────────────────────
 * Parent-facing Brain Boost analytics.
 * Shows stats for the 3 Brain Boost games:
 *   missingNumber · memoryCards · hiddenObject
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useGameProgress } from '../analytics/useGameProgress';

/* ── Design Tokens ─────────────────────────────── */
const CLR = {
  primary:  '#3B3FAF',
  muted:    '#8F94D4',
  indigo:   '#3F8F3A',
  sky:      '#38BDF8',
  mint:     '#10B981',
  amber:    '#F59E0B',
  rose:     '#F43F5E',
};
const CARD_BG     = 'rgba(255,255,255,0.72)';
const CARD_BORDER = '1px solid rgba(127,174,101,0.12)';
const CARD_SHADOW = '0 2px 16px rgba(92,106,196,0.06)';
const R = 18;

const BRAIN_GAMES = ['missingNumber', 'memoryCards', 'hiddenObject'];
const pctFromRatio = (ratio: number): number => Math.round(Math.max(0, Math.min(1, ratio)) * 100);

const GAME_META: Record<string, { icon: string; label: string; color: string }> = {
  missingNumber: { icon: '🔢', label: 'Missing Number',  color: CLR.indigo },
  memoryCards:   { icon: '🃏', label: 'Memory Cards',    color: '#ec4899'  },
  hiddenObject:  { icon: '🔎', label: 'Hidden Object',   color: CLR.amber  },
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
        background: `${CLR.indigo}0d`,
      }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: CLR.muted }}>SESSIONS</p>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: CLR.indigo }}>{sessions}</p>
      </div>
      {/* Accuracy */}
      <div style={{
        flex: 1, borderRadius: 10, padding: '10px 12px',
        background: `${CLR.mint}0d`,
      }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: CLR.muted }}>ACCURACY</p>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: CLR.mint }}>{attempts > 0 ? `${accuracy}%` : '—'}</p>
      </div>
    </div>

    {/* Accuracy bar */}
    {attempts > 0 && (
      <div style={{ marginTop: 10, height: 5, borderRadius: 4, background: 'rgba(127,174,101,0.12)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${accuracy}%` }}
          transition={{ delay: delay + 0.2, duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${CLR.indigo}, ${CLR.sky})` }}
        />
      </div>
    )}
  </motion.div>
);

/* ── Page ───────────────────────────────────────── */
export const BrainBoostProgressPage: React.FC = () => {
  const { games, totalSessions, overallAccuracy } = useGameProgress();

  const brainGames = games.filter(g => BRAIN_GAMES.includes(g.config.id));
  const totalPlayed   = brainGames.reduce((s, g) => s + g.totalSessions, 0);
  const totalAttempts = brainGames.reduce((s, g) => s + g.totalAttempts, 0);
  const totalCorrect = brainGames.reduce((s, g) => s + g.totalCorrect, 0);
  const avgAccuracy = totalAttempts > 0 ? pctFromRatio(totalCorrect / totalAttempts) : 0;
  const totalStars    = brainGames.reduce((s, g) => s + g.stars, 0);

  void totalSessions; void overallAccuracy; // used in outer context

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
          background: 'linear-gradient(135deg, #e0d7ff, #c7baff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>🧠</div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: CLR.primary }}>Brain Boost</h2>
          <p style={{ margin: 0, fontSize: 12, color: CLR.muted }}>Pattern Match · Memory · Logic</p>
        </div>
      </div>

      {/* Hero stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Stat icon="🎮" label="TOTAL SESSIONS"  value={totalPlayed}                clr={CLR.indigo} />
        <Stat icon="🎯" label="AVG ACCURACY"    value={avgAccuracy > 0 ? `${avgAccuracy}%` : '—'} clr={CLR.mint} />
        <Stat icon="⭐" label="TOTAL STARS"     value={totalStars}                 clr={CLR.amber} />
      </div>

      {/* Per-game cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {BRAIN_GAMES.map((id, i) => {
          const entry = brainGames.find(g => g.config.id === id);
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
          No Brain Boost activity yet. Play games to see stats here! 🧠
        </motion.p>
      )}
    </motion.div>
  );
};

export default BrainBoostProgressPage;
