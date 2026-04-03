/**
 * games/hub/GamesHub.tsx — Cinematic Animated Games Hub
 * ─────────────────────────────────────────────────────
 * Premium entry experience: gradient wave → sparkle drift →
 * soft zoom-in world reveal → bounce-in section cards.
 *
 * Visual: Water/ocean palette with aqua, teal, and seafoam tones.
 * No startup sound.
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
    @keyframes hub-soft-shape { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(0,-10px,0) scale(1.04)} }
  `;
  document.head.appendChild(_s);
}

export type HubSection = 'arcade' | 'maths' | 'english' | 'science' | 'library';

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
    gradient: 'linear-gradient(135deg, #22D3EE 0%, #0EA5E9 45%, #0284C7 100%)',
    glowColor: 'rgba(34,211,238,0.40)',
    decorations: ['🫧', '🌊', '🐟', '⚓'],
    mascot: '🐬',
  },
  {
    id: 'maths',
    title: 'Maths World',
    subtitle: 'Numbers & Shapes!',
    icon: '🔢',
    gradient: 'linear-gradient(135deg, #67E8F9 0%, #38BDF8 45%, #0EA5E9 100%)',
    glowColor: 'rgba(56,189,248,0.42)',
    decorations: ['🫧', '📐', '🐠', '💡'],
    mascot: '🐙',
  },
  {
    id: 'english',
    title: 'English Kingdom',
    subtitle: 'Words & Stories!',
    icon: '📚',
    gradient: 'linear-gradient(135deg, #99F6E4 0%, #5EEAD4 45%, #2DD4BF 100%)',
    glowColor: 'rgba(94,234,212,0.40)',
    decorations: ['📖', '✍️', '🐚', '🫧'],
    mascot: '🦀',
  },
  {
    id: 'science',
    title: 'Science Lab',
    subtitle: 'Explore & Discover!',
    icon: '🔬',
    gradient: 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 45%, #14B8A6 100%)',
    glowColor: 'rgba(110,231,183,0.40)',
    decorations: ['🌿', '🔬', '🧪', '🐢'],
    mascot: '🐳',
  },
  {
    id: 'library',
    title: 'NCERT Library',
    subtitle: 'Books & Textbooks!',
    icon: '📖',
    gradient: 'linear-gradient(135deg, #7DD3FC 0%, #38BDF8 45%, #06B6D4 100%)',
    glowColor: 'rgba(56,189,248,0.40)',
    decorations: ['📚', '🔖', '🫧', '🐠'],
    mascot: '🦭',
  },
];

/* ══════════════════════════════════════════════════
   Cinematic entry sequence phases:
   1. gradient-wave  (0–0.4s)
   2. sparkles-drift (0.2–∞)
   3. title-reveal   (0.3–0.6s)
   4. cards-bounce   (0.6–1.2s)
   ══════════════════════════════════════════════════ */

/* ── Phase 1: Water gradient background (static — no JS animation) ── */
const CinematicBackground: React.FC = () => (
  <motion.div
    style={{
      position: 'absolute', inset: 0, zIndex: 0,
      background: 'linear-gradient(135deg, #E0F7FF 0%, #CCF2FF 24%, #B8ECFF 44%, #D8FAF8 68%, #E8FBFF 84%, #E0F7FF 100%)',
      backgroundSize: '180% 180%',
    }}
    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
    transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
  />
);

const SOFT_SHAPES = [
  { left: '8%', top: '18%', size: 44, color: 'rgba(34,211,238,0.18)', duration: 14, delay: 0.2 },
  { left: '84%', top: '16%', size: 36, color: 'rgba(14,165,233,0.16)', duration: 12, delay: 0.6 },
  { left: '14%', top: '76%', size: 52, color: 'rgba(94,234,212,0.18)', duration: 16, delay: 0.4 },
  { left: '88%', top: '72%', size: 40, color: 'rgba(56,189,248,0.14)', duration: 15, delay: 0.8 },
  { left: '49%', top: '8%', size: 26, color: 'rgba(20,184,166,0.14)', duration: 13, delay: 0.3 },
];

