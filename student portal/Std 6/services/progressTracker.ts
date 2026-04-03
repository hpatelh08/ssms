/**
 * services/progressTracker.ts
 * ─────────────────────────────────────────────────────
 * Advanced learning progress tracking system.
 *
 * Tracks per-chapter:
 *  - Completion % (learn, practice, quiz, play, revision)
 *  - Stars earned (0-3 per activity)
 *  - Time spent
 *  - Quiz scores with adaptive difficulty
 *  - Incorrect answers for revision
 *  - Subject strength analysis
 *  - AI-generated recommendations
 *
 * All data persisted in localStorage.
 */

import { logAction } from '../utils/auditLog';
import { getBookReadingProgress } from './readingInsights';

// ─── Types ────────────────────────────────────────────────

export type ActivityType = 'learn' | 'practice' | 'play' | 'quiz' | 'revision' | 'ai';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface ChapterProgress {
  bookId: string;
  chapterId: string;
  chapterName: string;
  subject: string;
  /** Activities completed flag */
  learn: boolean;
  practice: DifficultyLevel | null;  // highest difficulty completed
  play: boolean;
  quiz: number;         // best score percentage 0-100
  revision: boolean;
  aiQuestions: number;
  /** Stars (0-3) per activity */
  stars: {
    learn: number;
    practice: number;
    play: number;
    quiz: number;
    revision: number;
  };
  /** Time spent in ms per activity */
  timeSpent: {
    learn: number;
    practice: number;
    play: number;
    quiz: number;
    revision: number;
    ai: number;
  };
  /** Overall chapter completion 0-100 */
  completionPercent: number;
  /** Incorrect answers for revision */
  incorrectAnswers: IncorrectAnswer[];
  /** Last activity timestamp */
  lastActivityAt: string;
  /** Quiz difficulty level (adaptive) */
  quizDifficulty: DifficultyLevel;
}

export interface IncorrectAnswer {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  chapterId: string;
  bookId: string;
  timestamp: string;
  reviewed: boolean;
}

export interface BookProgress {
  bookId: string;
  bookTitle: string;
  subject: string;
  totalChapters: number;
  completedChapters: number;
  completionPercent: number;
  readingCompletionPercent: number;
  chapterCompletionPercent: number;
  totalStars: number;
  maxStars: number;
  totalTimeMs: number;
  lastActivityAt: string | null;
  lastChapterId: string | null;
  lastChapterName: string | null;
}

export interface SubjectStrength {
  subject: string;
  strength: number;       // 0-100
  totalQuizzes: number;
  avgQuizScore: number;
  totalTimeMs: number;
  chaptersCompleted: number;
  weakAreas: string[];    // chapter names needing work
}

export interface WeeklyReport {
  weekStart: string;
  totalTimeMs: number;
  chaptersStudied: number;
  quizzesTaken: number;
  avgScore: number;
  subjectBreakdown: { subject: string; timeMs: number; quizzes: number }[];
  improvements: string[];
  recommendations: string[];
}

export interface ParentLock {
  ai: boolean;
  quiz: boolean;
  play: boolean;
  safeMode: boolean;
  pin?: string;
}

// ─── Storage Keys ─────────────────────────────────────────

const PROGRESS_KEY = 'ssms_chapter_progress';
const INCORRECT_KEY = 'ssms_incorrect_answers';
const LOCKS_KEY = 'ssms_parent_locks';
const ACTIVE_TIMER_KEY = 'ssms_active_timer';

// ─── Internal Helpers ─────────────────────────────────────

function loadProgress(): Record<string, ChapterProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProgress(data: Record<string, ChapterProgress>): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function getKey(bookId: string, chapterId: string): string {
  return `${bookId}::${chapterId}`;
}

function createDefaultProgress(bookId: string, chapterId: string, chapterName: string, subject: string): ChapterProgress {
  return {
    bookId,
    chapterId,
    chapterName,
    subject,
    learn: false,
    practice: null,
    play: false,
    quiz: 0,
    revision: false,
    aiQuestions: 0,
    stars: { learn: 0, practice: 0, play: 0, quiz: 0, revision: 0 },
    timeSpent: { learn: 0, practice: 0, play: 0, quiz: 0, revision: 0, ai: 0 },
    completionPercent: 0,
    incorrectAnswers: [],
    lastActivityAt: new Date().toISOString(),
    quizDifficulty: 'easy',
  };
}

