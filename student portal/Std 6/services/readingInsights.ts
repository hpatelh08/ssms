/**
 * services/readingInsights.ts
 * ─────────────────────────────────────────────────────
 * Tracks reading activity and provides parent insights.
 *
 * Stores:
 *  - Time spent reading (per book, per session)
 *  - Pages viewed
 *  - Chapters explored
 *  - Quiz scores
 *  - AI questions asked
 *
 * All data persisted in localStorage.
 */

// ─── Types ────────────────────────────────────────────────

export interface ReadingSession {
  bookId: string;
  bookTitle: string;
  startedAt: string;
  endedAt?: string;
  durationMs: number;
  pagesViewed: number[];
  chaptersViewed: string[];
}

export interface QuizResult {
  bookId: string;
  chapterId: string;
  chapterName: string;
  score: number;
  total: number;
  completedAt: string;
}

export interface AIInteraction {
  bookId: string;
  chapterId?: string;
  question: string;
  timestamp: string;
}

export interface ReadingInsights {
  totalReadingTimeMs: number;
  totalSessions: number;
  totalPagesViewed: number;
  totalChaptersExplored: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  totalAIQuestions: number;
  favoriteBook: string | null;
  recentSessions: ReadingSession[];
  quizResults: QuizResult[];
  weeklyReadingMs: number;
  streak: number; // consecutive days with reading
}

export interface BookReadingProgress {
  bookId: string;
  bookTitle: string;
  totalPages: number;
  pagesViewed: number[];
  lastPageViewed: number;
  completionPercent: number;
  updatedAt: string;
}

// ─── Storage Keys ─────────────────────────────────────────

const SESSIONS_KEY = 'ssms_reading_sessions';
const QUIZZES_KEY = 'ssms_reading_quizzes';
const AI_KEY = 'ssms_reading_ai';
const ACTIVE_SESSION_KEY = 'ssms_active_reading_session';
const BOOK_PROGRESS_KEY = 'ssms_reading_book_progress';

// ─── Helpers ──────────────────────────────────────────────

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save<T>(key: string, data: T[]): void {
  try {
    const json = JSON.stringify(data);
    // Keep under 1MB per key
    if (json.length < 1024 * 1024) {
      localStorage.setItem(key, json);
    } else {
      // Trim oldest entries
      const trimmed = data.slice(-200);
      localStorage.setItem(key, JSON.stringify(trimmed));
    }
  } catch { /* ignore */ }
}

