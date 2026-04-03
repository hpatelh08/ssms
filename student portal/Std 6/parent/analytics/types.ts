/**
 * parent/analytics/types.ts
 * ─────────────────────────────────────────────────────
 * Data models for the Parent Analytics Dashboard.
 *
 * Designed to scale from single-child view to
 * school admin and district-level aggregation.
 */

/* ── Subject Progress ───────────────────────────── */

export interface SubjectProgress {
  subject: string;
  progress: number;       // 0-100
  chaptersCompleted: number;
  totalChapters: number;
  color: string;          // hex
}

/* ── Skill Metric (for Radar) ───────────────────── */

export interface SkillMetric {
  skill: string;
  value: number;          // 0-100
  maxValue: number;
}

/* ── Alert / Insight ────────────────────────────── */

export type AlertSeverity = 'info' | 'warning' | 'danger' | 'success';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  category: 'weak-area' | 'missed-practice' | 'revision' | 'engagement' | 'achievement';
}

/* ── Activity Distribution ──────────────────────── */

export interface ActivityEntry {
  label: string;
  minutes: number;
  color: string;
}

/* ── Heatmap Cell ───────────────────────────────── */

export interface HeatmapCell {
  day: string;            // "Mon" | "Tue" etc
  skill: string;
  intensity: number;      // 0-1
}

/* ── Achievement Milestone ──────────────────────── */

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;           // SVG path or simple symbol
  date: string;           // ISO date
  category: 'academic' | 'streak' | 'skill' | 'social' | 'milestone';
}

/* ── Core Analytics Interface ───────────────────── */

export interface StudentAnalytics {
  studentId: string;
  studentName: string;
  overallProgress: number;
  level: number;
  xp: number;
  xpCurrentLevel: number;
  xpToNext: number;
  engagementScore: number;
  streakDays: number;
  weeklyMinutes: number[];          // 7 entries (Mon-Sun)
  subjects: SubjectProgress[];
  skills: SkillMetric[];
  activityDistribution: ActivityEntry[];
  heatmapData: HeatmapCell[];
  alerts: Alert[];
  milestones: Milestone[];
  attendanceRate: number;
  monthlyActiveDays: number;
  monthlyTotalDays: number;
  totalSessions: number;
  avgSessionMinutes: number;
  lastActiveDate: string;
  lastSessionAt: string | null;
  lastSessionDurationMinutes: number;
  currentActivityLabel: string;
  gardenWater: number;
  gardenSunlight: number;
  gardenGrowth: number;
  gardenFlowers: number;
  gardenFruits: number;
}

/* ── Multi-child Container ──────────────────────── */

export interface ParentAnalyticsState {
  children: StudentAnalytics[];
  activeChildIndex: number;
  isLoading: boolean;
}
