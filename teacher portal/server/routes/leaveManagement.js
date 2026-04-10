import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { verifyToken } from '../utils/jwt.js';
import { findTeacherByIdentifier } from '../utils/adminTeacherAuth.js';
import { getAdminStudents } from '../utils/adminClassroom.js';

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
    adminDb = new Database(adminDbPath, { fileMustExist: true });
  }
  return adminDb;
}

const storePath = path.join(__dirname, '..', 'data', 'leaveApplications.json');
const uploadDir = path.join(__dirname, '..', 'uploads', 'leave-applications');

function ensureStore() {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, '[]', 'utf8');
  }
}

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

function readStore() {
  try {
    ensureStore();
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(records = []) {
  ensureStore();
  fs.writeFileSync(storePath, JSON.stringify(records, null, 2), 'utf8');
}

function normalize(value = '') {
  return String(value || '').trim();
}

function normalizeUpper(value = '') {
  return normalize(value).toUpperCase();
}

function normalizeLower(value = '') {
  return normalize(value).toLowerCase();
}

function collectIdentifiers(...values) {
  const flattened = [];
  const pushValue = (value) => {
    if (Array.isArray(value)) {
      value.forEach(pushValue);
      return;
    }
    String(value || '')
      .split(',')
      .map((item) => normalizeUpper(item))
      .filter(Boolean)
      .forEach((item) => flattened.push(item));
  };

  values.forEach(pushValue);
  return [...new Set(flattened)];
}

function hasIntersection(left = [], right = []) {
  const rightSet = new Set(collectIdentifiers(right));
  return collectIdentifiers(left).some((item) => rightSet.has(item));
}

function parseDate(value) {
  const date = new Date(String(value || '').trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatISODate(date) {
  return date ? new Date(date).toISOString() : '';
}

function calculateTotalDays(fromDate, toDate) {
  const start = parseDate(fromDate);
  const end = parseDate(toDate);
  if (!start || !end || end < start) return null;
  const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

function normalizeClassKey(className = '', division = '') {
  const classNumber = String(className || '').match(/\d+/);
  const section = normalizeUpper(division) || 'A';
  if (!classNumber) return '';
  return `admin-class-${parseInt(classNumber[0], 10)}-${section}`;
}

function parseClassKey(classId = '') {
  const match = String(classId || '').trim().match(/^admin-class-(\d+)-([A-Za-z])$/i);
  if (!match) return null;
  return {
    std: String(parseInt(match[1], 10)),
    section: normalizeUpper(match[2]),
  };
}

function getStudentIdentifiers(student = {}) {
  return collectIdentifiers(
    student.studentId,
    student.student_id,
    student.grNo,
    student.grNumber,
    student.gr_number,
    student.admissionNumber,
    student.admission_number,
    student.rollNumber,
    student.roll_number,
    student.parentId,
    student.parent_id,
    student.parentAccessId,
    student.id,
    student._id,
  );
}

function findStudentByIdentifiers(identifiers = []) {
  const allStudents = getAdminStudents();
  const targetIdentifiers = collectIdentifiers(identifiers);
  if (!targetIdentifiers.length) return null;

  return allStudents.find((student) => hasIntersection(targetIdentifiers, getStudentIdentifiers(student))) || null;
}

function getClassTeacherForClass(std, section) {
  const classNumber = String(std || '').trim();
  const division = normalizeUpper(section);
  if (!classNumber || !division) return null;

  const db = getAdminDb();
  const rows = db.prepare(`
    SELECT id, name, teacher_id, email, class, division, subject
    FROM teachers
    WHERE status = 'Active'
    ORDER BY id
  `).all();

  const targetClass = classNumber.toLowerCase();
  const targetCompact = `${classNumber}${division}`.toLowerCase();

  const match = rows.find((row) => {
    const rowClass = normalize(String(row.class || '')).toLowerCase().replace(/\s+/g, '');
    const rowDivision = normalizeUpper(row.division);
    const matchesClass =
      rowClass === targetClass ||
      rowClass === targetCompact ||
      rowClass === `class${targetClass}` ||
      rowClass === `class${targetCompact}` ||
      rowClass.includes(targetCompact) ||
      rowClass.includes(targetClass);
    const matchesDivision = !rowDivision || rowDivision === division || rowClass.endsWith(division.toLowerCase());
    return matchesClass && matchesDivision;
  });

  if (match?.name) {
    return {
      id: String(match.id || match.teacher_id || match.email || match.name),
      teacherId: String(match.teacher_id || match.id || match.email || match.name),
      name: normalize(match.name),
      email: normalize(match.email),
      assignedClass: classNumber,
      division,
      classTeacherOf: `${classNumber}-${division}`,
      subject: normalize(match.subject),
    };
  }

  return null;
}

function resolveTeacherSession(req) {
  const token = String(req.header('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const fallbackTeacherId = String(req.header('X-Teacher-Id') || req.query?.teacherId || '').trim();
  const fallbackEmail = String(req.header('X-Teacher-Email') || '').trim();
  const fallbackName = String(req.header('X-Teacher-Name') || '').trim();
  const fallbackClass = String(req.header('X-Teacher-Class') || '').trim();
  const fallbackDivision = normalizeUpper(req.header('X-Teacher-Division') || '');

  const finalizeTeacher = (teacher) => {
    if (!teacher) return null;
    const assignedClass = String(teacher.classTeacherStd || teacher.assignedClass || fallbackClass || '').trim();
    const division = normalizeUpper(teacher.classTeacherDiv || teacher.division || fallbackDivision || '');
    return {
      ...teacher,
      assignedClass,
      division,
      classTeacherOf: teacher.classTeacherOf || (assignedClass && division ? `${assignedClass}-${division}` : ''),
    };
  };

  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded?.role === 'teacher') {
        const teacher = findTeacherByIdentifier(decoded.userId);
        const resolved = finalizeTeacher(teacher);
        if (resolved) return resolved;
      }
    } catch {
      // Fall through to header-based resolution below.
    }
  }

  const teacher = findTeacherByIdentifier(fallbackTeacherId || fallbackEmail || fallbackName);
  return finalizeTeacher(teacher);
}

function createTeacherAuthMiddleware(req, res, next) {
  try {
    const teacher = resolveTeacherSession(req);
    if (!teacher) {
      return res.status(401).json({ success: false, error: 'Invalid or missing teacher session.' });
    }
    req.teacher = teacher;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired teacher session.' });
  }
}

function normalizeLeaveType(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  if (['sick', 'casual', 'emergency', 'other'].includes(normalized)) return normalized;
  return '';
}

function normalizeLeaveStatus(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'pending' || normalized === 'approved' || normalized === 'rejected') {
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
  return 'Pending';
}

function buildAttachmentUrl(file) {
  if (!file) return '';
  return `/uploads/leave-applications/${file.filename}`;
}

function insertLeaveNotification(record) {
  try {
    const db = getAdminDb();
    db.prepare(`
      INSERT INTO notifications (
        id, type, title, body, class, section, student_id, student_name, is_read, created_at
      ) VALUES (
        @id, @type, @title, @body, @class, @section, @student_id, @student_name, @is_read, @created_at
      )
    `).run({
      id: randomUUID(),
      type: 'leave_request',
      title: `Leave request from ${record.studentName || 'Student'}`,
      body: `${record.leaveType || 'Leave'} leave requested for ${record.className || 'class'}${record.division || ''}. ${record.reason || ''}`.trim(),
      class: record.className || '',
      section: record.division || '',
      student_id: record.studentId || '',
      student_name: record.studentName || '',
      is_read: 0,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Failed to store leave notification for teachers:', error?.message || error);
  }
}

function serializeLeaveApplication(record) {
  return {
    id: record.id,
    studentId: record.studentId,
    studentName: record.studentName,
    parentId: record.parentId,
    parentName: record.parentName,
    classId: record.classId,
    className: record.className,
    division: record.division,
    classTeacherId: record.classTeacherId,
    classTeacherName: record.classTeacherName,
    leaveType: record.leaveType,
    fromDate: record.fromDate,
    toDate: record.toDate,
    totalDays: record.totalDays,
    reason: record.reason,
    attachmentUrl: record.attachmentUrl || '',
    attachmentName: record.attachmentName || '',
    status: record.status || 'Pending',
    teacherResponseReason: record.teacherResponseReason || '',
    submittedAt: record.submittedAt,
    actionTakenAt: record.actionTakenAt || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isActive: record.isActive !== false,
  };
}

function isVisibleToParent(record, parentIdentifiers = []) {
  const targetIds = collectIdentifiers(parentIdentifiers);
  if (!targetIds.length) return false;

  return hasIntersection(targetIds, [
    record.parentId,
    record.studentId,
  ]);
}

function isAssignedToTeacher(record, teacher) {
  if (!teacher) return false;
  const teacherClassKey = normalizeClassKey(teacher.assignedClass || teacher.classTeacherStd || '', teacher.division || teacher.classTeacherDiv || '');
  const teacherIdentifiers = collectIdentifiers(
    teacher.teacherId,
    teacher.id,
    teacher.loginId,
    teacher.email,
    teacher.name
  );
  const recordIdentifiers = collectIdentifiers(
    record.classTeacherId,
    record.classTeacherName,
    record.classId,
    record.className && record.division ? normalizeClassKey(record.className, record.division) : ''
  );

  return Boolean(
    (teacherClassKey && record.classId === teacherClassKey) ||
    hasIntersection(teacherIdentifiers, recordIdentifiers)
  );
}

function ensureTeacherOwnsApplication(record, teacher) {
  if (!record || !teacher) return false;
  const teacherClassKey = normalizeClassKey(teacher.assignedClass || teacher.classTeacherStd || '', teacher.division || teacher.classTeacherDiv || '');
  const teacherIdentifiers = collectIdentifiers(
    teacher.teacherId,
    teacher.id,
    teacher.loginId,
    teacher.email,
    teacher.name
  );
  const recordIdentifiers = collectIdentifiers(
    record.classTeacherId,
    record.classTeacherName,
    record.classId,
    record.className && record.division ? normalizeClassKey(record.className, record.division) : ''
  );

  return Boolean(
    (teacherClassKey && record.classId === teacherClassKey) ||
    hasIntersection(teacherIdentifiers, recordIdentifiers)
  );
}

function getApplicationById(applicationId) {
  const records = readStore();
  return records.find((record) => String(record.id || '').trim() === String(applicationId || '').trim()) || null;
}

function updateApplication(applicationId, updater) {
  const records = readStore();
  const index = records.findIndex((record) => String(record.id || '').trim() === String(applicationId || '').trim());
  if (index === -1) return null;

  const nextRecord = updater({ ...records[index] });
  records[index] = nextRecord;
  writeStore(records);
  return nextRecord;
}

function getRequestParentIdentifiers(req, fallbackParentId = '') {
  return collectIdentifiers(
    fallbackParentId,
    req.query.parentId,
    req.query.aliases,
    req.query.parentAliases,
    req.query.studentId,
    req.body?.parentId,
    req.body?.parentAliases,
    req.body?.aliases,
  );
}

function getTeacherAssignedClassKey(teacher) {
  return normalizeClassKey(teacher?.assignedClass || teacher?.classTeacherStd || '', teacher?.division || teacher?.classTeacherDiv || '');
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      ensureUploadDir();
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const safeName = String(file.originalname || 'attachment').replace(/[^a-zA-Z0-9._-]+/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Parent submits leave for a child.
router.post('/apply', upload.single('attachment'), (req, res) => {
  try {
    const body = req.body || {};
    const studentIdentifiers = collectIdentifiers(
      body.studentId,
      body.studentIdentifiers,
      body.studentAliases,
      body.studentGrNo,
      body.studentAdmissionNumber,
    );
    const parentIdentifiers = collectIdentifiers(
      body.parentId,
      body.parentIdentifiers,
      body.parentAliases,
    );

    const leaveType = normalizeLeaveType(body.leaveType);
    const fromDate = parseDate(body.fromDate);
    const toDate = parseDate(body.toDate);
    const reason = normalize(body.reason);

    if (!studentIdentifiers.length) {
      return res.status(400).json({ success: false, error: 'Selected student not found.' });
    }
    if (!fromDate || !toDate || toDate < fromDate) {
      return res.status(400).json({ success: false, error: 'Invalid leave dates.' });
    }
    if (!reason) {
      return res.status(400).json({ success: false, error: 'Reason is required.' });
    }
    if (!leaveType) {
      return res.status(400).json({ success: false, error: 'Leave type is required.' });
    }

    const student = findStudentByIdentifiers(studentIdentifiers);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Selected student not found.' });
    }

    const childIdentifiers = getStudentIdentifiers(student);
    if (parentIdentifiers.length && !hasIntersection(parentIdentifiers, childIdentifiers)) {
      return res.status(403).json({ success: false, error: 'You are not authorized to apply leave for this student.' });
    }

    const className = normalize(student.className || student.class || student.standard || body.className || '');
    const division = normalizeUpper(student.section || student.division || body.division || 'A') || 'A';
    const classKey = normalizeClassKey(className, division);
    const classTeacher = getClassTeacherForClass(className, division);

    if (!classTeacher) {
      return res.status(404).json({ success: false, error: 'Class teacher not assigned for this class.' });
    }

    const totalDays = calculateTotalDays(fromDate, toDate);
    if (!totalDays) {
      return res.status(400).json({ success: false, error: 'Invalid leave dates.' });
    }

    const now = new Date().toISOString();
    const record = {
      id: randomUUID(),
      studentId: normalize(student.studentId || body.studentId || ''),
      studentName: normalize(student.name || body.studentName || ''),
      parentId: normalize(parentIdentifiers[0] || student.parentId || student.studentId || ''),
      parentName: normalize(body.parentName || student.parentName || student.fatherName || ''),
      classId: classKey,
      className,
      division,
      classTeacherId: normalize(classTeacher.teacherId || classTeacher.id || ''),
      classTeacherName: normalize(classTeacher.name || ''),
      leaveType,
      fromDate: formatISODate(fromDate),
      toDate: formatISODate(toDate),
      totalDays,
      reason,
      attachmentUrl: buildAttachmentUrl(req.file) || normalize(body.attachmentUrl || ''),
      attachmentName: normalize(req.file?.originalname || body.attachmentName || ''),
      status: 'Pending',
      teacherResponseReason: '',
      submittedAt: now,
      actionTakenAt: '',
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    const records = readStore();
    records.unshift(record);
    writeStore(records);
    insertLeaveNotification(record);

    return res.status(201).json({
      success: true,
      data: serializeLeaveApplication(record),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to submit leave application.' });
  }
});

// Parent leave history
router.get('/parent/:parentId', (req, res) => {
  try {
    const parentIdentifiers = getRequestParentIdentifiers(req, req.params.parentId);
    if (!parentIdentifiers.length) {
      return res.status(400).json({ success: false, error: 'Parent identifier is required.' });
    }

    const statusFilter = String(req.query.status || '').trim().toLowerCase();
    const records = readStore()
      .filter((record) => isVisibleToParent(record, parentIdentifiers))
      .filter((record) => !statusFilter || normalizeUpper(record.status) === normalizeUpper(statusFilter))
      .sort((a, b) => new Date(b.createdAt || b.submittedAt || 0) - new Date(a.createdAt || a.submittedAt || 0))
      .map(serializeLeaveApplication);

    return res.json({ success: true, data: records });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load leave applications.' });
  }
});

// Teacher leave list (only their class).
router.get('/teacher/:teacherId', createTeacherAuthMiddleware, (req, res) => {
  try {
    const teacher = req.teacher;
    const teacherClassKey = getTeacherAssignedClassKey(teacher);
    if (!teacherClassKey) {
      return res.json({ success: true, data: [] });
    }

    const statusFilter = String(req.query.status || '').trim().toLowerCase();
    const records = readStore()
      .filter((record) => ensureTeacherOwnsApplication(record, teacher))
      .filter((record) => !statusFilter || normalizeUpper(record.status) === normalizeUpper(statusFilter))
      .sort((a, b) => new Date(b.createdAt || b.submittedAt || 0) - new Date(a.createdAt || a.submittedAt || 0))
      .map(serializeLeaveApplication);

    return res.json({
      success: true,
      data: records,
      teacher: {
        teacherId: teacher.teacherId || teacher.id || '',
        name: teacher.name || '',
        assignedClass: teacher.assignedClass || teacher.classTeacherStd || '',
        division: teacher.division || teacher.classTeacherDiv || '',
        classTeacherOf: teacher.classTeacherOf || teacherClassKey,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load teacher leave requests.' });
  }
});

router.patch('/teacher/:applicationId/approve', createTeacherAuthMiddleware, (req, res) => {
  try {
    const teacher = req.teacher;
    const applicationId = req.params.applicationId;
    const existing = getApplicationById(applicationId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Leave request not found.' });
    }
    if (!ensureTeacherOwnsApplication(existing, teacher)) {
      return res.status(403).json({ success: false, error: 'You are not authorized to review this leave request.' });
    }
    if (normalizeUpper(existing.status) !== 'PENDING') {
      return res.status(409).json({ success: false, error: 'Action already taken.' });
    }

    const now = new Date().toISOString();
    const updated = updateApplication(applicationId, (record) => ({
      ...record,
      status: 'Approved',
      teacherResponseReason: normalize(req.body?.teacherResponseReason || req.body?.comment || ''),
      actionTakenAt: now,
      updatedAt: now,
      actionTakenById: normalize(teacher.teacherId || teacher.id || ''),
      actionTakenByName: normalize(teacher.name || ''),
    }));

    return res.json({ success: true, data: serializeLeaveApplication(updated) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to approve leave request.' });
  }
});

router.patch('/teacher/:applicationId/reject', createTeacherAuthMiddleware, (req, res) => {
  try {
    const teacher = req.teacher;
    const applicationId = req.params.applicationId;
    const rejectionReason = normalize(req.body?.teacherResponseReason || req.body?.rejectionReason || req.body?.reason || '');
    if (!rejectionReason) {
      return res.status(400).json({ success: false, error: 'Rejection reason is required.' });
    }

    const existing = getApplicationById(applicationId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Leave request not found.' });
    }
    if (!ensureTeacherOwnsApplication(existing, teacher)) {
      return res.status(403).json({ success: false, error: 'You are not authorized to review this leave request.' });
    }
    if (normalizeUpper(existing.status) !== 'PENDING') {
      return res.status(409).json({ success: false, error: 'Action already taken.' });
    }

    const now = new Date().toISOString();
    const updated = updateApplication(applicationId, (record) => ({
      ...record,
      status: 'Rejected',
      teacherResponseReason: rejectionReason,
      actionTakenAt: now,
      updatedAt: now,
      actionTakenById: normalize(teacher.teacherId || teacher.id || ''),
      actionTakenByName: normalize(teacher.name || ''),
    }));

    return res.json({ success: true, data: serializeLeaveApplication(updated) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to reject leave request.' });
  }
});

// Compatibility helpers for older screens.
router.get('/balance', (_req, res) => {
  const records = readStore();
  const balance = records.filter((record) => normalizeUpper(record.status) === 'PENDING').length;
  res.json({ balance });
});

router.get('/status', (_req, res) => {
  const records = readStore();
  const pending = records.filter((record) => normalizeUpper(record.status) === 'PENDING').length;
  const approved = records.filter((record) => normalizeUpper(record.status) === 'APPROVED').length;
  const rejected = records.filter((record) => normalizeUpper(record.status) === 'REJECTED').length;
  res.json({ status: 'Pending', counts: { pending, approved, rejected } });
});

router.get('/', (_req, res) => {
  const records = readStore()
    .sort((a, b) => new Date(b.createdAt || b.submittedAt || 0) - new Date(a.createdAt || a.submittedAt || 0))
    .map(serializeLeaveApplication);
  res.json({ success: true, data: records });
});

router.get('/:applicationId', (req, res) => {
  try {
    const existing = getApplicationById(req.params.applicationId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Leave request not found.' });
    }

    const parentIdentifiers = getRequestParentIdentifiers(req);
    if (parentIdentifiers.length && isVisibleToParent(existing, parentIdentifiers)) {
      return res.json({ success: true, data: serializeLeaveApplication(existing) });
    }

    const teacher = (() => {
      try {
        return resolveTeacherSession(req);
      } catch {
        return null;
      }
    })();
    if (teacher && ensureTeacherOwnsApplication(existing, teacher)) {
      return res.json({ success: true, data: serializeLeaveApplication(existing) });
    }

    return res.status(403).json({ success: false, error: 'You are not authorized to view this leave request.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load leave request.' });
  }
});

export default router;
