/**
 * parent/analytics/useParentAnalytics.ts
 * ─────────────────────────────────────────────────────
 * Data hook that bridges child activity data (XP, Tree, Auth,
 * game mastery, audit log) into the StudentAnalytics model.
 *
 * Reads REAL data from localStorage:
 *  • gameMastery       — subject game progress (English/Maths)
 *  • ssms_audit_log    — all child activity events
 *  • child_xp_state    — XP & level
 *  • ssms_stats_v2     — attendance & streak
 *  • ssms_tree_state   — garden growth
 *
 * Floor values from mockParentAnalytics ensure dashboard
 * looks populated even for brand-new users.
 */

import { useMemo } from 'react';
import { useXP } from '../../child/XPProvider';
import { useTree } from '../../context/TreeContext';
import { useAuth } from '../../auth/AuthContext';
import { useGrowthSystem } from '../../hooks/useGrowthSystem';
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
import { calculateCurrentActivityStreak, getLatestActivityDate } from '../../utils/activityStreak';
import {
  ENGLISH_CHAPTERS, MATHS_CHAPTERS,
  type ChapterDef, type GameProgress as SubjectGameProgress,
} from '../../games/subjects/engine/types';

/* ── Centralized baseline / floor data ────────────── */
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

function loadMastery(): Record<string, SubjectGameProgress> {
  try {
    const raw = localStorage.getItem('gameMastery');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  category: string;
  details: Record<string, unknown>;
}

interface ChapterProgressSnapshot {
  learn?: boolean;
  practice?: string | null;
  play?: boolean;
  quiz?: number;
  revision?: boolean;
  aiQuestions?: number;
  timeSpent?: {
    learn?: number;
    practice?: number;
    play?: number;
    quiz?: number;
    revision?: number;
    ai?: number;
  };
}

interface ReadingSessionSnapshot {
  startedAt?: string;
  durationMs?: number;
}

interface BookUsageEntry {
  action?: string;
  timestamp?: string;
}

interface GardenLogSnapshot {
  waterDate?: string;
  sunshineDate?: string;
  plantDate?: string;
}

function loadAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadChapterProgress(): ChapterProgressSnapshot[] {
  try {
    const raw = localStorage.getItem('ssms_chapter_progress');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, ChapterProgressSnapshot>;
    return Object.values(parsed || {});
  } catch {
    return [];
  }
}

function loadReadingSessions(): ReadingSessionSnapshot[] {
  try {
    const raw = localStorage.getItem('ssms_reading_sessions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadBookUsage(): BookUsageEntry[] {
  try {
    const raw = localStorage.getItem('ssms_book_usage');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadGardenLog(): GardenLogSnapshot {
  try {
    const raw = localStorage.getItem('ssms_garden_log');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
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

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}
function seededJitter(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  const t = x - Math.floor(x);
  return Math.round(min + t * (max - min));
}

function getWeeklyMinutes(attendance: string[]): number[] {
  const now = new Date();
  const doy = dayOfYear();
  return BASELINE_WEEKLY.map((base, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    const wasActive = attendance.includes(iso);
    if (!wasActive) return 0;
    const extra = seededJitter(doy + i * 7, 2, 12);
    return base + extra;
  });
}

/** Compute real subject progress from gameMastery localStorage */
function computeRealSubjectProgress(
  mastery: Record<string, SubjectGameProgress>,
  chapters: ChapterDef[],
  subjectKey: string,
): { chaptersCompleted: number; totalChapters: number; accuracy: number; gamesPlayed: number } {
  let chaptersCompleted = 0;
  let totalScore = 0;
  let totalQs = 0;
  let gamesPlayed = 0;

  for (const ch of chapters) {
    let chapterHasProgress = false;
    for (const g of ch.games) {
      const key = `${subjectKey}_${ch.id}_${g.id}`;
      const gp = mastery[key];
      if (!gp) continue;

      for (const diff of ['easy', 'intermediate', 'difficult'] as const) {
        const dp = gp[diff];
        if (!dp) continue;
        const levels = Object.values(dp.miniLevels);
        if (levels.length > 0) {
          chapterHasProgress = true;
          gamesPlayed++;
          totalScore += levels.reduce((s, m) => s + m.score, 0);
          totalQs += levels.reduce((s, m) => s + m.total, 0);
        }
      }
    }
    if (chapterHasProgress) chaptersCompleted++;
  }

  return {
    chaptersCompleted,
    totalChapters: chapters.length,
    accuracy: totalQs > 0 ? Math.round((totalScore / totalQs) * 100) : 0,
    gamesPlayed,
  };
}

/** Derive activity distribution from real student-side storage plus audit traces */
function computeActivityDistribution(
  auditLog: AuditEntry[],
  chapterProgress: ChapterProgressSnapshot[],
  readingSessions: ReadingSessionSnapshot[],
  bookUsage: BookUsageEntry[],
  gardenLog: GardenLogSnapshot,
): Record<string, number> {
  const counts: Record<string, number> = { Games: 0, Lessons: 0, Reading: 0, Practice: 0, Creative: 0 };

  chapterProgress.forEach((entry) => {
    const time = entry.timeSpent || {};
    counts.Lessons += (time.learn || 0) / 60000;
    counts.Lessons += (time.ai || 0) / 60000;
    counts.Games += (time.play || 0) / 60000;
    counts.Practice += (time.practice || 0) / 60000;
    counts.Practice += (time.quiz || 0) / 60000;
    counts.Practice += (time.revision || 0) / 60000;

    if (entry.learn) counts.Lessons += 6;
    if (entry.aiQuestions) counts.Lessons += entry.aiQuestions * 2;
    if (entry.play) counts.Games += 8;
    if (entry.practice) counts.Practice += 8;
    if ((entry.quiz || 0) > 0) counts.Practice += 6;
    if (entry.revision) counts.Practice += 5;
  });

  readingSessions.forEach((session) => {
    counts.Reading += (session.durationMs || 0) / 60000;
  });

  bookUsage.forEach((entry) => {
    if (entry.action === 'pdf_open') {
      counts.Reading += 4;
    }
  });

  if (gardenLog.waterDate) counts.Creative += 5;
  if (gardenLog.sunshineDate) counts.Creative += 5;
  if (gardenLog.plantDate) counts.Creative += 6;

  for (const entry of auditLog) {
    if (entry.action === 'game_complete' || entry.action === 'difficulty_complete' || entry.action === 'difficulty_selected') {
      counts.Games += 4;
    } else if (entry.category === 'ai') {
      counts.Lessons += 3;
    } else if (entry.action?.includes('book') || entry.action?.includes('read') || entry.action?.includes('pdf')) {
      counts.Reading += 3;
    } else if (entry.action?.includes('homework') || entry.category === 'homework') {
      counts.Practice += 3;
    } else if (entry.action?.includes('garden') || entry.action?.includes('color') || entry.action?.includes('space')) {
      counts.Creative += 3;
    }
  }

  return Object.fromEntries(
    Object.entries(counts).map(([label, value]) => [label, Math.max(0, Math.round(value))]),
  ) as Record<string, number>;
}

/** Generate real milestones from audit log + progress data */
function computeRealMilestones(
  auditLog: AuditEntry[],
  stats: { streak: number; attendance: string[] },
  mastery: Record<string, SubjectGameProgress>,
): Milestone[] {
  const milestones: Milestone[] = [];

  // First login milestone
  if (stats.attendance.length > 0) {
    milestones.push({
      id: 'r-first-login', title: 'First Login',
      description: 'Started the learning journey!',
      icon: 'flag', date: stats.attendance[0] || '', category: 'milestone',
    });
  }

  // Streak milestones
  if (stats.streak >= 3) {
    milestones.push({
      id: 'r-streak-3', title: '3-Day Streak',
      description: 'Practiced 3 days in a row!',
      icon: 'flame', date: new Date().toISOString().split('T')[0], category: 'streak',
    });
  }
  if (stats.streak >= 7) {
    milestones.push({
      id: 'r-streak-7', title: '7-Day Streak',
      description: 'One full week of practice!',
      icon: 'flame', date: new Date().toISOString().split('T')[0], category: 'streak',
    });
  }

  // Game completion milestones from audit log
  const gameCompletes = auditLog.filter(e => e.action === 'game_complete');
  if (gameCompletes.length >= 1) {
    milestones.push({
      id: 'r-first-game', title: 'First Game Won',
      description: 'Completed first game!',
      icon: 'star', date: gameCompletes[gameCompletes.length - 1]?.timestamp?.slice(0, 10) || '', category: 'academic',
    });
  }
  if (gameCompletes.length >= 10) {
    milestones.push({
      id: 'r-10-games', title: '10 Games Completed',
      description: 'Played and finished 10 games!',
      icon: 'trophy', date: gameCompletes[0]?.timestamp?.slice(0, 10) || '', category: 'skill',
    });
  }

  // Subject-specific milestones from mastery
  const subjectNames: Record<string, string> = { english: 'English', maths: 'Maths', science: 'Science' };
  for (const [key, gp] of Object.entries(mastery)) {
    if (gp.easy?.completed) {
      const parts = key.split('_');
      const subKey = parts[0];
      const subName = subjectNames[subKey] || subKey;
      milestones.push({
        id: `r-${key}-easy`, title: `${subName} Easy Mastered`,
        description: `Completed easy level in ${subName}!`,
        icon: 'star', date: new Date().toISOString().split('T')[0], category: 'academic',
      });
      break; // Only add first per subject to avoid spam
    }
  }

  return milestones.length > 0 ? milestones : BASELINE_MILESTONES.map(m => ({ ...m }));
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
    const mastery = loadMastery();
    const auditLog = loadAuditLog();
    const chapterProgress = loadChapterProgress();
    const readingSessions = loadReadingSessions();
    const bookUsage = loadBookUsage();
    const gardenLog = loadGardenLog();
    const totalXP = Math.max(FLOOR.xp, xp.xp + (xp.level - 1) * xp.xpToNext);
    const level = Math.max(FLOOR.level, xp.level);
    const xpToNext = xp.xpToNext || 30;
    const weeklyMinutes = getWeeklyMinutes(stats.attendance);
    const totalMinutes = weeklyMinutes.reduce((a, b) => a + b, 0);
    const activeDays = weeklyMinutes.filter(m => m > 0).length;
    const rawAttend = calcAttendanceRate(stats.attendance);

    const attendRate = Math.min(100, Math.max(0, rawAttend));
    const streakDays = calculateCurrentActivityStreak(stats.attendance, []);
    const engagementScore = Math.max(FLOOR.engagementScore, Math.min(100, Math.round(
      (streakDays * 8) + (attendRate * 0.3) + (Math.min(totalMinutes / 200, 1) * 30)
    )));

    // ── Real subject progress from gameMastery ──
    const englishReal = computeRealSubjectProgress(mastery, ENGLISH_CHAPTERS, 'english');
    const mathsReal = computeRealSubjectProgress(mastery, MATHS_CHAPTERS, 'maths');

    const growthBoost = Math.round(overallGrowth * 0.3);
    const allSubjectDefs = [
      { ...BASELINE_SUBJECTS[0], real: englishReal },
      { ...BASELINE_SUBJECTS[1], real: mathsReal },
      { ...BASELINE_SUBJECTS[2], real: { chaptersCompleted: 0, totalChapters: 8, accuracy: 0, gamesPlayed: 0 } }, // Activities (no game tracking)
      { ...BASELINE_SUBJECTS[3], real: { chaptersCompleted: 0, totalChapters: 10, accuracy: 0, gamesPlayed: 0 } }, // Hindi
      { ...BASELINE_SUBJECTS[4], real: { chaptersCompleted: 0, totalChapters: 8, accuracy: 0, gamesPlayed: 0 } }, // Gujarati
    ];

    const subjects: SubjectProgress[] = allSubjectDefs.map((b, i) => {
      const realProg = b.real;
      // Use real data if child has played any games, otherwise use baseline + growth boost
      const hasRealData = realProg.gamesPlayed > 0;
      const realProgress = realProg.totalChapters > 0
        ? Math.round((realProg.chaptersCompleted / realProg.totalChapters) * 100)
        : 0;

      const progress = hasRealData
        ? Math.max(b.progress, realProgress)
        : Math.min(100, b.progress + Math.round(growthBoost * (1 - i * 0.05)));

      const chaptersCompleted = hasRealData
        ? Math.max(b.done, realProg.chaptersCompleted)
        : Math.min(b.total, b.done + Math.floor(growthBoost / 20));

      const chartColorKey = b.colorKey || 'blue';
      return {
        subject: b.subject,
        progress,
        chaptersCompleted,
        totalChapters: hasRealData ? realProg.totalChapters : b.total,
        color: colors.chart[chartColorKey] || colors.chart.blue,
      };
    });

    // ── Real skills derived from game performance ──
    const totalGamesPlayed = englishReal.gamesPlayed + mathsReal.gamesPlayed;
    const hasGameData = totalGamesPlayed > 0;

    const skills: SkillMetric[] = hasGameData ? [
      { skill: 'Reading',       value: Math.min(100, Math.max(BASELINE_SKILLS[0].value, englishReal.accuracy)), maxValue: 100 },
      { skill: 'Writing',       value: Math.min(100, Math.max(BASELINE_SKILLS[1].value, Math.round(englishReal.accuracy * 0.85))), maxValue: 100 },
      { skill: 'Logic',         value: Math.min(100, Math.max(BASELINE_SKILLS[2].value, mathsReal.accuracy)), maxValue: 100 },
      { skill: 'Numeracy',      value: Math.min(100, Math.max(BASELINE_SKILLS[3].value, Math.round(mathsReal.accuracy * 0.9))), maxValue: 100 },
      { skill: 'Comprehension', value: Math.min(100, Math.max(BASELINE_SKILLS[4].value, Math.round((englishReal.accuracy + mathsReal.accuracy) / 2))), maxValue: 100 },
      { skill: 'Creativity',    value: Math.min(100, Math.max(BASELINE_SKILLS[5].value, Math.round(englishReal.accuracy * 0.9))), maxValue: 100 },
    ] : BASELINE_SKILLS.map((b, i) => ({
      skill: b.skill,
      value: Math.min(100, b.value + seededJitter(doy + i * 3, 0, Math.round(growthBoost * 0.5))),
      maxValue: 100,
    }));

    const overallProgress = Math.max(
      Math.round(overallGrowth),
      Math.round(subjects.reduce((a, s) => a + s.progress, 0) / subjects.length)
    );

    // ── Real activity distribution from audit log ──
    const realActivity = computeActivityDistribution(auditLog, chapterProgress, readingSessions, bookUsage, gardenLog);
    const realTotal = Object.values(realActivity).reduce((a, b) => a + b, 0);
    const hasActivityData = realTotal > 5; // at least 5 events

    const distTotal = Math.max(totalMinutes, 179);
    const activityDistribution: ActivityEntry[] = hasActivityData
      ? Object.entries(realActivity).map(([label, count]) => {
        const fraction = realTotal > 0 ? count / realTotal : 0;
        const colorMap: Record<string, string> = {
          Games: colors.chart.blue, Lessons: colors.chart.indigo,
          Reading: colors.chart.emerald, Practice: colors.chart.amber,
          Creative: colors.chart.rose || '#F43F5E',
        };
        return {
          label,
          minutes: Math.round(distTotal * fraction),
          color: colorMap[label] || colors.chart.blue,
        };
      })
      : ACTIVITY_PROPORTIONS.map(a => ({
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

    // ── Alerts: baseline + dynamic from real data ──
    const nowIso = new Date().toISOString();
    const alerts: Alert[] = BASELINE_ALERTS.map(a => ({
      ...a,
      timestamp: nowIso,
    }));

    if (streakDays >= 7) {
      alerts.push({
        id: 'a-streak', severity: 'success', title: 'Excellent Consistency',
        description: `${streakDays}-day learning streak! Consistent practice builds strong foundations.`,
        timestamp: nowIso, category: 'achievement',
      });
    }
    if (rawAttend < 60 && rawAttend > 0) {
      alerts.push({
        id: 'a-attend', severity: 'danger', title: 'Low Attendance This Month',
        description: `Attendance rate is ${rawAttend}% this month. Regular practice significantly improves outcomes.`,
        timestamp: nowIso, category: 'engagement',
      });
    }
    // Dynamic subject-specific alerts
    if (englishReal.accuracy > 0 && englishReal.accuracy < 50) {
      alerts.push({
        id: 'a-eng-low', severity: 'warning', title: 'English Needs Practice',
        description: `English game accuracy is ${englishReal.accuracy}%. Extra reading practice recommended.`,
        timestamp: nowIso, category: 'weak-area',
      });
    }
    if (mathsReal.accuracy > 80) {
      alerts.push({
        id: 'a-math-great', severity: 'success', title: 'Maths Going Strong!',
        description: `Maths accuracy is ${mathsReal.accuracy}% — excellent progress!`,
        timestamp: nowIso, category: 'achievement',
      });
    }

    // ── Real milestones from audit log + mastery ──
    const milestones: Milestone[] = computeRealMilestones(auditLog, stats, mastery);

    const todayIso = new Date().toISOString().split('T')[0];
    const totalSessions = weeklyMinutes.reduce((sum, minutes) => (
      sum + (minutes > 0 ? Math.max(1, Math.round(minutes / Math.max(FLOOR.avgSessionMin, 1))) : 0)
    ), 0);

    // Garden — real values from TreeContext
    const gardenWater = Math.max(FLOOR.gardenWater, tree.waterLevel || 0);
    const gardenSunlight = Math.max(FLOOR.gardenSunlight, tree.sunlightLevel || 0);
    const gardenGrowth = Math.max(FLOOR.gardenGrowth, Math.round(overallGrowth));

    return {
      studentId: 'std-1-001',
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
      lastActiveDate: getLatestActivityDate(stats.attendance, []) || todayIso,
      gardenWater,
      gardenSunlight,
      gardenGrowth,
      gardenFlowers: Math.max(FLOOR.gardenFlowers, growth.flowerCount || 0),
      gardenFruits: Math.max(FLOOR.gardenFruits, growth.fruitCount || 0),
    };
  }, [xp, tree, overallGrowth, user, stats, growth]);
}
