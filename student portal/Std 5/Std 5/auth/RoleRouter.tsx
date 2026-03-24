/**
 * RoleRouter.tsx
 * ─────────────────────────────────────────────────────
 * Top-level router that renders the correct layout
 * based on the authenticated user's role and grade.
 *
 * Isolation contract:
 *   • student + grade 5 → ChildLayout (Playground)
 *   • parent            → ParentLayout (Dashboard)
 *
 * Grade scalability: add one branch per grade.
 * No mixed rendering — exactly ONE layout is mounted at a time.
 * Role switching is handled by the DashboardSwitch in the top bar.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import ChildLayout from '../child/ChildLayout';
import { ParentLayout } from '../parent/ParentLayout';

const RoleRouter: React.FC = () => {
  const { user } = useAuth();

  return (
    <AnimatePresence mode="wait">
      {user.role === 'student' ? (
        <motion.div
          key="student"
          initial={{ opacity: 0, x: -28, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 28, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ minHeight: '100vh' }}
        >
          <ChildLayout />
        </motion.div>
      ) : (
        <motion.div
          key="parent"
          initial={{ opacity: 0, x: 28, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -28, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ minHeight: '100vh' }}
        >
          <ParentLayout />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoleRouter;

