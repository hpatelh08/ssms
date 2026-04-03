/**
 * services/readingInsights.ts
 * ─────────────────────────────────────────────────────
 * Reading timer + analytics store used by the flipbook reader.
 *
 * Goals:
 *  - Start timing as soon as a reader opens.
 *  - Stop timing immediately when the reader closes.
 *  - Persist per-student, per-book sessions in localStorage.
 *  - Keep a clean API that can later sync to a backend.
 */

// ─── Types ────────────────────────────────────────────────

export type ReadingStopReason =
  | 'back'
  | 'refresh-or-close'
  | 'switch-book'
  | 'unmount'
  | 'stale-recovery';

export interface ReadingSession {
  sessionId: string;
  studentId: string;
  studentName: string;
  studentGrade?: number;
  bookId: string;
  bookTitle: string;
  bookSubject?: string;
  startedAt: string;
  endedAt?: string;
  durationMs: number;
  formattedDuration: string;
  stopReason?: ReadingStopReason;
  pagesViewed: number[];
  chaptersViewed: string[];
  syncStatus?: 'local-only' | 'pending' | 'synced' | 'failed';
}

export interface ActiveReadingSession {
  sessionId: string;
  studentId: string;
  studentName: string;
  studentGrade?: number;
  bookId: string;
  bookTitle: string;
  bookSubject?: string;
  startedAt: string;
  lastHeartbeatAt: string;
  pagesViewed: number[];
  chaptersViewed: string[];
}

export interface StartReadingTimerInput {
  studentId: string;
  studentName: string;
  studentGrade?: number;
  bookId: string;
  bookTitle: string;
  bookSubject?: string;
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
  streak: number;
}

// ─── Storage Keys ─────────────────────────────────────────

const SESSIONS_KEY = 'ssms_reading_sessions';
const QUIZZES_KEY = 'ssms_reading_quizzes';
const AI_KEY = 'ssms_reading_ai';
const ACTIVE_SESSION_KEY = 'ssms_active_reading_session';
const SESSION_CAP = 300;
const STALE_SESSION_MS = 30000;
export const READING_INSIGHTS_UPDATED_EVENT = 'ssms-reading-insights-updated';

function emitReadingInsightsUpdated(): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(READING_INSIGHTS_UPDATED_EVENT));
    }
  } catch {
    /* ignore */
  }
}

// ─── Generic helpers ──────────────────────────────────────

function loadArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveArray<T>(key: string, data: T[]): void {
  try {
    const trimmed = data.slice(-SESSION_CAP);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    /* ignore localStorage quota/private mode issues */
  }
}

function loadActiveSession(): ActiveReadingSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveReadingSession>;
    if (!parsed.sessionId || !parsed.studentId || !parsed.bookId || !parsed.bookTitle || !parsed.startedAt) {
      return null;
    }
    return {
      sessionId: parsed.sessionId,
      studentId: parsed.studentId,
      studentName: parsed.studentName ?? 'Student',
      studentGrade: parsed.studentGrade,
      bookId: parsed.bookId,
      bookTitle: parsed.bookTitle,
      bookSubject: parsed.bookSubject,
      startedAt: parsed.startedAt,
      lastHeartbeatAt: parsed.lastHeartbeatAt ?? parsed.startedAt,
      pagesViewed: Array.isArray(parsed.pagesViewed) ? parsed.pagesViewed : [],
      chaptersViewed: Array.isArray(parsed.chaptersViewed) ? parsed.chaptersViewed : [],
    };
  } catch {
    return null;
  }
}

function persistActiveSession(session: ActiveReadingSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

function buildEndedSession(
  active: ActiveReadingSession,
  endedAtMs: number,
  stopReason: ReadingStopReason,
): ReadingSession {
  const startedAtMs = new Date(active.startedAt).getTime();
  const durationMs = Math.max(0, endedAtMs - startedAtMs);
  return {
    sessionId: active.sessionId,
    studentId: active.studentId,
    studentName: active.studentName,
    studentGrade: active.studentGrade,
    bookId: active.bookId,
    bookTitle: active.bookTitle,
    bookSubject: active.bookSubject,
    startedAt: active.startedAt,
    endedAt: new Date(endedAtMs).toISOString(),
    durationMs,
    formattedDuration: getFormattedTime(durationMs),
    stopReason,
    pagesViewed: [...new Set(active.pagesViewed)].sort((a, b) => a - b),
    chaptersViewed: [...new Set(active.chaptersViewed)],
    syncStatus: getReadingSessionApiUrl() ? 'pending' : 'local-only',
  };
}

function getReadingSessionApiUrl(): string | undefined {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return env?.VITE_READING_SESSION_API_URL;
}

function isNavigatorWithBeacon(value: Navigator): value is Navigator & {
  sendBeacon: (url: string, data?: BodyInit | null) => boolean;
} {
  return typeof value.sendBeacon === 'function';
}

async function syncReadingSessionToApi(session: ReadingSession): Promise<void> {
  const apiUrl = getReadingSessionApiUrl();
  if (!apiUrl) return;

  const payload = JSON.stringify(session);

  try {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && isNavigatorWithBeacon(navigator)) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(apiUrl, blob);
      return;
    }

    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    });
  } catch {
    markSessionSyncStatus(session.sessionId, 'failed');
  }
}

