/**
 * games/curriculum/revisionEngine.ts — Revision Mode + Adaptive Layer
 * ════════════════════════════════════════════════════════════════════
 * Unlocked after completing Difficult tier for a chapter.
 * Mixes questions from ALL 3 tiers with weakness-biased weighting.
 *
 * Features:
 *   1. Weakness detection — tracks accuracy per game-type
 *   2. Weighted revision — pulls more from weak areas
 *   3. Spaced repetition hints — recently wrong → sooner retry
 *
 * ⚠ Complements Phase 2 engine — does NOT replace it.
 * ⚠ Does NOT touch Color Magic or Hub UI.
 */

import type {
  CurriculumQuestion,
  GeneratorParams,
  CurriculumChapter,
  RevisionConfig,
} from './curriculumTypes';
import { buildParams, DEFAULT_REVISION, pick, shuffle } from './curriculumTypes';
import type { Difficulty } from '../engine/difficultyTypes';
import type { ChapterProgress } from './masterySystem';
import { chapterAccuracy } from './masterySystem';

// ── Weakness profile ───────────────────────────────────────

export interface GameTypeAccuracy {
  gameTypeId: string;
  attempts: number;
  correct: number;
  /** Weighted accuracy (recent attempts count more) */
  weightedAccuracy: number;
  /** ISO timestamp of last wrong answer */
  lastWrong: string | null;
}

export interface WeaknessProfile {
  chapterId: string;
  section: 'maths' | 'english' | 'arcade';
  gameTypes: Record<string, GameTypeAccuracy>;
  /** Sorted weakest→strongest */
  weakestFirst: string[];
}

/**
 * Build a weakness profile from raw per-question history.
 */
export function buildWeaknessProfile(
  chapterId: string,
  section: 'maths' | 'english' | 'arcade',
  history: QuestionAttempt[],
): WeaknessProfile {
  const byType: Record<string, { attempts: number; correct: number; lastWrong: string | null; recentCorrect: number; recentTotal: number }> = {};

  // Sort by timestamp ascending
  const sorted = [...history].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  for (const attempt of sorted) {
    if (!byType[attempt.gameTypeId]) {
      byType[attempt.gameTypeId] = { attempts: 0, correct: 0, lastWrong: null, recentCorrect: 0, recentTotal: 0 };
    }
    const entry = byType[attempt.gameTypeId];
    entry.attempts++;
    if (attempt.correct) entry.correct++;
    else entry.lastWrong = attempt.timestamp;

    // Recent = last 20 attempts per type
    if (entry.attempts > Math.max(0, entry.attempts - 20)) {
      entry.recentTotal++;
      if (attempt.correct) entry.recentCorrect++;
    }
  }

  const gameTypes: Record<string, GameTypeAccuracy> = {};
  for (const [gtId, data] of Object.entries(byType)) {
    const rawAcc = data.attempts > 0 ? data.correct / data.attempts : 0;
    const recentAcc = data.recentTotal > 0 ? data.recentCorrect / data.recentTotal : rawAcc;
    // Weighted: 30% all-time + 70% recent
    const weightedAccuracy = rawAcc * 0.3 + recentAcc * 0.7;

    gameTypes[gtId] = {
      gameTypeId: gtId,
      attempts: data.attempts,
      correct: data.correct,
      weightedAccuracy,
      lastWrong: data.lastWrong,
    };
  }

  // Sort weakest first
  const weakestFirst = Object.values(gameTypes)
    .sort((a, b) => a.weightedAccuracy - b.weightedAccuracy)
    .map(g => g.gameTypeId);

  return { chapterId, section, gameTypes, weakestFirst };
}

// ── Question attempt record ────────────────────────────────

export interface QuestionAttempt {
  questionId: string;
  gameTypeId: string;
  difficulty: Difficulty;
  correct: boolean;
  timestamp: string; // ISO
}

// ── Revision question selection ────────────────────────────

export interface RevisionBatchRequest {
  chapter: CurriculumChapter;
  chapterProgress: ChapterProgress;
  weakness: WeaknessProfile;
  config?: RevisionConfig;
  batchSize: number;
  usedSignatures: Set<string>;
}

/**
 * Determine the difficulty mix for a revision batch.
 * Weakness-biased: more questions from tiers with lower accuracy.
 */
