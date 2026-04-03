// =============================================
//  Google Calendar Holiday Sync Service
// =============================================
// Uses the public Google Calendar API to fetch Indian holidays.
// No service account needed — uses API key with the public
// "Indian Holidays" calendar provided by Google.
//
// Setup:
//   1. Go to https://console.cloud.google.com
//   2. Enable "Google Calendar API"
//   3. Create an API key (restrict to Calendar API)
//   4. Set GOOGLE_CALENDAR_API_KEY in your .env file
//
// The public Indian Holidays calendar ID is:
//   en.indian#holiday@group.v.calendar.google.com
// =============================================

const { google } = require('googleapis');
const db = require('../config/db');

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID
  || 'en.indian#holiday@group.v.calendar.google.com';

const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY || '';

/**
 * Fetch holidays from Google Calendar for a given year and store in DB.
 * Returns the array of { holiday_date, title } objects.
 */
async function syncHolidaysFromGoogle(year) {
  if (!API_KEY) {
    console.warn('⚠ GOOGLE_CALENDAR_API_KEY not set — skipping Google sync');
    return [];
  }

  const calendar = google.calendar({ version: 'v3', auth: API_KEY });

  const timeMin = `${year}-01-01T00:00:00Z`;
  const timeMax = `${year}-12-31T23:59:59Z`;

  try {
    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    const events = res.data.items || [];
    const holidays = events.map(e => ({
      holiday_date: e.start.date || e.start.dateTime.split('T')[0],
      title: e.summary || 'Holiday',
      year,
    }));

    // Upsert into DB
    const upsert = db.prepare(`
      INSERT INTO holidays (holiday_date, title, year, source)
      VALUES (?, ?, ?, 'google')
      ON CONFLICT(holiday_date) DO UPDATE SET title=excluded.title, source='google'
    `);
    const tx = db.transaction(() => {
      for (const h of holidays) {
        upsert.run(h.holiday_date, h.title, h.year);
      }
    });
    tx();

    console.log(`✓ Synced ${holidays.length} holidays from Google Calendar for ${year}`);
    return holidays;
  } catch (err) {
    console.error('❌ Google Calendar sync error:', err.message);
    return [];
  }
}

/**
 * Get holidays for a year — from DB cache first, fallback to Google sync.
 */
async function getHolidaysForYear(year) {
  let rows = db.prepare('SELECT holiday_date, title FROM holidays WHERE year = ? ORDER BY holiday_date').all(year);

  // If no holidays in DB and API key is set, try syncing
  if (rows.length === 0 && API_KEY) {
    await syncHolidaysFromGoogle(year);
    rows = db.prepare('SELECT holiday_date, title FROM holidays WHERE year = ? ORDER BY holiday_date').all(year);
  }

  return rows;
}

/**
 * Get holidays for a specific month (1-12) in a year.
 */
function getHolidaysForMonth(year, month) {
  const mm = String(month).padStart(2, '0');
  const start = `${year}-${mm}-01`;
  const end = `${year}-${mm}-31`;
  return db.prepare(
    'SELECT holiday_date, title FROM holidays WHERE holiday_date BETWEEN ? AND ? ORDER BY holiday_date'
  ).all(start, end);
}

module.exports = { syncHolidaysFromGoogle, getHolidaysForYear, getHolidaysForMonth };
