// =============================================
//  EXAMS ROUTES — Full CRUD + Teacher Sync Merge
// =============================================
const { Router } = require('express');
const path = require('path');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');
const { MIN_STANDARD, MAX_STANDARD, isSupportedStandard } = require('../config/standards');

const {
  readExamSyncFile,
  normalizeExamRecord,
  upsertExamRecord,
  removeExamRecord,
} = require(path.join(__dirname, '..', '..', '..', 'shared', 'examSync.js'));

const router = Router();
router.use((req, res, next) => {
  const requestUrl = String(req.originalUrl || req.url || '');
  if (
    (req.method === 'POST' && requestUrl.includes('/public-sync'))
    || (req.method === 'GET' && requestUrl.includes('/public'))
  ) {
    return next();
  }
  return authMiddleware(req, res, next);
});

function normalizeClassValue(value) {
  return String(value || '').trim();
}

function parseClassNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? parseInt(match[0], 10) : NaN;
}

function isSupportedClass(value) {
  const classNumber = parseClassNumber(value);
  return Number.isInteger(classNumber) && isSupportedStandard(classNumber);
}

function normalizeSqlExam(exam) {
  return {
    ...exam,
    maxMarks: exam.max_marks,
    source: exam.source || 'admin',
  };
}

function normalizeSharedExam(exam) {
  const normalized = normalizeExamRecord(exam);
  return {
    id: normalized.id,
    name: normalized.name,
    class: normalized.class,
    subject: normalized.subject,
    date: normalized.date,
    duration: normalized.duration,
    max_marks: normalized.max_marks,
    maxMarks: normalized.max_marks,
    status: normalized.status,
    examType: normalized.examType,
    startTime: normalized.startTime,
    endTime: normalized.endTime,
    passingMarks: normalized.passingMarks,
    description: normalized.description,
    teacherId: normalized.teacherId,
    source: normalized.source || 'teacher',
  };
}

function upsertSqlExamRecord(exam) {
  const record = normalizeSharedExam(exam);
  if (!record.id) return null;

  db.prepare(`
    INSERT INTO exams (id, name, class, subject, date, duration, max_marks, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM exams WHERE id = ?), datetime('now')))
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      class = excluded.class,
      subject = excluded.subject,
      date = excluded.date,
      duration = excluded.duration,
      max_marks = excluded.max_marks,
      status = excluded.status
  `).run(
    record.id,
    record.name,
    String(record.class || '').trim(),
    String(record.subject || '').trim(),
    record.date,
    record.duration,
    Number(record.max_marks || record.maxMarks || 100) || 100,
    String(record.status || 'Scheduled').trim(),
    record.id
  );

  return record;
}

function syncSharedExamRecord(exam) {
  const record = normalizeSharedExam(exam);
  if (!record.id) return null;
  upsertExamRecord(record);
  return record;
}

function examSortValue(exam) {
  const dateValue = String(exam?.date || '').trim();
  return dateValue || '9999-12-31';
}