export function computeRevisionMix(
  progress: ChapterProgress,
  config: RevisionConfig = DEFAULT_REVISION,
): Record<Difficulty, number> {
  const acc = {
    easy: chapterAccuracy(progress, 'easy'),
    intermediate: chapterAccuracy(progress, 'intermediate'),
    difficult: chapterAccuracy(progress, 'difficult'),
  };

  // Invert accuracy to get weakness weights
  const w = {
    easy: Math.max(0.05, 1 - acc.easy),
    intermediate: Math.max(0.05, 1 - acc.intermediate),
    difficult: Math.max(0.05, 1 - acc.difficult),
  };

  const total = w.easy + w.intermediate + w.difficult;

  // Blend default mix (30%) with weakness weights (70%)
  return {
    easy:         config.defaultMix.easy * 0.3 + (w.easy / total) * 0.7,
    intermediate: config.defaultMix.intermediate * 0.3 + (w.intermediate / total) * 0.7,
    difficult:    config.defaultMix.difficult * 0.3 + (w.difficult / total) * 0.7,
  };
}

/**
 * Pick which game types to focus on in revision.
 * Returns an ordered list of game type IDs, weighted toward weaknesses.
 */
export function selectRevisionGameTypes(
  chapter: CurriculumChapter,
  weakness: WeaknessProfile,
  batchSize: number,
): string[] {
  const available = chapter.gameTypes;
  const ordered = weakness.weakestFirst.filter(gt => available.includes(gt));

  // Add any game types the user hasn't attempted yet
  const unattempted = available.filter(gt => !ordered.includes(gt));
  const fullList = [...ordered, ...unattempted];

  if (fullList.length === 0) return available;

  // Build weighted selection: weakest game types selected more often
  const selected: string[] = [];
  for (let i = 0; i < batchSize; i++) {
    // Weighted: first half of list gets 3× weight
    const halfIdx = Math.ceil(fullList.length / 2);
    const useWeakPool = Math.random() < 0.7 && halfIdx > 0;
    const pool = useWeakPool ? fullList.slice(0, halfIdx) : fullList;
    selected.push(pick(pool));
  }

  return selected;
}

/**
 * Build GeneratorParams for a revision question at a given difficulty.
 * Uses the chapter's tier complexity base.
 */
export function revisionParams(
  chapter: CurriculumChapter,
  difficulty: Difficulty,
): GeneratorParams {
  const complexity = chapter.tiers[difficulty].complexityBase;
  return buildParams(difficulty, complexity);
}

/**
 * Plan a revision batch: returns an array of { gameTypeId, difficulty, params }
 * that the caller should pass to the appropriate section generator.
 */
export function planRevisionBatch(
  request: RevisionBatchRequest,
): RevisionPlan[] {
  const config = request.config ?? DEFAULT_REVISION;
  const mix = computeRevisionMix(request.chapterProgress, config);

  // Determine how many questions per difficulty
  const easyCt    = Math.max(1, Math.round(request.batchSize * mix.easy));
  const interCt   = Math.max(1, Math.round(request.batchSize * mix.intermediate));
  const hardCt    = Math.max(1, request.batchSize - easyCt - interCt);

  const gameTypes = selectRevisionGameTypes(
    request.chapter,
    request.weakness,
    request.batchSize,
  );

  const plan: RevisionPlan[] = [];
  let gtIdx = 0;

  const addPlans = (diff: Difficulty, count: number) => {
    const params = revisionParams(request.chapter, diff);
    for (let i = 0; i < count; i++) {
      plan.push({
        gameTypeId: gameTypes[gtIdx % gameTypes.length],
        difficulty: diff,
        params,
      });
      gtIdx++;
    }
  };

  addPlans('easy', easyCt);
  addPlans('intermediate', interCt);
  addPlans('difficult', hardCt);

  return shuffle(plan);
}

export interface RevisionPlan {
  gameTypeId: string;
  difficulty: Difficulty;
  params: GeneratorParams;
}

// ── Spaced repetition helpers ──────────────────────────────

/**
 * Compute a priority score for a game type in revision.
 * Higher = should appear sooner.
 * Based on time since last wrong answer + low accuracy.
 */
