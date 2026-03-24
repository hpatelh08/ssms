// Helper to read fill in the blanks progress from localStorage
function getFillBlanksProgress() {
  try {
    const arr = JSON.parse(localStorage.getItem('ssms_fillblanks_progress') || '[]');
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}
/**
 * parent/pages/ProgressPage.tsx
 * ─────────────────────────────────────────────────────
 * PREMIUM Progress Analytics — Deep academic insights.
 *
 * Color System:
 *   Primary text: #3B3FAF (deep indigo)
 *   Secondary: #6B6FCF
 *   Muted: #8F94D4
 *   NO black text anywhere.
 *
 * Sections:
 *  1. Page Header — Student info, XP, Level, Animated circular progress
 *  2. Subject Performance — 5 subjects, animated bars, status labels
 *  3. Skill Development — Radar chart + horizontal skill bars
 *  4. Learning Trend — 4-week line chart
 *  5. Strong Areas — green pastel cards
 *  6. Areas Needing Support — orange pastel alert cards
 *  7. AI Recommendations — pastel highlight cards with AI icon
 *
 * SVG-only charts. No heavy libraries. Framer Motion animations.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParentAnalytics } from '../analytics/useParentAnalytics';
import {
  WEEKLY_TREND,
  STRONG_AREAS,
  WEAK_AREAS,
  AI_RECOMMENDATIONS,
} from '../../data/mockParentAnalytics';

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════ */

const CLR = {
  primary: '#3B3FAF',
  secondary: '#6B6FCF',
  muted: '#8F94D4',
  soft: '#A0AEC0',
  label: '#8B95D6',
  purple: '#7C3AED',
  indigo: '#6366F1',
  mint: '#10B981',
  sky: '#38BDF8',
  peach: '#FB923C',
  rose: '#F472B6',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  emerald: '#10B981',
};

const spring = { type: 'spring' as const, stiffness: 260, damping: 28 };

const GRADIENTS = {
  purple: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(129,140,248,0.08) 100%)',
  mint:   'linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(52,211,153,0.06) 100%)',
  sky:    'linear-gradient(135deg, rgba(56,189,248,0.10) 0%, rgba(99,102,241,0.06) 100%)',
  peach:  'linear-gradient(135deg, rgba(251,146,60,0.10) 0%, rgba(244,114,182,0.06) 100%)',
  rose:   'linear-gradient(135deg, rgba(244,114,182,0.10) 0%, rgba(167,139,250,0.06) 100%)',
  indigo: 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(129,140,248,0.06) 100%)',
};

const CARD_GRADIENTS = {
  xp:         'linear-gradient(135deg, #EDE9FE 0%, #F3E8FF 50%, #FCE7F3 100%)',
  growth:     'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 50%, #F0FDF4 100%)',
  attendance: 'linear-gradient(135deg, #DBEAFE 0%, #E0F2FE 50%, #EFF6FF 100%)',
  streak:     'linear-gradient(135deg, #FEF3C7 0%, #FFEDD5 50%, #FFF7ED 100%)',
};

/* ── Count-up animation hook ────────────────────── */

function useCountUp(target: number, duration = 800): number {
  const [val, setVal] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setVal(current);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        ref.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

/* ── Section Title ──────────────────────────────── */

const SectionTitle: React.FC<{ title: string; subtitle?: string; icon?: string }> = ({ title, subtitle, icon }) => (
  <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
    {icon && <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: GRADIENTS.indigo,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
    }}>{icon}</div>}
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: CLR.primary, lineHeight: '24px', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, fontWeight: 500, color: CLR.muted, marginTop: 2, lineHeight: '18px' }}>{subtitle}</p>}
    </div>
  </div>
);

/* ── Glass card ─────────────────────────────────── */

const GlassCard: React.FC<{
  children: React.ReactNode;
  gradient?: string;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, gradient, delay = 0, style }) => (
  <motion.div
    style={{
      background: gradient || 'rgba(255,255,255,0.70)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 22,
      padding: 24,
      border: '1px solid rgba(255,255,255,0.55)',
      boxShadow: '0 2px 16px rgba(92,106,196,0.06), 0 1px 3px rgba(92,106,196,0.03)',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay }}
    whileHover={{ y: -2, boxShadow: '0 6px 28px rgba(92,106,196,0.10), 0 2px 6px rgba(92,106,196,0.04)' }}
  >
    {children}
  </motion.div>
);

