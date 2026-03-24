import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { DashboardSwitch } from '../components/DashboardSwitch';
import { springIn } from '../styles/theme';

interface ParentTopBarProps {
  onOpenSettings?: () => void;
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const ConfirmLogoutModal: React.FC<{
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ open, onCancel, onConfirm }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[125] flex items-center justify-center px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0"
          style={{
            background: 'rgba(15, 23, 42, 0.24)',
            backdropFilter: 'blur(10px)',
          }}
          aria-label="Cancel logout"
          onClick={onCancel}
        />

        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-[30px] p-6 md:p-7"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,248,248,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 30px 70px rgba(239,68,68,0.18)',
          }}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-logout-title"
        >
          <div
            className="absolute inset-x-0 top-0 h-24"
            style={{
              background:
                'radial-gradient(circle at top left, rgba(248,113,113,0.25), transparent 60%), radial-gradient(circle at top right, rgba(251,146,60,0.18), transparent 55%)',
            }}
            aria-hidden
          />

          <div className="relative">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em]"
              style={{
                background: 'rgba(248,113,113,0.1)',
                color: '#dc2626',
              }}
            >
              Parent mode
            </div>
            <h2 id="confirm-logout-title" className="mt-4 text-[26px] font-black leading-tight text-rose-600">
              Confirm Logout
            </h2>
            <p className="mt-2 text-[14px] font-semibold text-slate-500">
              Are you sure you want to logout from Parent mode?
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold"
                style={{
                  background: 'rgba(148,163,184,0.12)',
                  color: '#475569',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold text-white"
                style={{
                  background: 'linear-gradient(135deg, #fb7185 0%, #ef4444 100%)',
                  boxShadow: '0 12px 26px rgba(239,68,68,0.28)',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const ParentTopBar: React.FC<ParentTopBarProps> = React.memo(({ onOpenSettings }) => {
  const { user, logout } = useAuth();
  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Parent', [user.name]);
  const greeting = useMemo(getTimeGreeting, []);
  const [showNotif, setShowNotif] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <>
      <motion.header
        className="dashboard-header sticky top-0 z-40 w-full shrink-0"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={springIn}
      >
        <div className="dashboard-header-shell">
          <div
            className="dashboard-header-card"
            style={{
              background: 'var(--gradient-topbar)',
              borderRadius: 28,
              boxShadow: 'var(--shadow-soft)',
              border: '1px solid rgba(255,255,255,0.5)',
            }}
          >
            <div className="dashboard-header-left gap-3.5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--pastel-purple-deep) 0%, var(--pastel-pink-deep) 100%)',
                  boxShadow: 'var(--shadow-glow-purple)',
                }}
              >
                {firstName[0]}
              </div>

              <div className="min-w-0">
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    fontFamily: 'Nunito, Quicksand, sans-serif',
                  }}
                >
                  {firstName}
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    lineHeight: 1.3,
                    marginTop: 2,
                  }}
                >
                  {greeting} 👋
                </p>
              </div>
            </div>

            <div className="dashboard-header-center">
              <DashboardSwitch />
            </div>

            <div className="dashboard-header-right gap-3">
              <div className="relative">
                <motion.button
                  onClick={() => setShowNotif(!showNotif)}
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 30,
                    background: 'rgba(255,255,255,0.7)',
                    boxShadow: 'var(--shadow-soft)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    transition: 'all 0.25s ease',
                  }}
                  whileHover={{ scale: 1.08, boxShadow: 'var(--shadow-glow-purple)' }}
                  whileTap={{ scale: 0.92 }}
                  aria-label="Notifications"
                >
                  <span style={{ fontSize: 18 }}>🔔</span>
                </motion.button>

                <motion.div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--pastel-pink-deep), #ef6b6b)',
                    boxShadow: '0 0 8px rgba(255,140,180,0.5)',
                    border: '2px solid white',
                  }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />

                <AnimatePresence>
                  {showNotif && (
                    <motion.div
                      className="absolute right-0 top-14 w-72 rounded-3xl overflow-hidden"
                      style={{
                        background: 'rgba(255,255,255,0.97)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.6)',
                        boxShadow: 'var(--shadow-card-hover)',
                      }}
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)' }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Notifications</p>
                      </div>
                      <div style={{ padding: 10 }}>
                        {[
                          { icon: '✅', text: 'Daily streak maintained!', time: '2 min ago', bg: 'rgba(16,185,129,0.08)' },
                          { icon: '📊', text: 'Weekly report ready', time: '1 hour ago', bg: 'rgba(99,102,241,0.08)' },
                          { icon: '🎯', text: 'Weekly learning goal reached', time: 'Today', bg: 'rgba(34,197,94,0.08)' },
                          { icon: '📖', text: 'English Chapter 4 unlocked', time: 'Yesterday', bg: 'rgba(167,139,250,0.08)' },
                        ].map((n, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              padding: '10px 12px',
                              borderRadius: 12,
                              cursor: 'pointer',
                              background: n.bg,
                              marginBottom: i < 3 ? 4 : 0,
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <span style={{ fontSize: 14, marginTop: 1 }}>{n.icon}</span>
                            <div>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{n.text}</p>
                              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {user.role === 'parent' && onOpenSettings && (
                <motion.button
                  type="button"
                  onClick={onOpenSettings}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-[14px] font-extrabold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(236,72,153,0.12) 100%)',
                    color: 'var(--text-primary)',
                    boxShadow: '0 8px 18px rgba(99,102,241,0.12)',
                    border: '1px solid rgba(255,255,255,0.7)',
                  }}
                  whileHover={{
                    scale: 1.04,
                    boxShadow: '0 12px 24px rgba(99,102,241,0.18)',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(236,72,153,0.18) 100%)',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  Settings
                </motion.button>
              )}

              {user.role === 'parent' && (
                <motion.button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-[14px] font-extrabold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #fb7185 0%, #ff6b6b 100%)',
                    boxShadow: '0 8px 18px rgba(251,113,133,0.24)',
                    border: 'none',
                  }}
                  whileHover={{
                    scale: 1.05,
                    background: 'linear-gradient(135deg, #ef4444 0%, #e63946 100%)',
                    boxShadow: '0 12px 24px rgba(239,68,68,0.28)',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  Logout
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <ConfirmLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </>
  );
});

ParentTopBar.displayName = 'ParentTopBar';

export default ParentTopBar;
