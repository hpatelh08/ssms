/**
 * parent/pages/AttendancePage.tsx
 * ─────────────────────────────────────────────────────
 * PREMIUM Attendance Intelligence + Reports Page
 *
 * Color System:
 *   Primary text: #3B3FAF (deep indigo)
 *   Secondary: #6B6FCF
 *   Muted: #8F94D4
 *   NO black text anywhere.
 *
 * Sections:
 *  1. Attendance Summary Cards — Present/Absent/Holiday/Rate
 *  2. Full Monthly Calendar — day grid with status colors
 *  3. Weekly Activity Analytics — bar chart + stats
 *  4. Study Streak — gamification card
 *  5. Activity Breakdown — SVG pie/donut chart
 *  6. Parent Alerts — pastel colored alert cards
 *  7. Monthly Progress Summary — 5 metric cards
 *  8. Downloadable Report Card — button
 *
 * SVG-only charts. Framer Motion animations.
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { useParentAnalytics } from '../analytics/useParentAnalytics';
import {
  MONTHLY_SUMMARY,
  ATTENDANCE_ALERTS,
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
  indigo: '#f59e0b',
  mint: '#10B981',
  sky: '#38BDF8',
  peach: '#FB923C',
  rose: '#F472B6',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  emerald: '#10B981',
  present: '#34D399',
  absent: '#EF4444',
  holiday: '#FACC15',
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
  xp:         'linear-gradient(135deg, #fef3c7 0%, #F3E8FF 50%, #FCE7F3 100%)',
  growth:     'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 50%, #F0FDF4 100%)',
  attendance: 'linear-gradient(135deg, #DBEAFE 0%, #E0F2FE 50%, #EFF6FF 100%)',
  streak:     'linear-gradient(135deg, #FEF3C7 0%, #FFEDD5 50%, #FFF7ED 100%)',
  rose:       'linear-gradient(135deg, #FCE7F3 0%, #FDF2F8 50%, #FFF1F2 100%)',
  presentCard: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 50%, #6EE7B7 100%)',
  absentCard:  'linear-gradient(135deg, #FEE2E2 0%, #FECACA 50%, #FCA5A5 100%)',
  holidayCard: 'linear-gradient(135deg, #FEF9C3 0%, #FDE68A 50%, #FCD34D 100%)',
  rateCard:    'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 50%, #93C5FD 100%)',
};

/* ── Calendar data types ────────────────────────── */
type DayStatus = 'present' | 'absent' | 'holiday' | 'future' | 'empty';

interface CalendarDay {
  date: number;
  status: DayStatus;
  isToday: boolean;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ── Generate deterministic attendance data ─────── */
function generateMonthData(year: number, month: number): CalendarDay[] {
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const isFuture = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());

  // Seed-based pseudo-random for consistent absent days per month
  const seed = year * 100 + month;
  const pseudoRand = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 4973) * 10000;
    return x - Math.floor(x);
  };

  // Pick 2–3 absent school days per month
  const absentSet = new Set<number>();
  const schoolDays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0 && dow !== 6) schoolDays.push(d);
  }
  const numAbsent = pseudoRand(0) > 0.5 ? 3 : 2;
  for (let i = 0; i < numAbsent && schoolDays.length > 0; i++) {
    const idx = Math.floor(pseudoRand(i + 1) * schoolDays.length);
    absentSet.add(schoolDays[idx]);
    schoolDays.splice(idx, 1);
  }

  // Holiday list: national holidays (approximate for India school calendar)
  const holidaySet = new Set<number>();
  // Add 2nd and 4th Saturday as holidays
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow === 6) {
      const weekNum = Math.ceil(d / 7);
      if (weekNum === 2 || weekNum === 4) holidaySet.add(d);
    }
  }
  // Add a random holiday for festive occasions
  if (schoolDays.length > 3) {
    const hIdx = Math.floor(pseudoRand(99) * schoolDays.length);
    holidaySet.add(schoolDays[hIdx]);
  }

  const days: CalendarDay[] = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    days.push({ date: 0, status: 'empty', isToday: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    const isToday = isCurrentMonth && d === today.getDate();

    if (isFuture || (isCurrentMonth && d > today.getDate())) {
      days.push({ date: d, status: 'future', isToday: false });
    } else if (dow === 0) {
      // All Sundays are holidays
      days.push({ date: d, status: 'holiday', isToday });
    } else if (holidaySet.has(d)) {
      days.push({ date: d, status: 'holiday', isToday });
    } else if (absentSet.has(d)) {
      days.push({ date: d, status: 'absent', isToday });
    } else {
      days.push({ date: d, status: 'present', isToday });
    }
  }

  return days;
}

