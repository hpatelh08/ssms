/**
 * child/FoxMascot.tsx — 🦊 Premium Interactive Fox Guide
 * ═══════════════════════════════════════════════════════
 *
 * Single global mascot used across the entire app.
 * SVG-based, 120px circular fox face, fixed bottom-right.
 *
 * Expressions: idle | correct | wrong | levelUp | hardLevel
 * Features:
 *  • Floating idle animation (gentle bob)
 *  • Scale pop on correct answer
 *  • Star burst effect on level up
 *  • Subtle glow shadow that shifts per expression
 *  • Speech bubble with spring animation
 *  • Fully SVG — no emoji, no font symbols
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMascot } from './useMascotController';
import type { MascotState } from './useMascotController';

/* ── Expression Mapping ──────────────────────────── */

export type FoxExpression = 'idle' | 'correct' | 'wrong' | 'levelUp' | 'hardLevel';

interface ExpressionStyle {
  eyeType: 'normal' | 'happy' | 'star' | 'worried' | 'determined';
  mouthType: 'smile' | 'grin' | 'frown' | 'open' | 'determined';
  blush: boolean;
  glowColor: string;
  earWiggle: boolean;
}

const EXPRESSIONS: Record<FoxExpression, ExpressionStyle> = {
  idle:      { eyeType: 'normal',     mouthType: 'smile',      blush: true,  glowColor: 'rgba(255,159,67,0.35)',  earWiggle: false },
  correct:   { eyeType: 'happy',      mouthType: 'grin',       blush: true,  glowColor: 'rgba(46,204,113,0.45)',  earWiggle: true },
  wrong:     { eyeType: 'worried',    mouthType: 'frown',      blush: false, glowColor: 'rgba(231,76,60,0.35)',   earWiggle: false },
  levelUp:   { eyeType: 'star',       mouthType: 'open',       blush: true,  glowColor: 'rgba(241,196,15,0.55)',  earWiggle: true },
  hardLevel: { eyeType: 'determined', mouthType: 'determined', blush: false, glowColor: 'rgba(155,89,182,0.45)',  earWiggle: false },
};

/** Map MascotState from context → FoxExpression */
function mapState(s: MascotState): FoxExpression {
  switch (s) {
    case 'happy': case 'excited': return 'correct';
    case 'celebrate': case 'laugh': return 'levelUp';
    case 'thinking': return 'hardLevel';
    case 'encourage': return 'wrong';
    default: return 'idle';
  }
}

/* ── SVG Eye Components ──────────────────────────── */

const EyeNormal: React.FC<{ cx: number }> = ({ cx }) => (
  <g>
    <ellipse cx={cx} cy={42} rx={7} ry={8} fill="#2c3e50" />
    <ellipse cx={cx + 2} cy={40} rx={2.5} ry={2.5} fill="#fff" />
  </g>
);

const EyeHappy: React.FC<{ cx: number }> = ({ cx }) => (
  <path d={`M${cx - 7},44 Q${cx},36 ${cx + 7},44`} fill="none" stroke="#2c3e50" strokeWidth="3" strokeLinecap="round" />
);

const EyeStar: React.FC<{ cx: number }> = ({ cx }) => {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const outer = 7, inner = 3.5;
    const a1 = (i * 72 - 90) * Math.PI / 180;
    const a2 = ((i * 72) + 36 - 90) * Math.PI / 180;
    return `${cx + outer * Math.cos(a1)},${42 + outer * Math.sin(a1)} ${cx + inner * Math.cos(a2)},${42 + inner * Math.sin(a2)}`;
  }).join(' ');
  return <polygon points={pts} fill="#f1c40f" stroke="#e67e22" strokeWidth="0.5" />;
};

const EyeWorried: React.FC<{ cx: number }> = ({ cx }) => (
  <g>
    <ellipse cx={cx} cy={43} rx={6} ry={7} fill="#2c3e50" />
    <ellipse cx={cx + 1.5} cy={41} rx={2} ry={2} fill="#fff" />
    <line x1={cx - 5} y1={34} x2={cx + 5} y2={36} stroke="#2c3e50" strokeWidth="2" strokeLinecap="round" />
  </g>
);

const EyeDetermined: React.FC<{ cx: number }> = ({ cx }) => (
  <g>
    <ellipse cx={cx} cy={43} rx={6.5} ry={7} fill="#2c3e50" />
    <ellipse cx={cx + 1.5} cy={41} rx={2} ry={2} fill="#fff" />
    <line x1={cx - 6} y1={33} x2={cx + 6} y2={35} stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round" />
  </g>
);

