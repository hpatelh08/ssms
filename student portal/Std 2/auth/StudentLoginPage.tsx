import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './AuthContext';

const STUDENT_ID_PATTERN = /^STU[A-Z0-9]+$/i;

const surface = {
  shell: {
    minHeight: '100vh',
    fontFamily: '"Nunito", "Quicksand", "Segoe UI", sans-serif',
    background: [
      'radial-gradient(circle at 14% 18%, rgba(59,130,246,0.22), transparent 26%)',
      'radial-gradient(circle at 82% 16%, rgba(168,85,247,0.18), transparent 24%)',
      'radial-gradient(circle at 78% 82%, rgba(34,197,94,0.16), transparent 22%)',
      'linear-gradient(135deg, #e0f2fe 0%, #f8fafc 44%, #eef2ff 100%)',
    ].join(', '),
  } as React.CSSProperties,
  backdrop: {
    background: 'rgba(255,255,255,0.82)',
    border: '1px solid rgba(148,163,184,0.22)',
    boxShadow: '0 24px 80px rgba(30,41,59,0.12)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  } as React.CSSProperties,
  panel: {
    background: 'linear-gradient(145deg, #1d4ed8 0%, #4f46e5 56%, #7c3aed 100%)',
    color: '#fff',
  } as React.CSSProperties,
  field: {
    background: 'rgba(248,250,252,0.96)',
    border: '1px solid rgba(148,163,184,0.32)',
    color: '#0f172a',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
  } as React.CSSProperties,
  primaryButton: {
    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    boxShadow: '0 18px 30px rgba(59,130,246,0.28)',
  } as React.CSSProperties,
  ghostButton: {
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(148,163,184,0.28)',
    color: '#1e3a8a',
  } as React.CSSProperties,
  softCard: {
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(255,255,255,0.35)',
    boxShadow: '0 14px 30px rgba(30,41,59,0.08)',
  } as React.CSSProperties,
  error: {
    background: 'rgba(254,226,226,0.92)',
    border: '1px solid rgba(248,113,113,0.24)',
    color: '#b91c1c',
  } as React.CSSProperties,
};

function BadgeIcon() {
  return (
    <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[28px]" style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.26)' }}>
      <div className="absolute inset-3 rounded-[22px]" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.32), rgba(255,255,255,0.08))' }} />
      <div className="absolute h-10 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.92)' }} />
      <div className="absolute bottom-4 h-4 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.9)' }} />
      <div className="absolute top-3 h-3 w-3 rounded-full" style={{ background: '#f59e0b' }} />
    </div>
  );
}

