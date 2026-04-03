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
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { useParentAnalytics } from '../analytics/useParentAnalytics';

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════ */

const CLR = {
  primary: '#3B3FAF',
  secondary: '#6B6FCF',
  muted: '#8F94D4',
  soft: '#A0AEC0',
  label: '#8B95D6',
  purple: '#4D7A38',
  indigo: '#3F8F3A',
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
  rose:       'linear-gradient(135deg, #F3F8E3 0%, #F4F8E8 50%, #FBFBEA 100%)',
  presentCard: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 50%, #6EE7B7 100%)',
  absentCard:  'linear-gradient(135deg, #FEE2E2 0%, #FECACA 50%, #FCA5A5 100%)',
  holidayCard: 'linear-gradient(135deg, #FEF9C3 0%, #FDE68A 50%, #FCD34D 100%)',
  rateCard:    'linear-gradient(135deg, #D7EDD0 0%, #BFDBFE 50%, #93C5FD 100%)',
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
function generateMonthData(year: number, month: number, attendanceDates: string[]): CalendarDay[] {
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const isFuture = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());
  const attendanceSet = new Set(attendanceDates);
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const days: CalendarDay[] = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    days.push({ date: 0, status: 'empty', isToday: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    const isToday = isCurrentMonth && d === today.getDate();
    const iso = `${monthPrefix}-${String(d).padStart(2, '0')}`;
    const isSchoolDay = dow !== 0 && dow !== 6;
    const isMarkedPresent = attendanceSet.has(iso) || (isToday && isSchoolDay);

    if (isFuture || (isCurrentMonth && d > today.getDate())) {
      days.push({ date: d, status: 'future', isToday: false });
    } else if (dow === 0 || dow === 6) {
      days.push({ date: d, status: 'holiday', isToday });
    } else if (isMarkedPresent) {
      days.push({ date: d, status: 'present', isToday });
    } else {
      days.push({ date: d, status: 'absent', isToday });
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

/* ── Weekly Bar Chart (activity analytics) ──────── */

const WeeklyBarChart: React.FC<{ data: { day: string; minutes: number }[]; height?: number }> = ({
  data, height = 180,
}) => {
  const w = 520;
  const pad = { top: 24, right: 18, bottom: 34, left: 38 };
  const chartH = height - pad.top - pad.bottom;
  const maxVal = Math.max(...data.map(d => d.minutes), 1);
  const slotW = (w - pad.left - pad.right) / data.length;
  const barW = Math.min(36, slotW * 0.48);
  const baseY = pad.top + chartH;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" style={{ display: 'block', minWidth: 320 }}>
        <defs>
          {data.map((_, i) => (
            <linearGradient key={i} id={`wbar-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3f8f3a" stopOpacity={0.90} />
              <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.45} />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines + Y labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, gi) => {
          const y = pad.top + chartH - f * chartH;
          return (
            <g key={gi}>
              <line
                x1={pad.left} y1={y} x2={w - pad.right} y2={y}
                stroke={f === 0 ? '#c7c9e880' : '#c7c9e830'}
                strokeWidth={f === 0 ? 1.5 : 1}
                strokeDasharray={f === 0 ? undefined : '4 4'}
              />
              <text x={pad.left - 7} y={y + 3} textAnchor="end" fontSize={8} fill={CLR.soft} fontWeight={600}>
                {Math.round(maxVal * f)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max(6, (d.minutes / maxVal) * chartH);
          const x = pad.left + slotW * i + (slotW - barW) / 2;
          const barTopY = baseY - barH;
          return (
            <g key={d.day}>
              {/* Ghost track */}
              <rect x={x} y={pad.top} width={barW} height={chartH} rx={barW / 2}
                fill="#3f8f3a08" />
              {/* Actual bar — animates via scaleY from bottom */}
              {d.minutes > 0 && (
                <motion.rect
                  x={x} width={barW} rx={barW / 2}
                  fill={`url(#wbar-${i})`}
                  style={{ originY: '100%' }}
                  initial={{ scaleY: 0, y: baseY, height: barH }}
                  animate={{ scaleY: 1, y: barTopY, height: barH }}
                  transition={{ duration: 0.6, ease: [0.34, 1.4, 0.64, 1], delay: 0.08 + i * 0.07 }}
                />
              )}
              {/* Day label */}
              <text x={x + barW / 2} y={baseY + 16} textAnchor="middle" fontSize={10} fill={CLR.muted} fontWeight={700}>
                {d.day}
              </text>
              {/* Value label — fixed position above bar, opacity-only animation */}
              {d.minutes > 0 && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, delay: 0.55 + i * 0.07 }}
                >
                  <text
                    x={x + barW / 2}
                    y={barTopY - 6}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={800}
                    fill="#3f8f3a"
                  >
                    {d.minutes}m
                  </text>
                </motion.g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ── Donut Chart (activity breakdown) ───────────── */

const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number; strokeWidth?: number;
}> = ({ data, size = 180, strokeWidth = 28 }) => {
  const segments = data.filter(d => d.value > 0);
  const total = segments.reduce((a, d) => a + d.value, 0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  let cumOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${CLR.muted}10`} strokeWidth={strokeWidth} />
      {total > 0 && segments.map((d, i) => {
        const pct = d.value / total;
        const dashLen = pct * circ;
        const gapLen = circ - dashLen;
        const separator = dashLen > 8 ? 3 : 0;
        const drawLen = Math.max(dashLen - separator, 0);
        const drawGap = Math.max(gapLen + separator, 0);
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
            strokeDasharray={`${drawLen} ${drawGap}`}
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
  info:    { bg: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(63,143,58,0.04))', border: 'rgba(56,189,248,0.18)', dot: '#38BDF8', icon: '🔵' },
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

  const calendarDays = useMemo(
    () => generateMonthData(viewYear, viewMonth, analytics.attendanceDates),
    [viewYear, viewMonth, analytics.attendanceDates],
  );

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
  const streakDays = analytics.streakDays;

  /* ── Activity breakdown for donut ── */
  const activityData = useMemo(() =>
    analytics.activityDistribution.map(a => ({
      label: a.label,
      value: a.minutes,
      color: a.color,
    }))
  , [analytics.activityDistribution]);
  const totalActivityMin = activityData.reduce((a, d) => a + d.value, 0);

  /* ── Alerts from analytics ── */
  const alerts = useMemo(
    () => analytics.alerts.map(a => ({ severity: a.severity, title: a.title, desc: a.description })),
    [analytics.alerts],
  );

  /* ── Monthly summary data ── */
  const totalLearningHrs = useMemo(() => {
    const totalMin = analytics.weeklyMinutes.reduce((a, b) => a + b, 0);
    return Math.round(totalMin * 4 / 60);
  }, [analytics.weeklyMinutes]);
  const completedChapters = useMemo(
    () => analytics.subjects.reduce((sum, s) => sum + s.chaptersCompleted, 0),
    [analytics.subjects],
  );
  const activitiesCompleted = analytics.totalSessions;

  /* ── Report download handler ── */
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const handleDownload = useCallback(() => {
    setDownloadState('downloading');
    setTimeout(() => {
      try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const now = new Date();
        const reportMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        const W = 210; // A4 width
        let y = 0;

        // Header banner
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, W, 38, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20); doc.setFont('helvetica', 'bold');
        doc.text('Monthly Report Card', 14, 16);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text(`Student: ${analytics.studentName}   |   ${reportMonth}`, 14, 26);
        doc.text(`Generated on ${now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`, 14, 33);
        y = 48;

        // Section helper
        const sectionTitle = (title: string) => {
          doc.setFillColor(238, 239, 255);
          doc.rect(10, y - 5, W - 20, 10, 'F');
          doc.setTextColor(79, 70, 229); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
          doc.text(title, 14, y + 1);
          y += 12;
        };
        const row = (label: string, value: string, indent = 14) => {
          doc.setTextColor(80, 80, 120); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
          doc.text(label, indent, y);
          doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 100);
          doc.text(value, 140, y);
          y += 7;
        };

        // 1. Student Overview
        sectionTitle('Student Overview');
        row('Name', analytics.studentName);
        row('Level', `${analytics.level}`);
        row('Total XP', `${analytics.xp} XP`);
        row('Engagement Score', `${analytics.engagementScore}%`);
        row('Streak Days', `${analytics.streakDays} days`);
        row('Avg Session Duration', `${analytics.avgSessionMinutes} min`);
        y += 4;

        // 2. Attendance
        sectionTitle('Attendance Record');
        row('Days Present', `${calendarStats.present}`);
        row('Days Absent', `${calendarStats.absent}`);
        row('Holidays', `${calendarStats.holidays}`);
        row('Attendance Rate', `${calendarStats.rate}%`);
        y += 4;

        // 3. Academic Progress
        sectionTitle('Subject-wise Academic Progress');
        analytics.subjects.forEach(s => {
          row(`${s.subject}`, `${s.progress}% — ${s.chaptersCompleted}/${s.totalChapters} chapters`);
        });
        row('Overall Progress', `${analytics.overallProgress}%`);
        y += 4;

        // 4. Weekly Learning
        sectionTitle('Weekly Learning Activity');
        const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        analytics.weeklyMinutes.forEach((m, i) => row(days[i], `${m} min`));
        row('Total Study Time this week', `${Math.floor(weeklyStats.totalMin/60)}h ${weeklyStats.totalMin%60}m`);
        row('Most Active Day', weeklyStats.bestDay);
        row('Focus Score', `${weeklyStats.focusScore}%`);
        y += 4;

        // 5. Skills
        if (y > 240) { doc.addPage(); y = 20; }
        sectionTitle('Skill Strengths');
        analytics.skills.forEach(sk => row(sk.skill, `${sk.value}/100`));
        y += 4;

        // 6. Recommendations
        sectionTitle('AI-Powered Recommendations');
        const recs = [
          'Encourage daily 30-min learning sessions for best retention.',
          `Focus on ${[...analytics.subjects].sort((a,b) => a.progress - b.progress)[0]?.subject ?? 'weaker subjects'} — needs more practice.`,
          'Maintain the streak — consistency is key to long-term growth.',
          'Review game scores in Brain Boost & Puzzle Zone weekly.',
        ];
        recs.forEach(r => {
          doc.setTextColor(80, 80, 120); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(`• ${r}`, W - 30) as string[];
          doc.text(lines, 14, y);
          y += lines.length * 5.5 + 2;
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let p = 1; p <= pageCount; p++) {
          doc.setPage(p);
          doc.setFontSize(8); doc.setTextColor(160, 160, 200);
          doc.text('Smart School System — Std 5 Parent Report', 14, 290);
          doc.text(`Page ${p} of ${pageCount}`, W - 30, 290);
        }

        doc.save(`Report_${analytics.studentName.replace(/\s+/g,'_')}_${reportMonth.replace(/\s+/g,'_')}.pdf`);
        setDownloadState('done');
        setTimeout(() => setDownloadState('idle'), 2500);
      } catch {
        setDownloadState('idle');
      }
    }, 800);
  }, [analytics, calendarStats, weeklyStats]);

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
    <div style={{ maxWidth: 1450, margin: '0 auto', paddingBottom: 40, position: 'relative' }}>

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
              background: 'rgba(63,143,58,0.08)', border: '1px solid rgba(63,143,58,0.15)',
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
                background: 'linear-gradient(135deg, #8FCF94, #A7C97F)',
                padding: '2px 10px', borderRadius: 8,
              }}>CURRENT</span>
            )}
          </motion.div>

          <motion.button
            onClick={goNext}
            disabled={isCurrentMonth}
            style={{
              background: isCurrentMonth ? 'rgba(200,200,220,0.1)' : 'rgba(63,143,58,0.08)',
              border: '1px solid rgba(63,143,58,0.15)',
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
                    boxShadow: day.isToday ? '0 0 0 2px rgba(63,143,58,0.5), 0 2px 8px rgba(63,143,58,0.15)' : 'none',
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
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <WeeklyBarChart data={weeklyData} />
        </div>
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
            {analytics.studentName} has been learning consistently for {streakDays} days in a row. Keep it up to earn bonus XP and special badges!
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
              const pct = totalActivityMin > 0 ? Math.round((a.value / totalActivityMin) * 100) : 0;
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
            { label: 'Completed Chapters', value: `${completedChapters}`, accent: CLR.purple, gradient: CARD_GRADIENTS.streak, icon: '📖' },
            { label: 'Activities Completed', value: `${activitiesCompleted}`, accent: CLR.mint, gradient: CARD_GRADIENTS.growth, icon: '✅' },
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
      <GlassCard delay={0.6} gradient="linear-gradient(135deg, rgba(63,143,58,0.06) 0%, rgba(167,201,127,0.04) 100%)" style={{ marginBottom: 24 }}>
        <SectionTitle title="Monthly Report Card" subtitle="Download a comprehensive report including academic progress, attendance, and recommendations" icon="📄" />

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
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
                : 'linear-gradient(135deg, #8FCF94, #A7C97F)',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              padding: '14px 32px',
              fontSize: 14,
              fontWeight: 700,
              cursor: downloadState === 'downloading' ? 'wait' : 'pointer',
              boxShadow: downloadState === 'done'
                ? '0 4px 20px rgba(16,185,129,0.30)'
                : '0 4px 20px rgba(127,174,101,0.30)',
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: downloadState === 'downloading' ? 0.7 : 1,
              transition: 'all 0.3s ease',
            }}
            whileHover={downloadState === 'idle' ? { scale: 1.04, boxShadow: '0 6px 28px rgba(127,174,101,0.40)' } : {}}
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


