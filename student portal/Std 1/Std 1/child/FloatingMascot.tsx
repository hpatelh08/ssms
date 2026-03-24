/**
 * child/FloatingMascot.tsx — Universal Learning Companion
 * ════════════════════════════════════════════════════════
 * Slimmer purple companion — fixed bottom-right, always visible.
 *
 * Features:
 *  • Idle breathing animation (CSS transform)
 *  • Occasional blinking (CSS keyframes)
 *  • State-driven expressions: idle, happy, excited, celebrate, laugh, thinking, encourage
 *  • Gentle bounce animation on state change
 *  • Pure SVG + CSS, no heavy libraries
 *  • Consumes MascotContext for cross-section reactivity
 */

import React, { useEffect, useRef, useState } from 'react';
import { useMascot, type MascotState } from './useMascotController';

/* ═══════════════════════════════════════════════════
   EXPRESSION CONFIG
   ═══════════════════════════════════════════════════ */

interface Expression {
  /** Left eye, Right eye: 'open' | 'happy' | 'closed' | 'star' */
  eyes: string;
  /** Mouth shape */
  mouth: string;
  /** Cheek blush opacity */
  blush: number;
  /** Body color tweak */
  glow: string;
}

const EXPRESSIONS: Record<MascotState, Expression> = {
  idle:      { eyes: 'open',  mouth: 'smile',   blush: 0,    glow: 'none' },
  happy:     { eyes: 'happy', mouth: 'grin',     blush: 0.5,  glow: '0 0 16px rgba(168,85,247,0.25)' },
  excited:   { eyes: 'star',  mouth: 'open-big', blush: 0.45, glow: '0 0 20px rgba(59,130,246,0.3)' },
  celebrate: { eyes: 'star',  mouth: 'grin',     blush: 0.7,  glow: '0 0 24px rgba(251,191,36,0.35)' },
  laugh:     { eyes: 'happy', mouth: 'open-big', blush: 0.6,  glow: '0 0 18px rgba(236,72,153,0.25)' },
  thinking:  { eyes: 'open',  mouth: 'hmm',      blush: 0,    glow: 'none' },
  encourage: { eyes: 'open',  mouth: 'smile',   blush: 0.25, glow: '0 0 12px rgba(34,197,94,0.2)' },
};

/* ═══════════════════════════════════════════════════
   SVG PARTS
   ═══════════════════════════════════════════════════ */

const EyeSVG: React.FC<{ cx: number; type: string; blink: boolean }> = ({ cx, type, blink }) => {
  if (blink || type === 'closed') {
    return <line x1={cx - 3.5} y1={30} x2={cx + 3.5} y2={30} stroke="#4c1d95" strokeWidth={2.2} strokeLinecap="round" />;
  }
  if (type === 'happy') {
    return <path d={`M${cx - 3.5} 31 Q${cx} 26 ${cx + 3.5} 31`} fill="none" stroke="#4c1d95" strokeWidth={2.2} strokeLinecap="round" />;
  }
  if (type === 'star') {
    const star = (sx: number, sy: number) => {
      const out: string[] = [];
      for (let i = 0; i < 5; i++) {
        const ao = (i * 72 - 90) * Math.PI / 180;
        out.push(`${sx + 3.5 * Math.cos(ao)},${sy + 3.5 * Math.sin(ao)}`);
        const ai = ((i * 72 + 36) - 90) * Math.PI / 180;
        out.push(`${sx + 1.5 * Math.cos(ai)},${sy + 1.5 * Math.sin(ai)}`);
      }
      return out.join(' ');
    };
    return <polygon points={star(cx, 29)} fill="#fbbf24" />;
  }
  // Default open
  return (
    <>
      <circle cx={cx} cy={29} r={3.5} fill="#4c1d95" />
      <circle cx={cx + 1} cy={27.8} r={1} fill="white" />
    </>
  );
};

const MouthSVG: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'grin':
      return <path d="M30 40 Q36 47 42 40" fill="none" stroke="#4c1d95" strokeWidth={2.2} strokeLinecap="round" />;
    case 'open-big':
      return <ellipse cx={36} cy={42} rx={5} ry={4} fill="#4c1d95" />;
    case 'hmm':
      return <line x1={31} y1={42} x2={41} y2={41} stroke="#4c1d95" strokeWidth={2.2} strokeLinecap="round" />;
    default: // smile
      return <path d="M31 40 Q36 44 41 40" fill="none" stroke="#4c1d95" strokeWidth={1.8} strokeLinecap="round" />;
  }
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

