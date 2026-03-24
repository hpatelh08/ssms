/**
 * games/engine/progressStore.ts — Mastery & Progress Tracking
 * ════════════════════════════════════════════════════════════
 * localStorage-backed store tracking per-game, per-difficulty progress.
 * Used by difficultyUnlock.ts to decide when tiers unlock,
 * and by GameSessionManager to adjust complexity.
 *
 * Key schema:  `ssms_gp_<gameId>_<difficulty>`
 *
 * Designed to scale to 8+ months of daily play (tens of thousands
 * of question records per game) — keeps only aggregates, not full
 * question logs (those live in questionHistory.ts).
 *
 * ⚠ DO NOT confuse with subjects/engine/progressStore.ts — that older
 *   store remains for mini-level badge UI; this one powers the new
 *   session framework. They coexist without conflict.
 */

import type { Difficulty } from './difficultyTypes';
import { DIFFICULTY_ORDER } from './difficultyTypes';

// ── Persisted progress shape ───────────────────────────────

export interface GameProgress {
  /** Lifetime question attempts in this tier */
  totalAttempts: number;
  /** Lifetime correct answers in this tier */
  correctAnswers: number;
  /** Rolling accuracy (0–1). Updated on every answer. */
  accuracy: number;
  /** Which difficulty tiers the child has unlocked */
  unlockedDifficulties: Difficulty[];
  /** Current best consecutive correct streak (lifetime) */
  bestStreak: number;
  /** Total sessions played in this tier */
  sessionsPlayed: number;
  /** ISO date of last session */
  lastPlayedAt: string;
}

/** Combined progress for one game across all tiers */
export type FullGameProgress = Record<Difficulty, GameProgress>;

// ── Storage key helpers ────────────────────────────────────

const PREFIX = 'ssms_gp2_';

function storageKey(gameId: string): string {
  return `${PREFIX}${gameId}`;
}

// ── Defaults ───────────────────────────────────────────────

function defaultProgress(): GameProgress {
  return {
    totalAttempts: 0,
    correctAnswers: 0,
    accuracy: 0,
    unlockedDifficulties: ['easy'],
    bestStreak: 0,
    sessionsPlayed: 0,
    lastPlayedAt: '',
  };
}

function defaultFullProgress(): FullGameProgress {
  return {
    easy: defaultProgress(),
    intermediate: defaultProgress(),
    difficult: defaultProgress(),
  };
}

// ── Load / Save ────────────────────────────────────────────

export function loadGameProgress(gameId: string): FullGameProgress {
  try {
    const raw = localStorage.getItem(storageKey(gameId));
    if (!raw) return defaultFullProgress();
    const parsed = JSON.parse(raw) as Partial<FullGameProgress>;
    // Merge with defaults to handle schema evolution
    const full = defaultFullProgress();
    for (const d of DIFFICULTY_ORDER) {
      if (parsed[d]) {
        full[d] = { ...full[d], ...parsed[d] };
      }
    }
    return full;
  } catch {
    return defaultFullProgress();
  }
}

function saveGameProgress(gameId: string, progress: FullGameProgress): void {
  try {
    localStorage.setItem(storageKey(gameId), JSON.stringify(progress));
  } catch { /* quota exceeded — silently skip */ }
}

// ── Record a single answer ─────────────────────────────────

/**
 * Record one answer and return updated progress for the tier.
 * This updates totals, accuracy, and streak in-place then persists.
 */
export function recordAnswer(
  gameId: string,
  difficulty: Difficulty,
  wasCorrect: boolean,
  currentStreak: number,
): GameProgress {
  const full = loadGameProgress(gameId);
  const gp = full[difficulty];

  gp.totalAttempts += 1;
  if (wasCorrect) gp.correctAnswers += 1;
  gp.accuracy = gp.totalAttempts > 0
    ? gp.correctAnswers / gp.totalAttempts
    : 0;
  gp.bestStreak = Math.max(gp.bestStreak, currentStreak);

  saveGameProgress(gameId, full);
  return gp;
}

// ── Record session start/end ───────────────────────────────

export function recordSessionStart(gameId: string, difficulty: Difficulty): void {
  const full = loadGameProgress(gameId);
  full[difficulty].sessionsPlayed += 1;
  full[difficulty].lastPlayedAt = new Date().toISOString();
  saveGameProgress(gameId, full);
}

// ── Unlock a difficulty tier ───────────────────────────────

export function unlockDifficulty(gameId: string, difficulty: Difficulty): void {
  const full = loadGameProgress(gameId);
  for (const d of DIFFICULTY_ORDER) {
    if (!full[d].unlockedDifficulties.includes(difficulty)) {
      full[d].unlockedDifficulties = [...new Set([...full[d].unlockedDifficulties, difficulty])];
    }
  }
  saveGameProgress(gameId, full);
}

// ── Query helpers ──────────────────────────────────────────

export function getAccuracy(gameId: string, difficulty: Difficulty): number {
  return loadGameProgress(gameId)[difficulty].accuracy;
}

export function isUnlocked(gameId: string, difficulty: Difficulty): boolean {
  const full = loadGameProgress(gameId);
  return full.easy.unlockedDifficulties.includes(difficulty);
}

export function getTierProgress(gameId: string, difficulty: Difficulty): GameProgress {
  return loadGameProgress(gameId)[difficulty];
}

/**
 * Reset all progress for a game (developer/debug utility only).
 */
export function resetGameProgress(gameId: string): void {
  try { localStorage.removeItem(storageKey(gameId)); } catch { /* ignore */ }
}
