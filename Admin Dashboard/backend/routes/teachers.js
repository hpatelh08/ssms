// =============================================
//  TEACHERS ROUTES - Full CRUD
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');
const {
  normalizeTeacherClassAssignment,
  syncTeacherMasterFileFromDb,
} = require('../utils/teacherMasterSync');

const router = Router();
router.use(authMiddleware);

function findActiveTeacherClassConflict(classInfo, excludeId = null) {
  if (!classInfo || classInfo.error || !classInfo.key) return null;

  const rows = db.prepare(`
    SELECT id, name, class, division, status
    FROM teachers
    WHERE status = 'Active'
      AND TRIM(COALESCE(class, '')) != ''
  `).all();

  return rows.find((row) => {
    if (excludeId !== null && Number(row.id) === Number(excludeId)) return false;
    const normalized = normalizeTeacherClassAssignment(row);
    return normalized.key && normalized.key === classInfo.key;
  }) || null;
}

// GET /api/teachers - list with search, filter, pagination (default 10)
router.get('/', (req, res) => {
  const { search, status, subject, class: cls, division, page = 1, limit = 10 } = req.query;
  let where = [];
  let params = [];

  if (search) {
    where.push('(LOWER(name) LIKE ? OR LOWER(subject) LIKE ? OR LOWER(emp) LIKE ? OR LOWER(teacher_id) LIKE ?)');
    params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
  }
  if (status) { where.push('status = ?'); params.push(status); }
  if (subject) { where.push('LOWER(subject) LIKE ?'); params.push(`%${subject.toLowerCase()}%`); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const teachers = db.prepare(`SELECT * FROM teachers ${whereClause} ORDER BY created_at DESC`).all(...params);

  const normalizeClassValue = (teacher) => {
    const rawClass = String(teacher?.class || '').trim();
    const rawDivision = String(teacher?.division || '').trim().toUpperCase();
    const classDigits = rawClass.match(/\d+/)?.[0] || '';
    const classLetters = rawClass.match(/[A-Za-z]+$/)?.[0]?.toUpperCase() || '';
    const combined = `${classDigits}${classLetters}`;
    const hyphenCombined = classDigits && classLetters ? `${classDigits}-${classLetters}` : '';
    return { rawClass, rawDivision, classDigits, classLetters, combined, hyphenCombined };
  };

  const classValue = String(cls || '').trim();
  const divisionValue = String(division || '').trim().toUpperCase();
  const filteredTeachers = teachers.filter((teacher) => {
    const normalized = normalizeClassValue(teacher);
    const matchesClass = !classValue || [
      normalized.classDigits,
      normalized.combined,
      normalized.hyphenCombined,
      normalized.rawClass.replace(/\s+/g, ''),
    ].some((value) => String(value || '').replace(/\s+/g, '').toUpperCase() === classValue.replace(/\s+/g, '').toUpperCase()
      || String(value || '').toLowerCase().includes(`class ${classValue.toLowerCase()}`));

    const matchesDivision = !divisionValue || [
      normalized.rawDivision,
      normalized.classLetters,
      normalized.hyphenCombined.split('-')[1] || '',
      normalized.rawClass.match(/[A-Za-z]+$/)?.[0] || '',
    ].some((value) => String(value || '').trim().toUpperCase() === divisionValue);

    return matchesClass && matchesDivision;
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const totalRecords = filteredTeachers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limitNum));
  const offset = (pageNum - 1) * limitNum;
  const pagedTeachers = filteredTeachers.slice(offset, offset + limitNum);

  const mapped = pagedTeachers.map((t) => ({ ...t, join: t.join_date }));
  res.json({ totalRecords, totalPages, currentPage: pageNum, data: mapped });
});

// GET /api/teachers/counts - dynamic counts for stat cards
router.get('/counts', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM teachers').get().c;
  const active = db.prepare("SELECT COUNT(*) as c FROM teachers WHERE status = 'Active'").get().c;
  const inactive = db.prepare("SELECT COUNT(*) as c FROM teachers WHERE status = 'Inactive'").get().c;
  const subjects = db.prepare('SELECT COUNT(DISTINCT subject) as c FROM teachers').get().c;
  const avgSalary = db.prepare('SELECT COALESCE(AVG(salary),0) as avg FROM teachers').get().avg;
  res.json({ total, active, inactive, subjects, avgSalary: Math.round(avgSalary) });
});

