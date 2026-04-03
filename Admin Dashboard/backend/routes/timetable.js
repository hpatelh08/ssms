// =============================================
//  TIMETABLE ROUTES - Generated + JSON Import
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');
const { MIN_STANDARD, MAX_STANDARD, PRIMARY_STANDARD_MAX } = require('../config/standards');

const router = Router();
router.use(authMiddleware);

const SUBJECT_COLORS = {
  'Mathematics':    { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  'Science':        { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  'English':        { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  'Social Science': { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
  'Hindi':          { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  'Gujarati':       { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
  'Sanskrit':       { bg: '#fae8ff', text: '#86198f', border: '#e879f9' },
  'Computer':       { bg: '#cffafe', text: '#155e75', border: '#67e8f9' },
  'EVS':            { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  'Drawing':        { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  'PT':             { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  'Moral Science':  { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
  'GK':             { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
};

const SUBJECTS_BY_STD = {
  primary: ['English', 'Mathematics', 'EVS', 'Gujarati', 'Hindi', 'Drawing', 'PT', 'Moral Science', 'GK'],
  upper:   ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer', 'PT', 'Drawing']
};

// Maps DB subject names → timetable subject names
const SUBJECT_MAP = {
  'Mathematics':      'Mathematics',
  'Science':          'Science',
  'Biology':          'Science',
  'Chemistry':        'Science',
  'Physics':          'Science',
  'English':          'English',
  'Hindi':            'Hindi',
  'Sanskrit':         'Sanskrit',
  'Computer':         'Computer',
  'Art':              'Drawing',
  'PE':               'PT',
  'History':          'Social Science',
  'Geography':        'Social Science',
  'Civics':           'Social Science',
  'Music':            'GK',
  'Accountancy':      'EVS',
  'Economics':        'EVS',
  'Commerce':         'Moral Science',
  'Business Studies': 'Moral Science',
  'Psychology':       'GK',
};

// Build TT_TEACHERS dynamically from the teachers table at startup
function buildTTTeachers() {
  const map = {};
  try {
    const rows = db.prepare('SELECT name, subject FROM teachers ORDER BY name').all();
    for (const { name, subject } of rows) {
      const ttSubject = SUBJECT_MAP[subject] || subject;
      if (!map[ttSubject]) map[ttSubject] = [];
      if (!map[ttSubject].includes(name)) map[ttSubject].push(name);
    }
  } catch (_) {}
  return map;
}

const TT_TEACHERS = buildTTTeachers();

const TT_SLOTS_WEEKDAY = [
  { num: 1, time: '07:00 - 07:40' },
  { num: 2, time: '07:40 - 08:20' },
  { num: 3, time: '08:20 - 09:00' },
  { num: 4, time: '09:00 - 09:40' },
  { num: 'B', time: '09:40 - 10:00', isBreak: true },
  { num: 5, time: '10:00 - 10:40' },
  { num: 6, time: '10:40 - 11:20' },
  { num: 7, time: '11:20 - 12:00' }
];

const TT_SLOTS_SATURDAY = [
  { num: 1, time: '07:00 - 07:40' },
  { num: 2, time: '07:40 - 08:20' },
  { num: 3, time: '08:20 - 09:00' },
  { num: 'B', time: '09:00 - 09:20', isBreak: true },
  { num: 4, time: '09:20 - 10:00' },
  { num: 5, time: '10:00 - 10:40' },
  { num: 6, time: '10:40 - 11:20' }
];

const TT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseStdSection(stdRaw, sectionRaw) {
  const std = parseInt(stdRaw, 10);
  const section = String(sectionRaw || 'A').trim().toUpperCase();
  if (!Number.isInteger(std) || std < MIN_STANDARD || std > MAX_STANDARD) {
    return { error: `Class/standard must be between ${MIN_STANDARD} and ${MAX_STANDARD}.` };
  }
  if (!['A', 'B', 'C'].includes(section)) return { error: 'Section must be A, B, or C.' };
  return { std, section };
}

function generateTimetable(std, section) {
  const isPrimary = std <= PRIMARY_STANDARD_MAX;
  const subjectPool = isPrimary ? SUBJECTS_BY_STD.primary : SUBJECTS_BY_STD.upper;

  let seed = std * 1000 + section.charCodeAt(0);
  function rand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  function getTeacher(subject) {
    const pool = TT_TEACHERS[subject] || ['TBD'];
    const idx = (std + section.charCodeAt(0)) % pool.length;
    return pool[idx];
  }

  const schedule = {};
  TT_DAYS.forEach(day => {
    const slots = day === 'Saturday' ? TT_SLOTS_SATURDAY : TT_SLOTS_WEEKDAY;
    const lectures = [];
    const shuffled = [...subjectPool].sort(() => rand() - 0.5);
    let si = 0;
    slots.forEach(slot => {
      if (slot.isBreak) {
        lectures.push({ ...slot, subject: null, teacher: null });
      } else {
        const subj = shuffled[si % shuffled.length];
        si++;
        lectures.push({ ...slot, subject: subj, teacher: getTeacher(subj) });
      }
    });
    schedule[day] = lectures;
  });
  return schedule;
}

function buildScheduleFromRows(rows) {
  const schedule = {};
  for (const day of TT_DAYS) {
    const baseSlots = (day === 'Saturday' ? TT_SLOTS_SATURDAY : TT_SLOTS_WEEKDAY).map(s => ({ ...s, subject: null, teacher: null }));
    schedule[day] = baseSlots;
  }

  for (const row of rows) {
    const day = String(row.day || '').trim();
    if (!TT_DAYS.includes(day)) continue;
    if (!row.lecture_num) continue;
    const target = schedule[day].find(s => s.num === row.lecture_num);
    if (!target) continue;
    target.subject = row.subject;
    target.teacher = row.teacher;
  }
  return schedule;
}

function toUploadLayout(schedule) {
  const out = {};
  for (const day of TT_DAYS) {
    const entries = Array.isArray(schedule[day]) ? schedule[day] : [];
    const lectures = {};
    for (const slot of entries) {
      if (slot && !slot.isBreak && Number.isInteger(slot.num) && slot.subject && slot.teacher) {
        lectures[`Lecture ${slot.num}`] = { subject: slot.subject, teacher: slot.teacher };
      }
    }
    out[day] = lectures;
  }
  return out;
}

function normalizeUploadSchedule(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: 'Invalid JSON: expected an object like { "Monday": { "Lecture 1": { ... } } }' };
  }

  const normalizedRows = [];
  for (const [day, lectures] of Object.entries(raw)) {
    if (!lectures || typeof lectures !== 'object' || Array.isArray(lectures)) {
      return { error: `Invalid lectures format for day "${day}".` };
    }
    for (const [lectureLabelRaw, info] of Object.entries(lectures)) {
      if (!info || typeof info !== 'object' || Array.isArray(info)) {
        return { error: `Invalid lecture entry "${lectureLabelRaw}" on "${day}".` };
      }
      const lectureLabel = String(lectureLabelRaw || '').trim();
      const subject = String(info.subject || '').trim();
      const teacher = String(info.teacher || '').trim();
      if (!lectureLabel || !subject || !teacher) {
        return { error: `Each lecture must include lecture name, subject, and teacher. Failed at "${day} -> ${lectureLabelRaw}".` };
      }
      const numMatch = lectureLabel.match(/(\d+)/);
      const lectureNum = numMatch ? parseInt(numMatch[1], 10) : null;
      normalizedRows.push({
        day: String(day || '').trim(),
        lecture: lectureLabel,
        lecture_num: Number.isInteger(lectureNum) ? lectureNum : null,
        subject,
        teacher,
      });
    }
  }

  if (!normalizedRows.length) {
    return { error: 'No timetable records found in uploaded JSON.' };
  }

  return { rows: normalizedRows };
}

// GET /api/timetable?std=1&section=A
router.get('/', (req, res) => {
  const parsed = parseStdSection(req.query.std || MIN_STANDARD, req.query.section || 'A');
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { std, section } = parsed;

  const rows = db.prepare(`
    SELECT day, lecture, lecture_num, subject, teacher
    FROM timetable
    WHERE class = ? AND section = ?
    ORDER BY
      CASE day
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        ELSE 99
      END,
      COALESCE(lecture_num, 999),
      lecture
  `).all(std, section);

  const isPrimary = std <= PRIMARY_STANDARD_MAX;
  const subjectPool = isPrimary ? SUBJECTS_BY_STD.primary : SUBJECTS_BY_STD.upper;
  const schedule = rows.length ? buildScheduleFromRows(rows) : generateTimetable(std, section);

  res.json({
    std,
    section,
    source: rows.length ? 'uploaded' : 'generated',
    schedule,
    subjectPool,
    subjectColors: SUBJECT_COLORS,
    days: TT_DAYS,
    slotsWeekday: TT_SLOTS_WEEKDAY,
    slotsSaturday: TT_SLOTS_SATURDAY
  });
});

// GET /api/timetable/layout?std=1&section=A
router.get('/layout', (req, res) => {
  const parsed = parseStdSection(req.query.std || MIN_STANDARD, req.query.section || 'A');
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { std, section } = parsed;

  const rows = db.prepare(`
    SELECT day, lecture, lecture_num, subject, teacher
    FROM timetable
    WHERE class = ? AND section = ?
  `).all(std, section);

  const schedule = rows.length ? buildScheduleFromRows(rows) : generateTimetable(std, section);
  const layout = toUploadLayout(schedule);
  res.json({ std, section, source: rows.length ? 'uploaded' : 'generated', layout });
});

// PUT /api/timetable/cell  — update one cell
router.put('/cell', authorize('super_admin', 'admin'), (req, res) => {
  const parsed = parseStdSection(req.body.std, req.body.section);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { std, section } = parsed;

  const day = String(req.body.day || '').trim();
  const lectureNum = parseInt(req.body.lecture_num, 10);
  const subject = String(req.body.subject || '').trim();
  const teacher = String(req.body.teacher || '').trim();

  if (!TT_DAYS.includes(day)) return res.status(400).json({ error: 'Invalid day.' });
  if (!Number.isInteger(lectureNum) || lectureNum < 1 || lectureNum > 8) return res.status(400).json({ error: 'Invalid lecture number.' });
  if (!subject || !teacher) return res.status(400).json({ error: 'Subject and teacher are required.' });

  // Ensure the class/section has a full timetable first (seed from generated if needed)
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM timetable WHERE class = ? AND section = ?').get(std, section);
  if (!existing || existing.cnt === 0) {
    const generated = generateTimetable(std, section);
    const insertOne = db.prepare(`INSERT INTO timetable (class, section, day, lecture_num, lecture, subject, teacher) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const seedTx = db.transaction(() => {
      for (const d of TT_DAYS) {
        for (const slot of generated[d]) {
          if (slot.isBreak || !slot.subject) continue;
          insertOne.run(std, section, d, slot.num, `Lecture ${slot.num}`, slot.subject, slot.teacher);
        }
      }
    });
    seedTx();
  }

  const lecture = `Lecture ${lectureNum}`;
  db.prepare(`
    INSERT INTO timetable (class, section, day, lecture_num, lecture, subject, teacher)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(class, section, day, lecture) DO UPDATE SET
      lecture_num = excluded.lecture_num,
      subject = excluded.subject,
      teacher = excluded.teacher
  `).run(std, section, day, lectureNum, lecture, subject, teacher);

  res.json({ success: true, std, section, day, lecture_num: lectureNum, subject, teacher });
});

// PUT /api/timetable/bulk-cells  — update multiple cells at once
router.put('/bulk-cells', authorize('super_admin', 'admin'), (req, res) => {
  const parsed = parseStdSection(req.body.std, req.body.section);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { std, section } = parsed;

  const changes = req.body.changes;
  if (!Array.isArray(changes) || !changes.length) return res.status(400).json({ error: 'No changes provided.' });

  // Validate all changes
  for (const c of changes) {
    const day = String(c.day || '').trim();
    const lectureNum = parseInt(c.lecture_num, 10);
    const subject = String(c.subject || '').trim();
    const teacher = String(c.teacher || '').trim();
    if (!TT_DAYS.includes(day)) return res.status(400).json({ error: `Invalid day: ${day}` });
    if (!Number.isInteger(lectureNum) || lectureNum < 1 || lectureNum > 8) return res.status(400).json({ error: `Invalid lecture number: ${lectureNum}` });
    if (!subject || !teacher) return res.status(400).json({ error: 'Subject and teacher are required for each change.' });
  }

  // Seed full timetable if no rows exist yet
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM timetable WHERE class = ? AND section = ?').get(std, section);
  if (!existing || existing.cnt === 0) {
    const generated = generateTimetable(std, section);
    const insertSeed = db.prepare(`INSERT INTO timetable (class, section, day, lecture_num, lecture, subject, teacher) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const seedTx = db.transaction(() => {
      for (const d of TT_DAYS) {
        for (const slot of generated[d]) {
          if (slot.isBreak || !slot.subject) continue;
          insertSeed.run(std, section, d, slot.num, `Lecture ${slot.num}`, slot.subject, slot.teacher);
        }
      }
    });
    seedTx();
  }

  const upsert = db.prepare(`
    INSERT INTO timetable (class, section, day, lecture_num, lecture, subject, teacher)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(class, section, day, lecture) DO UPDATE SET
      lecture_num = excluded.lecture_num,
      subject = excluded.subject,
      teacher = excluded.teacher
  `);

  const tx = db.transaction(() => {
    for (const c of changes) {
      const day = String(c.day).trim();
      const lectureNum = parseInt(c.lecture_num, 10);
      const subject = String(c.subject).trim();
      const teacher = String(c.teacher).trim();
      upsert.run(std, section, day, lectureNum, `Lecture ${lectureNum}`, subject, teacher);
    }
  });
  tx();

  res.json({ success: true, std, section, count: changes.length });
});

// POST /api/timetable/import
router.post('/import', authorize('super_admin', 'admin'), (req, res) => {
  const parsed = parseStdSection(req.body.std, req.body.section);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { std, section } = parsed;

  const normalized = normalizeUploadSchedule(req.body.schedule);
  if (normalized.error) return res.status(400).json({ error: normalized.error });

  const removeOld = db.prepare('DELETE FROM timetable WHERE class = ? AND section = ?');
  const insertOne = db.prepare(`
    INSERT INTO timetable (class, section, day, lecture_num, lecture, subject, teacher)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(class, section, day, lecture) DO UPDATE SET
      lecture_num = excluded.lecture_num,
      subject = excluded.subject,
      teacher = excluded.teacher
  `);

  const tx = db.transaction((items) => {
    removeOld.run(std, section);
    for (const item of items) {
      insertOne.run(std, section, item.day, item.lecture_num, item.lecture, item.subject, item.teacher);
    }
  });

  tx(normalized.rows);
  res.json({ success: true, std, section, count: normalized.rows.length });
});

// GET /api/timetable/subjects?standard=1
router.get('/subjects', (req, res) => {
  const standard = parseInt(req.query.standard, 10);
  if (!Number.isInteger(standard) || standard < MIN_STANDARD || standard > MAX_STANDARD) {
    return res.status(400).json({ error: `Standard must be between ${MIN_STANDARD} and ${MAX_STANDARD}.` });
  }
  const rows = db.prepare('SELECT id, name FROM subjects WHERE standard = ? ORDER BY name').all(standard);
  res.json(rows);
});

// GET /api/timetable/teachers-for-subject?standard=1&subject_id=3
router.get('/teachers-for-subject', (req, res) => {
  const standard = parseInt(req.query.standard, 10);
  const subjectId = parseInt(req.query.subject_id, 10);
  if (!Number.isInteger(standard) || standard < MIN_STANDARD || standard > MAX_STANDARD) {
    return res.status(400).json({ error: `Standard must be between ${MIN_STANDARD} and ${MAX_STANDARD}.` });
  }
  if (!Number.isInteger(subjectId)) {
    return res.status(400).json({ error: 'subject_id is required.' });
  }
  const rows = db.prepare(`
    SELECT t.id, t.name
    FROM teachers t
    JOIN teacher_subjects ts ON ts.teacher_id = t.id
    WHERE ts.subject_id = ? AND ts.standard = ? AND t.status = 'Active'
    ORDER BY t.name
  `).all(subjectId, standard);
  res.json(rows);
});

// GET /api/timetable/check-conflict?teacher=Amit+Verma&day=Monday&lecture_num=1&exclude_std=10&exclude_section=A
// Checks if a teacher is already assigned to another class at the same day+lecture
router.get('/check-conflict', (req, res) => {
  const teacher = String(req.query.teacher || '').trim();
  const day = String(req.query.day || '').trim();
  const lectureNum = parseInt(req.query.lecture_num, 10);
  const excludeStd = parseInt(req.query.exclude_std, 10);
  const excludeSection = String(req.query.exclude_section || '').trim().toUpperCase();

  if (!teacher || !day || !Number.isInteger(lectureNum)) {
    return res.status(400).json({ error: 'teacher, day, and lecture_num are required.' });
  }

  const conflict = db.prepare(`
    SELECT class, section, subject
    FROM timetable
    WHERE teacher = ? AND day = ? AND lecture_num = ?
      AND NOT (class = ? AND section = ?)
    LIMIT 1
  `).get(teacher, day, lectureNum, excludeStd || 0, excludeSection || '');

  if (conflict) {
    res.json({
      conflict: true,
      message: `${teacher} is already teaching ${conflict.subject} in Std ${conflict.class}-${conflict.section} at ${day} Lecture ${lectureNum}`
    });
  } else {
    res.json({ conflict: false });
  }
});

module.exports = router;
