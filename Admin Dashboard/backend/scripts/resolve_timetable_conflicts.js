const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

function normalizeSection(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeTeacherName(value) {
  return String(value || '').trim();
}

function buildClassTeacherMap() {
  const rows = db.prepare("SELECT name, class, division FROM teachers WHERE status = 'Active'").all();
  const map = new Map();
  rows.forEach((row) => {
    const classNumber = String(row.class || '').match(/\d+/)?.[0] || '';
    const section = normalizeSection(row.division || String(row.class || '').match(/([A-Za-z])$/)?.[1] || '');
    if (!classNumber || !section) return;
    const key = `${classNumber}-${section}`;
    if (!map.has(key)) {
      map.set(key, normalizeTeacherName(row.name));
    }
  });
  return map;
}

function sortClassKey(a, b) {
  const [aNum, aSec] = a.split('-');
  const [bNum, bSec] = b.split('-');
  const numDiff = Number(aNum) - Number(bNum);
  if (numDiff !== 0) return numDiff;
  return String(aSec).localeCompare(String(bSec));
}

function resolveConflicts() {
  const classTeacherMap = buildClassTeacherMap();

  const rows = db.prepare(`
    SELECT id, class, section, day, lecture_num, lecture, subject, teacher
    FROM timetable
    ORDER BY day, lecture_num, class, section
  `).all();

  const updateTeacher = db.prepare('UPDATE timetable SET teacher = ? WHERE id = ?');

  // Step 1: Ensure Lecture 1 uses class teacher if available.
  rows.forEach((row) => {
    if (row.lecture_num !== 1) return;
    const classNumber = String(row.class || '').trim();
    const section = normalizeSection(row.section || '');
    const key = `${classNumber}-${section}`;
    const classTeacher = classTeacherMap.get(key);
    if (!classTeacher) return;
    if (normalizeTeacherName(row.teacher) !== classTeacher) {
      updateTeacher.run(classTeacher, row.id);
      row.teacher = classTeacher;
    }
  });

  // Step 2: Enforce one teacher per slot across all classes.
  const slotMap = new Map();

  rows.forEach((row) => {
    const teacher = normalizeTeacherName(row.teacher);
    if (!teacher || teacher.toUpperCase() === 'TBD') return;
    if (!row.day || !row.lecture_num) return;

    const slotKey = `${row.day}|${row.lecture_num}|${teacher.toLowerCase()}`;
    if (!slotMap.has(slotKey)) slotMap.set(slotKey, []);
    slotMap.get(slotKey).push(row);
  });

  slotMap.forEach((entries) => {
    if (entries.length <= 1) return;

    const lectureNum = entries[0].lecture_num;
    let keep = entries[0];

    if (lectureNum === 1) {
      const match = entries.find((row) => {
        const key = `${String(row.class || '').trim()}-${normalizeSection(row.section)}`;
        return classTeacherMap.get(key) === normalizeTeacherName(row.teacher);
      });
      if (match) keep = match;
    }

    if (!keep) {
      const sorted = entries
        .map((row) => ({
          key: `${String(row.class || '').trim()}-${normalizeSection(row.section)}`,
          row
        }))
        .sort((a, b) => sortClassKey(a.key, b.key));
      keep = sorted[0].row;
    }

    entries.forEach((row) => {
      if (row.id === keep.id) return;
      updateTeacher.run('TBD', row.id);
    });
  });
}

resolveConflicts();
console.log('Timetable conflicts resolved.');
