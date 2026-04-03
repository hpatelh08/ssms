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
import { SettingsPage } from './pages/SettingsPage';
import { GameProgressPage } from './pages/GameProgressPage';
import { NCERTAssistantPage } from './pages/NCERTAssistantPage';
import { AiBuddyLearningZone } from './pages/AiBuddyLearningZone';
import { AiWorksheetGenerator } from './pages/AiWorksheetGenerator';
import { AiWeeklyReportEngine } from './pages/AiWeeklyReportEngine';
import { LessonVideoPlayer } from './pages/LessonVideoPlayer';
import { VideoListingPage } from './pages/VideoListingPage';
import { BooksPage } from './pages/BooksPage';
import { MessagesPage } from './pages/MessagesPage';
import BookReaderPage from './pages/BookReaderPage';
import { pageTransition } from '../styles/theme';
import { type VideoEntry, type VideoSubject } from '../data/videoConfig';
import type { BookEntry } from '../data/bookConfig';
import AIBuddyFloating from '../components/AIBuddyFloating';
import { ReportCardPage } from './pages/ReportCardPage';
import { SpaceShellBackground } from '../child/SpaceShellBackground';
import './parent.css';
const SpaceWarProgressPage = React.lazy(() => import('./pages/SpaceWarProgressPage'));
const EcoSystemProgressPage = React.lazy(() => import('./pages/EcoSystemProgressPage'));

/* â”€â”€ Layout Shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const ParentShell: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ParentScreen>('overview');
  const [aiSubScreen, setAiSubScreen] = useState<'hub' | 'ask' | 'worksheets' | 'weekly-report' | 'video' | 'videos'>('hub');
  const [videoState, setVideoState] = useState<{ video: VideoEntry; subject: VideoSubject } | null>(null);
  const [activeBook, setActiveBook] = useState<BookEntry | null>(null);

  const handleNavigate = useCallback((screen: ParentScreen) => {
    setActiveScreen(screen);
    // Reset AI sub-screen whenever we navigate away or re-enter AI Insights
    if (screen === 'ai-buddy') {
      setAiSubScreen('hub');
    }
    if (screen !== 'books') {
      setActiveBook(null);
    }
  }, []);

  const handlePlayVideo = useCallback((video: VideoEntry, subject: VideoSubject) => {
    setVideoState({ video, subject });
    setAiSubScreen('video');
    // Reset scroll so the video player is immediately visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenBook = useCallback((book: BookEntry) => {
    setActiveScreen('books');
    setActiveBook(book);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isReaderMode = activeScreen === 'books' && !!activeBook;

  /* Should the floating AI buddy be visible? Hide on Ask AI page and book reading flow */
  const showAIBuddy = !(activeScreen === 'ai-buddy' && aiSubScreen === 'ask') && activeScreen !== 'books';

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
      case 'books':
        return <BooksPage onOpenBook={handleOpenBook} />;
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
      case 'space-war':    return <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-sm text-gray-400">Loadingâ€¦</p></div>}><SpaceWarProgressPage /></Suspense>;
      case 'eco-system': return <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-sm text-gray-400">Loadingâ€¦</p></div>}><EcoSystemProgressPage /></Suspense>;
      case 'report':      return <ReportCardPage onBack={() => setActiveScreen('overview')} />;
      case 'messages':    return <MessagesPage />;
      case 'settings':    return <SettingsPage />;
      default:            return null;
    }
  };

  if (isReaderMode && activeBook) {
    return (
      <div className="parent-space-theme">
        <BookReaderPage book={activeBook} onBack={() => setActiveBook(null)} />
      </div>
    );
  }

  return (
    <div className="parent-space-theme">
      <AppLayout
        background={<SpaceShellBackground />}
        sidebar={<ParentNav active={activeScreen} onNavigate={handleNavigate} />}
        topbar={<ParentTopBar onOpenSettings={() => setActiveScreen('settings')} />}
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
    </div>
  );
};

/**
 * Public entry-point for the parent dashboard.
 * Providers (Sound, Mascot, XP) are mounted at
 * the App root â€” ParentLayout is a pure rendering shell.
 */
export const ParentLayout: React.FC = () => <ParentShell />;

