/**
 * 🎮 Unified Game Engine – Types & Configuration
 * =================================================
 * Single source of truth for all game state, actions,
 * module interfaces, and game configurations.
 *
 * Supports 3 difficulty levels × 5 mini-levels × 5 questions each.
 * XP scales by difficulty: Easy→2, Intermediate→5, Difficult→10.
 */

// ─── Difficulty System ────────────────────────────────────

export type Difficulty = 'easy' | 'intermediate' | 'difficult';

export const DIFFICULTIES: Difficulty[] = ['easy', 'intermediate', 'difficult'];

export const DIFF_META: Record<Difficulty, { label: string; emoji: string; gradient: string; ring: string; bg: string }> = {
  easy:         { label: 'Easy',         emoji: '🟢', gradient: 'from-green-400 to-emerald-400', ring: 'ring-green-400',  bg: 'bg-green-50' },
  intermediate: { label: 'Intermediate', emoji: '🟡', gradient: 'from-amber-400 to-yellow-400',  ring: 'ring-amber-400',  bg: 'bg-amber-50' },
  difficult:    { label: 'Difficult',    emoji: '🔴', gradient: 'from-red-400 to-rose-400',      ring: 'ring-red-400',    bg: 'bg-red-50' },
};

export const XP_PER_DIFFICULTY: Record<Difficulty, number> = { easy: 2, intermediate: 5, difficult: 10 };
export const XP_MINI_BONUS = 20;
export const XP_DIFF_BONUS = 50;
export const XP_ALL_BONUS = 150;

export const QUESTIONS_PER_MINI_LEVEL = 5;
export const MINI_LEVELS_PER_DIFFICULTY = 5;

// ─── Game State (Single Source of Truth) ──────────────────

export type GameStatus = 'idle' | 'playing' | 'roundEnd' | 'complete';

export interface GameState {
  gameId: string;
  round: number;
  totalRounds: number;
  score: number;
  status: GameStatus;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean | null;
  answered: boolean;
  roundResults: Array<boolean | null>;
  xpEarned: number;
  startTime: number;
  difficulty: Difficulty;
}

export const initialState: GameState = {
  gameId: '',
  round: 1,
  totalRounds: 5,
  score: 0,
  status: 'idle',
  selectedAnswer: null,
  correctAnswer: null,
  isCorrect: null,
  answered: false,
  roundResults: Array(QUESTIONS_PER_MINI_LEVEL).fill(null),
  xpEarned: 0,
  startTime: 0,
  difficulty: 'easy',
};

// ─── Reducer Actions ──────────────────────────────────────

export type GameAction =
  | { type: 'START_GAME'; payload: { gameId: string; totalRounds?: number; difficulty?: Difficulty } }
  | { type: 'SET_CORRECT_ANSWER'; payload: string }
  | { type: 'SELECT_ANSWER'; payload: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'GAME_COMPLETE' }
  | { type: 'RESET_GAME' };

// ─── Module Interface ─────────────────────────────────────

export interface GameModuleProps {
  state: GameState;
  onSelectAnswer: (answer: string) => void;
  onSetCorrectAnswer: (answer: string) => void;
  difficulty: Difficulty;
}

// ─── Game Configuration ───────────────────────────────────

export interface GameConfig {
  id: string;
  seq: number;
  icon: string;
  title: string;
  desc: string;
  gradient: string;
  glowColor: string;
  tag: string;
}

