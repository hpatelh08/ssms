import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionCard from './SectionCard';

const HUB_STYLE_ID = 'hub-forest-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(HUB_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = HUB_STYLE_ID;
  s.textContent = `
    @keyframes hub-firefly {
      0%, 100% { opacity: 0.15; transform: translateY(0) scale(0.9); }
      50% { opacity: 0.85; transform: translateY(-12px) scale(1); }
    }
    @keyframes hub-drift {
      0%, 100% { transform: translate(0, 0); }
      25% { transform: translate(8px, -10px); }
      50% { transform: translate(0, -18px); }
      75% { transform: translate(-10px, -8px); }
    }
    @keyframes hub-leaf-float {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      50% { transform: rotate(8deg) translateY(-8px); }
    }
  `;
  document.head.appendChild(s);
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
  badge: string;
}[] = [
  {
    id: 'arcade',
    title: 'Arcade Arena',
    subtitle: 'Fast fun brain games',
    icon: '🎮',
    gradient: 'linear-gradient(150deg, #8fc774 0%, #5f9c50 46%, #3e743f 100%)',
    glowColor: 'rgba(95, 156, 80, 0.38)',
    decorations: ['🌻', '🦊', '🍃', '🎯'],
    mascot: '🦊',
    badge: 'Action Trail',
  },
  {
    id: 'maths',
    title: 'Maths World',
    subtitle: 'Count, shape and solve',
    icon: '🔢',
    gradient: 'linear-gradient(150deg, #a4cf7b 0%, #739f50 45%, #4b7737 100%)',
    glowColor: 'rgba(115, 159, 80, 0.36)',
    decorations: ['🌞', '📐', '🧩', '🍂'],
    mascot: '🐿️',
    badge: 'Number Trail',
  },
  {
    id: 'english',
    title: 'English Kingdom',
    subtitle: 'Read, speak and story',
    icon: '📚',
    gradient: 'linear-gradient(150deg, #7fcca0 0%, #4ea072 48%, #2d6d4f 100%)',
    glowColor: 'rgba(78, 160, 114, 0.36)',
    decorations: ['🦉', '🪶', '🍀', '🦋'],
    mascot: '🦉',
    badge: 'Story Trail',
  },
  {
    id: 'library',
    title: 'NCERT Library',
    subtitle: 'Books and textbooks',
    icon: '📖',
    gradient: 'linear-gradient(150deg, #a8bf83 0%, #6f8854 50%, #4a5f3c 100%)',
    glowColor: 'rgba(111, 136, 84, 0.34)',
    decorations: ['🌲', '🪵', '📎', '🍁'],
    mascot: '🐻',
    badge: 'Book Trail',
  },
];

const FIREFLIES = Array.from({ length: 12 }, (_, i) => ({
  left: `${6 + (i * 8.1) % 88}%`,
  top: `${8 + (i * 11.4) % 82}%`,
  delay: i * 0.35,
  duration: 2.6 + (i % 4) * 0.7,
  size: 4 + (i % 3),
}));

const FLOATING_LEAVES = [
  { emoji: '🍃', left: '8%', top: '14%', duration: 7 },
  { emoji: '🌿', left: '86%', top: '10%', duration: 8 },
  { emoji: '🍂', left: '14%', top: '82%', duration: 9 },
  { emoji: '🪶', left: '90%', top: '76%', duration: 8 },
];

const ForestBackdrop: React.FC = () => (
  <>
    <div style={S.skyLayer} />
    <div style={S.sunLayer} />
    <div style={S.mistLayer} />
    <div style={S.canopyLayerTop} />
    <div style={S.canopyLayerBottom} />
  </>
);

const FireflyField: React.FC = () => (
  <div style={S.fireflyField} aria-hidden="true">
    {FIREFLIES.map((f, i) => (
      <span
        key={i}
        style={{
          position: 'absolute',
          left: f.left,
          top: f.top,
          width: f.size,
          height: f.size,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,245,192,0.95) 0%, rgba(255,206,112,0.65) 58%, rgba(255,206,112,0) 100%)',
          boxShadow: '0 0 12px rgba(255, 219, 127, 0.5)',
          animation: `hub-firefly ${f.duration}s ${f.delay}s ease-in-out infinite, hub-drift ${f.duration + 3}s ${f.delay * 0.6}s ease-in-out infinite`,
        }}
      />
    ))}
  </div>
);

