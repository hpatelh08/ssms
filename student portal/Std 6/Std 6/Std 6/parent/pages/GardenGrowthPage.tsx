/**
 * parent/pages/GardenGrowthPage.tsx
 * ─────────────────────────────────────────────────────
 * PREMIUM Garden Growth Analytics — Child Responsibility
 * & Engagement Tracker via the Learning Garden System.
 *
 * Color System:
 *   Primary text: #3B3FAF (deep indigo)
 *   Secondary: #6B6FCF
 *   Muted: #8F94D4
 *   NO black text anywhere.
 *
 * Sections:
 *  1. Page Header + Tree Status Card (circular progress, stage, XP)
 *  2. Garden Metrics Grid (6 cards, count-up, pastel gradients)
 *  3. Responsibility Analytics (score ring + 3 progress bars)
 *  4. Garden Activity Timeline (4 events, pastel markers)
 *  5. Garden Care Factors (animated bars + tooltips)
 *  6. Tree Evolution Visual (5-stage track with floating leaves)
 *
 * SVG-only charts. Framer Motion animations. No heavy libraries.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { parentAnalytics } from '../../data/parentAnalytics';

/* ── Derive rich UI structures from parentAnalytics ── */

const garden = parentAnalytics.garden;

const GARDEN_TREE_STATUS = {
  stage: garden.stage,
  stageEmoji: '🌱',
  overallGrowth: garden.growth,
  xpContribution: 120,
  nextStage: 'Sapling',
  nextStageThreshold: 70,
};

const GARDEN_METRICS = [
  { icon: '🌸', label: 'Flowers',              value: garden.flowers,     sub: 'Bloomed this month',    colorKey: 'rose'    as const },
  { icon: '🍎', label: 'Fruits',               value: garden.fruits,      sub: 'From perfect sessions', colorKey: 'amber'   as const },
  { icon: '🌰', label: 'Seeds Collected',      value: garden.seeds,       sub: 'From homework tasks',   colorKey: 'emerald' as const },
  { icon: '🪴', label: 'Growth Sessions',      value: garden.sessions,    sub: 'Garden interactions',   colorKey: 'cyan'    as const },
  { icon: '🍃', label: 'Leaf Density',         value: garden.leafDensity, sub: 'Tree canopy health',    colorKey: 'green'   as const, isPercent: true },
  { icon: '📅', label: 'Attendance Influence', value: 86,                sub: 'Days active this month', colorKey: 'indigo'  as const, isPercent: true },
];

const GARDEN_RESPONSIBILITY = {
  overall: garden.responsibilityScore,
  breakdown: [
    { label: 'Homework Completion', value: 82, color: '#6366F1' },
    { label: 'Game Participation',  value: 68, color: '#8B5CF6' },
    { label: 'Daily Practice',      value: 71, color: '#A78BFA' },
  ],
};

const TIMELINE_DECOR = [
  { icon: '💧', accent: '#3B82F6' },
  { icon: '🌸', accent: '#EC4899' },
  { icon: '🍎', accent: '#F59E0B' },
  { icon: '☀️', accent: '#10B981' },
];
const GARDEN_TIMELINE = garden.timeline.map((t, i) => {
  const d = TIMELINE_DECOR[i % TIMELINE_DECOR.length];
  return { day: t.day, icon: d.icon, text: t.event, accent: d.accent };
});

const GARDEN_CARE_FACTORS = [
  { icon: '💧', label: 'Water Level', sub: 'Homework',   value: garden.factors.water,     color: '#3B82F6', tooltip: 'Water Level increases when homework activities are completed.' },
  { icon: '☀️', label: 'Sunlight',    sub: 'Games',      value: garden.factors.sunlight,  color: '#F59E0B', tooltip: 'Sunlight grows with game participation and practice sessions.' },
  { icon: '😊', label: 'Happiness',   sub: 'Attendance', value: garden.factors.happiness, color: '#10B981', tooltip: 'Happiness rises with regular attendance and daily logins.' },
];

const GARDEN_TREE_STAGES = [
  { stage: 'Seed',    emoji: '🌰', threshold: 0  },
  { stage: 'Sprout',  emoji: '🌱', threshold: 20 },
  { stage: 'Sapling', emoji: '🌿', threshold: 70 },
  { stage: 'Tree',    emoji: '🌳', threshold: 85 },
  { stage: 'Blossom', emoji: '🌸', threshold: 95 },
];

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS  (matches OverviewPage / ProgressPage)
   ═══════════════════════════════════════════════════ */

