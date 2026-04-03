/**
 * parent/ParentNav.tsx
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Premium Parent Sidebar + Mobile Bottom Nav
 *
 * Sidebar: Glass blur, soft vertical gradient, active pastel glow,
 *          icon circle backgrounds, section dividers, labels.
 * Active: Soft purple bg + colored left border.
 * No black text. Uses deep indigo / slate / purple palette.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAuditLog } from '../utils/auditLog';
import { buildLiveMonitoring, type LiveMonitoringState } from './liveMonitoring';

/* â”€â”€ Screen type â”€â”€ */

export type ParentScreen = 'overview' | 'progress' | 'games' | 'attendance' | 'books' | 'ai-buddy' | 'space-war' | 'eco-system' | 'report' | 'settings';

/* â”€â”€ Nav Items â”€â”€ */

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
  { key: 'overview',    label: 'Overview',       sublabel: 'Dashboard',     icon: 'ðŸ“Š', gradient: 'from-indigo-400 to-blue-500',    glowColor: 'rgba(99,102,241,0.20)',   accentColor: '#6366f1', iconBg: 'rgba(99,102,241,0.10)' },
  { key: 'progress',    label: 'Progress',       sublabel: 'Academics',     icon: 'ðŸ“ˆ', gradient: 'from-purple-400 to-indigo-500',  glowColor: 'rgba(168,85,247,0.20)',   accentColor: '#a855f7', iconBg: 'rgba(168,85,247,0.10)' },
  { key: 'games',       label: 'Games',          sublabel: 'Play Progress', icon: 'ðŸŽ®', gradient: 'from-violet-400 to-fuchsia-500', glowColor: 'rgba(139,92,246,0.20)',   accentColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.10)' },
  { key: 'attendance',  label: 'Attendance',     sublabel: 'Tracking',      icon: 'ðŸ“…', gradient: 'from-cyan-400 to-blue-500',     glowColor: 'rgba(6,182,212,0.20)',    accentColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.10)' },
  { key: 'books',       label: 'Books',          sublabel: 'Learning Library', icon: 'ðŸ“š', gradient: 'from-pink-400 to-violet-500', glowColor: 'rgba(236,72,153,0.20)',  accentColor: '#ec4899', iconBg: 'rgba(236,72,153,0.10)' },
  { key: 'ai-buddy',   label: 'AI Insights',    sublabel: 'Smart Help',    icon: 'ðŸ§ ', gradient: 'from-amber-400 to-orange-500',  glowColor: 'rgba(245,158,11,0.20)',   accentColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.10)' },
  { key: 'space-war',    label: 'Space War',      sublabel: 'Battle Quiz',    icon: 'ðŸš€', gradient: 'from-red-400 to-orange-500',    glowColor: 'rgba(239,68,68,0.20)',    accentColor: '#ef4444', iconBg: 'rgba(239,68,68,0.10)' },
  { key: 'eco-system',     label: 'Eco System',    sublabel: 'Explore Space',  icon: 'ðŸª', gradient: 'from-indigo-400 to-purple-500', glowColor: 'rgba(99,102,241,0.20)',   accentColor: '#6366f1', iconBg: 'rgba(99,102,241,0.10)' },
  { key: 'report',         label: 'Report Card',    sublabel: 'Print Report',   icon: '📄', gradient: 'from-teal-400 to-cyan-500',    glowColor: 'rgba(20,184,166,0.20)',   accentColor: '#14b8a6', iconBg: 'rgba(20,184,166,0.10)' },
  { key: 'messages',       label: 'Messages',       sublabel: 'Parent Inbox',   icon: '💬', gradient: 'from-indigo-400 to-cyan-500',   glowColor: 'rgba(59,130,246,0.18)',   accentColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.10)' },
  { key: 'settings',    label: 'Settings',       sublabel: 'Preferences',   icon: 'âš™ï¸', gradient: 'from-slate-400 to-gray-500',    glowColor: 'rgba(100,116,139,0.15)',  accentColor: '#64748b', iconBg: 'rgba(100,116,139,0.08)' },
];

