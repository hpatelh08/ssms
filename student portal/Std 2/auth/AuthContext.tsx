import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  getDefaultStudentProfile,
  getStudentProfileById,
  saveStudentProfileOverrides,
  type StudentProfile,
} from '../data/studentProfiles';
import { logAction } from '../utils/auditLog';
import { postAdminBackendJson } from '../services/adminBackend';

export type UserRole = 'student' | 'parent';

export interface AuthUser {
  role: UserRole;
  grade: number;
  name: string;
}

export interface AuthActionResult {
  ok: boolean;
  error?: string;
}

export interface AuthNotice {
  tone: 'success';
  message: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser;
  studentProfile: StudentProfile | null;
  parentVerified: boolean;
}

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

const SESSION_STORAGE_KEY = 'ssms_std2_student_session_v1';
const LEGACY_ROLE_STORAGE_KEY = 'ssms_std2_auth_role_legacy';
const ADMIN_TOKEN_STORAGE_KEY = 'ssms_std2_admin_token';
const getStudentLoginRedirectUrl = () => (
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5000/student-login`
    : '/student-login'
);

const DEFAULT_USER: AuthUser = {
  role: 'student',
  grade: 2,
  name: 'Explorer',
};

interface PersistedSession {
  studentId?: string;
  studentProfile?: StudentProfile;
}

function shouldForceLoginView(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.get('login') === '1' || params.get('reset') === '1';
}

function buildAuthenticatedState(profile: StudentProfile): AuthState {
  return {
    isAuthenticated: true,
    user: {
      role: 'student',
      grade: profile.grade,
      name: profile.studentName,
    },
    studentProfile: profile,
    parentVerified: false,
  };
}

function buildUnauthenticatedState(): AuthState {
  return {
    isAuthenticated: false,
    user: DEFAULT_USER,
    studentProfile: null,
    parentVerified: false,
  };
}

function tryLoadHandoffState(): AuthState | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  if (params.get('handoff') !== '1') return null;

  return null;
}

function loadPersistedState(): AuthState {
  try {
    const handoffState = tryLoadHandoffState();
    if (handoffState) {
      return handoffState;
    }

    if (shouldForceLoginView()) {
      return buildUnauthenticatedState();
    }

    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return buildUnauthenticatedState();
    }

    const parsed = JSON.parse(raw) as PersistedSession;
    if (parsed.studentProfile) {
      return buildAuthenticatedState(normalizeProfile(parsed.studentProfile));
    }
    if (!parsed.studentId) {
      return buildUnauthenticatedState();
    }

    const profile = getStudentProfileById(parsed.studentId);
    if (!profile) {
      return buildUnauthenticatedState();
    }

    return buildAuthenticatedState(profile);
  } catch {
    return buildUnauthenticatedState();
  }
}

function persistSession(studentId: string, studentProfile?: StudentProfile): void {
  try {
    const payload: PersistedSession = { studentId };
    if (studentProfile) {
      payload.studentProfile = studentProfile;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota/private mode failures.
  }
}

function clearSessionStorage(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_ROLE_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
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
    // Ignore storage errors.
  }
}

function normalizeProfile(profile: Partial<StudentProfile> & Record<string, unknown>): StudentProfile {
  return {
    ...profile,
    grade: Number(profile.grade) || 2,
    className: profile.className || `Std ${Number(profile.grade) || 2}`,
  };
}

function mapRemoteStudent(remote: any, fallbackId: string): StudentProfile {
  const user = remote?.student || remote?.user || {};
  const parentName = user.parentName || user.fatherName || '';
  return normalizeProfile({
    studentName: user.studentName || user.name || 'Student',
    className: user.className || `Std ${user.class || 2}`,
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
    grade: Number(user.grade || user.class || 2) || 2,
  });
}

async function loginStudentRemote(studentId: string, password: string): Promise<StudentProfile | null> {
  try {
    const response = await postAdminBackendJson('/api/students/login', { student_id: studentId, password });
    persistAdminToken(response?.token ? String(response.token) : null);
    return mapRemoteStudent(response, studentId);
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
    return mapRemoteStudent(response, studentId);
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
    setAuthState(prev => ({
      ...prev,
      parentVerified: false,
    }));
    setParentAccessPromptOpen(true);
  }, [authState.isAuthenticated, authState.user.role]);

  const cancelParentAccess = useCallback(() => {
    setParentAccessPromptOpen(false);
  }, []);

  const switchToStudentView = useCallback(() => {
    setAuthState(prev => {
      if (prev.user.role === 'student' && !prev.parentVerified) return prev;
      return {
        ...prev,
        parentVerified: false,
        user: {
          ...prev.user,
          role: 'student',
        },
      };
    });
    setParentAccessPromptOpen(false);
  }, []);

  const verifyParentAccessKey = useCallback((accessKey: string): AuthActionResult => {
    if (!authState.isAuthenticated || !authState.studentProfile) {
      return { ok: false, error: 'Please login first' };
    }

    if (accessKey.trim() !== authState.studentProfile.parentAccessKey) {
      return { ok: false, error: 'Invalid Parent Access Key' };
    }

    setAuthState(prev => ({
      ...prev,
      parentVerified: true,
      user: {
        ...prev.user,
        role: 'parent',
      },
    }));
    setParentAccessPromptOpen(false);
    setNotice({
      tone: 'success',
      message: 'Parent view unlocked',
    });
    logAction('parent_authenticated', 'parent', {
      studentId: authState.studentProfile.studentId,
    });
    return { ok: true };
  }, [authState.isAuthenticated, authState.studentProfile]);

  const login = useCallback(async (studentId: string, password: string): Promise<AuthActionResult> => {
    const normalizedId = studentId.trim().toUpperCase();
    if (!normalizedId) return { ok: false, error: 'Student ID is required' };
    if (!password.trim()) return { ok: false, error: 'Password is required' };

    const remoteProfile = await loginStudentRemote(normalizedId, password);
    if (remoteProfile) {
      if (remoteProfile.password && remoteProfile.password !== password) {
        return { ok: false, error: 'Invalid Student ID or Password' };
      }
      setAuthState({
        isAuthenticated: true,
        user: { role: 'student', grade: remoteProfile.grade, name: remoteProfile.studentName },
        studentProfile: remoteProfile,
        parentVerified: false,
      });
      setParentAccessPromptOpen(false);
      setNotice(null);
      persistSession(remoteProfile.studentId, remoteProfile);
      return { ok: true };
    }

    return { ok: false, error: 'Invalid Student ID or Password' };
  }, []);

  const loginWithParentAccessKey = useCallback(async (studentId: string, accessKey: string): Promise<AuthActionResult> => {
    const normalizedId = studentId.trim().toUpperCase();
    if (!normalizedId) return { ok: false, error: 'Student ID is required' };
    if (!accessKey.trim()) return { ok: false, error: 'Parent Access Key is required' };

    const remoteProfile = await loginParentRemote(normalizedId, accessKey);
    if (remoteProfile) {
      setAuthState({
        isAuthenticated: true,
        user: { role: 'parent', grade: remoteProfile.grade, name: remoteProfile.parentName || `${remoteProfile.studentName} Parent` },
        studentProfile: remoteProfile,
        parentVerified: true,
      });
      setParentAccessPromptOpen(false);
      setNotice({ tone: 'success', message: 'Parent view unlocked' });
      persistSession(remoteProfile.studentId, remoteProfile);
      logAction('parent_authenticated', 'parent', { studentId: remoteProfile.studentId, source: 'login' });
      return { ok: true };
    }

    return { ok: false, error: 'Invalid Student ID or Parent Access Key' };
  }, []);

  const logout = useCallback(() => {
    const shouldRedirectToLogin = authState.user.role === 'parent';
    setAuthState({
      isAuthenticated: false,
      user: DEFAULT_USER,
      studentProfile: null,
      parentVerified: false,
    });
    setParentAccessPromptOpen(false);
    setNotice(null);
    clearSessionStorage();
    persistAdminToken(null);
    if (shouldRedirectToLogin) {
      window.location.replace(getStudentLoginRedirectUrl());
    }
  }, [authState.user.role]);

  const updateStudentProfile = useCallback((updates: Partial<StudentProfile>): AuthActionResult => {
    if (!authState.isAuthenticated || !authState.studentProfile) {
      return { ok: false, error: 'Please login first' };
    }

    const nextProfile = saveStudentProfileOverrides(authState.studentProfile.studentId, updates);
    if (!nextProfile) {
      return { ok: false, error: 'Unable to save profile settings' };
    }

    setAuthState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        name: nextProfile.studentName,
        grade: nextProfile.grade,
      },
      studentProfile: nextProfile,
    }));

    return { ok: true };
  }, [authState.isAuthenticated, authState.studentProfile]);

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

  const switchRole = useCallback((): boolean => {
    if (!authState.isAuthenticated) return false;
    if (authState.user.role === 'parent') {
      switchToStudentView();
      return true;
    }
    return setRole('parent');
  }, [authState.isAuthenticated, authState.user.role, setRole, switchToStudentView]);

  const setGrade = useCallback((grade: number) => {
    setAuthState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        grade,
      },
      studentProfile: prev.studentProfile
        ? {
            ...prev.studentProfile,
            grade,
          }
        : prev.studentProfile,
    }));
  }, []);

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
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
    }),
    [
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
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