function markSessionSyncStatus(sessionId: string, syncStatus: ReadingSession['syncStatus']): void {
  const sessions = loadReadingSessions();
  const next = sessions.map((session) => (
    session.sessionId === sessionId ? { ...session, syncStatus } : session
  ));
  saveArray(SESSIONS_KEY, next);
}

function isSameSessionContext(active: ActiveReadingSession, next: StartReadingTimerInput): boolean {
  return active.studentId === next.studentId && active.bookId === next.bookId;
}

function finalizeStaleActiveSession(active: ActiveReadingSession): void {
  const endedAtMs = new Date(active.lastHeartbeatAt).getTime() || Date.now();
  const session = buildEndedSession(active, endedAtMs, 'stale-recovery');
  persistActiveSession(null);
  saveReadingSession(session);
}

function migrateLegacySession(session: Partial<ReadingSession>): ReadingSession | null {
  if (!session.bookId || !session.bookTitle || !session.startedAt) {
    return null;
  }
  const durationMs = typeof session.durationMs === 'number' ? session.durationMs : 0;
  const endedAt = session.endedAt ?? new Date(new Date(session.startedAt).getTime() + durationMs).toISOString();
  return {
    sessionId: session.sessionId ?? `${session.bookId}_${new Date(session.startedAt).getTime()}`,
    studentId: session.studentId ?? 'legacy-student',
    studentName: session.studentName ?? 'Student',
    studentGrade: session.studentGrade,
    bookId: session.bookId,
    bookTitle: session.bookTitle,
    bookSubject: session.bookSubject,
    startedAt: session.startedAt,
    endedAt,
    durationMs,
    formattedDuration: session.formattedDuration ?? getFormattedTime(durationMs),
    stopReason: session.stopReason,
    pagesViewed: Array.isArray(session.pagesViewed) ? session.pagesViewed : [],
    chaptersViewed: Array.isArray(session.chaptersViewed) ? session.chaptersViewed : [],
    syncStatus: session.syncStatus ?? 'local-only',
  };
}

// ─── Timer API ────────────────────────────────────────────

/**
 * Formats milliseconds as hh:mm:ss for the live reader timer.
 */
export function getFormattedTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

/**
 * Starts a reading timer for a student/book pair.
 * If the same reader is opened twice, the existing active session is reused.
 * If another book is already active, that session is closed first.
 */
export function startReadingTimer(input: StartReadingTimerInput): ActiveReadingSession {
  const existing = loadActiveSession();
  const nowMs = Date.now();

  if (existing) {
    const staleMs = nowMs - new Date(existing.lastHeartbeatAt).getTime();
    if (staleMs > STALE_SESSION_MS) {
      finalizeStaleActiveSession(existing);
    } else if (isSameSessionContext(existing, input)) {
      return existing;
    } else {
      stopReadingTimer('switch-book');
    }
  }

  const startedAt = new Date(nowMs).toISOString();
  const active: ActiveReadingSession = {
    sessionId: `${input.studentId}_${input.bookId}_${nowMs}`,
    studentId: input.studentId,
    studentName: input.studentName,
    studentGrade: input.studentGrade,
    bookId: input.bookId,
    bookTitle: input.bookTitle,
    bookSubject: input.bookSubject,
    startedAt,
    lastHeartbeatAt: startedAt,
    pagesViewed: [],
    chaptersViewed: [],
  };

  persistActiveSession(active);
  return active;
}

/**
 * Stops the active reading timer and persists the finished session.
 */
export function stopReadingTimer(reason: ReadingStopReason = 'unmount'): ReadingSession | null {
  const active = loadActiveSession();
  if (!active) return null;

  const session = buildEndedSession(active, Date.now(), reason);
  persistActiveSession(null);
  return saveReadingSession(session);
}

/**
 * Persists a completed session locally and optionally posts it to an API.
 */
export function saveReadingSession(session: ReadingSession): ReadingSession {
  const sessions = loadReadingSessions();
  sessions.push({
    ...session,
    formattedDuration: getFormattedTime(session.durationMs),
  });
  saveArray(SESSIONS_KEY, sessions);
  emitReadingInsightsUpdated();

  void syncReadingSessionToApi(session).then(() => {
    if (getReadingSessionApiUrl()) {
      markSessionSyncStatus(session.sessionId, 'synced');
    }
  });

  return session;
}

/**
 * Updates the active session heartbeat so stale recovery does not over-count time.
 */
