export function normalizeSection(value) {
  const section = String(value || '').trim().toUpperCase();
  return section || '';
}

export function extractClassNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? String(parseInt(match[0], 10)) : '';
}

export function extractTeacherClassInfo(currentUser = {}) {
  const raw = String(
    currentUser?.classTeacherOf
    || currentUser?.assignedClass
    || currentUser?.class
    || currentUser?.classTeacherStd
    || ''
  ).trim();

  const match = raw.match(/(\d+)\s*[- ]?\s*([A-Za-z])?$/);
  if (match) {
    return {
      std: String(parseInt(match[1], 10)),
      section: normalizeSection(currentUser?.division || match[2] || currentUser?.classTeacherDiv || ''),
    };
  }

  return {
    std: extractClassNumber(currentUser?.assignedClass || currentUser?.classTeacherStd || currentUser?.class || ''),
    section: normalizeSection(currentUser?.division || currentUser?.classTeacherDiv || ''),
  };
}

export function buildTeacherClassLabel(currentUser = {}) {
  const { std, section } = extractTeacherClassInfo(currentUser);
  return std && section ? `${std}${section}` : '';
}

export function getAssignedTeacherClassNumber(currentUser) {
  return extractTeacherClassInfo(currentUser).std;
}

export function getAssignedTeacherSection(currentUser) {
  return extractTeacherClassInfo(currentUser).section;
}

export function hasTeacherAssignment(currentUser) {
  const { std, section } = extractTeacherClassInfo(currentUser);
  return Boolean(std && section);
}

export function matchesAssignedTeacherClass(cls, currentUser) {
  const { std, section } = extractTeacherClassInfo(currentUser);
  if (!std || !section) return false;
  const className = extractClassNumber(cls?.className || cls?.class || cls?.standard || '');
  const classSection = normalizeSection(cls?.section || cls?.division || '');
  return className === std && classSection === section;
}

export function buildTeacherClassKey(currentUser) {
  const { std, section } = extractTeacherClassInfo(currentUser);
  return std && section ? `${std}${section}` : '';
}

export function filterSupportedTeacherClasses(classes = []) {
  return Array.isArray(classes)
    ? classes.filter((cls) => {
        const classNumber = extractClassNumber(cls?.className || cls?.class);
        return ['1', '2', '3', '4', '5', '6'].includes(classNumber);
      })
    : [];
}

export function buildMockTeacherClass(currentUser, subjects = []) {
  const { std, section } = extractTeacherClassInfo(currentUser);
  if (!std || !section) return null;
  return {
    _id: `teacher-class-${std}-${section}`,
    className: std,
    section,
    subjects,
  };
}
