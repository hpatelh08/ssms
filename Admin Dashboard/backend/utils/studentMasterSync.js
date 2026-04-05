const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { MIN_STANDARD, MAX_STANDARD } = require('../config/standards');

const STUDENT_MASTER_FILE = path.join(__dirname, '..', 'student_master_data.json');
const STUDENT_MASTER_CLASSESS = new Set(['A', 'B', 'C']);

let watchStarted = false;
let writeInProgress = false;
let debounceTimer = null;

function normalizeSection(value = 'A') {
  const section = String(value || 'A').trim().toUpperCase();
  return STUDENT_MASTER_CLASSESS.has(section) ? section : 'A';
}

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizeNullableText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

function mapStudentRow(row) {
  return {
    id: row.id,
    gr_number: row.gr_number || '',
    student_id: row.student_id || '',
    student_password: row.student_password || '',
    name: row.name || '',
    admission: row.admission || '',
    class: row.class || '',
    section: normalizeSection(row.section),
    parent: row.parent || '',
    phone: row.phone || '',
    status: row.status || 'Active',
    fees: row.fees || 'Pending',
    dob: row.dob || '',
    gender: row.gender || 'Male',
    blood_group: row.blood_group || null,
    address: row.address || '',
    parent_access_key: row.parent_access_key || null,
    parent_id: row.parent_id || null,
    created_at: row.created_at || null,
  };
}

function readStudentMasterFile() {
  if (!fs.existsSync(STUDENT_MASTER_FILE)) {
    return null;
  }

  const raw = fs.readFileSync(STUDENT_MASTER_FILE, 'utf8').trim();
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.students)) return parsed.students;
  return null;
}

function writeStudentMasterFile(students) {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'Admin Dashboard backend/database.sqlite',
    standards: `${MIN_STANDARD}-${MAX_STANDARD}`,
    total: students.length,
    students,
  };

  writeInProgress = true;
  try {
    fs.writeFileSync(STUDENT_MASTER_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } finally {
    setTimeout(() => {
      writeInProgress = false;
    }, 150);
  }
}

function exportStudentsToFile() {
  const students = db.prepare(`
    SELECT *
    FROM students
    WHERE CAST(class AS INTEGER) BETWEEN ? AND ?
    ORDER BY
      CAST(class AS INTEGER),
      UPPER(COALESCE(section, 'A')),
      CAST(SUBSTR(gr_number, 4) AS INTEGER),
      id
  `).all(MIN_STANDARD, MAX_STANDARD).map(mapStudentRow);

  writeStudentMasterFile(students);
  return students.length;
}

function upsertStudentById(row) {
  const existing = row.id
    ? db.prepare('SELECT id FROM students WHERE id = ?').get(row.id)
    : null;

  if (existing) {
    db.prepare(`
      UPDATE students
      SET gr_number = ?,
          student_id = ?,
          student_password = ?,
          name = ?,
          admission = ?,
          class = ?,
          section = ?,
          parent = ?,
          phone = ?,
          status = ?,
          fees = ?,
          dob = ?,
          gender = ?,
          blood_group = ?,
          address = ?,
          parent_access_key = ?,
          parent_id = ?
      WHERE id = ?
    `).run(
      normalizeText(row.gr_number),
      normalizeText(row.student_id),
      normalizeText(row.student_password),
      normalizeText(row.name),
      normalizeText(row.admission),
      normalizeText(row.class),
      normalizeSection(row.section),
      normalizeText(row.parent),
      normalizeText(row.phone),
      normalizeText(row.status || 'Active'),
      normalizeText(row.fees || 'Pending'),
      normalizeText(row.dob),
      normalizeText(row.gender || 'Male'),
      normalizeNullableText(row.blood_group),
      normalizeText(row.address),
      normalizeNullableText(row.parent_access_key),
      normalizeNullableText(row.parent_id),
      row.id
    );
    return;
  }

  db.prepare(`
    INSERT INTO students (
      gr_number, student_id, student_password, name, admission, class, section,
      parent, phone, status, fees, dob, gender, blood_group, address,
      parent_access_key, parent_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizeText(row.gr_number),
    normalizeText(row.student_id),
    normalizeText(row.student_password),
    normalizeText(row.name),
    normalizeText(row.admission),
    normalizeText(row.class),
    normalizeSection(row.section),
    normalizeText(row.parent),
    normalizeText(row.phone),
    normalizeText(row.status || 'Active'),
    normalizeText(row.fees || 'Pending'),
    normalizeText(row.dob),
    normalizeText(row.gender || 'Male'),
    normalizeNullableText(row.blood_group),
    normalizeText(row.address),
    normalizeNullableText(row.parent_access_key),
    normalizeNullableText(row.parent_id)
  );
}

function importStudentsFromFile() {
  const students = readStudentMasterFile();
  if (!students || !students.length) {
    return 0;
  }

  const normalized = students.map((student) => ({
    id: Number.isFinite(Number(student.id)) ? Number(student.id) : null,
    gr_number: student.gr_number || student.grNo || '',
    student_id: student.student_id || student.studentId || '',
    student_password: student.student_password || student.password || '',
    name: student.name || student.full_name || student.studentName || '',
    admission: student.admission || student.admissionNumber || '',
    class: student.class || student.standard || '',
    section: student.section || student.division || 'A',
    parent: student.parent || student.parentName || '',
    phone: student.phone || student.parent_contact || '',
    status: student.status || 'Active',
    fees: student.fees || 'Pending',
    dob: student.dob || '',
    gender: student.gender || 'Male',
    blood_group: student.blood_group || null,
    address: student.address || '',
    parent_access_key: student.parent_access_key || null,
    parent_id: student.parent_id || null,
  })).filter((student) => student.name && student.admission && student.class);

  if (!normalized.length) {
    return 0;
  }

  const tx = db.transaction(() => {
    normalized.forEach(upsertStudentById);
  });
  tx();
  return normalized.length;
}

function syncStudentMasterFileFromDb() {
  const count = exportStudentsToFile();
  return count;
}

function syncStudentMasterDbFromFile() {
  return importStudentsFromFile();
}

function startStudentMasterWatch() {
  if (watchStarted || !fs.existsSync(STUDENT_MASTER_FILE)) {
    return;
  }

  watchStarted = true;
  fs.watchFile(STUDENT_MASTER_FILE, { interval: 1000 }, () => {
    if (writeInProgress) {
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        syncStudentMasterDbFromFile();
        syncStudentMasterFileFromDb();
      } catch (error) {
        console.error('[student_master_data] sync failed:', error.message);
      }
    }, 250);
  });
}

module.exports = {
  STUDENT_MASTER_FILE,
  exportStudentsToFile,
  importStudentsFromFile,
  syncStudentMasterDbFromFile,
  syncStudentMasterFileFromDb,
  startStudentMasterWatch,
};
