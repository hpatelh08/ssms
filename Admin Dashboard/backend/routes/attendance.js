// =============================================
//  ATTENDANCE ROUTES — Student & Teacher
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');
const { MIN_STANDARD, MAX_STANDARD, isSupportedStandard } = require('../config/standards');

const router = Router();
router.use(authMiddleware);

function formatLocalDateYmd(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeSection(sectionRaw) {
  const section = String(sectionRaw || '').trim().toUpperCase();
  if (!section) return '';
  return ['A', 'B', 'C'].includes(section) ? section : null;
}

function normalizeClassStandard(classRaw) {
  const match = String(classRaw || '').match(/\d+/);
  if (!match) return '';
  const value = String(parseInt(match[0], 10));
  return isSupportedStandard(value) ? value : '';
}

// ─── Helper: check if date is a holiday ───
function isHolidayDate(dateStr) {
  return !!db.prepare('SELECT id FROM holidays WHERE holiday_date = ?').get(dateStr);
}

// ─── Helper: check if date is in the future ───
function isFutureDate(dateStr) {
  return dateStr > formatLocalDateYmd();
}

// ─── GET /api/attendance — list attendance records ───
router.get('/', (req, res) => {
  const { person_type, class: cls, section: sectionRaw, date, page = 1, limit = 50 } = req.query;
  let where = [], params = [];
  const section = normalizeSection(sectionRaw);

  if (sectionRaw && !section) {
    return res.status(400).json({ error: 'Section must be A, B, or C.' });
  }

  if (person_type) { where.push('a.person_type = ?'); params.push(person_type); }
  if (cls)         { where.push('a.class = ?');        params.push(cls); }
  if (section)     { where.push("UPPER(COALESCE(a.section, '')) = ?"); params.push(section); }
  if (date)        { where.push('a.date = ?');         params.push(date); }

  const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) as c FROM attendance a ${wc}`).get(...params).c;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const records = db.prepare(`SELECT a.* FROM attendance a ${wc} ORDER BY a.date DESC, a.person_id LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

  res.json({ data: records, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// ─── GET /api/attendance/people — get students or teachers for marking ───
router.get('/people', (req, res) => {
  const { person_type = 'student', class: cls, section: sectionRaw } = req.query;
  const standard = normalizeClassStandard(cls);
  const section = normalizeSection(sectionRaw);

  if (sectionRaw && !section) {
    return res.status(400).json({ error: 'Section must be A, B, or C.' });
  }

  if (person_type === 'student') {
      if (cls && !standard) {
      return res.json({ data: [], person_type: 'student' });
      }
    let q = `SELECT id, name, gr_number as roll, class, section, student_id FROM students WHERE LOWER(COALESCE(status, 'active')) = 'active' AND CAST(class AS INTEGER) BETWEEN ? AND ?`;
    const p = [MIN_STANDARD, MAX_STANDARD];
      if (standard) { q += ' AND class = ?'; p.push(standard); }
      if (section) { q += " AND UPPER(COALESCE(section, '')) = ?"; p.push(section); }
      q += ` ORDER BY
        CAST(REPLACE(COALESCE(gr_number, ''), 'GR-', '') AS INTEGER),
        CAST(class AS INTEGER),
        UPPER(COALESCE(section, '')),
        name`;
      return res.json({ data: db.prepare(q).all(...p), person_type: 'student' });
    }
  if (person_type === 'teacher') {
    return res.json({
      data: db.prepare(`
        SELECT id, name, emp as roll, subject, teacher_id
        FROM teachers
        ORDER BY
          CASE WHEN status = 'Active' THEN 0 ELSE 1 END,
          name
      `).all(),
      person_type: 'teacher'
    });
  }
  res.status(400).json({ error: 'Invalid person_type. Use "student" or "teacher".' });
});

// ─── POST /api/attendance/bulk — save attendance (duplicate prevention + validation) ───
router.post('/bulk', authorize('super_admin', 'admin', 'teacher'), (req, res) => {
  const { records, date, person_type, class: cls, section: sectionRaw } = req.body;
  const standard = normalizeClassStandard(cls);
  const section = normalizeSection(sectionRaw);

  if (!records || !Array.isArray(records) || !records.length)
    return res.status(400).json({ error: 'Records array is required and must not be empty.' });
  if (!date)
    return res.status(400).json({ error: 'Date is required.' });
  if (!person_type || !['student', 'teacher'].includes(person_type))
    return res.status(400).json({ error: 'Valid person_type (student/teacher) is required.' });
  if (person_type === 'student' && !String(cls || '').trim())
    return res.status(400).json({ error: 'Class is required when saving student attendance.' });
  if (person_type === 'student' && !standard)
    return res.status(400).json({ error: 'Only classes 1 to 6 are allowed for student attendance.' });
  if (person_type === 'student' && sectionRaw && !section)
    return res.status(400).json({ error: 'Section must be A, B, or C.' });

  if (isFutureDate(date))
    return res.status(400).json({ error: 'Cannot mark attendance for a future date.', type: 'future_date' });
  if (isHolidayDate(date)) {
    const h = db.prepare('SELECT title FROM holidays WHERE holiday_date = ?').get(date);
    return res.status(400).json({ error: `Cannot mark attendance on a holiday: ${h ? h.title : 'Holiday'}`, type: 'holiday' });
  }
  if (new Date(date + 'T00:00:00').getDay() === 0)
    return res.status(400).json({ error: 'Cannot mark attendance on a Sunday.', type: 'sunday' });

  const normalized = records.map((r) => {
    const pid = String(r?.person_id || '').trim();
    const status = ['P', 'A', 'L'].includes(String(r?.status || '').toUpperCase())
      ? String(r.status).toUpperCase()
      : 'P';
    return {
      person_id: pid,
      status,
      class: person_type === 'student' ? String(standard || r?.class || '').trim() || null : null,
      section: person_type === 'student' ? (section || normalizeSection(r?.section) || null) : null,
      subject: person_type === 'teacher' ? String(r?.subject || '').trim() || null : null,
    };
  });

  const invalid = normalized.filter(r => !r.person_id);
  if (invalid.length) {
    return res.status(400).json({
      error: `Found ${invalid.length} attendance records with missing person_id.`,
    });
  }

  // Duplicate detection
  const checkStmt = db.prepare('SELECT person_id FROM attendance WHERE person_id = ? AND person_type = ? AND date = ?');
  let updatedCount = 0;
  for (const r of normalized) { if (checkStmt.get(r.person_id, person_type, date)) updatedCount++; }

  const upsert = db.prepare(`
    INSERT INTO attendance (person_id, person_type, date, status, class, section, subject)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(person_id, person_type, date) DO UPDATE SET
      status=excluded.status,
      class=excluded.class,
      section=excluded.section,
      subject=excluded.subject
  `);

  db.transaction((items) => {
    for (const r of items)
      upsert.run(r.person_id, person_type, date, r.status, r.class, r.section, r.subject);
  })(normalized);

  res.json({ success: true, total: normalized.length, new: normalized.length - updatedCount, updated: updatedCount, date, person_type, class: cls || null, section: section || null });
});

// ─── GET /api/attendance/summary ───
router.get('/summary', (req, res) => {
  const { person_type, class: cls, section: sectionRaw, date } = req.query;
  let where = [], params = [];
  const section = normalizeSection(sectionRaw);

  if (sectionRaw && !section) {
    return res.status(400).json({ error: 'Section must be A, B, or C.' });
  }
  if (person_type) { where.push('person_type = ?'); params.push(person_type); }
  if (cls)         { where.push('class = ?');       params.push(cls); }
  if (section)     { where.push("UPPER(COALESCE(section, '')) = ?"); params.push(section); }
  if (date)        { where.push('date = ?');         params.push(date); }
  const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total   = db.prepare(`SELECT COUNT(*) as c FROM attendance ${wc}`).get(...params).c;
  const present = db.prepare(`SELECT COUNT(*) as c FROM attendance ${wc} ${where.length ? 'AND' : 'WHERE'} status='P'`).get(...params).c;
  const absent  = db.prepare(`SELECT COUNT(*) as c FROM attendance ${wc} ${where.length ? 'AND' : 'WHERE'} status='A'`).get(...params).c;
  const leave   = db.prepare(`SELECT COUNT(*) as c FROM attendance ${wc} ${where.length ? 'AND' : 'WHERE'} status='L'`).get(...params).c;
  res.json({ total, present, absent, leave, rate: total > 0 ? Math.round((present / total) * 100) : 0 });
});

// ─── GET /api/attendance/check-date — validate a date ───
router.get('/check-date', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date is required.' });
  const errors = [];
  if (isFutureDate(date)) errors.push('Cannot mark attendance for a future date.');
  if (isHolidayDate(date)) {
    const h = db.prepare('SELECT title FROM holidays WHERE holiday_date = ?').get(date);
    errors.push(`This date is a holiday: ${h ? h.title : 'Holiday'}`);
  }
  if (new Date(date + 'T00:00:00').getDay() === 0) errors.push('This date is a Sunday.');
  res.json({ valid: errors.length === 0, errors, date });
});

// ─── GET /api/attendance/monthly-report ───
router.get('/monthly-report', (req, res) => {
  const now = new Date();
  const year  = parseInt(req.query.year)  || now.getFullYear();
  const month = parseInt(req.query.month) || (now.getMonth() + 1);
  const personType = req.query.person_type || 'student';
  const mm = String(month).padStart(2, '0');
  const daysInMonth = new Date(year, month, 0).getDate();

  const holidays = db.prepare(
    `SELECT holiday_date, title, source FROM holidays WHERE holiday_date BETWEEN ? AND ? ORDER BY holiday_date`
  ).all(`${year}-${mm}-01`, `${year}-${mm}-${daysInMonth}`);
  const holidaySet = new Set(holidays.map(h => h.holiday_date));
  const holidayMap = {}; holidays.forEach(h => { holidayMap[h.holiday_date] = h.title; });

  // Merge vacation_periods (Summer/Winter break) into holidaySet so Saturdays are included
  const monthStart = `${year}-${mm}-01`;
  const monthEnd   = `${year}-${mm}-${String(daysInMonth).padStart(2, '0')}`;
  const vacations  = db.prepare(
    'SELECT * FROM vacation_periods WHERE start_date <= ? AND end_date >= ?'
  ).all(monthEnd, monthStart);
  vacations.forEach(v => {
    const start = new Date(Math.max(new Date(v.start_date + 'T00:00:00Z'), new Date(monthStart + 'T00:00:00Z')));
    const end   = new Date(Math.min(new Date(v.end_date + 'T00:00:00Z'), new Date(monthEnd + 'T00:00:00Z')));
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      if (d.getUTCDay() === 0) continue; // Sunday stays as weekly-off, not holiday
      const ds = d.toISOString().split('T')[0];
      if (!holidaySet.has(ds)) {
        holidaySet.add(ds);
        holidayMap[ds] = v.title;
        holidays.push({ holiday_date: ds, title: v.title, source: 'vacation' });
      }
    }
  });
  holidays.sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));

  const days = [];
  let totalWorkingDays = 0, sundayCount = 0, holidayCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${mm}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    const isSunday = dayOfWeek === 0;
    const isHol = holidaySet.has(dateStr);
    if (isSunday) sundayCount++;
    if (isHol && !isSunday) holidayCount++;
    const isWorking = !isSunday && !isHol;
    if (isWorking) totalWorkingDays++;

    const att = db.prepare(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status='P' THEN 1 ELSE 0 END) as present
       FROM attendance WHERE date = ? AND person_type = ?`
    ).get(dateStr, personType);

    days.push({
      date: dateStr, day: d, dayOfWeek, isSunday,
      isHoliday: isHol,
      holidayTitle: isHol ? holidayMap[dateStr] : null,
      isWorking,
      percent: (att && att.total > 0) ? Math.round((att.present / att.total) * 100) : null,
    });
  }

  let personStats;
  if (personType === 'student') {
    personStats = db.prepare(`
      SELECT a.person_id, s.name, s.gr_number as roll, s.class,
        COUNT(CASE WHEN a.status='P' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status='A' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status='L' THEN 1 END) as leave_days,
        COUNT(*) as recorded_days
      FROM attendance a LEFT JOIN students s ON s.student_id = a.person_id OR CAST(s.id AS TEXT) = a.person_id
      WHERE a.date BETWEEN ? AND ? AND a.person_type = 'student'
      GROUP BY a.person_id
    `).all(`${year}-${mm}-01`, `${year}-${mm}-${daysInMonth}`);
  } else {
    personStats = db.prepare(`
      SELECT a.person_id, t.name, t.emp as roll, t.subject,
        COUNT(CASE WHEN a.status='P' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status='A' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status='L' THEN 1 END) as leave_days,
        COUNT(*) as recorded_days
      FROM attendance a LEFT JOIN teachers t ON t.teacher_id = a.person_id OR CAST(t.id AS TEXT) = a.person_id
      WHERE a.date BETWEEN ? AND ? AND a.person_type = 'teacher'
      GROUP BY a.person_id
    `).all(`${year}-${mm}-01`, `${year}-${mm}-${daysInMonth}`);
  }

  const enriched = personStats.map(s => ({
    ...s, percent: totalWorkingDays > 0 ? Math.round((s.present_days / totalWorkingDays) * 100) : 0
  }));

  res.json({
    year, month, daysInMonth, totalWorkingDays, sundayCount, holidayCount,
    overallPercent: enriched.length > 0 ? Math.round(enriched.reduce((sum, s) => sum + s.percent, 0) / enriched.length) : 0,
    fullAttendance: enriched.filter(s => s.percent >= 100).length,
    below75: enriched.filter(s => s.percent < 75).length,
    days, holidays, persons: enriched, person_type: personType,
  });
});

// ─── GET /api/attendance/day — per-day attendance list for heatmap click ───
router.get('/day', (req, res) => {
  const { date, person_type = 'student', class: cls, section: sectionRaw } = req.query;
  const section = normalizeSection(sectionRaw);
  if (!date) return res.status(400).json({ error: 'date required (YYYY-MM-DD)' });
  if (sectionRaw && !section) return res.status(400).json({ error: 'Section must be A, B, or C.' });

  let rows;
  if (person_type === 'student') {
    const params = [date];
    let where = `a.date = ? AND a.person_type = 'student'`;
    if (cls) {
      where += ` AND COALESCE(a.class, s.class) = ?`;
      params.push(cls);
    }
    if (section) {
      where += ` AND UPPER(COALESCE(a.section, s.section, '')) = ?`;
      params.push(section);
    }
    rows = db.prepare(`
      SELECT a.person_id, s.name, s.gr_number AS roll,
             COALESCE(a.class, s.class) AS class,
             COALESCE(a.section, s.section) AS section,
             a.status
      FROM attendance a
      LEFT JOIN students s ON s.student_id = a.person_id OR CAST(s.id AS TEXT) = a.person_id
      WHERE ${where}
      ORDER BY CAST(COALESCE(a.class, s.class) AS INTEGER), UPPER(COALESCE(a.section, s.section, '')), s.name
    `).all(...params);
  } else {
    rows = db.prepare(`
      SELECT a.person_id, t.name, t.emp AS roll, t.subject, a.status
      FROM attendance a
      LEFT JOIN teachers t ON t.teacher_id = a.person_id OR CAST(t.id AS TEXT) = a.person_id
      WHERE a.date = ? AND a.person_type = 'teacher'
      ORDER BY t.name
    `).all(date);
  }
  const total   = rows.length;
  const present = rows.filter(r => r.status === 'P').length;
  const absent  = rows.filter(r => r.status === 'A').length;
  const leave   = rows.filter(r => r.status === 'L').length;
  const percent = total > 0 ? Math.round((present / total) * 100) : 0;
  res.json({ date, person_type, total, present, absent, leave, percent, records: rows });
});

// ─── GET /api/attendance/export — CSV export ───
router.get('/export', (req, res) => {
  const now = new Date();
  const year  = parseInt(req.query.year)  || now.getFullYear();
  const month = parseInt(req.query.month) || (now.getMonth() + 1);
  const personType = req.query.person_type || 'student';
  const mm = String(month).padStart(2, '0');
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  let rows;
  if (personType === 'student') {
    rows = db.prepare(`
      SELECT a.person_id, a.date, a.status, a.class, COALESCE(s.name, s1.name) AS name, COALESCE(s.gr_number, s1.gr_number) as roll
      FROM attendance a
      LEFT JOIN students s ON s.student_id = a.person_id
      LEFT JOIN students s1 ON CAST(s1.id AS TEXT) = a.person_id
      WHERE a.date BETWEEN ? AND ? AND a.person_type = 'student' ORDER BY COALESCE(s.name, s1.name), a.date
    `).all(`${year}-${mm}-01`, `${year}-${mm}-${daysInMonth}`);
  } else {
    rows = db.prepare(`
      SELECT a.person_id, a.date, a.status, t.name, t.emp as roll, t.subject
      FROM attendance a LEFT JOIN teachers t ON t.teacher_id = a.person_id OR CAST(t.id AS TEXT) = a.person_id
      WHERE a.date BETWEEN ? AND ? AND a.person_type = 'teacher' ORDER BY t.name, a.date
    `).all(`${year}-${mm}-01`, `${year}-${mm}-${daysInMonth}`);
  }

  const header = personType === 'student' ? 'Name,Roll,Class,Date,Status' : 'Name,EMP ID,Subject,Date,Status';
  const csvRows = rows.map(r => {
    const sl = r.status === 'P' ? 'Present' : r.status === 'A' ? 'Absent' : 'Leave';
    return personType === 'student'
      ? `"${r.name||''}","${r.roll||''}","${r.class||''}","${r.date}","${sl}"`
      : `"${r.name||''}","${r.roll||''}","${r.subject||''}","${r.date}","${sl}"`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="Attendance_${personType}_${monthNames[month-1]}_${year}.csv"`);
  res.send([header, ...csvRows].join('\n'));
});

module.exports = router;
