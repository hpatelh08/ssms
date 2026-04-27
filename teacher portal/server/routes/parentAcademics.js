import express from 'express';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { findAdminStudentByAnyIdentifier, findAdminStudentById } from '../utils/adminClassroom.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const adminBackendRoot = path.join(projectRoot, 'Admin Dashboard', 'backend');
const adminDbPath = path.join(adminBackendRoot, 'database.sqlite');
const Database = require(path.join(adminBackendRoot, 'node_modules', 'better-sqlite3'));
const { readExamSyncFile, normalizeExamRecord } = require(path.join(projectRoot, 'shared', 'examSync.js'));
const SCHOOL_TIME_ZONE = 'Asia/Kolkata';

let adminDb = null;

function getAdminDb() {
  if (!adminDb) {
    adminDb = new Database(adminDbPath, { readonly: false, fileMustExist: true });
  }
  return adminDb;
}

function normalize(value) {
  return String(value || '').trim();
}

function normalizeUpper(value) {
  return normalize(value).toUpperCase();
}

function extractStandard(value) {
  const match = String(value || '').match(/\d+/);
  return match ? String(parseInt(match[0], 10)) : '';
}

function buildCandidateIdentifiers(studentId, aliases = '') {
  return [
    studentId,
    ...String(aliases || '').split(','),
  ]
    .map((value) => normalize(value))
    .filter(Boolean);
}

function resolveParentChildContext(studentId, accessKey, aliases = '') {
  const candidates = buildCandidateIdentifiers(studentId, aliases);
  const student =
    candidates.map((value) => findAdminStudentByAnyIdentifier(value)).find(Boolean) ||
    findAdminStudentById(studentId);

  if (!student) {
    return { error: 'Student not found.' };
  }

  const storedAccessKey = normalize(student.parentAccessKey);
  const providedAccessKey = normalize(accessKey);
  if (storedAccessKey && providedAccessKey !== storedAccessKey) {
    return { error: 'Invalid parent access key.' };
  }

  const standard = extractStandard(student.className || student.class || student.grade || '');
  const division = normalizeUpper(student.section || student.division || '');

  if (!standard || !division) {
    return { error: 'Child class information is unavailable.' };
  }

  return {
    student,
    standard,
    division,
  };
}

function isSupportedClass(value) {
  const classNo = parseInt(String(value || '').trim(), 10);
  return Number.isFinite(classNo) && classNo >= 1 && classNo <= 6;
}

function subjectListForClass(cls) {
  const classNo = parseInt(String(cls || '').trim(), 10);
  return classNo <= 5
    ? ['English', 'Mathematics', 'EVS', 'Gujarati', 'Hindi', 'Drawing', 'PT', 'Moral Science', 'GK']
    : ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer', 'PT', 'Drawing'];
}

function calcGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}

function normalizeExamStatus(status) {
  const value = normalize(status).toLowerCase();
  if (['scheduled', 'upcoming'].includes(value)) return 'upcoming';
  if (value === 'ongoing') return 'ongoing';
  if (value === 'completed') return 'completed';
  if (value === 'cancelled') return 'cancelled';
  return 'scheduled';
}

