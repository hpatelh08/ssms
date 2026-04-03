import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const projectRoot = path.resolve(__dirname, '..', '..', '..');
const adminBackendRoot = path.join(projectRoot, 'Admin Dashboard', 'backend');
const adminDbPath = path.join(adminBackendRoot, 'database.sqlite');

const { MIN_STANDARD, MAX_STANDARD, PRIMARY_STANDARD_MAX } = require(path.join(adminBackendRoot, 'config', 'standards.js'));
const Database = require(path.join(adminBackendRoot, 'node_modules', 'better-sqlite3'));

const SUBJECTS_BY_STD = {
  primary: ['English', 'Mathematics', 'EVS', 'Gujarati', 'Hindi', 'Drawing', 'PT', 'Moral Science', 'GK'],
  upper: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer', 'PT', 'Drawing']
};

const SUBJECT_MAP = {
  Mathematics: 'Mathematics',
  Science: 'Science',
  Biology: 'Science',
  Chemistry: 'Science',
  Physics: 'Science',
  English: 'English',
  Hindi: 'Hindi',
  Sanskrit: 'Sanskrit',
  Computer: 'Computer',
  Art: 'Drawing',
  PE: 'PT',
  History: 'Social Science',
  Geography: 'Social Science',
  Civics: 'Social Science',
  Music: 'GK',
  Accountancy: 'EVS',
  Economics: 'EVS',
  Commerce: 'Moral Science',
  'Business Studies': 'Moral Science',
  Psychology: 'GK'
};

const TT_SLOTS_WEEKDAY = [
  { num: 1, time: '07:00 - 07:40' },
  { num: 2, time: '07:40 - 08:20' },
  { num: 3, time: '08:20 - 09:00' },
  { num: 4, time: '09:00 - 09:40' },
  { num: 'B', time: '09:40 - 10:00', isBreak: true },
  { num: 5, time: '10:00 - 10:40' },
  { num: 6, time: '10:40 - 11:20' },
  { num: 7, time: '11:20 - 12:00' }
];

const TT_SLOTS_SATURDAY = [
  { num: 1, time: '07:00 - 07:40' },
  { num: 2, time: '07:40 - 08:20' },
  { num: 3, time: '08:20 - 09:00' },
  { num: 'B', time: '09:00 - 09:20', isBreak: true },
  { num: 4, time: '09:20 - 10:00' },
  { num: 5, time: '10:00 - 10:40' },
  { num: 6, time: '10:40 - 11:20' }
];

const TT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_TEACHER_STANDARD = 7;

let adminDb = null;

function getAdminDb() {
  if (!adminDb) {
    adminDb = new Database(adminDbPath, { readonly: true, fileMustExist: true });
  }
  return adminDb;
}

function parseStandard(value) {
  const match = String(value ?? '').match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function normalizeSection(value) {
  return String(value || 'A').trim().toUpperCase();
}

function parseStdSection(stdRaw, sectionRaw) {
  const std = parseStandard(stdRaw);
  const section = normalizeSection(sectionRaw);

  if (!Number.isInteger(std) || std < MIN_STANDARD || std > MAX_TEACHER_STANDARD) {
    return { error: `Class/standard must be between ${MIN_STANDARD} and ${MAX_TEACHER_STANDARD}.` };
  }

  if (!['A', 'B', 'C'].includes(section)) {
    return { error: 'Section must be A, B, or C.' };
  }

  return { std, section };
}

function buildTeachersBySubject(db) {
  const map = {};
  const rows = db.prepare('SELECT name, subject FROM teachers WHERE status = ? ORDER BY name').all('Active');

  for (const { name, subject } of rows) {
    const timetableSubject = SUBJECT_MAP[subject] || subject;
    if (!map[timetableSubject]) {
      map[timetableSubject] = [];
    }
    if (!map[timetableSubject].includes(name)) {
      map[timetableSubject].push(name);
    }
  }

  return map;
}

function generateTimetable(std, section, teachersBySubject) {
  const isPrimary = std <= PRIMARY_STANDARD_MAX;
  const subjectPool = isPrimary ? SUBJECTS_BY_STD.primary : SUBJECTS_BY_STD.upper;

  let seed = std * 1000 + section.charCodeAt(0);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const getTeacher = (subject) => {
    const pool = teachersBySubject[subject] || ['TBD'];
    const index = (std + section.charCodeAt(0)) % pool.length;
    return pool[index];
  };

  const schedule = {};
  TT_DAYS.forEach((day) => {
    const slots = day === 'Saturday' ? TT_SLOTS_SATURDAY : TT_SLOTS_WEEKDAY;
    const lectures = [];
    const shuffledSubjects = [...subjectPool].sort(() => rand() - 0.5);
    let subjectIndex = 0;

    slots.forEach((slot) => {
      if (slot.isBreak) {
        lectures.push({ ...slot, subject: null, teacher: null });
        return;
      }

      const subject = shuffledSubjects[subjectIndex % shuffledSubjects.length];
      subjectIndex += 1;
      lectures.push({ ...slot, subject, teacher: getTeacher(subject) });
    });

    schedule[day] = lectures;
  });

  return schedule;
}

function buildScheduleFromRows(rows) {
  const schedule = {};

  for (const day of TT_DAYS) {
    const baseSlots = (day === 'Saturday' ? TT_SLOTS_SATURDAY : TT_SLOTS_WEEKDAY)
      .map((slot) => ({ ...slot, subject: null, teacher: null }));
    schedule[day] = baseSlots;
  }

  for (const row of rows) {
    const day = String(row.day || '').trim();
    if (!TT_DAYS.includes(day) || !row.lecture_num) {
      continue;
    }

    const targetSlot = schedule[day].find((slot) => slot.num === row.lecture_num);
    if (!targetSlot) {
      continue;
    }

    targetSlot.subject = row.subject;
    targetSlot.teacher = row.teacher;
  }

  return schedule;
}

export function getAdminTimetable(stdRaw, sectionRaw) {
  const parsed = parseStdSection(stdRaw, sectionRaw);
  if (parsed.error) {
    return parsed;
  }

  const { std, section } = parsed;
  const db = getAdminDb();
  const teachersBySubject = buildTeachersBySubject(db);

  if (std > MAX_STANDARD) {
    return {
      std,
      section,
      source: 'fallback',
      note: `Admin timetable is available for classes ${MIN_STANDARD} to ${MAX_STANDARD} only. Showing generated fallback for class ${std}-${section}.`,
      schedule: generateTimetable(std, section, teachersBySubject),
      days: TT_DAYS
    };
  }

  const rows = db.prepare(`
    SELECT day, lecture, lecture_num, subject, teacher
    FROM timetable
    WHERE class = ? AND section = ?
    ORDER BY
      CASE day
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        ELSE 99
      END,
      COALESCE(lecture_num, 999),
      lecture
  `).all(std, section);

  return {
    std,
    section,
    source: rows.length ? 'uploaded' : 'generated',
    schedule: rows.length ? buildScheduleFromRows(rows) : generateTimetable(std, section, teachersBySubject),
    days: TT_DAYS
  };
}
