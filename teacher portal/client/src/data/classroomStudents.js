import { extractClassNumber, normalizeSection } from '../config/teacherClasses';

const SECTION_ORDER = ['A', 'B', 'C'];
const DEFAULT_COUNT = 45;

const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Krish', 'Ishaan', 'Rohan', 'Dev', 'Ananya', 'Diya', 'Myra', 'Aisha', 'Siya', 'Meera', 'Ritika', 'Kavya', 'Priyansh', 'Yash', 'Dhruv', 'Tanvi', 'Kiara'];
const LAST_NAME = 'Sharma';

function getClassroomIndex(className, section) {
  const classNumber = parseInt(extractClassNumber(className) || '1', 10);
  const normalized = normalizeSection(section || 'A');
  const sectionIndex = Math.max(0, SECTION_ORDER.indexOf(normalized));
  return Math.max(0, classNumber - 1) * SECTION_ORDER.length + sectionIndex;
}

function getNameByIndex(globalIndex) {
  const firstName = FIRST_NAMES[Math.floor(globalIndex / FIRST_NAMES.length) % FIRST_NAMES.length];
  return `${firstName} ${LAST_NAME}`;
}

export function getMockStudentNames(className, section, count = DEFAULT_COUNT) {
  const baseIndex = getClassroomIndex(className, section) * count;
  return Array.from({ length: count }, (_, index) => getNameByIndex(baseIndex + index));
}

export function getMockClassroomStudents({
  className,
  section,
  count = DEFAULT_COUNT,
  classId = '',
}) {
  const normalizedClassName = extractClassNumber(className) || String(className || '1').trim() || '1';
  const normalizedSection = normalizeSection(section || 'A');
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return getMockStudentNames(normalizedClassName, normalizedSection, count).map((name, index) => {
    const surname = 'Sharma';
    const age = 8 + ((parseInt(normalizedClassName, 10) || 1) % 5) + (index % 3);

    return {
      _id: `MOCK_STU_${index + 1}`,
      rollNumber: `R${String(index + 1).padStart(3, '0')}`,
      studentId: `STU${normalizedClassName}${normalizedSection}${String(index + 1).padStart(3, '0')}`,
      name,
      classId,
      className: normalizedClassName,
      section: normalizedSection,
      gender: index % 2 === 0 ? 'Male' : 'Female',
      age,
      bloodGroup: bloodGroups[index % bloodGroups.length],
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@school.com`,
      phone: `98${String(10000000 + index).padStart(8, '0')}`,
      address: `Street ${index + 1}, City`,
      fatherName: `Mr. ${surname}`,
      motherName: `Mrs. ${surname}`,
      parentPhone: `99${String(20000000 + index).padStart(8, '0')}`,
    };
  });
}

