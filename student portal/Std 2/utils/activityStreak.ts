export interface ActivityLogEntryLike {
  timestamp?: string;
}

function toIsoDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function fromDateToIso(value: Date): string {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
    .toISOString()
    .split('T')[0];
}

function getRelativeIso(offsetDays: number, today = new Date()): string {
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  cursor.setDate(cursor.getDate() + offsetDays);
  return fromDateToIso(cursor);
}

function buildConsecutiveAttendance(days: number, today = new Date()): string[] {
  return Array.from({ length: days }, (_, index) => getRelativeIso(index - (days - 1), today));
}

export function getUniqueActivityDates(
  attendance: string[] = [],
  auditLog: ActivityLogEntryLike[] = [],
): string[] {
  const dates = new Set<string>();

  attendance.forEach((value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      dates.add(value);
    }
  });

  auditLog.forEach((entry) => {
    if (!entry?.timestamp || typeof entry.timestamp !== 'string') return;
    const iso = toIsoDate(entry.timestamp);
    if (iso) dates.add(iso);
  });

  return Array.from(dates).sort();
}

export function calculateCurrentActivityStreak(
  attendance: string[] = [],
  auditLog: ActivityLogEntryLike[] = [],
  today = new Date(),
): number {
  const activeDates = new Set(getUniqueActivityDates(attendance, auditLog));
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayIso = cursor.toISOString().split('T')[0];

  if (!activeDates.has(todayIso)) return 0;

  let streak = 0;
  while (true) {
    const iso = cursor.toISOString().split('T')[0];
    if (!activeDates.has(iso)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getLatestActivityDate(
  attendance: string[] = [],
  auditLog: ActivityLogEntryLike[] = [],
): string {
  const dates = getUniqueActivityDates(attendance, auditLog);
  return dates.length > 0 ? dates[dates.length - 1] : '';
}

interface DemoStatsShape {
  streak?: number;
  attendance?: string[];
  badges?: unknown[];
  [key: string]: unknown;
}

export function syncAttendanceOnStudentOpen(today = new Date()): number {
  const todayIso = fromDateToIso(today);

  let rawStats: DemoStatsShape = {};
  try {
    const stored = localStorage.getItem('ssms_stats_v2');
    rawStats = stored ? JSON.parse(stored) as DemoStatsShape : {};
  } catch {
    rawStats = {};
  }

  const attendance = Array.isArray(rawStats.attendance)
    ? rawStats.attendance.filter((value): value is string => typeof value === 'string')
    : [];
  let nextAttendance = Array.from(new Set(attendance)).sort();

  if (nextAttendance.length === 0) {
    nextAttendance = buildConsecutiveAttendance(20, today);
  }

  if (!nextAttendance.includes(todayIso)) {
    nextAttendance = [...nextAttendance, todayIso].sort();
  }

  const nextStreak = calculateCurrentActivityStreak(nextAttendance, [], today);
  const nextStats: DemoStatsShape = {
    ...rawStats,
    attendance: nextAttendance,
    streak: nextStreak,
  };

  localStorage.setItem('ssms_stats_v2', JSON.stringify(nextStats));

  return nextStreak;
}
