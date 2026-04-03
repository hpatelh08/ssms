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
import { useParentAnalytics } from '../analytics/useParentAnalytics';
import { generateMonthlyReportPDF } from '../../services/reportGenerator';
import {
  MONTHLY_SUMMARY,
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
  xp:         'linear-gradient(135deg, #EDE9FE 0%, #F3E8FF 50%, #FCE7F3 100%)',
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

/* ── Weekly Trend Chart (activity analytics) ────── */

const WeeklyBarChart: React.FC<{ data: { day: string; minutes: number }[]; color?: string; height?: number }> = ({
  data, color = '#4F9644', height = 255,
}) => {
  const chartId = React.useId().replace(/:/g, '');
  const trackFillId = `${chartId}-weeklyTrackFill`;
  const barFillId = `${chartId}-weeklyBarFill`;
  const peakFillId = `${chartId}-weeklyPeakFill`;
  const w = 680;
  const pad = { top: 34, right: 24, bottom: 44, left: 50 };
  const chartW = w - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const baselineY = pad.top + chartH;
  const trackTop = pad.top + 4;
  const trackBottom = baselineY - 1;
  const trackH = trackBottom - trackTop;
  const values = data.map(d => d.minutes);
  const rawMax = Math.max(...values, 0);
  const maxVal = rawMax > 0 ? Math.ceil(rawMax / 5) * 5 : 5;
  const avgVal = data.length > 0 ? values.reduce((sum, value) => sum + value, 0) / data.length : 0;
  const totalMin = values.reduce((sum, value) => sum + value, 0);
  const activeDays = values.filter(value => value > 0).length;
  const bestIndex = rawMax > 0 ? values.indexOf(rawMax) : -1;
  const bestPoint = bestIndex >= 0 ? data[bestIndex] : null;
  const segmentW = chartW / Math.max(data.length, 1);
  const trackW = Math.min(54, segmentW * 0.62);
  const barW = Math.max(20, trackW - 8);
  const hasActivity = rawMax > 0;

  const toY = (value: number) => trackBottom - (value / maxVal) * trackH;

  const points = data.map((entry, index) => {
    const centerX = pad.left + segmentW * index + segmentW / 2;
    const rawBarH = (entry.minutes / maxVal) * trackH;
    const barH = entry.minutes > 0 ? Math.min(trackH, Math.max(16, rawBarH)) : 0;
    return {
      ...entry,
      centerX,
      trackX: centerX - trackW / 2,
      barX: centerX - barW / 2,
      barY: barH > 0 ? trackBottom - barH : trackBottom,
      barH,
      y: toY(entry.minutes),
      isPeak: index === bestIndex,
    };
  });

  const guides = [1, 0.75, 0.5, 0.25, 0].map(fraction => ({
    y: toY(maxVal * fraction),
    label: Math.round(maxVal * fraction),
  }));
  const avgY = toY(avgVal);

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(247,250,255,0.8))',
      borderRadius: 24,
      padding: '10px 16px 8px',
      border: '1px solid rgba(129,140,248,0.10)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.78)',
      overflow: 'hidden',
    }}>
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} style={{ display: 'block', overflow: 'hidden' }}>
        <defs>
          <linearGradient id={trackFillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5FBF2" stopOpacity={0.82} />
            <stop offset="100%" stopColor="#EEF4FF" stopOpacity={0.92} />
          </linearGradient>
          <linearGradient id={barFillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F9E45" stopOpacity={1} />
            <stop offset="42%" stopColor="#70B77E" stopOpacity={0.98} />
            <stop offset="100%" stopColor="#A9C2F5" stopOpacity={0.98} />
          </linearGradient>
          <linearGradient id={peakFillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4B9E3D" stopOpacity={1} />
            <stop offset="40%" stopColor="#6FB070" stopOpacity={0.99} />
            <stop offset="100%" stopColor="#A1BDF2" stopOpacity={0.98} />
          </linearGradient>
        </defs>

        <rect
          x={pad.left}
          y={pad.top - 10}
          width={chartW}
          height={chartH + 10}
          rx={26}
          fill="rgba(255,255,255,0.45)"
          stroke="rgba(129,140,248,0.08)"
        />

        {guides.map(guide => (
          <g key={guide.label}>
            <line
              x1={pad.left}
              y1={guide.y}
              x2={w - pad.right}
              y2={guide.y}
              stroke={`${CLR.muted}${guide.label === 0 ? '26' : '18'}`}
              strokeWidth={1}
              strokeDasharray={guide.label === 0 ? undefined : '5 7'}
            />
            <text
              x={pad.left - 10}
              y={guide.y + 3}
              textAnchor="end"
              fontSize={10}
              fill={guide.label === maxVal ? '#7B8DBD' : '#A1AED4'}
              fontWeight={600}
            >
              {guide.label}
            </text>
          </g>
        ))}

        {points.map((point, index) => (
          <g key={point.day}>
            <rect
              x={point.trackX}
              y={trackTop}
              width={trackW}
              height={trackH}
              rx={trackW / 2}
              fill={`url(#${trackFillId})`}
            />
            {point.barH > 0 && (
              <rect
                x={point.barX}
                y={point.barY}
                width={barW}
                height={point.barH}
                rx={barW / 2}
                fill={point.isPeak ? `url(#${peakFillId})` : `url(#${barFillId})`}
                stroke={point.isPeak ? '#5A9B50' : '#71AA79'}
                strokeWidth={0.8}
                opacity={0.98}
              />
            )}
          </g>
        ))}

        {points.map((point, index) => (
          <g key={`${point.day}-labels`}>

            <motion.text
              x={point.centerX}
              y={Math.max(trackTop - 8, point.barY - 10)}
              textAnchor="middle"
              fontSize={10}
              fontWeight={800}
              fill={color}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.34 + index * 0.04 }}
            >
              {point.minutes}m
            </motion.text>

            <text
              x={point.centerX}
              y={baselineY + 20}
              textAnchor="middle"
              fontSize={11}
              fill={point.isPeak ? CLR.primary : '#8F94D4'}
              fontWeight={point.isPeak ? 800 : 700}
            >
              {point.day}
            </text>
          </g>
        ))}

        {!hasActivity && (
          <text
            x={w / 2}
            y={pad.top + chartH / 2}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill={CLR.soft}
          >
            Start a study session to populate the weekly graph
          </text>
        )}
      </svg>
    </div>
  );
};