function calculateCompletion(p: ChapterProgress): number {
  let score = 0;
  if (p.learn) score += 20;
  if (p.practice) score += 20;
  if (p.play) score += 15;
  if (p.quiz > 0) score += Math.min(25, (p.quiz / 100) * 25);
  if (p.revision) score += 10;
  if (p.aiQuestions > 0) score += 10;
  return Math.min(100, Math.round(score));
}

function calculateStars(score: number): number {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 40) return 1;
  return 0;
}

// ─── Activity Timer ───────────────────────────────────────

let _activeTimer: { bookId: string; chapterId: string; activity: ActivityType; start: number } | null = null;

export function startActivityTimer(bookId: string, chapterId: string, activity: ActivityType): void {
  _activeTimer = { bookId, chapterId, activity, start: Date.now() };
  try {
    localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(_activeTimer));
  } catch { /* ignore */ }
}

export function stopActivityTimer(): number {
  if (!_activeTimer) return 0;
  const activeTimer = _activeTimer;
  const elapsed = Date.now() - activeTimer.start;

  // Save time to progress
  const all = loadProgress();
  const key = getKey(activeTimer.bookId, activeTimer.chapterId);
  if (all[key]) {
    all[key].timeSpent[activeTimer.activity] += elapsed;
    all[key].lastActivityAt = new Date().toISOString();
    saveProgress(all);
  }

  if (elapsed >= 3000) {
    logAction('book_activity_session', 'learning', {
      bookId: activeTimer.bookId,
      chapterId: activeTimer.chapterId,
      activity: activeTimer.activity,
      durationMs: elapsed,
      progressKey: key,
    });
  }

  const result = elapsed;
  _activeTimer = null;
  try { localStorage.removeItem(ACTIVE_TIMER_KEY); } catch { /* ignore */ }
  return result;
}

// ─── Progress Operations ──────────────────────────────────

/**
 * Get or create chapter progress.
 */
export function getChapterProgress(
  bookId: string,
  chapterId: string,
  chapterName = '',
  subject = ''
): ChapterProgress {
  const all = loadProgress();
  const key = getKey(bookId, chapterId);
  if (!all[key]) {
    all[key] = createDefaultProgress(bookId, chapterId, chapterName, subject);
    saveProgress(all);
  }
  return all[key];
}

/**
 * Mark learn activity as completed.
 */
export function completeLearn(bookId: string, chapterId: string): void {
  const all = loadProgress();
  const key = getKey(bookId, chapterId);
  if (!all[key]) return;
  all[key].learn = true;
  all[key].stars.learn = 3;
  all[key].completionPercent = calculateCompletion(all[key]);
  all[key].lastActivityAt = new Date().toISOString();
  saveProgress(all);
}

/**
 * Record practice completion with difficulty.
 */
export function completePractice(bookId: string, chapterId: string, difficulty: DifficultyLevel, score: number): void {
  const all = loadProgress();
  const key = getKey(bookId, chapterId);
  if (!all[key]) return;

  const diffRank: Record<DifficultyLevel, number> = { easy: 1, medium: 2, hard: 3 };
  const current = all[key].practice;
  if (!current || diffRank[difficulty] > diffRank[current]) {
    all[key].practice = difficulty;
  }
  all[key].stars.practice = calculateStars(score);
  all[key].completionPercent = calculateCompletion(all[key]);
  all[key].lastActivityAt = new Date().toISOString();
  saveProgress(all);
}

/**
 * Record play mode completion.
 */
export function completePlay(bookId: string, chapterId: string, score: number): void {
  const all = loadProgress();
  const key = getKey(bookId, chapterId);
  if (!all[key]) return;
  all[key].play = true;
  all[key].stars.play = calculateStars(score);
  all[key].completionPercent = calculateCompletion(all[key]);
  all[key].lastActivityAt = new Date().toISOString();
  saveProgress(all);
}

/**
 * Record quiz result with adaptive difficulty.
 */
