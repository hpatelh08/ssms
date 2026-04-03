import React, { useCallback } from 'react';
import type { ChildScreen } from './ChildLayout';
import './child.css';

interface Props {
  active: ChildScreen;
  onNavigate: (screen: ChildScreen) => void;
}

const TABS: { key: ChildScreen; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'play', label: 'Games', icon: '🎮' },
  { key: 'garden', label: 'Garden', icon: '🌺' },
  { key: 'color-magic', label: 'Color', icon: '🎨' },
];

/** Individual tab — memo'd to avoid re-render when sibling tabs change. */
const NavTab: React.FC<{
  tab: typeof TABS[number];
  isActive: boolean;
  onNavigate: (screen: ChildScreen) => void;
}> = React.memo(({ tab, isActive, onNavigate }) => {
  const handleClick = useCallback(
    () => onNavigate(tab.key),
    [onNavigate, tab.key],
  );

  return (
    <button
      onClick={handleClick}
      className={`nav-tab${isActive ? ' nav-tab--active' : ''}`}
    >
      <span className={`nav-icon${isActive ? ' nav-icon--active' : ''}`}>
        {tab.icon}
      </span>
      {tab.label}
    </button>
  );
});
NavTab.displayName = 'NavTab';

export const BottomNav: React.FC<Props> = React.memo(({ active, onNavigate }) => (
  <nav className="bottomnav">
    {TABS.map(tab => (
      <NavTab
        key={tab.key}
        tab={tab}
        isActive={active === tab.key}
        onNavigate={onNavigate}
      />
    ))}
  </nav>
));

BottomNav.displayName = 'BottomNav';
