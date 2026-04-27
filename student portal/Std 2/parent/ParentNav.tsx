/**
 * parent/ParentNav.tsx
 * Parent sidebar + mobile bottom nav
 */

import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export type ParentScreen =
  | 'overview'
  | 'progress'
  | 'games'
  | 'attendance'
  | 'ai-buddy'
  | 'books'
  | 'assignments'
  | 'study-materials'
  | 'exams'
  | 'report'
  | 'exams-marks'
  | 'messages'
  | 'leave'
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
  { key: 'overview', label: 'Home', sublabel: 'Quick summary', icon: '\u{1F3E0}', gradient: 'from-emerald-400 to-green-500', glowColor: 'rgba(34,197,94,0.20)', accentColor: '#22c55e', iconBg: 'rgba(34,197,94,0.10)' },
  { key: 'progress', label: 'Learning', sublabel: 'Subject progress', icon: '\u{1F4D8}', gradient: 'from-green-400 to-emerald-500', glowColor: 'rgba(16,185,129,0.20)', accentColor: '#10b981', iconBg: 'rgba(16,185,129,0.10)' },
  { key: 'games', label: 'Practice Games', sublabel: 'Skill practice', icon: '\u{1F3AE}', gradient: 'from-lime-400 to-green-500', glowColor: 'rgba(132,204,22,0.20)', accentColor: '#84cc16', iconBg: 'rgba(132,204,22,0.10)' },
  { key: 'attendance', label: 'Attendance', sublabel: 'School days', icon: '\u{1F4C5}', gradient: 'from-emerald-400 to-teal-500', glowColor: 'rgba(20,184,166,0.20)', accentColor: '#14b8a6', iconBg: 'rgba(20,184,166,0.10)' },
  { key: 'ai-buddy', label: 'Ask AI Helper', sublabel: 'Simple help', icon: '\u{1F9E0}', gradient: 'from-green-400 to-emerald-400', glowColor: 'rgba(34,197,94,0.18)', accentColor: '#22c55e', iconBg: 'rgba(34,197,94,0.10)' },
  { key: 'books', label: 'Books', sublabel: 'Reading', icon: '\u{1F4DA}', gradient: 'from-emerald-400 to-green-400', glowColor: 'rgba(16,185,129,0.18)', accentColor: '#059669', iconBg: 'rgba(16,185,129,0.10)' },
  { key: 'exams', label: 'Exams', sublabel: 'Marks Board', icon: '\u{1F4DD}', gradient: 'from-green-400 to-lime-500', glowColor: 'rgba(132,204,22,0.18)', accentColor: '#65a30d', iconBg: 'rgba(132,204,22,0.10)' },
  { key: 'messages', label: 'Messages', sublabel: 'From school', icon: '\u{1F4AC}', gradient: 'from-teal-400 to-emerald-500', glowColor: 'rgba(45,212,191,0.18)', accentColor: '#14b8a6', iconBg: 'rgba(45,212,191,0.10)' },
  { key: 'leave', label: 'Leave Request', sublabel: 'Apply leave', icon: '\u{1F4DD}', gradient: 'from-lime-400 to-emerald-500', glowColor: 'rgba(132,204,22,0.16)', accentColor: '#65a30d', iconBg: 'rgba(132,204,22,0.10)' },
  { key: 'settings', label: 'Settings', sublabel: 'Parent options', icon: '\u{2699}\u{FE0F}', gradient: 'from-slate-400 to-gray-500', glowColor: 'rgba(100,116,139,0.15)', accentColor: '#64748b', iconBg: 'rgba(100,116,139,0.08)' },
  { key: 'assignments', label: 'Assignments', sublabel: 'Class Work', icon: '\u{1F4DD}', gradient: 'from-green-400 to-emerald-500', glowColor: 'rgba(34,197,94,0.18)', accentColor: '#16a34a', iconBg: 'rgba(34,197,94,0.10)' },
  { key: 'study-materials', label: 'Study Materials', sublabel: 'Downloads', icon: '\u{1F4C1}', gradient: 'from-emerald-400 to-teal-500', glowColor: 'rgba(16,185,129,0.18)', accentColor: '#059669', iconBg: 'rgba(16,185,129,0.10)' },
];

function getNavIcon(key: ParentScreen) {
  switch (key) {
    case 'overview': return '\u{1F3E0}';
    case 'progress': return '\u{1F4D8}';
    case 'attendance': return '\u{1F4C5}';
    case 'ai-buddy': return '\u{1F9E0}';
    case 'books': return '\u{1F4DA}';
    case 'messages': return '\u{1F4AC}';
    case 'leave': return '\u{1F4DD}';
    case 'settings': return '\u{2699}\u{FE0F}';
    case 'assignments': return '\u{1F4DD}';
    case 'study-materials': return '\u{1F4C1}';
    case 'games': return '\u{1F3AE}';
    case 'exams': return '\u{1F4DD}';
    case 'report': return '\u{1F4C4}';
    case 'brain-boost': return '\u{1F331}';
    case 'puzzle-zone': return '\u{1FA9C}';
    case 'fillblanks': return '\u{1F9E9}';
    case 'space-war': return '\u{1F680}';
    case 'eco-system': return '\u{1F30D}';
    default: return '\u{2728}';
  }
}

