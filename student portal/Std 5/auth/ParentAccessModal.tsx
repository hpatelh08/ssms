import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './AuthContext';

const themedSurface = {
  overlay: {
    background: 'rgba(255, 255, 255, 0.32)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  } as React.CSSProperties,
  modalPanel: {
    background: 'linear-gradient(145deg, color-mix(in srgb, var(--pastel-blue-soft) 72%, white) 0%, color-mix(in srgb, var(--pastel-purple-soft) 70%, white) 46%, color-mix(in srgb, var(--pastel-yellow-soft) 76%, white) 100%)',
    border: '1px solid var(--border-soft)',
    boxShadow: 'var(--shadow-depth)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  } as React.CSSProperties,
  modalGlow: {
    background: 'linear-gradient(145deg, color-mix(in srgb, var(--pastel-blue-deep) 12%, transparent), transparent 42%), radial-gradient(circle at top right, color-mix(in srgb, var(--pastel-purple-deep) 18%, transparent), transparent 42%), radial-gradient(circle at bottom left, color-mix(in srgb, var(--pastel-peach-deep) 16%, transparent), transparent 36%)',
  } as React.CSSProperties,
  badge: {
    background: 'rgba(255,255,255,0.74)',
    color: 'var(--text-accent-blue)',
    border: '1px solid var(--border-card)',
  } as React.CSSProperties,
  title: {
    color: 'var(--text-primary)',
  } as React.CSSProperties,
  body: {
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  input: {
    background: 'rgba(255,255,255,0.84)',
    border: '1px solid var(--border-soft)',
    color: 'var(--text-primary)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
  } as React.CSSProperties,
  helper: {
    background: 'rgba(255,255,255,0.64)',
    border: '1px solid var(--border-soft)',
    color: 'var(--text-secondary)',
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
};

const ParentAccessModal: React.FC = () => {
  const { isParentAccessPromptOpen, cancelParentAccess, verifyParentAccessKey, studentProfile } = useAuth();
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isParentAccessPromptOpen) {
      setAccessKey('');
      setError('');
      return;
    }

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 120);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelParentAccess();
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
    if (!accessKey.trim()) return setError('Parent Access Key is required');
    const result = verifyParentAccessKey(accessKey);
    if (!result.ok) setError(result.error ?? 'Invalid Parent Access Key');
  };

  return (
    <AnimatePresence>
      {isParentAccessPromptOpen && (
        <motion.div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" className="absolute inset-0" style={themedSurface.overlay} aria-label="Close parent access modal" onClick={cancelParentAccess} />

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
            <div className="absolute inset-0" style={themedSurface.modalGlow} aria-hidden />

            <div className="relative px-7 pt-6 pb-8 md:px-8 md:pt-7 md:pb-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold" style={themedSurface.badge}>Secure switch</div>
                  <h2 id="parent-access-title" className="mt-4 text-[26px] font-black leading-tight" style={themedSurface.title}>Enter Parent Access Key</h2>
                  <p className="mt-2 text-[13px] font-semibold" style={themedSurface.body}>
                    Confirm access to open the parent dashboard for {studentProfile?.studentName ?? 'this student'}.
                  </p>
                </div>

                <button type="button" onClick={cancelParentAccess} className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black" style={themedSurface.ghostButton} aria-label="Cancel parent access">
                  X
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="parent-access-key" className="mb-1.5 block text-[12px] font-extrabold" style={themedSurface.body}>Parent Access Key</label>
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
                    style={themedSurface.input}
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl px-3.5 py-2.5 text-[12px] font-bold" style={themedSurface.error}>{error}</div>
                ) : (
                  <div className="rounded-2xl px-3.5 py-2.5 text-[12px] font-semibold" style={themedSurface.helper}>
                    This key is only needed when switching from Student to Parent view.
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="submit" className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold text-white" style={themedSurface.primaryButton}>Unlock Parent View</button>
                  <button type="button" onClick={cancelParentAccess} className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold" style={themedSurface.ghostButton}>Cancel</button>
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
