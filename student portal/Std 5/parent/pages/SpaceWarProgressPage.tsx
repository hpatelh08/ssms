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
  primary: '#3B3FAF',
  secondary: '#6B6FCF',
  muted: '#8F94D4',
  mint: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  indigo: '#3F8F3A',
  sky: '#38BDF8',
};

const CARD_BG = 'rgba(255,255,255,0.72)';
const CARD_BORDER = '1px solid rgba(127,174,101,0.12)';
const CARD_SHADOW = '0 2px 16px rgba(92,106,196,0.06)';
const R = 18;

/* ── Sector info ── */

const SECTORS = [
  { name: 'Nebula Nursery',   range: '1 – 50',   subjects: 'Easy Maths',       color: '#22C55E' },
  { name: 'Asteroid Alley',   range: '51 – 120',  subjects: 'Maths + English',  color: '#3B82F6' },
  { name: 'Comet Corridor',   range: '121 – 200', subjects: 'Science + Word',   color: '#7AA344' },
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
    <div style={{ maxWidth: 1450, margin: '0 auto', paddingBottom: 40 }}>
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
          { icon: '🎯', label: 'Current Level', value: progress.level, color: CLR.indigo, bg: 'linear-gradient(135deg, rgba(63,143,58,0.08), rgba(127,174,101,0.04))' },
          { icon: '⭐', label: 'Total Score', value: progress.score.toLocaleString(), color: CLR.amber, bg: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.04))' },
          { icon: '✅', label: 'Correct Answers', value: progress.totalCorrect, color: CLR.mint, bg: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.04))' },
          { icon: '📊', label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? CLR.mint : CLR.rose, bg: 'linear-gradient(135deg, rgba(63,143,58,0.08), rgba(56,189,248,0.04))' },
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
                  background: isActive ? `${sec.color}12` : isCompleted ? `${CLR.mint}08` : 'rgba(0,0,0,0.02)',
                  border: isActive ? `2px solid ${sec.color}40` : '2px solid transparent',
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
              <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(127,174,101,0.1)" strokeWidth={8} />
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
