/**
 * parent/pages/AiWeeklyReportEngine.tsx
 * ─────────────────────────────────────────────────────
 * AI Weekly Learning Report Engine — Enhanced analytics
 *
 * Features:
 *  • Weekly learning time chart (bar chart via Recharts)
 *  • Subject distribution (pie chart)
 *  • Strong/weak areas with AI recommendations via Groq
 *  • Reading insights integration
 *  • Engagement & attendance trends
 *  • PDF export via jsPDF
 *  • AI-generated personalized narrative
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import { useAuth } from '../../auth/AuthContext';
import { BASELINE_WEEKLY, BASELINE_SUBJECTS, FLOOR } from '../../data/mockParentAnalytics';
import { getReadingInsights, formatDuration } from '../../services/readingInsights';

/* ── Design Tokens ────────────────────────────────── */

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: '0 6px 28px rgba(63,143,58,0.06)',
};

/* ── Groq AI ──────────────────────────────────────── */

const GROQ_API_KEY = (typeof process !== 'undefined' && process.env?.GROQ_API_KEY) || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/* ── Data helpers ─────────────────────────────────── */

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLORS = {
  indigo: '#3F8F3A',
  purple: '#7AA344',
  pink: '#EC4899',
  mint: '#10B981',
  amber: '#F59E0B',
  sky: '#38BDF8',
  rose: '#F472B6',
};

const PIE_COLORS = ['#3F8F3A', '#F59E0B', '#10B981', '#EC4899', '#38BDF8'];

