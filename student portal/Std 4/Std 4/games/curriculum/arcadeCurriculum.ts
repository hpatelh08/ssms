/**
 * games/curriculum/arcadeCurriculum.ts — Arcade World chapter map
 * ═══════════════════════════════════════════════════════════════
 * 5 cognitive chapters, each with 3 difficulty tiers and ≥300 variations per tier.
 * Trains pattern recognition, memory, speed processing, visual logic, matching.
 *
 * Chapters: Pattern Recognition · Memory · Speed Processing ·
 *           Visual Logic · Matching Intelligence
 *
 * ⚠ DO NOT modify hub UI, Phase 2 engine core, or Color Magic.
 */

import type { CurriculumChapter } from './curriculumTypes';

export const ARCADE_CHAPTERS: CurriculumChapter[] = [
  {
    id: 'pattern_recognition',
    title: 'Pattern Recognition',
    icon: '🧩',
    section: 'arcade',
    order: 1,
    description: 'Spot shapes, colours, and number patterns at increasing complexity.',
    gameTypes: ['shapeQuest', 'continue_pattern', 'pattern_rule', 'pattern_spot', 'sequence_complete'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['2-element colour patterns', 'Simple shape sequences', 'Match the missing piece'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['3-element patterns', 'Dual-attribute sequences', 'Pattern rotation'],
      },
      difficult: {
        months: '5-6', minVariations: 600, complexityBase: 2.0,
        skills: ['Growing patterns', 'Nested patterns', 'Multi-rule sequences'],
      },
    },
  },
  {
    id: 'memory',
    title: 'Memory',
    icon: '🧠',
    section: 'arcade',
    order: 2,
    description: 'Train short-term memory with cards, sequences, and recall games.',
    gameTypes: ['pictureIdentify', 'memory_match', 'sequence_recall', 'spot_diff', 'memory_chain'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Match 4 pairs', 'Remember 3-item sequence', 'Spot 1 difference'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Match 6 pairs', 'Remember 5-item sequence', 'Spot 2 differences'],
      },
      difficult: {
        months: '5-6', minVariations: 600, complexityBase: 2.0,
        skills: ['Match 8+ pairs', 'Remember 7-item chain', 'Spot 3+ differences'],
      },
    },
  },
  {
    id: 'speed_processing',
    title: 'Speed Processing',
    icon: '⚡',
    section: 'arcade',
    order: 3,
    description: 'Quick reactions — tap, count, and classify under time pressure.',
    gameTypes: ['numberTap', 'mathPuzzle', 'speed_count', 'quick_sort', 'rapid_match'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Tap the correct number', 'Quick single-digit math', 'Count fast (≤10)'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Two-digit tap', 'Timed addition/subtraction', 'Sort 4 items by size'],
      },
      difficult: {
        months: '5-6', minVariations: 600, complexityBase: 2.0,
        skills: ['Mixed operation speed', 'Classify 6+ items under time', 'Chain calculations'],
      },
    },
  },
  {
    id: 'visual_logic',
    title: 'Visual Logic',
    icon: '👁️',
    section: 'arcade',
    order: 4,
    description: 'Spatial reasoning, odd one out, and visual comparison puzzles.',
    gameTypes: ['countObjects', 'odd_one_out', 'mirror_match', 'grid_logic', 'shadow_match'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Odd one out (colour)', 'Count scattered objects', 'Match to shadow'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Odd one out (multi-attribute)', 'Grid completion', 'Simple mirror/flip'],
      },
      difficult: {
        months: '5-6', minVariations: 600, complexityBase: 2.0,
        skills: ['Complex grid logic', 'Rotation matching', 'Multi-step visual deduction'],
      },
    },
  },
  {
    id: 'matching_intelligence',
    title: 'Matching Intelligence',
    icon: '🔗',
    section: 'arcade',
    order: 5,
    description: 'Advanced matching — words to pictures, sounds to letters, cross-domain links.',
    gameTypes: ['wordBuilder', 'guessTheWord', 'matchLetters', 'cross_match', 'category_sort'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Match letter to letter', 'Word to picture', 'Build 3-letter words'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Build 4-5 letter words', 'Cross-domain matching', 'Category sorting (3 groups)'],
      },
      difficult: {
        months: '5-6', minVariations: 600, complexityBase: 2.0,
        skills: ['Anagram solving', 'Multi-category sort', 'Complex cross-matching'],
      },
    },
  },
];

/** Quick access by chapter ID */
export const ARCADE_CHAPTER_MAP = Object.fromEntries(
  ARCADE_CHAPTERS.map(ch => [ch.id, ch]),
) as Record<string, CurriculumChapter>;

/** All arcade game type IDs (deduped) */
export const ALL_ARCADE_GAME_TYPES = [
  ...new Set(ARCADE_CHAPTERS.flatMap(ch => ch.gameTypes)),
];
