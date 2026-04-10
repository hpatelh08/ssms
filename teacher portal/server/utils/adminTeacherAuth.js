import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { generateToken } from './jwt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const projectRoot = path.resolve(__dirname, '..', '..', '..');
const adminBackendRoot = path.join(projectRoot, 'Admin Dashboard', 'backend');
const adminDbPath = path.join(adminBackendRoot, 'database.sqlite');
const studentMasterFilePath = path.join(adminBackendRoot, 'student_master_data.json');
const Database = require(path.join(adminBackendRoot, 'node_modules', 'better-sqlite3'));

let adminDb = null;

function getAdminDb() {
  if (!adminDb) {
    adminDb = new Database(adminDbPath, { readonly: true, fileMustExist: true });
  }
  return adminDb;
}

function normalize(value) {
  return String(value || '').trim();
}

function normalizeLower(value) {
  return normalize(value).toLowerCase();
}

function normalizeDivision(value) {
  return normalize(value).toUpperCase();
}

function parseTeacherClass(rawClass, rawDivision = '') {
  const classText = normalize(rawClass);
  const division = normalizeDivision(rawDivision);
  const classMatch = classText.match(/(\d+)\s*[- ]?\s*([A-Za-z])?$/);

  if (!classMatch) {
    return {
      assignedClass: classText,
      division: division || ''
    };
  }

  const std = normalize(classMatch[1]);
  const classDivision = normalizeDivision(classMatch[2]);

  return {
    assignedClass: std,
    division: division || classDivision || '',
  };
}

function isBcryptHash(value) {
  return /^\$2[aby]\$/.test(String(value || ''));
}

function comparePassword(storedPassword, providedPassword) {
  const stored = normalize(storedPassword);
  const provided = normalize(providedPassword);

  if (!stored || !provided) return false;
  if (isBcryptHash(stored)) {
    try {
      return bcrypt.compareSync(provided, stored);
    } catch {
      return false;
    }
  }

  return stored === provided;
}

function getAssignedClasses(db, teacherName) {
  if (!teacherName) return [];

  const rows = db.prepare(`
    SELECT DISTINCT class, section
    FROM timetable
    WHERE LOWER(teacher) = LOWER(?)
    ORDER BY CAST(class AS INTEGER), UPPER(section)
  `).all(teacherName);

  return rows
    .map((row) => {
      const className = normalize(row.class);
      const section = normalizeDivision(row.section);
      return className && section ? `${className}-${section}` : '';
    })
    .filter(Boolean);
}

function getAssignedSubjects(db, teacherName, teacherRow = {}) {
  if (!teacherName) return [];

  const rows = db.prepare(`
    SELECT DISTINCT subject
    FROM timetable
    WHERE LOWER(teacher) = LOWER(?)
    ORDER BY subject
  `).all(teacherName);

  const subjects = rows.map((row) => normalize(row.subject)).filter(Boolean);
  if (subjects.length > 0) return subjects;

  const fallbackSubject = normalize(teacherRow.subject);
  return fallbackSubject ? [fallbackSubject] : [];
}

function findTeacherRowByIdentifier(db, identifier) {
  const lookup = normalizeLower(identifier);
  if (!lookup) return null;

  return db.prepare(`
    SELECT *
    FROM teachers
    WHERE LOWER(COALESCE(CAST(id AS TEXT), '')) = ?
       OR LOWER(COALESCE(teacher_id, '')) = ?
       OR LOWER(COALESCE(emp, '')) = ?
       OR LOWER(COALESCE(email, '')) = ?
    LIMIT 1
  `).get(lookup, lookup, lookup, lookup);
}

function mapTeacherStudentRow(student) {
  const std = normalize(student.class);
  const section = normalizeDivision(student.section);
  const grNumber = normalize(student.gr_number);
  const admissionNumber = normalize(student.admission);
  return {
    _id: `stu_${student.id}`,
    id: student.id,
    studentDbId: student.id,
    studentId: normalize(student.student_id),
    grNo: grNumber,
    grNumber,
    admissionNumber,
    rollNumber: grNumber || admissionNumber || `R${student.id}`,
    name: normalize(student.name),
    className: std,
    section,
    standard: std,
    division: section,
    parentId: normalize(student.parent_id) || normalize(student.parentId) || normalize(student.student_id) || normalize(student.gr_number),
    parent_id: normalize(student.parent_id) || normalize(student.parentId) || normalize(student.student_id) || normalize(student.gr_number),
    parentName: normalize(student.parent),
    parentContact: normalize(student.phone),
    parentPhone: normalize(student.phone),
    status: normalize(student.status) || 'Active',
    admissionNumber: normalize(student.admission),
    dateOfBirth: normalize(student.dob),
    gender: normalize(student.gender),
    address: normalize(student.address),
    bloodGroup: normalize(student.blood_group),
  };
}

function readStudentMasterRows() {
  try {
    if (!fs.existsSync(studentMasterFilePath)) return [];
    const raw = fs.readFileSync(studentMasterFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.students)) return parsed.students;
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    console.warn('Failed to read student master file, falling back to DB:', error.message);
  }
  return [];
}

