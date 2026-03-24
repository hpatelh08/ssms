/**
 * games/engine/questionHistory.ts — Non-Repetition Engine
 * ════════════════════════════════════════════════════════
 * Tracks question signatures to prevent repeats:
 *   ✔ Correct answers   → NEVER repeat
 *   ✔ Wrong answers     → reinsert after a delay (5–10 future questions)
 *   ✔ Duplicate sigs    → rejected at generation time
 *
 * Signature = deterministic hash of question parameters.
 * Stored per gameId + difficulty in localStorage.
 *
 * Designed for 8+ months: auto-prunes old entries to keep
 * the store under ~200 KB per game.
 *
 * ⚠ DO NOT touch Color Magic engine.
 */

import type { Difficulty } from './difficultyTypes';

// ── Signature helper ───────────────────────────────────────

/**
 * Produce a stable string signature from arbitrary question params.
 * Uses JSON.stringify with sorted keys → deterministic.
 */
export function questionSignature(params: Record<string, unknown>): string {
  // Sort keys for determinism, then produce a compact hash-like string
  const sorted = Object.keys(params).sort();
  const parts = sorted.map(k => `${k}:${JSON.stringify(params[k])}`);
  const raw = parts.join('|');
  // Simple DJB2-style hash (fast, collision-resistant enough for our use)
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

// ── History entry ──────────────────────────────────────────

interface HistoryEntry {
  /** Question signature */
  sig: string;
  /** Was the answer correct? */
  correct: boolean;
  /** Monotonically increasing counter when this was recorded */
  seqNo: number;
}

// ── Wrong-answer queue entry ───────────────────────────────

interface WrongEntry {
  sig: string;
  /** The seqNo when this was answered wrong */
  wrongAt: number;
  /** seqNo at which this should be eligible for repeat */
  repeatAfter: number;
}

// ── localStorage schema ────────────────────────────────────

const PREFIX = 'ssms_qh_';

interface StoredHistory {
  /** Set of signatures for correct answers (never repeat) */
  correctSigs: string[];
  /** Queue of wrong-answer entries */
  wrongQueue: WrongEntry[];
  /** Current sequence counter */
  seq: number;
}

function storageKey(gameId: string, difficulty: Difficulty): string {
  return `${PREFIX}${gameId}_${difficulty}`;
}

function loadHistory(gameId: string, difficulty: Difficulty): StoredHistory {
  try {
    const raw = localStorage.getItem(storageKey(gameId, difficulty));
    if (!raw) return { correctSigs: [], wrongQueue: [], seq: 0 };
    return JSON.parse(raw) as StoredHistory;
  } catch {
    return { correctSigs: [], wrongQueue: [], seq: 0 };
  }
}

function saveHistory(gameId: string, difficulty: Difficulty, h: StoredHistory): void {
  try {
    // Auto-prune: keep only last 2000 correct sigs and last 200 wrong entries
    if (h.correctSigs.length > 2000) {
      h.correctSigs = h.correctSigs.slice(-2000);
    }
    if (h.wrongQueue.length > 200) {
      h.wrongQueue = h.wrongQueue.slice(-200);
    }
    localStorage.setItem(storageKey(gameId, difficulty), JSON.stringify(h));
  } catch { /* quota exceeded — skip silently */ }
}

// ── QuestionHistoryManager class ───────────────────────────

export class QuestionHistoryManager {
  private correctSet: Set<string>;
  private wrongQueue: WrongEntry[];
  private seq: number;

  constructor(
    private gameId: string,
    private difficulty: Difficulty,
  ) {
    const stored = loadHistory(gameId, difficulty);
    this.correctSet = new Set(stored.correctSigs);
    this.wrongQueue = stored.wrongQueue;
    this.seq = stored.seq;
  }

  // ── Persistence ──

  private persist(): void {
    saveHistory(this.gameId, this.difficulty, {
      correctSigs: [...this.correctSet],
      wrongQueue: this.wrongQueue,
      seq: this.seq,
    });
  }

  // ── Core API ──

  /**
   * Mark a question as answered correctly.
   * This signature will NEVER appear again.
   */
  markCorrect(sig: string): void {
    this.correctSet.add(sig);
    // Remove from wrong queue if present
    this.wrongQueue = this.wrongQueue.filter(w => w.sig !== sig);
    this.seq++;
    this.persist();
  }

  /**
   * Mark a question as answered wrong.
   * It will reappear after a delay of 5–10 future questions.
   */
  markWrong(sig: string): void {
    // Don't duplicate in wrong queue
    if (this.wrongQueue.some(w => w.sig === sig)) {
      this.seq++;
      this.persist();
      return;
    }
    // Random delay between 5 and 10 questions
    const delay = 5 + Math.floor(Math.random() * 6);
    this.wrongQueue.push({
      sig,
      wrongAt: this.seq,
      repeatAfter: this.seq + delay,
    });
    this.seq++;
    this.persist();
  }

  /**
   * Check if a signature should be repeated (wrong answer that's "due").
   */
  shouldRepeat(sig: string): boolean {
    const entry = this.wrongQueue.find(w => w.sig === sig);
    if (!entry) return false;
    return this.seq >= entry.repeatAfter;
  }

  /**
   * Get the next due wrong-answer signature (if any).
   * Returns null if nothing is due yet.
   */
  getNextRepeat(): string | null {
    // Find first entry whose delay has elapsed
    const due = this.wrongQueue.find(w => this.seq >= w.repeatAfter);
    return due ? due.sig : null;
  }

  /**
   * Remove a wrong entry after the child answers it correctly on retry.
   */
  consumeRepeat(sig: string): void {
    this.wrongQueue = this.wrongQueue.filter(w => w.sig !== sig);
    this.correctSet.add(sig);
    this.persist();
  }

  /**
   * Check if a signature is "known correct" (already answered right).
   * Generators call this to skip producing duplicate questions.
   */
  isKnownCorrect(sig: string): boolean {
    return this.correctSet.has(sig);
  }

  /**
   * Check whether a signature already exists (correct OR pending wrong).
   * Generators call this to avoid producing any duplicate at all.
   */
  isDuplicate(sig: string): boolean {
    if (this.correctSet.has(sig)) return true;
    return this.wrongQueue.some(w => w.sig === sig);
  }

  /**
   * Return all signatures that are "due" for retry right now.
   */
  getAllDueRepeats(): string[] {
    return this.wrongQueue
      .filter(w => this.seq >= w.repeatAfter)
      .map(w => w.sig);
  }

  /**
   * How many wrong answers are pending retry (regardless of delay).
   */
  get pendingWrongCount(): number {
    return this.wrongQueue.length;
  }

  /**
   * Total questions tracked (correct + pending wrong).
   */
  get totalTracked(): number {
    return this.correctSet.size + this.wrongQueue.length;
  }

  /**
   * Current sequence counter.
   */
  get currentSeq(): number {
    return this.seq;
  }

  /**
   * Reset all history (debug/dev only).
   */
  reset(): void {
    this.correctSet.clear();
    this.wrongQueue = [];
    this.seq = 0;
    try {
      localStorage.removeItem(storageKey(this.gameId, this.difficulty));
    } catch { /* ignore */ }
  }
}
