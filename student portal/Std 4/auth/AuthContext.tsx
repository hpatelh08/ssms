/**
 * auth/AuthContext.tsx
 * Lightweight session-based auth for Std 4.
 *
 * Provides:
 * - login / logout
 * - role switching
 * - persisted session
 * - current user profile data for the top bars and profile menu
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface AuthUser {
  role: 'student' | 'parent';
  grade: number;
  name: string;
  username: string;
}

export interface StudentProfile {
  studentName?: string;
  className?: string;
  grade?: number;
  status?: string;
  studentId?: string;
  parentAccessKey?: string;
  password?: string;
  admissionNumber?: string;
  grNo?: string;
  fatherName?: string;
  parentName?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  division?: string;
}

export interface AuthActionResult {
  ok: boolean;
  error?: string;
}

export interface LoginInput {
  username: string;
  password: string;
  role: 'student' | 'parent';
  grade?: number;
  name?: string;
}

export interface AuthContextType {
  user: AuthUser;
  isAuthenticated: boolean;
  studentProfile: StudentProfile | null;
  isParentAccessPromptOpen: boolean;
  login: (input: LoginInput) => Promise<AuthActionResult>;
  logout: () => void;
  switchRole: () => void;
  setRole: (role: 'student' | 'parent') => void;
  requestParentAccess: () => void;
  cancelParentAccess: () => void;
  verifyParentAccessKey: (accessKey: string) => AuthActionResult;
}

const STORAGE_KEY = 'ssms_std4_auth_session_v1';
const LOGIN_REDIRECT_URL = `${window.location.protocol}//${window.location.hostname}:5000/student-login`;
const DEFAULT_USER: AuthUser = {
  role: 'student',
  grade: 4,
  name: 'Std 4 Learner',
  username: 'STU20240361',
};

type PersistedSession = {
  isAuthenticated: boolean;
  user: AuthUser;
  studentProfile?: StudentProfile | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

function buildParentAccessKey(username: string): string {
  const normalized = username.trim().toUpperCase();
  return normalized ? `${normalized}-PARENT` : '';
}

function prettyName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'Std 4 Learner';
  return trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(part => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ');
}

function loadSession(): PersistedSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { isAuthenticated: false, user: DEFAULT_USER };
    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed?.user?.name || !parsed?.user?.username) return { isAuthenticated: false, user: DEFAULT_USER };
    return {
      isAuthenticated: Boolean(parsed.isAuthenticated),
      user: {
        role: parsed.user.role === 'parent' ? 'parent' : 'student',
        grade: Number(parsed.user.grade) || 4,
        name: parsed.user.name,
        username: parsed.user.username,
      },
      studentProfile: parsed.studentProfile
        ? {
          ...parsed.studentProfile,
          parentAccessKey: parsed.studentProfile.parentAccessKey || buildParentAccessKey(parsed.user.username),
        }
        : null,
    };
  } catch {
    return { isAuthenticated: false, user: DEFAULT_USER };
  }
}

function persistSession(session: PersistedSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage failures in private mode or low quota.
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<PersistedSession>(loadSession);
  const [isParentAccessPromptOpen, setParentAccessPromptOpen] = useState(false);

  const updateSession = useCallback((next: PersistedSession | null) => {
    if (!next) {
      setSession({ isAuthenticated: false, user: DEFAULT_USER });
      persistSession(null);
      return;
    }
    setSession(next);
    persistSession(next);
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<AuthActionResult> => {
    const username = input.username.trim().toUpperCase();
    const password = input.password.trim();
    if (!username) return { ok: false, error: 'Username is required' };
    if (!password) return { ok: false, error: 'Password is required' };
    if (password.length < 3) return { ok: false, error: 'Password is too short' };

    const role = input.role === 'parent' ? 'parent' : 'student';
    const grade = Number(input.grade) || 4;
    const name = prettyName(input.name || username);
    const parentAccessKey = buildParentAccessKey(username);
    const studentProfile: StudentProfile = {
      studentName: name,
      className: `Std ${grade}`,
      grade,
      status: 'Active',
      studentId: username,
      parentAccessKey,
      parentName: `Parent of ${name}`,
      fatherName: `Parent of ${name}`,
    };

    updateSession({
      isAuthenticated: true,
      user: {
        role,
        grade,
        name,
        username,
      },
      studentProfile,
    });

    return { ok: true };
  }, [updateSession]);

  const logout = useCallback(() => {
    setParentAccessPromptOpen(false);
    updateSession(null);
    if (session.user.role === 'parent') {
      window.location.replace(LOGIN_REDIRECT_URL);
    }
  }, [session.user.role, updateSession]);

  const switchRole = useCallback(() => {
    if (session.user.role === 'student') {
      setParentAccessPromptOpen(true);
      return;
    }
    setSession(prev => {
      if (!prev.isAuthenticated) return prev;
      const next: PersistedSession = {
        ...prev,
        user: {
          ...prev.user,
          role: prev.user.role === 'student' ? 'parent' : 'student',
        },
      };
      persistSession(next);
      return next;
    });
    setParentAccessPromptOpen(false);
  }, [session.user.role]);

  const setRole = useCallback((role: 'student' | 'parent') => {
    if (role === 'parent') {
      setParentAccessPromptOpen(true);
      return;
    }
    setSession(prev => {
      if (!prev.isAuthenticated || prev.user.role === role) return prev;
      const next: PersistedSession = {
        ...prev,
        user: {
          ...prev.user,
          role,
        },
      };
      persistSession(next);
      return next;
    });
  }, []);

  const requestParentAccess = useCallback(() => {
    if (!session.isAuthenticated) return;
    setParentAccessPromptOpen(true);
  }, [session.isAuthenticated]);

  const cancelParentAccess = useCallback(() => {
    setParentAccessPromptOpen(false);
  }, []);

  const verifyParentAccessKey = useCallback((accessKey: string): AuthActionResult => {
    if (!session.isAuthenticated) {
      return { ok: false, error: 'Please login first' };
    }
    const expected = session.studentProfile?.parentAccessKey || buildParentAccessKey(session.user.username);
    if (accessKey.trim() !== expected) {
      return { ok: false, error: 'Invalid Parent Access Key' };
    }

    const next: PersistedSession = {
      ...session,
      user: {
        ...session.user,
        role: 'parent',
      },
      studentProfile: {
        ...(session.studentProfile || {
          studentName: session.user.name,
          className: `Std ${session.user.grade}`,
          grade: session.user.grade,
          studentId: session.user.username,
        }),
        parentAccessKey: expected,
      },
    };
    setSession(next);
    persistSession(next);
    setParentAccessPromptOpen(false);
    return { ok: true };
  }, [session]);

  const value = useMemo<AuthContextType>(() => ({
    user: session.user,
    isAuthenticated: session.isAuthenticated,
    studentProfile: session.studentProfile || null,
    isParentAccessPromptOpen,
    login,
    logout,
    switchRole,
    setRole,
    requestParentAccess,
    cancelParentAccess,
    verifyParentAccessKey,
  }), [
    session.user,
    session.isAuthenticated,
    session.studentProfile,
    isParentAccessPromptOpen,
    login,
    logout,
    switchRole,
    setRole,
    requestParentAccess,
    cancelParentAccess,
    verifyParentAccessKey,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