export function findTeacherByCredentials(teacherId, password) {
  const lookup = normalizeLower(teacherId);
  if (!lookup) return null;

  const db = getAdminDb();
  const teacher = findTeacherRowByIdentifier(db, lookup);

  if (!teacher) return null;

  const storedPassword = teacher.teacher_password || teacher.password || '';
  if (!comparePassword(storedPassword, password)) return null;

  const teacherName = normalize(teacher.name);
  const parsedClass = parseTeacherClass(teacher.class, teacher.division);
  const assignedClass = parsedClass.assignedClass;
  const division = parsedClass.division;
  const teacherIdentifier = normalize(teacher.teacher_id) || normalize(teacher.emp) || normalize(teacher.email);

  return {
    id: teacher.id,
    teacherId: teacherIdentifier,
    loginId: teacherIdentifier,
    name: teacherName || teacherIdentifier || 'Teacher',
    email: normalize(teacher.email),
    mobile: normalize(teacher.phone),
    assignedClass,
    division,
    subject: normalize(teacher.subject),
    classTeacherStd: assignedClass,
    classTeacherDiv: division,
    classTeacherOf: assignedClass && division ? `${assignedClass}-${division}` : '',
    assignedSubjects: getAssignedSubjects(db, teacherName, teacher),
    timetableClasses: getAssignedClasses(db, teacherName),
    status: normalize(teacher.status) || 'Active',
    role: 'teacher'
  };
}

export function findTeacherByTeacherId(teacherId) {
  const lookup = normalizeLower(teacherId);
  if (!lookup) return null;

  const db = getAdminDb();
  const teacher = findTeacherRowByIdentifier(db, lookup);

  if (!teacher) return null;

  const teacherName = normalize(teacher.name);
  const parsedClass = parseTeacherClass(teacher.class, teacher.division);
  const assignedClass = parsedClass.assignedClass;
  const division = parsedClass.division;
  const teacherIdentifier = normalize(teacher.teacher_id) || normalize(teacher.emp) || normalize(teacher.email);

  return {
    id: teacher.id,
    teacherId: teacherIdentifier,
    loginId: teacherIdentifier,
    name: teacherName || teacherIdentifier || 'Teacher',
    email: normalize(teacher.email),
    mobile: normalize(teacher.phone),
    assignedClass,
    division,
    subject: normalize(teacher.subject),
    classTeacherStd: assignedClass,
    classTeacherDiv: division,
    classTeacherOf: assignedClass && division ? `${assignedClass}-${division}` : '',
    assignedSubjects: getAssignedSubjects(db, teacherName, teacher),
    timetableClasses: getAssignedClasses(db, teacherName),
    status: normalize(teacher.status) || 'Active',
    role: 'teacher'
  };
}

export function findTeacherByIdentifier(identifier) {
  const db = getAdminDb();
  const teacher = findTeacherRowByIdentifier(db, identifier);
  if (!teacher) return null;

  const teacherName = normalize(teacher.name);
  const parsedClass = parseTeacherClass(teacher.class, teacher.division);
  const assignedClass = parsedClass.assignedClass;
  const division = parsedClass.division;
  const teacherIdentifier = normalize(teacher.teacher_id) || normalize(teacher.emp) || normalize(teacher.email) || normalize(teacher.id);

  return {
    id: teacher.id,
    teacherId: teacherIdentifier,
    loginId: teacherIdentifier,
    name: teacherName || teacherIdentifier || 'Teacher',
    email: normalize(teacher.email),
    mobile: normalize(teacher.phone),
    assignedClass,
    division,
    subject: normalize(teacher.subject),
    classTeacherStd: assignedClass,
    classTeacherDiv: division,
    classTeacherOf: assignedClass && division ? `${assignedClass}-${division}` : '',
    assignedSubjects: getAssignedSubjects(db, teacherName, teacher),
    timetableClasses: getAssignedClasses(db, teacherName),
    status: normalize(teacher.status) || 'Active',
    role: 'teacher'
  };
}

export function getTeacherAssignedStudents(teacher) {
  if (!teacher) return [];

  const std = normalize(teacher.classTeacherStd || teacher.assignedClass || '');
  const division = normalizeDivision(teacher.classTeacherDiv || teacher.division || '');
  if (!std || !division) return [];

  const masterStudents = readStudentMasterRows();
  if (masterStudents.length > 0) {
    return masterStudents
      .filter((student) => String(student.class || student.standard || '').trim() === std
        && normalizeDivision(student.section || student.division || '') === division)
      .map(mapTeacherStudentRow);
  }

  const db = getAdminDb();
  const students = db.prepare(`
    SELECT *
    FROM students
    WHERE CAST(class AS TEXT) = ?
      AND UPPER(COALESCE(section, '')) = UPPER(?)
    ORDER BY
      CAST(COALESCE(gr_number, student_id, id) AS TEXT),
      name
  `).all(std, division);

  return students.map(mapTeacherStudentRow);
}

export function buildTeacherAuthResponse(teacher) {
  if (!teacher) return null;

  const token = generateToken(String(teacher.id || teacher.teacherId || teacher.loginId || 'teacher'), 'teacher');
  return {
    success: true,
    token,
    user: teacher
  };
}
