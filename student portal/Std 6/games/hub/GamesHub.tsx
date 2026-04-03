/**
 * games/hub/GamesHub.tsx - Water-themed Games Hub
 * -----------------------------------------------
 * Calm underwater entry experience with glassy cards,
 * drifting bubbles, and a responsive world grid.
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SectionCard from './SectionCard';

const HUB_STYLE_ID = 'hub-water-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(HUB_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = HUB_STYLE_ID;
  style.textContent = `
    @keyframes hub-bubble-rise {
      0% { opacity: 0; transform: translateY(20px) scale(0.72); }
      22% { opacity: 0.78; }
      100% { opacity: 0; transform: translateY(-140px) scale(1.08); }
    }
    @keyframes hub-drift {
      0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
      50% { transform: translate3d(10px, -10px, 0) rotate(5deg); }
    }
    @keyframes hub-title-bob {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-6px) rotate(4deg); }
    }
    @keyframes hub-wave-slide {
      0%, 100% { transform: translateX(-4%); }
      50% { transform: translateX(4%); }
    }
  `;
  document.head.appendChild(style);
}

export type HubSection = 'arcade' | 'maths' | 'english' | 'library';

interface GamesHubProps {
  onNavigate: (section: HubSection) => void;
  studentName?: string;
}

const SECTIONS: {
  id: HubSection;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  glowColor: string;
  decorations: string[];
  mascot: string;
}[] = [
  {
    id: 'arcade',
    title: 'Arcade Arena',
    subtitle: 'Fun brain games!',
    icon: '🎮',
    gradient: 'linear-gradient(160deg, #1188bf 0%, #44cfea 52%, #88f3ff 100%)',
    glowColor: 'rgba(55, 180, 213, 0.36)',
    decorations: ['🫧', '🎯', '🐠', '🌊'],
    mascot: '🐡',
  },
  {
    id: 'maths',
    title: 'Maths World',
    subtitle: 'Numbers & Shapes!',
    icon: '🔢',
    gradient: 'linear-gradient(160deg, #149db0 0%, #4fd6ca 52%, #9ef4e4 100%)',
    glowColor: 'rgba(60, 193, 186, 0.34)',
    decorations: ['🫧', '🔢', '📐', '🐙'],
    mascot: '🐳',
  },
  {
    id: 'english',
    title: 'English Kingdom',
    subtitle: 'Words & Stories!',
    icon: '📚',
    gradient: 'linear-gradient(160deg, #1c9e9e 0%, #57d6b8 50%, #baf3de 100%)',
    glowColor: 'rgba(69, 197, 167, 0.34)',
    decorations: ['🫧', '📚', '✏️', '🐚'],
    mascot: '🐬',
  },
  {
    id: 'library',
    title: 'NCERT Library',
    subtitle: 'Books & Textbooks!',
    icon: '📖',
    gradient: 'linear-gradient(160deg, #257eb7 0%, #6fc4f0 54%, #b7ebff 100%)',
    glowColor: 'rgba(74, 158, 214, 0.34)',
    decorations: ['🫧', '📘', '⭐', '🌊'],
    mascot: '🐢',
  },
];

const CinematicBackground: React.FC = () => (
  <div style={S.backgroundFrame}>
    <div style={S.backgroundBase} />
    <div style={S.backgroundGlow} />
    <div style={S.backgroundBeam} />
    <div style={S.backgroundTide} />
    <div style={S.backgroundSand} />
  </div>
);

const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  left: `${4 + ((i * 7.5) % 88)}%`,
  top: `${70 + ((i * 9) % 25)}%`,
  size: 12 + (i % 4) * 8,
  delay: i * 0.45,
  duration: 6 + (i % 4),
}));

const BubbleField: React.FC = () => (
  <>
    {BUBBLES.map((bubble, index) => (
      <div
        key={index}
        style={{
          position: 'absolute',
          left: bubble.left,
          top: bubble.top,
          width: bubble.size,
          height: bubble.size,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.58)',
          background:
            'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 30%, rgba(180,240,255,0.12) 62%, transparent 100%)',
          boxShadow:
            'inset 0 0 10px rgba(255,255,255,0.35), 0 0 12px rgba(113, 203, 228, 0.18)',
          pointerEvents: 'none',
          zIndex: 1,
          animation: `hub-bubble-rise ${bubble.duration}s ${bubble.delay}s ease-in-out infinite`,
          willChange: 'transform, opacity',
        }}
      />
    ))}
  </>
);

const FLOATING_DECOR = [
  { emoji: '🐚', size: 18, x: '10%', y: '14%', duration: 8, delay: 0.2 },
  { emoji: '⭐', size: 16, x: '88%', y: '12%', duration: 7, delay: 0.5 },
  { emoji: '🫧', size: 18, x: '18%', y: '84%', duration: 9, delay: 0.4 },
  { emoji: '🌊', size: 20, x: '78%', y: '82%', duration: 8, delay: 0.7 },
  { emoji: '🐠', size: 18, x: '52%', y: '10%', duration: 10, delay: 0.3 },
  { emoji: '🪸', size: 18, x: '91%', y: '68%', duration: 7, delay: 0.6 },
];

const FloatingDecor: React.FC = () => (
  <>
    {FLOATING_DECOR.map((item, index) => (
      <span
        key={index}
        style={{
          position: 'absolute',
          left: item.x,
          top: item.y,
          fontSize: item.size,
          opacity: 0.14,
          pointerEvents: 'none',
          zIndex: 1,
          animation: `hub-drift ${item.duration}s ${item.delay}s ease-in-out infinite`,
          willChange: 'transform',
        }}
      >
        {item.emoji}
      </span>
    ))}
  </>
);

const GamesHub: React.FC<GamesHubProps> = ({ onNavigate, studentName }) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={S.wrapper}>
      <CinematicBackground />
      <BubbleField />
      <FloatingDecor />

      <AnimatePresence>
        {revealed && (
          <>
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 0.25, duration: 0.9 }}
              style={S.revealMist}
            />

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={S.titleShell}
            >
              <div style={S.titleWave} />
              <div style={S.titlePearl} />
              <div style={S.titleBlock}>
                <span style={S.eyebrow}>Ocean Play Cove</span>
                <span
                  style={{
                    ...S.titleIcon,
                    display: 'inline-block',
                    animation: 'hub-title-bob 4s ease-in-out infinite',
                  }}
                >
                  🌊
                </span>
                <h1 style={S.title}>{studentName ? `Hey ${studentName}!` : 'Games Hub'}</h1>
                <p style={S.subtitle}>Pick a world and start playing!</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45 }}
              style={S.cardsShell}
            >
              <div style={S.cardsWave} />
              <div style={S.cardsRow}>
                {SECTIONS.map((section, index) => (
                  <SectionCard
                    key={section.id}
                    title={section.title}
                    subtitle={section.subtitle}
                    icon={section.icon}
                    gradient={section.gradient}
                    glowColor={section.glowColor}
                    index={index}
                    onClick={() => onNavigate(section.id)}
                    decorations={section.decorations}
                    mascot={section.mascot}
                  />
                ))}
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28, duration: 0.4 }}
              style={S.footer}
            >
              🫧 No rankings • No comparison • Pure learning flow
            </motion.p>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    padding: 'clamp(26px, 4vw, 40px) clamp(14px, 2.6vw, 30px) clamp(34px, 5vw, 52px)',
    gap: 'clamp(20px, 3vw, 32px)',
  },
  backgroundFrame: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  backgroundBase: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, #effcff 0%, #dff6ff 30%, #d9fbf5 68%, #fff6dc 100%)',
  },
  backgroundGlow: {
    position: 'absolute',
    inset: '-10% -14% auto -14%',
    height: '55%',
    background:
      'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.42) 42%, transparent 72%)',
  },
  backgroundBeam: {
    position: 'absolute',
    top: '-8%',
    left: '20%',
    width: '60%',
    height: '46%',
    background:
      'radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.14) 55%, transparent 75%)',
    filter: 'blur(18px)',
  },
  backgroundTide: {
    position: 'absolute',
    left: '-8%',
    right: '-8%',
    bottom: '8%',
    height: 210,
    background:
      'radial-gradient(ellipse at 50% 50%, rgba(197,241,247,0.55) 0%, rgba(134,217,228,0.2) 55%, transparent 78%)',
    filter: 'blur(6px)',
    animation: 'hub-wave-slide 12s ease-in-out infinite',
  },
  backgroundSand: {
    position: 'absolute',
    left: '-8%',
    right: '-8%',
    bottom: '-12%',
    height: 240,
    background:
      'radial-gradient(ellipse at 50% 0%, rgba(255,244,210,0.92) 0%, rgba(255,244,210,0.34) 42%, transparent 72%)',
  },
  revealMist: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(ellipse at center, rgba(255,255,255,0) 38%, rgba(239,252,255,0.92) 100%)',
    zIndex: 2,
    pointerEvents: 'none',
  },
  titleShell: {
    width: 'min(100%, 980px)',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 34,
    padding: 'clamp(24px, 4vw, 36px)',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(233,249,255,0.68) 100%)',
    border: '1px solid rgba(255,255,255,0.72)',
    boxShadow: '0 24px 70px rgba(61, 147, 177, 0.16)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    zIndex: 4,
  },
  titleWave: {
    position: 'absolute',
    left: '-10%',
    right: '-10%',
    bottom: '-18%',
    height: '55%',
    background:
      'radial-gradient(ellipse at 50% 0%, rgba(129,221,236,0.38) 0%, rgba(129,221,236,0.08) 55%, transparent 78%)',
    animation: 'hub-wave-slide 11s ease-in-out infinite',
  },
  titlePearl: {
    position: 'absolute',
    top: -34,
    right: -16,
    width: 136,
    height: 136,
    borderRadius: '50%',
    background:
      'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.98) 0%, rgba(205,244,255,0.52) 36%, rgba(132,209,232,0.12) 64%, transparent 100%)',
    opacity: 0.8,
  },
  titleBlock: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(130, 210, 233, 0.28)',
    color: '#1782a4',
    fontSize: 'clamp(11px, 1.2vw, 13px)',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    boxShadow: '0 10px 24px rgba(74, 156, 187, 0.12)',
  },
  titleIcon: {
    fontSize: 'clamp(42px, 6vw, 64px)',
    lineHeight: 1,
    filter: 'drop-shadow(0 8px 20px rgba(38, 148, 181, 0.2))',
  },
  title: {
    fontSize: 'clamp(30px, 4.2vw, 48px)',
    fontWeight: 900,
    color: '#0d617f',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.12,
    letterSpacing: '-0.03em',
  },
  subtitle: {
    fontSize: 'clamp(14px, 1.8vw, 19px)',
    fontWeight: 700,
    color: '#4a8ea9',
    textAlign: 'center',
    margin: 0,
  },
  cardsShell: {
    width: 'min(100%, 1220px)',
    position: 'relative',
    overflow: 'hidden',
    padding: 'clamp(18px, 2.6vw, 28px)',
    borderRadius: 36,
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.46) 0%, rgba(225,247,252,0.28) 100%)',
    border: '1px solid rgba(255,255,255,0.72)',
    boxShadow: '0 28px 78px rgba(63, 148, 175, 0.14)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    zIndex: 4,
  },
  cardsWave: {
    position: 'absolute',
    left: '-6%',
    right: '-6%',
    bottom: -18,
    height: 100,
    background:
      'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.48) 0%, rgba(176,232,244,0.14) 55%, transparent 80%)',
    animation: 'hub-wave-slide 14s ease-in-out infinite',
    pointerEvents: 'none',
  },
  cardsRow: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 'clamp(16px, 2vw, 24px)',
    width: '100%',
    alignItems: 'stretch',
  },
  footer: {
    margin: 0,
    padding: '10px 18px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.58)',
    border: '1px solid rgba(255,255,255,0.72)',
    color: '#5b97ad',
    fontSize: 'clamp(11px, 1.3vw, 14px)',
    fontWeight: 800,
    letterSpacing: '0.02em',
    textAlign: 'center',
    zIndex: 4,
    boxShadow: '0 12px 28px rgba(72, 151, 181, 0.12)',
  },
};

export default React.memo(GamesHub);