/* ── Animated Circular Progress (large) ─────────── */

const AnimatedCircle: React.FC<{
  value: number; size?: number; strokeWidth?: number; color?: string; label?: string;
}> = ({ value, size = 120, strokeWidth = 10, color = CLR.indigo, label }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  const animVal = useCountUp(value);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="progCircleGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}88`} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}12`} strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#progCircleGrad)"
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: CLR.primary }}>{animVal}%</span>
        {label && <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, marginTop: 2 }}>{label}</span>}
      </div>
    </div>
  );
};

/* ── Small Hero Metric Card ─────────────────────── */

const HeroMetric: React.FC<{
  label: string; value: number | string; sub?: string;
  accent: string; gradient: string; icon: string; delay?: number;
}> = ({ label, value, sub, accent, gradient, icon, delay = 0 }) => {
  const numVal = typeof value === 'number' ? value : 0;
  const displayVal = typeof value === 'number' ? useCountUp(numVal) : value;
  return (
    <motion.div
      style={{
        background: gradient,
        borderRadius: 18,
        padding: '18px 20px',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 2px 14px rgba(92,106,196,0.05)',
        position: 'relative', overflow: 'hidden', flex: 1, minWidth: 140,
      }}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring, delay }}
      whileHover={{ y: -3, scale: 1.01, boxShadow: '0 6px 24px rgba(92,106,196,0.10)' }}
    >
      <div style={{ position: 'absolute', top: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: `radial-gradient(circle, ${accent}15, transparent)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
          boxShadow: `0 2px 8px ${accent}18`,
        }}>{icon}</div>
        <span style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, color: accent, lineHeight: '30px', margin: 0 }}>{displayVal}</p>
      {sub && <p style={{ fontSize: 10, fontWeight: 600, color: CLR.soft, marginTop: 3 }}>{sub}</p>}
    </motion.div>
  );
};

/* ── Subject Progress Bar with Status Label ─────── */

const SUBJECT_STATUS: Record<string, { label: string; color: string }> = {
  'English':  { label: 'Improving',       color: '#6366F1' },
  'Maths':    { label: 'Needs Practice',  color: '#F59E0B' },
  'Science':  { label: 'Improving',       color: '#06B6D4' },
  'Social Science': { label: 'In Progress', color: '#F43F5E' },
  'Activities': { label: 'Strong Progress', color: '#10B981' },
  'Hindi':    { label: 'Needs Practice',  color: '#FB923C' },
  'Gujarati': { label: 'Needs Practice',  color: '#F472B6' },
};

const SubjectBar: React.FC<{
  subject: string; progress: number; done: number; total: number; color: string; delay?: number;
}> = ({ subject, progress, done, total, color, delay = 0 }) => {
  const status = SUBJECT_STATUS[subject] || { label: 'In Progress', color: CLR.muted };
  const pct = Math.min(100, progress);
  return (
    <motion.div
      style={{ marginBottom: 18, padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.4)' }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring, delay }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: color,
            boxShadow: `0 0 8px ${color}40`,
          }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: CLR.primary }}>{subject}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: status.color,
            background: `${status.color}12`,
            padding: '2px 10px', borderRadius: 8, letterSpacing: '0.04em',
          }}>{status.label}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: `${color}12`, overflow: 'hidden', marginBottom: 8 }}>
        <motion.div
          style={{ height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: delay + 0.1 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: CLR.muted }}>Chapters Completed</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: CLR.secondary }}>{done} / {total}</span>
      </div>
    </motion.div>
  );
};

/* ── Skill Radar (SVG) ──────────────────────────── */

const SkillRadar: React.FC<{ skills: { skill: string; value: number }[]; size?: number }> = ({ skills, size = 220 }) => {
  const cx = size / 2, cy = size / 2, R = size / 2 - 30;
  const n = skills.length;
  const step = (2 * Math.PI) / n;

  const ring = (r: number) => skills.map((_, i) => {
    const a = -Math.PI / 2 + i * step;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');

  const dataPts = skills.map((s, i) => {
    const a = -Math.PI / 2 + i * step;
    const r = (s.value / 100) * R;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="radarFillProg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818CF8" stopOpacity={0.28} />
          <stop offset="100%" stopColor="#C084FC" stopOpacity={0.12} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={ring(R * f)} fill="none" stroke={`${CLR.muted}20`} strokeWidth={1} />
      ))}
      {skills.map((_, i) => {
        const a = -Math.PI / 2 + i * step;
        return <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke={`${CLR.muted}12`} strokeWidth={1} />;
      })}
      <motion.polygon points={dataPts} fill="url(#radarFillProg)" stroke="#818CF8" strokeWidth={2.5}
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }} />
      {skills.map((s, i) => {
        const a = -Math.PI / 2 + i * step;
        const r = (s.value / 100) * R;
        return <motion.circle key={`d-${i}`} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={4}
          fill="#818CF8" stroke="white" strokeWidth={2}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.06 }} />;
      })}
      {skills.map((s, i) => {
        const a = -Math.PI / 2 + i * step;
        const lx = cx + (R + 22) * Math.cos(a);
        const ly = cy + (R + 22) * Math.sin(a);
        return (
          <g key={s.skill}>
            <text x={lx} y={ly - 4} textAnchor="middle" dominantBaseline="middle"
              fontSize={10} fontWeight={700} fill={CLR.secondary}>{s.skill}</text>
            <text x={lx} y={ly + 8} textAnchor="middle" fontSize={9} fontWeight={600} fill={CLR.muted}>{s.value}%</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ── Horizontal Skill Bar ───────────────────────── */

const SkillBar: React.FC<{ skill: string; value: number; color: string; delay?: number }> = ({ skill, value, color, delay = 0 }) => {
  const animVal = useCountUp(value);
  return (
    <motion.div
      style={{ marginBottom: 14 }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring, delay }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: CLR.secondary }}>{skill}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{animVal}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: `${color}12`, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}90)` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
        />
      </div>
    </motion.div>
  );
};