// GET /api/teachers/:id
router.get('/:id', (req, res) => {
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });
  res.json({ ...teacher, join: teacher.join_date });
});

// POST /api/teachers - auto-generate EMP ID, Teacher ID, Password
router.post('/', authorize('super_admin', 'admin'), (req, res) => {
  const { name, subject, class: cls, division, salary, phone, email, status, qualification, join } = req.body;
  if (!name) return res.status(400).json({ error: 'Teacher name is required.' });

  const assignment = normalizeTeacherClassAssignment({ class: cls, division });
  if (assignment.error) {
    return res.status(400).json({ error: assignment.error });
  }

  if (assignment.key) {
    const conflict = findActiveTeacherClassConflict(assignment);
    if (conflict) {
      return res.status(409).json({
        error: `Class ${assignment.key} already has a class teacher (${conflict.name}).`,
      });
    }
  }

  const maxEmpRow = db.prepare("SELECT MAX(CAST(SUBSTR(emp, 5) AS INTEGER)) as n FROM teachers WHERE emp LIKE 'EMP-%'").get();
  const empId = `EMP-${String((maxEmpRow.n || 0) + 1).padStart(3, '0')}`;

  const year = new Date().getFullYear();
  const maxTchRow = db.prepare("SELECT MAX(CAST(SUBSTR(teacher_id, 8) AS INTEGER)) as n FROM teachers WHERE teacher_id LIKE 'TCH%'").get();
  const tchId = `TCH${year}${String((maxTchRow.n || 0) + 1).padStart(3, '0')}`;

  const tchPass = `Tch@${Math.floor(1000 + Math.random() * 9000)}`;
  const joinDate = join || new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    INSERT INTO teachers (name, emp, subject, class, division, salary, phone, email, status, qualification, join_date, teacher_id, teacher_password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    name,
    empId,
    subject || '',
    assignment.classValue || null,
    assignment.divisionValue || null,
    salary || 0,
    phone || '',
    email || '',
    status || 'Active',
    qualification || '',
    joinDate,
    tchId,
    tchPass
  );

  syncTeacherMasterFileFromDb();
  res.status(201).json({ success: true, id: result.lastInsertRowid, emp: empId, teacher_id: tchId, teacher_password: tchPass });
});

// PUT /api/teachers/:id
router.put('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id FROM teachers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Teacher not found.' });

  const { name, emp, subject, class: cls, division, salary, phone, email, status, qualification, join, teacher_id, teacher_password } = req.body;
  const assignment = normalizeTeacherClassAssignment({ class: cls, division });
  if (assignment.error) {
    return res.status(400).json({ error: assignment.error });
  }

  if (assignment.key) {
    const conflict = findActiveTeacherClassConflict(assignment, req.params.id);
    if (conflict) {
      return res.status(409).json({
        error: `Class ${assignment.key} already has a class teacher (${conflict.name}).`,
      });
    }
  }

  const stmt = db.prepare(`
    UPDATE teachers SET name=?, emp=?, subject=?, class=?, division=?, salary=?, phone=?,
      email=?, status=?, qualification=?, join_date=?, teacher_id=?, teacher_password=?
    WHERE id = ?
  `);
  stmt.run(
    name,
    emp,
    subject,
    assignment.classValue || null,
    assignment.divisionValue || null,
    salary,
    phone,
    email,
    status,
    qualification,
    join,
    teacher_id || null,
    teacher_password || null,
    req.params.id
  );
  syncTeacherMasterFileFromDb();
  res.json({ success: true });
});

// DELETE /api/teachers/:id
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM teachers WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Teacher not found.' });
  syncTeacherMasterFileFromDb();
  res.json({ success: true });
});

module.exports = router;
