// =============================================
//  EXAMS ROUTES — Full CRUD
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

function normalizeClassValue(value) {
  return String(value || '').trim();
}

function isSupportedClass(value) {
  const classNumber = parseInt(normalizeClassValue(value), 10);
  return Number.isInteger(classNumber) && classNumber >= 1 && classNumber <= 8;
}

// GET /api/exams
router.get('/', (req, res) => {
  const { class: cls, status } = req.query;
  let where = [];
  let params = [];

  if (cls) {
    if (!isSupportedClass(cls)) return res.json({ data: [] });
    where.push('CAST(class AS INTEGER) = ?');
    params.push(parseInt(normalizeClassValue(cls), 10));
  } else {
    where.push('CAST(class AS INTEGER) BETWEEN 1 AND 8');
  }
  if (status) { where.push('status = ?'); params.push(status); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const exams = db.prepare(`SELECT * FROM exams ${whereClause} ORDER BY date DESC`).all(...params);

  // Map max_marks → maxMarks for frontend
  const mapped = exams.map(e => ({ ...e, maxMarks: e.max_marks }));
  res.json({ data: mapped });
});

// GET /api/exams/:id
router.get('/:id', (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found.' });
  res.json({ ...exam, maxMarks: exam.max_marks });
});

// POST /api/exams
router.post('/', authorize('super_admin', 'admin'), (req, res) => {
  const { id, name, class: cls, subject, date, duration, maxMarks, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Exam name is required.' });
  if (!isSupportedClass(cls)) return res.status(400).json({ error: 'Only classes 1 to 8 are allowed.' });

  const examId = id || 'EXM' + Date.now();
  db.prepare(`
    INSERT INTO exams (id, name, class, subject, date, duration, max_marks, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(examId, name, normalizeClassValue(cls), subject || '', date || '', duration || '', maxMarks || 100, status || 'Scheduled');

  res.status(201).json({ success: true, id: examId });
});

// PUT /api/exams/:id
router.put('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id FROM exams WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Exam not found.' });

  const { name, class: cls, subject, date, duration, maxMarks, status } = req.body;
  if (!isSupportedClass(cls)) return res.status(400).json({ error: 'Only classes 1 to 8 are allowed.' });
  db.prepare(`
    UPDATE exams SET name=?, class=?, subject=?, date=?, duration=?, max_marks=?, status=?
    WHERE id = ?
  `).run(name, normalizeClassValue(cls), subject, date, duration, maxMarks, status, req.params.id);
  res.json({ success: true });
});

// DELETE /api/exams/:id
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Exam not found.' });
  res.json({ success: true });
});

module.exports = router;
