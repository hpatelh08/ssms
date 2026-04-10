/**
 * parent/ParentNav.tsx
 * Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
 * Premium Parent Sidebar + Mobile Bottom Nav
 *
 * Sidebar: Glass blur, soft vertical gradient, active pastel glow,
 *          icon circle backgrounds, section dividers, labels.
 * Active: Soft purple bg + colored left border.
 * No black text. Uses deep indigo / slate / purple palette.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/* Ã¢â€â‚¬Ã¢â€â‚¬ Screen type Ã¢â€â‚¬Ã¢â€â‚¬ */

export type ParentScreen = 'overview' | 'progress' | 'attendance' | 'ai-buddy' | 'books' | 'garden' | 'colors' | 'messages' | 'leave' | 'settings' | 'assignments' | 'study-materials';

/* Ã¢â€â‚¬Ã¢â€â‚¬ Nav Items Ã¢â€â‚¬Ã¢â€â‚¬ */

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
  { key: 'overview',    label: 'Overview',       sublabel: 'Dashboard',     icon: '🏠', gradient: 'from-indigo-400 to-blue-500',    glowColor: 'rgba(99,102,241,0.20)',   accentColor: '#6366f1', iconBg: 'rgba(99,102,241,0.10)' },
  { key: 'progress',    label: 'Progress',       sublabel: 'Academics',     icon: '📈', gradient: 'from-purple-400 to-indigo-500',  glowColor: 'rgba(168,85,247,0.20)',   accentColor: '#a855f7', iconBg: 'rgba(168,85,247,0.10)' },
  { key: 'attendance',  label: 'Attendance',     sublabel: 'Tracking',      icon: '📅', gradient: 'from-cyan-400 to-blue-500',     glowColor: 'rgba(6,182,212,0.20)',    accentColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.10)' },
  { key: 'ai-buddy',   label: 'AI Insights',    sublabel: 'Smart Help',    icon: '🧠', gradient: 'from-amber-400 to-orange-500',  glowColor: 'rgba(245,158,11,0.20)',   accentColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.10)' },
  { key: 'books',       label: 'Books',           sublabel: 'Library',       icon: '📚', gradient: 'from-rose-400 to-pink-500',    glowColor: 'rgba(244,63,94,0.20)',    accentColor: '#f43f5e', iconBg: 'rgba(244,63,94,0.10)' },
  { key: 'garden',      label: 'Garden Growth',  sublabel: 'Responsibility', icon: '🌳', gradient: 'from-green-400 to-emerald-600', glowColor: 'rgba(34,197,94,0.20)',    accentColor: '#22c55e', iconBg: 'rgba(34,197,94,0.10)' },
  { key: 'colors',      label: 'Color Skills',   sublabel: 'Creative',      icon: '🎨', gradient: 'from-pink-400 to-orange-500',   glowColor: 'rgba(244,114,182,0.20)',  accentColor: '#f472b6', iconBg: 'rgba(244,114,182,0.10)' },
  { key: 'messages',    label: 'Messages',       sublabel: 'Parent Inbox',  icon: '💬', gradient: 'from-indigo-400 to-cyan-500',   glowColor: 'rgba(59,130,246,0.18)',   accentColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.10)' },
  { key: 'leave',       label: 'Leave',          sublabel: 'Applications',  icon: '📝', gradient: 'from-orange-400 to-rose-500',   glowColor: 'rgba(249,115,22,0.18)',   accentColor: '#f97316', iconBg: 'rgba(249,115,22,0.10)' },
  { key: 'settings',    label: 'Settings',       sublabel: 'Preferences',   icon: '⚙️', gradient: 'from-slate-400 to-gray-500',    glowColor: 'rgba(100,116,139,0.15)',  accentColor: '#64748b', iconBg: 'rgba(100,116,139,0.08)' },
  { key: 'assignments',  label: 'Assignments',    sublabel: 'Class Work',    icon: '📝', gradient: 'from-violet-400 to-fuchsia-500', glowColor: 'rgba(168,85,247,0.20)',   accentColor: '#7c3aed', iconBg: 'rgba(168,85,247,0.10)' },
  { key: 'study-materials', label: 'Study Materials', sublabel: 'Downloads', icon: '📁', gradient: 'from-emerald-400 to-teal-500', glowColor: 'rgba(16,185,129,0.18)', accentColor: '#059669', iconBg: 'rgba(16,185,129,0.10)' },
];

/* Divider after these indices (0-based): After Attendance (idx 2) and after Books (idx 4) */
function getNavIcon(key: ParentScreen) {
  switch (key) {
    case 'overview': return '\u{1F3E0}';
    case 'progress': return '\u{1F4C8}';
    case 'attendance': return '\u{1F4C5}';
    case 'ai-buddy': return '\u{1F9E0}';
    case 'books': return '\u{1F4DA}';
    case 'garden': return '\u{1F333}';
    case 'colors': return '\u{1F3A8}';
    case 'messages': return '\u{1F4AC}';
    case 'leave': return '\u{1F4DD}';
    case 'settings': return '\u{2699}\u{FE0F}';
    case 'assignments': return '\u{1F4DD}';
    case 'study-materials': return '\u{1F4C1}';
    case 'games': return '\u{1F3AE}';
    case 'report': return '\u{1F4C4}';
    case 'brain-boost': return '\u{1F331}';
    case 'puzzle-zone': return '\u{1FA9C}';
    case 'fillblanks': return '\u{1F9E9}';
    case 'space-war': return '\u{1F680}';
    case 'eco-system': return '\u{1F30D}';
    default: return '\u2728';
  }
}

