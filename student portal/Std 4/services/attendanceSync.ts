import { getTeacherPortalJson } from './teacherPortal';
import { calculateStreak } from '../utils/streakEngine';

export type CalendarStatus = 'present' | 'absent' | 'holiday' | 'future' | 'empty';

type AttendanceRecord = {
  student_id?: string;
  studentId?: string;
  studentCode?: string;
  person_id?: string;
  name?: string;
  status?: string;
};

type AttendanceFetchResult = {
  byDate: Record<string, 'present' | 'absent'>;
  presentDates: string[];
};

function normalize(value: unknown): string {
  return String(value || '').trim().toUpperCase();
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(normalize).filter(Boolean))];
}

function pickPrimaryChild(profile: any): any {
  const children = Array.isArray(profile?.children) ? profile.children : [];
  return children.find(Boolean) || null;
}

export function buildAttendanceClassId(profile: any, grade = 4): string {
  const primaryChild = pickPrimaryChild(profile);
  const gradeValue = Number(
    profile?.grade ||
    primaryChild?.grade ||
    primaryChild?.class ||
    grade ||
    4,
  ) || 4;
  const division = String(
    profile?.division ||
    profile?.section ||
    primaryChild?.division ||
    primaryChild?.section ||
    'A',
  ).trim().toUpperCase() || 'A';
  return `admin-class-${gradeValue}-${division}`;
}

export function buildAttendanceCandidates(profile: any, user?: { name?: string; username?: string }): string[] {
  const children = Array.isArray(profile?.children) ? profile.children : [];
  const values = [
    profile?.studentId,
    profile?.student_id,
    profile?.grNo,
    profile?.grNumber,
    profile?.admissionNumber,
    profile?.admission_number,
    profile?.rollNumber,
    profile?.roll_number,
    profile?.name,
    profile?.studentName,
    user?.name,
    user?.username,
    ...children.flatMap((child: any) => [
      child?.studentId,
      child?.student_id,
      child?.grNo,
      child?.grNumber,
      child?.admissionNumber,
      child?.rollNumber,
      child?.name,
      child?.studentName,
    ]),
  ];
  return unique(values.map((value) => normalize(value)));
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}

function buildDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function pickStudentRecord(records: AttendanceRecord[], candidates: string[]): AttendanceRecord | null {
  if (!Array.isArray(records) || records.length === 0) return null;

  const recordKeys = (record: AttendanceRecord): string[] => unique([
    record.student_id,
    record.studentId,
    record.studentCode,
    record.person_id,
    record.name,
  ]);

  for (const record of records) {
    const keys = recordKeys(record);
    if (keys.some((key) => candidates.includes(key))) return record;
  }

  if (candidates.length === 1 && records.length === 1) {
    return records[0];
  }

  return null;
}

export async function fetchTeacherAttendanceMonth(
  year: number,
  month: number,
  classId: string,
  candidates: string[],
): Promise<AttendanceFetchResult> {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const limitDay = isCurrentMonth ? now.getDate() : getDaysInMonth(year, month);
  const dateKeys = Array.from({ length: limitDay }, (_, idx) => buildDateKey(year, month, idx + 1));

  const pairs = await Promise.all(dateKeys.map(async (dateKey) => {
    try {
      const response = await getTeacherPortalJson(`/api/attendance/public/day?date=${encodeURIComponent(dateKey)}&classId=${encodeURIComponent(classId)}`);
      const records = Array.isArray(response?.data) ? response.data as AttendanceRecord[] : [];
      const student = pickStudentRecord(records, candidates);
      const status = normalize(student?.status);
      if (status === 'P' || status === 'PRESENT') return [dateKey, 'present'] as const;
      if (status === 'A' || status === 'ABSENT') return [dateKey, 'absent'] as const;
      return null;
    } catch {
      return null;
    }
  }));

  const byDate: Record<string, 'present' | 'absent'> = {};
  const presentDates: string[] = [];

  for (const pair of pairs) {
    if (!pair) continue;
    const [dateKey, status] = pair;
    byDate[dateKey] = status;
    if (status === 'present') presentDates.push(dateKey);
  }

  return { byDate, presentDates };
}

export function syncAttendanceToStorage(presentDates: string[], year: number, month: number): string[] {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  try {
    const raw = localStorage.getItem('ssms_stats_v2');
    const parsed = raw ? JSON.parse(raw) : {};
    const existing = Array.isArray(parsed.attendance) ? parsed.attendance : [];
    const filtered = existing.filter((date: string) => !String(date).startsWith(monthPrefix));
    const nextAttendance = unique([...filtered, ...presentDates]);
    const streak = calculateStreak(nextAttendance);

    localStorage.setItem('ssms_stats_v2', JSON.stringify({
      ...parsed,
      attendance: nextAttendance,
      streak,
    }));

    return nextAttendance;
  } catch {
    return presentDates;
  }
}

export function isWeekendDay(year: number, month: number, day: number): boolean {
  return isWeekend(year, month, day);
}

export function buildDateKeyForAttendance(year: number, month: number, day: number): string {
  return buildDateKey(year, month, day);
}
