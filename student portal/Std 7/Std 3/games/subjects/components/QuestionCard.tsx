/**
 * QuestionCard – Unified question display
 * =========================================
 * Matches the shared arcade GameContainer styling:
 * - glassmorphism card shell (bg-white/80 backdrop-blur-2xl rounded-3xl)
 * - gradient blobs in background
 * - FeedbackOverlay identical to shared/GameUI.tsx
 * - Animated option buttons with glow on hover
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, Difficulty, XP_PER_Q, DIFF_META } from '../engine/types';

interface Props {
  question: Question;
  questionIndex: number;          // 0-4 within mini-level
  totalInLevel: number;           // 5
  difficulty: Difficulty;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  showFeedback: boolean;
  results: Array<boolean | null>;
  onSelect: (answer: string) => void;
  disabled: boolean;
  xpEarned: number;
}

export const QuestionCard: React.FC<Props> = React.memo(({
  question, questionIndex, totalInLevel, difficulty,
  selectedAnswer, isCorrect, showFeedback, results, onSelect, disabled, xpEarned,
}) => {
  const meta = DIFF_META[difficulty];

  return (
    <motion.div
      className="w-full max-w-lg mx-auto"
      key={question.id}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      {/* Progress bar (matches shared RoundProgress style) */}
      <div className="flex items-center gap-1.5 mb-4 w-full">
        {Array.from({ length: totalInLevel }, (_, i) => {
          const roundNum = i + 1;
          const isCurrent = roundNum === questionIndex + 1;
          const roundResult = results[i] ?? null;
          const isPastCorrect = roundResult === true;
          const isPastWrong = roundResult === false;
          const done = showFeedback && isCurrent;

          return (
            <motion.div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                isCurrent
                  ? done
                    ? isCorrect ? 'bg-green-400' : 'bg-red-300'
                    : 'bg-amber-400 shadow-sm shadow-amber-400/40'
                  : isPastCorrect
                  ? 'bg-green-400'
                  : isPastWrong
                  ? 'bg-red-300'
                  : 'bg-gray-200/60'
              }`}
              animate={isCurrent && !done ? { scale: [1, 1.08, 1] } : {}}
              transition={isCurrent ? { duration: 1.5, repeat: Infinity } : {}}
            />
          );
        })}
        <span className="text-[10px] font-bold text-gray-400 ml-1 tabular-nums">
          {questionIndex + 1}/{totalInLevel}
        </span>
      </div>

      {/* XP Counter */}
      <div className="flex justify-end mb-3">
        <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-amber-50 px-3 py-1 rounded-xl border border-amber-200/30">
          <span className="text-amber-500 text-xs">✨</span>
          <span className="font-bold text-amber-600 text-xs tabular-nums">{xpEarned} XP</span>
        </div>
      </div>

      {/* Glassmorphism Question Card (same shell as GameContainer) */}
      <div className="relative bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[24px] p-6 shadow-xl overflow-hidden">
        {/* Gradient blobs (matches arcade GameContainer) */}
        <div className={`absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br ${meta.gradient} rounded-full opacity-10 blur-3xl pointer-events-none`} />
        <div className={`absolute -bottom-12 -left-12 w-36 h-36 bg-gradient-to-tr ${meta.gradient} rounded-full opacity-[0.06] blur-2xl pointer-events-none`} />

        {/* Question text */}
        <p className="text-lg font-bold text-gray-800 text-center mb-6 whitespace-pre-line leading-relaxed relative z-10">
          {question.text}
        </p>

        {/* Options */}
        <div className="grid gap-3 relative z-10">
          {question.options.map((opt, i) => {
            const isSelected = selectedAnswer === opt;
            const showSelectedCorrect = showFeedback && isSelected && isCorrect === true;
            const showSelectedWrong = showFeedback && isSelected && isCorrect === false;
            const showRevealCorrect = showFeedback && isCorrect === false && !isSelected && opt === question.correctAnswer;
            const showCorrect = showSelectedCorrect;
            const showWrong = showSelectedWrong;

            return (
              <motion.button
                key={`${question.id}_opt_${i}`}
                onClick={() => !disabled && onSelect(opt)}
                disabled={disabled}
                className={`w-full px-5 py-4 rounded-2xl text-left font-semibold text-base transition-all border-2
                  ${showSelectedCorrect
                    ? 'bg-green-100 border-green-400 text-green-800 shadow-md shadow-green-400/20'
                    : showSelectedWrong
                    ? 'bg-red-100 border-red-400 text-red-700 shadow-md shadow-red-400/20'
                    : showRevealCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-md shadow-emerald-300/10'
                    : isSelected
                    ? 'bg-amber-100 border-amber-400 text-amber-800'
                    : 'bg-white/60 backdrop-blur-xl border-gray-200/60 text-gray-700 hover:bg-amber-50/60 hover:border-amber-200 hover:shadow-md hover:shadow-amber-400/10 active:scale-[0.98]'}
                  ${disabled && !isSelected && !showSelectedCorrect && !showRevealCorrect ? 'opacity-50' : ''}`}
                whileHover={!disabled ? { scale: 1.01, y: -1 } : {}}
                whileTap={!disabled ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black
                    ${showSelectedCorrect ? 'bg-green-400 text-white' : showSelectedWrong ? 'bg-red-400 text-white' : showRevealCorrect ? 'bg-emerald-300 text-emerald-800' : 'bg-gray-200/60 text-gray-500'}`}>
                    {showCorrect ? '✓' : showWrong ? '✗' : String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Unified Feedback Overlay (identical to shared/GameUI FeedbackOverlay) */}
        <AnimatePresence>
          {showFeedback && selectedAnswer !== null && (
            <motion.div
              className={`absolute inset-0 z-20 rounded-[24px] flex items-center justify-center pointer-events-none ${
                isCorrect
                  ? 'bg-green-500/10 border-2 border-green-400/30'
                  : 'bg-amber-500/10 border-2 border-amber-400/30'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="text-center"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <span className="text-4xl block mb-1">{isCorrect ? '✅' : '💡'}</span>
                <span className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-amber-600'}`}>
                  {isCorrect ? `Correct! +${XP_PER_Q[difficulty]} XP` : `It's ${question.correctAnswer}!`}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

QuestionCard.displayName = 'QuestionCard';
