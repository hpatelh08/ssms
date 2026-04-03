/**
 * games/hub/GamesHub.tsx — Cinematic Animated Games Hub
 * ─────────────────────────────────────────────────────
 * Premium entry experience: gradient wave → sparkle drift →
 * soft zoom-in world reveal → bounce-in section cards.
 *
 * Visual: Coral → Peach → Mint → Cream warm palette.
 * No purple/blue dominance. No startup sound.
 *
 * ⚠ Does NOT touch difficulty engine, curriculum, or backend.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionCard from './SectionCard';

/* ── CSS keyframe injection (GamesHub — runs once) ── */
const HUB_STYLE_ID = 'hub-perf-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(HUB_STYLE_ID)) {
  const _s = document.createElement('style');
  _s.id = HUB_STYLE_ID;
  _s.textContent = `
    @keyframes hub-sparkle { 0%,100%{opacity:0;transform:scale(.5) translateY(0)} 25%{opacity:.8;transform:scale(1) translateY(-8px)} 50%{opacity:.4;transform:scale(.7) translateY(-16px)} 75%{opacity:.8;transform:scale(1) translateY(-8px)} }
    @keyframes hub-emoji-float { 0%,100%{transform:translate(0,0) rotate(0)} 25%{transform:translate(5px,-10px) rotate(4deg)} 50%{transform:translate(0,0) rotate(-4deg)} 75%{transform:translate(-5px,10px) rotate(0)} }
    @keyframes hub-title-bob { 0%,100%{transform:translateY(0) rotate(0)} 25%{transform:translateY(-6px) rotate(4deg)} 75%{transform:translateY(0) rotate(-4deg)} }
  `;
  document.head.appendChild(_s);
}

export type HubSection = 'arcade' | 'maths' | 'english' | 'library';

interface GamesHubProps {
  onNavigate: (section: HubSection) => void;
  studentName?: string;
}

/* ── Section definitions with per-world vibe ───── */
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
    gradient: 'linear-gradient(135deg, #FF7F50 0%, #FF6B6B 40%, #FF8E72 100%)',
    glowColor: 'rgba(255,127,80,0.40)',
    decorations: ['🎪', '🎯', '🎲', '🏆'],
    mascot: '🤖',
  },
  {
    id: 'maths',
    title: 'Maths World',
    subtitle: 'Numbers & Shapes!',
    icon: '🔢',
    gradient: 'linear-gradient(135deg, #FFD166 0%, #FFB347 40%, #FFC873 100%)',
    glowColor: 'rgba(255,209,102,0.40)',
    decorations: ['✨', '📐', '🌟', '💡'],
    mascot: '🧮',
  },
  {
    id: 'english',
    title: 'English Kingdom',
    subtitle: 'Words & Stories!',
    icon: '📚',
    gradient: 'linear-gradient(135deg, #A8E6CF 0%, #72D8A0 40%, #88EBB8 100%)',
    glowColor: 'rgba(168,230,207,0.40)',
    decorations: ['📖', '✍️', '🦋', '🌸'],
    mascot: '🦉',
  },
  {
    id: 'library',
    title: 'NCERT Library',
    subtitle: 'Books & Textbooks!',
    icon: '📖',
    gradient: 'linear-gradient(135deg, #FFB4A2 0%, #FFCDB2 40%, #E5989B 100%)',
    glowColor: 'rgba(255,180,162,0.40)',
    decorations: ['📚', '🔖', '🌈', '🎀'],
    mascot: '🐻',
  },
];

/* ══════════════════════════════════════════════════
   Cinematic entry sequence phases:
   1. gradient-wave  (0–0.4s)
   2. sparkles-drift (0.2–∞)
   3. title-reveal   (0.3–0.6s)
   4. cards-bounce   (0.6–1.2s)
   ══════════════════════════════════════════════════ */

/* ── Phase 1: Warm gradient background (static — no JS animation) ── */
const CinematicBackground: React.FC = () => (
  <div
    style={{
      position: 'absolute', inset: 0, zIndex: 0,
      background: 'linear-gradient(135deg, #FFF5E1 0%, #FFE0CC 20%, #FFDAB9 40%, #FFE8D6 60%, #F0FFF0 80%, #FFF5E1 100%)',
    }}
  />
);

/* ── Phase 2: Sparkle particles — CSS only, 8 particles ── */
const SPARKLE_DATA = Array.from({ length: 8 }, (_, i) => ({
  x: `${5 + (i * 12.5) % 90}%`,
  y: `${5 + (i * 13.3) % 90}%`,
  size: 3 + (i % 3) * 2,
  delay: 0.2 + i * 0.4,
  duration: 3 + (i % 4),
}));

const SparkleField: React.FC = () => (
  <>
    {SPARKLE_DATA.map((sp, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: sp.x, top: sp.y,
          width: sp.size, height: sp.size,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,220,180,0.6) 60%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1,
          animation: `hub-sparkle ${sp.duration}s ${sp.delay}s ease-in-out infinite`,
          willChange: 'transform, opacity',
        }}
      />
    ))}
  </>
);

