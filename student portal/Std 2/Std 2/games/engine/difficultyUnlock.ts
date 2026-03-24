/**
 * games/engine/difficultyUnlock.ts — Unlock Logic
 * ════════════════════════════════════════════════
 * Pure functions that decide whether a difficulty tier is unlocked.
 *
 * Rules (non-negotiable):
 *   Easy         → ALWAYS unlocked
 *   Intermediate → 70% accuracy in Easy  (≥10 attempts)
 *   Difficult    → 75% accuracy in Intermediate (≥10 attempts)
 *
 * No shortcuts. No overrides.
 *
 * ⚠ DO NOT touch Color Magic.
 */

import type { Difficulty, GameDifficultyConfig } from './difficultyTypes';
import { defaultDifficultyConfig, DIFFICULTY_ORDER } from './difficultyTypes';
import { loadGameProgress, unlockDifficulty as persistUnlock, type GameProgress } from './progressStore2';

// ── Minimum attempts before accuracy is meaningful ─────────

const MIN_ATTEMPTS = 10;

// ── Core check ─────────────────────────────────────────────

/**
 * Can `difficulty` be unlocked for `gameId`?
 *
 * @param gameId  – unique game identifier
 * @param difficulty – the tier to check
 * @param config – optional per-game config; falls back to defaults
 */
export function canUnlock(
  gameId: string,
  difficulty: Difficulty,
  config?: GameDifficultyConfig,
): boolean {
  // Easy is always available
  if (difficulty === 'easy') return true;

  const cfg = config ?? defaultDifficultyConfig(gameId);
  const tierCfg = cfg.difficulties[difficulty];

  // No unlock requirement → unlocked
  if (!tierCfg.unlockRequirement) return true;

  const { difficulty: reqDiff, requiredAccuracy } = tierCfg.unlockRequirement;

  // Load progress for the prerequisite tier
  const fullProgress = loadGameProgress(gameId);
  const prereqProgress: GameProgress = fullProgress[reqDiff];

  // Need enough attempts for accuracy to be statistically meaningful
  if (prereqProgress.totalAttempts < MIN_ATTEMPTS) return false;

  // Check accuracy threshold
  return prereqProgress.accuracy >= requiredAccuracy;
}

// ── Batch check: which tiers are unlocked ──────────────────

/**
 * Returns the list of unlocked difficulties for a game.
 */
export function getUnlockedDifficulties(
  gameId: string,
  config?: GameDifficultyConfig,
): Difficulty[] {
  return DIFFICULTY_ORDER.filter(d => canUnlock(gameId, d, config));
}

// ── Auto-persist unlock when threshold is reached ──────────

/**
 * Call after every answer to check & persist any newly unlocked tier.
 * Returns the list of tiers that JUST got unlocked (usually 0 or 1).
 */
export function checkAndPersistUnlocks(
  gameId: string,
  config?: GameDifficultyConfig,
): Difficulty[] {
  const fullProgress = loadGameProgress(gameId);
  const alreadyUnlocked = new Set(fullProgress.easy.unlockedDifficulties);
  const newlyUnlocked: Difficulty[] = [];

  for (const d of DIFFICULTY_ORDER) {
    if (alreadyUnlocked.has(d)) continue;
    if (canUnlock(gameId, d, config)) {
      persistUnlock(gameId, d);
      newlyUnlocked.push(d);
    }
  }

  return newlyUnlocked;
}

// ── Next unlock info (for UI hints) ────────────────────────

export interface UnlockHint {
  difficulty: Difficulty;
  prerequisiteDifficulty: Difficulty;
  currentAccuracy: number;
  requiredAccuracy: number;
  attemptsNeeded: number;
  /** true when already unlocked */
  unlocked: boolean;
}

/**
 * Get unlock status + hint for a specific tier.
 */
export function getUnlockHint(
  gameId: string,
  difficulty: Difficulty,
  config?: GameDifficultyConfig,
): UnlockHint {
  if (difficulty === 'easy') {
    return {
      difficulty: 'easy',
      prerequisiteDifficulty: 'easy',
      currentAccuracy: 1,
      requiredAccuracy: 0,
      attemptsNeeded: 0,
      unlocked: true,
    };
  }

  const cfg = config ?? defaultDifficultyConfig(gameId);
  const tierCfg = cfg.difficulties[difficulty];
  const req = tierCfg.unlockRequirement!;

  const fullProgress = loadGameProgress(gameId);
  const prereq = fullProgress[req.difficulty];

  const unlocked = canUnlock(gameId, difficulty, config);
  const attemptsNeeded = Math.max(0, MIN_ATTEMPTS - prereq.totalAttempts);

  return {
    difficulty,
    prerequisiteDifficulty: req.difficulty,
    currentAccuracy: prereq.accuracy,
    requiredAccuracy: req.requiredAccuracy,
    attemptsNeeded,
    unlocked,
  };
}
