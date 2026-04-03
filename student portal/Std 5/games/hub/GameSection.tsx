/**
 * games/hub/GameSection.tsx — Premium Themed Section View
 * ─────────────────────────────────────────────────────────
 * Per-world immersive backgrounds with animated particles,
 * glassmorphism header, premium card grid.
 *
 * Arcade  → Carnival warm glow, floating shapes, coral/peach
 * Maths   → Golden sparkle field, floating numbers, amber/gold
 * English → Storybook clouds, floating letters, mint/sage
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GameCard, type GameCardDef } from '../GameCard';

/* ── CSS keyframe injection (GameSection — runs once) ── */
const GS_SEC_STYLE_ID = 'gs-sec-perf-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(GS_SEC_STYLE_ID)) {
  const _s = document.createElement('style');
  _s.id = GS_SEC_STYLE_ID;
  _s.textContent = `
    @keyframes gss-particle { 0%,100%{opacity:0;transform:translate(0,0)} 25%{opacity:.25;transform:translate(5px,-8px)} 50%{opacity:.18;transform:translate(0,0)} 75%{opacity:.25;transform:translate(-5px,8px)} }
    @keyframes gss-sparkle { 0%,100%{opacity:0;transform:scale(.5)} 25%{opacity:.9;transform:scale(1.2)} 50%{opacity:.4;transform:scale(.8)} 75%{opacity:.9;transform:scale(1.1)} }
    @keyframes gss-icon-bob { 0%,100%{transform:rotate(0)} 50%{transform:rotate(3deg)} }
    @keyframes gss-glow-ring { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.2;transform:scale(1.15)} }
  `;
  document.head.appendChild(_s);
}

export interface GameSectionProps {
  title: string;
  subtitle: string;
  icon: string;
  /** Warm gradient for header accent, e.g. 'linear-gradient(135deg, #FF7F50, #FF6347)' */
  gradient: string;
  cards: GameCardDef[];
  getStars: (game: GameCardDef) => number;
  onSelectGame: (game: GameCardDef) => void;
  onBack: () => void;
}

/* ── Per-world theme config ── */
interface WorldTheme {
  bg: string;
  particles: string[];
  particleColors: string[];
  headerGlow: string;
  accentText: string;
  backBorder: string;
  subtitleColor: string;
}

const WORLD_THEMES: Record<string, WorldTheme> = {
  arcade: {
    bg: 'linear-gradient(170deg, #eff8e8 0%, #dfefd5 32%, #d6e9c6 58%, #cddfb4 82%, #c3d6a4 100%)',
    particles: ['🦊', '🍃', '🌼', '🌿', '🎯', '🪵', '✨', '🌳', '🍂', '🦉'],
    particleColors: ['rgba(88,129,74,0.18)', 'rgba(122,163,68,0.16)', 'rgba(143,184,108,0.14)', 'rgba(108,150,86,0.14)'],
    headerGlow: '0 4px 30px rgba(88,129,74,0.22), 0 2px 10px rgba(88,129,74,0.14)',
    accentText: '#2f5f3d',
    backBorder: 'rgba(88,129,74,0.3)',
    subtitleColor: '#4f7a56',
  },
  maths: {
    bg: 'linear-gradient(170deg, #f4fae6 0%, #e8f3d7 30%, #dcecc4 54%, #d4e4b9 78%, #cbdbad 100%)',
    particles: ['🔢', '➕', '📐', '🌱', '🍀', '🧮', '✨', '🦋', '🍃', '🌿'],
    particleColors: ['rgba(122,163,68,0.18)', 'rgba(143,184,108,0.16)', 'rgba(167,201,127,0.16)', 'rgba(88,129,74,0.12)'],
    headerGlow: '0 4px 30px rgba(122,163,68,0.24), 0 2px 10px rgba(122,163,68,0.16)',
    accentText: '#496f32',
    backBorder: 'rgba(122,163,68,0.35)',
    subtitleColor: '#68884a',
  },
  english: {
    bg: 'linear-gradient(170deg, #edf9ee 0%, #dbf0dd 30%, #cde8d0 56%, #c3e0c6 80%, #b8d7bc 100%)',
    particles: ['📚', '✏️', '🦉', '🪶', '🍀', '🌳', '✨', '🍂', '🦋', '🌿'],
    particleColors: ['rgba(88,129,74,0.18)', 'rgba(108,150,86,0.16)', 'rgba(143,184,108,0.14)', 'rgba(167,201,127,0.12)'],
    headerGlow: '0 4px 30px rgba(88,129,74,0.22), 0 2px 10px rgba(88,129,74,0.14)',
    accentText: '#2f6e45',
    backBorder: 'rgba(88,129,74,0.3)',
    subtitleColor: '#5c8f69',
  },
  science: {
    bg: 'linear-gradient(170deg, #eaf8eb 0%, #d9efdb 30%, #cde7cf 56%, #c2dfc4 80%, #b4d5b7 100%)',
    particles: ['🔬', '🧪', '🌱', '🌍', '🍃', '🧬', '💧', '✨', '🌿', '🦉'],
    particleColors: ['rgba(88,129,74,0.18)', 'rgba(108,150,86,0.16)', 'rgba(143,184,108,0.14)', 'rgba(167,201,127,0.12)'],
    headerGlow: '0 4px 30px rgba(88,129,74,0.22), 0 2px 10px rgba(88,129,74,0.14)',
    accentText: '#2b6f42',
    backBorder: 'rgba(88,129,74,0.3)',
    subtitleColor: '#5f8f69',
  },
};

