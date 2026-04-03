/**
 * child/StudentNav.tsx
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Premium Sidebar + Mobile Bottom Bar â€” Production-Grade EdTech UI
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

/* â”€â”€ Nav Items â”€â”€ */

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
    key: 'home', label: 'Home', icon: '\u{1F3E0}',
    accentColor: '#1598c7',
    activeBg: 'rgba(21,152,199,0.12)',
    activeGlow: 'rgba(21,152,199,0.16)',
  },
  {
    key: 'play', label: 'Games', icon: '\u{1F3AE}',
    accentColor: '#18b3a3',
    activeBg: 'rgba(24,179,163,0.12)',
    activeGlow: 'rgba(24,179,163,0.16)',
  },
  {
    key: 'funfacts', label: 'Fun Facts', icon: '🌟',
    accentColor: '#47b4e8',
    activeBg: 'rgba(71,180,232,0.12)',
    activeGlow: 'rgba(71,180,232,0.18)',
  },
  {
    key: 'puzzles', label: 'Brain Puzzles', icon: '🧩',
    accentColor: '#6bc9d8',
    activeBg: 'rgba(107,201,216,0.12)',
    activeGlow: 'rgba(107,201,216,0.18)',
  },
  {
    key: 'journey', label: 'Journey', icon: '🗺️',
    accentColor: '#1b78ab',
    activeBg: 'rgba(27,120,171,0.12)',
    activeGlow: 'rgba(27,120,171,0.18)',
  },
  {
    key: 'fillblanks', label: 'Fill in the Blanks', icon: '✍️',
    accentColor: '#ffae68',
    activeBg: 'rgba(255,174,104,0.14)',
    activeGlow: 'rgba(255,174,104,0.20)',
  },
];

/* â”€â”€ Sidebar Item (desktop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
        background: isActive ? 'linear-gradient(135deg, rgba(223,248,255,0.96), rgba(232,255,250,0.96))' : 'transparent',
        boxShadow: isActive ? `0 10px 24px ${item.activeGlow}, var(--shadow-soft)` : 'none',
        border: 'none',
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
          }}
          layoutId="sidebar-accent"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      {/* Icon â€” clean, no border, no stroke */}
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

/* â”€â”€ Bottom Tab (mobile) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

/* â”€â”€ Main StudentNav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface Props {
  active: ChildScreen;
  onNavigate: (screen: ChildScreen) => void;
}

export const StudentNav: React.FC<Props> = React.memo(({ active, onNavigate }) => (
  <>
    {/* â”€â”€ Desktop Sidebar (lg+) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
    <motion.aside
      className="hidden lg:flex w-[240px] shrink-0 flex-col z-30 overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: 240,
        background: 'var(--gradient-sidebar)',
        borderRadius: '0 30px 30px 0',
        boxShadow: '8px 0 38px rgba(37,118,156,0.12), 1px 0 0 rgba(255,255,255,0.75)',
        padding: '30px 20px',
        overflow: 'hidden',
      }}
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      {/* â”€â”€ Brand Header â”€â”€ */}
      <div style={{ padding: '0 8px', marginBottom: 36 }}>
        <div className="flex items-center gap-3">
          <motion.span
            style={{ fontSize: 30 }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >{'\u{1F30A}'}</motion.span>
          <div>
            <h2 className="sidebar-title" style={{ margin: 0 }}>
              My Playground
            </h2>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text-muted)', marginTop: 3, fontFamily: 'Nunito, sans-serif', letterSpacing: '0.3px' }}>
              Std 6 - Learning is fun!
            </p>
          </div>
        </div>
      </div>

      {/* â”€â”€ Nav Items â”€â”€ */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <SidebarItem
            key={item.key}
            item={item}
            isActive={active === item.key}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* â”€â”€ Bottom decorative â”€â”€ */}
      <div style={{
        marginTop: 'auto',
        padding: '16px 4px 0',
        borderTop: '1px solid rgba(149,221,243,0.35)',
      }}>
        <SidebarTimerPill />
      </div>
    </motion.aside>

    {/* â”€â”€ Mobile Bottom Bar (<lg) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
    <motion.nav
      className="fixed bottom-0 left-0 right-0 h-16 z-40 flex items-center justify-around px-2 lg:hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, var(--pastel-blue-soft) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(182,229,242,0.55)',
        boxShadow: '0 -8px 24px rgba(37,118,156,0.08)',
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


