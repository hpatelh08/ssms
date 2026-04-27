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
const GardenGame       = React.lazy(() => import('./garden/GardenGame'));
const ColorMagicPage   = React.lazy(() => import('./ColorMagicPage'));
const SpaceWarPage     = React.lazy(() => import('./SpaceWarPage'));
const SolarSystemPage  = React.lazy(() => import('./SolarSystemPage'));
const MilestoneJourney = React.lazy(() => import('./milestone/MilestoneJourney'));

const VALID_SCREENS = new Set<Grade3Screen>(['home', 'play', 'garden', 'color-magic', 'space-war', 'solar-system', 'journey']);

interface ScreenErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ScreenErrorBoundaryState {
  hasError: boolean;
}

class ScreenErrorBoundary extends React.Component<ScreenErrorBoundaryProps, ScreenErrorBoundaryState> {
  state: ScreenErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

const ScreenIssueFallback: React.FC<{ onHome: () => void }> = ({ onHome }) => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
  }}>
    <div style={{
      width: '100%',
      maxWidth: 520,
      borderRadius: 28,
      padding: '30px 28px',
      background: 'rgba(255,255,255,0.92)',
      border: '1px solid rgba(96,165,250,0.18)',
      boxShadow: '0 24px 60px rgba(59,130,246,0.12)',
    }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 900, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#2563eb' }}>
        Student section
      </p>
      <h2 style={{ margin: '10px 0 8px', fontSize: 24, lineHeight: 1.15, fontWeight: 900, color: '#1e3a8a' }}>
        This page had trouble loading
      </h2>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#4b5563' }}>
        The sidebar action opened, but the section did not render properly.
      </p>
      <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onHome}
          style={{
            border: 'none',
            borderRadius: 18,
            padding: '12px 18px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Go Home
        </button>
        <span style={{ alignSelf: 'center', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
          Try a hard refresh if it keeps happening.
        </span>
      </div>
    </div>
  </div>
);

const ScreenFallback: React.FC = () => (
  <div className="text-center py-12 text-purple-400 text-sm font-medium">
    Loading…
  </div>
);

const ChildShellGrade3: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Grade3Screen>('home');

  const handleNavigate = useCallback((screen: Grade3Screen) => {
    setActiveScreen(VALID_SCREENS.has(screen) ? screen : 'home');
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
      case 'garden':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <GardenGame />
          </Suspense>
        );
      case 'color-magic':
        return null; // rendered in immersive mode below
      case 'space-war':
      case 'solar-system':
      case 'journey':
        return null; // immersive mode
      default:
        return <ChildHome onNavigate={handleNavigate as any} />;
    }
  };

  /* ── Immersive mode: space-war, solar-system, journey ── */
  const isImmersive =
    activeScreen === 'color-magic' ||
    activeScreen === 'space-war' ||
    activeScreen === 'solar-system' ||
    activeScreen === 'journey';

  if (isImmersive) {
    return (
      <>
        <Suspense fallback={<ScreenFallback />}>
          {activeScreen === 'color-magic' && (
            <ColorMagicPage onBack={() => handleNavigate('home')} />
          )}
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
    <ScreenErrorBoundary fallback={<ScreenIssueFallback onHome={() => handleNavigate('home')} />}>
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
    </ScreenErrorBoundary>
  );
};

const ChildLayoutGrade3: React.FC = () => <ChildShellGrade3 />;

export default ChildLayoutGrade3;
