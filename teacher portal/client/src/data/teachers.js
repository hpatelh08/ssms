const teachers = [
  { name: 'Krish Mehta', teacherId: 'TCH2024001', email: 'teach1A', password: 'teach1A123', assignedClass: '1', division: 'A', subject: 'Mathematics' },
  { name: 'Kiara Mehta', teacherId: 'TCH2024002', email: 'teach1B', password: 'teach1B123', assignedClass: '1', division: 'B', subject: 'English' },
  { name: 'Siya Tiwari', teacherId: 'TCH2024003', email: 'teach1C', password: 'teach1C123', assignedClass: '1', division: 'C', subject: 'EVS' },
  { name: 'Meera Chauhan', teacherId: 'TCH2024004', email: 'teach2A', password: 'teach2A123', assignedClass: '2', division: 'A', subject: 'Mathematics' },
  { name: 'Ishaan Kapoor', teacherId: 'TCH2024005', email: 'teach2B', password: 'teach2B123', assignedClass: '2', division: 'B', subject: 'English' },
  { name: 'Aarav Kapoor', teacherId: 'TCH2024006', email: 'teach2C', password: 'teach2C123', assignedClass: '2', division: 'C', subject: 'EVS' },
  { name: 'Vivaan Singh', teacherId: 'TCH2024007', email: 'teach3A', password: 'teach3A123', assignedClass: '3', division: 'A', subject: 'Mathematics' },
  { name: 'Ritika Rao', teacherId: 'TCH2024008', email: 'teach3B', password: 'teach3B123', assignedClass: '3', division: 'B', subject: 'Science' },
  { name: 'Rohan Singh', teacherId: 'TCH2024009', email: 'teach3C', password: 'teach3C123', assignedClass: '3', division: 'C', subject: 'English' },
  { name: 'Dev Desai', teacherId: 'TCH2024010', email: 'teach4A', password: 'teach4A123', assignedClass: '4', division: 'A', subject: 'Mathematics' },
  { name: 'Aditya Desai', teacherId: 'TCH2024011', email: 'teach4B', password: 'teach4B123', assignedClass: '4', division: 'B', subject: 'Science' },
  { name: 'Kavya Sharma', teacherId: 'TCH2024012', email: 'teach4C', password: 'teach4C123', assignedClass: '4', division: 'C', subject: 'English' },
  { name: 'Priyansh Patel', teacherId: 'TCH2024013', email: 'teach5A', password: 'teach5A123', assignedClass: '5', division: 'A', subject: 'Mathematics' },
  { name: 'Ananya Nair', teacherId: 'TCH2024014', email: 'teach5B', password: 'teach5B123', assignedClass: '5', division: 'B', subject: 'Science' },
  { name: 'Krish Nair', teacherId: 'TCH2024015', email: 'teach5C', password: 'teach5C123', assignedClass: '5', division: 'C', subject: 'English' },
  { name: 'Ishaan Yadav', teacherId: 'TCH2024016', email: 'teach6A', password: 'teach6A123', assignedClass: '6', division: 'A', subject: 'Mathematics' },
  { name: 'Yash Verma', teacherId: 'TCH2024017', email: 'teach6B', password: 'teach6B123', assignedClass: '6', division: 'B', subject: 'Science' },
  { name: 'Diya Yadav', teacherId: 'TCH2024018', email: 'teach6C', password: 'teach6C123', assignedClass: '6', division: 'C', subject: 'English' },
  { name: 'Teacher 7A', teacherId: 'TCH2024019', email: 'teach7A', password: 'teach7A123', assignedClass: '7', division: 'A', subject: 'Mathematics' },
  { name: 'Teacher 7B', teacherId: 'TCH2024020', email: 'teach7B', password: 'teach7B123', assignedClass: '7', division: 'B', subject: 'Science' },
  { name: 'Teacher 7C', teacherId: 'TCH2024021', email: 'teach7C', password: 'teach7C123', assignedClass: '7', division: 'C', subject: 'English' }
];

export function normalizeTeacherLookup(value) {
  return String(value || '').trim().toLowerCase();
}

export function findTeacherByLogin(identifier, password = '') {
  const normalizedIdentifier = normalizeTeacherLookup(identifier);
  const normalizedPassword = String(password || '');
  return teachers.find((teacher) => {
    const matchesId =
      normalizeTeacherLookup(teacher.teacherId) === normalizedIdentifier ||
      normalizeTeacherLookup(teacher.email) === normalizedIdentifier ||
      normalizeTeacherLookup(teacher.name) === normalizedIdentifier;
    return matchesId && teacher.password === normalizedPassword;
  }) || null;
}

export function findTeacherByIdentity(identity = {}) {
  const identifier = identity.teacherId || identity.email || identity.name || '';
  return teachers.find((teacher) => {
    const matchesId =
      normalizeTeacherLookup(teacher.teacherId) === normalizeTeacherLookup(identifier) ||
      normalizeTeacherLookup(teacher.email) === normalizeTeacherLookup(identifier) ||
      normalizeTeacherLookup(teacher.name) === normalizeTeacherLookup(identifier);
    if (!matchesId) return false;
    if (identity.password && teacher.password !== identity.password) return false;
    return true;
  }) || null;
}

export default teachers;
