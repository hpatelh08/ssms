/**
 * parent/pages/OverviewPage.tsx
 * ─────────────────────────────────────────────────────
 * PREMIUM Parent Analytics Overview — Government Pitch Ready
 *
 * Color System:
 *   Primary text: #3A3F9F (deep indigo)
 *   Secondary: #5C6AC4
 *   Muted: #7A86C2
 *   NO black text anywhere.
 *
 * Sections:
 *  1. Hero — 4-col: Student Snapshot | Weekly Activity | Academic Growth | Attendance Ring
 *  2. Academic Performance — gradient progress bars + radar
 *  3. Activity Insights — line chart + bar chart (2-col)
 *  4. Parent Insights — premium alert cards + AI suggestion
 *  5. AI Weekly Insight — summary cards + suggestions
 *
 * Every card: pastel gradient bg, soft shadow, micro hover animation.
 * SVG-only charts. No heavy libraries. 60fps animations.
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParentAnalytics } from '../analytics/useParentAnalytics';
import type { Alert, SubjectProgress } from '../analytics/types';
import { toLocalDateKey } from '../../utils/activityMetrics';

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════ */

const CLR = {
  primary: '#3B3FAF',
  secondary: '#6B6FCF',
  muted: '#8F94D4',
  soft: '#A0AEC0',
  label: '#8B95D6',
  // Accent per card
  purple: '#7C3AED',
  indigo: '#6366F1',
  mint: '#10B981',
  sky: '#38BDF8',
  peach: '#FB923C',
  rose: '#F472B6',
  cyan: '#06B6D4',
  amber: '#F59E0B',
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
  xp:         'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(168,85,247,0.1) 55%, rgba(236,72,153,0.08) 100%)',
  growth:     'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(34,197,94,0.08) 100%)',
  attendance: 'linear-gradient(135deg, rgba(56,189,248,0.14) 0%, rgba(99,102,241,0.08) 100%)',
  streak:     'linear-gradient(135deg, rgba(251,146,60,0.14) 0%, rgba(244,114,182,0.08) 100%)',
};

const PANEL_BASE = 'linear-gradient(180deg, rgba(7,12,28,0.9) 0%, rgba(15,23,42,0.8) 100%)';
const SUBPANEL_BASE = 'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(30,41,59,0.74) 100%)';
const PANEL_BORDER = 'rgba(148,163,184,0.16)';
const PANEL_SHADOW = '0 18px 48px rgba(2,6,23,0.26)';

const panelBackground = (overlay?: string) => (overlay ? `${overlay}, ${PANEL_BASE}` : PANEL_BASE);
const subPanelBackground = (overlay?: string) => (overlay ? `${overlay}, ${SUBPANEL_BASE}` : SUBPANEL_BASE);

const SEVERITY_STYLES: Record<string, { bg: string; border: string; dot: string; label: string; icon: string }> = {
  success: { bg: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.04))', border: 'rgba(16,185,129,0.18)', dot: '#10B981', label: 'Positive', icon: '🟢' },
  info:    { bg: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(99,102,241,0.04))',  border: 'rgba(56,189,248,0.18)',  dot: '#38BDF8', label: 'Suggestion', icon: '🔵' },
  warning: { bg: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))',  border: 'rgba(251,191,36,0.18)',  dot: '#FBBF24', label: 'Attention', icon: '🟡' },
  danger:  { bg: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(239,68,68,0.04))',  border: 'rgba(244,114,182,0.18)', dot: '#F472B6', label: 'Alert', icon: '⚠️' },
};

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

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

const SectionTitle: React.FC<{ title: string; subtitle?: string; icon?: string }> = ({ title, subtitle, icon }) => (
  <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
    {icon && <div style={{
      width: 32, height: 32, borderRadius: 10,
      background: panelBackground(GRADIENTS.indigo),
      border: `1px solid ${PANEL_BORDER}`,
      boxShadow: PANEL_SHADOW,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
    }}>{icon}</div>}
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: CLR.primary, lineHeight: '24px', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, fontWeight: 500, color: CLR.muted, marginTop: 2, lineHeight: '18px' }}>{subtitle}</p>}
    </div>
  </div>
);

