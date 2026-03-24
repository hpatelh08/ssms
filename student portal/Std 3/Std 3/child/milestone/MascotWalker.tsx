/**
 * child/milestone/MascotWalker.tsx
 * ─────────────────────────────────────────────────────
 * Fox Head Mascot — AAA mobile-game quality (80px)
 *
 * • 80px head SVG with soft glow ring + radial shadow
 * • Idle bounce animation (gentle float)
 * • Blink cycle every ~3s
 * • Small hop on arrival (isJumping)
 * • Continuous glide: position transition uses distance-proportional duration
 * • GPU-accelerated: will-change + translateZ(0)
 * • NEVER snaps back — position is always authoritative from parent
 */

import React, { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

export interface MascotProps {
  x: number;        // 0-100 percent from left
  y: number;        // px from map top
  direction: 'left' | 'right';
  isCelebrating?: boolean;
  isJumping?: boolean;
  /** True while mascot is animating between levels */
  isMoving?: boolean;
  /** Duration for the glide in ms — parent calculates based on distance */
  glideDuration?: number;
}

/* ═══════════════════════════════════════════════════
   FOX HEAD SVG — 72px with glow ring
   ═══════════════════════════════════════════════════ */

const FoxHeadSVG: React.FC<{ blink: boolean; glowing: boolean }> = memo(({ blink, glowing }) => (
  <svg
    width="240"
    height="240"
    viewBox="0 0 72 72"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      willChange: 'transform',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
    }}
  >
    <defs>
      <radialGradient id="fox-head-g" cx="36" cy="34" r="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fdba74" />
        <stop offset="100%" stopColor="#f97316" />
      </radialGradient>
    </defs>

    {/* ── Left ear ── */}
    <path d="M14 28 L8 6 L26 22Z" fill="#f97316" />
    <path d="M15 26 L11 10 L24 22Z" fill="#fde68a" />

    {/* ── Right ear ── */}
    <path d="M58 28 L64 6 L46 22Z" fill="#f97316" />
    <path d="M57 26 L61 10 L48 22Z" fill="#fde68a" />

    {/* ── Head shape ── */}
    <ellipse cx="36" cy="38" rx="24" ry="22" fill="url(#fox-head-g)" />

    {/* ── White cheek patches ── */}
    <ellipse cx="22" cy="42" rx="10" ry="9" fill="#fff7ed" />
    <ellipse cx="50" cy="42" rx="10" ry="9" fill="#fff7ed" />

    {/* ── Chin / muzzle ── */}
    <ellipse cx="36" cy="46" rx="12" ry="10" fill="#fff7ed" />

    {/* ── Eyes ── */}
    <ellipse cx="26" cy="34" rx="4.5" ry={blink ? 0.6 : 5} fill="white" />
    {!blink && <circle cx="27.5" cy="33" r="2.8" fill="#1c1917" />}
    {!blink && <circle cx="28.5" cy="31.5" r="1.1" fill="white" />}

    <ellipse cx="46" cy="34" rx="4.5" ry={blink ? 0.6 : 5} fill="white" />
    {!blink && <circle cx="47.5" cy="33" r="2.8" fill="#1c1917" />}
    {!blink && <circle cx="48.5" cy="31.5" r="1.1" fill="white" />}

    {/* ── Nose ── */}
    <ellipse cx="36" cy="40" rx="3.5" ry="2.5" fill="#1c1917" />
    <ellipse cx="35" cy="39.2" rx="1.2" ry="0.7" fill="white" opacity="0.4" />

    {/* ── Mouth ── */}
    <path d="M32 43 Q36 48 40 43" stroke="#92400e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    <path d="M36 40.5 L36 44" stroke="#92400e" strokeWidth="1" strokeLinecap="round" />

    {/* ── Blush spots ── */}
    <circle cx="18" cy="40" r="3.5" fill="#fda4af" opacity="0.35" />
    <circle cx="54" cy="40" r="3.5" fill="#fda4af" opacity="0.35" />

    {/* ── Whiskers ── */}
    <line x1="12" y1="38" x2="22" y2="40" stroke="#d4d4d4" strokeWidth="0.6" />
    <line x1="12" y1="42" x2="22" y2="42" stroke="#d4d4d4" strokeWidth="0.6" />
    <line x1="60" y1="38" x2="50" y2="40" stroke="#d4d4d4" strokeWidth="0.6" />
    <line x1="60" y1="42" x2="50" y2="42" stroke="#d4d4d4" strokeWidth="0.6" />
  </svg>
));
FoxHeadSVG.displayName = 'FoxHeadSVG';

/* ═══════════════════════════════════════════════════
   GLOW RING — pulsing ring behind the fox head
   ═══════════════════════════════════════════════════ */

const GlowRing: React.FC<{ isMoving: boolean }> = memo(({ isMoving }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: 280,
      height: 280,
      top: -20,
      left: '50%',
      marginLeft: -140,
      background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(249,115,22,0.04) 50%, transparent 70%)',
      willChange: 'transform, opacity',
      transform: 'translateZ(0)',
      animation: `ring-pulse ${isMoving ? '0.8' : '2.5'}s ease-in-out infinite`,
    }}
  />
));
GlowRing.displayName = 'GlowRing';

/* ═══════════════════════════════════════════════════
   TRAIL SPARKLES — only while moving
   ═══════════════════════════════════════════════════ */