/* ── Count-up ───────────────────────────────────── */

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
    whileHover={{ y: -2, boxShadow: '0 6px 28px rgba(92,106,196,0.10), 0 2px 6px rgba(92,106,196,0.04)' }}
  >
    {children}
  </motion.div>
);

/* ── Circular Progress Ring ─────────────────────── */

const CircleRing: React.FC<{
  value: number; size?: number; strokeWidth?: number; color?: string; label?: string;
}> = ({ value, size = 110, strokeWidth = 9, color = CLR.indigo, label }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  const animVal = useCountUp(value);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="attCircGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}88`} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}12`} strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#attCircGrad)"
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: CLR.primary }}>{animVal}%</span>
        {label && <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, marginTop: 2 }}>{label}</span>}
      </div>
    </div>
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

/* ── Weekly Line/Area Chart (activity analytics) ── */

const WeeklyBarChart: React.FC<{ data: { day: string; minutes: number }[]; color?: string; height?: number }> = ({
  data, color = '#7C6CFF', height = 210,
}) => {
  const w = 420;
  const pad = { top: 14, right: 14, bottom: 32, left: 42 };
  const chartH = height - pad.top - pad.bottom;
  const maxVal = Math.max(...data.map(d => d.minutes), 1);
  const chartW = w - pad.left - pad.right;
  const step = chartW / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = pad.left + step * i;
    const y = pad.top + chartH - (d.minutes / maxVal) * chartH;
    return { ...d, x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${pad.top + chartH} L ${points[0].x} ${pad.top + chartH} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height}>
      <defs>
        <linearGradient id="wline-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0.04} />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = pad.top + chartH - f * chartH;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke={`${CLR.muted}14`} strokeWidth={1} />
            <text x={pad.left - 6} y={y + 3} textAnchor="end" fontSize={9} fill={CLR.soft} fontWeight={500}>
              {Math.round(maxVal * f)}
            </text>
          </g>
        );
      })}

      {areaPath && (
        <motion.path
          d={areaPath}
          fill="url(#wline-area)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}

      {linePath && (
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.8 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      )}

      {points.map((p, i) => {
        return (
          <g key={p.day}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={4.5}
              fill="#fff"
              stroke={color}
              strokeWidth={2.5}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.35, delay: 0.2 + i * 0.06 }}
            />
            <text x={p.x} y={pad.top + chartH + 16} textAnchor="middle" fontSize={10} fill={CLR.muted} fontWeight={600}>
              {p.day}
            </text>
            <motion.text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={9} fontWeight={700} fill="#7C6CFF"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.06 }}>
              {p.minutes}m
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
};

/* ── Donut Chart (activity breakdown) ───────────── */

const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number; strokeWidth?: number;
}> = ({ data, size = 180, strokeWidth = 28 }) => {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  let cumOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${CLR.muted}10`} strokeWidth={strokeWidth} />
      {data.map((d, i) => {
        const pct = d.value / total;
        const dashLen = pct * circ;
        const gapLen = circ - dashLen;
        const offset = cumOffset;
        cumOffset += dashLen;
        return (
          <motion.circle
            key={d.label}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={strokeWidth - 2}
            strokeLinecap="round"
            strokeDasharray={`${dashLen - 3} ${gapLen + 3}`}
            strokeDashoffset={-offset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
          />
        );
      })}
    </svg>
  );
};

/* ── Alert severity styles ──────────────────────── */

const ALERT_STYLES: Record<string, { bg: string; border: string; dot: string; icon: string }> = {
  warning: { bg: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))', border: 'rgba(251,191,36,0.18)', dot: '#FBBF24', icon: '🟡' },
  danger:  { bg: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(239,68,68,0.04))', border: 'rgba(244,114,182,0.18)', dot: '#F472B6', icon: '⚠️' },
  success: { bg: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.04))', border: 'rgba(16,185,129,0.18)', dot: '#10B981', icon: '🟢' },
  info:    { bg: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(99,102,241,0.04))', border: 'rgba(56,189,248,0.18)', dot: '#38BDF8', icon: '🔵' },
};

function drawRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function buildWeeklyChartImage(minutes: number[]): string {
  const canvas = document.createElement('canvas');
  canvas.width = 880;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#fef3c7');
  bg.addColorStop(1, '#f5f3ff');
  drawRoundedRectPath(ctx, 0, 0, canvas.width, canvas.height, 24);
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.fillStyle = '#3B3FAF';
  ctx.font = '700 24px Nunito, sans-serif';
  ctx.fillText('Weekly Learning Activity', 28, 42);

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(10, ...minutes);
  const chartX = 28;
  const chartY = 80;
  const chartW = canvas.width - 56;
  const chartH = 220;
  const barGap = 18;
  const barW = (chartW - barGap * (labels.length - 1)) / labels.length;

  ctx.strokeStyle = 'rgba(99,102,241,0.16)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = chartY + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(chartX, y);
    ctx.lineTo(chartX + chartW, y);
    ctx.stroke();
  }

  minutes.forEach((value, i) => {
    const ratio = value / max;
    const barH = Math.max(4, chartH * ratio);
    const x = chartX + i * (barW + barGap);
    const y = chartY + chartH - barH;

    const grad = ctx.createLinearGradient(0, y, 0, y + barH);
    grad.addColorStop(0, '#fbbf24');
    grad.addColorStop(1, '#fcd34d');
    drawRoundedRectPath(ctx, x, y, barW, barH, 10);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.font = '600 14px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(value), x + barW / 2, y - 8);

    ctx.fillStyle = '#7C83C6';
    ctx.font = '700 13px Nunito, sans-serif';
    ctx.fillText(labels[i], x + barW / 2, chartY + chartH + 22);
  });

  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png');
}

function buildAttendanceImage(present: number, absent: number, holidays: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 880;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#ecfeff');
  bg.addColorStop(1, '#eff6ff');
  drawRoundedRectPath(ctx, 0, 0, canvas.width, canvas.height, 24);
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.fillStyle = '#3B3FAF';
  ctx.font = '700 24px Nunito, sans-serif';
  ctx.fillText('Attendance Distribution', 28, 42);

  const cx = 220;
  const cy = 195;
  const radius = 100;
  const lineWidth = 36;
  const total = Math.max(1, present + absent + holidays);
  const slices = [
    { label: 'Present', value: present, color: '#10B981' },
    { label: 'Absent', value: absent, color: '#EF4444' },
    { label: 'Holiday', value: holidays, color: '#F59E0B' },
  ];

  let start = -Math.PI / 2;
  slices.forEach((slice) => {
    const angle = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.strokeStyle = slice.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    start += angle;
  });

  ctx.fillStyle = '#d97706';
  ctx.textAlign = 'center';
  ctx.font = '700 28px Nunito, sans-serif';
  ctx.fillText(`${Math.round((present / total) * 100)}%`, cx, cy + 8);
  ctx.font = '600 12px Nunito, sans-serif';
  ctx.fillStyle = '#7C83C6';
  ctx.fillText('Attendance Rate', cx, cy + 28);

  ctx.textAlign = 'left';
  slices.forEach((slice, i) => {
    const y = 130 + i * 58;
    ctx.fillStyle = slice.color;
    drawRoundedRectPath(ctx, 430, y - 18, 18, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#4754B8';
    ctx.font = '700 17px Nunito, sans-serif';
    ctx.fillText(slice.label, 460, y - 2);
    ctx.font = '600 15px Nunito, sans-serif';
    ctx.fillStyle = '#6E78C8';
    ctx.fillText(`${slice.value} day${slice.value === 1 ? '' : 's'}`, 460, y + 20);
  });

  return canvas.toDataURL('image/png');
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export const AttendancePage: React.FC = () => {
  const analytics = useParentAnalytics();

  /* ── Calendar state ── */
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const calendarDays = useMemo(() => generateMonthData(viewYear, viewMonth), [viewYear, viewMonth]);

  /* ── Calendar stats ── */
  const calendarStats = useMemo(() => {
    const real = calendarDays.filter(d => d.date > 0 && d.status !== 'future' && d.status !== 'empty');
    const present = real.filter(d => d.status === 'present').length;
    const absent = real.filter(d => d.status === 'absent').length;
    const holidays = real.filter(d => d.status === 'holiday').length;
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { present, absent, holidays, rate, total: real.length };
  }, [calendarDays]);

  /* ── Navigate months ── */
  const goPrev = useCallback(() => {
    setViewMonth(m => {
      if (m === 0) { setViewYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);
  const goNext = useCallback(() => {
    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    if (isCurrentMonth) return; // Can't go past current month
    setViewMonth(m => {
      if (m === 11) { setViewYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, [viewYear, viewMonth, today]);

  /* ── Weekly learning minutes (activity analytics) ── */
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return analytics.weeklyMinutes.map((m, i) => ({ day: days[i], minutes: m }));
  }, [analytics.weeklyMinutes]);

  const weeklyStats = useMemo(() => {
    const mins = analytics.weeklyMinutes;
    const total = mins.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / 7);
    const maxIdx = mins.indexOf(Math.max(...mins));
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const focusScore = Math.min(100, Math.round((total / (7 * 45)) * 100)); // 45 min/day = 100%
    return { totalMin: total, avgMin: avg, bestDay: dayNames[maxIdx], focusScore };
  }, [analytics.weeklyMinutes]);

  /* ── Study streak ── */
  const streakDays = 5; // From FLOOR data

  /* ── Activity breakdown for donut ── */
  const activityData = useMemo(() =>
    analytics.activityDistribution.map(a => ({
      label: a.label,
      value: a.minutes,
      color: a.color,
    }))
  , [analytics.activityDistribution]);
  const totalActivityMin = activityData.reduce((a, d) => a + d.value, 0);

  /* ── Alerts from centralized mock ── */
  const alerts = useMemo(() => [...ATTENDANCE_ALERTS], []);

  /* ── Monthly summary data ── */
  const totalLearningHrs = useMemo(() => {
    const totalMin = analytics.weeklyMinutes.reduce((a, b) => a + b, 0);
    return Math.max(11, Math.round(totalMin * 4 / 60));
  }, [analytics.weeklyMinutes]);

  /* ── Report download handler ── */
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const handleDownload = useCallback(() => {
    if (downloadState === 'downloading') return;

    setDownloadState('downloading');

    window.setTimeout(() => {
      try {
        const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
        const generatedAt = new Date().toLocaleString();

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFillColor(238, 242, 255);
        doc.rect(0, 0, pageWidth, 36, 'F');

        doc.setTextColor(59, 63, 175);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Std 4 Monthly Report Card', 14, 16);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(109, 121, 199);
        doc.text(`Month: ${monthLabel}`, 14, 24);
        doc.text(`Generated: ${generatedAt}`, 14, 30);
        doc.text('Guardian Console · Parent Analytics', 130, 30, { align: 'right' });

        doc.setDrawColor(210, 219, 255);
        doc.line(14, 40, pageWidth - 14, 40);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 63, 175);
        doc.setFontSize(13);
        doc.text('Key Highlights', 14, 49);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(76, 89, 180);
        doc.setFontSize(10.5);
        const highlights = [
          `Attendance Rate: ${calendarStats.rate}% (${calendarStats.present} present, ${calendarStats.absent} absent, ${calendarStats.holidays} holidays)`,
          `Engagement Score: ${analytics.engagementScore}% · Avg Session: ${analytics.avgSessionMinutes} min`,
          `Completed Chapters: ${MONTHLY_SUMMARY.completedChapters} · Activities: ${MONTHLY_SUMMARY.activitiesCompleted}`,
          `Learning Time: ${totalLearningHrs} hours (monthly estimate) · Best Day: ${weeklyStats.bestDay}`,
        ];
        highlights.forEach((line, index) => {
          doc.text(`• ${line}`, 16, 56 + index * 7);
        });

        const attendanceImage = buildAttendanceImage(calendarStats.present, calendarStats.absent, calendarStats.holidays);
        if (attendanceImage) {
          doc.addImage(attendanceImage, 'PNG', 14, 86, 182, 74, undefined, 'FAST');
        }

        const weeklyImage = buildWeeklyChartImage(analytics.weeklyMinutes);
        if (weeklyImage) {
          doc.addImage(weeklyImage, 'PNG', 14, 168, 182, 74, undefined, 'FAST');
        }

        doc.addPage();
        doc.setFillColor(245, 243, 255);
        doc.rect(0, 0, pageWidth, 28, 'F');
        doc.setTextColor(59, 63, 175);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Detailed Insights & Recommendations', 14, 18);

        doc.setFontSize(12);
        doc.text('Activity Breakdown', 14, 38);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        let cursorY = 46;
        activityData.forEach((item) => {
          doc.setTextColor(76, 89, 180);
          doc.text(`• ${item.label}: ${item.value} min`, 16, cursorY);
          cursorY += 6.5;
        });

        cursorY += 3;
        doc.setTextColor(59, 63, 175);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Alerts & AI Recommendations', 14, cursorY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        cursorY += 8;
        alerts.forEach((alert, index) => {
          const wrapped = doc.splitTextToSize(`${index + 1}. ${alert.title}: ${alert.desc}`, 176);
          doc.setTextColor(76, 89, 180);
          doc.text(wrapped, 16, cursorY);
          cursorY += wrapped.length * 5.2 + 2;
          if (cursorY > pageHeight - 16) {
            doc.addPage();
            cursorY = 20;
          }
        });

        const fileName = `monthly-report-${viewYear}-${String(viewMonth + 1).padStart(2, '0')}.pdf`;
        doc.save(fileName);

        setDownloadState('done');
        window.setTimeout(() => setDownloadState('idle'), 2000);
      } catch {
        setDownloadState('idle');
      }
    }, 600);
  }, [
    downloadState,
    viewMonth,
    viewYear,
    calendarStats,
    analytics.weeklyMinutes,
    analytics.engagementScore,
    analytics.avgSessionMinutes,
    totalLearningHrs,
    weeklyStats,
    activityData,
    alerts,
  ]);

  /* ── Calendar day color ── */
  const getDayStyle = (status: DayStatus) => {
    switch (status) {
      case 'present':
        return { bg: 'linear-gradient(135deg, rgba(52,211,153,0.25), rgba(16,185,129,0.15))', border: '1px solid rgba(52,211,153,0.35)', color: '#059669' };
      case 'absent':
        return { bg: 'linear-gradient(135deg, rgba(239,68,68,0.20), rgba(252,165,165,0.12))', border: '1px solid rgba(239,68,68,0.30)', color: '#DC2626' };
      case 'holiday':
        return { bg: 'linear-gradient(135deg, rgba(250,204,21,0.22), rgba(253,224,71,0.12))', border: '1px solid rgba(250,204,21,0.35)', color: '#B45309' };
      case 'future':
        return { bg: 'rgba(241,245,249,0.4)', border: '1px solid rgba(226,232,240,0.3)', color: '#CBD5E1' };
      default:
        return { bg: 'transparent', border: '1px solid transparent', color: 'transparent' };
    }
  };

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40, position: 'relative' }}>

      {/* Floating particles */}
      <FloatingParticle delay={0} size={80} color="#06B6D4" left="4%" top="3%" />
      <FloatingParticle delay={1.2} size={60} color="#F472B6" left="88%" top="6%" />
      <FloatingParticle delay={2.5} size={55} color="#10B981" left="90%" top="50%" />
      <FloatingParticle delay={3.2} size={65} color="#F59E0B" left="2%" top="60%" />

      {/* ═══ PAGE HEADER ═══ */}
      <motion.div
        style={{ marginBottom: 28 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, color: CLR.primary, margin: 0, lineHeight: '34px' }}>
          Attendance Intelligence & Reports
        </h1>
        <p style={{ fontSize: 13, fontWeight: 500, color: CLR.muted, marginTop: 4 }}>
          Complete attendance tracking, learning analytics, and activity insights.
        </p>
      </motion.div>

      {/* ═══ SECTION 1 — ATTENDANCE SUMMARY CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Present Days', value: calendarStats.present, icon: '✅', gradient: CARD_GRADIENTS.presentCard, accent: '#059669' },
          { label: 'Absent Days', value: calendarStats.absent, icon: '❌', gradient: CARD_GRADIENTS.absentCard, accent: '#DC2626' },
          { label: 'Holidays', value: calendarStats.holidays, icon: '🏖️', gradient: CARD_GRADIENTS.holidayCard, accent: '#B45309' },
          { label: 'Attendance Rate', value: `${calendarStats.rate}%`, icon: '📊', gradient: CARD_GRADIENTS.rateCard, accent: '#2563EB' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            style={{
              background: card.gradient,
              borderRadius: 18, padding: '20px 16px',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 2px 12px rgba(92,106,196,0.06)',
              textAlign: 'center',
            }}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring, delay: 0.1 + i * 0.06 }}
            whileHover={{ y: -3, scale: 1.03 }}
          >
            <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>{card.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 800, color: card.accent, margin: 0, lineHeight: '32px' }}>
              {card.value}
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, color: CLR.muted, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {card.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ═══ SECTION 2 — FULL MONTHLY CALENDAR ═══ */}
      <GlassCard delay={0.15} style={{ marginBottom: 24 }}>
        <SectionTitle title="Monthly Attendance Calendar" subtitle="Complete attendance record with status indicators" icon="📅" />

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <motion.button
            onClick={goPrev}
            style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 12, padding: '8px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: CLR.indigo,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          >
            ← Prev
          </motion.button>

          <motion.div
            key={`${viewYear}-${viewMonth}`}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center' }}
          >
            <span style={{ fontSize: 18, fontWeight: 800, color: CLR.primary }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            {isCurrentMonth && (
              <span style={{
                display: 'inline-block', marginLeft: 10,
                fontSize: 9, fontWeight: 700, color: '#fff',
                background: 'linear-gradient(135deg, #fbbf24, #fcd34d)',
                padding: '2px 10px', borderRadius: 8,
              }}>CURRENT</span>
            )}
          </motion.div>

          <motion.button
            onClick={goNext}
            disabled={isCurrentMonth}
            style={{
              background: isCurrentMonth ? 'rgba(200,200,220,0.1)' : 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 12, padding: '8px 16px',
              cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
              color: isCurrentMonth ? CLR.soft : CLR.indigo,
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: isCurrentMonth ? 0.5 : 1,
            }}
            whileHover={!isCurrentMonth ? { scale: 1.04 } : {}}
            whileTap={!isCurrentMonth ? { scale: 0.97 } : {}}
          >
            Next →
          </motion.button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
          {DAY_HEADERS.map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 11, fontWeight: 700,
              color: i === 0 ? CLR.rose : CLR.muted,
              textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${viewYear}-${viewMonth}`}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}
          >
            {calendarDays.map((day, idx) => {
              if (day.status === 'empty') {
                return <div key={`e-${idx}`} style={{ height: 44 }} />;
              }
              const s = getDayStyle(day.status);
              return (
                <motion.div
                  key={`${day.date}-${idx}`}
                  style={{
                    height: 44, borderRadius: 12,
                    background: s.bg, border: s.border,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    boxShadow: day.isToday ? '0 0 0 2px rgba(99,102,241,0.5), 0 2px 8px rgba(99,102,241,0.15)' : 'none',
                  }}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.02 * idx, duration: 0.2 }}
                  whileHover={day.status !== 'future' ? { scale: 1.08 } : {}}
                >
                  <span style={{
                    fontSize: 13, fontWeight: day.isToday ? 800 : 600,
                    color: s.color,
                  }}>
                    {day.date}
                  </span>
                  {day.isToday && (
                    <div style={{
                      position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: '50%',
                      background: CLR.indigo,
                    }} />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Color Legend */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Present', color: CLR.present, bg: 'rgba(52,211,153,0.25)' },
            { label: 'Absent', color: CLR.absent, bg: 'rgba(239,68,68,0.20)' },
            { label: 'Holiday / Sunday', color: CLR.holiday, bg: 'rgba(250,204,21,0.22)' },
          ].map(legend => (
            <div key={legend.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 16, height: 16, borderRadius: 6,
                background: legend.bg,
                border: `1px solid ${legend.color}40`,
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: CLR.secondary }}>{legend.label}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ═══ SECTION 3 — WEEKLY ACTIVITY ANALYTICS ═══ */}
      <GlassCard delay={0.25} style={{ marginBottom: 24 }}>
        <SectionTitle title="Learning Activity Analytics" subtitle="Weekly study patterns and performance metrics" icon="📈" />

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Study Time', value: `${Math.floor(weeklyStats.totalMin / 60)}h ${weeklyStats.totalMin % 60}m`, icon: '⏱️', accent: CLR.indigo },
            { label: 'Average / Day', value: `${weeklyStats.avgMin} min`, icon: '📐', accent: CLR.cyan },
            { label: 'Most Active Day', value: weeklyStats.bestDay, icon: '🌟', accent: CLR.amber },
            { label: 'Focus Score', value: `${weeklyStats.focusScore}%`, icon: '🎯', accent: CLR.mint },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              style={{
                background: `${stat.accent}08`,
                borderRadius: 14, padding: '14px 12px',
                border: `1px solid ${stat.accent}15`,
                textAlign: 'center',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.3 + i * 0.06 }}
            >
              <span style={{ fontSize: 18, display: 'block', marginBottom: 6 }}>{stat.icon}</span>
              <p style={{ fontSize: 16, fontWeight: 800, color: stat.accent, margin: 0 }}>{stat.value}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: CLR.muted, marginTop: 4, textTransform: 'uppercase' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Line/area chart */}
        <WeeklyBarChart data={weeklyData} height={210} />
      </GlassCard>

      {/* ═══ SECTION 4 — STUDY STREAK ═══ */}
      <motion.div
        style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FFEDD5 40%, #FFF7ED 100%)',
          borderRadius: 22, padding: 28,
          border: '1px solid rgba(251,191,36,0.20)',
          boxShadow: '0 4px 20px rgba(245,158,11,0.08)',
          marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.3 }}
        whileHover={{ y: -2 }}
      >
        {/* Fire icon */}
        <motion.div
          style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.10))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, flexShrink: 0,
          }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          🔥
        </motion.div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 42, fontWeight: 900, color: '#B45309', lineHeight: '44px' }}>{streakDays}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#D97706' }}>Day Streak!</span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#92400E', margin: 0, lineHeight: '18px' }}>
            Yash has been learning consistently for {streakDays} days in a row. Keep it up to earn bonus XP and special badges!
          </p>
          {/* Mini streak dots */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {Array.from({ length: 7 }, (_, i) => (
              <motion.div
                key={i}
                style={{
                  width: 22, height: 22, borderRadius: 8,
                  background: i < streakDays
                    ? 'linear-gradient(135deg, #F59E0B, #FBBF24)'
                    : 'rgba(217,119,6,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: i < streakDays ? '#fff' : '#D97706',
                  fontWeight: 700,
                  border: i < streakDays ? 'none' : '1px dashed rgba(217,119,6,0.25)',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                {i < streakDays ? '✓' : (i + 1)}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Decorative sparkle */}
        <motion.div
          style={{ position: 'absolute', top: 12, right: 16, fontSize: 24, opacity: 0.3 }}
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >✨</motion.div>
      </motion.div>

      {/* ═══ SECTION 5 — ACTIVITY BREAKDOWN ═══ */}
      <GlassCard delay={0.35} style={{ marginBottom: 24 }}>
        <SectionTitle title="Activity Breakdown" subtitle="Distribution of learning activities this month" icon="📊" />
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <DonutChart data={activityData} size={190} strokeWidth={30} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: CLR.primary }}>{totalActivityMin}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>Total Min</span>
            </div>
          </div>

          <div>
            {activityData.map((a, i) => {
              const pct = Math.round((a.value / totalActivityMin) * 100);
              return (
                <motion.div
                  key={a.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '8px 12px', borderRadius: 12, background: `${a.color}08` }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                >
                  <div style={{
                    width: 12, height: 12, borderRadius: 4, background: a.color,
                    boxShadow: `0 2px 6px ${a.color}30`,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: CLR.secondary, flex: 1 }}>{a.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: a.color }}>{a.value} min</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: CLR.muted,
                    background: `${a.color}10`,
                    padding: '2px 8px', borderRadius: 6,
                  }}>{pct}%</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* ═══ SECTION 6 — PARENT ALERTS ═══ */}
      <GlassCard delay={0.4} style={{ marginBottom: 24 }}>
        <SectionTitle title="Parent Alerts" subtitle="Important notifications and learning updates" icon="🔔" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {alerts.map((alert, i) => {
            const s = ALERT_STYLES[alert.severity] || ALERT_STYLES.info;
            return (
              <motion.div
                key={alert.title}
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderLeft: `4px solid ${s.dot}`,
                  borderRadius: 16, padding: '16px 20px',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.45 + i * 0.08 }}
                whileHover={{ x: 3, boxShadow: `0 4px 20px ${s.dot}12` }}
              >
                <span style={{ fontSize: 16, marginTop: 1 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: CLR.primary, margin: 0, marginBottom: 4 }}>{alert.title}</p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: CLR.muted, margin: 0, lineHeight: '17px' }}>{alert.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      {/* ═══ SECTION 7 — MONTHLY PROGRESS SUMMARY ═══ */}
      <GlassCard delay={0.5} style={{ marginBottom: 24 }}>
        <SectionTitle title="Monthly Progress Summary" subtitle="Key metrics for the current month" icon="📋" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
          {[
            { label: 'Total Learning Time', value: `${totalLearningHrs} hours`, accent: CLR.indigo, gradient: CARD_GRADIENTS.xp, icon: '⏰' },
            { label: 'Completed Chapters', value: `${MONTHLY_SUMMARY.completedChapters}`, accent: CLR.purple, gradient: CARD_GRADIENTS.streak, icon: '📖' },
            { label: 'Activities Completed', value: `${MONTHLY_SUMMARY.activitiesCompleted}`, accent: CLR.mint, gradient: CARD_GRADIENTS.growth, icon: '✅' },
            { label: 'Average Session', value: `${analytics.avgSessionMinutes} min`, accent: CLR.cyan, gradient: CARD_GRADIENTS.attendance, icon: '📐' },
            { label: 'Engagement Score', value: `${analytics.engagementScore}%`, accent: CLR.amber, gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FFF7ED 50%, #FFFBEB 100%)', icon: '🔥' },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              style={{
                background: m.gradient,
                borderRadius: 18, padding: '18px 16px',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 2px 12px rgba(92,106,196,0.04)',
                textAlign: 'center',
              }}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...spring, delay: 0.55 + i * 0.06 }}
              whileHover={{ y: -3, scale: 1.02 }}
            >
              <span style={{ fontSize: 22, display: 'block', marginBottom: 8 }}>{m.icon}</span>
              <p style={{ fontSize: 20, fontWeight: 800, color: m.accent, margin: 0 }}>{m.value}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* ═══ SECTION 8 — DOWNLOAD REPORT ═══ */}
      <GlassCard delay={0.6} gradient="linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(167,139,250,0.04) 100%)" style={{ marginBottom: 24 }}>
        <SectionTitle title="Monthly Report Card" subtitle="Download a comprehensive report including academic progress, attendance, and recommendations" icon="📄" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: CLR.muted, margin: 0, marginBottom: 12, lineHeight: '18px' }}>
              The report includes:
            </p>
            {[
              { icon: '📊', text: 'Academic progress & subject performance' },
              { icon: '📅', text: 'Attendance record & patterns' },
              { icon: '🧠', text: 'Skill strengths & development areas' },
              { icon: '🤖', text: 'AI-powered recommendations' },
            ].map((item, i) => (
              <motion.div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.06 }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: CLR.secondary }}>{item.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={handleDownload}
            disabled={downloadState === 'downloading'}
            style={{
              background: downloadState === 'done'
                ? 'linear-gradient(135deg, #10B981, #34D399)'
                : 'linear-gradient(135deg, #fbbf24, #fcd34d)',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              padding: '14px 32px',
              fontSize: 14,
              fontWeight: 700,
              cursor: downloadState === 'downloading' ? 'wait' : 'pointer',
              boxShadow: downloadState === 'done'
                ? '0 4px 20px rgba(16,185,129,0.30)'
                : '0 4px 20px rgba(129,140,248,0.30)',
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: downloadState === 'downloading' ? 0.7 : 1,
              transition: 'all 0.3s ease',
            }}
            whileHover={downloadState === 'idle' ? { scale: 1.04, boxShadow: '0 6px 28px rgba(129,140,248,0.40)' } : {}}
            whileTap={downloadState === 'idle' ? { scale: 0.97 } : {}}
          >
            {downloadState === 'idle' && (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Monthly Report
              </>
            )}
            {downloadState === 'downloading' && (
              <>
                <motion.div
                  style={{ width: 16, height: 16, border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                Generating Report…
              </>
            )}
            {downloadState === 'done' && (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Report Ready!
              </>
            )}
          </motion.button>
        </div>
      </GlassCard>

      {/* Decorative shapes */}
      <div style={{ position: 'fixed', bottom: 60, right: 20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.06), transparent)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '38%', left: 10, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.05), transparent)', pointerEvents: 'none', zIndex: 0 }} />
    </div>
  );
};

export default AttendancePage;
