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

const PARENT_NOTIFICATIONS_STORAGE_KEY = 'parent-notifications';

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
            background: 'rgba(2, 6, 23, 0.58)',
            backdropFilter: 'blur(10px)',
          }}
          aria-label="Cancel logout"
          onClick={onCancel}
        />

        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-[30px] p-6 md:p-7"
          style={{
            background: 'linear-gradient(180deg, rgba(6,11,28,0.98) 0%, rgba(15,23,42,0.96) 100%)',
            border: '1px solid rgba(148,163,184,0.18)',
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
            style={{
              background:
                'radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 60%), radial-gradient(circle at top right, rgba(168,85,247,0.16), transparent 55%)',
            }}
            aria-hidden
          />

          <div className="relative">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em]"
              style={{
                background: 'rgba(96,165,250,0.12)',
                color: '#bfdbfe',
              }}
            >
              Parent mode
            </div>
            <h2
              id="confirm-logout-title"
              className="mt-4 text-[26px] font-black leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Confirm Logout
            </h2>
            <p className="mt-2 text-[14px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              Are you sure you want to logout from Parent mode?
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold"
                style={{
                  background: 'rgba(15,23,42,0.82)',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(148,163,184,0.18)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 rounded-2xl py-3 text-[14px] font-extrabold text-white"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                  boxShadow: '0 12px 26px rgba(239,68,68,0.24)',
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
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    boxShadow: 'var(--shadow-soft)',
                    border: '1px solid rgba(255,255,255,0.24)',
                    transition: 'all 0.25s ease',
                  }}
                  whileHover={{ scale: 1.08, boxShadow: '0 14px 28px rgba(99,102,241,0.28)' }}
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
                    background: 'linear-gradient(135deg, #f472b6, #f59e0b)',
                    boxShadow: '0 0 8px rgba(244,114,182,0.5)',
                    border: '2px solid rgba(255,255,255,0.78)',
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
                    background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                    boxShadow: '0 8px 18px rgba(239,68,68,0.22)',
                    border: 'none',
                  }}
                  whileHover={{
                    scale: 1.05,
                    background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
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
