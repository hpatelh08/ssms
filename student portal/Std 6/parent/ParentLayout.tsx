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
import AppLayout from '../layout/AppLayout';
import { ParentTopBar } from './ParentTopBar';
import { ParentNav, type ParentScreen } from './ParentNav';
import { useAuth } from '../auth/AuthContext';
import { OverviewPage } from './pages/OverviewPage';
import { ProgressPage } from './pages/ProgressPage';
import { AttendancePage } from './pages/AttendancePage';
import { GardenGrowthPage } from './pages/GardenGrowthPage';
import { SettingsPage } from './pages/SettingsPage';
import { ExamsMarksPage } from './pages/ExamsMarksPage';
import { NCERTAssistantPage } from './pages/NCERTAssistantPage';
import { AiBuddyLearningZone } from './pages/AiBuddyLearningZone';
import { AiWorksheetGenerator } from './pages/AiWorksheetGenerator';
import { AiWeeklyReportEngine } from './pages/AiWeeklyReportEngine';
import { LessonVideoPlayer } from './pages/LessonVideoPlayer';
import { VideoListingPage } from './pages/VideoListingPage';
import { BooksPage } from './pages/BooksPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { StudyMaterialsPage } from './pages/StudyMaterialsPage';
import { MessagesPage } from './pages/MessagesPage';
import LeavePage from './pages/LeavePage';
import BookReaderPage from './pages/BookReaderPage';
import { FloatingWorld } from '../components/background/FloatingWorld';
import { pageTransition } from '../styles/theme';
import { type VideoEntry, type VideoSubject } from '../data/videoConfig';
import { type BookEntry } from '../data/bookConfig';
import AIBuddyFloating from '../components/AIBuddyFloating';
import { useGlobalPlayTimer } from '../context/GlobalTimerContext';

const FillBlanksParentReport = React.lazy(() => import('./pages/FillBlanksParentReport'));
const BrainPuzzleParentReport = React.lazy(() => import('./pages/BrainPuzzleParentReport'));
const FunFactsParentReport = React.lazy(() => import('./pages/FunFactsParentReport'));

/* ── Layout Shell ───────────────────────────────── */

const ParentShell: React.FC = () => {
  const { setRole } = useAuth();
  const { readLimitEnabled, readIsExpired } = useGlobalPlayTimer();
  const [activeScreen, setActiveScreen] = useState<ParentScreen>('overview');
  const [aiSubScreen, setAiSubScreen] = useState<'hub' | 'ask' | 'worksheets' | 'weekly-report' | 'video' | 'videos'>('hub');
  const [videoState, setVideoState] = useState<{ video: VideoEntry; subject: VideoSubject } | null>(null);
  const [readerBook, setReaderBook] = useState<BookEntry | null>(null);

  const handleNavigate = useCallback((screen: ParentScreen) => {
    setActiveScreen(screen);
    // Reset AI sub-screen whenever we navigate away or re-enter AI Insights
    if (screen === 'ai-buddy') {
      setAiSubScreen('hub');
    }
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

  const handleOpenBook = useCallback((book: BookEntry) => {
    if (readLimitEnabled && readIsExpired) {
      window.alert('Read time limit reached for today. Ask parent to reset Read Time Limit in Settings.');
      return;
    }
    setReaderBook(book);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [readLimitEnabled, readIsExpired]);

  const handleCloseBookReader = useCallback(() => {
    setReaderBook(null);
    setActiveScreen('books');
  }, []);

  const renderContent = () => {
    switch (activeScreen) {
      case 'overview':    return <OverviewPage />;
      case 'progress':    return <ProgressPage />;
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
      case 'exams': return <ExamsMarksPage />;
      case 'exams-marks': return <ExamsMarksPage />;
      case 'messages':    return <MessagesPage />;
      case 'leave':       return <LeavePage />;
      case 'garden':      return (
        <Suspense fallback={<div style={{textAlign:'center',padding:40}}>Loading…</div>}>
          <BrainPuzzleParentReport />
        </Suspense>
      );
      case 'fillblanks':  return (
        <Suspense fallback={<div style={{textAlign:'center',padding:40}}>Loading…</div>}>
          <FillBlanksParentReport />
        </Suspense>
      );
      case 'funfacts':    return (
        <Suspense fallback={<div style={{textAlign:'center',padding:40}}>Loading…</div>}>
          <FunFactsParentReport />
        </Suspense>
      );
      case 'settings':    return <SettingsPage />;
      default:            return null;
    }
  };

  if (readerBook) {
    return <BookReaderPage book={readerBook} onBack={handleCloseBookReader} />;
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
 * the App root — ParentLayout is a pure rendering shell.
 */
export const ParentLayout: React.FC = () => <ParentShell />;