const StudentLoginPage: React.FC = () => {
  const { login, loginWithParentAccessKey } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [parentMode, setParentMode] = useState(false);
  const [parentAccessKey, setParentAccessKey] = useState('');
  const [showParentAccessKey, setShowParentAccessKey] = useState(false);
  const [parentError, setParentError] = useState('');
  const studentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    studentInputRef.current?.focus();
  }, []);

  const normalizedId = studentId.trim().toUpperCase();

  const handleStudentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!normalizedId) {
      setError('Student ID is required');
      return;
    }

    if (!STUDENT_ID_PATTERN.test(normalizedId)) {
      setError('Use a Student ID like STU2024021');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    const result = await login(normalizedId, password);
    if (!result.ok) {
      setError(result.error ?? 'Invalid Student ID or Password');
    }
  };

  const handleParentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setParentError('');

    if (!normalizedId) {
      setParentError('Student ID is required');
      return;
    }

    if (!STUDENT_ID_PATTERN.test(normalizedId)) {
      setParentError('Use a Student ID like STU2024021');
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
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10" style={surface.shell}>
      <div aria-hidden className="pointer-events-none absolute left-[-120px] top-10 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(59,130,246,0.18)' }} />
      <div aria-hidden className="pointer-events-none absolute right-[-90px] top-24 h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(124,58,237,0.16)' }} />
      <div aria-hidden className="pointer-events-none absolute bottom-[-100px] left-[18%] h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(34,197,94,0.12)' }} />

      <motion.div
        className="relative z-10 mx-auto grid w-full max-w-6xl overflow-hidden rounded-[36px] lg:grid-cols-[1.05fr_0.95fr]"
        style={surface.backdrop}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <aside className="relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12" style={surface.panel}>
          <div aria-hidden className="absolute -right-8 top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="absolute bottom-8 right-12 h-20 w-20 rounded-full bg-white/10 blur-xl" />

          <div className="flex h-full flex-col justify-between gap-8">
            <div>
              <BadgeIcon />
              <div className="mt-6 text-center">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.3em] text-white/75">Student Portal</p>
                <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Learn. Login. Grow.</h1>
                <p className="mx-auto mt-4 max-w-md text-[15px] font-medium leading-7 text-white/82">
                  A fresh login page for students, built directly in this project without using the sample image.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] px-4 py-4" style={surface.softCard}>
                <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Fast access</div>
                <div className="mt-2 text-sm font-bold text-slate-800">Student ID + Password</div>
              </div>
              <div className="rounded-[24px] px-4 py-4" style={surface.softCard}>
                <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Safe entry</div>
                <div className="mt-2 text-sm font-bold text-slate-800">Parent Access Key</div>
              </div>
              <div className="rounded-[24px] px-4 py-4" style={surface.softCard}>
                <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Quick start</div>
                <div className="mt-2 text-sm font-bold text-slate-800">Clean, simple layout</div>
              </div>
            </div>
          </div>
        </aside>

        <section className="relative bg-white px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px]" style={{ background: 'linear-gradient(135deg, #dbeafe, #ede9fe)', border: '1px solid rgba(148,163,184,0.3)' }}>
                <div className="h-8 w-8 rounded-full" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }} />
              </div>
              <h2 className="text-4xl font-black tracking-tight text-slate-900">Student Login</h2>
              <p className="mx-auto mt-3 max-w-lg text-[15px] leading-7 text-slate-500">
                Enter your school credentials to open your student dashboard.
              </p>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label htmlFor="student-id" className="mb-2 block text-sm font-extrabold text-slate-700">Student ID</label>
                <input
                  ref={studentInputRef}
                  id="student-id"
                  autoComplete="username"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  placeholder="STU2024021"
                  className="w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold outline-none transition focus:ring-2 focus:ring-blue-500/30"
                  style={surface.field}
                />
              </div>

              <div>
                <label htmlFor="student-password" className="mb-2 block text-sm font-extrabold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    id="student-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl px-4 py-3.5 pr-28 text-[15px] font-semibold outline-none transition focus:ring-2 focus:ring-blue-500/30"
                    style={surface.field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-xl px-3 text-[12px] font-bold"
                    style={surface.ghostButton}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl px-4 py-3 text-sm font-bold" style={surface.error}>
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1 text-sm">
                <button
                  type="button"
                  onClick={() => setParentMode((prev) => !prev)}
                  className="font-bold text-blue-700 hover:text-blue-800"
                >
                  {parentMode ? 'Hide parent access' : 'Parent access key'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentId('');
                    setPassword('');
                    setError('');
                    setParentAccessKey('');
                    setParentError('');
                  }}
                  className="font-bold text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl py-3.5 text-[15px] font-extrabold text-white transition hover:translate-y-[-1px]"
                style={surface.primaryButton}
              >
                Sign In
              </button>
            </form>

            <AnimatePresence initial={false}>
              {parentMode && (
                <motion.div
                  className="mt-6 rounded-[28px] p-5"
                  style={{ background: 'linear-gradient(145deg, rgba(239,246,255,0.9), rgba(250,245,255,0.9))', border: '1px solid rgba(148,163,184,0.22)' }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-900">Parent Access</h3>
                    <p className="mt-1 text-sm text-slate-500">Use the access key shown in admin side for parent login.</p>
                  </div>

                  <form onSubmit={handleParentSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="parent-access-key" className="mb-2 block text-sm font-extrabold text-slate-700">Parent Access Key</label>
                      <div className="relative">
                        <input
                          id="parent-access-key"
                          type={showParentAccessKey ? 'text' : 'password'}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={parentAccessKey}
                          onChange={(event) => setParentAccessKey(event.target.value)}
                          placeholder="Enter 4 digit key"
                          className="w-full rounded-2xl px-4 py-3.5 pr-28 text-[15px] font-semibold outline-none transition focus:ring-2 focus:ring-blue-500/30"
                          style={surface.field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowParentAccessKey((prev) => !prev)}
                          className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-xl px-3 text-[12px] font-bold"
                          style={surface.ghostButton}
                        >
                          {showParentAccessKey ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    {parentError && (
                      <div className="rounded-2xl px-4 py-3 text-sm font-bold" style={surface.error}>
                        {parentError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full rounded-2xl py-3.5 text-[15px] font-extrabold text-white transition hover:translate-y-[-1px]"
                      style={surface.primaryButton}
                    >
                      Open Parent Dashboard
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default StudentLoginPage;
