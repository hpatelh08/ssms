export interface StudentProfile {
  studentName: string; className: string; admissionNumber: string; grNo: string; studentId: string; password: string; parentName: string; phone: string; dob: string; gender: string; bloodGroup: string; address: string; status: 'Active' | 'Inactive'; parentAccessKey: string; grade: number;
}
const STUDENT_PROFILES: StudentProfile[] = [{ studentName: 'Yash Patel', className: 'Std 5', admissionNumber: 'ADM-2024-501', grNo: 'GR-5001', studentId: 'STU2024501', password: 'Sch@051', parentName: 'Megha Patel', phone: '+91 98765 43210', dob: '2015-08-12', gender: 'Male', bloodGroup: 'B+', address: 'Satellite Road, Ahmedabad', status: 'Active', parentAccessKey: '0051', grade: 5 }];
const profileById = new Map(STUDENT_PROFILES.map(profile => [profile.studentId.toUpperCase(), profile]));
const PROFILE_OVERRIDES_STORAGE_KEY = 'ssms_std5_student_profile_overrides_v1';
type StudentProfileOverrideMap = Record<string, Partial<StudentProfile>>;
const normalizeStudentId = (studentId: string) => studentId.trim().toUpperCase();
const loadProfileOverrides = (): StudentProfileOverrideMap => { try { const raw = localStorage.getItem(PROFILE_OVERRIDES_STORAGE_KEY); return raw ? JSON.parse(raw) as StudentProfileOverrideMap : {}; } catch { return {}; } };
const persistProfileOverrides = (overrides: StudentProfileOverrideMap) => { try { localStorage.setItem(PROFILE_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides)); } catch {} };
const mergeProfileOverrides = (profile: StudentProfile): StudentProfile => ({ ...profile, ...(loadProfileOverrides()[normalizeStudentId(profile.studentId)] ?? {}) });
export function getStudentProfileById(studentId: string): StudentProfile | null { const profile = profileById.get(normalizeStudentId(studentId)); return profile ? mergeProfileOverrides(profile) : null; }
export function authenticateStudent(studentId: string, password: string): StudentProfile | null { const profile = getStudentProfileById(studentId); return profile && profile.password === password ? profile : null; }
export function saveStudentProfileOverrides(studentId: string, updates: Partial<StudentProfile>): StudentProfile | null { const normalizedId = normalizeStudentId(studentId); const baseProfile = profileById.get(normalizedId); if (!baseProfile) return null; const overrides = loadProfileOverrides(); overrides[normalizedId] = { ...(overrides[normalizedId] ?? {}), ...updates }; persistProfileOverrides(overrides); return mergeProfileOverrides(baseProfile); }
