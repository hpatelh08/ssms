import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { generateFillBlankQuestion, TOTAL_FILL_BLANK_QUESTIONS } from '../data/fillBlanksQuestions';

interface FillBlanksProgressEntry {
  level: number;
  questionNumber: number;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  total: number;
  correct: number;
  date: string;
}

interface FeedbackState {
  isCorrect: boolean;
  correctAnswer: string;
}

const STORAGE_KEY = 'ssms_fillblanks_progress';
const ADVANCE_DELAY_MS = 1200;
const MAX_STORED_PROGRESS = 5000;

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getQuestionNumber(entry: Partial<FillBlanksProgressEntry>): number | null {
  if (typeof entry.questionNumber === 'number' && entry.questionNumber > 0) return entry.questionNumber;
  if (typeof entry.level === 'number' && entry.level > 0) return entry.level;
  return null;
}

function loadProgress(): FillBlanksProgressEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry: Partial<FillBlanksProgressEntry>) => {
        const questionNumber = getQuestionNumber(entry);
        if (!questionNumber) return null;

        return {
          level: questionNumber,
          questionNumber,
          prompt: typeof entry.prompt === 'string' ? entry.prompt : '',
          userAnswer: typeof entry.userAnswer === 'string' ? entry.userAnswer : '',
          correctAnswer: typeof entry.correctAnswer === 'string' ? entry.correctAnswer : '',
          total: 1,
          correct: entry.correct ? 1 : 0,
          date: typeof entry.date === 'string' ? entry.date : new Date().toISOString(),
        };
      })
      .filter((entry): entry is FillBlanksProgressEntry => Boolean(entry))
      .sort((a, b) => a.questionNumber - b.questionNumber);
  } catch {
    return [];
  }
}

