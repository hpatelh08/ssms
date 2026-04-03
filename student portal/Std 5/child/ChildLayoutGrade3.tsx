/**
 * child/ChildLayoutGrade3.tsx
 * ─────────────────────────────────────────────────────
 * Grade 5 Student dashboard shell — Space-themed
 *
 * Screens:
 *  • home         → ChildHome (reused)
 *  • play         → PlayWorld (reused game center)
 *  • brain-boost  → BrainBoostPage (immersive)
 *  • puzzle-zone  → PuzzleZonePage (immersive)
 */

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../layout/AppLayout';
import { TopBar } from './TopBar';
import { StudentNavGrade3, type Grade3Screen } from './StudentNavGrade3';
import { ChildHome } from './ChildHome';
import { FloatingWorld } from '../components/background/FloatingWorld';
import CelebrationOverlay from './CelebrationOverlay';
import FoxMascot from './FoxMascot';
import { tw, pageTransition } from '../styles/theme';
import { useGlobalPlayTimer } from './GlobalTimerContext';
import './child.css';

/* ── Lazy-loaded heavy screens ──────────────────── */
const PlayWorld        = React.lazy(() => import('./PlayWorld').then(m => ({ default: m.PlayWorld })));
const BrainBoostPage   = React.lazy(() => import('./BrainBoostPage'));
const PuzzleZonePage   = React.lazy(() => import('./PuzzleZonePage'));

const ScreenFallback: React.FC = () => (
  <div className="text-center py-12 text-green-400 text-sm font-medium">
    Loading…
  </div>
);

const ChildShellGrade3: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Grade3Screen>('home');
  const { exitGame } = useGlobalPlayTimer();

  const handleNavigate = useCallback((screen: Grade3Screen) => {
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
      case 'puzzle-zone':
        return null; // immersive mode
      default:
        return null;
    }
  };

  /* ── Immersive mode: brain-boost, puzzle-zone ── */
  const isImmersive = activeScreen === 'brain-boost' || activeScreen === 'puzzle-zone';

  if (isImmersive) {
    return (
      <>
        <Suspense fallback={<ScreenFallback />}>
          {activeScreen === 'brain-boost' && (
            <BrainBoostPage onBack={() => handleNavigate('home')} />
          )}
          {activeScreen === 'puzzle-zone' && (
            <PuzzleZonePage onBack={() => handleNavigate('home')} />
          )}
        </Suspense>
        <CelebrationOverlay />
        <FoxMascot />
      </>
    );
  }

  return (
    <AppLayout
      background={<FloatingWorld />}
      sidebar={<StudentNavGrade3 active={activeScreen} onNavigate={handleNavigate} />}
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

const ChildLayoutGrade3: React.FC = () => <ChildShellGrade3 />;

export default ChildLayoutGrade3;