const DIVIDER_AFTER = new Set([3, 5]);

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
        ...(isActive
          ? {
              background: 'linear-gradient(135deg, rgba(74,222,128,0.12), rgba(134,239,172,0.08))',
              boxShadow: `0 3px 18px ${item.glowColor}, 0 1px 3px rgba(34,197,94,0.04)`,
              border: '1px solid rgba(74,222,128,0.14)',
            }
          : {
              background: 'transparent',
              border: '1px solid transparent',
            }),
      }}
      whileHover={!isActive ? { x: 2, background: 'rgba(74,222,128,0.05)' } : {}}
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
                width: 36,
                height: 36,
                background: `linear-gradient(135deg, ${item.accentColor}22, ${item.accentColor}11)`,
                boxShadow: `0 2px 10px ${item.glowColor}`,
              }
            : {
                width: 32,
                height: 32,
                background: item.iconBg,
              }
        }
        animate={isActive ? { scale: [1, 1.02, 1] } : {}}
        transition={isActive ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
      >
        <span style={{ fontSize: isActive ? 16 : 14 }}>{getNavIcon(item.key)}</span>
      </motion.div>

      <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <span
          style={{
            fontSize: 'clamp(11px, 1.3vw, 13px)',
            fontWeight: isActive ? 700 : 600,
            color: isActive ? '#166534' : '#15803d',
            display: 'block',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.label}
        </span>
        <span
          style={{
            fontSize: 'clamp(8px, 1vw, 10px)',
            fontWeight: 500,
            color: isActive ? '#4b5563' : '#6b7280',
            display: 'block',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
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
  const handleClick = useCallback(() => onNavigate(item.key), [onNavigate, item.key]);

  return (
    <motion.button
      onClick={handleClick}
      className="relative flex flex-col items-center justify-center gap-0.5 py-2 w-full cursor-pointer"
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
      <span
        style={{
          fontSize: 10,
          fontWeight: isActive ? 700 : 600,
          color: isActive ? '#166534' : '#6b7280',
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
        className="hidden lg:flex fixed left-0 w-[240px] flex-col pb-0 px-3 z-30 overflow-hidden"
        style={{
          top: 0,
          height: '100vh',
          paddingTop: 70,
          background: 'linear-gradient(180deg, rgba(236,253,245,0.92) 0%, rgba(240,253,244,0.90) 40%, rgba(220,252,231,0.84) 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRight: '1px solid rgba(167,243,208,0.6)',
          boxShadow: '3px 0 30px rgba(34,197,94,0.05)',
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
              🛡️
            </motion.span>
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#166534' }}>
                Parent Dashboard
              </h2>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#16a34a', marginTop: 3, fontFamily: 'Nunito, sans-serif', letterSpacing: '0.3px' }}>
                Std 2 Parent Section
              </p>
            </div>
          </div>
        </div>

        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(2px, 0.6vh, 8px)',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingTop: 4,
            paddingBottom: 8,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="hide-scrollbar"
        >
          {NAV_ITEMS.map((item, idx) => (
            <React.Fragment key={item.key}>
              <SidebarItem item={item} isActive={active === item.key} onNavigate={onNavigate} />
              {DIVIDER_AFTER.has(idx) && (
                <div
                  style={{
                    height: 1,
                    margin: '2px 16px',
                    background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.12), transparent)',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </nav>

        <div
          style={{
            flexShrink: 0,
            padding: '8px 8px 12px',
            borderTop: '1px solid rgba(74,222,128,0.10)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(74,222,128,0.08)',
              borderRadius: 14,
              padding: '8px 12px',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px rgba(16,185,129,0.4)',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#166534', margin: 0, whiteSpace: 'nowrap' }}>
                Live Updates
              </p>
              <p style={{ fontSize: 8, fontWeight: 500, color: '#4b5563', margin: 0, whiteSpace: 'nowrap' }}>
                Information updates live
              </p>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(34,197,94,0.06)',
              borderRadius: 14,
              padding: '8px 12px',
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>🕐</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#166534', margin: 0, whiteSpace: 'nowrap' }}>
                Current Time
              </p>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', margin: 0, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </motion.aside>

      <motion.nav
        className="fixed right-3 top-[84px] bottom-3 z-40 w-[76px] flex flex-col items-stretch gap-2 px-2 py-2 lg:hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(240,253,244,0.95) 0%, rgba(255,255,255,0.98) 100%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: '1px solid rgba(74,222,128,0.12)',
          boxShadow: '0 -2px 24px rgba(34,197,94,0.06)',
        }}
        initial={{ y: 64 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {NAV_ITEMS.map(item => (
          <BottomTab key={item.key} item={item} isActive={active === item.key} onNavigate={onNavigate} />
        ))}
      </motion.nav>
    </>
  );
});

ParentNav.displayName = 'ParentNav';