/* ── Phase 2b: Floating emojis — CSS only, 6 emojis ── */
const FLOATING_EMOJIS = [
  { emoji: '⭐', size: 22, x: '7%', y: '12%', dur: 7, delay: 0.3 },
  { emoji: '🌟', size: 18, x: '88%', y: '8%', dur: 6, delay: 0.5 },
  { emoji: '✨', size: 20, x: '14%', y: '78%', dur: 8, delay: 0.4 },
  { emoji: '💫', size: 16, x: '92%', y: '72%', dur: 7, delay: 0.6 },
  { emoji: '🎀', size: 16, x: '50%', y: '6%', dur: 9, delay: 0.2 },
  { emoji: '🌸', size: 18, x: '75%', y: '85%', dur: 6, delay: 0.7 },
];

const FloatingEmojis: React.FC = () => (
  <>
    {FLOATING_EMOJIS.map((f, i) => (
      <span
        key={i}
        style={{
          position: 'absolute', left: f.x, top: f.y,
          fontSize: f.size,
          opacity: 0.15,
          pointerEvents: 'none', zIndex: 1,
          animation: `hub-emoji-float ${f.dur}s ${f.delay}s ease-in-out infinite`,
          willChange: 'transform',
        }}
      >
        {f.emoji}
      </span>
    ))}
  </>
);

/* ══════════════════════════════════════════════════
   Main Hub Component
   ══════════════════════════════════════════════════ */

const GamesHub: React.FC<GamesHubProps> = ({ onNavigate, studentName }) => {
  const [revealed, setRevealed] = useState(false);

  /* No sound — cinematic silence */
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={S.wrapper}>
      {/* ── Cinematic Background ── */}
      <CinematicBackground />

      {/* ── Sparkle particle field ── */}
      <SparkleField />

      {/* ── Floating emoji decorations ── */}
      <FloatingEmojis />

      <AnimatePresence>
        {revealed && (
          <>
            {/* ── Zoom-in reveal vignette ── */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 0.3, duration: 1 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(255,245,225,0.8) 100%)',
                zIndex: 2, pointerEvents: 'none',
              }}
            />

            {/* ── Title block ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              style={S.titleBlock}
            >
              <span
                style={{ ...S.titleIcon, display: 'inline-block', animation: 'hub-title-bob 4s ease-in-out infinite' }}
              >
                🎪
              </span>
              <h1 style={S.title}>
                {studentName ? `Hey ${studentName}!` : 'Games Hub'}
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={S.subtitle}
              >
                Pick a world and start playing!
              </motion.p>
            </motion.div>

            {/* ── Section Cards — horizontal row ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={S.cardsRow}
            >
              {SECTIONS.map((sec, i) => (
                <SectionCard
                  key={sec.id}
                  title={sec.title}
                  subtitle={sec.subtitle}
                  icon={sec.icon}
                  gradient={sec.gradient}
                  glowColor={sec.glowColor}
                  index={i}
                  onClick={() => onNavigate(sec.id)}
                  decorations={sec.decorations}
                  mascot={sec.mascot}
                />
              ))}
            </motion.div>

            {/* ── Footer ── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={S.footer}
            >
              🛡️ No rankings • No comparison • Pure learning fun
            </motion.p>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Styles ─────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    padding: 'clamp(20px, 4vh, 40px) clamp(12px, 3vw, 32px)',
    gap: 'clamp(24px, 3.5vh, 40px)',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },
  titleIcon: {
    fontSize: 'clamp(44px, 6.5vw, 68px)',
    lineHeight: 1,
    filter: 'drop-shadow(0 4px 12px rgba(255,127,80,0.3))',
  },
  title: {
    fontSize: 'clamp(30px, 4.5vw, 48px)',
    fontWeight: 900,
    color: '#5B3A29',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    textShadow: '0 2px 8px rgba(255,220,180,0.4)',
  },
  subtitle: {
    fontSize: 'clamp(14px, 1.8vw, 19px)',
    fontWeight: 700,
    color: '#A07860',
    textAlign: 'center',
    margin: 0,
    letterSpacing: '0.01em',
  },
  cardsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 'clamp(16px, 2.5vw, 36px)',
    width: '100%',
    maxWidth: 1400,
    padding: 'clamp(4px, 1vh, 12px) clamp(12px, 2vw, 24px)',
    zIndex: 5,
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollSnapType: 'x mandatory',
  },
  footer: {
    fontSize: 'clamp(11px, 1.3vw, 14px)',
    fontWeight: 700,
    color: '#BFA08E',
    textAlign: 'center',
    margin: 0,
    zIndex: 5,
    letterSpacing: '0.03em',
    opacity: 0.85,
  },
};

export default React.memo(GamesHub);
