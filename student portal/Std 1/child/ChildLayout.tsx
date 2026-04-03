/**
 * child/ChildLayout.tsx
 * ─────────────────────────────────────────────────────
 * Student dashboard shell — structurally identical to ParentLayout.
 *
 * Same skeleton:
 *  • min-h-screen pb-24 lg:pb-8 lg:pl-72 relative
 *  • FloatingWorld (shared parent component — same background)
 *  • Fixed glass-strong TopBar (h-20)
 *  • StudentNav (sidebar lg + bottom nav mobile)
 *  • Main content area with AnimatePresence transitions
 *  • CelebrationOverlay
 *
 * Removed: child FloatingWorld, Mascot, custom .layout/.main CSS.
 * Uses: Tailwind + framer-motion (same as parent).
 */

import React, { useState, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../layout/AppLayout';
import { TopBar } from './TopBar';
import { StudentNav } from './StudentNav';
import { ChildHome } from './ChildHome';
import { FloatingWorld } from '../components/background/FloatingWorld';
import CelebrationOverlay from './CelebrationOverlay';
import FoxMascot from './FoxMascot';
import { tw, pageTransition } from '../styles/theme';
import './child.css'; // kept for celebration styles

/* ── Lazy-loaded heavy screens ──────────────────── */
const PlayWorld       = React.lazy(() => import('./PlayWorld').then(m => ({ default: m.PlayWorld })));
const ColorMagicPage  = React.lazy(() => import('./ColorMagicPage'));
const GardenGame      = React.lazy(() => import('./garden/GardenGame'));
const MilestoneJourney = React.lazy(() => import('./milestone/MilestoneJourney'));


/** Lightweight spinner shown while lazy chunks load. */
const ScreenFallback: React.FC = () => (
  <div className="text-center py-12 text-purple-400 text-sm font-medium">
    Loading…
  </div>
);

export type ChildScreen = 'home' | 'play' | 'color-magic' | 'garden' | 'journey';

/**
 * Inner shell — owns navigation state.
 * CelebrationOverlay sits outside screen-switch so it
 * persists across navigations.
 */
const ChildShell: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ChildScreen>('home');

  const handleNavigate = useCallback((screen: ChildScreen) => {
    setActiveScreen(screen);
  }, []);

  const renderContent = () => {
    switch (activeScreen) {
      case 'home':
        return <ChildHome onNavigate={handleNavigate} />;
      case 'play':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <PlayWorld />
          </Suspense>
        );
      case 'color-magic':
        return null; // rendered in immersive mode below
      case 'garden':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <GardenGame />
          </Suspense>
        );
      case 'journey':
        return null; // rendered in immersive mode below
      default:
        return null;
    }
  };

  /* ── Immersive mode: journey & color-magic take over the full viewport ── */
  const isImmersive = activeScreen === 'journey' || activeScreen === 'color-magic';

  if (isImmersive) {
    return (
      <>
        <Suspense fallback={<ScreenFallback />}>
          {activeScreen === 'journey' && (
            <MilestoneJourney onBack={() => handleNavigate('home')} />
          )}
          {activeScreen === 'color-magic' && (
            <ColorMagicPage onBack={() => handleNavigate('home')} />
          )}
        </Suspense>
        <CelebrationOverlay />
        <FoxMascot />
      </>
    );
  }

  return (
    <>
    <AppLayout
      background={<FloatingWorld />}
      sidebar={<StudentNav active={activeScreen} onNavigate={handleNavigate} />}
      topbar={<TopBar />}
      overlay={<><CelebrationOverlay /><FoxMascot /></>}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScreen}
          initial={pageTransition.initial}
          animate={pageTransition.animate}
          exit={pageTransition.exit}
          transition={pageTransition.transition}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </AppLayout>
    </>
  );
};

/**
 * Public entry-point for the child playground.
 * Providers (Sound, Celebration, Mascot, XP) are
 * mounted at the App root — ChildLayout is now
 * a pure shell with no provider nesting.
 */
const ChildLayout: React.FC = () => <ChildShell />;

export default ChildLayout;
