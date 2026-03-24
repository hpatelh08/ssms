/**
 * useReportGenerator.ts
 * ─────────────────────────────────────────────────────
 * Pure deterministic report-card data engine.
 *
 * Governance contract:
 *  • No ranking between students
 *  • No predictive modelling
 *  • No automated academic decisions
 *  • All mappings are explicit, auditable, and explainable
 *  • AI feedback is template-based — zero generative inference
 *
 * Usage:
 *   const report = useReportGenerator(stats, homework, attendanceMetrics, teacherComment);
 */

import { useMemo } from 'react';
import type { UserStats, HomeworkItem } from '../types';

/* ── Attendance metrics shape (matches utils/attendanceGenerator) ── */

export interface AttendanceSnapshot {
  totalSchoolDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
}

/* ── Deterministic tier types ─────────────────────── */

export type EngagementTier = 'Strong' | 'Active' | 'Developing';
export type AttendanceTier = 'Excellent' | 'Good' | 'Needs Attention';
export type HomeworkTier = 'Consistent' | 'Progressing' | 'Needs Support';

/* ── Mapping functions (pure, no side-effects) ────── */

/** XP → Engagement Tier. Thresholds are fixed constants. */
export function mapEngagementTier(xp: number): EngagementTier {
  if (xp > 300) return 'Strong';
  if (xp >= 150) return 'Active';
  return 'Developing';
}

/** Attendance % → Attendance Tier. */
export function mapAttendanceTier(pct: number): AttendanceTier {
  if (pct >= 90) return 'Excellent';
  if (pct >= 75) return 'Good';
  return 'Needs Attention';
}

/** Homework completion ratio → Homework Tier. */
export function mapHomeworkTier(completed: number, total: number): HomeworkTier {
  if (total === 0) return 'Progressing';
  const ratio = completed / total;
  if (ratio >= 0.8) return 'Consistent';
  if (ratio >= 0.5) return 'Progressing';
  return 'Needs Support';
}

/* ── Template-based AI feedback (deterministic) ───── */

const ENGAGEMENT_TEMPLATES: Record<EngagementTier, string> = {
  Strong:
    'Student demonstrates consistent and enthusiastic participation across learning activities, reflecting strong engagement with the curriculum.',
  Active:
    'Student shows regular participation in learning activities and is actively building foundational skills.',
  Developing:
    'Student is in the early stages of engagement. Continued encouragement and guided interaction are recommended.',
};

const ATTENDANCE_TEMPLATES: Record<AttendanceTier, string> = {
  Excellent:
    'Attendance record is exemplary, contributing positively to continuity of learning.',
  Good:
    'Attendance is satisfactory. Minor improvements in regularity would further support academic progress.',
  'Needs Attention':
    'Attendance requires attention. Regular presence is essential for foundational development at this stage.',
};

const HOMEWORK_TEMPLATES: Record<HomeworkTier, string> = {
  Consistent:
    'Homework submissions are timely and consistent, demonstrating responsibility and reinforcement of classroom learning.',
  Progressing:
    'Homework completion is progressing. Establishing a regular routine will strengthen outcomes.',
  'Needs Support':
    'Homework completion needs improvement. Parental support in establishing a daily practice schedule is advised.',
};

/* ── Generated report shape ───────────────────────── */

export interface ReportCardData {
  /** Static student information */
  studentName: string;
  grade: number;
  academicYear: string;
  generatedAt: string;

  /** Raw metrics (transparent — exactly what the system recorded) */
  xp: number;
  level: number;
  streak: number;
  badgeCount: number;
  badgeNames: string[];

  /** Skills (qualitative, from teacher input) */
  skills: {
    reading: string;
    writing: string;
    participation: string;
  };

  /** Attendance */
  attendance: AttendanceSnapshot;
  attendanceTier: AttendanceTier;

  /** Homework */
  homeworkTotal: number;
  homeworkCompleted: number;
  homeworkTier: HomeworkTier;

  /** Engagement */
  engagementTier: EngagementTier;

  /** Teacher comment (editable, human-authored) */
  teacherComment: string;

  /** Template-based deterministic feedback paragraphs */
  aiFeedback: {
    engagement: string;
    attendance: string;
    homework: string;
    summary: string;
  };
}

/* ── Helpers ──────────────────────────────────────── */

function currentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Academic year typically starts in April (India) or September
  if (month >= 3) return `${year}–${year + 1}`;
  return `${year - 1}–${year}`;
}

function buildSummary(
  engagement: EngagementTier,
  attendance: AttendanceTier,
  homework: HomeworkTier,
): string {
  const parts: string[] = [];

  if (engagement === 'Strong' && attendance === 'Excellent') {
    parts.push(
      'Overall, the student exhibits a commendable learning disposition with strong engagement and exemplary attendance.',
    );
  } else if (engagement === 'Developing' || attendance === 'Needs Attention') {
    parts.push(
      'The student is at a foundational stage of development. Collaborative support from school and home will be beneficial.',
    );
  } else {
    parts.push(
      'The student demonstrates satisfactory foundational skill development based on observed engagement metrics.',
    );
  }

  if (homework === 'Needs Support') {
    parts.push('Focused attention on homework completion is recommended as a priority area.');
  }

  parts.push(
    'This assessment is based solely on recorded activity data and does not involve ranking, prediction, or comparison with other students.',
  );

  return parts.join(' ');
}

/* ── Hook ─────────────────────────────────────────── */

export function useReportGenerator(
  stats: UserStats,
  homework: HomeworkItem[],
  attendanceMetrics: AttendanceSnapshot,
  teacherComment: string,
  studentName = 'Student',
): ReportCardData {
  return useMemo<ReportCardData>(() => {
    const completed = homework.filter(h => h.isDone).length;
    const total = homework.length;

    const engagementTier = mapEngagementTier(stats.xp);
    const attendanceTier = mapAttendanceTier(attendanceMetrics.attendancePercentage);
    const homeworkTier = mapHomeworkTier(completed, total);

    return {
      studentName,
      grade: 3,
      academicYear: currentAcademicYear(),
      generatedAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),

      xp: stats.xp,
      level: stats.level,
      streak: stats.streak,
      badgeCount: stats.badges.length,
      badgeNames: stats.badges.map(b => b.name),

      skills: {
        reading: stats.skills.reading,
        writing: stats.skills.writing,
        participation: stats.skills.participation,
      },

      attendance: attendanceMetrics,
      attendanceTier,

      homeworkTotal: total,
      homeworkCompleted: completed,
      homeworkTier,

      engagementTier,

      teacherComment,

      aiFeedback: {
        engagement: ENGAGEMENT_TEMPLATES[engagementTier],
        attendance: ATTENDANCE_TEMPLATES[attendanceTier],
        homework: HOMEWORK_TEMPLATES[homeworkTier],
        summary: buildSummary(engagementTier, attendanceTier, homeworkTier),
      },
    };
  }, [stats, homework, attendanceMetrics, teacherComment, studentName]);
}