/* Divider after these indices (0-based): After Attendance (idx 3) and after AI Insights (idx 5) */
const DIVIDER_AFTER = new Set([3, 5]);

/* â”€â”€ Sidebar Item (desktop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const SidebarItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  onNavigate: (screen: ParentScreen) => void;
}> = React.memo(({ item, isActive, onNavigate }) => {
  const handleClick = useCallback(() => onNavigate(item.key), [onNavigate, item.key]);

  return (
    <motion.button
      onClick={handleClick}
      className="relative w-full flex items-center gap-2 rounded-2xl text-left transition-all duration-200 group cursor-pointer"
      style={{
        padding: 'clamp(5px, 0.7vh, 12px) 12px clamp(5px, 0.7vh, 12px) 16px',
        ...(isActive ? {
          background: 'linear-gradient(135deg, rgba(15,23,42,0.94), rgba(30,41,59,0.88))',
          boxShadow: `0 4px 18px ${item.glowColor}, var(--shadow-soft)`,
          border: '1px solid rgba(148,163,184,0.18)',
        } : {
          background: 'transparent',
          border: '1px solid transparent',
        }),
      }}
      whileHover={!isActive ? { x: 4, background: 'var(--sidebar-hover-bg)' } : {}}
      whileTap={{ scale: 0.97 }}
    >
      {/* Left accent stripe */}
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

      {/* Icon circle */}
      <motion.div
        className="relative flex items-center justify-center rounded-xl shrink-0"
        style={isActive ? {
          width: 36, height: 36,
          background: `linear-gradient(135deg, ${item.accentColor}26, rgba(15,23,42,0.94))`,
          boxShadow: `0 2px 10px ${item.glowColor}`,
          border: '1px solid rgba(148,163,184,0.12)',
        } : {
          width: 32, height: 32,
          background: item.iconBg,
        }}
        animate={isActive ? { scale: [1, 1.02, 1] } : {}}
        transition={isActive ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
      >
        <span style={{ fontSize: isActive ? 16 : 14 }}>{item.icon}</span>
      </motion.div>

      {/* Label + sublabel */}
      <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <span style={{
          fontSize: 'clamp(11px, 1.3vw, 13px)', fontWeight: isActive ? 700 : 600,
          color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
          display: 'block', lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.label}
        </span>
        <span style={{
          fontSize: 'clamp(8px, 1vw, 10px)', fontWeight: 500,
          color: isActive ? 'var(--text-soft)' : 'var(--sidebar-text-muted)',
          display: 'block', lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.sublabel}
        </span>
      </div>
    </motion.button>
  );
});
SidebarItem.displayName = 'ParentSidebarItem';

