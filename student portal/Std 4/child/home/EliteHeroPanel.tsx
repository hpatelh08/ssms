/**
 * child/home/EliteHeroPanel.tsx
 * ─────────────────────────────────────────────────────
 * Premium Layered Identity Panel — 3-column hero.
 *
 * LEFT  (40 %): Avatar (glowing halo) + greeting + bold name + highlight bar
 * CENTER(30 %): Motivation block + quick-stat chips + weekly streak bar
 * RIGHT (30 %): XP Ring (18 px stroke, gradient, animated draw, breathing)
 *
 * Rich gradient background · borderRadius 36 px
 * Structurally filled layout with large KPIs
 * Shadow: 0 25px 70px rgba(99,91,255,0.30) → card looks lifted.
 *
 * Performance: transform + opacity ONLY. No blur. 60 fps. React.memo.
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useXP } from '../XPProvider';

/* ── Design tokens (light-on-dark palette) ──────── */

const T = {
  heading: '#ffffff',
  primary: '#c4b5fd',
  primarySoft: '#ddd6fe',
  ring: '#ffffff',
  secondary: '#fbbf24',
  success: '#34d399',
  warning: '#fbbf24',
  textSub: 'rgba(255,255,255,0.75)',
  textBody: 'rgba(255,255,255,0.65)',
  greetingBg: 'rgba(255,255,255,0.18)',
  greetingText: '#ffffff',
} as const;

/* ── Motivational messages (rotate every 6 s) ───── */

const MOTIV = [
  "You're on fire today 🔥",
  'Every step counts ⭐',
  'Keep growing stronger 🌱',
  'Stars never stop! 🌟',
  'Your brain is glowing! 💡',
  "Today is YOUR day 🚀",
  'Learning is magic 🦸',
  'Adventure awaits! 🗺️',
];

/* ── Level title ─────────────────────────────────── */

function getLevelTitle(lv: number): string {
  if (lv >= 20) return 'Grand Master';
  if (lv >= 15) return 'Champion';
  if (lv >= 10) return 'Explorer';
  if (lv >= 5) return 'Adventurer';
  return 'Rising Star';
}

/* ── Count-up hook ───────────────────────────────── */

function useCountUp(target: number, duration = 950): number {
  const [v, setV] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setV(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return v;
}

/* ── Rotating motivation hook ────────────────────── */

function useRotatingText(items: string[], ms = 6000) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % items.length), ms);
    return () => clearInterval(id);
  }, [items.length, ms]);
  return { text: items[idx], key: idx };
}

/* ── Greeting ────────────────────────────────────── */

function getGreetingData() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', icon: '🌤️' };
  return { text: 'Good Evening', icon: '🌙' };
}

/* ── Weekly streak bar (7-day demo) ──────────────── */

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getWeekActivity(): number[] {
  try {
    const raw = localStorage.getItem('ssms_week_activity');
    if (raw) return JSON.parse(raw) as number[];
  } catch { /* */ }
  return [1, 1, 0, 1, 1, 0, 1];
}

/* ══════════════════════════════════════════════════
   XP RING — Premium 18 px stroke, gradient, glow aura
   ══════════════════════════════════════════════════ */

const RING_SIZE = 140;
const RING_STROKE = 18;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

interface XPRingProps { pct: number; displayXP: number; xpToNext: number; justGained: boolean; }

