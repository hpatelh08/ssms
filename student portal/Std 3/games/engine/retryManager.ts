/**
 * 🔄 Retry Manager – Wrong-answer pool tracker
 * ===============================================
 * Tracks wrong questions per session, manages retry rounds.
 * Used by GameShell — no per-game retry logic needed.
 */

import type { Question } from './questionGenerator';

/** Immutable retry-pool helpers (no class, pure functions) */

export interface RetryPool {
  /** Questions the student answered wrong (deduplicated by id) */
  questions: Question[];
}

export function createRetryPool(): RetryPool {
  return { questions: [] };
}

/** Add a wrong question (skip if already tracked). */
export function addWrong(pool: RetryPool, q: Question): RetryPool {
  if (pool.questions.some(x => x.id === q.id)) return pool;
  return { questions: [...pool.questions, q] };
}

/** Remove a question that was answered correctly (can happen in retry round). */
export function removeCorrect(pool: RetryPool, id: string): RetryPool {
  return { questions: pool.questions.filter(q => q.id !== id) };
}

/** Get up to `count` questions from the pool for a retry round. */
export function getRetryBatch(pool: RetryPool, count: number): Question[] {
  return pool.questions.slice(0, count);
}

/** True when there are still wrong questions remaining. */
export function hasRetries(pool: RetryPool): boolean {
  return pool.questions.length > 0;
}

/** Number of wrong questions pending. */
export function retryCount(pool: RetryPool): number {
  return pool.questions.length;
}