/* â”€â”€ Bottom Tab (mobile) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const BottomTab: React.FC<{
  item: NavItem;
  isActive: boolean;
  onNavigate: (screen: ParentScreen) => void;
}> = React.memo(({ item, isActive, onNavigate }) => {
  const handleClick = useCallback(() => onNavigate(item.key), [onNavigate, item.key]);

  return (
    <motion.button
      onClick={handleClick}
      className="relative flex flex-col items-center justify-center gap-0.5 py-1 flex-1 cursor-pointer"
      whileTap={{ scale: 0.88 }}
    >
      {isActive && (
        <motion.div
          className="absolute -top-0.5 w-11 h-11 rounded-2xl"
          style={{
            background: `${item.accentColor}22`,
            border: '1px solid rgba(148,163,184,0.14)',
          }}
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
      <span style={{
        fontSize: 10, fontWeight: isActive ? 700 : 600,
        color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text-muted)',
        position: 'relative', zIndex: 10,
      }}>
        {item.label}
      </span>
    </motion.button>
  );
});
BottomTab.displayName = 'ParentBottomTab';

/* â”€â”€ Main ParentNav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface Props {
  active: ParentScreen;
  onNavigate: (screen: ParentScreen) => void;
}

export const ParentNav: React.FC<Props> = React.memo(({ active, onNavigate }) => {
  const [liveMonitoring, setLiveMonitoring] = useState<LiveMonitoringState>(() => buildLiveMonitoring(getAuditLog()));

  useEffect(() => {
    const sync = () => setLiveMonitoring(buildLiveMonitoring(getAuditLog()));
    sync();
    const timer = window.setInterval(sync, 2000);
    window.addEventListener('storage', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return (
  <>
    {/* â”€â”€ Desktop Sidebar â”€â”€ */}
    <motion.aside
      className="hidden lg:flex w-[240px] shrink-0 flex-col z-30"
      style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 240,
        background: 'var(--gradient-sidebar)',
        borderRadius: '0 30px 30px 0',
        boxShadow: '10px 0 36px rgba(2,6,23,0.36), 1px 0 0 rgba(148,163,184,0.08)',
        padding: '30px 20px',
        overflowX: 'hidden', overflowY: 'hidden',
      }}
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      {/* â”€â”€ Brand Header: Guardian Console â”€â”€ */}
      <div style={{ padding: '0 8px', marginBottom: 36 }}>
        <div className="flex items-center gap-3">
          <motion.span
            style={{ fontSize: 22 }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            ðŸ›¡ï¸
          </motion.span>
          <div>
            <h2 className="sidebar-title" style={{ margin: 0, fontSize: 15 }}>
              Guardian Console
            </h2>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text-muted)', marginTop: 3, fontFamily: 'Nunito, sans-serif', letterSpacing: '0.3px' }}>
              Std 3 Â· Analytics View
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2px, 0.6vh, 8px)', flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', paddingTop: 4, paddingBottom: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="hide-scrollbar">
        {NAV_ITEMS.map((item, idx) => (
          <React.Fragment key={item.key}>
            <SidebarItem
              item={item}
              isActive={active === item.key}
              onNavigate={onNavigate}
            />
            {DIVIDER_AFTER.has(idx) && (
              <div style={{
                height: 1, margin: '2px 16px',
                background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.18), transparent)',
              }} />
            )}
          </React.Fragment>
        ))}
      </nav>
    </motion.aside>

    <motion.div
      className="hidden lg:block"
      style={{
        position: 'fixed',
        left: 252,
        bottom: 20,
        zIndex: 45,
        width: 248,
        background: 'linear-gradient(180deg, rgba(8,12,28,0.96) 0%, rgba(15,23,42,0.92) 100%)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        borderRadius: 20,
        padding: '14px 16px',
        border: '1px solid rgba(96,165,250,0.16)',
        boxShadow: '0 20px 42px rgba(2,6,23,0.42)',
      }}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.15 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <motion.div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: liveMonitoring.indicatorColor,
            boxShadow: `0 0 10px ${liveMonitoring.indicatorColor}66`,
          }}
          animate={{ scale: [1, 1.25, 1], opacity: [1, 0.72, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#93C5FD', letterSpacing: '0.08em' }}>LIVE STATUS</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 9,
          fontWeight: 800,
          color: liveMonitoring.badgeColor,
          background: `${liveMonitoring.badgeColor}1f`,
          padding: '3px 8px',
          borderRadius: 999,
        }}>
          {liveMonitoring.badge}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>Last activity</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#E2E8F0', textAlign: 'right' }}>{liveMonitoring.lastSession}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>Recent session</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1', textAlign: 'right' }}>{liveMonitoring.sessionLength}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>Current activity</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#818CF8', textAlign: 'right', maxWidth: 128, lineHeight: 1.35 }}>
            {liveMonitoring.currentActivity}
          </span>
        </div>
      </div>
    </motion.div>

    {/* â”€â”€ Mobile Bottom Bar â”€â”€ */}
    <motion.nav
      className="fixed bottom-0 left-0 right-0 h-16 z-40 flex items-center justify-around px-2 lg:hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(9,14,27,0.92) 0%, rgba(15,23,42,0.98) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(96,165,250,0.18)',
        boxShadow: '0 -10px 30px rgba(2,6,23,0.4)',
      }}
      initial={{ y: 64 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      {NAV_ITEMS.map(item => (
        <BottomTab
          key={item.key}
          item={item}
          isActive={active === item.key}
          onNavigate={onNavigate}
        />
      ))}
    </motion.nav>
  </>
  );
});

ParentNav.displayName = 'ParentNav';

