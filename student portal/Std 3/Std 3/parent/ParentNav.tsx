/**
 * parent/ParentNav.tsx
 * ─────────────────────────────────────────────────────
 * Premium Parent Sidebar + Mobile Bottom Nav
 *
 * Sidebar: Glass blur, soft vertical gradient, active pastel glow,
 *          icon circle backgrounds, section dividers, labels.
 * Active: Soft purple bg + colored left border.
 * No black text. Uses deep indigo / slate / purple palette.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/* ── Screen type ── */

export type ParentScreen = 'overview' | 'progress' | 'games' | 'attendance' | 'ai-buddy' | 'books' | 'garden' | 'space-war' | 'eco-system' | 'report' | 'settings';

/* ── Nav Items ── */

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
  { key: 'overview',    label: 'Overview',       sublabel: 'Dashboard',     icon: '📊', gradient: 'from-indigo-400 to-blue-500',    glowColor: 'rgba(99,102,241,0.20)',   accentColor: '#6366f1', iconBg: 'rgba(99,102,241,0.10)' },
  { key: 'progress',    label: 'Progress',       sublabel: 'Academics',     icon: '📈', gradient: 'from-purple-400 to-indigo-500',  glowColor: 'rgba(168,85,247,0.20)',   accentColor: '#a855f7', iconBg: 'rgba(168,85,247,0.10)' },
  { key: 'games',       label: 'Games',          sublabel: 'Play Progress', icon: '🎮', gradient: 'from-violet-400 to-fuchsia-500', glowColor: 'rgba(139,92,246,0.20)',   accentColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.10)' },
  { key: 'attendance',  label: 'Attendance',     sublabel: 'Tracking',      icon: '📅', gradient: 'from-cyan-400 to-blue-500',     glowColor: 'rgba(6,182,212,0.20)',    accentColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.10)' },
  { key: 'ai-buddy',   label: 'AI Insights',    sublabel: 'Smart Help',    icon: '🧠', gradient: 'from-amber-400 to-orange-500',  glowColor: 'rgba(245,158,11,0.20)',   accentColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.10)' },
  { key: 'books',       label: 'Books',           sublabel: 'Library',       icon: '📚', gradient: 'from-rose-400 to-pink-500',    glowColor: 'rgba(244,63,94,0.20)',    accentColor: '#f43f5e', iconBg: 'rgba(244,63,94,0.10)' },
  { key: 'garden',      label: 'Garden Growth',  sublabel: 'Responsibility', icon: '🌳', gradient: 'from-green-400 to-emerald-600', glowColor: 'rgba(34,197,94,0.20)',    accentColor: '#22c55e', iconBg: 'rgba(34,197,94,0.10)' },
  { key: 'space-war',    label: 'Space War',      sublabel: 'Battle Quiz',    icon: '🚀', gradient: 'from-red-400 to-orange-500',    glowColor: 'rgba(239,68,68,0.20)',    accentColor: '#ef4444', iconBg: 'rgba(239,68,68,0.10)' },
  { key: 'eco-system',     label: 'Eco System',    sublabel: 'Explore Space',  icon: '🪐', gradient: 'from-indigo-400 to-purple-500', glowColor: 'rgba(99,102,241,0.20)',   accentColor: '#6366f1', iconBg: 'rgba(99,102,241,0.10)' },
  { key: 'report',         label: 'Report Card',    sublabel: 'Print Report',   icon: '📄', gradient: 'from-teal-400 to-cyan-500',    glowColor: 'rgba(20,184,166,0.20)',   accentColor: '#14b8a6', iconBg: 'rgba(20,184,166,0.10)' },
  { key: 'settings',    label: 'Settings',       sublabel: 'Preferences',   icon: '⚙️', gradient: 'from-slate-400 to-gray-500',    glowColor: 'rgba(100,116,139,0.15)',  accentColor: '#64748b', iconBg: 'rgba(100,116,139,0.08)' },
];

