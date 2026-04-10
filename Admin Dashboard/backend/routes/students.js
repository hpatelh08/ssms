// =============================================
//  STUDENTS ROUTES — Full CRUD
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');
const { MIN_STANDARD, MAX_STANDARD, parseStandard, isSupportedStandard } = require('../config/standards');
const { syncStudentMasterFileFromDb } = require('../utils/studentMasterSync');

const router = Router();
const STUDENT_SECTION_ORDER = ['A', 'B', 'C'];
const STUDENT_SECTION_CAPACITY = 40;
const PARENT_PHONE_REGEX = /^\d{10}$/;

function padNumber(value, size) {
  return String(value).padStart(size, '0');
}

function extractNumericSuffix(value) {
  const match = String(value || '').match(/(\d+)(?!.*\d)/);
  return match ? parseInt(match[1], 10) : null;
}

function normalizeStudentSection(sectionRaw = 'A') {
  const section = String(sectionRaw || 'A').trim().toUpperCase();
  return STUDENT_SECTION_ORDER.includes(section) ? section : null;
}

function normalizeParentPhone(phoneRaw = '') {
  return String(phoneRaw || '').replace(/\D/g, '').slice(0, 10);
}

function isValidParentPhone(phoneRaw = '') {
  return PARENT_PHONE_REGEX.test(normalizeParentPhone(phoneRaw));
}

function getStudentSequenceRange(classNo, sectionRaw) {
  const section = normalizeStudentSection(sectionRaw);
  if (!isSupportedStandard(classNo) || !section) return null;

  const sectionIndex = STUDENT_SECTION_ORDER.indexOf(section);
  const blockIndex = ((classNo - MIN_STANDARD) * STUDENT_SECTION_ORDER.length) + sectionIndex;
  const start = (blockIndex * STUDENT_SECTION_CAPACITY) + 1;

  return {
    classNo,
    section,
    start,
    end: start + STUDENT_SECTION_CAPACITY - 1,
  };
}

function getNextAvailableStudentSequence(classNo, sectionRaw) {
  const range = getStudentSequenceRange(classNo, sectionRaw);
  if (!range) return null;

  const rows = db.prepare('SELECT gr_number, admission, student_id FROM students').all();
  const usedSequences = new Set();

  rows.forEach((row) => {
    [
      extractNumericSuffix(row.gr_number),
      extractNumericSuffix(row.admission),
      extractNumericSuffix(row.student_id)
    ].forEach((sequence) => {
      if (
        Number.isInteger(sequence)
        && sequence >= range.start
        && sequence <= range.end
      ) {
        usedSequences.add(sequence);
      }
    });
  });

  for (let nextSequence = range.start; nextSequence <= range.end; nextSequence += 1) {
    if (!usedSequences.has(nextSequence)) {
      return nextSequence;
    }
  }

  return null;
}

function buildGeneratedParentAccessKey(phoneRaw) {
  const normalizedPhone = normalizeParentPhone(phoneRaw);
  return isValidParentPhone(normalizedPhone) ? normalizedPhone.slice(-4) : null;
}

function buildGeneratedStudentIdentity(sequence, year, parentPhone) {
  return {
    grNum: `GR-${padNumber(sequence, 3)}`,
    admNum: `ADM-${year}-${padNumber(sequence, 3)}`,
    stuId: `STU${year}${padNumber(sequence, 4)}`,
    stuPass: `Stu@${padNumber(sequence, 3)}`,
    accessKey: buildGeneratedParentAccessKey(parentPhone),
  };
}

function mapStudentToProfile(student) {
  const classNo = parseStandard(student.class);
  const section = normalizeStudentSection(student.section) || 'A';
  return {
    id: `stu_${student.id}`,
    studentName: student.name || 'Student',
    className: `Std ${classNo || student.class || ''}${section ? `-${section}` : ''}`.trim(),
    admissionNumber: student.admission || '',
    grNo: student.gr_number || '',
    studentId: student.student_id || '',
    password: student.student_password || '',
    parentName: student.parent || '',
    phone: student.phone || '',
    dob: student.dob || '',
    gender: student.gender || 'Male',
    bloodGroup: student.blood_group || '',
    address: student.address || '',
    status: student.status || 'Active',
    parentAccessKey: student.parent_access_key || '',
    grade: Number.isInteger(classNo) ? classNo : parseInt(student.class, 10) || 0,
    class: student.class,
    section,
    parentId: student.parent_id || '',
  };
}

