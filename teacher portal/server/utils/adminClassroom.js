import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const projectRoot = path.resolve(__dirname, '..', '..', '..');
const adminBackendRoot = path.join(projectRoot, 'Admin Dashboard', 'backend');
const adminDbPath = path.join(adminBackendRoot, 'database.sqlite');

const Database = require(path.join(adminBackendRoot, 'node_modules', 'better-sqlite3'));
const { MIN_STANDARD, MAX_STANDARD, PRIMARY_STANDARD_MAX } = require(path.join(adminBackendRoot, 'config', 'standards.js'));

const PRIMARY_SUBJECTS = ['English', 'Mathematics', 'EVS', 'Gujarati', 'Hindi', 'Drawing', 'PT', 'Moral Science', 'GK'];
const UPPER_SUBJECTS = ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer', 'PT', 'Drawing'];
const VALID_SECTIONS = ['A', 'B', 'C'];

const SUBJECT_NAME_MAP = {
  Mathematics: 'Mathematics',
  Math: 'Mathematics',
  Science: 'Science',
  English: 'English',
  Hindi: 'Hindi',
  Gujarati: 'Gujarati',
  Sanskrit: 'Sanskrit',
  Computer: 'Computer',
  'Computer / IT': 'Computer',
  EVS: 'EVS',
  'Environmental Studies (EVS)': 'EVS',
  Drawing: 'Drawing',
  'Drawing / Art': 'Drawing',
  PT: 'PT',
  'Physical Education (PT)': 'PT',
  'Moral Science': 'Moral Science',
  GK: 'GK',
  'General Knowledge (GK)': 'GK',
  'Social Science': 'Social Science',
};

let adminDb = null;

function getAdminDb() {
  if (!adminDb) {
    adminDb = new Database(adminDbPath, { readonly: true, fileMustExist: true });
  }
  return adminDb;
}

export function extractStandard(value) {
  const match = String(value ?? '').match(/\d+/);
  return match ? String(parseInt(match[0], 10)) : '';
}

export function normalizeSection(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return VALID_SECTIONS.includes(normalized) ? normalized : '';
}

export function buildAdminClassId(className, section) {
  const std = extractStandard(className);
  const normalizedSection = normalizeSection(section || 'A') || 'A';
  if (!std) return '';
  return `admin-class-${std}-${normalizedSection}`;
}

export function parseAdminClassId(classId) {
  const match = String(classId || '').trim().match(/^admin-class-(\d+)-([A-Za-z])$/);
  if (!match) return null;

  const std = extractStandard(match[1]);
  const section = normalizeSection(match[2]);
  if (!std || !section) return null;

  return { std, section };
}

function normalizeSubjectName(subjectName) {
  return SUBJECT_NAME_MAP[String(subjectName || '').trim()] || String(subjectName || '').trim();
}

function getSubjectPoolForClass(std) {
  const standard = parseInt(String(std || '0'), 10);
  return standard <= PRIMARY_STANDARD_MAX ? PRIMARY_SUBJECTS : UPPER_SUBJECTS;
}

function extractTeacherClassKeys(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) return [];

  const match = rawValue.match(/(\d+)\s*[- ]?\s*([A-Za-z])?$/);
  if (!match) return [];

  const std = extractStandard(match[1]);
  if (!std) return [];

  const section = normalizeSection(match[2]);
  if (section) {
    return [`${std}-${section}`];
  }

  return VALID_SECTIONS.map((item) => `${std}-${item}`);
}

function buildTeacherIndex(db) {
  const rows = db.prepare(`
    SELECT name, subject, class
    FROM teachers
    WHERE status = 'Active'
    ORDER BY name
  `).all();

  const teacherByClassSubject = new Map();
  const teacherBySubject = new Map();

  for (const row of rows) {
    const teacherName = String(row.name || '').trim();
    const subjectName = normalizeSubjectName(row.subject);

    if (!teacherName || !subjectName) {
      continue;
    }

    if (!teacherBySubject.has(subjectName)) {
      teacherBySubject.set(subjectName, teacherName);
    }

    const classKeys = extractTeacherClassKeys(row.class);
    classKeys.forEach((classKey) => {
      const scopedKey = `${classKey}|${subjectName}`;
      if (!teacherByClassSubject.has(scopedKey)) {
        teacherByClassSubject.set(scopedKey, teacherName);
      }
    });
  }

  return { teacherByClassSubject, teacherBySubject };
}

