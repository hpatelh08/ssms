/**
 * 🔢 Count Objects Module
 * =========================
 * Show group of emoji objects → "How many?" → pick correct number.
 * - No repeated emoji+count combos within a session
 * - Wrong combos re-queued for learning
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameModuleProps, shuffleArray, pickRandom } from '../types';

// ─── Data (expanded emojis) ──────────────────────────────

const COUNT_EMOJIS = ['🍎', '⭐', '🌸', '🐟', '🦋', '🎈', '🍀', '🐝', '🌺', '🍊', '🐱', '🚗', '🎵', '🌙', '🍒'];
const EMOJI_NAMES: Record<string, string> = {
  '🍎': 'apples', '⭐': 'stars', '🌸': 'flowers', '🐟': 'fish',
  '🦋': 'butterflies', '🎈': 'balloons', '🍀': 'clovers', '🐝': 'bees',
  '🌺': 'flowers', '🍊': 'oranges', '🐱': 'cats', '🚗': 'cars',
  '🎵': 'notes', '🌙': 'moons', '🍒': 'cherries',
};

// ─── Question Generator ──────────────────────────────────

interface CountQuestion { emoji: string; count: number; options: number[]; objectName: string; key: string; }

function generateQuestion(usedKeys: Set<string>, wrongQueue: CountQuestion[], diff: 'easy' | 'intermediate' | 'difficult' = 'easy'): CountQuestion {
  if (wrongQueue.length > 0) return wrongQueue[0];

  const minCount = diff === 'difficult' ? 10 : diff === 'intermediate' ? 3 : 1;
  const maxCount = diff === 'easy' ? 10 : diff === 'intermediate' ? 15 : 25;
  const availCounts = Array.from({ length: maxCount - minCount + 1 }, (_, i) => i + minCount);

  for (let i = 0; i < 30; i++) {
    const count = pickRandom(availCounts);
    const emoji = pickRandom(COUNT_EMOJIS);
    const key = `${emoji}-${count}`;
    if (!usedKeys.has(key)) {
      const objectName = EMOJI_NAMES[emoji] || 'items';
      const distractorPool = availCounts.filter(n => n !== count);
      distractorPool.sort((a, b) => Math.abs(a - count) - Math.abs(b - count));
      const distractors = distractorPool.slice(0, 3);
      const options = shuffleArray([count, ...distractors]);
      return { emoji, count, options, objectName, key };
    }
  }
  // Fallback
  const count = pickRandom(availCounts);
  const emoji = pickRandom(COUNT_EMOJIS);
  const objectName = EMOJI_NAMES[emoji] || 'items';
  const distractorPool = availCounts.filter(n => n !== count);
  distractorPool.sort((a, b) => Math.abs(a - count) - Math.abs(b - count));
  const distractors = distractorPool.slice(0, 3);
  const options = shuffleArray([count, ...distractors]);
  return { emoji, count, options, objectName, key: `${emoji}-${count}` };
}

// ─── Component ────────────────────────────────────────────

export const CountObjectsModule: React.FC<GameModuleProps> = React.memo(({ state, onSelectAnswer, onSetCorrectAnswer, difficulty }) => {
  const roundRef = useRef(state.round);
  const usedKeysRef = useRef<Set<string>>(new Set());
  const wrongQueueRef = useRef<CountQuestion[]>([]);

  const [question, setQuestion] = useState(() => {
    const q = generateQuestion(usedKeysRef.current, wrongQueueRef.current, difficulty);
    usedKeysRef.current.add(q.key);
    return q;
  });

  // Set correct answer when engine is ready
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer(String(question.count));
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track wrong answers
  useEffect(() => {
    if (state.status === 'roundEnd') {
      const wasWrong = state.isCorrect === false;
      if (wasWrong) {
        if (!wrongQueueRef.current.find(q => q.key === question.key)) {
          wrongQueueRef.current.push(question);
        }
      } else {
        wrongQueueRef.current = wrongQueueRef.current.filter(q => q.key !== question.key);
      }
    }
  }, [state.status, state.selectedAnswer, state.correctAnswer, question]);

  // New round
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      const q = generateQuestion(usedKeysRef.current, wrongQueueRef.current, difficulty);
      usedKeysRef.current.add(q.key);
      if (wrongQueueRef.current.length > 0 && wrongQueueRef.current[0].key === q.key) {
        wrongQueueRef.current = wrongQueueRef.current.slice(1);
      }
      setQuestion(q);
      onSetCorrectAnswer(String(q.count));
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
      onSetCorrectAnswer(String(q.count));
      roundRef.current = 1;
    }
  }, [state.status, state.round, difficulty, onSetCorrectAnswer]);

  const isLocked = state.status !== 'playing';
  const emojiArray = Array.from({ length: question.count }, (_, i) => i);

  return (
    <>
      {/* Objects display area */}
      <motion.div
        className="mb-6"
        key={`${state.round}-${question.key}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring' }}
      >
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          How many {question.objectName}?
        </p>
        <div className="inline-flex items-center justify-center flex-wrap gap-2 bg-white/80 rounded-3xl border-2 border-dashed border-rose-200/50 shadow-lg shadow-rose-100/20 p-6 min-h-[120px] max-w-[280px]">
          {emojiArray.map((_, i) => (
            <motion.span
              key={i}
              className="text-3xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 400 }}
            >
              {question.emoji}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Number options */}
      <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto">
        {question.options.map((num, i) => {
          const isSelected = state.selectedAnswer === String(num);
          const isCorrect = num === question.count;
          const showResult = state.status === 'roundEnd' && isSelected;
          const isAnswer = state.status === 'roundEnd' && state.isCorrect === false && isCorrect;

          return (
            <motion.button
              key={num}
              onClick={() => !isLocked && onSelectAnswer(String(num))}
              disabled={isLocked}
              className={`py-4 rounded-2xl border-2 font-black text-2xl transition-all ${
                showResult && isCorrect ? 'border-green-400 bg-green-50/60 text-green-600 shadow-lg'
                : showResult && !isCorrect ? 'border-red-300 bg-red-50/30 text-red-400'
                : isAnswer ? 'border-green-400 bg-green-50/40 text-green-600'
                : isLocked ? 'border-gray-100/30 bg-gray-50/30 opacity-50 cursor-not-allowed text-gray-400'
                : 'border-gray-100/40 bg-white/50 text-gray-800 hover:border-rose-200/60 hover:bg-rose-50/20'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1, y: 0,
                x: showResult && !isCorrect ? [0, -6, 6, -4, 4, 0] : 0,
              }}
              transition={showResult && !isCorrect ? { duration: 0.4 } : { delay: i * 0.06, type: 'spring', stiffness: 300 }}
              whileHover={!isLocked ? { scale: 1.1, y: -2 } : {}}
              whileTap={!isLocked ? { scale: 0.9 } : {}}
            >
              {num}
            </motion.button>
          );
        })}
      </div>
    </>
  );
});
CountObjectsModule.displayName = 'CountObjectsModule';
