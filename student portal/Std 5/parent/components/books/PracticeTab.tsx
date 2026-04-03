/**
 * parent/components/books/PracticeTab.tsx
 * ─────────────────────────────────────────────────────
 * Practice Mode — Fill blanks, matching, word building, etc.
 *
 * Features:
 *  - 3 difficulty levels: Easy / Medium / Hard
 *  - 5 stages per level
 *  - Celebration after each stage
 *  - Sound effect sync
 *  - Auto-generated from chapter content
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookEntry, BookChapter } from '../../../data/bookConfig';
import {
  getPracticeExercises,
  type PracticeExercise,
  type PracticeDifficulty,
} from '../../../services/chapterIntelligence';
import { completePractice, startActivityTimer, stopActivityTimer } from '../../../services/progressTracker';

const spring = { type: 'spring' as const, stiffness: 260, damping: 26 };

const DIFFICULTIES: { key: PracticeDifficulty; label: string; color: string; emoji: string; bg: string }[] = [
  { key: 'easy', label: 'Easy', color: 'text-emerald-600', emoji: '🟢', bg: 'from-emerald-400 to-green-500' },
  { key: 'medium', label: 'Medium', color: 'text-amber-600', emoji: '🟡', bg: 'from-amber-400 to-yellow-500' },
  { key: 'hard', label: 'Hard', color: 'text-red-600', emoji: '🔴', bg: 'from-red-400 to-rose-500' },
];

interface Props {
  book: BookEntry;
  chapter: BookChapter;
}

export const PracticeTab: React.FC<Props> = ({ book, chapter }) => {
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('easy');
  const [stage, setStage] = useState(1);
  const [exercises, setExercises] = useState<PracticeExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [stageComplete, setStageComplete] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    startActivityTimer(book.id, chapter.id, 'practice');
    return () => { stopActivityTimer(); };
  }, [book.id, chapter.id]);

  const loadExercises = useCallback(async (diff: PracticeDifficulty, stg: number) => {
    setLoading(true);
    setError('');
    setCurrentIdx(0);
    setScore(0);
    setTotalAttempted(0);
    setStageComplete(false);
    setShowResult(null);
    setUserAnswer('');
    try {
      const result = await getPracticeExercises(book, chapter, diff, stg);
      setExercises(result);
    } catch {
      setError('Failed to generate exercises.');
    } finally {
      setLoading(false);
    }
  }, [book, chapter]);

  const handleStart = useCallback((diff: PracticeDifficulty) => {
    setDifficulty(diff);
    setStage(1);
    setStarted(true);
    loadExercises(diff, 1);
  }, [loadExercises]);

  const handleCheck = useCallback(() => {
    const exercise = exercises[currentIdx];
    if (!exercise) return;

    const correct = exercise.answer.toLowerCase().trim();
    const user = userAnswer.toLowerCase().trim();
    const isCorrect = user === correct || correct.includes(user);

    setShowResult(isCorrect ? 'correct' : 'wrong');
    setTotalAttempted(t => t + 1);
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      setShowResult(null);
      setUserAnswer('');
      if (currentIdx < exercises.length - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        // Stage complete
        const pct = Math.round(((score + (isCorrect ? 1 : 0)) / exercises.length) * 100);
        completePractice(book.id, chapter.id, difficulty, pct);
        setStageComplete(true);
      }
    }, 1500);
  }, [exercises, currentIdx, userAnswer, score, book.id, chapter.id, difficulty]);

  const handleOptionSelect = useCallback((option: string) => {
    setUserAnswer(option);
    const exercise = exercises[currentIdx];
    if (!exercise) return;

    const isCorrect = option === exercise.answer || exercise.answer.toLowerCase().includes(option.toLowerCase());
    setShowResult(isCorrect ? 'correct' : 'wrong');
    setTotalAttempted(t => t + 1);
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      setShowResult(null);
      setUserAnswer('');
      if (currentIdx < exercises.length - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        const pct = Math.round(((score + (isCorrect ? 1 : 0)) / exercises.length) * 100);
        completePractice(book.id, chapter.id, difficulty, pct);
        setStageComplete(true);
      }
    }, 1500);
  }, [exercises, currentIdx, score, book.id, chapter.id, difficulty]);

  const handleNextStage = useCallback(() => {
    if (stage < 5) {
      const nextStage = stage + 1;
      setStage(nextStage);
      loadExercises(difficulty, nextStage);
    } else {
      setStarted(false);
    }
  }, [stage, difficulty, loadExercises]);

  const diffInfo = useMemo(() => DIFFICULTIES.find(d => d.key === difficulty)!, [difficulty]);

  // Difficulty selection screen
  if (!started) {
    return (
      <motion.div
        className="max-w-lg mx-auto py-8 space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <motion.span
            className="text-5xl inline-block"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            📝
          </motion.span>
          <h3 className="text-lg font-black text-gray-800 mt-2">Practice Mode</h3>
          <p className="text-xs text-gray-400 font-medium">Choose your difficulty level</p>
        </div>

        {DIFFICULTIES.map(diff => (
          <motion.button
            key={diff.key}
            onClick={() => handleStart(diff.key)}
            className="w-full rounded-3xl p-5 flex items-center gap-4 cursor-pointer text-left"
            style={{
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.span className="text-3xl" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              {diff.emoji}
            </motion.span>
            <div className="flex-1">
              <h4 className={`text-sm font-black ${diff.color}`}>{diff.label}</h4>
              <p className="text-[10px] text-gray-400">5 stages · 5 questions each · {
                diff.key === 'easy' ? 'Simple words & matching' :
                diff.key === 'medium' ? 'Sentences & fill-the-blanks' :
                'Word building & reasoning'
              }</p>
            </div>
            <span className="text-gray-300 text-lg">→</span>
          </motion.button>
        ))}
      </motion.div>
    );
  }

  if (loading) return <LoadingPractice />;
  if (error) return <ErrorPractice message={error} onRetry={() => loadExercises(difficulty, stage)} />;

  // Stage complete celebration
  if (stageComplete) {
    const pct = Math.round((score / exercises.length) * 100);
    return (
      <motion.div
        className="max-w-md mx-auto flex flex-col items-center py-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.span
          className="text-7xl mb-4"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.8 }}
        >
          {pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💪'}
        </motion.span>
        <h3 className="text-xl font-black text-gray-800">Stage {stage} Complete!</h3>
        <p className="text-sm text-gray-500 mt-1">
          {score}/{exercises.length} correct ({pct}%)
        </p>

        {/* Stars */}
        <div className="flex gap-1 mt-3">
          {[1, 2, 3].map(star => (
            <motion.span
              key={star}
              className="text-2xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: star * 0.2 }}
            >
              {pct >= star * 30 ? '⭐' : '☆'}
            </motion.span>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <motion.button
            onClick={() => loadExercises(difficulty, stage)}
            className="px-5 py-2.5 rounded-2xl text-[12px] font-bold text-gray-600 bg-white border border-gray-200 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 Retry Stage
          </motion.button>
          {stage < 5 ? (
            <motion.button
              onClick={handleNextStage}
              className={`px-5 py-2.5 rounded-2xl text-[12px] font-bold text-white bg-gradient-to-r ${diffInfo.bg} shadow-lg cursor-pointer`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Stage {stage + 1} →
            </motion.button>
          ) : (
            <motion.button
              onClick={() => setStarted(false)}
              className="px-5 py-2.5 rounded-2xl text-[12px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ✅ All Done!
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  if (exercises.length === 0) return <ErrorPractice message="No exercises found." onRetry={() => loadExercises(difficulty, stage)} />;

  const exercise = exercises[currentIdx];

  return (
    <motion.div
      className="max-w-lg mx-auto py-4 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Stage info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${diffInfo.color}`}
            style={{ background: `${diffInfo.key === 'easy' ? 'rgba(16,185,129,0.1)' : diffInfo.key === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'}` }}
          >
            {diffInfo.emoji} {diffInfo.label} · Stage {stage}/5
          </span>
        </div>
        <span className="text-xs font-bold text-gray-500">
          {currentIdx + 1}/{exercises.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${diffInfo.bg}`}
          animate={{ width: `${((currentIdx + 1) / exercises.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Exercise Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: showResult === 'correct' ? 'rgba(16,185,129,0.08)' :
              showResult === 'wrong' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.85)',
            border: showResult === 'correct' ? '2px solid rgba(16,185,129,0.3)' :
              showResult === 'wrong' ? '2px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.05)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={spring}
        >
          {/* Type badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase">
              {exercise.type.replace('_', ' ')}
            </span>
            <span className="text-2xl">{exercise.emoji}</span>
          </div>

          {/* Question */}
          <h3 className="text-[15px] font-bold text-gray-800 mb-4 leading-relaxed">
            {exercise.question}
          </h3>

          {/* Hint */}
          {exercise.hint && (
            <p className="text-[11px] text-amber-600 mb-4 flex items-center gap-1.5">
              <span>💡</span> {exercise.hint}
            </p>
          )}

          {/* Answer input - options or text */}
          {exercise.options && exercise.options.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {exercise.options.map((opt, oi) => (
                <motion.button
                  key={oi}
                  onClick={() => !showResult && handleOptionSelect(opt)}
                  disabled={!!showResult}
                  className={`p-3 rounded-2xl text-[13px] font-bold cursor-pointer transition-all text-left ${
                    showResult && opt === exercise.answer ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' :
                    showResult && userAnswer === opt && opt !== exercise.answer ? 'bg-red-100 text-red-700 border-2 border-red-300' :
                    'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                  whileHover={showResult ? {} : { scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {opt}
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                type="text"
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                placeholder="Type your answer..."
                className="flex-1 bg-gray-50 text-gray-700 text-sm px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:border-green-300 placeholder-gray-300 font-medium"
                disabled={!!showResult}
                autoFocus
              />
              <motion.button
                onClick={handleCheck}
                disabled={!!showResult || !userAnswer.trim()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-lime-500 text-white text-sm font-bold cursor-pointer disabled:opacity-40"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Check ✓
              </motion.button>
            </div>
          )}

          {/* Result feedback */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                className={`mt-4 p-3 rounded-2xl text-center text-sm font-bold ${
                  showResult === 'correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                {showResult === 'correct' ? '🎉 Correct! Great job!' : `❌ The answer is: ${exercise.answer}`}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Score */}
      <div className="text-center text-[11px] text-gray-400 font-bold">
        Score: {score}/{totalAttempted} ⭐
      </div>
    </motion.div>
  );
};

// Helpers
const LoadingPractice: React.FC = () => (
  <motion.div className="flex flex-col items-center justify-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <motion.div className="text-4xl" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>📝</motion.div>
    <p className="text-sm text-gray-400 mt-4 font-medium">Creating exercises...</p>
  </motion.div>
);

const ErrorPractice: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <motion.div className="flex flex-col items-center justify-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <span className="text-3xl mb-3">😕</span>
    <p className="text-sm text-gray-500 mb-4">{message}</p>
    <motion.button onClick={onRetry} className="px-4 py-2 rounded-2xl bg-green-100 text-green-600 text-xs font-bold cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      Try Again
    </motion.button>
  </motion.div>
);
