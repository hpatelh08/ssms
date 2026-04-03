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

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../layout/AppLayout';
import { TopBar } from './TopBar';
import { StudentNav } from './StudentNav';
import { ChildHome } from './ChildHome';
import { FloatingWorld } from '../components/background/FloatingWorld';
import CelebrationOverlay from './CelebrationOverlay';
import FoxMascot from './FoxMascot';
import { tw, pageTransition } from '../styles/theme';
import { useGlobalPlayTimer } from './GlobalTimerContext';
import { JOURNEY_ACHIEVEMENT_UNLOCKED_EVENT } from './journey/journeyProgress';
import './child.css'; // kept for celebration styles

/* ── Lazy-loaded heavy screens ──────────────────── */
const PlayWorld = React.lazy(() => import('./PlayWorld').then(m => ({ default: m.PlayWorld })));
const OddOneOutGame = React.lazy(() => import('./OddOneOutGame'));
const WordBuilderGame = React.lazy(() => import('./WordBuilderGame'));
const JourneyPage = React.lazy(() => import('./journey/JourneyPage'));


/** Lightweight spinner shown while lazy chunks load. */
const ScreenFallback: React.FC = () => (
  <div className="text-center py-12 text-purple-400 text-sm font-medium">
    Loading…
  </div>
);

/** Screens that trigger the timer when active. */
const GAME_SCREENS: ChildScreen[] = ['odd-one-out', 'word-builder'];

/** Shown instead of any game screen when playtime has expired. */
const TimeUpContent: React.FC = () => (
  <div style={{
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', textAlign: 'center', padding: '32px 16px',
  }}>
    <motion.div
      initial={{ scale: 0.72, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 28, padding: '52px 52px',
        border: '1px solid rgba(99,102,241,0.2)',
        boxShadow: '0 16px 48px rgba(79,70,229,0.1)',
        maxWidth: 400, width: '100%',
      }}
    >
      <motion.div
        style={{ fontSize: 72, lineHeight: 1, marginBottom: 20 }}
        animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        ⏰
      </motion.div>
      <h2 style={{
        color: '#4f46e5', fontSize: 24, fontWeight: 900,
        margin: '0 0 12px', letterSpacing: 0.3,
      }}>
        Time Limit Reached!
      </h2>
      <p style={{
        color: '#6366f1', fontSize: 15, fontWeight: 600,
        margin: '0 0 8px', lineHeight: 1.7,
      }}>
        Please come back tomorrow.
      </p>
      <p style={{ color: '#818cf8', fontSize: 12, fontWeight: 500, margin: 0 }}>
        Your progress has been saved! 🌟
      </p>
    </motion.div>
  </div>
);

export type ChildScreen = 'home' | 'play' | 'odd-one-out' | 'word-builder' | 'journey' | 'garden' | 'color-magic';

/**
 * Inner shell — owns navigation state.
 * CelebrationOverlay sits outside screen-switch so it
 * persists across navigations.
 */
const ChildShell: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ChildScreen>('home');
  const { startTimer, pauseTimer, isExpired } = useGlobalPlayTimer();

  const handleNavigate = useCallback((screen: ChildScreen) => {
    setActiveScreen(screen);
  }, []);

  // Start timer on game screens, pause when on home / menu
  useEffect(() => {
    if (GAME_SCREENS.includes(activeScreen)) {
      startTimer();
    } else {
      pauseTimer();
    }
  }, [activeScreen, startTimer, pauseTimer]);

  useEffect(() => {
    const handleJourneyUnlocked = () => {
      setActiveScreen('journey');
    };

    window.addEventListener(JOURNEY_ACHIEVEMENT_UNLOCKED_EVENT, handleJourneyUnlocked);
    return () => {
      window.removeEventListener(JOURNEY_ACHIEVEMENT_UNLOCKED_EVENT, handleJourneyUnlocked);
    };
  }, []);

  const renderContent = () => {
    switch (activeScreen) {
      case 'home':
        return <ChildHome onNavigate={handleNavigate} />;
      case 'play':
        return isExpired ? <TimeUpContent /> : (
          <Suspense fallback={<ScreenFallback />}>
            <PlayWorld />
          </Suspense>
        );
      case 'odd-one-out':
        return isExpired ? <TimeUpContent /> : (
          <Suspense fallback={<ScreenFallback />}>
            <OddOneOutGame onBack={() => handleNavigate('home')} />
          </Suspense>
        );
      case 'word-builder':
        return isExpired ? <TimeUpContent /> : (
          <Suspense fallback={<ScreenFallback />}>
            <WordBuilderGame onBack={() => handleNavigate('home')} />
          </Suspense>
        );
      case 'journey':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <JourneyPage
              onBack={() => handleNavigate('home')}
              onNavigateToPlay={() => handleNavigate('play')}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };

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