const CLR = {
  primary:   '#3B3FAF',
  secondary: '#6B6FCF',
  muted:     '#8F94D4',
  soft:      '#A0AEC0',
  label:     '#8B95D6',
  purple:    '#7C3AED',
  indigo:    '#6366F1',
  mint:      '#10B981',
  sky:       '#38BDF8',
  peach:     '#FB923C',
  rose:      '#F472B6',
  cyan:      '#06B6D4',
  amber:     '#F59E0B',
  green:     '#22C55E',
};

const spring = { type: 'spring' as const, stiffness: 260, damping: 28 };

const PASTEL: Record<string, string> = {
  rose:    'linear-gradient(135deg, #FCE7F3 0%, #FDF2F8 50%, #FFF1F2 100%)',
  amber:   'linear-gradient(135deg, #FEF3C7 0%, #FFEDD5 50%, #FFF7ED 100%)',
  emerald: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 50%, #F0FDF4 100%)',
  cyan:    'linear-gradient(135deg, #CFFAFE 0%, #E0F2FE 50%, #ECFEFF 100%)',
  green:   'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 50%, #ECFDF5 100%)',
  indigo:  'linear-gradient(135deg, #EDE9FE 0%, #F3E8FF 50%, #FCE7F3 100%)',
  purple:  'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 50%, #E0E7FF 100%)',
};

const CLR_MAP: Record<string, string> = {
  rose: CLR.rose, amber: CLR.amber, emerald: CLR.mint, cyan: CLR.cyan,
  green: CLR.green, indigo: CLR.indigo, purple: CLR.purple,
};

/* ═══════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

/* ── Count-up ─────────────────────────────────── */

function useCountUp(target: number, duration = 800): number {
  const [val, setVal] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    if (diff === 0) return;
    const st = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - st) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(start + diff * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ── Glass Card ───────────────────────────────── */

const GlassCard: React.FC<{
  children: React.ReactNode; gradient?: string; delay?: number; style?: React.CSSProperties;
}> = ({ children, gradient, delay = 0, style }) => (
  <motion.div
    style={{
      background: gradient || 'rgba(255,255,255,0.70)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 22, padding: 24,
      border: '1px solid rgba(255,255,255,0.55)',
      boxShadow: '0 2px 16px rgba(92,106,196,0.06), 0 1px 3px rgba(92,106,196,0.03)',
      position: 'relative', overflow: 'hidden', ...style,
    }}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay }}
    whileHover={{ y: -2, boxShadow: '0 6px 28px rgba(92,106,196,0.10)' }}
  >
    {children}
  </motion.div>
);

/* ── Section Title ────────────────────────────── */

const SectionTitle: React.FC<{ icon?: string; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
    {icon && (
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(129,140,248,0.06))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>{icon}</div>
    )}
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: CLR.primary, lineHeight: '24px', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, fontWeight: 500, color: CLR.muted, marginTop: 2 }}>{subtitle}</p>}
    </div>
  </div>
);

/* ── Animated Circular Ring ───────────────────── */

const CircleRing: React.FC<{
  value: number; size?: number; strokeWidth?: number; color?: string; label?: string; id?: string;
}> = ({ value, size = 110, strokeWidth = 9, color = CLR.mint, label, id = 'grRing' }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  const anim = useCountUp(value);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}88`} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}12`} strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#${id})`} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column',
      }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: CLR.primary }}>{anim}%</span>
        {label && <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, marginTop: 2 }}>{label}</span>}
      </div>
    </div>
  );
};

/* ── Floating Particle ────────────────────────── */

