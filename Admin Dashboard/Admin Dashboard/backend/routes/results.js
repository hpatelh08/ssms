// =============================================
//  RESULTS ROUTES — CRUD + marks entry
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

// GET /api/results
router.get('/', (req, res) => {
  const { search, grade, class: cls, exam_type, section } = req.query;
  let where = [];
  let params = [];

  if (cls)       { where.push('CAST(r.class AS INTEGER) = ?'); params.push(parseInt(cls)); }
  if (exam_type) { where.push('r.exam_type = ?');              params.push(exam_type); }
  if (search) {
    where.push('LOWER(r.student) LIKE ?');
    params.push(`%${search.toLowerCase()}%`);
  }
  if (grade)   { where.push('r.grade = ?');          params.push(grade); }
  if (section) { where.push('UPPER(s.section) = ?'); params.push(section.toUpperCase()); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const results = db.prepare(`
    SELECT r.*, COALESCE(s.section,'') AS section
    FROM results r
    LEFT JOIN students s ON LOWER(s.name) = LOWER(r.student) AND CAST(s.class AS INTEGER) = CAST(r.class AS INTEGER)
    ${whereClause}
    ORDER BY CAST(r.class AS INTEGER), UPPER(COALESCE(s.section,'')), r.roll
  `).all(...params);
  res.json({ data: results });
});

// GET /api/results/:id
router.get('/:id', (req, res) => {
  const result = db.prepare('SELECT * FROM results WHERE id = ?').get(req.params.id);
  if (!result) return res.status(404).json({ error: 'Result not found.' });
  res.json(result);
});

// POST /api/results
router.post('/', authorize('super_admin', 'admin', 'teacher'), (req, res) => {
  const { student, roll, math, sci, eng, hin, ss } = req.body;
  if (!student) return res.status(400).json({ error: 'Student name is required.' });

  const m = parseInt(math) || 0;
  const s = parseInt(sci) || 0;
  const e = parseInt(eng) || 0;
  const h = parseInt(hin) || 0;
  const so = parseInt(ss) || 0;
  const total = m + s + e + h + so;
  const pct = (total / 500 * 100).toFixed(1);
  const grade = calcGrade(parseFloat(pct));

  const stmt = db.prepare(`
    INSERT INTO results (student, roll, math, sci, eng, hin, ss, total, grade, percent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(student, roll || '', m, s, e, h, so, total, grade, pct);
  res.status(201).json({ success: true, id: info.lastInsertRowid });
});

// PUT /api/results/:id
router.put('/:id', authorize('super_admin', 'admin', 'teacher'), (req, res) => {
  const existing = db.prepare('SELECT id FROM results WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Result not found.' });

  const { student, roll, math, sci, eng, hin, ss } = req.body;
  const m = parseInt(math) || 0;
  const s = parseInt(sci) || 0;
  const e = parseInt(eng) || 0;
  const h = parseInt(hin) || 0;
  const so = parseInt(ss) || 0;
  const total = m + s + e + h + so;
  const pct = (total / 500 * 100).toFixed(1);
  const grade = calcGrade(parseFloat(pct));

  db.prepare(`
    UPDATE results SET student=?, roll=?, math=?, sci=?, eng=?, hin=?, ss=?, total=?, grade=?, percent=?
    WHERE id = ?
  `).run(student, roll, m, s, e, h, so, total, grade, pct, req.params.id);
  res.json({ success: true });
});

// POST /api/results/bulk — save all marks for a class+exam_type at once
router.post('/bulk', authorize('super_admin', 'admin', 'teacher'), (req, res) => {
  const { results, class: cls, exam_type } = req.body;
  if (!results || !Array.isArray(results) || !results.length)
    return res.status(400).json({ error: 'Results array is required.' });
  if (!cls)
    return res.status(400).json({ error: 'Class is required.' });
  if (!exam_type || !['midterm','annual'].includes(exam_type))
    return res.status(400).json({ error: 'exam_type must be "midterm" or "annual".' });

  // Upsert: match by student name + class + exam_type
  const upsert = db.prepare(`
    INSERT INTO results (student, class, exam_type, roll, math, sci, eng, hin, ss, total, grade, percent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(student, class, exam_type) DO UPDATE SET
      roll=excluded.roll, math=excluded.math, sci=excluded.sci, eng=excluded.eng,
      hin=excluded.hin, ss=excluded.ss, total=excluded.total, grade=excluded.grade, percent=excluded.percent
  `);

  const tx = db.transaction((items) => {
    for (const r of items) {
      const m = parseInt(r.math) || 0, s = parseInt(r.sci) || 0, e = parseInt(r.eng) || 0;
      const h = parseInt(r.hin) || 0, so = parseInt(r.ss) || 0;
      const total = m + s + e + h + so;
      const pct = (total / 500 * 100).toFixed(1);
      const grade = calcGrade(parseFloat(pct));
      upsert.run(r.student, String(cls), exam_type, r.roll || '', m, s, e, h, so, total, grade, pct);
    }
  });
  tx(results);
  res.json({ success: true, count: results.length, class: cls, exam_type });
});

// DELETE /api/results/:id
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM results WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Result not found.' });
  res.json({ success: true });
});

function calcGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

module.exports = router;
