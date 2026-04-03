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
  { id: 'colorMatch',      seq: 1,  icon: '🎨', title: 'Color Match',      desc: 'Match the correct colors',         gradient: 'from-pink-500 via-rose-400 to-orange-500',    glowColor: 'rgba(244,63,94,0.3)',    tag: 'Colors' },
  { id: 'missingNumber',   seq: 2,  icon: '🔢', title: 'Missing Number',   desc: 'Complete the number series',       gradient: 'from-blue-500 via-green-400 to-emerald-500',  glowColor: 'rgba(63,143,58,0.3)',   tag: 'Numbers' },
  { id: 'biggerOrSmaller', seq: 3,  icon: '⚖️', title: 'Bigger or Smaller',desc: 'Choose the bigger number',         gradient: 'from-green-500 via-emerald-400 to-teal-500',  glowColor: 'rgba(16,185,129,0.3)',   tag: 'Compare' },
  { id: 'oppositeWords',   seq: 4,  icon: '🔄', title: 'Opposite Words',   desc: 'Choose the opposite word',         gradient: 'from-lime-500 via-emerald-400 to-green-500',glowColor: 'rgba(95,139,61,0.3)',   tag: 'English' },
  { id: 'animalSound',     seq: 5,  icon: '🐶', title: 'Animal Sound',     desc: 'Match the animal sound',           gradient: 'from-amber-500 via-yellow-400 to-orange-500', glowColor: 'rgba(245,158,11,0.3)',   tag: 'Animals' },
  { id: 'pictureMemory',   seq: 6,  icon: '🖼️', title: 'Picture Memory',   desc: 'Remember and match the pictures',  gradient: 'from-cyan-500 via-blue-400 to-green-500',    glowColor: 'rgba(6,182,212,0.3)',    tag: 'Memory' },
  { id: 'wordLadder',      seq: 7,  icon: '🔤', title: 'Word Ladder',      desc: 'Change one letter to a new word',  gradient: 'from-rose-500 via-pink-400 to-red-500',       glowColor: 'rgba(244,63,94,0.3)',    tag: 'English' },
  { id: 'quickCompare',    seq: 8,  icon: '⚡', title: 'Quick Compare',    desc: 'Answer as fast as possible',       gradient: 'from-yellow-500 via-amber-400 to-orange-500', glowColor: 'rgba(234,179,8,0.3)',    tag: 'Math' },
  { id: 'shapeMemory',     seq: 9,  icon: '🔷', title: 'Shape Memory',     desc: 'Remember the shapes',              gradient: 'from-green-500 via-lime-400 to-emerald-500',glowColor: 'rgba(63,143,58,0.3)',   tag: 'Memory' },
  { id: 'findThePair',     seq: 10, icon: '🧩', title: 'Find the Pair',    desc: 'Find the matching pair',           gradient: 'from-teal-500 via-cyan-400 to-blue-500',      glowColor: 'rgba(20,184,166,0.3)',   tag: 'Logic' },
  { id: 'speedMath',       seq: 11, icon: '🏎️', title: 'Speed Math',       desc: 'Solve 10 questions quickly',       gradient: 'from-red-500 via-rose-400 to-pink-500',       glowColor: 'rgba(244,63,94,0.3)',    tag: 'HARD' },
  { id: 'brainMaze',       seq: 12, icon: '🧩', title: 'Brain Maze',       desc: 'Solve the maze',                   gradient: 'from-green-600 via-emerald-500 to-cyan-500',  glowColor: 'rgba(16,185,129,0.3)',   tag: 'HARD' },
  { id: 'hiddenObject',    seq: 13, icon: '🔎', title: 'Hidden Object',    desc: 'Find the hidden object',           gradient: 'from-orange-500 via-amber-400 to-yellow-500', glowColor: 'rgba(249,115,22,0.3)',   tag: 'Logic' },
  { id: 'logicPuzzle',     seq: 14, icon: '🧠', title: 'Logic Puzzle',     desc: 'Solve the logic puzzle',           gradient: 'from-lime-600 via-emerald-500 to-green-600',glowColor: 'rgba(122,163,68,0.3)',   tag: 'HARD' },
  { id: 'memoryCards',     seq: 15, icon: '🃏', title: 'Memory Cards',     desc: 'Remember and match the cards',     gradient: 'from-pink-600 via-rose-500 to-red-600',       glowColor: 'rgba(236,72,153,0.3)',   tag: 'Memory' },
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
