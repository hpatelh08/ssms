/**
 * 🎮 Shared Game Engine – useGameReducer
 * ==========================================
 * Unified state management for ALL games.
 * Every game uses this exact same reducer pattern.
 * 
 * Features:
 * - 5-round game sessions
 * - XP per correct answer (20 XP)
 * - Bonus XP on game complete (10 XP)
 * - Proper timer management
 * - Never mutates state
 * - Clean reset on play-again
 */

// ─── Constants ────────────────────────────────────────────

export const TOTAL_ROUNDS = 5;
export const XP_PER_CORRECT = 20;
export const XP_BONUS_COMPLETE = 10;

// ─── Types ────────────────────────────────────────────────

export type GameStatus = 'playing' | 'feedback' | 'completed';
export type FeedbackType = 'correct' | 'wrong' | null;

export interface GameState {
  currentRound: number;
  totalRounds: number;
  score: number;
  xpEarned: number;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean | null;
  answered: boolean;
  roundResults: Array<boolean | null>;
  gameStatus: GameStatus;
  feedback: FeedbackType;
  confetti: boolean;
  startTime: number;
  inputDisabled: boolean;
}

export type GameAction =
  | { type: 'SELECT_ANSWER'; answer: string; correct: string }
  | { type: 'NEXT_ROUND'; correctAnswer: string }
  | { type: 'GAME_COMPLETE' }
  | { type: 'PLAY_AGAIN'; correctAnswer: string }
  | { type: 'CLEAR_CONFETTI' };

// ─── Reducer ──────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_ANSWER': {
      const isCorrect = action.answer === action.correct;
      const nextRoundResults = [...state.roundResults];
      nextRoundResults[state.currentRound - 1] = isCorrect;

      console.debug('[GameValidation] legacy-game', {
        round: state.currentRound,
        selectedAnswer: action.answer,
        correctAnswer: action.correct,
        isCorrect,
      });

      return {
        ...state,
        selectedAnswer: action.answer,
        correctAnswer: action.correct,
        isCorrect,
        answered: true,
        roundResults: nextRoundResults,
        feedback: isCorrect ? 'correct' : 'wrong',
        score: isCorrect ? state.score + 1 : state.score,
        xpEarned: isCorrect ? state.xpEarned + XP_PER_CORRECT : state.xpEarned,
        confetti: isCorrect,
        inputDisabled: true,
        gameStatus: 'feedback',
      };
    }

    case 'NEXT_ROUND': {
      const nextRound = state.currentRound + 1;
      if (nextRound > state.totalRounds) {
        return {
          ...state,
          gameStatus: 'completed',
          feedback: null,
          confetti: false,
          xpEarned: state.xpEarned + XP_BONUS_COMPLETE,
        };
      }
      return {
        ...state,
        currentRound: nextRound,
        selectedAnswer: null,
        correctAnswer: action.correctAnswer,
        isCorrect: null,
        answered: false,
        feedback: null,
        confetti: false,
        inputDisabled: false,
        gameStatus: 'playing',
      };
    }

    case 'GAME_COMPLETE':
      return {
        ...state,
        gameStatus: 'completed',
        feedback: null,
        confetti: false,
        xpEarned: state.xpEarned + XP_BONUS_COMPLETE,
      };

    case 'PLAY_AGAIN':
      return createInitialState(action.correctAnswer);

    case 'CLEAR_CONFETTI':
      return { ...state, confetti: false };

    default:
      return state;
  }
}

// ─── Factory ──────────────────────────────────────────────

export function createInitialState(correctAnswer: string = ''): GameState {
  return {
    currentRound: 1,
    totalRounds: TOTAL_ROUNDS,
    score: 0,
    xpEarned: 0,
    selectedAnswer: null,
    correctAnswer,
    isCorrect: null,
    answered: false,
    roundResults: Array(TOTAL_ROUNDS).fill(null),
    gameStatus: 'playing',
    feedback: null,
    confetti: false,
    startTime: Date.now(),
    inputDisabled: false,
  };
}

// ─── Helpers ──────────────────────────────────────────────

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

export function getElapsedSeconds(startTime: number): number {
  return Math.round((Date.now() - startTime) / 1000);
}

export function getAccuracy(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}
