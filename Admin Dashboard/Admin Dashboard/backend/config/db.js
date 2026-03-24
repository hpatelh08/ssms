// =============================================
//  DATABASE CONFIG — SQLite via better-sqlite3
// =============================================
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database.sqlite';
const db = new Database(path.resolve(__dirname, '..', DB_PATH));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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
      subject       TEXT,
      created_at    TEXT    DEFAULT (datetime('now')),
      UNIQUE(person_id, person_type, date)
    );

    INSERT INTO attendance (id, person_id, person_type, date, status, class, subject, created_at)
    SELECT id, person_id, person_type, date, status, class, subject, created_at
    FROM attendance_old;

    DROP TABLE attendance_old;
  `);
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_attendance_type_date ON attendance(person_type, date);
  CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class, date);
  CREATE INDEX IF NOT EXISTS idx_timetable_class_section ON timetable(class, section);
`);

// Migrate existing students table — add new columns if missing
['blood_group TEXT DEFAULT NULL', 'parent_access_key TEXT DEFAULT NULL', 'parent_id TEXT DEFAULT NULL'].forEach(col => {
  try { db.exec(`ALTER TABLE students ADD COLUMN ${col}`); } catch (_) {}
});

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

module.exports = db;
