/**
 * parent/components/books/QuizTab.tsx
 * ─────────────────────────────────────────────────────
 * Enhanced Quiz Mode — AUTO AI GENERATED, adaptive difficulty.
 *
 * Features:
 *  - 10 MCQs + short answers + picture-based questions
 *  - Adaptive difficulty (auto-adjusts based on performance)
 *  - Tracks incorrect answers for Revision mode
 *  - Celebration & stars
 *  - Difficulty indicator
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookEntry, BookChapter } from '../../../data/bookConfig';
import { getAdaptiveQuiz, type AdaptiveQuizQuestion, type PracticeDifficulty } from '../../../services/chapterIntelligence';
import {
  recordQuiz, getChapterProgress,
  startActivityTimer, stopActivityTimer,
} from '../../../services/progressTracker';
import { recordQuizResult } from '../../../services/readingInsights';

const spring = { type: 'spring' as const, stiffness: 260, damping: 26 };

const DIFF_STYLES: Record<PracticeDifficulty, { emoji: string; color: string; bg: string }> = {
  easy: { emoji: '🟢', color: 'text-emerald-600', bg: 'from-emerald-400 to-green-500' },
  medium: { emoji: '🟡', color: 'text-amber-600', bg: 'from-amber-400 to-yellow-500' },
  hard: { emoji: '🔴', color: 'text-red-600', bg: 'from-red-400 to-rose-500' },
};

interface Props {
  book: BookEntry;
  chapter: BookChapter;
}

export const QuizTab: React.FC<Props> = ({ book, chapter }) => {
  const progress = useMemo(
    () => getChapterProgress(book.id, chapter.id, chapter.name, book.subject),
    [book.id, chapter.id, chapter.name, book.subject]
  );

  const [difficulty, setDifficulty] = useState<PracticeDifficulty>(progress.quizDifficulty);
  const [questions, setQuestions] = useState<AdaptiveQuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Map<number, { answer: string; isCorrect: boolean }>>(new Map());
  const [shortAnswer, setShortAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    startActivityTimer(book.id, chapter.id, 'quiz');
    return () => { stopActivityTimer(); };
  }, [book.id, chapter.id]);

  const fetchQuiz = useCallback(async (diff?: PracticeDifficulty) => {
    const d = diff || difficulty;
    setLoading(true);
    setError('');
    setCurrentQ(0);
    setAnswers(new Map());
    setShowResult(false);
    setShowFeedback(false);
    setShortAnswer('');
    try {
      const result = await getAdaptiveQuiz(book, chapter, d);
      setQuestions(result);
    } catch {
      setError('Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  }, [book, chapter, difficulty]);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

  const score = useMemo(() => {
    let correct = 0;
    answers.forEach(a => { if (a.isCorrect) correct++; });
    return correct;
  }, [answers]);

  const handleMCQAnswer = useCallback((optionIdx: number) => {
    const q = questions[currentQ];
    if (!q || showFeedback) return;
    const isCorrect = q.correctIndex === optionIdx;

    setAnswers(prev => {
      const next = new Map(prev);
      next.set(currentQ, { answer: q.options?.[optionIdx] || '', isCorrect });
      return next;
    });
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      if (currentQ < questions.length - 1) {
        setCurrentQ(i => i + 1);
      } else {
        finishQuiz(isCorrect);
      }
    }, 1800);
  }, [questions, currentQ, showFeedback]);

  const handleShortAnswer = useCallback(() => {
    const q = questions[currentQ];
    if (!q || !shortAnswer.trim()) return;

    const correct = (q.correctAnswer || '').toLowerCase().trim();
    const user = shortAnswer.toLowerCase().trim();
    const isCorrect = user === correct || correct.includes(user) || user.includes(correct);

    setAnswers(prev => {
      const next = new Map(prev);
      next.set(currentQ, { answer: shortAnswer, isCorrect });
      return next;
    });
    setShowFeedback(true);
    setShortAnswer('');

    setTimeout(() => {
      setShowFeedback(false);
      if (currentQ < questions.length - 1) {
        setCurrentQ(i => i + 1);
      } else {
        finishQuiz(isCorrect);
      }
    }, 1800);
  }, [questions, currentQ, shortAnswer]);

  const finishQuiz = useCallback((lastCorrect: boolean) => {
    const finalScore = score + (lastCorrect ? 1 : 0);
    setShowResult(true);

    // Collect incorrect answers for revision
    const incorrects: { question: string; userAnswer: string; correctAnswer: string; explanation?: string }[] = [];
    answers.forEach((a, qIdx) => {
      if (!a.isCorrect) {
        const q = questions[qIdx];
        incorrects.push({
          question: q.question,
          userAnswer: a.answer,
          correctAnswer: q.type === 'mcq' ? (q.options?.[q.correctIndex!] || '') : (q.correctAnswer || ''),
          explanation: q.explanation,
        });
      }
    });
    // Check the last question too
    if (!lastCorrect && questions[questions.length - 1]) {
      const lastQ = questions[questions.length - 1];
      incorrects.push({
        question: lastQ.question,
        userAnswer: '',
        correctAnswer: lastQ.type === 'mcq' ? (lastQ.options?.[lastQ.correctIndex!] || '') : (lastQ.correctAnswer || ''),
        explanation: lastQ.explanation,
      });
    }

    recordQuiz(book.id, chapter.id, finalScore, questions.length, incorrects);
    recordQuizResult({ bookId: book.id, chapterId: chapter.id, chapterName: chapter.name, score: finalScore, total: questions.length });
  }, [score, answers, questions, book.id, chapter.id, chapter.name]);

  if (loading) return <QuizLoading />;
  if (error) return <QuizError message={error} onRetry={() => fetchQuiz()} />;

  // Result screen
  if (showResult) {
    const pct = Math.round((score / questions.length) * 100);
    const incorrects = Array.from(answers.entries()).filter(([_, a]) => !a.isCorrect);

    return (
      <motion.div
        className="max-w-lg mx-auto py-8 space-y-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center">
          <motion.span
            className="text-7xl inline-block"
            animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1 }}
          >
            {pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💪'}
          </motion.span>
          <h3 className="text-xl font-black text-gray-800 mt-3">
            {score} / {questions.length}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {pct >= 80 ? 'Amazing! You\'re a star! 🌟'
              : pct >= 50 ? 'Good job! Keep practicing!'
              : 'Don\'t worry, you\'re learning! 💪'}
          </p>
          <div className="flex justify-center gap-1 mt-3">
            {[1, 2, 3].map(s => (
              <motion.span key={s} className="text-2xl" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: s * 0.2 }}>
                {pct >= s * 30 ? '⭐' : '☆'}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Review incorrect answers */}
        {incorrects.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black text-gray-500 uppercase">Review Incorrect Answers</h4>
            {incorrects.map(([qIdx]) => {
              const q = questions[qIdx];
              return (
                <div key={qIdx} className="rounded-2xl p-4 bg-red-50 border border-red-100">
                  <p className="text-[12px] text-gray-700 font-medium mb-1">{q.question}</p>
                  <p className="text-[11px] text-emerald-600 font-bold">
                    ✅ {q.type === 'mcq' ? q.options?.[q.correctIndex!] : q.correctAnswer}
                  </p>
                  {q.explanation && (
                    <p className="text-[10px] text-gray-400 mt-1">{q.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center gap-3">
          <motion.button
            onClick={() => fetchQuiz()}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r -amber- -orange- shadow-lg cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 New Quiz
          </motion.button>
          {pct < 80 && (
            <motion.button
              onClick={() => { setDifficulty('easy'); fetchQuiz('easy'); }}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🟢 Try Easier
            </motion.button>
          )}
          {pct >= 80 && difficulty !== 'hard' && (
            <motion.button
              onClick={() => {
                const next: PracticeDifficulty = difficulty === 'easy' ? 'medium' : 'hard';
                setDifficulty(next);
                fetchQuiz(next);
              }}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔥 Try Harder
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  if (questions.length === 0) return <QuizError message="No quiz questions generated." onRetry={() => fetchQuiz()} />;

  const q = questions[currentQ];
  const currentAnswer = answers.get(currentQ);
  const diff = DIFF_STYLES[difficulty];

  return (
    <motion.div
      className="max-w-lg mx-auto py-4 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${diff.color}`}
          style={{ background: difficulty === 'easy' ? 'rgba(16,185,129,0.1)' : difficulty === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)' }}
        >
          {diff.emoji} {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz
        </span>
        <span className="text-xs font-bold text-gray-500">
          {currentQ + 1}/{questions.length} · Score: {score}
        </span>
      </div>

      {/* Progress */}
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${diff.bg}`}
          animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          className="rounded-3xl p-6 relative"
          style={{
            background: showFeedback
              ? currentAnswer?.isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'
              : 'rgba(255,255,255,0.85)',
            border: showFeedback
              ? currentAnswer?.isCorrect ? '2px solid rgba(16,185,129,0.3)' : '2px solid rgba(239,68,68,0.3)'
              : '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.05)',
          }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={spring}
        >
          {/* Question type badge */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase">
              {q.type === 'mcq' ? '📋 Multiple Choice' : q.type === 'short' ? '✏️ Short Answer' : '🖼️ Picture Question'}
            </span>
            <span className="text-2xl">{q.emoji}</span>
          </div>

          {/* Question */}
          <h3 className="text-[15px] font-bold text-gray-800 mb-5 leading-relaxed">
            {q.question}
          </h3>

          {/* MCQ Options */}
          {q.type === 'mcq' && q.options && (
            <div className="space-y-2.5">
              {q.options.map((opt, oi) => {
                const isCorrectOpt = q.correctIndex === oi;
                const isSelected = currentAnswer?.answer === opt;

                return (
                  <motion.button
                    key={oi}
                    onClick={() => handleMCQAnswer(oi)}
                    disabled={showFeedback}
                    className={`w-full text-left p-4 rounded-2xl text-[13px] font-medium cursor-pointer transition-all ${
                      showFeedback && isCorrectOpt ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' :
                      showFeedback && isSelected && !isCorrectOpt ? 'bg-red-100 text-red-700 border-2 border-red-300' :
                      'bg-gray-50 text-gray-700 border border-gray-200 hover:-amber- hover:-amber-'
                    }`}
                    whileHover={showFeedback ? {} : { scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="font-bold mr-2 text-gray-400">
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    {opt}
                    {showFeedback && isCorrectOpt && <span className="ml-2">✅</span>}
                    {showFeedback && isSelected && !isCorrectOpt && <span className="ml-2">❌</span>}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Short Answer / Picture Answer */}
          {(q.type === 'short' || q.type === 'picture') && !showFeedback && (
            <div className="flex gap-3">
              <input
                type="text"
                value={shortAnswer}
                onChange={e => setShortAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleShortAnswer()}
                placeholder="Type your answer..."
                className="flex-1 bg-gray-50 text-gray-700 text-sm px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:-amber- placeholder-gray-300 font-medium"
                autoFocus
              />
              <motion.button
                onClick={handleShortAnswer}
                disabled={!shortAnswer.trim()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r -amber- -orange- text-white text-sm font-bold cursor-pointer disabled:opacity-40"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Submit
              </motion.button>
            </div>
          )}

          {/* Feedback */}
          {showFeedback && (
            <motion.div
              className={`mt-4 p-3 rounded-2xl text-center ${
                currentAnswer?.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-sm font-bold">
                {currentAnswer?.isCorrect ? '🎉 Correct!' : '❌ Not quite!'}
              </p>
              {!currentAnswer?.isCorrect && (
                <p className="text-[11px] mt-1 opacity-80">
                  Answer: {q.type === 'mcq' ? q.options?.[q.correctIndex!] : q.correctAnswer}
                </p>
              )}
              {q.explanation && (
                <p className="text-[10px] mt-1 opacity-60">{q.explanation}</p>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// Helpers
const QuizLoading: React.FC = () => (
  <motion.div className="flex flex-col items-center justify-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <motion.div className="text-4xl" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>🧠</motion.div>
    <p className="text-sm text-gray-400 mt-4 font-medium">Creating your quiz...</p>
  </motion.div>
);

const QuizError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <motion.div className="flex flex-col items-center justify-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <span className="text-3xl mb-3">😕</span>
    <p className="text-sm text-gray-500 mb-4">{message}</p>
    <motion.button onClick={onRetry} className="px-4 py-2 rounded-2xl -amber- -amber- text-xs font-bold cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      Try Again
    </motion.button>
  </motion.div>
);
