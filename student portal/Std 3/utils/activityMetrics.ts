import type { AuditLogEntry } from '../types';

export interface ActivitySnapshot {
  activeDates: string[];
  currentWeekActivity: number[];
  currentWeekMinutes: number[];
  currentStreak: number;
  weeklySessionCount: number;
  totalSessionCount: number;
  previousWeekAvgSessionMinutes: number;
  weeklyActiveDays: number;
  monthlyActiveDays: number;
  monthlySchoolDays: number;
  attendanceRate: number;
  lastActiveDate: string;
  totalMeaningfulEvents: number;
  categoryMinutes: Record<'Games' | 'Lessons' | 'Reading' | 'Practice' | 'Creative', number>;
}

export type ActivityCategoryLabel = 'Games' | 'Lessons' | 'Reading' | 'Practice' | 'Creative';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toLocalDateKey(value: string | Date): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function subtractDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setDate(copy.getDate() - days);
  return copy;
}

function toMinuteValue(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value;
}

export function estimateEntryMinutes(entry: AuditLogEntry): number {
  const details = entry.details || {};
  const directMinutes =
    toMinuteValue(details.minutes) ||
    toMinuteValue(details.durationMinutes) ||
    toMinuteValue(details.timeMinutes);
  if (directMinutes > 0) return Math.round(directMinutes);

  const millis =
    toMinuteValue(details.durationMs) ||
    toMinuteValue(details.timeMs) ||
    toMinuteValue(details.elapsedMs);
  if (millis > 0) return Math.max(1, Math.round(millis / 60000));

  if (entry.action === 'game_complete') return 12;
  if (entry.category === 'game') return 4;
  if (entry.category === 'ai') return 6;
  if (entry.category === 'homework') return 8;
  if (
    entry.action.includes('book') ||
    entry.action.includes('read') ||
    entry.action.includes('pdf')
  ) {
    return 8;
  }
  if (entry.action.includes('space') || entry.action.includes('color')) return 5;
  return 3;
}

export function getActivityCategory(entry: AuditLogEntry): ActivityCategoryLabel {
  if (entry.category === 'game') return 'Games';
  if (entry.category === 'ai') return 'Lessons';
  if (
    entry.action.includes('book') ||
    entry.action.includes('read') ||
    entry.action.includes('pdf')
  ) {
    return 'Reading';
  }
  if (entry.category === 'homework') return 'Practice';
  return 'Creative';
}

export function isMeaningfulActivity(entry: AuditLogEntry): boolean {
  if (entry.category === 'navigation' || entry.category === 'parent') return false;
  return true;
}

export function normalizeDateList(values: string[]): string[] {
  const normalized = values
    .map(v => toLocalDateKey(v))
    .filter(Boolean);
  return [...new Set(normalized)].sort();
}

export function calculateCurrentStreak(activeDates: string[], now = new Date()): number {
  const activeSet = new Set(activeDates);
  let streak = 0;
  let cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  while (activeSet.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor = subtractDays(cursor, 1);
  }
  return streak;
}

