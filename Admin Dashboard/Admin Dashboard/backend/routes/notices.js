// =============================================
//  NOTICES ROUTES — Full CRUD
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

// GET /api/notices
router.get('/', (req, res) => {
  const { search, target, urgent } = req.query;
  let where = [];
  let params = [];

  if (search) {
    where.push('(LOWER(title) LIKE ? OR LOWER(body) LIKE ?)');
    params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
  }
  if (target && target !== 'All') { where.push('target = ?'); params.push(target); }
  if (urgent !== undefined && urgent !== '') { where.push('urgent = ?'); params.push(urgent === 'true' ? 1 : 0); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const notices = db.prepare(`SELECT * FROM notices ${whereClause} ORDER BY date DESC, created_at DESC`).all(...params);

  // Map urgent integer → boolean
  const mapped = notices.map(n => ({ ...n, urgent: !!n.urgent }));
  res.json({ data: mapped });
});

// GET /api/notices/:id
router.get('/:id', (req, res) => {
  const notice = db.prepare('SELECT * FROM notices WHERE id = ?').get(req.params.id);
  if (!notice) return res.status(404).json({ error: 'Notice not found.' });
  res.json({ ...notice, urgent: !!notice.urgent });
});

// POST /api/notices
router.post('/', authorize('super_admin', 'admin'), (req, res) => {
  const { id, title, body, target, urgent, date, author } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required.' });

  const noticeId = id || 'NOT' + Date.now();
  db.prepare(`
    INSERT INTO notices (id, title, body, target, date, urgent, author)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(noticeId, title, body, target || 'All', date || new Date().toISOString().split('T')[0],
    urgent ? 1 : 0, author || 'Admin');

  res.status(201).json({ success: true, id: noticeId });
});

// PUT /api/notices/:id
router.put('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id FROM notices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Notice not found.' });

  const { title, body, target, urgent, date, author } = req.body;
  db.prepare(`
    UPDATE notices SET title=?, body=?, target=?, date=?, urgent=?, author=?
    WHERE id = ?
  `).run(title, body, target, date, urgent ? 1 : 0, author, req.params.id);
  res.json({ success: true });
});

// DELETE /api/notices/:id
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM notices WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Notice not found.' });
  res.json({ success: true });
});

module.exports = router;
