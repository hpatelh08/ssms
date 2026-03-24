/**
 * ➕ Math Puzzle Module
 * ======================
 * Addition & subtraction for Standard 2 (age 7-8).
 * - Never repeats same problem within a session
 * - Wrong problems re-queued for learning
 * - Number pad input, animated problem display
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameModuleProps } from '../types';

// ─── Problem Generator ───────────────────────────────────

interface MathProblem {
  a: number;
  b: number;
  answer: number;
  key: string; // unique "a+b" dedup key
}

function generateProblem(usedKeys: Set<string>, wrongQueue: MathProblem[], diff: 'easy' | 'intermediate' | 'difficult' = 'easy'): MathProblem {
  // Priority: replay wrong problems
  if (wrongQueue.length > 0) return wrongQueue[0];

  const maxNum = diff === 'easy' ? 15 : diff === 'intermediate' ? 25 : 50;
  const useSubtraction = diff !== 'easy' && Math.random() > 0.5;

  // Generate unique problem (try up to 30 times)
  for (let i = 0; i < 30; i++) {
    let a: number, b: number, answer: number, key: string;
    if (useSubtraction) {
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      key = `${a}-${b}`;
    } else {
      a = Math.floor(Math.random() * (maxNum + 1));
      b = Math.floor(Math.random() * (maxNum - a + 1));
      answer = a + b;
      key = `${a}+${b}`;
    }
    if (!usedKeys.has(key)) {
      return { a, b, answer, key };
    }
  }
  // Fallback (pool exhausted)
  const a = Math.floor(Math.random() * (maxNum + 1));
  const b = Math.floor(Math.random() * (maxNum - a + 1));
  return { a, b, answer: a + b, key: `${a}+${b}` };
}

// ─── Component ────────────────────────────────────────────

export const MathPuzzleModule: React.FC<GameModuleProps> = React.memo(({ state, onSelectAnswer, onSetCorrectAnswer, difficulty }) => {
  const roundRef = useRef(state.round);
  const usedKeysRef = useRef<Set<string>>(new Set());
  const wrongQueueRef = useRef<MathProblem[]>([]);

  const [problem, setProblem] = useState<MathProblem>(() => {
    const p = generateProblem(usedKeysRef.current, wrongQueueRef.current, difficulty);
    usedKeysRef.current.add(p.key);
    return p;
  });
  const [input, setInput] = useState('');

  // Set correct answer when engine is ready
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer(String(problem.answer));
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track wrong answers
  useEffect(() => {
    if (state.status === 'roundEnd') {
      const wasWrong = state.selectedAnswer !== state.correctAnswer;
      if (wasWrong) {
        if (!wrongQueueRef.current.find(p => p.key === problem.key)) {
          wrongQueueRef.current.push(problem);
        }
      } else {
        wrongQueueRef.current = wrongQueueRef.current.filter(p => p.key !== problem.key);
      }
    }
  }, [state.status, state.selectedAnswer, state.correctAnswer, problem]);

  // New round
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      const p = generateProblem(usedKeysRef.current, wrongQueueRef.current, difficulty);
      usedKeysRef.current.add(p.key);
      if (wrongQueueRef.current.length > 0 && wrongQueueRef.current[0].key === p.key) {
        wrongQueueRef.current = wrongQueueRef.current.slice(1);
      }
      setProblem(p);
      setInput('');
      onSetCorrectAnswer(String(p.answer));
    }
  }, [state.round, onSetCorrectAnswer, difficulty]);

  // Reset on new game session (FIX: also set correct answer to prevent first-question bug)
  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      usedKeysRef.current = new Set();
      wrongQueueRef.current = [];
      const p = generateProblem(usedKeysRef.current, wrongQueueRef.current, difficulty);
      usedKeysRef.current.add(p.key);
      setProblem(p);
      setInput('');
      onSetCorrectAnswer(String(p.answer));
      roundRef.current = 1;
    }
  }, [state.status, state.round, difficulty, onSetCorrectAnswer]);

  const isLocked = state.status !== 'playing';

  const handleNumberPress = useCallback((n: number) => {
    if (isLocked) return;
    setInput(prev => prev.length < 2 ? prev + n : prev);
  }, [isLocked]);

  const checkAnswer = useCallback(() => {
    if (isLocked || !input) return;
    onSelectAnswer(input);
  }, [isLocked, input, onSelectAnswer]);

  return (
    <>
      {/* Problem display */}
      <motion.div
        className="text-5xl sm:text-6xl font-bold text-gray-800 mb-8 flex justify-center items-center gap-3"
        key={`${state.round}-${problem.key}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span>{problem.a}</span>
        <span className="text-amber-300">{problem.key.includes('-') ? '−' : '+'}</span>
        <span>{problem.b}</span>
        <span className="text-amber-300">=</span>
        <span className="text-amber-500 border-b-4 border-amber-100 min-w-[60px] inline-block">
          {input || '?'}
        </span>
      </motion.div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-2 mb-5 max-w-xs mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
          <motion.button
            key={n}
            onClick={() => handleNumberPress(n)}
            disabled={isLocked}
            className="bg-amber-50/60 hover:bg-amber-100/80 py-3.5 rounded-2xl font-bold text-xl border border-amber-100/30 disabled:opacity-50"
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
        disabled={!input || isLocked}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        Check Answer ✨
      </motion.button>
    </>
  );
});
MathPuzzleModule.displayName = 'MathPuzzleModule';
