import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';

const STUDENT_ID_PATTERN = /^STU[A-Z0-9]+$/i;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalizedId = studentId.trim().toUpperCase();
    if (!normalizedId) {
      setError('Student ID is required');
      return;
    }
    if (!STUDENT_ID_PATTERN.test(normalizedId)) {
      setError('Student ID must start with STU (example: STU2024021)');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    const result = login(normalizedId, password);
    if (!result.ok) {
      setError(result.error ?? 'Invalid Student ID or Password');
    }
  };

  return (
    <div
      className="min-h-screen w-full p-4 md:p-8 flex items-center justify-center"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(168,85,247,0.14), transparent 40%), radial-gradient(circle at bottom right, rgba(45,212,191,0.15), transparent 45%), linear-gradient(135deg, #eef9ff 0%, #f6f2ff 45%, #fff8ef 100%)',
      }}
    >
      <motion.div
        className="w-full max-w-5xl grid md:grid-cols-2 overflow-hidden rounded-[28px]"
        style={{
          background: 'rgba(255,255,255,0.86)',
          border: '1px solid rgba(255,255,255,0.72)',
          boxShadow: '0 24px 70px rgba(99,102,241,0.16)',
          backdropFilter: 'blur(8px)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div
          className="hidden md:flex flex-col justify-between p-8 lg:p-10"
          style={{
            background:
              'linear-gradient(160deg, rgba(129,140,248,0.2) 0%, rgba(244,114,182,0.18) 55%, rgba(16,185,129,0.14) 100%)',
          }}
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 text-[12px] font-extrabold text-indigo-500">
              <span>✨</span>
              My Learning Space
            </div>
            <h1 className="mt-4 text-[30px] leading-tight font-black text-indigo-600">
              Welcome back,
              <br />
              little explorer
            </h1>
            <p className="mt-3 text-[14px] font-semibold text-indigo-400">
              Log in with your Student ID and continue your learning adventure.
            </p>
          </div>

          <div
            className="rounded-3xl p-6"
            style={{
              background: 'rgba(255,255,255,0.65)',
              border: '1px solid rgba(255,255,255,0.8)',
            }}
          >
            <div className="text-5xl leading-none">🚀</div>
            <p className="mt-3 text-[13px] font-bold text-indigo-500">Ready to play and learn?</p>
            <p className="mt-1 text-[12px] text-indigo-400">
              Daily quests, stars, and fun chapters are waiting for you.
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 lg:p-10">
          <div className="md:hidden mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-[12px] font-extrabold text-indigo-500">
              <span>✨</span>
              My Learning Space
            </div>
            <h1 className="mt-3 text-[26px] leading-tight font-black text-indigo-600">Student Login</h1>
          </div>

          <div className="hidden md:block mb-6">
            <h2 className="text-[28px] font-black text-indigo-600 leading-tight">Student Login</h2>
            <p className="mt-1 text-[13px] text-indigo-400 font-semibold">
              Enter your Student ID and password to open your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="student-id" className="block text-[12px] font-extrabold text-indigo-500 mb-1.5">
                Student ID
              </label>
              <input
                id="student-id"
                autoComplete="username"
                value={studentId}
                onChange={event => setStudentId(event.target.value)}
                placeholder="STU2024021"
                className="w-full rounded-2xl px-4 py-3 text-[14px] font-semibold outline-none"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
                  border: '1px solid rgba(129,140,248,0.28)',
                  color: '#353f86',
                }}
              />
            </div>

            <div>
              <label htmlFor="student-password" className="block text-[12px] font-extrabold text-indigo-500 mb-1.5">
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
                  className="w-full rounded-2xl px-4 py-3 pr-12 text-[14px] font-semibold outline-none"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
                    border: '1px solid rgba(129,140,248,0.28)',
                    color: '#353f86',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-2 rounded-xl text-[12px] font-bold"
                  style={{
                    color: '#6366f1',
                    background: 'rgba(99,102,241,0.08)',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
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
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-[14px] font-extrabold text-white"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                boxShadow: '0 10px 24px rgba(99,102,241,0.35)',
              }}
            >
              Login
            </button>
          </form>

          <p className="mt-3 text-center text-[12px] font-semibold text-indigo-400 cursor-default">
            Forgot Password?
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

