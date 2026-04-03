/**
 * games/curriculum/mathsCurriculum.ts — Maths World chapter map
 * ══════════════════════════════════════════════════════════════
 * 9 chapters, each with 3 difficulty tiers and ≥300 variations per tier.
 * Aligned to NCERT + GSEB Std 1 maths syllabus.
 *
 * Chapters: Numbers · Addition · Subtraction · Shapes · Patterns ·
 *           Measurement · Time · Money · Data Handling
 *
 * ⚠ DO NOT modify hub UI, Phase 2 engine core, or Color Magic.
 */

import type { CurriculumChapter } from './curriculumTypes';

export const MATHS_CHAPTERS: CurriculumChapter[] = [
  {
    id: 'numbers',
    title: 'Numbers 1–100',
    icon: '🔢',
    section: 'maths',
    order: 1,
    description: 'Count, compare, order, and understand numbers up to 100.',
    gameTypes: ['count_match', 'number_order', 'compare_numbers', 'missing_number', 'number_name', 'number_line'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Count objects 1–20', 'Compare bigger/smaller', 'Match number to objects', 'Missing number (small gaps)'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Count 1–50', 'Before/after numbers', 'Mixed sequence gaps', 'Compare 2-digit numbers', 'Visual number lines'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Word-based number problems', 'Mixed comparison logic', 'Pattern-based number jumps', 'Numbers up to 100'],
      },
    },
  },
  {
    id: 'addition',
    title: 'Addition',
    icon: '➕',
    section: 'maths',
    order: 2,
    description: 'Adding numbers with visual aids, story problems, and mental math.',
    gameTypes: ['adding_apples', 'match_sum', 'add_missing', 'add_story', 'add_visual', 'add_doubles'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Add within 10', 'Counting on with objects', 'Sum matching', 'Visual addition'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Add within 20', 'Missing addend', 'Story sums', 'Add 3 numbers'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Add within 50', 'Word problems', 'Multi-step addition', 'Addition patterns'],
      },
    },
  },
  {
    id: 'subtraction',
    title: 'Subtraction',
    icon: '➖',
    section: 'maths',
    order: 3,
    description: 'Taking away, finding differences, and subtraction word problems.',
    gameTypes: ['take_away', 'sub_missing', 'sub_story', 'sub_visual', 'sub_compare'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Subtract within 10', 'Take away with objects', 'Visual subtraction'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Subtract within 20', 'Find the difference', 'Missing subtrahend'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Subtract within 50', 'Word problems', 'Multi-step subtraction'],
      },
    },
  },
  {
    id: 'shapes',
    title: 'Shapes',
    icon: '🔺',
    section: 'maths',
    order: 4,
    description: 'Identify, name, compare, and build with 2D and 3D shapes.',
    gameTypes: ['name_shape', 'count_shapes', 'shape_properties', 'shape_match', 'shape_sort'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Name basic shapes (circle, square, triangle, rectangle)', 'Count shapes in scene', 'Match shape to name'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Identify pentagon, hexagon, oval', 'Shape properties (sides, corners)', 'Shapes in real life'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['3D shapes (cube, sphere, cylinder)', 'Composite shapes', 'Symmetry basics'],
      },
    },
  },
  {
    id: 'patterns',
    title: 'Patterns',
    icon: '🔁',
    section: 'maths',
    order: 5,
    description: 'Recognize, continue, and create repeating and growing patterns.',
    gameTypes: ['continue_pattern', 'pattern_rule', 'pattern_create', 'number_pattern'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Repeat 2-element color patterns', 'Continue AB patterns', 'Shape-based patterns'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['3-element patterns (ABC)', 'Missing element in pattern', 'Number patterns (+1, +2)'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Dual-rule patterns (color+shape)', 'Growing patterns', 'Skip counting patterns'],
      },
    },
  },
  {
    id: 'measurement',
    title: 'Measurement',
    icon: '📏',
    section: 'maths',
    order: 6,
    description: 'Length, weight, capacity — compare, estimate, and measure.',
    gameTypes: ['compare_lengths', 'compare_weights', 'measure_match', 'length_estimate', 'capacity_compare'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Longer/shorter', 'Heavier/lighter', 'Taller/shorter comparisons'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Measure with non-standard units', 'Order by length', 'Compare capacity'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Estimate measurements', 'Mixed unit comparison', 'Multi-object ordering'],
      },
    },
  },
  {
    id: 'time',
    title: 'Time',
    icon: '🕐',
    section: 'maths',
    order: 7,
    description: 'Read clocks, understand hours, half-hours, and daily events.',
    gameTypes: ['read_clock', 'time_order', 'time_match', 'daily_events'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Read o\'clock times', 'Morning/afternoon/night', 'Order daily events'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Read half-hour times', 'Before/after time concept', 'Days of the week order'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Quarter hours', 'Time word problems', 'Months and seasons order'],
      },
    },
  },
  {
    id: 'money',
    title: 'Money',
    icon: '💰',
    section: 'maths',
    order: 8,
    description: 'Identify coins, count money, and solve simple purchase problems.',
    gameTypes: ['count_coins', 'money_match', 'money_compare', 'money_story', 'make_amount'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Identify ₹1, ₹2, ₹5 coins', 'Count 2–3 coins', 'Match coin to value'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Add coins up to ₹20', 'Compare amounts', 'Make an amount with coins'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Notes ₹10, ₹20, ₹50', 'Purchase word problems', 'Change calculation'],
      },
    },
  },
  {
    id: 'data',
    title: 'Data Handling',
    icon: '📊',
    section: 'maths',
    order: 9,
    description: 'Collect, sort, count, and read simple charts and graphs.',
    gameTypes: ['count_sort', 'more_or_less', 'read_chart', 'tally_count', 'bar_read'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Sort by one attribute', 'Count objects by category', 'Read picture charts'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Two-attribute sorting', 'Tally marks', 'Compare category counts'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Read simple bar graphs', 'Answer most/least questions', 'Create tally tables'],
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
