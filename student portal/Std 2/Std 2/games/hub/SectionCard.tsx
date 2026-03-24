/**
 * games/hub/SectionCard.tsx — Premium Animated World Card
 * ────────────────────────────────────────────────────────
 * Each card is a living, breathing portal to a learning universe.
 * Multi-layer depth: shadow layers, inner glow, floating icon,
 * sparkle particles, glassmorphism, micro-interaction.
 *
 * ⚠ Does NOT touch difficulty engine, curriculum, or backend.
 */

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';

/* ── CSS keyframes (injected once) ── */
const SC_KF_ID = 'sc-card-perf-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(SC_KF_ID)) {
  const s = document.createElement('style');
  s.id = SC_KF_ID;
  s.textContent = `
    @keyframes sc-icon-float { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-10px) } }
    @keyframes sc-sparkle { 0%,100%{ opacity:0; transform:scale(0) } 30%{ opacity:1; transform:scale(1) } 60%{ opacity:0.6; transform:scale(0.7) } 80%{ opacity:1; transform:scale(1) } }
    @keyframes sc-deco-bob { 0%,100%{ transform:translateY(0) } 35%{ transform:translateY(-6px) } 65%{ transform:translateY(6px) } }
    @keyframes sc-mascot-bob { 0%,100%{ transform:rotate(0) translateY(0) } 25%{ transform:rotate(8deg) translateY(-3px) } 75%{ transform:rotate(-8deg) translateY(0) } }
  `;
  document.head.appendChild(s);
}

export interface SectionCardProps {
  title: string;
  subtitle: string;
  icon: string;
  /** Primary warm gradient */
  gradient: string;
  /** Glow colour for ambient light */
  glowColor: string;
  /** Stagger delay index (0..3) */
  index: number;
  onClick: () => void;
  /** Decorative emojis floating around the card */
  decorations?: string[];
  /** Mascot emoji */
  mascot?: string;
}

/* ── Mini sparkle around the icon (CSS-only) ── */
const IconSparkle: React.FC<{ angle: number; dist: number; delay: number }> = ({ angle, dist, delay }) => {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * dist;
  const y = Math.sin(rad) * dist;
  return (
    <div
      style={{
        position: 'absolute',
        width: 6, height: 6,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 0 6px rgba(255,255,255,0.8)',
        pointerEvents: 'none',
        zIndex: 3,
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        animation: `sc-sparkle ${3.5 + delay}s ease-in-out ${1.2 + delay}s infinite`,
        willChange: 'opacity, transform',
      }}
    />
  );
};

/* ── Floating decoration emoji (CSS-only) ── */
const FloatingDeco: React.FC<{ emoji: string; idx: number }> = ({ emoji, idx }) => {
  const positions = [
    { left: '10%', top: '65%' },
    { right: '10%', top: '20%' },
    { left: '15%', top: '30%' },
    { right: '15%', bottom: '20%' },
  ];
  const pos = positions[idx % positions.length];
  return (
    <span
      style={{
        position: 'absolute',
        fontSize: 16,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.25,
        animation: `sc-deco-bob ${4 + idx * 0.7}s ease-in-out ${1.2 + idx * 0.2}s infinite`,
        willChange: 'transform',
        ...pos,
      }}
    >
      {emoji}
    </span>
  );
};

const SectionCard: React.FC<SectionCardProps> = ({
  title, subtitle, icon, gradient, glowColor, index, onClick,
  decorations = [], mascot,
}) => {
  /* sparkle ring around icon — reduced to 3 */
  const sparkles = useMemo(() =>
    Array.from({ length: 3 }, (_, i) => ({
      angle: i * 120 + Math.random() * 30,
      dist: 36 + Math.random() * 10,
      delay: i * 0.5,
    })),
  []);

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 + index * 0.08, duration: 0.25 }}
      whileHover={{ scale: 1.04, y: -6 }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: '100%',
        maxWidth: 300,
        aspectRatio: '3 / 4.2',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        perspective: 900,
        scrollSnapAlign: 'center',
      }}
    >
      {/* ── Layer 1: Ambient shadow (lightweight) ── */}
      <div style={{
        position: 'absolute', inset: 6, borderRadius: 30,
        boxShadow: `0 8px 32px ${glowColor}`,
        opacity: 0.5,
        zIndex: 0,
      }} />

      {/* ── Layer 2: Mid shadow ── */}
      <div style={{
        position: 'absolute', inset: 2, borderRadius: 28,
        boxShadow: `0 14px 44px ${glowColor}, 0 6px 20px rgba(0,0,0,0.08)`,
        zIndex: 0,
      }} />

      {/* ── Layer 3: Main card body ── */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 28,
        background: gradient,
        overflow: 'hidden',
        zIndex: 1,
      }}>
        {/* Inner gradient (warm light from top-left) */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 40%, transparent 70%)',
          borderRadius: 28,
          pointerEvents: 'none',
        }} />

        {/* Gloss arc */}
        <div style={{
          position: 'absolute', top: -30, left: -20, right: -20, height: '55%',
          background: 'radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.38) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Soft glow border (inner) */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 28,
          border: '2.5px solid rgba(255,255,255,0.50)',
          boxShadow: 'inset 0 2px 14px rgba(255,255,255,0.30), inset 0 -2px 8px rgba(0,0,0,0.05)',
          pointerEvents: 'none',
        }} />

        {/* Decorative floating emojis */}
        {decorations.map((d, i) => (
          <FloatingDeco key={i} emoji={d} idx={i} />
        ))}

        {/* ── Content ── */}
        <div style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100%',
          padding: '24px 16px',
          gap: 10,
          zIndex: 2,
        }}>
          {/* Floating icon with sparkles */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span
              style={{
                fontSize: 'clamp(56px, 8vw, 88px)',
                lineHeight: 1,
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.18))',
                zIndex: 2,
                animation: 'sc-icon-float 3s ease-in-out infinite',
                willChange: 'transform',
              }}
            >
              {icon}
            </span>
            {sparkles.map((sp, i) => (
              <IconSparkle key={i} {...sp} />
            ))}
          </div>

          {/* Title */}
          <span
            style={{
              fontSize: 'clamp(18px, 2.5vw, 28px)',
              fontWeight: 900,
              color: '#fff',
              textShadow: '0 2px 14px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.18)',
              textAlign: 'center',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </span>

          {/* Subtitle */}
          <span style={{
            fontSize: 'clamp(11px, 1.4vw, 16px)',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.90)',
            textAlign: 'center',
            textShadow: '0 1px 6px rgba(0,0,0,0.14)',
          }}>
            {subtitle}
          </span>

          {/* Mascot */}
          {mascot && (
            <span
              style={{
                fontSize: 28, position: 'absolute', bottom: 14, right: 18, opacity: 0.4,
                animation: 'sc-mascot-bob 4s ease-in-out infinite',
                willChange: 'transform',
              }}
            >
              {mascot}
            </span>
          )}
        </div>

        {/* Bottom gradient fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.14) 0%, transparent 100%)',
          borderRadius: '0 0 28px 28px',
          pointerEvents: 'none',
        }} />
      </div>
    </motion.button>
  );
};

export default React.memo(SectionCard);
