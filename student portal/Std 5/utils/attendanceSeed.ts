const STATS_KEY = 'ssms_stats_v2';

type BadgeLite = { id: string; name: string; icon: string; description?: string };

interface StatsSeedResult {
  streak: number;
  attendance: string[];
  badges: BadgeLite[];
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

function fromIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function normalizeAttendance(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const valid = input.filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
  return [...new Set(valid)].sort();
}

function normalizeBadges(input: unknown): BadgeLite[] {
  if (!Array.isArray(input)) return [];
  return input.filter(
    (b): b is BadgeLite =>
      typeof b === 'object' &&
      b !== null &&
      typeof (b as BadgeLite).id === 'string' &&
      typeof (b as BadgeLite).name === 'string' &&
      typeof (b as BadgeLite).icon === 'string',
  );
}

function calcStreak(attendanceDates: string[]): number {
  if (attendanceDates.length === 0) return 0;
  const presentSet = new Set(attendanceDates);
  let cursor = new Date();
  cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());

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

function buildRealisticAttendance(minDays: number, existing: string[]): string[] {
  if (existing.length >= minDays) return existing;

  const set = new Set(existing);
  const schoolDays: string[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // Collect recent school days (newest first)
  while (schoolDays.length < 70) {
    if (isSchoolDay(cursor)) schoolDays.push(toLocalIso(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }

  // Keep recent streak feel, then sprinkle realistic absences.
  for (let i = 0; i < schoolDays.length && set.size < minDays; i++) {
    const iso = schoolDays[i];
    if (set.has(iso)) continue;
    const keepRecent = i < 5;
    const occasionalAbsent = i % 6 === 0 || i % 11 === 0;
    if (keepRecent || !occasionalAbsent) set.add(iso);
  }

  // Hard fallback to ensure exact minimum.
  for (let i = 0; i < schoolDays.length && set.size < minDays; i++) {
    set.add(schoolDays[i]);
  }

  // Force current streak to at least minDays by marking latest school days present.
  const forcedChain: string[] = [];
  let streakCursor = new Date();
  streakCursor.setHours(0, 0, 0, 0);
  if (!isSchoolDay(streakCursor)) {
    streakCursor = previousSchoolDay(streakCursor);
  }
  while (forcedChain.length < minDays) {
    const iso = toLocalIso(streakCursor);
    forcedChain.push(iso);
    set.add(iso);
    streakCursor = previousSchoolDay(streakCursor);
  }

  // Keep streak exactly minDays by clearing one school day before forced chain.
  const oldestForced = forcedChain[forcedChain.length - 1];
  const boundaryDay = previousSchoolDay(fromIsoLocal(oldestForced));
  set.delete(toLocalIso(boundaryDay));

  return [...set].sort();
}

export function ensureMinimumAttendanceDays(minDays = 20): StatsSeedResult {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};

    const prevAttendance = normalizeAttendance(parsed.attendance);
    const attendance = buildRealisticAttendance(minDays, prevAttendance);
    const badges = normalizeBadges(parsed.badges);
    const streak = calcStreak(attendance);

    const prevStreak = typeof parsed.streak === 'number' ? parsed.streak : 0;
    const needsWrite = attendance.length !== prevAttendance.length || prevStreak !== streak;

    if (needsWrite) {
      const updated: Record<string, unknown> = {
        ...parsed,
        attendance,
        streak,
        badges,
      };
      localStorage.setItem(STATS_KEY, JSON.stringify(updated));
    }

    return { streak, attendance, badges };
  } catch {
    return { streak: 0, attendance: [], badges: [] };
  }
}
