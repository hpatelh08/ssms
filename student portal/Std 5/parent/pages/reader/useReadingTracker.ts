/**
 * parent/pages/reader/useReadingTracker.ts
 * ─────────────────────────────────────────────────────
 * Enhanced reading analytics tracker for the storybook reader.
 *
 * Tracks:
 *  • Pages read & time per page
 *  • Words clicked / vocabulary interactions
 *  • AI questions asked
 *  • Quiz results
 *  • Narration usage
 *  • Story mode vs reading mode time
 *
 * Data flows to readingInsights service for parent dashboard.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import {
  startReadingSession,
  endReadingSession,
  recordPageView,
  recordAIQuestion,
  recordQuizResult,
} from '../../../services/readingInsights';

/* ── Types ────────────────────────────────────── */

export interface ReadingStats {
  pagesRead: number;
  timeSpentMs: number;
  wordsClicked: number;
  questionsAsked: number;
  quizzesTaken: number;
  quizzesCorrect: number;
  narrationUsed: number;
  storyModeTimeMs: number;
  focusModeTimeMs: number;
}

const TRACKER_KEY = 'ssms_reader_live_stats';

/* ── Hook ─────────────────────────────────────── */

export function useReadingTracker(bookId: string, bookTitle: string) {
  const startTimeRef = useRef(Date.now());
  const pagesSeenRef = useRef(new Set<number>());
  const [stats, setStats] = useState<ReadingStats>({
    pagesRead: 0,
    timeSpentMs: 0,
    wordsClicked: 0,
    questionsAsked: 0,
    quizzesTaken: 0,
    quizzesCorrect: 0,
    narrationUsed: 0,
    storyModeTimeMs: 0,
    focusModeTimeMs: 0,
  });

  // Start session
  useEffect(() => {
    startReadingSession(bookId, bookTitle);
    startTimeRef.current = Date.now();

    return () => {
      endReadingSession();
      // Save final stats snapshot
      try {
        localStorage.setItem(
          `${TRACKER_KEY}_${bookId}`,
          JSON.stringify({
            ...stats,
            timeSpentMs: Date.now() - startTimeRef.current,
            lastAccessed: new Date().toISOString(),
          }),
        );
      } catch { /* ignore */ }
    };
  }, [bookId, bookTitle]);

  const trackPageView = useCallback(
    (pageNum: number, totalPages?: number) => {
      if (!pagesSeenRef.current.has(pageNum)) {
        pagesSeenRef.current.add(pageNum);
        recordPageView(pageNum, totalPages);
        setStats((s) => ({ ...s, pagesRead: pagesSeenRef.current.size }));
      }
    },
    [],
  );

  const trackWordClick = useCallback(() => {
    setStats((s) => ({ ...s, wordsClicked: s.wordsClicked + 1 }));
  }, []);

  const trackAIQuestion = useCallback(
    (question: string) => {
      recordAIQuestion(bookId, question);
      setStats((s) => ({ ...s, questionsAsked: s.questionsAsked + 1 }));
    },
    [bookId],
  );

  const trackQuizResult = useCallback(
    (correct: boolean, chapterId?: string) => {
      if (chapterId) {
        recordQuizResult({
          bookId,
          chapterId,
          chapterName: chapterId,
          score: correct ? 1 : 0,
          total: 1,
        });
      }
      setStats((s) => ({
        ...s,
        quizzesTaken: s.quizzesTaken + 1,
        quizzesCorrect: s.quizzesCorrect + (correct ? 1 : 0),
      }));
    },
    [bookId],
  );

  const trackNarrationUse = useCallback(() => {
    setStats((s) => ({ ...s, narrationUsed: s.narrationUsed + 1 }));
  }, []);

  const getElapsedTime = useCallback(() => {
    return Date.now() - startTimeRef.current;
  }, []);

  return {
    stats,
    trackPageView,
    trackWordClick,
    trackAIQuestion,
    trackQuizResult,
    trackNarrationUse,
    getElapsedTime,
  };
}
