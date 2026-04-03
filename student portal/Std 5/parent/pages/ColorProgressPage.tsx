/**
 * parent/pages/ColorProgressPage.tsx
 * ─────────────────────────────────────────────────────
 * PREMIUM Cognitive Learning Analytics — Color & Shape
 * recognition performance, skill progression, AI insights.
 *
 * Sections:
 *  1. Page Header
 *  2. Color Learning Summary (5 metric cards)
 *  3. Color Palette Analytics (7 color bubbles + accuracy bars)
 *  4. Shape Recognition Performance (8 cards with correctRate rings)
 *  5. Color Skill Progression Chart (4-week SVG line chart)
 *  6. AI Color Learning Insights (3 alert cards)
 *  7. Gamification Analytics (3 achievement cards)
 *
 * SVG-only charts. Framer Motion animations. No heavy libraries.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { parentAnalytics } from '../../data/parentAnalytics';

/* ── Derive rich UI structures from parentAnalytics ── */

const colorSkills = parentAnalytics.colorSkills;

const COLOR_HEX: Record<string, string> = {
  Red: '#EF4444', Blue: '#3B82F6', Yellow: '#EAB308', Green: '#22C55E',
  Pink: '#EC4899', Purple: '#5F8B3D', Orange: '#F97316',
};

const SHAPE_META: Record<string, { emoji: string; color: string }> = {
  Apple:     { emoji: '🍎', color: 'Red' },
  Sun:       { emoji: '☀️', color: 'Yellow' },
  Balloon:   { emoji: '🎈', color: 'Blue' },
  Fish:      { emoji: '🐟', color: 'Orange' },
  Butterfly: { emoji: '🦋', color: 'Pink' },
  Star:      { emoji: '⭐', color: 'Yellow' },
  House:     { emoji: '🏠', color: 'Red' },
  Cupcake:   { emoji: '🧁', color: 'Pink' },
};

const COLOR_SUMMARY = {
  colorVisits:      colorSkills.visits,
  colorsLearned:    colorSkills.colorsLearned,
  shapesMastered:   colorSkills.shapesMastered,
  accuracyRate:     colorSkills.accuracy,
  avgCompletionSec: colorSkills.avgTime,
};

const COLOR_PALETTE_ANALYTICS = colorSkills.colors.map(c => ({
  name: c.name,
  hex: COLOR_HEX[c.name] || '#888',
  accuracy: c.accuracy,
}));

const COLOR_SHAPE_PERFORMANCE = colorSkills.shapes.map(s => {
  const meta = SHAPE_META[s.name] || { emoji: '❓', color: 'Red' };
  return {
    name: s.name,
    emoji: meta.emoji,
    color: meta.color,
    hex: COLOR_HEX[meta.color] || '#888',
    correctRate: s.accuracy,
  };
});

const COLOR_WEEKLY_PROGRESS = colorSkills.weeklyProgress.map((v, i) => ({
  label: `Week ${i + 1}`,
  value: v,
}));

const COLOR_AI_INSIGHTS = [
  { severity: 'success' as const, text: 'Child shows strong recognition of red and blue — both above 85% accuracy.' },
  { severity: 'warning' as const, text: 'Orange recognition slightly lower at 69% → recommended practice with orange shapes.' },
  { severity: 'success' as const, text: 'Shape matching accuracy improving consistently week over week (+22% in 4 weeks).' },
];

const COLOR_GAMIFICATION = {
  colorBadges: 4,
  completedActivities: 28,
  perfectStreak: 3,
};

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════ */

const CLR = {
  primary:   '#3B3FAF',
  secondary: '#6B6FCF',
  muted:     '#8F94D4',
  soft:      '#A0AEC0',
  label:     '#8B95D6',
  purple:    '#4D7A38',
  indigo:    '#3F8F3A',
  mint:      '#10B981',
  sky:       '#38BDF8',
  peach:     '#FB923C',
  rose:      '#F472B6',
  cyan:      '#06B6D4',
  amber:     '#F59E0B',
  green:     '#22C55E',
};

const spring = { type: 'spring' as const, stiffness: 260, damping: 28 };

const SEVERITY_COLORS: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.18)', icon: '✅', text: CLR.mint },
  warning: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.18)', icon: '⚠️', text: CLR.amber },
  info:    { bg: 'rgba(63,143,58,0.06)', border: 'rgba(63,143,58,0.18)', icon: 'ℹ️', text: CLR.indigo },
};

