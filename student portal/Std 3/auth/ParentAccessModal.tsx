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
              background: 'linear-gradient(180deg, rgba(2,6,23,0.74) 0%, rgba(15,23,42,0.8) 100%)',
              backdropFilter: 'blur(12px)',
            }}
            aria-label="Close parent access modal"
            onClick={cancelParentAccess}
          />

          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-[30px]"
            style={{
              background:
                'linear-gradient(118deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 36%, rgba(255,255,255,0.08) 100%), radial-gradient(circle at top right, rgba(56,189,248,0.2), transparent 38%), radial-gradient(circle at bottom left, rgba(168,85,247,0.16), transparent 30%), linear-gradient(180deg, rgba(7,12,28,0.95) 0%, rgba(15,23,42,0.94) 100%)',
              border: '1px solid rgba(148,163,184,0.22)',
              boxShadow: '0 34px 86px rgba(2,6,23,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
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
                  'radial-gradient(circle at top left, rgba(56,189,248,0.22), transparent 60%), radial-gradient(circle at top right, rgba(168,85,247,0.2), transparent 55%)',
              }}
              aria-hidden
            />

            <div className="relative px-7 pt-6 pb-8 md:px-8 md:pt-7 md:pb-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold"
                    style={{
                      background: 'rgba(59,130,246,0.2)',
                      color: '#bfdbfe',
                      border: '1px solid rgba(96,165,250,0.26)',
                    }}
                  >
                    Secure switch
                  </div>
                  <h2 id="parent-access-title" className="mt-4 text-[26px] font-black leading-tight" style={{ color: '#f8fafc' }}>
                    Enter Parent Access Key
                  </h2>
                  <p className="mt-2 text-[13px] font-semibold" style={{ color: '#cbd5e1' }}>
                    Confirm access to open the parent dashboard for {studentProfile?.studentName ?? 'this student'}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cancelParentAccess}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black"
                  style={{
                    color: '#e2e8f0',
                    background: 'rgba(15,23,42,0.82)',
                    border: '1px solid rgba(148,163,184,0.2)',
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
                    className="mb-1.5 block text-[12px] font-extrabold"
                    style={{ color: '#c7d2fe' }}
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
                    className="w-full rounded-2xl px-4 py-3 text-[14px] font-semibold placeholder:text-slate-400 outline-none"
                    style={{
                      background: 'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(30,41,59,0.82) 100%)',
                      border: '1px solid rgba(129,140,248,0.34)',
                      color: '#f8fafc',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                  />
                </div>

                {error ? (
                  <div
                    className="rounded-2xl px-3.5 py-2.5 text-[12px] font-bold"
                    style={{
                      background: 'rgba(239,68,68,0.14)',
                      border: '1px solid rgba(248,113,113,0.3)',
                      color: '#fecaca',
                    }}
                  >
                    {error}
                  </div>
                ) : (
                  <div
                    className="rounded-2xl px-3.5 py-2.5 text-[12px] font-semibold"
                    style={{
                      background: 'rgba(30,41,59,0.72)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      color: '#cbd5e1',
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
                      background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                      boxShadow: '0 12px 26px rgba(14,165,233,0.3)',
                    }}
                  >
                    Unlock Parent View
                  </button>
                  <button
                    type="button"
                    onClick={cancelParentAccess}
                    className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold"
                    style={{
                      background: 'rgba(15,23,42,0.82)',
                      color: '#e2e8f0',
                      border: '1px solid rgba(148,163,184,0.2)',
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