export function recordQuiz(
  bookId: string,
  chapterId: string,
  score: number,
  total: number,
  incorrects: Omit<IncorrectAnswer, 'chapterId' | 'bookId' | 'timestamp' | 'reviewed'>[] = []
): void {
  const all = loadProgress();
  const key = getKey(bookId, chapterId);
  if (!all[key]) return;

  const pct = Math.round((score / total) * 100);
  if (pct > all[key].quiz) {
    all[key].quiz = pct;
  }
  all[key].stars.quiz = calculateStars(pct);

  // Adaptive difficulty
  if (pct >= 80) {
    const diff = all[key].quizDifficulty;
    if (diff === 'easy') all[key].quizDifficulty = 'medium';
    else if (diff === 'medium') all[key].quizDifficulty = 'hard';
  } else if (pct < 40) {
    const diff = all[key].quizDifficulty;
    if (diff === 'hard') all[key].quizDifficulty = 'medium';
    else if (diff === 'medium') all[key].quizDifficulty = 'easy';
  }

  // Store incorrect answers
  const now = new Date().toISOString();
  for (const inc of incorrects) {
    all[key].incorrectAnswers.push({
      ...inc,
      chapterId,
      bookId,
      timestamp: now,
      reviewed: false,
    });
  }

  // Keep only last 50 incorrects
  if (all[key].incorrectAnswers.length > 50) {
    all[key].incorrectAnswers = all[key].incorrectAnswers.slice(-50);
  }

  all[key].completionPercent = calculateCompletion(all[key]);
  all[key].lastActivityAt = now;
  saveProgress(all);
}

/**
 * Mark revision as completed.
 */
export function completeRevision(bookId: string, chapterId: string): void {
  const all = loadProgress();
  const key = getKey(bookId, chapterId);
  if (!all[key]) return;
  all[key].revision = true;
  all[key].stars.revision = 3;
  all[key].completionPercent = calculateCompletion(all[key]);
  all[key].lastActivityAt = new Date().toISOString();

  // Mark all incorrects as reviewed
  for (const inc of all[key].incorrectAnswers) {
    inc.reviewed = true;
  }
  saveProgress(all);
}

/**
 * Record an AI question asked.
 */
export function recordAIUsage(bookId: string, chapterId: string): void {
  const all = loadProgress();
  const key = getKey(bookId, chapterId);
  if (!all[key]) return;
  all[key].aiQuestions++;
  all[key].completionPercent = calculateCompletion(all[key]);
  all[key].lastActivityAt = new Date().toISOString();
  saveProgress(all);
}

// ─── Aggregation ──────────────────────────────────────────

/**
 * Get aggregated progress for a book.
 */
export function getBookProgress(bookId: string, bookTitle: string, subject: string, totalChapters: number): BookProgress {
  const all = loadProgress();
  let completedChapters = 0;
  let totalStars = 0;
  let totalTimeMs = 0;
  let lastActivityAt: string | null = null;
  let lastChapterId: string | null = null;
  let lastChapterName: string | null = null;

  for (const [key, p] of Object.entries(all)) {
    if (!key.startsWith(bookId + '::')) continue;
    const time = Object.values(p.timeSpent).reduce((a, b) => a + b, 0);
    totalTimeMs += time;
    const stars = Object.values(p.stars).reduce((a, b) => a + b, 0);
    totalStars += stars;
    if (p.completionPercent >= 80) completedChapters++;
    if (!lastActivityAt || p.lastActivityAt > lastActivityAt) {
      lastActivityAt = p.lastActivityAt;
      lastChapterId = p.chapterId;
      lastChapterName = p.chapterName;
    }
  }

  const chapterCompletionPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  const readingProgress = getBookReadingProgress(bookId);
  const readingCompletionPercent = readingProgress?.completionPercent || 0;
  const completionPercent = Math.max(chapterCompletionPercent, readingCompletionPercent);
  const effectiveLastActivityAt = readingProgress?.updatedAt && (!lastActivityAt || readingProgress.updatedAt > lastActivityAt)
    ? readingProgress.updatedAt
    : lastActivityAt;

  return {
    bookId,
    bookTitle,
    subject,
    totalChapters,
    completedChapters,
    completionPercent,
    readingCompletionPercent,
    chapterCompletionPercent,
    totalStars,
    maxStars: totalChapters * 15,  // 5 activities × 3 stars each
    totalTimeMs,
    lastActivityAt: effectiveLastActivityAt,
    lastChapterId,
    lastChapterName,
  };
}

/**
 * Get subject strength analysis.
 */
