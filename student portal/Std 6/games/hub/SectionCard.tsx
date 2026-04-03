/**
 * games/hub/SectionCard.tsx - Water portal world card
 * ---------------------------------------------------
 * Glassy underwater cards with bubble motion and a
 * frosted caption panel for strong readability.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const SC_KF_ID = 'section-card-water-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(SC_KF_ID)) {
  const style = document.createElement('style');
  style.id = SC_KF_ID;
  style.textContent = `
    @keyframes sc-icon-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes sc-bubble {
      0%, 100% { opacity: 0; transform: scale(0.72) translateY(4px); }
      30% { opacity: 0.92; transform: scale(1) translateY(-2px); }
      70% { opacity: 0.42; transform: scale(0.88) translateY(-10px); }
    }
    @keyframes sc-deco-bob {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50% { transform: translate3d(0, -8px, 0); }
    }
    @keyframes sc-mascot-drift {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      50% { transform: rotate(6deg) translateY(-4px); }
    }
    @keyframes sc-wave-sway {
      0%, 100% { transform: translateX(-4%); }
      50% { transform: translateX(4%); }
    }
  `;
  document.head.appendChild(style);
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
}

const IconBubble: React.FC<{ angle: number; distance: number; delay: number }> = ({
  angle,
  distance,
  delay,
}) => {
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) * distance;
  const y = Math.sin(radians) * distance;

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        width: 10,
        height: 10,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.72)',
        background:
          'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 38%, transparent 100%)',
        boxShadow: '0 0 10px rgba(255,255,255,0.3)',
        pointerEvents: 'none',
        zIndex: 3,
        animation: `sc-bubble ${3.4 + delay}s ease-in-out ${1 + delay}s infinite`,
        willChange: 'transform, opacity',
      }}
    />
  );
};

const FloatingDeco: React.FC<{ emoji: string; index: number }> = ({ emoji, index }) => {
  const positions = [
    { left: '10%', top: '16%' },
    { right: '12%', top: '22%' },
    { left: '12%', bottom: '28%' },
    { right: '14%', bottom: '16%' },
  ];
  const position = positions[index % positions.length];

  return (
    <span
      style={{
        position: 'absolute',
        fontSize: 16,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.22,
        animation: `sc-deco-bob ${4.8 + index * 0.7}s ease-in-out ${1 + index * 0.2}s infinite`,
        willChange: 'transform',
        ...position,
      }}
    >
      {emoji}
    </span>
  );
};

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
}) => {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 4 }, (_, bubbleIndex) => ({
        angle: bubbleIndex * 90 + Math.random() * 18,
        distance: 36 + Math.random() * 10,
        delay: bubbleIndex * 0.35,
      })),
    [],
  );

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.08, duration: 0.35 }}
      whileHover={{ scale: 1.03, y: -8 }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: '100%',
        minWidth: 0,
        aspectRatio: '3 / 4.15',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 8,
          borderRadius: 30,
          boxShadow: `0 20px 40px ${glowColor}`,
          opacity: 0.62,
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 30,
          background: gradient,
          overflow: 'hidden',
          zIndex: 1,
          boxShadow: `0 20px 42px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.18)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 38%, transparent 72%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: -36,
            left: -20,
            right: -20,
            height: '56%',
            background:
              'radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 48%, transparent 72%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '-8%',
            right: '-8%',
            bottom: '-14%',
            height: '42%',
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 48%, transparent 76%)',
            animation: 'sc-wave-sway 9s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 30,
            border: '1.6px solid rgba(255,255,255,0.5)',
            boxShadow:
              'inset 0 1px 18px rgba(255,255,255,0.22), inset 0 -8px 22px rgba(3, 35, 74, 0.08)',
            pointerEvents: 'none',
          }}
        />

        {decorations.map((deco, decoIndex) => (
          <FloatingDeco key={`${deco}-${decoIndex}`} emoji={deco} index={decoIndex} />
        ))}

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            padding: '20px 18px 18px',
            gap: 16,
          }}
        >
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '7px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.34)',
              color: 'rgba(242,250,255,0.95)',
              fontSize: 'clamp(10px, 1.1vw, 12px)',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: '0 8px 20px rgba(5, 37, 72, 0.08)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            Dive In
          </span>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'clamp(88px, 10vw, 108px)',
              height: 'clamp(88px, 10vw, 108px)',
              borderRadius: 30,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.1) 100%)',
              border: '1px solid rgba(255,255,255,0.42)',
              boxShadow:
                '0 16px 28px rgba(5, 44, 84, 0.1), inset 0 1px 12px rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {icon.endsWith('.png') || icon.endsWith('.svg') ? (
              <img
                src={icon}
                alt={title}
                style={{
                  width: 'clamp(54px, 7vw, 74px)',
                  height: 'clamp(54px, 7vw, 74px)',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.18))',
                  animation: 'sc-icon-float 3s ease-in-out infinite',
                  willChange: 'transform',
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: 'clamp(52px, 7vw, 72px)',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.18))',
                  animation: 'sc-icon-float 3s ease-in-out infinite',
                  willChange: 'transform',
                }}
              >
                {icon}
              </span>
            )}
            {bubbles.map((bubble, bubbleIndex) => (
              <IconBubble key={bubbleIndex} angle={bubble.angle} distance={bubble.distance} delay={bubble.delay} />
            ))}
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '16px 14px 14px',
              borderRadius: 24,
              background:
                'linear-gradient(180deg, rgba(7,42,78,0.22) 0%, rgba(7,42,78,0.1) 100%)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <span
              style={{
                fontSize: 'clamp(19px, 2.3vw, 29px)',
                fontWeight: 900,
                color: '#ffffff',
                textShadow: '0 4px 18px rgba(0,0,0,0.18)',
                textAlign: 'center',
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </span>

            <span
              style={{
                fontSize: 'clamp(11px, 1.4vw, 15px)',
                fontWeight: 700,
                color: 'rgba(243,251,255,0.9)',
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 14px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.28)',
                color: 'rgba(248,253,255,0.96)',
                fontSize: 'clamp(10px, 1.1vw, 12px)',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Tap to Explore
            </span>
          </div>

          {mascot && (
            <span
              style={{
                fontSize: 28,
                position: 'absolute',
                bottom: 18,
                right: 18,
                opacity: 0.38,
                animation: 'sc-mascot-drift 4.2s ease-in-out infinite',
                willChange: 'transform',
              }}
            >
              {mascot}
            </span>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 48%, rgba(4, 40, 74, 0.18) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </motion.button>
  );
};

export default React.memo(SectionCard);
