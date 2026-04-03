import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { type StudentProfile } from '../data/studentProfiles';
import { logAction } from '../utils/auditLog';
import { postAdminBackendJson } from '../services/adminBackend';

export type UserRole = 'student' | 'parent';
export interface AuthUser { role: UserRole; grade: number; name: string; }
export interface AuthActionResult { ok: boolean; error?: string; }
export interface AuthNotice { tone: 'success'; message: string; }
interface AuthState { isAuthenticated: boolean; user: AuthUser; studentProfile: StudentProfile | null; parentVerified: boolean; }
export interface AuthContextType {
  user: AuthUser;
  isAuthenticated: boolean;
  studentProfile: StudentProfile | null;
  isParentAccessPromptOpen: boolean;
  notice: AuthNotice | null;
  switchRole: () => boolean;
  setRole: (role: UserRole) => boolean;
  setGrade: (grade: number) => void;
  login: (studentId: string, password: string) => Promise<AuthActionResult>;
  loginWithParentAccessKey: (studentId: string, accessKey: string) => Promise<AuthActionResult>;
  logout: () => void;
  updateStudentProfile: (updates: Partial<StudentProfile>) => AuthActionResult;
  requestParentAccess: () => void;
  cancelParentAccess: () => void;
  verifyParentAccessKey: (accessKey: string) => AuthActionResult;
  switchToStudentView: () => void;
  clearNotice: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_STORAGE_KEY = 'ssms_std6_student_session_v1';
const LEGACY_ROLE_STORAGE_KEY = 'ssms_std6_auth_role_legacy';
const ADMIN_TOKEN_STORAGE_KEY = 'ssms_std6_admin_token';
const DEFAULT_USER: AuthUser = { role: 'student', grade: 6, name: 'Explorer' };

interface PersistedSession {
  studentId?: string;
  studentProfile?: StudentProfile;
  parentVerified?: boolean;
}

function persistSession(profile: StudentProfile, parentVerified = false) {
  try {
    const payload: PersistedSession = {
      studentId: profile.studentId,
      studentProfile: profile,
      parentVerified,
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function clearSessionStorage() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_ROLE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function persistAdminToken(token?: string | null): void {
  try {
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function normalizeProfile(profile: Partial<StudentProfile> & Record<string, unknown>): StudentProfile {
  return {
    ...profile,
    grade: Number(profile.grade) || 6,
    className: profile.className || `Std ${Number(profile.grade) || 6}`,
  };
}

function profileToUser(profile: StudentProfile, role: UserRole = 'student'): AuthUser {
  return {
    role,
    grade: Number(profile.grade) || 6,
    name: profile.studentName || 'Student',
  };
}

function loadPersistedState(): AuthState {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return { isAuthenticated: false, user: DEFAULT_USER, studentProfile: null, parentVerified: false };
    }

    const parsed = JSON.parse(raw) as PersistedSession;
    const storedProfile = parsed.studentProfile ? normalizeProfile(parsed.studentProfile) : null;
    const profile = storedProfile;

    if (!profile) {
      return { isAuthenticated: false, user: DEFAULT_USER, studentProfile: null, parentVerified: false };
    }

    return {
      isAuthenticated: true,
      user: profileToUser(profile, parsed.parentVerified ? 'parent' : 'student'),
      studentProfile: profile,
      parentVerified: !!parsed.parentVerified,
    };
  } catch {
    return { isAuthenticated: false, user: DEFAULT_USER, studentProfile: null, parentVerified: false };
  }
}

async function loginStudentRemote(studentId: string, password: string): Promise<StudentProfile | null> {
  try {
    const response = await postAdminBackendJson('/api/students/login', { student_id: studentId, password });
    persistAdminToken(response?.token ? String(response.token) : null);
    return normalizeProfile(response?.student || {
      studentName: response?.user?.name || 'Student',
      className: `Std ${response?.user?.class || ''}`,
      admissionNumber: '',
      grNo: '',
      studentId: response?.user?.student_id || studentId,
      password,
      parentName: '',
      phone: '',
      dob: '',
      gender: 'Male',
      bloodGroup: '',
      address: '',
      status: 'Active',
      parentAccessKey: '',
      grade: Number(response?.user?.class) || 6,
    });
  } catch {
    persistAdminToken(null);
    return null;
  }
}

async function loginParentRemote(studentId: string, accessKey: string): Promise<StudentProfile | null> {
  try {
    const response = await postAdminBackendJson('/api/students/access-key-login', {
      student_id: studentId,
      access_key: accessKey,
    });
    persistAdminToken(response?.token ? String(response.token) : null);
    return normalizeProfile(response?.student || {
      studentName: response?.user?.name || 'Student',
      className: `Std ${response?.user?.class || ''}`,
      admissionNumber: '',
      grNo: '',
      studentId: response?.user?.student_id || studentId,
      password: '',
      parentName: response?.user?.name || 'Parent',
      phone: '',
      dob: '',
      gender: 'Male',
      bloodGroup: '',
      address: '',
      status: 'Active',
      parentAccessKey: accessKey,
      grade: Number(response?.user?.class) || 6,
    });
  } catch {
    persistAdminToken(null);
    return null;
  }
}

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

  const switchToStudentView = useCallback(() => {
    setAuthState(prev => {
      if (prev.user.role === 'student' && !prev.parentVerified) return prev;
      const nextProfile = prev.studentProfile ? { ...prev.studentProfile } : null;
      if (nextProfile) {
        persistSession(nextProfile, false);
      }
      return {
        ...prev,
        parentVerified: false,
        user: { ...prev.user, role: 'student' },
      };
    });
    setParentAccessPromptOpen(false);
  }, []);

  const verifyParentAccessKey = useCallback((accessKey: string): AuthActionResult => {
    if (!authState.isAuthenticated || !authState.studentProfile) return { ok: false, error: 'Please login first' };
    if (accessKey.trim() !== authState.studentProfile.parentAccessKey) return { ok: false, error: 'Invalid Parent Access Key' };
    const nextProfile = normalizeProfile(authState.studentProfile);
    setAuthState(prev => ({ ...prev, parentVerified: true, user: { ...prev.user, role: 'parent' }, studentProfile: nextProfile }));
    persistSession(nextProfile, true);
    setParentAccessPromptOpen(false);
    setNotice({ tone: 'success', message: 'Parent view unlocked' });
    logAction('parent_authenticated', 'parent', { studentId: authState.studentProfile.studentId });
    return { ok: true };
  }, [authState.isAuthenticated, authState.studentProfile]);

  const login = useCallback(async (studentId: string, password: string): Promise<AuthActionResult> => {
    const normalizedId = studentId.trim().toUpperCase();
    if (!normalizedId) return { ok: false, error: 'Student ID is required' };
    if (!password.trim()) return { ok: false, error: 'Password is required' };

    const remoteProfile = await loginStudentRemote(normalizedId, password);
    if (!remoteProfile || remoteProfile.password !== password) {
      return { ok: false, error: 'Invalid Student ID or Password' };
    }

    const nextProfile = normalizeProfile(remoteProfile);
    setAuthState({
      isAuthenticated: true,
      user: profileToUser(nextProfile, 'student'),
      studentProfile: nextProfile,
      parentVerified: false,
    });
    setParentAccessPromptOpen(false);
    setNotice(null);
    persistSession(nextProfile, false);
    return { ok: true };
  }, []);

  const loginWithParentAccessKey = useCallback(async (studentId: string, accessKey: string): Promise<AuthActionResult> => {
    const normalizedId = studentId.trim().toUpperCase();
    if (!normalizedId) return { ok: false, error: 'Student ID is required' };
    if (!accessKey.trim()) return { ok: false, error: 'Parent Access Key is required' };

    const remoteProfile = await loginParentRemote(normalizedId, accessKey);
    if (!remoteProfile) return { ok: false, error: 'Invalid Student ID' };
    if ((remoteProfile.parentAccessKey || '').trim() !== accessKey.trim()) return { ok: false, error: 'Invalid Parent Access Key' };

    const nextProfile = normalizeProfile(remoteProfile);
    setAuthState({
      isAuthenticated: true,
      user: profileToUser(nextProfile, 'parent'),
      studentProfile: nextProfile,
      parentVerified: true,
    });
    setParentAccessPromptOpen(false);
    setNotice({ tone: 'success', message: 'Parent view unlocked' });
    persistSession(nextProfile, true);
    logAction('parent_authenticated', 'parent', { studentId: nextProfile.studentId, source: 'login' });
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setAuthState({ isAuthenticated: false, user: DEFAULT_USER, studentProfile: null, parentVerified: false });
    setParentAccessPromptOpen(false);
    setNotice(null);
    clearSessionStorage();
    persistAdminToken(null);
  }, []);

  const updateStudentProfile = useCallback((updates: Partial<StudentProfile>): AuthActionResult => {
    if (!authState.isAuthenticated || !authState.studentProfile) return { ok: false, error: 'Please login first' };

    const nextProfile = normalizeProfile({ ...authState.studentProfile, ...updates });
    setAuthState(prev => ({
      ...prev,
      user: { ...prev.user, name: nextProfile.studentName, grade: nextProfile.grade },
      studentProfile: nextProfile,
    }));
    persistSession(nextProfile, authState.parentVerified);
    return { ok: true };
  }, [authState.isAuthenticated, authState.studentProfile, authState.parentVerified]);

  const setRole = useCallback((role: UserRole): boolean => {
    if (!authState.isAuthenticated) return false;
    if (role === authState.user.role) return true;
    if (role === 'parent') {
      requestParentAccess();
      return false;
    }
    switchToStudentView();
    return true;
  }, [authState.isAuthenticated, authState.user.role, requestParentAccess, switchToStudentView]);

  const switchRole = useCallback((): boolean => (
    !authState.isAuthenticated
      ? false
      : authState.user.role === 'parent'
        ? (switchToStudentView(), true)
        : setRole('parent')
  ), [authState.isAuthenticated, authState.user.role, setRole, switchToStudentView]);

  const setGrade = useCallback((grade: number) => {
    setAuthState(prev => {
      if (!prev.studentProfile) {
        return { ...prev, user: { ...prev.user, grade } };
      }
      const nextProfile = normalizeProfile({ ...prev.studentProfile, grade });
      persistSession(nextProfile, prev.parentVerified);
      return { ...prev, user: { ...prev.user, grade }, studentProfile: nextProfile };
    });
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  const value = useMemo<AuthContextType>(() => ({
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    studentProfile: authState.studentProfile,
    isParentAccessPromptOpen,
    notice,
    switchRole,
    setRole,
    setGrade,
    login,
    loginWithParentAccessKey,
    logout,
    updateStudentProfile,
    requestParentAccess,
    cancelParentAccess,
    verifyParentAccessKey,
    switchToStudentView,
    clearNotice,
  }), [
    authState.user,
    authState.isAuthenticated,
    authState.studentProfile,
    isParentAccessPromptOpen,
    notice,
    switchRole,
    setRole,
    setGrade,
    login,
    loginWithParentAccessKey,
    logout,
    updateStudentProfile,
    requestParentAccess,
    cancelParentAccess,
    verifyParentAccessKey,
    switchToStudentView,
    clearNotice,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