/* ── Glass card wrapper ─────────────────────────── */

const GlassCard: React.FC<{
  children: React.ReactNode;
  gradient?: string;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, gradient, delay = 0, style }) => (
  <motion.div
    style={{
      background: panelBackground(gradient),
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 22,
      padding: 24,
      border: `1px solid ${PANEL_BORDER}`,
      boxShadow: PANEL_SHADOW,
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

/* ── Metric card (hero cells) ───────────────────── */

const MetricCard: React.FC<{
  label: string; value: number | string; sub?: string;
  accent: string; gradient: string; icon: string; delay?: number;
}> = ({ label, value, sub, accent, gradient, icon, delay = 0 }) => {
  const numVal = typeof value === 'number' ? value : 0;
  const displayVal = typeof value === 'number' ? useCountUp(numVal) : value;
  return (
    <motion.div
      style={{
        background: panelBackground(gradient),
        borderRadius: 20,
        padding: 20,
        border: `1px solid ${PANEL_BORDER}`,
        boxShadow: PANEL_SHADOW,
        position: 'relative', overflow: 'hidden',
      }}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring, delay }}
      whileHover={{ y: -3, scale: 1.01, boxShadow: '0 6px 24px rgba(92,106,196,0.10)' }}
    >
      {/* Decorative blob */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}15, transparent)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: `${accent}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          boxShadow: `0 2px 8px ${accent}20`,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color: accent, lineHeight: '34px', margin: 0, position: 'relative' }}>{displayVal}</p>
      {sub && <p style={{ fontSize: 11, fontWeight: 600, color: CLR.soft, marginTop: 4, position: 'relative' }}>{sub}</p>}
    </motion.div>
  );
};

/* ── Animated Progress Bar (gradient) ───────────── */

const GradientBar: React.FC<{
  label: string; value: number; max?: number; color: string; gradientEnd?: string;
  detail?: string; tag?: string; tagColor?: string; delay?: number;
}> = ({ label, value, max = 100, color, gradientEnd, detail, tag, tagColor, delay = 0 }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const bg = gradientEnd ? `linear-gradient(90deg, ${color}, ${gradientEnd})` : color;
  return (
    <motion.div
      style={{ marginBottom: 16 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring, delay }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: CLR.secondary }}>{label}</span>
          {tag && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: tagColor || CLR.mint,
              background: `${tagColor || CLR.mint}14`,
              padding: '2px 8px', borderRadius: 8, letterSpacing: '0.03em',
            }}>{tag}</span>
          )}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%{detail ? ` · ${detail}` : ''}</span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: `${color}12`, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 5, background: bg }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
        />
      </div>
    </motion.div>
  );
};

/* ── Circular Progress Ring (SVG) ───────────────── */

const CircleRing: React.FC<{
  value: number; size?: number; strokeWidth?: number; color?: string; gradientId?: string;
}> = ({ value, size = 80, strokeWidth = 7, color = CLR.indigo, gradientId }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  const animVal = useCountUp(value);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {gradientId && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={`${color}88`} />
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}15`} strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={gradientId ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: CLR.primary }}>{animVal}%</span>
      </div>
    </div>
  );
};

/* ── Mini Bar Graph (7-day) ─────────────────────── */

