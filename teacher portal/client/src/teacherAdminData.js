import axios from 'axios';

function normalizeClassNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? String(parseInt(match[0], 10)) : '';
}

function normalizeSection(value) {
  return String(value || '').trim().toUpperCase();
}

function getTeacherClassInfo(currentUser = {}) {
  const rawClass = String(
    currentUser?.classTeacherOf
    || currentUser?.assignedClass
    || currentUser?.class
    || currentUser?.classTeacherStd
    || ''
  ).trim();

  const rawDivision = String(
    currentUser?.division
    || currentUser?.classTeacherDiv
    || ''
  ).trim();

  const classMatch = rawClass.match(/(\d+)\s*[- ]?\s*([A-Za-z])?$/);
  if (classMatch) {
    return {
      std: String(parseInt(classMatch[1], 10)),
      section: normalizeSection(rawDivision || classMatch[2] || ''),
    };
  }

  return {
    std: normalizeClassNumber(rawClass),
    section: normalizeSection(rawDivision),
  };
}

function buildClassId(className, section) {
  const classNumber = normalizeClassNumber(className);
  const division = normalizeSection(section);
  return classNumber && division ? `admin-class-${classNumber}-${division}` : '';
}

function getAdminApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:5000';
  }

  const host = window.location.hostname || '127.0.0.1';
  return `http://${host}:5000`;
}

function mapStudent(student = {}, index = 0) {
  const className = normalizeClassNumber(student.class || student.standard || student.className || '');
  const section = normalizeSection(student.section || student.division || '');
  const studentId = String(student.student_id || student.studentId || '').trim();
  const admission = String(student.admission || student.admissionNumber || '').trim();
  const rollNumber = String(student.gr_number || student.rollNumber || student.roll || admission || `R${String(index + 1).padStart(3, '0')}`).trim();

  return {
    _id: student._id || `admin-student-${student.id || studentId || index + 1}`,
    adminId: student.id || student.adminId || index + 1,
    studentDbId: student.id || student.studentDbId || index + 1,
    grNumber: String(student.gr_number || student.grNumber || '').trim(),
    grNo: String(student.gr_number || student.grNumber || '').trim(),
    admissionNumber: admission,
    rollNumber,
    studentId,
    studentPassword: String(student.student_password || student.studentPassword || '').trim(),
    name: String(student.name || student.full_name || student.studentName || 'Student').trim(),
    classId: buildClassId(className, section),
    className,
    section,
    standard: className,
    division: section,
    gender: String(student.gender || '').trim(),
    age: String(student.age || '').trim(),
    dateOfBirth: String(student.dob || student.dateOfBirth || '').trim(),
    bloodGroup: String(student.blood_group || student.bloodGroup || '').trim(),
    email: String(student.email || '').trim(),
    phone: String(student.phone || student.parent_contact || student.parentPhone || '').trim(),
    address: String(student.address || '').trim(),
    fatherName: String(student.fatherName || student.parent || student.parentName || '').trim(),
    motherName: String(student.motherName || '').trim(),
    parentPhone: String(student.parentPhone || student.phone || student.parent_contact || '').trim(),
    admissionDate: String(student.admission || student.admissionDate || '').trim(),
    currentGPA: String(student.currentGPA || '').trim(),
    averagePercentage: Number(student.averagePercentage) || 0,
    attendanceRate: Number(student.attendanceRate) || 0,
    healthInfo: String(student.healthInfo || '').trim(),
    allergies: String(student.allergies || '').trim(),
    behaviorRemarks: student.behaviorRemarks || '',
    remark: String(student.remark || '').trim(),
    status: String(student.status || 'Active').trim(),
    fees: String(student.fees || '').trim(),
    parentName: String(student.parent || student.parentName || '').trim(),
  };
}

async function fetchMasterStudents() {
  const response = await axios.get(`${getAdminApiBaseUrl()}/api/master/student-data`, { timeout: 5000 });
  const payload = response?.data?.data || {};
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.students)) return payload.students;
  return [];
}

function filterStudentsForTeacher(students = [], currentUser = {}) {
  const { std, section } = getTeacherClassInfo(currentUser);
  if (!std || !section) return [];

  return students.filter((student) => (
    normalizeClassNumber(student.class || student.standard || student.className || '') === std
    && normalizeSection(student.section || student.division || '') === section
  ));
}

export async function loadTeacherClasses(currentUser) {
  try {
    const masterStudents = await fetchMasterStudents();
    const teacherStudents = filterStudentsForTeacher(masterStudents, currentUser).map(mapStudent);
    const { std, section } = getTeacherClassInfo(currentUser);

    if (!std || !section) return [];

    return [{
      _id: buildClassId(std, section),
      className: std,
      section,
      source: 'admin-master-json',
      students: teacherStudents,
      studentCount: teacherStudents.length,
    }];
  } catch (error) {
    console.error('Error loading teacher classes from admin master data:', error);
    return [];
  }
}

export async function loadClassStudents(classId, currentUser, classes = []) {
  const selectedClass = classes.find((cls) => cls._id === classId);
  if (Array.isArray(selectedClass?.students) && selectedClass.students.length > 0) {
    return selectedClass.students;
  }

  try {
    const masterStudents = await fetchMasterStudents();
    return filterStudentsForTeacher(masterStudents, currentUser).map(mapStudent);
  } catch (error) {
    console.error('Error loading class students from admin master data:', error);
    return [];
  }
}

export async function loadTeacherStudents(currentUser, classes = []) {
  if (classes.length > 0) {
    const flattened = classes.flatMap((cls) => cls.students || []);
    if (flattened.length > 0) {
      return flattened;
    }
  }

  try {
    const masterStudents = await fetchMasterStudents();
    return filterStudentsForTeacher(masterStudents, currentUser).map(mapStudent);
  } catch (error) {
    console.error('Error loading teacher students from admin master data:', error);
    return [];
  }
}

export async function loadTeacherNotifications(currentUser, limit = 10) {
  try {
    const { std, section } = getTeacherClassInfo(currentUser);
    if (!std || !section) return [];

    const response = await axios.get(`${getAdminApiBaseUrl()}/api/class/notifications`, {
      params: { std, section, limit },
      timeout: 4000,
    });

    const notifications = response?.data?.data || [];
    return Array.isArray(notifications) ? notifications : [];
  } catch (error) {
    console.error('Error loading teacher notifications from admin backend API:', error);
    return [];
  }
}
