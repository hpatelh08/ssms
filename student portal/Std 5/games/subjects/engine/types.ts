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
  { id: 'unit1', title: "Let's Have Fun 🎉", icon: '🎉', gradient: 'from-blue-500 to-cyan-500', games: [
    { id: 'papas_spectacles', title: "Papa's Spectacles", icon: '👓' },
    { id: 'gone_with_scooter', title: 'Gone with the Scooter', icon: '🛵' },
  ]},
  { id: 'unit2', title: 'My Colourful World 🌈', icon: '🌈', gradient: 'from-rose-500 to-pink-500', games: [
    { id: 'the_rainbow', title: 'The Rainbow', icon: '🌈' },
    { id: 'wise_parrot', title: 'The Wise Parrot', icon: '🦜' },
  ]},
  { id: 'unit3', title: 'Water 💧', icon: '💧', gradient: 'from-cyan-500 to-blue-500', games: [
    { id: 'the_frog', title: 'The Frog', icon: '🐸' },
    { id: 'what_a_tank', title: 'What a Tank!', icon: '🚰' },
  ]},
  { id: 'unit4', title: 'Ups and Downs 🎢', icon: '🎢', gradient: 'from-yellow-500 to-orange-500', games: [
    { id: 'gilli_danda', title: 'Gilli Danda', icon: '🏏' },
    { id: 'panchayat', title: 'The Panchayat', icon: '👥' },
  ]},
  { id: 'unit5', title: 'Work is Worship 💼', icon: '💼', gradient: 'from-green-500 to-emerald-500', games: [
    { id: 'vocation', title: 'Vocation', icon: '💼' },
    { id: 'glass_bangles', title: 'Glass Bangles', icon: '💍' },
  ]},
];

export const MATHS_CHAPTERS: ChapterDef[] = [
  { id: 'fractions', title: 'Fractions & Patterns', icon: '🍕', gradient: 'from-orange-500 to-rose-500', games: [
    { id: 'fraction_pizza', title: 'Fraction Pizza', icon: '🍕' },
    { id: 'pattern_game', title: 'Pattern Game', icon: '🔺' },
    { id: 'fraction_puzzle', title: 'Fraction Puzzle', icon: '🧩' },
  ]},
  { id: 'geometry', title: 'Geometry & Angles', icon: '📐', gradient: 'from-emerald-500 to-lime-500', games: [
    { id: 'angle_turn', title: 'Angle Turn Game', icon: '🔄' },
    { id: 'symmetry_game', title: 'Symmetry Game', icon: '🪞' },
    { id: 'weight_game', title: 'Weight Game', icon: '⚖️' },
  ]},
  { id: 'multiplication', title: 'Multiplication & Jumps', icon: '🔢', gradient: 'from-green-500 to-teal-500', games: [
    { id: 'coconut_farm', title: 'Coconut Farm', icon: '🥥' },
    { id: 'frog_jump', title: 'Frog Jump Game', icon: '🐸' },
    { id: 'pattern_puzzle', title: 'Pattern Puzzle', icon: '🔢' },
  ]},
  { id: 'time_data', title: 'Time & Data', icon: '⏰', gradient: 'from-cyan-500 to-blue-500', games: [
    { id: 'time_game', title: 'Time Game', icon: '⏱️' },
    { id: 'time_puzzle', title: 'Time Puzzle', icon: '🕐' },
    { id: 'data_graph', title: 'Data Graph Game', icon: '📊' },
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
  stars?: number;      // 0=fail,1=1panda,2=2pandas,3=3pandas
  pandaCount?: number; // same as stars
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