export function getSubjectStrengths(): SubjectStrength[] {
  const all = loadProgress();
  const subjects = new Map<string, { scores: number[]; timeMs: number; completed: number; weakChapters: string[] }>();

  for (const p of Object.values(all)) {
    const subj = p.subject || 'Unknown';
    if (!subjects.has(subj)) {
      subjects.set(subj, { scores: [], timeMs: 0, completed: 0, weakChapters: [] });
    }
    const s = subjects.get(subj)!;
    if (p.quiz > 0) s.scores.push(p.quiz);
    s.timeMs += Object.values(p.timeSpent).reduce((a, b) => a + b, 0);
    if (p.completionPercent >= 80) s.completed++;
    if (p.quiz > 0 && p.quiz < 50) s.weakChapters.push(p.chapterName);
  }

  return Array.from(subjects.entries()).map(([subject, data]) => ({
    subject,
    strength: data.scores.length > 0
      ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
      : 0,
    totalQuizzes: data.scores.length,
    avgQuizScore: data.scores.length > 0
      ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
      : 0,
    totalTimeMs: data.timeMs,
    chaptersCompleted: data.completed,
    weakAreas: data.weakChapters.slice(0, 5),
  }));
}

/**
 * Get incorrect answers for revision across all chapters or specific book/chapter.
 */
export function getIncorrectAnswers(bookId?: string, chapterId?: string): IncorrectAnswer[] {
  const all = loadProgress();
  const results: IncorrectAnswer[] = [];

  for (const [key, p] of Object.entries(all)) {
    if (bookId && !key.startsWith(bookId + '::')) continue;
    if (chapterId && !key.endsWith('::' + chapterId)) continue;
    results.push(...p.incorrectAnswers.filter(a => !a.reviewed));
  }

  return results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Get total stars for a specific chapter.
 */
export function getChapterStars(bookId: string, chapterId: string): number {
  const p = getChapterProgress(bookId, chapterId);
  return Object.values(p.stars).reduce((a, b) => a + b, 0);
}

/**
 * Generate weekly report data.
 */
export function getWeeklyReport(): WeeklyReport {
  const all = loadProgress();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString();

  let totalTimeMs = 0;
  let chaptersStudied = 0;
  let quizzesTaken = 0;
  const scores: number[] = [];
  const subjectMap = new Map<string, { timeMs: number; quizzes: number }>();
  const improvements: string[] = [];
  const recommendations: string[] = [];

  for (const p of Object.values(all)) {
    if (p.lastActivityAt < weekStart) continue;
    const time = Object.values(p.timeSpent).reduce((a, b) => a + b, 0);
    totalTimeMs += time;
    chaptersStudied++;
    if (p.quiz > 0) {
      quizzesTaken++;
      scores.push(p.quiz);
    }

    const subj = p.subject || 'Unknown';
    if (!subjectMap.has(subj)) subjectMap.set(subj, { timeMs: 0, quizzes: 0 });
    const s = subjectMap.get(subj)!;
    s.timeMs += time;
    if (p.quiz > 0) s.quizzes++;

    // Generate recommendations
    if (!p.learn) recommendations.push(`Start learning "${p.chapterName}"`);
    if (p.quiz > 0 && p.quiz < 50) recommendations.push(`Review "${p.chapterName}" - quiz score needs improvement`);
    if (p.incorrectAnswers.filter(a => !a.reviewed).length > 3) {
      recommendations.push(`Revise "${p.chapterName}" - ${p.incorrectAnswers.filter(a => !a.reviewed).length} questions need review`);
    }
  }

  return {
    weekStart,
    totalTimeMs,
    chaptersStudied,
    quizzesTaken,
    avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    subjectBreakdown: Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject, ...data,
    })),
    improvements,
    recommendations: recommendations.slice(0, 8),
  };
}

// ─── Parent Locks ─────────────────────────────────────────

export function getParentLocks(): ParentLock {
  try {
    const raw = localStorage.getItem(LOCKS_KEY);
    return raw ? JSON.parse(raw) : { ai: false, quiz: false, play: false, safeMode: true };
  } catch {
    return { ai: false, quiz: false, play: false, safeMode: true };
  }
}

export function setParentLocks(locks: ParentLock): void {
  try {
    localStorage.setItem(LOCKS_KEY, JSON.stringify(locks));
  } catch { /* ignore */ }
}

export function isActivityLocked(activity: ActivityType): boolean {
  const locks = getParentLocks();
  if (activity === 'ai') return locks.ai;
  if (activity === 'quiz') return locks.quiz;
  if (activity === 'play') return locks.play;
  return false;
}

export function verifyParentPin(pin: string): boolean {
  const locks = getParentLocks();
  return locks.pin === pin;
}
