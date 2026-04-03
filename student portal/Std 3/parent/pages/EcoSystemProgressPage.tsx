/**
 * parent/pages/EcoSystemProgressPage.tsx
 * ─────────────────────────────────────────────────────
 * Parent-facing Eco System progress analytics.
 * Reads child's localStorage progress and displays stats per world.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/* ── Design Tokens ── */

const CLR = {
  primary: '#E2E8F0',
  secondary: '#CBD5E1',
  muted: '#94A3B8',
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
const R = 18;

/* ── World definitions (mirrors spaceEducationData.ts) ── */

const WORLDS = [
  { id: 'solar',   name: 'Eco System',        icon: '☀️', color: '#fbbf24' },
  { id: 'rockets', name: 'Space Travel',      icon: '🚀', color: '#3b82f6' },
  { id: 'mystery', name: 'Space Mysteries',   icon: '🛸', color: '#a855f7' },
  { id: 'air',     name: 'Air & Sky',         icon: '🌬️', color: '#06b6d4' },
  { id: 'water',   name: 'Water World',       icon: '💧', color: '#0ea5e9' },
  { id: 'nature',  name: 'Green Earth',       icon: '🌱', color: '#22c55e' },
  { id: 'animals', name: 'Animal Planet',     icon: '🐾', color: '#f97316' },
  { id: 'protect', name: 'Save Our Earth',    icon: '♻️', color: '#10b981' },
  { id: 'weather', name: 'Weather & Seasons', icon: '🌤️', color: '#eab308' },
  { id: 'science', name: 'Fun EVS',           icon: '🔬', color: '#8b5cf6' },
];

/* ── Load from child localStorage ── */

interface DailyProgress {
  levelsToday: number;
  lastBatchTimestamp: number;
  totalCompleted: number;
  worldLevels: Record<string, number>;
}

function loadProgress(): DailyProgress {
  try {
    const raw = localStorage.getItem('space_edu_daily_v1');
    if (raw) return JSON.parse(raw) as DailyProgress;
  } catch { /* ignore */ }
  return { levelsToday: 0, lastBatchTimestamp: 0, totalCompleted: 0, worldLevels: {} };
}

/* ── Page ── */

const EcoSystemProgressPage: React.FC = () => {
  const [progress, setProgress] = useState<DailyProgress>({ levelsToday: 0, lastBatchTimestamp: 0, totalCompleted: 0, worldLevels: {} });

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const worldsExplored = Object.keys(progress.worldLevels).length;
  const highestLevel = Math.max(0, ...Object.values(progress.worldLevels));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: CLR.primary, margin: 0 }}>🪐 Eco System</h1>
        <p style={{ fontSize: 13, fontWeight: 500, color: CLR.muted, marginTop: 4 }}>
          Your child's educational journey across 10 themed worlds
        </p>
      </motion.div>

      {/* Hero Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '📚', label: 'Total Levels Done', value: progress.totalCompleted, color: '#A5B4FC', bg: subPanelBackground('linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.04))') },
          { icon: '🌍', label: 'Worlds Explored', value: `${worldsExplored} / 10`, color: '#34D399', bg: subPanelBackground('linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.04))') },
          { icon: '🏆', label: 'Highest Level', value: highestLevel, color: '#FBBF24', bg: subPanelBackground('linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.04))') },
          { icon: '📅', label: 'Today\'s Levels', value: `${progress.levelsToday} / 10`, color: '#38BDF8', bg: subPanelBackground('linear-gradient(135deg, rgba(56,189,248,0.18), rgba(56,189,248,0.04))') },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 28 }}
            style={{
              flex: '1 1 140px', minWidth: 140, background: s.bg,
              borderRadius: R, padding: '18px 16px',
              border: CARD_BORDER, boxShadow: CARD_SHADOW,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: CLR.muted }}>{s.label}</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* World Progress Grid */}
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: CARD_BG, borderRadius: R,
          border: CARD_BORDER, boxShadow: CARD_SHADOW,
          padding: '20px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>🌌</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: CLR.primary }}>World Progress</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {WORLDS.map((w, i) => {
            const level = progress.worldLevels[w.id] || 0;
            const started = level > 0;
            return (
              <motion.div
                key={w.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.03 }}
                style={{
                  padding: '14px 12px', borderRadius: 14,
                  background: started
                    ? subPanelBackground(`linear-gradient(135deg, ${w.color}20, rgba(15,23,42,0.84))`)
                    : 'rgba(15,23,42,0.58)',
                  border: started ? `1px solid ${w.color}5A` : `1px solid ${PANEL_BORDER}`,
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: 28 }}>{w.icon}</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: CLR.primary, margin: '6px 0 2px' }}>{w.name}</p>
                {started ? (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: w.color,
                    background: `${w.color}14`, padding: '2px 8px', borderRadius: 6,
                  }}>
                    Level {level}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>Not started</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {progress.totalCompleted === 0 && (
          <p style={{ fontSize: 13, color: CLR.muted, textAlign: 'center', padding: '16px 0 4px', margin: 0 }}>
            Your child hasn't started Eco System yet. Encourage them to explore! 🪐
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default EcoSystemProgressPage;
