const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { isSupportedStandard, parseStandard } = require('../config/standards');

const TEACHER_MASTER_FILE = path.join(__dirname, '..', 'teacher_master_data.json');
let watchStarted = false;
let writeInProgress = false;
let debounceTimer = null;

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizeNullableText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

function normalizeTeacherClassAssignment(input = {}) {
  const rawClass = String(input.class || '').trim();
  const rawDivision = String(input.division || '').trim().toUpperCase();

  if (!rawClass && !rawDivision) {
    return { classValue: null, divisionValue: null, key: null };
  }

  const classNumber = parseStandard(rawClass);
  if (!Number.isInteger(classNumber) || !isSupportedStandard(classNumber)) {
    return { error: 'Teacher class assignment must be between 1 and 6.' };
  }

  const suffixDivision = String(rawClass).match(/([A-Za-z])$/)?.[1]?.toUpperCase() || '';
  const divisionValue = rawDivision || suffixDivision || null;
  const classValue = String(classNumber);

  return {
    classValue,
    divisionValue,
    key: divisionValue ? `${classValue}-${divisionValue}` : classValue,
  };
}

function mapTeacherRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    emp: row.emp || '',
    subject: row.subject || '',
    class: row.class || null,
    division: row.division || null,
    salary: Number.isFinite(row.salary) ? row.salary : Number(row.salary || 0),
    phone: row.phone || '',
    email: row.email || '',
    status: row.status || 'Active',
    qualification: row.qualification || '',
    join_date: row.join_date || '',
    teacher_id: row.teacher_id || '',
    teacher_password: row.teacher_password || '',
    created_at: row.created_at || null,
  };
}

function readTeacherMasterFile() {
  if (!fs.existsSync(TEACHER_MASTER_FILE)) {
    return null;
  }

  const raw = fs.readFileSync(TEACHER_MASTER_FILE, 'utf8').trim();
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.teachers)) return parsed.teachers;
  return null;
}

function writeTeacherMasterFile(teachers) {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'Admin Dashboard/backend/database.sqlite',
    total: teachers.length,
    teachers,
  };

  writeInProgress = true;
  try {
    fs.writeFileSync(TEACHER_MASTER_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } finally {
    setTimeout(() => {
      writeInProgress = false;
    }, 150);
  }
}

function exportTeachersToFile() {
  const teachers = db.prepare(`
    SELECT *
    FROM teachers
    ORDER BY CAST(SUBSTR(COALESCE(teacher_id, ''), 4) AS INTEGER), id
  `).all().map(mapTeacherRow);

  writeTeacherMasterFile(teachers);
  return teachers.length;
}

function cleanupTeacherClassAssignments() {
  const activeRows = db.prepare(`
    SELECT id, name, class, division, status, created_at
    FROM teachers
    WHERE status = 'Active'
      AND TRIM(COALESCE(class, '')) != ''
    ORDER BY COALESCE(datetime(created_at), datetime('1970-01-01 00:00:00')), id
  `).all();

  const inactiveRows = db.prepare(`
    SELECT id
    FROM teachers
    WHERE status != 'Active'
      AND TRIM(COALESCE(class, '')) != ''
  `).all();

  const clearTeacherClass = db.prepare('UPDATE teachers SET class = NULL, division = NULL WHERE id = ?');
  const normalizeTeacherClass = db.prepare('UPDATE teachers SET class = ?, division = ? WHERE id = ?');
  const resetMappings = db.prepare('DELETE FROM class_teacher_mapping');
  const upsertMapping = db.prepare(`
    INSERT INTO class_teacher_mapping (class, section, teacher_id, teacher_name)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(class, section) DO UPDATE SET
      teacher_id = excluded.teacher_id,
      teacher_name = excluded.teacher_name
  `);

  const tx = db.transaction(() => {
    resetMappings.run();

    const seen = new Set();
    for (const row of activeRows) {
      const normalized = normalizeTeacherClassAssignment(row);
      if (normalized.error || !normalized.key || !normalized.classValue) {
        clearTeacherClass.run(row.id);
        continue;
      }

      if (seen.has(normalized.key)) {
        clearTeacherClass.run(row.id);
        continue;
      }

      seen.add(normalized.key);
      normalizeTeacherClass.run(normalized.classValue, normalized.divisionValue, row.id);

      if (normalized.divisionValue) {
        upsertMapping.run(Number(normalized.classValue), normalized.divisionValue, row.id, row.name || '');
      }
    }

    inactiveRows.forEach((row) => {
      clearTeacherClass.run(row.id);
    });
  });

  tx();
  return {
    activeAssignments: activeRows.length,
    cleanedInactiveAssignments: inactiveRows.length,
  };
}

