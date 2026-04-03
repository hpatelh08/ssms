/**
 * parent/pages/ReportCardPage.tsx
 * ─────────────────────────────────────────────────────
 * Report Card page for parent sidebar.
 * Uses useReportGenerator + ReportPreview to render
 * a printable A4 report card with student progress data.
 */

import React from 'react';
import { ReportPreview } from '../../report/ReportPreview';
import { useReportGenerator, type AttendanceSnapshot } from '../../report/useReportGenerator';
import { useAuth } from '../../auth/AuthContext';
import type { UserStats, HomeworkItem } from '../../types';

/* ── Demo data (sourced from localStorage or mock) ── */

function loadStats(): UserStats {
  try {
    const raw = localStorage.getItem('user-stats');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    xp: 240,
    level: 5,
    streak: 3,
    badges: [
      { id: 'first-login', name: 'First Login', icon: '🌟', description: 'Logged in for the first time' },
      { id: 'streak-3', name: 'Hat Trick', icon: '🔥', description: '3-day streak' },
    ],
    attendance: [],
    skills: { reading: 'Active', writing: 'Improving', participation: 'Active' },
  };
}

function loadHomework(): HomeworkItem[] {
  try {
    const raw = localStorage.getItem('homework-items');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [
    { id: 'hw-1', title: 'Maths Practice Sheet', subject: 'Math', isDone: true },
    { id: 'hw-2', title: 'English Story Reading', subject: 'English', isDone: true },
    { id: 'hw-3', title: 'Science Worksheet', subject: 'Math', isDone: false },
    { id: 'hw-4', title: 'Hindi Writing Practice', subject: 'English', isDone: true },
  ];
}

function loadAttendance(): AttendanceSnapshot {
  try {
    const raw = localStorage.getItem('attendance-snapshot');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    totalSchoolDays: 180,
    presentDays: 165,
    absentDays: 15,
    attendancePercentage: 91.7,
  };
}

/* ── Page Component ────────────────────────────────── */

interface Props {
  onBack: () => void;
}

export const ReportCardPage: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();
  const stats = loadStats();
  const homework = loadHomework();
  const attendance = loadAttendance();

  const reportData = useReportGenerator(
    stats,
    homework,
    attendance,
    'The student has shown consistent growth and positive learning attitude throughout the term.',
    user.name || 'Student',
  );

  return <ReportPreview data={reportData} onBack={onBack} />;
};
