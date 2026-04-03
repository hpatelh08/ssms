/**
 * parent/analytics/useParentAnalytics.ts
 * ─────────────────────────────────────────────────────
 * Live analytics hook for the Parent Dashboard.
 *
 * Reads persisted activity data from localStorage-backed systems:
 *   - XP / level state
 *   - attendance / streak stats
 *   - chapter progress + timed book activities
 *   - reading sessions and quizzes
 *   - audit log game / AI activity
 *
 * No mock floors are applied. When no activity exists, values remain low/zero
 * and the dashboard explains that state instead of inventing data.
 */

import { useEffect, useMemo, useState } from 'react';
import { useXP } from '../../child/XPProvider';
import { useTree } from '../../context/TreeContext';
import { useAuth } from '../../auth/AuthContext';
import { useGrowthSystem } from '../../hooks/useGrowthSystem';
import { ALL_BADGES } from '../../utils/badgeEngine';
import type { Badge, AuditLogEntry } from '../../types';
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
import { ALL_BOOKS, type BookEntry } from '../../data/bookConfig';
import type { ChapterProgress, SubjectStrength } from '../../services/progressTracker';
import type { AIInteraction, QuizResult, ReadingSession } from '../../services/readingInsights';
import { getSubjectStrengths } from '../../services/progressTracker';
import { syncSharedActivityStats } from '../../services/sharedActivityStats';

const STORAGE_KEYS = {
  stats: 'ssms_stats_v2',
  progress: 'ssms_chapter_progress',
  audit: 'ssms_audit_log',
  readingSessions: 'ssms_reading_sessions',
  readingQuizzes: 'ssms_reading_quizzes',
  readingAI: 'ssms_reading_ai',
} as const;

const SUBJECT_ORDER = [
  'English',
  'Maths',
  'Science',
  'Social Science',
  'Activities',
  'Hindi',
  'Gujarati',
] as const;

const SUBJECT_COLOR_KEYS: Record<string, keyof typeof colors.chart> = {
  English: 'blue',
  Maths: 'indigo',
  Science: 'cyan',
  'Social Science': 'rose',
  Activities: 'emerald',
  Hindi: 'amber',
  Gujarati: 'purple',
};

const BOOK_BY_ID = new Map(ALL_BOOKS.map(book => [book.id, book]));
const AI_SESSION_ACTIONS = new Set([
  'ai_query_complete',
  'ncert_chat_response',
  'rag_response',
  'rag_stream_complete',
]);

type ActivityLabel = ActivityEntry['label'];

interface PersistedStats {
  streak: number;
  attendance: string[];
  badges: Badge[];
  lastActiveDate?: string;
}

interface AnalyticsSession {
  timestamp: string;
  durationMs: number;
  label: string;
  category: ActivityLabel;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function readStats(): PersistedStats {
  const stats = loadJson<Partial<PersistedStats>>(STORAGE_KEYS.stats, {});
  return {
    streak: typeof stats.streak === 'number' ? stats.streak : 0,
    attendance: Array.isArray(stats.attendance) ? stats.attendance : [],
    badges: Array.isArray(stats.badges) ? stats.badges : [],
    lastActiveDate: typeof stats.lastActiveDate === 'string' ? stats.lastActiveDate : undefined,
  };
}

function readProgress(): Record<string, ChapterProgress> {
  return loadJson<Record<string, ChapterProgress>>(STORAGE_KEYS.progress, {});
}

function readAuditLog(): AuditLogEntry[] {
  return loadJson<AuditLogEntry[]>(STORAGE_KEYS.audit, []);
}

function readReadingSessions(): ReadingSession[] {
  return loadJson<ReadingSession[]>(STORAGE_KEYS.readingSessions, []);
}

function readReadingQuizzes(): QuizResult[] {
  return loadJson<QuizResult[]>(STORAGE_KEYS.readingQuizzes, []);
}

function readReadingAI(): AIInteraction[] {
  return loadJson<AIInteraction[]>(STORAGE_KEYS.readingAI, []);
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function toLocalDateKey(input: string | number | Date): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function buildCurrentWeekDates(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow === 0 ? 7 : dow) - 1));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return toLocalDateKey(date);
  });
}

function schoolDaysSoFar(now: Date): number {
  let schoolDays = 0;
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (date > now) break;
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) schoolDays++;
  }

  return schoolDays;
}

