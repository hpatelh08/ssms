/**
 * 🧩 useGameEngine Hook
 * =======================
 * Wraps gameReducer with stable dispatch callbacks.
 * All callbacks are memoized (useCallback with []) — no stale closures.
 * Guards are enforced in the reducer, not here.
 *
 * Now supports difficulty and configurable totalRounds.
 */

import { useReducer, useCallback } from 'react';
import { gameReducer } from './gameReducer';
import { initialState, Difficulty } from './types';

export function useGameEngine() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startGame = useCallback((gameId: string, difficulty?: Difficulty, totalRounds?: number) => {
    dispatch({ type: 'START_GAME', payload: { gameId, difficulty, totalRounds } });
  }, []);

  const setCorrectAnswer = useCallback((answer: string) => {
    dispatch({ type: 'SET_CORRECT_ANSWER', payload: answer });
  }, []);

  const selectAnswer = useCallback((answer: string) => {
    dispatch({ type: 'SELECT_ANSWER', payload: answer });
  }, []);

  const nextRound = useCallback(() => {
    dispatch({ type: 'NEXT_ROUND' });
  }, []);

  const completeGame = useCallback(() => {
    dispatch({ type: 'GAME_COMPLETE' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return {
    state,
    startGame,
    setCorrectAnswer,
    selectAnswer,
    nextRound,
    completeGame,
    resetGame,
  };
}
