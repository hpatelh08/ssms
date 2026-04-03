// =============================================
//  HR STAFF ROUTES — Full CRUD
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

// GET /api/staff
router.get('/', (req, res) => {
  const { search, dept } = req.query;
  let where = [];
  let params = [];

  if (search) {
    where.push('(LOWER(name) LIKE ? OR LOWER(role) LIKE ?)');
    params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
  }
  if (dept) { where.push('dept = ?'); params.push(dept); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const staff = db.prepare(`SELECT * FROM staff ${whereClause} ORDER BY created_at DESC`).all(...params);

  // Map leave_days → leave, join_date → join
  const mapped = staff.map(s => ({ ...s, leave: s.leave_days, join: s.join_date }));
  res.json({ data: mapped });
});

// GET /api/staff/stats
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM staff').get().c;
  const active = db.prepare("SELECT COUNT(*) as c FROM staff WHERE status = 'Active'").get().c;
  const teaching = db.prepare("SELECT COUNT(*) as c FROM staff WHERE dept = 'Teaching'").get().c;
  const support = db.prepare("SELECT COUNT(*) as c FROM staff WHERE dept NOT IN ('Teaching','Administration')").get().c;

  res.json({ total, active, teaching, support });
});

// GET /api/staff/salary-stats
router.get('/salary-stats', (req, res) => {
  const totalPayroll = db.prepare('SELECT COALESCE(SUM(salary),0) as val FROM staff').get().val;
  const count = db.prepare('SELECT COUNT(*) as c FROM staff').get().c;
  const avgSalary = count > 0 ? Math.round(totalPayroll / count) : 0;
  const highest = db.prepare('SELECT MAX(salary) as val FROM staff').get().val || 0;

  res.json({ totalPayroll, avgSalary, highest });
});

// GET /api/staff/:id
router.get('/:id', (req, res) => {
  const s = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Staff not found.' });
  res.json({ ...s, leave: s.leave_days, join: s.join_date });
});

// POST /api/staff
router.post('/', authorize('super_admin', 'admin'), (req, res) => {
  const { id, name, dept, role, salary, status, join } = req.body;
  if (!name) return res.status(400).json({ error: 'Staff name is required.' });

  const staffId = id || 'HR' + Date.now();
  db.prepare(`
    INSERT INTO staff (id, name, dept, role, salary, status, leave_days, join_date)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(staffId, name, dept || 'Teaching', role || '', salary || 0, status || 'Active', join || '');

  res.status(201).json({ success: true, id: staffId });
});

// PUT /api/staff/:id
router.put('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id FROM staff WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Staff not found.' });

  const { name, dept, role, salary, status, join } = req.body;
  db.prepare(`
    UPDATE staff SET name=?, dept=?, role=?, salary=?, status=?, join_date=?
    WHERE id = ?
  `).run(name, dept, role, salary, status, join, req.params.id);
  res.json({ success: true });
});

// DELETE /api/staff/:id
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Staff not found.' });
  res.json({ success: true });
});

module.exports = router;