export const GAME_CONFIGS: GameConfig[] = [
  { id: 'shapeQuest', seq: 1, icon: '🔺', title: 'Shape Quest', desc: 'Match the correct shape!', gradient: 'from-cyan-500 via-blue-400 to-blue-500', glowColor: 'rgba(6,182,212,0.3)', tag: 'Shapes' },
  { id: 'numberTap', seq: 2, icon: '🔢', title: 'Number Tap', desc: 'Tap the right number!', gradient: 'from-amber-500 via-yellow-400 to-orange-500', glowColor: 'rgba(245,158,11,0.3)', tag: 'Numbers' },
  { id: 'mathPuzzle', seq: 3, icon: '➕', title: 'Math Puzzle', desc: 'Solve addition challenges!', gradient: 'from-rose-500 via-rose-400 to-orange-500', glowColor: 'rgba(244,63,94,0.3)', tag: 'Numbers' },
  { id: 'wordBuilder', seq: 4, icon: '🔤', title: 'Word Builder', desc: 'Find the missing letters!', gradient: 'from-orange-500 via-amber-400 to-yellow-500', glowColor: 'rgba(249,115,22,0.3)', tag: 'English' },
  { id: 'guessTheWord', seq: 5, icon: '🖼️', title: 'Guess The Word', desc: 'Name the picture!', gradient: 'from-green-500 via-emerald-400 to-teal-500', glowColor: 'rgba(16,185,129,0.3)', tag: 'NEW' },
  { id: 'pictureIdentify', seq: 6, icon: '🔍', title: 'Picture Identify', desc: 'Find the right category!', gradient: 'from-amber-500 via-orange-400 to-rose-500', glowColor: 'rgba(245,158,11,0.3)', tag: 'NEW' },
  { id: 'countObjects', seq: 7, icon: '🔢', title: 'Count Objects', desc: 'How many can you count?', gradient: 'from-rose-500 via-pink-400 to-red-500', glowColor: 'rgba(244,63,94,0.3)', tag: 'BONUS' },
  { id: 'matchLetters', seq: 8, icon: '🔡', title: 'Match Letters', desc: 'Match A→a, B→b!', gradient: 'from-teal-500 via-emerald-400 to-green-500', glowColor: 'rgba(20,184,166,0.3)', tag: 'BONUS' },
  { id: 'numberAfter', seq: 9, icon: '➡️', title: 'Number After', desc: 'What comes after this number?', gradient: 'from-blue-500 via-indigo-400 to-violet-500', glowColor: 'rgba(99,102,241,0.3)', tag: 'Numbers' },
  { id: 'numberBefore', seq: 10, icon: '⬅️', title: 'Number Before', desc: 'What comes before this number?', gradient: 'from-pink-500 via-rose-400 to-red-500', glowColor: 'rgba(244,63,94,0.3)', tag: 'Numbers' },
  { id: 'letterAfter', seq: 11, icon: '🔤', title: 'Letter After', desc: 'What letter comes next?', gradient: 'from-emerald-500 via-teal-400 to-cyan-500', glowColor: 'rgba(20,184,166,0.3)', tag: 'English' },
  { id: 'letterBefore', seq: 12, icon: '🔠', title: 'Letter Before', desc: 'What letter comes before?', gradient: 'from-amber-500 via-yellow-400 to-orange-500', glowColor: 'rgba(245,158,11,0.3)', tag: 'English' },
  { id: 'multiplicationCasino', seq: 13, icon: '🎰', title: 'Multiply Casino', desc: 'Slot machine multiplication fun!', gradient: 'from-purple-600 via-pink-500 to-red-500', glowColor: 'rgba(168,85,247,0.3)', tag: 'CASINO' },
  { id: 'wordSearchPuzzle', seq: 14, icon: '🔍', title: 'Word Search', desc: 'Find hidden words in the grid!', gradient: 'from-indigo-600 via-purple-500 to-pink-500', glowColor: 'rgba(99,102,241,0.3)', tag: 'CASINO' },
  { id: 'flipCardMatch', seq: 15, icon: '🃏', title: 'Flip & Match', desc: 'Memory game with casino cards!', gradient: 'from-pink-600 via-purple-500 to-indigo-600', glowColor: 'rgba(236,72,153,0.3)', tag: 'CASINO' },
  { id: 'chartGame', seq: 16, icon: '📊', title: 'Chart Master', desc: 'Read colorful bar charts!', gradient: 'from-blue-600 via-indigo-500 to-purple-600', glowColor: 'rgba(59,130,246,0.3)', tag: 'DATA' },
];

export const GAME_SEQUENCE = GAME_CONFIGS.map(g => g.id);

// ─── Shared Helpers (used by game modules) ────────────────

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom<T>(arr: T[], exclude?: T): T {
  const filtered = exclude !== undefined ? arr.filter(x => x !== exclude) : arr;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
