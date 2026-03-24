/**
 * parent/ParentLayout.tsx
 * ─────────────────────────────────────────────────────
 * Magical parent dashboard shell — visually matches child/ChildLayout.
 *
 * Skeleton:
 *  • min-h-screen, FloatingWorld animated background
 *  • ParentTopBar (glass, pastel gradient)
 *  • ParentNav (glass sidebar + bottom nav)
 *  • Main area with spring-animated page transitions
 */

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParentTopBar } from './ParentTopBar';
import { ParentNav, type ParentScreen } from './ParentNav';
import { OverviewPage } from './pages/OverviewPage';
import { ProgressPage } from './pages/ProgressPage';
import { AttendancePage } from './pages/AttendancePage';
import { SettingsPage } from './pages/SettingsPage';
import { GameProgressPage } from './pages/GameProgressPage';
import { NCERTAssistantPage } from './pages/NCERTAssistantPage';
import { AiBuddyLearningZone } from './pages/AiBuddyLearningZone';
import { AiWorksheetGenerator } from './pages/AiWorksheetGenerator';
import { AiWeeklyReportEngine } from './pages/AiWeeklyReportEngine';
import { LessonVideoPlayer } from './pages/LessonVideoPlayer';
import { VideoListingPage } from './pages/VideoListingPage';
import { BooksPage } from './pages/BooksPage';
import { FloatingWorld } from '../components/background/FloatingWorld';
import { pageTransition } from '../styles/theme';
import { type BookEntry } from '../data/bookConfig';
import { type VideoEntry, type VideoSubject } from '../data/videoConfig';
import AIBuddyFloating from '../components/AIBuddyFloating';
import { ReportCardPage } from './pages/ReportCardPage';

/* ── Lazy-loaded immersive book reader ────────── */
const BookReaderPage       = React.lazy(() => import('./pages/BookReaderPage'));
const BrainBoostProgressPage = React.lazy(() => import('./pages/BrainBoostProgressPage'));
const PuzzleZoneProgressPage = React.lazy(() => import('./pages/PuzzleZoneProgressPage'));

/* ── Layout Shell ───────────────────────────────── */

const ParentShell: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ParentScreen>('overview');
  const [readerBook, setReaderBook] = useState<BookEntry | null>(null);
  const [aiSubScreen, setAiSubScreen] = useState<'hub' | 'ask' | 'worksheets' | 'weekly-report' | 'video' | 'videos'>('hub');
  const [videoState, setVideoState] = useState<{ video: VideoEntry; subject: VideoSubject } | null>(null);

  const handleNavigate = useCallback((screen: ParentScreen) => {
    setActiveScreen(screen);
    // Reset AI sub-screen whenever we navigate away or re-enter AI Insights
    if (screen === 'ai-buddy') {
      setAiSubScreen('hub');
    }
  }, []);

  const handleOpenBook = useCallback((book: BookEntry) => {
    setReaderBook(book);
  }, []);

  const handleCloseBook = useCallback(() => {
    setReaderBook(null);
  }, []);

  const handlePlayVideo = useCallback((video: VideoEntry, subject: VideoSubject) => {
    setVideoState({ video, subject });
    setAiSubScreen('video');
    // Reset scroll so the video player is immediately visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Auto-open Books tab when arriving from student Study Material card
  useEffect(() => {
    try {
      const signal = localStorage.getItem('ssms_navigate_to_books');
      if (signal) {
        const ts = parseInt(signal, 10);
        // Only honor if signal is < 5 seconds old
        if (Date.now() - ts < 5000) {
          setActiveScreen('books');
        }
        localStorage.removeItem('ssms_navigate_to_books');
      }
    } catch { /* ignore */ }
  }, []);

  /* Should the floating AI buddy be visible? Hide on Ask AI and Report pages */
  const showAIBuddy = !(
    (activeScreen === 'ai-buddy' && aiSubScreen === 'ask') ||
    activeScreen === 'report'
  );

  const handleAskAIBuddy = useCallback(() => {
    setActiveScreen('ai-buddy');
    setAiSubScreen('ask');
  }, []);

  const renderContent = () => {
    switch (activeScreen) {
      case 'overview':    return <OverviewPage />;
      case 'progress':    return <ProgressPage />;
      case 'games':       return <GameProgressPage />;
      case 'attendance':  return <AttendancePage />;
      case 'ai-buddy':
        if (aiSubScreen === 'video' && videoState) return <LessonVideoPlayer video={videoState.video} subject={videoState.subject} onBack={() => setAiSubScreen('videos')} onPlayVideo={handlePlayVideo} onAskAI={handleAskAIBuddy} />;
        if (aiSubScreen === 'videos') return <VideoListingPage onBack={() => setAiSubScreen('hub')} onPlayVideo={handlePlayVideo} />;
        if (aiSubScreen === 'ask') return <NCERTAssistantPage onBack={() => setAiSubScreen('hub')} onPlayVideo={handlePlayVideo} />;
        if (aiSubScreen === 'worksheets') return <AiWorksheetGenerator onBack={() => setAiSubScreen('hub')} />;
        if (aiSubScreen === 'weekly-report') return <AiWeeklyReportEngine onBack={() => setAiSubScreen('hub')} />;
        return <AiBuddyLearningZone
          onOpenAskAI={() => setAiSubScreen('ask')}
          onOpenVideos={() => setAiSubScreen('videos')}
          onOpenWorksheets={() => setAiSubScreen('worksheets')}
          onOpenWeeklyReport={() => setAiSubScreen('weekly-report')}
        />;
      case 'books':       return <BooksPage onNavigate={(s) => handleNavigate(s as ParentScreen)} onOpenBook={handleOpenBook} />;
      case 'brain-boost': return <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-sm text-gray-400">Loading…</p></div>}><BrainBoostProgressPage /></Suspense>;
      case 'puzzle-zone':  return <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-sm text-gray-400">Loading…</p></div>}><PuzzleZoneProgressPage /></Suspense>;
      case 'report':      return <ReportCardPage onBack={() => setActiveScreen('overview')} />;
      case 'settings':    return <SettingsPage />;
      default:            return null;
    }
  };

  /* ── Immersive mode: Book reader takes over the full viewport ── */
  if (readerBook) {
    return (
      <Suspense
        fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-100">
            <p className="text-sm text-gray-400 font-medium">Loading reader…</p>
          </div>
        }
      >
        <BookReaderPage book={readerBook} onBack={handleCloseBook} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-6 lg:pl-[240px] relative">
      <FloatingWorld />
      <ParentNav active={activeScreen} onNavigate={handleNavigate} />

      <div className="flex flex-col min-h-screen">
        <ParentTopBar onOpenSettings={() => handleNavigate('settings')} />

        <main className="relative z-10 px-4 lg:px-6 pb-8">
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
        </main>
      </div>

      {showAIBuddy && <AIBuddyFloating onAskAI={handleAskAIBuddy} />}
    </div>
  );
};

/**
 * Public entry-point for the parent dashboard.
 * Providers (Sound, Mascot, XP, Tree) are mounted at
 * the App root — ParentLayout is a pure rendering shell.
 */
export const ParentLayout: React.FC = () => <ParentShell />;