function getWeekRangeLabel(): string {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`;
  return `${fmt(startOfWeek)} – ${fmt(endOfWeek)}`;
}

/* ── AI narrative generation via Groq ─────────────── */

async function generateAINarrative(
  studentName: string,
  weeklyMinutes: number[],
  subjects: typeof BASELINE_SUBJECTS,
  readingData: { totalSessions: number; totalPagesViewed: number; averageQuizScore: number; streak: number },
  floorData: typeof FLOOR,
): Promise<string> {
  const totalMin = weeklyMinutes.reduce((a, b) => a + b, 0);
  const avgDaily = Math.round(totalMin / 7);
  const strongest = [...subjects].sort((a, b) => b.progress - a.progress)[0];
  const weakest = [...subjects].sort((a, b) => a.progress - b.progress)[0];

  const prompt = `You are an AI learning coach writing a weekly report for a parent about their Class 5 (age 8-9) child named ${studentName}.

Weekly Data:
- Total learning time: ${totalMin} minutes (avg ${avgDaily} min/day)
- Daily breakdown: Mon=${weeklyMinutes[0]}m, Tue=${weeklyMinutes[1]}m, Wed=${weeklyMinutes[2]}m, Thu=${weeklyMinutes[3]}m, Fri=${weeklyMinutes[4]}m, Sat=${weeklyMinutes[5]}m, Sun=${weeklyMinutes[6]}m
- Strongest subject: ${strongest.subject} (${strongest.progress}% complete, ${strongest.done}/${strongest.total} chapters)
- Weakest subject: ${weakest.subject} (${weakest.progress}% complete, ${weakest.done}/${weakest.total} chapters)
- Reading: ${readingData.totalSessions} sessions, ${readingData.totalPagesViewed} pages, avg quiz score ${readingData.averageQuizScore}%
- Attendance consistency: ${floorData.attendanceRate}%
- Garden growth: ${floorData.gardenGrowth}%
- Engagement score: ${floorData.engagementScore}%
- Current streak: ${readingData.streak} days

Write a concise, encouraging 4-5 sentence parent-friendly report. Mention what went well, what needs attention, and one specific actionable tip. Use a warm, professional tone. Do NOT use bullet points. Write as flowing paragraphs.`;

  if (!GROQ_API_KEY) {
    return `${studentName} had a productive week with ${totalMin} minutes of total learning time! The strongest performance was in ${strongest.subject}, showing great progress at ${strongest.progress}% completion. ${weakest.subject} could use a bit more practice — try dedicating 10 extra minutes daily. Keep encouraging the reading habit, and consider using fun worksheets to reinforce concepts!`;
  }

  try {
    const resp = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a warm, encouraging AI learning coach for young children. Write concise parent-friendly reports.' },
          { role: 'user', content: prompt },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!resp.ok) return `${studentName} had a productive week with ${totalMin} minutes of learning! Strong in ${strongest.subject}. Focus more on ${weakest.subject} practice.`;
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || `${studentName} had a great learning week!`;
  } catch {
    return `${studentName} had a productive week with ${totalMin} minutes of learning time across all subjects.`;
  }
}

/* ── PDF Export ────────────────────────────────────── */

function exportReportPDF(
  studentName: string,
  weekLabel: string,
  weeklyMinutes: number[],
  subjects: typeof BASELINE_SUBJECTS,
  narrative: string,
  readingData: { totalSessions: number; totalPagesViewed: number; averageQuizScore: number; streak: number },
  floorData: typeof FLOOR,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  const totalMin = weeklyMinutes.reduce((a, b) => a + b, 0);
  const avgDaily = Math.round(totalMin / 7);
  const strongest = [...subjects].sort((a, b) => b.progress - a.progress)[0];
  const weakest = [...subjects].sort((a, b) => a.progress - b.progress)[0];

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Weekly Learning Report', pw / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Student: ${studentName}  |  Week: ${weekLabel}`, pw / 2, y, { align: 'center' });
  y += 8;

  doc.setDrawColor(200);
  doc.line(20, y, pw - 20, y);
  y += 8;

  // Overview stats
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Overview', 20, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const stats = [
    `Total Learning: ${totalMin} minutes`,
    `Average/Day: ${avgDaily} minutes`,
    `Strongest: ${strongest.subject} (${strongest.progress}%)`,
    `Needs Work: ${weakest.subject} (${weakest.progress}%)`,
    `Attendance: ${floorData.attendanceRate}%`,
    `Engagement: ${floorData.engagementScore}%`,
    `Reading Sessions: ${readingData.totalSessions}`,
    `Pages Read: ${readingData.totalPagesViewed}`,
  ];
  stats.forEach(s => { doc.text(s, 24, y); y += 6; });
  y += 4;

  // Daily breakdown
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Learning Time', 20, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  DAY_LABELS.forEach((d, i) => {
    doc.text(`${d}: ${weeklyMinutes[i]} min`, 24, y);
    y += 6;
  });
  y += 4;

  // Subject progress
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject Progress', 20, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  subjects.forEach(s => {
    doc.text(`${s.subject}: ${s.progress}% (${s.done}/${s.total} chapters)`, 24, y);
    y += 6;
  });
  y += 4;

  // AI Narrative
  if (y > 220) { doc.addPage(); y = 20; }
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Coach Summary', 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const narrativeLines = doc.splitTextToSize(narrative, pw - 44);
  doc.text(narrativeLines, 22, y);
  y += narrativeLines.length * 5 + 8;

  // Footer
  doc.setFontSize(8);
  doc.text(
    `Generated by SSMS AI Learning Companion | ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pw / 2, 285, { align: 'center' },
  );

  doc.save(`Weekly_Report_${studentName.replace(/\s/g, '_')}_${weekLabel.replace(/\s/g, '_')}.pdf`);
}

/* ═══════════════════════════════════════════════════
   CHART TOOLTIP
   ═══════════════════════════════════════════════════ */

const ChartTooltip: React.FC<{ active?: boolean; payload?: Array<{ value: number }>; label?: string }> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(63,143,58,0.15)',
      borderRadius: 12,
      padding: '8px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#3F8F3A', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 12, fontWeight: 800, color: '#374151', margin: '2px 0 0' }}>{payload[0].value} min</p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

interface Props {
  onBack: () => void;
}

export const AiWeeklyReportEngine: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();
  const studentName = user.name?.split(' ')[0] || 'Yash';
  const weekLabel = useMemo(getWeekRangeLabel, []);

  const [narrative, setNarrative] = useState('');
  const [loadingNarrative, setLoadingNarrative] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'reading' | 'recommendations'>('overview');

  // Reading insights
  const readingInsights = useMemo(() => getReadingInsights(), []);

  // Derived data
  const totalWeeklyMinutes = useMemo(() => BASELINE_WEEKLY.reduce((a, b) => a + b, 0), []);
  const avgDailyMinutes = Math.round(totalWeeklyMinutes / 7);
  const activeDays = BASELINE_WEEKLY.filter(m => m > 0).length;
  const strongest = useMemo(() => [...BASELINE_SUBJECTS].sort((a, b) => b.progress - a.progress)[0], []);
  const weakest = useMemo(() => [...BASELINE_SUBJECTS].sort((a, b) => a.progress - b.progress)[0], []);

  // Weekly bar chart data
  const weeklyChartData = useMemo(
    () => DAY_LABELS.map((day, i) => ({ day, minutes: BASELINE_WEEKLY[i] })),
    [],
  );

  // Subject pie data
  const subjectPieData = useMemo(
    () => BASELINE_SUBJECTS.map(s => ({ name: s.subject, value: s.progress })),
    [],
  );

  // Radar chart data
  const radarData = useMemo(() => BASELINE_SUBJECTS.map(s => ({
    subject: s.subject,
    progress: s.progress,
    target: 75,
  })), []);

  // Weekly trend line (mock: last 4 weeks)
  const trendData = useMemo(() => [
    { week: 'Week 1', minutes: Math.round(totalWeeklyMinutes * 0.7) },
    { week: 'Week 2', minutes: Math.round(totalWeeklyMinutes * 0.82) },
    { week: 'Week 3', minutes: Math.round(totalWeeklyMinutes * 0.91) },
    { week: 'This Week', minutes: totalWeeklyMinutes },
  ], [totalWeeklyMinutes]);

  // Load AI narrative on mount
  useEffect(() => {
    setLoadingNarrative(true);
    generateAINarrative(
      studentName,
      BASELINE_WEEKLY,
      BASELINE_SUBJECTS,
      {
        totalSessions: readingInsights.totalSessions,
        totalPagesViewed: readingInsights.totalPagesViewed,
        averageQuizScore: readingInsights.averageQuizScore,
        streak: readingInsights.streak,
      },
      FLOOR,
    ).then(text => {
      setNarrative(text);
      setLoadingNarrative(false);
    });
  }, [studentName, readingInsights]);

  const handleExportPDF = useCallback(() => {
    exportReportPDF(
      studentName,
      weekLabel,
      BASELINE_WEEKLY,
      BASELINE_SUBJECTS,
      narrative,
      {
        totalSessions: readingInsights.totalSessions,
        totalPagesViewed: readingInsights.totalPagesViewed,
        averageQuizScore: readingInsights.averageQuizScore,
        streak: readingInsights.streak,
      },
      FLOOR,
    );
  }, [studentName, weekLabel, narrative, readingInsights]);

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: '📊' },
    { key: 'subjects' as const, label: 'Subjects', icon: '📚' },
    { key: 'reading' as const, label: 'Reading', icon: '📖' },
    { key: 'recommendations' as const, label: 'AI Insights', icon: '🤖' },
  ];

  return (
    <div className="w-full px-2 lg:px-4 py-8 space-y-6 relative">
      {/* Header */}
      <motion.div
        className="flex items-center gap-4 mb-2"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <motion.button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer"
          style={{ ...glass }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3F8F3A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </motion.button>
        <div>
          <h1 className="text-2xl font-black text-gray-800">AI Weekly Report</h1>
          <p className="text-[11px] text-gray-400 font-bold">{studentName} · {weekLabel}</p>
        </div>
        <motion.button
          onClick={handleExportPDF}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[12px] font-bold text-white cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #3F8F3A, #8FCF94)',
            boxShadow: '0 4px 16px rgba(63,143,58,0.25)',
            border: 'none',
          }}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          📥 Export PDF
        </motion.button>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.04 }}
      >
        {tabs.map(tab => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-bold cursor-pointer shrink-0"
            style={{
              background: activeTab === tab.key ? 'linear-gradient(135deg, #3F8F3A, #8FCF94)' : 'rgba(255,255,255,0.5)',
              color: activeTab === tab.key ? '#fff' : '#6B7280',
              border: activeTab === tab.key ? 'none' : '1px solid rgba(0,0,0,0.04)',
              boxShadow: activeTab === tab.key ? '0 4px 16px rgba(63,143,58,0.2)' : 'none',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span>{tab.icon}</span> {tab.label}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ═══════ OVERVIEW TAB ═══════ */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={spring}
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Learning', value: `${totalWeeklyMinutes} min`, icon: '⏱️', color: COLORS.indigo },
                { label: 'Avg Per Day', value: `${avgDailyMinutes} min`, icon: '📊', color: COLORS.sky },
                { label: 'Active Days', value: `${activeDays}/7`, icon: '📅', color: COLORS.mint },
                { label: 'Streak', value: `${readingInsights.streak} days`, icon: '🔥', color: COLORS.amber },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="rounded-2xl p-5 text-center"
                  style={{
                    ...glass,
                    background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}04)`,
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: i * 0.06 }}
                >
                  <span className="text-2xl block mb-2">{stat.icon}</span>
                  <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Weekly Bar Chart */}
            <motion.div
              className="rounded-3xl p-6"
              style={glass}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.12 }}
            >
              <h3 className="text-[14px] font-black text-gray-700 mb-4 flex items-center gap-2">
                <span>📊</span> Daily Learning Time
              </h3>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={weeklyChartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600, fill: '#9CA3AF' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} unit=" min" width={50} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="minutes" fill={COLORS.indigo} radius={[8, 8, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Weekly Trend */}
            <motion.div
              className="rounded-3xl p-6"
              style={glass}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.16 }}
            >
              <h3 className="text-[14px] font-black text-gray-700 mb-4 flex items-center gap-2">
                <span>📈</span> Weekly Progress Trend
              </h3>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fontWeight: 600, fill: '#9CA3AF' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} unit=" min" width={50} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke={COLORS.purple}
                      strokeWidth={3}
                      dot={{ r: 5, fill: COLORS.purple, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Attendance', value: `${FLOOR.attendanceRate}%`, color: COLORS.indigo },
                { label: 'Garden Growth', value: `${FLOOR.gardenGrowth}%`, color: COLORS.mint },
                { label: 'Engagement', value: `${FLOOR.engagementScore}%`, color: COLORS.purple },
              ].map((m, i) => (
                <motion.div
                  key={i}
                  className="rounded-2xl p-4 text-center"
                  style={{ ...glass, background: `${m.color}06` }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.2 + i * 0.04 }}
                >
                  <p className="text-lg font-black" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">{m.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════ SUBJECTS TAB ═══════ */}
        {activeTab === 'subjects' && (
          <motion.div
            key="subjects"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={spring}
          >
            {/* Subject Distribution Pie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                className="rounded-3xl p-6"
                style={glass}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring, delay: 0.06 }}
              >
                <h3 className="text-[14px] font-black text-gray-700 mb-4 flex items-center gap-2">
                  <span>🥧</span> Subject Distribution
                </h3>
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={subjectPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {subjectPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Radar Chart */}
              <motion.div
                className="rounded-3xl p-6"
                style={glass}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring, delay: 0.1 }}
              >
                <h3 className="text-[14px] font-black text-gray-700 mb-4 flex items-center gap-2">
                  <span>🎯</span> Skills Radar
                </h3>
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(0,0,0,0.06)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 600, fill: '#6B7280' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                      <Radar name="Progress" dataKey="progress" stroke={COLORS.indigo} fill={COLORS.indigo} fillOpacity={0.2} />
                      <Radar name="Target" dataKey="target" stroke={COLORS.amber} fill={COLORS.amber} fillOpacity={0.05} strokeDasharray="5 5" />
                      <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Subject Detail Cards */}
            <div className="space-y-3">
              {BASELINE_SUBJECTS.map((s, i) => {
                const color = PIE_COLORS[i % PIE_COLORS.length];
                return (
                  <motion.div
                    key={i}
                    className="rounded-2xl p-5"
                    style={glass}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring, delay: 0.08 + i * 0.04 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: `${color}12` }}>
                        {['📖', '🔢', '🌿', '🔤', '🎨'][i] || '📚'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-bold text-gray-700">{s.subject}</span>
                          <span className="text-[12px] font-black" style={{ color }}>{s.progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${s.progress}%` }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">
                          {s.done}/{s.total} chapters · {s.progress >= 65 ? '🟢 On Track' : s.progress >= 45 ? '🟡 Improving' : '🟠 Needs Focus'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══════ READING TAB ═══════ */}
        {activeTab === 'reading' && (
          <motion.div
            key="reading"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={spring}
          >
            {/* Reading Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Sessions', value: readingInsights.totalSessions, icon: '📚', color: COLORS.indigo },
                { label: 'Pages Read', value: readingInsights.totalPagesViewed, icon: '📄', color: COLORS.purple },
                { label: 'Reading Time', value: formatDuration(readingInsights.totalReadingTimeMs), icon: '⏱️', color: COLORS.mint },
                { label: 'Avg Quiz Score', value: `${readingInsights.averageQuizScore}%`, icon: '🎯', color: COLORS.amber },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="rounded-2xl p-5 text-center"
                  style={{ ...glass, background: `${stat.color}06` }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: i * 0.06 }}
                >
                  <span className="text-2xl block mb-2">{stat.icon}</span>
                  <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* More Reading Stats */}
            <div className="rounded-3xl p-6" style={glass}>
              <h3 className="text-[14px] font-black text-gray-700 mb-4 flex items-center gap-2">
                <span>📖</span> Reading Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {[
                    { label: 'Chapters Explored', value: String(readingInsights.totalChaptersExplored), icon: '📑' },
                    { label: 'Quizzes Taken', value: String(readingInsights.totalQuizzesTaken), icon: '✅' },
                    { label: 'AI Questions Asked', value: String(readingInsights.totalAIQuestions), icon: '🤖' },
                    { label: 'Current Streak', value: `${readingInsights.streak} days`, icon: '🔥' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.5)' }}>
                      <span className="text-base">{item.icon}</span>
                      <span className="text-[11px] text-gray-500 font-medium flex-1">{item.label}</span>
                      <span className="text-[13px] font-black text-gray-700">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl" style={{ background: 'rgba(63,143,58,0.04)' }}>
                  <span className="text-4xl mb-3">📖</span>
                  <p className="text-[12px] font-bold text-gray-600 mb-1">Favorite Book</p>
                  <p className="text-[15px] font-black text-green-500 text-center">
                    {readingInsights.favoriteBook || 'No books read yet'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    Weekly: {formatDuration(readingInsights.weeklyReadingMs)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            {readingInsights.recentSessions.length > 0 && (
              <div className="rounded-3xl p-6" style={glass}>
                <h3 className="text-[14px] font-black text-gray-700 mb-4 flex items-center gap-2">
                  <span>🕐</span> Recent Reading Sessions
                </h3>
                <div className="space-y-2">
                  {readingInsights.recentSessions.slice(0, 5).map((session, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.4)' }}>
                      <span className="text-sm">📗</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-gray-700 truncate">{session.bookTitle}</p>
                        <p className="text-[9px] text-gray-400">
                          {new Date(session.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {session.pagesViewed} pages · {formatDuration(session.durationMs)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════ AI INSIGHTS / RECOMMENDATIONS TAB ═══════ */}
        {activeTab === 'recommendations' && (
          <motion.div
            key="recommendations"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={spring}
          >
            {/* AI Narrative */}
            <motion.div
              className="rounded-3xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(237,233,254,0.7), rgba(252,231,243,0.6), rgba(219,234,254,0.7))',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 8px 32px rgba(63,143,58,0.08)',
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.06 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: 'linear-gradient(135deg, #8FCF94, #A7C97F)', boxShadow: '0 4px 16px rgba(127,174,101,0.25)' }}>
                  🤖
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-gray-800">AI Coach Summary</h3>
                  <p className="text-[10px] text-gray-400 font-bold">Personalized by Groq AI</p>
                </div>
                <motion.div
                  className="ml-auto px-3 py-1 rounded-full text-[9px] font-bold"
                  style={{ background: 'rgba(122,163,68,0.1)', color: '#7AA344' }}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  AI Powered
                </motion.div>
              </div>
              {loadingNarrative ? (
                <div className="flex items-center gap-3 py-4">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⏳
                  </motion.span>
                  <span className="text-[12px] text-gray-400 font-medium">AI is analyzing learning data...</span>
                </div>
              ) : (
                <p className="text-[13px] text-gray-600 font-medium leading-relaxed">{narrative}</p>
              )}
            </motion.div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                className="rounded-2xl p-5"
                style={{ ...glass, background: 'rgba(16,185,129,0.04)' }}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">💪</span>
                  <h3 className="text-[13px] font-black text-gray-700">Strengths</h3>
                </div>
                <div className="space-y-2">
                  {[...BASELINE_SUBJECTS].sort((a, b) => b.progress - a.progress).slice(0, 3).map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)' }}>
                      <span className="text-sm">{['🥇', '🥈', '🥉'][i]}</span>
                      <span className="text-[11px] font-bold text-gray-700 flex-1">{s.subject}</span>
                      <span className="text-[11px] font-black text-green-600">{s.progress}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="rounded-2xl p-5"
                style={{ ...glass, background: 'rgba(245,158,11,0.04)' }}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: 0.14 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">🎯</span>
                  <h3 className="text-[13px] font-black text-gray-700">Areas to Improve</h3>
                </div>
                <div className="space-y-2">
                  {[...BASELINE_SUBJECTS].sort((a, b) => a.progress - b.progress).slice(0, 3).map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)' }}>
                      <span className="text-sm">📌</span>
                      <span className="text-[11px] font-bold text-gray-700 flex-1">{s.subject}</span>
                      <span className="text-[11px] font-black text-amber-600">{s.progress}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Actionable Recommendations */}
            <motion.div
              className="rounded-3xl p-6"
              style={glass}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.18 }}
            >
              <h3 className="text-[14px] font-black text-gray-700 mb-4 flex items-center gap-2">
                <span>💡</span> This Week's Recommendations
              </h3>
              <div className="space-y-3">
                {[
                  { icon: '📐', text: `Spend 10 extra minutes on ${weakest.subject} daily — focus on practice worksheets`, color: '#F59E0B' },
                  { icon: '📖', text: 'Continue the reading habit — aim for at least 2 story sessions this week', color: '#3F8F3A' },
                  { icon: '🎮', text: 'Use interactive games to reinforce concepts from weaker subjects', color: '#10B981' },
                  { icon: '⏰', text: 'Best study time detected: 6:00 PM – 7:00 PM. Schedule practice accordingly', color: '#7AA344' },
                  { icon: '🏆', text: `Celebrate the progress in ${strongest.subject} — reward consistency!`, color: '#EC4899' },
                ].map((rec, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: `${rec.color}06`, border: `1px solid ${rec.color}12` }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring, delay: 0.22 + i * 0.04 }}
                  >
                    <span className="text-base mt-0.5">{rec.icon}</span>
                    <p className="text-[11px] text-gray-600 font-medium leading-relaxed">{rec.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiWeeklyReportEngine;