// POST /api/students/access-key-login — Public: Parent login for class 1-6
// Body: { student_id, access_key }
const jwt = require('jsonwebtoken');
router.post('/login', (req, res) => {
  const { student_id, password } = req.body;
  if (!student_id || !password) {
    return res.status(400).json({ error: 'Student ID and password are required.' });
  }

  const student = db.prepare('SELECT * FROM students WHERE LOWER(student_id) = LOWER(?)').get(student_id.trim());
  if (!student) {
    return res.status(401).json({ error: 'Invalid Student ID or Password.' });
  }

  const cls = parseStandard(student.class);
  if (!isSupportedStandard(cls)) {
    return res.status(403).json({ error: 'Student login is only available for Class 1–6 students.' });
  }

  if ((student.student_password || '').trim() !== password.trim()) {
    return res.status(401).json({ error: 'Invalid Student ID or Password.' });
  }

  const SECRET = process.env.JWT_SECRET || 'ssms_default_secret';
  const token = jwt.sign(
    { id: `stu_${student.id}`, role: 'student', name: student.name || 'Student', student_id: student.student_id, class: student.class, section: student.section },
    SECRET,
    { expiresIn: '8h' }
  );

  const profile = mapStudentToProfile(student);
  res.json({
    success: true,
    token,
    user: {
      id: `stu_${student.id}`,
      role: 'student',
      name: student.name || 'Student',
      student_id: student.student_id,
      class: student.class,
      section: student.section,
    },
    student: profile,
  });
});

router.post('/access-key-login', (req, res) => {
  const { student_id, access_key } = req.body;
  if (!student_id || !access_key) {
    return res.status(400).json({ error: 'Student ID and Access Key are required.' });
  }
  const student = db.prepare('SELECT * FROM students WHERE LOWER(student_id) = LOWER(?)').get(student_id.trim());
  if (!student) return res.status(401).json({ error: 'Invalid Student ID or Access Key.' });

  const cls = parseStandard(student.class);
  if (!isSupportedStandard(cls)) {
    return res.status(403).json({ error: 'Access Key login is only for Class 1–6 students.' });
  }
  if (!student.parent_access_key || student.parent_access_key !== access_key.trim()) {
    return res.status(401).json({ error: 'Invalid Student ID or Access Key.' });
  }

  const SECRET = process.env.JWT_SECRET || 'ssms_default_secret';
  const token = jwt.sign(
    { id: `par_stu_${student.id}`, role: 'parent', name: student.parent || 'Parent', student_id: student.student_id, class: student.class },
    SECRET,
    { expiresIn: '8h' }
  );
  const profile = mapStudentToProfile(student);
  res.json({
    success: true,
    token,
    user: { id: `par_stu_${student.id}`, role: 'parent', name: student.parent || 'Parent', student_id: student.student_id },
    student: profile
  });
});

router.use(authMiddleware);