/* ── Donut Chart (activity breakdown) ───────────── */

const WeeklySpeedometerChart: React.FC<{ data: { day: string; minutes: number }[]; color?: string; height?: number }> = ({
  data, color = '#7C6CFF', height = 300,
}) => {
  const values = data.map(d => d.minutes);
  const totalMin = values.reduce((sum, value) => sum + value, 0);
  const avgVal = data.length > 0 ? Math.round(totalMin / data.length) : 0;
  const activeDays = values.filter(value => value > 0).length;
  const peakMin = Math.max(...values, 0);
  const bestIndex = peakMin > 0 ? values.indexOf(peakMin) : -1;
  const bestPoint = bestIndex >= 0 ? data[bestIndex] : null;
  const focusScore = Math.min(100, Math.round((totalMin / (7 * 45)) * 100));
  const animatedScore = useCountUp(focusScore, 950);

  const tone = focusScore >= 70
    ? { label: 'Excellent Pace', accent: CLR.mint, note: 'A strong study rhythm is forming across the week.' }
    : focusScore >= 35
      ? { label: 'Steady Progress', accent: CLR.amber, note: 'Consistency is growing. A few longer sessions can lift this quickly.' }
      : { label: 'Warm-up Mode', accent: CLR.rose, note: 'This week is still light. Small daily sessions will move the needle fast.' };

  const gauge = { w: 420, h: 250, cx: 210, cy: 188, r: 126 };
  const trackPath = `M ${gauge.cx - gauge.r} ${gauge.cy} Q ${gauge.cx} ${gauge.cy - gauge.r - 14} ${gauge.cx + gauge.r} ${gauge.cy}`;
  const progressRatio = Math.max(0, Math.min(1, focusScore / 100));

  const pointForAngle = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: gauge.cx + radius * Math.cos(rad),
      y: gauge.cy - radius * Math.sin(rad),
    };
  };

  const needleAngle = 180 - progressRatio * 180;
  const needleTip = pointForAngle(needleAngle, gauge.r - 18);
  const needleTail = pointForAngle(needleAngle + 180, 20);
  const dayMarkers = data.map((entry, index) => {
    const angle = 180 - (index / Math.max(data.length - 1, 1)) * 180;
    return {
      label: entry.day,
      angle,
      inner: pointForAngle(angle, gauge.r - 6),
      outer: pointForAngle(angle, gauge.r + 7),
      text: pointForAngle(angle, gauge.r + 24),
    };
  });

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(243,244,255,0.72))',
      borderRadius: 24,
      padding: 18,
      border: '1px solid rgba(129,140,248,0.12)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 800, color: CLR.primary, margin: 0 }}>Weekly Focus Overview</p>
          <p style={{ fontSize: 10, fontWeight: 600, color: CLR.muted, margin: '4px 0 0' }}>
            {bestPoint ? `${bestPoint.day} led the week with ${bestPoint.minutes} minutes.` : 'No study activity recorded this week yet.'}
          </p>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 999,
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.14)',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: CLR.secondary }}>This Week</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: CLR.indigo }}>{totalMin} min</span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 18,
        alignItems: 'stretch',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.44)',
          borderRadius: 22,
          padding: '12px 14px 8px',
          border: '1px solid rgba(129,140,248,0.10)',
        }}>
          <svg viewBox={`0 0 ${gauge.w} ${gauge.h}`} width="100%" height={height} style={{ display: 'block' }}>
            <defs>
              <linearGradient id="speedometerArcGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F472B6" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor={color} />
              </linearGradient>
              <filter id="speedometerGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#8B5CF6" floodOpacity="0.22" />
              </filter>
            </defs>

            <path
              d={trackPath}
              fill="none"
              stroke="rgba(224,231,255,0.9)"
              strokeWidth={22}
              strokeLinecap="round"
            />
            <path
              d={trackPath}
              fill="none"
              stroke="rgba(129,140,248,0.10)"
              strokeWidth={10}
              strokeLinecap="round"
            />

            {dayMarkers.map(mark => (
              <line
                key={mark.label}
                x1={mark.inner.x}
                y1={mark.inner.y}
                x2={mark.outer.x}
                y2={mark.outer.y}
                stroke="rgba(107,111,207,0.28)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}

            <motion.path
              d={trackPath}
              fill="none"
              stroke="url(#speedometerArcGrad)"
              strokeWidth={22}
              strokeLinecap="round"
              filter="url(#speedometerGlow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: Math.max(progressRatio, 0.02) }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            {dayMarkers.map(label => (
              <text
                key={`${label.label}-text`}
                x={label.text.x}
                y={label.text.y}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill={bestPoint?.day === label.label ? CLR.indigo : CLR.muted}
              >
                {label.label}
              </text>
            ))}

            <motion.line
              x1={needleTail.x}
              y1={needleTail.y}
              x2={gauge.cx}
              y2={gauge.cy}
              stroke={tone.accent}
              strokeWidth={4}
              strokeLinecap="round"
              initial={{ x2: gauge.cx, y2: gauge.cy }}
              animate={{ x2: needleTip.x, y2: needleTip.y }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
            />
            <motion.circle
              cx={needleTip.x}
              cy={needleTip.y}
              r={6}
              fill={tone.accent}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.85 }}
            />
            <circle cx={gauge.cx} cy={gauge.cy} r={16} fill="#FFFFFF" stroke={`${tone.accent}45`} strokeWidth={6} />
            <circle cx={gauge.cx} cy={gauge.cy} r={6} fill={tone.accent} />

            <text x={gauge.cx} y={gauge.cy - 18} textAnchor="middle" fontSize={12} fontWeight={700} fill={CLR.muted}>
              Focus Score
            </text>
            <text x={gauge.cx} y={gauge.cy + 20} textAnchor="middle" fontSize={40} fontWeight={900} fill={tone.accent}>
              {animatedScore}%
            </text>
            <text x={gauge.cx} y={gauge.cy + 44} textAnchor="middle" fontSize={12} fontWeight={800} fill={CLR.primary}>
              {tone.label}
            </text>
          </svg>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          justifyContent: 'space-between',
        }}>
          <div style={{
            background: `${tone.accent}0D`,
            borderRadius: 18,
            padding: '16px 18px',
            border: `1px solid ${tone.accent}18`,
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: tone.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Gauge Insight
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: CLR.primary, margin: '8px 0 6px' }}>
              {tone.label}
            </p>
            <p style={{ fontSize: 11, fontWeight: 600, color: CLR.muted, lineHeight: '18px', margin: 0 }}>
              {tone.note}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {[
              { label: 'Best Day', value: bestPoint?.day || 'N/A', accent: CLR.amber },
              { label: 'Peak Session', value: `${peakMin} min`, accent: CLR.rose },
              { label: 'Daily Average', value: `${avgVal} min`, accent: CLR.cyan },
              { label: 'Active Days', value: `${activeDays}/7`, accent: CLR.indigo },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  background: `${item.accent}0D`,
                  borderRadius: 16,
                  padding: '12px 14px',
                  border: `1px solid ${item.accent}18`,
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, margin: 0, textTransform: 'uppercase' }}>{item.label}</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: item.accent, margin: '6px 0 0' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Low', color: CLR.rose },
              { label: 'Steady', color: CLR.amber },
              { label: 'High', color: CLR.indigo },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  borderRadius: 999,
                  background: `${item.color}10`,
                  border: `1px solid ${item.color}18`,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: CLR.secondary }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number; strokeWidth?: number;
}> = ({ data, size = 180, strokeWidth = 28 }) => {
  const slices = data.filter(item => item.value > 0);
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const segmentGap = 5;
  let cumOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <filter id="donutGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#A5B4FC" floodOpacity="0.14" />
        </filter>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(203, 213, 225, 0.38)"
        strokeWidth={strokeWidth}
      />
      {slices.map((d, i) => {
        const pct = total > 0 ? d.value / total : 0;
        const dashLen = pct * circ;
        const visibleLen = Math.max(0, dashLen - segmentGap);
        const offset = cumOffset;
        cumOffset += dashLen;
        if (visibleLen <= 0) return null;
        return (
          <motion.circle
            key={d.label}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={strokeWidth - 2}
            strokeLinecap="round"
            strokeDasharray={`${visibleLen} ${circ}`}
            strokeDashoffset={-offset}
            filter="url(#donutGlow)"
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
    const hasActivity = total > 0;
    const maxIdx = hasActivity ? mins.indexOf(Math.max(...mins)) : -1;
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const focusScore = Math.min(100, Math.round((total / (7 * 45)) * 100)); // 45 min/day = 100%
    return { totalMin: total, avgMin: avg, bestDay: maxIdx >= 0 ? dayNames[maxIdx] : '—', focusScore };
  }, [analytics.weeklyMinutes]);

  /* ── Study streak ── */
  const streakDays = analytics.streakDays;
  const studentFirstName = useMemo(() => analytics.studentName.split(' ')[0] || 'Student', [analytics.studentName]);

  /* ── Activity breakdown for donut ── */
  const activityData = useMemo(() =>
    analytics.activityDistribution.map(a => ({
      label: a.label,
      value: a.minutes,
      color: a.color,
    }))
  , [analytics.activityDistribution]);
  const totalActivityMin = activityData.reduce((a, d) => a + d.value, 0);

  /* ── Alerts from live analytics ── */
  const alerts = useMemo(() => analytics.alerts, [analytics.alerts]);

  /* ── Monthly summary data ── */
  const totalLearningHrs = useMemo(() => {
    const totalMin = analytics.weeklyMinutes.reduce((a, b) => a + b, 0);
    return Math.max(11, Math.round(totalMin * 4 / 60));
  }, [analytics.weeklyMinutes]);

  /* ── Report download handler ── */
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const handleDownload = useCallback(() => {
    setDownloadState('downloading');

    try {
      generateMonthlyReportPDF({
        studentName: analytics.studentName,
        monthLabel: `${MONTH_NAMES[viewMonth]} ${viewYear}`,
        analytics,
        calendarStats,
        weeklyStats,
        totalLearningHours: totalLearningHrs,
        summary: {
          completedChapters: MONTHLY_SUMMARY.completedChapters,
          activitiesCompleted: MONTHLY_SUMMARY.activitiesCompleted,
        },
      });
      setDownloadState('done');
      window.setTimeout(() => setDownloadState('idle'), 2000);
    } catch (error) {
      console.error('Monthly report download failed:', error);
      setDownloadState('idle');
      window.alert('Monthly report generate nahi ho paya. Please try again.');
    }
  }, [analytics, calendarStats, totalLearningHrs, viewMonth, viewYear, weeklyStats]);

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
                background: 'linear-gradient(135deg, #818CF8, #A78BFA)',
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

        {/* Bar chart */}
        <WeeklyBarChart data={weeklyData} height={255} />
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
            {studentFirstName} has been learning consistently for {streakDays} days in a row. Keep it up to earn bonus XP and special badges!
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
                : 'linear-gradient(135deg, #818CF8, #A78BFA)',
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
