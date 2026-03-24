/**
 * 📅 Monthly Attendance Generator
 * =================================
 * Generates a full month of realistic attendance (90% present, 10% absent).
 * Uses a seeded PRNG (Mulberry32) for deterministic results per month.
 * Cached in localStorage by month key.
 */

// ─── Seeded PRNG (Mulberry32) ────────────────────────────

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function monthSeed(year: number, month: number): number {
  return year * 100 + month + 42;
}

// ─── Generate Month Attendance ───────────────────────────

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function generateMonthAttendance(year: number, month: number): string[] {
  const rng = mulberry32(monthSeed(year, month));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: string[] = [];
  let consecutiveAbsent = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);

    // Skip weekends
    if (isWeekend(d)) continue;

    // Don't mark future dates
    if (d > today) break;

    const dateStr = d.toISOString().split('T')[0];

    // Day 1 always present, today always present
    if (day === 1 || dateStr === today.toISOString().split('T')[0]) {
      dates.push(dateStr);
      consecutiveAbsent = 0;
      continue;
    }

    // No more than 2 consecutive absences
    if (consecutiveAbsent >= 2) {
      dates.push(dateStr);
      consecutiveAbsent = 0;
      continue;
    }

    // 90% present rate
    if (rng() < 0.90) {
      dates.push(dateStr);
      consecutiveAbsent = 0;
    } else {
      consecutiveAbsent++;
    }
  }

  return dates;
}

// ─── Get or Generate Monthly Attendance (cached) ─────────

const STORAGE_PREFIX = 'ssms_attendance_';

export function getOrGenerateMonthlyAttendance(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const key = `${STORAGE_PREFIX}${year}_${month}`;

  // Check cache
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached) as string[];
      // Re-generate if today is not included (new day since last cache)
      const today = now.toISOString().split('T')[0];
      if (parsed.includes(today) || isWeekend(now)) {
        return parsed;
      }
    }
  } catch { /* corrupt cache, regenerate */ }

  // Generate and cache
  const dates = generateMonthAttendance(year, month);

  // Also include last 7 days from previous month for streak continuity
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDates = generateMonthAttendance(prevYear, prevMonth);
  const last7Prev = prevDates.slice(-7);

  const merged = [...last7Prev, ...dates];

  try {
    localStorage.setItem(key, JSON.stringify(merged));
  } catch { /* quota exceeded */ }

  return merged;
}

// ─── Compute Attendance Metrics ──────────────────────────

export interface AttendanceMetrics {
  totalSchoolDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
  thisMonthDates: string[];
}

export function computeAttendanceMetrics(attendance: string[]): AttendanceMetrics {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.toISOString().split('T')[0];

  // Count school days (weekdays) up to today in current month
  let totalSchoolDays = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    if (d > now) break;
    if (!isWeekend(d)) totalSchoolDays++;
  }

  // Filter attendance to current month only
  const thisMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const thisMonthDates = attendance.filter(d => d.startsWith(thisMonthPrefix) && d <= today);
  const presentDays = thisMonthDates.length;
  const absentDays = Math.max(0, totalSchoolDays - presentDays);
  const attendancePercentage = totalSchoolDays > 0
    ? Math.round((presentDays / totalSchoolDays) * 100)
    : 100;

  return {
    totalSchoolDays,
    presentDays,
    absentDays,
    attendancePercentage,
    thisMonthDates,
  };
}
