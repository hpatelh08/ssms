// GardenEngine.ts — Utility module for the magical Attendance Garden
// Handles attendance data generation, growth stage calculations, streak logic, and animation helpers.

// ─── Types ────────────────────────────────────────────────────
export type GrowthLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface DayInfo {
  date: string;        // ISO string YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number;   // 0=Sun … 6=Sat
  dayLabel: string;    // 'Mon', 'Tue', etc.
  isPresent: boolean;
  isToday: boolean;
  growthLevel: GrowthLevel;
  consecutiveDays: number;
  isMilestone: boolean; // marks 5th, 7th, 14th streak day
}

export interface GardenState {
  days: DayInfo[];
  currentStreak: number;
  longestStreak: number;
  totalPresent: number;
  totalDays: number;
  attendanceRate: number; // 0–100
  milestoneReached: 'none' | 'flower' | 'tree' | 'rainbow';
  selectedDay: DayInfo | null;
  isWatering: boolean;
  calendarOpen: boolean;
  calendarMonth: Date;
}

export type GardenAction =
  | { type: 'SELECT_DAY'; day: DayInfo | null }
  | { type: 'TOGGLE_CALENDAR' }
  | { type: 'SET_CALENDAR_MONTH'; month: Date }
  | { type: 'START_WATERING' }
  | { type: 'STOP_WATERING' }
  | { type: 'RESET' };

// ─── Constants ────────────────────────────────────────────────
export const GROWTH_STAGES: Record<GrowthLevel, { emoji: string; label: string; color: string }> = {
  0: { emoji: '🟫', label: 'Soil', color: '#8B6914' },
  1: { emoji: '🌱', label: 'Seed', color: '#84CC16' },
  2: { emoji: '🌿', label: 'Sprout', color: '#22C55E' },
  3: { emoji: '🌸', label: 'Flower', color: '#EC4899' },
  4: { emoji: '🌺', label: 'Bloom', color: '#F43F5E' },
  5: { emoji: '🌳', label: 'Tree', color: '#059669' },
};

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LABELS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─── Attendance Generator ─────────────────────────────────────
// Generates realistic random attendance for Feb 1–18, 2025
// 2–3 random absences, realistic streaks
export function generateFebruaryAttendance(): string[] {
  const dates: string[] = [];
  const absenceCount = Math.random() < 0.5 ? 2 : 3;

  // Pick random absence indices (1-indexed days)
  const absenceDays = new Set<number>();
  while (absenceDays.size < absenceCount) {
    // Don't make day 1 absent (first day) or consecutive absences to keep streaks realistic
    const day = Math.floor(Math.random() * 18) + 1;
    if (day === 1) continue;
    // Avoid consecutive absences for realism
    if (absenceDays.has(day - 1) || absenceDays.has(day + 1)) continue;
    absenceDays.add(day);
  }

  for (let d = 1; d <= 18; d++) {
    if (!absenceDays.has(d)) {
      const dateStr = `2025-02-${String(d).padStart(2, '0')}`;
      dates.push(dateStr);
    }
  }

  return dates;
}

// ─── Growth Calculations ──────────────────────────────────────
export function calculateGrowthLevel(consecutiveDays: number): GrowthLevel {
  if (consecutiveDays <= 0) return 0;
  if (consecutiveDays === 1) return 1;
  if (consecutiveDays === 2) return 2;
  if (consecutiveDays <= 4) return 3;
  if (consecutiveDays <= 6) return 4;
  return 5;
}