/* ═══════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

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

const SectionTitle: React.FC<{ icon?: string; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
    {icon && (
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(63,143,58,0.10), rgba(127,174,101,0.06))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>{icon}</div>
    )}
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: CLR.primary, lineHeight: '24px', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, fontWeight: 500, color: CLR.muted, marginTop: 2 }}>{subtitle}</p>}
    </div>
  </div>
);

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

/* ── Mini Circle Ring (for shape cards) ───────── */

const MiniRing: React.FC<{ value: number; size?: number; color: string; id: string }> = ({
  value, size = 52, color, id,
}) => {
  const sw = 5;
  const r = (size - sw) / 2;
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}14`} strokeWidth={sw} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#${id})`} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: CLR.primary }}>{anim}%</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export const ColorProgressPage: React.FC = () => {
  const cs = COLOR_SUMMARY;
  const gam = COLOR_GAMIFICATION;

  /* Summary metrics */
  const summaryMetrics = [
    { icon: '🎨', label: 'Color Visits', value: cs.colorVisits, color: CLR.rose,   gradient: 'linear-gradient(135deg, #F3F8E3 0%, #F4F8E8 100%)' },
    { icon: '🖍️', label: 'Colors Learned', value: cs.colorsLearned, color: CLR.purple, gradient: 'linear-gradient(135deg, #EEF8E6 0%, #E7F4DF 100%)' },
    { icon: '🧩', label: 'Shapes Mastered', value: cs.shapesMastered, color: CLR.sky,    gradient: 'linear-gradient(135deg, #CFFAFE 0%, #E0F2FE 100%)' },
    { icon: '🎯', label: 'Accuracy Rate', value: cs.accuracyRate, color: CLR.mint,   gradient: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)', suffix: '%' },
    { icon: '⏱️', label: 'Avg Completion', value: cs.avgCompletionSec, color: CLR.amber,  gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FFEDD5 100%)', suffix: 's' },
  ];

  return (
    <div style={{ maxWidth: 1450, margin: '0 auto', paddingBottom: 40, position: 'relative' }}>

      {/* Background particles */}
      <FloatingParticle delay={0} size={80} color="#EC4899" left="5%" top="3%" />
      <FloatingParticle delay={1.2} size={60} color="#5F8B3D" left="90%" top="5%" />
      <FloatingParticle delay={2.1} size={55} color="#3B82F6" left="88%" top="45%" />
      <FloatingParticle delay={2.8} size={65} color="#F59E0B" left="3%" top="52%" />

      {/* Floating color drops */}
      {['🔴', '🔵', '🟡', '🟢', '🟣'].map((e, i) => (
        <motion.span
          key={i}
          style={{
            position: 'absolute', left: `${12 + i * 18}%`, top: '-6%',
            fontSize: 12, opacity: 0, pointerEvents: 'none', zIndex: 0,
          }}
          animate={{ y: ['0vh', '110vh'], opacity: [0, 0.45, 0.25, 0], rotate: [0, 180] }}
          transition={{ duration: 7 + i, repeat: Infinity, delay: i * 2.2, ease: 'linear' }}
        >
          {e}
        </motion.span>
      ))}

      {/* ═══ PAGE HEADER ═══ */}
      <motion.div
        style={{ marginBottom: 28 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, color: CLR.primary, margin: 0, lineHeight: '34px' }}>
          Cognitive Learning Analytics
        </h1>
        <p style={{ fontSize: 13, fontWeight: 500, color: CLR.muted, marginTop: 4 }}>
          Color recognition, shape matching performance, and weekly skill progression.
        </p>
      </motion.div>

      {/* ═══ SECTION 1 — COLOR LEARNING SUMMARY ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {summaryMetrics.map((m, i) => (
          <SummaryMetricCard key={m.label} icon={m.icon} label={m.label}
            value={m.value} suffix={'suffix' in m ? (m as any).suffix : ''}
            color={m.color} gradient={m.gradient} index={i} />
        ))}
      </div>

      {/* ═══ SECTION 2 — COLOR PALETTE ANALYTICS ═══ */}
      <GlassCard gradient="linear-gradient(135deg, rgba(236,72,153,0.06), rgba(95,139,61,0.04))" delay={0.1} style={{ marginBottom: 24 }}>
        <SectionTitle icon="🖍️" title="Color Palette Analytics" subtitle="Accuracy rate for each color your child has practiced" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {COLOR_PALETTE_ANALYTICS.map((c, i) => (
            <ColorAccuracyRow key={c.name} name={c.name} hex={c.hex} accuracy={c.accuracy} delay={0.15 + i * 0.04} />
          ))}
        </div>
      </GlassCard>

      {/* ═══ SECTION 3 — SHAPE RECOGNITION PERFORMANCE ═══ */}
      <GlassCard delay={0.2} style={{ marginBottom: 24 }}>
        <SectionTitle icon="🧩" title="Shape Recognition Performance" subtitle="Success rate per shape across all Color Magic sessions" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {COLOR_SHAPE_PERFORMANCE.map((s, i) => (
            <motion.div
              key={s.name}
              style={{
                background: 'rgba(255,255,255,0.55)', borderRadius: 16, padding: 14,
                border: `1px solid ${s.hex}18`, textAlign: 'center',
                boxShadow: '0 1px 8px rgba(92,106,196,0.04)',
              }}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...spring, delay: 0.25 + i * 0.04 }}
              whileHover={{ y: -3, boxShadow: `0 4px 18px ${s.hex}15` }}
            >
              <motion.span
                style={{ fontSize: 28, display: 'block', marginBottom: 8 }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
              >
                {s.emoji}
              </motion.span>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <MiniRing value={s.correctRate} size={52} color={s.hex} id={`sr${i}`} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: CLR.primary, margin: 0 }}>{s.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.hex }} />
                <span style={{ fontSize: 10, fontWeight: 500, color: CLR.soft }}>{s.color}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* ═══ SECTION 4 — WEEKLY PROGRESSION CHART ═══ */}
      <GlassCard gradient="linear-gradient(135deg, rgba(63,143,58,0.06), rgba(56,189,248,0.04))" delay={0.3} style={{ marginBottom: 24 }}>
        <SectionTitle icon="📈" title="Color Skill Progression" subtitle="Weekly accuracy improvement over last 4 weeks" />
        <WeeklyLineChart data={COLOR_WEEKLY_PROGRESS} />
      </GlassCard>

      {/* ═══ SECTION 5 — AI INSIGHTS ═══ */}
      <GlassCard delay={0.35} style={{ marginBottom: 24 }}>
        <SectionTitle icon="🤖" title="AI Color Learning Insights" subtitle="Personalized observations from your child's color sessions" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {COLOR_AI_INSIGHTS.map((ins, i) => {
            const sev = SEVERITY_COLORS[ins.severity] || SEVERITY_COLORS.info;
            return (
              <motion.div
                key={i}
                style={{
                  background: sev.bg, borderRadius: 16, padding: '14px 18px',
                  border: `1px solid ${sev.border}`,
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: 0.4 + i * 0.06 }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{sev.icon}</span>
                <p style={{ fontSize: 12, fontWeight: 500, color: CLR.secondary, margin: 0, lineHeight: '20px' }}>
                  {ins.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      {/* ═══ SECTION 6 — GAMIFICATION ANALYTICS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <GamificationCard icon="🏅" label="Color Badges" value={gam.colorBadges}
          sub="Earned from perfect colors" accent={CLR.amber}
          gradient="linear-gradient(135deg, #FEF3C7 0%, #FFEDD5 100%)" delay={0.42} />
        <GamificationCard icon="🎮" label="Activities Done" value={gam.completedActivities}
          sub="Total color sessions" accent={CLR.indigo}
          gradient="linear-gradient(135deg, #E7F4DF 0%, #DDF1D4 100%)" delay={0.46} />
        <GamificationCard icon="🔥" label="Perfect Streak" value={gam.perfectStreak}
          sub="Consecutive flawless rounds" accent={CLR.rose}
          gradient="linear-gradient(135deg, #F3F8E3 0%, #FBFBEA 100%)" delay={0.5} />
      </div>

      {/* Decorative blobs */}
      <div style={{ position: 'fixed', bottom: 60, right: 18, width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.06), transparent)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '38%', left: 10, width: 85, height: 85, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05), transparent)', pointerEvents: 'none', zIndex: 0 }} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════ */

/* ── Summary Metric Card (extracted to fix hooks rule) ── */

const SummaryMetricCard: React.FC<{
  icon: string; label: string; value: number; suffix: string;
  color: string; gradient: string; index: number;
}> = ({ icon, label, value, suffix, color, gradient, index }) => {
  const anim = useCountUp(value);
  return (
    <motion.div
      style={{
        background: gradient, borderRadius: 18, padding: '16px 14px',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 2px 14px rgba(92,106,196,0.05)',
        position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring, delay: 0.05 + index * 0.04 }}
      whileHover={{ y: -3, scale: 1.03, boxShadow: '0 6px 24px rgba(92,106,196,0.10)' }}
    >
      <motion.span
        style={{ fontSize: 22, display: 'block', marginBottom: 6 }}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
      >
        {icon}
      </motion.span>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>
        {anim}{suffix}
      </p>
      <p style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
    </motion.div>
  );
};

/* ── Color Accuracy Row ───────────────────────── */

const ColorAccuracyRow: React.FC<{
  name: string; hex: string; accuracy: number; delay: number;
}> = ({ name, hex, accuracy, delay }) => {
  const anim = useCountUp(accuracy);
  return (
    <motion.div
      style={{ display: 'flex', alignItems: 'center', gap: 14 }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring, delay }}
    >
      {/* Color bubble */}
      <motion.div
        style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: `radial-gradient(circle at 35% 35%, ${hex}cc, ${hex})`,
          border: '2.5px solid rgba(255,255,255,0.7)',
          boxShadow: `0 2px 10px ${hex}35`,
        }}
        whileHover={{ scale: 1.15 }}
        transition={spring}
      />

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: CLR.primary }}>{name}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: hex }}>{anim}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: `${hex}12`, overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${hex}, ${hex}99)` }}
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

/* ── Weekly Line Chart (SVG) ──────────────────── */

const WeeklyLineChart: React.FC<{
  data: readonly { readonly label: string; readonly value: number }[];
}> = ({ data }) => {
  const W = 540, H = 200, PX = 60, PY = 30;
  const innerW = W - PX * 2;
  const innerH = H - PY * 2;
  const maxVal = 100;

  const pts = data.map((d, i) => ({
    x: PX + (i / Math.max(data.length - 1, 1)) * innerW,
    y: PY + innerH - (d.value / maxVal) * innerH,
    ...d,
  }));

  // Build smooth path
  const pathD = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return acc + ` C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  // Area fill path
  const areaD = pathD + ` L ${pts[pts.length - 1].x} ${PY + innerH} L ${pts[0].x} ${PY + innerH} Z`;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id="clLineG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CLR.indigo} stopOpacity={0.20} />
            <stop offset="100%" stopColor={CLR.indigo} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = PY + innerH - (v / maxVal) * innerH;
          return (
            <g key={v}>
              <line x1={PX} y1={y} x2={W - PX} y2={y} stroke={`${CLR.soft}20`} strokeWidth={1} />
              <text x={PX - 8} y={y + 4} textAnchor="end" fill={CLR.soft} fontSize={10} fontWeight={600}>{v}%</text>
            </g>
          );
        })}

        {/* Area fill */}
        <motion.path
          d={areaD} fill="url(#clLineG)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        />

        {/* Line */}
        <motion.path
          d={pathD} fill="none" stroke={CLR.indigo} strokeWidth={3} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Data points + labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <motion.circle
              cx={p.x} cy={p.y} r={6} fill="white" stroke={CLR.indigo} strokeWidth={2.5}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ ...spring, delay: 0.3 + i * 0.1 }}
            />
            <text x={p.x} y={p.y - 14} textAnchor="middle" fill={CLR.primary} fontSize={12} fontWeight={800}>
              {p.value}%
            </text>
            <text x={p.x} y={PY + innerH + 20} textAnchor="middle" fill={CLR.muted} fontSize={10} fontWeight={600}>
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/* ── Gamification Card ────────────────────────── */