const FloatingParticle: React.FC<{ delay: number; size: number; color: string; left: string; top: string }> = ({ delay: d, size, color, left, top }) => (
  <motion.div
    style={{
      position: 'absolute', width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color}30, transparent)`,
      left, top, pointerEvents: 'none', zIndex: 0,
    }}
    animate={{ y: [0, -12, 0], opacity: [0.4, 0.7, 0.4] }}
    transition={{ duration: 4 + d, repeat: Infinity, ease: 'easeInOut', delay: d }}
  />
);

/* ── Floating Leaves (background) ─────────────── */

const FloatingLeaf: React.FC<{ idx: number }> = ({ idx }) => {
  const leaves = ['🍃', '🌿', '☘️', '🍀'];
  const l = leaves[idx % leaves.length];
  const x = 10 + (idx * 23) % 80;
  const dur = 6 + (idx * 1.3) % 4;
  return (
    <motion.span
      style={{
        position: 'absolute', left: `${x}%`, top: '-8%',
        fontSize: 14 + idx * 2, opacity: 0, pointerEvents: 'none', zIndex: 0,
      }}
      animate={{ y: ['0vh', '110vh'], opacity: [0, 0.5, 0.3, 0], rotate: [0, 360] }}
      transition={{ duration: dur, repeat: Infinity, delay: idx * 1.8, ease: 'linear' }}
    >
      {l}
    </motion.span>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export const GardenGrowthPage: React.FC = () => {
  const ts = GARDEN_TREE_STATUS;
  const resp = GARDEN_RESPONSIBILITY;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40, position: 'relative' }}>

      {/* Background particles & leaves */}
      <FloatingParticle delay={0} size={80} color="#10B981" left="4%" top="2%" />
      <FloatingParticle delay={1.5} size={60} color="#A78BFA" left="88%" top="6%" />
      <FloatingParticle delay={2.3} size={50} color="#F59E0B" left="92%" top="48%" />
      <FloatingParticle delay={3.0} size={65} color="#EC4899" left="2%" top="55%" />
      {[0, 1, 2, 3, 4].map(i => <FloatingLeaf key={i} idx={i} />)}

      {/* ═══ PAGE HEADER ═══ */}
      <motion.div
        style={{ marginBottom: 28 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, color: CLR.primary, margin: 0, lineHeight: '34px' }}>
          Advanced Growth Analytics
        </h1>
        <p style={{ fontSize: 13, fontWeight: 500, color: CLR.muted, marginTop: 4 }}>
          Track responsibility and engagement progress.
        </p>
      </motion.div>

      {/* ═══ SECTION 1 — TREE STATUS CARD ═══ */}
      <GlassCard gradient="linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.04))" delay={0.05} style={{ marginBottom: 24 }}>
        <SectionTitle icon="🌱" title="Tree Status" subtitle="Evolution progress and garden health overview" />

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32, alignItems: 'center' }}>
          {/* Circle ring */}
          <div style={{ textAlign: 'center' }}>
            <CircleRing value={ts.overallGrowth} size={140} strokeWidth={11} color={CLR.mint} label="Overall Growth" id="grGrowth" />
          </div>

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Tree Stage */}
            <motion.div style={{
              background: 'rgba(255,255,255,0.60)', borderRadius: 16, padding: '16px 18px',
              border: '1px solid rgba(16,185,129,0.12)',
            }} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{ts.stageEmoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tree Stage</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 800, color: CLR.primary, margin: 0 }}>{ts.stage} Stage</p>
            </motion.div>

            {/* XP Contribution */}
            <motion.div style={{
              background: 'rgba(255,255,255,0.60)', borderRadius: 16, padding: '16px 18px',
              border: '1px solid rgba(124,58,237,0.12)',
            }} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>⚡</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>XP Contribution</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 800, color: CLR.purple, margin: 0 }}>{ts.xpContribution} XP</p>
              <p style={{ fontSize: 10, fontWeight: 500, color: CLR.soft, marginTop: 2 }}>From garden activities</p>
            </motion.div>

            {/* Next Stage full-width */}
            <motion.div style={{
              background: 'rgba(255,255,255,0.60)', borderRadius: 16, padding: '16px 18px',
              border: '1px solid rgba(245,158,11,0.12)', gridColumn: '1 / -1',
            }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.25 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase' }}>Next Stage</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: CLR.amber }}>{ts.nextStage} at {ts.nextStageThreshold}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(245,158,11,0.10)', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #F59E0B, #FBBF24)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(ts.overallGrowth / ts.nextStageThreshold) * 100}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.soft, marginTop: 6 }}>
                {ts.nextStageThreshold - ts.overallGrowth}% more growth needed to reach {ts.nextStage}
              </p>
            </motion.div>
          </div>
        </div>
      </GlassCard>

      {/* ═══ SECTION 2 — GARDEN METRICS GRID ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {GARDEN_METRICS.map((m, i) => {
          const accent = CLR_MAP[m.colorKey] || CLR.indigo;
          const bg = PASTEL[m.colorKey] || PASTEL.indigo;
          return (
            <MetricCard key={m.label} icon={m.icon} label={m.label} value={m.value}
              isPercent={'isPercent' in m && (m as any).isPercent === true} sub={m.sub} accent={accent} gradient={bg} delay={0.08 + i * 0.05} />
          );
        })}
      </div>

      {/* ═══ SECTION 3 — RESPONSIBILITY ANALYTICS ═══ */}
      <GlassCard gradient="linear-gradient(135deg, rgba(99,102,241,0.08), rgba(167,139,250,0.04))" delay={0.2} style={{ marginBottom: 24 }}>
        <SectionTitle icon="🎖️" title="Responsibility Analytics" subtitle="Composite score measuring homework, participation, and daily practice" />

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 36, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <CircleRing value={resp.overall} size={130} strokeWidth={10} color={CLR.indigo} label="Responsibility" id="grResp" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {resp.breakdown.map((b, i) => (
              <ResponsibilityBar key={b.label} label={b.label} value={b.value} color={b.color} delay={0.25 + i * 0.06} />
            ))}
          </div>
        </div>
      </GlassCard>

      {/* ═══ SECTION 4 — ACTIVITY TIMELINE ═══ */}
      <GlassCard delay={0.3} style={{ marginBottom: 24 }}>
        <SectionTitle icon="📖" title="Garden Activity Timeline" subtitle="Recent growth events this week" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', paddingLeft: 28 }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: 11, top: 6, bottom: 6, width: 2,
            background: 'linear-gradient(to bottom, rgba(99,102,241,0.15), rgba(167,139,250,0.05))',
            borderRadius: 1,
          }} />

          {GARDEN_TIMELINE.map((ev, i) => (
            <motion.div
              key={ev.day}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                padding: '14px 0', position: 'relative',
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.35 + i * 0.08 }}
            >
              {/* Marker dot */}
              <div style={{
                position: 'absolute', left: -23, top: 18, width: 14, height: 14, borderRadius: '50%',
                background: `linear-gradient(135deg, ${ev.accent}, ${ev.accent}88)`,
                border: '3px solid rgba(255,255,255,0.9)',
                boxShadow: `0 2px 8px ${ev.accent}30`,
                zIndex: 2,
              }} />

              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: `${ev.accent}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
              }}>
                {ev.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: CLR.primary, margin: 0 }}>{ev.day}</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: CLR.secondary, margin: 0, marginTop: 2, lineHeight: '18px' }}>{ev.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* ═══ SECTION 5 — GARDEN CARE FACTORS ═══ */}
      <GlassCard gradient="linear-gradient(135deg, rgba(56,189,248,0.06), rgba(16,185,129,0.04))" delay={0.35} style={{ marginBottom: 24 }}>
        <SectionTitle icon="🌤️" title="Garden Care Factors" subtitle="Each factor drives tree growth — all must be above 70% for stage upgrade" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {GARDEN_CARE_FACTORS.map((f, i) => (
            <CareFactorRow key={f.label} factor={f} delay={0.4 + i * 0.06} />
          ))}
        </div>
      </GlassCard>

      {/* ═══ SECTION 6 — TREE EVOLUTION VISUAL ═══ */}
      <GlassCard gradient="linear-gradient(135deg, rgba(16,185,129,0.06), rgba(52,211,153,0.03))" delay={0.45}>
        <SectionTitle icon="🌳" title="Tree Evolution Journey" subtitle="Visual progress from Seed to Blossom" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '8px 0' }}>
          {GARDEN_TREE_STAGES.map((s, i) => {
            const isActive = ts.overallGrowth >= s.threshold;
            const isCurrent = i < GARDEN_TREE_STAGES.length - 1
              ? ts.overallGrowth >= s.threshold && ts.overallGrowth < GARDEN_TREE_STAGES[i + 1].threshold
              : ts.overallGrowth >= s.threshold;
            return (
              <React.Fragment key={s.stage}>
                <motion.div
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative',
                    padding: '12px 18px', borderRadius: 18,
                    background: isCurrent ? 'rgba(16,185,129,0.10)' : 'transparent',
                    border: isCurrent ? '2px solid rgba(16,185,129,0.25)' : '2px solid transparent',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.5 + i * 0.08 }}
                  whileHover={{ y: -4 }}
                >
                  <motion.span
                    style={{ fontSize: 36, filter: isActive ? 'none' : 'grayscale(0.8) opacity(0.4)' }}
                    animate={isCurrent ? { y: [0, -4, 0] } : {}}
                    transition={isCurrent ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                  >
                    {s.emoji}
                  </motion.span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: isCurrent ? CLR.mint : isActive ? CLR.secondary : CLR.soft,
                  }}>
                    {s.stage}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: CLR.soft }}>{s.threshold}%</span>
                  {isCurrent && (
                    <motion.div
                      style={{
                        position: 'absolute', top: -6, right: -6, width: 14, height: 14, borderRadius: '50%',
                        background: CLR.mint, border: '2px solid white',
                        boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
                      }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Connector line */}
                {i < GARDEN_TREE_STAGES.length - 1 && (
                  <div style={{
                    width: 36, height: 3, borderRadius: 2,
                    background: isActive && ts.overallGrowth >= GARDEN_TREE_STAGES[i + 1].threshold
                      ? 'linear-gradient(90deg, #10B981, #34D399)'
                      : isActive
                        ? `linear-gradient(90deg, #10B981, ${CLR.soft}40)`
                        : `${CLR.soft}20`,
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </GlassCard>

      {/* Decorative fixed shapes */}
      <div style={{ position: 'fixed', bottom: 60, right: 20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.06), transparent)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '35%', left: 10, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05), transparent)', pointerEvents: 'none', zIndex: 0 }} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════ */

/* ── Metric Card (count-up, icon bounce) ──────── */

const MetricCard: React.FC<{
  icon: string; label: string; value: number; isPercent?: boolean;
  sub: string; accent: string; gradient: string; delay: number;
}> = ({ icon, label, value, isPercent, sub, accent, gradient, delay }) => {
  const anim = useCountUp(value);
  return (
    <motion.div
      style={{
        background: gradient, borderRadius: 18, padding: '18px 20px',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 2px 14px rgba(92,106,196,0.05)',
        position: 'relative', overflow: 'hidden',
      }}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring, delay }}
      whileHover={{ y: -3, scale: 1.02, boxShadow: '0 6px 24px rgba(92,106,196,0.10)' }}
    >
      <div style={{ position: 'absolute', top: -16, right: -16, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle, ${accent}15, transparent)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <motion.div
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            boxShadow: `0 2px 8px ${accent}18`,
          }}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: delay * 2 }}
        >
          {icon}
        </motion.div>
        <span style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, color: accent, margin: 0 }}>
        {anim}{isPercent ? '%' : ''}
      </p>
      <p style={{ fontSize: 10, fontWeight: 600, color: CLR.soft, marginTop: 3 }}>{sub}</p>
    </motion.div>
  );
};