export function getConsecutiveDaysUpTo(date: string, attendance: string[]): number {
  const dateSet = new Set(attendance);
  if (!dateSet.has(date)) return 0;

  let count = 1;
  const d = new Date(date);
  for (let i = 1; i <= 30; i++) {
    const prev = new Date(d);
    prev.setDate(d.getDate() - i);
    const prevStr = prev.toISOString().split('T')[0];
    if (dateSet.has(prevStr)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export function calculateLongestStreak(attendance: string[]): number {
  if (attendance.length === 0) return 0;
  const sorted = [...new Set(attendance)].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return Math.max(longest, current);
}

// ─── Day Info Builder ─────────────────────────────────────────
export function buildDayInfoArray(
  startDate: Date,
  endDate: Date,
  attendance: string[],
  streak: number
): DayInfo[] {
  const today = new Date().toISOString().split('T')[0];
  const days: DayInfo[] = [];
  const d = new Date(startDate);

  while (d <= endDate) {
    const dateStr = d.toISOString().split('T')[0];
    const isPresent = attendance.includes(dateStr);
    const consecutiveDays = isPresent ? getConsecutiveDaysUpTo(dateStr, attendance) : 0;
    const growthLevel = calculateGrowthLevel(consecutiveDays);

    days.push({
      date: dateStr,
      dayOfMonth: d.getDate(),
      dayOfWeek: d.getDay(),
      dayLabel: DAY_LABELS[d.getDay()],
      isPresent,
      isToday: dateStr === today,
      growthLevel,
      consecutiveDays,
      isMilestone: consecutiveDays === 5 || consecutiveDays === 7 || consecutiveDays === 14,
    });

    d.setDate(d.getDate() + 1);
  }

  return days;
}

// Get current week (Mon–Sun)
export function getCurrentWeekDays(attendance: string[], streak: number): DayInfo[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return buildDayInfoArray(monday, sunday, attendance, streak);
}

// Get Feb 1–18 days
export function getFebruaryDays(attendance: string[], streak: number): DayInfo[] {
  const start = new Date(2025, 1, 1); // Feb 1
  const end = new Date(2025, 1, 18);  // Feb 18
  return buildDayInfoArray(start, end, attendance, streak);
}

// ─── Milestone Logic ──────────────────────────────────────────
export function getMilestoneReached(streak: number): 'none' | 'flower' | 'tree' | 'rainbow' {
  if (streak >= 14) return 'rainbow';
  if (streak >= 7) return 'tree';
  if (streak >= 5) return 'flower';
  return 'none';
}

export const MILESTONE_INFO = {
  none: { label: 'Keep going!', emoji: '🌱', color: 'from-green-400 to-emerald-500' },
  flower: { label: 'Flower Burst!', emoji: '🌸', color: 'from-pink-400 to-rose-500' },
  tree: { label: 'Tree Grown!', emoji: '🌳', color: 'from-emerald-400 to-green-600' },
  rainbow: { label: 'Rainbow Magic!', emoji: '🌈', color: 'from-emerald-400 via-pink-400 to-yellow-400' },
};

// ─── Reducer ──────────────────────────────────────────────────
export function gardenReducer(state: GardenState, action: GardenAction): GardenState {
  switch (action.type) {
    case 'SELECT_DAY':
      return { ...state, selectedDay: action.day };
    case 'TOGGLE_CALENDAR':
      return { ...state, calendarOpen: !state.calendarOpen, selectedDay: null };
    case 'SET_CALENDAR_MONTH':
      return { ...state, calendarMonth: action.month };
    case 'START_WATERING':
      return { ...state, isWatering: true };
    case 'STOP_WATERING':
      return { ...state, isWatering: false };
    case 'RESET':
      return { ...state, selectedDay: null, isWatering: false, calendarOpen: false };
    default:
      return state;
  }
}

export function createInitialGardenState(attendance: string[], streak: number): GardenState {
  const days = getFebruaryDays(attendance, streak);
  const totalPresent = days.filter(d => d.isPresent).length;
  const totalDays = days.length;

  return {
    days,
    currentStreak: streak,
    longestStreak: calculateLongestStreak(attendance),
    totalPresent,
    totalDays,
    attendanceRate: totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0,
    milestoneReached: getMilestoneReached(streak),
    selectedDay: null,
    isWatering: false,
    calendarOpen: false,
    calendarMonth: new Date(2025, 1, 1),
  };
}

// ─── Animation Helpers ────────────────────────────────────────
export function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Cloud shape variants for animations
export const CLOUD_SHAPES = [
  'M0,20 Q10,5 25,10 Q35,0 50,10 Q60,5 70,15 Q75,25 60,25 Q50,30 35,25 Q15,30 5,25 Z',
  'M0,15 Q8,0 20,8 Q30,-2 45,8 Q55,2 65,12 Q70,22 55,22 Q45,28 30,22 Q12,26 3,20 Z',
  'M0,18 Q12,3 28,10 Q40,0 55,8 Q62,3 72,14 Q78,24 62,26 Q48,32 32,24 Q14,28 3,22 Z',
];

// Butterfly path generator
export function generateButterflyPath() {
  const points = [];
  for (let i = 0; i <= 6; i++) {
    points.push({
      x: getRandomFloat(-50, 50),
      y: getRandomFloat(-30, 30),
    });
  }
  return points;
}

// Sparkle positions generator
export function generateSparklePositions(count: number) {
  return Array.from({ length: count }, () => ({
    x: getRandomFloat(5, 95),
    y: getRandomFloat(5, 95),
    delay: getRandomFloat(0, 3),
    duration: getRandomFloat(1.5, 3),
    size: getRandomFloat(3, 8),
  }));
}

// Petal animation data
export function generatePetalData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: getRandomFloat(0, 100),
    startY: getRandomFloat(-10, -5),
    endX: getRandomFloat(-20, 120),
    endY: getRandomFloat(100, 120),
    rotation: getRandomFloat(0, 720),
    duration: getRandomFloat(4, 8),
    delay: getRandomFloat(0, 5),
    color: ['#FFB7C5', '#FFDAB9', '#DDA0DD', '#FFE4B5', '#B0E0E6'][getRandomInt(0, 4)],
  }));
}
