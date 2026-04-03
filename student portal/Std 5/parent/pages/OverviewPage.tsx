/**
 * parent/pages/OverviewPage.tsx
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * PREMIUM Parent Analytics Overview â€” Government Pitch Ready
 *
 * Color System:
 *   Primary text: #2E5E3A (deep indigo)
 *   Secondary: #3E7A4D
 *   Muted: #6C9274
 *   NO black text anywhere.
 *
 * Sections:
 *  1. Hero â€” 4-col: Student Snapshot | Weekly Activity | Academic Growth | Attendance Ring
 *  2. Academic Performance â€” gradient progress bars + radar
 *  3. Activity Insights â€” line chart + bar chart (2-col)
 *  4. Growth & Responsibility â€” garden analytics
 *  5. Parent Insights â€” premium alert cards + AI suggestion
 *
 * Every card: pastel gradient bg, soft shadow, micro hover animation.
 * SVG-only charts. No heavy libraries. 60fps animations.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTree } from '../../context/TreeContext';
import { useParentAnalytics } from '../analytics/useParentAnalytics';
import type { Alert, SubjectProgress } from '../analytics/types';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DESIGN TOKENS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const CLR = {
  primary: '#3B3FAF',
  secondary: '#6B6FCF',
  muted: '#8F94D4',
  soft: '#A0AEC0',
  label: '#8B95D6',
  // Accent per card
  purple: '#4D7A38',
  indigo: '#3F8F3A',
  mint: '#10B981',
  sky: '#38BDF8',
  peach: '#FB923C',
  rose: '#F472B6',
  cyan: '#06B6D4',
  amber: '#F59E0B',
};

const spring = { type: 'spring' as const, stiffness: 260, damping: 28 };

const GRADIENTS = {
  purple: 'linear-gradient(135deg, rgba(95,139,61,0.12) 0%, rgba(127,174,101,0.08) 100%)',
  mint:   'linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(52,211,153,0.06) 100%)',
  sky:    'linear-gradient(135deg, rgba(56,189,248,0.10) 0%, rgba(63,143,58,0.06) 100%)',
  peach:  'linear-gradient(135deg, rgba(251,146,60,0.10) 0%, rgba(244,114,182,0.06) 100%)',
  rose:   'linear-gradient(135deg, rgba(244,114,182,0.10) 0%, rgba(167,201,127,0.06) 100%)',
  indigo: 'linear-gradient(135deg, rgba(63,143,58,0.10) 0%, rgba(127,174,101,0.06) 100%)',
};

const CARD_GRADIENTS = {
  xp:         'linear-gradient(135deg, #E7F4DF 0%, #EEF8E6 50%, #F3F8E3 100%)',
  growth:     'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 50%, #F0FDF4 100%)',
  attendance: 'linear-gradient(135deg, #D7EDD0 0%, #E0F2FE 50%, #EFF6FF 100%)',
  streak:     'linear-gradient(135deg, #FEF3C7 0%, #FFEDD5 50%, #FFF7ED 100%)',
};

const SEVERITY_STYLES: Record<string, { bg: string; border: string; dot: string; label: string; icon: string }> = {
  success: { bg: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.04))', border: 'rgba(16,185,129,0.18)', dot: '#10B981', label: 'Positive', icon: '\u{1F7E2}' },
  info:    { bg: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(63,143,58,0.04))',  border: 'rgba(56,189,248,0.18)',  dot: '#38BDF8', label: 'Suggestion', icon: '\u{1F535}' },
  warning: { bg: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))',  border: 'rgba(251,191,36,0.18)',  dot: '#FBBF24', label: 'Attention', icon: '\u{1F7E1}' },
  danger:  { bg: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(239,68,68,0.04))',  border: 'rgba(244,114,182,0.18)', dot: '#F472B6', label: 'Alert', icon: '\u26A0\uFE0F' },
};

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* â”€â”€ Count-up animation hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SUB-COMPONENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const SectionTitle: React.FC<{ title: string; subtitle?: string; icon?: string }> = ({ title, subtitle, icon }) => (
  <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
    {icon && <div style={{
      width: 32, height: 32, borderRadius: 10,
      background: GRADIENTS.indigo,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
    }}>{icon}</div>}
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: CLR.primary, lineHeight: '24px', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, fontWeight: 500, color: CLR.muted, marginTop: 2, lineHeight: '18px' }}>{subtitle}</p>}
    </div>
  </div>
);

/* â”€â”€ Glass card wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

/* â”€â”€ Metric card (hero cells) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const MetricCard: React.FC<{
  label: string; value: number | string; sub?: string;
  accent: string; gradient: string; icon: string; delay?: number;
}> = ({ label, value, sub, accent, gradient, icon, delay = 0 }) => {
  const numVal = typeof value === 'number' ? value : 0;
  const displayVal = typeof value === 'number' ? useCountUp(numVal) : value;
  return (
    <motion.div
      style={{
        background: gradient,
        borderRadius: 20,
        padding: 20,
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 2px 16px rgba(92,106,196,0.05)',
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

/* â”€â”€ Animated Progress Bar (gradient) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%{detail ? ` | ${detail}` : ''}</span>
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

/* â”€â”€ Circular Progress Ring (SVG) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

/* â”€â”€ Mini Bar Graph (7-day) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function formatMinutesLabel(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

const MiniWeekBars: React.FC<{ data: number[]; color?: string }> = ({ data, color = CLR.indigo }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const max = Math.max(...data, 1);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 68, marginTop: 10 }}>
      {data.map((v, i) => {
        const h = Math.max(8, (v / max) * 56);
        const dayLabel = days[i] || '?';
        const timeLabel = formatMinutesLabel(v);
        const title = `${dayLabel}: ${timeLabel}${v > 0 ? ' session time' : ' (No session)'}`;
        return (
          <div
            key={i}
            style={{ flex: 1, minWidth: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', cursor: 'pointer' }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(prev => (prev === i ? null : prev))}
          >
            {hoveredIndex === i && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 72,
                  whiteSpace: 'nowrap',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#ffffff',
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderRadius: 999,
                  padding: '4px 10px',
                  pointerEvents: 'none',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.18)',
                  zIndex: 2,
                }}
              >
                {timeLabel}
              </div>
            )}
            <motion.div
              style={{
                width: '100%', maxWidth: 24, borderRadius: 8,
                background: v > 0 ? `linear-gradient(180deg, ${color}, ${color}88)` : `${color}15`,
                boxShadow: v > 0 ? `0 2px 6px ${color}25` : 'none',
              }}
              title={title}
              aria-label={title}
              role="img"
              tabIndex={0}
              onFocus={() => setHoveredIndex(i)}
              onBlur={() => setHoveredIndex(prev => (prev === i ? null : prev))}
              initial={{ height: 0 }}
              animate={{ height: h }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 + i * 0.04 }}
            />
            <span style={{ fontSize: 9, fontWeight: 700, color: CLR.soft }}>{days[i]}</span>
          </div>
        );
      })}
    </div>
  );
};

/* â”€â”€ SVG Line Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

/* â”€â”€ SVG Bar Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

/* â”€â”€ Skill Radar (SVG, filled polygon) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
          <stop offset="0%" stopColor="#8FCF94" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#D8B674" stopOpacity={0.10} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={ring(R * f)} fill="none" stroke={`${CLR.muted}18`} strokeWidth={1} />
      ))}
      {skills.map((_, i) => {
        const a = -Math.PI / 2 + i * step;
        return <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke={`${CLR.muted}10`} strokeWidth={1} />;
      })}
      <motion.polygon points={dataPts} fill="url(#radarFill)" stroke="#8FCF94" strokeWidth={2}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }} />
      {/* Data dots */}
      {skills.map((s, i) => {
        const a = -Math.PI / 2 + i * step;
        const r = (s.value / 100) * R;
        return <motion.circle key={`d-${i}`} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={3}
          fill="#8FCF94" stroke="white" strokeWidth={1.5}
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

/* â”€â”€ Insight Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

/* â”€â”€ Floating Particle (background effect) â”€â”€â”€â”€â”€â”€â”€â”€ */

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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export const OverviewPage: React.FC = () => {
  const analytics = useParentAnalytics();
  const { tree, overallGrowth } = useTree();

  const greeting = useMemo(getTimeGreeting, []);
  const firstName = useMemo(() => analytics.studentName.split(' ')[0], [analytics.studentName]);
  const todayIso = toLocalIso(new Date());
  const isActiveToday = analytics.lastActiveDate === todayIso;
  const weeklyMinuteBars = useMemo(
    () => analytics.weeklyMinutes.map(m => Math.max(0, Math.round(m || 0))),
    [analytics.weeklyMinutes],
  );
  const weeklyLoginDays = useMemo(
    () => weeklyMinuteBars.filter(v => v > 0).length,
    [weeklyMinuteBars],
  );
  const weeklyTotal = useMemo(() => analytics.weeklyMinutes.reduce((a, b) => a + b, 0), [analytics.weeklyMinutes]);
  const activeDaysCount = weeklyLoginDays;
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const { monthlyActiveDays, monthlyTotalDays } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    let schoolDaysSoFar = 0;
    for (let d = 1; d <= now.getDate(); d++) {
      const dow = new Date(year, month, d).getDay();
      if (dow !== 0 && dow !== 6) schoolDaysSoFar++;
    }

    const active = analytics.attendanceDates.filter(d => d.startsWith(prefix) && d <= todayIso).length;
    return { monthlyActiveDays: active, monthlyTotalDays: schoolDaysSoFar };
  }, [analytics.attendanceDates, todayIso]);
  const lastSessionLabel = analytics.lastActiveDate
    ? new Date(`${analytics.lastActiveDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'No session yet';
  const currentActivityLabel = useMemo(() => {
    const top = [...analytics.activityDistribution].sort((a, b) => b.minutes - a.minutes)[0];
    return top ? top.label : 'No activity yet';
  }, [analytics.activityDistribution]);
  const careConsistency = Math.round((activeDaysCount / 7) * 100);

  const totalHrs = Math.floor(weeklyTotal / 60);
  const totalMins = weeklyTotal % 60;
  const avgSession = weeklyLoginDays > 0 ? Math.round(weeklyTotal / weeklyLoginDays) : 0;

  // Subject status tags â€” from centralized mock data
  const getSubjectTag = (subject: string, progress: number) => {
    if (progress >= 65) return { tag: 'Improving', color: '#10B981' };
    if (progress >= 45) return { tag: 'On Track', color: '#3F8F3A' };
    return { tag: 'Needs Attention', color: '#F59E0B' };
  };

  return (
    <div style={{ maxWidth: 1450, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          1. HERO â€” 4 COLUMN REAL-TIME SNAPSHOT
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div style={{ position: 'relative' }}>
        {/* Floating particles */}
        <FloatingParticle x={8} y={20} size={40} color="#8FCF94" delay={0} />
        <FloatingParticle x={72} y={10} size={32} color="#D8B674" delay={1.2} />
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
            <p style={{ fontSize: 13, fontWeight: 600, color: CLR.muted, margin: 0 }}>{greeting} {'\u{1F44B}'}</p>
            <h1 style={{
              fontSize: 26, fontWeight: 800, margin: 0, lineHeight: '34px',
              background: 'linear-gradient(135deg, #2E5E3A, #4D7A38, #7AA344)',
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
              {isActiveToday ? 'Active Today' : 'Inactive Today'}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
              background: 'rgba(127,174,101,0.10)', color: '#3F8F3A',
              border: '1px solid rgba(127,174,101,0.15)',
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
                background: 'linear-gradient(135deg, #4D7A38, #3F8F3A)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {firstName} - Lv.{analytics.level}
              </h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: CLR.muted }}>XP Progress</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: CLR.purple }}>{analytics.xp} XP</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(124,58,237,0.10)', overflow: 'hidden', marginBottom: 10 }}>
              <motion.div
                style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #4D7A38, #A7C97F)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (analytics.xp % analytics.xpToNext / analytics.xpToNext) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: CLR.soft }}>Next Level: {analytics.xpToNext - (analytics.xp % analytics.xpToNext)} XP</span>
            </div>
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 12, background: 'rgba(127,174,101,0.08)' }}>
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
                <p style={{ fontSize: 18, fontWeight: 800, color: CLR.mint, margin: 0 }}>{weeklyLoginDays}</p>
                <p style={{ fontSize: 9, fontWeight: 600, color: CLR.soft, margin: 0 }}>Sessions</p>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: CLR.mint, margin: 0 }}>{totalHrs}h {totalMins}m</p>
                <p style={{ fontSize: 9, fontWeight: 600, color: CLR.soft, margin: 0 }}>Total Time</p>
              </div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 12, padding: '8px 12px', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>Avg Session</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: CLR.mint }}>{avgSession} min</span>
              </div>
            </div>
            <MiniWeekBars data={weeklyMinuteBars} color={CLR.mint} />
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
                <div style={{ height: 6, borderRadius: 3, background: `${s.color}12`, overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${s.color}, ${s.color}AA)` }}
                    initial={{ width: 0 }} animate={{ width: `${s.progress}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 + i * 0.05 }}
                  />
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
              <span style={{ fontSize: 12, fontWeight: 800, color: CLR.sky }}>{monthlyActiveDays} / {monthlyTotalDays} days</span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          2. ACADEMIC PERFORMANCE
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <GlassCard delay={0.06}>
        <SectionTitle icon={'\u{1F4DA}'} title="Academic Performance" subtitle="Subject-wise curriculum progress with chapters completed" />

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
                  background: `${s.color}08`, border: `1px solid ${s.color}12`,
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
              background: GRADIENTS.indigo,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: CLR.secondary }}>Overall Growth</span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: `${CLR.indigo}12`, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, #8FCF94, #3F8F3A)` }}
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          3. WEEKLY LEARNING TREND (Smooth Line Chart)
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <GlassCard gradient={GRADIENTS.indigo} delay={0.10}>
          <SectionTitle icon={'\u{1F4C8}'} title="Weekly Learning Trend" subtitle="Daily engagement curve over the past 7 days" />
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
                {avgSession}
              </motion.p>
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, margin: 0 }}>Avg / Day</p>
            </div>
            <div style={{ width: 1, background: `${CLR.muted}20` }} />
            <div style={{ textAlign: 'center' }}>
              <motion.p style={{ fontSize: 22, fontWeight: 800, color: '#5F8B3D', margin: 0 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                {dayLabels[analytics.weeklyMinutes.indexOf(Math.max(...analytics.weeklyMinutes))]}
              </motion.p>
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, margin: 0 }}>Most Active</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard gradient={GRADIENTS.rose} delay={0.14}>
          <SectionTitle icon={'\u{1F3AF}'} title="Learning Focus Distribution" subtitle="Time allocation across learning categories" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(() => {
              const focusTotalMin = analytics.activityDistribution.reduce((sum, item) => sum + item.minutes, 0);
              const focusItems = [...analytics.activityDistribution]
                .sort((a, b) => b.minutes - a.minutes)
                .map((item) => ({
                  icon: (item.label === 'Lessons' ? '📘' : item.label === 'Games' ? '🎮' : item.label === 'Reading' ? '📖' : item.label === 'Practice' ? '✏️' : '🎨'),
                  label: item.label,
                  pct: focusTotalMin > 0 ? Math.round((item.minutes / focusTotalMin) * 100) : 0,
                  minutes: item.minutes,
                  color: item.color,
                }));
              return focusItems.map((item, idx) => (
                <motion.div
                  key={item.label}
                  style={{
                    background: `${item.color}08`,
                    borderRadius: 14,
                    padding: '12px 16px',
                    border: `1px solid ${item.color}15`,
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...spring, delay: 0.16 + idx * 0.04 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: CLR.secondary }}>{item.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.pct}%</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: CLR.soft }}>{item.minutes} min</span>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: `${item.color}12`, overflow: 'hidden' }}>
                    <motion.div
                      style={{
                        height: '100%', borderRadius: 4,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + idx * 0.05 }}
                    />
                  </div>
                </motion.div>
              ));
            })()}
          </div>
        </GlassCard>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          4. LEARNING HUB ACTIVITY
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <GlassCard gradient={GRADIENTS.mint} delay={0.16}>
        <SectionTitle icon={'\u{1F680}'} title="Learning Hub Activity" subtitle="How the student engages across all learning sections" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>

          {/* Brain Boost */}
          {(() => {
            const brainGamesPlayed = analytics.subjects.reduce((a, s) => a + 0, 0);
            const brainPct = Math.min(100, Math.round((analytics.engagementScore * 0.7 + analytics.streakDays * 2)));
            return (
              <motion.div style={{
                background: 'rgba(255,255,255,0.70)', borderRadius: 18, padding: 20,
                border: '1px solid rgba(63,143,58,0.12)', textAlign: 'center',
              }} whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(63,143,58,0.12)' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, margin: '0 auto 10px',
                  background: 'linear-gradient(135deg, #3f8f3a, #8fcf94)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  boxShadow: '0 4px 14px rgba(63,143,58,0.30)',
                }}>{'\u{1F9E0}'}</div>
                <p style={{ fontSize: 13, fontWeight: 800, color: CLR.primary, margin: 0 }}>Brain Boost</p>
                <p style={{ fontSize: 10, fontWeight: 500, color: CLR.muted, marginTop: 2 }}>Thinking games</p>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(63,143,58,0.10)', marginTop: 10, overflow: 'hidden' }}>
                  <motion.div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #3f8f3a, #8fcf94)' }}
                    initial={{ width: 0 }} animate={{ width: `${brainPct}%` }} transition={{ duration: 0.8 }} />
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#3f8f3a', marginTop: 5 }}>{brainPct}% engagement</p>
              </motion.div>
            );
          })()}

          {/* Puzzle Zone */}
          {(() => {
            const puzzlePct = Math.min(100, Math.round((analytics.overallProgress * 0.6 + analytics.streakDays * 2.5)));
            return (
              <motion.div style={{
                background: 'rgba(255,255,255,0.70)', borderRadius: 18, padding: 20,
                border: '1px solid rgba(16,185,129,0.12)', textAlign: 'center',
              }} whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(16,185,129,0.12)' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, margin: '0 auto 10px',
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  boxShadow: '0 4px 14px rgba(16,185,129,0.30)',
                }}>{'\u{1F9E9}'}</div>
                <p style={{ fontSize: 13, fontWeight: 800, color: CLR.primary, margin: 0 }}>Puzzle Zone</p>
                <p style={{ fontSize: 10, fontWeight: 500, color: CLR.muted, marginTop: 2 }}>Logic & matching</p>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(16,185,129,0.10)', marginTop: 10, overflow: 'hidden' }}>
                  <motion.div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #10b981, #34d399)' }}
                    initial={{ width: 0 }} animate={{ width: `${puzzlePct}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#10b981', marginTop: 5 }}>{puzzlePct}% engagement</p>
              </motion.div>
            );
          })()}

          {/* Games */}
          {(() => {
            const totalGamesPlayed = analytics.totalSessions;
            const gamesPct = Math.min(100, Math.round(analytics.engagementScore * 0.9));
            return (
              <motion.div style={{
                background: 'rgba(255,255,255,0.70)', borderRadius: 18, padding: 20,
                border: `1px solid ${CLR.amber}1a`, textAlign: 'center',
              }} whileHover={{ y: -3, boxShadow: `0 8px 24px ${CLR.amber}1a` }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, margin: '0 auto 10px',
                  background: `linear-gradient(135deg, ${CLR.amber}, #fbbf24)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  boxShadow: `0 4px 14px ${CLR.amber}40`,
                }}>{'\u{1F3AE}'}</div>
                <p style={{ fontSize: 13, fontWeight: 800, color: CLR.primary, margin: 0 }}>Games</p>
                <p style={{ fontSize: 10, fontWeight: 500, color: CLR.muted, marginTop: 2 }}>{totalGamesPlayed} sessions played</p>
                <div style={{ height: 6, borderRadius: 3, background: `${CLR.amber}15`, marginTop: 10, overflow: 'hidden' }}>
                  <motion.div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${CLR.amber}, #fbbf24)` }}
                    initial={{ width: 0 }} animate={{ width: `${gamesPct}%` }} transition={{ duration: 0.8, delay: 0.15 }} />
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, color: CLR.amber, marginTop: 5 }}>{gamesPct}% active</p>
              </motion.div>
            );
          })()}

          {/* Journey */}
          {(() => {
            const journeyPct = Math.min(100, Math.round(analytics.overallProgress * 0.85 + analytics.level * 3));
            return (
              <motion.div style={{
                background: 'rgba(255,255,255,0.70)', borderRadius: 18, padding: 20,
                border: `1px solid ${CLR.rose}1a`, textAlign: 'center',
              }} whileHover={{ y: -3, boxShadow: `0 8px 24px ${CLR.rose}1a` }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, margin: '0 auto 10px',
                  background: `linear-gradient(135deg, ${CLR.rose}, #fb7185)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  boxShadow: `0 4px 14px ${CLR.rose}40`,
                }}>{'\u{1F5FA}\uFE0F'}</div>
                <p style={{ fontSize: 13, fontWeight: 800, color: CLR.primary, margin: 0 }}>Journey</p>
                <p style={{ fontSize: 10, fontWeight: 500, color: CLR.muted, marginTop: 2 }}>Level {analytics.level} reached</p>
                <div style={{ height: 6, borderRadius: 3, background: `${CLR.rose}15`, marginTop: 10, overflow: 'hidden' }}>
                  <motion.div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${CLR.rose}, #fb7185)` }}
                    initial={{ width: 0 }} animate={{ width: `${journeyPct}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, color: CLR.rose, marginTop: 5 }}>{journeyPct}% progress</p>
              </motion.div>
            );
          })()}
        </div>
      </GlassCard>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          5. PARENT INSIGHTS + AI SUGGESTION
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <GlassCard gradient={GRADIENTS.purple} delay={0.20}>
        <SectionTitle icon={'\u{1F4A1}'} title="Parent Insights" subtitle="Actionable observations and AI-powered recommendations" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {analytics.alerts.map((a, i) => (
            <InsightCard key={a.id} alert={a} delay={0.22 + i * 0.04} />
          ))}

          {/* AI Insight card */}
          <motion.div
            style={{
              background: 'linear-gradient(135deg, rgba(127,174,101,0.08), rgba(167,201,127,0.05))',
              border: '1px solid rgba(127,174,101,0.15)',
              borderLeft: '4px solid #8FCF94',
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
              background: 'linear-gradient(135deg, #8FCF94, #A7C97F)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
              boxShadow: '0 2px 8px rgba(127,174,101,0.3)',
            }}>{'\u{1F9E0}'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: CLR.primary }}>AI Learning Advisor</span>
                <span style={{
                  fontSize: 8, fontWeight: 700, color: '#8FCF94',
                  background: 'rgba(127,174,101,0.12)',
                  padding: '2px 8px', borderRadius: 6, letterSpacing: '0.05em',
                }}>AI POWERED</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: CLR.muted, lineHeight: '19px', margin: 0 }}>
                Hindi reading has improved by 14% - encourage continued story-based practice. Math accuracy at 58% needs
                targeted reinforcement with 10-minute daily pattern exercises. Gujarati letter tracing practice could boost
                visual recognition by 20%. Space War engagement remains strong - leverage it for multi-subject quiz sessions.
              </p>
            </div>
          </motion.div>
        </div>
      </GlassCard>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          6. AI WEEKLY INSIGHT SUMMARY
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <GlassCard gradient={GRADIENTS.indigo} delay={0.24}>
        <SectionTitle icon={'\u{1F916}'} title="AI Weekly Insight" subtitle="This week's learning summary powered by AI" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Quick stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Learning', value: `${weeklyTotal} min`, icon: '\u23F1\uFE0F', color: CLR.indigo },
              { label: 'Avg/Day', value: `${avgSession} min`, icon: '\u{1F4CA}', color: CLR.sky },
              { label: 'Active', value: `${activeDaysCount}/7 days`, icon: '\u{1F4C5}', color: CLR.mint },
              { label: 'Engagement', value: `${analytics.engagementScore}%`, icon: '\u{1F3AF}', color: CLR.purple },
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
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, margin: 0 }}>Strongest Subject</p>
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
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, margin: 0 }}>Needs Focus</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B', margin: '4px 0 0' }}>
                {analytics.subjects.length > 0 ? [...analytics.subjects].sort((a, b) => a.progress - b.progress)[0]?.subject : 'N/A'}
              </p>
            </motion.div>
          </div>

          {/* AI tip */}
          <motion.div
            style={{
              background: 'linear-gradient(135deg, rgba(63,143,58,0.06), rgba(122,163,68,0.04))',
              border: '1px solid rgba(63,143,58,0.12)',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex', gap: 12, alignItems: 'center',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.42 }}
          >
            <span style={{ fontSize: 20 }}>{'\u{1F4A1}'}</span>
            <p style={{ fontSize: 11, fontWeight: 500, color: CLR.secondary, lineHeight: '17px', margin: 0 }}>
              Schedule 10 minutes of practice worksheets for weaker subjects. Use the <strong>AI Practice Lab</strong> in the AI Insights tab to generate custom worksheets!
            </p>
          </motion.div>
        </div>
      </GlassCard>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          LIVE MONITORING WIDGET (bottom-left)
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <motion.div
        style={{
          position: 'fixed', bottom: 24, left: 260, zIndex: 50,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRadius: 18,
          padding: '16px 20px',
          border: '1px solid rgba(127,174,101,0.15)',
          boxShadow: '0 4px 24px rgba(92,106,196,0.10), 0 1px 4px rgba(92,106,196,0.04)',
          minWidth: 220,
        }}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...spring, delay: 0.6 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <motion.div
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: CLR.primary, letterSpacing: '0.03em' }}>LIVE STATUS</span>
          <span style={{
            fontSize: 8, fontWeight: 700, color: isActiveToday ? '#10B981' : '#F59E0B',
            background: isActiveToday ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
            padding: '2px 8px', borderRadius: 6,
          }}>{isActiveToday ? 'Active Today' : 'No Activity Today'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>Last Session</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: CLR.secondary }}>{lastSessionLabel}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>Session Length</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: CLR.secondary }}>{analytics.avgSessionMinutes} min</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>Current Activity</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: CLR.indigo }}>{currentActivityLabel}</span>
          </div>
        </div>
      </motion.div>

      {/* Floating gradient shapes (background decoration) */}
      <div style={{ position: 'fixed', top: 120, right: 60, width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(95,139,61,0.06), transparent)',
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

