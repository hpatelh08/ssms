/**
 * AuthContext.tsx
 * ─────────────────────────────────────────────────────
 * Role-based authentication context.
 *
 * Provides a mock user object with `role` ("student" | "parent")
 * and `grade` (number), plus a `switchRole()` toggle for
 * development testing.
 *
 * The active role is persisted in localStorage so it
 * survives page reloads during dev sessions.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/* ── Types ──────────────────────────────────────── */

export interface AuthUser {
  role: 'student' | 'parent';
  grade: number;
  name: string;
}

export interface AuthContextType {
  user: AuthUser;
  switchRole: () => void;
  setRole: (role: 'student' | 'parent') => void;
  logout: () => void;
}

/* ── Context ────────────────────────────────────── */

const AuthContext = createContext<AuthContextType | null>(null);

/* ── Persistence ────────────────────────────────── */

const STORAGE_KEY = 'app_auth_role';

function loadPersistedRole(): AuthUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.role && parsed.grade) return { ...parsed, name: parsed.name || 'Yash' } as AuthUser;
    }
  } catch {
    /* corrupted — fall through to default */
  }
  return { role: 'student', grade: 1, name: 'Yash' };
}

/* ── Provider ───────────────────────────────────── */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(loadPersistedRole);

  const switchRole = useCallback(() => {
    setUser(prev => {
      const next: AuthUser =
        prev.role === 'student'
          ? { role: 'parent', grade: prev.grade, name: prev.name }
          : { role: 'student', grade: prev.grade, name: prev.name };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* quota / private mode */
      }
      return next;
    });
  }, []);

  const setRole = useCallback((role: 'student' | 'parent') => {
    setUser(prev => {
      if (prev.role === role) return prev;
      const next: AuthUser = { role, grade: prev.grade, name: prev.name };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setUser(loadPersistedRole());
    window.location.assign('/');
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ user, switchRole, setRole, logout }),
    [user, switchRole, setRole, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* ── Consumer hook ──────────────────────────────── */

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
