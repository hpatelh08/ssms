/**
 * parent/analytics/useParentAnalytics.ts
 * ─────────────────────────────────────────────────────
 * Data hook that bridges child activity data (XP, Tree, Auth,
 * game mastery, audit log) into the StudentAnalytics model.
 *
 * Reads REAL data from localStorage:
 *  • gameMastery       — subject game progress (English/Maths/Science)
 *  • ssms_audit_log    — all child activity events
 *  • child_xp_state    — XP & level
 *  • ssms_stats_v2     — attendance & streak
 *  • ssms_tree_state   — garden growth
 *
 * Floor values from mockParentAnalytics ensure dashboard
 * looks populated even for brand-new users.
 */

import { useEffect, useMemo, useState } from 'react';
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
import {
  ENGLISH_CHAPTERS, MATHS_CHAPTERS, SCIENCE_CHAPTERS,
  type ChapterDef, type GameProgress as SubjectGameProgress,
} from '../../games/subjects/engine/types';

/* ── Centralized baseline / floor data ────────────── */
import {
  BASELINE_SUBJECTS,
  ACTIVITY_PROPORTIONS,
} from '../../data/mockParentAnalytics';
import { ensureMinimumAttendanceDays } from '../../utils/attendanceSeed';

/* ── Helpers ────────────────────────────────────── */

function readStats(): { streak: number; attendance: string[]; badges: Badge[] } {
  const seeded = ensureMinimumAttendanceDays(20);
  return {
    streak: seeded.streak,
    attendance: seeded.attendance,
    badges: seeded.badges as Badge[],
  };
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

interface BookUsageEntry {
  bookId: string;
  action: string;
  timestamp: string;
}

type ActivityKey = 'Games' | 'Lessons' | 'Reading' | 'Practice' | 'Creative';
const ACTIVITY_KEYS: ActivityKey[] = ['Games', 'Lessons', 'Reading', 'Practice', 'Creative'];

function emptyActivityCounts(): Record<ActivityKey, number> {
  return { Games: 0, Lessons: 0, Reading: 0, Practice: 0, Creative: 0 };
}

function loadAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadBookUsageLog(): BookUsageEntry[] {
  try {
    const raw = localStorage.getItem('ssms_book_usage');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function calcAttendanceRate(attendance: string[]): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const todayIso = toLocalIso(now);

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

function sortUniqueIsoDates(dates: string[]): string[] {
  return [...new Set(dates)].sort();
}

function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSchoolDay(date: Date): boolean {
  const dow = date.getDay();
  return dow !== 0 && dow !== 6;
}

function previousSchoolDay(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  do {
    d.setDate(d.getDate() - 1);
  } while (!isSchoolDay(d));
  return d;
}

function calcCurrentStreak(attendanceDates: string[], auditLog: AuditEntry[]): number {
  if (attendanceDates.length === 0) return 0;

  const presentSet = new Set(attendanceDates);
  const today = new Date();
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayIso = toLocalIso(todayLocal);

  // If there is meaningful activity today, treat today as present
  // so streak reflects current session immediately.
  const hasActivityToday = auditLog.some(
    (entry) => entry.timestamp?.startsWith(todayIso) && entry.action !== 'navigation',
  );
  if (isSchoolDay(todayLocal) && hasActivityToday) {
    presentSet.add(todayIso);
  }

  let cursor = new Date(todayLocal);
  if (!isSchoolDay(cursor)) {
    cursor = previousSchoolDay(cursor);
  }

  if (!presentSet.has(toLocalIso(cursor))) return 0;

  let streak = 0;
  while (presentSet.has(toLocalIso(cursor))) {
    streak++;
    cursor = previousSchoolDay(cursor);
  }
  return streak;
}

function getWeeklyMinutes(auditLog: AuditEntry[], attendance: string[]): number[] {
  const attendSet = new Set(attendance);
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dow === 0 ? 7 : dow) - 1));
  monday.setHours(0, 0, 0, 0);

  const byDate = new Map<string, AuditEntry[]>();
  for (const entry of auditLog) {
    const iso = entry.timestamp?.split('T')[0];
    if (!iso) continue;
    if (!byDate.has(iso)) byDate.set(iso, []);
    byDate.get(iso)!.push(entry);
  }

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toLocalIso(d);
    const entries = byDate.get(iso) || [];
    const meaningfulEvents = entries.filter(e => e.action !== 'navigation').length;
    if (meaningfulEvents > 0) return meaningfulEvents * 2;
    return attendSet.has(iso) ? 10 : 0;
  });
}

