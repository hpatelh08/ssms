/**
 * parent/components/books/RevisionTab.tsx
 * ─────────────────────────────────────────────────────
 * Revision Mode — Review incorrect answers & flashcards.
 *
 * Features:
 *  - Incorrect answers from past quizzes/practice
 *  - AI-generated flashcards (flip cards)
 *  - Voice revision (read aloud)
 *  - Mark reviewed + complete revision
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookEntry, BookChapter } from '../../../data/bookConfig';
import { getFlashcards, type Flashcard } from '../../../services/chapterIntelligence';
import {
  getIncorrectAnswers, completeRevision,
  startActivityTimer, stopActivityTimer,
  type IncorrectAnswer,
} from '../../../services/progressTracker';
import { speak, stop as stopSpeech, isSpeaking, detectLanguage } from '../../../services/voiceService';

type RevisionSection = 'incorrect' | 'flashcards';

interface Props {
  book: BookEntry;
  chapter: BookChapter;
}

export const RevisionTab: React.FC<Props> = ({ book, chapter }) => {
  const [section, setSection] = useState<RevisionSection>('incorrect');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedIdx, setFlippedIdx] = useState<Set<number>>(new Set());
  const [currentCard, setCurrentCard] = useState(0);
  const [reviewedSet, setReviewedSet] = useState<Set<number>>(new Set());
  const [speaking, setSpeaking] = useState(false);

  const incorrects = useMemo(
    () => getIncorrectAnswers(book.id, chapter.id),
    [book.id, chapter.id]
  );

  useEffect(() => {
    startActivityTimer(book.id, chapter.id, 'revision');
    return () => { stopActivityTimer(); };
  }, [book.id, chapter.id]);

  // Load flashcards
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const cards = await getFlashcards(book, chapter);
        if (!cancelled) setFlashcards(cards);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [book, chapter]);

  const toggleFlip = useCallback((idx: number) => {
    setFlippedIdx(prev => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx); else n.add(idx);
      return n;
    });
  }, []);

  const markReviewed = useCallback((idx: number) => {
    setReviewedSet(prev => new Set(prev).add(idx));
  }, []);

  const readAloud = useCallback((text: string) => {
    if (isSpeaking()) { stopSpeech(); setSpeaking(false); return; }
    const lang = detectLanguage(text);
    setSpeaking(true);
    speak(text, {
      lang,
      rate: 0.75,
      pitch: 1.1,
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, []);

  const allReviewed = incorrects.length > 0 && reviewedSet.size >= incorrects.length;

  const handleCompleteRevision = useCallback(() => {
    completeRevision(book.id, chapter.id);
    stopActivityTimer();
  }, [book.id, chapter.id]);

  // ─── Incorrect Answers Section ─────────────────────────

  const renderIncorrect = () => {
    if (incorrects.length === 0) {
      return (
        <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="text-5xl">🎉</span>
          <p className="text-sm text-gray-500 font-medium mt-4">No incorrect answers!</p>
          <p className="text-xs text-gray-400 mt-1">Take a quiz to see results here</p>
        </motion.div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase">
            {incorrects.length - reviewedSet.size} to review
          </span>
          {allReviewed && (
            <motion.button
              onClick={handleCompleteRevision}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white text-[10px] font-bold cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              ✅ Revision Complete!
            </motion.button>
          )}
        </div>

        {incorrects.map((inc, idx) => (
          <motion.div
            key={idx}
            className={`relative rounded-2xl p-4 border transition-all ${
              reviewedSet.has(idx)
                ? 'bg-emerald-50/50 border-emerald-100 opacity-60'
                : 'bg-white border-gray-100'
            }`}
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            {/* Question */}
            <p className="text-[13px] font-bold text-gray-700 pr-16 leading-relaxed">
              {inc.question}
            </p>

            {/* Wrong answer */}
            <div className="mt-2 flex items-start gap-2">
              <span className="text-xs mt-0.5">❌</span>
              <p className="text-[11px] text-red-500 line-through">{inc.userAnswer || '(no answer)'}</p>
            </div>

            {/* Correct answer */}
            <div className="mt-1 flex items-start gap-2">
              <span className="text-xs mt-0.5">✅</span>
              <p className="text-[12px] text-emerald-600 font-bold">{inc.correctAnswer}</p>
            </div>

            {/* Explanation */}
            {inc.explanation && (
              <p className="text-[10px] text-gray-400 mt-2 bg-gray-50 p-2 rounded-xl leading-relaxed">
                💡 {inc.explanation}
              </p>
            )}

            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex gap-1.5">
              <motion.button
                onClick={() => readAloud(`${inc.question}. The correct answer is: ${inc.correctAnswer}`)}
                className="w-7 h-7 rounded-full -amber- flex items-center justify-center text-xs cursor-pointer"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                {speaking ? '⏸️' : '🔊'}
              </motion.button>
              {!reviewedSet.has(idx) && (
                <motion.button
                  onClick={() => markReviewed(idx)}
                  className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-xs cursor-pointer"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✓
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // ─── Flashcards Section ─────────────────────────────────

  const renderFlashcards = () => {
    if (loading) {
      return (
        <motion.div className="flex flex-col items-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="text-4xl" animate={{ rotateY: [0, 180, 360] }} transition={{ duration: 2, repeat: Infinity }}>🃏</motion.div>
          <p className="text-xs text-gray-400 mt-3 font-medium">Creating flashcards...</p>
        </motion.div>
      );
    }

    if (flashcards.length === 0) {
      return (
        <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="text-4xl">📚</span>
          <p className="text-sm text-gray-500 font-medium mt-3">No flashcards available</p>
        </motion.div>
      );
    }

    const card = flashcards[currentCard];
    const isFlipped = flippedIdx.has(currentCard);

    return (
      <div className="space-y-4">
        {/* Card counter */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400">
            Card {currentCard + 1} of {flashcards.length}
          </span>
          <div className="flex gap-1">
            {flashcards.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentCard ? '-amber- scale-125' : i < currentCard ? 'bg-emerald-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Flashcard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentCard}-${isFlipped}`}
            onClick={() => toggleFlip(currentCard)}
            className="relative cursor-pointer rounded-3xl p-8 min-h-[200px] flex flex-col items-center justify-center text-center"
            style={{
              background: isFlipped
                ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(52,211,153,0.1))'
                : 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
              border: isFlipped ? '2px solid rgba(16,185,129,0.2)' : '2px solid rgba(99,102,241,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            }}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <span className="text-3xl mb-4">{card.emoji}</span>
            {!isFlipped ? (
              <>
                <p className="text-[15px] font-bold text-gray-800 leading-relaxed max-w-[280px]">
                  {card.front}
                </p>
                <p className="text-[9px] text-gray-400 mt-4">Tap to reveal answer</p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-medium text-emerald-700 leading-relaxed max-w-[280px]">
                  {card.back}
                </p>
                <p className="text-[9px] text-emerald-400 mt-4">Tap to flip back</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation + Voice */}
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => setCurrentCard(i => Math.max(0, i - 1))}
            disabled={currentCard === 0}
            className="px-4 py-2 rounded-2xl text-xs font-bold bg-gray-100 text-gray-600 cursor-pointer disabled:opacity-30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Previous
          </motion.button>

          <motion.button
            onClick={() => readAloud(`${card.front}. ${isFlipped ? card.back : ''}`)}
            className="w-10 h-10 rounded-full -amber- flex items-center justify-center text-lg cursor-pointer"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            {speaking ? '⏸️' : '🔊'}
          </motion.button>

          <motion.button
            onClick={() => {
              if (currentCard < flashcards.length - 1) {
                setCurrentCard(i => i + 1);
              }
            }}
            disabled={currentCard >= flashcards.length - 1}
            className="px-4 py-2 rounded-2xl text-xs font-bold -amber- -amber- cursor-pointer disabled:opacity-30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Next →
          </motion.button>
        </div>
      </div>
    );
  };

  // ─── Main Layout ────────────────────────────────────────

  return (
    <motion.div
      className="max-w-lg mx-auto py-4 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Section Toggle */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
        {([
          { key: 'incorrect' as const, label: '❌ Incorrect', count: incorrects.length },
          { key: 'flashcards' as const, label: '🃏 Flashcards', count: flashcards.length },
        ]).map(s => (
          <motion.button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              section === s.key
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            whileTap={{ scale: 0.97 }}
          >
            {s.label} ({s.count})
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={section} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          {section === 'incorrect' ? renderIncorrect() : renderFlashcards()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
