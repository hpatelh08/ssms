// =============================================
//  LEAVE REQUESTS ROUTES
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

// GET /api/leaves
router.get('/', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM leave_requests';
  let params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';

  const leaves = db.prepare(query).all(...params);
  // Map from_date/to_date → from/to for frontend
  const mapped = leaves.map(l => ({ ...l, from: l.from_date, to: l.to_date }));
  res.json({ data: mapped });
});

// GET /api/leaves/stats
router.get('/stats', (req, res) => {
  const pending = db.prepare("SELECT COUNT(*) as c FROM leave_requests WHERE status = 'Pending'").get().c;
  const approved = db.prepare("SELECT COUNT(*) as c FROM leave_requests WHERE status = 'Approved'").get().c;
  const rejected = db.prepare("SELECT COUNT(*) as c FROM leave_requests WHERE status = 'Rejected'").get().c;

  res.json({ pending, approved, rejected });
});

// POST /api/leaves
router.post('/', authMiddleware, (req, res) => {
  const { id, name, role, from, to, days, reason } = req.body;
  if (!name || !from || !to) {
    return res.status(400).json({ error: 'Name, from, and to dates are required.' });
  }

  const leaveId = id || 'LV' + Date.now();
  db.prepare(`
    INSERT INTO leave_requests (id, name, role, from_date, to_date, days, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
  `).run(leaveId, name, role || '', from, to, days || 1, reason || '');

  res.status(201).json({ success: true, id: leaveId });
});

// PUT /api/leaves/:id/approve
router.put('/:id/approve', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id FROM leave_requests WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Leave request not found.' });

  db.prepare("UPDATE leave_requests SET status = 'Approved' WHERE id = ?").run(req.params.id);
  res.json({ success: true, status: 'Approved' });
});

// PUT /api/leaves/:id/reject
router.put('/:id/reject', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id FROM leave_requests WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Leave request not found.' });

  db.prepare("UPDATE leave_requests SET status = 'Rejected' WHERE id = ?").run(req.params.id);
  res.json({ success: true, status: 'Rejected' });
});

// DELETE /api/leaves/:id
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM leave_requests WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Leave request not found.' });
  res.json({ success: true });
});

module.exports = router;
