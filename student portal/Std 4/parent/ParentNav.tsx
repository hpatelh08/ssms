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
import { useReadingBookTimer } from '../child/ReadingBookTimerContext';

/* ── Screen type ── */

export type ParentScreen = 'overview' | 'progress' | 'attendance' | 'ai-buddy' | 'books' | 'settings';

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
  { key: 'overview',    label: 'Overview',       sublabel: 'Dashboard',     icon: '📊', gradient: '-amber- -yellow-',    glowColor: 'rgba(99,102,241,0.20)',   accentColor: '#f59e0b', iconBg: 'rgba(99,102,241,0.10)' },
  { key: 'progress',    label: 'Progress',       sublabel: 'Academics',     icon: '📈', gradient: '-orange- -amber-',  glowColor: 'rgba(168,85,247,0.20)',   accentColor: '#a855f7', iconBg: 'rgba(168,85,247,0.10)' },
  { key: 'attendance',  label: 'Attendance',     sublabel: 'Tracking',      icon: '📅', gradient: '-emerald- -yellow-',     glowColor: 'rgba(6,182,212,0.20)',    accentColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.10)' },
  { key: 'ai-buddy',   label: 'AI Insights',    sublabel: 'Smart Help',    icon: '🧠', gradient: 'from-amber-400 to-orange-500',  glowColor: 'rgba(245,158,11,0.20)',   accentColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.10)' },
  { key: 'books',       label: 'Books',           sublabel: 'Library',       icon: '📚', gradient: 'from-rose-400 to-pink-500',    glowColor: 'rgba(244,63,94,0.20)',    accentColor: '#f43f5e', iconBg: 'rgba(244,63,94,0.10)' },
  { key: 'settings',    label: 'Settings',       sublabel: 'Preferences',   icon: '⚙️', gradient: 'from-slate-400 to-gray-500',    glowColor: 'rgba(100,116,139,0.15)',  accentColor: '#64748b', iconBg: 'rgba(100,116,139,0.08)' },
];

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
      className="relative w-full flex items-center gap-4 rounded-2xl text-left cursor-pointer overflow-hidden"
      style={{
        padding: '14px 18px',
        background: isActive ? 'linear-gradient(135deg, #e0dcff, #ece8ff)' : 'transparent',
        boxShadow: isActive ? `0 4px 18px ${item.glowColor}, var(--shadow-soft)` : 'none',
        border: 'none',
        borderRadius: 16,
        transition: 'all 0.25s ease',
      }}
      whileHover={!isActive ? { background: 'var(--sidebar-hover-bg)', x: 4, transition: { duration: 0.25 } } : {}}
      whileTap={{ scale: 0.97 }}
    >
      {/* Left accent stripe */}
      {isActive && (
        <motion.div
          className="absolute left-0 top-[16%] bottom-[16%] w-[4px] rounded-r-full"
          style={{
            background: item.accentColor,
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
        <span style={{ fontSize: isActive ? 18 : 16 }}>{item.icon}</span>
      </motion.div>

      {/* Label + sublabel */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <span style={{
          fontSize: 14, fontWeight: isActive ? 800 : 600,
          color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
          display: 'block', lineHeight: '18px',
          fontFamily: 'Nunito, sans-serif',
        }}>
          {item.label}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: isActive ? 'var(--sidebar-text-muted)' : '#9ca3af',
          display: 'block', lineHeight: '14px', marginTop: 1,
          fontFamily: 'Nunito, sans-serif',
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
        color: isActive ? '#3A3F9F' : '#92400e',
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

  /* ── Reading book timer ── */
  const { limitEnabled: readingLimitEnabled, remainingSeconds, isRunning: isReading } = useReadingBookTimer();
  const readingMins = Math.floor(remainingSeconds / 60);
  const readingSecs = remainingSeconds % 60;
  const readingFormatted = `${String(readingMins).padStart(2, '0')}:${String(readingSecs).padStart(2, '0')}`;

  return (
  <>
    {/* ── Desktop Sidebar ── */}
    <motion.aside
      className="hidden lg:flex w-[240px] shrink-0 flex-col z-30 overflow-hidden"
      style={{
        position: 'fixed',
        left: 0, top: 0,
        height: '100vh',
        width: 240,
        background: 'var(--gradient-sidebar)',
        borderRadius: '0 30px 30px 0',
        boxShadow: '4px 0 32px rgba(200,180,255,0.14), 1px 0 0 rgba(255,255,255,0.6)',
        padding: '30px 20px',
        overflow: 'hidden',
      }}
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <div style={{ padding: '0 8px', marginBottom: 30 }}>
        <div className="flex items-center gap-3">
          <motion.span
            style={{ fontSize: 28 }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            👨‍👩‍👧
          </motion.span>
          <div>
            <h2 className="sidebar-title" style={{ margin: 0 }}>
              Guardian Panel
            </h2>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text-muted)', marginTop: 3, fontFamily: 'Nunito, sans-serif', letterSpacing: '0.3px' }}>
              Std 4 · Analytics View
            </p>
          </div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.key}
            item={item}
            isActive={active === item.key}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Bottom status */}
      <div style={{
        marginTop: 'auto',
        padding: '16px 4px 0',
        borderTop: '1px solid rgba(255,255,255,0.35)',
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
            <p style={{ fontSize: 8, fontWeight: 500, color: '#92400e', margin: 0 }}>Real-time data active</p>
          </div>
        </div>
        {/* Real-time Clock */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.05)', borderRadius: 14,
          padding: '10px 14px', marginTop: 8,
        }}>
          <span style={{ fontSize: 14 }}>🕐</span>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#3A3F9F', margin: 0 }}>Current Time</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Reading Book Time */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: isReading ? 'rgba(16,185,129,0.07)' : 'rgba(244,114,182,0.05)',
          borderRadius: 14,
          padding: '10px 14px', marginTop: 8,
          border: isReading ? '1px solid rgba(16,185,129,0.15)' : '1px solid transparent',
          transition: 'all 0.3s',
        }}>
          <span style={{ fontSize: 14 }}>{isReading ? '📖' : '📚'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#3A3F9F', margin: 0 }}>Reading Time</p>
            {readingLimitEnabled ? (
              <>
                <p style={{
                  fontSize: 12, fontWeight: 700, margin: 0, fontVariantNumeric: 'tabular-nums',
                  color: isReading ? '#10B981' : '#F472B6',
                }}>
                  {readingFormatted} left
                </p>
                <p style={{ fontSize: 8, fontWeight: 500, color: '#92400e', margin: 0 }}>
                  {isReading ? 'Reading now…' : 'Limit set by parent'}
                </p>
              </>
            ) : (
              <p style={{ fontSize: 10, fontWeight: 500, color: '#A0AEC0', margin: 0 }}>No limit set</p>
            )}
          </div>
          {isReading && (
            <motion.div
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                flexShrink: 0,
              }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </motion.aside>

    {/* ── Mobile Bottom Bar ── */}
    <motion.nav
      className="fixed bottom-0 left-0 right-0 h-16 z-40 flex items-center justify-around px-2 lg:hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, var(--pastel-purple-soft) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(227,215,255,0.4)',
        boxShadow: '0 -4px 24px rgba(200,180,255,0.08)',
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
