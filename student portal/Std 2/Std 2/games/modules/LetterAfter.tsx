/**
 * 🔤➡️ Letter After Module
 * ==========================
 * "What letter comes AFTER ___?" for Std 2 (age 7-8).
 * Difficulty adjusts:
 *   Easy: uppercase A–Y, Intermediate: lowercase a–y, Difficult: mixed case
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameModuleProps, shuffleArray } from '../types';

const OPTION_COLORS = [
  { bg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' },
  { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
];

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';

interface Question { given: string; answer: string; options: string[]; key: string; }

function generate(used: Set<string>, wrongQ: Question[], diff: 'easy' | 'intermediate' | 'difficult' = 'easy'): Question {
  if (wrongQ.length > 0) return wrongQ[0];
  const alpha = diff === 'easy' ? UPPER : diff === 'intermediate' ? LOWER : (Math.random() > 0.5 ? UPPER : LOWER);
  const optCount = diff === 'easy' ? 3 : 4;

  for (let i = 0; i < 30; i++) {
    const idx = Math.floor(Math.random() * 25); // 0-24 (A-Y or a-y)
    const given = alpha[idx];
    const answer = alpha[idx + 1];
    const key = `la-${given}`;
    if (!used.has(key)) {
      const others = new Set<string>();
      while (others.size < optCount - 1) {
        const r = Math.floor(Math.random() * 26);
        if (alpha[r] !== answer) others.add(alpha[r]);
      }
      return { given, answer, options: shuffleArray([answer, ...Array.from(others)]), key };
    }
  }
  const idx = Math.floor(Math.random() * 25);
  const given = alpha[idx];
  const answer = alpha[idx + 1];
  const prev = idx > 0 ? alpha[idx - 1] : alpha[idx + 2];
  const next2 = idx < 24 ? alpha[idx + 2] : alpha[0];
  return { given, answer, options: shuffleArray([answer, prev, next2, alpha[(idx + 10) % 26]]), key: `la-fb-${given}` };
}

export const LetterAfterModule: React.FC<GameModuleProps> = React.memo(({ state, onSelectAnswer, onSetCorrectAnswer, difficulty }) => {
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
      onSetCorrectAnswer(q.answer);
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
      onSetCorrectAnswer(nq.answer);
    }
  }, [state.round, onSetCorrectAnswer, difficulty]);

  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      usedRef.current = new Set();
      wrongRef.current = [];
      const nq = generate(usedRef.current, wrongRef.current, difficulty);
      usedRef.current.add(nq.key);
      setQ(nq);
      onSetCorrectAnswer(nq.answer);
      roundRef.current = 1;
    }
  }, [state.status, state.round, difficulty, onSetCorrectAnswer]);

  const isLocked = state.status !== 'playing';

  return (
    <>
      <motion.div className="mb-6" key={`${state.round}-${q.given}`} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">What letter comes AFTER?</p>
        <div className="inline-flex items-center gap-3">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border-2 border-dashed border-emerald-200/50 shadow-lg flex items-center justify-center">
            <motion.span className="text-5xl font-black text-emerald-600" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              {q.given}
            </motion.span>
          </div>
          <span className="text-3xl text-gray-300 font-bold">→</span>
          <div className="w-24 h-24 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl border-2 border-dashed border-teal-200/50 shadow-lg flex items-center justify-center">
            <span className="text-5xl font-black text-teal-300">?</span>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3 max-w-sm mx-auto">
        {q.options.map((letter, i) => {
          const colors = OPTION_COLORS[i % OPTION_COLORS.length];
          const isSelected = state.selectedAnswer === letter;
          const isCorrect = letter === q.answer;
          const showResult = state.status === 'roundEnd' && isSelected;
          const isAnswer = state.status === 'roundEnd' && state.selectedAnswer !== state.correctAnswer && isCorrect;
          let borderColor = colors.border;
          if (showResult && isCorrect) borderColor = '#22c55e';
          else if (showResult && !isCorrect) borderColor = '#ef4444';
          else if (isAnswer) borderColor = '#22c55e';

          return (
            <motion.button
              key={`${state.round}-${letter}-${i}`}
              onClick={() => !isLocked && onSelectAnswer(letter)}
              disabled={isLocked}
              className="w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all"
              style={{ background: showResult && isCorrect ? '#f0fdf4' : showResult && !isCorrect ? '#fef2f2' : isAnswer ? '#f0fdf4' : colors.bg, borderColor }}
              whileHover={!isLocked ? { scale: 1.08 } : {}}
              whileTap={!isLocked ? { scale: 0.92 } : {}}
            >
              <span className="text-3xl font-bold" style={{ color: showResult && isCorrect ? '#16a34a' : showResult && !isCorrect ? '#dc2626' : isAnswer ? '#16a34a' : colors.text }}>
                {letter}
              </span>
            </motion.button>
          );
        })}
      </div>
    </>
  );
});

LetterAfterModule.displayName = 'LetterAfterModule';
