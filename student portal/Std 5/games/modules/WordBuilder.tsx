/**
 * 🔤 Word Builder Module + Hint System
 * ======================================
 * Fill in missing letters with picture clue.
 * HINT: After 2 wrong → auto-reveal. Manual 💡 button.
 * - No repeated words within a session
 * - Wrong words re-queued for learning
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameModuleProps, shuffleArray } from '../types';

// ─── Word Data (expanded pool) ───────────────────────────

interface WordDef { word: string; emoji: string; meaning: string; }

const WORDS: WordDef[] = [
  { word: 'APPLE', emoji: '🍎', meaning: 'A red fruit' },
  { word: 'BOOK', emoji: '📖', meaning: 'You read it' },
  { word: 'SCHOOL', emoji: '🏫', meaning: 'Where you learn' },
  { word: 'FRIEND', emoji: '🤝', meaning: 'Someone you like' },
  { word: 'WATER', emoji: '💧', meaning: 'You drink it' },
  { word: 'GARDEN', emoji: '🌻', meaning: 'Where flowers grow' },
  { word: 'BRIDGE', emoji: '🌉', meaning: 'It crosses a river' },
  { word: 'PLANET', emoji: '🪐', meaning: 'A body in space' },
  { word: 'KITCHEN', emoji: '🍳', meaning: 'Where food is cooked' },
  { word: 'ELEPHANT', emoji: '🐘', meaning: 'The biggest land animal' },
  { word: 'BASKET', emoji: '🧺', meaning: 'Used to carry things' },
  { word: 'WINDOW', emoji: '🪟', meaning: 'You look through it' },
  { word: 'MONKEY', emoji: '🐒', meaning: 'It swings on trees' },
  { word: 'BUTTER', emoji: '🧈', meaning: 'Spread on bread' },
  { word: 'PENCIL', emoji: '✏️', meaning: 'You write with it' },
  { word: 'RABBIT', emoji: '🐇', meaning: 'It hops around' },
  { word: 'FLOWER', emoji: '🌸', meaning: 'It blooms in spring' },
  { word: 'PICTURE', emoji: '🖼️', meaning: 'A drawing or photo' },
  { word: 'VILLAGE', emoji: '🏘️', meaning: 'A small town' },
  { word: 'BICYCLE', emoji: '🚲', meaning: 'You pedal to ride' },
  { word: 'MARKET', emoji: '🏪', meaning: 'Where you buy things' },
  { word: 'PARROT', emoji: '🦜', meaning: 'A colorful bird that talks' },
  { word: 'CANDLE', emoji: '🕯️', meaning: 'It gives light with flame' },
  { word: 'SPIDER', emoji: '🕷️', meaning: 'It spins a web' },
  { word: 'FOREST', emoji: '🌲', meaning: 'Full of many trees' },
  { word: 'ISLAND', emoji: '🏝️', meaning: 'Land surrounded by water' },
  { word: 'GUITAR', emoji: '🎸', meaning: 'A musical instrument' },
  { word: 'ROCKET', emoji: '🚀', meaning: 'It flies to space' },
  { word: 'UMBRELLA', emoji: '☂️', meaning: 'Protects you from rain' },
  { word: 'MOUNTAIN', emoji: '⛰️', meaning: 'Very tall land' },
  { word: 'RAINBOW', emoji: '🌈', meaning: 'Colorful arc in the sky' },
  { word: 'DIAMOND', emoji: '💎', meaning: 'A precious gem' },
  { word: 'DOLPHIN', emoji: '🐬', meaning: 'A smart sea animal' },
  { word: 'FEATHER', emoji: '🪶', meaning: 'Light covering of a bird' },
  { word: 'TRUMPET', emoji: '🎺', meaning: 'A brass instrument' },
];

// ─── Question Generator ──────────────────────────────────

interface WordQuestion {
  wordDef: WordDef;
  hiddenIndices: number[];
  display: string[];
}

function generateWordQuestion(usedWords: Set<string>, wrongQueue: WordDef[], diff: 'easy' | 'intermediate' | 'difficult' = 'easy'): WordQuestion {
  let wordDef: WordDef;
  if (wrongQueue.length > 0) {
    wordDef = wrongQueue[0];
  } else {
    const unused = WORDS.filter(w => !usedWords.has(w.word));
    const pool = unused.length > 0 ? unused : WORDS;
    wordDef = pool[Math.floor(Math.random() * pool.length)];
  }
  const word = wordDef.word;
  const indices = Array.from({ length: word.length }, (_, i) => i);
  const hideable = indices.filter(i => i > 0);
  const hideCount = diff === 'easy' ? 1 : diff === 'intermediate' ? Math.min(2, hideable.length) : Math.min(3, hideable.length);
  const hiddenIndices = shuffleArray(hideable).slice(0, hideCount);
  const display = word.split('').map((c, i) => hiddenIndices.includes(i) ? '_' : c);
  return { wordDef, hiddenIndices, display };
}

// ─── Component ────────────────────────────────────────────

export const WordBuilderModule: React.FC<GameModuleProps> = React.memo(({ state, onSelectAnswer, onSetCorrectAnswer, difficulty }) => {
  const roundRef = useRef(state.round);
  const usedWordsRef = useRef<Set<string>>(new Set());
  const wrongQueueRef = useRef<WordDef[]>([]);

  const [question, setQuestion] = useState(() => {
    const q = generateWordQuestion(usedWordsRef.current, wrongQueueRef.current, difficulty);
    usedWordsRef.current.add(q.wordDef.word);
    return q;
  });
  const [guess, setGuess] = useState('');
  const [wrongCount, setWrongCount] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintText, setHintText] = useState('');

  // Set correct answer when engine is ready
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer(question.wordDef.word);
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track wrong answers
  useEffect(() => {
    if (state.status === 'roundEnd') {
      const wasWrong = state.selectedAnswer !== state.correctAnswer;
      if (wasWrong) {
        if (!wrongQueueRef.current.find(w => w.word === question.wordDef.word)) {
          wrongQueueRef.current.push(question.wordDef);
        }
      } else {
        wrongQueueRef.current = wrongQueueRef.current.filter(w => w.word !== question.wordDef.word);
      }
    }
  }, [state.status, state.selectedAnswer, state.correctAnswer, question]);

  // New round
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      const q = generateWordQuestion(usedWordsRef.current, wrongQueueRef.current, difficulty);
      usedWordsRef.current.add(q.wordDef.word);
      if (wrongQueueRef.current.length > 0 && wrongQueueRef.current[0].word === q.wordDef.word) {
        wrongQueueRef.current = wrongQueueRef.current.slice(1);
      }
      setQuestion(q);
      setGuess('');
      setWrongCount(0);
      setHintUsed(false);
      setHintText('');
      onSetCorrectAnswer(q.wordDef.word);
    }
  }, [state.round, onSetCorrectAnswer, difficulty]);

  // Session reset (FIX: also set correct answer to prevent first-question bug)
  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      usedWordsRef.current = new Set();
      wrongQueueRef.current = [];
      const q = generateWordQuestion(usedWordsRef.current, wrongQueueRef.current, difficulty);
      usedWordsRef.current.add(q.wordDef.word);
      setQuestion(q);
      setGuess('');
      setWrongCount(0);
      setHintUsed(false);
      setHintText('');
      onSetCorrectAnswer(q.wordDef.word);
      roundRef.current = 1;
    }
  }, [state.status, state.round, difficulty, onSetCorrectAnswer]);

  const isLocked = state.status !== 'playing';

  const checkAnswer = useCallback(() => {
    if (isLocked || !guess) return;
    const correct = question.wordDef.word;
    const isRight = guess.toUpperCase() === correct;

    if (!isRight) {
      setWrongCount(prev => {
        const next = prev + 1;
        if (next >= 2 && !hintUsed) {
          setHintUsed(true);
          setHintText(`💡 Hint: It starts with "${correct[0]}" — ${question.wordDef.meaning}`);
        }
        return next;
      });
    }

    onSelectAnswer(guess.toUpperCase());
  }, [isLocked, guess, question, hintUsed, onSelectAnswer]);

  const showHint = useCallback(() => {
    if (hintUsed) return;
    setHintUsed(true);
    const word = question.wordDef.word;
    setHintText(`💡 ${question.wordDef.meaning} — starts with "${word[0]}"`);
  }, [hintUsed, question]);

  return (
    <>
      {/* Picture clue */}
      <motion.div
        className="mb-4"
        key={`${state.round}-${question.wordDef.word}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring' }}
      >
        <motion.span
          className="text-6xl inline-block"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {question.wordDef.emoji}
        </motion.span>
      </motion.div>

      {/* Hidden word display */}
      <motion.div
        className="text-3xl sm:text-4xl font-bold tracking-[0.3em] text-gray-800 mb-4 uppercase"
        key={`word-${state.round}-${question.wordDef.word}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.display.map((c, i) => (
          <motion.span
            key={i}
            className={c === '_' ? 'text-orange-300 border-b-4 border-orange-200 mx-0.5 inline-block min-w-[1ch]' : ''}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            {c}
          </motion.span>
        ))}
      </motion.div>

      <p className="text-gray-400 mb-3 text-xs">What word is this?</p>

      {/* Hint area */}
      <AnimatePresence>
        {hintText && (
          <motion.div
            className="bg-amber-50/80 border border-amber-200/40 rounded-2xl px-4 py-2 mb-4 text-sm text-amber-600 font-medium"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {hintText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input + hint button */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={guess}
          onChange={(e) => !isLocked && setGuess(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
          disabled={isLocked}
          className="flex-1 p-4 bg-orange-50/40 border-2 border-orange-100/50 rounded-2xl text-center text-2xl font-bold uppercase focus:border-orange-300 outline-none text-gray-800 disabled:opacity-50"
          placeholder="Type here..."
        />
        {!hintUsed && (
          <motion.button
            onClick={showHint}
            className="bg-amber-100/60 text-amber-500 px-4 rounded-2xl font-bold text-sm border border-amber-200/30 hover:bg-amber-100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Show hint"
          >
            💡
          </motion.button>
        )}
      </div>

      <motion.button
        onClick={checkAnswer}
        disabled={!guess || isLocked}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        Submit Word ✨
      </motion.button>

      {/* Wrong count indicator */}
      {wrongCount > 0 && state.status === 'playing' && (
        <p className="text-xs text-gray-400 mt-2">
          {wrongCount >= 2 ? '🤔 Check the hint above!' : `Attempts: ${wrongCount}`}
        </p>
      )}
    </>
  );
});
WordBuilderModule.displayName = 'WordBuilderModule';
