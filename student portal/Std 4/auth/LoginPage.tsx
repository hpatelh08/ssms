import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';

type LoginMode = 'student' | 'parent';

const THEME = {
  shell: {
    background: [
      'radial-gradient(circle at 14% 18%, rgba(255, 214, 102, 0.32), transparent 24%)',
      'radial-gradient(circle at 84% 16%, rgba(201, 141, 45, 0.20), transparent 24%)',
      'radial-gradient(circle at 78% 84%, rgba(122, 74, 13, 0.16), transparent 26%)',
      'linear-gradient(135deg, #fff7ec 0%, #fff1d2 46%, #f9e1b3 100%)',
    ].join(', '),
  } as React.CSSProperties,
  panel: {
    background: 'rgba(255, 252, 246, 0.92)',
    border: '1px solid rgba(255,255,255,0.8)',
    boxShadow: '0 28px 80px rgba(120, 83, 22, 0.16)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  } as React.CSSProperties,
  leftPanel: {
    background: [
      'linear-gradient(135deg, rgba(125, 83, 18, 0.92) 0%, rgba(170, 114, 26, 0.94) 45%, rgba(232, 176, 66, 0.90) 100%)',
      'radial-gradient(circle at top right, rgba(255,255,255,0.20), transparent 28%)',
      'radial-gradient(circle at bottom left, rgba(255,255,255,0.12), transparent 26%)',
    ].join(', '),
  } as React.CSSProperties,
  goldGlow: {
    background: 'radial-gradient(circle, rgba(255,215,102,0.85) 0%, rgba(255,215,102,0.08) 55%, transparent 75%)',
  } as React.CSSProperties,
};

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<LoginMode>('student');
  const [username, setUsername] = useState('STU2024401');
  const [password, setPassword] = useState('student123');
  const [displayName, setDisplayName] = useState('Std 4 Learner');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const copy = useMemo(() => {
    if (mode === 'parent') {
      return {
        badge: 'STD 4 GOLD MINING THEME',
        title: 'Welcome back, guardian',
        subtitle: 'Step into the parent view for Std 4 with the same gold mining style.',
        formTitle: 'Parent Login',
        formCopy: 'Enter your parent ID and password to open the Std 4 parent dashboard.',
        action: 'Continue as Parent',
        userLabel: 'Parent ID',
        userPlaceholder: 'PARENT4401',
        passPlaceholder: 'Enter parent password',
      };
    }

    return {
      badge: 'STD 4 GOLD MINING THEME',
      title: 'Welcome back, bright miner',
      subtitle: 'Enter the gold tunnel of learning, treasure your progress, and continue your Std 4 journey.',
      formTitle: 'Student Login',
      formCopy: 'Enter your Student ID and password to open the Std 4 portal.',
      action: 'Continue Std 4',
      userLabel: 'Student ID',
      userPlaceholder: 'STU2024401',
      passPlaceholder: 'Enter your password',
    };
  }, [mode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({
      role: mode,
      username,
      password,
      name: displayName,
      grade: 4,
    });

    setLoading(false);
    if (!result.ok) setError(result.error || 'Unable to login');
  };

  return (
    <div className="min-h-screen w-full px-4 py-5 md:px-8 md:py-8" style={THEME.shell}>
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1120px] items-center">
        <motion.div
          className="grid w-full overflow-hidden rounded-[32px] md:grid-cols-2"
          style={THEME.panel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div
            className="relative hidden flex-col justify-between overflow-hidden p-8 md:flex lg:p-10"
            style={THEME.leftPanel}
          >
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full blur-3xl" style={THEME.goldGlow} />
            <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-10 h-56 w-56 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(255, 238, 170, 0.32) 0%, transparent 68%)' }} />

            <div>
              <div className="inline-flex items-center rounded-full border border-white/70 bg-white/90 px-4 py-2 text-[12px] font-extrabold tracking-[0.18em] text-amber-700">
                {copy.badge}
              </div>

              <h1 className="mt-6 max-w-xl text-[58px] font-black leading-[0.95] tracking-[-0.04em] text-[#0f172a]">
                {copy.title}
              </h1>

              <p className="mt-5 max-w-lg text-[16px] font-semibold leading-7 text-[#334155]">
                {copy.subtitle}
              </p>
            </div>

            <div className="max-w-lg rounded-[28px] border border-white/70 bg-white/50 p-6 shadow-[0_18px_40px_rgba(120,83,22,0.08)] backdrop-blur-sm">
              <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-amber-700">
                Gold Mining Theme
              </div>
              <p className="mt-3 text-[14px] font-semibold leading-7 text-[#475569]">
                This login keeps the same access flow, but the page now feels like a treasure tunnel with warm gold, sand, and ore tones.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 lg:p-10">
            <div className="mb-6">
              <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-extrabold tracking-[0.16em] text-amber-700">
                {copy.badge}
              </div>
              <h2 className="mt-4 text-[30px] font-black leading-tight text-slate-900">
                {copy.formTitle}
              </h2>
              <p className="mt-2 text-[14px] font-semibold leading-6 text-slate-500">
                {copy.formCopy}
              </p>
            </div>

            <div className="mb-5 flex gap-2 rounded-3xl bg-amber-50 p-1">
              <button
                type="button"
                onClick={() => setMode('student')}
                className="flex-1 rounded-2xl px-4 py-3 text-left transition-all"
                style={{
                  background: mode === 'student' ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' : 'transparent',
                  color: mode === 'student' ? '#fff' : '#7c2d12',
                  boxShadow: mode === 'student' ? '0 12px 24px rgba(217,119,6,0.24)' : 'none',
                }}
              >
                <div className="text-[13px] font-extrabold">Student</div>
                <div className="mt-1 text-[11px] font-semibold opacity-80">Std 4 learner access</div>
              </button>

              <button
                type="button"
                onClick={() => setMode('parent')}
                className="flex-1 rounded-2xl px-4 py-3 text-left transition-all"
                style={{
                  background: mode === 'parent' ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)' : 'transparent',
                  color: mode === 'parent' ? '#fff' : '#7c2d12',
                  boxShadow: mode === 'parent' ? '0 12px 24px rgba(180,83,9,0.22)' : 'none',
                }}
              >
                <div className="text-[13px] font-extrabold">Parent</div>
                <div className="mt-1 text-[11px] font-semibold opacity-80">Std 4 guardian access</div>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-name" className="mb-1.5 block text-[12px] font-extrabold uppercase tracking-[0.14em] text-slate-700">
                  Display Name
                </label>
                <input
                  id="login-name"
                  value={displayName}
                  onChange={event => setDisplayName(event.target.value)}
                  placeholder="Std 4 Learner"
                  className="w-full rounded-[22px] border border-amber-200 bg-white px-4 py-3.5 text-[14px] font-semibold text-slate-800 outline-none transition-shadow focus:ring-2 focus:ring-amber-200"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.7)' }}
                />
              </div>

              <div>
                <label htmlFor="login-username" className="mb-1.5 block text-[12px] font-extrabold uppercase tracking-[0.14em] text-slate-700">
                  {copy.userLabel}
                </label>
                <input
                  id="login-username"
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  placeholder={copy.userPlaceholder}
                  className="w-full rounded-[22px] border border-amber-200 bg-white px-4 py-3.5 text-[14px] font-semibold text-slate-800 outline-none transition-shadow focus:ring-2 focus:ring-amber-200"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.7)' }}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-[12px] font-extrabold uppercase tracking-[0.14em] text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder={copy.passPlaceholder}
                    className="w-full rounded-[22px] border border-amber-200 bg-white px-4 py-3.5 pr-16 text-[14px] font-semibold text-slate-800 outline-none transition-shadow focus:ring-2 focus:ring-amber-200"
                    style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.7)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-[12px] font-extrabold text-amber-700"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-bold text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-[22px] px-5 py-4 text-[15px] font-extrabold text-white transition-transform disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 55%, #b45309 100%)',
                  boxShadow: '0 18px 32px rgba(180,83,9,0.24)',
                }}
              >
                {loading ? 'Opening...' : copy.action}
              </button>

              <div className="pt-1 text-[13px] font-semibold leading-6 text-slate-500">
                {mode === 'student'
                  ? 'Use the Std 4 student ID and password assigned by the school.'
                  : 'Use the Std 4 parent credentials to open the guardian view.'}
              </div>

              <button
                type="button"
                onClick={() => setMode(prev => (prev === 'student' ? 'parent' : 'student'))}
                className="text-left text-[13px] font-extrabold text-amber-700 underline decoration-amber-300 underline-offset-4"
              >
                Switch to {mode === 'student' ? 'parent' : 'student'} login
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
