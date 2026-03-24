/**
 * games/engine/index.ts — Public API barrel
 * ══════════════════════════════════════════
 * One import for the entire difficulty + session framework.
 *
 * Usage:
 *   import { GameSessionManager, canUnlock, questionSignature } from '../engine';
 */

// ── Difficulty types & adaptive complexity ──
export type {
  Difficulty,
  DifficultyConfig,
  DifficultyUnlockRequirement,
  GameDifficultyConfig,
  AdaptiveComplexityState,
} from './difficultyTypes';

export {
  DIFFICULTY_ORDER,
  defaultDifficultyConfig,
  createAdaptiveState,
  updateAdaptive,
  effectiveComplexity,
} from './difficultyTypes';

// ── Progress store ──
export type { GameProgress, FullGameProgress } from './progressStore2';

export {
  loadGameProgress,
  recordAnswer,
  recordSessionStart,
  unlockDifficulty,
  getAccuracy,
  isUnlocked,
  getTierProgress,
  resetGameProgress,
} from './progressStore2';

// ── Question history (non-repetition engine) ──
export { QuestionHistoryManager, questionSignature } from './questionHistory';

// ── Difficulty unlock logic ──
export {
  canUnlock,
  getUnlockedDifficulties,
  checkAndPersistUnlocks,
  getUnlockHint,
} from './difficultyUnlock';
export type { UnlockHint } from './difficultyUnlock';

// ── Game session manager ──
export type {
  SessionProgress,
  SessionSummary,
  NextQuestionKind,
  NextQuestionInstruction,
} from './gameSessionManager';

export { GameSessionManager } from './gameSessionManager';
