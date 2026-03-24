/**
 * parent/ParentTopBar.tsx
 * -----------------------------------------------------
 * Premium Glass Top Bar - Parent Analytics Dashboard
 *
 * Layout:
 *  LEFT   - Avatar + Greeting + "Parent Mode" badge
 *  CENTER - Student|Parent toggle (DashboardSwitch)
 *  RIGHT  - Notification bell + Settings gear
 *
 * Color Rules:
 *  Greeting text -> #7A86C2 (soft slate-blue)
 *  Name -> gradient indigo->purple text
 *  NO black text anywhere.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { DashboardSwitch } from '../components/DashboardSwitch';

interface ParentTopBarProps {
  onOpenSettings?: () => void;
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const BellIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C6AC4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const GearIcon: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7A86C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const ParentTopBar: React.FC<ParentTopBarProps> = React.memo(({ onOpenSettings }) => {
  const { user } = useAuth();
  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Parent', [user.name]);
  const greeting = useMemo(getTimeGreeting, []);
  const [showNotif, setShowNotif] = useState(false);

  return (
    <motion.header
      className="sticky top-0 z-40 w-full shrink-0"
      style={{ padding: '8px 16px' }}
      initial={false}
    >
      <div
        className="h-[72px] flex items-center justify-between px-6 mx-auto relative"
        style={{
          background: 'linear-gradient(135deg, #ecf7ff 0%, #f5f0ff 50%, #ffecf4 100%)',
          backdropFilter: 'blur(36px)',
          WebkitBackdropFilter: 'blur(36px)',
          borderRadius: 24,
          boxShadow: '0 4px 24px rgba(92,106,196,0.10), 0 1px 0 rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.6)',
          maxWidth: 1600,
        }}
      >
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <motion.div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
            style={{
              background: 'linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #C084FC 100%)',
              boxShadow: '0 3px 14px rgba(129,140,248,0.35), 0 0 0 2.5px rgba(255,255,255,0.7)',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
          >
            {firstName[0]}
          </motion.div>

          <div className="min-w-0">
            <p style={{ fontSize: 12, fontWeight: 600, color: '#7A86C2', lineHeight: '16px', margin: 0 }}>
              {greeting} 👋
            </p>
            <h2 style={{
              fontSize: 16, fontWeight: 800, lineHeight: '20px', margin: 0,
              background: 'linear-gradient(135deg, #3A3F9F, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {firstName}
            </h2>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <DashboardSwitch />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <motion.button
              onClick={() => setShowNotif(!showNotif)}
              className="w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 2px 10px rgba(92,106,196,0.06)',
              }}
              whileHover={{ scale: 1.1, boxShadow: '0 3px 16px rgba(92,106,196,0.12)' }}
              whileTap={{ scale: 0.9 }}
              aria-label="Notifications"
              type="button"
            >
              <BellIcon />
            </motion.button>

            <motion.div
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
              style={{
                background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
                boxShadow: '0 0 8px rgba(167,139,250,0.5)',
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <AnimatePresence>
              {showNotif && (
                <motion.div
                  className="absolute right-0 top-12 w-72 rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(129,140,248,0.12)',
                    boxShadow: '0 8px 40px rgba(92,106,196,0.12), 0 2px 8px rgba(92,106,196,0.04)',
                  }}
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(129,140,248,0.08)' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#3A3F9F', margin: 0 }}>Notifications</p>
                  </div>
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[
                      { icon: '✅', text: 'Daily streak maintained!', time: '2 min ago', bg: 'rgba(16,185,129,0.08)', accent: '#10B981' },
                      { icon: '📊', text: 'Weekly report ready', time: '1 hour ago', bg: 'rgba(99,102,241,0.08)', accent: '#6366F1' },
                      { icon: '🌱', text: 'Garden tree leveled up', time: 'Today', bg: 'rgba(34,197,94,0.08)', accent: '#22C55E' },
                      { icon: '📖', text: 'English Chapter 4 unlocked', time: 'Yesterday', bg: 'rgba(167,139,250,0.08)', accent: '#A78BFA' },
                    ].map((n, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 12px', borderRadius: 14, cursor: 'pointer',
                        background: n.bg, transition: 'transform 0.15s',
                      }}>
                        <span style={{ fontSize: 14, marginTop: 1 }}>{n.icon}</span>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#3A3F9F', margin: 0, lineHeight: '16px' }}>{n.text}</p>
                          <p style={{ fontSize: 10, fontWeight: 500, color: '#7A86C2', margin: 0, marginTop: 2 }}>{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 2px 10px rgba(92,106,196,0.06)',
            }}
            whileHover={{ scale: 1.1, rotate: 45 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Settings"
            type="button"
          >
            <GearIcon />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
});

ParentTopBar.displayName = 'ParentTopBar';
