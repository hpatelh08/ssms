import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './AuthContext';

const STUDENT_ID_PATTERN = /^STU[A-Z0-9]+$/i;

export const LoginPage: React.FC = () => {
  const { login, loginWithParentAccessKey } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isParentModalOpen, setParentModalOpen] = useState(false);
  const [parentAccessKey, setParentAccessKey] = useState('');
  const [parentError, setParentError] = useState('');
  const parentAccessKeyRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isParentModalOpen) return undefined;

    const focusTimer = window.setTimeout(() => {
      parentAccessKeyRef.current?.focus();
    }, 120);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setParentModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isParentModalOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalizedId = studentId.trim().toUpperCase();
    if (!normalizedId) {
      setError('Student ID is required');
      return;
    }
    if (!STUDENT_ID_PATTERN.test(normalizedId)) {
      setError('Student ID must start with STU (example: STU2024301)');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    const result = await login(normalizedId, password);
    if (!result.ok) {
      setError(result.error ?? 'Invalid Student ID or Password');
    }
  };

  const openParentModal = () => {
    setParentAccessKey('');
    setParentError('');
    setParentModalOpen(true);
  };

  const closeParentModal = () => {
    setParentModalOpen(false);
  };

  const handleParentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setParentError('');

    const normalizedId = studentId.trim().toUpperCase();
    if (!normalizedId) {
      setParentError('Enter Student ID on the login form first');
      return;
    }
    if (!STUDENT_ID_PATTERN.test(normalizedId)) {
      setParentError('Student ID must start with STU (example: STU2024301)');
      return;
    }
    if (!parentAccessKey.trim()) {
      setParentError('Parent Access Key is required');
      return;
    }

    const result = await loginWithParentAccessKey(normalizedId, parentAccessKey);
    if (!result.ok) {
      setParentError(result.error ?? 'Invalid Parent Access Key');
      return;
    }

    setParentModalOpen(false);
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden p-4 md:p-8 flex items-center justify-center"
      style={{
        fontFamily: "'Outfit', 'Nunito Sans', 'Segoe UI', sans-serif",
        background:
          'radial-gradient(circle at 14% 16%, rgba(34,211,238,0.18), transparent 34%), radial-gradient(circle at 85% 82%, rgba(168,85,247,0.2), transparent 40%), linear-gradient(145deg, #050816 0%, #0a1331 45%, #090c1f 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 8% 20%, rgba(255,255,255,0.55) 0 1px, transparent 1px), radial-gradient(circle at 22% 75%, rgba(255,255,255,0.38) 0 1px, transparent 1px), radial-gradient(circle at 71% 28%, rgba(255,255,255,0.46) 0 1px, transparent 1px), radial-gradient(circle at 84% 62%, rgba(255,255,255,0.32) 0 1px, transparent 1px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-14 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'rgba(56,189,248,0.2)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'rgba(168,85,247,0.22)' }}
      />

      <motion.div
        className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 overflow-hidden rounded-[30px]"
        style={{
          background: 'linear-gradient(145deg, rgba(8,15,38,0.95) 0%, rgba(10,18,46,0.92) 100%)',
          border: '1px solid rgba(125,211,252,0.24)',
          boxShadow: '0 28px 90px rgba(2,6,23,0.65), inset 0 1px 0 rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div
          className="hidden md:flex relative flex-col justify-between p-8 lg:p-10"
          style={{
            background:
              'linear-gradient(165deg, rgba(13,31,77,0.84) 0%, rgba(25,47,110,0.72) 45%, rgba(12,22,56,0.82) 100%)',
            borderRight: '1px solid rgba(125,211,252,0.18)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-20 h-40 w-40 rounded-full blur-2xl"
            style={{ background: 'rgba(34,211,238,0.18)' }}
          />

          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-extrabold"
              style={{
                background: 'rgba(15,23,42,0.6)',
                color: '#93c5fd',
                border: '1px solid rgba(96,165,250,0.3)',
              }}
            >
              <span aria-hidden>+</span>
              My Learning Space
            </div>
            <h1 className="mt-4 text-[34px] leading-tight font-black" style={{ color: '#dbeafe' }}>
              Welcome back,
              <br />
              space explorer
            </h1>
            <p className="mt-3 text-[14px] font-semibold" style={{ color: '#93c5fd' }}>
              Log in with your Student ID and continue your galaxy learning mission.
            </p>
          </div>

          <div
            className="rounded-3xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.62) 100%)',
              border: '1px solid rgba(125,211,252,0.28)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <div className="text-xl font-black" style={{ color: '#67e8f9' }}>Mission Control</div>
            <p className="mt-3 text-[13px] font-bold" style={{ color: '#bfdbfe' }}>Ready to launch learning?</p>
            <p className="mt-1 text-[12px]" style={{ color: '#93c5fd' }}>
              Games, stars, and milestones are waiting in your academy.
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 lg:p-10">
          <div className="md:hidden mb-5">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-extrabold"
              style={{
                background: 'rgba(15,23,42,0.65)',
                color: '#93c5fd',
                border: '1px solid rgba(96,165,250,0.3)',
              }}
            >
              <span aria-hidden>+</span>
              My Learning Space
            </div>
            <h1 className="mt-3 text-[26px] leading-tight font-black" style={{ color: '#e2e8f0' }}>Student Login</h1>
          </div>

          <div className="hidden md:block mb-6">
            <h2 className="text-[30px] font-black leading-tight" style={{ color: '#e2e8f0' }}>Student Login</h2>
            <p className="mt-1 text-[13px] font-semibold" style={{ color: '#93c5fd' }}>
              Enter your Student ID and password to open your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="student-id" className="block text-[12px] font-extrabold mb-1.5" style={{ color: '#bfdbfe' }}>
                Student ID
              </label>
              <input
                id="student-id"
                autoComplete="username"
                value={studentId}
                onChange={event => setStudentId(event.target.value)}
                placeholder="STU2024301"
                className="w-full rounded-2xl px-4 py-3 text-[14px] font-semibold outline-none focus:ring-2"
                style={{
                  background: 'linear-gradient(180deg, rgba(15,23,42,0.86) 0%, rgba(30,41,59,0.8) 100%)',
                  border: '1px solid rgba(125,211,252,0.28)',
                  color: '#e2e8f0',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              />
            </div>

            <div>
              <label htmlFor="student-password" className="block text-[12px] font-extrabold mb-1.5" style={{ color: '#bfdbfe' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="student-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl px-4 py-3 pr-14 text-[14px] font-semibold outline-none focus:ring-2"
                  style={{
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.86) 0%, rgba(30,41,59,0.8) 100%)',
                    border: '1px solid rgba(125,211,252,0.28)',
                    color: '#e2e8f0',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-3 rounded-xl text-[11px] font-bold"
                  style={{
                    color: '#93c5fd',
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid rgba(125,211,252,0.24)',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
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
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-[14px] font-extrabold text-white"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 48%, #22d3ee 100%)',
                boxShadow: '0 12px 30px rgba(14,165,233,0.35)',
              }}
            >
              Launch Login
            </button>
          </form>

          <p className="mt-3 text-center text-[12px] font-semibold cursor-default" style={{ color: '#93c5fd' }}>
            Forgot Password?
          </p>
          <div className="mt-1 text-center">
            <button
              type="button"
              onClick={openParentModal}
              className="text-[12px] font-bold"
              style={{ color: '#67e8f9' }}
            >
              Parent Access
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isParentModalOpen && (
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
              onClick={closeParentModal}
            />

            <motion.div
              className="relative w-full max-w-md overflow-hidden rounded-[30px]"
              style={{
                background:
                  'linear-gradient(118deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 36%, rgba(255,255,255,0.08) 100%), radial-gradient(circle at top right, rgba(56,189,248,0.24), transparent 38%), radial-gradient(circle at bottom left, rgba(168,85,247,0.2), transparent 30%), linear-gradient(180deg, rgba(7,12,28,0.95) 0%, rgba(15,23,42,0.94) 100%)',
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
                      className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-extrabold"
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
                      Confirm access to open the parent dashboard for {studentId.trim().toUpperCase() || 'this student'}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeParentModal}
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

                <form onSubmit={handleParentSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="parent-access-key"
                      className="mb-1.5 block text-[12px] font-extrabold"
                      style={{ color: '#c7d2fe' }}
                    >
                      Parent Access Key
                    </label>
                    <input
                      ref={parentAccessKeyRef}
                      id="parent-access-key"
                      type="password"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={parentAccessKey}
                      onChange={event => setParentAccessKey(event.target.value)}
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

                  {parentError ? (
                    <div
                      className="rounded-2xl px-3.5 py-2.5 text-[12px] font-bold"
                      style={{
                        background: 'rgba(239,68,68,0.14)',
                        border: '1px solid rgba(248,113,113,0.3)',
                        color: '#fecaca',
                      }}
                    >
                      {parentError}
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
                      onClick={closeParentModal}
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

    </div>
  );
};

export default LoginPage;
