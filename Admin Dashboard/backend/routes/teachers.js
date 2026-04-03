// =============================================
//  TEACHERS ROUTES — Full CRUD
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');
const { isSupportedStandard, parseStandard } = require('../config/standards');

const router = Router();
router.use(authMiddleware);

// GET /api/teachers — list with search, filter, pagination (default 10)
router.get('/', (req, res) => {
  const { search, status, subject, page = 1, limit = 10 } = req.query;
  let where = [];
  let params = [];

  if (search) {
    where.push('(LOWER(name) LIKE ? OR LOWER(subject) LIKE ? OR LOWER(emp) LIKE ? OR LOWER(teacher_id) LIKE ?)');
    params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
  }
  if (status) { where.push('status = ?'); params.push(status); }
  if (subject) { where.push('LOWER(subject) LIKE ?'); params.push(`%${subject.toLowerCase()}%`); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const totalRecords = db.prepare(`SELECT COUNT(*) as count FROM teachers ${whereClause}`).get(...params).count;
  const totalPages = Math.ceil(totalRecords / parseInt(limit));
  const teachers = db.prepare(`SELECT * FROM teachers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, parseInt(limit), offset);

  // Map join_date -> join for frontend compat
  const mapped = teachers.map(t => ({ ...t, join: t.join_date }));
  res.json({ totalRecords, totalPages, currentPage: parseInt(page), data: mapped });
});

// GET /api/teachers/counts — dynamic counts for stat cards
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

// POST /api/teachers — auto-generate EMP ID, Teacher ID, Password
router.post('/', authorize('super_admin', 'admin'), (req, res) => {
  const { name, subject, class: cls, division, salary, phone, email, status, qualification, join } = req.body;
  if (!name) return res.status(400).json({ error: 'Teacher name is required.' });
  const classNo = parseStandard(cls);
  if (classNo !== null && !isSupportedStandard(classNo)) {
    return res.status(400).json({ error: 'Teacher class assignment must be between 1 and 6.' });
  }
  const normalizedDivision = String(division || '').trim().toUpperCase() || String(cls || '').trim().match(/([A-Za-z])$/)?.[1]?.toUpperCase() || '';

  // Auto-generate EMP ID (EMP-001, EMP-002, …)
  const maxEmpRow = db.prepare("SELECT MAX(CAST(SUBSTR(emp, 5) AS INTEGER)) as n FROM teachers WHERE emp LIKE 'EMP-%'").get();
  const empId = `EMP-${String((maxEmpRow.n || 0) + 1).padStart(3, '0')}`;

  // Auto-generate Teacher ID (TCH{YYYY}{NNN})
  const year = new Date().getFullYear();
  const maxTchRow = db.prepare("SELECT MAX(CAST(SUBSTR(teacher_id, 8) AS INTEGER)) as n FROM teachers WHERE teacher_id LIKE 'TCH%'").get();
  const tchId = `TCH${year}${String((maxTchRow.n || 0) + 1).padStart(3, '0')}`;

  // Auto-generate Password (Tch@NNNN)
  const tchPass = `Tch@${Math.floor(1000 + Math.random() * 9000)}`;

  // Default join date = today
  const joinDate = join || new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    INSERT INTO teachers (name, emp, subject, class, division, salary, phone, email, status, qualification, join_date, teacher_id, teacher_password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, empId, subject || '', cls || '', normalizedDivision, salary || 0, phone || '',
    email || '', status || 'Active', qualification || '', joinDate, tchId, tchPass);

  res.status(201).json({ success: true, id: result.lastInsertRowid, emp: empId, teacher_id: tchId, teacher_password: tchPass });
});

// PUT /api/teachers/:id
router.put('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id FROM teachers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Teacher not found.' });

  const { name, emp, subject, class: cls, division, salary, phone, email, status, qualification, join, teacher_id, teacher_password } = req.body;
  const classNo = parseStandard(cls);
  if (classNo !== null && !isSupportedStandard(classNo)) {
    return res.status(400).json({ error: 'Teacher class assignment must be between 1 and 6.' });
  }
  const normalizedDivision = String(division || '').trim().toUpperCase() || String(cls || '').trim().match(/([A-Za-z])$/)?.[1]?.toUpperCase() || '';
  const stmt = db.prepare(`
    UPDATE teachers SET name=?, emp=?, subject=?, class=?, division=?, salary=?, phone=?,
      email=?, status=?, qualification=?, join_date=?, teacher_id=?, teacher_password=?
    WHERE id = ?
  `);
  stmt.run(name, emp, subject, cls, normalizedDivision, salary, phone, email, status, qualification, join, teacher_id || null, teacher_password || null, req.params.id);
  res.json({ success: true });
});

// DELETE /api/teachers/:id
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM teachers WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Teacher not found.' });
  res.json({ success: true });
});

module.exports = router;
