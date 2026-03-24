/**
 * 📄 PDF Report Card Generator
 * ==============================
 * Generates a styled PDF progress report using jsPDF.
 * Blue-white theme, printable A4 format.
 */

import jsPDF from 'jspdf';
import { UserStats } from '../types';
import type { StudentAnalytics } from '../parent/analytics/types';

// Map skill level strings to numeric values
const SKILL_MAP: Record<string, number> = {
  'Developing': 1,
  'Improving': 2,
  'Active': 3,
  'Star': 4,
};

interface ReportData {
  childName: string;
  stats: UserStats;
  weeklyEngagement: {
    daysActive: number;
    gamesPlayed: number;
    homeworkDone: number;
    aiQuestions: number;
    booksUsed: number;
    totalActivities: number;
  };
  parentNotes: { text: string; date: string }[];
  attendanceMetrics?: {
    totalSchoolDays: number;
    presentDays: number;
    absentDays: number;
    attendancePercentage: number;
  };
}

// ── Color constants ───────────
const BLUE = [30, 58, 138] as const;     // blue-900
const LIGHT_BLUE = [59, 130, 246] as const; // blue-500
const CYAN = [6, 182, 212] as const;
const GRAY = [107, 114, 128] as const;
const DARK = [17, 24, 39] as const;
const WHITE = [255, 255, 255] as const;
const GREEN = [34, 197, 94] as const;
const AMBER = [245, 158, 11] as const;

