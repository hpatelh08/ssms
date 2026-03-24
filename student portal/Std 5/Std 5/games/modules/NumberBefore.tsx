/**
 * ⬅️ Number Before Module
 * =========================
 * "What number comes BEFORE ___?" for Std 5 (age 8-9).
 * Difficulty adjusts range:
 *   Easy: 2–20, Intermediate: 2–50, Difficult: 2–100
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameModuleProps, shuffleArray } from '../types';

const OPTION_COLORS = [
  { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
  { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
];

interface Question { given: number; answer: number; options: number[]; key: string; }

function getMax(diff: 'easy' | 'intermediate' | 'difficult') {
  return diff === 'easy' ? 20 : diff === 'intermediate' ? 50 : 100;
}

function generate(used: Set<string>, wrongQ: Question[], diff: 'easy' | 'intermediate' | 'difficult' = 'easy'): Question {
  if (wrongQ.length > 0) return wrongQ[0];
  const max = getMax(diff);
  const optCount = diff === 'easy' ? 3 : 4;
  for (let i = 0; i < 30; i++) {
    const given = Math.floor(Math.random() * (max - 1)) + 2; // min 2 so answer ≥ 1
    const key = `nb-${given}`;
    if (!used.has(key)) {
      const answer = given - 1;
      const others = new Set<number>();
      while (others.size < optCount - 1) {
        const n = Math.max(1, given + Math.floor(Math.random() * 5) - 2);
        if (n !== answer) others.add(n);
      }
      return { given, answer, options: shuffleArray([answer, ...Array.from(others)]), key };
    }
  }
  const given = Math.floor(Math.random() * (max - 1)) + 2;
  const answer = given - 1;
  return { given, answer, options: shuffleArray([answer, answer + 1, given, given + 1]), key: `nb-fb-${given}` };
}

export const NumberBeforeModule: React.FC<GameModuleProps> = React.memo(({ state, onSelectAnswer, onSetCorrectAnswer, difficulty }) => {
  const roundRef = useRef(state.round);
  const usedRef = useRef<Set<string>>(new Set());
  const wrongRef = useRef<Question[]>([]);

  const [q, setQ] = useState<Question>(() => {
    const q = generate(usedRef.current, wrongRef.current, difficulty);
    usedRef.current.add(q.key);
    return q;
  });

  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer(String(q.answer));
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.status === 'roundEnd') {
      const wasWrong = state.selectedAnswer !== state.correctAnswer;
      if (wasWrong) {
        if (!wrongRef.current.find(x => x.key === q.key)) wrongRef.current.push(q);
      } else {
        wrongRef.current = wrongRef.current.filter(x => x.key !== q.key);
      }
    }
  }, [state.status, state.selectedAnswer, state.correctAnswer, q]);

  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      const nq = generate(usedRef.current, wrongRef.current, difficulty);
      usedRef.current.add(nq.key);
      if (wrongRef.current.length > 0 && wrongRef.current[0].key === nq.key) wrongRef.current = wrongRef.current.slice(1);
      setQ(nq);
      onSetCorrectAnswer(String(nq.answer));
    }
  }, [state.round, onSetCorrectAnswer, difficulty]);

  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      usedRef.current = new Set();
      wrongRef.current = [];
      const nq = generate(usedRef.current, wrongRef.current, difficulty);
      usedRef.current.add(nq.key);
      setQ(nq);
      onSetCorrectAnswer(String(nq.answer));
      roundRef.current = 1;
    }
  }, [state.status, state.round, difficulty, onSetCorrectAnswer]);

  const isLocked = state.status !== 'playing';

  return (
    <>
      <motion.div className="mb-6" key={`${state.round}-${q.given}`} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">What comes BEFORE?</p>
        <div className="inline-flex items-center gap-3">
          <div className="w-24 h-24 bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl border-2 border-dashed border-rose-200/50 shadow-lg flex items-center justify-center">
            <span className="text-4xl font-black text-rose-300">?</span>
          </div>
          <span className="text-3xl text-gray-300 font-bold">←</span>
          <div className="w-24 h-24 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border-2 border-dashed border-pink-200/50 shadow-lg flex items-center justify-center">
            <motion.span className="text-4xl font-black text-rose-600" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              {q.given}
            </motion.span>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3 max-w-sm mx-auto">
        {q.options.map((num, i) => {
          const colors = OPTION_COLORS[i % OPTION_COLORS.length];
          const isSelected = state.selectedAnswer === String(num);
          const isCorrect = num === q.answer;
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
              style={{ background: showResult && isCorrect ? '#f0fdf4' : showResult && !isCorrect ? '#fef2f2' : isAnswer ? '#f0fdf4' : colors.bg, borderColor }}
              whileHover={!isLocked ? { scale: 1.08 } : {}}
              whileTap={!isLocked ? { scale: 0.92 } : {}}
            >
              <span className="text-2xl font-bold" style={{ color: showResult && isCorrect ? '#16a34a' : showResult && !isCorrect ? '#dc2626' : isAnswer ? '#16a34a' : colors.text }}>
                {num}
              </span>
            </motion.button>
          );
        })}
      </div>
    </>
  );
});

NumberBeforeModule.displayName = 'NumberBeforeModule';