const MiniWeekBars: React.FC<{ data: number[]; color?: string }> = ({ data, color = CLR.indigo }) => {
  const max = Math.max(...data, 1);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 52, marginTop: 8 }}>
      {data.map((v, i) => {
        const h = Math.max(4, (v / max) * 44);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <motion.div
              style={{
                width: '100%', maxWidth: 18, borderRadius: 6,
                background: v > 0 ? `linear-gradient(180deg, ${color}, ${color}88)` : `${color}15`,
                boxShadow: v > 0 ? `0 2px 6px ${color}25` : 'none',
              }}
              initial={{ height: 0 }}
              animate={{ height: h }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 + i * 0.04 }}
            />
            <span style={{ fontSize: 8, fontWeight: 700, color: CLR.soft }}>{days[i]}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ── SVG Line Chart ─────────────────────────────── */

const LineChart: React.FC<{ data: number[]; labels: string[]; color?: string; height?: number }> = ({
  data, labels, color = CLR.indigo, height = 150,
}) => {
  const w = 340;
  const pad = { top: 16, right: 14, bottom: 28, left: 38 };
  const chartW = w - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const maxVal = Math.max(...data, 1);

  const points = data.map((v, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: pad.top + chartH - (v / maxVal) * chartH,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x},${pad.top + chartH} L${points[0].x},${pad.top + chartH} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => pad.top + chartH - f * chartH);

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lcAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {gridLines.map((y, i) => (
        <g key={i}>
          <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke={`${CLR.muted}18`} strokeWidth={1} />
          <text x={pad.left - 6} y={y + 3} textAnchor="end" fontSize={9} fill={CLR.soft} fontWeight={500}>
            {Math.round(maxVal * (i / 4))}
          </text>
        </g>
      ))}
      <motion.path d={areaD} fill="url(#lcAreaGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <motion.path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      {points.map((p, i) => (
        <g key={i}>
          <motion.circle cx={p.x} cy={p.y} r={4} fill="white" stroke={color} strokeWidth={2.5}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.05 }} />
          <text x={p.x} y={pad.top + chartH + 16} textAnchor="middle" fontSize={9} fill={CLR.muted} fontWeight={600}>
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
};

/* ── SVG Bar Chart ──────────────────────────────── */

const BarChart: React.FC<{ entries: { label: string; value: number; color: string }[]; height?: number }> = ({
  entries, height = 150,
}) => {
  const w = 300;
  const pad = { top: 10, right: 10, bottom: 28, left: 10 };
  const chartH = height - pad.top - pad.bottom;
  const maxVal = Math.max(...entries.map(e => e.value), 1);
  const barW = Math.min(34, (w - pad.left - pad.right) / entries.length - 14);

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height}>
      {entries.map((e, i) => {
        const barH = Math.max(4, (e.value / maxVal) * chartH);
        const x = pad.left + ((w - pad.left - pad.right) / entries.length) * i + ((w - pad.left - pad.right) / entries.length - barW) / 2;
        const y = pad.top + chartH - barH;
        return (
          <g key={e.label}>
            <defs>
              <linearGradient id={`bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={e.color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={e.color} stopOpacity={0.55} />
              </linearGradient>
            </defs>
            <motion.rect
              x={x} y={y} width={barW} rx={barW / 2}
              fill={`url(#bar-${i})`}
              initial={{ height: 0, y: pad.top + chartH }}
              animate={{ height: barH, y }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 + i * 0.06 }}
            />
            <text x={x + barW / 2} y={pad.top + chartH + 14} textAnchor="middle" fontSize={9} fill={CLR.muted} fontWeight={600}>
              {e.label}
            </text>
            <motion.text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={700} fill={e.color}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.06 }}>
              {e.value}m
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
};

/* ── Skill Radar (SVG, filled polygon) ──────────── */

const SkillRadar: React.FC<{ skills: { skill: string; value: number }[]; size?: number }> = ({ skills, size = 240 }) => {
  const pad = 44;
  const cx = size / 2, cy = size / 2, R = size / 2 - pad;
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
        <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818CF8" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#C084FC" stopOpacity={0.10} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={ring(R * f)} fill="none" stroke={`${CLR.muted}18`} strokeWidth={1} />
      ))}
      {skills.map((_, i) => {
        const a = -Math.PI / 2 + i * step;
        return <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke={`${CLR.muted}10`} strokeWidth={1} />;
      })}
      <motion.polygon points={dataPts} fill="url(#radarFill)" stroke="#818CF8" strokeWidth={2}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }} />
      {/* Data dots */}
      {skills.map((s, i) => {
        const a = -Math.PI / 2 + i * step;
        const r = (s.value / 100) * R;
        return <motion.circle key={`d-${i}`} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={3}
          fill="#818CF8" stroke="white" strokeWidth={1.5}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.05 }} />;
      })}
      {skills.map((s, i) => {
        const a = -Math.PI / 2 + i * step;
        const lx = cx + (R + 28) * Math.cos(a);
        const ly = cy + (R + 28) * Math.sin(a);
        return (
          <g key={s.skill}>
            <text x={lx} y={ly - 3} textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fontWeight={700} fill={CLR.secondary}>{s.skill}</text>
            <text x={lx} y={ly + 8} textAnchor="middle" fontSize={8} fontWeight={600} fill={CLR.muted}>{s.value}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ── Insight Card ───────────────────────────────── */

const InsightCard: React.FC<{ alert: Alert; delay?: number }> = ({ alert, delay = 0 }) => {
  const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
  return (
    <motion.div
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderLeft: `4px solid ${s.dot}`,
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay }}
      whileHover={{ x: 2, boxShadow: `0 4px 20px ${s.dot}12` }}
    >
      <span style={{ fontSize: 16, marginTop: 1 }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: CLR.primary }}>{alert.title}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: s.dot,
            background: `${s.dot}18`, padding: '2px 10px', borderRadius: 8,
          }}>{s.label}</span>
        </div>
        <p style={{ fontSize: 12, fontWeight: 500, color: CLR.muted, lineHeight: '18px', margin: 0 }}>
          {alert.description}
        </p>
      </div>
    </motion.div>
  );
};

