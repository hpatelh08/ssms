/**
 * 🔄 Unified Game Reducer (CRITICAL)
 * ====================================
 * Pure function. Never mutates state. Always returns new object.
 * All round progression, scoring, and status transitions
 * are handled here — NOT in UI components.
 *
 * Supports configurable totalRounds and difficulty-based XP.
 * XP per correct: Easy→2, Intermediate→5, Difficult→10.
 *
 * Guards:
 * - SELECT_ANSWER blocked if not "playing" or correctAnswer not set
 * - NEXT_ROUND blocked if not "roundEnd"
 * - START_GAME blocked if already "playing"
 */

import { GameState, GameAction, initialState, XP_PER_DIFFICULTY } from './types';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'START_GAME':
      // Guard: prevent starting while already playing
      if (state.status === 'playing') return state;
      return {
        ...initialState,
        gameId: action.payload.gameId,
        totalRounds: action.payload.totalRounds ?? 5,
        difficulty: action.payload.difficulty ?? 'easy',
        status: 'playing',
        startTime: Date.now(),
      };

    case 'SET_CORRECT_ANSWER':
      return {
        ...state,
        correctAnswer: action.payload,
      };

    case 'SELECT_ANSWER': {
      // Guard: only allowed in "playing" state with a correct answer set
      if (state.status !== 'playing' || state.correctAnswer === null) {
        return state;
      }
      const isCorrect = String(action.payload).trim() === String(state.correctAnswer).trim();
      const xpGain = isCorrect ? XP_PER_DIFFICULTY[state.difficulty] : 0;
      return {
        ...state,
        selectedAnswer: action.payload,
        score: isCorrect ? state.score + 1 : state.score,
        xpEarned: state.xpEarned + xpGain,
        status: 'roundEnd',
      };
    }

    case 'NEXT_ROUND':
      // Guard: only advance from roundEnd
      if (state.status !== 'roundEnd') return state;
      // Check if game should complete
      if (state.round >= state.totalRounds) {
        return {
          ...state,
          status: 'complete',
        };
      }
      // Advance to next round
      return {
        ...state,
        round: state.round + 1,
        selectedAnswer: null,
        correctAnswer: null,
        status: 'playing',
      };

    case 'GAME_COMPLETE':
      return {
        ...state,
        status: 'complete',
      };

    case 'RESET_GAME':
      return initialState;

    default:
      return state;
  }
}
