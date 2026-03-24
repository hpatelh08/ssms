/**
 * games/curriculum/index.ts — Barrel export
 * ════════════════════════════════════════════
 * Re-exports the entire curriculum layer for clean imports.
 */

// ── Core types ─────────────────────────────────────────────
export type {
  MonthPhase,
  CurriculumChapter,
  TierConfig,
  GeneratorParams,
  CurriculumQuestion,
  BadgeTier,
  MasteryBadge,
  RevisionConfig,
  Milestone,
} from './curriculumTypes';

export {
  PHASE_TO_DIFFICULTY,
  MASTERY_THRESHOLDS,
  DEFAULT_REVISION,
  buildParams,
  uid,
  pick,
  pickN,
  shuffle,
  randInt,
} from './curriculumTypes';

// ── Chapter definitions ────────────────────────────────────
export { MATHS_CHAPTERS, MATHS_CHAPTER_MAP, ALL_MATHS_GAME_TYPES } from './mathsCurriculum';
export { ENGLISH_CHAPTERS, ENGLISH_CHAPTER_MAP, ALL_ENGLISH_GAME_TYPES } from './englishCurriculum';
export { ARCADE_CHAPTERS, ARCADE_CHAPTER_MAP, ALL_ARCADE_GAME_TYPES } from './arcadeCurriculum';

// ── Generators ─────────────────────────────────────────────
export { MATHS_GENERATORS, generateMathsBatch, allMathsGameTypes } from './mathsGenerators';
export { ENGLISH_GENERATORS, generateEnglishBatch, allEnglishGameTypes } from './englishGenerators';
export { ARCADE_GENERATORS, generateArcadeBatch, allArcadeGameTypes } from './arcadeGenerators';

// ── Mastery system ─────────────────────────────────────────
export type {
  ChapterProgress,
  SessionResult,
  EarnedBadge,
  SectionSummary,
} from './masterySystem';

export {
  emptyProgress,
  chapterAccuracy,
  totalAttempts,
  isChapterMastered,
  canUnlockIntermediate,
  canUnlockDifficult,
  isTierComplete,
  allDifficultiesComplete,
  isSectionMastered,
  isSectionCrowned,
  chapterStarBadge,
  sectionMedalBadge,
  sectionCrownBadge,
  computeEarnedBadges,
  applySessionResult,
  calculateStreak,
  sectionSummary,
} from './masterySystem';

// ── Revision engine ────────────────────────────────────────
export type {
  GameTypeAccuracy,
  WeaknessProfile,
  QuestionAttempt,
  RevisionBatchRequest,
  RevisionPlan,
  RevisionSessionSummary,
} from './revisionEngine';

export {
  buildWeaknessProfile,
  computeRevisionMix,
  selectRevisionGameTypes,
  revisionParams,
  planRevisionBatch,
  revisionPriority,
  prioritizedGameTypes,
  adaptComplexity,
  isRevisionUnlocked,
  isSectionRevisionUnlocked,
  buildRevisionSummary,
} from './revisionEngine';
