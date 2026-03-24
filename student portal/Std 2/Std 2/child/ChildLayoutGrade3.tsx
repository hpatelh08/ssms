/**
 * child/ChildLayoutGrade3.tsx
 * ─────────────────────────────────────────────────────
 * Grade 3 Student dashboard shell — Space-themed
 *
 * Screens:
 *  • home         → ChildHome (reused)
 *  • play         → PlayWorld (reused game center)
 *  • space-war    → SpaceWarPage (immersive)
 *  • solar-system → SolarSystemPage (immersive)
 *  • journey      → MilestoneJourney (immersive)
 */

import React, { useState, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../layout/AppLayout';
import { TopBar } from './TopBar';
import { StudentNavGrade3, type Grade3Screen } from './StudentNavGrade3';
import { ChildHome } from './ChildHome';
import { FloatingWorld } from '../components/background/FloatingWorld';
import CelebrationOverlay from './CelebrationOverlay';
import FoxMascot from './FoxMascot';
import { tw, pageTransition } from '../styles/theme';
import './child.css';

/* ── Lazy-loaded heavy screens ──────────────────── */
const PlayWorld        = React.lazy(() => import('./PlayWorld').then(m => ({ default: m.PlayWorld })));
const SpaceWarPage     = React.lazy(() => import('./SpaceWarPage'));
const SolarSystemPage  = React.lazy(() => import('./SolarSystemPage'));
const MilestoneJourney = React.lazy(() => import('./milestone/MilestoneJourney'));

const ScreenFallback: React.FC = () => (
  <div className="text-center py-12 text-purple-400 text-sm font-medium">
    Loading…
  </div>
);

const ChildShellGrade3: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Grade3Screen>('home');

  const handleNavigate = useCallback((screen: Grade3Screen) => {
    setActiveScreen(screen);
  }, []);

  const renderContent = () => {
    switch (activeScreen) {
      case 'home':
        return <ChildHome onNavigate={handleNavigate as any} />;
      case 'play':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <PlayWorld />
          </Suspense>
        );
      case 'space-war':
      case 'solar-system':
      case 'journey':
        return null; // immersive mode
      default:
        return null;
    }
  };

  /* ── Immersive mode: space-war, solar-system, journey ── */
  const isImmersive = activeScreen === 'space-war' || activeScreen === 'solar-system' || activeScreen === 'journey';

  if (isImmersive) {
    return (
      <>
        <Suspense fallback={<ScreenFallback />}>
          {activeScreen === 'space-war' && (
            <SpaceWarPage onBack={() => handleNavigate('home')} />
          )}
          {activeScreen === 'solar-system' && (
            <SolarSystemPage onBack={() => handleNavigate('home')} />
          )}
          {activeScreen === 'journey' && (
            <MilestoneJourney onBack={() => handleNavigate('home')} />
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
