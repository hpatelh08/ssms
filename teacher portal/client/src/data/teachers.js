export function normalizeTeacherLookup(value) {
  return String(value || '').trim().toLowerCase();
}

export function findTeacherByLogin() {
  return null;
}

export function findTeacherByIdentity(identity = {}) {
  const teacherId = String(identity.teacherId || identity.loginId || '').trim();
  const name = String(identity.name || '').trim();
  const assignedClass = String(identity.assignedClass || identity.classTeacherStd || '').trim();
  const division = String(identity.division || identity.classTeacherDiv || '').trim().toUpperCase();

  if (!teacherId && !name && !assignedClass && !division) {
    return null;
  }

  return {
    ...identity,
    teacherId,
    name: name || teacherId || 'Teacher',
    assignedClass,
    division,
  };
}

export default [];
