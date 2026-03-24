/**
 * Subject Games – Types, Constants & Chapter Definitions
 * ======================================================
 */

export type Difficulty = 'easy' | 'intermediate' | 'difficult';
export type Subject = 'english' | 'maths';

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
  { id: 'vocabulary', title: 'Vocabulary Builder', icon: '📚', gradient: 'from-blue-400 to-cyan-400', games: [
    { id: 'synonym_match', title: 'Synonym Match', icon: '🔁' },
    { id: 'antonym_match', title: 'Antonym Match', icon: '↔️' },
    { id: 'homophones', title: 'Homophones', icon: '🔊' },
  ]},
  { id: 'grammar', title: 'Nouns • Pronouns • Adjectives', icon: '🧩', gradient: 'from-rose-400 to-pink-400', games: [
    { id: 'find_noun', title: 'Find the Noun', icon: '🔎' },
    { id: 'pronoun_replace', title: 'Pronoun Replace', icon: '🧍' },
    { id: 'identify_adjective', title: 'Identify Adjective', icon: '✨' },
  ]},
  { id: 'tenses', title: 'Verbs & Tenses', icon: '⏳', gradient: 'from-green-400 to-emerald-400', games: [
    { id: 'find_verb', title: 'Find the Verb', icon: '🏃' },
    { id: 'tense_select', title: 'Choose the Tense', icon: '✅' },
    { id: 'subject_verb_agreement', title: 'Subject–Verb Match', icon: '🤝' },
  ]},
  { id: 'usage', title: 'Articles & Prepositions', icon: '🧠', gradient: 'from-orange-400 to-red-400', games: [
    { id: 'article_fill', title: 'A / An / The', icon: '🅰️' },
    { id: 'preposition_pick', title: 'Pick a Preposition', icon: '📍' },
    { id: 'conjunction_choice', title: 'Choose a Conjunction', icon: '🔗' },
  ]},
  { id: 'sentences', title: 'Sentence & Punctuation', icon: '✍️', gradient: 'from-yellow-400 to-orange-400', games: [
    { id: 'word_order', title: 'Word Order', icon: '🔀' },
    { id: 'missing_word', title: 'Missing Word', icon: '❓' },
    { id: 'punctuation_fix', title: 'Fix Punctuation', icon: '📝' },
  ]},
  { id: 'reading', title: 'Reading Skills', icon: '📖', gradient: 'from-amber-400 to-orange-400', games: [
    { id: 'comprehension', title: 'Comprehension', icon: '🧾' },
    { id: 'main_idea', title: 'Main Idea', icon: '💡' },
    { id: 'sequence_story', title: 'Story Sequence', icon: '🧵' },
  ]},
];

export const MATHS_CHAPTERS: ChapterDef[] = [
  { id: 'place_value', title: 'Place Value & Rounding', icon: '🔟', gradient: 'from-amber-500 to-orange-500', games: [
    { id: 'place_value_digit', title: 'Digit Place Value', icon: '📍' },
    { id: 'expanded_form', title: 'Expanded Form', icon: '🧮' },
    { id: 'rounding', title: 'Rounding', icon: '🎯' },
  ]},
  { id: 'add_sub', title: 'Addition & Subtraction', icon: '➕', gradient: 'from-green-500 to-teal-500', games: [
    { id: 'add_sub_4digit', title: 'Add/Sub (Big Numbers)', icon: '🔢' },
    { id: 'word_problem_addsub', title: 'Word Problems', icon: '🧠' },
    { id: 'compare_numbers', title: 'Compare Numbers', icon: '⚖️' },
  ]},
  { id: 'mul_div', title: 'Multiplication & Division', icon: '✖️', gradient: 'from-rose-500 to-pink-500', games: [
    { id: 'multiply_2x1', title: '2-Digit × 1-Digit', icon: '✖️' },
    { id: 'multiply_2x2', title: '2-Digit × 2-Digit', icon: '🧮' },
    { id: 'divide_basic', title: 'Division', icon: '➗' },
  ]},
  { id: 'fractions', title: 'Fractions & Decimals', icon: '½', gradient: 'from-orange-500 to-amber-500', games: [
    { id: 'fraction_equivalent', title: 'Equivalent Fractions', icon: '🟰' },
    { id: 'fraction_compare', title: 'Compare Fractions', icon: '📏' },
    { id: 'decimal_place', title: 'Decimal Place Value', icon: '•' },
  ]},
  { id: 'geometry', title: 'Geometry', icon: '📐', gradient: 'from-cyan-500 to-blue-500', games: [
    { id: 'angles_type', title: 'Angle Type', icon: '📐' },
    { id: 'perimeter_rect', title: 'Perimeter', icon: '📏' },
    { id: 'area_rect', title: 'Area', icon: '⬛' },
  ]},
  { id: 'time_data', title: 'Time, Money & Data', icon: '⏱️', gradient: 'from-rose-500 to-pink-500', games: [
    { id: 'time_elapsed', title: 'Elapsed Time', icon: '⏳' },
    { id: 'money_change', title: 'Money Change', icon: '💰' },
    { id: 'read_chart', title: 'Read a Chart', icon: '📊' },
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