function getSchoolDateIso(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHOOL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  if (!lookup.year || !lookup.month || !lookup.day) {
    return '';
  }

  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function getExamDateIso(value) {
  return String(value || '').trim().slice(0, 10);
}

function isOnOrAfterToday(value, todayIso = getSchoolDateIso()) {
  const examDate = getExamDateIso(value);
  return Boolean(examDate) && examDate >= todayIso;
}

function mapExamRow(row) {
  return {
    id: row.id,
    name: row.name || row.examName || 'Exam',
    class: String(row.class || '').trim(),
    subject: row.subject || '',
    date: row.date || '',
    duration: row.duration || '',
    maxMarks: row.max_marks ?? row.maxMarks ?? 100,
    status: normalizeExamStatus(row.status),
  };
}

function mergeExamRows(sqlRows = [], sharedRows = []) {
  const merged = new Map();

  const push = (row, sourceTag) => {
    if (!row) return;
    const exam = mapExamRow(row);
    const key = String(exam.id || `${exam.name}|${exam.class}|${exam.subject}|${exam.date}|${sourceTag || ''}`).trim();
    if (!merged.has(key)) {
      merged.set(key, exam);
      return;
    }
    merged.set(key, { ...merged.get(key), ...exam });
  };

  sqlRows.forEach((row) => push(row, 'sql'));
  sharedRows.forEach((row) => push(normalizeExamRecord(row), 'shared'));

  return Array.from(merged.values()).sort((a, b) => {
    const dateDiff = String(a.date || '').localeCompare(String(b.date || ''));
    if (dateDiff !== 0) return dateDiff;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

function loadClassExams(classNo) {
  const db = getAdminDb();
  const sqlRows = db.prepare(`
    SELECT id, name, class, subject, date, duration, max_marks, status
    FROM exams
    WHERE CAST(class AS INTEGER) = ?
    ORDER BY date ASC, id ASC
  `).all(classNo);

  const sharedRows = readExamSyncFile().filter((exam) => {
    const parsedClass = parseInt(String(exam?.class || '').trim(), 10);
    return Number.isInteger(parsedClass) && parsedClass === classNo;
  });

  const todayIso = getSchoolDateIso();

  return mergeExamRows(sqlRows, sharedRows)
    .filter((exam) => isSupportedClass(exam.class) && isOnOrAfterToday(exam.date, todayIso))
    .map((exam) => {
      const examDate = getExamDateIso(exam.date);
      const upcoming = exam.status === 'upcoming' || exam.status === 'scheduled' || (examDate && examDate >= todayIso);
      return {
        ...exam,
        upcoming,
        isToday: examDate === todayIso,
      };
    });
}

function buildMarksGroups(rows, childCandidates, classNo) {
  const candidates = childCandidates.map((value) => normalize(value).toLowerCase()).filter(Boolean);
  const childName = candidates[0] || '';
  const subjectList = subjectListForClass(classNo);
  const groupMap = new Map();

  for (const row of rows) {
    const studentKey = normalize(row.student).toLowerCase();
    if (!studentKey) continue;

    if (candidates.length > 0 && !candidates.includes(studentKey)) {
      continue;
    }

    const key = `${studentKey}|${row.class}|${row.exam_type}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        student: row.student,
        class: row.class,
        exam_type: row.exam_type,
        roll: row.roll || '',
        section: row.section || '',
        marks: {},
      });
    }
    groupMap.get(key).marks[row.subject] = Number(row.marks) || 0;
  }

  const entries = [...groupMap.values()];
  return entries.map((entry) => {
    const maxTotal = subjectList.length * 100;
    const total = subjectList.reduce((sum, subject) => sum + (entry.marks[subject] || 0), 0);
    const percent = maxTotal > 0 ? parseFloat(((total / maxTotal) * 100).toFixed(1)) : 0;
    return {
      ...entry,
      total,
      maxTotal,
      percent,
      grade: calcGrade(percent),
      isChild: !childName || normalize(entry.student).toLowerCase() === childName,
    };
  });
}

// GET /api/parent/my-child-exams?studentId=...&accessKey=...&aliases=...
router.get('/my-child-exams', (req, res) => {
  const studentId = String(req.query.studentId || '').trim();
  const accessKey = String(req.query.accessKey || '').trim();
  const aliases = String(req.query.aliases || '').trim();
  if (!studentId || !accessKey) {
    return res.status(400).json({ success: false, error: 'Student ID and access key are required.' });
  }

  const childContext = resolveParentChildContext(studentId, accessKey, aliases);
  if (childContext.error) {
    return res.status(401).json({ success: false, error: childContext.error });
  }

  const classNo = parseInt(childContext.standard, 10);
  const mapped = loadClassExams(classNo).filter((exam) => isSupportedClass(exam.class));

  return res.json({
    success: true,
    data: mapped,
    child: {
      name: childContext.student?.name || '',
      standard: childContext.standard,
      division: childContext.division,
    },
  });
});

// GET /api/parent/my-child-marks?studentId=...&accessKey=...&aliases=...
router.get('/my-child-marks', (req, res) => {
  const studentId = String(req.query.studentId || '').trim();
  const accessKey = String(req.query.accessKey || '').trim();
  const aliases = String(req.query.aliases || '').trim();
  if (!studentId || !accessKey) {
    return res.status(400).json({ success: false, error: 'Student ID and access key are required.' });
  }

  const childContext = resolveParentChildContext(studentId, accessKey, aliases);
  if (childContext.error) {
    return res.status(401).json({ success: false, error: childContext.error });
  }

  const db = getAdminDb();
  const classNo = parseInt(childContext.standard, 10);
  const section = normalizeUpper(childContext.division);
  const childCandidates = buildCandidateIdentifiers(
    childContext.student?.name || studentId,
    aliases
  ).concat([
    childContext.student?.studentId,
    childContext.student?.grNumber,
    childContext.student?.admissionNumber,
  ]);

  const rows = db.prepare(`
    SELECT m.student, m.class, m.exam_type, m.subject, m.marks,
           COALESCE(s.gr_number,'') AS roll,
           COALESCE(s.section,'')  AS section
    FROM marks m
    LEFT JOIN students s
      ON LOWER(s.name) = LOWER(m.student)
      AND CAST(s.class AS INTEGER) = CAST(m.class AS INTEGER)
    WHERE CAST(m.class AS INTEGER) = ?
      AND UPPER(COALESCE(s.section, '')) = ?
    ORDER BY CAST(m.class AS INTEGER), COALESCE(s.section,''), m.student
  `).all(classNo, section);

  const data = buildMarksGroups(rows, childCandidates, classNo);

  return res.json({
    success: true,
    data,
    child: {
      name: childContext.student?.name || '',
      standard: childContext.standard,
      division: childContext.division,
    },
  });
});

export default router;