/* ── Weekly Trend Line Chart ────────────────────── */

const TrendChart: React.FC<{ data: { label: string; value: number }[]; color?: string; height?: number }> = ({
  data, color = CLR.indigo, height = 180,
}) => {
  const w = 400;
  const pad = { top: 20, right: 20, bottom: 34, left: 44 };
  const chartW = w - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: pad.top + chartH - (d.value / maxVal) * chartH,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x},${pad.top + chartH} L${points[0].x},${pad.top + chartH} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => pad.top + chartH - f * chartH);

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.20} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {gridLines.map((y, i) => (
        <g key={i}>
          <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke={`${CLR.muted}16`} strokeWidth={1} />
          <text x={pad.left - 8} y={y + 3} textAnchor="end" fontSize={9} fill={CLR.soft} fontWeight={500}>
            {Math.round(maxVal * (i / 4))}
          </text>
        </g>
      ))}
      <motion.path d={areaD} fill="url(#trendAreaGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <motion.path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut' }} />
      {points.map((p, i) => (
        <g key={i}>
          <motion.circle cx={p.x} cy={p.y} r={5} fill="white" stroke={color} strokeWidth={2.5}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.08 }} />
          <motion.text x={p.x} y={p.y - 12} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.08 }}>
            {data[i].value}
          </motion.text>
          <text x={p.x} y={pad.top + chartH + 18} textAnchor="middle" fontSize={10} fill={CLR.muted} fontWeight={600}>
            {data[i].label}
          </text>
        </g>
      ))}
      {/* Growth arrow */}
      <motion.text x={w - pad.right + 8} y={points[points.length - 1].y + 4} fontSize={13} fill={CLR.mint} fontWeight={700}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
        ↑
      </motion.text>
    </svg>
  );
};

/* ── Floating Particle ──────────────────────────── */

