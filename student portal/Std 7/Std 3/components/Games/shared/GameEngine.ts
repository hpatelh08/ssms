/**
 * Game Engine Utilities
 * =====================
 * Shared types, reducers, and helpers for all mini-games.
 */

// ─── Shared Types ─────────────────────────────────────────

export type GamePhase = 'INTRO' | 'COUNTDOWN' | 'PLAYING' | 'ROUND_WIN' | 'ROUND_FAIL' | 'GAME_OVER';

export interface RoundResult {
  correct: boolean;
  timeMs: number;
}

export interface GameSessionState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  level: number;
  score: number;
  xpEarned: number;
  results: RoundResult[];
  startTime: number;
  roundStartTime: number;
}

export type GameAction =
  | { type: 'START_COUNTDOWN' }
  | { type: 'START_PLAYING' }
  | { type: 'ROUND_CORRECT'; timeMs: number; xp: number }
  | { type: 'ROUND_INCORRECT'; timeMs: number }
  | { type: 'NEXT_ROUND' }
  | { type: 'GAME_OVER' }
  | { type: 'RESET' };

export function createInitialState(totalRounds: number = 5, level: number = 1): GameSessionState {
  return {
    phase: 'INTRO',
    currentRound: 0,
    totalRounds,
    level,
    score: 0,
    xpEarned: 0,
    results: [],
    startTime: 0,
    roundStartTime: 0,
  };
}

export function gameReducer(state: GameSessionState, action: GameAction): GameSessionState {
  switch (action.type) {
    case 'START_COUNTDOWN':
      return { ...state, phase: 'COUNTDOWN', startTime: Date.now() };
    case 'START_PLAYING':
      return { ...state, phase: 'PLAYING', currentRound: 1, roundStartTime: Date.now() };
    case 'ROUND_CORRECT':
      return {
        ...state,
        phase: 'ROUND_WIN',
        score: state.score + 1,
        xpEarned: state.xpEarned + action.xp,
        results: [...state.results, { correct: true, timeMs: action.timeMs }],
      };
    case 'ROUND_INCORRECT':
      return {
        ...state,
        phase: 'ROUND_FAIL',
        results: [...state.results, { correct: false, timeMs: action.timeMs }],
      };
    case 'NEXT_ROUND':
      if (state.currentRound >= state.totalRounds) {
        return { ...state, phase: 'GAME_OVER' };
      }
      return {
        ...state,
        phase: 'PLAYING',
        currentRound: state.currentRound + 1,
        roundStartTime: Date.now(),
      };
    case 'GAME_OVER':
      return { ...state, phase: 'GAME_OVER' };
    case 'RESET':
      return createInitialState(state.totalRounds, state.level);
    default:
      return state;
  }
}

// ─── XP Helpers ───────────────────────────────────────────

export const GAME_XP_PER_CORRECT = 20;

export function totalTimeSeconds(state: GameSessionState): number {
  return Math.round((Date.now() - state.startTime) / 1000);
}

// ─── Randomization Helpers ────────────────────────────────

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function pickRandom<T>(arr: T[], exclude?: T): T {
  const filtered = exclude !== undefined ? arr.filter(x => x !== exclude) : arr;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
