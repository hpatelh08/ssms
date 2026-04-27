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
import { type BookEntry } from '../data/bookConfig';
import { FloatingWorld } from '../components/background/FloatingWorld';
import CelebrationOverlay from './CelebrationOverlay';
import FoxMascot from './FoxMascot';
import { BooksPage } from '../parent/pages/BooksPage';
import BookReaderPage from '../parent/pages/BookReaderPage';
import FunFactsPage from './FunFactsPage';
import BrainPuzzlePage from './BrainPuzzlePage';
import JourneyPage from './JourneyPage';
import { tw, pageTransition } from '../styles/theme';
import './child.css'; // kept for celebration styles

type SubjectType = 'arcade' | 'maths' | 'english' | 'fillblanks';

interface MiniLevelProgress {
  completed?: boolean;
}

interface DifficultyProgress {
  miniLevels?: Record<string, MiniLevelProgress>;
}

interface GameProgress {
  easy?: DifficultyProgress;
  intermediate?: DifficultyProgress;
  difficult?: DifficultyProgress;
}

type GameMasteryStore = Record<string, GameProgress>;

interface PendingAchievementState {
  achievement_no: number;
  subject_type: SubjectType;
  required_levels: number;
  boxes_opened?: number;
}

const PENDING_ACHIEVEMENT_KEY = 'journey_pending_achievement_v1';
const LEVELS_PER_ACHIEVEMENT = 50;
const ARCADE_ACHIEVEMENT_COUNT = 10;
const MATHS_ACHIEVEMENT_COUNT = 60;
const ENGLISH_ACHIEVEMENT_COUNT = 96;

const ARCADE_START = 1;
const MATHS_START = ARCADE_START + ARCADE_ACHIEVEMENT_COUNT;
const ENGLISH_START = MATHS_START + MATHS_ACHIEVEMENT_COUNT;
const FILLBLANKS_START = ENGLISH_START + ENGLISH_ACHIEVEMENT_COUNT;

function getSubjectChapterNo(achievementNo: number, subject: SubjectType): number {
  if (subject === 'arcade') return Math.max(1, achievementNo - (ARCADE_START - 1));
  if (subject === 'maths') return Math.max(1, achievementNo - (MATHS_START - 1));
  if (subject === 'english') return Math.max(1, achievementNo - (ENGLISH_START - 1));
  return Math.max(1, achievementNo - (FILLBLANKS_START - 1));
}

