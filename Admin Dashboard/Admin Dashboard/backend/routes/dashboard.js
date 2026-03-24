// =============================================
//  DASHBOARD ROUTES — Stats & Chart Data
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

const FEE_CLASS_SQL = "(CASE WHEN instr(cls,'-') > 0 THEN CAST(substr(cls,1,instr(cls,'-')-1) AS INTEGER) ELSE CAST(cls AS INTEGER) END)";
const NORMALIZED_FEE_AMOUNT_SQL = "CASE WHEN COALESCE(amount,0) < 0 THEN 0 ELSE COALESCE(amount,0) END";
const NORMALIZED_FEE_PAID_SQL = `CASE
  WHEN COALESCE(paid,0) < 0 THEN 0
  WHEN COALESCE(paid,0) > ${NORMALIZED_FEE_AMOUNT_SQL} THEN ${NORMALIZED_FEE_AMOUNT_SQL}
  ELSE COALESCE(paid,0)
END`;
const NORMALIZED_FEE_DUE_SQL = `CASE
  WHEN (${NORMALIZED_FEE_AMOUNT_SQL} - (${NORMALIZED_FEE_PAID_SQL})) > 0 THEN (${NORMALIZED_FEE_AMOUNT_SQL} - (${NORMALIZED_FEE_PAID_SQL}))
  ELSE 0
END`;
const NORMALIZED_FEE_STATUS_SQL = `CASE
  WHEN ${NORMALIZED_FEE_DUE_SQL} = 0 THEN 'Paid'
  WHEN ${NORMALIZED_FEE_PAID_SQL} = 0 THEN 'Pending'
  ELSE 'Partial'
END`;

// GET /api/dashboard/stats — main dashboard KPIs (always live from tables)
router.get('/stats', (req, res) => {
  const totalStudents   = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
  const totalTeachers   = db.prepare('SELECT COUNT(*) as c FROM teachers').get().c;
  const totalClasses    = db.prepare('SELECT COUNT(*) as c FROM classes').get().c;
  const activeStudents  = db.prepare("SELECT COUNT(*) as c FROM students WHERE status = 'Active'").get().c;
  const newAdmissions   = db.prepare("SELECT COUNT(*) as c FROM students WHERE created_at >= date('now','start of month')").get().c;
  const newTeachers     = db.prepare("SELECT COUNT(*) as c FROM teachers WHERE created_at >= date('now','start of month')").get().c;

  // Unique sections across all classes
  const sections        = db.prepare("SELECT COUNT(DISTINCT section) as c FROM students WHERE section IS NOT NULL AND section != ''").get().c;
  const sectionNames    = db.prepare("SELECT DISTINCT section FROM students WHERE section IS NOT NULL AND section != '' ORDER BY section").all().map(r => r.section);

  // Today's attendance
  const today           = new Date().toISOString().slice(0, 10);
  const yesterday       = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const todayRows       = db.prepare("SELECT COUNT(*) as t, SUM(CASE WHEN status='P' THEN 1 ELSE 0 END) as p FROM attendance WHERE date=? AND person_type='student'").get(today);
  const yestRows        = db.prepare("SELECT COUNT(*) as t, SUM(CASE WHEN status='P' THEN 1 ELSE 0 END) as p FROM attendance WHERE date=? AND person_type='student'").get(yesterday);
  const todayPct        = todayRows.t   > 0 ? Math.round(todayRows.p   / todayRows.t   * 1000) / 10 : null;
  const yestPct         = yestRows.t    > 0 ? Math.round(yestRows.p    / yestRows.t    * 1000) / 10 : null;

  // Fall back: overall attendance across all records
  const attRecords      = db.prepare('SELECT COUNT(*) as total FROM attendance').get().total;
  const attPresent      = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE status = 'P'").get().c;
  const attendancePercent = todayPct != null ? todayPct
    : (attRecords > 0 ? Math.round(attPresent / attRecords * 1000) / 10 : 0);

  // Fees — read directly from fees table (same source as Fee Management page)
  const pendingFees          = db.prepare(`SELECT COALESCE(SUM(${NORMALIZED_FEE_DUE_SQL}),0) AS val  FROM fees WHERE ${FEE_CLASS_SQL} >= 9`).get().val;
  const totalRevenue         = db.prepare(`SELECT COALESCE(SUM(${NORMALIZED_FEE_PAID_SQL}),0) AS val FROM fees WHERE ${FEE_CLASS_SQL} >= 9`).get().val;
  const pendingStudentsCount = db.prepare(`SELECT COUNT(*) AS c FROM fees WHERE ${FEE_CLASS_SQL} >= 9 AND ${NORMALIZED_FEE_STATUS_SQL} = 'Pending'`).get().c;

  // Exams
  const upcomingExams  = db.prepare("SELECT COUNT(*) as c FROM exams WHERE status IN ('Scheduled','Upcoming')").get().c;
  const nextExamRow    = db.prepare("SELECT name, date FROM exams WHERE status IN ('Scheduled','Upcoming') AND date IS NOT NULL AND date != '' ORDER BY date ASC LIMIT 1").get();
  const nextExamName   = nextExamRow ? nextExamRow.name : null;
  const nextExamDate   = nextExamRow ? nextExamRow.date : null;

  res.json({
    totalStudents, totalTeachers, totalClasses, attendancePercent,
    pendingFees, upcomingExams, totalRevenue, newAdmissions, activeStudents,
    newTeachers, sections, sectionNames,
    todayPct, yestPct,
    pendingStudentsCount, nextExamName, nextExamDate
  });
});