function loadBookProgressMap(): Record<string, BookReadingProgress> {
  try {
    const raw = localStorage.getItem(BOOK_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveBookProgressMap(data: Record<string, BookReadingProgress>): void {
  try {
    localStorage.setItem(BOOK_PROGRESS_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function updateBookReadingProgress(
  bookId: string,
  bookTitle: string,
  totalPages: number,
  pageNum: number,
): void {
  if (!bookId || totalPages < 1 || pageNum < 1) return;

  const all = loadBookProgressMap();
  const existing = all[bookId];
  const pagesViewed = new Set<number>(existing?.pagesViewed || []);
  pagesViewed.add(pageNum);

  const normalizedTotalPages = Math.max(existing?.totalPages || 0, totalPages, pageNum);
  const uniquePagesViewed = [...pagesViewed].sort((a, b) => a - b);
  const rawPercent = normalizedTotalPages > 0
    ? Math.round((uniquePagesViewed.length / normalizedTotalPages) * 100)
    : 0;

  all[bookId] = {
    bookId,
    bookTitle,
    totalPages: normalizedTotalPages,
    pagesViewed: uniquePagesViewed,
    lastPageViewed: Math.max(existing?.lastPageViewed || 0, pageNum),
    completionPercent: uniquePagesViewed.length > 0 ? Math.max(1, Math.min(100, rawPercent)) : 0,
    updatedAt: new Date().toISOString(),
  };

  saveBookProgressMap(all);
}

export function getBookReadingProgress(bookId: string): BookReadingProgress | null {
  if (!bookId) return null;
  const all = loadBookProgressMap();
  return all[bookId] || null;
}

// ─── Session Tracking ─────────────────────────────────────

let activeSession: {
  bookId: string;
  bookTitle: string;
  startTime: number;
  pagesViewed: Set<number>;
  chaptersViewed: Set<string>;
} | null = null;

/**
 * Start a new reading session for a book.
 */
export function startReadingSession(bookId: string, bookTitle: string): void {
  // End any existing session first
  endReadingSession();

  activeSession = {
    bookId,
    bookTitle,
    startTime: Date.now(),
    pagesViewed: new Set(),
    chaptersViewed: new Set(),
  };

  // Save active session indicator for crash recovery
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({
      bookId, bookTitle, startTime: activeSession.startTime,
    }));
  } catch { /* ignore */ }
}

/**
 * Record a page view in the current session.
 */
export function recordPageView(pageNum: number): void {
  if (activeSession) {
    activeSession.pagesViewed.add(pageNum);
  }
}

/**
 * Record a chapter explored in the current session.
 */
export function recordChapterView(chapterName: string): void {
  if (activeSession) {
    activeSession.chaptersViewed.add(chapterName);
  }
}

/**
 * End the current reading session and save it.
 */
export function endReadingSession(): void {
  if (!activeSession) return;

  const durationMs = Date.now() - activeSession.startTime;

  // Only save if session was at least 5 seconds
  if (durationMs >= 5000) {
    const session: ReadingSession = {
      bookId: activeSession.bookId,
      bookTitle: activeSession.bookTitle,
      startedAt: new Date(activeSession.startTime).toISOString(),
      endedAt: new Date().toISOString(),
      durationMs,
      pagesViewed: [...activeSession.pagesViewed],
      chaptersViewed: [...activeSession.chaptersViewed],
    };

    const sessions = load<ReadingSession>(SESSIONS_KEY);
    sessions.push(session);
    save(SESSIONS_KEY, sessions);
  }

  activeSession = null;
  localStorage.removeItem(ACTIVE_SESSION_KEY);
}

// ─── Quiz Tracking ────────────────────────────────────────

export function recordQuizResult(result: Omit<QuizResult, 'completedAt'>): void {
  const quizzes = load<QuizResult>(QUIZZES_KEY);
  quizzes.push({
    ...result,
    completedAt: new Date().toISOString(),
  });
  save(QUIZZES_KEY, quizzes);
}

// ─── AI Tracking ──────────────────────────────────────────

export function recordAIQuestion(bookId: string, question: string, chapterId?: string): void {
  const interactions = load<AIInteraction>(AI_KEY);
  interactions.push({
    bookId,
    chapterId,
    question,
    timestamp: new Date().toISOString(),
  });
  save(AI_KEY, interactions);
}

// ─── Insights ─────────────────────────────────────────────

export function getReadingInsights(): ReadingInsights {
  const sessions = load<ReadingSession>(SESSIONS_KEY);
  const quizzes = load<QuizResult>(QUIZZES_KEY);
  const aiInteractions = load<AIInteraction>(AI_KEY);

  // Total time
  const totalReadingTimeMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);

  // Total pages (unique across all sessions)
  const allPages = new Set<string>();
  sessions.forEach(s => s.pagesViewed.forEach(p => allPages.add(`${s.bookId}_${p}`)));

  // Total chapters
  const allChapters = new Set<string>();
  sessions.forEach(s => s.chaptersViewed.forEach(c => allChapters.add(`${s.bookId}_${c}`)));

  // Favorite book
  const bookTime = new Map<string, number>();
  sessions.forEach(s => {
    bookTime.set(s.bookTitle, (bookTime.get(s.bookTitle) || 0) + s.durationMs);
  });
  const favoriteBook = bookTime.size > 0
    ? [...bookTime.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Average quiz score
  const totalQuizScore = quizzes.reduce((sum, q) => sum + (q.score / q.total) * 100, 0);
  const averageQuizScore = quizzes.length > 0 ? Math.round(totalQuizScore / quizzes.length) : 0;

  // Weekly reading time
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyReadingMs = sessions
    .filter(s => new Date(s.startedAt).getTime() > weekAgo)
    .reduce((sum, s) => sum + s.durationMs, 0);

  // Reading streak
  const uniqueDays = new Set(
    sessions.map(s => new Date(s.startedAt).toISOString().split('T')[0])
  );
  const sortedDays = [...uniqueDays].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let expectedDay = new Date(today);
  for (const day of sortedDays) {
    const dayStr = expectedDay.toISOString().split('T')[0];
    if (day === dayStr) {
      streak++;
      expectedDay.setDate(expectedDay.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    totalReadingTimeMs,
    totalSessions: sessions.length,
    totalPagesViewed: allPages.size,
    totalChaptersExplored: allChapters.size,
    totalQuizzesTaken: quizzes.length,
    averageQuizScore,
    totalAIQuestions: aiInteractions.length,
    favoriteBook,
    recentSessions: sessions.slice(-10).reverse(),
    quizResults: quizzes.slice(-20).reverse(),
    weeklyReadingMs,
    streak,
  };
}

/**
 * Format milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  return `${hrs}h ${mins}m`;
}