function getTeacherForSubject(teacherIndex, std, section, subjectName) {
  const normalizedSubject = normalizeSubjectName(subjectName);
  const classScopedKey = `${extractStandard(std)}-${normalizeSection(section || 'A') || 'A'}|${normalizedSubject}`;

  return (
    teacherIndex.teacherByClassSubject.get(classScopedKey) ||
    teacherIndex.teacherBySubject.get(normalizedSubject) ||
    'TBD'
  );
}

function calculateAge(dob) {
  if (!dob) return '';

  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : '';
}

function getRemarkFromAverage(averagePercentage) {
  const average = Number(averagePercentage) || 0;
  if (average >= 75) return 'Good';
  if (average >= 50) return 'Average';
  return 'Bad';
}

function getGpaFromAverage(averagePercentage) {
  const average = Number(averagePercentage) || 0;
  return Math.min(4, average / 25).toFixed(2);
}

function getResolvedFilter(query = {}) {
  const parsedClassId = parseAdminClassId(query.classId);
  const teacherEmail = String(query.teacherEmail || '').trim();

  const emailMatch = teacherEmail.match(/teach(\d+)([A-Za-z])/i);
  const emailStd = emailMatch ? extractStandard(emailMatch[1]) : '';
  const emailSection = emailMatch ? normalizeSection(emailMatch[2]) : '';

  const std =
    parsedClassId?.std ||
    extractStandard(query.std) ||
    extractStandard(query.className) ||
    extractStandard(query.assignedClass) ||
    extractStandard(query.class) ||
    emailStd;

  const section =
    parsedClassId?.section ||
    normalizeSection(query.section) ||
    normalizeSection(query.division) ||
    normalizeSection(query.assignedSection) ||
    emailSection;

  return { std, section };
}

function buildStudentsWhereClause(filter = {}) {
  const whereParts = ['CAST(s.class AS INTEGER) BETWEEN ? AND ?'];
  const params = [MIN_STANDARD, MAX_STANDARD];

  if (filter.std) {
    whereParts.push('CAST(s.class AS INTEGER) = ?');
    params.push(parseInt(filter.std, 10));
  }

  if (filter.section) {
    whereParts.push('UPPER(COALESCE(s.section, ?)) = ?');
    params.push(filter.section, filter.section);
  }

  return {
    whereClause: `WHERE ${whereParts.join(' AND ')}`,
    params,
  };
}

function buildStudentMetrics(db, filter = {}) {
  const { whereClause, params } = buildStudentsWhereClause(filter);

  const performanceRows = db.prepare(`
    SELECT
      s.id AS student_db_id,
      ROUND(AVG(CAST(NULLIF(r.percent, '') AS REAL)), 2) AS average_percentage
    FROM students s
    LEFT JOIN results r
      ON LOWER(COALESCE(r.student, '')) = LOWER(COALESCE(s.name, ''))
     AND CAST(COALESCE(r.class, '0') AS INTEGER) = CAST(COALESCE(s.class, '0') AS INTEGER)
    ${whereClause}
    GROUP BY s.id
  `).all(...params);

  const attendanceRows = db.prepare(`
    SELECT
      s.id AS student_db_id,
      ROUND(
        AVG(
          CASE
            WHEN UPPER(COALESCE(a.status, '')) IN ('P', 'PRESENT', 'L', 'LATE') THEN 100
            WHEN UPPER(COALESCE(a.status, '')) IN ('A', 'ABSENT') THEN 0
            ELSE NULL
          END
        ),
        2
      ) AS attendance_rate
    FROM students s
    LEFT JOIN attendance a
      ON LOWER(COALESCE(a.person_id, '')) = LOWER(COALESCE(s.student_id, ''))
     AND a.person_type = 'student'
    ${whereClause}
    GROUP BY s.id
  `).all(...params);

  const performanceMap = new Map();
  const attendanceMap = new Map();

  performanceRows.forEach((row) => {
    performanceMap.set(row.student_db_id, Number(row.average_percentage) || 0);
  });

  attendanceRows.forEach((row) => {
    attendanceMap.set(row.student_db_id, Number(row.attendance_rate) || 0);
  });

  return { performanceMap, attendanceMap };
}