const GamificationCard: React.FC<{
  icon: string; label: string; value: number; sub: string;
  accent: string; gradient: string; delay: number;
}> = ({ icon, label, value, sub, accent, gradient, delay }) => {
  const anim = useCountUp(value);
  return (
    <motion.div
      style={{
        background: gradient, borderRadius: 18, padding: '20px 18px',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 2px 14px rgba(92,106,196,0.05)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring, delay }}
      whileHover={{ y: -3, scale: 1.03, boxShadow: '0 6px 24px rgba(92,106,196,0.10)' }}
    >
      <div style={{ position: 'absolute', top: -14, right: -14, width: 50, height: 50, borderRadius: '50%', background: `radial-gradient(circle, ${accent}12, transparent)`, pointerEvents: 'none' }} />
      <motion.span
        style={{ fontSize: 28, display: 'block', marginBottom: 8 }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: delay * 2 }}
      >
        {icon}
      </motion.span>
      <p style={{ fontSize: 28, fontWeight: 800, color: accent, margin: 0 }}>{anim}</p>
      <p style={{ fontSize: 11, fontWeight: 700, color: CLR.primary, marginTop: 4 }}>{label}</p>
      <p style={{ fontSize: 10, fontWeight: 500, color: CLR.soft, marginTop: 2 }}>{sub}</p>
    </motion.div>
  );
};

export default ColorProgressPage;

