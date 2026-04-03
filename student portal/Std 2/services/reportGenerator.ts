/**
 * 📄 PDF Report Card Generator
 * ==============================
 * Generates a styled PDF progress report using jsPDF.
 * Blue-white theme, printable A4 format.
 */

import jsPDF from 'jspdf';
import { UserStats } from '../types';

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
  doc.text('Smart Study Companion — Standard 2', pw / 2, 29, { align: 'center' });

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
  doc.text(`👤  ${childName}`, margin + 6, y + 10);

  doc.setFontSize(9);
  doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`Level ${stats.level}  •  ${stats.xp} XP  •  🔥 ${stats.streak}-day streak`, margin + 6, y + 18);

  // Badges count on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]);
  doc.text(`🏅 ${stats.badges.length} Badges`, pw - margin - 6, y + 14, { align: 'right' });

  y += 32;

  // ═══════════════════════════════════════════════════
  // ──  SKILLS ASSESSMENT  ───────────────────────────
  // ═══════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.text('📊  Skills Assessment', margin, y + 4);
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
  doc.text('📈  Weekly Engagement', margin, y + 4);
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
    doc.text(`${item.icon} ${item.label}`, cx, cy + 6);

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
  doc.text('🌱  Attendance', margin, y + 4);
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
    doc.text('🏅  Achievements', margin, y + 4);
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
      doc.text(`${badge.icon} ${badge.name}`, bx, by + 5);
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
    doc.text('📝  Parent Notes', margin, y + 4);
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
    '🛡️ AI is a support tool. Final decisions remain human-controlled. This system does not rank, predict, or compare students.',
    pw / 2,
    footerY + 6,
    { align: 'center', maxWidth: contentW }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Smart Study Companion — SSMS Standard 2', pw / 2, footerY + 12, { align: 'center' });

  // ── Save ──
  doc.save(`SSMS-Report-${childName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
}
