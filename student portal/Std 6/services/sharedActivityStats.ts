import type { AuditLogEntry, Badge, HomeworkItem, UserStats } from '../types';
import type { ChapterProgress } from './progressTracker';
import type { AIInteraction, QuizResult, ReadingSession } from './readingInsights';
import { ALL_BADGES } from '../utils/badgeEngine';

const STORAGE_KEYS = {
  stats: 'ssms_stats_v2',
  progress: 'ssms_chapter_progress',
  audit: 'ssms_audit_log',
  readingSessions: 'ssms_reading_sessions',
  readingQuizzes: 'ssms_reading_quizzes',
  readingAI: 'ssms_reading_ai',
  homework: 'ssms_homework',
  xp: 'child_xp_state',
  weekActivity: 'ssms_week_activity',
  weeklyActivity: 'ssms_weekly_activity',
} as const;

const EMPTY_WEEK_ACTIVITY = [0, 0, 0, 0, 0, 0, 0];

interface XPStateSnapshot {
  level?: number;
  xp?: number;
}

interface SharedStatsStore extends Partial<UserStats> {
  badges?: Badge[];
  attendance?: string[];
  streak?: number;
  lastActiveDate?: string;
}

export interface SharedActivityStats {
  streak: number;
  attendance: string[];
  badges: Badge[];
  lastActiveDate?: string;
  weekActivity: number[];
  weeklyActiveDays: number;
  weeklyStreak: number;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function persistJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function toLocalDateKey(input: string | number | Date): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
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

function hasMeaningfulProgress(progress: ChapterProgress): boolean {
  const totalTimeMs = Object.values(progress.timeSpent).reduce((sum, value) => sum + value, 0);
  return progress.completionPercent > 0 || totalTimeMs > 0 || progress.aiQuestions > 0;
}

function isMeaningfulAuditEntry(entry: AuditLogEntry): boolean {
  if (entry.category === 'navigation' || entry.category === 'parent' || entry.category === 'attendance') {
    return false;
  }
  return true;
}

function buildWeekDates(referenceDate: Date = new Date()): string[] {
  const baseDate = new Date(referenceDate);
  const dow = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((dow === 0 ? 7 : dow) - 1));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return toLocalDateKey(date);
  });
}

function computeWeeklyStreak(weekDates: string[], activeDates: Set<string>, referenceDate: Date): number {
  const referenceIso = toLocalDateKey(referenceDate);
  const referenceIndex = weekDates.indexOf(referenceIso);
  if (referenceIndex < 0 || !activeDates.has(referenceIso)) return 0;

  let streak = 0;
  for (let index = referenceIndex; index >= 0; index--) {
    if (!activeDates.has(weekDates[index])) break;
    streak++;
  }

  return streak;
}

