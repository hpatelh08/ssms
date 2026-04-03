import { useEffect, useMemo, useState } from 'react';
import { useXP } from '../../child/XPProvider';
import { useAuth } from '../../auth/AuthContext';
import type { AuditLogEntry, Badge } from '../../types';
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
  ENGLISH_CHAPTERS,
  MATHS_CHAPTERS,
  SCIENCE_CHAPTERS,
  type ChapterDef,
  type GameProgress as SubjectGameProgress,
} from '../../games/subjects/engine/types';
import { ALL_BOOKS } from '../../data/bookConfig';
import {
  buildActivitySnapshot,
  calculateCurrentStreak,
  computeCategoryMinutes,
  normalizeDateList,
  toLocalDateKey,
} from '../../utils/activityMetrics';

type DashboardSubject = 'English' | 'Maths' | 'Activities' | 'Hindi' | 'Gujarati' | 'EVS';

interface StoredReadingSession {
  bookId: string;
  totalPages?: number;
  pagesViewed?: number[];
}

interface ReadingSubjectProgress {
  progress: number;
  pagesRead: number;
  totalPages: number;
}

function readStats(): { attendance: string[]; badges: Badge[] } {
  try {
    const raw = localStorage.getItem('ssms_stats_v2');
    if (raw) {
      const d = JSON.parse(raw);
      return {
        attendance: Array.isArray(d.attendance) ? d.attendance : [],
        badges: Array.isArray(d.badges) ? d.badges : [],
      };
    }
  } catch {
    // ignore
  }
  return { attendance: [], badges: [] };
}

