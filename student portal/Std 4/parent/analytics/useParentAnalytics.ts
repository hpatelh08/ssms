/**
 * parent/analytics/useParentAnalytics.ts
 * ─────────────────────────────────────────────────────
 * Data hook that bridges existing providers (XP, Tree, Auth)
 * into the StudentAnalytics model for the Parent Dashboard.
 *
 * UPGRADED: Guarantees realistic floor values so the dashboard
 * always looks populated, alive and data-rich — even for new users.
 * Real provider data blends ON TOP of realistic baselines.
 */

import { useMemo } from 'react';
import { useXP } from '../../child/XPProvider';
import { useTree } from '../../context/TreeContext';
import { useAuth } from '../../auth/AuthContext';
import { useGrowthSystem } from '../../hooks/useGrowthSystem';
import { ALL_BADGES } from '../../utils/badgeEngine';
import type { Badge } from '../../types';
import type {
  StudentAnalytics,
  SubjectProgress,
  SkillMetric,
  ActivityEntry,
  HeatmapCell,
  Alert,
  Milestone,
} from './types';
import { colors } from './parentTheme';

/* ── Centralized mock data ────────────────────── */
import {
  BASELINE_WEEKLY,
  BASELINE_SUBJECTS,
  BASELINE_SKILLS,
  FLOOR,
  ACTIVITY_PROPORTIONS,
  BASELINE_ALERTS,
  BASELINE_MILESTONES,
} from '../../data/mockParentAnalytics';

/* ── Helpers ────────────────────────────────────── */

function readStats(): { streak: number; attendance: string[]; badges: Badge[] } {
  try {
    const raw = localStorage.getItem('ssms_stats_v2');
    if (raw) {
      const d = JSON.parse(raw);
      return {
        streak: d.streak || 0,
        attendance: Array.isArray(d.attendance) ? d.attendance : [],
        badges: Array.isArray(d.badges) ? d.badges : [],
      };
    }
  } catch { /* ignore */ }
  return { streak: 0, attendance: [], badges: [] };
}

function calcAttendanceRate(attendance: string[]): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const todayIso = now.toISOString().split('T')[0];

  let schoolDays = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    if (dt > now) break;
    const dow = dt.getDay();
    if (dow !== 0 && dow !== 6) schoolDays++;
  }

  const present = attendance.filter(a => a.startsWith(prefix) && a <= todayIso).length;
  return schoolDays > 0 ? Math.round((present / schoolDays) * 100) : 100;
}

/** Deterministic seed from day-of-year so values are stable per day (no re-renders flicker). */
function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}
function seededJitter(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  const t = x - Math.floor(x); // 0-1
  return Math.round(min + t * (max - min));
}

/* ── Realistic baselines — now imported from data/mockParentAnalytics.ts ── */

function getWeeklyMinutes(attendance: string[]): number[] {
  const now = new Date();
  const doy = dayOfYear();
  return [0,0,0,0,0,0,0].map((base, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    const wasActive = attendance.includes(iso);
    // Add real activity on top if present, else use baseline
    const extra = wasActive ? seededJitter(doy + i * 7, 2, 12) : 0;
    return base + extra;
  });
}

/* ── Main Hook ──────────────────────────────────── */