function saveProgress(entries: FillBlanksProgressEntry[]): void {
  const trimmed = entries.slice(-MAX_STORED_PROGRESS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function getNextQuestionNumber(entries: FillBlanksProgressEntry[]): number {
  if (entries.length === 0) return 1;
  return Math.max(...entries.map(entry => entry.questionNumber)) + 1;
}

const FillBlanksPage: React.FC = () => {
  const [progressEntries, setProgressEntries] = useState<FillBlanksProgressEntry[]>(() => loadProgress());
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number | null>(() => {
    const existing = loadProgress();
    return getNextQuestionNumber(existing);
  });
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
    }
  }, []);

  const currentQuestion = useMemo(
    () => (currentQuestionNumber ? generateFillBlankQuestion(currentQuestionNumber) : null),
    [currentQuestionNumber],
  );
  const currentOptions = currentQuestion?.options ?? [];

  const stats = useMemo(() => {
    const attempted = progressEntries.length;
    const correct = progressEntries.reduce((sum, entry) => sum + entry.correct, 0);
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    return {
      attempted,
      correct,
      accuracy,
    };
  }, [progressEntries]);

  const handleSelectAnswer = (option: string) => {
    if (!currentQuestion || feedback) return;

    const isCorrect = normalizeAnswer(option) === normalizeAnswer(currentQuestion.answer);
    const entry: FillBlanksProgressEntry = {
      level: currentQuestion.id,
      questionNumber: currentQuestion.id,
      prompt: currentQuestion.prompt,
      userAnswer: option,
      correctAnswer: currentQuestion.answer,
      total: 1,
      correct: isCorrect ? 1 : 0,
      date: new Date().toISOString(),
    };

    const updatedEntries = [...progressEntries, entry].sort((a, b) => a.questionNumber - b.questionNumber);

    setSelectedAnswer(option);
    setProgressEntries(updatedEntries);
    saveProgress(updatedEntries);
    setFeedback({ isCorrect, correctAnswer: currentQuestion.answer });

    advanceTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer('');
      setCurrentQuestionNumber(getNextQuestionNumber(updatedEntries));
    }, ADVANCE_DELAY_MS);
  };

  const handleRestart = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
    }
    localStorage.removeItem(STORAGE_KEY);
    setProgressEntries([]);
    setCurrentQuestionNumber(1);
    setSelectedAnswer('');
    setFeedback(null);
  };

  const currentIndex = currentQuestion?.id ?? Math.max(1, stats.attempted + 1);
  const progressPercent = TOTAL_FILL_BLANK_QUESTIONS > 0
    ? Math.min(100, Math.round((stats.attempted / TOTAL_FILL_BLANK_QUESTIONS) * 100))
    : 0;

  return (
    <div className="min-h-screen px-4 py-6 pb-28 lg:pb-8">
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="rounded-[28px] border border-orange-100 bg-[linear-gradient(135deg,#fff8ee_0%,#ffffff_48%,#fff5fb_100%)] p-6 shadow-[0_20px_60px_rgba(251,146,60,0.08)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-orange-600">Fill in the Blanks</h1>
            </div>

            <div className="grid grid-cols-3 gap-3 md:min-w-[320px]">
              {[
                { label: 'Attempted', value: `${stats.attempted}`, tone: 'text-orange-600' },
                { label: 'Correct', value: `${stats.correct}`, tone: 'text-emerald-600' },
                { label: 'Accuracy', value: `${stats.accuracy}%`, tone: 'text-sky-600' },
              ].map(card => (
                <div key={card.label} className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-center shadow-sm">
                  <p className={`text-lg font-black ${card.tone}`}>{card.value}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{card.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              <span>Mastery Progress</span>
              <span>{progressPercent}% of 1000-question target</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-orange-100">
              <motion.div
                className="h-full rounded-full bg-[linear-gradient(90deg,#fb923c_0%,#f97316_45%,#ec4899_100%)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>

        {currentQuestion ? (
          <motion.div
            className="mt-8 rounded-[28px] border border-orange-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentQuestion.id}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
                  Question {currentQuestion.id}
                </p>
                <h2 className="mt-2 text-2xl font-black leading-snug text-slate-800">{currentQuestion.prompt}</h2>
              </div>
              <div className="rounded-2xl bg-orange-50 px-4 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">Up Next</p>
                <p className="mt-1 text-lg font-black text-orange-600">
                  {currentIndex + 1}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <label className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">
                Select the correct answer
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {currentOptions.map(option => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectOption = normalizeAnswer(option) === normalizeAnswer(currentQuestion.answer);
                  const showCorrect = Boolean(feedback) && isCorrectOption;
                  const showWrong = Boolean(feedback) && isSelected && !isCorrectOption;

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={Boolean(feedback)}
                      onClick={() => handleSelectAnswer(option)}
                      className={`rounded-2xl border px-5 py-4 text-left text-lg font-bold transition ${
                        showCorrect
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : showWrong
                            ? 'border-rose-300 bg-rose-50 text-rose-700'
                            : isSelected
                              ? 'border-orange-300 bg-orange-100 text-orange-700'
                              : 'border-orange-200 bg-orange-50 text-slate-700 hover:border-orange-300 hover:bg-orange-100'
                      } disabled:cursor-not-allowed disabled:opacity-100`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-100"
                >
                  Restart All
                </button>
              </div>

              {feedback && (
                <motion.div
                  className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
                    feedback.isCorrect
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {feedback.isCorrect
                    ? 'Correct answer. Next question is loading...'
                    : `Incorrect. Correct answer: ${feedback.correctAnswer}. Next question is loading...`}
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="mt-8 rounded-[28px] border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_55%,#eff6ff_100%)] p-8 text-center shadow-[0_20px_60px_rgba(16,185,129,0.08)]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-500">Ready</p>
            <h2 className="mt-3 text-3xl font-black text-slate-800">Endless practice is ready</h2>
            <p className="mt-3 text-base font-medium text-slate-600">
              Attempted {stats.attempted} questions with {stats.accuracy}% accuracy.
            </p>
            <button
              type="button"
              onClick={handleRestart}
              className="mt-6 rounded-2xl bg-[linear-gradient(135deg,#10b981_0%,#14b8a6_100%)] px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)]"
            >
              Practice Again
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default FillBlanksPage;
