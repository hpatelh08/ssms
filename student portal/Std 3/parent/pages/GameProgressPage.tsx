/**
 * parent/pages/GameProgressPage.tsx
 * ─────────────────────────────────────────────────────
 * Parent-facing game progress analytics page.
 *
 * Shows:
 *  1. Summary hero cards — total games played, accuracy, sessions, best streak
 *  2. Weekly activity chart (last 7 days bar chart)
 *  3. Per-game cards with difficulty breakdown, accuracy, stars, history
 *
 * Matches ProgressPage glass/pastel design language.
 * No black text — deep indigo / slate / purple palette.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameProgress, type GameAnalyticsEntry, type SubjectSummary } from '../analytics/useGameProgress';
import { useParentAnalytics } from '../analytics/useParentAnalytics';

/* ── Design Tokens ──────────────────────────────── */

const CLR = {
  primary: '#E2E8F0',
  secondary: '#CBD5E1',
  muted: '#94A3B8',
  label: '#93A5CF',
  mint: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  indigo: '#6366F1',
  sky: '#38BDF8',
};

const PANEL_BASE = 'linear-gradient(180deg, rgba(7,12,28,0.9) 0%, rgba(15,23,42,0.8) 100%)';
const SUBPANEL_BASE = 'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(30,41,59,0.74) 100%)';
const PANEL_BORDER = 'rgba(148,163,184,0.16)';
const PANEL_SHADOW = '0 18px 48px rgba(2,6,23,0.26)';
const panelBackground = (overlay?: string) => (overlay ? `${overlay}, ${PANEL_BASE}` : PANEL_BASE);
const subPanelBackground = (overlay?: string) => (overlay ? `${overlay}, ${SUBPANEL_BASE}` : SUBPANEL_BASE);

const CARD_BG = panelBackground();
const CARD_BORDER = `1px solid ${PANEL_BORDER}`;
const CARD_SHADOW = PANEL_SHADOW;
const CARD_RADIUS = 18;

/* ── Hero Stat Card ─────────────────────────────── */