function normalizeSubjectName(subject?: string): string {
  const value = (subject || '').trim().toLowerCase();
  if (value === 'mathematics' || value === 'math' || value === 'maths') return 'Maths';
  if (value === 'physical education' || value === 'kriti' || value === 'activities') return 'Activities';
  if (value === 'social science' || value === 'socialscience') return 'Social Science';
  if (value === 'english') return 'English';
  if (value === 'science') return 'Science';
  if (value === 'hindi') return 'Hindi';
  if (value === 'gujarati') return 'Gujarati';
  return subject?.trim() || 'Activities';
}

function colorForSubject(subject: string): string {
  return colors.chart[SUBJECT_COLOR_KEYS[subject] || 'slate'];
}

function xpRequiredForLevel(level: number): number {
  return 20 + level * 10 + Math.floor(level * level * 2);
}

function totalEarnedXp(level: number, xpInCurrentLevel: number): number {
  let total = Math.max(0, xpInCurrentLevel);
  for (let current = 1; current < level; current++) {
    total += xpRequiredForLevel(current);
  }
  return total;
}

function prettifyWords(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function formatBookActivityLabel(activity: string, progress?: ChapterProgress): string {
  const prefixMap: Record<string, string> = {
    learn: 'Lesson',
    practice: 'Practice',
    play: 'Play',
    quiz: 'Quiz',
    revision: 'Revision',
    ai: 'AI Help',
  };
  const prefix = prefixMap[activity] || prettifyWords(activity);
  return progress?.chapterName ? `${prefix} · ${progress.chapterName}` : prefix;
}

function categorizeGame(gameName: string): ActivityLabel {
  const normalized = gameName.toLowerCase();
  if (normalized.includes('color')) return 'Creative';
  return 'Games';
}

function estimateRecentChapterMs(progress: ChapterProgress): number {
  const totalMs = Object.values(progress.timeSpent).reduce((sum, value) => sum + value, 0);
  const activeBuckets = [
    progress.timeSpent.learn,
    progress.timeSpent.practice,
    progress.timeSpent.play,
    progress.timeSpent.quiz,
    progress.timeSpent.revision,
    progress.timeSpent.ai,
  ].filter(value => value > 0).length;

  if (totalMs <= 0) return 3 * 60 * 1000;
  return Math.max(60 * 1000, Math.round(totalMs / Math.max(activeBuckets, 1)));
}

function dominantChapterCategory(progress: ChapterProgress): ActivityLabel {
  const subject = normalizeSubjectName(progress.subject);
  if (subject === 'Activities') return 'Creative';

  const weighted = [
    { label: 'Lessons' as const, value: progress.timeSpent.learn },
    { label: 'Practice' as const, value: progress.timeSpent.practice + progress.timeSpent.quiz + progress.timeSpent.revision + progress.timeSpent.ai },
    { label: 'Games' as const, value: progress.timeSpent.play },
  ].sort((a, b) => b.value - a.value);

  return weighted[0]?.value > 0 ? weighted[0].label : 'Lessons';
}

function resolveDominantBoard(activityBookIds: Set<string>): BookEntry['board'] {
  let ncertHits = 0;
  let stateHits = 0;

  activityBookIds.forEach(bookId => {
    const book = BOOK_BY_ID.get(bookId);
    if (!book) return;
    if (book.board === 'state') stateHits++;
    else ncertHits++;
  });

  return stateHits > ncertHits ? 'state' : 'ncert';
}

function buildSubjectCatalog(activityBookIds: Set<string>): Map<string, { totalChapters: number; bookIds: Set<string> }> {
  const dominantBoard = resolveDominantBoard(activityBookIds);
  const catalog = new Map<string, { totalChapters: number; bookIds: Set<string> }>();

  for (const subject of SUBJECT_ORDER) {
    const activityBooks = ALL_BOOKS.filter(
      book => activityBookIds.has(book.id) && normalizeSubjectName(book.subject) === subject,
    );

    const chosenBooks = activityBooks.length > 0
      ? activityBooks
      : ALL_BOOKS.filter(
          book => book.board === dominantBoard && normalizeSubjectName(book.subject) === subject,
        );

    if (chosenBooks.length === 0) continue;

    catalog.set(subject, {
      totalChapters: chosenBooks.reduce((sum, book) => sum + book.chapters.length, 0),
      bookIds: new Set(chosenBooks.map(book => book.id)),
    });
  }

  return catalog;
}

function sortByProgress(subjects: SubjectProgress[]): SubjectProgress[] {
  return [...subjects].sort((a, b) => b.progress - a.progress);
}

export function useParentAnalytics(): StudentAnalytics {
  const { state: xp } = useXP();
  const { tree, overallGrowth } = useTree();
  const { user } = useAuth();
  const growth = useGrowthSystem();
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const refresh = () => {
      syncSharedActivityStats();
      setRefreshTick(value => value + 1);
    };
    refresh();
    const intervalId = setInterval(refresh, 2000);
    window.addEventListener('storage', refresh);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return useMemo<StudentAnalytics>(() => {
    const stats = readStats();
    const progressRecords = readProgress();
    const auditLog = readAuditLog();
    const readingSessions = readReadingSessions();
    const readingQuizzes = readReadingQuizzes();
    const readingAI = readReadingAI();
    const strengths = getSubjectStrengths();

    const now = new Date();
    const todayIso = toLocalDateKey(now);
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyTotalDays = schoolDaysSoFar(now);
    const monthlyActiveDays = stats.attendance.filter(date => date.startsWith(monthPrefix) && date <= todayIso).length;
    const attendanceRate = monthlyTotalDays > 0
      ? Math.round((monthlyActiveDays / monthlyTotalDays) * 100)
      : 0;

    const streakDays = stats.streak;
    const xpCurrentLevel = xp.xp;
    const totalXp = totalEarnedXp(xp.level, xp.xp);

    const activityBookIds = new Set<string>();
    Object.values(progressRecords).forEach(progress => activityBookIds.add(progress.bookId));
    readingSessions.forEach(session => activityBookIds.add(session.bookId));
    readingQuizzes.forEach(quiz => activityBookIds.add(quiz.bookId));
    readingAI.forEach(interaction => activityBookIds.add(interaction.bookId));

    const subjectCatalog = buildSubjectCatalog(activityBookIds);

    const subjectTotals = new Map<string, {
      completionSum: number;
      completedChapters: number;
      timeMs: number;
      quizScores: number[];
    }>();

    Object.values(progressRecords).forEach(progress => {
      const subject = normalizeSubjectName(progress.subject || BOOK_BY_ID.get(progress.bookId)?.subject);
      const catalogEntry = subjectCatalog.get(subject);
      if (catalogEntry && !catalogEntry.bookIds.has(progress.bookId)) return;

      const totalTimeMs = Object.values(progress.timeSpent).reduce((sum, value) => sum + value, 0);
      const current = subjectTotals.get(subject) || {
        completionSum: 0,
        completedChapters: 0,
        timeMs: 0,
        quizScores: [],
      };

      current.completionSum += progress.completionPercent;
      current.timeMs += totalTimeMs;
      if (progress.completionPercent >= 80) current.completedChapters++;
      if (progress.quiz > 0) current.quizScores.push(progress.quiz);

      subjectTotals.set(subject, current);
    });

    const subjects: SubjectProgress[] = Array.from(subjectCatalog.entries()).map(([subject, meta]) => {
      const totals = subjectTotals.get(subject);
      const totalChapters = meta.totalChapters;
      const progress = totalChapters > 0
        ? Math.min(100, Math.round((totals?.completionSum || 0) / totalChapters))
        : 0;

      return {
        subject,
        progress,
        chaptersCompleted: Math.min(totals?.completedChapters || 0, totalChapters),
        totalChapters,
        color: colorForSubject(subject),
      };
    });

    const strengthMap = new Map<string, SubjectStrength>();
    strengths.forEach(entry => {
      strengthMap.set(normalizeSubjectName(entry.subject), entry);
    });

    const languageSubjects = ['English', 'Hindi', 'Gujarati']
      .map(subject => subjects.find(item => item.subject === subject))
      .filter((item): item is SubjectProgress => Boolean(item));

    const languageAverage = languageSubjects.length > 0
      ? Math.round(languageSubjects.reduce((sum, item) => sum + item.progress, 0) / languageSubjects.length)
      : 0;

    const mathsStrength = strengthMap.get('Maths');
    const overallQuizAverage = strengths.filter(entry => entry.totalQuizzes > 0).length > 0
      ? Math.round(
          strengths
            .filter(entry => entry.totalQuizzes > 0)
            .reduce((sum, entry) => sum + entry.avgQuizScore, 0) /
          strengths.filter(entry => entry.totalQuizzes > 0).length,
        )
      : 0;

    const lifetimeTotalsMs: Record<ActivityLabel, number> = {
      Lessons: 0,
      Games: 0,
      Reading: 0,
      Practice: 0,
      Creative: 0,
    };

    Object.values(progressRecords).forEach(progress => {
      const normalizedSubject = normalizeSubjectName(progress.subject);
      const totalTimeMs = Object.values(progress.timeSpent).reduce((sum, value) => sum + value, 0);

      if (normalizedSubject === 'Activities') {
        lifetimeTotalsMs.Creative += totalTimeMs;
        return;
      }

      lifetimeTotalsMs.Lessons += progress.timeSpent.learn;
      lifetimeTotalsMs.Practice += progress.timeSpent.practice + progress.timeSpent.quiz + progress.timeSpent.revision + progress.timeSpent.ai;
      lifetimeTotalsMs.Games += progress.timeSpent.play;
    });

    const exactSessions: AnalyticsSession[] = [];
    const exactBookSessionDayKeys = new Set<string>();

    readingSessions.forEach(session => {
      const timestamp = session.endedAt || session.startedAt;
      exactSessions.push({
        timestamp,
        durationMs: session.durationMs,
        label: `Reading · ${session.bookTitle}`,
        category: 'Reading',
      });
      lifetimeTotalsMs.Reading += session.durationMs;
    });

    auditLog.forEach(entry => {
      if (entry.action === 'book_activity_session') {
        const durationMs = Number(entry.details?.durationMs);
        const activity = String(entry.details?.activity || '');
        const bookId = String(entry.details?.bookId || '');
        const chapterId = String(entry.details?.chapterId || '');
        const progress = progressRecords[`${bookId}::${chapterId}`];
        const category: ActivityLabel =
          activity === 'learn' ? 'Lessons'
            : activity === 'play' ? 'Games'
            : activity === 'ai' ? 'Practice'
            : activity === 'practice' || activity === 'quiz' || activity === 'revision' ? 'Practice'
            : 'Lessons';

        const sessionMs = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : estimateRecentChapterMs(progress);
        exactSessions.push({
          timestamp: entry.timestamp,
          durationMs: sessionMs,
          label: formatBookActivityLabel(activity, progress),
          category,
        });
        lifetimeTotalsMs[category] += sessionMs;
        exactBookSessionDayKeys.add(`${bookId}::${chapterId}::${toLocalDateKey(entry.timestamp)}`);
        return;
      }

      if (entry.category === 'game' && entry.action === 'game_complete') {
        const gameName = String(entry.details?.game || entry.details?.gameId || 'Game');
        const category = categorizeGame(gameName);
        const durationMs = Number(entry.details?.durationMs);
        const sessionMs = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 5 * 60 * 1000;

        exactSessions.push({
          timestamp: entry.timestamp,
          durationMs: sessionMs,
          label: prettifyWords(gameName),
          category,
        });
        lifetimeTotalsMs[category] += sessionMs;
        return;
      }

      if (entry.category === 'ai' && AI_SESSION_ACTIONS.has(entry.action)) {
        const sessionMs = 2 * 60 * 1000;
        exactSessions.push({
          timestamp: entry.timestamp,
          durationMs: sessionMs,
          label: 'AI Study Helper',
          category: 'Practice',
        });
        lifetimeTotalsMs.Practice += sessionMs;
      }
    });

    const syntheticProgressSessions = Object.values(progressRecords)
      .filter(progress => progress.lastActivityAt)
      .filter(progress => !exactBookSessionDayKeys.has(`${progress.bookId}::${progress.chapterId}::${toLocalDateKey(progress.lastActivityAt)}`))
      .map<AnalyticsSession>(progress => ({
        timestamp: progress.lastActivityAt,
        durationMs: estimateRecentChapterMs(progress),
        label: `Recent Activity · ${progress.chapterName || normalizeSubjectName(progress.subject)}`,
        category: dominantChapterCategory(progress),
      }));

    const allSessionCandidates = [...exactSessions, ...syntheticProgressSessions].sort(
      (a, b) => a.timestamp.localeCompare(b.timestamp),
    );

    const currentWeekDates = buildCurrentWeekDates();
    const weeklyMinuteMap = new Map(currentWeekDates.map(date => [date, 0]));
    const weeklyAttendanceDays = new Set(
      stats.attendance.filter(date => date <= todayIso && currentWeekDates.includes(date)),
    );

    allSessionCandidates.forEach(session => {
      const dateKey = toLocalDateKey(session.timestamp);
      if (!dateKey || dateKey > todayIso || !weeklyMinuteMap.has(dateKey)) return;
      weeklyMinuteMap.set(dateKey, (weeklyMinuteMap.get(dateKey) || 0) + Math.round(session.durationMs / 60000));
    });

    const weeklyMinutes = currentWeekDates.map(date => weeklyMinuteMap.get(date) || 0);
    const weeklyTotalMinutes = weeklyMinutes.reduce((sum, value) => sum + value, 0);
    const weeklySessionCount = weeklyAttendanceDays.size;

    const lastAttendanceDate = [...stats.attendance].sort().slice(-1)[0];
    const lastExactOrSyntheticSession = [...allSessionCandidates].sort(
      (a, b) => b.timestamp.localeCompare(a.timestamp),
    )[0] || null;

    const lastActivityCandidates = [
      lastAttendanceDate ? `${lastAttendanceDate}T00:00:00.000Z` : null,
      stats.lastActiveDate ? `${stats.lastActiveDate}T00:00:00.000Z` : null,
      lastExactOrSyntheticSession?.timestamp || null,
      ...Object.values(progressRecords).map(progress => progress.lastActivityAt || null),
      ...auditLog.map(entry => entry.timestamp),
    ].filter((value): value is string => Boolean(value));

    const lastActivityAt = lastActivityCandidates.sort().slice(-1)[0] || `${todayIso}T00:00:00.000Z`;
    const lastActiveDate = toLocalDateKey(lastActivityAt);

    const attendanceScore = attendanceRate;
    const timeScore = Math.min(100, Math.round((weeklyTotalMinutes / 180) * 100));
    const sessionScore = Math.min(100, Math.round((weeklySessionCount / 7) * 100));
    const streakScore = Math.min(100, Math.round((streakDays / 7) * 100));
    const engagementScore = Math.round(
      attendanceScore * 0.35 +
      timeScore * 0.25 +
      sessionScore * 0.25 +
      streakScore * 0.15,
    );

    const sortedSubjects = sortByProgress(subjects.filter(subject => subject.totalChapters > 0));
    const strongestSubject = sortedSubjects[0];
    const weakestSubject = [...sortedSubjects].reverse()[0];

    const skills: SkillMetric[] = [
      {
        skill: 'Reading',
        value: Math.min(100, Math.round(languageAverage * 0.7 + Math.min(30, lifetimeTotalsMs.Reading / 60000 / 4))),
        maxValue: 100,
      },
      {
        skill: 'Writing',
        value: Math.min(100, Math.round(
          Math.min(50, lifetimeTotalsMs.Practice / 60000 / 3) +
          Math.min(50, overallQuizAverage * 0.5),
        )),
        maxValue: 100,
      },
      {
        skill: 'Logic',
        value: Math.min(100, Math.round(
          (mathsStrength?.avgQuizScore || 0) * 0.45 +
          (subjects.find(subject => subject.subject === 'Science')?.progress || 0) * 0.35 +
          Math.min(20, lifetimeTotalsMs.Games / 60000 / 4),
        )),
        maxValue: 100,
      },
      {
        skill: 'Numeracy',
        value: Math.min(100, Math.round(
          (subjects.find(subject => subject.subject === 'Maths')?.progress || 0) * 0.7 +
          (mathsStrength?.avgQuizScore || 0) * 0.3,
        )),
        maxValue: 100,
      },
      {
        skill: 'Comprehension',
        value: Math.min(100, Math.round(languageAverage * 0.55 + overallQuizAverage * 0.45)),
        maxValue: 100,
      },
      {
        skill: 'Creativity',
        value: Math.min(100, Math.round(
          (subjects.find(subject => subject.subject === 'Activities')?.progress || 0) * 0.7 +
          Math.min(30, lifetimeTotalsMs.Creative / 60000 / 2),
        )),
        maxValue: 100,
      },
    ];

    const heatmapData: HeatmapCell[] = [];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    skills.forEach((skill, skillIndex) => {
      weeklyMinutes.forEach((minutes, dayIndex) => {
        const baseIntensity = weeklyTotalMinutes > 0 ? minutes / Math.max(...weeklyMinutes, 1) : 0;
        const skillWeight = skill.value / 100;
        heatmapData.push({
          day: dayLabels[dayIndex],
          skill: skill.skill,
          intensity: Number(Math.min(1, Math.max(0, baseIntensity * (0.55 + skillWeight * 0.45))).toFixed(2)),
        });
      });
      if (skillIndex >= 5) return;
    });

    const activityDistribution: ActivityEntry[] = [
      { label: 'Lessons', minutes: Math.round(lifetimeTotalsMs.Lessons / 60000), color: colors.chart.indigo },
      { label: 'Games', minutes: Math.round(lifetimeTotalsMs.Games / 60000), color: colors.chart.blue },
      { label: 'Reading', minutes: Math.round(lifetimeTotalsMs.Reading / 60000), color: colors.chart.emerald },
      { label: 'Practice', minutes: Math.round(lifetimeTotalsMs.Practice / 60000), color: colors.chart.amber },
      { label: 'Creative', minutes: Math.round(lifetimeTotalsMs.Creative / 60000), color: colors.chart.rose },
    ];

    const hasAnyActivity =
      totalXp > 0 ||
      stats.attendance.length > 0 ||
      Object.keys(progressRecords).length > 0 ||
      readingSessions.length > 0 ||
      auditLog.length > 0;

    const alerts: Alert[] = [];
    const nowIso = now.toISOString();

    if (!hasAnyActivity) {
      alerts.push({
        id: 'no-activity',
        severity: 'info',
        title: 'No activity recorded yet',
        description: 'This dashboard now shows live student activity. It will fill in as soon as learning starts.',
        timestamp: nowIso,
        category: 'engagement',
      });
    } else {
      if (strongestSubject && strongestSubject.progress > 0) {
        alerts.push({
          id: 'strongest-subject',
          severity: 'success',
          title: `${strongestSubject.subject} is going well`,
          description: `${strongestSubject.chaptersCompleted}/${strongestSubject.totalChapters} chapters are progressing with ${strongestSubject.progress}% overall completion.`,
          timestamp: nowIso,
          category: 'achievement',
        });
      }

      if (weakestSubject && weakestSubject.progress < 50) {
        alerts.push({
          id: 'weakest-subject',
          severity: weakestSubject.progress < 25 ? 'danger' : 'warning',
          title: `${weakestSubject.subject} needs more practice`,
          description: `Current completion is ${weakestSubject.progress}%. Short, regular practice sessions will help this subject catch up.`,
          timestamp: nowIso,
          category: 'weak-area',
        });
      }

      if (attendanceRate < 75) {
        alerts.push({
          id: 'attendance-warning',
          severity: attendanceRate < 50 ? 'danger' : 'warning',
          title: 'Attendance is below target',
          description: `${monthlyActiveDays}/${monthlyTotalDays} school days are marked active this month. More regular activity will improve consistency.`,
          timestamp: nowIso,
          category: 'engagement',
        });
      } else if (streakDays >= 5) {
        alerts.push({
          id: 'streak-success',
          severity: 'success',
          title: 'Consistency is strong',
          description: `${streakDays}-day streak and ${attendanceRate}% attendance show steady learning habits.`,
          timestamp: nowIso,
          category: 'achievement',
        });
      }

      if (overallQuizAverage > 0 && overallQuizAverage < 60) {
        alerts.push({
          id: 'quiz-revision',
          severity: 'info',
          title: 'Revision would help now',
          description: `Average quiz performance is ${overallQuizAverage}%. A revision session on weaker chapters should improve confidence.`,
          timestamp: nowIso,
          category: 'revision',
        });
      }

      if (readingAI.length > 0 || auditLog.some(entry => entry.category === 'ai')) {
        alerts.push({
          id: 'ai-engagement',
          severity: 'info',
          title: 'Student is using AI support',
          description: `${readingAI.length} book-AI questions and recent AI queries show active curiosity during learning.`,
          timestamp: nowIso,
          category: 'engagement',
        });
      }
    }

    const badgeMap = new Map(ALL_BADGES.map(badge => [badge.id, badge]));
    const milestones: Milestone[] = [];
    const firstAttendanceDate = [...stats.attendance].sort()[0];
    if (firstAttendanceDate) {
      milestones.push({
        id: 'first-attendance',
        title: 'Learning Started',
        description: 'The first activity day was recorded.',
        icon: 'flag',
        date: firstAttendanceDate,
        category: 'milestone',
      });
    }

    if (xp.level > 1) {
      milestones.push({
        id: 'level-progress',
        title: `Reached Level ${xp.level}`,
        description: `${totalXp} total XP earned so far.`,
        icon: 'star',
        date: lastActiveDate,
        category: 'academic',
      });
    }

    if (streakDays >= 3) {
      milestones.push({
        id: 'streak-milestone',
        title: `${streakDays}-Day Streak`,
        description: 'Consistent daily activity is building a healthy routine.',
        icon: 'flame',
        date: lastActiveDate,
        category: 'streak',
      });
    }

    const firstCompletedChapter = Object.values(progressRecords)
      .filter(progress => progress.completionPercent >= 80)
      .sort((a, b) => a.lastActivityAt.localeCompare(b.lastActivityAt))[0];
    if (firstCompletedChapter) {
      milestones.push({
        id: 'first-completed-chapter',
        title: 'Completed a Chapter',
        description: firstCompletedChapter.chapterName,
        icon: 'book',
        date: toLocalDateKey(firstCompletedChapter.lastActivityAt),
        category: 'academic',
      });
    }

    const latestBadge = stats.badges[stats.badges.length - 1];
    if (latestBadge) {
      const badgeMeta = badgeMap.get(latestBadge.id) || latestBadge;
      milestones.push({
        id: `badge-${badgeMeta.id}`,
        title: badgeMeta.name,
        description: badgeMeta.description,
        icon: badgeMeta.icon,
        date: latestBadge.unlockedAt ? toLocalDateKey(latestBadge.unlockedAt) : lastActiveDate,
        category: 'skill',
      });
    }

    if (growth.flowerCount > 0 || growth.fruitCount > 0) {
      milestones.push({
        id: 'garden-growth',
        title: 'Garden Growth',
        description: `Garden now has ${growth.flowerCount} flowers and ${growth.fruitCount} fruits.`,
        icon: 'flower',
        date: lastActiveDate,
        category: 'milestone',
      });
    }

    milestones.sort((a, b) => b.date.localeCompare(a.date));

    const academicProgress = subjects.length > 0
      ? Math.round(subjects.reduce((sum, subject) => sum + subject.progress, 0) / subjects.length)
      : 0;
    const overallProgress = academicProgress;

    return {
      studentId: 'std-1-001',
      studentName: user.name || 'Student',
      overallProgress,
      level: xp.level,
      xp: totalXp,
      xpCurrentLevel,
      xpToNext: xp.xpToNext,
      engagementScore,
      streakDays,
      weeklyMinutes,
      subjects,
      skills,
      activityDistribution,
      heatmapData,
      alerts: alerts.slice(0, 4),
      milestones: milestones.slice(0, 6),
      attendanceRate,
      monthlyActiveDays,
      monthlyTotalDays,
      totalSessions: weeklySessionCount,
      avgSessionMinutes: weeklySessionCount > 0 ? Math.round(weeklyTotalMinutes / weeklySessionCount) : 0,
      lastActiveDate,
      lastSessionAt: lastExactOrSyntheticSession?.timestamp || null,
      lastSessionDurationMinutes: lastExactOrSyntheticSession ? Math.max(1, Math.round(lastExactOrSyntheticSession.durationMs / 60000)) : 0,
      currentActivityLabel: lastExactOrSyntheticSession?.label || 'No recent activity',
      gardenWater: tree.waterLevel || 0,
      gardenSunlight: tree.sunlightLevel || 0,
      gardenGrowth: Math.round(overallGrowth),
      gardenFlowers: growth.flowerCount || 0,
      gardenFruits: growth.fruitCount || 0,
    };
  }, [xp, tree, overallGrowth, user, growth, refreshTick]);
}
