/**
 * games/engine/difficultyTypes.ts — Difficulty Model & Config
 * ════════════════════════════════════════════════════════════
 * Single source of truth for the difficulty tier system.
 * All game types reference these types; nothing is hardcoded elsewhere.
 *
 * Tiers: easy → intermediate → difficult
 * Each tier has a complexity multiplier and unlock requirements.
 *
 * ⚠ DO NOT import from Color Magic or modify its engine.
 */

// ── Strict Difficulty Enum ─────────────────────────────────

export type Difficulty = 'easy' | 'intermediate' | 'difficult';

export const DIFFICULTY_ORDER: readonly Difficulty[] = ['easy', 'intermediate', 'difficult'] as const;

// ── Per-difficulty config attached to every game ───────────

export interface DifficultyUnlockRequirement {
  /** Which lower difficulty must be mastered */
  difficulty: Difficulty;
  /** Minimum accuracy (0–1) required in that difficulty */
  requiredAccuracy: number;
}

export interface DifficultyConfig {
  /** Minimum level/mini-level the child must have reached */
  minLevel: number;
  /** Optional prerequisite from a lower tier */
  unlockRequirement?: DifficultyUnlockRequirement;
  /**
   * Scaling factor passed to question generators.
   * Easy=1, Intermediate≈1.5, Difficult≈2.
   * Generators use this to adjust parameter ranges without changing tier.
   */
  complexityMultiplier: number;
}

// ── Full game difficulty map ───────────────────────────────

export interface GameDifficultyConfig {
  id: string;
  difficulties: {
    easy: DifficultyConfig;
    intermediate: DifficultyConfig;
    difficult: DifficultyConfig;
  };
}

// ── Default config factory (used if game has no override) ──

export function defaultDifficultyConfig(gameId: string): GameDifficultyConfig {
  return {
    id: gameId,
    difficulties: {
      easy: {
        minLevel: 1,
        complexityMultiplier: 1.0,
        // Easy always unlocked — no unlockRequirement
      },
      intermediate: {
        minLevel: 1,
        unlockRequirement: { difficulty: 'easy', requiredAccuracy: 0.70 },
        complexityMultiplier: 1.5,
      },
      difficult: {
        minLevel: 1,
        unlockRequirement: { difficulty: 'intermediate', requiredAccuracy: 0.75 },
        complexityMultiplier: 2.0,
      },
    },
  };
}

// ── Adaptive complexity bounds (internal scaling, NOT tier jumps) ──

export interface AdaptiveComplexityState {
  /** Current internal multiplier applied ON TOP of DifficultyConfig.complexityMultiplier */
  internalMultiplier: number;
  /** Consecutive correct streak (reset on wrong) */
  correctStreak: number;
  /** Consecutive wrong streak (reset on correct) */
  wrongStreak: number;
}

export function createAdaptiveState(): AdaptiveComplexityState {
  return { internalMultiplier: 1.0, correctStreak: 0, wrongStreak: 0 };
}

/**
 * Adjust internal multiplier based on answer outcome.
 * - 5+ correct streak → bump multiplier up (max 1.4)
 * - 3+ wrong streak   → ease multiplier down (min 0.6)
 * This NEVER changes the difficulty tier.
 */
export function updateAdaptive(
  state: AdaptiveComplexityState,
  wasCorrect: boolean,
): AdaptiveComplexityState {
  const next = { ...state };

  if (wasCorrect) {
    next.correctStreak = state.correctStreak + 1;
    next.wrongStreak = 0;
    if (next.correctStreak >= 5) {
      // Gradual ramp: +0.05 per correct above threshold, cap at 1.4
      next.internalMultiplier = Math.min(1.4, state.internalMultiplier + 0.05);
    }
  } else {
    next.wrongStreak = state.wrongStreak + 1;
    next.correctStreak = 0;
    if (next.wrongStreak >= 3) {
      // Gradual ease: -0.05 per wrong above threshold, floor at 0.6
      next.internalMultiplier = Math.max(0.6, state.internalMultiplier - 0.05);
    }
  }

  return next;
}

/**
 * Effective complexity = DifficultyConfig.multiplier × adaptive internal.
 * Generators receive this single number.
 */
export function effectiveComplexity(
  config: DifficultyConfig,
  adaptive: AdaptiveComplexityState,
): number {
  return config.complexityMultiplier * adaptive.internalMultiplier;
}
