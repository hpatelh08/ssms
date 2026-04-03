/**
 * ➕ Math Puzzle – Shared engine rebuild
 * ========================================
 * Addition & subtraction within 20 for Standard 3.
 * 5 rounds, number pad input, animated feedback.
 */

import React, { useReducer, useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfettiEffect } from '../../ui/ConfettiEffect';
import { logAction } from '../../../utils/auditLog';
import {
  gameReducer, createInitialState, XP_PER_CORRECT, XP_BONUS_COMPLETE,
} from '../shared/useGameReducer';
import { GameHeader, GameOverScreen, FeedbackOverlay, XPFly } from '../shared/GameUI';

// ─── Problem Generator ───────────────────────────────────

interface MathProblem {
  a: number;
  b: number;
  answer: number;
  op: '+' | '−';
}

function generateProblem(): MathProblem {
  const useSub = Math.random() > 0.5;
  if (useSub) {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * a) + 1;
    return { a, b, answer: a - b, op: '−' };
  }
  const a = Math.floor(Math.random() * 20);
  const b = Math.floor(Math.random() * (20 - a + 1));
  return { a, b, answer: a + b, op: '+' };
}

// ─── Props ────────────────────────────────────────────────

interface MathPuzzleProps {
  onExit: () => void;
  onWin: (xp: number) => void;
  onNextGame?: () => void;
}

// ─── Component ────────────────────────────────────────────

export const MathPuzzle: React.FC<MathPuzzleProps> = React.memo(({ onExit, onWin, onNextGame }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const firstProblem = useMemo(() => generateProblem(), []);
  const [problem, setProblem] = useState(firstProblem);
  const [input, setInput] = useState('');
  const [state, dispatch] = useReducer(gameReducer, createInitialState(String(firstProblem.answer)));
  const [xpFly, setXpFly] = useState(false);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // Feedback → advance
  useEffect(() => {
    if (!state.feedback) return;
    if (state.feedback === 'correct') {
      setXpFly(true);
      setTimeout(() => setXpFly(false), 1200);
    }
    timerRef.current = setTimeout(() => {
      const nextRound = state.currentRound + 1;
      if (nextRound > state.totalRounds) {
        dispatch({ type: 'GAME_COMPLETE' });
        onWin(state.xpEarned + XP_BONUS_COMPLETE);
        logAction('game_complete', 'game', { game: 'MathPuzzle', score: state.score });
      } else {
        const p = generateProblem();
        setProblem(p);
        setInput('');
        dispatch({ type: 'NEXT_ROUND', correctAnswer: String(p.answer) });
      }
    }, state.feedback === 'correct' ? 1500 : 1100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state.feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAnswer = useCallback(() => {
    if (state.inputDisabled || !input) return;
    const correct = String(problem.answer);
    dispatch({ type: 'SELECT_ANSWER', answer: input, correct });
    logAction(input === correct ? 'math_correct' : 'math_wrong', 'game', { problem: `${problem.a}${problem.op}${problem.b}`, input });
  }, [state.inputDisabled, input, problem]);

  const handleNumberPress = useCallback((n: number) => {
    if (state.inputDisabled) return;
    setInput(prev => prev.length < 2 ? prev + n : prev);
  }, [state.inputDisabled]);

  const handlePlayAgain = useCallback(() => {
    const p = generateProblem();
    setProblem(p);
    setInput('');
    dispatch({ type: 'PLAY_AGAIN', correctAnswer: String(p.answer) });
  }, []);

  // ─── Game Over ──────────────────────────────────────────
  if (state.gameStatus === 'completed') {
    return (
      <div className="max-w-md mx-auto">
        <ConfettiEffect trigger={true} />
        <GameOverScreen
          score={state.score} totalRounds={state.totalRounds} xpEarned={state.xpEarned}
          startTime={state.startTime} onPlayAgain={handlePlayAgain} onExit={onExit}
          onNextGame={onNextGame} gameTitle="Math Puzzle" gameIcon="➕"
        />
      </div>
    );
  }

  // ─── Playing ────────────────────────────────────────────
  return (
    <>
      <ConfettiEffect trigger={state.confetti} />
      <XPFly show={xpFly} amount={XP_PER_CORRECT} />

      <div className="bg-white/75 backdrop-blur-2xl border border-white/40 p-8 sm:p-10 rounded-[24px] text-center max-w-md mx-auto relative overflow-hidden shadow-xl">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full opacity-10 blur-3xl pointer-events-none" />

        <GameHeader title="Math Puzzle" icon="➕" onExit={onExit}
          round={state.currentRound} totalRounds={state.totalRounds} score={state.score} results={state.roundResults} />

        {/* Problem display */}
        <motion.div
          className="text-5xl sm:text-6xl font-bold text-blue-900 mb-8 flex justify-center items-center gap-3"
          key={state.currentRound}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>{problem.a}</span>
          <span className="text-blue-300">{problem.op}</span>
          <span>{problem.b}</span>
          <span className="text-blue-300">=</span>
          <span className="text-blue-500 border-b-4 border-blue-100 min-w-[60px] inline-block">
            {input || '?'}
          </span>
        </motion.div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-2 mb-5 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
            <motion.button
              key={n}
              onClick={() => handleNumberPress(n)}
              disabled={state.inputDisabled}
              className="bg-blue-50/60 hover:bg-blue-100/80 py-3.5 rounded-2xl font-bold text-xl border border-blue-100/30 disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
            >
              {n}
            </motion.button>
          ))}
          <motion.button
            onClick={() => setInput('')}
            className="bg-red-50/60 text-red-500 py-3.5 rounded-2xl font-bold border border-red-100/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            C
          </motion.button>
        </div>

        <motion.button
          onClick={checkAnswer}
          disabled={!input || state.inputDisabled}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-500/20 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Check Answer ✨
        </motion.button>

        <AnimatePresence>
          {state.feedback && (
            <FeedbackOverlay type={state.feedback} correctAnswer={`${problem.a} ${problem.op} ${problem.b} = ${problem.answer}`} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

MathPuzzle.displayName = 'MathPuzzle';
