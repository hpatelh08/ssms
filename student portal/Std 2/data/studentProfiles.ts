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
  status: 'Active' | 'Inactive';
  parentAccessKey: string;
  grade: number;
}

const STUDENT_PROFILES: StudentProfile[] = [
  {
    studentName: 'Yash Patel',
    className: 'Std 2',
    admissionNumber: 'ADM-2024-201',
    grNo: 'GR-2001',
    studentId: 'STU2024201',
    password: 'Sch@021',
    parentName: 'Megha Patel',
    phone: '+91 98765 43210',
    dob: '2018-08-12',
    gender: 'Male',
    bloodGroup: 'B+',
    address: 'Satellite Road, Ahmedabad',
    status: 'Active',
    parentAccessKey: '0021',
    grade: 2,
  },
];

const profileById = new Map(STUDENT_PROFILES.map(profile => [profile.studentId.toUpperCase(), profile]));

const PROFILE_OVERRIDES_STORAGE_KEY = 'ssms_std2_student_profile_overrides_v1';

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
  return { ...profile, ...overrides };
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

export function saveStudentProfileOverrides(studentId: string, updates: Partial<StudentProfile>): StudentProfile | null {
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
