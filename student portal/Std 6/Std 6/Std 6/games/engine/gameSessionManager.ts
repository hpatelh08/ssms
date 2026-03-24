/**
 * games/engine/gameSessionManager.ts — Session Controller
 * ════════════════════════════════════════════════════════
 * Orchestrates one play-session of a game:
 *
 *   1. Starts session (gameId + difficulty)
 *   2. Tracks streak, accuracy, adaptive complexity
 *   3. Consults QuestionHistoryManager for repeats
 *   4. Decides next-question priority (repeat vs fresh)
 *   5. Records answers → updates progress + history
 *   6. Returns session summary on end
 *
 * This is the ONE object GameShell should call instead of
 * directly invoking generators. Generators still run —
 * but GameSessionManager wraps them with intelligence.
 *
 * ⚠ DO NOT touch Color Magic engine.
 */

import type {
  Difficulty,
  DifficultyConfig,
  AdaptiveComplexityState,
  GameDifficultyConfig,
} from './difficultyTypes';
import {
  defaultDifficultyConfig,
  createAdaptiveState,
  updateAdaptive,
  effectiveComplexity,
} from './difficultyTypes';

import {
  recordAnswer,
  recordSessionStart,
  loadGameProgress,
  type GameProgress,
} from './progressStore2';

import { QuestionHistoryManager, questionSignature } from './questionHistory';
import { checkAndPersistUnlocks } from './difficultyUnlock';

// ── Session state (returned to caller) ─────────────────────

export interface SessionProgress {
  /** Total questions answered this session */
  questionsAnswered: number;
  /** Correct answers this session */
  correctCount: number;
  /** Wrong answers this session */
  wrongCount: number;
  /** Current consecutive correct streak (within session) */
  currentStreak: number;
  /** Best streak this session */
  bestStreak: number;
  /** Session accuracy (0–1) */
  accuracy: number;
  /** Current effective complexity multiplier */
  complexity: number;
  /** Difficulty tiers newly unlocked during this session */
  newlyUnlockedTiers: Difficulty[];
}

export interface SessionSummary extends SessionProgress {
  gameId: string;
  difficulty: Difficulty;
  /** Duration in milliseconds */
  durationMs: number;
  /** Repeat questions injected during session */
  repeatQuestionsServed: number;
}

// ── Next-question instruction ──────────────────────────────

export type NextQuestionKind = 'repeat' | 'fresh';

export interface NextQuestionInstruction {
  kind: NextQuestionKind;
  /**
   * If kind === 'repeat', this is the signature of the wrong-answer
   * question to re-serve. The caller must reconstruct or have cached
   * the question with this signature.
   *
   * If kind === 'fresh', this is null → generate a new question.
   */
  repeatSig: string | null;
  /** Effective complexity multiplier to pass to the generator. */
  complexity: number;
}

// ── Manager class ──────────────────────────────────────────

export class GameSessionManager {
  private gameId: string;
  private difficulty: Difficulty;
  private diffConfig: DifficultyConfig;
  private adaptive: AdaptiveComplexityState;
  private history: QuestionHistoryManager;

  // Session counters
  private answered = 0;
  private correct = 0;
  private wrong = 0;
  private streak = 0;
  private bestSessionStreak = 0;
  private repeatServed = 0;
  private startTime = 0;
  private newTiers: Difficulty[] = [];

  // ── Lifecycle ────────────────────────────────────────────

  constructor(config?: GameDifficultyConfig) {
    // Defaults — overridden by startSession
    this.gameId = '';
    this.difficulty = 'easy';
    const defaultCfg = defaultDifficultyConfig('__placeholder');
    this.diffConfig = defaultCfg.difficulties.easy;
    this.adaptive = createAdaptiveState();
    this.history = new QuestionHistoryManager('__placeholder', 'easy');

    // If caller passes a full config, store for later
    if (config) {
      this.gameId = config.id;
    }
  }

