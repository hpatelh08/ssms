/**
 * ðŸŽ® Unified Game Engine â€“ Types & Configuration
 * =================================================
 * Single source of truth for all game state, actions,
 * module interfaces, and game configurations.
 *
 * Supports 3 difficulty levels Ã— 5 mini-levels Ã— 5 questions each.
 * XP scales by difficulty: Easyâ†’2, Intermediateâ†’5, Difficultâ†’10.
 */

// â”€â”€â”€ Difficulty System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type Difficulty = 'easy' | 'intermediate' | 'difficult';

export const DIFFICULTIES: Difficulty[] = ['easy', 'intermediate', 'difficult'];

export const DIFF_META: Record<Difficulty, { label: string; emoji: string; gradient: string; ring: string; bg: string }> = {
  easy:         { label: 'Easy',         emoji: 'ðŸŸ¢', gradient: 'from-green-400 to-emerald-400', ring: 'ring-green-400',  bg: 'bg-green-50' },
  intermediate: { label: 'Intermediate', emoji: 'ðŸŸ¡', gradient: 'from-amber-400 to-yellow-400',  ring: 'ring-amber-400',  bg: 'bg-amber-50' },
  difficult:    { label: 'Difficult',    emoji: 'ðŸ”´', gradient: 'from-red-400 to-rose-400',      ring: 'ring-red-400',    bg: 'bg-red-50' },
};

export const XP_PER_DIFFICULTY: Record<Difficulty, number> = { easy: 2, intermediate: 5, difficult: 10 };
export const XP_MINI_BONUS = 20;
export const XP_DIFF_BONUS = 50;
export const XP_ALL_BONUS = 150;

export const QUESTIONS_PER_MINI_LEVEL = 5;
export const MINI_LEVELS_PER_DIFFICULTY = 5;

// â”€â”€â”€ Game State (Single Source of Truth) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Reducer Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type GameAction =
  | { type: 'START_GAME'; payload: { gameId: string; totalRounds?: number; difficulty?: Difficulty } }
  | { type: 'SET_CORRECT_ANSWER'; payload: string }
  | { type: 'SELECT_ANSWER'; payload: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'GAME_COMPLETE' }
  | { type: 'RESET_GAME' };

// â”€â”€â”€ Module Interface â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface GameModuleProps {
  state: GameState;
  onSelectAnswer: (answer: string) => void;
  onSetCorrectAnswer: (answer: string) => void;
  difficulty: Difficulty;
}

// â”€â”€â”€ Game Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  { id: 'wordCatch', seq: 1, icon: '📝', title: 'Word Catch', desc: 'Catch the correct Hindi word spelling!', gradient: 'from-sky-500 via-blue-400 to-indigo-500', glowColor: 'rgba(59,130,246,0.30)', tag: 'Hindi' },
  { id: 'dohaMatch', seq: 2, icon: '📜', title: 'Doha Match', desc: 'Match Rahim doha lines correctly.', gradient: 'from-orange-500 via-amber-400 to-yellow-500', glowColor: 'rgba(245,158,11,0.30)', tag: 'Hindi' },
  { id: 'danceMoveMatch', seq: 3, icon: '💃', title: 'Dance Move Match', desc: 'Pick the matching dance move.', gradient: 'from-pink-500 via-rose-400 to-orange-500', glowColor: 'rgba(236,72,153,0.30)', tag: 'Dance' },
  { id: 'fitnessReaction', seq: 4, icon: '🏃', title: 'Fitness Reaction', desc: 'React quickly to PE instructions.', gradient: 'from-lime-500 via-green-400 to-emerald-500', glowColor: 'rgba(34,197,94,0.30)', tag: 'PE' },
  { id: 'mapExplorer', seq: 5, icon: '🗺️', title: 'Map Explorer', desc: 'Identify map locations and geography facts.', gradient: 'from-blue-500 via-cyan-400 to-teal-500', glowColor: 'rgba(14,165,233,0.30)', tag: 'SST' },
];
export const GAME_SEQUENCE = GAME_CONFIGS.map(g => g.id);

// â”€â”€â”€ Shared Helpers (used by game modules) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