// GET /api/dashboard/monthly-attendance — chart data
router.get('/monthly-attendance', (req, res) => {
  const rows = db.prepare('SELECT month, percent FROM monthly_attendance ORDER BY id').all();
  const months = rows.map(r => r.month);
  const attendance_percent = rows.map(r => r.percent);
  res.json({ months, attendance_percent, data: rows });
});

// GET /api/dashboard/fee-summary — counts directly from fees table (class 9-10 only)
router.get('/fee-summary', (req, res) => {
  const row = db.prepare(`
    SELECT
      COUNT(CASE WHEN ${NORMALIZED_FEE_STATUS_SQL} = 'Paid'    THEN 1 END) AS paid,
      COUNT(CASE WHEN ${NORMALIZED_FEE_STATUS_SQL} = 'Partial' THEN 1 END) AS partial,
      COUNT(CASE WHEN ${NORMALIZED_FEE_STATUS_SQL} = 'Pending' THEN 1 END) AS pending,
      COUNT(*) AS total
    FROM fees
    WHERE ${FEE_CLASS_SQL} >= 9
  `).get();
  res.json(row);
});

// GET /api/dashboard/class-fee-summary — class-wise collection % based on actual payments
router.get('/class-fee-summary', (req, res) => {
  const rows = db.prepare(`
    SELECT 
      s.class,
      COUNT(DISTINCT s.id) as total_students,
      COUNT(CASE WHEN COALESCE(sp.paid_sum, 0) >= fs.total AND fs.total > 0 THEN 1 END) AS paid_count,
      ROUND(
        (COUNT(CASE WHEN COALESCE(sp.paid_sum, 0) >= fs.total AND fs.total > 0 THEN 1 END) * 100.0) / COUNT(DISTINCT s.id)
      ) AS percentage,
      ROUND(COALESCE(SUM(CASE WHEN COALESCE(sp.paid_sum, 0) > fs.total THEN fs.total ELSE COALESCE(sp.paid_sum, 0) END), 0)) as collected_amount,
      ROUND(SUM(fs.total)) as total_amount
    FROM students s
    JOIN fee_structure fs ON CAST(s.class AS INTEGER) = fs.class
    LEFT JOIN (
      SELECT LOWER(TRIM(student)) AS sname, SUM(paid) AS paid_sum
      FROM fees
      GROUP BY LOWER(TRIM(student))
    ) sp ON LOWER(TRIM(s.name)) = sp.sname
    WHERE CAST(s.class AS INTEGER) >= 9
      AND fs.total > 0
    GROUP BY s.class
    ORDER BY CAST(s.class AS INTEGER) DESC
  `).all();
  res.json(rows);
});

// GET /api/dashboard/fee-collection — chart data
router.get('/fee-collection', (req, res) => {
  const last = parseInt(req.query.last) || 100;
  const rows = db.prepare('SELECT month, collected FROM fee_collection ORDER BY id').all().slice(-last);
  const months = rows.map(r => r.month);
  const amount_collected = rows.map(r => r.collected);
  res.json({ months, amount_collected, data: rows });
});

// GET /api/dashboard/class-marks-progress — Std 1–10 class-wise performance
router.get('/class-marks-progress', (req, res) => {
  const TARGET = 85;

  // Check table exists
  const tableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='results'"
  ).get();
  if (!tableExists) {
    return res.json({ overall: 0, target: TARGET, hasData: false, classes: [] });
  }

  // Try class-aware query: join results with students on name
  let classes = [];
  try {
    classes = db.prepare(`
      SELECT
        CAST(s.class AS INTEGER)                    AS class_no,
        ROUND(AVG(CAST(r.percent AS REAL)), 1)      AS percentage,
        COUNT(r.id)                                 AS total_students,
        ROUND(MAX(CAST(r.percent AS REAL)), 1)      AS highest,
        ROUND(MIN(CAST(r.percent AS REAL)), 1)      AS lowest
      FROM results r
      JOIN students s
        ON LOWER(TRIM(r.student)) = LOWER(TRIM(s.name))
      WHERE CAST(s.class AS INTEGER) BETWEEN 1 AND 10
      GROUP BY CAST(s.class AS INTEGER)
      ORDER BY CAST(s.class AS INTEGER)
    `).all();
  } catch (_) {}

  // Fallback: if results have a class column populated, use that
  if (!classes.length) {
    try {
      classes = db.prepare(`
        SELECT
          CAST(class AS INTEGER)                      AS class_no,
          ROUND(AVG(CAST(percent AS REAL)), 1)        AS percentage,
          COUNT(id)                                   AS total_students,
          ROUND(MAX(CAST(percent AS REAL)), 1)        AS highest,
          ROUND(MIN(CAST(percent AS REAL)), 1)        AS lowest
        FROM results
        WHERE class IS NOT NULL AND CAST(class AS INTEGER) BETWEEN 1 AND 10
        GROUP BY CAST(class AS INTEGER)
        ORDER BY CAST(class AS INTEGER)
      `).all();
    } catch (_) {}
  }

  const hasData = classes.length > 0;

  // Map to labelled objects
  const classesOut = classes.map(c => ({
    class_no:       c.class_no,
    label:          `Std ${c.class_no}`,
    percentage:     parseFloat(c.percentage) || 0,
    total_students: c.total_students || 0,
    highest:        parseFloat(c.highest)    || 0,
    lowest:         parseFloat(c.lowest)     || 0
  }));

  // Overall = average of class averages (or 0)
  const overall = hasData
    ? Math.round(classesOut.reduce((s, c) => s + c.percentage, 0) / classesOut.length)
    : 0;

  res.json({ overall, target: TARGET, hasData, classes: classesOut });
});

