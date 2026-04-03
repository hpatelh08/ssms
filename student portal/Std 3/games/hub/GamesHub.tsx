/**
 * games/hub/GamesHub.tsx — Cinematic Animated Games Hub
 * ─────────────────────────────────────────────────────
 * Premium entry experience: gradient wave → sparkle drift →
 * soft zoom-in world reveal → bounce-in section cards.
 *
 * Visual: Dark space glass with emoji-tinted gradients.
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
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.32) 0%, rgba(59,130,246,0.2) 45%, rgba(236,72,153,0.2) 100%)',
    glowColor: 'rgba(99,102,241,0.35)',
    decorations: ['🎪', '🎯', '🎲', '🏆'],
    mascot: '🤖',
  },
  {
    id: 'maths',
    title: 'Maths World',
    subtitle: 'Numbers & Shapes!',
    icon: '🔢',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.28) 0%, rgba(251,191,36,0.2) 45%, rgba(249,115,22,0.18) 100%)',
    glowColor: 'rgba(245,158,11,0.32)',
    decorations: ['✨', '📐', '🌟', '💡'],
    mascot: '🧮',
  },
  {
    id: 'english',
    title: 'English Kingdom',
    subtitle: 'Words & Stories!',
    icon: '📚',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(34,197,94,0.2) 45%, rgba(6,182,212,0.18) 100%)',
    glowColor: 'rgba(16,185,129,0.3)',
    decorations: ['📖', '✍️', '🦋', '🌸'],
    mascot: '🦉',
  },
  {
    id: 'science',
    title: 'EVS Lab',
    subtitle: 'Explore & Discover!',
    icon: '🔬',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.28) 0%, rgba(16,185,129,0.2) 45%, rgba(99,102,241,0.16) 100%)',
    glowColor: 'rgba(6,182,212,0.3)',
    decorations: ['🌿', '🔬', '🧪', '🌍'],
    mascot: '🦊',
  },
  {
    id: 'library',
    title: 'NCERT Library',
    subtitle: 'Books & Textbooks!',
    icon: '📖',
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.24) 0%, rgba(168,85,247,0.2) 45%, rgba(99,102,241,0.18) 100%)',
    glowColor: 'rgba(236,72,153,0.28)',
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
      background:
        'radial-gradient(circle at 18% 22%, rgba(99,102,241,0.18), transparent 32%), radial-gradient(circle at 82% 12%, rgba(236,72,153,0.14), transparent 28%), radial-gradient(circle at 78% 84%, rgba(16,185,129,0.14), transparent 26%), linear-gradient(180deg, rgba(7,12,28,0.94) 0%, rgba(15,23,42,0.9) 55%, rgba(2,6,23,0.96) 100%)',
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
    <div style={S.outerWrapper}>
      {/* ── Centered rounded container ── */}
      <div style={S.roundedContainer}>
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
                  background: 'radial-gradient(ellipse at center, transparent 40%, rgba(7,12,28,0.8) 100%)',
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

              {/* ── 20px spacing ── */}
              <div style={{ height: 20 }} />

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

              {/* ── 20px spacing ── */}
              <div style={{ height: 20 }} />

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
    </div>
  );
};

/* ── Styles ─────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  outerWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: 'clamp(20px, 4vh, 40px) clamp(20px, 3vw, 40px)',
    background: 'transparent',
  },
  roundedContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 1200,
    minHeight: 'clamp(600px, 80vh, 900px)',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 40,
    padding: 'clamp(32px, 5vh, 56px) clamp(24px, 3vw, 48px)',
    gap: 'clamp(16px, 2.5vh, 24px)',
    border: '1px solid rgba(148,163,184,0.16)',
    boxShadow: '0 18px 48px rgba(2,6,23,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
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
    filter: 'drop-shadow(0 6px 16px rgba(99,102,241,0.32))',
  },
  title: {
    fontSize: 'clamp(30px, 4.5vw, 48px)',
    fontWeight: 900,
    color: '#F8FAFC',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    textShadow: '0 2px 14px rgba(2,6,23,0.35)',
  },
  subtitle: {
    fontSize: 'clamp(14px, 1.8vw, 19px)',
    fontWeight: 700,
    color: '#CBD5E1',
    textAlign: 'center',
    margin: 0,
    letterSpacing: '0.01em',
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    justifyItems: 'center',
    alignItems: 'stretch',
    gap: 'clamp(16px, 2.5vw, 28px)',
    width: '100%',
    maxWidth: '100%',
    padding: 0,
    zIndex: 5,
  },
  footer: {
    fontSize: 'clamp(11px, 1.3vw, 14px)',
    fontWeight: 700,
    color: '#94A3B8',
    textAlign: 'center',
    margin: 0,
    zIndex: 5,
    letterSpacing: '0.03em',
    opacity: 0.85,
  },
};

export default React.memo(GamesHub);
