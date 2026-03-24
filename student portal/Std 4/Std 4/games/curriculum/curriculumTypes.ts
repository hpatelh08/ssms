/**
 * games/curriculum/curriculumTypes.ts — Core curriculum types
 * ════════════════════════════════════════════════════════════
 * Shared types for the 8-month structured learning system.
 * Every section (Maths, English, Arcade) uses these types
 * to define chapters, difficulty scaling, and progression.
 *
 * ⚠ DO NOT touch Color Magic or Phase 2 engine core.
 */

import type { Difficulty } from '../engine/difficultyTypes';

// ── Month phase mapping ────────────────────────────────────

export type MonthPhase =
  | 'foundation'   // Month 1–2 (Easy)
  | 'building'     // Month 3–4 (Intermediate)
  | 'mastery'      // Month 5–6 (Difficult)
  | 'revision';    // Month 7–8 (Mixed)

export const PHASE_TO_DIFFICULTY: Record<MonthPhase, Difficulty | 'mixed'> = {
  foundation: 'easy',
  building:   'intermediate',
  mastery:    'difficult',
  revision:   'mixed',
};

// ── Curriculum chapter ─────────────────────────────────────

export interface CurriculumChapter {
  id: string;
  title: string;
  icon: string;
  /** Which section this belongs to */
  section: 'maths' | 'english' | 'arcade';
  /** Ordered position within section (1-based) */
  order: number;
  /** Short syllabus description */
  description: string;
  /** Game type IDs within this chapter */
  gameTypes: string[];
  /** Difficulty scaling params per tier */
  tiers: {
    easy: TierConfig;
    intermediate: TierConfig;
    difficult: TierConfig;
  };
}

export interface TierConfig {
  /** Expected months (e.g. '1-2') */
  months: string;
  /** Minimum variations the generator must produce */
  minVariations: number;
  /** Complexity multiplier base for this tier+chapter */
  complexityBase: number;
  /** Description of what skills are practiced */
  skills: string[];
}

// ── Parameterized generator config ─────────────────────────

/**
 * Passed to every curriculum-aware generator.
 * Replaces the old simple (difficulty) → Question pattern.
 */
export interface GeneratorParams {
  difficulty: Difficulty;
  /** Effective complexity (tier base × adaptive internal) */
  complexity: number;
  /** Number range for numeric generators */
  numRange: [number, number];
  /** How many answer options */
  optionCount: number;
  /** Distractor difficulty (0–1, higher = trickier wrong answers) */
  distractorStrength: number;
}

/**
 * Build GeneratorParams from difficulty + complexity multiplier.
 */
export function buildParams(difficulty: Difficulty, complexity: number): GeneratorParams {
  const base: Record<Difficulty, { range: [number, number]; opts: number; dist: number }> = {
    easy:         { range: [1, 20],  opts: 3, dist: 0.3 },
    intermediate: { range: [1, 50],  opts: 4, dist: 0.5 },
    difficult:    { range: [1, 100], opts: 5, dist: 0.7 },
  };

  const b = base[difficulty];
  // Scale the upper range by complexity (e.g. 1.5× → 1–75 for intermediate)
  const scaledMax = Math.round(b.range[1] * complexity);

  return {
    difficulty,
    complexity,
    numRange: [b.range[0], Math.max(b.range[0] + 5, scaledMax)],
    optionCount: b.opts,
    distractorStrength: Math.min(1, b.dist * complexity),
  };
}

// ── Question with signature ────────────────────────────────

export interface CurriculumQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
  /** Deterministic signature for non-repetition */
  signature: string;
  /** Chapter + game type for tracking */
  chapter: string;
  gameType: string;
}

// ── Mastery badges ─────────────────────────────────────────

export type BadgeTier = 'chapter_star' | 'section_medal' | 'section_crown';

export interface MasteryBadge {
  id: string;
  tier: BadgeTier;
  title: string;
  icon: string;
  /** e.g. 'maths_numbers' for chapter star, 'maths' for section medal */
  scope: string;
}

// ── Mastery thresholds ─────────────────────────────────────

export const MASTERY_THRESHOLDS = {
  /** 70% accuracy over 25 levels to progress within tier */
  PROGRESS: { accuracy: 0.70, levels: 25 },
  /** 75% accuracy to unlock intermediate */
  UNLOCK_INTERMEDIATE: { accuracy: 0.75 },
  /** 80% sustained accuracy to mark chapter mastery */
  CHAPTER_MASTERY: { accuracy: 0.80, minAttempts: 50 },
  /** All chapters mastered in section → section medal */
  SECTION_MEDAL: { allChaptersMastered: true },
  /** Section medal + all difficulties done → crown */
  SECTION_CROWN: { allDifficultiesMastered: true },
} as const;

// ── Revision mode config ───────────────────────────────────

export interface RevisionConfig {
  /** Unlocked after completing Difficult tier */
  unlockRequirement: 'difficult_complete';
  /** Weighted random mix based on weakness */
  weightStrategy: 'weakness_biased';
  /** Mix ratio: percentage from each tier (sums to 1) */
  defaultMix: { easy: number; intermediate: number; difficult: number };
}

export const DEFAULT_REVISION: RevisionConfig = {
  unlockRequirement: 'difficult_complete',
  weightStrategy: 'weakness_biased',
  defaultMix: { easy: 0.2, intermediate: 0.3, difficult: 0.5 },
};

// ── Engagement milestones ──────────────────────────────────

export interface Milestone {
  id: string;
  title: string;
  icon: string;
  /** Trigger condition */
  trigger: 'every_25_levels' | 'daily_challenge' | 'weekly_summary' | 'surprise_bonus';
}

// ── Helpers ────────────────────────────────────────────────

let _uid = 0;
export function uid(): string {
  return `cq_${Date.now()}_${++_uid}_${Math.random().toString(36).slice(2, 6)}`;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickN<T>(arr: readonly T[], n: number): T[] {
  const a = [...arr];
  const out: T[] = [];
  while (out.length < n && a.length) {
    const i = Math.floor(Math.random() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