const TrailSparkles: React.FC = memo(() => (
  <>
    {[0, 1, 2].map(i => (
      <motion.span
        key={`trail-${i}`}
        className="absolute text-xs pointer-events-none select-none"
        style={{ left: `${40 + i * 10}%`, bottom: -2 }}
        initial={{ opacity: 0, y: 0, scale: 0 }}
        animate={{
          opacity: [0, 0.8, 0],
          y: [0, 12 + i * 6],
          scale: [0, 1, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 0.6,
          delay: i * 0.15,
          ease: 'easeOut',
        }}
      >
        ✨
      </motion.span>
    ))}
  </>
));
TrailSparkles.displayName = 'TrailSparkles';

/* ═══════════════════════════════════════════════════
   MAIN MASCOT COMPONENT
   ═══════════════════════════════════════════════════ */

const GLIDE_EASE = [0.22, 1, 0.36, 1] as const;

const MascotWalker: React.FC<MascotProps> = ({
  x, y, direction, isCelebrating, isJumping, isMoving, glideDuration = 1000,
}) => {
  /* ── Blink cycle ── */
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3000 + Math.random() * 1000);
    return () => clearInterval(iv);
  }, []);

  /* ── Derive animation state ── */
  const animState = isCelebrating
    ? 'celebrate'
    : isJumping
      ? 'hop'
      : isMoving
        ? 'moving'
        : 'idle';

  /* ── Continuous glide transition (duration from parent) ── */
  const glideSec = Math.max(0.4, glideDuration / 1000);

  return (
    <motion.div
      className="absolute z-40 pointer-events-none select-none"
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
      initial={false}
      animate={{
        left: `${x}%`,
        top: y - 250,
      }}
      transition={{
        duration: isMoving ? glideSec : 0.5,
        ease: GLIDE_EASE,
      }}
    >
      <div style={{ transform: 'translateX(-50%)' }} className="relative">

        {/* ── Glow ring ── */}
        <GlowRing isMoving={!!isMoving} />

        {/* ── Fox head with animation states ── */}
        <motion.div
          style={{
            scaleX: direction === 'left' ? -1 : 1,
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
          animate={
            animState === 'celebrate'
              ? {
                  y: [0, -32, 0, -20, 0, -10, 0],
                  rotate: [0, 20, -20, 14, -14, 6, 0],
                  scale: [1, 1.2, 0.95, 1.15, 0.97, 1.06, 1],
                }
              : animState === 'hop'
                ? {
                    y: [0, -24, 0],
                    scaleY: [1, 1.1, 0.9, 1],
                    scaleX: [1, 0.92, 1.06, 1],
                  }
                : animState === 'moving'
                  ? {
                      y: [0, -8, 0],
                      rotate: [0, -5, 0, 5, 0],
                      scaleY: [1, 1.03, 0.98, 1],
                    }
                  : {
                      /* idle: gentle float & breathe */
                      y: [0, -6, 0],
                      scale: [1, 1.03, 1],
                    }
          }
          transition={{
            repeat: animState === 'hop' ? 0 : Infinity,
            duration:
              animState === 'celebrate' ? 0.8
                : animState === 'hop' ? 0.45
                : animState === 'moving' ? 0.5
                : 2.5,
            ease: GLIDE_EASE,
          }}
        >
          <FoxHeadSVG blink={blink} glowing={!!isMoving || !!isCelebrating} />
        </motion.div>

        {/* ── Trail sparkles while moving ── */}
        <AnimatePresence>
          {isMoving && <TrailSparkles />}
        </AnimatePresence>

        {/* ── Celebration burst ── */}
        <AnimatePresence>
          {isCelebrating && (
            <>
              {[0, 1, 2, 3, 4, 5].map(i => {
                const angle = (i / 6) * Math.PI * 2;
                return (
                  <motion.span
                    key={`burst-${i}`}
                    className="absolute text-sm pointer-events-none"
                    style={{ left: '50%', top: '40%' }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                      x: Math.cos(angle) * 48,
                      y: Math.sin(angle) * 48,
                      opacity: [1, 1, 0],
                      scale: [0, 1.3, 0],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08 }}
                  >
                    {['⭐', '✨', '💫', '🌟', '🎉', '💎'][i]}
                  </motion.span>
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* ── Soft circular shadow ── */}
        <motion.div
          className="mx-auto rounded-full"
          style={{
            width: 160,
            height: 24,
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%)',
            marginTop: 4,
            willChange: 'transform',
          }}
          animate={{
            scaleX: animState === 'hop' ? [1, 0.5, 1.15, 1] : animState === 'celebrate' ? [1, 0.5, 1] : animState === 'moving' ? [1, 0.85, 1] : [1, 0.95, 1],
            opacity: animState === 'hop' ? [0.15, 0.06, 0.18, 0.15] : [0.15, 0.12, 0.15],
          }}
          transition={{
            repeat: Infinity,
            duration: animState === 'hop' ? 0.45 : animState === 'moving' ? 0.5 : 2.5,
          }}
        />

        {/* ── Name badge ── */}
        <motion.div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-2.5 py-0.5 border border-orange-200/50"
          style={{ boxShadow: '0 2px 8px rgba(249,115,22,0.12)' }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <span className="text-[8px] font-black text-orange-700 whitespace-nowrap tracking-wide">
            🦊 SPARK
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default memo(MascotWalker);
