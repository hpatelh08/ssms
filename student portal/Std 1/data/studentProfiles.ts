 export interface StudentProfile {
  studentName: string;
  className: string;
  admissionNumber: string;
  grNo: string;
  studentId: string;
  password: string;
  parentName: string;
  phone: string;
  dob: string;
  gender: string;
 bloodGroup: string;
 address: string;
  division?: string;
  fatherName?: string;
  status: 'Active' | 'Inactive';
  parentAccessKey: string;
  grade: number;
}

const STUDENT_PROFILES: StudentProfile[] = [
  {
    studentName: 'Student Name',
    className: 'Std 1',
    admissionNumber: 'ADM-2024-001',
    grNo: 'GR-1001',
    studentId: 'STU20240001',
    password: 'Stu@001',
    parentName: 'Parent Name',
    phone: '+91 98765 43210',
    dob: '2019-08-12',
    gender: 'Male',
    bloodGroup: 'B+',
    address: 'School Address',
    division: 'A',
    fatherName: 'Parent Name',
    status: 'Active',
    parentAccessKey: '0001',
    grade: 1,
  },
];

const profileById = new Map(
  STUDENT_PROFILES.map(profile => [profile.studentId.toUpperCase(), profile]),
);

const PROFILE_OVERRIDES_STORAGE_KEY = 'ssms_std1_student_profile_overrides_v1';

type StudentProfileOverrideMap = Record<string, Partial<StudentProfile>>;

function normalizeStudentId(studentId: string): string {
  return studentId.trim().toUpperCase();
}

function loadProfileOverrides(): StudentProfileOverrideMap {
  try {
    const raw = localStorage.getItem(PROFILE_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StudentProfileOverrideMap;
  } catch {
    return {};
  }
}

function persistProfileOverrides(overrides: StudentProfileOverrideMap): void {
  try {
    localStorage.setItem(PROFILE_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Ignore storage failures in private mode or quota limits.
  }
}

function mergeProfileOverrides(profile: StudentProfile): StudentProfile {
  const overrides = loadProfileOverrides()[normalizeStudentId(profile.studentId)] ?? {};
  return {
    ...profile,
    ...overrides,
  };
}

export function getStudentProfileById(studentId: string): StudentProfile | null {
  const profile = profileById.get(normalizeStudentId(studentId));
  return profile ? mergeProfileOverrides(profile) : null;
}

export function authenticateStudent(studentId: string, password: string): StudentProfile | null {
  const profile = getStudentProfileById(studentId);
  if (!profile) return null;
  return profile.password === password ? profile : null;
}

export function saveStudentProfileOverrides(
  studentId: string,
  updates: Partial<StudentProfile>,
): StudentProfile | null {
  const normalizedId = normalizeStudentId(studentId);
  const baseProfile = profileById.get(normalizedId);
  if (!baseProfile) return null;

  const overrides = loadProfileOverrides();
  overrides[normalizedId] = {
    ...(overrides[normalizedId] ?? {}),
    ...updates,
  };
  persistProfileOverrides(overrides);

  return mergeProfileOverrides(baseProfile);
}