function upsertTeacherRow(row) {
  const hasId = Number.isFinite(Number(row.id));
  const existing = hasId
    ? db.prepare('SELECT id FROM teachers WHERE id = ?').get(Number(row.id))
    : (row.teacher_id ? db.prepare('SELECT id FROM teachers WHERE teacher_id = ?').get(String(row.teacher_id)) : null);

  if (existing) {
    db.prepare(`
      UPDATE teachers
      SET name = ?,
          emp = ?,
          subject = ?,
          class = ?,
          division = ?,
          salary = ?,
          phone = ?,
          email = ?,
          status = ?,
          qualification = ?,
          join_date = ?,
          teacher_id = ?,
          teacher_password = ?
      WHERE id = ?
    `).run(
      normalizeText(row.name),
      normalizeText(row.emp),
      normalizeText(row.subject),
      normalizeNullableText(row.class),
      normalizeNullableText(row.division),
      Number(row.salary || 0),
      normalizeText(row.phone),
      normalizeText(row.email),
      normalizeText(row.status || 'Active'),
      normalizeText(row.qualification),
      normalizeText(row.join_date),
      normalizeNullableText(row.teacher_id),
      normalizeNullableText(row.teacher_password),
      existing.id
    );
    return;
  }

  db.prepare(`
    INSERT INTO teachers (
      name, emp, subject, class, division, salary, phone, email,
      status, qualification, join_date, teacher_id, teacher_password
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizeText(row.name),
    normalizeText(row.emp),
    normalizeText(row.subject),
    normalizeNullableText(row.class),
    normalizeNullableText(row.division),
    Number(row.salary || 0),
    normalizeText(row.phone),
    normalizeText(row.email),
    normalizeText(row.status || 'Active'),
    normalizeText(row.qualification),
    normalizeText(row.join_date),
    normalizeNullableText(row.teacher_id),
    normalizeNullableText(row.teacher_password)
  );
}

function importTeachersFromFile() {
  const teachers = readTeacherMasterFile();
  if (!teachers || !teachers.length) {
    return 0;
  }

  const normalized = teachers.map((teacher) => ({
    id: Number.isFinite(Number(teacher.id)) ? Number(teacher.id) : null,
    name: teacher.name || teacher.full_name || teacher.teacherName || '',
    emp: teacher.emp || teacher.emp_id || '',
    subject: teacher.subject || '',
    class: teacher.class || teacher.assigned_class || null,
    division: teacher.division || teacher.section || null,
    salary: teacher.salary || 0,
    phone: teacher.phone || teacher.mobile || '',
    email: teacher.email || '',
    status: teacher.status || 'Active',
    qualification: teacher.qualification || '',
    join_date: teacher.join_date || teacher.join || '',
    teacher_id: teacher.teacher_id || teacher.teacherId || '',
    teacher_password: teacher.teacher_password || teacher.password || '',
  })).filter((teacher) => teacher.name && teacher.emp);

  if (!normalized.length) {
    return 0;
  }

  const tx = db.transaction(() => {
    normalized.forEach(upsertTeacherRow);
  });
  tx();
  cleanupTeacherClassAssignments();
  return normalized.length;
}

function syncTeacherMasterFileFromDb() {
  const count = exportTeachersToFile();
  return count;
}

function syncTeacherMasterDbFromFile() {
  return importTeachersFromFile();
}

function startTeacherMasterWatch() {
  if (watchStarted || !fs.existsSync(TEACHER_MASTER_FILE)) {
    return;
  }

  watchStarted = true;
  fs.watchFile(TEACHER_MASTER_FILE, { interval: 1000 }, () => {
    if (writeInProgress) {
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        syncTeacherMasterDbFromFile();
        syncTeacherMasterFileFromDb();
      } catch (error) {
        console.error('[teacher_master_data] sync failed:', error.message);
      }
    }, 250);
  });
}

module.exports = {
  TEACHER_MASTER_FILE,
  cleanupTeacherClassAssignments,
  exportTeachersToFile,
  importTeachersFromFile,
  normalizeTeacherClassAssignment,
  syncTeacherMasterDbFromFile,
  syncTeacherMasterFileFromDb,
  startTeacherMasterWatch,
};
