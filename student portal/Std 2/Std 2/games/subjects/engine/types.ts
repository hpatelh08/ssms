/**
 * Subject Games – Types, Constants & Chapter Definitions
 * ======================================================
 */

export type Difficulty = 'easy' | 'intermediate' | 'difficult';
export type Subject = 'english' | 'maths' | 'science';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
}

export interface GameTypeDef {
  id: string;
  title: string;
  icon: string;
}

export interface ChapterDef {
  id: string;
  title: string;
  icon: string;
  gradient: string;
  games: GameTypeDef[];
}

// ── XP Constants ──

export const XP_PER_Q: Record<Difficulty, number> = { easy: 2, intermediate: 5, difficult: 10 };
export const XP_MINI_BONUS = 20;
export const XP_DIFF_BONUS = 50;
export const XP_ALL_BONUS = 150;

// ── Difficulty metadata ──

export const DIFFICULTIES: Difficulty[] = ['easy', 'intermediate', 'difficult'];

export const DIFF_META: Record<Difficulty, { label: string; emoji: string; gradient: string; ring: string; bg: string }> = {
  easy:         { label: 'Easy',         emoji: '🟢', gradient: 'from-green-400 to-emerald-400', ring: 'ring-green-400',  bg: 'bg-green-50' },
  intermediate: { label: 'Intermediate', emoji: '🟡', gradient: 'from-amber-400 to-yellow-400',  ring: 'ring-amber-400',  bg: 'bg-amber-50' },
  difficult:    { label: 'Difficult',    emoji: '🔴', gradient: 'from-red-400 to-rose-400',      ring: 'ring-red-400',    bg: 'bg-red-50' },
};

// ── Chapter Definitions ──

export const ENGLISH_CHAPTERS: ChapterDef[] = [
  { id: 'alphabet', title: 'Alphabet World', icon: '🔤', gradient: 'from-blue-400 to-cyan-400', games: [
    { id: 'letter_match', title: 'Letter Match', icon: '🔡' },
    { id: 'letter_order', title: 'Letter Order', icon: '📊' },
    { id: 'letter_sound', title: 'Letter Sound', icon: '🔊' },
  ]},
  { id: 'vowels', title: 'Vowels & Consonants', icon: '🅰️', gradient: 'from-rose-400 to-pink-400', games: [
    { id: 'classify_letter', title: 'Classify Letter', icon: '📋' },
    { id: 'find_vowel', title: 'Find the Vowel', icon: '🔍' },
    { id: 'fill_vowel', title: 'Fill the Vowel', icon: '✏️' },
  ]},
  { id: 'nouns', title: 'Nouns', icon: '📦', gradient: 'from-green-400 to-emerald-400', games: [
    { id: 'find_noun', title: 'Find the Noun', icon: '🔎' },
    { id: 'noun_hunt', title: 'Noun Hunt', icon: '🎯' },
    { id: 'plural_maker', title: 'Plural Maker', icon: '📝' },
  ]},
  { id: 'verbs', title: 'Verbs', icon: '🏃', gradient: 'from-orange-400 to-red-400', games: [
    { id: 'find_verb', title: 'Find the Verb', icon: '🔎' },
    { id: 'action_match', title: 'Action Match', icon: '🎬' },
    { id: 'verb_or_not', title: 'Verb or Not', icon: '❓' },
  ]},
  { id: 'opposites', title: 'Opposites', icon: '↔️', gradient: 'from-yellow-400 to-orange-400', games: [
    { id: 'match_opposite', title: 'Match Opposite', icon: '🔗' },
    { id: 'find_opposite', title: 'Find Opposite', icon: '🔍' },
    { id: 'complete_opposite', title: 'Complete Opp.', icon: '✍️' },
  ]},
  { id: 'sentences', title: 'Sentence Building', icon: '📝', gradient: 'from-amber-400 to-orange-400', games: [
    { id: 'word_order', title: 'Word Order', icon: '🔀' },
    { id: 'missing_word', title: 'Missing Word', icon: '❓' },
    { id: 'sentence_fix', title: 'Pick Correct', icon: '✅' },
  ]},
];