export function touchReadingTimer(): void {
  const active = loadActiveSession();
  if (!active) return;
  persistActiveSession({
    ...active,
    lastHeartbeatAt: new Date().toISOString(),
  });
}

export function getActiveReadingSession(): ActiveReadingSession | null {
  return loadActiveSession();
}

export function loadReadingSessions(): ReadingSession[] {
  return loadArray<Partial<ReadingSession>>(SESSIONS_KEY)
    .map(migrateLegacySession)
    .filter((session): session is ReadingSession => session !== null);
}

export function recordPageView(pageNum: number): void {
  const active = loadActiveSession();
  if (!active) return;
  if (active.pagesViewed.includes(pageNum)) return;
  persistActiveSession({
    ...active,
    lastHeartbeatAt: new Date().toISOString(),
    pagesViewed: [...active.pagesViewed, pageNum].sort((a, b) => a - b),
  });
}

export function recordChapterView(chapterName: string): void {
  const active = loadActiveSession();
  if (!active) return;
  if (active.chaptersViewed.includes(chapterName)) return;
  persistActiveSession({
    ...active,
    lastHeartbeatAt: new Date().toISOString(),
    chaptersViewed: [...active.chaptersViewed, chapterName],
  });
}

// ─── Compatibility wrappers for older reader code ────────

export function startReadingSession(
  bookId: string,
  bookTitle: string,
  student?: Pick<StartReadingTimerInput, 'studentId' | 'studentName' | 'studentGrade'>,
  bookSubject?: string,
): ActiveReadingSession {
  return startReadingTimer({
    studentId: student?.studentId ?? 'anonymous-student',
    studentName: student?.studentName ?? 'Student',
    studentGrade: student?.studentGrade,
    bookId,
    bookTitle,
    bookSubject,
  });
}

export function endReadingSession(reason: ReadingStopReason = 'unmount'): ReadingSession | null {
  return stopReadingTimer(reason);
}

// ─── Quiz Tracking ────────────────────────────────────────

export function recordQuizResult(result: Omit<QuizResult, 'completedAt'>): void {
  const quizzes = loadArray<QuizResult>(QUIZZES_KEY);
  quizzes.push({
    ...result,
    completedAt: new Date().toISOString(),
  });
  saveArray(QUIZZES_KEY, quizzes);
  emitReadingInsightsUpdated();
}

// ─── AI Tracking ──────────────────────────────────────────

export function recordAIQuestion(bookId: string, question: string, chapterId?: string): void {
  const interactions = loadArray<AIInteraction>(AI_KEY);
  interactions.push({
    bookId,
    chapterId,
    question,
    timestamp: new Date().toISOString(),
  });
  saveArray(AI_KEY, interactions);
  emitReadingInsightsUpdated();
}

// ─── Insights ─────────────────────────────────────────────

export function getReadingInsights(studentId?: string): ReadingInsights {
  const sessions = studentId
    ? loadReadingSessions().filter((session) => session.studentId === studentId)
    : loadReadingSessions();
  const quizzes = loadArray<QuizResult>(QUIZZES_KEY);
  const aiInteractions = loadArray<AIInteraction>(AI_KEY);

  const totalReadingTimeMs = sessions.reduce((sum, session) => sum + session.durationMs, 0);

  const allPages = new Set<string>();
  sessions.forEach((session) => {
    session.pagesViewed.forEach((pageNum) => allPages.add(`${session.bookId}_${pageNum}`));
  });

  const allChapters = new Set<string>();
  sessions.forEach((session) => {
    session.chaptersViewed.forEach((chapterName) => allChapters.add(`${session.bookId}_${chapterName}`));
  });

  const bookTime = new Map<string, number>();
  sessions.forEach((session) => {
    bookTime.set(session.bookTitle, (bookTime.get(session.bookTitle) ?? 0) + session.durationMs);
  });
  const favoriteBook = bookTime.size > 0
    ? [...bookTime.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : null;

  const totalQuizScore = quizzes.reduce((sum, quiz) => sum + (quiz.score / quiz.total) * 100, 0);
  const averageQuizScore = quizzes.length > 0 ? Math.round(totalQuizScore / quizzes.length) : 0;

  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyReadingMs = sessions
    .filter((session) => new Date(session.startedAt).getTime() > weekAgoMs)
    .reduce((sum, session) => sum + session.durationMs, 0);

  const uniqueDays = new Set(sessions.map((session) => session.startedAt.split('T')[0]));
  const sortedDays = [...uniqueDays].sort().reverse();
  let streak = 0;
  const today = new Date();
  for (const day of sortedDays) {
    const expectedDay = new Date(today);
    expectedDay.setDate(today.getDate() - streak);
    if (day === expectedDay.toISOString().split('T')[0]) {
      streak += 1;
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
 * Keeps the old compact formatter for cards that only need a short summary.
 */
export function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  return `${hrs}h ${mins}m`;
}