const HeroCard: React.FC<{ icon: string; label: string; value: string | number; color: string; gradient: string }> = ({ icon, label, value, color, gradient }) => (
  <motion.div
    initial={{ y: 18, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    style={{
      flex: '1 1 140px', minWidth: 140,
      background: gradient,
      borderRadius: CARD_RADIUS, padding: '18px 16px',
      border: CARD_BORDER, boxShadow: CARD_SHADOW,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: CLR.muted }}>{label}</span>
    </div>
    <p style={{ fontSize: 28, fontWeight: 800, color, margin: 0, lineHeight: '32px' }}>{value}</p>
  </motion.div>
);

/* ── Weekly Bar Chart ───────────────────────────── */

const WeeklyChart: React.FC<{ data: { date: string; sessions: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.sessions), 1);
  return (
    <motion.div
      initial={{ y: 18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      style={{
        background: CARD_BG, borderRadius: CARD_RADIUS,
        border: CARD_BORDER, boxShadow: CARD_SHADOW,
        padding: '20px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>📊</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: CLR.primary }}>Weekly Activity</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
        {data.map((d, i) => {
          const barH = max > 0 ? (d.sessions / max) * 80 : 0;
          const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
          return (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: CLR.indigo }}>{d.sessions || ''}</span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: barH || 4 }}
                transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                style={{
                  width: '100%', maxWidth: 32, borderRadius: 6,
                  background: d.sessions > 0
                    ? `linear-gradient(180deg, ${CLR.indigo}, ${CLR.sky})`
                    : 'rgba(129,140,248,0.1)',
                }}
              />
              <span style={{ fontSize: 9, fontWeight: 600, color: CLR.muted }}>{dayLabel}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

/* ── Difficulty Badge ───────────────────────────── */

const DiffBadge: React.FC<{
  label: string;
  accuracy: number;
  attempts: number;
  bestStreak: number;
  sessions: number;
  unlocked: boolean;
  color: string;
}> = ({ label, accuracy, attempts, bestStreak, sessions, unlocked, color }) => (
  <div style={{
    flex: '1 1 0', minWidth: 0,
    padding: '10px 8px', borderRadius: 12,
    background: unlocked
      ? subPanelBackground(`linear-gradient(135deg, ${color}1A, rgba(15,23,42,0.84))`)
      : 'rgba(15,23,42,0.6)',
    border: `1px solid ${unlocked ? `${color}55` : PANEL_BORDER}`,
    opacity: unlocked ? 1 : 0.5,
    textAlign: 'center',
  }}>
    <p style={{ fontSize: 10, fontWeight: 700, color: unlocked ? color : CLR.muted, margin: 0, marginBottom: 4 }}>
      {label}
    </p>
    {attempts > 0 ? (
      <>
        <p style={{ fontSize: 18, fontWeight: 800, color: unlocked ? CLR.primary : CLR.muted, margin: 0 }}>
          {Math.round(accuracy * 100)}%
        </p>
        <p style={{ fontSize: 9, color: CLR.muted, margin: '2px 0 0' }}>
          {sessions} sessions · 🔥 {bestStreak}
        </p>
      </>
    ) : (
      <p style={{ fontSize: 11, color: CLR.muted, margin: 0 }}>
        {unlocked ? 'Not played' : '🔒 Locked'}
      </p>
    )}
  </div>
);

/* ── Game Card ──────────────────────────────────── */

const GameCard: React.FC<{ entry: GameAnalyticsEntry; index: number }> = ({ entry, index }) => {
  const [expanded, setExpanded] = useState(false);
  const { config, stars, totalSessions, overallAccuracy, bestStreak, lastPlayedAt, difficulties, unlockedDifficulties } = entry;
  const hasPlayed = totalSessions > 0;

  const lastDate = lastPlayedAt
    ? new Date(lastPlayedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    : 'Never';

  const diffColors = { easy: CLR.mint, intermediate: CLR.amber, difficult: CLR.rose };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.05 * index, type: 'spring', stiffness: 200, damping: 24 }}
      style={{
        background: CARD_BG, borderRadius: CARD_RADIUS,
        border: CARD_BORDER, boxShadow: CARD_SHADOW,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Game icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: `linear-gradient(135deg, ${config.gradient.replace('from-', '').split(' ')[0]}, rgba(129,140,248,0.1))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          flexShrink: 0,
        }}>
          {config.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: CLR.primary }}>{config.title}</span>
            {stars > 0 && <span style={{ fontSize: 11, color: CLR.amber }}>{'⭐'.repeat(Math.min(stars, 3))}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            {hasPlayed ? (
              <>
                <span style={{ fontSize: 11, fontWeight: 600, color: overallAccuracy >= 0.8 ? CLR.mint : overallAccuracy >= 0.5 ? CLR.amber : CLR.rose }}>
                  {Math.round(overallAccuracy * 100)}% accuracy
                </span>
                <span style={{ fontSize: 10, color: CLR.muted }}>·</span>
                <span style={{ fontSize: 10, color: CLR.muted }}>{totalSessions} sessions</span>
                <span style={{ fontSize: 10, color: CLR.muted }}>·</span>
                <span style={{ fontSize: 10, color: CLR.muted }}>Last: {lastDate}</span>
              </>
            ) : (
              <span style={{ fontSize: 11, color: CLR.muted }}>Not played yet</span>
            )}
          </div>
        </div>

        {/* Expand arrow */}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          style={{ fontSize: 14, color: CLR.muted }}
        >
          ▼
        </motion.span>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(129,140,248,0.08)' }}>
              {/* Difficulty breakdown */}
              <p style={{ fontSize: 11, fontWeight: 700, color: CLR.secondary, margin: '12px 0 8px' }}>
                Difficulty Breakdown
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['easy', 'intermediate', 'difficult'] as const).map(d => (
                  <DiffBadge
                    key={d}
                    label={d.charAt(0).toUpperCase() + d.slice(1)}
                    accuracy={difficulties[d].accuracy}
                    attempts={difficulties[d].totalAttempts}
                    bestStreak={difficulties[d].bestStreak}
                    sessions={difficulties[d].sessionsPlayed}
                    unlocked={unlockedDifficulties.includes(d)}
                    color={diffColors[d]}
                  />
                ))}
              </div>

              {/* Stats row */}
              {hasPlayed && (
                <div style={{
                  display: 'flex', gap: 12, marginTop: 12,
                  padding: '10px 12px', borderRadius: 12,
                  background: 'rgba(129,140,248,0.04)',
                }}>
                  <StatPill icon="🎯" label="Attempts" value={entry.totalAttempts} />
                  <StatPill icon="✅" label="Correct" value={entry.totalCorrect} />
                  <StatPill icon="🔥" label="Best Streak" value={bestStreak} />
                </div>
              )}

              {/* History mini-chart */}
              {entry.history.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, margin: '0 0 6px' }}>Play History</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {entry.history.slice(-14).map(h => (
                      <div
                        key={h.date}
                        title={`${h.date}: ${h.sessions} sessions`}
                        style={{
                          width: 18, height: 18, borderRadius: 4,
                          background: h.sessions >= 3 ? CLR.indigo
                            : h.sessions >= 2 ? `${CLR.indigo}88`
                            : h.sessions >= 1 ? `${CLR.indigo}44`
                            : 'rgba(129,140,248,0.08)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Stat Pill ──────────────────────────────────── */

const StatPill: React.FC<{ icon: string; label: string; value: number }> = ({ icon, label, value }) => (
  <div style={{ flex: 1, textAlign: 'center' }}>
    <span style={{ fontSize: 14 }}>{icon}</span>
    <p style={{ fontSize: 16, fontWeight: 800, color: CLR.primary, margin: '2px 0 0' }}>{value}</p>
    <p style={{ fontSize: 9, color: CLR.muted, margin: 0 }}>{label}</p>
  </div>
);

/* ── Category Section (expand/collapse) ─────────── */

interface CategoryDef {
  key: string;
  icon: string;
  label: string;
  gradient: string;
  border: string;
  games: GameAnalyticsEntry[];
  summary?: SubjectSummary;
}

const SECTION_ORDER: { key: string; icon: string; label: string; gradient: string; border: string }[] = [
  {
    key: 'english',
    icon: '📚',
    label: 'English',
    gradient: subPanelBackground('linear-gradient(135deg, rgba(129,140,248,0.2) 0%, rgba(168,85,247,0.08) 100%)'),
    border: '1px solid rgba(129,140,248,0.24)',
  },
  {
    key: 'maths',
    icon: '🔢',
    label: 'Maths',
    gradient: subPanelBackground('linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(59,130,246,0.08) 100%)'),
    border: '1px solid rgba(56,189,248,0.24)',
  },
  {
    key: 'science',
    icon: '🔬',
    label: 'EVS',
    gradient: subPanelBackground('linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(34,197,94,0.08) 100%)'),
    border: '1px solid rgba(16,185,129,0.24)',
  },
  {
    key: 'arcade',
    icon: '🕹️',
    label: 'Activity Games',
    gradient: subPanelBackground('linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(251,146,60,0.08) 100%)'),
    border: '1px solid rgba(245,158,11,0.24)',
  },
];

interface JourneySection {
  key: string;
  icon: string;
  label: string;
  gradient: string;
  progress: number;
  playedGames: number;
  totalGames: number;
  sessions: number;
  accuracy: number;
}

const JourneyOverview: React.FC<{
  studentName: string;
  sections: JourneySection[];
}> = ({ studentName, sections }) => (
  <motion.div
    initial={{ y: 18, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.12 }}
    style={{
      background: CARD_BG,
      borderRadius: CARD_RADIUS,
      border: CARD_BORDER,
      boxShadow: CARD_SHADOW,
      padding: '20px 18px',
      marginBottom: 20,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <span style={{ fontSize: 18 }}>🗺️</span>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: CLR.primary, margin: 0 }}>Our Journey</h2>
        <p style={{ fontSize: 11, color: CLR.muted, margin: '2px 0 0' }}>
          Section-wise game progress connected to what {studentName} has actually played
        </p>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
      {sections.map((section, index) => (
        <motion.div
          key={section.key}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 + index * 0.06 }}
          style={{
            background: section.gradient,
            borderRadius: 16,
            border: CARD_BORDER,
            padding: '14px 14px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{section.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: CLR.primary }}>{section.label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: CLR.indigo }}>{section.progress}%</span>
          </div>

          <div style={{ height: 8, borderRadius: 999, background: 'rgba(129,140,248,0.12)', overflow: 'hidden', marginBottom: 10 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(section.progress, section.playedGames > 0 ? 6 : 0)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + index * 0.06 }}
              style={{
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #6366F1, #38BDF8)',
              }}
            />
          </div>

          <p style={{ fontSize: 11, fontWeight: 600, color: CLR.secondary, margin: 0 }}>
            {studentName} played {section.playedGames}/{section.totalGames} games
          </p>
          <p style={{ fontSize: 10, color: CLR.muted, margin: '4px 0 0' }}>
            {section.sessions} sessions {section.accuracy > 0 ? `· ${Math.round(section.accuracy * 100)}% accuracy` : '· Waiting for first play'}
          </p>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const GameCategories: React.FC<{ data: ReturnType<typeof useGameProgress> }> = ({ data }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const categories: CategoryDef[] = SECTION_ORDER.map(s => ({
    ...s,
    games: data.games.filter(g => g.section === s.key),
    summary: data.subjects.find(sub => sub.subject === s.key),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {categories.map(cat => {
        const isOpen = !!open[cat.key];
        const played = cat.games.filter(g => g.totalSessions > 0).length;
        return (
          <div key={cat.key}>
            {/* Header — clickable */}
            <motion.div
              onClick={() => toggle(cat.key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: cat.gradient, borderRadius: CARD_RADIUS,
                border: cat.border, boxShadow: CARD_SHADOW,
                padding: '14px 18px', cursor: 'pointer', userSelect: 'none',
              }}
              whileTap={{ scale: 0.985 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{cat.icon}</span>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: CLR.primary }}>{cat.label}</span>
                  <span style={{ fontSize: 11, color: CLR.muted, marginLeft: 8 }}>
                    {played}/{cat.games.length} played
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {cat.summary && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: CLR.indigo }}>
                    {Math.round(cat.summary.avgAccuracy * 100)}%
                  </span>
                )}
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontSize: 16, color: CLR.muted }}
                >
                  ▼
                </motion.span>
              </div>
            </motion.div>

            {/* Expandable game list */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10 }}>
                    {cat.games.map((entry, i) => (
                      <GameCard key={entry.config.id} entry={entry} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export const GameProgressPage: React.FC = () => {
  const data = useGameProgress();
  const analytics = useParentAnalytics();

  const bestGame = data.games.find(g => g.config.id === data.bestGameId);
  const weakGame = data.games.find(g => g.config.id === data.weakestGameId);
  const journeySections = useMemo<JourneySection[]>(() => (
    SECTION_ORDER.map(section => {
      const games = data.games.filter(game => game.section === section.key);
      const summary = data.subjects.find(subject => subject.subject === section.key);
      const playedGames = games.filter(game => game.totalSessions > 0 || game.stars > 0).length;
      const sessions = games.reduce((sum, game) => sum + game.totalSessions, 0);
      const attempts = games.reduce((sum, game) => sum + game.totalAttempts, 0);
      const correct = games.reduce((sum, game) => sum + game.totalCorrect, 0);
      const accuracy = attempts > 0 ? correct / attempts : 0;
      const chapterProgress = summary
        ? Math.round((summary.completedChapters / Math.max(summary.totalChapters, 1)) * 100)
        : 0;
      const gamesProgress = Math.round((playedGames / Math.max(games.length, 1)) * 100);
      const progress = Math.max(chapterProgress, gamesProgress);

      return {
        key: section.key,
        icon: section.icon,
        label: section.label,
        gradient: section.gradient,
        progress,
        playedGames,
        totalGames: games.length,
        sessions,
        accuracy,
      };
    })
  ), [data.games, data.subjects]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Page header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ marginBottom: 24 }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: CLR.primary, margin: 0 }}>
          🎮 Game Progress
        </h1>
        <p style={{ fontSize: 13, color: CLR.muted, marginTop: 4 }}>
          Track your child's game performance, accuracy, and learning progression
        </p>
      </motion.div>

      {/* Hero cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <HeroCard
          icon="🎮"
          label="Games Played"
          value={`${data.totalGamesPlayed} / ${data.totalGamesAvailable}`}
          color="#A5B4FC"
          gradient={subPanelBackground('linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(236,72,153,0.08) 100%)')}
        />
        <HeroCard
          icon="🎯"
          label="Overall Accuracy"
          value={data.totalAttempts > 0 ? `${Math.round(data.overallAccuracy * 100)}%` : '—'}
          color={data.overallAccuracy >= 0.7 ? '#34D399' : '#FBBF24'}
          gradient={subPanelBackground('linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(52,211,153,0.08) 100%)')}
        />
        <HeroCard
          icon="📝"
          label="Total Sessions"
          value={data.totalSessions}
          color="#38BDF8"
          gradient={subPanelBackground('linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(99,102,241,0.08) 100%)')}
        />
        <HeroCard
          icon="✅"
          label="Questions Solved"
          value={data.totalAttempts}
          color="#FBBF24"
          gradient={subPanelBackground('linear-gradient(135deg, rgba(251,146,60,0.2) 0%, rgba(244,114,182,0.08) 100%)')}
        />
      </div>

      {/* Strongest / Weakest insight */}
      {(bestGame || weakGame) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {bestGame && bestGame.totalSessions > 0 && (
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              style={{
                flex: '1 1 200px', padding: '14px 16px', borderRadius: CARD_RADIUS,
                background: subPanelBackground('linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.06))'),
                border: '1px solid rgba(16,185,129,0.24)',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: CLR.mint }}>💪 Strongest Game</span>
              <p style={{ fontSize: 15, fontWeight: 800, color: CLR.primary, margin: '4px 0 0' }}>
                {bestGame.config.icon} {bestGame.config.title}
              </p>
              <p style={{ fontSize: 11, color: CLR.muted, margin: '2px 0 0' }}>
                {Math.round(bestGame.overallAccuracy * 100)}% accuracy · {bestGame.totalSessions} sessions
              </p>
            </motion.div>
          )}
          {weakGame && weakGame.totalSessions > 0 && weakGame.config.id !== bestGame?.config.id && (
            <motion.div
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              style={{
                flex: '1 1 200px', padding: '14px 16px', borderRadius: CARD_RADIUS,
                background: subPanelBackground('linear-gradient(135deg, rgba(251,146,60,0.2), rgba(244,114,182,0.06))'),
                border: '1px solid rgba(251,146,60,0.24)',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: CLR.amber }}>📌 Needs Practice</span>
              <p style={{ fontSize: 15, fontWeight: 800, color: CLR.primary, margin: '4px 0 0' }}>
                {weakGame.config.icon} {weakGame.config.title}
              </p>
              <p style={{ fontSize: 11, color: CLR.muted, margin: '2px 0 0' }}>
                {Math.round(weakGame.overallAccuracy * 100)}% accuracy · {weakGame.totalSessions} sessions
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Weekly chart */}
      <div style={{ marginBottom: 20 }}>
        <WeeklyChart data={data.weeklyActivity} />
      </div>

      <JourneyOverview studentName={analytics.studentName} sections={journeySections} />

      {/* ── Collapsible Game Categories ── */}
      <GameCategories data={data} />
    </div>
  );
};
