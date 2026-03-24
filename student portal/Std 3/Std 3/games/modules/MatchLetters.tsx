/**
 * 🔡 Match Letters Module
 * =========================
 * Match uppercase to lowercase letters (A→a, B→b).
 * 4 pairs per round, two-tap matching.
 * When all 4 matched → engine round completes.
 * - No repeated letter sets within a session
 * - Sets with wrong attempts re-queued for learning
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameModuleProps, shuffleArray } from '../types';

// ─── Data ─────────────────────────────────────────────────

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ─── Question Generator ──────────────────────────────────

interface MatchQuestion {
  upperOrder: string[];
  lowerOrder: string[];
  key: string; // sorted letters as dedup key
}

function generateQuestion(usedKeys: Set<string>, wrongQueue: MatchQuestion[], diff: 'easy' | 'intermediate' | 'difficult' = 'easy'): MatchQuestion {
  if (wrongQueue.length > 0) return wrongQueue[0];

  const pairCount = diff === 'easy' ? 3 : diff === 'intermediate' ? 4 : 5;

  for (let i = 0; i < 30; i++) {
    const selected = shuffleArray([...ALL_LETTERS]).slice(0, pairCount);
    const key = [...selected].sort().join('');
    if (!usedKeys.has(key)) {
      return {
        upperOrder: shuffleArray(selected),
        lowerOrder: shuffleArray(selected.map(l => l.toLowerCase())),
        key,
      };
    }
  }
  // Fallback (>14k combos so unlikely)
  const selected = shuffleArray([...ALL_LETTERS]).slice(0, pairCount);
  return {
    upperOrder: shuffleArray(selected),
    lowerOrder: shuffleArray(selected.map(l => l.toLowerCase())),
    key: [...selected].sort().join(''),
  };
}

// ─── Component ────────────────────────────────────────────

export const MatchLettersModule: React.FC<GameModuleProps> = React.memo(({ state, onSelectAnswer, onSetCorrectAnswer, difficulty }) => {
  const roundRef = useRef(state.round);
  const usedKeysRef = useRef<Set<string>>(new Set());
  const wrongQueueRef = useRef<MatchQuestion[]>([]);
  const hadWrongAttemptRef = useRef(false);

  const [question, setQuestion] = useState(() => {
    const q = generateQuestion(usedKeysRef.current, wrongQueueRef.current, difficulty);
    usedKeysRef.current.add(q.key);
    return q;
  });

  // Matching state (within a round)
  const [selectedUpper, setSelectedUpper] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);

  // Set correct answer when engine is ready
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer('complete');
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track wrong letter sets on roundEnd
  useEffect(() => {
    if (state.status === 'roundEnd') {
      if (hadWrongAttemptRef.current) {
        if (!wrongQueueRef.current.find(q => q.key === question.key)) {
          wrongQueueRef.current.push(question);
        }
      } else {
        wrongQueueRef.current = wrongQueueRef.current.filter(q => q.key !== question.key);
      }
    }
  }, [state.status, question]);

  // Generate new question on round change
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      const q = generateQuestion(usedKeysRef.current, wrongQueueRef.current, difficulty);
      usedKeysRef.current.add(q.key);
      if (wrongQueueRef.current.length > 0 && wrongQueueRef.current[0].key === q.key) {
        wrongQueueRef.current = wrongQueueRef.current.slice(1);
      }
      setQuestion(q);
      setSelectedUpper(null);
      setMatched(new Set());
      setWrongPair(null);
      hadWrongAttemptRef.current = false;
      onSetCorrectAnswer('complete');
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
      setSelectedUpper(null);
      setMatched(new Set());
      setWrongPair(null);
      hadWrongAttemptRef.current = false;
      onSetCorrectAnswer('complete');
      roundRef.current = 1;
    }
  }, [state.status, state.round, difficulty, onSetCorrectAnswer]);

  const pairCount = difficulty === 'easy' ? 3 : difficulty === 'intermediate' ? 4 : 5;

  // When all pairs matched → notify engine
  useEffect(() => {
    if (matched.size === pairCount && state.status === 'playing') {
      onSelectAnswer('complete');
    }
  }, [matched.size, state.status, onSelectAnswer, pairCount]);

  const isLocked = state.status !== 'playing';

  const handleUpperClick = useCallback((letter: string) => {
    if (isLocked || matched.has(letter)) return;
    setSelectedUpper(letter);
    setWrongPair(null);
  }, [isLocked, matched]);

  const handleLowerClick = useCallback((lower: string) => {
    if (isLocked || !selectedUpper || matched.has(selectedUpper)) return;

    const expectedLower = selectedUpper.toLowerCase();
    if (lower === expectedLower) {
      setMatched(prev => new Set([...prev, selectedUpper]));
      setSelectedUpper(null);
      setWrongPair(null);
    } else {
      hadWrongAttemptRef.current = true;
      setWrongPair([selectedUpper, lower]);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedUpper(null);
      }, 600);
    }
  }, [isLocked, selectedUpper, matched]);

  return (
    <>
      <motion.p
        className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5"
        key={`${state.round}-${question.key}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Tap an uppercase letter, then its lowercase match!
      </motion.p>

      {/* Match counter */}
      <div className="flex justify-center gap-2 mb-5">
        {Array.from({ length: pairCount }, (_, i) => (
          <motion.div
            key={i}
            className={`w-8 h-2 rounded-full ${i < matched.size ? 'bg-green-400' : 'bg-gray-200/60'}`}
            animate={i === matched.size ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ))}
        <span className="text-[10px] font-bold text-gray-400 ml-1">{matched.size}/{pairCount}</span>
      </div>

      {/* Uppercase row */}
      <div className="mb-4">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Uppercase</p>
        <div className="flex justify-center gap-3">
          {question.upperOrder.map((letter) => {
            const isMatched = matched.has(letter);
            const isSelected = selectedUpper === letter;
            const isWrong = wrongPair?.[0] === letter;

            return (
              <motion.button
                key={letter}
                onClick={() => handleUpperClick(letter)}
                disabled={isMatched || isLocked}
                className={`w-14 h-14 rounded-2xl border-2 font-black text-2xl transition-all ${
                  isMatched ? 'border-green-300 bg-green-50/60 text-green-400 opacity-60'
                  : isSelected ? 'border-amber-400 bg-amber-50/60 text-amber-600 shadow-lg shadow-amber-200/30'
                  : isWrong ? 'border-red-300 bg-red-50/30 text-red-400'
                  : 'border-gray-200/60 bg-white/60 text-gray-800 hover:border-amber-200/60'
                }`}
                animate={isWrong ? { x: [0, -4, 4, -2, 2, 0] } : {}}
                transition={{ duration: 0.3 }}
                whileHover={!isMatched ? { scale: 1.08, y: -2 } : {}}
                whileTap={!isMatched ? { scale: 0.95 } : {}}
              >
                {letter}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Lowercase row */}
      <div>
        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Lowercase</p>
        <div className="flex justify-center gap-3">
          {question.lowerOrder.map((lower) => {
            const upper = lower.toUpperCase();
            const isMatched = matched.has(upper);
            const isWrong = wrongPair?.[1] === lower;

            return (
              <motion.button
                key={lower}
                onClick={() => handleLowerClick(lower)}
                disabled={isMatched || isLocked || !selectedUpper}
                className={`w-14 h-14 rounded-2xl border-2 font-black text-2xl transition-all ${
                  isMatched ? 'border-green-300 bg-green-50/60 text-green-400 opacity-60'
                  : isWrong ? 'border-red-300 bg-red-50/30 text-red-400'
                  : !selectedUpper ? 'border-gray-200/40 bg-gray-50/30 text-gray-400 cursor-not-allowed opacity-50'
                  : 'border-gray-200/60 bg-white/60 text-gray-700 hover:border-rose-200/60'
                }`}
                animate={isWrong ? { x: [0, -4, 4, -2, 2, 0] } : {}}
                transition={{ duration: 0.3 }}
                whileHover={selectedUpper && !isMatched ? { scale: 1.08, y: -2 } : {}}
                whileTap={selectedUpper && !isMatched ? { scale: 0.95 } : {}}
              >
                {lower}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selection indicator */}
      <AnimatePresence>
        {selectedUpper && state.status === 'playing' && (
          <motion.p
            className="text-sm text-amber-500 font-bold mt-4"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Now tap the lowercase <span className="text-rose-500">"{selectedUpper.toLowerCase()}"</span>
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
});
MatchLettersModule.displayName = 'MatchLettersModule';