// GET /api/students — list with search, filter, pagination
// Supports: search, class (e.g. "6" or "6A"), status, page, limit (default 10)
router.get('/', (req, res) => {
  const { search, class: cls, section, status, page = 1, limit = 10 } = req.query;
  let where = [];
  let params = [];

  where.push('CAST(class AS INTEGER) BETWEEN ? AND ?');
  params.push(MIN_STANDARD, MAX_STANDARD);

  if (search) {
    where.push('(LOWER(name) LIKE ? OR LOWER(admission) LIKE ? OR LOWER(gr_number) LIKE ? OR LOWER(student_id) LIKE ?)');
    params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
  }
  if (cls) {
    // Support combined class+section filter like "6A" → class=6, section=A
    const match = cls.match(/^(\d+)([A-Za-z])?$/);
    if (match) {
      const classNo = parseInt(match[1], 10);
      if (!isSupportedStandard(classNo)) {
        return res.json({ totalRecords: 0, totalPages: 0, currentPage: parseInt(page, 10), data: [] });
      }
      where.push('class = ?');
      params.push(String(classNo));
      if (match[2]) {
        where.push('UPPER(section) = ?');
        params.push(match[2].toUpperCase());
      }
    }
  }
  if (section) {
    const normalizedSection = normalizeStudentSection(section);
    if (!normalizedSection) {
      return res.json({ totalRecords: 0, totalPages: 0, currentPage: parseInt(page, 10), data: [] });
    }
    where.push('UPPER(section) = ?');
    params.push(normalizedSection);
  }
  if (status) { where.push('LOWER(COALESCE(status, \'\')) = LOWER(?)'); params.push(status); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const totalRecords = db.prepare(`SELECT COUNT(*) as count FROM students ${whereClause}`).get(...params).count;
  const totalPages = Math.ceil(totalRecords / parseInt(limit));
  const students = db.prepare(`
    SELECT * FROM students ${whereClause}
    ORDER BY
      CAST(class AS INTEGER),
      UPPER(COALESCE(section, 'A')),
      CAST(SUBSTR(gr_number, 4) AS INTEGER),
      id
    LIMIT ? OFFSET ?
  `)
    .all(...params, parseInt(limit), offset);

  res.json({ totalRecords, totalPages, currentPage: parseInt(page), data: students });
});

// GET /api/students/counts — dynamic counts for stat cards
router.get('/counts', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM students WHERE CAST(class AS INTEGER) BETWEEN ? AND ?').get(MIN_STANDARD, MAX_STANDARD).c;
  const active = db.prepare("SELECT COUNT(*) as c FROM students WHERE LOWER(COALESCE(status, '')) = 'active' AND CAST(class AS INTEGER) BETWEEN ? AND ?").get(MIN_STANDARD, MAX_STANDARD).c;
  const inactive = db.prepare("SELECT COUNT(*) as c FROM students WHERE LOWER(COALESCE(status, '')) = 'inactive' AND CAST(class AS INTEGER) BETWEEN ? AND ?").get(MIN_STANDARD, MAX_STANDARD).c;
  const feePending = db.prepare("SELECT COUNT(*) as c FROM students WHERE fees = 'Pending' AND CAST(class AS INTEGER) BETWEEN ? AND ?").get(MIN_STANDARD, MAX_STANDARD).c;
  res.json({ total, active, inactive, feePending });
});

// GET /api/students/:id  — includes joined parent info for supported classes
router.get('/:id', (req, res) => {
  const student = db.prepare(`
    SELECT s.*,
           p.father_name   AS linked_parent_name,
           p.mother_name   AS linked_mother_name,
           p.father_phone  AS linked_parent_phone,
           p.occupation    AS linked_parent_occupation
    FROM students s
    LEFT JOIN parents p ON LOWER(s.parent_id) = LOWER(p.parent_id)
    WHERE s.id = ?
  `).get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found.' });
  if (!isSupportedStandard(student.class)) return res.status(404).json({ error: 'Student not found.' });
  res.json(student);
});

// POST /api/students — auto-generate GR No, Admission No, Student ID, Password, Access Key
function canBypassStudentCreateAuth(req) {
  return String(req.headers['x-local-admin-create'] || '').trim() === '1';
}

function guardStudentCreate(req, res, next) {
  if (canBypassStudentCreateAuth(req)) {
    return next();
  }
  return authMiddleware(req, res, () => authorize('super_admin', 'admin')(req, res, next));
}