const DIVIDER_AFTER = new Set([2, 4]);

/* Ã¢â€â‚¬Ã¢â€â‚¬ Sidebar Item (desktop) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const SidebarItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  onNavigate: (screen: ParentScreen) => void;
}> = React.memo(({ item, isActive, onNavigate }) => {
  const handleClick = useCallback(() => onNavigate(item.key), [onNavigate, item.key]);

  return (
    <motion.button
      onClick={handleClick}
      className="relative w-full flex items-center gap-3 pl-5 pr-4 py-3 rounded-2xl text-left transition-all duration-200 group cursor-pointer overflow-hidden"
      style={isActive ? {
        background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(167,139,250,0.08))',
        boxShadow: `0 3px 18px ${item.glowColor}, 0 1px 3px rgba(92,106,196,0.04)`,
        border: '1px solid rgba(129,140,248,0.12)',
      } : {
        background: 'transparent',
        border: '1px solid transparent',
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
          width: 40, height: 40,
          background: `linear-gradient(135deg, ${item.accentColor}22, ${item.accentColor}11)`,
          boxShadow: `0 2px 10px ${item.glowColor}`,
        } : {
          width: 36, height: 36,
          background: item.iconBg,
        }}
        animate={isActive ? { scale: [1, 1.02, 1] } : {}}
        transition={isActive ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
      >
        <span style={{ fontSize: isActive ? 18 : 16 }}>{getNavIcon(item.key)}</span>
      </motion.div>

      {/* Label + sublabel */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <span style={{
          fontSize: 13, fontWeight: isActive ? 700 : 600,
          color: isActive ? '#3A3F9F' : '#5C6AC4',
          display: 'block', lineHeight: '18px',
        }}>
          {item.label}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 500,
          color: isActive ? '#7A86C2' : '#A0AEC0',
          display: 'block', lineHeight: '14px', marginTop: 1,
        }}>
          {item.sublabel}
        </span>
      </div>
    </motion.button>
  );
});
SidebarItem.displayName = 'ParentSidebarItem';

/* Ã¢â€â‚¬Ã¢â€â‚¬ Bottom Tab (mobile) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

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
        {getNavIcon(item.key)}
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

/* Ã¢â€â‚¬Ã¢â€â‚¬ Main ParentNav Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

interface Props {
  active: ParentScreen;
  onNavigate: (screen: ParentScreen) => void;
}

export const ParentNav: React.FC<Props> = React.memo(({ active, onNavigate }) => {
  /* Ã¢â€â‚¬Ã¢â€â‚¬ Real-time clock Ã¢â€â‚¬Ã¢â€â‚¬ */
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
  <>
    {/* Ã¢â€â‚¬Ã¢â€â‚¬ Desktop Sidebar Ã¢â€â‚¬Ã¢â€â‚¬ */}
    <motion.aside
      className="hidden lg:flex fixed left-0 w-[240px] flex-col pb-4 px-3 z-30 overflow-hidden"
      style={{
        top: 0,
        height: '100vh',
        paddingTop: 70,
        background: 'linear-gradient(180deg, rgba(238,242,255,0.82) 0%, rgba(245,240,255,0.78) 40%, rgba(252,235,243,0.72) 100%)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRight: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '3px 0 30px rgba(92,106,196,0.04)',
      }}
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <div style={{ padding: '0 8px', marginBottom: 20 }}>
        <div className="flex items-center gap-3">
          <motion.span
            style={{ fontSize: 22 }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {"\u{1F6E1}\uFE0F"}
          </motion.span>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#3A3F9F' }}>
              Guardian Console
            </h2>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#7A86C2', marginTop: 3, fontFamily: 'Nunito, sans-serif', letterSpacing: '0.3px' }}>
              Std 1 - Analytics View
            </p>
          </div>
        </div>
      </div>

      {/* Nav Items with dividers */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 2, scrollbarWidth: 'thin' }}>
        {NAV_ITEMS.map((item, idx) => (
          <React.Fragment key={item.key}>
            <SidebarItem
              item={item}
              isActive={active === item.key}
              onNavigate={onNavigate}
            />
            {DIVIDER_AFTER.has(idx) && (
              <div style={{
                height: 1, margin: '6px 16px',
                background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.12), transparent)',
              }} />
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Bottom status */}
      <div style={{
        marginTop: 'auto', paddingTop: 12, paddingBottom: 20,
        borderTop: '1px solid rgba(129,140,248,0.08)',
        margin: '0 8px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(129,140,248,0.06)', borderRadius: 14,
          padding: '10px 14px',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 8px rgba(16,185,129,0.4)',
          }} />
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#3A3F9F', margin: 0 }}>Live Monitoring</p>
            <p style={{ fontSize: 8, fontWeight: 500, color: '#7A86C2', margin: 0 }}>Real-time data active</p>
          </div>
        </div>
        {/* Real-time Clock */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.05)', borderRadius: 14,
          padding: '10px 14px', marginTop: 8,
        }}>
          <span style={{ fontSize: 14 }}>{"\u{1F550}"}</span>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#3A3F9F', margin: 0 }}>Current Time</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </motion.aside>

    {/* Ã¢â€â‚¬Ã¢â€â‚¬ Mobile Bottom Bar Ã¢â€â‚¬Ã¢â€â‚¬ */}
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