function loadMastery(): Record<string, SubjectGameProgress> {
  try {
    const raw = localStorage.getItem('gameMastery');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadAuditLog(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadReadingSessions(): StoredReadingSession[] {
  try {
    const raw = localStorage.getItem('ssms_reading_sessions');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toDashboardSubject(subject: string): DashboardSubject | null {
  const normalized = subject.trim().toLowerCase();
  if (normalized === 'english') return 'English';
  if (normalized === 'mathematics' || normalized === 'maths' || normalized === 'math') return 'Maths';
  if (normalized === 'evs' || normalized === 'science') return 'EVS';
  if (normalized === 'hindi') return 'Hindi';
  if (normalized === 'gujarati') return 'Gujarati';
  if (
    normalized === 'arts' ||
    normalized === 'physical education' ||
    normalized === 'pe' ||
    normalized === 'activity' ||
    normalized === 'activities'
  ) {
    return 'Activities';
  }
  return null;
}

function positiveInt(value: unknown): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function buildReadingSubjectProgress(
  sessions: StoredReadingSession[],
): Record<DashboardSubject, ReadingSubjectProgress> {
  const result: Record<DashboardSubject, ReadingSubjectProgress> = {
    English: { progress: 0, pagesRead: 0, totalPages: 0 },
    Maths: { progress: 0, pagesRead: 0, totalPages: 0 },
    Activities: { progress: 0, pagesRead: 0, totalPages: 0 },
    Hindi: { progress: 0, pagesRead: 0, totalPages: 0 },
    Gujarati: { progress: 0, pagesRead: 0, totalPages: 0 },
    EVS: { progress: 0, pagesRead: 0, totalPages: 0 },
  };

  const booksById = new Map(ALL_BOOKS.map(book => [book.id, book]));
  const pagesByBook = new Map<string, Set<number>>();
  const totalPagesByBook = new Map<string, number>();

  for (const session of sessions) {
    if (!session || typeof session.bookId !== 'string' || !booksById.has(session.bookId)) continue;

    const pages = Array.isArray(session.pagesViewed) ? session.pagesViewed : [];
    const pageSet = pagesByBook.get(session.bookId) || new Set<number>();
    for (const page of pages) {
      const cleanPage = positiveInt(page);
      if (cleanPage > 0) pageSet.add(cleanPage);
    }
    pagesByBook.set(session.bookId, pageSet);

    const inferredTotal = positiveInt(session.totalPages);
    if (inferredTotal > 0) {
      totalPagesByBook.set(
        session.bookId,
        Math.max(totalPagesByBook.get(session.bookId) || 0, inferredTotal),
      );
    }
  }

  for (const [bookId, pageSet] of pagesByBook.entries()) {
    const book = booksById.get(bookId);
    if (!book) continue;
    const dashboardSubject = toDashboardSubject(book.subject);
    if (!dashboardSubject) continue;

    const totalPages = totalPagesByBook.get(bookId) || 0;
    if (totalPages <= 0) continue;

    let pagesRead = 0;
    for (const page of pageSet) {
      if (page >= 1 && page <= totalPages) {
        pagesRead += 1;
      }
    }

    result[dashboardSubject].pagesRead += pagesRead;
    result[dashboardSubject].totalPages += totalPages;
  }

  (Object.keys(result) as DashboardSubject[]).forEach(subject => {
    const summary = result[subject];
    summary.progress = summary.totalPages > 0
      ? Math.max(0, Math.min(100, Math.round((summary.pagesRead / summary.totalPages) * 100)))
      : 0;
  });

  return result;
}

function getMonthSchoolDays(now: Date): number {
  let schoolDays = 0;
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    if (date > now) break;
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) schoolDays += 1;
  }
  return schoolDays;
}

function attendanceRateFromDates(activeDates: string[], now: Date): number {
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const today = toLocalDateKey(now);
  const monthlyActive = activeDates.filter(d => d.startsWith(monthPrefix) && d <= today).length;
  const schoolDays = getMonthSchoolDays(now);
  return schoolDays > 0 ? Math.round((monthlyActive / schoolDays) * 100) : 0;
}

function buildWeeklyMinutesFromAttendance(attendance: string[], now: Date): number[] {
  const attendSet = new Set(attendance);
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const output: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    output.push(attendSet.has(toLocalDateKey(date)) ? 20 : 0);
  }
  return output;
}

function progressFromMinutes(minutes: number, targetMinutes: number): number {
  if (targetMinutes <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((minutes / targetMinutes) * 100)));
}

function computeRealSubjectProgress(
  mastery: Record<string, SubjectGameProgress>,
  chapters: ChapterDef[],
  subjectKey: string,
): { chaptersCompleted: number; totalChapters: number; accuracy: number; gamesPlayed: number } {
  let chaptersCompleted = 0;
  let totalScore = 0;
  let totalQs = 0;
  let gamesPlayed = 0;

  for (const chapter of chapters) {
    let chapterHasProgress = false;
    for (const game of chapter.games) {
      const key = `${subjectKey}_${chapter.id}_${game.id}`;
      const gp = mastery[key];
      if (!gp) continue;

      for (const difficulty of ['easy', 'intermediate', 'difficult'] as const) {
        const dp = gp[difficulty];
        if (!dp) continue;
        const levels = Object.values(dp.miniLevels);
        if (levels.length === 0) continue;

        chapterHasProgress = true;
        gamesPlayed += 1;
        totalScore += levels.reduce((sum, level) => sum + level.score, 0);
        totalQs += levels.reduce((sum, level) => sum + level.total, 0);
      }
    }
    if (chapterHasProgress) chaptersCompleted += 1;
  }

  return {
    chaptersCompleted,
    totalChapters: chapters.length,
    accuracy: totalQs > 0 ? Math.round((totalScore / totalQs) * 100) : 0,
    gamesPlayed,
  };
}

function computeMilestones(
  activeDates: string[],
  streakDays: number,
  auditLog: AuditLogEntry[],
): Milestone[] {
  const milestones: Milestone[] = [];

  if (activeDates.length > 0) {
    milestones.push({
      id: 'm-first-activity',
      title: 'First Activity',
      description: 'Started the learning journey.',
      icon: 'flag',
      date: activeDates[0],
      category: 'milestone',
    });
  }
  if (streakDays >= 3) {
    milestones.push({
      id: 'm-streak-3',
      title: '3-Day Streak',
      description: 'Learning streak reached three days.',
      icon: 'flame',
      date: toLocalDateKey(new Date()),
      category: 'streak',
    });
  }
  if (streakDays >= 7) {
    milestones.push({
      id: 'm-streak-7',
      title: '7-Day Streak',
      description: 'Excellent consistency for one full week.',
      icon: 'trophy',
      date: toLocalDateKey(new Date()),
      category: 'streak',
    });
  }

  const gameCompletions = auditLog.filter(
    entry => entry.category === 'game' && entry.action === 'game_complete',
  );
  if (gameCompletions.length > 0) {
    milestones.push({
      id: 'm-first-game',
      title: 'First Game Complete',
      description: 'Completed the first game session.',
      icon: 'star',
      date: toLocalDateKey(gameCompletions[gameCompletions.length - 1].timestamp),
      category: 'academic',
    });
  }

  return milestones;
}

export function useParentAnalytics(): StudentAnalytics {
  const { state: xp } = useXP();
  const { user } = useAuth();
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshTick(prev => prev + 1);
    const intervalId = window.setInterval(refresh, 2000);
    window.addEventListener('storage', refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return useMemo<StudentAnalytics>(() => {
    const now = new Date();
    const today = toLocalDateKey(now);
    const stats = readStats();
    const auditLog = loadAuditLog();
    const readingSessions = loadReadingSessions();
    const mastery = loadMastery();
    const snapshot = buildActivitySnapshot(auditLog, now);
    const readingSubjectProgress = buildReadingSubjectProgress(readingSessions);

    const fallbackAttendance = normalizeDateList(stats.attendance);
    const activeDates = snapshot.activeDates.length > 0 ? snapshot.activeDates : fallbackAttendance;
    const streakDays = snapshot.activeDates.length > 0
      ? snapshot.currentStreak
      : calculateCurrentStreak(activeDates, now);
    const attendanceRate = snapshot.activeDates.length > 0
      ? snapshot.attendanceRate
      : attendanceRateFromDates(activeDates, now);
    const monthlySchoolDays = snapshot.activeDates.length > 0
      ? snapshot.monthlySchoolDays
      : getMonthSchoolDays(now);
    const monthlyActiveDays = snapshot.activeDates.length > 0
      ? snapshot.monthlyActiveDays
      : activeDates.filter(d => d.startsWith(today.slice(0, 7)) && d <= today).length;

    const weeklyMinutes = snapshot.totalMeaningfulEvents > 0
      ? snapshot.currentWeekMinutes
      : buildWeeklyMinutesFromAttendance(activeDates, now);
    const weeklyTotal = weeklyMinutes.reduce((sum, value) => sum + value, 0);
    const weeklyActiveDays = weeklyMinutes.filter(value => value > 0).length;
    // Sessions are intentionally day-based for weekly UI: 1 active login day = 1 session.
    const weeklySessions = weeklyActiveDays;
    const avgSessionMinutes = weeklySessions > 0 ? Math.round(weeklyTotal / weeklySessions) : 0;
    const lastWeekAvgSessionMinutes = snapshot.previousWeekAvgSessionMinutes;
    const lastActiveDate = activeDates.length > 0 ? activeDates[activeDates.length - 1] : '';

    const englishReal = computeRealSubjectProgress(mastery, ENGLISH_CHAPTERS, 'english');
    const mathsReal = computeRealSubjectProgress(mastery, MATHS_CHAPTERS, 'maths');
    const scienceReal = computeRealSubjectProgress(mastery, SCIENCE_CHAPTERS, 'science');

    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthCategoryMinutes = computeCategoryMinutes(auditLog, monthPrefix);
    const subjectDefs: Array<{
      subject: DashboardSubject;
      color: string;
      total: number;
    }> = [
      { subject: 'English', color: colors.chart.blue, total: englishReal.totalChapters || 6 },
      { subject: 'Maths', color: colors.chart.indigo, total: mathsReal.totalChapters || 6 },
      { subject: 'Activities', color: colors.chart.emerald, total: 8 },
      { subject: 'Hindi', color: colors.chart.amber, total: 10 },
      { subject: 'Gujarati', color: colors.chart.rose || '#F43F5E', total: 8 },
      { subject: 'EVS', color: colors.chart.emerald, total: scienceReal.totalChapters || 6 },
    ];

    const subjects: SubjectProgress[] = subjectDefs.map(def => {
      const reading = readingSubjectProgress[def.subject];
      const progress = reading.progress;
      const chaptersCompleted = Math.min(def.total, Math.round((progress / 100) * def.total));
      return {
        subject: def.subject,
        progress,
        chaptersCompleted,
        totalChapters: def.total,
        color: def.color,
      };
    });

    const overallProgress = subjects.length > 0
      ? Math.round(subjects.reduce((sum, subject) => sum + subject.progress, 0) / subjects.length)
      : 0;

    const skills: SkillMetric[] = [
      { skill: 'Reading', value: englishReal.accuracy || progressFromMinutes(monthCategoryMinutes.Reading, 180), maxValue: 100 },
      { skill: 'Writing', value: Math.round((englishReal.accuracy || 0) * 0.85) || progressFromMinutes(monthCategoryMinutes.Lessons, 180), maxValue: 100 },
      { skill: 'Logic', value: mathsReal.accuracy || progressFromMinutes(monthCategoryMinutes.Games, 220), maxValue: 100 },
      { skill: 'Numeracy', value: Math.round((mathsReal.accuracy || 0) * 0.9) || progressFromMinutes(monthCategoryMinutes.Practice, 200), maxValue: 100 },
      { skill: 'Comprehension', value: scienceReal.accuracy || progressFromMinutes(monthCategoryMinutes.Lessons, 220), maxValue: 100 },
      { skill: 'Creativity', value: progressFromMinutes(monthCategoryMinutes.Creative, 180), maxValue: 100 },
    ];

    const activityDistribution: ActivityEntry[] = [
      { label: 'Games', minutes: monthCategoryMinutes.Games, color: colors.chart.blue },
      { label: 'Lessons', minutes: monthCategoryMinutes.Lessons, color: colors.chart.indigo },
      { label: 'Reading', minutes: monthCategoryMinutes.Reading, color: colors.chart.emerald },
      { label: 'Practice', minutes: monthCategoryMinutes.Practice, color: colors.chart.amber },
      { label: 'Creative', minutes: monthCategoryMinutes.Creative, color: colors.chart.rose || '#F43F5E' },
    ];

    const heatmapData: HeatmapCell[] = [];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekMax = Math.max(...weeklyMinutes, 1);
    for (const skill of skills) {
      for (let i = 0; i < 7; i += 1) {
        const base = weeklyMinutes[i] / weekMax;
        heatmapData.push({
          day: dayLabels[i],
          skill: skill.skill,
          intensity: Math.max(0.1, Math.min(1, base * (skill.value / 100))),
        });
      }
    }

    const engagementScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          streakDays * 10 +
          attendanceRate * 0.35 +
          (Math.min(weeklyTotal, 300) / 300) * 30,
        ),
      ),
    );

    const alerts: Alert[] = [];
    if (activeDates.length === 0) {
      alerts.push({
        id: 'a-no-activity',
        severity: 'warning',
        title: 'No Learning Activity Yet',
        description: 'No child activity has been recorded so far. Start one session to begin tracking.',
        timestamp: new Date().toISOString(),
        category: 'engagement',
      });
    }
    if (streakDays === 0 && activeDates.length > 0) {
      alerts.push({
        id: 'a-streak-break',
        severity: 'warning',
        title: 'Streak Break Detected',
        description: 'No activity today, so the current streak is reset.',
        timestamp: new Date().toISOString(),
        category: 'missed-practice',
      });
    }
    if (attendanceRate < 60 && activeDates.length > 0) {
      alerts.push({
        id: 'a-low-attendance',
        severity: 'danger',
        title: 'Low Attendance This Month',
        description: `Attendance is ${attendanceRate}% this month. Try a short daily activity to rebuild consistency.`,
        timestamp: new Date().toISOString(),
        category: 'engagement',
      });
    }
    if (streakDays >= 3) {
      alerts.push({
        id: 'a-good-streak',
        severity: 'success',
        title: 'Consistency Improving',
        description: `${streakDays}-day activity streak is active.`,
        timestamp: new Date().toISOString(),
        category: 'achievement',
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        id: 'a-healthy',
        severity: 'info',
        title: 'Tracking Live',
        description: 'Activity, streak, and attendance are syncing from real learning events.',
        timestamp: new Date().toISOString(),
        category: 'engagement',
      });
    }

    const milestones: Milestone[] = computeMilestones(activeDates, streakDays, auditLog);
    const totalXP = xp.xp + (xp.level - 1) * (xp.xpToNext || 30);
    const totalSessions = snapshot.totalSessionCount > 0 ? snapshot.totalSessionCount : activeDates.length;

    return {
      studentId: 'std-1-001',
      studentName: user.name || 'Yash',
      overallProgress,
      level: xp.level,
      xp: Math.max(0, totalXP),
      xpToNext: xp.xpToNext || 30,
      engagementScore,
      streakDays,
      weeklyMinutes,
      subjects,
      skills,
      activityDistribution,
      heatmapData,
      alerts,
      milestones,
      attendanceRate,
      monthlyActiveDays,
      monthlySchoolDays,
      weeklySessions,
      lastWeekAvgSessionMinutes,
      totalSessions,
      avgSessionMinutes,
      lastActiveDate,
      activeDates,
    };
  }, [xp, user, refreshTick]);
}