function computeCurrentStreak(activeDates: Set<string>, referenceDate: Date = new Date()): number {
  const current = new Date(referenceDate);
  current.setHours(0, 0, 0, 0);

  if (!activeDates.has(toLocalDateKey(current))) {
    current.setDate(current.getDate() - 1);
  }

  let streak = 0;
  let cursor = new Date(current);
  while (activeDates.has(toLocalDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildBadges(
  existingBadges: Badge[],
  metrics: {
    xp: number;
    streak: number;
    attendanceDays: number;
    homeworkDone: number;
    gamesPlayed: number;
    hasActivity: boolean;
  },
  fallbackUnlockAt?: string,
): Badge[] {
  const existingById = new Map(existingBadges.map(badge => [badge.id, badge]));

  const earned = ALL_BADGES.filter(badge => {
    if (!badge.condition) return false;

    switch (badge.condition.type) {
      case 'xp':
        return metrics.hasActivity && metrics.xp >= badge.condition.threshold;
      case 'streak':
        return metrics.streak >= badge.condition.threshold;
      case 'homework':
        return metrics.homeworkDone >= badge.condition.threshold;
      case 'attendance':
        return metrics.attendanceDays >= badge.condition.threshold;
      case 'games':
        return metrics.gamesPlayed >= badge.condition.threshold;
      default:
        return false;
    }
  }).map(badge => {
    const existing = existingById.get(badge.id);
    return {
      ...badge,
      unlockedAt: existing?.unlockedAt || fallbackUnlockAt || new Date().toISOString(),
    };
  });

  const earnedIds = new Set(earned.map(badge => badge.id));
  const preservedCustom = existingBadges.filter(badge => !earnedIds.has(badge.id));

  return [...earned, ...preservedCustom];
}

export function syncSharedActivityStats(): SharedActivityStats {
  const existingStats = loadJson<SharedStatsStore>(STORAGE_KEYS.stats, {});
  const progressRecords = loadJson<Record<string, ChapterProgress>>(STORAGE_KEYS.progress, {});
  const auditLog = loadJson<AuditLogEntry[]>(STORAGE_KEYS.audit, []);
  const readingSessions = loadJson<ReadingSession[]>(STORAGE_KEYS.readingSessions, []);
  const readingQuizzes = loadJson<QuizResult[]>(STORAGE_KEYS.readingQuizzes, []);
  const readingAI = loadJson<AIInteraction[]>(STORAGE_KEYS.readingAI, []);
  const homework = loadJson<HomeworkItem[]>(STORAGE_KEYS.homework, []);
  const xpState = loadJson<XPStateSnapshot>(STORAGE_KEYS.xp, {});

  const activeDates = new Set<string>();
  const todayKey = toLocalDateKey(new Date());

  const addActiveDate = (value?: string | number | Date) => {
    if (!value) return;
    const dateKey = toLocalDateKey(value);
    if (!dateKey || dateKey > todayKey) return;
    activeDates.add(dateKey);
  };

  auditLog.forEach(entry => {
    if (!isMeaningfulAuditEntry(entry)) return;
    addActiveDate(entry.timestamp);
  });

  Object.values(progressRecords).forEach(progress => {
    if (!progress.lastActivityAt || !hasMeaningfulProgress(progress)) return;
    addActiveDate(progress.lastActivityAt);
  });

  readingSessions.forEach(session => {
    addActiveDate(session.endedAt || session.startedAt);
  });

  readingQuizzes.forEach(quiz => {
    addActiveDate(quiz.completedAt);
  });

  readingAI.forEach(interaction => {
    addActiveDate(interaction.timestamp);
  });

  const effectiveReferenceDate = new Date();
  const attendance = [...activeDates].sort();
  const activeDateSet = new Set(attendance);
  const streak = computeCurrentStreak(activeDateSet, effectiveReferenceDate);
  const weekDates = buildWeekDates(effectiveReferenceDate);
  const weekActivity = weekDates.map(date => (activeDateSet.has(date) ? 1 : 0));
  const weeklyActiveDays = weekActivity.filter(Boolean).length;
  const weeklyStreak = computeWeeklyStreak(weekDates, activeDateSet, effectiveReferenceDate);
  const lastActiveDate = attendance[attendance.length - 1];

  const level = typeof xpState.level === 'number' ? xpState.level : 1;
  const xpInCurrentLevel = typeof xpState.xp === 'number' ? xpState.xp : 0;
  const totalXp = totalEarnedXp(level, xpInCurrentLevel);
  const gamesPlayed = auditLog.filter(entry => entry.category === 'game').length;
  const homeworkDone = homework.filter(item => item.isDone).length;
  const badges = buildBadges(
    Array.isArray(existingStats.badges) ? existingStats.badges : [],
    {
      xp: totalXp,
      streak,
      attendanceDays: attendance.length,
      homeworkDone,
      gamesPlayed,
      hasActivity: attendance.length > 0 || totalXp > 0,
    },
    lastActiveDate ? `${lastActiveDate}T00:00:00.000Z` : undefined,
  );

  const nextStats: SharedStatsStore = {
    ...existingStats,
    xp: totalXp,
    level,
    streak,
    badges,
    attendance,
    lastActiveDate,
    skills: existingStats.skills || {
      reading: 'Developing',
      writing: 'Developing',
      participation: 'Developing',
    },
  };

  persistJson(STORAGE_KEYS.stats, nextStats);
  persistJson(STORAGE_KEYS.weekActivity, weekActivity);
  persistJson(STORAGE_KEYS.weeklyActivity, weeklyActiveDays);

  return {
    streak,
    attendance,
    badges,
    lastActiveDate,
    weekActivity: weekActivity.length === 7 ? weekActivity : EMPTY_WEEK_ACTIVITY,
    weeklyActiveDays,
    weeklyStreak,
  };
}