/* ── Floating Particle (background effect) ──────── */

const FloatingParticle: React.FC<{ x: number; y: number; size: number; color: string; delay: number }> = ({ x, y, size, color, delay: d }) => (
  <motion.div
    style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color}30, transparent)`,
      pointerEvents: 'none', zIndex: 0,
    }}
    animate={{ y: [-8, 8, -8], opacity: [0.4, 0.7, 0.4] }}
    transition={{ duration: 4 + d, repeat: Infinity, ease: 'easeInOut', delay: d }}
  />
);

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

export const OverviewPage: React.FC = () => {
  const analytics = useParentAnalytics();

  const greeting = useMemo(getTimeGreeting, []);
  const firstName = useMemo(() => analytics.studentName.split(' ')[0], [analytics.studentName]);
  const todayIso = toLocalDateKey(new Date());
  const isActiveToday = analytics.lastActiveDate === todayIso;
  const weeklyTotal = useMemo(() => analytics.weeklyMinutes.reduce((a, b) => a + b, 0), [analytics.weeklyMinutes]);
  const activeDaysCount = useMemo(() => analytics.weeklyMinutes.filter(m => m > 0).length, [analytics.weeklyMinutes]);
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const totalHrs = Math.floor(weeklyTotal / 60);
  const totalMins = weeklyTotal % 60;
  const isMonday = new Date().getDay() === 1;
  const showLastWeekAvg = analytics.weeklySessions === 0 && isMonday && analytics.lastWeekAvgSessionMinutes > 0;
  const avgSession = showLastWeekAvg ? analytics.lastWeekAvgSessionMinutes : analytics.avgSessionMinutes;
  const avgPerDay = activeDaysCount > 0 ? Math.round(weeklyTotal / activeDaysCount) : 0;

  // Subject status tags — from live progress
  const getSubjectTag = (subject: string, progress: number) => {
    void subject;
    if (progress >= 80) return { tag: 'Strong', color: '#10B981' };
    if (progress >= 50) return { tag: 'On Track', color: '#6366F1' };
    if (progress > 0) return { tag: 'In Progress', color: '#F59E0B' };
    return { tag: 'Not Started', color: '#94A3B8' };
  };

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>

      {/* ═════════════════════════════════════════════
          1. HERO — 4 COLUMN REAL-TIME SNAPSHOT
          ═════════════════════════════════════════════ */}
      <div style={{ position: 'relative' }}>
        {/* Floating particles */}
        <FloatingParticle x={8} y={20} size={40} color="#818CF8" delay={0} />
        <FloatingParticle x={72} y={10} size={32} color="#C084FC" delay={1.2} />
        <FloatingParticle x={90} y={60} size={28} color="#F472B6" delay={0.6} />
        <FloatingParticle x={35} y={70} size={36} color="#38BDF8" delay={1.8} />

        {/* Top greeting bar */}
        <motion.div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, position: 'relative', zIndex: 1,
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: CLR.muted, margin: 0 }}>{greeting} 👋</p>
            <h1 style={{
              fontSize: 26, fontWeight: 800, margin: 0, lineHeight: '34px',
              background: 'linear-gradient(135deg, #3A3F9F, #7C3AED, #A855F7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {firstName}'s Learning Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
              background: isActiveToday ? 'rgba(16,185,129,0.12)' : 'rgba(244,114,182,0.10)',
              color: isActiveToday ? '#10B981' : '#F472B6',
              border: `1px solid ${isActiveToday ? 'rgba(16,185,129,0.2)' : 'rgba(244,114,182,0.15)'}`,
            }}>
              {isActiveToday ? '● Active Today' : '○ Inactive Today'}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
              background: 'rgba(129,140,248,0.10)', color: '#6366F1',
              border: '1px solid rgba(129,140,248,0.15)',
            }}>
              Level {analytics.level}
            </span>
          </div>
        </motion.div>

        {/* 4-column hero grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, position: 'relative', zIndex: 1 }}>

          {/* Col 1: Student Snapshot */}
          <GlassCard gradient={CARD_GRADIENTS.xp} delay={0.02}>
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Student Snapshot</p>
              <h3 style={{
                fontSize: 22, fontWeight: 800, margin: 0,
                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {firstName} — Lv.{analytics.level}
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: 'rgba(124,58,237,0.08)', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: CLR.purple, margin: 0 }}>{analytics.xp} XP</p>
                <p style={{ fontSize: 9, fontWeight: 600, color: CLR.soft, margin: 0 }}>Total XP</p>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: CLR.indigo, margin: 0 }}>{analytics.xpToNext}</p>
                <p style={{ fontSize: 9, fontWeight: 600, color: CLR.soft, margin: 0 }}>XP To Next</p>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 12, background: 'rgba(129,140,248,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>Engagement</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: CLR.indigo }}>{analytics.engagementScore}%</span>
              </div>
            </div>
          </GlassCard>

          {/* Col 2: Weekly Activity */}
          <GlassCard gradient={CARD_GRADIENTS.growth} delay={0.06}>
            <p style={{ fontSize: 11, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Weekly Activity</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: CLR.mint, margin: 0 }}>{analytics.weeklySessions}</p>
                <p style={{ fontSize: 9, fontWeight: 600, color: CLR.soft, margin: 0 }}>Sessions</p>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: CLR.mint, margin: 0 }}>{totalHrs}h {totalMins}m</p>
                <p style={{ fontSize: 9, fontWeight: 600, color: CLR.soft, margin: 0 }}>Total Time</p>
              </div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 12, padding: '8px 12px', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>
                  {showLastWeekAvg ? 'Last Week Avg' : 'Avg Session'}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: CLR.mint }}>{avgSession} min</span>
              </div>
            </div>
            <MiniWeekBars data={analytics.weeklyMinutes} color={CLR.mint} />
          </GlassCard>

          {/* Col 3: Academic Growth */}
          <GlassCard gradient={CARD_GRADIENTS.streak} delay={0.10}>
            <p style={{ fontSize: 11, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Academic Growth</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: CLR.peach }}>+{analytics.overallProgress}%</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: CLR.soft }}>overall</span>
            </div>
            {analytics.subjects.slice(0, 3).map((s, i) => (
              <div key={s.subject} style={{ marginBottom: i < 2 ? 8 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: CLR.secondary }}>{s.subject}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.progress}%</span>
                </div>
              </div>
            ))}
          </GlassCard>

          {/* Col 4: Attendance & Streak */}
          <GlassCard gradient={CARD_GRADIENTS.attendance} delay={0.14}>
            <p style={{ fontSize: 11, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Attendance & Streak</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <CircleRing value={analytics.attendanceRate} size={86} strokeWidth={7} color={CLR.sky} gradientId="attRing" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div style={{ textAlign: 'center', background: 'rgba(56,189,248,0.08)', borderRadius: 12, padding: '8px 6px' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: CLR.sky, margin: 0 }}>{activeDaysCount}/7</p>
                <p style={{ fontSize: 9, fontWeight: 600, color: CLR.soft, margin: 0 }}>Active Days</p>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(251,146,60,0.08)', borderRadius: 12, padding: '8px 6px' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: CLR.peach, margin: 0 }}>{analytics.streakDays}</p>
                <p style={{ fontSize: 9, fontWeight: 600, color: CLR.soft, margin: 0 }}>Day Streak</p>
              </div>
            </div>
            {/* Monthly attendance */}
            <div style={{
              background: 'rgba(56,189,248,0.06)', borderRadius: 10, padding: '6px 10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>Monthly</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: CLR.sky }}>{analytics.monthlyActiveDays} / {analytics.monthlySchoolDays} days</span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ═════════════════════════════════════════════
          2. ACADEMIC PERFORMANCE
          ═════════════════════════════════════════════ */}
      <GlassCard delay={0.06}>
        <SectionTitle icon="📚" title="Academic Performance" subtitle="Subject-wise reading progress from real book page flips" />

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32, alignItems: 'start' }}>
          <div>
            {analytics.subjects.map((s: SubjectProgress, i: number) => {
              const tag = getSubjectTag(s.subject, s.progress);
              return (
                <GradientBar
                  key={s.subject}
                  label={s.subject}
                  value={s.progress}
                  color={s.color}
                  gradientEnd={`${s.color}99`}
                  detail={`${s.chaptersCompleted}/${s.totalChapters} ch.`}
                  tag={tag.tag}
                  tagColor={tag.color}
                  delay={0.1 + i * 0.04}
                />
              );
            })}

            {/* Chapters summary */}
            <motion.div
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 8, marginBottom: 10,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            >
              {analytics.subjects.map((s: SubjectProgress) => (
                <div key={s.subject} style={{
                  textAlign: 'center', padding: '8px 4px', borderRadius: 12,
                  background: subPanelBackground(`${s.color}08`),
                  border: `1px solid ${s.color}24`,
                }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: s.color, margin: 0 }}>{s.chaptersCompleted}/{s.totalChapters}</p>
                  <p style={{ fontSize: 9, fontWeight: 600, color: CLR.soft, margin: 0 }}>{s.subject}</p>
                </div>
              ))}
            </motion.div>

            {/* Overall Growth bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginTop: 10,
              padding: '12px 16px', borderRadius: 14,
              background: subPanelBackground(GRADIENTS.indigo),
              border: `1px solid ${PANEL_BORDER}`,
              boxShadow: PANEL_SHADOW,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: CLR.secondary }}>Overall Growth</span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: `${CLR.indigo}12`, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, #818CF8, #6366F1)` }}
                  initial={{ width: 0 }} animate={{ width: `${analytics.overallProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: CLR.indigo }}>{analytics.overallProgress}%</span>
            </div>
          </div>

          {/* Radar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'visible', minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: CLR.secondary, marginBottom: 4 }}>Skill Strength Radar</p>
            <SkillRadar skills={analytics.skills} size={250} />
          </div>
        </div>
      </GlassCard>

      {/* ═════════════════════════════════════════════
          3. WEEKLY LEARNING TREND (Smooth Line Chart)
          ═════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <GlassCard gradient={GRADIENTS.indigo} delay={0.10}>
          <SectionTitle icon="📈" title="Weekly Learning Trend" subtitle="Daily engagement curve over the past 7 days" />
          <LineChart data={analytics.weeklyMinutes} labels={dayLabels} color="#6C7CFF" height={155} />
          <div style={{ display: 'flex', gap: 20, marginTop: 14, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <motion.p style={{ fontSize: 22, fontWeight: 800, color: CLR.primary, margin: 0 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                {weeklyTotal}
              </motion.p>
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, margin: 0 }}>Total Minutes</p>
            </div>
            <div style={{ width: 1, background: `${CLR.muted}20` }} />
            <div style={{ textAlign: 'center' }}>
              <motion.p style={{ fontSize: 22, fontWeight: 800, color: CLR.primary, margin: 0 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                {avgPerDay}
              </motion.p>
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, margin: 0 }}>Avg / Day</p>
            </div>
            <div style={{ width: 1, background: `${CLR.muted}20` }} />
            <div style={{ textAlign: 'center' }}>
              <motion.p style={{ fontSize: 22, fontWeight: 800, color: '#8B5CF6', margin: 0 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                {dayLabels[analytics.weeklyMinutes.indexOf(Math.max(...analytics.weeklyMinutes))]}
              </motion.p>
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, margin: 0 }}>Most Active</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard gradient={GRADIENTS.rose} delay={0.14}>
          <SectionTitle icon="🎯" title="Learning Focus Distribution" subtitle="Time allocation across learning categories" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(() => {
              const total = Math.max(
                analytics.activityDistribution.reduce((sum, item) => sum + item.minutes, 0),
                1,
              );
              const icons: Record<string, string> = {
                Lessons: '📘',
                Games: '🎮',
                Reading: '📖',
                Practice: '✏️',
                Creative: '🎨',
              };

              return analytics.activityDistribution.map((item, idx) => {
                const pct = Math.round((item.minutes / total) * 100);
                return (
                  <motion.div
                    key={item.label}
                    style={{
                      background: subPanelBackground(`${item.color}08`),
                      borderRadius: 14,
                      padding: '12px 16px',
                      border: `1px solid ${item.color}22`,
                      boxShadow: PANEL_SHADOW,
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring, delay: 0.16 + idx * 0.04 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{icons[item.label] || '📌'}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: CLR.secondary }}>{item.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{pct}%</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: CLR.soft }}>{item.minutes} min</span>
                      </div>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </GlassCard>
      </div>

      {/* ═════════════════════════════════════════════
          4. PARENT INSIGHTS + AI SUGGESTION
          ═════════════════════════════════════════════ */}
      <GlassCard gradient={GRADIENTS.purple} delay={0.20}>
        <SectionTitle icon="💡" title="Parent Insights" subtitle="Actionable observations and AI-powered recommendations" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {analytics.alerts.map((a, i) => (
            <InsightCard key={a.id} alert={a} delay={0.22 + i * 0.04} />
          ))}

          {/* AI Insight card */}
          <motion.div
            style={{
              background: panelBackground('linear-gradient(135deg, rgba(129,140,248,0.08), rgba(167,139,250,0.05))'),
              border: '1px solid rgba(129,140,248,0.18)',
              borderLeft: '4px solid #818CF8',
              borderRadius: 16,
              padding: '18px 22px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.35 }}
            whileHover={{ x: 2 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #818CF8, #A78BFA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
              boxShadow: '0 2px 8px rgba(129,140,248,0.3)',
            }}>🧠</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: CLR.primary }}>AI Learning Advisor</span>
                <span style={{
                  fontSize: 8, fontWeight: 700, color: '#818CF8',
                  background: 'rgba(129,140,248,0.12)',
                  padding: '2px 8px', borderRadius: 6, letterSpacing: '0.05em',
                }}>AI POWERED</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: CLR.muted, lineHeight: '19px', margin: 0 }}>
                Hindi reading has improved by 14% — encourage continued story-based practice. Math accuracy at 58% needs
                targeted reinforcement with 10-minute daily pattern exercises. Gujarati letter tracing practice could boost
                visual recognition by 20%. Space War engagement remains strong — leverage it for multi-subject quiz sessions.
              </p>
            </div>
          </motion.div>
        </div>
      </GlassCard>

      {/* ═════════════════════════════════════════════
          5. AI WEEKLY INSIGHT SUMMARY
          ═════════════════════════════════════════════ */}
      <GlassCard gradient={GRADIENTS.indigo} delay={0.24}>
        <SectionTitle icon="🤖" title="AI Weekly Insight" subtitle="This week's learning summary powered by AI" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Quick stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Learning', value: `${weeklyTotal} min`, icon: '⏱️', color: CLR.indigo },
              { label: 'Avg/Day', value: `${avgPerDay} min`, icon: '📊', color: CLR.sky },
              { label: 'Active', value: `${activeDaysCount}/7 days`, icon: '📅', color: CLR.mint },
              { label: 'Engagement', value: `${analytics.engagementScore}%`, icon: '🎯', color: CLR.purple },
            ].map((stat, i) => (
              <motion.div
                key={i}
                style={{
                  background: `${stat.color}08`,
                  borderRadius: 14,
                  padding: '14px 10px',
                  textAlign: 'center' as const,
                  border: `1px solid ${stat.color}12`,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.26 + i * 0.04 }}
              >
                <span style={{ fontSize: 18, display: 'block', marginBottom: 4 }}>{stat.icon}</span>
                <p style={{ fontSize: 15, fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: 9, fontWeight: 600, color: CLR.muted, margin: '2px 0 0' }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Subject strength highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <motion.div
              style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.12)',
                borderRadius: 14,
                padding: '14px 16px',
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.34 }}
            >
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, margin: 0 }}>💪 Strongest Subject</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#10B981', margin: '4px 0 0' }}>
                {analytics.subjects.length > 0 ? [...analytics.subjects].sort((a, b) => b.progress - a.progress)[0]?.subject : 'N/A'}
              </p>
            </motion.div>
            <motion.div
              style={{
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.12)',
                borderRadius: 14,
                padding: '14px 16px',
              }}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.38 }}
            >
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, margin: 0 }}>🎯 Needs Focus</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B', margin: '4px 0 0' }}>
                {analytics.subjects.length > 0 ? [...analytics.subjects].sort((a, b) => a.progress - b.progress)[0]?.subject : 'N/A'}
              </p>
            </motion.div>
          </div>

          {/* AI tip */}
          <motion.div
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.04))',
              border: '1px solid rgba(99,102,241,0.12)',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex', gap: 12, alignItems: 'center',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.42 }}
          >
            <span style={{ fontSize: 20 }}>💡</span>
            <p style={{ fontSize: 11, fontWeight: 500, color: CLR.secondary, lineHeight: '17px', margin: 0 }}>
              Schedule 10 minutes of practice worksheets for weaker subjects. Use the <strong>AI Practice Lab</strong> in the AI Insights tab to generate custom worksheets!
            </p>
          </motion.div>
        </div>
      </GlassCard>

      {/* Floating gradient shapes (background decoration) */}
      <div style={{ position: 'fixed', top: 120, right: 60, width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent)',
        pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: 200, right: 200, width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.05), transparent)',
        pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: 300, left: 280, width: 140, height: 140, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,114,182,0.04), transparent)',
        pointerEvents: 'none', zIndex: 0 }} />
    </div>
  );
};

export default OverviewPage;


