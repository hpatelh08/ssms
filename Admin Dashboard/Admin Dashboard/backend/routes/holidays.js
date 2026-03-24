// =============================================
//  HOLIDAYS ROUTES
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');
const { syncHolidaysFromGoogle, getHolidaysForYear, getHolidaysForMonth } = require('../services/googleCalendar');

const router = Router();
router.use(authMiddleware);

// GET /api/holidays/:year — get all holidays for a year
router.get('/:year', async (req, res) => {
  const year = parseInt(req.params.year);
  if (!year || year < 2000 || year > 2100) {
    return res.status(400).json({ error: 'Invalid year' });
  }
  const holidays = await getHolidaysForYear(year);

  // Merge vacation_periods into holidays so Sat/Sun are covered
  const existingDates = new Set(holidays.map(h => h.holiday_date));
  const vacations = db.prepare(
    'SELECT * FROM vacation_periods WHERE year = ?'
  ).all(year);
  vacations.forEach(v => {
    const start = new Date(v.start_date + 'T00:00:00Z');
    const end   = new Date(v.end_date + 'T00:00:00Z');
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      if (d.getUTCDay() === 0) continue; // Sunday stays as weekly-off, not holiday
      const ds = d.toISOString().split('T')[0];
      if (!existingDates.has(ds)) {
        existingDates.add(ds);
        holidays.push({ holiday_date: ds, title: v.title, year: v.year, source: 'vacation' });
      }
    }
  });
  holidays.sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));

  res.json({
    year,
    holidays: holidays.map(h => h.holiday_date),
    details: holidays,
    total: holidays.length
  });
});

// GET /api/holidays/:year/:month — get holidays for a specific month
router.get('/:year/:month', (req, res) => {
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);
  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid year/month' });
  }
  const holidays = getHolidaysForMonth(year, month);

  // Merge vacation_periods for this month
  const existingDates = new Set(holidays.map(h => h.holiday_date));
  const monthStr = String(month).padStart(2, '0');
  const monthStart = `${year}-${monthStr}-01`;
  const monthEnd = `${year}-${monthStr}-${new Date(year, month, 0).getDate()}`;
  const vacations = db.prepare(
    'SELECT * FROM vacation_periods WHERE start_date <= ? AND end_date >= ?'
  ).all(monthEnd, monthStart);
  vacations.forEach(v => {
    const start = new Date(Math.max(new Date(v.start_date + 'T00:00:00Z'), new Date(monthStart + 'T00:00:00Z')));
    const end   = new Date(Math.min(new Date(v.end_date + 'T00:00:00Z'), new Date(monthEnd + 'T00:00:00Z')));
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      if (d.getUTCDay() === 0) continue; // Sunday stays as weekly-off, not holiday
      const ds = d.toISOString().split('T')[0];
      if (!existingDates.has(ds)) {
        existingDates.add(ds);
        holidays.push({ holiday_date: ds, title: v.title, year: v.year, source: 'vacation' });
      }
    }
  });
  holidays.sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));

  res.json({
    year, month,
    holidays: holidays.map(h => h.holiday_date),
    details: holidays,
    total: holidays.length
  });
});

// POST /api/holidays — manually add a holiday
router.post('/', authorize('super_admin', 'admin'), (req, res) => {
  const { holiday_date, title } = req.body;
  if (!holiday_date || !title) {
    return res.status(400).json({ error: 'holiday_date and title are required' });
  }
  const year = parseInt(holiday_date.split('-')[0]);
  try {
    db.prepare(
      `INSERT INTO holidays (holiday_date, title, year, source) VALUES (?, ?, ?, 'manual')
       ON CONFLICT(holiday_date) DO UPDATE SET title=excluded.title`
    ).run(holiday_date, title, year);
    res.json({ success: true, holiday_date, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/holidays/:date — remove a holiday
router.delete('/:date', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM holidays WHERE holiday_date = ?').run(req.params.date);
  if (result.changes === 0) return res.status(404).json({ error: 'Holiday not found' });
  res.json({ success: true });
});

// POST /api/holidays/sync/:year — force sync from Google Calendar
router.post('/sync/:year', authorize('super_admin', 'admin'), async (req, res) => {
  const year = parseInt(req.params.year);
  const holidays = await syncHolidaysFromGoogle(year);
  res.json({ success: true, synced: holidays.length, year });
});

module.exports = router;