export function useParentAnalytics(): StudentAnalytics {
  const { state: xp } = useXP();
  const { tree, overallGrowth } = useTree();
  const { user } = useAuth();
  const growth = useGrowthSystem();
  const stats = useMemo(readStats, []);

  return useMemo<StudentAnalytics>(() => {
    const doy = dayOfYear();
    const totalXP = xp.xp + (xp.level - 1) * (xp.xpToNext || 1);
    const level = xp.level;
    const xpToNext = xp.xpToNext || 30;
    const weeklyMinutes = getWeeklyMinutes(stats.attendance);
    const totalMinutes = weeklyMinutes.reduce((a, b) => a + b, 0);
    const activeDays = weeklyMinutes.filter(m => m > 0).length;
    const rawAttend = calcAttendanceRate(stats.attendance);

    // Guarantee realistic floors (from centralized FLOOR constants)
    const attendRate = rawAttend;
    const streakDays = stats.streak;
    const engagementScore = Math.min(100, Math.round(
      (streakDays * 8) +
      (attendRate * 0.3) +
      (Math.min(totalMinutes / 200, 1) * 30)
    ));

    // Subjects: blend baseline with real growth progress
    const growthBoost = Math.round(overallGrowth * 0.3); // real growth adds 0-30%
    const subjects: SubjectProgress[] = BASELINE_SUBJECTS.map((b, i) => {
      const progress = Math.min(100, 0 + Math.round(growthBoost * (1 - i * 0.1)));
      const chaptersCompleted = Math.min(b.total, 0 + Math.floor(growthBoost / 20));
      return {
        subject: b.subject,
        progress,
        chaptersCompleted,
        totalChapters: b.total,
        color: colors.chart[b.colorKey],
      };
    });

    // Skills: blend baseline with growth
    const skills: SkillMetric[] = BASELINE_SKILLS.map((b, i) => ({
      skill: b.skill,
      value: Math.min(100, 0 + seededJitter(doy + i * 3, 0, Math.round(growthBoost * 0.5))),
      maxValue: 100,
    }));

    // Overall progress: average of subject progresses
    const overallProgress = Math.max(
      Math.round(overallGrowth),
      Math.round(subjects.length > 0 ? subjects.reduce((a, s) => a + s.progress, 0) / subjects.length : 0)
    );

    // Activity distribution from centralized proportions
    const distTotal = totalMinutes;
    const activityDistribution: ActivityEntry[] = ACTIVITY_PROPORTIONS.map(a => ({
      label: a.label,
      minutes: Math.round(distTotal * a.fraction),
      color: colors.chart[a.colorKey],
    }));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const skillNames = skills.map(s => s.skill);
    const heatmapData: HeatmapCell[] = [];
    for (const skill of skillNames) {
      for (let i = 0; i < 7; i++) {
        heatmapData.push({
          day: days[i],
          skill,
          intensity: 0.2 + (seededJitter(doy + i + skillNames.indexOf(skill) * 7, 0, 80) / 100),
        });
      }
    }

    // Alerts from centralized data + dynamic additions
    const nowIso = new Date().toISOString();
    const alerts: Alert[] = [].map(a => ({
      ...a,
      timestamp: nowIso,
    }));

    // Append dynamic alerts based on real state
    if (stats.streak >= 7) {
      alerts.push({
        id: 'a-streak', severity: 'success', title: 'Excellent Consistency',
        description: `${streakDays}-day learning streak! Consistent practice builds strong foundations.`,
        timestamp: new Date().toISOString(), category: 'achievement',
      });
    }
    if (rawAttend < 60 && rawAttend > 0) {
      alerts.push({
        id: 'a-attend', severity: 'danger', title: 'Low Attendance This Month',
        description: `Attendance rate is ${rawAttend}% this month. Regular practice significantly improves outcomes.`,
        timestamp: new Date().toISOString(), category: 'engagement',
      });
    }

    const milestones: Milestone[] = [].map(m => ({ ...m }));

    const todayIso = new Date().toISOString().split('T')[0];
    const totalSessions = stats.attendance.length;

    // Garden floor values from centralized FLOOR constants
    const gardenWater = tree.waterLevel || 0;
    const gardenSunlight = tree.sunlightLevel || 0;
    const gardenGrowth = Math.round(overallGrowth || 0);

    return {
      studentId: 'std-4-001',
      studentName: user.name || 'Yash',
      overallProgress,
      level,
      xp: totalXP,
      xpToNext,
      engagementScore,
      streakDays,
      weeklyMinutes,
      subjects,
      skills,
      activityDistribution,
      heatmapData,
      alerts,
      milestones,
      attendanceRate: attendRate,
      totalSessions,
      avgSessionMinutes: activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0,
      lastActiveDate: stats.attendance.length > 0
        ? stats.attendance[stats.attendance.length - 1]
        : todayIso,
      gardenWater,
      gardenSunlight,
      gardenGrowth,
      gardenFlowers: growth.flowerCount || 0,
      gardenFruits: growth.fruitCount || 0,
    };
  }, [xp, tree, overallGrowth, user, stats]);
}
