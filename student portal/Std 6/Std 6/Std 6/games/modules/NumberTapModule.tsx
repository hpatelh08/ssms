/**
 * 🔢 Number Tap Module (Unified Engine)
 * ========================================
 * Age-appropriate counting game for Std 6.
 * Now works within GameContainer like all other modules.
 * Difficulty adjusts target range:
 *   Easy: 1–5, Intermediate: 1–9, Difficult: 1–15
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameModuleProps, shuffleArray, pickRandom } from '../types';

// ─── Constants ─────────────────────────────────────────

const OPTION_COLORS = [
  { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
  { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  { bg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' },
];

// ─── Question Types ──────────────────────────────────────

interface NumberTapQuestion {
  target: number;
  options: number[];
  key: string;
}

function getMaxNumber(diff: 'easy' | 'intermediate' | 'difficult'): number {
  return diff === 'easy' ? 5 : diff === 'intermediate' ? 9 : 15;
}

function generateQuestion(
  usedKeys: Set<string>,
  wrongQueue: NumberTapQuestion[],
  diff: 'easy' | 'intermediate' | 'difficult' = 'easy',
): NumberTapQuestion {
  if (wrongQueue.length > 0) return wrongQueue[0];

  const max = getMaxNumber(diff);
  const optionCount = diff === 'easy' ? 3 : diff === 'intermediate' ? 4 : 5;

  for (let i = 0; i < 30; i++) {
    const target = Math.floor(Math.random() * max) + 1;
    const key = `nt-${target}-${i}`;
    if (!usedKeys.has(String(target))) {
      const others = new Set<number>();
      while (others.size < optionCount - 1) {
        const n = Math.floor(Math.random() * max) + 1;
        if (n !== target) others.add(n);
      }
      const options = shuffleArray([target, ...Array.from(others)]);
      return { target, options, key: String(target) };
    }
  }
  // Fallback
  const target = Math.floor(Math.random() * max) + 1;
  const others = new Set<number>();
  const optionCount2 = diff === 'easy' ? 3 : diff === 'intermediate' ? 4 : 5;
  while (others.size < optionCount2 - 1) {
    const n = Math.floor(Math.random() * max) + 1;
    if (n !== target) others.add(n);
  }
  return {
    target,
    options: shuffleArray([target, ...Array.from(others)]),
    key: `nt-fb-${target}`,
  };
}

// ─── Component ────────────────────────────────────────────

export const NumberTapModule: React.FC<GameModuleProps> = React.memo(({ state, onSelectAnswer, onSetCorrectAnswer, difficulty }) => {
  const roundRef = useRef(state.round);
  const usedKeysRef = useRef<Set<string>>(new Set());
  const wrongQueueRef = useRef<NumberTapQuestion[]>([]);

  const [question, setQuestion] = useState<NumberTapQuestion>(() => {
    const q = generateQuestion(usedKeysRef.current, wrongQueueRef.current, difficulty);
    usedKeysRef.current.add(q.key);
    return q;
  });

  // Set correct answer when engine is ready
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer(String(question.target));
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track wrong answers
  useEffect(() => {
    if (state.status === 'roundEnd') {
      const wasWrong = state.selectedAnswer !== state.correctAnswer;
      if (wasWrong) {
        if (!wrongQueueRef.current.find(q => q.key === question.key)) {
          wrongQueueRef.current.push(question);
        }
      } else {
        wrongQueueRef.current = wrongQueueRef.current.filter(q => q.key !== question.key);
      }
    }
  }, [state.status, state.selectedAnswer, state.correctAnswer, question]);

  // Generate new question on round change
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      const q = generateQuestion(usedKeysRef.current, wrongQueueRef.current, difficulty);
      usedKeysRef.current.add(q.key);
      if (wrongQueueRef.current.length > 0 && wrongQueueRef.current[0].key === q.key) {
        wrongQueueRef.current = wrongQueueRef.current.slice(1);
      }
      setQuestion(q);
      onSetCorrectAnswer(String(q.target));
    }
  }, [state.round, onSetCorrectAnswer, difficulty]);

  // Session reset (FIX: also set correct answer to prevent first-question bug)
  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      usedKeysRef.current = new Set();
      wrongQueueRef.current = [];
      const q = generateQuestion(usedKeysRef.current, wrongQueueRef.current, difficulty);
      usedKeysRef.current.add(q.key);
      setQuestion(q);
      onSetCorrectAnswer(String(q.target));
      roundRef.current = 1;
    }
  }, [state.status, state.round, difficulty, onSetCorrectAnswer]);

  const isLocked = state.status !== 'playing';

  return (
    <>
      {/* Target prompt */}
      <motion.div
        className="mb-6"
        key={`${state.round}-${question.target}`}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Find this number!</p>
        <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border-2 border-dashed border-amber-200/50 shadow-lg shadow-amber-100/20">
          <motion.span
            className="text-5xl font-black text-amber-600"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {question.target}
          </motion.span>
        </div>
      </motion.div>

      {/* Options grid */}
      <div className="flex flex-wrap justify-center gap-3 max-w-sm mx-auto">
        {question.options.map((num, i) => {
          const colors = OPTION_COLORS[i % OPTION_COLORS.length];
          const isSelected = state.selectedAnswer === String(num);
          const isCorrect = num === question.target;
          const showResult = state.status === 'roundEnd' && isSelected;
          const isAnswer = state.status === 'roundEnd' && state.selectedAnswer !== state.correctAnswer && isCorrect;

          let borderColor = colors.border;
          if (showResult && isCorrect) borderColor = '#22c55e';
          else if (showResult && !isCorrect) borderColor = '#ef4444';
          else if (isAnswer) borderColor = '#22c55e';

          return (
            <motion.button
              key={`${state.round}-${num}-${i}`}
              onClick={() => !isLocked && onSelectAnswer(String(num))}
              disabled={isLocked}
              className="w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all"
              style={{
                background: showResult && isCorrect ? '#f0fdf4' : showResult && !isCorrect ? '#fef2f2' : isAnswer ? '#f0fdf4' : colors.bg,
                borderColor,
                color: showResult && isCorrect ? '#16a34a' : showResult && !isCorrect ? '#ef4444' : isAnswer ? '#16a34a' : colors.text,
                opacity: isLocked && !isSelected && !isAnswer ? 0.5 : 1,
              }}
              whileHover={!isLocked ? { scale: 1.06, y: -2 } : {}}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1, y: 0,
                x: showResult && !isCorrect ? [0, -6, 6, -4, 4, 0] : 0,
              }}
              transition={showResult && !isCorrect ? { duration: 0.4 } : { delay: i * 0.06, type: 'spring', stiffness: 250, damping: 20 }}
            >
              <span className="text-3xl font-black">{num}</span>
            </motion.button>
          );
        })}
      </div>
    </>
  );
});

NumberTapModule.displayName = 'NumberTapModule';
