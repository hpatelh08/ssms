/**
 * RoleRouter.tsx
 * ─────────────────────────────────────────────────────
 * Top-level router that renders the correct layout
 * based on the authenticated user's role and grade.
 *
 * Isolation contract:
 *   • student + grade 3 → ChildLayout (Playground)
 *   • parent            → ParentLayout (Dashboard)
 *
 * Grade scalability: add one branch per grade.
 * No mixed rendering — exactly ONE layout is mounted at a time.
 * Role switching is handled by the DashboardSwitch in the top bar.
 */

import React from 'react';
import { useAuth } from './AuthContext';
import ChildLayout from '../child/ChildLayout';
import { ParentLayout } from '../parent/ParentLayout';

/* ── Router ─────────────────────────────────────── */

/**
 * Renders exactly one layout based on user role.
 * Future grades add a single conditional branch.
 */
const RoleRouter: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      {/* ── Student routes (grade-based) ─────────── */}
      {user.role === 'student' && <ChildLayout />}

      {/* ── Parent route ─────────────────────────── */}
      {user.role === 'parent' && <ParentLayout />}
    </>
  );
};

export default RoleRouter;