function requiredLevelsForPending(pending: PendingAchievementState): number {
  const chapterNo = getSubjectChapterNo(pending.achievement_no, pending.subject_type);
  const nextBox = Math.min(5, (pending.boxes_opened ?? 0) + 1);
  const chapterBase = (chapterNo - 1) * LEVELS_PER_ACHIEVEMENT;
  return chapterBase + (nextBox * 10);
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function countCompletedMiniLevels(dp?: DifficultyProgress): number {
  if (!dp?.miniLevels) return 0;
  return Object.values(dp.miniLevels).filter(level => level?.completed).length;
}

function countCompletedLevelsForSubject(store: GameMasteryStore, subject: 'arcade' | 'maths' | 'english'): number {
  const prefix = `${subject}_`;
  let total = 0;

  Object.entries(store).forEach(([key, game]) => {
    if (!key.startsWith(prefix)) return;

    total += countCompletedMiniLevels(game?.easy);
    total += countCompletedMiniLevels(game?.intermediate);
    total += countCompletedMiniLevels(game?.difficult);
  });

  return total;
}

function countCompletedFillBlanksLevels(): number {
  const progress = safeParse<Array<{ level?: number }>>(localStorage.getItem('ssms_fillblanks_progress'), []);
  const unique = new Set<number>();

  progress.forEach(entry => {
    if (typeof entry?.level === 'number' && entry.level > 0) {
      unique.add(entry.level);
    }
  });

  return unique.size;
}

function getCompletedLevelsForSubjectType(subject: SubjectType): number {
  if (subject === 'fillblanks') {
    return countCompletedFillBlanksLevels();
  }

  const store = safeParse<GameMasteryStore>(localStorage.getItem('gameMastery_v2'), {});
  return countCompletedLevelsForSubject(store, subject);
}

/* ── Lazy-loaded heavy screens ──────────────────── */
const PlayWorld       = React.lazy(() => import('./PlayWorld').then(m => ({ default: m.PlayWorld })));
const ColorMagicPage  = React.lazy(() => import('./ColorMagicPage'));
const GardenGame      = React.lazy(() => import('./garden/GardenGame'));
/** Lightweight spinner shown while lazy chunks load. */
const ScreenFallback: React.FC = () => (
  <div className="text-center py-12 text-purple-400 text-sm font-medium">
    Loading…
  </div>
);

export type ChildScreen =
  | 'home'
  | 'books'
  | 'play'
  | 'funfacts'
  | 'puzzles'
  | 'journey'
  | 'fillblanks'
  | 'garden';

const VALID_SCREENS = new Set<ChildScreen>(['home', 'books', 'play', 'funfacts', 'puzzles', 'journey', 'fillblanks', 'garden']);

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

/**
 * Inner shell — owns navigation state.
 * CelebrationOverlay sits outside screen-switch so it
 * persists across navigations.
 */
const ChildShell: React.FC = () => {
  const getInitialScreen = (): ChildScreen => {
    try {
      const params = new URLSearchParams(window.location.search);
      const screen = params.get('screen') as ChildScreen | null;
      const allowed: ChildScreen[] = ['home', 'books', 'play', 'funfacts', 'puzzles', 'journey', 'fillblanks', 'garden'];
      return screen && allowed.includes(screen) ? screen : 'home';
    } catch {
      return 'home';
    }
  };

  const [activeScreen, setActiveScreen] = useState<ChildScreen>(getInitialScreen);
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

  // Allow parent panel to deep-link into a specific student screen (best-effort, short-lived signal).
  useEffect(() => {
    try {
      const signal = localStorage.getItem('ssms_navigate_to_fillblanks');
      if (signal) {
        const ts = parseInt(signal, 10);
        if (!Number.isNaN(ts) && Date.now() - ts < 5000) {
          setActiveScreen('fillblanks');
        }
        localStorage.removeItem('ssms_navigate_to_fillblanks');
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('screen', activeScreen);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore URL sync issues
    }
  }, [activeScreen]);

  useEffect(() => {
    if (activeScreen !== 'play' && activeScreen !== 'fillblanks') return;

    const checkPendingAchievement = () => {
      const pending = safeParse<PendingAchievementState | null>(localStorage.getItem(PENDING_ACHIEVEMENT_KEY), null);
      if (!pending) return;

      const completedLevels = getCompletedLevelsForSubjectType(pending.subject_type);
      if (completedLevels < requiredLevelsForPending(pending)) return;

      setActiveScreen('journey');
    };

    checkPendingAchievement();
    const timer = window.setInterval(checkPendingAchievement, 1200);
    return () => window.clearInterval(timer);
  }, [activeScreen]);

  const FillBlanksPage = React.lazy(() => import('./FillBlanksPage'));
  const renderContent = () => {
    switch (activeScreen) {
      case 'home':
        return <ChildHome onNavigate={handleNavigate} />;
      case 'books':
        return <BooksPage onNavigate={(s) => handleNavigate(s as ChildScreen)} onOpenBook={handleOpenBook} />;
      case 'play':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <PlayWorld />
          </Suspense>
        );
      case 'funfacts':
        return <FunFactsPage />;
      case 'puzzles':
        return <BrainPuzzlePage />;
      case 'journey':
        return <JourneyPage onNavigate={handleNavigate} />;
      case 'fillblanks':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <FillBlanksPage />
          </Suspense>
        );
      // case 'color-magic':
      //   return null; // rendered in immersive mode below
      case 'garden':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <GardenGame />
          </Suspense>
        );
      default:
        return <ChildHome onNavigate={handleNavigate} />;
    }
  };

  /* ── Immersive mode: color-magic takes over the full viewport ── */
  const isImmersive = activeScreen === 'color-magic';
  const isJourneyOnly = activeScreen === 'journey';

  if (isImmersive) {
    return (
      <>
        <Suspense fallback={<ScreenFallback />}>
          {activeScreen === 'color-magic' && (
            <ColorMagicPage onBack={() => handleNavigate('home')} />
          )}
        </Suspense>
        <CelebrationOverlay />
        <FoxMascot />
      </>
    );
  }

  if (isJourneyOnly) {
    return (
      <>
        <FloatingWorld />
        <div className="relative z-10">
          <JourneyPage onNavigate={handleNavigate} />
        </div>
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
