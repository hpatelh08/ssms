import express from 'express';
import path from 'path';
import PDFDocument from 'pdfkit';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { verifyToken } from '../utils/jwt.js';
import { findTeacherByIdentifier, getTeacherAssignedStudents } from '../utils/adminTeacherAuth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const adminBackendRoot = path.join(projectRoot, 'Admin Dashboard', 'backend');
const adminDbPath = path.join(adminBackendRoot, 'database.sqlite');
const Database = require(path.join(adminBackendRoot, 'node_modules', 'better-sqlite3'));

let adminDb = null;

function getAdminDb() {
  if (!adminDb) {
    adminDb = new Database(adminDbPath, { readonly: false, fileMustExist: true });
  }
  return adminDb;
}

function getBearerToken(req) {
  const header = req.header('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function resolveTeacherFromRequest(req) {
  const token = getBearerToken(req);
  const fallbackTeacherId = String(req.header('X-Teacher-Id') || req.query?.teacherId || '').trim();
  const fallbackEmail = String(req.header('X-Teacher-Email') || '').trim();
  const fallbackName = String(req.header('X-Teacher-Name') || '').trim();
  const fallbackTeacher = fallbackTeacherId || fallbackEmail || fallbackName;

  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded?.role === 'teacher') {
        const teacher = findTeacherByIdentifier(decoded.userId);
        if (teacher) return teacher;
      }
    } catch {
      // ignore and fall back to request headers
    }
  }

  return fallbackTeacher ? findTeacherByIdentifier(fallbackTeacher) : null;
}

function authenticateTeacher(req, res, next) {
  try {
    const teacher = resolveTeacherFromRequest(req);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found.' });
    }

    req.teacher = teacher;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired teacher session.' });
  }
}

function normalizeStatus(status) {
  const normalized = String(status || '').trim().toUpperCase();
  if (normalized === 'P' || normalized === 'PRESENT') return 'P';
  if (normalized === 'A' || normalized === 'ABSENT') return 'A';
  if (normalized === 'L' || normalized === 'LEAVE') return 'L';
  return 'P';
}

function parseClassId(classId = '') {
  const match = String(classId || '').trim().match(/^admin-class-(\d+)-([A-Za-z])$/);
  if (!match) return null;
  return { std: match[1], section: match[2].toUpperCase() };
}

function resolveTeacherClass(teacher) {
  const std = String(teacher?.classTeacherStd || teacher?.assignedClass || '').trim();
  const section = String(teacher?.classTeacherDiv || teacher?.division || '').trim().toUpperCase();
  return { std, section };
}

function ensureTeacherClassMatch(teacher, classId) {
  if (!classId) return true;
  const parsed = parseClassId(classId);
  if (!parsed) return false;
  const teacherClass = resolveTeacherClass(teacher);
  return parsed.std === teacherClass.std && parsed.section === teacherClass.section;
}

function buildAttendanceDayRecords(db, std, section, date) {
  const rows = db.prepare(`
    SELECT s.student_id AS student_id, s.name AS name, a.status AS status
    FROM students s
    LEFT JOIN attendance a
      ON a.person_id = s.student_id
     AND a.person_type = 'student'
     AND a.date = ?
     AND a.class = ?
     AND UPPER(COALESCE(a.section, '')) = ?
    WHERE CAST(s.class AS INTEGER) = ?
      AND UPPER(COALESCE(s.section, '')) = ?
    ORDER BY s.name
  `).all(date, std, section, std, section);

  return rows.map((row) => ({
    student_id: String(row.student_id || '').trim(),
    student_db_id: null,
    name: String(row.name || '').trim(),
    roll: '',
    class: String(std || '').trim(),
    section: String(section || '').trim().toUpperCase(),
    status: normalizeStatus(row.status),
  }));
}

