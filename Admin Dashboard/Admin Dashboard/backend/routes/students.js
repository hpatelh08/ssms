// =============================================
//  STUDENTS ROUTES — Full CRUD
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();

// POST /api/students/access-key-login — Public: Parent login for class 1-7
// Body: { student_id, access_key }
const jwt = require('jsonwebtoken');
router.post('/access-key-login', (req, res) => {
  const { student_id, access_key } = req.body;
  if (!student_id || !access_key) {
    return res.status(400).json({ error: 'Student ID and Access Key are required.' });
  }
  const student = db.prepare('SELECT * FROM students WHERE LOWER(student_id) = LOWER(?)').get(student_id.trim());
  if (!student) return res.status(401).json({ error: 'Invalid Student ID or Access Key.' });

  const cls = parseInt(String(student.class || '').match(/\d+/)?.[0] || '0', 10);
  if (cls < 1 || cls > 7) {
    return res.status(403).json({ error: 'Access Key login is only for Class 1–7 students.' });
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
  res.json({
    success: true,
    token,
    user: { id: `par_stu_${student.id}`, role: 'parent', name: student.parent || 'Parent', student_id: student.student_id }
  });
});

router.use(authMiddleware);

// GET /api/students — list with search, filter, pagination
// Supports: search, class (e.g. "10" or "10A"), status, page, limit (default 10)
router.get('/', (req, res) => {
  const { search, class: cls, status, page = 1, limit = 10 } = req.query;
  let where = [];
  let params = [];

  if (search) {
    where.push('(LOWER(name) LIKE ? OR LOWER(admission) LIKE ? OR LOWER(gr_number) LIKE ? OR LOWER(student_id) LIKE ?)');
    params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
  }
  if (cls) {
    // Support combined class+section filter like "10A" → class=10, section=A
    const match = cls.match(/^(\d+)([A-Za-z])?$/);
    if (match) {
      where.push('class = ?');
      params.push(match[1]);
      if (match[2]) {
        where.push('UPPER(section) = ?');
        params.push(match[2].toUpperCase());
      }
    }
  }
  if (status) { where.push('status = ?'); params.push(status); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const totalRecords = db.prepare(`SELECT COUNT(*) as count FROM students ${whereClause}`).get(...params).count;
  const totalPages = Math.ceil(totalRecords / parseInt(limit));
  const students = db.prepare(`SELECT * FROM students ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, parseInt(limit), offset);

  res.json({ totalRecords, totalPages, currentPage: parseInt(page), data: students });
});

// GET /api/students/counts — dynamic counts for stat cards
router.get('/counts', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
  const active = db.prepare("SELECT COUNT(*) as c FROM students WHERE status = 'Active'").get().c;
  const inactive = db.prepare("SELECT COUNT(*) as c FROM students WHERE status = 'Inactive'").get().c;
  const feePending = db.prepare("SELECT COUNT(*) as c FROM students WHERE fees = 'Pending' AND CAST(class AS INTEGER) >= 9").get().c;
  res.json({ total, active, inactive, feePending });
});

// GET /api/students/:id  — includes joined parent info for class 8-10
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
  res.json(student);
});

// POST /api/students — auto-generate GR No, Admission No, Student ID, Password
router.post('/', authorize('super_admin', 'admin'), (req, res) => {
  const { name, class: cls, section, parent, phone, status, fees, dob, gender, blood_group, address, parent_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Student name is required.' });
  const classNo = parseInt(String(cls || '').match(/\d+/)?.[0] || '0', 10);
  const normalizedFees = classNo >= 9 ? (fees || 'Pending') : 'Paid';
  // Access key: last 4 digits of phone, only for class 1–7
  const accessKey = (classNo >= 1 && classNo <= 7 && phone)
    ? String(phone).replace(/\D/g, '').slice(-4)
    : null;
  // For class 8-10 parent_id may come from body; for class 1-7 it should be null
  const linkedParentId = (classNo >= 8 && parent_id) ? parent_id.trim() : null;
  const year = new Date().getFullYear();

  // Generate all IDs sequentially from the next row index.
  const created = db.transaction(() => {
    const nextId = db.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS n FROM students').get().n;
    const grNum = `GR-${String(nextId).padStart(3, '0')}`;
    const admNum = `ADM-${year}-${String(nextId).padStart(3, '0')}`;
    const stuId = `STU${String(nextId).padStart(5, '0')}`;
    const stuPass = `SCH@${nextId}`;

    const stmt = db.prepare(`
      INSERT INTO students (gr_number, student_id, student_password, name, admission, class, section, parent, phone, status, fees, dob, gender, blood_group, address, parent_access_key, parent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      grNum, stuId, stuPass,
      name, admNum,
      cls || '',
      section || 'A',
      parent || '',
      phone || '',
      status || 'Active',
      normalizedFees,
      dob || '',
      gender || 'Male',
      blood_group || null,
      address || '',
      accessKey,
      linkedParentId
    );

    return { id: result.lastInsertRowid, grNum, admNum, stuId, stuPass };
  })();

  res.status(201).json({
    success: true,
    id: created.id,
    gr_number: created.grNum,
    admission: created.admNum,
    student_id: created.stuId,
    student_password: created.stuPass
  });
});

// PUT /api/students/:id
router.put('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id FROM students WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Student not found.' });

  const { name, admission, class: cls, section, parent, phone, status, fees, dob, gender, blood_group, address, gr_number, student_id, student_password, parent_id } = req.body;
  const classNo = parseInt(String(cls || '').match(/\d+/)?.[0] || '0', 10);
  const normalizedFees = classNo >= 9 ? (fees || 'Pending') : 'Paid';
  const accessKey = (classNo >= 1 && classNo <= 7 && phone)
    ? String(phone).replace(/\D/g, '').slice(-4)
    : null;
  // Keep parent_id only for class 8-10; clear it for class 1-7
  const linkedParentId = (classNo >= 8 && parent_id) ? parent_id.trim() : null;

  db.prepare(`
    UPDATE students SET gr_number=?, student_id=?, student_password=?, name=?, admission=?, class=?, section=?, parent=?, phone=?,
      status=?, fees=?, dob=?, gender=?, blood_group=?, address=?, parent_access_key=?, parent_id=?
    WHERE id = ?
  `).run(gr_number || null, student_id || null, student_password || null, name, admission, cls, section, parent, phone, status, normalizedFees, dob, gender, blood_group || null, address, accessKey, linkedParentId, req.params.id);
  res.json({ success: true });
});

// DELETE /api/students/:id
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Student not found.' });
  res.json({ success: true });
});

module.exports = router;

