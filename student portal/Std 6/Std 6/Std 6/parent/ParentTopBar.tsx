/**
 * parent/ParentTopBar.tsx
 * ─────────────────────────────────────────────────────
 * Premium Glass Top Bar — Parent Analytics Dashboard
 *
 * Layout:
 *  LEFT  — Avatar + Greeting + "Parent Mode" badge
 *  CENTER — Student|Parent toggle (DashboardSwitch)
 *  RIGHT — Notification bell + Settings gear
 *
 * Color Rules:
 *  Greeting text → #7A86C2 (soft slate-blue)
 *  Name → gradient indigo→purple text
 *  NO black text anywhere.
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

/* ── SVG Icons (no emoji, professional) ─────────── */

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

interface ParentTopBarProps {
  onNavigate?: (screen: string) => void;
}

export const ParentTopBar: React.FC<ParentTopBarProps> = React.memo(({ onNavigate }) => {
  const { user } = useAuth();
  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Parent', [user.name]);
  const greeting = useMemo(getTimeGreeting, []);
  const [showNotif, setShowNotif] = useState(false);

  return (
    <motion.header
      className="sticky top-0 z-40 w-full shrink-0"
      style={{ padding: '8px 16px' }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <div
        className="h-[72px] flex items-center justify-between px-6 mx-auto relative"
        style={{
          background: 'var(--gradient-topbar)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-soft)',
          border: '1px solid rgba(255,255,255,0.6)',
          maxWidth: 1600,
        }}
      >
        <div className="flex items-center gap-3.5 min-w-0 shrink-0">
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
            <h2 style={{
              margin: 0, fontSize: 20, fontWeight: 800,
              lineHeight: 1.2, letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              fontFamily: 'Nunito, Quicksand, sans-serif',
            }}>
              {firstName}
            </h2>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.3, marginTop: 2 }}>
              {greeting} 👋
            </p>
          </div>
        </div>

        {/* ═══ CENTER: Dashboard Switch ═══ */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
          <DashboardSwitch />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <motion.button
              onClick={() => setShowNotif(!showNotif)}
              className="flex items-center justify-center"
              style={{
                width: 44, height: 44, borderRadius: 30,
                background: 'rgba(255,255,255,0.7)',
                boxShadow: 'var(--shadow-soft)',
                border: '1px solid rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.08, boxShadow: 'var(--shadow-glow-purple)' }}
              whileTap={{ scale: 0.92 }}
              aria-label="Notifications"
            >
              <span style={{ fontSize: 18 }}>🔔</span>
            </motion.button>

            {/* Unread dot */}
            <motion.div
              style={{
                position: 'absolute', top: 0, right: 0,
                width: 10, height: 10, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--pastel-pink-deep), #ef6b6b)',
                boxShadow: '0 0 8px rgba(255,140,180,0.5)',
                border: '2px solid white',
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Dropdown */}
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
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[
                      { icon: '✅', text: 'Daily streak maintained!', time: '2 min ago', bg: 'rgba(16,185,129,0.08)' },
                      { icon: '📊', text: 'Weekly report ready', time: '1 hour ago', bg: 'rgba(99,102,241,0.08)' },
                      { icon: '📖', text: 'English Chapter 4 unlocked', time: 'Yesterday', bg: 'rgba(167,139,250,0.08)' },
                    ].map((n, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                        background: n.bg, transition: 'background 0.15s ease',
                      }}>
                        <span style={{ fontSize: 14, marginTop: 1 }}>{n.icon}</span>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: '16px' }}>{n.text}</p>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            className="flex items-center justify-center"
            style={{
              width: 44, height: 44, borderRadius: 30,
              background: 'rgba(255,255,255,0.7)',
              boxShadow: 'var(--shadow-soft)',
              border: '1px solid rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.08, rotate: 45, boxShadow: 'var(--shadow-glow-purple)' }}
            whileTap={{ scale: 0.92 }}
            aria-label="Settings"
            onClick={() => onNavigate?.('settings')}
          >
            <GearIcon />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
});

ParentTopBar.displayName = 'ParentTopBar';
