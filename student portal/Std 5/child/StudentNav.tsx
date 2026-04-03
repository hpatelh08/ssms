/**
 * child/StudentNav.tsx
 * -----------------------------------------------------
 * Premium Sidebar + Mobile Bottom Bar - Production-Grade EdTech UI
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import type { ChildScreen } from './ChildLayout';
import { SidebarTimerPill } from './SidebarTimerPill';

interface NavItem {
  key: ChildScreen;
  label: string;
  icon: string;
  accentColor: string;
  activeBg: string;
  activeGlow: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'home', label: 'Home', icon: '🏠',
    accentColor: '#3f8f3a',
    activeBg: 'rgba(63,143,58,0.10)',
    activeGlow: 'rgba(63,143,58,0.22)',
  },
  {
    key: 'play', label: 'Games', icon: '🦊',
    accentColor: '#2f7f4c',
    activeBg: 'rgba(47,127,76,0.10)',
    activeGlow: 'rgba(47,127,76,0.22)',
  },
  {
    key: 'brain-boost', label: 'Brain Boost', icon: '⚛️',
    accentColor: '#8b6038',
    activeBg: 'rgba(139,96,56,0.10)',
    activeGlow: 'rgba(139,96,56,0.22)',
  },
  {
    key: 'puzzle-zone', label: 'Puzzle Zone', icon: '🌸',
    accentColor: '#c06a8f',
    activeBg: 'rgba(192,106,143,0.10)',
    activeGlow: 'rgba(192,106,143,0.24)',
  },
  {
    key: 'journey', label: 'Journey', icon: '🐦',
    accentColor: '#3b7fa8',
    activeBg: 'rgba(59,127,168,0.10)',
    activeGlow: 'rgba(59,127,168,0.22)',
  },
];

const SidebarItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  onNavigate: (screen: ChildScreen) => void;
}> = React.memo(({ item, isActive, onNavigate }) => {
  const handleClick = useCallback(() => onNavigate(item.key), [onNavigate, item.key]);

  return (
    <motion.button
      onClick={handleClick}
      className="relative w-full flex items-center gap-4 rounded-2xl text-left cursor-pointer overflow-hidden"
      style={{
        padding: '14px 18px',
        background: isActive ? 'linear-gradient(135deg, #dff2dc, #ebf8e4)' : 'transparent',
        boxShadow: isActive ? `0 4px 18px ${item.activeGlow}, var(--shadow-soft)` : 'none',
        border: 'none',
        borderRadius: 16,
        transition: 'all 0.25s ease',
      }}
      whileHover={isActive ? {} : { background: 'var(--sidebar-hover-bg)', x: 4, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.97 }}
      type="button"
    >
      {isActive && (
        <motion.div
          style={{
            position: 'absolute',
            left: 0,
            top: '16%',
            bottom: '16%',
            width: 4,
            borderRadius: '0 4px 4px 0',
            background: item.accentColor,
          }}
          layoutId="sidebar-accent"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      <span style={{
        fontSize: 24,
        lineHeight: 1,
        filter: isActive ? 'none' : 'grayscale(0.15)',
        transition: 'filter 0.2s ease',
      }}>
        {item.icon}
      </span>

      <span style={{
        fontSize: 15,
        fontWeight: isActive ? 800 : 600,
        color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
        letterSpacing: '0.3px',
        fontFamily: 'Nunito, sans-serif',
        transition: 'color 0.25s ease, font-weight 0.25s ease',
      }}>
        {item.label}
      </span>
    </motion.button>
  );
});
SidebarItem.displayName = 'SidebarItem';

const BottomTab: React.FC<{
  item: NavItem;
  isActive: boolean;
  onNavigate: (screen: ChildScreen) => void;
}> = React.memo(({ item, isActive, onNavigate }) => {
  const handleClick = useCallback(() => onNavigate(item.key), [onNavigate, item.key]);

  return (
    <motion.button
      onClick={handleClick}
      className="relative flex flex-col items-center justify-center gap-0.5 py-1 flex-1 cursor-pointer"
      whileTap={{ scale: 0.88 }}
      type="button"
    >
      {isActive && (
        <motion.div
          className="absolute -top-0.5 rounded-2xl"
          style={{
            width: 44, height: 44,
            background: item.activeBg,
          }}
          layoutId="mobile-tab-bg"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      <motion.span
        className="text-xl relative z-10"
        animate={isActive ? { scale: 1.15, y: -1 } : { scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {item.icon}
      </motion.span>

      <span style={{
        fontSize: 10,
        fontWeight: isActive ? 700 : 600,
        color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text-muted)',
        position: 'relative',
        zIndex: 10,
        fontFamily: 'Nunito, sans-serif',
        transition: 'color 0.2s ease',
      }}>
        {item.label}
      </span>
    </motion.button>
  );
});
BottomTab.displayName = 'BottomTab';

interface Props {
  active: ChildScreen;
  onNavigate: (screen: ChildScreen) => void;
}

export const StudentNav: React.FC<Props> = React.memo(({ active, onNavigate }) => (
  <>
    <motion.aside
      className="hidden lg:flex w-[240px] shrink-0 flex-col z-30"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: 240,
        background: 'var(--gradient-sidebar)',
        borderRadius: '0 30px 30px 0',
        boxShadow: '4px 0 32px rgba(79,134,83,0.16), 1px 0 0 rgba(255,255,255,0.65)',
        padding: '30px 20px',
        overflowX: 'hidden',
        overflowY: 'hidden',
      }}
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
    >
      <div style={{ padding: '0 8px', marginBottom: 36 }}>
        <div className="flex items-center gap-3">
          <motion.span
            style={{ fontSize: 30 }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🌿
          </motion.span>
          <div>
            <h2 className="sidebar-title" style={{ margin: 0 }}>
              My Playground
            </h2>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text-muted)', marginTop: 3, fontFamily: 'Nunito, sans-serif', letterSpacing: '0.3px' }}>
              Std 5 · Nature learning trail
            </p>
          </div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="hide-scrollbar">
        {NAV_ITEMS.map(item => (
          <SidebarItem
            key={item.key}
            item={item}
            isActive={active === item.key}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div style={{
        marginTop: 'auto',
        padding: '16px 4px 0',
        borderTop: '1px solid rgba(255,255,255,0.35)',
      }}>
        <SidebarTimerPill />
      </div>
    </motion.aside>

    <motion.nav
      className="fixed bottom-0 left-0 right-0 h-16 z-40 flex items-center justify-around px-2 lg:hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, var(--pastel-green-soft) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(189,218,178,0.45)',
        boxShadow: '0 -4px 24px rgba(79,134,83,0.12)',
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
));

StudentNav.displayName = 'StudentNav';
