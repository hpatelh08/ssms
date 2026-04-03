import React from 'react';
import { useCelebration } from './useCelebrationController';

/* ── Colour palette for confetti pieces ─────────── */

const COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#34d399',
  '#60a5fa', '#a7c97f', '#f472b6', '#facc15',
];

/* ── Static confetti piece data (generated once) ── */

interface Piece { left: string; color: string; size: number; dur: string; delay: string; }

const CONFETTI: Piece[] = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 4.17) % 100}%`,
  color: COLORS[i % COLORS.length],
  size: 6 + (i % 4) * 2,                        // 6–12 px
  dur: `${1.5 + (i % 5) * 0.25}s`,              // 1.5–2.5 s
  delay: `${(i % 8) * 0.12}s`,                  // staggered start
}));

/* ── Static sparkle data ────────────────────────── */

interface Spark { top: string; left: string; size: number; dur: string; delay: string; }

const SPARKLES: Spark[] = Array.from({ length: 10 }, (_, i) => ({
  top: `${10 + (i * 8) % 80}%`,
  left: `${5 + (i * 11) % 90}%`,
  size: 4 + (i % 3) * 3,                        // 4–10 px
  dur: `${1 + (i % 4) * 0.35}s`,                // 1–2.05 s
  delay: `${(i % 5) * 0.2}s`,
}));

/* ── Sub-components (pure, no state) ────────────── */

const ConfettiPieces: React.FC = React.memo(() => (
  <>
    {CONFETTI.map((p, i) => (
      <div
        key={i}
        className="celeb-confetti"
        style={{
          left: p.left,
          width: p.size,
          height: p.size,
          background: p.color,
          animationDuration: p.dur,
          animationDelay: p.delay,
        }}
      />
    ))}
  </>
));

const SparkleLayer: React.FC = React.memo(() => (
  <>
    {SPARKLES.map((s, i) => (
      <div
        key={i}
        className="celeb-sparkle"
        style={{
          top: s.top,
          left: s.left,
          width: s.size,
          height: s.size,
          animationDuration: s.dur,
          animationDelay: s.delay,
        }}
      />
    ))}
  </>
));

const LevelGlow: React.FC = React.memo(() => (
  <div className="celeb-level-glow" />
));

/* ── Overlay ────────────────────────────────────── */

const CelebrationOverlay: React.FC = () => {
  const { active, type } = useCelebration();

  if (!active) return null;

  return (
    <div className="celeb-overlay" aria-hidden="true">
      <ConfettiPieces />
      <SparkleLayer />
      {type === 'level' && <LevelGlow />}
    </div>
  );
};

export default React.memo(CelebrationOverlay);