function distributeMinutesByWeight(
  totalMinutes: number,
  weights: Record<ActivityKey, number>,
): Record<ActivityKey, number> {
  const safeTotal = Math.max(0, Math.round(totalMinutes));
  const result = emptyActivityCounts();
  if (safeTotal <= 0) return result;

  const totalWeight = ACTIVITY_KEYS.reduce((sum, key) => sum + Math.max(0, weights[key] || 0), 0);
  if (totalWeight <= 0) return result;

  const exact = ACTIVITY_KEYS.map((key) => {
    const value = (Math.max(0, weights[key] || 0) / totalWeight) * safeTotal;
    return { key, floor: Math.floor(value), frac: value - Math.floor(value) };
  });

  for (const item of exact) {
    result[item.key] = item.floor;
  }

  let remaining = safeTotal - exact.reduce((sum, item) => sum + item.floor, 0);
  if (remaining > 0) {
    const ranked = [...exact].sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < remaining; i++) {
      const key = ranked[i % ranked.length].key;
      result[key] += 1;
    }
  }

  return result;
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

/** Derive activity distribution from audit log categories */
function computeActivityDistribution(
  auditLog: AuditEntry[],
  bookUsageLog: BookUsageEntry[],
): Record<ActivityKey, number> {
  const counts = emptyActivityCounts();
  const add = (key: ActivityKey, weight = 1) => {
    counts[key] += weight;
  };

  for (const entry of auditLog) {
    const action = (entry.action || '').toLowerCase();
    const category = (entry.category || '').toLowerCase();
    if (category === 'navigation') continue;

    if (
      category === 'game' ||
      action.includes('game_') ||
      action.includes('difficulty_') ||
      action.includes('arcade') ||
      action.includes('puzzle')
    ) {
      add('Games', action.includes('complete') ? 2 : 1);
      continue;
    }

    if (
      category === 'homework' ||
      action.includes('homework') ||
      action.includes('worksheet') ||
      action.includes('practice') ||
      action.includes('revision')
    ) {
      add('Practice');
      continue;
    }

    if (
      category === 'reading' ||
      action.includes('book') ||
      action.includes('read') ||
      action.includes('pdf') ||
      action.includes('library')
    ) {
      add('Reading');
      continue;
    }

    if (
      category === 'creative' ||
      action.includes('garden') ||
      action.includes('color') ||
      action.includes('space') ||
      action.includes('draw') ||
      action.includes('art') ||
      action.includes('music') ||
      action.includes('journey')
    ) {
      add('Creative');
      continue;
    }

    if (
      category === 'ai' ||
      action.includes('lesson') ||
      action.includes('chapter') ||
      action.includes('video') ||
      action.includes('rag') ||
      action.includes('chat')
    ) {
      add('Lessons');
    }
  }

  for (const entry of bookUsageLog) {
    const action = (entry.action || '').toLowerCase();
    if (action.includes('book') || action.includes('read') || action.includes('pdf')) {
      add('Reading', 2);
    }
  }

  return counts;
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
      icon: 'flame', date: toLocalIso(new Date()), category: 'streak',
    });
  }
  if (stats.streak >= 7) {
    milestones.push({
      id: 'r-streak-7', title: '7-Day Streak',
      description: 'One full week of practice!',
      icon: 'flame', date: toLocalIso(new Date()), category: 'streak',
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
  const subjectNames: Record<string, string> = { english: 'English', maths: 'Maths', science: 'EVS' };
  for (const [key, gp] of Object.entries(mastery)) {
    if (gp.easy?.completed) {
      const parts = key.split('_');
      const subKey = parts[0];
      const subName = subjectNames[subKey] || subKey;
      milestones.push({
        id: `r-${key}-easy`, title: `${subName} Easy Mastered`,
        description: `Completed easy level in ${subName}!`,
        icon: 'star', date: toLocalIso(new Date()), category: 'academic',
      });
      break; // Only add first per subject to avoid spam
    }
  }

  return milestones;
}

/* ── Main Hook ──────────────────────────────────── */

export function useParentAnalytics(): StudentAnalytics {
  const { state: xp } = useXP();
  const { tree, overallGrowth } = useTree();
  const { user } = useAuth();
  const growth = useGrowthSystem();
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSyncTick((v) => v + 1);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const stats = useMemo(readStats, [syncTick]);

  return useMemo<StudentAnalytics>(() => {
    const mastery = loadMastery();
    const auditLog = loadAuditLog();
    const bookUsageLog = loadBookUsageLog();
    const attendanceDates = sortUniqueIsoDates(stats.attendance);
    const totalXP = Math.max(0, xp.xp + Math.max(0, xp.level - 1) * (xp.xpToNext || 0));
    const level = Math.max(1, xp.level || 1);
    const xpToNext = Math.max(1, xp.xpToNext || 30);
    const weeklyMinutes = getWeeklyMinutes(auditLog, attendanceDates);
    const totalMinutes = weeklyMinutes.reduce((a, b) => a + b, 0);
    const activeDays = weeklyMinutes.filter(m => m > 0).length;
    const rawAttend = attendanceDates.length > 0 ? calcAttendanceRate(attendanceDates) : 0;

    const attendRate = rawAttend;
    const derivedStreak = calcCurrentStreak(attendanceDates, auditLog);
    const streakDays = attendanceDates.length > 0
      ? derivedStreak
      : Math.max(0, stats.streak || 0);
    const engagementScore = Math.max(0, Math.min(100, Math.round(
      (streakDays * 8) + (attendRate * 0.3) + (Math.min(totalMinutes / 200, 1) * 30)
    )));

    // ── Real subject progress from gameMastery ──
    const englishReal = computeRealSubjectProgress(mastery, ENGLISH_CHAPTERS, 'english');
    const mathsReal = computeRealSubjectProgress(mastery, MATHS_CHAPTERS, 'maths');
    const scienceReal = computeRealSubjectProgress(mastery, SCIENCE_CHAPTERS, 'science');

    const allSubjectDefs = [
      { ...BASELINE_SUBJECTS[0], real: englishReal },
      { ...BASELINE_SUBJECTS[1], real: mathsReal },
      { ...BASELINE_SUBJECTS[2], real: scienceReal },  // Science
      { ...BASELINE_SUBJECTS[3], real: { chaptersCompleted: BASELINE_SUBJECTS[3].done, totalChapters: BASELINE_SUBJECTS[3].total, accuracy: 0, gamesPlayed: 0 } }, // Hindi
      { ...BASELINE_SUBJECTS[4], real: { chaptersCompleted: BASELINE_SUBJECTS[4].done, totalChapters: BASELINE_SUBJECTS[4].total,  accuracy: 0, gamesPlayed: 0 } }, // Gujarati
    ];

    const subjects: SubjectProgress[] = allSubjectDefs.map((b) => {
      const realProg = b.real;
      const hasRealData = realProg.gamesPlayed > 0;
      const totalChapters = hasRealData ? realProg.totalChapters : b.total;
      const chaptersCompleted = Math.min(
        totalChapters,
        Math.max(0, hasRealData ? realProg.chaptersCompleted : b.done),
      );
      const progress = totalChapters > 0
        ? Math.round((chaptersCompleted / totalChapters) * 100)
        : 0;

      const chartColorKey = b.colorKey || 'blue';
      return {
        subject: b.subject,
        progress,
        chaptersCompleted,
        totalChapters,
        color: colors.chart[chartColorKey] || colors.chart.blue,
      };
    });

    // ── Real skills derived from game performance ──
    const englishProgress = subjects.find(s => s.subject === 'English')?.progress ?? 0;
    const mathsProgress = subjects.find(s => s.subject === 'Maths')?.progress ?? 0;
    const scienceProgress = subjects.find(s => s.subject === 'Science')?.progress ?? 0;
    const totalGamesPlayed = englishReal.gamesPlayed + mathsReal.gamesPlayed + scienceReal.gamesPlayed;
    const hasGameData = totalGamesPlayed > 0;

    const skills: SkillMetric[] = [
      { skill: 'Reading',       value: hasGameData && englishReal.gamesPlayed > 0 ? englishReal.accuracy : englishProgress, maxValue: 100 },
      { skill: 'Writing',       value: Math.round((hasGameData && englishReal.gamesPlayed > 0 ? englishReal.accuracy : englishProgress) * 0.85), maxValue: 100 },
      { skill: 'Logic',         value: hasGameData && mathsReal.gamesPlayed > 0 ? mathsReal.accuracy : mathsProgress, maxValue: 100 },
      { skill: 'Numeracy',      value: Math.round((hasGameData && mathsReal.gamesPlayed > 0 ? mathsReal.accuracy : mathsProgress) * 0.9), maxValue: 100 },
      { skill: 'Comprehension', value: hasGameData && scienceReal.gamesPlayed > 0 ? scienceReal.accuracy : scienceProgress, maxValue: 100 },
      { skill: 'Creativity',    value: Math.round(((hasGameData && englishReal.gamesPlayed > 0 ? englishReal.accuracy : englishProgress) + (hasGameData && scienceReal.gamesPlayed > 0 ? scienceReal.accuracy : scienceProgress)) / 2), maxValue: 100 },
    ].map(s => ({ ...s, value: Math.max(0, Math.min(100, s.value)) }));

    const overallProgress = subjects.length > 0
      ? Math.round(subjects.reduce((a, s) => a + s.progress, 0) / subjects.length)
      : 0;

    // ── Real activity distribution from audit log ──
    const realActivity = computeActivityDistribution(auditLog, bookUsageLog);
    const realTotal = ACTIVITY_KEYS.reduce((sum, key) => sum + realActivity[key], 0);
    const hasActivityData = realTotal > 0;

    const distTotal = totalMinutes;
    const baselineWeights = emptyActivityCounts();
    for (const item of ACTIVITY_PROPORTIONS) {
      if (item.label === 'Games') baselineWeights.Games = item.fraction;
      if (item.label === 'Lessons') baselineWeights.Lessons = item.fraction;
      if (item.label === 'Reading') baselineWeights.Reading = item.fraction;
      if (item.label === 'Practice') baselineWeights.Practice = item.fraction;
      if (item.label === 'Creative') baselineWeights.Creative = item.fraction;
    }

    const minutesByCategory = hasActivityData
      ? distributeMinutesByWeight(distTotal, realActivity)
      : distributeMinutesByWeight(distTotal, baselineWeights);

    const colorMap: Record<ActivityKey, string> = {
      Games: colors.chart.blue,
      Lessons: colors.chart.indigo,
      Reading: colors.chart.emerald,
      Practice: colors.chart.amber,
      Creative: colors.chart.rose || '#F43F5E',
    };

    const activityDistribution: ActivityEntry[] = ACTIVITY_KEYS.map((label) => ({
      label,
      minutes: minutesByCategory[label],
      color: colorMap[label],
    }));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxDayMinutes = Math.max(...weeklyMinutes, 1);
    const heatmapData: HeatmapCell[] = [];
    for (const skill of skills) {
      for (let i = 0; i < 7; i++) {
        const dayEnergy = weeklyMinutes[i] / maxDayMinutes;
        const skillWeight = skill.value / 100;
        heatmapData.push({
          day: days[i],
          skill: skill.skill,
          intensity: Math.min(1, Math.max(0.08, (dayEnergy * 0.65) + (skillWeight * 0.35))),
        });
      }
    }

    // ── Alerts: baseline + dynamic from real data ──
    const nowIso = new Date().toISOString();
    const alerts: Alert[] = [];

    if (streakDays >= 7) {
      alerts.push({
        id: 'a-streak', severity: 'success', title: 'Excellent Consistency',
        description: `${streakDays}-day learning streak! Consistent practice builds strong foundations.`,
        timestamp: nowIso, category: 'achievement',
      });
    }
    if (attendRate < 60 && attendRate > 0) {
      alerts.push({
        id: 'a-attend', severity: 'danger', title: 'Low Attendance This Month',
        description: `Attendance rate is ${attendRate}% this month. Regular practice significantly improves outcomes.`,
        timestamp: nowIso, category: 'engagement',
      });
    }
    // Dynamic subject-specific alerts
    if (englishReal.gamesPlayed > 0 && englishReal.accuracy < 50) {
      alerts.push({
        id: 'a-eng-low', severity: 'warning', title: 'English Needs Practice',
        description: `English game accuracy is ${englishReal.accuracy}%. Extra reading practice recommended.`,
        timestamp: nowIso, category: 'weak-area',
      });
    }
    if (mathsReal.gamesPlayed > 0 && mathsReal.accuracy > 80) {
      alerts.push({
        id: 'a-math-great', severity: 'success', title: 'Maths Going Strong!',
        description: `Maths accuracy is ${mathsReal.accuracy}% — excellent progress!`,
        timestamp: nowIso, category: 'achievement',
      });
    }
    if (scienceReal.gamesPlayed > 0) {
      alerts.push({
        id: 'a-sci-active', severity: 'success', title: 'Science Lab Active',
        description: `${scienceReal.gamesPlayed} science games played with ${scienceReal.accuracy}% accuracy.`,
        timestamp: nowIso, category: 'achievement',
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        id: 'a-bootstrap',
        severity: 'info',
        title: 'Building Learning Data',
        description: 'As the child completes more sessions, this section will show sharper subject-level insights.',
        timestamp: nowIso,
        category: 'engagement',
      });
    }

    // ── Real milestones from audit log + mastery ──
    const milestones: Milestone[] = computeRealMilestones(
      auditLog,
      { streak: streakDays, attendance: attendanceDates },
      mastery,
    );

    const totalSessions = attendanceDates.length;

    // Garden — real values from TreeContext
    const gardenWater = Math.max(0, Math.round(tree.waterLevel || 0));
    const gardenSunlight = Math.max(0, Math.round(tree.sunlightLevel || 0));
    const gardenGrowth = Math.max(0, Math.round(overallGrowth));

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
      attendanceDates,
      totalSessions,
      avgSessionMinutes: activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0,
      lastActiveDate: attendanceDates.length > 0
        ? attendanceDates[attendanceDates.length - 1]
        : '',
      gardenWater,
      gardenSunlight,
      gardenGrowth,
      gardenFlowers: Math.max(0, growth.flowerCount || 0),
      gardenFruits: Math.max(0, growth.fruitCount || 0),
    };
  }, [xp, tree, overallGrowth, user, stats, growth, syncTick]);
}
