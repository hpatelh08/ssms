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
import type { ChapterDef } from '../subjects/engine/types';

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
  /** If true, render Maths/English games chapter-wise (headings + grouped cards). */
  groupByChapter?: boolean;
  /** Chapter metadata for ordering + headings (required when groupByChapter is true). */
  chapters?: ChapterDef[];
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
    bg: 'linear-gradient(170deg, #FFF0E6 0%, #FFE0CC 30%, #FFDAB9 55%, #FFD1A8 80%, #FFC69E 100%)',
    particles: ['🎪', '🎯', '🎨', '🧩', '🎲', '🎈', '🎵', '🌟', '✨', '🎀'],
    particleColors: ['rgba(255,127,80,0.15)', 'rgba(255,99,71,0.12)', 'rgba(255,183,77,0.14)', 'rgba(255,160,122,0.12)'],
    headerGlow: '0 4px 30px rgba(255,127,80,0.25), 0 2px 10px rgba(255,99,71,0.15)',
    accentText: '#C94B1A',
    backBorder: 'rgba(201,75,26,0.2)',
    subtitleColor: '#D4764E',
  },
  maths: {
    bg: 'linear-gradient(170deg, #FFFBEB 0%, #FFF3C4 30%, #FFEAA7 55%, #FFE082 80%, #FFD54F 100%)',
    particles: ['🔢', '➕', '⭐', '🔷', '📐', '🧮', '💫', '✨', '🌟', '🔶'],
    particleColors: ['rgba(255,209,102,0.18)', 'rgba(255,179,71,0.14)', 'rgba(255,224,130,0.16)', 'rgba(255,193,7,0.12)'],
    headerGlow: '0 4px 30px rgba(255,209,102,0.3), 0 2px 10px rgba(255,179,71,0.2)',
    accentText: '#B8860B',
    backBorder: 'rgba(184,134,11,0.2)',
    subtitleColor: '#C69C30',
  },
  english: {
    bg: 'linear-gradient(170deg, #F0FFF4 0%, #D4F5E0 30%, #B2EBC8 55%, #A8E6CF 80%, #8FD5B4 100%)',
    particles: ['📖', '✏️', 'A', 'B', '🌿', '📚', '🦋', '✨', '🌸', '🍃'],
    particleColors: ['rgba(168,230,207,0.18)', 'rgba(114,216,160,0.14)', 'rgba(143,213,180,0.16)', 'rgba(178,235,200,0.14)'],
    headerGlow: '0 4px 30px rgba(114,216,160,0.25), 0 2px 10px rgba(168,230,207,0.2)',
    accentText: '#2D7A50',
    backBorder: 'rgba(45,122,80,0.2)',
    subtitleColor: '#4A9E6F',
  },
};

/* detect section from title */
const detectSection = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('arcade') || t.includes('arena')) return 'arcade';
  if (t.includes('maths') || t.includes('math')) return 'maths';
  if (t.includes('english') || t.includes('kingdom')) return 'english';
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
  title, subtitle, icon, gradient, cards, groupByChapter, chapters, getStars, onSelectGame, onBack,
}) => {
  const section = detectSection(title);
  const theme = WORLD_THEMES[section] || WORLD_THEMES.arcade;

  const grouped = useMemo(() => {
    if (!groupByChapter || !chapters?.length) return null;

    const chapterCards = new Map<string, GameCardDef[]>();
    for (const c of cards) {
      const key = c.chapter;
      if (!chapterCards.has(key)) chapterCards.set(key, []);
      chapterCards.get(key)!.push(c);
    }

    const ordered = chapters
      .map(ch => ({ chapter: ch, cards: chapterCards.get(ch.id) ?? [] }))
      .filter(x => x.cards.length > 0);

    const knownChapterIds = new Set(chapters.map(c => c.id));
    const leftovers = cards.filter(c => !knownChapterIds.has(c.chapter));

    return { ordered, leftovers };
  }, [cards, chapters, groupByChapter]);

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
        {grouped ? (() => {
          let runningIndex = 0;
          const elements: React.ReactNode[] = [];

          for (const { cards: list } of grouped.ordered) {
            for (const game of list) {
              const idx = runningIndex++;
              elements.push(
                <GameCard
                  key={game.id}
                  game={game}
                  index={idx}
                  stars={getStars(game)}
                  onClick={() => onSelectGame(game)}
                />,
              );
            }
          }

          if (grouped.leftovers.length) {
            for (const game of grouped.leftovers) {
              const idx = runningIndex++;
              elements.push(
                <GameCard
                  key={game.id}
                  game={game}
                  index={idx}
                  stars={getStars(game)}
                  onClick={() => onSelectGame(game)}
                />,
              );
            }
          }

          return elements;
        })() : cards.map((game, i) => (
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
    background: 'rgba(255,255,255,0.75)',
    border: '1.5px solid rgba(255,255,255,0.5)',
    position: 'relative',
    zIndex: 2,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: '2px solid rgba(139,111,94,0.2)',
    background: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    fontSize: 20,
    fontWeight: 900,
    color: '#8B6F5E',
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
    background: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    padding: '6px 10px',
    border: '1px solid rgba(255,255,255,0.4)',
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
