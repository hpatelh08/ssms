/**
 * parent/ParentNav.tsx
 * Water-themed parent sidebar + mobile bottom nav.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export type ParentScreen =
  | 'overview'
  | 'progress'
  | 'attendance'
  | 'ai-buddy'
  | 'books'
  | 'garden'
  | 'fillblanks'
  | 'messages'
  | 'settings';

interface NavItem {
  key: ParentScreen;
  label: string;
  sublabel: string;
  icon: string;
  gradient: string;
  glowColor: string;
  accentColor: string;
  iconBg: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', sublabel: 'Dashboard', icon: 'ðŸ“Š', gradient: 'from-sky-400 to-cyan-500', glowColor: 'rgba(67, 171, 212, 0.22)', accentColor: '#1f91bd', iconBg: 'rgba(67, 171, 212, 0.12)' },
  { key: 'progress', label: 'Progress', sublabel: 'Academics', icon: 'ðŸ“ˆ', gradient: 'from-cyan-400 to-teal-500', glowColor: 'rgba(52, 194, 196, 0.2)', accentColor: '#159ca7', iconBg: 'rgba(52, 194, 196, 0.12)' },
  { key: 'attendance', label: 'Attendance', sublabel: 'Tracking', icon: 'ðŸ“…', gradient: 'from-teal-400 to-sky-500', glowColor: 'rgba(61, 191, 176, 0.2)', accentColor: '#1b9f97', iconBg: 'rgba(61, 191, 176, 0.12)' },
  { key: 'ai-buddy', label: 'AI Insights', sublabel: 'Smart Help', icon: 'ðŸ§ ', gradient: 'from-cyan-400 to-emerald-400', glowColor: 'rgba(52, 197, 170, 0.2)', accentColor: '#20a8a4', iconBg: 'rgba(52, 197, 170, 0.12)' },
  { key: 'books', label: 'Books', sublabel: 'Library', icon: 'ðŸ“š', gradient: 'from-blue-400 to-cyan-500', glowColor: 'rgba(79, 166, 222, 0.2)', accentColor: '#328fcb', iconBg: 'rgba(79, 166, 222, 0.12)' },
  { key: 'garden', label: 'Brain Puzzle', sublabel: 'Puzzles', icon: 'ðŸ§©', gradient: 'from-teal-400 to-cyan-500', glowColor: 'rgba(54, 190, 184, 0.2)', accentColor: '#179d9b', iconBg: 'rgba(54, 190, 184, 0.12)' },
  { key: 'fillblanks', label: 'Fill in the Blanks', sublabel: 'Student Panel', icon: '✍️', gradient: 'from-emerald-400 to-teal-500', glowColor: 'rgba(46, 186, 154, 0.2)', accentColor: '#159e85', iconBg: 'rgba(46, 186, 154, 0.12)' },
  { key: 'messages', label: 'Messages', sublabel: 'Parent Inbox', icon: '💬', gradient: 'from-indigo-400 to-cyan-500', glowColor: 'rgba(59,130,246,0.18)', accentColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.10)' },
  { key: 'settings', label: 'Settings', sublabel: 'Preferences', icon: 'âš™ï¸', gradient: 'from-slate-400 to-sky-500', glowColor: 'rgba(109, 156, 176, 0.18)', accentColor: '#658ea0', iconBg: 'rgba(109, 156, 176, 0.1)' },
];

const DIVIDER_AFTER = new Set([2, 4]);

const SidebarItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  onNavigate: (screen: ParentScreen) => void;
}> = React.memo(({ item, isActive, onNavigate }) => {
  const handleClick = useCallback(() => {
    onNavigate(item.key);
  }, [onNavigate, item.key]);

  return (
    <motion.button
      onClick={handleClick}
      className="relative w-full flex items-center gap-3 pl-5 pr-4 py-3 rounded-2xl text-left transition-all duration-200 group cursor-pointer overflow-hidden"
      style={
        isActive
          ? {
              background: 'linear-gradient(135deg, rgba(217,243,255,0.72), rgba(229,251,247,0.58))',
              boxShadow: `0 8px 24px ${item.glowColor}, 0 2px 6px rgba(73, 146, 173, 0.08)`,
              border: '1px solid rgba(182, 229, 240, 0.46)',
            }
          : {
              background: 'transparent',
              border: '1px solid transparent',
            }
      }
      whileHover={!isActive ? { x: 2, background: 'rgba(174, 229, 244, 0.12)' } : {}}
      whileTap={{ scale: 0.97 }}
    >
      {isActive && (
        <motion.div
          className="absolute left-0 top-[14%] bottom-[14%] w-[3.5px] rounded-r-full"
          style={{
            background: `linear-gradient(180deg, ${item.accentColor}, ${item.accentColor}88)`,
          }}
          layoutId="parent-sidebar-accent"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      <motion.div
        className="relative flex items-center justify-center rounded-xl shrink-0"
        style={
          isActive
            ? {
                width: 40,
                height: 40,
                background: `linear-gradient(135deg, ${item.accentColor}22, ${item.accentColor}11)`,
                boxShadow: `0 2px 12px ${item.glowColor}`,
              }
            : {
                width: 36,
                height: 36,
                background: item.iconBg,
              }
        }
        animate={isActive ? { scale: [1, 1.02, 1] } : {}}
        transition={isActive ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
      >
        <span style={{ fontSize: isActive ? 18 : 16 }}>{item.icon}</span>
      </motion.div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: isActive ? 700 : 600,
            color: isActive ? '#0d617f' : '#4e90a8',
            display: 'block',
            lineHeight: '18px',
          }}
        >
          {item.label}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: isActive ? '#5d9eb3' : '#90b5c1',
            display: 'block',
            lineHeight: '14px',
            marginTop: 1,
          }}
        >
          {item.sublabel}
        </span>
      </div>
    </motion.button>
  );
});
SidebarItem.displayName = 'ParentSidebarItem';

const BottomTab: React.FC<{
  item: NavItem;
  isActive: boolean;
  onNavigate: (screen: ParentScreen) => void;
}> = React.memo(({ item, isActive, onNavigate }) => {
  const isFillBlanks = item.key === 'fillblanks';
  const handleClick = useCallback(() => {
    if (!isFillBlanks) onNavigate(item.key);
  }, [onNavigate, item.key, isFillBlanks]);

  return (
    <motion.button
      onClick={handleClick}
      className="relative flex flex-col items-center justify-center gap-0.5 py-1 flex-1 cursor-pointer"
      style={isFillBlanks ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
      whileTap={!isFillBlanks ? { scale: 0.88 } : {}}
      disabled={isFillBlanks}
    >
      {isActive && (
        <motion.div
          className={`absolute -top-0.5 w-11 h-11 rounded-2xl bg-gradient-to-br ${item.gradient} opacity-10`}
          layoutId="parent-mobile-tab-bg"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <motion.span
        className="text-xl relative z-10"
        animate={isActive ? { scale: 1.18, y: -1 } : { scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {item.icon}
      </motion.span>
      <span
        style={{
          fontSize: 10,
          fontWeight: isActive ? 700 : 600,
          color: isActive ? '#0d617f' : '#5c9ab0',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {item.label}
      </span>
    </motion.button>
  );
});
BottomTab.displayName = 'ParentBottomTab';

interface Props {
  active: ParentScreen;
  onNavigate: (screen: ParentScreen) => void;
}

export const ParentNav: React.FC<Props> = React.memo(({ active, onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <motion.aside
        className="hidden lg:flex fixed left-0 w-[240px] flex-col pb-4 px-3 z-30 overflow-hidden"
        style={{
          top: 0,
          height: '100vh',
          paddingTop: 70,
          background: 'linear-gradient(180deg, rgba(242,253,255,0.88) 0%, rgba(231,248,255,0.84) 42%, rgba(232,252,247,0.8) 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRight: '1px solid rgba(228,247,252,0.82)',
          boxShadow: '8px 0 34px rgba(74, 146, 173, 0.08)',
        }}
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {NAV_ITEMS.map((item, idx) => (
            <React.Fragment key={item.key}>
              <SidebarItem item={item} isActive={active === item.key} onNavigate={onNavigate} />
              {DIVIDER_AFTER.has(idx) && (
                <div
                  style={{
                    height: 1,
                    margin: '6px 16px',
                    background: 'linear-gradient(90deg, transparent, rgba(117, 203, 226, 0.18), transparent)',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 12,
            paddingBottom: 20,
            borderTop: '1px solid rgba(117, 203, 226, 0.14)',
            margin: '0 8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(225, 248, 252, 0.76)',
              borderRadius: 14,
              padding: '10px 14px',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#1fb8a7',
                boxShadow: '0 0 8px rgba(31, 184, 167, 0.38)',
              }}
            />
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#0d617f', margin: 0 }}>Live Monitoring</p>
              <p style={{ fontSize: 8, fontWeight: 500, color: '#5e9eb2', margin: 0 }}>Real-time data active</p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(234, 251, 248, 0.74)',
              borderRadius: 14,
              padding: '10px 14px',
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>ðŸ•</span>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#0d617f', margin: 0 }}>Current Time</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1b8aae', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </motion.aside>

      <motion.nav
        className="fixed bottom-0 left-0 right-0 h-16 z-40 flex items-center justify-around px-2 lg:hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(239,252,255,0.94) 0%, rgba(248,255,255,0.98) 100%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: '1px solid rgba(117, 203, 226, 0.14)',
          boxShadow: '0 -6px 26px rgba(74, 146, 173, 0.08)',
        }}
        initial={{ y: 64 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomTab key={item.key} item={item} isActive={active === item.key} onNavigate={onNavigate} />
        ))}
      </motion.nav>
    </>
  );
});

ParentNav.displayName = 'ParentNav';

