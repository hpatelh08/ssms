/**
 * RoleRouter.tsx
 * Top-level router for Std 4.
 *
 * If the user is not logged in, show the login screen.
 * Once logged in, render exactly one dashboard layout.
 */

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import ChildLayout from '../child/ChildLayout';
import { ParentLayout } from '../parent/ParentLayout';

const RoleRouter: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isParentAccessPromptOpen,
    cancelParentAccess,
    verifyParentAccessKey,
  } = useAuth();
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');

  const handleClose = useCallback(() => {
    setError('');
    setAccessKey('');
    cancelParentAccess();
  }, [cancelParentAccess]);

  const handleVerify = useCallback(() => {
    const result = verifyParentAccessKey(accessKey);
    if (!result.ok) {
      setError(result.error || 'Invalid Parent Access Key');
      return;
    }
    setError('');
    setAccessKey('');
  }, [accessKey, verifyParentAccessKey]);

  if (!isAuthenticated) return <ChildLayout />;

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

      <AnimatePresence>
        {isParentAccessPromptOpen && (
          <motion.div
            className="fixed inset-0 z-[160] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0"
              style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(10px)' }}
              aria-label="Close parent access"
              onClick={handleClose}
            />
            <motion.div
              className="relative w-full max-w-md overflow-hidden rounded-[30px]"
              style={{
                background: 'linear-gradient(135deg, rgba(255,248,230,0.98), rgba(255,239,204,0.98))',
                border: '1px solid rgba(245,158,11,0.18)',
                boxShadow: '0 24px 60px rgba(180,83,9,0.18)',
              }}
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-amber-100">
                <p className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-600">Parent Access Key</p>
                <h3 className="mt-2 text-2xl font-black text-amber-950">Unlock Parent Portal</h3>
                <p className="mt-2 text-sm font-medium text-amber-800/80">
                  Enter the correct parent access key to open the parent dashboard.
                </p>
              </div>
              <div className="p-6">
                <label className="mb-2 block text-xs font-extrabold tracking-[0.18em] uppercase text-amber-700">
                  Parent Access Key
                </label>
                <input
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerify();
                    }
                  }}
                  placeholder="Enter parent access key"
                  className="w-full rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 outline-none"
                />
                {error && <p className="mt-3 text-xs font-bold text-red-500">{error}</p>}
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-2xl border border-amber-200 bg-white/80 px-4 py-3 text-sm font-extrabold text-amber-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVerify}
                    className="flex-1 rounded-2xl px-4 py-3 text-sm font-extrabold text-white"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                  >
                    Open Parent Portal
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RoleRouter;