/* Divider after these indices (0-based): After Attendance (idx 3) and after Books (idx 5) */
const DIVIDER_AFTER = new Set([3, 5]);

/* ── Sidebar Item (desktop) ─────────────────────── */

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
          background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(167,139,250,0.08))',
          boxShadow: `0 3px 18px ${item.glowColor}, 0 1px 3px rgba(92,106,196,0.04)`,
          border: '1px solid rgba(129,140,248,0.12)',
        } : {
          background: 'transparent',
          border: '1px solid transparent',
        }),
      }}
      whileHover={!isActive ? { x: 2, background: 'rgba(129,140,248,0.05)' } : {}}
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
          background: `linear-gradient(135deg, ${item.accentColor}22, ${item.accentColor}11)`,
          boxShadow: `0 2px 10px ${item.glowColor}`,
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
          color: isActive ? '#3A3F9F' : '#5C6AC4',
          display: 'block', lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.label}
        </span>
        <span style={{
          fontSize: 'clamp(8px, 1vw, 10px)', fontWeight: 500,
          color: isActive ? '#7A86C2' : '#A0AEC0',
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

/* ── Bottom Tab (mobile) ────────────────────────── */

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
      <span style={{
        fontSize: 10, fontWeight: isActive ? 700 : 600,
        color: isActive ? '#3A3F9F' : '#7A86C2',
        position: 'relative', zIndex: 10,
      }}>
        {item.label}
      </span>
    </motion.button>
  );
});
BottomTab.displayName = 'ParentBottomTab';

/* ── Main ParentNav ─────────────────────────────── */

interface Props {
  active: ParentScreen;
  onNavigate: (screen: ParentScreen) => void;
}

export const ParentNav: React.FC<Props> = React.memo(({ active, onNavigate }) => {
  /* ── Real-time clock ── */
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
  <>
    {/* ── Desktop Sidebar ── */}
    <motion.aside
      className="hidden lg:flex w-[240px] shrink-0 flex-col z-30"
      style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 240,
        background: 'var(--gradient-sidebar)',
        borderRadius: '0 30px 30px 0',
        boxShadow: '4px 0 32px rgba(200,180,255,0.14), 1px 0 0 rgba(255,255,255,0.6)',
        padding: '30px 20px',
        overflowX: 'hidden', overflowY: 'hidden',
      }}
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      {/* ── Brand Header: Guardian Console ── */}
      <div style={{ padding: '0 8px', marginBottom: 36 }}>
        <div className="flex items-center gap-3">
          <motion.span
            style={{ fontSize: 22 }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🛡️
          </motion.span>
          <div>
            <h2 className="sidebar-title" style={{ margin: 0, fontSize: 15 }}>
              Guardian Console
            </h2>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text-muted)', marginTop: 3, fontFamily: 'Nunito, sans-serif', letterSpacing: '0.3px' }}>
              Std 3 · Analytics View
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
                background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.12), transparent)',
              }} />
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* ── Bottom decorative ── */}
      <div style={{ marginTop: 'auto', padding: '16px 4px 0', borderTop: '1px solid rgba(255,255,255,0.35)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.5)',
          borderRadius: 20, padding: '12px 16px',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 8px rgba(16,185,129,0.4)',
            flexShrink: 0,
          }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--sidebar-text)', margin: 0, whiteSpace: 'nowrap' }}>Live Monitoring</p>
            <p style={{ fontSize: 9, color: 'var(--sidebar-text-muted)', fontWeight: 500, margin: 0, whiteSpace: 'nowrap' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Active
            </p>
          </div>
        </div>
      </div>
    </motion.aside>

    {/* ── Mobile Bottom Bar ── */}
    <motion.nav
      className="fixed bottom-0 left-0 right-0 h-16 z-40 flex items-center justify-around px-2 lg:hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(245,240,255,0.92) 0%, rgba(255,255,255,0.98) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(129,140,248,0.1)',
        boxShadow: '0 -2px 24px rgba(92,106,196,0.06)',
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
