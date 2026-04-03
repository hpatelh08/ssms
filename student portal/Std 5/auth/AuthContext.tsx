import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { authenticateStudent, getStudentProfileById, saveStudentProfileOverrides, type StudentProfile } from '../data/studentProfiles';
import { logAction } from '../utils/auditLog';
import { postAdminBackendJson } from '../services/adminBackend';

export type UserRole = 'student' | 'parent';
export interface AuthUser { role: UserRole; grade: number; name: string; }
export interface AuthActionResult { ok: boolean; error?: string; }
export interface AuthNotice { tone: 'success'; message: string; }
interface AuthState { isAuthenticated: boolean; user: AuthUser; studentProfile: StudentProfile | null; parentVerified: boolean; }
export interface AuthContextType {
  user: AuthUser; isAuthenticated: boolean; studentProfile: StudentProfile | null; isParentAccessPromptOpen: boolean; notice: AuthNotice | null;
  switchRole: () => boolean; setRole: (role: UserRole) => boolean; setGrade: (grade: number) => void;
  login: (studentId: string, password: string) => Promise<AuthActionResult>;
  loginWithParentAccessKey: (studentId: string, accessKey: string) => Promise<AuthActionResult>;
  logout: () => void; updateStudentProfile: (updates: Partial<StudentProfile>) => AuthActionResult;
  requestParentAccess: () => void; cancelParentAccess: () => void; verifyParentAccessKey: (accessKey: string) => AuthActionResult;
  switchToStudentView: () => void; clearNotice: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_STORAGE_KEY = 'ssms_std5_student_session_v1';
const LEGACY_ROLE_STORAGE_KEY = 'ssms_std5_auth_role_legacy';
const ADMIN_TOKEN_STORAGE_KEY = 'ssms_std5_admin_token';
const DEFAULT_USER: AuthUser = { role: 'student', grade: 5, name: 'Explorer' };
interface PersistedSession { studentId: string; }

function loadPersistedState(): AuthState {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return { isAuthenticated: false, user: DEFAULT_USER, studentProfile: null, parentVerified: false };
    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed.studentId) return { isAuthenticated: false, user: DEFAULT_USER, studentProfile: null, parentVerified: false };
    const profile = getStudentProfileById(parsed.studentId);
    if (!profile) return { isAuthenticated: false, user: DEFAULT_USER, studentProfile: null, parentVerified: false };
    return { isAuthenticated: true, user: { role: 'student', grade: profile.grade, name: profile.studentName }, studentProfile: profile, parentVerified: false };
  } catch { return { isAuthenticated: false, user: DEFAULT_USER, studentProfile: null, parentVerified: false }; }
}

