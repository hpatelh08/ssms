// =============================================
//  MARKS ROUTES — flexible per-subject marks
//  Subjects vary by standard (primary vs upper)
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

// Subject lists matching timetable.js SUBJECTS_BY_STD
const PRIMARY_SUBJ = ['English','Mathematics','EVS','Gujarati','Hindi','Drawing','PT','Moral Science','GK'];
const UPPER_SUBJ   = ['Mathematics','Science','Social Science','English','Hindi','Gujarati','Sanskrit','Computer','PT','Drawing'];

function subjectListForClass(cls) {
  return parseInt(cls) <= 5 ? PRIMARY_SUBJ : UPPER_SUBJ;
}

function calcGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}

// GET /api/marks?class=X&exam_type=Y&section=Z
// Returns marks grouped by student (only students with at least one saved mark)
router.get('/', (req, res) => {
  const { class: cls, exam_type, section } = req.query;

  const where = ['1=1'];
  const params = [];
  if (cls)       { where.push('CAST(m.class AS INTEGER) = ?'); params.push(parseInt(cls)); }
  if (exam_type) { where.push('m.exam_type = ?');              params.push(exam_type); }
  if (section)   { where.push("UPPER(COALESCE(s.section,'')) = ?"); params.push(section.toUpperCase()); }

  const rows = db.prepare(`
    SELECT m.student, m.class, m.exam_type, m.subject, m.marks,
           COALESCE(s.gr_number,'') AS roll,
           COALESCE(s.section,'')  AS section
    FROM marks m
    LEFT JOIN students s
      ON LOWER(s.name) = LOWER(m.student)
      AND CAST(s.class AS INTEGER) = CAST(m.class AS INTEGER)
    WHERE ${where.join(' AND ')}
    ORDER BY CAST(m.class AS INTEGER), COALESCE(s.section,''), m.student
  `).all(...params);

  // Group by student + class + exam_type
  const groupMap = new Map();
  for (const row of rows) {
    const k = `${row.student.toLowerCase()}|${row.class}|${row.exam_type}`;
    if (!groupMap.has(k)) {
      groupMap.set(k, {
        student:   row.student,
        class:     row.class,
        exam_type: row.exam_type,
        roll:      row.roll,
        section:   row.section,
        marks:     {}
      });
    }
    groupMap.get(k).marks[row.subject] = row.marks;
  }

  const data = [...groupMap.values()].map(entry => {
    const subjList = subjectListForClass(entry.class);
    const maxTotal = subjList.length * 100;
    const total    = subjList.reduce((sum, s) => sum + (entry.marks[s] || 0), 0);
    const pct      = parseFloat((total / maxTotal * 100).toFixed(1));
    return { ...entry, total, maxTotal, percent: String(pct), grade: calcGrade(pct) };
  });

  res.json({ data });
});

// POST /api/marks/bulk
// body: { class, exam_type, students: [{ student, roll, marks: { "Mathematics": 85, ... } }] }
router.post('/bulk', authorize('super_admin', 'admin', 'teacher'), (req, res) => {
  const { students, class: cls, exam_type } = req.body;

  if (!students || !Array.isArray(students) || !students.length)
    return res.status(400).json({ error: 'students array is required.' });
  if (!cls)
    return res.status(400).json({ error: 'class is required.' });
  if (!exam_type || !['midterm', 'annual'].includes(exam_type))
    return res.status(400).json({ error: 'exam_type must be "midterm" or "annual".' });

  const upsert = db.prepare(`
    INSERT INTO marks (student, class, exam_type, subject, marks)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(student, class, exam_type, subject) DO UPDATE SET marks = excluded.marks
  `);

  let count = 0;
  const tx = db.transaction((items) => {
    for (const s of items) {
      if (!s.student || !s.marks || typeof s.marks !== 'object') continue;
      for (const [subject, marksVal] of Object.entries(s.marks)) {
        const m = Math.min(100, Math.max(0, parseInt(marksVal) || 0));
        upsert.run(s.student, String(cls), exam_type, subject, m);
        count++;
      }
    }
  });
  tx(students);

  res.json({ success: true, count, class: cls, exam_type });
});

module.exports = router;