function mapStudentRows(rows, metrics, classId) {
  return rows.map((row, index) => {
    const averagePercentage = metrics.performanceMap.get(row.id) || 0;
    const attendanceRate = metrics.attendanceMap.get(row.id) || 0;
    const dateOfBirth = row.dob || '';
    const age = calculateAge(dateOfBirth);
    const parentName = String(row.parent || '').trim();

    return {
      _id: `admin-student-${row.id}`,
      adminId: row.id,
      studentDbId: row.id,
      grNumber: row.gr_number || '',
      rollNumber: `R${String(index + 1).padStart(3, '0')}`,
      studentId: row.student_id || '',
      studentPassword: row.student_password || '',
      name: row.name || '',
      classId,
      className: extractStandard(row.class),
      section: normalizeSection(row.section || 'A') || 'A',
      gender: row.gender || '',
      age,
      dateOfBirth,
      bloodGroup: row.blood_group || '',
      email: row.student_id ? `${String(row.student_id).toLowerCase()}@school.local` : '',
      phone: row.phone || '',
      address: row.address || '',
      fatherName: parentName,
      motherName: '',
      parentPhone: row.phone || '',
      admissionDate: row.admission || '',
      currentGPA: getGpaFromAverage(averagePercentage),
      averagePercentage,
      attendanceRate,
      healthInfo: '',
      allergies: '',
      behaviorRemarks: getRemarkFromAverage(averagePercentage),
      remark: getRemarkFromAverage(averagePercentage),
      status: row.status || 'Active',
      fees: row.fees || '',
      parentName,
      parentAccessKey: row.parent_access_key || '',
    };
  });
}

function buildSubjects(std, section, teacherIndex) {
  return getSubjectPoolForClass(std).map((subjectName, index) => ({
    _id: `subject-${extractStandard(std)}-${normalizeSection(section || 'A') || 'A'}-${index + 1}`,
    subjectName,
    teacher: {
      name: getTeacherForSubject(teacherIndex, std, section, subjectName),
    },
  }));
}

export function getAdminClassrooms(query = {}) {
  const filter = getResolvedFilter(query);
  const db = getAdminDb();
  const teacherIndex = buildTeacherIndex(db);
  const metrics = buildStudentMetrics(db, filter);
  const { whereClause, params } = buildStudentsWhereClause(filter);

  const rows = db.prepare(`
    SELECT
      s.id,
      s.gr_number,
      s.student_id,
      s.student_password,
      s.name,
      s.admission,
      s.class,
      s.section,
      s.parent,
      s.phone,
      s.status,
      s.fees,
      s.dob,
      s.gender,
      s.address,
      s.blood_group,
      s.parent_access_key
    FROM students s
    ${whereClause}
    ORDER BY
      CAST(COALESCE(s.class, '0') AS INTEGER),
      UPPER(COALESCE(s.section, 'A')),
      s.id,
      LOWER(COALESCE(s.name, ''))
  `).all(...params);

  const classroomMap = new Map();

  for (const row of rows) {
    const className = extractStandard(row.class);
    const section = normalizeSection(row.section || 'A') || 'A';
    const classId = buildAdminClassId(className, section);

    if (!classroomMap.has(classId)) {
      classroomMap.set(classId, {
        _id: classId,
        source: 'admin',
        className,
        section,
        room: '',
        studentCount: 0,
        subjects: buildSubjects(className, section, teacherIndex),
        students: [],
      });
    }

    classroomMap.get(classId).students.push(row);
  }

  const classrooms = Array.from(classroomMap.values()).map((classroom) => {
    const students = mapStudentRows(classroom.students, metrics, classroom._id);

    return {
      ...classroom,
      studentCount: students.length,
      students,
    };
  });

  return classrooms;
}

