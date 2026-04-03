/**
 * Subject Games â€“ Types, Constants & Chapter Definitions
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

// â”€â”€ XP Constants â”€â”€

export const XP_PER_Q: Record<Difficulty, number> = { easy: 2, intermediate: 5, difficult: 10 };
export const XP_MINI_BONUS = 20;
export const XP_DIFF_BONUS = 50;
export const XP_ALL_BONUS = 150;

// -- Difficulty metadata --

export const DIFFICULTIES: Difficulty[] = ['easy', 'intermediate', 'difficult'];

export const DIFF_META: Record<Difficulty, { label: string; emoji: string; gradient: string; ring: string; bg: string }> = {
  easy:         { label: 'Easy',         emoji: 'E', gradient: 'from-green-400 to-emerald-400', ring: 'ring-green-400',  bg: 'bg-green-50' },
  intermediate: { label: 'Intermediate', emoji: 'I', gradient: 'from-amber-400 to-yellow-400',  ring: 'ring-amber-400',  bg: 'bg-amber-50' },
  difficult:    { label: 'Difficult',    emoji: 'D', gradient: 'from-red-400 to-rose-400',      ring: 'ring-red-400',    bg: 'bg-red-50' },
};

export const LEVEL_COUNTS: Record<Difficulty, number> = {
  easy: 40,
  intermediate: 30,
  difficult: 30,
};

export const QUESTIONS_PER_LEVEL = 1;

// -- Chapter Definitions --

export const ENGLISH_CHAPTERS: ChapterDef[] = [
  {
    id: 'eng_u1_bottle_of_dew',
    title: 'U1: A Bottle of Dew',
    icon: 'ðŸ“˜',
    gradient: 'from-blue-400 to-cyan-400',
    games: [
      { id: 'find_noun', title: 'Noun Hunt', icon: '🔎' },
      { id: 'missing_word', title: 'Story Fill-Ups', icon: '❓' },
      { id: 'sentence_fix', title: 'Sentence Fixer', icon: '✅' },
    ],
  },
  {
    id: 'eng_u1_raven_fox',
    title: 'U1: The Raven and the Fox',
    icon: 'ðŸ¦Š',
    gradient: 'from-rose-400 to-pink-400',
    games: [
      { id: 'find_verb', title: 'Action Verbs', icon: '🏃' },
      { id: 'word_order', title: 'Jumbled Sentences', icon: '🔀' },
      { id: 'match_opposite', title: 'Word Pairs', icon: '🔗' },
    ],
  },
  {
    id: 'eng_u1_rama_rescue',
    title: 'U1: Rama to the Rescue',
    icon: 'ðŸ›Ÿ',
    gradient: 'from-green-400 to-emerald-400',
    games: [
      { id: 'action_match', title: 'Action Match', icon: '🎬' },
      { id: 'missing_word', title: 'Context Fill-Ups', icon: '❓' },
      { id: 'sentence_fix', title: 'Sentence Fixer', icon: '✅' },
    ],
  },
  {
    id: 'eng_u2_unlikely_best_friends',
    title: 'U2: The Unlikely Best Friends',
    icon: 'ðŸ¤',
    gradient: 'from-orange-400 to-red-400',
    games: [
      { id: 'find_noun', title: 'Friendship Nouns', icon: '🔎' },
      { id: 'word_order', title: 'Jumbled Sentences', icon: '🔀' },
      { id: 'sentence_fix', title: 'Sentence Fixer', icon: '✅' },
    ],
  },
  {
    id: 'eng_u2_friends_prayer',
    title: 'U2: A Friendâ€™s Prayer',
    icon: 'ðŸ™',
    gradient: 'from-yellow-400 to-orange-400',
    games: [
      { id: 'match_opposite', title: 'Word Pairs', icon: '🔗' },
      { id: 'missing_word', title: 'Context Fill-Ups', icon: '❓' },
      { id: 'word_order', title: 'Prayer Lines Order', icon: '🔀' },
    ],
  },
  {
    id: 'eng_u2_the_chair',
    title: 'U2: The Chair',
    icon: 'ðŸª‘',
    gradient: 'from-amber-400 to-orange-400',
    games: [
      { id: 'find_noun', title: 'Object Nouns', icon: '🔎' },
      { id: 'plural_maker', title: 'Singular vs Plural', icon: '📝' },
      { id: 'sentence_fix', title: 'Sentence Fixer', icon: '✅' },
    ],
  },
  {
    id: 'eng_u3_neem_baba',
    title: 'U3: Neem Baba',
    icon: 'ðŸŒ¿',
    gradient: 'from-green-400 to-emerald-400',
    games: [
      { id: 'noun_hunt', title: 'Nature Noun Hunt', icon: '🎯' },
      { id: 'find_verb', title: 'Nature Actions', icon: '🏃' },
      { id: 'missing_word', title: 'Nature Fill-Ups', icon: '❓' },
    ],
  },
  {
    id: 'eng_u3_what_bird_thought',
    title: 'U3: What a Bird Thought',
    icon: 'ðŸ¦',
    gradient: 'from-cyan-400 to-blue-400',
    games: [
      { id: 'action_match', title: 'Bird Action Match', icon: '🎬' },
      { id: 'word_order', title: 'Thought Sentences', icon: '🔀' },
      { id: 'sentence_fix', title: 'Sentence Fixer', icon: '✅' },
    ],
  },
  {
    id: 'eng_u3_spices_heal_us',
    title: 'U3: Spices that Heal Us',
    icon: 'ðŸŒ¶ï¸',
    gradient: 'from-lime-400 to-emerald-500',
    games: [
      { id: 'find_noun', title: 'Spice Nouns', icon: '🔎' },
      { id: 'match_opposite', title: 'Word Pairs', icon: '🔗' },
      { id: 'missing_word', title: 'Context Fill-Ups', icon: '❓' },
    ],
  },
  {
    id: 'eng_u4_change_of_heart',
    title: 'U4: Change of Heart',
    icon: 'ðŸ’š',
    gradient: 'from-orange-400 to-red-400',
    games: [
      { id: 'find_verb', title: 'Action Verbs', icon: '🏃' },
      { id: 'complete_opposite', title: 'Complete Opposites', icon: '✍️' },
      { id: 'sentence_fix', title: 'Sentence Fixer', icon: '✅' },
    ],
  },
  {
    id: 'eng_u4_the_winner',
    title: 'U4: The Winner',
    icon: 'ðŸ†',
    gradient: 'from-yellow-400 to-amber-500',
    games: [
      { id: 'action_match', title: 'Sports Action Match', icon: '🎬' },
      { id: 'word_order', title: 'Event Order', icon: '🔀' },
      { id: 'missing_word', title: 'Match Fill-Ups', icon: '❓' },
    ],
  },
  {
    id: 'eng_u4_yoga_way_of_life',
    title: 'U4: Yogaâ€”A Way of Life',
    icon: 'ðŸ§˜',
    gradient: 'from-emerald-400 to-teal-500',
    games: [
      { id: 'find_verb', title: 'Wellness Verbs', icon: '🔎' },
      { id: 'match_opposite', title: 'Health Opposites', icon: '🔗' },
      { id: 'sentence_fix', title: 'Sentence Fixer', icon: '✅' },
    ],
  },
  {
    id: 'eng_u5_hamara_bharat',
    title: 'U5: Hamara Bharatâ€”Incredible India!',
    icon: 'ðŸ‡®ðŸ‡³',
    gradient: 'from-fuchsia-400 to-rose-500',
    games: [
      { id: 'find_noun', title: 'Culture Noun Hunt', icon: '🔎' },
      { id: 'word_order', title: 'Culture Sentences', icon: '🔀' },
      { id: 'missing_word', title: 'Context Fill-Ups', icon: '❓' },
    ],
  },
  {
    id: 'eng_u5_the_kites',
    title: 'U5: The Kites',
    icon: 'ðŸª',
    gradient: 'from-sky-400 to-cyan-500',
    games: [
      { id: 'action_match', title: 'Kite Actions', icon: '🎬' },
      { id: 'find_opposite', title: 'Find Opposite', icon: '🔍' },
      { id: 'sentence_fix', title: 'Sentence Fixer', icon: '✅' },
    ],
  },
  {
    id: 'eng_u5_ila_sachani',
    title: 'U5: Ila Sachaniâ€”Embroidering Dreams',
    icon: 'ðŸ§µ',
    gradient: 'from-violet-400 to-purple-500',
    games: [
      { id: 'find_verb', title: 'Skill Actions', icon: '🏃' },
      { id: 'plural_maker', title: 'Singular vs Plural', icon: '📝' },
      { id: 'missing_word', title: 'Story Fill-Ups', icon: '❓' },
    ],
  },
  {
    id: 'eng_u5_national_war_memorial',
    title: 'U5: National War Memorial',
    icon: 'ðŸ•Šï¸',
    gradient: 'from-slate-500 to-zinc-600',
    games: [
      { id: 'find_noun', title: 'Memorial Nouns', icon: '🔎' },
      { id: 'word_order', title: 'Respect Sentences', icon: '🔀' },
      { id: 'sentence_fix', title: 'Sentence Fixer', icon: '✅' },
    ],
  },
];

export const MATHS_CHAPTERS: ChapterDef[] = [
  {
    id: 'math_u1_patterns',
    title: 'Unit 1: PATTERNS IN MATHEMATICS',
    icon: 'U1',
    gradient: 'from-amber-500 to-orange-500',
    games: [
      { id: 'math_u1_box1_number_patterns', title: 'Number Patterns', icon: '🔢' },
      { id: 'math_u1_box2_shape_patterns', title: 'Shape Patterns', icon: '🔷' },
      { id: 'math_u1_box3_pattern_relations', title: 'Pattern Relations', icon: '🧠' },
    ],
  },
  {
    id: 'math_u2_lines_angles',
    title: 'Unit 2: Lines and Angles',
    icon: 'U2',
    gradient: 'from-green-500 to-teal-500',
    games: [
      { id: 'math_u2_box1_points_lines', title: 'Points and Lines', icon: '📏' },
      { id: 'math_u2_box2_angle_basics', title: 'Angle Basics', icon: '📐' },
      { id: 'math_u2_box3_angle_measure', title: 'Angle Measurement', icon: '📊' },
    ],
  },
  {
    id: 'math_u3_number_play',
    title: 'Unit 3: NUMBER PLAY',
    icon: 'U3',
    gradient: 'from-rose-500 to-pink-500',
    games: [
      { id: 'math_u3_box1_number_tricks', title: 'Number Tricks', icon: '🎯' },
      { id: 'math_u3_box2_number_line', title: 'Number Line', icon: '↔️' },
      { id: 'math_u3_box3_mental_math', title: 'Mental Math', icon: '🧮' },
    ],
  },
  {
    id: 'math_u4_data_handling',
    title: 'Unit 4: Data Handling and Presentation',
    icon: 'U4',
    gradient: 'from-orange-500 to-amber-500',
    games: [
      { id: 'math_u4_box1_data_collection', title: 'Data Collection', icon: '🗂️' },
      { id: 'math_u4_box2_pictographs', title: 'Pictographs', icon: '🖼️' },
      { id: 'math_u4_box3_bar_graphs', title: 'Bar Graphs', icon: '📉' },
    ],
  },
  {
    id: 'math_u5_prime_time',
    title: 'Unit 5: Prime Time',
    icon: 'U5',
    gradient: 'from-cyan-500 to-blue-500',
    games: [
      { id: 'math_u5_box1_primes', title: 'Prime Numbers', icon: '🔍' },
      { id: 'math_u5_box2_factors', title: 'Factors', icon: '🌳' },
      { id: 'math_u5_box3_multiples', title: 'Multiples', icon: '✖️' },
    ],
  },
  {
    id: 'math_u6_perimeter_area',
    title: 'Unit 6: PERIMETER AND AREA',
    icon: 'U6',
    gradient: 'from-amber-500 to-orange-500',
    games: [
      { id: 'math_u6_box1_perimeter', title: 'Perimeter', icon: '📐' },
      { id: 'math_u6_box2_area', title: 'Area', icon: '🟧' },
      { id: 'math_u6_box3_shape_area', title: 'Shape Area', icon: '🔺' },
    ],
  },
  {
    id: 'math_u7_fractions',
    title: 'Unit 7: Fractions',
    icon: 'U7',
    gradient: 'from-green-500 to-teal-500',
    games: [
      { id: 'math_u7_box1_fraction_basics', title: 'Fraction Basics', icon: '🍕' },
      { id: 'math_u7_box2_fraction_line', title: 'Fraction Number Line', icon: '📏' },
      { id: 'math_u7_box3_fraction_ops', title: 'Fraction Operations', icon: '➕' },
    ],
  },
  {
    id: 'math_u8_constructions',
    title: 'Unit 8: Playing with Constructions',
    icon: 'U8',
    gradient: 'from-rose-500 to-pink-500',
    games: [
      { id: 'math_u8_box1_square_rectangle', title: 'Square & Rectangle', icon: '⬛' },
      { id: 'math_u8_box2_diagonals', title: 'Diagonals', icon: '╱' },
      { id: 'math_u8_box3_compass', title: 'Compass Construction', icon: '🧭' },
    ],
  },
  {
    id: 'math_u9_symmetry',
    title: 'Unit 9: Symmetry',
    icon: 'U9',
    gradient: 'from-orange-500 to-amber-500',
    games: [
      { id: 'math_u9_box1_line_symmetry', title: 'Line Symmetry', icon: '🪞' },
      { id: 'math_u9_box2_rotational_symmetry', title: 'Rotational Symmetry', icon: '🔄' },
      { id: 'math_u9_box3_symmetry_art', title: 'Symmetry Art', icon: '🎨' },
    ],
  },
  {
    id: 'math_u10_integers',
    title: 'Unit 10: The Other Side of Zero',
    icon: 'U10',
    gradient: 'from-cyan-500 to-blue-500',
    games: [
      { id: 'math_u10_box1_integer_basics', title: 'Integer Basics', icon: '🔢' },
      { id: 'math_u10_box2_integer_line', title: 'Integer Number Line', icon: '📍' },
      { id: 'math_u10_box3_integer_ops', title: 'Integer Operations', icon: '🧮' },
    ],
  },
];
// â”€â”€ Badge Definitions â”€â”€

export const BADGE_DEFS = {
  easy_star: { id: 'easy_star', title: 'Easy Star', icon: 'â­' },
  silver:    { id: 'silver',    title: 'Silver Badge', icon: 'ðŸ¥ˆ' },
  golden:    { id: 'golden',    title: 'Golden Master', icon: 'ðŸ†' },
} as const;

// â”€â”€ Progress Types â”€â”€

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



