import axios from 'axios';
import {
  buildMockTeacherClass,
  getAssignedTeacherClassNumber,
  getAssignedTeacherSection,
} from '../config/teacherClasses';

const PRIMARY_SUBJECTS = ['English', 'Mathematics', 'EVS', 'Gujarati', 'Hindi', 'Drawing', 'PT', 'Moral Science', 'GK'];
const UPPER_SUBJECTS = ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer', 'PT', 'Drawing'];
const ADMIN_MOCK_SECTIONS = ['A', 'B', 'C'];
const ADMIN_MOCK_FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Krish', 'Ishaan', 'Rohan', 'Dev', 'Ananya', 'Diya', 'Myra', 'Aisha', 'Siya', 'Meera', 'Ritika', 'Kavya', 'Priyansh', 'Yash', 'Dhruv', 'Tanvi', 'Kiara'];
const ADMIN_MOCK_LAST_NAMES = ['Sharma', 'Patel', 'Verma', 'Gupta', 'Joshi', 'Mehta', 'Kapoor', 'Singh', 'Desai', 'Nair', 'Yadav', 'Iyer', 'Kulkarni', 'Tiwari', 'Chauhan', 'Rao'];
const ADMIN_MOCK_STREETS = ['Main Street', 'Park Avenue', 'Lake Road', 'Rose Colony', 'Green View', 'Hill Side', 'River Lane', 'Maple Avenue'];

let adminMockStudentsCache = null;

function getClassNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? String(parseInt(match[0], 10)) : '';
}

function normalizeSection(value) {
  return String(value || '').trim().toUpperCase() || 'A';
}

function pad(value, size = 3) {
  return String(value).padStart(size, '0');
}

function getAdminBackendBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:5000';
  }

  const host = window.location.hostname || '127.0.0.1';
  return `http://${host}:5000`;
}

function buildClassId(className, section) {
  return `admin-class-${getClassNumber(className) || '1'}-${normalizeSection(section)}`;
}

function generateAdminMockStudents() {
  const students = [];
  let id = 1;

  for (let std = 1; std <= 6; std += 1) {
    for (const section of ADMIN_MOCK_SECTIONS) {
      for (let roll = 1; roll <= 35; roll += 1) {
        const first = ADMIN_MOCK_FIRST_NAMES[(id - 1) % ADMIN_MOCK_FIRST_NAMES.length];
        const last = ADMIN_MOCK_LAST_NAMES[(id - 1) % ADMIN_MOCK_LAST_NAMES.length];
        const isFemale = id % 2 === 0;
        const birthYear = 2016 - std;
        const month = pad((id % 12) + 1, 2);
        const day = pad((roll % 28) + 1, 2);

        students.push({
          id,
          gr_number: `GR-${pad(id)}`,
          student_id: `STU2024${pad(id, 4)}`,
          student_password: `Stu@${pad(id)}`,
          name: `${first} ${last}`,
          admission: `ADM-2024-${pad(id)}`,
          class: String(std),
          section,
          parent: `${ADMIN_MOCK_FIRST_NAMES[id % ADMIN_MOCK_FIRST_NAMES.length]} ${last}`,
          phone: `98${String(765430000 + id).slice(-8)}`,
          status: id % 11 === 0 ? 'Inactive' : 'Active',
          fees: 'Pending',
          dob: `${birthYear}-${month}-${day}`,
          gender: isFemale ? 'Female' : 'Male',
          address: `${(id % 120) + 1} ${ADMIN_MOCK_STREETS[id % ADMIN_MOCK_STREETS.length]}, Ahmedabad`,
        });
        id += 1;
      }
    }
  }

  return students;
}

function getAdminMockStudents() {
  if (!adminMockStudentsCache) {
    adminMockStudentsCache = generateAdminMockStudents();
  }

  return adminMockStudentsCache;
}

function getStudentRemark(student) {
  if (String(student.status || '').toLowerCase() === 'inactive') {
    return 'Average';
  }

  return 'Good';
}

function mapStudent(student, index, classId) {
  const averagePercentage = Number(student.averagePercentage) || 0;
  const attendanceRate = Number(student.attendanceRate) || 0;
  const remark = student.remark || getStudentRemark(student);

  return {
    _id: student._id || `admin-student-${student.id || index + 1}`,
    adminId: student.id || student.adminId || index + 1,
    studentDbId: student.id || student.studentDbId || index + 1,
    grNumber: student.gr_number || student.grNumber || '',
    rollNumber: student.rollNumber || student.gr_number || `R${pad(index + 1)}`,
    studentId: student.student_id || student.studentId || '',
    studentPassword: student.student_password || student.studentPassword || '',
    name: student.name || '',
    classId,
    className: getClassNumber(student.className || student.class) || getClassNumber(classId),
    section: normalizeSection(student.section),
    gender: student.gender || '',
    age: student.age || '',
    dateOfBirth: student.dob || student.dateOfBirth || '',
    bloodGroup: student.blood_group || student.bloodGroup || '',
    email: student.email || (student.student_id ? `${String(student.student_id).toLowerCase()}@school.local` : ''),
    phone: student.phone || '',
    address: student.address || '',
    fatherName: student.fatherName || student.parent || student.parentName || '',
    motherName: student.motherName || '',
    parentPhone: student.parentPhone || student.phone || '',
    admissionDate: student.admission || student.admissionDate || '',
    currentGPA: student.currentGPA || (averagePercentage ? Math.min(4, averagePercentage / 25).toFixed(2) : '0.00'),
    averagePercentage,
    attendanceRate,
    healthInfo: student.healthInfo || '',
    allergies: student.allergies || '',
    behaviorRemarks: student.behaviorRemarks || remark,
    remark,
    status: student.status || 'Active',
    fees: student.fees || '',
    parentName: student.parent || student.parentName || '',
  };
}

