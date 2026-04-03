import axios from 'axios';
import { apiUrl } from '../config/api';
import {
  buildMockTeacherClass,
  getAssignedTeacherClassNumber,
  getAssignedTeacherSection,
} from '../config/teacherClasses';
import { getCanonicalStudentName } from '../data/studentRoster';

const PRIMARY_SUBJECTS = ['English', 'Mathematics', 'EVS', 'Gujarati', 'Hindi', 'Drawing', 'PT', 'Moral Science', 'GK'];
const UPPER_SUBJECTS = ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer', 'PT', 'Drawing'];
const MOCK_SECTIONS = ['A', 'B', 'C'];
const MOCK_STREETS = ['Main Street', 'Park Avenue', 'Lake Road', 'Rose Colony', 'Green View', 'Hill Side', 'River Lane', 'Maple Avenue'];

let mockStudentsCache = null;

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

function buildClassId(className, section) {
  return `admin-class-${getClassNumber(className) || '1'}-${normalizeSection(section)}`;
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

function generateMockStudents() {
  const students = [];
  let id = 1;

  for (let std = 1; std <= 6; std += 1) {
    for (const section of MOCK_SECTIONS) {
      for (let roll = 1; roll <= 35; roll += 1) {
        const name = getCanonicalStudentName(id - 1);
        const birthYear = 2016 - std;
        const month = pad((id % 12) + 1, 2);
        const day = pad((roll % 28) + 1, 2);

        students.push({
          id,
          gr_number: `GR-${pad(id)}`,
          student_id: `STU2024${pad(id, 4)}`,
          student_password: `Stu@${pad(id)}`,
          name,
          admission: `ADM-2024-${pad(id)}`,
          class: String(std),
          section,
          parent: `${getCanonicalStudentName(id)} Parent`,
          phone: `98${String(765430000 + id).slice(-8)}`,
          status: id % 11 === 0 ? 'Inactive' : 'Active',
          fees: 'Pending',
          dob: `${birthYear}-${month}-${day}`,
          gender: id % 2 === 0 ? 'Female' : 'Male',
          address: `${(id % 120) + 1} ${MOCK_STREETS[id % MOCK_STREETS.length]}, Ahmedabad`,
        });
        id += 1;
      }
    }
  }

  return students;
}

function getMockStudents() {
  if (!mockStudentsCache) {
    mockStudentsCache = generateMockStudents();
  }

  return mockStudentsCache;
}

function getMockStudentsForClass(className, section) {
  const normalizedClass = getClassNumber(className) || '1';
  const normalizedSection = normalizeSection(section);

  return getMockStudents().filter((student) => (
    String(student.class || '').trim() === normalizedClass &&
    normalizeSection(student.section) === normalizedSection
  ));
}

function mapFallbackStudent(student, index, classId) {
  const averagePercentage = Number(student.averagePercentage) || 0;
  const attendanceRate = Number(student.attendanceRate) || 0;
  const remark = student.remark || (String(student.status || '').toLowerCase() === 'inactive' ? 'Average' : 'Good');

  return {
    _id: student._id || `admin-student-${student.id || index + 1}`,
    adminId: student.id || student.adminId || index + 1,
    studentDbId: student.id || student.studentDbId || index + 1,
    grNumber: student.gr_number || student.grNumber || '',
    rollNumber: student.rollNumber || student.gr_number || `R${pad(index + 1)}`,
    studentId: student.student_id || student.studentId || '',
    studentPassword: student.student_password || student.studentPassword || '',
    name: student.name || getCanonicalStudentName(index),
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

async function loadTeacherApiStudents(currentUser) {
  const className = getAssignedTeacherClassNumber(currentUser);
  const section = getAssignedTeacherSection(currentUser);

  try {
    const response = await axios.get(apiUrl('/api/class/students'), {
      params: { std: className, section },
      timeout: 2500,
    });

    const students = response?.data?.data || [];
    if (students.length > 0) {
      return students;
    }
  } catch (error) {
    console.error('Error loading students from teacher backend API:', error);
  }

  return getMockStudentsForClass(className, section);
}

export async function loadTeacherClasses(currentUser) {
  try {
    const response = await axios.get(apiUrl('/api/class/assigned'), {
      params: {
        std: getAssignedTeacherClassNumber(currentUser),
        section: getAssignedTeacherSection(currentUser),
      },
      timeout: 2500,
    });

    const classes = response?.data?.data || [];
    if (classes.length > 0) {
      return classes;
    }
  } catch (error) {
    console.error('Error loading teacher classes from teacher backend API:', error);
  }

  const className = getAssignedTeacherClassNumber(currentUser);
  const section = getAssignedTeacherSection(currentUser);
  const classId = buildClassId(className, section);
  const fallbackClass = buildMockTeacherClass(currentUser, getDefaultSubjects(className));
  const students = getMockStudentsForClass(className, section).map((student, index) => mapFallbackStudent(student, index, classId));

  return [{
    ...fallbackClass,
    _id: classId,
    className,
    section,
    subjects: fallbackClass.subjects || getDefaultSubjects(className),
    students,
    studentCount: students.length,
    source: 'fallback',
  }];
}

export async function loadClassStudents(classId, currentUser, classes = []) {
  const selectedClass = classes.find((cls) => cls._id === classId);
  if (selectedClass?.students?.length) {
    return selectedClass.students;
  }

  const students = await loadTeacherApiStudents(currentUser);
  if (students.length > 0) {
    return students;
  }

  const fallbackClasses = await loadTeacherClasses(currentUser);
  return fallbackClasses[0]?.students || [];
}

export async function loadTeacherStudents(currentUser, classes = []) {
  if (classes.length > 0) {
    const flattened = classes.flatMap((cls) => cls.students || []);
    if (flattened.length > 0) {
      return flattened;
    }
  }

  const students = await loadTeacherApiStudents(currentUser);
  if (students.length > 0) {
    return students;
  }

  const fallbackClasses = await loadTeacherClasses(currentUser);
  return fallbackClasses[0]?.students || [];
}

export async function loadTeacherNotifications(currentUser, limit = 10) {
  try {
    const response = await axios.get(apiUrl('/api/class/notifications'), {
      params: {
        std: getAssignedTeacherClassNumber(currentUser),
        section: getAssignedTeacherSection(currentUser),
        limit,
      },
      timeout: 2500,
    });

    const notifications = response?.data?.data || [];
    return Array.isArray(notifications) ? notifications : [];
  } catch (error) {
    console.error('Error loading teacher notifications from teacher backend API:', error);
    return [];
  }
}