const FloatingMascot: React.FC = () => {
  const { state } = useMascot();
  const expr = EXPRESSIONS[state] || EXPRESSIONS.idle;
  const prevState = useRef<MascotState>(state);
  const [bouncing, setBouncing] = useState(false);
  const [blinking, setBlinking] = useState(false);

  // Bounce on state change
  useEffect(() => {
    if (state !== prevState.current) {
      prevState.current = state;
      if (state !== 'idle') {
        setBouncing(true);
        const t = setTimeout(() => setBouncing(false), 500);
        return () => clearTimeout(t);
      }
    }
  }, [state]);

  // Periodic blink (only in idle)
  useEffect(() => {
    const interval = setInterval(() => {
      if (prevState.current === 'idle') {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 180);
      }
    }, 3200 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div
        className={`floating-mascot ${bouncing ? 'fm-bounce' : ''}`}
        style={S.container}
        aria-hidden="true"
        role="presentation"
      >
        <svg viewBox="0 0 72 72" width="72" height="72" style={{
          filter: `drop-shadow(0 3px 8px rgba(107,33,168,0.25))${expr.glow !== 'none' ? ` drop-shadow(${expr.glow.replace(/box-shadow:?\s*/,'')})` : ''}`,
          transition: 'filter 0.4s ease',
        }}>
          {/* Ambient glow ring */}
          <ellipse cx={36} cy={38} rx={34} ry={30} fill="none" stroke="rgba(168,85,247,0.12)" strokeWidth={4} className="fm-glow-pulse" />
          {/* Body — slimmer purple oval */}
          <ellipse cx={36} cy={38} rx={26} ry={28} fill="#a78bfa" />
          {/* Body highlight */}
          <ellipse cx={30} cy={30} rx={14} ry={12} fill="#c4b5fd" opacity={0.35} />
          {/* Belly */}
          <ellipse cx={36} cy={46} rx={14} ry={12} fill="#c4b5fd" opacity={0.3} />

          {/* Ears */}
          <circle cx={16} cy={16} r={8} fill="#a78bfa" />
          <circle cx={16} cy={16} r={5} fill="#c4b5fd" opacity={0.4} />
          <circle cx={56} cy={16} r={8} fill="#a78bfa" />
          <circle cx={56} cy={16} r={5} fill="#c4b5fd" opacity={0.4} />

          {/* Eyes — centered */}
          <EyeSVG cx={29} type={expr.eyes} blink={blinking} />
          <EyeSVG cx={43} type={expr.eyes} blink={blinking} />

          {/* Mouth — centered */}
          <MouthSVG type={expr.mouth} />

          {/* Cheek blush */}
          <circle cx={22} cy={36} r={4} fill="#f9a8d4" opacity={expr.blush} />
          <circle cx={50} cy={36} r={4} fill="#f9a8d4" opacity={expr.blush} />

          {/* Celebrate sparkles */}
          {(state === 'celebrate' || state === 'excited') && (
            <>
              <circle cx={8} cy={10} r={2} fill="#fbbf24" className="fm-sparkle" />
              <circle cx={64} cy={8} r={1.8} fill="#f472b6" className="fm-sparkle" style={{ animationDelay: '0.2s' }} />
              <circle cx={4} cy={44} r={1.5} fill="#60a5fa" className="fm-sparkle" style={{ animationDelay: '0.4s' }} />
              <circle cx={68} cy={42} r={1.5} fill="#4ade80" className="fm-sparkle" style={{ animationDelay: '0.3s' }} />
            </>
          )}
        </svg>

        {/* Tiny speech indicator for non-idle states */}
        {state !== 'idle' && (
          <div className="fm-bubble" style={S.bubble}>
            {state === 'happy' && '😊'}
            {state === 'excited' && '🤩'}
            {state === 'celebrate' && '🎉'}
            {state === 'laugh' && '😄'}
            {state === 'thinking' && '🤔'}
            {state === 'encourage' && '💪'}
          </div>
        )}
      </div>

      <style>{MASCOT_CSS}</style>
    </>
  );
};

/* ═══════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════ */

const S: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 35,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  bubble: {
    background: 'white',
    borderRadius: '12px',
    padding: '3px 8px',
    fontSize: '18px',
    lineHeight: 1,
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
};

/* ═══════════════════════════════════════════════════
   CSS ANIMATIONS
   ═══════════════════════════════════════════════════ */

const MASCOT_CSS = `
/* ── Idle breathing + gentle drift ─────── */
@keyframes fmBreathe {
  0%, 100% { transform: scaleY(1) translateY(0) translateX(0); }
  25%      { transform: scaleY(1.015) translateY(-1.5px) translateX(1px); }
  50%      { transform: scaleY(1.03) translateY(-2.5px) translateX(0); }
  75%      { transform: scaleY(1.015) translateY(-1.5px) translateX(-1px); }
}
.floating-mascot {
  animation: fmBreathe 3.5s ease-in-out infinite;
  transform-origin: bottom center;
  cursor: default;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ── Hover bounce (pointer-events enabled on SVG) ── */
.floating-mascot:hover {
  animation: fmHoverBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes fmHoverBounce {
  0%   { transform: translateY(0) scale(1); }
  40%  { transform: translateY(-8px) scale(1.08); }
  70%  { transform: translateY(-2px) scale(1.02); }
  100% { transform: translateY(-4px) scale(1.05); }
}

/* ── Bounce on state change ────────────── */
@keyframes fmBounce {
  0%   { transform: scale(1) translateY(0); }
  30%  { transform: scale(1.06) translateY(-5px); }
  55%  { transform: scale(0.98) translateY(1px); }
  80%  { transform: scale(1.02) translateY(-1.5px); }
  100% { transform: scale(1) translateY(0); }
}
.fm-bounce {
  animation: fmBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

/* ── Bubble pop-in ─────────────────────── */
@keyframes fmBubblePop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.fm-bubble {
  animation: fmBubblePop 0.3s ease both;
}

/* ── Celebrate sparkles ────────────────── */
@keyframes fmSparkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50%      { opacity: 1; transform: scale(1.5); }
}
.fm-sparkle {
  animation: fmSparkle 0.8s ease-in-out infinite;
}

/* ── Mobile: shift above bottom nav ────── */
@media (max-width: 1023px) {
  .floating-mascot {
    bottom: 76px !important;
  }
}

/* ── Ambient glow pulse ────────────────── */
@keyframes fmGlowPulse {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 0.6; }
}
.fm-glow-pulse {
  animation: fmGlowPulse 3.5s ease-in-out infinite;
}

/* ── Reduced motion ──────────────────── */
@media (prefers-reduced-motion: reduce) {
  .floating-mascot,
  .fm-bounce,
  .fm-bubble,
  .fm-sparkle,
  .fm-glow-pulse {
    animation: none !important;
  }
}
`;

export default React.memo(FloatingMascot);