function sanitizePdfText(value: string): string {
  return value
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    .replace(/[\u2600-\u27BF]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = doc.splitTextToSize(sanitizePdfText(text), maxWidth) as string[];
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

function safeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-');
}

export function generateReportCardPDF(data: ReportData): void {
  const { childName, stats, weeklyEngagement, parentNotes } = data;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210; // page width
  const margin = 18;
  const contentW = pw - margin * 2;
  let y = 0;

  // ── Helper: draw rounded rect ───
  const roundedRect = (
    x: number, yy: number, w: number, h: number, r: number,
    fill: readonly [number, number, number], stroke?: readonly [number, number, number]
  ) => {
    doc.setFillColor(fill[0], fill[1], fill[2]);
    if (stroke) {
      doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
      doc.setLineWidth(0.3);
    }
    doc.roundedRect(x, yy, w, h, r, r, stroke ? 'FD' : 'F');
  };

  // ── Helper: progress bar ───
  const progressBar = (
    x: number, yy: number, w: number, h: number,
    fill: readonly [number, number, number],
    bg: readonly [number, number, number],
    pct: number
  ) => {
    roundedRect(x, yy, w, h, h / 2, bg);
    if (pct > 0) {
      roundedRect(x, yy, w * Math.min(pct, 1), h, h / 2, fill);
    }
  };

  // ═══════════════════════════════════════════════════
  // ──  HEADER BANNER  ───────────────────────────────
  // ═══════════════════════════════════════════════════
  roundedRect(0, 0, pw, 48, 0, BLUE);
  roundedRect(0, 38, pw, 14, 0, LIGHT_BLUE);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('Progress Report Card', pw / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(200, 220, 255);
  doc.text('Smart Study Companion — Standard 6', pw / 2, 29, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, pw / 2, 47, { align: 'center' });

  y = 58;

  // ═══════════════════════════════════════════════════
  // ──  STUDENT INFO  ────────────────────────────────
  // ═══════════════════════════════════════════════════
  roundedRect(margin, y, contentW, 24, 4, [240, 246, 255] as any);

  doc.setFontSize(13);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Student: ${sanitizePdfText(childName)}`, margin + 6, y + 10);

  doc.setFontSize(9);
  doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`Level ${stats.level}  |  ${stats.xp} XP  |  ${stats.streak}-day streak`, margin + 6, y + 18);

  // Badges count on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]);
  doc.text(`${stats.badges.length} Badges`, pw - margin - 6, y + 14, { align: 'right' });

  y += 32;

  // ═══════════════════════════════════════════════════
  // ──  SKILLS ASSESSMENT  ───────────────────────────
  // ═══════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.text('Skills Assessment', margin, y + 4);
  y += 10;

  const skills = [
    { label: 'Reading', value: SKILL_MAP[stats.skills.reading] || 1, max: 4, color: LIGHT_BLUE },
    { label: 'Writing', value: SKILL_MAP[stats.skills.writing] || 1, max: 4, color: GREEN },
    { label: 'Participation', value: SKILL_MAP[stats.skills.participation] || 1, max: 4, color: CYAN },
  ];

  roundedRect(margin, y, contentW, skills.length * 14 + 8, 4, [250, 251, 254] as any, [220, 225, 240] as any);
  y += 8;

  skills.forEach(skill => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(skill.label, margin + 8, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text(`${skill.value}/${skill.max}`, margin + contentW - 12, y + 4, { align: 'right' });

    progressBar(margin + 42, y, contentW - 70, 5, skill.color, [230, 232, 240] as any, skill.value / skill.max);
    y += 14;
  });

  y += 6;

  // ═══════════════════════════════════════════════════
  // ──  WEEKLY ENGAGEMENT  ───────────────────────────
  // ═══════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.text('Weekly Engagement', margin, y + 4);
  y += 10;

  const engagementItems = [
    { label: 'Days Active', value: `${weeklyEngagement.daysActive}/7`, icon: '📅' },
    { label: 'Games Played', value: `${weeklyEngagement.gamesPlayed}`, icon: '🎮' },
    { label: 'Homework Completed', value: `${weeklyEngagement.homeworkDone}`, icon: '📝' },
    { label: 'AI Questions Asked', value: `${weeklyEngagement.aiQuestions}`, icon: '🤖' },
    { label: 'Books Used', value: `${weeklyEngagement.booksUsed}`, icon: '📚' },
    { label: 'Total Activities', value: `${weeklyEngagement.totalActivities}`, icon: '⚡' },
  ];

  const colW = contentW / 3;
  const rows = Math.ceil(engagementItems.length / 3);
  roundedRect(margin, y, contentW, rows * 22 + 6, 4, [240, 246, 255] as any, [210, 220, 245] as any);
  y += 6;

  engagementItems.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = margin + col * colW + 6;
    const cy = y + row * 22;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text(item.label, cx, cy + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(item.value, cx, cy + 16);
  });

  y += rows * 22 + 12;

  // ═══════════════════════════════════════════════════
  // ──  ATTENDANCE  ──────────────────────────────────
  // ═══════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.text('Attendance', margin, y + 4);
  y += 10;

  roundedRect(margin, y, contentW, 30, 4, [236, 253, 245] as any, [200, 240, 220] as any);

  const attMetrics = data.attendanceMetrics;
  const presentDays = attMetrics?.presentDays ?? stats.attendance.length;
  const absentDays = attMetrics?.absentDays ?? 0;
  const totalSchoolDays = attMetrics?.totalSchoolDays ?? 30;
  const attendanceRate = attMetrics?.attendancePercentage ?? (presentDays > 0 ? Math.round((presentDays / totalSchoolDays) * 100) : 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`Total School Days: ${totalSchoolDays}`, margin + 8, y + 8);
  doc.text(`Days Present: ${presentDays}    |    Days Absent: ${absentDays}`, margin + 8, y + 14);
  doc.text(`Current Streak: ${stats.streak} days`, margin + 8, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.text(`${Math.min(attendanceRate, 100)}%`, pw - margin - 8, y + 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text('Attendance Rate', pw - margin - 8, y + 21, { align: 'right' });

  y += 38;

  // ═══════════════════════════════════════════════════
  // ──  BADGES EARNED  ───────────────────────────────
  // ═══════════════════════════════════════════════════
  if (stats.badges.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text('Achievements', margin, y + 4);
    y += 10;

    const badgeRowH = Math.ceil(stats.badges.length / 4) * 14 + 6;
    roundedRect(margin, y, contentW, badgeRowH, 4, [255, 251, 235] as any, [240, 230, 200] as any);
    y += 6;

    stats.badges.forEach((badge, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const bx = margin + 8 + col * (contentW / 4);
      const by = y + row * 14;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(DARK[0], DARK[1], DARK[2]);
      doc.text(sanitizePdfText(badge.name), bx, by + 5);
    });

    y += badgeRowH + 4;
  }

  // ═══════════════════════════════════════════════════
  // ──  PARENT NOTES  ────────────────────────────────
  // ═══════════════════════════════════════════════════
  if (parentNotes.length > 0) {
    // Check if we need a new page
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text('Parent Notes', margin, y + 4);
    y += 10;

    const noteH = parentNotes.length * 10 + 6;
    roundedRect(margin, y, contentW, noteH, 4, [250, 250, 255] as any, [220, 220, 240] as any);
    y += 6;

    parentNotes.slice(0, 8).forEach(note => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(DARK[0], DARK[1], DARK[2]);
      const truncated = note.text.length > 80 ? note.text.slice(0, 77) + '...' : note.text;
      doc.text(`•  ${truncated}`, margin + 8, y + 4);
      y += 10;
    });

    y += 6;
  }

  // ═══════════════════════════════════════════════════
  // ──  FOOTER  ──────────────────────────────────────
  // ═══════════════════════════════════════════════════
  const footerY = 280;
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pw - margin, footerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(160, 170, 185);
  doc.text(
    'AI is a support tool. Final decisions remain human-controlled. This system does not rank, predict, or compare students.',
    pw / 2,
    footerY + 6,
    { align: 'center', maxWidth: contentW }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Smart Study Companion — SSMS Standard 6', pw / 2, footerY + 12, { align: 'center' });

  // ── Save ──
  doc.save(`SSMS-Report-${safeFileName(childName)}-${new Date().toISOString().split('T')[0]}.pdf`);
}

interface MonthlyReportData {
  studentName: string;
  monthLabel: string;
  analytics: StudentAnalytics;
  calendarStats: {
    present: number;
    absent: number;
    holidays: number;
    rate: number;
    total: number;
  };
  weeklyStats: {
    totalMin: number;
    avgMin: number;
    bestDay: string;
    focusScore: number;
  };
  totalLearningHours: number;
  summary: {
    completedChapters: number;
    activitiesCompleted: number;
  };
}

export function generateMonthlyReportPDF(data: MonthlyReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2);
  let y = 18;

  const drawSectionTitle = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text(title, margin, y);
    y += 6;
  };

  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - 20) return;
    doc.addPage();
    y = 18;
  };

  const drawInfoCard = (title: string, lines: string[], fill: readonly [number, number, number]) => {
    const cardHeight = 10 + (lines.length * 7);
    ensureSpace(cardHeight + 6);
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(title, margin + 6, y + 7);
    let lineY = y + 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    lines.forEach(line => {
      doc.text(sanitizePdfText(line), margin + 6, lineY);
      lineY += 6;
    });
    y += cardHeight + 6;
  };

  doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('Monthly Progress Report', pageWidth / 2, 13, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(220, 230, 255);
  doc.text(`${sanitizePdfText(data.studentName)} | ${sanitizePdfText(data.monthLabel)}`, pageWidth / 2, 21, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth / 2, 26, { align: 'center' });

  y = 40;
  drawInfoCard('Overview', [
    `Overall Progress: ${data.analytics.overallProgress}%`,
    `Level: ${data.analytics.level}`,
    `Experience Points: ${data.analytics.xp}`,
    `Engagement Score: ${data.analytics.engagementScore}%`,
  ], [240, 246, 255]);

  drawSectionTitle('Attendance Summary');
  drawInfoCard('This Month', [
    `Present Days: ${data.calendarStats.present}`,
    `Absent Days: ${data.calendarStats.absent}`,
    `Holidays: ${data.calendarStats.holidays}`,
    `Attendance Rate: ${data.calendarStats.rate}%`,
  ], [236, 253, 245]);

  drawSectionTitle('Learning Summary');
  drawInfoCard('Academic Highlights', [
    `Completed Chapters: ${data.summary.completedChapters}`,
    `Activities Completed: ${data.summary.activitiesCompleted}`,
    `Total Learning Time: ${data.totalLearningHours} hours`,
    `Average Session: ${data.analytics.avgSessionMinutes} min`,
  ], [250, 245, 255]);

  drawSectionTitle('Subject Performance');
  data.analytics.subjects.forEach(subject => {
    ensureSpace(18);
    doc.setFillColor(250, 251, 254);
    doc.roundedRect(margin, y, contentWidth, 14, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(sanitizePdfText(subject.subject), margin + 5, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Progress ${subject.progress}% | Chapters ${subject.chaptersCompleted}/${subject.totalChapters}`, margin + 5, y + 11);
    doc.setFillColor(230, 232, 240);
    doc.roundedRect(pageWidth - margin - 60, y + 4, 50, 4, 2, 2, 'F');
    doc.setFillColor(LIGHT_BLUE[0], LIGHT_BLUE[1], LIGHT_BLUE[2]);
    doc.roundedRect(pageWidth - margin - 60, y + 4, Math.max(3, 50 * (subject.progress / 100)), 4, 2, 2, 'F');
    y += 18;
  });

  drawSectionTitle('Weekly Study Metrics');
  drawInfoCard('Learning Rhythm', [
    `Total Study Time: ${Math.floor(data.weeklyStats.totalMin / 60)}h ${data.weeklyStats.totalMin % 60}m`,
    `Average Per Day: ${data.weeklyStats.avgMin} min`,
    `Most Active Day: ${data.weeklyStats.bestDay}`,
    `Focus Score: ${data.weeklyStats.focusScore}%`,
  ], [255, 251, 235]);

  drawSectionTitle('Recommendations');
  const recommendations = [
    data.calendarStats.rate < 85
      ? 'Improve attendance consistency to strengthen learning continuity.'
      : 'Attendance is strong. Maintain the current classroom rhythm.',
    data.weeklyStats.focusScore < 75
      ? 'Add one short revision session on low-activity days.'
      : 'Focus levels are healthy. Continue balanced study habits.',
    `Prioritize ${sanitizePdfText(data.analytics.subjects.slice().sort((a, b) => a.progress - b.progress)[0]?.subject ?? 'core subjects')} for the next revision cycle.`,
  ];
  ensureSpace(34);
  doc.setFillColor(245, 247, 255);
  doc.roundedRect(margin, y, contentWidth, 28, 4, 4, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  let recommendationY = y + 7;
  recommendations.forEach(rec => {
    recommendationY = addWrappedText(doc, `- ${rec}`, margin + 5, recommendationY, contentWidth - 10, 5.2) + 1;
  });
  y += 34;

  doc.setDrawColor(220, 225, 235);
  doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(150, 160, 175);
  doc.text('Generated by Smart Study Companion. This report is for progress support and parent review.', pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.save(`Monthly-Report-${safeFileName(data.studentName)}-${safeFileName(data.monthLabel)}.pdf`);
}
