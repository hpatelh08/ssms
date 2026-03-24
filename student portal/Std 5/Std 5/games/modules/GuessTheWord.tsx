/**
 * 🖼️ Guess The Word Module
 * ==========================
 * Show picture emoji → pick correct word from 4 options.
 * - No repeated items within a session
 * - Wrong items re-queued for learning
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameModuleProps, shuffleArray, pickRandom } from '../types';

// ─── Word Data (expanded pool) ───────────────────────────

interface PicWord { id: string; word: string; emoji: string; }

const PIC_WORDS: PicWord[] = [
  { id: 'apple', word: 'APPLE', emoji: '🍎' },
  { id: 'banana', word: 'BANANA', emoji: '🍌' },
  { id: 'cat', word: 'CAT', emoji: '🐱' },
  { id: 'dog', word: 'DOG', emoji: '🐕' },
  { id: 'elephant', word: 'ELEPHANT', emoji: '🐘' },
  { id: 'fish', word: 'FISH', emoji: '🐟' },
  { id: 'grapes', word: 'GRAPES', emoji: '🍇' },
  { id: 'house', word: 'HOUSE', emoji: '🏠' },
  { id: 'ice_cream', word: 'ICE CREAM', emoji: '🍦' },
  { id: 'juice', word: 'JUICE', emoji: '🧃' },
  { id: 'kite', word: 'KITE', emoji: '🪁' },
  { id: 'lion', word: 'LION', emoji: '🦁' },
  { id: 'monkey', word: 'MONKEY', emoji: '🐒' },
  { id: 'nest', word: 'NEST', emoji: '🪹' },
  { id: 'orange', word: 'ORANGE', emoji: '🍊' },
  { id: 'penguin', word: 'PENGUIN', emoji: '🐧' },
  { id: 'rainbow', word: 'RAINBOW', emoji: '🌈' },
  { id: 'star', word: 'STAR', emoji: '⭐' },
  { id: 'train', word: 'TRAIN', emoji: '🚂' },
  { id: 'umbrella', word: 'UMBRELLA', emoji: '☂️' },
  { id: 'cake', word: 'CAKE', emoji: '🎂' },
  { id: 'moon', word: 'MOON', emoji: '🌙' },
  { id: 'sun', word: 'SUN', emoji: '☀️' },
  { id: 'flower', word: 'FLOWER', emoji: '🌸' },
  { id: 'bear', word: 'BEAR', emoji: '🐻' },
  { id: 'frog', word: 'FROG', emoji: '🐸' },
  { id: 'ball', word: 'BALL', emoji: '⚽' },
  { id: 'book', word: 'BOOK', emoji: '📖' },
  { id: 'bus', word: 'BUS', emoji: '🚌' },
  { id: 'tree', word: 'TREE', emoji: '🌳' },
  { id: 'rocket', word: 'ROCKET', emoji: '🚀' },
  { id: 'bell', word: 'BELL', emoji: '🔔' },
];

// ─── Question Generator ──────────────────────────────────

interface GuessTWQuestion { target: PicWord; options: string[]; }

function generateQuestion(usedIds: Set<string>, wrongQueue: PicWord[], diff: 'easy' | 'intermediate' | 'difficult' = 'easy'): GuessTWQuestion {
  let target: PicWord;
  if (wrongQueue.length > 0) {
    target = wrongQueue[0];
  } else {
    const unused = PIC_WORDS.filter(p => !usedIds.has(p.id));
    const pool = unused.length > 0 ? unused : PIC_WORDS;
    target = pickRandom(pool);
  }
  const optionCount = diff === 'easy' ? 3 : diff === 'intermediate' ? 4 : 5;
  const distractors = shuffleArray(PIC_WORDS.filter(p => p.id !== target.id)).slice(0, optionCount - 1).map(p => p.word);
  const options = shuffleArray([target.word, ...distractors]);
  return { target, options };
}

// ─── Component ────────────────────────────────────────────

export const GuessTheWordModule: React.FC<GameModuleProps> = React.memo(({ state, onSelectAnswer, onSetCorrectAnswer, difficulty }) => {
  const roundRef = useRef(state.round);
  const usedIdsRef = useRef<Set<string>>(new Set());
  const wrongQueueRef = useRef<PicWord[]>([]);

  const [question, setQuestion] = useState(() => {
    const q = generateQuestion(usedIdsRef.current, wrongQueueRef.current, difficulty);
    usedIdsRef.current.add(q.target.id);
    return q;
  });

  // Set correct answer when engine is ready
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer(question.target.word);
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track wrong answers
  useEffect(() => {
    if (state.status === 'roundEnd') {
      const wasWrong = state.selectedAnswer !== state.correctAnswer;
      if (wasWrong) {
        if (!wrongQueueRef.current.find(p => p.id === question.target.id)) {
          wrongQueueRef.current.push(question.target);
        }
      } else {
        wrongQueueRef.current = wrongQueueRef.current.filter(p => p.id !== question.target.id);
      }
    }
  }, [state.status, state.selectedAnswer, state.correctAnswer, question]);

  // New round
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      const q = generateQuestion(usedIdsRef.current, wrongQueueRef.current, difficulty);
      usedIdsRef.current.add(q.target.id);
      if (wrongQueueRef.current.length > 0 && wrongQueueRef.current[0].id === q.target.id) {
        wrongQueueRef.current = wrongQueueRef.current.slice(1);
      }
      setQuestion(q);
      onSetCorrectAnswer(q.target.word);
    }
  }, [state.round, onSetCorrectAnswer, difficulty]);

  // Session reset (FIX: also set correct answer to prevent first-question bug)
  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      usedIdsRef.current = new Set();
      wrongQueueRef.current = [];
      const q = generateQuestion(usedIdsRef.current, wrongQueueRef.current, difficulty);
      usedIdsRef.current.add(q.target.id);
      setQuestion(q);
      onSetCorrectAnswer(q.target.word);
      roundRef.current = 1;
    }
  }, [state.status, state.round, difficulty, onSetCorrectAnswer]);

  const isLocked = state.status !== 'playing';

  return (
    <>
      {/* Picture display */}
      <motion.div
        className="mb-6"
        key={`${state.round}-${question.target.id}`}
        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12 }}
      >
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">What is this?</p>
        <div className="inline-flex items-center justify-center w-36 h-36 bg-white/80 rounded-3xl border-2 border-dashed border-green-200/50 shadow-lg shadow-green-100/20">
          <motion.span
            className="text-8xl"
            animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {question.target.emoji}
          </motion.span>
        </div>
      </motion.div>

      {/* Word options */}
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {question.options.map((word, i) => {
          const isSelected = state.selectedAnswer === word;
          const isCorrect = word === question.target.word;
          const showResult = state.status === 'roundEnd' && isSelected;
          const isAnswer = state.status === 'roundEnd' && state.selectedAnswer !== state.correctAnswer && isCorrect;

          return (
            <motion.button
              key={word}
              onClick={() => !isLocked && onSelectAnswer(word)}
              disabled={isLocked}
              className={`py-4 px-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                showResult && isCorrect ? 'border-green-400 bg-green-50/60 text-green-600 shadow-lg shadow-green-200/30'
                : showResult && !isCorrect ? 'border-red-300 bg-red-50/30 text-red-400'
                : isAnswer ? 'border-green-400 bg-green-50/40 text-green-600'
                : isLocked ? 'border-gray-100/30 bg-gray-50/30 opacity-50 cursor-not-allowed text-gray-400'
                : 'border-gray-100/40 bg-white/50 text-gray-800 hover:border-green-200/60 hover:bg-green-50/20'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1, y: 0,
                x: showResult && !isCorrect ? [0, -6, 6, -4, 4, 0] : 0,
              }}
              transition={showResult && !isCorrect ? { duration: 0.4 } : { delay: i * 0.06, type: 'spring', stiffness: 300 }}
              whileHover={!isLocked ? { scale: 1.04, y: -2 } : {}}
              whileTap={!isLocked ? { scale: 0.94 } : {}}
            >
              {word}
            </motion.button>
          );
        })}
      </div>
    </>
  );
});
GuessTheWordModule.displayName = 'GuessTheWordModule';