const persistSession = (studentId: string) => { try { localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ studentId })); } catch {} };
const clearSessionStorage = () => { try { localStorage.removeItem(SESSION_STORAGE_KEY); localStorage.removeItem(LEGACY_ROLE_STORAGE_KEY); } catch {} };
const persistAdminToken = (token?: string | null) => { try { if (token) { localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token); } else { localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY); } } catch {} };
const normalizeProfile = (profile: Partial<StudentProfile> & Record<string, unknown>): StudentProfile => ({ ...profile, grade: Number(profile.grade) || 5, className: profile.className || `Std ${Number(profile.grade) || 5}` });
const mapRemoteStudent = (remote: any, fallbackId: string): StudentProfile => {
  const user = remote?.student || remote?.user || {};
  const parentName = user.parentName || user.fatherName || '';
  return normalizeProfile({
    studentName: user.studentName || user.name || 'Student',
    className: user.className || `Std ${user.class || 5}`,
    admissionNumber: user.admissionNumber || '',
    grNo: user.grNo || '',
    studentId: user.studentId || user.student_id || fallbackId,
    password: user.password || user.student_password || '',
    parentName,
    phone: user.phone || '',
    dob: user.dob || '',
    gender: user.gender || 'Male',
    bloodGroup: user.bloodGroup || '',
    address: user.address || '',
    status: user.status || 'Active',
    parentAccessKey: user.parentAccessKey || user.parent_access_key || '',
    grade: Number(user.grade || user.class || 5) || 5,
  });
};
const loginStudentRemote = async (studentId: string, password: string): Promise<StudentProfile | null> => {
  try {
    const response = await postAdminBackendJson('/api/students/login', { student_id: studentId, password });
    persistAdminToken(response?.token ? String(response.token) : null);
    return mapRemoteStudent(response, studentId);
  } catch { persistAdminToken(null); return null; }
};
const loginParentRemote = async (studentId: string, accessKey: string): Promise<StudentProfile | null> => {
  try {
    const response = await postAdminBackendJson('/api/students/access-key-login', { student_id: studentId, access_key: accessKey });
    persistAdminToken(response?.token ? String(response.token) : null);
    return mapRemoteStudent(response, studentId);
  } catch { persistAdminToken(null); return null; }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(loadPersistedState);
  const [isParentAccessPromptOpen, setParentAccessPromptOpen] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  const requestParentAccess = useCallback(() => {
    if (!authState.isAuthenticated || authState.user.role !== 'student') return;
    setAuthState(prev => ({ ...prev, parentVerified: false }));
    setParentAccessPromptOpen(true);
  }, [authState.isAuthenticated, authState.user.role]);
  const cancelParentAccess = useCallback(() => setParentAccessPromptOpen(false), []);
  const switchToStudentView = useCallback(() => { setAuthState(prev => prev.user.role === 'student' && !prev.parentVerified ? prev : ({ ...prev, parentVerified: false, user: { ...prev.user, role: 'student' } })); setParentAccessPromptOpen(false); }, []);

  const verifyParentAccessKey = useCallback((accessKey: string): AuthActionResult => {
    if (!authState.isAuthenticated || !authState.studentProfile) return { ok: false, error: 'Please login first' };
    if (accessKey.trim() !== authState.studentProfile.parentAccessKey) return { ok: false, error: 'Invalid Parent Access Key' };
    setAuthState(prev => ({ ...prev, parentVerified: true, user: { ...prev.user, role: 'parent' } }));
    setParentAccessPromptOpen(false); setNotice({ tone: 'success', message: 'Parent view unlocked' });
    logAction('parent_authenticated', 'parent', { studentId: authState.studentProfile.studentId });
    return { ok: true };
  }, [authState.isAuthenticated, authState.studentProfile]);

  const login = useCallback(async (studentId: string, password: string): Promise<AuthActionResult> => {
    const normalizedId = studentId.trim().toUpperCase();
    if (!normalizedId) return { ok: false, error: 'Student ID is required' };
    if (!password.trim()) return { ok: false, error: 'Password is required' };

    const remoteProfile = await loginStudentRemote(normalizedId, password);
    if (remoteProfile) {
      if (remoteProfile.password && remoteProfile.password !== password) return { ok: false, error: 'Invalid Student ID or Password' };
      setAuthState({ isAuthenticated: true, user: { role: 'student', grade: remoteProfile.grade, name: remoteProfile.studentName }, studentProfile: remoteProfile, parentVerified: false });
      setParentAccessPromptOpen(false); setNotice(null); persistSession(remoteProfile.studentId); return { ok: true };
    }

    persistAdminToken(null);
    const profile = authenticateStudent(normalizedId, password);
    if (!profile) return { ok: false, error: 'Invalid Student ID or Password' };
    setAuthState({ isAuthenticated: true, user: { role: 'student', grade: profile.grade, name: profile.studentName }, studentProfile: profile, parentVerified: false });
    setParentAccessPromptOpen(false); setNotice(null); persistSession(profile.studentId); return { ok: true };
  }, []);

  const loginWithParentAccessKey = useCallback(async (studentId: string, accessKey: string): Promise<AuthActionResult> => {
    const normalizedId = studentId.trim().toUpperCase();
    if (!normalizedId) return { ok: false, error: 'Student ID is required' };
    if (!accessKey.trim()) return { ok: false, error: 'Parent Access Key is required' };

    const remoteProfile = await loginParentRemote(normalizedId, accessKey);
    if (remoteProfile) {
      setAuthState({ isAuthenticated: true, user: { role: 'parent', grade: remoteProfile.grade, name: remoteProfile.parentName || `${remoteProfile.studentName} Parent` }, studentProfile: remoteProfile, parentVerified: true });
      setParentAccessPromptOpen(false); setNotice({ tone: 'success', message: 'Parent view unlocked' }); persistSession(remoteProfile.studentId);
      logAction('parent_authenticated', 'parent', { studentId: remoteProfile.studentId, source: 'login' }); return { ok: true };
    }

    persistAdminToken(null);
    const profile = getStudentProfileById(normalizedId);
    if (!profile) return { ok: false, error: 'Invalid Student ID' };
    if (accessKey.trim() !== profile.parentAccessKey) return { ok: false, error: 'Invalid Parent Access Key' };
    setAuthState({ isAuthenticated: true, user: { role: 'parent', grade: profile.grade, name: profile.parentName || `${profile.studentName} Parent` }, studentProfile: profile, parentVerified: true });
    setParentAccessPromptOpen(false); setNotice({ tone: 'success', message: 'Parent view unlocked' }); persistSession(profile.studentId);
    logAction('parent_authenticated', 'parent', { studentId: profile.studentId, source: 'login' }); return { ok: true };
  }, []);

  const logout = useCallback(() => { setAuthState({ isAuthenticated: false, user: DEFAULT_USER, studentProfile: null, parentVerified: false }); setParentAccessPromptOpen(false); setNotice(null); clearSessionStorage(); persistAdminToken(null); }, []);
  const updateStudentProfile = useCallback((updates: Partial<StudentProfile>): AuthActionResult => {
    if (!authState.isAuthenticated || !authState.studentProfile) return { ok: false, error: 'Please login first' };
    const nextProfile = saveStudentProfileOverrides(authState.studentProfile.studentId, updates);
    if (!nextProfile) return { ok: false, error: 'Unable to save profile settings' };
    setAuthState(prev => ({ ...prev, user: { ...prev.user, name: nextProfile.studentName, grade: nextProfile.grade }, studentProfile: nextProfile }));
    return { ok: true };
  }, [authState.isAuthenticated, authState.studentProfile]);

  const setRole = useCallback((role: UserRole): boolean => {
    if (!authState.isAuthenticated) return false;
    if (role === authState.user.role) return true;
    if (role === 'parent') { requestParentAccess(); return false; }
    switchToStudentView(); return true;
  }, [authState.isAuthenticated, authState.user.role, requestParentAccess, switchToStudentView]);
  const switchRole = useCallback((): boolean => !authState.isAuthenticated ? false : authState.user.role === 'parent' ? (switchToStudentView(), true) : setRole('parent'), [authState.isAuthenticated, authState.user.role, setRole, switchToStudentView]);
  const setGrade = useCallback((grade: number) => setAuthState(prev => ({ ...prev, user: { ...prev.user, grade }, studentProfile: prev.studentProfile ? { ...prev.studentProfile, grade } : prev.studentProfile })), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  const value = useMemo<AuthContextType>(() => ({
    user: authState.user, isAuthenticated: authState.isAuthenticated, studentProfile: authState.studentProfile, isParentAccessPromptOpen, notice,
    switchRole, setRole, setGrade, login, loginWithParentAccessKey, logout, updateStudentProfile, requestParentAccess, cancelParentAccess, verifyParentAccessKey, switchToStudentView, clearNotice,
  }), [authState.user, authState.isAuthenticated, authState.studentProfile, isParentAccessPromptOpen, notice, switchRole, setRole, setGrade, login, loginWithParentAccessKey, logout, updateStudentProfile, requestParentAccess, cancelParentAccess, verifyParentAccessKey, switchToStudentView, clearNotice]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