// GET /api/attendance/day?date=YYYY-MM-DD&classId=admin-class-4-A
router.get('/day', authenticateTeacher, (req, res) => {
  const date = String(req.query.date || '').trim();
  const classId = String(req.query.classId || '').trim();
  if (!date) {
    return res.status(400).json({ success: false, error: 'Date is required.' });
  }

  if (classId && !ensureTeacherClassMatch(req.teacher, classId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to access this class.' });
  }

  const parsed = classId ? parseClassId(classId) : resolveTeacherClass(req.teacher);
  const std = parsed?.std || '';
  const section = parsed?.section || '';
  if (!std || !section) {
    return res.json({ success: true, data: [], class: { standard: '', division: '' } });
  }

  const db = getAdminDb();
  const records = buildAttendanceDayRecords(db, std, section, date);

  return res.json({
    success: true,
    data: records,
    class: { standard: std, division: section },
    date,
  });
});

// GET /api/attendance/public/day?date=YYYY-MM-DD&classId=admin-class-4-A
router.get('/public/day', (req, res) => {
  const date = String(req.query.date || '').trim();
  const classId = String(req.query.classId || '').trim();
  if (!date) {
    return res.status(400).json({ success: false, error: 'Date is required.' });
  }

  const parsed = parseClassId(classId);
  if (!parsed) {
    return res.status(400).json({ success: false, error: 'Valid classId is required.' });
  }

  const db = getAdminDb();
  const records = buildAttendanceDayRecords(db, parsed.std, parsed.section, date);

  return res.json({
    success: true,
    data: records,
    class: { standard: parsed.std, division: parsed.section },
    date,
  });
});

// POST /api/attendance/bulk
router.post('/bulk', authenticateTeacher, (req, res) => {
  const { date, records, classId } = req.body || {};
  if (!date) {
    return res.status(400).json({ success: false, error: 'Date is required.' });
  }

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, error: 'Records array is required.' });
  }

  if (classId && !ensureTeacherClassMatch(req.teacher, classId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to mark attendance for this class.' });
  }

  const { std, section } = resolveTeacherClass(req.teacher);
  if (!std || !section) {
    return res.status(400).json({ success: false, error: 'No class assigned to this teacher.' });
  }

  const db = getAdminDb();
  const upsert = db.prepare(`
    INSERT INTO attendance (person_id, person_type, date, status, class, section, subject)
    VALUES (?, 'student', ?, ?, ?, ?, ?)
    ON CONFLICT(person_id, person_type, date) DO UPDATE SET
      status = excluded.status,
      class = excluded.class,
      section = excluded.section,
      subject = excluded.subject
  `);

  let updatedCount = 0;
  const checkStmt = db.prepare(`
    SELECT person_id FROM attendance
    WHERE person_id = ? AND person_type = 'student' AND date = ?
  `);

  const normalized = records.map((record) => {
    const studentId = String(
      record?.person_id || record?.student_id || record?.studentId || record?.studentCode || ''
    ).trim();
    return {
      studentId,
      status: normalizeStatus(record?.status),
    };
  }).filter((item) => item.studentId);

  db.transaction((items) => {
    for (const item of items) {
      if (checkStmt.get(item.studentId, date)) updatedCount += 1;
      upsert.run(item.studentId, date, item.status, std, section, null);
    }
  })(normalized);

  return res.json({
    success: true,
    total: normalized.length,
    updated: updatedCount,
    new: Math.max(normalized.length - updatedCount, 0),
    date,
    class: std,
    section,
  });
});

// GET /api/attendance/report/:classId/:date
router.get('/report/:classId/:date', authenticateTeacher, (req, res) => {
  const { classId, date } = req.params;
  if (!classId || !date) return res.status(400).send('Invalid request');
  if (!ensureTeacherClassMatch(req.teacher, classId)) {
    return res.status(403).send('Unauthorized');
  }

  const parsed = parseClassId(classId);
  if (!parsed) return res.status(400).send('Invalid class');

  const db = getAdminDb();
  const rows = db.prepare(`
    SELECT s.student_id AS student_id, s.name AS name, a.status AS status
    FROM students s
    LEFT JOIN attendance a
      ON a.person_id = s.student_id
     AND a.person_type = 'student'
     AND a.date = ?
     AND a.class = ?
     AND UPPER(COALESCE(a.section, '')) = ?
    WHERE CAST(s.class AS INTEGER) = ?
      AND UPPER(COALESCE(s.section, '')) = ?
    ORDER BY s.name
  `).all(date, parsed.std, parsed.section, parsed.std, parsed.section);

  if (!rows.length) return res.status(404).send('Not found');

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);
  doc.fontSize(18).text(`Attendance Report for Class ${parsed.std}-${parsed.section} on ${date}`);
  doc.moveDown();
  rows.forEach((row, i) => {
    doc.fontSize(12).text(`${i + 1}. ${row.name || 'Student'} (${row.student_id}) - ${normalizeStatus(row.status)}`);
  });
  doc.end();
});

export default router;