function getMockStudentsForClass(className, section) {
  const normalizedClass = getClassNumber(className) || '1';
  const normalizedSection = normalizeSection(section);

  return getAdminMockStudents().filter((student) => (
    String(student.class || '').trim() === normalizedClass &&
    normalizeSection(student.section) === normalizedSection
  ));
}

async function loadAssignedStudents(currentUser) {
  const className = getAssignedTeacherClassNumber(currentUser);
  const section = getAssignedTeacherSection(currentUser);
  const classParam = `${className}${section}`;

  try {
    const response = await axios.get(`${getAdminBackendBaseUrl()}/api/students`, {
      params: {
        class: classParam,
        limit: 100,
      },
      timeout: 2500,
    });

    const students = response?.data?.data || [];
    if (students.length > 0) {
      return students;
    }
  } catch (error) {
    console.error('Error loading students from admin backend API:', error);
  }

  return getMockStudentsForClass(className, section);
}

function getDefaultSubjects(className) {
  const std = parseInt(getClassNumber(className) || '1', 10);
  const subjectNames = std <= 5 ? PRIMARY_SUBJECTS : UPPER_SUBJECTS;

  return subjectNames.map((subjectName, index) => ({
    _id: `fallback-subject-${std}-${index + 1}`,
    subjectName,
    teacher: { name: 'TBD' },
  }));
}

function buildFallbackClass(currentUser) {
  const className = getAssignedTeacherClassNumber(currentUser);
  const section = getAssignedTeacherSection(currentUser);
  const fallbackClass = buildMockTeacherClass(currentUser, getDefaultSubjects(className));
  const classId = buildClassId(className, section);
  const students = getMockStudentsForClass(className, section).map((student, index) => (
    mapStudent(student, index, classId)
  ));

  return {
    ...fallbackClass,
    _id: classId,
    className,
    section,
    subjects: fallbackClass.subjects || getDefaultSubjects(className),
    students,
    studentCount: students.length,
    source: 'fallback',
  };
}

function getAssignedQueryParams(currentUser = {}) {
  return {
    assignedClass: currentUser?.assignedClass || '',
    section: currentUser?.division || '',
    teacherEmail: currentUser?.email || '',
  };
}

export async function loadTeacherClasses(currentUser) {
  try {
    const className = getAssignedTeacherClassNumber(currentUser);
    const section = getAssignedTeacherSection(currentUser);
    const classId = buildClassId(className, section);
    const students = await loadAssignedStudents(currentUser);

    if (students.length > 0) {
      return [{
        _id: classId,
        className,
        section,
        subjects: getDefaultSubjects(className),
        students: students.map((student, index) => mapStudent(student, index, classId)),
        studentCount: students.length,
        source: 'admin-api',
      }];
    }
  } catch (error) {
    console.error('Error loading teacher classes from admin source:', error);
  }

  return [buildFallbackClass(currentUser)];
}

export async function loadClassStudents(classId, currentUser, classes = []) {
  const selectedClass = classes.find((cls) => cls._id === classId);
  if (selectedClass?.students?.length) {
    return selectedClass.students;
  }

  try {
    const students = await loadAssignedStudents(currentUser);
    if (students.length > 0) {
      const resolvedClassId = classId || selectedClass?._id || buildClassId(getAssignedTeacherClassNumber(currentUser), getAssignedTeacherSection(currentUser));
      return students.map((student, index) => mapStudent(student, index, resolvedClassId));
    }
  } catch (error) {
    console.error('Error loading class students from admin source:', error);
  }

  return buildFallbackClass(currentUser).students;
}

export async function loadTeacherStudents(currentUser, classes = []) {
  if (classes.length > 0) {
    const flattened = classes.flatMap((cls) => cls.students || []);
    if (flattened.length > 0) {
      return flattened;
    }
  }

  try {
    const students = await loadAssignedStudents(currentUser);
    if (students.length > 0) {
      const classId = buildClassId(getAssignedTeacherClassNumber(currentUser), getAssignedTeacherSection(currentUser));
      return students.map((student, index) => mapStudent(student, index, classId));
    }
  } catch (error) {
    console.error('Error loading teacher students from admin source:', error);
  }

  const fallbackClass = buildFallbackClass(currentUser);
  return fallbackClass.students;
}
