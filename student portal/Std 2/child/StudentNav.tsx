/**
 * child/StudentNav.tsx
 * ─────────────────────────────────────────────────────
 * Premium Sidebar + Mobile Bottom Bar — Production-Grade EdTech UI
 *
 * Sidebar:
 *  Width: 240px, fixed 100vh, soft pastel gradient
 *  Rounded right corners, soft shadow
 *  Clean SVG-style icons (emoji), no black borders
 *  Active: soft bg highlight + left accent bar (4px) + subtle glow
 *  Items: 14px padding, 10px gap
 *
 * Mobile: Fixed bottom bar with 5 icon tabs.
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import type { ChildScreen } from './ChildLayout';
import { SidebarTimerPill } from './SidebarTimerPill';

/* ── Nav Items ── */

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
    accentColor: '#5bb7c7',
    activeBg: 'rgba(224,248,252,0.92)',
    activeGlow: 'rgba(91,183,199,0.24)',
  },
  {
    key: 'play', label: 'Games', icon: '🎮',
    accentColor: '#6dcfb9',
    activeBg: 'rgba(229,251,244,0.9)',
    activeGlow: 'rgba(109,207,185,0.24)',
  },
  {
    key: 'garden', label: 'Garden', icon: '🌺',
    accentColor: '#88d7b7',
    activeBg: 'rgba(236,252,246,0.9)',
    activeGlow: 'rgba(136,215,183,0.24)',
  },
  {
    key: 'save-ocean', label: 'Save the Ocean', icon: '🌊',
    accentColor: '#48bfd8',
    activeBg: 'rgba(223,247,252,0.94)',
    activeGlow: 'rgba(72,191,216,0.26)',
  },
  {
    key: 'count-fish', label: 'Count the Fish', icon: '🐟',
    accentColor: '#58c9b8',
    activeBg: 'rgba(228,250,246,0.92)',
    activeGlow: 'rgba(88,201,184,0.24)',
  },
  {
    key: 'journey', label: 'Journey', icon: '🗺️',
    accentColor: '#8bb7e8',
    activeBg: 'rgba(232,242,255,0.92)',
    activeGlow: 'rgba(139,183,232,0.24)',
  },
];

/* ── Sidebar Item (desktop) ─────────────────────── */

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
        background: isActive
          ? 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(228,247,251,0.94) 62%, rgba(238,252,248,0.96))'
          : 'transparent',
        boxShadow: isActive
          ? `inset 0 1px 0 rgba(255,255,255,0.95), 0 6px 18px ${item.activeGlow}, var(--shadow-soft)`
          : 'none',
        border: isActive ? '1px solid rgba(157,217,228,0.48)' : '1px solid transparent',
        borderRadius: 16,
        transition: 'all 0.25s ease',
      }}
      whileHover={isActive ? {} : { background: 'var(--sidebar-hover-bg)', x: 4, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Left accent bar (active) */}
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
            boxShadow: `0 0 12px ${item.activeGlow}`,
          }}
          layoutId="sidebar-accent"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      {/* Icon — clean, no border, no stroke */}
      <span style={{
        fontSize: 24,
        lineHeight: 1,
        filter: isActive ? 'none' : 'grayscale(0.15)',
        transition: 'filter 0.2s ease',
      }}>
        {item.icon}
      </span>

      {/* Label */}
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

/* ── Bottom Tab (mobile) ────────────────────────── */

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

/* ── Main StudentNav ────────────────────────────── */

interface Props {
  active: ChildScreen;
  onNavigate: (screen: ChildScreen) => void;
}

export const StudentNav: React.FC<Props> = React.memo(({ active, onNavigate }) => (
  <>
    {/* ── Desktop Sidebar (lg+) ──────────────────── */}
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
        boxShadow: '10px 0 38px rgba(104,178,194,0.16), 1px 0 0 rgba(255,255,255,0.8), inset -1px 0 0 rgba(182,225,232,0.4)',
        padding: '30px 20px',
        overflowX: 'hidden',
        overflowY: 'hidden',
      }}
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      {/* ── Brand Header ── */}
      <div style={{ padding: '0 8px', marginBottom: 36 }}>
        <div className="flex items-center gap-3">
          <motion.span
            style={{ fontSize: 30 }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🌟
          </motion.span>
          <div>
            <h2 className="sidebar-title" style={{ margin: 0 }}>
              My Playground
            </h2>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text-muted)', marginTop: 3, fontFamily: 'Nunito, sans-serif', letterSpacing: '0.3px' }}>
              Std 2 · Learning is fun!
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav Items ── */}
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

      {/* ── Bottom decorative ── */}
      <div style={{
        marginTop: 'auto',
        padding: '16px 4px 0',
        borderTop: '1px solid rgba(182,225,232,0.5)',
      }}>
        <SidebarTimerPill />
      </div>
    </motion.aside>

    {/* ── Mobile Bottom Bar (<lg) ────────────────── */}
    <motion.nav
      className="fixed bottom-0 left-0 right-0 h-16 z-40 flex items-center justify-around px-2 lg:hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(250,255,255,0.95) 0%, rgba(230,247,250,0.96) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(177,223,231,0.46)',
        boxShadow: '0 -8px 24px rgba(104,178,194,0.1)',
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
