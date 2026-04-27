// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
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

interface ParentNotificationItem {
  id: string;
  icon: string;
  text: string;
  time?: string;
  bg?: string;
  createdAt?: string;
}

type LogoutTheme = {
  surface: string;
  glow: string;
  badgeBg: string;
  badgeColor: string;
  title: string;
  body: string;
  cancelBg: string;
  cancelText: string;
  cancelBorder: string;
  confirmGradient: string;
  confirmShadow: string;
};

const LOGOUT_THEMES: Record<string, LogoutTheme> = {
  1: { surface: 'linear-gradient(180deg, rgba(7,12,28,0.98) 0%, rgba(15,23,42,0.96) 100%)', glow: 'radial-gradient(circle at top left, rgba(96,165,250,0.18), transparent 60%), radial-gradient(circle at top right, rgba(168,85,247,0.16), transparent 55%)', badgeBg: 'rgba(96,165,250,0.12)', badgeColor: '#dbeafe', title: '#dbeafe', body: '#94a3b8', cancelBg: 'rgba(15,23,42,0.82)', cancelText: '#cbd5e1', cancelBorder: 'rgba(148,163,184,0.18)', confirmGradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', confirmShadow: '0 12px 26px rgba(59,130,246,0.24)' },
  2: { surface: 'linear-gradient(180deg, rgba(5,31,25,0.98) 0%, rgba(6,38,35,0.96) 100%)', glow: 'radial-gradient(circle at top left, rgba(16,185,129,0.18), transparent 60%), radial-gradient(circle at top right, rgba(45,212,191,0.16), transparent 55%)', badgeBg: 'rgba(16,185,129,0.12)', badgeColor: '#d1fae5', title: '#d1fae5', body: '#a7f3d0', cancelBg: 'rgba(6,38,35,0.82)', cancelText: '#ccfbf1', cancelBorder: 'rgba(153,246,228,0.18)', confirmGradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', confirmShadow: '0 12px 26px rgba(16,185,129,0.24)' },
  3: { surface: 'linear-gradient(180deg, rgba(7,12,28,0.98) 0%, rgba(15,23,42,0.96) 100%)', glow: 'radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 60%), radial-gradient(circle at top right, rgba(168,85,247,0.16), transparent 55%)', badgeBg: 'rgba(56,189,248,0.12)', badgeColor: '#bfdbfe', title: '#bfdbfe', body: '#93c5fd', cancelBg: 'rgba(15,23,42,0.82)', cancelText: '#dbeafe', cancelBorder: 'rgba(148,163,184,0.18)', confirmGradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', confirmShadow: '0 12px 26px rgba(245,158,11,0.24)' },
  4: { surface: 'linear-gradient(180deg, rgba(11,14,31,0.98) 0%, rgba(17,24,39,0.96) 100%)', glow: 'radial-gradient(circle at top left, rgba(249,115,22,0.18), transparent 60%), radial-gradient(circle at top right, rgba(236,72,153,0.16), transparent 55%)', badgeBg: 'rgba(249,115,22,0.12)', badgeColor: '#fcd34d', title: '#fde68a', body: '#fbbf24', cancelBg: 'rgba(17,24,39,0.82)', cancelText: '#f8fafc', cancelBorder: 'rgba(251,191,36,0.16)', confirmGradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', confirmShadow: '0 12px 26px rgba(249,115,22,0.24)' },
  5: { surface: 'linear-gradient(180deg, rgba(4,28,16,0.98) 0%, rgba(15,42,29,0.96) 100%)', glow: 'radial-gradient(circle at top left, rgba(34,197,94,0.18), transparent 60%), radial-gradient(circle at top right, rgba(132,204,22,0.16), transparent 55%)', badgeBg: 'rgba(34,197,94,0.12)', badgeColor: '#dcfce7', title: '#dcfce7', body: '#bbf7d0', cancelBg: 'rgba(15,42,29,0.82)', cancelText: '#ecfdf5', cancelBorder: 'rgba(134,239,172,0.18)', confirmGradient: 'linear-gradient(135deg, #22c55e 0%, #84cc16 100%)', confirmShadow: '0 12px 26px rgba(34,197,94,0.24)' },
  6: {
    surface: 'linear-gradient(180deg, rgba(2,22,44,0.99) 0%, rgba(7,44,74,0.98) 100%)',
    glow: 'radial-gradient(circle at top left, rgba(14,165,233,0.28), transparent 56%), radial-gradient(circle at top right, rgba(34,211,238,0.24), transparent 52%), radial-gradient(circle at bottom right, rgba(59,130,246,0.12), transparent 42%)',
    badgeBg: 'rgba(8,145,178,0.26)',
    badgeColor: '#dff8ff',
    title: '#38d5ff',
    body: '#b7ebff',
    cancelBg: 'rgba(8,27,50,0.9)',
    cancelText: '#8ee7ff',
    cancelBorder: 'rgba(110,231,255,0.24)',
    confirmGradient: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 52%, #22d3ee 100%)',
    confirmShadow: '0 14px 30px rgba(14,165,233,0.30)',
  },
};

function getLogoutTheme(grade?: number): LogoutTheme {
  return LOGOUT_THEMES[String(grade || 6)] || LOGOUT_THEMES[6];
}

const PARENT_NOTIFICATIONS_STORAGE_KEY = 'parent-notifications';
const LOGIN_REDIRECT_URL = `${window.location.protocol}//${window.location.hostname}:5000/student-login`;

const DEFAULT_PARENT_NOTIFICATIONS: ParentNotificationItem[] = [
  { id: 'default-1', icon: '✅', text: 'Daily streak maintained!', time: '2 min ago', bg: 'rgba(16,185,129,0.08)' },
  { id: 'default-2', icon: '📊', text: 'Weekly report ready', time: '1 hour ago', bg: 'rgba(99,102,241,0.08)' },
  { id: 'default-3', icon: '📚', text: 'Reading goal completed', time: 'Today', bg: 'rgba(34,197,94,0.08)' },
  { id: 'default-4', icon: '📖', text: 'English Chapter 4 unlocked', time: 'Yesterday', bg: 'rgba(167,139,250,0.08)' },
];

function loadParentNotifications(): ParentNotificationItem[] {
  try {
    const raw = localStorage.getItem(PARENT_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_PARENT_NOTIFICATIONS;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_PARENT_NOTIFICATIONS;
    }

    return parsed.map((item, index) => ({
      id: String(item?.id || `parent-notif-${index}`),
      icon: String(item?.icon || '🔔'),
      text: String(item?.text || 'Notification'),
      time: String(item?.time || 'Just now'),
      bg: String(item?.bg || 'rgba(99,102,241,0.08)'),
      createdAt: item?.createdAt ? String(item.createdAt) : undefined,
    }));
  } catch {
    return DEFAULT_PARENT_NOTIFICATIONS;
  }
}

const TEACHER_API_BASE = `${window.location.protocol}//${window.location.hostname}:5001`;

function buildClassTargetId(grade: number, division?: string) {
  const safeGrade = Number(grade) || 1;
  const safeDivision = String(division || 'A').trim().toUpperCase() || 'A';
  return `admin-class-${safeGrade}-${safeDivision}`;
}

async function loadRemoteParentNotifications(classId: string): Promise<ParentNotificationItem[]> {
  try {
    const response = await fetch(`${TEACHER_API_BASE}/api/communication/parent-notifications?classId=${encodeURIComponent(classId)}`);
    if (!response.ok) return [];
    const data = await response.json().catch(() => ({}));
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map((item: any, index: number) => ({
      id: String(item?.id || `remote-parent-notif-${index}`),
      icon: String(item?.icon || '🔔'),
      text: String(item?.text || 'Notification'),
      time: String(item?.time || 'Just now'),
      bg: String(item?.bg || 'rgba(99,102,241,0.08)'),
      createdAt: item?.createdAt ? String(item.createdAt) : undefined,
    }));
  } catch {
    return [];
  }
}

function mergeNotifications(remote: ParentNotificationItem[], local: ParentNotificationItem[]) {
  const seen = new Set<string>();
  return [...remote, ...local].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).slice(0, 100);
}

const ConfirmLogoutModal: React.FC<{
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  theme: LogoutTheme;
}> = ({ open, onCancel, onConfirm, theme }) => (
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
            background: 'rgba(2, 6, 23, 0.58)',
            backdropFilter: 'blur(10px)',
          }}
          aria-label="Cancel logout"
          onClick={onCancel}
        />

        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-[30px] p-6 md:p-7"
          style={{
            background: theme.surface,
            border: `1px solid ${theme.cancelBorder}`,
            boxShadow: '0 30px 70px rgba(2,6,23,0.5)',
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
            style={{ background: theme.glow }}
            aria-hidden
          />

          <div className="relative">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em]"
              style={{
                background: theme.badgeBg,
                color: theme.badgeColor,
              }}
            >
              Parent mode
            </div>
            <h2
              id="confirm-logout-title"
              className="mt-4 text-[26px] font-black leading-tight"
              style={{ color: theme.title }}
            >
              Confirm Logout
            </h2>
            <p className="mt-2 text-[14px] font-semibold" style={{ color: theme.body }}>
              Are you sure you want to logout from Parent mode?
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold"
                style={{
                  background: theme.cancelBg,
                  color: theme.cancelText,
                  border: `1px solid ${theme.cancelBorder}`,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold text-white"
                style={{
                  background: theme.confirmGradient,
                  boxShadow: theme.confirmShadow,
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
  const { user, studentProfile, logout } = useAuth();
  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Parent', [user.name]);
  const greeting = useMemo(getTimeGreeting, []);
  const logoutTheme = useMemo(() => getLogoutTheme(studentProfile?.grade || user?.grade || 6), [studentProfile?.grade, user?.grade]);
  const [showNotif, setShowNotif] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState<ParentNotificationItem[]>(() => loadParentNotifications());

  useEffect(() => {
    const classId = buildClassTargetId(studentProfile?.grade || user?.grade || 1, studentProfile?.division || 'A');
    let active = true;

    const syncNotifications = async () => {
      const localNotifications = loadParentNotifications();
      const remoteNotifications = await loadRemoteParentNotifications(classId);
      if (!active) return;
      setNotifications(remoteNotifications.length > 0 ? mergeNotifications(remoteNotifications, localNotifications) : localNotifications);
    };

    const handleStorage = () => {
      void syncNotifications();
    };

    void syncNotifications();
    const intervalId = window.setInterval(() => {
      void syncNotifications();
    }, 15000);

    window.addEventListener('storage', handleStorage);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
    };
  }, [studentProfile?.grade, studentProfile?.division, user?.grade]);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    window.location.replace(LOGIN_REDIRECT_URL);
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
                border: '1px solid rgba(148,163,184,0.18)',
              }}
          >
            <div className="dashboard-header-left gap-3.5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 52%, #7c3aed 100%)',
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
                  onClick={() => {
                    if (!showNotif) {
                      setNotifications(loadParentNotifications());
                    }
                    setShowNotif(!showNotif);
                  }}
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 30,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(191,245,255,0.96) 50%, rgba(163,230,255,0.96) 100%)',
                    boxShadow: '0 10px 24px rgba(56,189,248,0.18), 0 2px 6px rgba(14,165,233,0.10)',
                    border: '1px solid rgba(56,189,248,0.20)',
                    transition: 'all 0.25s ease',
                  }}
                  whileHover={{ scale: 1.08, boxShadow: '0 14px 28px rgba(56,189,248,0.26)' }}
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
                    background: 'linear-gradient(135deg, #22d3ee, #38bdf8)',
                    boxShadow: '0 0 8px rgba(34,211,238,0.42)',
                    border: '2px solid rgba(255,255,255,0.9)',
                  }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />

                <AnimatePresence>
                  {showNotif && (
                    <motion.div
                    className="absolute right-0 top-14 w-72 rounded-3xl overflow-hidden"
                    style={{
                        background: 'rgba(9,14,27,0.94)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(148,163,184,0.16)',
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
                        {notifications.map((notification, index) => (
                          <div
                            key={notification.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              padding: '10px 12px',
                              borderRadius: 12,
                              cursor: 'pointer',
                              background: notification.bg || 'rgba(99,102,241,0.08)',
                              marginBottom: index < notifications.length - 1 ? 4 : 0,
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <span style={{ fontSize: 14, marginTop: 1 }}>{notification.icon}</span>
                            <div>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{notification.text}</p>
                              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{notification.time || 'Just now'}</p>
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
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(168,85,247,0.18) 100%)',
                    color: 'var(--text-primary)',
                    boxShadow: '0 8px 18px rgba(37,99,235,0.18)',
                    border: '1px solid rgba(148,163,184,0.18)',
                  }}
                  whileHover={{
                    scale: 1.04,
                    boxShadow: '0 12px 24px rgba(37,99,235,0.24)',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.24) 0%, rgba(168,85,247,0.24) 100%)',
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
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 52%, #2563eb 100%)',
                    boxShadow: '0 8px 18px rgba(14,165,233,0.22)',
                    border: 'none',
                  }}
                  whileHover={{
                    scale: 1.05,
                    background: 'linear-gradient(135deg, #38bdf8 0%, #22d3ee 52%, #60a5fa 100%)',
                    boxShadow: '0 12px 24px rgba(14,165,233,0.28)',
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
        theme={logoutTheme}
      />
    </>
);
});

ParentTopBar.displayName = 'ParentTopBar';

export default ParentTopBar;
