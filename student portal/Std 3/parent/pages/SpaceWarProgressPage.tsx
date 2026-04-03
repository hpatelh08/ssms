/**
 * parent/pages/SpaceWarProgressPage.tsx
 * ─────────────────────────────────────────────────────
 * Parent-facing Space War progress analytics.
 * Reads child's localStorage progress and displays stats.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/* ── Design Tokens (matches GameProgressPage palette) ── */

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

/* ── Sector info ── */

const SECTORS = [
  { name: 'Nebula Nursery',   range: '1 – 50',   subjects: 'Easy Maths',       color: '#22C55E' },
  { name: 'Asteroid Alley',   range: '51 – 120',  subjects: 'Maths + English',  color: '#3B82F6' },
  { name: 'Comet Corridor',   range: '121 – 200', subjects: 'EVS + Word',   color: '#A855F7' },
  { name: 'Galaxy Core',      range: '201 – 350', subjects: 'Mixed Subjects',   color: '#F59E0B' },
  { name: 'Black Hole Beyond', range: '351+',     subjects: 'Boss Rounds',      color: '#EF4444' },
];

/* ── Load from child localStorage ── */

interface SpaceWarSaved {
  level: number;
  score: number;
  totalCorrect: number;
  totalWrong: number;
}

function loadSpaceWarProgress(): SpaceWarSaved {
  try {
    const raw = localStorage.getItem('space_war_state_v1');
    if (raw) {
      const p = JSON.parse(raw) as SpaceWarSaved;
      if (typeof p.level === 'number') return p;
    }
  } catch { /* ignore */ }
  return { level: 1, score: 0, totalCorrect: 0, totalWrong: 0 };
}

function getCurrentSector(level: number): number {
  if (level <= 50) return 0;
  if (level <= 120) return 1;
  if (level <= 200) return 2;
  if (level <= 350) return 3;
  return 4;
}

/* ── Page ── */

const SpaceWarProgressPage: React.FC = () => {
  const [progress, setProgress] = useState<SpaceWarSaved>({ level: 1, score: 0, totalCorrect: 0, totalWrong: 0 });

  useEffect(() => {
    setProgress(loadSpaceWarProgress());
  }, []);

  const total = progress.totalCorrect + progress.totalWrong;
  const accuracy = total > 0 ? Math.round((progress.totalCorrect / total) * 100) : 0;
  const sectorIdx = getCurrentSector(progress.level);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: CLR.primary, margin: 0 }}>🚀 Space War Progress</h1>
        <p style={{ fontSize: 13, fontWeight: 500, color: CLR.muted, marginTop: 4 }}>
          Your child's quiz battle journey through space
        </p>
      </motion.div>

      {/* Hero Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '🎯', label: 'Current Level', value: progress.level, color: '#A5B4FC', bg: subPanelBackground('linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.04))') },
          { icon: '⭐', label: 'Total Score', value: progress.score.toLocaleString(), color: '#FBBF24', bg: subPanelBackground('linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.04))') },
          { icon: '✅', label: 'Correct Answers', value: progress.totalCorrect, color: '#34D399', bg: subPanelBackground('linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.04))') },
          { icon: '📊', label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? '#34D399' : '#FB7185', bg: subPanelBackground('linear-gradient(135deg, rgba(56,189,248,0.18), rgba(56,189,248,0.04))') },
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

      {/* Sector Progress */}
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: CARD_BG, borderRadius: R,
          border: CARD_BORDER, boxShadow: CARD_SHADOW,
          padding: '20px 18px', marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>🌌</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: CLR.primary }}>Sector Progress</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SECTORS.map((sec, i) => {
            const isActive = i === sectorIdx;
            const isCompleted = i < sectorIdx;
            return (
              <div
                key={sec.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  background: isActive
                    ? subPanelBackground(`linear-gradient(135deg, ${sec.color}20, rgba(15,23,42,0.84))`)
                    : isCompleted
                      ? subPanelBackground(`linear-gradient(135deg, ${CLR.mint}16, rgba(15,23,42,0.84))`)
                      : 'rgba(15,23,42,0.58)',
                  border: isActive
                    ? `1px solid ${sec.color}60`
                    : isCompleted
                      ? `1px solid ${CLR.mint}44`
                      : `1px solid ${PANEL_BORDER}`,
                }}
              >
                <span style={{ fontSize: 20 }}>
                  {isCompleted ? '✅' : isActive ? '🚀' : '🔒'}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: CLR.primary, margin: 0 }}>{sec.name}</p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: CLR.muted, margin: 0, marginTop: 2 }}>
                    Levels {sec.range} · {sec.subjects}
                  </p>
                </div>
                {isActive && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: sec.color,
                    background: `${sec.color}14`, padding: '3px 8px', borderRadius: 8,
                  }}>
                    CURRENT
                  </span>
                )}
                {isCompleted && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: CLR.mint,
                    background: `${CLR.mint}14`, padding: '3px 8px', borderRadius: 8,
                  }}>
                    DONE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Questions Breakdown */}
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          background: CARD_BG, borderRadius: R,
          border: CARD_BORDER, boxShadow: CARD_SHADOW,
          padding: '20px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>📈</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: CLR.primary }}>Answer Breakdown</span>
        </div>

        {total === 0 ? (
          <p style={{ fontSize: 13, color: CLR.muted, textAlign: 'center', padding: '20px 0' }}>
            No questions attempted yet. Encourage your child to play Space War! 🚀
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Mini donut */}
            <svg width={80} height={80} viewBox="0 0 80 80">
              <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(129,140,248,0.1)" strokeWidth={8} />
              <circle
                cx={40} cy={40} r={32} fill="none"
                stroke={CLR.mint} strokeWidth={8}
                strokeDasharray={`${(accuracy / 100) * 201} 201`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
              <text x={40} y={44} textAnchor="middle" fontSize={16} fontWeight={800} fill={CLR.primary}>{accuracy}%</text>
            </svg>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: CLR.mint, margin: 0 }}>
                ✅ Correct: {progress.totalCorrect}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: CLR.rose, margin: '4px 0 0' }}>
                ❌ Wrong: {progress.totalWrong}
              </p>
              <p style={{ fontSize: 11, fontWeight: 500, color: CLR.muted, margin: '4px 0 0' }}>
                Total: {total} questions
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SpaceWarProgressPage;