const Eye: React.FC<{ type: ExpressionStyle['eyeType']; cx: number }> = ({ type, cx }) => {
  switch (type) {
    case 'happy': return <EyeHappy cx={cx} />;
    case 'star': return <EyeStar cx={cx} />;
    case 'worried': return <EyeWorried cx={cx} />;
    case 'determined': return <EyeDetermined cx={cx} />;
    default: return <EyeNormal cx={cx} />;
  }
};

/* ── SVG Mouth Components ────────────────────────── */

const Mouth: React.FC<{ type: ExpressionStyle['mouthType'] }> = ({ type }) => {
  switch (type) {
    case 'grin':
      return <path d="M40,60 Q50,70 60,60" fill="none" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round" />;
    case 'frown':
      return <path d="M42,64 Q50,58 58,64" fill="none" stroke="#7f8c8d" strokeWidth="2" strokeLinecap="round" />;
    case 'open':
      return (
        <g>
          <ellipse cx={50} cy={62} rx={6} ry={5} fill="#c0392b" />
          <ellipse cx={50} cy={60} rx={4} ry={2.5} fill="#e74c3c" />
        </g>
      );
    case 'determined':
      return <line x1={44} y1={62} x2={56} y2={62} stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round" />;
    default: // smile
      return <path d="M42,58 Q50,66 58,58" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" />;
  }
};

/* ── Star Burst Effect ───────────────────────────── */

const StarBurst: React.FC = () => (
  <div style={{ position: 'absolute', inset: -20, pointerEvents: 'none', zIndex: -1 }}>
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: [0, 1.6, 0],
          opacity: [1, 0.8, 0],
          x: Math.cos((i * 45) * Math.PI / 180) * 50,
          y: Math.sin((i * 45) * Math.PI / 180) * 50,
        }}
        transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 12, height: 12, marginTop: -6, marginLeft: -6,
        }}
      >
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <polygon
            points="12,2 14.5,8.5 21.5,9.5 16.5,14 18,21 12,17.5 6,21 7.5,14 2.5,9.5 9.5,8.5"
            fill="#f1c40f" stroke="#e67e22" strokeWidth="0.5"
          />
        </svg>
      </motion.div>
    ))}
  </div>
);

/* ── Fox Face SVG ────────────────────────────────── */

const FoxFaceSVG: React.FC<{ expr: ExpressionStyle }> = React.memo(({ expr }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
    <defs>
      <radialGradient id="foxFaceGrad" cx="40%" cy="35%">
        <stop offset="0%" stopColor="#ffcc80" />
        <stop offset="100%" stopColor="#ff9f43" />
      </radialGradient>
      <radialGradient id="foxCheekGrad" cx="50%" cy="50%">
        <stop offset="0%" stopColor="rgba(255,180,180,0.5)" />
        <stop offset="100%" stopColor="rgba(255,150,150,0)" />
      </radialGradient>
    </defs>

    {/* Ears */}
    <polygon points="15,28 5,2 32,22" fill="#ff9f43" stroke="#e67e22" strokeWidth="0.5" />
    <polygon points="85,28 95,2 68,22" fill="#ff9f43" stroke="#e67e22" strokeWidth="0.5" />
    {/* Inner ears */}
    <polygon points="18,26 11,10 28,23" fill="#ffb6b9" />
    <polygon points="82,26 89,10 72,23" fill="#ffb6b9" />

    {/* Head circle */}
    <circle cx={50} cy={50} r={38} fill="url(#foxFaceGrad)" />

    {/* White cheek patches */}
    <ellipse cx={35} cy={56} rx={14} ry={10} fill="rgba(255,255,255,0.45)" />
    <ellipse cx={65} cy={56} rx={14} ry={10} fill="rgba(255,255,255,0.45)" />

    {/* Forehead stripe */}
    <path d="M50,14 L46,30 L50,28 L54,30 Z" fill="#e67e22" opacity={0.3} />

    {/* Eyes */}
    <Eye type={expr.eyeType} cx={36} />
    <Eye type={expr.eyeType} cx={64} />

    {/* Nose */}
    <ellipse cx={50} cy={54} rx={4} ry={3} fill="#2c3e50" />
    <ellipse cx={50.5} cy={53} rx={1.5} ry={1} fill="rgba(255,255,255,0.3)" />

    {/* Whiskers */}
    <g stroke="#c0392b" strokeWidth="0.8" opacity={0.35}>
      <line x1={30} y1={54} x2={10} y2={50} />
      <line x1={30} y1={57} x2={10} y2={58} />
      <line x1={70} y1={54} x2={90} y2={50} />
      <line x1={70} y1={57} x2={90} y2={58} />
    </g>

    {/* Mouth */}
    <Mouth type={expr.mouthType} />

    {/* Blush cheeks */}
    {expr.blush && (
      <>
        <ellipse cx={26} cy={56} rx={8} ry={5} fill="url(#foxCheekGrad)" />
        <ellipse cx={74} cy={56} rx={8} ry={5} fill="url(#foxCheekGrad)" />
      </>
    )}
  </svg>
));
FoxFaceSVG.displayName = 'FoxFaceSVG';

