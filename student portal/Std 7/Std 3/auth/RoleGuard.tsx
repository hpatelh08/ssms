/**
 * RoleGuard.tsx
 * ─────────────────────────────────────────────────────
 * Protective wrapper components that conditionally render
 * children based on the current user's role / grade.
 *
 * Usage:
 *   <ParentOnly>
 *     <AnalyticsPanel />        // only visible to parents
 *   </ParentOnly>
 *
 *   <StudentOnly>
 *     <PlayWorld />             // only visible to students
 *   </StudentOnly>
 *
 *   <GradeOnly grade={1}>
 *     <Grade1Curriculum />      // only grade-1 students
 *   </GradeOnly>
 *
 * All guards accept an optional `fallback` prop rendered
 * when access is denied (defaults to null — invisible).
 */

import React from 'react';
import { useAuth } from './AuthContext';

/* ── Shared props ───────────────────────────────── */

interface GuardProps {
  children: React.ReactNode;
  /** Rendered when the guard blocks access. Defaults to null. */
  fallback?: React.ReactNode;
}

/* ── Guards ──────────────────────────────────────── */

/** Renders children only when `user.role === 'parent'`. */
export const ParentOnly: React.FC<GuardProps> = ({ children, fallback = null }) => {
  const { user } = useAuth();
  return user.role === 'parent' ? <>{children}</> : <>{fallback}</>;
};

/** Renders children only when `user.role === 'student'`. */
export const StudentOnly: React.FC<GuardProps> = ({ children, fallback = null }) => {
  const { user } = useAuth();
  return user.role === 'student' ? <>{children}</> : <>{fallback}</>;
};

/** Renders children only when user is a student in a specific grade. */
export const GradeOnly: React.FC<GuardProps & { grade: number }> = ({
  grade,
  children,
  fallback = null,
}) => {
  const { user } = useAuth();
  return user.role === 'student' && user.grade === grade
    ? <>{children}</>
    : <>{fallback}</>;
};
