/**
 * RoleRouter.tsx
 * Top-level router for Std 4.
 *
 * If the user is not logged in, show the login screen.
 * Once logged in, render exactly one dashboard layout.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import ChildLayout from '../child/ChildLayout';
import { ParentLayout } from '../parent/ParentLayout';

const RoleRouter: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <LoginPage />;

  return (
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
  );
};

export default RoleRouter;