export function revisionPriority(gta: GameTypeAccuracy): number {
  let score = 0;

  // Low accuracy → high priority (max 60 points)
  score += (1 - gta.weightedAccuracy) * 60;

  // Low attempts → slightly higher priority (encourage coverage)
  if (gta.attempts < 10) score += 15;
  else if (gta.attempts < 25) score += 5;

  // Recent wrong answer → higher priority
  if (gta.lastWrong) {
    const hoursSince = (Date.now() - new Date(gta.lastWrong).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 1) score += 25;
    else if (hoursSince < 24) score += 15;
    else if (hoursSince < 72) score += 8;
  }

  return Math.round(score);
}

/**
 * Get all game types sorted by revision priority (highest first).
 */
export function prioritizedGameTypes(weakness: WeaknessProfile): Array<{ gameTypeId: string; priority: number }> {
  return Object.values(weakness.gameTypes)
    .map(gta => ({ gameTypeId: gta.gameTypeId, priority: revisionPriority(gta) }))
    .sort((a, b) => b.priority - a.priority);
}

// ── Adaptive complexity adjustment ─────────────────────────

/**
 * Adjust complexity multiplier based on recent performance.
 * Called after each session within revision mode.
 *
 * If accuracy > 90%: bump complexity up (+0.1, max 3.0)
 * If accuracy < 60%: bump down (-0.1, min 0.5)
 * Otherwise: keep same.
 */
export function adaptComplexity(
  currentComplexity: number,
  sessionAccuracy: number,
): number {
  if (sessionAccuracy > 0.90) return Math.min(3.0, +(currentComplexity + 0.1).toFixed(2));
  if (sessionAccuracy < 0.60) return Math.max(0.5, +(currentComplexity - 0.1).toFixed(2));
  return currentComplexity;
}

// ── Revision eligibility ───────────────────────────────────

/**
 * Check if revision mode is available for a chapter.
 * Requires the Difficult tier to be complete.
 */
export function isRevisionUnlocked(progress: ChapterProgress): boolean {
  return progress.difficultComplete;
}

/**
 * Section-level revision — available when ALL chapters in section have revision unlocked.
 */
export function isSectionRevisionUnlocked(progresses: ChapterProgress[]): boolean {
  return progresses.length > 0 && progresses.every(p => isRevisionUnlocked(p));
}

// ── Session summary for revision ───────────────────────────

export interface RevisionSessionSummary {
  chapterId: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  difficultyBreakdown: Record<Difficulty, { asked: number; correct: number }>;
  weakestGameType: string | null;
  strongestGameType: string | null;
  complexityAdjustment: number; // +0.1, -0.1, or 0
}

export function buildRevisionSummary(
  chapterId: string,
  attempts: QuestionAttempt[],
  previousComplexity: number,
): RevisionSessionSummary {
  const byDiff: Record<Difficulty, { asked: number; correct: number }> = {
    easy: { asked: 0, correct: 0 },
    intermediate: { asked: 0, correct: 0 },
    difficult: { asked: 0, correct: 0 },
  };
  const byType: Record<string, { asked: number; correct: number }> = {};

  for (const a of attempts) {
    byDiff[a.difficulty].asked++;
    if (a.correct) byDiff[a.difficulty].correct++;

    if (!byType[a.gameTypeId]) byType[a.gameTypeId] = { asked: 0, correct: 0 };
    byType[a.gameTypeId].asked++;
    if (a.correct) byType[a.gameTypeId].correct++;
  }

  const total = attempts.length;
  const correct = attempts.filter(a => a.correct).length;
  const accuracy = total > 0 ? correct / total : 0;

  // Find weakest / strongest game type
  const typeAccuracies = Object.entries(byType)
    .filter(([, v]) => v.asked >= 2)
    .map(([id, v]) => ({ id, acc: v.correct / v.asked }))
    .sort((a, b) => a.acc - b.acc);

  const weakest = typeAccuracies.length > 0 ? typeAccuracies[0].id : null;
  const strongest = typeAccuracies.length > 0 ? typeAccuracies[typeAccuracies.length - 1].id : null;

  const newComplexity = adaptComplexity(previousComplexity, accuracy);
  const adj = +(newComplexity - previousComplexity).toFixed(2);

  return {
    chapterId,
    totalQuestions: total,
    correctAnswers: correct,
    accuracy,
    difficultyBreakdown: byDiff,
    weakestGameType: weakest,
    strongestGameType: strongest,
    complexityAdjustment: adj,
  };
}
