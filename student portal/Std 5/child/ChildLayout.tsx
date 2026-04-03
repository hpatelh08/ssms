/**
 * child/ChildLayout.tsx
 * -----------------------------------------------------
 * Student dashboard shell - structurally identical to ParentLayout.
 *
 * Same skeleton:
 *  - min-h-screen pb-24 lg:pb-8 lg:pl-72 relative
 *  - FloatingWorld (shared parent component - same background)
 *  - Fixed glass-strong TopBar (h-20)
 *  - StudentNav (sidebar lg + bottom nav mobile)
 *  - Main content area with AnimatePresence transitions
 *  - CelebrationOverlay
 *
 * Removed: child FloatingWorld, Mascot, custom .layout/.main CSS.
 * Uses: Tailwind + framer-motion (same as parent).
 */

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../layout/AppLayout';
import { TopBar } from './TopBar';
import { StudentNav } from './StudentNav';
import { ChildHome } from './ChildHome';
import { FloatingWorld } from '../components/background/FloatingWorld';
import CelebrationOverlay from './CelebrationOverlay';
import FoxMascot from './FoxMascot';
import { pageTransition } from '../styles/theme';
import { useGlobalPlayTimer } from './GlobalTimerContext';
import './child.css';

const PlayWorld = React.lazy(() => import('./PlayWorld').then(m => ({ default: m.PlayWorld })));
const BrainBoostPage = React.lazy(() => import('./BrainBoostPage'));
const PuzzleZonePage = React.lazy(() => import('./PuzzleZonePage'));
const JourneyPage = React.lazy(() => import('./journey/JourneyPage'));

const ScreenFallback: React.FC = () => (
  <div className="text-center py-12 text-green-400 text-sm font-medium">
    Loading...
  </div>
);

export type ChildScreen = 'home' | 'play' | 'brain-boost' | 'puzzle-zone' | 'journey';

const ChildShell: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ChildScreen>('home');
  const { exitGame } = useGlobalPlayTimer();

  const handleNavigate = useCallback((screen: ChildScreen) => {
    if (screen !== 'play') {
      exitGame();
    }
    setActiveScreen(screen);
  }, [exitGame]);

  useEffect(() => {
    if (activeScreen !== 'play') {
      exitGame();
    }
  }, [activeScreen, exitGame]);

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
      case 'brain-boost':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <BrainBoostPage onBack={() => handleNavigate('home')} />
          </Suspense>
        );
      case 'puzzle-zone':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <PuzzleZonePage onBack={() => handleNavigate('home')} />
          </Suspense>
        );
      case 'journey':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <JourneyPage onBack={() => handleNavigate('home')} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
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
  );
};

const ChildLayout: React.FC = () => <ChildShell />;

export default ChildLayout;