/* ═══════════════════════════════════════════════════
   🦊  MAIN FOX MASCOT COMPONENT
   ═══════════════════════════════════════════════════ */

export interface FoxMascotProps {
  /** Override expression (for game-specific control). Falls back to context state. */
  expression?: FoxExpression;
  /** Optional speech bubble message */
  message?: string;
  /** Hide the mascot entirely */
  hidden?: boolean;
}

const FoxMascot: React.FC<FoxMascotProps> = ({ expression, message, hidden }) => {
  const { state: contextState } = useMascot();

  const resolvedExpression: FoxExpression = expression ?? mapState(contextState);
  const expr = EXPRESSIONS[resolvedExpression];

  const isCorrect = resolvedExpression === 'correct';
  const isLevelUp = resolvedExpression === 'levelUp';

  if (hidden) return null;

  return (
    <div className="fox-mascot-root" style={{
      position: 'fixed', bottom: 12, right: 12, zIndex: 1000,
      pointerEvents: 'none', display: 'flex', flexDirection: 'column',
      alignItems: 'flex-end', gap: 8,
    }}>
      {/* Speech Bubble (above fox) */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 340, damping: 20 }}
            style={{
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(14px)',
              borderRadius: 18,
              padding: '10px 18px',
              fontSize: 16, fontWeight: 800, color: 'var(--text-primary)',  
              boxShadow: '0 6px 28px rgba(0,0,0,0.16), 0 0 0 2px rgba(255,159,67,0.15)',
              border: '2.5px solid rgba(255,159,67,0.35)',
              maxWidth: 220, lineHeight: 1.35,
              pointerEvents: 'auto',
              textAlign: 'center',
            }}
          >
            {message}
            {/* Bubble tail */}
            <div style={{
              position: 'absolute', bottom: -8, right: 24,
              width: 0, height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid rgba(255,255,255,0.96)',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.06))',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fox Face Container */}
      <motion.div
        /* Idle floating bob */
        animate={{
          y: [0, -7, 0],
          scale: isCorrect ? [1, 1.14, 1] : 1,
        }}
        transition={{
          y: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
          scale: isCorrect ? { duration: 0.45, ease: 'easeOut' } : {},
        }}
        style={{
          width: 'var(--fox-size, 120px)', height: 'var(--fox-size, 120px)',
          borderRadius: '50%',
          position: 'relative',
          cursor: 'default',
          filter: `drop-shadow(0 0 18px ${expr.glowColor})`,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        {/* Glow ring behind */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            background: `radial-gradient(circle, ${expr.glowColor}, transparent 70%)`,
            zIndex: -1,
          }}
        />

        {/* White border ring */}
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          overflow: 'hidden',
          border: '4px solid rgba(255,255,255,0.9)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.18), 0 0 24px ${expr.glowColor}`,
          background: 'linear-gradient(145deg, #fff8f0, #ffcc80)',
        }}>
          {/* Ear wiggle wrapper */}
          <motion.div
            animate={expr.earWiggle ? { rotate: [0, 3, -3, 2, -2, 0] } : {}}
            transition={expr.earWiggle ? { duration: 0.6, ease: 'easeInOut' } : {}}
            style={{ width: '100%', height: '100%' }}
          >
            <FoxFaceSVG expr={expr} />
          </motion.div>
        </div>

        {/* Level-up star burst */}
        {isLevelUp && <StarBurst />}
      </motion.div>

      {/* Embedded styles */}
      <style>{FOX_MASCOT_CSS}</style>
    </div>
  );
};

/* ── CSS Animations ──────────────────────────────── */

const FOX_MASCOT_CSS = `
.fox-mascot-root {
  --fox-size: 120px;
}
@media (max-width: 1024px) {
  .fox-mascot-root {
    --fox-size: 90px;
  }
}
@keyframes foxGlowPulse {
  0%, 100% { box-shadow: 0 0 16px rgba(255,159,67,0.3); }
  50%      { box-shadow: 0 0 28px rgba(255,159,67,0.5); }
}
`;

export default FoxMascot;
