import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { DashboardSwitch } from '../components/DashboardSwitch';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export const TopBar: React.FC = React.memo(() => {
  const { user, logout } = useAuth();
  const [showNotif, setShowNotif] = useState(false);

  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Explorer', [user.name]);
  const greeting = useMemo(getTimeGreeting, []);

  const notifications = [
    { icon: '⭐', text: 'New star earned!', time: 'Just now', bg: 'rgba(255,243,201,0.55)' },
    { icon: '🏆', text: 'Game completed!', time: '5 min ago', bg: 'rgba(227,215,255,0.55)' },
    { icon: '🌱', text: 'Garden is growing!', time: 'Today', bg: 'rgba(215,244,227,0.55)' }
  ];

  return (
    <motion.header
      className="topbar-shell"
      initial={{ y: -90 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 190, damping: 24 }}
    >
      <div className="topbar-card">
        <div className="topbar-left">
          <div className="topbar-avatar">
            {firstName[0]}
          </div>

          <div className="topbar-usercopy">
            <h2>{firstName}</h2>
            <p>{greeting} <span aria-hidden="true">👋</span></p>
          </div>
        </div>

        <div className="topbar-center">
          <DashboardSwitch />
        </div>

        <div className="topbar-right">
          <motion.button
            type="button"
            onClick={logout}
            className="topbar-logout-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Logout"
          >
            Log out
          </motion.button>

          <div className="topbar-notification-wrap">
            <motion.button
              type="button"
              onClick={() => setShowNotif((prev) => !prev)}
              className="topbar-notification-btn"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              aria-label="Notifications"
            >
              <span aria-hidden="true">🔔</span>
            </motion.button>

            <motion.span
              className="topbar-notification-dot"
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />

            <AnimatePresence>
              {showNotif && (
                <motion.div
                  className="topbar-notification-panel"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                >
                  <div className="topbar-notification-header">
                    <p>Notifications</p>
                  </div>

                  <div className="topbar-notification-list">
                    {notifications.map((item, index) => (
                      <div
                        key={`${item.text}-${index}`}
                        className="topbar-notification-item"
                        style={{ background: item.bg }}
                      >
                        <span className="topbar-notification-icon">{item.icon}</span>
                        <div>
                          <p className="topbar-notification-text">{item.text}</p>
                          <p className="topbar-notification-time">{item.time}</p>
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
