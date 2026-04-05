const path = require('path');
const Database = require('better-sqlite3');
const { MIN_STANDARD, MAX_STANDARD, PRIMARY_STANDARD_MAX } = require('../config/standards');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

const SUBJECTS_BY_STD = {
  primary: ['English', 'Mathematics', 'EVS', 'Gujarati', 'Hindi', 'Drawing', 'PT', 'Moral Science', 'GK'],
  upper: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer', 'PT', 'Drawing']
};

const SUBJECT_MAP = {
  'Mathematics': 'Mathematics',
  'Science': 'Science',
  'Biology': 'Science',
  'Chemistry': 'Science',
  'Physics': 'Science',
  'English': 'English',
  'Hindi': 'Hindi',
  'Sanskrit': 'Sanskrit',
  'Computer': 'Computer',
  'Art': 'Drawing',
  'PE': 'PT',
  'History': 'Social Science',
  'Geography': 'Social Science',
  'Civics': 'Social Science',
  'Music': 'GK',
  'Accountancy': 'EVS',
  'Economics': 'EVS',
  'Commerce': 'Moral Science',
  'Business Studies': 'Moral Science',
  'Psychology': 'GK'
};

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

function normalizeSubjectName(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return SUBJECT_MAP[raw] || raw;
}

function getClassTeacherForClass(std, section) {
  const classNumber = String(std || '').trim();
  const division = String(section || '').trim().toUpperCase();
  if (!classNumber || !division) return null;

  const exact = db.prepare(`
    SELECT name, subject
    FROM teachers
    WHERE CAST(class AS TEXT) = ? AND UPPER(COALESCE(division, '')) = ? AND status = 'Active'
    LIMIT 1
  `).get(classNumber, division);
  if (exact?.name) return { name: exact.name, subject: exact.subject };

  const compact = db.prepare(`
    SELECT name, subject
    FROM teachers
    WHERE UPPER(COALESCE(class, '')) = ? AND status = 'Active'
    LIMIT 1
  `).get(`${classNumber}${division}`);
  if (compact?.name) return { name: compact.name, subject: compact.subject };

  return null;
}

function buildTTTeachers() {
  const map = {};
  try {
    const rows = db.prepare("SELECT name, subject FROM teachers WHERE status = 'Active' ORDER BY name").all();
    for (const { name, subject } of rows) {
      const ttSubject = SUBJECT_MAP[subject] || subject;
      if (!map[ttSubject]) map[ttSubject] = [];
      if (!map[ttSubject].includes(name)) map[ttSubject].push(name);
    }
  } catch (_) {}
  return map;
}

const TT_TEACHERS = buildTTTeachers();

function generateTimetable(std, section) {
  const isPrimary = std <= PRIMARY_STANDARD_MAX;
  const subjectPool = isPrimary ? SUBJECTS_BY_STD.primary : SUBJECTS_BY_STD.upper;
  const classTeacher = getClassTeacherForClass(std, section);
  const classTeacherName = String(classTeacher?.name || '').trim();
  const classTeacherSubject = normalizeSubjectName(classTeacher?.subject || '');

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
  TT_DAYS.forEach((day) => {
    const slots = day === 'Saturday' ? TT_SLOTS_SATURDAY : TT_SLOTS_WEEKDAY;
    const lectures = [];
    const shuffled = [...subjectPool].sort(() => rand() - 0.5);
    let si = 0;
    slots.forEach((slot) => {
      if (slot.isBreak) {
        lectures.push({ ...slot, subject: null, teacher: null });
      } else {
        let subj = shuffled[si % shuffled.length];
        let teacher = getTeacher(subj);
        if (slot.num === 1 && classTeacherName) {
          subj = classTeacherSubject || subj;
          teacher = classTeacherName;
        } else {
          si++;
        }
        lectures.push({ ...slot, subject: subj, teacher });
      }
    });
    schedule[day] = lectures;
  });
  return schedule;
}

function generateAll() {
  const insert = db.prepare(
    'INSERT INTO timetable (class, section, day, lecture_num, lecture, subject, teacher) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM timetable').run();

    for (let std = MIN_STANDARD; std <= MAX_STANDARD; std += 1) {
      for (const section of ['A', 'B', 'C']) {
        const schedule = generateTimetable(std, section);
        TT_DAYS.forEach((day) => {
          const slots = schedule[day] || [];
          slots.forEach((slot) => {
            if (slot.isBreak || !slot.subject) return;
            insert.run(std, section, day, slot.num, `Lecture ${slot.num}`, slot.subject, slot.teacher);
          });
        });
      }
    }
  });

  tx();
}

generateAll();
db.close();

require('./resolve_timetable_conflicts');
console.log('Timetable generated for all classes and conflicts resolved.');
