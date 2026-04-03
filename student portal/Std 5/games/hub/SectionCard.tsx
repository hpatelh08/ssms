import React from 'react';
import { motion } from 'framer-motion';

const CARD_STYLE_ID = 'hub-section-card-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(CARD_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = CARD_STYLE_ID;
  s.textContent = `
    @keyframes sc-icon-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes sc-glimmer {
      0% { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
      45% { opacity: 0.26; }
      100% { transform: translateX(150%) skewX(-18deg); opacity: 0; }
    }
    @keyframes sc-deco-float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(6deg); }
    }
  `;
  document.head.appendChild(s);
}

export interface SectionCardProps {
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  glowColor: string;
  index: number;
  onClick: () => void;
  decorations?: string[];
  mascot?: string;
  badge?: string;
}

const decoPos = [
  { left: '10%', top: '30%' },
  { right: '11%', top: '22%' },
  { left: '14%', bottom: '22%' },
  { right: '13%', bottom: '16%' },
];

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon,
  gradient,
  glowColor,
  index,
  onClick,
  decorations = [],
  mascot,
  badge: _badge,
}) => {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 + index * 0.08, duration: 0.35 }}
      whileHover={{ y: -8, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      style={S.shell}
      type="button"
    >
      <div style={{ ...S.outerGlow, boxShadow: `0 16px 42px ${glowColor}` }} />

      <div style={{ ...S.body, background: gradient }}>
        <div style={S.surfacePattern} />
        <div style={S.shine} />
        <div style={S.topLight} />
        <div style={S.bottomShade} />
        <div style={S.frame} />

        {decorations.slice(0, 4).map((d, i) => (
          <span
            key={`${d}-${i}`}
            style={{
              ...S.deco,
              ...decoPos[i],
              animation: `sc-deco-float ${3.4 + i * 0.7}s ${i * 0.3}s ease-in-out infinite`,
            }}
          >
            {d}
          </span>
        ))}

        <div style={S.content}>
          <div style={S.centerStack}>
            <div style={S.iconWrap}>
              <span style={S.icon}>{icon}</span>
              <span style={{ ...S.sparkle, left: '16%', top: '64%', animationDelay: '0s' }} />
              <span style={{ ...S.sparkle, left: '77%', top: '29%', animationDelay: '0.3s' }} />
              <span style={{ ...S.sparkle, left: '72%', top: '74%', animationDelay: '0.5s' }} />
            </div>

            <h3 style={S.title}>{title}</h3>
            <p style={S.subtitle}>{subtitle}</p>
          </div>

          {mascot ? <span style={S.cornerMascot}>{mascot}</span> : null}
        </div>
      </div>
    </motion.button>
  );
};

const S: Record<string, React.CSSProperties> = {
  shell: {
    width: '100%',
    minHeight: 'clamp(340px, 30vw, 430px)',
    border: 'none',
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
    borderRadius: 28,
    position: 'relative',
    textAlign: 'left',
    WebkitTapHighlightColor: 'transparent',
  },
  outerGlow: {
    position: 'absolute',
    inset: 8,
    borderRadius: 24,
    opacity: 0.6,
    zIndex: 0,
  },
  body: {
    position: 'relative',
    zIndex: 1,
    borderRadius: 26,
    minHeight: 'clamp(340px, 30vw, 430px)',
    overflow: 'hidden',
  },
  surfacePattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 46%), radial-gradient(circle at 76% 78%, rgba(0,0,0,0.08) 0, rgba(0,0,0,0) 40%)',
    pointerEvents: 'none',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: '-45%',
    width: '42%',
    height: '100%',
    background: 'linear-gradient(120deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))',
    animation: 'sc-glimmer 5.5s ease-in-out infinite',
    pointerEvents: 'none',
  },
  topLight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '46%',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0) 100%)',
    pointerEvents: 'none',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
    background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.14) 100%)',
    pointerEvents: 'none',
  },
  frame: {
    position: 'absolute',
    inset: 0,
    borderRadius: 26,
    border: '2px solid rgba(255, 255, 255, 0.5)',
    boxShadow: 'inset 0 1px 14px rgba(255,255,255,0.25), inset 0 -8px 16px rgba(0,0,0,0.11)',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    minHeight: 'clamp(340px, 30vw, 430px)',
    padding: '28px 18px 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
  },
  iconWrap: {
    position: 'relative',
    width: 122,
    height: 106,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 'clamp(62px, 6vw, 90px)',
    lineHeight: 1,
    filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.18))',
    animation: 'sc-icon-bob 3.2s ease-in-out infinite',
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.95)',
    boxShadow: '0 0 8px rgba(255,255,255,0.8)',
    opacity: 0.65,
    animation: 'sc-deco-float 2.6s ease-in-out infinite',
    pointerEvents: 'none',
  },
  title: {
    margin: 0,
    color: '#ffffff',
    fontWeight: 900,
    fontSize: 'clamp(27px, 2.3vw, 44px)',
    letterSpacing: '-0.01em',
    lineHeight: 1.08,
    textShadow: '0 3px 12px rgba(0,0,0,0.18)',
    fontFamily: '"Baloo 2", "Nunito", "Trebuchet MS", sans-serif',
  },
  subtitle: {
    margin: 0,
    color: 'rgba(255,255,255,0.93)',
    fontWeight: 700,
    fontSize: 'clamp(12px, 1.05vw, 18px)',
    textShadow: '0 1px 8px rgba(0,0,0,0.13)',
    fontFamily: '"Quicksand", "Nunito", sans-serif',
  },
  cornerMascot: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    fontSize: 26,
    opacity: 0.32,
    pointerEvents: 'none',
  },
  deco: {
    position: 'absolute',
    fontSize: 16,
    opacity: 0.25,
    pointerEvents: 'none',
  },
};

export default React.memo(SectionCard);
