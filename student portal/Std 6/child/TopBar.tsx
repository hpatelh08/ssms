/**
 * child/TopBar.tsx
 * Premium Top Bar - Student Dashboard
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { DashboardSwitch } from '../components/DashboardSwitch';

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export const TopBar: React.FC = React.memo(() => {
  const { user } = useAuth();
  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Explorer', [user.name]);
  const greeting = useMemo(getTimeGreeting, []);
  const [showNotif, setShowNotif] = useState(false);
  const notifications = useMemo(
    () => [
      { icon: '⭐', text: 'New star earned!', time: 'Just now', bg: 'rgba(255,243,201,0.4)' },
      { icon: '🏆', text: 'Game completed!', time: '5 min ago', bg: 'rgba(227,215,255,0.4)' },
    ],
    [],
  );

  return (
    <motion.header
      className="sticky top-0 z-40 w-full shrink-0"
      style={{
        padding: '8px 16px',
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <div
        className="h-[72px] flex items-center justify-between px-6 mx-auto"
        style={{
          background: 'var(--gradient-topbar)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-soft)',
          border: '1px solid rgba(232,248,252,0.92)',
          maxWidth: 1600,
        }}
      >
        <div className="flex items-center gap-3.5 min-w-0 shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--pastel-blue-deep) 0%, var(--pastel-pink-deep) 100%)',
              boxShadow: 'var(--shadow-glow-blue)',
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

        <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
          <DashboardSwitch />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <motion.button
              onClick={() => setShowNotif(!showNotif)}
              className="flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: 30,
                background: 'rgba(255,255,255,0.78)',
                boxShadow: 'var(--shadow-soft)',
                border: '1px solid rgba(226,246,250,0.92)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              whileHover={{ scale: 1.08, boxShadow: 'var(--shadow-glow-blue)' }}
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
                background: 'linear-gradient(135deg, var(--pastel-peach-deep), #ff8c6b)',
                boxShadow: '0 0 8px rgba(255,156,107,0.5)',
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
                    background: 'rgba(250,255,255,0.98)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(226,246,250,0.92)',
                    boxShadow: 'var(--shadow-card-hover)',
                  }}
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Notifications
                    </p>
                  </div>
                  <div style={{ padding: 10 }}>
                    {notifications.map((notification, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 12,
                          cursor: 'pointer',
                          background: notification.bg,
                          marginBottom: index < notifications.length - 1 ? 4 : 0,
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: 14, marginTop: 1 }}>{notification.icon}</span>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {notification.text}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 10,
                              color: 'var(--text-muted)',
                              fontWeight: 500,
                              marginTop: 2,
                            }}
                          >
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
});

TopBar.displayName = 'TopBar';