export function getAdminStudents(query = {}) {
  return getAdminClassrooms(query).flatMap((classroom) => classroom.students);
}

export function findAdminStudentById(studentId) {
  const rawId = String(studentId || '').trim();
  if (!rawId) return null;

  const numericIdMatch = rawId.match(/(\d+)$/);
  if (!numericIdMatch) return null;

  const db = getAdminDb();
  const row = db.prepare(`
    SELECT
      s.id,
      s.gr_number,
      s.student_id,
      s.student_password,
      s.name,
      s.admission,
      s.class,
      s.section,
      s.parent,
      s.phone,
      s.status,
      s.fees,
      s.dob,
      s.gender,
      s.address,
      s.blood_group,
      s.parent_access_key
    FROM students s
    WHERE s.id = ?
  `).get(parseInt(numericIdMatch[1], 10));

  if (!row) {
    return null;
  }

  const classId = buildAdminClassId(row.class, row.section);
  const metrics = buildStudentMetrics(db, {
    std: extractStandard(row.class),
    section: normalizeSection(row.section || 'A'),
  });

  return mapStudentRows([row], metrics, classId)[0] || null;
}

function getStudentRowByIdentifier(db, identifier) {
  const raw = String(identifier || '').trim();
  if (!raw) return null;

  const numericIdMatch = raw.match(/(\d+)$/);
  const normalized = raw.toLowerCase();

  return db.prepare(`
    SELECT
      s.id,
      s.gr_number,
      s.student_id,
      s.student_password,
      s.name,
      s.admission,
      s.class,
      s.section,
      s.parent,
      s.phone,
      s.status,
      s.fees,
      s.dob,
      s.gender,
      s.address,
      s.blood_group,
      s.parent_access_key
    FROM students s
    WHERE LOWER(COALESCE(s.student_id, '')) = ?
       OR LOWER(COALESCE(s.gr_number, '')) = ?
       OR LOWER(COALESCE(s.admission, '')) = ?
       OR LOWER(COALESCE(s.name, '')) = ?
       OR ( ? IS NOT NULL AND s.id = ? )
    LIMIT 1
  `).get(
    normalized,
    normalized,
    normalized,
    normalized,
    numericIdMatch ? parseInt(numericIdMatch[1], 10) : null,
    numericIdMatch ? parseInt(numericIdMatch[1], 10) : null
  ) || null;
}

export function findAdminStudentByAnyIdentifier(identifier) {
  const db = getAdminDb();
  const row = getStudentRowByIdentifier(db, identifier);
  if (!row) return null;

  const classId = buildAdminClassId(row.class, row.section);
  const metrics = buildStudentMetrics(db, {
    std: extractStandard(row.class),
    section: normalizeSection(row.section || 'A'),
  });

  return mapStudentRows([row], metrics, classId)[0] || null;
}

export function getAdminNotifications(query = {}) {
  const db = getAdminDb();
  const std = extractStandard(query.std || query.className || query.class || '');
  const section = normalizeSection(query.section || query.division || '');
  const limit = Math.min(Math.max(parseInt(query.limit || '10', 10) || 10, 1), 50);

  const whereParts = [];
  const params = [];

  if (std) {
    whereParts.push("CAST(COALESCE(class, '0') AS INTEGER) = ?");
    params.push(parseInt(std, 10));
  }

  if (section) {
    whereParts.push('UPPER(COALESCE(section, ?)) = ?');
    params.push(section, section);
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT
      id,
      type,
      title,
      body,
      class,
      section,
      student_id,
      student_name,
      is_read,
      created_at
    FROM notifications
    ${whereClause}
    ORDER BY datetime(created_at) DESC, rowid DESC
    LIMIT ?
  `).all(...params, limit);

  return rows.map((row) => ({
    id: row.id,
    type: row.type || 'info',
    title: row.title || 'Notification',
    body: row.body || '',
    className: extractStandard(row.class),
    section: normalizeSection(row.section || ''),
    studentId: row.student_id || '',
    studentName: row.student_name || '',
    isRead: Boolean(row.is_read),
    createdAt: row.created_at || '',
  }));
}
