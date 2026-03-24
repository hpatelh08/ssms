/**
 * 🔍 Picture Identify Module
 * ============================
 * Show 4 images → "Which one is a [category]?" → tap correct.
 * - No repeated items within a session
 * - Wrong items re-queued for learning
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameModuleProps, shuffleArray, pickRandom } from '../types';

// ─── Category Data (expanded pool) ──────────────────────

interface PicItem { id: string; name: string; emoji: string; category: string; }

const ITEMS: PicItem[] = [
  // Animals (8)
  { id: 'cat', name: 'Cat', emoji: '🐱', category: 'Animal' },
  { id: 'dog', name: 'Dog', emoji: '🐕', category: 'Animal' },
  { id: 'fish', name: 'Fish', emoji: '🐟', category: 'Animal' },
  { id: 'bird', name: 'Bird', emoji: '🐦', category: 'Animal' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', category: 'Animal' },
  { id: 'elephant', name: 'Elephant', emoji: '🐘', category: 'Animal' },
  { id: 'frog', name: 'Frog', emoji: '🐸', category: 'Animal' },
  { id: 'bear', name: 'Bear', emoji: '🐻', category: 'Animal' },
  // Fruits (8)
  { id: 'apple', name: 'Apple', emoji: '🍎', category: 'Fruit' },
  { id: 'banana', name: 'Banana', emoji: '🍌', category: 'Fruit' },
  { id: 'grapes', name: 'Grapes', emoji: '🍇', category: 'Fruit' },
  { id: 'orange', name: 'Orange', emoji: '🍊', category: 'Fruit' },
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', category: 'Fruit' },
  { id: 'watermelon', name: 'Watermelon', emoji: '🍉', category: 'Fruit' },
  { id: 'cherry', name: 'Cherry', emoji: '🍒', category: 'Fruit' },
  { id: 'peach', name: 'Peach', emoji: '🍑', category: 'Fruit' },
  // Vehicles (8)
  { id: 'car', name: 'Car', emoji: '🚗', category: 'Vehicle' },
  { id: 'bus', name: 'Bus', emoji: '🚌', category: 'Vehicle' },
  { id: 'train', name: 'Train', emoji: '🚂', category: 'Vehicle' },
  { id: 'airplane', name: 'Airplane', emoji: '✈️', category: 'Vehicle' },
  { id: 'bicycle', name: 'Bicycle', emoji: '🚲', category: 'Vehicle' },
  { id: 'boat', name: 'Boat', emoji: '⛵', category: 'Vehicle' },
  { id: 'helicopter', name: 'Helicopter', emoji: '🚁', category: 'Vehicle' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', category: 'Vehicle' },
  // Nature (8)
  { id: 'tree', name: 'Tree', emoji: '🌳', category: 'Nature' },
  { id: 'flower', name: 'Flower', emoji: '🌸', category: 'Nature' },
  { id: 'sun', name: 'Sun', emoji: '☀️', category: 'Nature' },
  { id: 'moon', name: 'Moon', emoji: '🌙', category: 'Nature' },
  { id: 'cloud', name: 'Cloud', emoji: '☁️', category: 'Nature' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', category: 'Nature' },
  { id: 'mountain', name: 'Mountain', emoji: '⛰️', category: 'Nature' },
  { id: 'ocean', name: 'Ocean', emoji: '🌊', category: 'Nature' },
];

const CATEGORIES = ['Animal', 'Fruit', 'Vehicle', 'Nature'];

// ─── Question Generator ──────────────────────────────────

interface PicIdQuestion { category: string; correctItem: PicItem; options: PicItem[]; }

function generateQuestion(usedIds: Set<string>, wrongQueue: PicItem[], diff: 'easy' | 'intermediate' | 'difficult' = 'easy'): PicIdQuestion {
  let correctItem: PicItem;
  let category: string;

  if (wrongQueue.length > 0) {
    correctItem = wrongQueue[0];
    category = correctItem.category;
  } else {
    // Pick a random category, then pick unused item from it
    category = pickRandom(CATEGORIES);
    const catItems = ITEMS.filter(i => i.category === category);
    const unusedCatItems = catItems.filter(i => !usedIds.has(i.id));
    const pool = unusedCatItems.length > 0 ? unusedCatItems : catItems;
    correctItem = pickRandom(pool);
  }

  const distractorCount = diff === 'easy' ? 2 : diff === 'intermediate' ? 3 : 4;
  // For difficult, include some from same-ish categories for trickier picks
  const otherItems = diff === 'difficult'
    ? ITEMS.filter(i => i.id !== correctItem.id)
    : ITEMS.filter(i => i.category !== category);
  const distractors = shuffleArray(otherItems).slice(0, distractorCount);
  const options = shuffleArray([correctItem, ...distractors]);
  return { category, correctItem, options };
}

// ─── Component ────────────────────────────────────────────

export const PictureIdentifyModule: React.FC<GameModuleProps> = React.memo(({ state, onSelectAnswer, onSetCorrectAnswer, difficulty }) => {
  const roundRef = useRef(state.round);
  const usedIdsRef = useRef<Set<string>>(new Set());
  const wrongQueueRef = useRef<PicItem[]>([]);

  const [question, setQuestion] = useState(() => {
    const q = generateQuestion(usedIdsRef.current, wrongQueueRef.current, difficulty);
    usedIdsRef.current.add(q.correctItem.id);
    return q;
  });

  // Set correct answer when engine is ready
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer(question.correctItem.id);
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track wrong answers
  useEffect(() => {
    if (state.status === 'roundEnd') {
      const wasWrong = state.selectedAnswer !== state.correctAnswer;
      if (wasWrong) {
        if (!wrongQueueRef.current.find(i => i.id === question.correctItem.id)) {
          wrongQueueRef.current.push(question.correctItem);
        }
      } else {
        wrongQueueRef.current = wrongQueueRef.current.filter(i => i.id !== question.correctItem.id);
      }
    }
  }, [state.status, state.selectedAnswer, state.correctAnswer, question]);

  // New round
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      const q = generateQuestion(usedIdsRef.current, wrongQueueRef.current, difficulty);
      usedIdsRef.current.add(q.correctItem.id);
      if (wrongQueueRef.current.length > 0 && wrongQueueRef.current[0].id === q.correctItem.id) {
        wrongQueueRef.current = wrongQueueRef.current.slice(1);
      }
      setQuestion(q);
      onSetCorrectAnswer(q.correctItem.id);
    }
  }, [state.round, onSetCorrectAnswer, difficulty]);

  // Session reset (FIX: also set correct answer to prevent first-question bug)
  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      usedIdsRef.current = new Set();
      wrongQueueRef.current = [];
      const q = generateQuestion(usedIdsRef.current, wrongQueueRef.current, difficulty);
      usedIdsRef.current.add(q.correctItem.id);
      setQuestion(q);
      onSetCorrectAnswer(q.correctItem.id);
      roundRef.current = 1;
    }
  }, [state.status, state.round, difficulty, onSetCorrectAnswer]);

  const isLocked = state.status !== 'playing';

  return (
    <>
      {/* Category prompt */}
      <motion.div
        className="mb-6"
        key={`${state.round}-${question.correctItem.id}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' }}
      >
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Find the</p>
        <motion.div
          className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xl px-6 py-2 rounded-2xl shadow-lg shadow-amber-500/20"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {question.category}
        </motion.div>
      </motion.div>

      {/* 2x2 Picture grid */}
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {question.options.map((item, i) => {
          const isSelected = state.selectedAnswer === item.id;
          const isCorrect = item.id === question.correctItem.id;
          const showResult = state.status === 'roundEnd' && isSelected;
          const isAnswer = state.status === 'roundEnd' && state.selectedAnswer !== state.correctAnswer && isCorrect;

          return (
            <motion.button
              key={item.id}
              onClick={() => !isLocked && onSelectAnswer(item.id)}
              disabled={isLocked}
              className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                showResult && isCorrect ? 'border-green-400 bg-green-50/60 shadow-lg shadow-green-200/30'
                : showResult && !isCorrect ? 'border-red-300 bg-red-50/30'
                : isAnswer ? 'border-green-400 bg-green-50/40'
                : isLocked ? 'border-gray-100/30 bg-gray-50/30 opacity-50 cursor-not-allowed'
                : 'border-gray-100/40 bg-white/50 hover:border-amber-200/60 hover:bg-amber-50/20'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1, scale: 1,
                x: showResult && !isCorrect ? [0, -6, 6, -4, 4, 0] : 0,
              }}
              transition={showResult && !isCorrect ? { duration: 0.4 } : { delay: i * 0.08, type: 'spring', stiffness: 300 }}
              whileHover={!isLocked ? { scale: 1.06, y: -3 } : {}}
              whileTap={!isLocked ? { scale: 0.94 } : {}}
            >
              <span className="text-5xl mb-2">{item.emoji}</span>
              <span className="text-xs font-bold text-gray-500">{item.name}</span>
              {showResult && isCorrect && (
                <motion.span className="absolute top-1.5 right-2 text-lg" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>✅</motion.span>
              )}
              {showResult && !isCorrect && (
                <motion.span className="absolute top-1.5 right-2 text-lg" initial={{ scale: 0 }} animate={{ scale: 1 }}>❌</motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </>
  );
});
PictureIdentifyModule.displayName = 'PictureIdentifyModule';
