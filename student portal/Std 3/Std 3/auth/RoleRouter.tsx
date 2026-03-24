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
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import ParentAccessModal from './ParentAccessModal';
import ChildLayout from '../child/ChildLayout';
import { ParentLayout } from '../parent/ParentLayout';

/* ── Router ─────────────────────────────────────── */

/**
 * Renders exactly one layout based on user role.
 * AnimatePresence provides a smooth crossfade when toggling.
 */
const RoleRouter: React.FC = () => {
  const { user, isAuthenticated, notice, clearNotice } = useAuth();

  React.useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      clearNotice();
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [clearNotice, notice]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {user.role === 'student' && (
          <motion.div
            key="student"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ minHeight: '100vh' }}
          >
            <ChildLayout />
          </motion.div>
        )}

        {user.role === 'parent' && (
          <motion.div
            key="parent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ minHeight: '100vh' }}
          >
            <ParentLayout />
          </motion.div>
        )}
      </AnimatePresence>

      <ParentAccessModal />

      <AnimatePresence>
        {notice && (
          <motion.div
            className="fixed right-4 top-4 z-[130] max-w-sm rounded-[24px] px-4 py-3"
            style={{
              background: 'linear-gradient(135deg, rgba(236,253,245,0.98) 0%, rgba(240,253,250,0.98) 100%)',
              border: '1px solid rgba(16,185,129,0.18)',
              boxShadow: '0 20px 40px rgba(16,185,129,0.12)',
              color: '#047857',
            }}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="status"
            aria-live="polite"
          >
            <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-emerald-500">
              Access granted
            </div>
            <div className="mt-1 text-[14px] font-bold">{notice.message}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RoleRouter;
