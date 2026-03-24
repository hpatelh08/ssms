import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './AuthContext';

export const ParentAccessModal: React.FC = () => {
  const {
    isParentAccessPromptOpen,
    cancelParentAccess,
    verifyParentAccessKey,
    studentProfile,
  } = useAuth();
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isParentAccessPromptOpen) {
      setAccessKey('');
      setError('');
      return;
    }

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelParentAccess();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cancelParentAccess, isParentAccessPromptOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!accessKey.trim()) {
      setError('Parent Access Key is required');
      return;
    }

    const result = verifyParentAccessKey(accessKey);
    if (!result.ok) {
      setError(result.error ?? 'Invalid Parent Access Key');
    }
  };

  return (
    <AnimatePresence>
      {isParentAccessPromptOpen && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0"
            style={{
              background: 'rgba(67, 56, 202, 0.18)',
              backdropFilter: 'blur(10px)',
            }}
            aria-label="Close parent access modal"
            onClick={cancelParentAccess}
          />

          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-[30px]"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,255,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.75)',
              boxShadow: '0 30px 70px rgba(79,70,229,0.18)',
            }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="parent-access-title"
          >
            <div
              className="absolute inset-x-0 top-0 h-28"
              style={{
                background:
                  'radial-gradient(circle at top left, rgba(99,102,241,0.26), transparent 60%), radial-gradient(circle at top right, rgba(244,114,182,0.22), transparent 55%)',
              }}
              aria-hidden
            />

            <div className="relative p-6 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold"
                    style={{
                      background: 'rgba(99,102,241,0.09)',
                      color: '#5b5cf0',
                    }}
                  >
                    Secure switch
                  </div>
                  <h2 id="parent-access-title" className="mt-4 text-[26px] font-black leading-tight text-indigo-600">
                    Enter Parent Access Key
                  </h2>
                  <p className="mt-2 text-[13px] font-semibold text-indigo-400">
                    Confirm access to open the parent dashboard for {studentProfile?.studentName ?? 'this student'}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cancelParentAccess}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black"
                  style={{
                    color: '#6366f1',
                    background: 'rgba(99,102,241,0.08)',
                  }}
                  aria-label="Cancel parent access"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="parent-access-key"
                    className="mb-1.5 block text-[12px] font-extrabold text-indigo-500"
                  >
                    Parent Access Key
                  </label>
                  <input
                    ref={inputRef}
                    id="parent-access-key"
                    type="password"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={accessKey}
                    onChange={event => setAccessKey(event.target.value)}
                    placeholder="Enter access key"
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-semibold outline-none"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
                      border: '1px solid rgba(129,140,248,0.28)',
                      color: '#353f86',
                    }}
                  />
                </div>

                {error ? (
                  <div
                    className="rounded-2xl px-3.5 py-2.5 text-[12px] font-bold"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#dc2626',
                    }}
                  >
                    {error}
                  </div>
                ) : (
                  <div
                    className="rounded-2xl px-3.5 py-2.5 text-[12px] font-semibold"
                    style={{
                      background: 'rgba(99,102,241,0.06)',
                      border: '1px solid rgba(99,102,241,0.12)',
                      color: '#6366f1',
                    }}
                  >
                    This key is only needed when switching from Student to Parent view.
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      boxShadow: '0 12px 26px rgba(99,102,241,0.28)',
                    }}
                  >
                    Unlock Parent View
                  </button>
                  <button
                    type="button"
                    onClick={cancelParentAccess}
                    className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold"
                    style={{
                      background: 'rgba(99,102,241,0.08)',
                      color: '#6366f1',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ParentAccessModal;