const SoftShapes: React.FC = () => (
  <>
    {SOFT_SHAPES.map((shape, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: shape.left,
          top: shape.top,
          width: shape.size,
          height: shape.size,
          borderRadius: '50%',
          background: shape.color,
          opacity: 0.16,
          pointerEvents: 'none',
          zIndex: 1,
          animation: `hub-soft-shape ${shape.duration}s ${shape.delay}s ease-in-out infinite`,
          willChange: 'transform',
        }}
      />
    ))}
  </>
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
          background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(125,211,252,0.6) 60%, transparent 100%)',
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
  { emoji: '🫧', size: 22, x: '7%', y: '12%', dur: 7, delay: 0.3 },
  { emoji: '🐟', size: 18, x: '88%', y: '8%', dur: 6, delay: 0.5 },
  { emoji: '🌊', size: 20, x: '14%', y: '78%', dur: 8, delay: 0.4 },
  { emoji: '🐠', size: 16, x: '92%', y: '72%', dur: 7, delay: 0.6 },
  { emoji: '🐚', size: 16, x: '50%', y: '6%', dur: 9, delay: 0.2 },
  { emoji: '🐬', size: 18, x: '75%', y: '85%', dur: 6, delay: 0.7 },
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
  const badges = ['Play', 'Start', 'Explore', 'Go', 'Discover'];

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

      {/* ── Soft floating shapes ── */}
      <SoftShapes />

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
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(224,247,255,0.82) 100%)',
                zIndex: 2, pointerEvents: 'none',
              }}
            />

            {/* ── Title block ── */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.35, ease: 'easeOut' }}
              style={S.titleBlock}
            >
              <span
                style={{ ...S.titleIcon, display: 'inline-block', animation: 'hub-title-bob 4s ease-in-out infinite' }}
              >
                💧
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
                🎮 Pick a world and start playing! 📚
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
                <motion.div
                  key={sec.id}
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 4.2 + i * 0.35, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
                  whileHover={{ y: -6, scale: 1.01, filter: `drop-shadow(0 10px 24px ${sec.glowColor})` }}
                  whileTap={{ scale: 0.97 }}
                  style={{ width: '100%', position: 'relative', cursor: 'pointer' }}
                >
                  <SectionCard
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
                  <span style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 12,
                    transform: 'translateX(-50%)',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '0.02em',
                    background: 'rgba(44,58,99,0.22)',
                    border: '1px solid rgba(255,255,255,0.42)',
                    borderRadius: 999,
                    padding: '4px 12px',
                    backdropFilter: 'blur(4px)',
                    pointerEvents: 'none',
                  }}>
                    {badges[i % badges.length]}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* ── Footer ── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={S.footer}
            >
              🛡️ No rankings  ·  💛 No comparison  ·  🎈 Pure learning fun
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
    gap: 12,
    zIndex: 5,
  },
  titleIcon: {
    fontSize: 'clamp(44px, 6.5vw, 68px)',
    lineHeight: 1,
    filter: 'drop-shadow(0 4px 12px rgba(14,165,233,0.35))',
  },
  title: {
    fontSize: 'clamp(33px, 4.8vw, 52px)',
    fontWeight: 900,
    color: '#0F3D5E',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    textShadow: '0 2px 8px rgba(125,211,252,0.35)',
  },
  subtitle: {
    fontSize: 'clamp(15px, 2vw, 20px)',
    fontWeight: 700,
    color: '#26627A',
    textAlign: 'center',
    margin: 0,
    letterSpacing: '0.01em',
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    justifyItems: 'center',
    alignItems: 'stretch',
    gap: 'clamp(14px, 2vw, 22px)',
    width: '100%',
    maxWidth: 1040,
    padding: 'clamp(4px, 1vh, 12px) clamp(12px, 2vw, 24px)',
    zIndex: 5,
  },
  footer: {
    fontSize: 'clamp(12px, 1.45vw, 15px)',
    fontWeight: 700,
    color: '#2D7391',
    textAlign: 'center',
    margin: 0,
    zIndex: 5,
    letterSpacing: '0.03em',
    opacity: 0.85,
  },
};

export default React.memo(GamesHub);
