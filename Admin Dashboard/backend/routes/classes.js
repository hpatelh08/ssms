// =============================================
//  CLASSES ROUTES
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');
const { isSupportedStandard, parseStandard } = require('../config/standards');

const router = Router();
router.use(authMiddleware);

// GET /api/classes
router.get('/', (req, res) => {
  const classes = db.prepare('SELECT * FROM classes ORDER BY id').all()
    .filter((item) => isSupportedStandard(parseStandard(item.name)));
  res.json({ data: classes });
});

// GET /api/classes/:id
router.get('/:id', (req, res) => {
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!cls || !isSupportedStandard(parseStandard(cls.name))) return res.status(404).json({ error: 'Class not found.' });
  res.json(cls);
});

// POST /api/classes
router.post('/', authorize('super_admin', 'admin'), (req, res) => {
  const { id, name, teacher, students, room } = req.body;
  if (!name) return res.status(400).json({ error: 'Class name is required.' });
  if (!isSupportedStandard(parseStandard(name))) {
    return res.status(400).json({ error: 'Only classes 1 to 6 are allowed.' });
  }

  const classId = id || 'CLS' + Date.now();
  db.prepare('INSERT INTO classes (id, name, teacher, students, room) VALUES (?, ?, ?, ?, ?)')
    .run(classId, name, teacher || '', students || 0, room || '');

  res.status(201).json({ success: true, id: classId });
});

// PUT /api/classes/:id
router.put('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id FROM classes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Class not found.' });

  const { name, teacher, students, room } = req.body;
  if (!isSupportedStandard(parseStandard(name))) {
    return res.status(400).json({ error: 'Only classes 1 to 6 are allowed.' });
  }
  db.prepare('UPDATE classes SET name=?, teacher=?, students=?, room=? WHERE id=?')
    .run(name, teacher, students, room, req.params.id);
  res.json({ success: true });
});

// DELETE /api/classes/:id
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Class not found.' });
  res.json({ success: true });
});

module.exports = router;