/* ── Responsibility Bar ───────────────────────── */

const ResponsibilityBar: React.FC<{
  label: string; value: number; color: string; delay: number;
}> = ({ label, value, color, delay }) => {
  const anim = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring, delay }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: CLR.secondary }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{anim}%</span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: `${color}12`, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
        />
      </div>
    </motion.div>
  );
};

/* ── Care Factor Row (bar + tooltip) ──────────── */

const CareFactorRow: React.FC<{
  factor: { icon: string; label: string; sub: string; value: number; color: string; tooltip: string }; delay: number;
}> = ({ factor: f, delay }) => {
  const [showTip, setShowTip] = useState(false);
  const anim = useCountUp(f.value);

  return (
    <motion.div
      style={{ position: 'relative' }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring, delay }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: `${f.color}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
        }}>
          {f.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: CLR.primary }}>{f.label}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: CLR.soft, marginLeft: 8 }}>({f.sub})</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: f.color }}>{anim}%</span>
          </div>
        </div>
        {/* Info icon */}
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: `${f.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: f.color, fontWeight: 700, cursor: 'pointer',
        }}>
          ?
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 10, borderRadius: 5, background: `${f.color}10`, overflow: 'hidden', marginLeft: 48 }}>
        <motion.div
          style={{ height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${f.color}, ${f.color}88)` }}
          initial={{ width: 0 }}
          animate={{ width: `${f.value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
        />
      </div>

      {/* Tooltip */}
      {showTip && (
        <motion.div
          style={{
            position: 'absolute', top: -36, right: 0, zIndex: 10,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
            borderRadius: 12, padding: '8px 14px',
            border: '1px solid rgba(99,102,241,0.12)',
            boxShadow: '0 4px 16px rgba(92,106,196,0.12)',
            maxWidth: 280,
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <p style={{ fontSize: 11, fontWeight: 500, color: CLR.secondary, margin: 0, lineHeight: '16px' }}>
            {f.tooltip}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GardenGrowthPage;