export const MATHS_CHAPTERS: ChapterDef[] = [
  { id: 'numbers', title: 'Number Sense', icon: '🔢', gradient: 'from-amber-500 to-orange-500', games: [
    { id: 'count_match', title: 'Count & Match', icon: '🎯' },
    { id: 'number_order', title: 'Number Order', icon: '📊' },
    { id: 'compare_numbers', title: 'Compare Numbers', icon: '⚖️' },
  ]},
  { id: 'addition', title: 'Addition & Subtraction', icon: '➕', gradient: 'from-green-500 to-teal-500', games: [
    { id: 'adding_apples', title: 'Adding Apples', icon: '🍎' },
    { id: 'take_away', title: 'Take Away', icon: '➖' },
    { id: 'match_sum', title: 'Match the Sum', icon: '🧮' },
  ]},
  { id: 'shapes', title: 'Shapes & Patterns', icon: '🔺', gradient: 'from-rose-500 to-pink-500', games: [
    { id: 'name_shape', title: 'Name the Shape', icon: '📐' },
    { id: 'continue_pattern', title: 'Continue Pattern', icon: '🔁' },
    { id: 'count_shapes', title: 'Count Shapes', icon: '🔢' },
  ]},
  { id: 'measurement', title: 'Measurement', icon: '📏', gradient: 'from-orange-500 to-amber-500', games: [
    { id: 'compare_lengths', title: 'Compare Lengths', icon: '📐' },
    { id: 'compare_weights', title: 'Compare Weights', icon: '⚖️' },
    { id: 'measure_match', title: 'Measure & Match', icon: '🎯' },
  ]},
  { id: 'time_money', title: 'Time & Money', icon: '🕐', gradient: 'from-cyan-500 to-blue-500', games: [
    { id: 'read_clock', title: 'Read the Clock', icon: '⏰' },
    { id: 'count_coins', title: 'Count Coins', icon: '💰' },
    { id: 'money_match', title: 'Money Match', icon: '🪙' },
  ]},
  { id: 'data', title: 'Data Handling', icon: '📊', gradient: 'from-rose-500 to-pink-500', games: [
    { id: 'count_sort', title: 'Count & Sort', icon: '📋' },
    { id: 'more_or_less', title: 'More or Less', icon: '📈' },
    { id: 'read_chart', title: 'Simple Chart', icon: '📊' },
  ]},
];

export const SCIENCE_CHAPTERS: ChapterDef[] = [
  { id: 'living_things', title: 'Living & Non-Living', icon: '🌱', gradient: 'from-green-500 to-emerald-500', games: [
    { id: 'classify_living', title: 'Classify Living', icon: '🔍' },
    { id: 'needs_of_living', title: 'Needs of Living', icon: '💧' },
    { id: 'living_quiz', title: 'Living Quiz', icon: '❓' },
  ]},
  { id: 'plants', title: 'Plants & Trees', icon: '🌿', gradient: 'from-lime-500 to-green-500', games: [
    { id: 'parts_of_plant', title: 'Parts of Plant', icon: '🪴' },
    { id: 'plant_needs', title: 'What Plants Need', icon: '☀️' },
    { id: 'plant_match', title: 'Plant Match', icon: '🎯' },
  ]},
  { id: 'animals', title: 'Animals & Habitats', icon: '🐾', gradient: 'from-amber-500 to-orange-500', games: [
    { id: 'animal_home', title: 'Animal Homes', icon: '🏠' },
    { id: 'animal_food', title: 'Animal Food', icon: '🍖' },
    { id: 'animal_classify', title: 'Animal Types', icon: '📋' },
  ]},
  { id: 'body', title: 'Our Body', icon: '🫀', gradient: 'from-rose-500 to-red-500', games: [
    { id: 'body_parts', title: 'Body Parts', icon: '🦴' },
    { id: 'sense_organs', title: 'Sense Organs', icon: '👁️' },
    { id: 'healthy_habits', title: 'Healthy Habits', icon: '🏃' },
  ]},
  { id: 'food', title: 'Food & Nutrition', icon: '🍎', gradient: 'from-red-500 to-rose-500', games: [
    { id: 'food_groups', title: 'Food Groups', icon: '🥗' },
    { id: 'healthy_food', title: 'Healthy or Junk', icon: '🍔' },
    { id: 'food_source', title: 'Food Sources', icon: '🌾' },
  ]},
  { id: 'water_air', title: 'Water & Air', icon: '💧', gradient: 'from-cyan-500 to-blue-500', games: [
    { id: 'water_uses', title: 'Water Uses', icon: '🚿' },
    { id: 'save_water', title: 'Save Water', icon: '♻️' },
    { id: 'air_around', title: 'Air Around Us', icon: '🌬️' },
  ]},
];

// ── Badge Definitions ──

export const BADGE_DEFS = {
  easy_star: { id: 'easy_star', title: 'Easy Star', icon: '⭐' },
  silver:    { id: 'silver',    title: 'Silver Badge', icon: '🥈' },
  golden:    { id: 'golden',    title: 'Golden Master', icon: '🏆' },
} as const;

// ── Progress Types ──

export interface MiniLevelProgress {
  completed: boolean;
  score: number;
  total: number;
}

export interface DifficultyProgress {
  miniLevels: Record<number, MiniLevelProgress>;
  completed: boolean;
  bestScore: number;
  timeTaken: number;
}

export interface GameProgress {
  easy: DifficultyProgress;
  intermediate: DifficultyProgress;
  difficult: DifficultyProgress;
  badges: string[];
}

export type GameMasteryStore = Record<string, GameProgress>;