const FloatingParticle: React.FC<{ delay: number; size: number; color: string; left: string; top: string }> = ({ delay, size, color, left, top }) => (
  <motion.div
    style={{
      position: 'absolute', width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color}30, transparent)`,
      left, top, pointerEvents: 'none', zIndex: 0,
    }}
    animate={{ y: [0, -12, 0], opacity: [0.4, 0.7, 0.4] }}
    transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export const ProgressPage: React.FC = () => {
  const analytics = useParentAnalytics();

  /* ── Data from centralized mock ── */
  const weeklyTrend = useMemo(() => [...WEEKLY_TREND], []);

  const strongAreas = useMemo(() => [...STRONG_AREAS], []);

  const weakAreas = useMemo(() => [...WEAK_AREAS], []);

  const aiRecommendations = useMemo(() => [...AI_RECOMMENDATIONS], []);

  const skillColors = useMemo(() => [CLR.indigo, CLR.purple, CLR.cyan, CLR.amber, CLR.rose, CLR.mint], []);




  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40, position: 'relative' }}>

      {/* Floating particles */}
      {/* Removed Garden Growth & Learning Integration section as requested */}

      {/* ═══ SECTION 1 — PAGE HEADER ═══ */}
      <motion.div
        style={{ marginBottom: 32 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, color: CLR.primary, margin: 0, lineHeight: '34px' }}>
          Child Learning Progress
        </h1>
        <p style={{ fontSize: 13, fontWeight: 500, color: CLR.muted, marginTop: 4 }}>
          Track academic growth, mastery levels, and improvement trends.
        </p>
      </motion.div>

      {/* Hero row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <HeroMetric
          label="Student" value={`${analytics.studentName} – Level ${analytics.level}`}
          sub={`Active learner`}
          accent={CLR.indigo} gradient={CARD_GRADIENTS.xp} icon="👨‍🎓" delay={0.05}
        />
        <HeroMetric
          label="Current XP" value={analytics.xp}
          sub={`${analytics.xpToNext} XP to next level`}
          accent={CLR.purple} gradient={CARD_GRADIENTS.streak} icon="⚡" delay={0.1}
        />
        <HeroMetric
          label="Next Level" value={analytics.xpToNext}
          sub="XP remaining"
          accent={CLR.amber} gradient="linear-gradient(135deg, #FEF3C7 0%, #FFF7ED 50%, #FFFBEB 100%)" icon="🎯" delay={0.15}
        />

        {/* Animated Circular Progress */}
        <motion.div
          style={{
            background: CARD_GRADIENTS.growth,
            borderRadius: 18,
            padding: '16px 20px',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 2px 14px rgba(92,106,196,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 6, minWidth: 140,
          }}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring, delay: 0.2 }}
          whileHover={{ y: -3, scale: 1.01 }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Overall Progress
          </span>
          <AnimatedCircle value={analytics.overallProgress} size={100} strokeWidth={9} color={CLR.mint} />
        </motion.div>
      </div>

      {/* ═══ SECTION 2 — SUBJECT PERFORMANCE ═══ */}
      <GlassCard delay={0.15} style={{ marginBottom: 24 }}>
        <SectionTitle title="Subject Performance Analytics" subtitle="Completion rates and chapter progress per subject" icon="📚" />
        {analytics.subjects.map((s, i) => (
          <SubjectBar key={s.subject} subject={s.subject} progress={s.progress} done={s.chaptersCompleted} total={s.totalChapters} color={s.color} delay={0.2 + i * 0.06} />
        ))}
      </GlassCard>

      {/* ═══ SECTION 3 — SKILL DEVELOPMENT ═══ */}
      <GlassCard delay={0.25} style={{ marginBottom: 24 }}>
        <SectionTitle title="Skill Development Tracker" subtitle="Core competency analysis across 6 key learning dimensions" icon="🧠" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SkillRadar skills={analytics.skills.map(s => ({ skill: s.skill, value: s.value }))} size={240} />
          </div>
          <div>
            {analytics.skills.map((s, i) => (
              <SkillBar key={s.skill} skill={s.skill} value={s.value} color={skillColors[i % skillColors.length]} delay={0.3 + i * 0.05} />
            ))}
          </div>
        </div>
      </GlassCard>

      {/* ═══ SECTION 4 — LEARNING TREND ═══ */}
      <GlassCard delay={0.3} style={{ marginBottom: 24 }}>
        <SectionTitle title="Weekly Learning Trend" subtitle="Total learning minutes per week — steady growth trajectory" icon="📈" />
        <TrendChart data={weeklyTrend} color={CLR.indigo} height={200} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 16, flexWrap: 'wrap' }}>
          {weeklyTrend.map((w, i) => (
            <motion.div key={w.label} style={{ textAlign: 'center' }}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, margin: 0 }}>{w.label}</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: CLR.primary, margin: 0 }}>{w.value} <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>min</span></p>
            </motion.div>
          ))}
          <motion.div style={{ textAlign: 'center' }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: CLR.mint, margin: 0 }}>Growth</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: CLR.mint, margin: 0 }}>+38%</p>
          </motion.div>
        </div>
      </GlassCard>

      {/* ═══ SECTION 5 — STRONG AREAS ═══ */}
      <GlassCard delay={0.35} gradient="linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(52,211,153,0.03) 100%)" style={{ marginBottom: 24 }}>
        <SectionTitle title="Strong Areas" subtitle="Skills and subjects where the child excels" icon="🌟" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {strongAreas.map((area, i) => (
            <motion.div
              key={area.title}
              style={{
                background: `linear-gradient(135deg, ${area.accent}08, ${area.accent}04)`,
                border: `1px solid ${area.accent}18`,
                borderLeft: `4px solid ${area.accent}`,
                borderRadius: 16, padding: '16px 18px',
              }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.4 + i * 0.08 }}
              whileHover={{ x: 3, boxShadow: `0 4px 16px ${area.accent}12` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{area.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: CLR.primary }}>{area.title}</span>
              </div>
              <p style={{ fontSize: 11, fontWeight: 500, color: CLR.muted, margin: 0, lineHeight: '17px' }}>{area.desc}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* ═══ SECTION 6 — AREAS NEEDING SUPPORT ═══ */}
      <GlassCard delay={0.4} gradient="linear-gradient(135deg, rgba(251,146,60,0.06) 0%, rgba(245,158,11,0.03) 100%)" style={{ marginBottom: 24 }}>
        <SectionTitle title="Areas Needing Support" subtitle="Subjects and skills that need extra attention" icon="⚠️" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {weakAreas.map((area, i) => (
            <motion.div
              key={area.title}
              style={{
                background: `linear-gradient(135deg, ${area.accent}08, ${area.accent}04)`,
                border: `1px solid ${area.accent}20`,
                borderLeft: `4px solid ${area.accent}`,
                borderRadius: 16, padding: '16px 18px',
              }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.45 + i * 0.08 }}
              whileHover={{ x: 3, boxShadow: `0 4px 16px ${area.accent}12` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{area.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: CLR.primary }}>{area.title}</span>
              </div>
              <p style={{ fontSize: 11, fontWeight: 500, color: CLR.muted, margin: 0, lineHeight: '17px' }}>{area.desc}</p>
              <div style={{
                display: 'inline-block', marginTop: 8,
                fontSize: 9, fontWeight: 700, color: area.accent,
                background: `${area.accent}10`,
                padding: '3px 10px', borderRadius: 8,
              }}>
                Needs Attention
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* ═══ SECTION 7 — AI RECOMMENDATIONS ═══ */}
      <GlassCard delay={0.5} gradient="linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(167,139,250,0.04) 100%)" style={{ marginBottom: 24 }}>
        <SectionTitle title="AI Recommendations" subtitle="Personalized suggestions based on learning patterns" icon="🤖" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {aiRecommendations.map((rec, i) => (
            <motion.div
              key={i}
              style={{
                background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(167,139,250,0.04))',
                border: '1px solid rgba(129,140,248,0.14)',
                borderRadius: 16, padding: '16px 20px',
                display: 'flex', alignItems: 'flex-start', gap: 14,
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.55 + i * 0.08 }}
              whileHover={{ x: 3, boxShadow: '0 4px 20px rgba(99,102,241,0.08)' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, #818CF8, #A78BFA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(129,140,248,0.25)',
              }}>
                <span style={{ fontSize: 16 }}>{rec.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L10 5.5L15 6.2L11.5 9.5L12.4 14.5L8 12.2L3.6 14.5L4.5 9.5L1 6.2L6 5.5L8 1Z" fill="#818CF8" />
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: CLR.indigo, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    AI Suggestion
                  </span>
                </div>
                <p style={{ fontSize: 12, fontWeight: 500, color: CLR.secondary, margin: 0, lineHeight: '18px' }}>
                  {rec.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Decorative shapes */}
      <div style={{ position: 'fixed', bottom: 60, right: 20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.06), transparent)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '35%', left: 10, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.05), transparent)', pointerEvents: 'none', zIndex: 0 }} />
    </div>
  );
};

export default ProgressPage;