  /**
   * Begin a new session. Must be called before recordAnswer / getNextQuestion.
   */
  startSession(gameId: string, difficulty: Difficulty, config?: GameDifficultyConfig): void {
    const cfg = config ?? defaultDifficultyConfig(gameId);
    this.gameId = gameId;
    this.difficulty = difficulty;
    this.diffConfig = cfg.difficulties[difficulty];
    this.adaptive = createAdaptiveState();
    this.history = new QuestionHistoryManager(gameId, difficulty);

    // Reset session counters
    this.answered = 0;
    this.correct = 0;
    this.wrong = 0;
    this.streak = 0;
    this.bestSessionStreak = 0;
    this.repeatServed = 0;
    this.startTime = Date.now();
    this.newTiers = [];

    // Persist session start
    recordSessionStart(gameId, difficulty);
  }

  // ── Record answer ────────────────────────────────────────

  /**
   * Record the child's answer.
   * @param wasCorrect  Whether they got it right
   * @param sig         The question signature (from questionSignature())
   * @returns Updated session progress snapshot
   */
  recordAnswer(wasCorrect: boolean, sig: string): SessionProgress {
    this.answered++;

    if (wasCorrect) {
      this.correct++;
      this.streak++;
      this.bestSessionStreak = Math.max(this.bestSessionStreak, this.streak);
      this.history.markCorrect(sig);
    } else {
      this.wrong++;
      this.streak = 0;
      this.history.markWrong(sig);
    }

    // Update adaptive complexity (stays within current tier)
    this.adaptive = updateAdaptive(this.adaptive, wasCorrect);

    // Persist lifetime progress
    recordAnswer(this.gameId, this.difficulty, wasCorrect, this.streak);

    // Check for newly unlocked tiers
    const unlocked = checkAndPersistUnlocks(this.gameId);
    if (unlocked.length > 0) {
      this.newTiers.push(...unlocked);
    }

    return this.getProgress();
  }

  // ── Next question decision ───────────────────────────────

  /**
   * Decide whether the next question should be a repeat or fresh.
   * The caller (GameShell) is responsible for actually generating
   * or recalling the question — this just provides the instruction.
   */
  getNextQuestion(): NextQuestionInstruction {
    const complexity = effectiveComplexity(this.diffConfig, this.adaptive);

    // Every ~6th question, try to inject a repeat if one is due
    const shouldTryRepeat = this.answered > 0 && this.answered % 6 === 0;

    if (shouldTryRepeat) {
      const repeatSig = this.history.getNextRepeat();
      if (repeatSig) {
        this.repeatServed++;
        return { kind: 'repeat', repeatSig, complexity };
      }
    }

    return { kind: 'fresh', repeatSig: null, complexity };
  }

  // ── Check signature ──────────────────────────────────────

  /**
   * Returns true if the generator's output is a duplicate.
   * If so, the caller should regenerate.
   */
  isDuplicateSignature(sig: string): boolean {
    return this.history.isDuplicate(sig);
  }

  /**
   * Convenience: generate a signature from question parameters.
   */
  static signature(params: Record<string, unknown>): string {
    return questionSignature(params);
  }

  // ── Progress snapshot ────────────────────────────────────

  getProgress(): SessionProgress {
    return {
      questionsAnswered: this.answered,
      correctCount: this.correct,
      wrongCount: this.wrong,
      currentStreak: this.streak,
      bestStreak: this.bestSessionStreak,
      accuracy: this.answered > 0 ? this.correct / this.answered : 0,
      complexity: effectiveComplexity(this.diffConfig, this.adaptive),
      newlyUnlockedTiers: [...this.newTiers],
    };
  }

  // ── End session ──────────────────────────────────────────

  endSession(): SessionSummary {
    return {
      ...this.getProgress(),
      gameId: this.gameId,
      difficulty: this.difficulty,
      durationMs: Date.now() - this.startTime,
      repeatQuestionsServed: this.repeatServed,
    };
  }

  // ── Getters ──────────────────────────────────────────────

  get currentDifficulty(): Difficulty { return this.difficulty; }
  get currentComplexity(): number { return effectiveComplexity(this.diffConfig, this.adaptive); }
  get currentAdaptiveState(): AdaptiveComplexityState { return { ...this.adaptive }; }
  get historyManager(): QuestionHistoryManager { return this.history; }
}
