/**
 * parent/ParentLayout.tsx
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Magical parent dashboard shell â€” visually matches child/ChildLayout.
 *
 * Skeleton:
 *  â€¢ min-h-screen, FloatingWorld animated background
 *  â€¢ ParentTopBar (glass, pastel gradient)
 *  â€¢ ParentNav (glass sidebar + bottom nav)
 *  â€¢ Main area with spring-animated page transitions
 */

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../layout/AppLayout';
import { ParentTopBar } from './ParentTopBar';
import { ParentNav, type ParentScreen } from './ParentNav';
import { OverviewPage } from './pages/OverviewPage';
import { ProgressPage } from './pages/ProgressPage';
import { AttendancePage } from './pages/AttendancePage';
import { MessagesPage } from './pages/MessagesPage';
import LeavePage from './pages/LeavePage';
import { SettingsPage } from './pages/SettingsPage';
import { GameProgressPage } from './pages/GameProgressPage';
import { NCERTAssistantPage } from './pages/NCERTAssistantPage';
import { AiBuddyLearningZone } from './pages/AiBuddyLearningZone';
import { AiWorksheetGenerator } from './pages/AiWorksheetGenerator';
import { AiWeeklyReportEngine } from './pages/AiWeeklyReportEngine';
import { LessonVideoPlayer } from './pages/LessonVideoPlayer';
import { VideoListingPage } from './pages/VideoListingPage';
import { BooksPage } from './pages/BooksPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { StudyMaterialsPage } from './pages/StudyMaterialsPage';
import { FloatingWorld } from '../components/background/FloatingWorld';
import { pageTransition } from '../styles/theme';
import { type BookEntry } from '../data/bookConfig';
import { type VideoEntry, type VideoSubject } from '../data/videoConfig';
import AIBuddyFloating from '../components/AIBuddyFloating';
import { ReportCardPage } from './pages/ReportCardPage';

/* â”€â”€ Lazy-loaded immersive book reader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const BookReaderPage = React.lazy(() => import('./pages/BookReaderPage'));

/* â”€â”€ Layout Shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

  /* Should the floating AI buddy be visible? Hide on Ask AI page */
  const showAIBuddy = !(activeScreen === 'ai-buddy' && aiSubScreen === 'ask');

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
      case 'assignments': return <AssignmentsPage />;
      case 'study-materials': return <StudyMaterialsPage />;
      case 'report':      return <ReportCardPage onBack={() => setActiveScreen('overview')} />;
      case 'messages':    return <MessagesPage />;
      case 'leave':       return <LeavePage />;
      case 'settings':    return <SettingsPage />;
      default:            return null;
    }
  };

  /* â”€â”€ Immersive mode: Book reader takes over the full viewport â”€â”€ */
  if (readerBook) {
    return (
      <Suspense
        fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-100">
            <p className="text-sm text-gray-400 font-medium">Loading readerâ€¦</p>
          </div>
        }
      >
        <BookReaderPage book={readerBook} onBack={handleCloseBook} />
      </Suspense>
    );
  }

  return (
    <AppLayout
      background={<FloatingWorld />}
      sidebar={<ParentNav active={activeScreen} onNavigate={handleNavigate} />}
      topbar={<ParentTopBar onOpenSettings={() => handleNavigate('settings')} />}
      overlay={showAIBuddy ? <AIBuddyFloating onAskAI={handleAskAIBuddy} /> : null}
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

/**
 * Public entry-point for the parent dashboard.
 * Providers (Sound, Mascot, XP, Tree) are mounted at
 * the App root â€” ParentLayout is a pure rendering shell.
 */
export const ParentLayout: React.FC = () => <ParentShell />;





