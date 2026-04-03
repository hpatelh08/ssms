/**
 * games/hub/GameSection.tsx - Water-themed section view
 * ----------------------------------------------------
 * Keeps the same game grid behavior while shifting the
 * section atmosphere to cool glass, bubbles, and reef tones.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GameCard, type GameCardDef } from '../GameCard';

const GS_SEC_STYLE_ID = 'gs-water-section-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(GS_SEC_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = GS_SEC_STYLE_ID;
  style.textContent = `
    @keyframes gss-particle {
      0%, 100% { opacity: 0; transform: translate(0, 0); }
      25% { opacity: 0.28; transform: translate(5px, -8px); }
      50% { opacity: 0.18; transform: translate(0, 0); }
      75% { opacity: 0.28; transform: translate(-5px, 8px); }
    }
    @keyframes gss-sparkle {
      0%, 100% { opacity: 0; transform: scale(0.5); }
      25% { opacity: 0.9; transform: scale(1.2); }
      50% { opacity: 0.4; transform: scale(0.8); }
      75% { opacity: 0.9; transform: scale(1.1); }
    }
    @keyframes gss-icon-bob {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(3deg); }
    }
    @keyframes gss-glow-ring {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 0.2; transform: scale(1.15); }
    }
  `;
  document.head.appendChild(style);
}

export interface GameSectionProps {
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  cards: GameCardDef[];
  getStars: (game: GameCardDef) => number;
  onSelectGame: (game: GameCardDef) => void;
  onBack: () => void;
}

interface WorldTheme {
  bg: string;
  particles: string[];
  particleColors: string[];
  headerGlow: string;
  accentText: string;
  backBorder: string;
  subtitleColor: string;
  panelBg: string;
  panelBorder: string;
  countBg: string;
}

const WORLD_THEMES: Record<string, WorldTheme> = {
  arcade: {
    bg: 'linear-gradient(180deg, #f2fdff 0%, #dff6ff 30%, #caefff 64%, #dff9f1 100%)',
    particles: ['🫧', '🎮', '🌊', '🐠', '⭐', '🪸', '🎯', '🐚', '🐬', '🫧'],
    particleColors: [
      'rgba(95, 190, 223, 0.2)',
      'rgba(36, 136, 186, 0.16)',
      'rgba(132, 224, 238, 0.18)',
      'rgba(199, 247, 255, 0.14)',
    ],
    headerGlow: '0 18px 46px rgba(63, 149, 180, 0.18), 0 4px 18px rgba(63, 149, 180, 0.1)',
    accentText: '#0f6c91',
    backBorder: 'rgba(15, 108, 145, 0.16)',
    subtitleColor: '#4a8da7',
    panelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(228,247,255,0.72) 100%)',
    panelBorder: 'rgba(255,255,255,0.74)',
    countBg: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(216,244,255,0.66) 100%)',
  },
  maths: {
    bg: 'linear-gradient(180deg, #f2fffe 0%, #dffaf7 28%, #caf3ef 62%, #fff9df 100%)',
    particles: ['🫧', '🔢', '📐', '🌊', '🐙', '⭐', '➕', '🐚', '🐠', '🫧'],
    particleColors: [
      'rgba(80, 201, 190, 0.2)',
      'rgba(25, 150, 154, 0.16)',
      'rgba(157, 244, 226, 0.18)',
      'rgba(255, 244, 210, 0.14)',
    ],
    headerGlow: '0 18px 46px rgba(36, 163, 159, 0.16), 0 4px 18px rgba(36, 163, 159, 0.08)',
    accentText: '#0c7e80',
    backBorder: 'rgba(12, 126, 128, 0.16)',
    subtitleColor: '#4f9b98',
    panelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(231,252,249,0.72) 100%)',
    panelBorder: 'rgba(255,255,255,0.74)',
    countBg: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(222,250,245,0.66) 100%)',
  },
  english: {
    bg: 'linear-gradient(180deg, #f4fffb 0%, #e1fbf3 30%, #cef4e5 64%, #f6ffec 100%)',
    particles: ['🫧', '📚', '✏️', '🌊', '🐬', '⭐', 'A', '🐚', 'B', '🫧'],
    particleColors: [
      'rgba(84, 199, 163, 0.18)',
      'rgba(25, 143, 122, 0.14)',
      'rgba(196, 247, 226, 0.18)',
      'rgba(246, 255, 236, 0.14)',
    ],
    headerGlow: '0 18px 46px rgba(43, 161, 138, 0.16), 0 4px 18px rgba(43, 161, 138, 0.08)',
    accentText: '#15786a',
    backBorder: 'rgba(21, 120, 106, 0.16)',
    subtitleColor: '#4c9a8d',
    panelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(234,252,245,0.72) 100%)',
    panelBorder: 'rgba(255,255,255,0.74)',
    countBg: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(226,250,241,0.66) 100%)',
  },
};

const detectSection = (title: string): string => {
  const normalized = title.toLowerCase();
  if (normalized.includes('arcade') || normalized.includes('arena')) return 'arcade';
  if (normalized.includes('maths') || normalized.includes('math')) return 'maths';
  if (normalized.includes('english') || normalized.includes('kingdom')) return 'english';
  return 'arcade';
};

const FloatingParticles: React.FC<{ theme: WorldTheme }> = React.memo(({ theme }) => {
  const particles = useMemo(
    () =>
      theme.particles.slice(0, 8).map((emoji, index) => ({
        emoji,
        x: `${5 + ((index * 11.5) % 90)}%`,
        y: `${8 + ((index * 13.7) % 80)}%`,
        size: 14 + (index % 4) * 4,
        delay: index * 0.4,
        duration: 5 + (index % 3) * 2,
      })),
    [theme.particles],
  );

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map((particle, index) => (
        <span
          key={index}
          style={{
            position: 'absolute',
            left: particle.x,
            top: particle.y,
            fontSize: particle.size,
            opacity: 0,
            animation: `gss-particle ${particle.duration}s ${particle.delay}s ease-in-out infinite`,
            willChange: 'transform, opacity',
          }}
        >
          {particle.emoji}
        </span>
      ))}
    </div>
  );
});
FloatingParticles.displayName = 'FloatingParticles';

const SparkleField: React.FC<{ theme: WorldTheme; count?: number }> = React.memo(({ theme, count = 8 }) => {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: `${(index * 12.5) % 100}%`,
        y: `${(index * 14.3) % 100}%`,
        size: 2 + (index % 3),
        delay: index * 0.35,
        duration: 3 + (index % 4) * 1.5,
      })),
    [count],
  );

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {dots.map((dot, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
            boxShadow: `0 0 10px ${theme.particleColors[0]}`,
            animation: `gss-sparkle ${dot.duration}s ${dot.delay}s ease-in-out infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
});
SparkleField.displayName = 'SparkleField';

const GameSection: React.FC<GameSectionProps> = ({
  title,
  subtitle,
  icon,
  gradient,
  cards,
  getStars,
  onSelectGame,
  onBack,
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
      <div style={{ ...S.bg, background: theme.bg }} />

      <FloatingParticles theme={theme} />
      <SparkleField theme={theme} />

      <div
        style={{
          ...S.headerBar,
          background: theme.panelBg,
          borderColor: theme.panelBorder,
          boxShadow: theme.headerGlow,
        }}
      >
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.12, x: -3 }}
          whileTap={{ scale: 0.92 }}
          style={{
            ...S.backBtn,
            borderColor: theme.backBorder,
            color: theme.accentText,
            boxShadow: `0 10px 24px ${theme.particleColors[0]}`,
          }}
          aria-label="Back to Games Hub"
        >
          ←
        </motion.button>

        <div style={{ position: 'relative' }}>
          <div
            style={{ ...S.iconBadge, background: gradient, animation: 'gss-icon-bob 4s ease-in-out infinite' }}
          >
            <span style={{ fontSize: 26 }}>{icon}</span>
          </div>
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

        <div style={{ flex: 1 }}>
          <h2 style={{ ...S.title, color: theme.accentText }}>{title}</h2>
          <p style={{ ...S.subtitle, color: theme.subtitleColor }}>{subtitle}</p>
        </div>

        <div
          style={{
            ...S.countBadge,
            background: theme.countBg,
            borderColor: theme.panelBorder,
            boxShadow: `0 10px 22px ${theme.particleColors[0]}`,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 900, color: theme.accentText }}>{cards.length}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: theme.subtitleColor }}>games</span>
        </div>
      </div>

      <motion.div
        style={S.grid}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {cards.map((game, index) => (
          <GameCard
            key={game.id}
            game={game}
            index={index}
            stars={getStars(game)}
            onClick={() => onSelectGame(game)}
          />
        ))}
      </motion.div>

      <div style={{ height: 48 }} />
    </motion.div>
  );
};

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
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: '2px solid rgba(139,111,94,0.2)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(231,248,255,0.74) 100%)',
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
    flexDirection: 'column',
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
