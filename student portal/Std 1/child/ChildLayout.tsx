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
import { type BookEntry } from '../data/bookConfig';
import BookReaderPage from '../parent/pages/BookReaderPage';
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
const BooksPage = React.lazy(() => import('../parent/pages/BooksPage').then(m => ({ default: m.BooksPage })));


/** Lightweight spinner shown while lazy chunks load. */
const ScreenFallback: React.FC = () => (
  <div className="text-center py-12 text-purple-400 text-sm font-medium">
    Loading…
  </div>
);

export type ChildScreen = 'home' | 'play' | 'books' | 'color-magic' | 'garden' | 'journey';

const VALID_SCREENS = new Set<ChildScreen>(['home', 'play', 'books', 'color-magic', 'garden', 'journey']);

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
      border: '1px solid rgba(129,140,248,0.18)',
      boxShadow: '0 24px 60px rgba(99,102,241,0.12)',
    }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 900, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#8b5cf6' }}>
        Student section
      </p>
      <h2 style={{ margin: '10px 0 8px', fontSize: 24, lineHeight: 1.15, fontWeight: 900, color: '#312e81' }}>
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
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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

/**
 * Inner shell — owns navigation state.
 * CelebrationOverlay sits outside screen-switch so it
 * persists across navigations.
 */
const ChildShell: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ChildScreen>('home');
  const [readerBook, setReaderBook] = useState<BookEntry | null>(null);

  const handleNavigate = useCallback((screen: ChildScreen) => {
    setActiveScreen(VALID_SCREENS.has(screen) ? screen : 'home');
  }, []);

  const handleOpenBook = useCallback((book: BookEntry) => {
    setReaderBook(book);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCloseBookReader = useCallback(() => {
    setReaderBook(null);
    setActiveScreen('books');
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
      case 'books':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <BooksPage onNavigate={(s) => handleNavigate(s as ChildScreen)} onOpenBook={handleOpenBook} />
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
        return <ChildHome onNavigate={handleNavigate} />;
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

/**
 * Public entry-point for the child playground.
 * Providers (Sound, Celebration, Mascot, XP) are
 * mounted at the App root — ChildLayout is now
 * a pure shell with no provider nesting.
 */
const ChildLayout: React.FC = () => <ChildShell />;

export default ChildLayout;