/* detect section from title */
const detectSection = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('arcade') || t.includes('arena')) return 'arcade';
  if (t.includes('maths') || t.includes('math')) return 'maths';
  if (t.includes('english') || t.includes('kingdom')) return 'english';
  if (t.includes('science') || t.includes('lab')) return 'science';
  return 'arcade';
};

/* ── Floating Particle Layer — CSS only, 8 particles, no orbs ── */
const FloatingParticles: React.FC<{ theme: WorldTheme }> = React.memo(({ theme }) => {
  const particles = useMemo(() =>
    theme.particles.slice(0, 8).map((emoji, i) => ({
      emoji,
      x: `${5 + (i * 11.5) % 90}%`,
      y: `${8 + (i * 13.7) % 80}%`,
      size: 14 + (i % 4) * 4,
      delay: i * 0.4,
      dur: 5 + (i % 3) * 2,
    })), [theme.particles]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute', left: p.x, top: p.y, fontSize: p.size, opacity: 0,
            animation: `gss-particle ${p.dur}s ${p.delay}s ease-in-out infinite`,
            willChange: 'transform, opacity',
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
});
FloatingParticles.displayName = 'FloatingParticles';

/* ── Sparkle dots — CSS only, 8 dots ── */
const SparkleField: React.FC<{ count?: number }> = React.memo(({ count = 8 }) => {
  const dots = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: `${(i * 12.5) % 100}%`,
      y: `${(i * 14.3) % 100}%`,
      size: 2 + (i % 3),
      delay: i * 0.35,
      dur: 3 + (i % 4) * 1.5,
    })), [count]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: d.x, top: d.y,
            width: d.size, height: d.size,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
            animation: `gss-sparkle ${d.dur}s ${d.delay}s ease-in-out infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
});
SparkleField.displayName = 'SparkleField';

/* ════════════════════════════════════════════════════════════ */

const GameSection: React.FC<GameSectionProps> = ({
  title, subtitle, icon, gradient, cards, getStars, onSelectGame, onBack,
}) => {
  const section = detectSection(title);
  const theme = WORLD_THEMES[section] || WORLD_THEMES.arcade;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={S.wrapper}
    >
      {/* Immersive themed background */}
      <div style={{ ...S.bg, background: theme.bg }} />

      {/* Animated particle layers */}
      <FloatingParticles theme={theme} />
      <SparkleField />

      {/* ─── Glassmorphism Header Bar ─── */}
      <div
        style={{ ...S.headerBar, boxShadow: theme.headerGlow }}
      >
        {/* Back button */}
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.12, x: -3 }}
          whileTap={{ scale: 0.92 }}
          style={{ ...S.backBtn, borderColor: theme.backBorder }}
          aria-label="Back to Games Hub"
        >
          ←
        </motion.button>

        {/* Icon badge with CSS glow ring */}
        <div style={{ position: 'relative' }}>
          <div
            style={{ ...S.iconBadge, background: gradient, animation: 'gss-icon-bob 4s ease-in-out infinite' }}
          >
            <span style={{ fontSize: 26 }}>{icon}</span>
          </div>
          {/* Glow ring — CSS */}
          <div
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: 18,
              border: `2px solid ${theme.particleColors[0]}`,
              animation: 'gss-glow-ring 2.5s ease-in-out infinite',
              willChange: 'transform, opacity',
            }}
          />
        </div>

        {/* Title block */}
        <div style={{ flex: 1 }}>
          <h2 style={{ ...S.title, color: theme.accentText }}>{title}</h2>
          <p style={{ ...S.subtitle, color: theme.subtitleColor }}>{subtitle}</p>
        </div>

        {/* Game count badge */}
        <div style={S.countBadge}>
          <span style={{ fontSize: 10, fontWeight: 900, color: theme.accentText }}>{cards.length}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: theme.subtitleColor }}>games</span>
        </div>
      </div>

      {/* ─── Game Cards Grid ─── */}
      <motion.div
        style={S.grid}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {cards.map((game, i) => (
          <GameCard
            key={game.id}
            game={game}
            index={i}
            stars={getStars(game)}
            onClick={() => onSelectGame(game)}
          />
        ))}
      </motion.div>

      {/* Bottom breathing room */}
      <div style={{ height: 48 }} />
    </motion.div>
  );
};

/* ── Styles ────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 1400,
    margin: '0 auto',
    padding: '16px 16px 0',
    minHeight: '100vh',
    overflow: 'hidden',
    borderRadius: 24,
    boxShadow: '0 8px 34px rgba(88,129,74,0.20), 0 2px 12px rgba(88,129,74,0.10)',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    zIndex: -1,
  },
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    padding: '14px 18px',
    borderRadius: 22,
    background: 'rgba(250,255,246,0.82)',
    border: '1.5px solid rgba(153,187,136,0.38)',
    position: 'relative',
    zIndex: 2,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: '2px solid rgba(139,111,94,0.2)',
    background: 'rgba(246,253,240,0.95)',
    cursor: 'pointer',
    fontSize: 20,
    fontWeight: 900,
    color: '#4f7a56',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    flexShrink: 0,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
  title: {
    fontSize: 'clamp(18px, 2.5vw, 26px)',
    fontWeight: 900,
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 'clamp(11px, 1.3vw, 14px)',
    fontWeight: 600,
    margin: 0,
  },
  countBadge: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(240,249,233,0.9)',
    borderRadius: 12,
    padding: '6px 10px',
    border: '1px solid rgba(153,187,136,0.4)',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 18,
    position: 'relative',
    zIndex: 1,
  },
};

export default React.memo(GameSection);
