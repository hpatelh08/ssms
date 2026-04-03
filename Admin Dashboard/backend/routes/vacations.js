// =============================================
//  VACATION PERIODS ROUTES
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

function isValidIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function parseVacationDateParts(value) {
  if (!isValidIsoDate(value)) return null;
  const [year, month, day] = String(value).split('-').map((part) => parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

// GET /api/vacations/:year — get all vacation periods for a year
router.get('/:year', (req, res) => {
  const year = parseInt(req.params.year);
  if (!year || year < 2000 || year > 2100) {
    return res.status(400).json({ error: 'Invalid year' });
  }
  
  const vacations = db.prepare(
    'SELECT * FROM vacation_periods WHERE year = ? ORDER BY start_date'
  ).all(year);
  
  res.json({
    year,
    vacations,
    total: vacations.length
  });
});

// GET /api/vacations/check/:date — check if a date falls in any vacation period
router.get('/check/:date', (req, res) => {
  const date = req.params.date;
  const vacation = db.prepare(
    'SELECT * FROM vacation_periods WHERE ? BETWEEN start_date AND end_date LIMIT 1'
  ).get(date);
  
  res.json({
    date,
    isVacation: !!vacation,
    period: vacation || null
  });
});

// POST /api/vacations — add a new vacation period
router.post('/', authorize('super_admin', 'admin'), (req, res) => {
  const { title, start_date, end_date, type, description } = req.body;
  
  if (!title || !start_date || !end_date) {
    return res.status(400).json({ error: 'title, start_date, and end_date are required' });
  }

  const startParts = parseVacationDateParts(start_date);
  const endParts = parseVacationDateParts(end_date);
  if (!startParts || !endParts) {
    return res.status(400).json({ error: 'Dates must be valid and use YYYY-MM-DD format' });
  }

  if (start_date > end_date) {
    return res.status(400).json({ error: 'start_date must be on or before end_date' });
  }

  const year = startParts.year;
  
  try {
    const result = db.prepare(`
      INSERT INTO vacation_periods (title, start_date, end_date, year, type, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, start_date, end_date, year, type || 'vacation', description || '');
    
    res.json({ 
      success: true, 
      id: result.lastInsertRowid,
      title,
      start_date,
      end_date
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/vacations/:id — update a vacation period
router.put('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const { title, start_date, end_date, type, description } = req.body;

  if (start_date && !parseVacationDateParts(start_date)) {
    return res.status(400).json({ error: 'start_date must be valid and use YYYY-MM-DD format' });
  }
  if (end_date && !parseVacationDateParts(end_date)) {
    return res.status(400).json({ error: 'end_date must be valid and use YYYY-MM-DD format' });
  }
  if (start_date && end_date && start_date > end_date) {
    return res.status(400).json({ error: 'start_date must be on or before end_date' });
  }
  
  try {
    const result = db.prepare(`
      UPDATE vacation_periods 
      SET title = COALESCE(?, title),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          type = COALESCE(?, type),
          description = COALESCE(?, description)
      WHERE id = ?
    `).run(title, start_date, end_date, type, description, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Vacation period not found' });
    }
    
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/vacations/:id — remove a vacation period
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM vacation_periods WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Vacation period not found' });
  res.json({ success: true });
});

module.exports = router;
