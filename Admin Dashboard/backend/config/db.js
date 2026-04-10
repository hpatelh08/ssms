// =============================================
//  DATABASE CONFIG — SQLite via better-sqlite3
// =============================================
const Database = require('better-sqlite3');
const path = require('path');
const { MIN_STANDARD, MAX_STANDARD } = require('./standards');

const DB_PATH = process.env.DB_PATH || './database.sqlite';
const db = new Database(path.resolve(__dirname, '..', DB_PATH));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function normalizePhoneDigits(value = '') {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

// ---- Schema ----
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    role        TEXT    NOT NULL CHECK(role IN ('super_admin','admin','teacher','accountant','student','parent')),
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    gr_number         TEXT    UNIQUE,
    student_id        TEXT    UNIQUE,
    student_password  TEXT,
    name              TEXT    NOT NULL,
    admission         TEXT    NOT NULL UNIQUE,
    class             TEXT    NOT NULL,
    section           TEXT    NOT NULL DEFAULT 'A',
    parent            TEXT,
    phone             TEXT,
    status            TEXT    NOT NULL DEFAULT 'Active',
    fees              TEXT    NOT NULL DEFAULT 'Pending',
    dob               TEXT,
    gender            TEXT    DEFAULT 'Male',
    blood_group       TEXT    DEFAULT NULL,
    address           TEXT,
    parent_access_key TEXT    DEFAULT NULL,
    parent_id         TEXT    DEFAULT NULL,
    created_at        TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS parents (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id    TEXT    NOT NULL UNIQUE,
    father_name  TEXT    NOT NULL,
    father_phone TEXT,
    mother_name  TEXT,
    mother_phone TEXT,
    occupation   TEXT,
    password     TEXT,
    status       TEXT    NOT NULL DEFAULT 'Active',
    created_at   TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS parent_children (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_db_id INTEGER NOT NULL,
    student_id   INTEGER NOT NULL,
    FOREIGN KEY (parent_db_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id)   REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(parent_db_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    emp              TEXT    NOT NULL UNIQUE,
    subject          TEXT    NOT NULL,
    class            TEXT,
    division         TEXT,
    salary           INTEGER NOT NULL DEFAULT 0,
    phone            TEXT,
    email            TEXT,
    status           TEXT    NOT NULL DEFAULT 'Active',
    qualification    TEXT,
    join_date        TEXT,
    teacher_id       TEXT    UNIQUE,
    teacher_password TEXT,
    created_at       TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS classes (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    teacher     TEXT,
    students    INTEGER DEFAULT 0,
    room        TEXT
  );

  CREATE TABLE IF NOT EXISTS fees (
    id          TEXT    PRIMARY KEY,
    student     TEXT    NOT NULL,
    cls         TEXT    NOT NULL,
    amount      INTEGER NOT NULL DEFAULT 0,
    paid        INTEGER NOT NULL DEFAULT 0,
    due         INTEGER NOT NULL DEFAULT 0,
    month       TEXT,
    status      TEXT    NOT NULL DEFAULT 'Pending',
    date        TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exams (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    class       TEXT    NOT NULL,
    subject     TEXT    NOT NULL,
    date        TEXT,
    duration    TEXT,
    max_marks   INTEGER NOT NULL DEFAULT 100,
    status      TEXT    NOT NULL DEFAULT 'Scheduled',
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS results (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student     TEXT    NOT NULL,
    roll        TEXT    NOT NULL,
    math        INTEGER DEFAULT 0,
    sci         INTEGER DEFAULT 0,
    eng         INTEGER DEFAULT 0,
    hin         INTEGER DEFAULT 0,
    ss          INTEGER DEFAULT 0,
    total       INTEGER DEFAULT 0,
    grade       TEXT,
    percent     TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS marks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    student    TEXT    NOT NULL,
    class      TEXT    NOT NULL,
    exam_type  TEXT    NOT NULL,
    subject    TEXT    NOT NULL,
    marks      INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now')),
    UNIQUE(student, class, exam_type, subject)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id     TEXT    NOT NULL,
    person_type   TEXT    NOT NULL CHECK(person_type IN ('student','teacher')),
    date          TEXT    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'P' CHECK(status IN ('P','A','L')),
    class         TEXT,
    section       TEXT,
    subject       TEXT,
    created_at    TEXT    DEFAULT (datetime('now')),
    UNIQUE(person_id, person_type, date)
  );

  CREATE TABLE IF NOT EXISTS notices (
    id          TEXT    PRIMARY KEY,
    title       TEXT    NOT NULL,
    body        TEXT    NOT NULL,
    target      TEXT    NOT NULL DEFAULT 'All',
    date        TEXT,
    urgent      INTEGER DEFAULT 0,
    author      TEXT    DEFAULT 'Admin',
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS visitor_inquiries (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     TEXT    NOT NULL,
    email         TEXT    NOT NULL,
    phone         TEXT    NOT NULL,
    inquiry_type  TEXT    NOT NULL,
    message       TEXT    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'new',
    response      TEXT    DEFAULT NULL,
    responded_at  TEXT    DEFAULT NULL,
    visitor_username TEXT DEFAULT NULL,
    created_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id           TEXT    PRIMARY KEY,
    type         TEXT    NOT NULL DEFAULT 'info',
    title        TEXT    NOT NULL,
    body         TEXT    NOT NULL,
    class        TEXT,
    section      TEXT,
    student_id   TEXT,
    student_name TEXT,
    is_read      INTEGER DEFAULT 0,
    created_at   TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS staff (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    dept        TEXT    NOT NULL,
    role        TEXT    NOT NULL,
    salary      INTEGER NOT NULL DEFAULT 0,
    status      TEXT    NOT NULL DEFAULT 'Active',
    leave_days  INTEGER DEFAULT 0,
    join_date   TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    role        TEXT    NOT NULL,
    from_date   TEXT    NOT NULL,
    to_date     TEXT    NOT NULL,
    days        INTEGER NOT NULL DEFAULT 1,
    reason      TEXT,
    status      TEXT    NOT NULL DEFAULT 'Pending',
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS fee_structure (
    class       INTEGER PRIMARY KEY,
    total       INTEGER NOT NULL DEFAULT 0,
    tuition     INTEGER NOT NULL DEFAULT 0,
    lab         INTEGER DEFAULT 0,
    sports      INTEGER DEFAULT 0,
    misc        INTEGER DEFAULT 0,
    accent      TEXT
  );

  CREATE TABLE IF NOT EXISTS dashboard_stats (
    id                  INTEGER PRIMARY KEY DEFAULT 1,
    total_students      INTEGER DEFAULT 0,
    total_teachers      INTEGER DEFAULT 0,
    total_classes       INTEGER DEFAULT 0,
    attendance_percent  REAL    DEFAULT 0,
    pending_fees        INTEGER DEFAULT 0,
    upcoming_exams      INTEGER DEFAULT 0,
    total_revenue       INTEGER DEFAULT 0,
    new_admissions      INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS monthly_attendance (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    month   TEXT    NOT NULL,
    percent REAL    NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS fee_collection (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    month       TEXT    NOT NULL,
    collected   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS timetable (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    class        INTEGER NOT NULL,
    section      TEXT    NOT NULL,
    day          TEXT    NOT NULL,
    lecture_num  INTEGER,
    lecture      TEXT    NOT NULL,
    subject      TEXT    NOT NULL,
    teacher      TEXT    NOT NULL,
    created_at   TEXT    DEFAULT (datetime('now')),
    UNIQUE(class, section, day, lecture)
  );

  CREATE TABLE IF NOT EXISTS class_teacher_mapping (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    class         INTEGER NOT NULL,
    section       TEXT    NOT NULL,
    teacher_id    INTEGER,
    teacher_name  TEXT    NOT NULL,
    created_at    TEXT    DEFAULT (datetime('now')),
    UNIQUE(class, section)
  );

  CREATE TABLE IF NOT EXISTS subject_teacher_mapping (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    class         INTEGER NOT NULL,
    section       TEXT    NOT NULL,
    subject_id    INTEGER,
    subject_name  TEXT    NOT NULL,
    teacher_id    INTEGER,
    teacher_name  TEXT    NOT NULL,
    created_at    TEXT    DEFAULT (datetime('now')),
    UNIQUE(class, section, subject_name)
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    standard  INTEGER NOT NULL,
    UNIQUE(name, standard)
  );

  CREATE TABLE IF NOT EXISTS teacher_subjects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id  INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    standard    INTEGER NOT NULL,
    UNIQUE(teacher_id, subject_id, standard)
  );

  CREATE TABLE IF NOT EXISTS holidays (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    holiday_date  TEXT    NOT NULL UNIQUE,
    title         TEXT    NOT NULL,
    year          INTEGER NOT NULL,
    source        TEXT    DEFAULT 'manual'
  );

  CREATE TABLE IF NOT EXISTS vacation_periods (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    start_date   TEXT    NOT NULL,
    end_date     TEXT    NOT NULL,
    year         INTEGER NOT NULL,
    type         TEXT    DEFAULT 'vacation',
    description  TEXT,
    created_at   TEXT    DEFAULT (datetime('now'))
  );
`);

// Ensure attendance unique key includes person_type.
// Older DBs had UNIQUE(person_id, date), which is too broad and can cause incorrect conflicts.
const attendanceTable = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='attendance'").get();
const attendanceSql = String(attendanceTable?.sql || '').toUpperCase();
if (!attendanceSql.includes('UNIQUE(PERSON_ID, PERSON_TYPE, DATE)')) {
  db.exec(`
    ALTER TABLE attendance RENAME TO attendance_old;

    CREATE TABLE attendance (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id     TEXT    NOT NULL,
      person_type   TEXT    NOT NULL CHECK(person_type IN ('student','teacher')),
      date          TEXT    NOT NULL,
      status        TEXT    NOT NULL DEFAULT 'P' CHECK(status IN ('P','A','L')),
      class         TEXT,
      section       TEXT,
      subject       TEXT,
      created_at    TEXT    DEFAULT (datetime('now')),
      UNIQUE(person_id, person_type, date)
    );

    INSERT INTO attendance (id, person_id, person_type, date, status, class, section, subject, created_at)
    SELECT id, person_id, person_type, date, status, class, NULL, subject, created_at
    FROM attendance_old;

    DROP TABLE attendance_old;
  `);
}

try { db.exec("ALTER TABLE attendance ADD COLUMN section TEXT"); } catch (_) {}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_attendance_type_date ON attendance(person_type, date);
  CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class, date);
  CREATE INDEX IF NOT EXISTS idx_attendance_class_section_date ON attendance(class, section, date);
  CREATE INDEX IF NOT EXISTS idx_timetable_class_section ON timetable(class, section);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_class_nodiv_unique
    ON teachers(class)
    WHERE class IS NOT NULL
      AND TRIM(class) != ''
      AND COALESCE(TRIM(division), '') = '';
  CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_class_div_unique
    ON teachers(class, division)
    WHERE class IS NOT NULL
      AND TRIM(class) != ''
      AND COALESCE(TRIM(division), '') != '';
`);

// Migrate existing students table — add new columns if missing
['blood_group TEXT DEFAULT NULL', 'parent_access_key TEXT DEFAULT NULL', 'parent_id TEXT DEFAULT NULL'].forEach(col => {
  try { db.exec(`ALTER TABLE students ADD COLUMN ${col}`); } catch (_) {}
});

try { db.exec('ALTER TABLE teachers ADD COLUMN division TEXT'); } catch (_) {}

const syncStudentParentAccessKeys = db.transaction(() => {
  const rows = db.prepare(`
    SELECT id, phone
    FROM students
    WHERE CAST(class AS INTEGER) BETWEEN ? AND ?
  `).all(MIN_STANDARD, MAX_STANDARD);
  const updateStudentPhone = db.prepare(`
    UPDATE students
    SET phone = ?, parent_access_key = ?
    WHERE id = ?
  `);

  rows.forEach((row) => {
    const phone = normalizePhoneDigits(row.phone);
    if (phone.length === 10) {
      updateStudentPhone.run(phone, phone.slice(-4), row.id);
    }
  });
});

syncStudentParentAccessKeys();

// Migrate fees table — add receipt_at column if missing
try { db.exec("ALTER TABLE fees ADD COLUMN receipt_at TEXT DEFAULT NULL"); } catch (_) {}

// Migrate results table — add class and exam_type columns if missing
try { db.exec('ALTER TABLE results ADD COLUMN class TEXT'); } catch (_) {}
try { db.exec("ALTER TABLE results ADD COLUMN exam_type TEXT DEFAULT 'annual'"); } catch (_) {}
// Add unique index for upsert by student+class+exam_type
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_results_student_class_exam ON results(student, class, exam_type)'); } catch (_) {}

// Migrate existing parents / parent_children tables (created above on fresh DB,
// but may not exist if DB was created before this version)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS parents (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id    TEXT    NOT NULL UNIQUE,
      father_name  TEXT    NOT NULL,
      father_phone TEXT,
      mother_name  TEXT,
      mother_phone TEXT,
      occupation   TEXT,
      password     TEXT,
      status       TEXT    NOT NULL DEFAULT 'Active',
      created_at   TEXT    DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS parent_children (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_db_id INTEGER NOT NULL,
      student_id   INTEGER NOT NULL,
      FOREIGN KEY (parent_db_id) REFERENCES parents(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id)   REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(parent_db_id, student_id)
    );
  `);
} catch (_) {}

const FEE_CLASS_SQL = "(CASE WHEN instr(cls,'-') > 0 THEN CAST(substr(cls,1,instr(cls,'-') - 1) AS INTEGER) ELSE CAST(cls AS INTEGER) END)";
const CLASS_NAME_SQL = "(CASE WHEN instr(substr(name, 7), '-') > 0 THEN CAST(substr(name, 7, instr(substr(name, 7), '-') - 1) AS INTEGER) ELSE CAST(substr(name, 7) AS INTEGER) END)";
const TEACHER_CLASS_SQL = "(CASE WHEN class LIKE 'Class %' THEN CAST(REPLACE(class, 'Class ', '') AS INTEGER) ELSE CAST(class AS INTEGER) END)";
const NOTICE_STANDARD_REGEX = /\b(?:Class|Classes)\s+([1-9]\d?)(?:\s*(?:and|[-–])\s*([1-9]\d?))?/gi;

function normalizeNoticeBody(body) {
  if (typeof body !== 'string' || !body.trim()) return body;

  return body.replace(NOTICE_STANDARD_REGEX, (match, first, second) => {
    const standards = [first, second].filter(Boolean).map(Number);
    return standards.some((value) => value > MAX_STANDARD) ? 'Classes 1 to 6' : match;
  });
}

function syncSupportedClasses() {
  const groupedClasses = db.prepare(`
    SELECT class, section, COUNT(*) AS students
    FROM students
    WHERE CAST(class AS INTEGER) BETWEEN ? AND ?
    GROUP BY class, section
    ORDER BY CAST(class AS INTEGER), section
  `).all(MIN_STANDARD, MAX_STANDARD);

  const existingByName = new Map(
    db.prepare('SELECT id, name FROM classes').all().map((row) => [row.name, row.id])
  );
  const updateClass = db.prepare('UPDATE classes SET students = ? WHERE id = ?');
  const insertClass = db.prepare('INSERT INTO classes (id, name, teacher, students, room) VALUES (?, ?, ?, ?, ?)');

  for (const row of groupedClasses) {
    const name = `Class ${row.class}-${row.section}`;
    const existingId = existingByName.get(name);
    if (existingId) {
      updateClass.run(row.students, existingId);
      continue;
    }

    insertClass.run(`CLS_AUTO_${row.class}${row.section}`, name, '', row.students, '');
  }
}

const cleanupUnsupportedStandardData = db.transaction(() => {
  db.prepare("DELETE FROM attendance WHERE person_type = 'student' AND CAST(COALESCE(class, '0') AS INTEGER) > ?").run(MAX_STANDARD);
  db.prepare('DELETE FROM marks WHERE CAST(class AS INTEGER) > ?').run(MAX_STANDARD);
  db.prepare("DELETE FROM results WHERE CAST(COALESCE(NULLIF(class, ''), '0') AS INTEGER) > ?").run(MAX_STANDARD);
  db.prepare('DELETE FROM exams WHERE CAST(class AS INTEGER) > ?').run(MAX_STANDARD);
  db.prepare(`DELETE FROM fees WHERE ${FEE_CLASS_SQL} > ?`).run(MAX_STANDARD);
  db.prepare('DELETE FROM timetable WHERE class > ?').run(MAX_STANDARD);
  db.prepare('DELETE FROM fee_structure WHERE class > ?').run(MAX_STANDARD);
  db.prepare('DELETE FROM teacher_subjects WHERE standard > ?').run(MAX_STANDARD);
  db.prepare('DELETE FROM subjects WHERE standard > ?').run(MAX_STANDARD);
  db.prepare(`DELETE FROM classes WHERE name LIKE 'Class %' AND ${CLASS_NAME_SQL} > ?`).run(MAX_STANDARD);
  db.prepare(`UPDATE teachers SET class = NULL WHERE class IS NOT NULL AND TRIM(class) != '' AND ${TEACHER_CLASS_SQL} > ?`).run(MAX_STANDARD);
  db.prepare('DELETE FROM students WHERE CAST(class AS INTEGER) > ?').run(MAX_STANDARD);
  db.prepare('DELETE FROM parents WHERE id NOT IN (SELECT DISTINCT parent_db_id FROM parent_children)').run();
  syncSupportedClasses();
  const updateNoticeBody = db.prepare('UPDATE notices SET body = ? WHERE id = ?');
  for (const notice of db.prepare('SELECT id, body FROM notices').all()) {
    const normalizedBody = normalizeNoticeBody(notice.body);
    if (normalizedBody !== notice.body) updateNoticeBody.run(normalizedBody, notice.id);
  }
});

cleanupUnsupportedStandardData();

module.exports = db;