export function buildActivitySnapshot(
  entries: AuditLogEntry[],
  now = new Date(),
): ActivitySnapshot {
  const dayMap = new Map<string, { events: number; minutes: number }>();
  const sessionsByDate = new Map<string, number>();
  const categoryMinutes: ActivitySnapshot['categoryMinutes'] = {
    Games: 0,
    Lessons: 0,
    Reading: 0,
    Practice: 0,
    Creative: 0,
  };
  let totalMeaningfulEvents = 0;
  const meaningfulEntries: AuditLogEntry[] = [];

  for (const entry of entries) {
    if (!isMeaningfulActivity(entry)) continue;
    totalMeaningfulEvents += 1;
    meaningfulEntries.push(entry);
    const dateKey = toLocalDateKey(entry.timestamp);
    const minutes = estimateEntryMinutes(entry);
    const prev = dayMap.get(dateKey) || { events: 0, minutes: 0 };
    dayMap.set(dateKey, {
      events: prev.events + 1,
      minutes: prev.minutes + minutes,
    });

    const bucket = getActivityCategory(entry);
    categoryMinutes[bucket] += minutes;
  }

  meaningfulEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const SESSION_GAP_MS = 30 * 60 * 1000;
  let totalSessionCount = 0;
  let prevTimeMs = -1;
  let prevDateKey = '';
  for (const entry of meaningfulEntries) {
    const entryTime = new Date(entry.timestamp).getTime();
    const entryDateKey = toLocalDateKey(entry.timestamp);
    const startsNewSession =
      totalSessionCount === 0 ||
      entryDateKey !== prevDateKey ||
      (entryTime - prevTimeMs) > SESSION_GAP_MS;
    if (startsNewSession) {
      totalSessionCount += 1;
      sessionsByDate.set(entryDateKey, (sessionsByDate.get(entryDateKey) || 0) + 1);
    }
    prevTimeMs = entryTime;
    prevDateKey = entryDateKey;
  }

  const activeDates = [...dayMap.keys()].sort();
  const currentStreak = calculateCurrentStreak(activeDates, now);

  const weekDates: string[] = [];
  const weekMinutes: number[] = [];
  const weekActivity: number[] = [];
  const dayOfWeek = now.getDay(); // 0 Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = subtractDays(now, mondayOffset);
  monday.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = toLocalDateKey(d);
    weekDates.push(key);
    const stats = dayMap.get(key);
    weekMinutes.push(stats?.minutes || 0);
    weekActivity.push(stats ? 1 : 0);
  }
  const weeklyActiveDays = weekActivity.filter(Boolean).length;
  const weeklySessionCount = weekDates.reduce((sum, key) => sum + (sessionsByDate.get(key) || 0), 0);

  const previousWeekDates: string[] = [];
  const previousWeekMinutes: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() - 7 + i);
    const key = toLocalDateKey(d);
    previousWeekDates.push(key);
    previousWeekMinutes.push(dayMap.get(key)?.minutes || 0);
  }
  const previousWeekSessionCount = previousWeekDates.reduce(
    (sum, key) => sum + (sessionsByDate.get(key) || 0),
    0,
  );
  const previousWeekTotalMinutes = previousWeekMinutes.reduce((sum, value) => sum + value, 0);
  const previousWeekAvgSessionMinutes = previousWeekSessionCount > 0
    ? Math.round(previousWeekTotalMinutes / previousWeekSessionCount)
    : 0;

  const year = now.getFullYear();
  const month = now.getMonth();
  const monthPrefix = `${year}-${pad2(month + 1)}`;
  const todayKey = toLocalDateKey(now);
  const monthlyActiveDays = activeDates.filter(d => d.startsWith(monthPrefix) && d <= todayKey).length;

  let monthlySchoolDays = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    if (date > now) break;
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) {
      monthlySchoolDays += 1;
    }
  }
  const attendanceRate = monthlySchoolDays > 0
    ? Math.round((monthlyActiveDays / monthlySchoolDays) * 100)
    : 0;

  const lastActiveDate = activeDates.length > 0 ? activeDates[activeDates.length - 1] : '';

  return {
    activeDates,
    currentWeekActivity: weekActivity,
    currentWeekMinutes: weekMinutes,
    currentStreak,
    weeklySessionCount,
    totalSessionCount,
    previousWeekAvgSessionMinutes,
    weeklyActiveDays,
    monthlyActiveDays,
    monthlySchoolDays,
    attendanceRate,
    lastActiveDate,
    totalMeaningfulEvents,
    categoryMinutes,
  };
}

export function computeCategoryMinutes(
  entries: AuditLogEntry[],
  monthPrefix?: string,
): Record<ActivityCategoryLabel, number> {
  const totals: Record<ActivityCategoryLabel, number> = {
    Games: 0,
    Lessons: 0,
    Reading: 0,
    Practice: 0,
    Creative: 0,
  };

  for (const entry of entries) {
    if (!isMeaningfulActivity(entry)) continue;
    if (monthPrefix && !toLocalDateKey(entry.timestamp).startsWith(monthPrefix)) continue;
    const bucket = getActivityCategory(entry);
    totals[bucket] += estimateEntryMinutes(entry);
  }
  return totals;
}