// GET /api/dashboard/attendance-heatmap — daily attendance for academic year heatmap
router.get('/attendance-heatmap', (req, res) => {
  const type = ['student', 'teacher'].includes(req.query.type) ? req.query.type : 'student';
  // Academic year: July → June (e.g. 2025-26 = Jul 2025 – Jun 2026)
  const now = new Date();
  const cm  = now.getMonth() + 1; // 1-12
  const ay1 = cm >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const ay2 = ay1 + 1;
  const fromDate = ay1 + '-07-01';
  const toDate   = ay2 + '-06-30';
  const rows = db.prepare(`
    SELECT
      date,
      COUNT(*)                                          AS total,
      SUM(CASE WHEN status = 'P' THEN 1 ELSE 0 END)   AS present,
      SUM(CASE WHEN status = 'A' THEN 1 ELSE 0 END)   AS absent,
      SUM(CASE WHEN status = 'L' THEN 1 ELSE 0 END)   AS leave_count
    FROM attendance
    WHERE person_type = ? AND date >= ? AND date <= ?
    GROUP BY date
    ORDER BY date
  `).all(type, fromDate, toDate);
  res.json({ data: rows, type, academicYear: ay1 + '-' + String(ay2).slice(-2) });
});

// GET /api/dashboard/today-attendance — real-time today's attendance
router.get('/today-attendance', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const studentRow = db.prepare(`
    SELECT
      COUNT(*)                                        AS total,
      SUM(CASE WHEN status='P' THEN 1 ELSE 0 END)    AS present,
      SUM(CASE WHEN status='A' THEN 1 ELSE 0 END)    AS absent,
      SUM(CASE WHEN status='L' THEN 1 ELSE 0 END)    AS leave_count,
      MAX(created_at)                                 AS last_marked
    FROM attendance WHERE date = ? AND person_type = 'student'
  `).get(today);

  const teacherRow = db.prepare(`
    SELECT
      COUNT(*)                                        AS total,
      SUM(CASE WHEN status='P' THEN 1 ELSE 0 END)    AS present,
      SUM(CASE WHEN status='A' THEN 1 ELSE 0 END)    AS absent,
      SUM(CASE WHEN status='L' THEN 1 ELSE 0 END)    AS leave_count,
      MAX(created_at)                                 AS last_marked
    FROM attendance WHERE date = ? AND person_type = 'teacher'
  `).get(today);

  const totalStudents = db.prepare("SELECT COUNT(*) as c FROM students WHERE status='Active'").get().c;
  const totalTeachers = db.prepare("SELECT COUNT(*) as c FROM teachers WHERE status='Active'").get().c;

  const sPresent = studentRow.present || 0;
  const sAbsent  = studentRow.absent || 0;
  const sLeave   = studentRow.leave_count || 0;
  const sMarked  = studentRow.total || 0;
  const sPct     = totalStudents > 0 ? Math.round(sPresent / totalStudents * 1000) / 10 : 0;

  const tPresent = teacherRow.present || 0;
  const tAbsent  = teacherRow.absent || 0;
  const tLeave   = teacherRow.leave_count || 0;
  const tMarked  = teacherRow.total || 0;
  const tPct     = totalTeachers > 0 ? Math.round(tPresent / totalTeachers * 1000) / 10 : 0;

  const lastMarked = studentRow.last_marked || teacherRow.last_marked || null;

  res.json({
    date: today,
    students: { present: sPresent, absent: sAbsent, leave: sLeave, marked: sMarked, total: totalStudents, percent: sPct },
    teachers: { present: tPresent, absent: tAbsent, leave: tLeave, marked: tMarked, total: totalTeachers, percent: tPct },
    lastUpdated: lastMarked
  });
});

module.exports = router;
