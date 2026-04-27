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
import { type BookEntry } from '../data/bookConfig';
import BookReaderPage from '../parent/pages/BookReaderPage';
import { FloatingWorld } from '../components/background/FloatingWorld';
import CelebrationOverlay from './CelebrationOverlay';
import FoxMascot from './FoxMascot';
import { pageTransition } from '../styles/theme';
import { useGlobalPlayTimer } from './GlobalTimerContext';
import './child.css';

const PlayWorld = React.lazy(() => import('./PlayWorld').then(m => ({ default: m.PlayWorld })));
const ColorMagicPage = React.lazy(() => import('./ColorMagicPage'));
const BrainBoostPage = React.lazy(() => import('./BrainBoostPage'));
const PuzzleZonePage = React.lazy(() => import('./PuzzleZonePage'));
const JourneyPage = React.lazy(() => import('./journey/JourneyPage'));
const BooksPage = React.lazy(() => import('../parent/pages/BooksPage').then(m => ({ default: m.BooksPage })));

const ScreenFallback: React.FC = () => (
  <div className="text-center py-12 text-green-400 text-sm font-medium">
    Loading...
  </div>
);

export type ChildScreen = 'home' | 'books' | 'play' | 'color-magic' | 'brain-boost' | 'puzzle-zone' | 'journey';

const VALID_SCREENS = new Set<ChildScreen>(['home', 'books', 'play', 'color-magic', 'brain-boost', 'puzzle-zone', 'journey']);

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

const ChildShell: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ChildScreen>('home');
  const [readerBook, setReaderBook] = useState<BookEntry | null>(null);
  const { exitGame } = useGlobalPlayTimer();

  const handleNavigate = useCallback((screen: ChildScreen) => {
    if (screen !== 'play') {
      exitGame();
    }
    setActiveScreen(VALID_SCREENS.has(screen) ? screen : 'home');
  }, [exitGame]);

  const handleOpenBook = useCallback((book: BookEntry) => {
    setReaderBook(book);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCloseBookReader = useCallback(() => {
    setReaderBook(null);
    setActiveScreen('books');
  }, []);

  useEffect(() => {
    if (activeScreen !== 'play') {
      exitGame();
    }
  }, [activeScreen, exitGame]);

  const renderContent = () => {
    switch (activeScreen) {
      case 'home':
        return <ChildHome onNavigate={handleNavigate} />;
      case 'books':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <BooksPage onNavigate={(s) => handleNavigate(s as ChildScreen)} onOpenBook={handleOpenBook} />
          </Suspense>
        );
      case 'play':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <PlayWorld />
          </Suspense>
        );
      case 'color-magic':
        return null; // rendered in immersive mode below
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
        return <ChildHome onNavigate={handleNavigate} />;
    }
  };

  if (activeScreen === 'color-magic') {
    return (
      <>
        <Suspense fallback={<ScreenFallback />}>
          <ColorMagicPage onBack={() => handleNavigate('home')} />
        </Suspense>
        <CelebrationOverlay />
        <FoxMascot />
      </>
    );
  }

  if (readerBook) {
    return <BookReaderPage book={readerBook} onBack={handleCloseBookReader} />;
  }

  return (
    <ScreenErrorBoundary fallback={<ScreenIssueFallback onHome={() => handleNavigate('home')} />}>
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
    </ScreenErrorBoundary>
  );
};

const ChildLayout: React.FC = () => <ChildShell />;

export default ChildLayout;
