/**
 * games/curriculum/mathsCurriculum.ts — Maths World chapter map
 * ══════════════════════════════════════════════════════════════
 * 4 chapters aligned to Std 5 NCERT Maths syllabus.
 * Chapters: Fractions & Patterns · Geometry & Angles ·
 *           Multiplication & Jumps · Time & Data
 */

import type { CurriculumChapter } from './curriculumTypes';

export const MATHS_CHAPTERS: CurriculumChapter[] = [
  {
    id: 'fractions',
    title: 'Fractions & Patterns 🍕',
    icon: '🍕',
    section: 'maths',
    order: 1,
    description: 'Understand fractions with pizza/pie models and solve fraction addition puzzles.',
    gameTypes: ['fraction_pizza', 'pattern_game', 'fraction_puzzle'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Identify halves and quarters', 'Continue simple patterns', 'Basic fraction names'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Fractions with denominators up to 8', 'ABC patterns', 'Fraction addition with same denominator'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Fractions up to 1/10', 'Complex patterns', 'Mixed fraction operations'],
      },
    },
  },
  {
    id: 'geometry',
    title: 'Geometry & Angles 📐',
    icon: '📐',
    section: 'maths',
    order: 2,
    description: 'Explore angles, turns, symmetry and weight comparisons.',
    gameTypes: ['angle_turn', 'symmetry_game', 'weight_game'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['90° right and left turns', 'Identify symmetrical shapes', 'Heaviest/lightest basic'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['180° turns', 'Lines of symmetry', 'Multi-object weight comparison'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Mixed turn directions', 'Symmetry in irregular shapes', 'Estimated weight problems'],
      },
    },
  },
  {
    id: 'multiplication',
    title: 'Multiplication & Jumps 🔢',
    icon: '🔢',
    section: 'maths',
    order: 3,
    description: 'Practice multiplication through farm context, frog jumps and number sequences.',
    gameTypes: ['coconut_farm', 'frog_jump', 'pattern_puzzle'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Multiply 2×2 to 5×5', 'Jump by 2s and 5s', 'Simple number sequences (+2, +5)'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Multiply up to 9×9', 'Longer jump sequences', 'Growing number patterns'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Multiply up to 12×12', 'Complex sequences (squares, cubes)', 'Fibonacci & skip patterns'],
      },
    },
  },
  {
    id: 'time_data',
    title: 'Time & Data ⏰',
    icon: '⏰',
    section: 'maths',
    order: 4,
    description: 'Convert time units, solve time word problems, and read data charts.',
    gameTypes: ['time_game', 'time_puzzle', 'data_graph'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Seconds, minutes, hours, days', 'Add 1 hour to a time', 'Read simple bar graphs'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Convert minutes ↔ seconds', 'Time word problems (train/school)', 'Most/least popular in data'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Multi-step time problems', 'Journey duration calculations', 'Complex graph analysis'],
      },
    },
  },
];

/** Quick access by chapter ID */
export const MATHS_CHAPTER_MAP = Object.fromEntries(
  MATHS_CHAPTERS.map(ch => [ch.id, ch]),
) as Record<string, CurriculumChapter>;

/** All maths game type IDs (deduped) */
export const ALL_MATHS_GAME_TYPES = [
  ...new Set(MATHS_CHAPTERS.flatMap(ch => ch.gameTypes)),
];
