export const SUPPORTED_TEACHER_CLASSES = ['1', '2', '3', '4', '5', '6', '7'];
export const DEFAULT_TEACHER_CLASS = '1';
export const DEFAULT_TEACHER_SECTION = 'A';

export function extractClassNumber(value) {
  const match = String(value || '').match(/\d+/);
  if (!match) return '';
  return String(parseInt(match[0], 10));
}

export function normalizeSection(value) {
  return String(value || '').trim().toUpperCase();
}

export function getAssignedTeacherClassNumber(currentUser, fallback = DEFAULT_TEACHER_CLASS) {
  const classNumber = extractClassNumber(currentUser?.assignedClass);
  return SUPPORTED_TEACHER_CLASSES.includes(classNumber) ? classNumber : fallback;
}

export function getAssignedTeacherSection(currentUser, fallback = DEFAULT_TEACHER_SECTION) {
  const division = normalizeSection(currentUser?.division);
  if (division) return division;

  const match = String(currentUser?.assignedClass || '').match(/[-\s]([A-Za-z])$/);
  return match ? normalizeSection(match[1]) : fallback;
}

export function isSupportedTeacherClassValue(value) {
  return SUPPORTED_TEACHER_CLASSES.includes(extractClassNumber(value));
}

export function filterSupportedTeacherClasses(classes = []) {
  return (Array.isArray(classes) ? classes : []).filter((cls) => isSupportedTeacherClassValue(cls?.className));
}

export function matchesAssignedTeacherClass(cls, currentUser) {
  const assignedClassNumber = getAssignedTeacherClassNumber(currentUser);
  const assignedSection = getAssignedTeacherSection(currentUser);
  return (
    extractClassNumber(cls?.className) === assignedClassNumber &&
    (!assignedSection || normalizeSection(cls?.section) === assignedSection)
  );
}

export function buildMockTeacherClass(currentUser, subjects = []) {
  const classNumber = getAssignedTeacherClassNumber(currentUser);
  const section = getAssignedTeacherSection(currentUser);
  return {
    _id: `mock_class_${classNumber}${section.toLowerCase()}`,
    className: classNumber,
    section,
    subjects,
  };
}