const XPRing: React.FC<XPRingProps> = React.memo(({ pct, displayXP, xpToNext, justGained }) => {
  const offset = RING_CIRC * (1 - pct / 100);

  return (
    <div className="relative flex items-center justify-center"
      style={{ width: RING_SIZE + 30, height: RING_SIZE + 30 }}>

      {/* Glowing aura behind ring */}
      <div style={{
        position: 'absolute', inset: -14,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Breathing wrapper */}
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        style={{ willChange: 'transform' }}
      >
        <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
            fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={RING_STROKE}
          />
          <motion.circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
            fill="none" strokeWidth={RING_STROKE} strokeLinecap="round"
            stroke="url(#heroRingGrad)"
            strokeDasharray={RING_CIRC}
            initial={{ strokeDashoffset: RING_CIRC }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.3, ease: 'easeOut', delay: 0.4 }}
          />
          <defs>
            <linearGradient id="heroRingGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fcd34d" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Center value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          style={{ fontSize: 34, fontWeight: 900, color: '#ffffff', lineHeight: 1 }}
          key={displayXP}
          initial={{ opacity: 0.5, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          {displayXP}
        </motion.span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
          / {xpToNext} XP
        </span>
      </div>

      {/* Level-up Star Burst */}
      <AnimatePresence>
        {justGained && (
          <>
            {Array.from({ length: 6 }, (_, i) => {
              const angle = (i * 60) * Math.PI / 180;
              const dist = 48 + (i % 2) * 14;
              return (
                <motion.div
                  key={`star-${i}`}
                  style={{
                    position: 'absolute', top: '50%', left: '50%',
                    fontSize: 13, pointerEvents: 'none',
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: [1, 1, 0],
                    scale: [0, 1.3, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65, delay: i * 0.04, ease: 'easeOut' }}
                >⭐</motion.div>
              );
            })}
            <motion.div
              style={{
                position: 'absolute', inset: -8,
                borderRadius: '50%',
                border: '2.5px solid rgba(255,255,255,0.35)',
                pointerEvents: 'none',
              }}
              initial={{ scale: 0.85, opacity: 0.8 }}
              animate={{ scale: 1.22, opacity: 0 }}
              transition={{ duration: 0.65 }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
XPRing.displayName = 'XPRing';

/* ══════════════════════════════════════════════════
   STAT CHIP — large rounded chip for visible KPIs
   ══════════════════════════════════════════════════ */

const StatChip: React.FC<{ icon: string; val: string | number; color: string; delay: number }> = React.memo(
  ({ icon, val, color, delay }) => (
    <motion.div
      className="flex items-center gap-1.5"
      style={{
        padding: '8px 16px', borderRadius: 14,
        background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)',
        cursor: 'default',
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{val}</span>
    </motion.div>
  ),
);
StatChip.displayName = 'StatChip';

/* ══════════════════════════════════════════════════
   FLOATING BLOB — slow float (transform only)
   ══════════════════════════════════════════════════ */

const FloatingBlob: React.FC<{
  size: number; top?: string; bottom?: string; left?: string; right?: string;
  color: string; xRange: number; yRange: number; dur: number;
}> = React.memo(({ size, top, bottom, left, right, color, xRange, yRange, dur }) => (
  <motion.div
    style={{
      position: 'absolute', top, bottom, left, right,
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color}, transparent 65%)`,
      pointerEvents: 'none', willChange: 'transform',
    }}
    animate={{ x: [-xRange, xRange, -xRange], y: [-yRange, yRange, -yRange] }}
    transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
  />
));
FloatingBlob.displayName = 'FloatingBlob';

/* ══════════════════════════════════════════════════
   MICRO DOT — tiny particle, opacity pulse
   ══════════════════════════════════════════════════ */

const DOTS = [
  { top: '14%', left: '5%', size: 6, color: '#fbbf24', dur: 5.5, delay: 0 },
  { top: '70%', right: '6%', size: 5, color: '#34d399', dur: 6, delay: 1.8 },
  { bottom: '20%', left: '54%', size: 4.5, color: '#f472b6', dur: 5, delay: 3 },
];

const MicroDot: React.FC<typeof DOTS[0]> = React.memo(
  ({ top, left, right, bottom, size, color, dur, delay }) => (
    <motion.div
      style={{
        position: 'absolute', top, left, right, bottom,
        width: size, height: size, borderRadius: '50%',
        background: color, pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
      animate={{ opacity: [0.35, 0.8, 0.35], y: [0, -8, 0], scale: [1, 1.3, 1] }}
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  ),
);
MicroDot.displayName = 'MicroDot';

/* ══════════════════════════════════════════════════
   MAIN HERO COMPONENT
   ══════════════════════════════════════════════════ */

interface EliteHeroPanelProps {
  studentName?: string;
  streak?: number;
  badges?: { id: string; name: string; icon: string }[];
}

export const EliteHeroPanel: React.FC<EliteHeroPanelProps> = React.memo(({
  studentName = 'Explorer',
  streak = 0,
  badges = [],
}) => {
  const { state, justGained } = useXP();
  const displayXP = useCountUp(state.xp);
  const pct = Math.min(state.xp / state.xpToNext, 1) * 100;
  const { text: greetText, icon: greetIcon } = useMemo(getGreetingData, []);
  const motiv = useRotatingText(MOTIV, 6000);
  const levelTitle = useMemo(() => getLevelTitle(state.level), [state.level]);
  const weekDays = useMemo(getWeekActivity, []);
  const activeDays = useMemo(() => weekDays.filter(Boolean).length, [weekDays]);

  /* ── 3D micro-tilt (desktop) ────────────────────── */
  const containerRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useTransform(my, [-1, 1], [2, -2]);
  const rotY = useTransform(mx, [-1, 1], [-2, 2]);
  const [isMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile || !containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }, [isMobile, mx, my]);

  const handleMouseLeave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);

  /* ── Avatar click bounce ────────────────────────── */
  const [avatarBounce, setAvatarBounce] = useState(false);
  const handleAvatarClick = useCallback(() => {
    setAvatarBounce(true);
    setTimeout(() => setAvatarBounce(false), 300);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="elite-hero-panel relative overflow-hidden w-full"
      style={{
        borderRadius: 36,
        padding: '30px 38px',
        minHeight: 300,
        /* ── Rich gradient background ──────────────── */
        background: `
          radial-gradient(circle at 80% 60%, rgba(255,255,255,0.10), transparent 40%),
          radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08), transparent 40%),
          radial-gradient(circle at 50% 100%, rgba(139,92,246,0.30), transparent 50%),
          linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)
        `,
        boxShadow: '0 25px 70px rgba(99, 91, 255, 0.30), 0 8px 24px rgba(99,61,255,0.15)',
        border: '1px solid rgba(255,255,255,0.12)',
        perspective: 1000,
        willChange: 'transform',
      }}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 140, damping: 18 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D tilt ghost layer */}
      <motion.div style={{
        position: 'absolute', inset: 0, borderRadius: 36,
        rotateX: isMobile ? 0 : rotX, rotateY: isMobile ? 0 : rotY,
        transformStyle: 'preserve-3d', pointerEvents: 'none',
      }} />

      {/* ═══ LAYER 2: Animated Radial Glow Blobs ═══ */}
      <FloatingBlob size={280} top="-38%" right="-14%"
        color="rgba(255,255,255,0.06)" xRange={16} yRange={12} dur={10}
      />
      <FloatingBlob size={220} bottom="-32%" left="-10%"
        color="rgba(255,255,255,0.05)" xRange={14} yRange={16} dur={8}
      />

      {/* ═══ LAYER 3: Micro Particles ═══ */}
      {DOTS.map((d, i) => <MicroDot key={i} {...d} />)}

      {/* Top highlight edge */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2.5,
        borderRadius: '36px 36px 0 0',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.25), rgba(255,255,255,0.15), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Shimmer sweep — once on load */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 36, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="elite-hero-shimmer" />
      </div>

      {/* ═══ 3-COLUMN GRID ═══════════════════════ */}
      <div className="relative z-10" style={{
        display: 'grid',
        gridTemplateColumns: '40% 30% 30%',
        alignItems: 'center',
        gap: 16,
        minHeight: 230,
      }}>

        {/* ── LEFT: Identity (40 %) ──────────────── */}
        <div className="flex flex-col gap-3 min-w-0">

          {/* Avatar + name flex group */}
          <div className="flex items-center gap-4">
            {/* Avatar with glowing halo */}
            <motion.div
              className="flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                width: 84, height: 84,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.08))',
                boxShadow:
                  '0 0 0 6px rgba(255,255,255,0.18), 0 10px 25px rgba(99, 91, 255, 0.30)',
                willChange: 'transform',
              }}
              animate={
                avatarBounce
                  ? { scale: [1, 0.86, 1.1, 1], transition: { duration: 0.3 } }
                  : { scale: [1, 1.04, 1], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }
              }
              whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
              onClick={handleAvatarClick}
            >
              <span style={{ fontSize: 42 }}>🦊</span>
            </motion.div>

            <div className="min-w-0 flex-1">
              {/* Greeting pill — slide in */}
              <motion.div
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: T.greetingBg, color: T.greetingText,
                  fontSize: 15, fontWeight: 700, padding: '6px 16px',
                  borderRadius: 20, letterSpacing: '0.3px', lineHeight: 1.3,
                }}>
                  {greetText}
                  <motion.span
                    style={{ fontSize: 17, display: 'inline-block' }}
                    initial={{ rotate: -30, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
                  >{greetIcon}</motion.span>
                </span>
              </motion.div>

              {/* Bold name with highlight bar */}
              <h1 style={{
                fontSize: 36, fontWeight: 900, letterSpacing: '0.5px',
                lineHeight: 1.2, margin: '8px 0 0', color: T.heading,
                position: 'relative', display: 'inline-block',
              }}>
                {studentName}
                {/* Frosted highlight background bar */}
                <motion.span
                  style={{
                    position: 'absolute', bottom: 0, left: -4, right: -4,
                    height: '40%',
                    background: 'rgba(255,255,255,0.18)',
                    borderRadius: 12,
                    transformOrigin: 'left center',
                    zIndex: -1,
                    padding: '2px 8px',
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </h1>
            </div>
          </div>

          {/* Level badge */}
          <motion.span
            className="inline-block"
            style={{
              fontSize: 14, fontWeight: 800, color: '#ffffff',
              background: 'rgba(255,255,255,0.15)',
              padding: '7px 18px', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.20)',
              alignSelf: 'flex-start',
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.35 }}
          >
            ⚡ Lv {state.level} · {levelTitle}
          </motion.span>
        </div>

        {/* ── CENTER: Motivation + Activity (30 %) ── */}
        <div className="flex flex-col items-center justify-center gap-3 min-w-0">

          {/* Block 1 — Rotating motivation */}
          <div style={{
            minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '8px 14px', borderRadius: 16,
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={motiv.key}
                style={{
                  fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.95)',
                  textAlign: 'center', lineHeight: 1.4, margin: 0, maxWidth: 190,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                {motiv.text}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Block 2 — Quick stats chips (large KPIs) */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <StatChip icon="🔥" val={streak > 0 ? streak : 0} color={T.warning} delay={0.5} />
            <StatChip icon="🎖️" val={badges.length} color="#f472b6" delay={0.6} />
            <StatChip icon="📅" val={`${activeDays}d`} color={T.success} delay={0.7} />
          </div>

          {/* Block 3 — 7-day streak bar */}
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {weekDays.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: active
                    ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                    : 'rgba(255,255,255,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.3s',
                }}>
                  {active ? (
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
                  ) : null}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{WEEK_DAYS[i]}</span>
              </div>
            ))}
          </motion.div>

          {/* Sync indicator */}
          <motion.div
            className="flex items-center gap-1.5"
            style={{
              height: 30, padding: '0 14px', borderRadius: 15,
              background: 'rgba(52,211,153,0.15)',
              border: '1px solid rgba(52,211,153,0.25)',
              cursor: 'default',
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.3 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: T.success,
              animation: 'eliteSyncPulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.success }}>Parent Synced ✓</span>
          </motion.div>
        </div>

        {/* ── RIGHT: XP Ring + Performance (30 %) ── */}
        <div className="flex flex-col items-center justify-center gap-2">
          <XPRing pct={pct} displayXP={displayXP} xpToNext={state.xpToNext} justGained={justGained} />

          <span style={{
            fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.6px', textTransform: 'uppercase', marginTop: 2,
          }}>
            Experience
          </span>

          <AnimatePresence>
            {justGained && (
              <motion.span
                style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}
                initial={{ opacity: 0, y: 4, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                +XP!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

EliteHeroPanel.displayName = 'EliteHeroPanel';
