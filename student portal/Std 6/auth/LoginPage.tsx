import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './AuthContext';

const STUDENT_ID_PATTERN = /^STU[A-Z0-9]+$/i;

const themedSurface = {
  shell: {
    fontFamily: '"Nunito", "Quicksand", "Segoe UI", sans-serif',
    background: [
      'radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--pastel-blue-deep) 34%, transparent), transparent 34%)',
      'radial-gradient(circle at 88% 20%, color-mix(in srgb, var(--pastel-purple-deep) 26%, transparent), transparent 32%)',
      'radial-gradient(circle at 82% 82%, color-mix(in srgb, var(--pastel-pink-deep) 24%, transparent), transparent 30%)',
      'linear-gradient(135deg, var(--pastel-blue-soft) 0%, #ffffff 42%, var(--pastel-yellow-soft) 100%)',
    ].join(', '),
  } as React.CSSProperties,
  dots: {
    backgroundImage: [
      'radial-gradient(circle at 8% 20%, rgba(255,255,255,0.95) 0 1px, transparent 1px)',
      'radial-gradient(circle at 24% 76%, rgba(255,255,255,0.8) 0 1px, transparent 1px)',
      'radial-gradient(circle at 72% 28%, rgba(255,255,255,0.8) 0 1px, transparent 1px)',
      'radial-gradient(circle at 85% 64%, rgba(255,255,255,0.9) 0 1px, transparent 1px)',
    ].join(', '),
  } as React.CSSProperties,
  panel: {
    background: 'rgba(255, 255, 255, 0.78)',
    border: '1px solid var(--border-soft)',
    boxShadow: 'var(--shadow-depth)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  } as React.CSSProperties,
  modalPanel: {
    background: 'linear-gradient(145deg, color-mix(in srgb, var(--pastel-blue-soft) 72%, white) 0%, color-mix(in srgb, var(--pastel-purple-soft) 70%, white) 46%, color-mix(in srgb, var(--pastel-yellow-soft) 76%, white) 100%)',
    border: '1px solid var(--border-soft)',
    boxShadow: 'var(--shadow-depth)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  } as React.CSSProperties,
  story: {
    background: 'var(--gradient-hero)',
    borderRight: '1px solid var(--border-soft)',
  } as React.CSSProperties,
  card: {
    background: 'rgba(255,255,255,0.64)',
    border: '1px solid var(--border-card)',
    boxShadow: 'var(--shadow-card)',
  } as React.CSSProperties,
  input: {
    background: 'rgba(255,255,255,0.84)',
    border: '1px solid var(--border-soft)',
    color: 'var(--text-primary)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
  } as React.CSSProperties,
  ghostButton: {
    color: 'var(--text-accent-blue)',
    background: 'rgba(255,255,255,0.78)',
    border: '1px solid var(--border-soft)',
  } as React.CSSProperties,
  primaryButton: {
    background: 'linear-gradient(135deg, var(--text-accent-blue) 0%, var(--text-accent-purple) 100%)',
    boxShadow: 'var(--shadow-glow-blue)',
  } as React.CSSProperties,
  error: {
    background: 'rgba(248, 113, 113, 0.12)',
    border: '1px solid rgba(248, 113, 113, 0.22)',
    color: '#b91c1c',
  } as React.CSSProperties,
  helper: {
    background: 'rgba(255,255,255,0.64)',
    border: '1px solid var(--border-soft)',
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  overlay: {
    background: 'rgba(255, 255, 255, 0.38)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  } as React.CSSProperties,
};

const modalCopy = {
  badge: 'Scholar Family Pass',
  title: 'Enter Scholar Parent Key',
  description: 'Confirm family access to open the Std 6 parent scholar dashboard for',
  label: 'Scholar Parent Key',
  placeholder: 'Enter scholar key',
  helper: 'Use this family key to switch from the student scholar dashboard to the parent progress view.',
  submit: 'Open Parent Scholar View',
};

const LoginPage: React.FC = () => {
  const { login, loginWithParentAccessKey } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isParentModalOpen, setParentModalOpen] = useState(false);
  const [parentAccessKey, setParentAccessKey] = useState('');
  const [showParentAccessKey, setShowParentAccessKey] = useState(false);
  const [parentError, setParentError] = useState('');
  const parentAccessKeyRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isParentModalOpen) return undefined;
    const focusTimer = window.setTimeout(() => parentAccessKeyRef.current?.focus(), 120);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setParentModalOpen(false);
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
    if (!normalizedId) return setError('Student ID is required');
    if (!STUDENT_ID_PATTERN.test(normalizedId)) return setError('Student ID must start with STU (example: STU2024021)');
    if (!password) return setError('Password is required');
    const result = await login(normalizedId, password);
    if (!result.ok) setError(result.error ?? 'Invalid Student ID or Password');
  };

  const handleParentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setParentError('');
    const normalizedId = studentId.trim().toUpperCase();
    if (!normalizedId) return setParentError('Enter Student ID on the login form first');
    if (!STUDENT_ID_PATTERN.test(normalizedId)) return setParentError('Student ID must start with STU (example: STU2024021)');
    if (!parentAccessKey.trim()) return setParentError('Parent Access Key is required');
    const result = await loginWithParentAccessKey(normalizedId, parentAccessKey);
    if (!result.ok) return setParentError(result.error ?? 'Invalid Parent Access Key');
    setParentModalOpen(false);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 md:p-8" style={themedSurface.shell}>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={themedSurface.dots} />
      <div aria-hidden className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--pastel-blue-deep) 42%, transparent)' }} />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--pastel-peach-deep) 32%, transparent)' }} />

      <motion.div
        className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[34px] md:grid-cols-2"
        style={themedSurface.panel}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="relative hidden flex-col justify-between p-8 md:flex lg:p-10" style={themedSurface.story}>
          <div aria-hidden className="pointer-events-none absolute right-6 top-8 h-28 w-28 rounded-full blur-2xl" style={{ background: 'color-mix(in srgb, var(--pastel-pink-deep) 28%, transparent)' }} />
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-extrabold" style={{ background: 'rgba(255,255,255,0.72)', color: 'var(--text-accent-purple)', border: '1px solid var(--border-card)' }}>
              <span aria-hidden>+</span>
              My Learning Space
            </div>
            <h1 className="mt-5 text-[34px] font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
              Welcome back,
              <br />
              bright learner
            </h1>
            <p className="mt-3 max-w-sm text-[14px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Sign in with your Student ID and continue your learning journey in the same theme as your dashboard.
            </p>
          </div>

          <div className="rounded-[28px] p-6" style={themedSurface.card}>
            <div className="text-xl font-black" style={{ color: 'var(--text-accent-blue)' }}>Ready for today?</div>
            <p className="mt-3 text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Lessons, games, and progress are waiting for you.</p>
            <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>Your login view now stays visually synced with the rest of the app.</p>
          </div>
        </div>

        <div className="p-6 md:p-8 lg:p-10">
          <div className="mb-5 md:hidden">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-extrabold" style={{ background: 'rgba(255,255,255,0.75)', color: 'var(--text-accent-purple)', border: '1px solid var(--border-card)' }}>
              <span aria-hidden>+</span>
              My Learning Space
            </div>
            <h1 className="mt-3 text-[26px] font-black leading-tight" style={{ color: 'var(--text-primary)' }}>Student Login</h1>
          </div>

          <div className="mb-6 hidden md:block">
            <h2 className="text-[30px] font-black leading-tight" style={{ color: 'var(--text-primary)' }}>Student Login</h2>
            <p className="mt-1 text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Enter your Student ID and password to open your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="student-id" className="mb-1.5 block text-[12px] font-extrabold" style={{ color: 'var(--text-secondary)' }}>Student ID</label>
              <input id="student-id" autoComplete="username" value={studentId} onChange={event => setStudentId(event.target.value)} placeholder="STU2024021" className="w-full rounded-2xl px-4 py-3 text-[14px] font-semibold outline-none focus:ring-2" style={themedSurface.input} />
            </div>

            <div>
              <label htmlFor="student-password" className="mb-1.5 block text-[12px] font-extrabold" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input id="student-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" className="w-full rounded-2xl px-4 py-3 pr-14 text-[14px] font-semibold outline-none focus:ring-2" style={themedSurface.input} />
                <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-2 top-1/2 h-9 -translate-y-1/2 rounded-xl px-3 text-[11px] font-bold" style={themedSurface.ghostButton} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <div className="rounded-2xl px-3.5 py-2.5 text-[12px] font-bold" style={themedSurface.error}>{error}</div>}

            <button type="submit" className="w-full rounded-2xl py-3.5 text-[14px] font-extrabold text-white" style={themedSurface.primaryButton}>Continue Learning</button>
          </form>

          <p className="mt-3 cursor-default text-center text-[12px] font-semibold" style={{ color: 'var(--text-soft)' }}>Forgot Password?</p>
          <div className="mt-1 text-center">
            <button
              type="button"
              onClick={() => {
                setParentAccessKey('');
                setParentError('');
                setParentModalOpen(true);
              }}
              className="text-[12px] font-bold"
              style={{ color: 'var(--text-accent-blue)' }}
            >
              Parent Access
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isParentModalOpen && (
          <motion.div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" className="absolute inset-0" style={themedSurface.overlay} aria-label="Close parent access modal" onClick={() => setParentModalOpen(false)} />
            <motion.div
              className="relative w-full max-w-md overflow-hidden rounded-[30px]"
              style={themedSurface.modalPanel}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="parent-access-title"
            >
              <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(145deg, color-mix(in srgb, var(--pastel-blue-deep) 12%, transparent), transparent 42%), radial-gradient(circle at top right, color-mix(in srgb, var(--pastel-purple-deep) 18%, transparent), transparent 42%), radial-gradient(circle at bottom left, color-mix(in srgb, var(--pastel-peach-deep) 16%, transparent), transparent 36%)' }} />
              <div className="relative px-7 pb-8 pt-6 md:px-8 md:pb-9 md:pt-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-extrabold" style={{ background: 'rgba(255,255,255,0.74)', color: 'var(--text-accent-blue)', border: '1px solid var(--border-card)' }}>{modalCopy.badge}</div>
                    <h2 id="parent-access-title" className="mt-4 text-[26px] font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{modalCopy.title}</h2>
                    <p className="mt-2 text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {modalCopy.description} {studentId.trim().toUpperCase() || 'this student'}.
                    </p>
                  </div>
                  <button type="button" onClick={() => setParentModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black" style={themedSurface.ghostButton} aria-label="Cancel parent access">X</button>
                </div>

                <form onSubmit={handleParentSubmit} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="parent-access-key" className="mb-1.5 block text-[12px] font-extrabold" style={{ color: 'var(--text-secondary)' }}>{modalCopy.label}</label>
                    <div className="relative">
                      <input ref={parentAccessKeyRef} id="parent-access-key" type={showParentAccessKey ? 'text' : 'password'} inputMode="numeric" autoComplete="one-time-code" value={parentAccessKey} onChange={event => setParentAccessKey(event.target.value)} placeholder={modalCopy.placeholder} className="w-full rounded-2xl px-4 py-3 pr-14 text-[14px] font-semibold outline-none" style={themedSurface.input} />
                      <button type="button" onClick={() => setShowParentAccessKey(prev => !prev)} className="absolute right-2 top-1/2 h-9 -translate-y-1/2 rounded-xl px-3 text-[11px] font-bold" style={themedSurface.ghostButton} aria-label={showParentAccessKey ? 'Hide parent access key' : 'Show parent access key'}>
                        {showParentAccessKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {parentError ? <div className="rounded-2xl px-3.5 py-2.5 text-[12px] font-bold" style={themedSurface.error}>{parentError}</div> : <div className="rounded-2xl px-3.5 py-2.5 text-[12px] font-semibold" style={themedSurface.helper}>{modalCopy.helper}</div>}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="submit" className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold text-white" style={themedSurface.primaryButton}>{modalCopy.submit}</button>
                    <button type="button" onClick={() => setParentModalOpen(false)} className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold" style={themedSurface.ghostButton}>Cancel</button>
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