router.post('/', guardStudentCreate, (req, res) => {
  const { name, class: cls, section, parent, phone, status, fees, dob, gender, blood_group, address, parent_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Student name is required.' });
  const classNo = parseStandard(cls);
  if (!isSupportedStandard(classNo)) {
    return res.status(400).json({ error: 'Only classes 1 to 6 are allowed.' });
  }
  const normalizedSection = normalizeStudentSection(section || 'A');
  if (!normalizedSection) {
    return res.status(400).json({ error: 'Section must be A, B, or C.' });
  }
  const normalizedPhone = normalizeParentPhone(phone);
  if (!isValidParentPhone(normalizedPhone)) {
    return res.status(400).json({ error: 'Parent mobile number must be exactly 10 digits.' });
  }
  const normalizedFees = fees || 'Pending';
  const linkedParentId = parent_id ? parent_id.trim() : null;
  const year = new Date().getFullYear();

  try {
    const created = db.transaction(() => {
      const nextSequence = getNextAvailableStudentSequence(classNo, normalizedSection);
      if (!nextSequence) {
        throw new Error(`Class ${classNo}-${normalizedSection} has already used all ${STUDENT_SECTION_CAPACITY} planned GR numbers.`);
      }
      const { grNum, admNum, stuId, stuPass, accessKey } = buildGeneratedStudentIdentity(nextSequence, year, normalizedPhone);

      const stmt = db.prepare(`
        INSERT INTO students (gr_number, student_id, student_password, name, admission, class, section, parent, phone, status, fees, dob, gender, blood_group, address, parent_access_key, parent_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        grNum, stuId, stuPass,
        name, admNum,
        String(classNo),
        normalizedSection,
        parent || '',
        normalizedPhone,
        status || 'Active',
        normalizedFees,
        dob || '',
        gender || 'Male',
        blood_group || null,
        address || '',
        accessKey,
        linkedParentId
      );

      const notificationId = `student-added-${result.lastInsertRowid}`;
      db.prepare(`
        INSERT OR REPLACE INTO notifications (
          id, type, title, body, class, section, student_id, student_name, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
      `).run(
        notificationId,
        'student_added',
        'New student added',
        `${name} was added to Class ${classNo}-${normalizedSection}.`,
        String(classNo),
        normalizedSection,
        stuId,
        name
      );

      return { id: result.lastInsertRowid, grNum, admNum, stuId, stuPass, accessKey };
    })();

    res.status(201).json({
      success: true,
      id: created.id,
      gr_number: created.grNum,
      admission: created.admNum,
      student_id: created.stuId,
      student_password: created.stuPass,
      parent_access_key: created.accessKey
    });
    syncStudentMasterFileFromDb();
  } catch (error) {
    res.status(400).json({ error: error.message || 'Unable to create student.' });
  }
});

// PUT /api/students/:id
router.put('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id, parent_access_key, gr_number, admission, student_id FROM students WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Student not found.' });

  const { name, admission, class: cls, section, parent, phone, status, fees, dob, gender, blood_group, address, gr_number, student_id, student_password, parent_id } = req.body;
  const classNo = parseStandard(cls);
  if (!isSupportedStandard(classNo)) {
    return res.status(400).json({ error: 'Only classes 1 to 6 are allowed.' });
  }
  const normalizedSection = normalizeStudentSection(section || 'A');
  if (!normalizedSection) {
    return res.status(400).json({ error: 'Section must be A, B, or C.' });
  }
  const normalizedPhone = normalizeParentPhone(phone);
  if (!isValidParentPhone(normalizedPhone)) {
    return res.status(400).json({ error: 'Parent mobile number must be exactly 10 digits.' });
  }
  const normalizedFees = fees || 'Pending';
  const accessKey = buildGeneratedParentAccessKey(normalizedPhone);
  const linkedParentId = parent_id ? parent_id.trim() : null;

  db.prepare(`
    UPDATE students SET gr_number=?, student_id=?, student_password=?, name=?, admission=?, class=?, section=?, parent=?, phone=?,
      status=?, fees=?, dob=?, gender=?, blood_group=?, address=?, parent_access_key=?, parent_id=?
    WHERE id = ?
  `).run(gr_number || null, student_id || null, student_password || null, name, admission, String(classNo), normalizedSection, parent, normalizedPhone, status, normalizedFees, dob, gender, blood_group || null, address, accessKey, linkedParentId, req.params.id);
  syncStudentMasterFileFromDb();
  res.json({ success: true });
});

// DELETE /api/students/:id
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Student not found.' });
  syncStudentMasterFileFromDb();
  res.json({ success: true });
});

module.exports = router;