const FloatingLeaves: React.FC = () => (
  <div style={S.leafLayer} aria-hidden="true">
    {FLOATING_LEAVES.map((l, i) => (
      <span
        key={i}
        style={{
          position: 'absolute',
          left: l.left,
          top: l.top,
          fontSize: 20,
          opacity: 0.25,
          animation: `hub-leaf-float ${l.duration}s ${i * 0.5}s ease-in-out infinite`,
        }}
      >
        {l.emoji}
      </span>
    ))}
  </div>
);

const GamesHub: React.FC<GamesHubProps> = ({ onNavigate, studentName }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 90);
    return () => clearTimeout(t);
  }, []);

  const headingName = useMemo(
    () => (studentName ? `Hey ${studentName}!` : 'Choose Your Trail!'),
    [studentName],
  );

  return (
    <div style={S.wrapper}>
      <ForestBackdrop />
      <FireflyField />
      <FloatingLeaves />

      <AnimatePresence>
        {ready && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={S.contentShell}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              style={S.titleBlock}
            >
              <span style={S.titlePill}>Forest Learning Trails</span>
              <h1 style={S.title}>{headingName}</h1>
              <p style={S.subtitle}>Pick a world and start your nature adventure.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              style={S.grid}
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
                  badge={sec.badge}
                />
              ))}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              style={S.footer}
            >
              🛡️ No rankings • No pressure • Just joyful learning
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    minHeight: 'calc(100vh - 64px)',
    borderRadius: 30,
    overflow: 'hidden',
    padding: 'clamp(18px, 3vw, 34px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  contentShell: {
    position: 'relative',
    zIndex: 4,
    width: '100%',
    maxWidth: 1450,
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(18px, 2.4vw, 28px)',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    textAlign: 'center',
    marginTop: 'clamp(4px, 1.2vh, 14px)',
  },
  titlePill: {
    fontSize: 'clamp(11px, 1vw, 13px)',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#234b2f',
    background: 'rgba(225, 245, 210, 0.82)',
    border: '1px solid rgba(90, 136, 76, 0.36)',
    borderRadius: 999,
    padding: '7px 12px',
    fontFamily: '"Poppins", "Nunito", sans-serif',
  },
  title: {
    margin: 0,
    color: '#1d422a',
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: '-0.025em',
    fontSize: 'clamp(30px, 4.4vw, 56px)',
    fontFamily: '"Baloo 2", "Nunito", "Trebuchet MS", sans-serif',
    textShadow: '0 6px 18px rgba(168, 204, 147, 0.42)',
  },
  subtitle: {
    margin: 0,
    color: '#456b51',
    fontWeight: 700,
    fontSize: 'clamp(14px, 1.5vw, 20px)',
    fontFamily: '"Quicksand", "Nunito", sans-serif',
  },
  grid: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'clamp(12px, 1.8vw, 24px)',
    alignItems: 'stretch',
    padding: 'clamp(4px, 1.2vh, 10px) clamp(0px, 0.5vw, 8px)',
  },
  footer: {
    margin: 0,
    textAlign: 'center',
    color: '#54745d',
    fontWeight: 700,
    fontSize: 'clamp(11px, 1.1vw, 14px)',
    paddingBottom: 2,
    fontFamily: '"Poppins", "Nunito", sans-serif',
  },
  skyLayer: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(160deg, #e8f6df 0%, #dff0d2 34%, #d2e7c1 100%)',
    zIndex: 0,
  },
  sunLayer: {
    position: 'absolute',
    top: -130,
    right: -60,
    width: 360,
    height: 360,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(220, 237, 164, 0.5) 0%, rgba(220, 237, 164, 0.12) 50%, rgba(220, 237, 164, 0) 100%)',
    zIndex: 0,
  },
  mistLayer: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(1200px 220px at 50% 92%, rgba(186, 220, 171, 0.84), rgba(186, 220, 171, 0) 70%)',
    zIndex: 1,
  },
  canopyLayerTop: {
    position: 'absolute',
    top: -80,
    left: -30,
    right: -30,
    height: 180,
    background: 'radial-gradient(closest-side, rgba(94, 151, 82, 0.28), rgba(94, 151, 82, 0) 75%)',
    zIndex: 1,
  },
  canopyLayerBottom: {
    position: 'absolute',
    bottom: -100,
    left: -20,
    right: -20,
    height: 220,
    background: 'linear-gradient(to top, rgba(133, 183, 114, 0.52), rgba(133, 183, 114, 0))',
    zIndex: 1,
  },
  fireflyField: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
  leafLayer: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
};

export default React.memo(GamesHub);