function mergeExams(sqlExams = [], sharedExams = []) {
  const map = new Map();

  const push = (exam, sourceTag) => {
    if (!exam) return;
    const id = String(exam.id || exam._id || '').trim();
    const signature = [
      id || '',
      String(exam.name || '').trim().toLowerCase(),
      String(exam.class || '').trim(),
      String(exam.subject || '').trim().toLowerCase(),
      String(exam.date || '').trim(),
      sourceTag || '',
    ].join('|');
    const key = id || signature;
    if (!map.has(key)) {
      map.set(key, exam);
      return;
    }
    map.set(key, { ...map.get(key), ...exam });
  };

  sqlExams.forEach((exam) => push(normalizeSqlExam(exam), 'admin'));
  sharedExams.forEach((exam) => push(normalizeSharedExam(exam), 'teacher'));

  return Array.from(map.values()).sort((a, b) => {
    const dateDiff = String(examSortValue(a)).localeCompare(examSortValue(b));
    if (dateDiff !== 0) return dateDiff;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

function loadMergedExams({ cls, status } = {}) {
  const where = [];
  const params = [];

  if (cls) {
    if (!isSupportedClass(cls)) return [];
    where.push('CAST(class AS INTEGER) = ?');
    params.push(parseClassNumber(cls));
  } else {
    where.push(`CAST(class AS INTEGER) BETWEEN ${MIN_STANDARD} AND ${MAX_STANDARD}`);
  }

  if (status) {
    where.push('status = ?');
    params.push(String(status));
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sqlExams = db.prepare(`SELECT * FROM exams ${whereClause} ORDER BY date DESC`).all(...params);
  const sharedExams = readExamSyncFile();

  const normalizedShared = sharedExams
    .map((exam) => normalizeSharedExam(exam))
    .filter((exam) => {
      const classNumber = parseClassNumber(exam.class);
      if (!Number.isInteger(classNumber) || classNumber < MIN_STANDARD || classNumber > MAX_STANDARD) {
        return false;
      }
      if (cls && parseClassNumber(cls) !== classNumber) return false;
      if (status && String(exam.status || '') !== String(status)) return false;
      return true;
    });

  return mergeExams(sqlExams, normalizedShared);
}

// POST /api/exams/public-sync
router.post('/public-sync', (req, res) => {
  const incoming = Array.isArray(req.body?.exams) ? req.body.exams : [];
  let synced = 0;

  incoming.forEach((exam) => {
    const record = upsertSqlExamRecord(exam);
    if (record) {
      syncSharedExamRecord(record);
      synced += 1;
    }
  });

  res.json({ success: true, synced });
});

// GET /api/exams/public
router.get('/public', (_req, res) => {
  const exams = loadMergedExams({});
  res.json({ data: exams });
});

// GET /api/exams
router.get('/', (req, res) => {
  const { class: cls, status } = req.query;
  const exams = loadMergedExams({ cls, status });
  res.json({ data: exams });
});

// GET /api/exams/:id
router.get('/:id', (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (exam && isSupportedClass(exam.class)) {
    return res.json(normalizeSqlExam(exam));
  }

  const sharedExam = readExamSyncFile().find((item) => String(item.id || '').trim() === String(req.params.id).trim());
  if (sharedExam) {
    const normalized = normalizeSharedExam(sharedExam);
    if (!isSupportedClass(normalized.class)) {
      return res.status(404).json({ error: 'Exam not found.' });
    }
    return res.json(normalized);
  }

  return res.status(404).json({ error: 'Exam not found.' });
});

// POST /api/exams
router.post('/', authorize('super_admin', 'admin'), (req, res) => {
  const { id, name, class: cls, subject, date, duration, maxMarks, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Exam name is required.' });
  if (!isSupportedClass(cls)) return res.status(400).json({ error: 'Only classes 1 to 6 are allowed.' });

  const examId = id || 'EXM' + Date.now();
  db.prepare(`
    INSERT INTO exams (id, name, class, subject, date, duration, max_marks, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(examId, name, normalizeClassValue(cls), subject || '', date || '', duration || '', maxMarks || 100, status || 'Scheduled');
  syncSharedExamRecord({
    id: examId,
    name,
    class: normalizeClassValue(cls),
    subject: subject || '',
    date: date || '',
    duration: duration || '',
    maxMarks: maxMarks || 100,
    status: status || 'Scheduled',
  });

  res.status(201).json({ success: true, id: examId });
});

// PUT /api/exams/:id
router.put('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id FROM exams WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Exam not found.' });

  const { name, class: cls, subject, date, duration, maxMarks, status } = req.body;
  if (!isSupportedClass(cls)) return res.status(400).json({ error: 'Only classes 1 to 6 are allowed.' });
  db.prepare(`
    UPDATE exams SET name=?, class=?, subject=?, date=?, duration=?, max_marks=?, status=?
    WHERE id = ?
  `).run(name, normalizeClassValue(cls), subject, date, duration, maxMarks, status, req.params.id);
  syncSharedExamRecord({
    id: req.params.id,
    name,
    class: normalizeClassValue(cls),
    subject,
    date,
    duration,
    maxMarks,
    status,
  });
  res.json({ success: true });
});

// DELETE /api/exams/:id
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const result = db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Exam not found.' });
  removeExamRecord(req.params.id);
  res.json({ success: true });
});

module.exports = router;
