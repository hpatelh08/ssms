/**
 * 🎰 Multiplication Casino Module
 * =================================
 * Casino-style slot machine multiplication game for Standard 3.
 * - Spinning reels animation
 * - Multiplication tables (2x - 10x)
 * - Coin rewards and casino aesthetics
 * - Adaptive difficulty
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameModuleProps } from '../types';

// ─── Problem Generator ───────────────────────────────────

interface MultiProblem {
  a: number;
  b: number;
  answer: number;
  key: string;
}

function generateMultiProblem(
  usedKeys: Set<string>,
  wrongQueue: MultiProblem[],
  diff: 'easy' | 'intermediate' | 'difficult' = 'easy'
): MultiProblem {
  // Priority: replay wrong problems
  if (wrongQueue.length > 0) return wrongQueue[0];

  // Difficulty ranges for Std 3
  const maxMultiplier = diff === 'easy' ? 5 : diff === 'intermediate' ? 10 : 12;
  const minMultiplier = diff === 'easy' ? 2 : 2;

  // Generate unique problem (try up to 30 times)
  for (let i = 0; i < 30; i++) {
    const a = Math.floor(Math.random() * (maxMultiplier - minMultiplier + 1)) + minMultiplier;
    const b = Math.floor(Math.random() * (maxMultiplier - minMultiplier + 1)) + minMultiplier;
    const answer = a * b;
    const key = `${a}×${b}`;
    if (!usedKeys.has(key)) {
      return { a, b, answer, key };
    }
  }

  // Fallback
  const a = Math.floor(Math.random() * (maxMultiplier - minMultiplier + 1)) + minMultiplier;
  const b = Math.floor(Math.random() * (maxMultiplier - minMultiplier + 1)) + minMultiplier;
  return { a, b, answer: a * b, key: `${a}×${b}` };
}

// ─── Slot Reel Component ─────────────────────────────────

interface SlotReelProps {
  value: number;
  isSpinning: boolean;
  symbol: string;
}

const SlotReel: React.FC<SlotReelProps> = React.memo(({ value, isSpinning, symbol }) => {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (isSpinning) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 10));
      }, 50);
      return () => clearInterval(interval);
    } else {
      setDisplayValue(value);
    }
  }, [isSpinning, value]);

  return (
    <motion.div
      className="relative w-16 h-20 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-xl shadow-2xl border-2 border-yellow-400/30 overflow-hidden"
      animate={isSpinning ? { y: [0, -3, 0], scale: [1, 1.02, 1] } : {}}
      transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.15 }}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
      
      {/* Symbol or number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          key={displayValue}
          className="text-4xl font-black text-yellow-300 drop-shadow-lg"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          {symbol || displayValue}
        </motion.span>
      </div>

      {/* Glow border */}
      <div className="absolute inset-0 border-2 border-yellow-400/40 rounded-xl pointer-events-none" />
    </motion.div>
  );
});
SlotReel.displayName = 'SlotReel';

// ─── Coin Animation ───────────────────────────────────────

const CoinRain: React.FC<{ show: boolean }> = React.memo(({ show }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl"
          initial={{ 
            x: `${Math.random() * 100}%`, 
            y: -50, 
            rotate: 0,
            opacity: 1 
          }}
          animate={{ 
            y: '110vh', 
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            opacity: 0 
          }}
          transition={{ 
            duration: 1.5 + Math.random() * 0.5, 
            delay: i * 0.1,
            ease: 'easeIn' 
          }}
        >
          🪙
        </motion.div>
      ))}
    </div>
  );
});
CoinRain.displayName = 'CoinRain';

// ─── Main Component ───────────────────────────────────────

export const MultiplicationCasinoModule: React.FC<GameModuleProps> = React.memo(({
  state,
  onSelectAnswer,
  onSetCorrectAnswer,
  difficulty,
}) => {
  const roundRef = useRef(state.round);
  const usedKeysRef = useRef<Set<string>>(new Set());
  const wrongQueueRef = useRef<MultiProblem[]>([]);

  const [problem, setProblem] = useState<MultiProblem>(() => {
    const p = generateMultiProblem(usedKeysRef.current, wrongQueueRef.current, difficulty);
    usedKeysRef.current.add(p.key);
    return p;
  });
  const [input, setInput] = useState('');
  const [isSpinning, setIsSpinning] = useState(true);
  const [showCoins, setShowCoins] = useState(false);

  // Spin animation on new problem
  useEffect(() => {
    setIsSpinning(true);
    const timer = setTimeout(() => setIsSpinning(false), 1200);
    return () => clearTimeout(timer);
  }, [problem]);

  // Set correct answer when engine is ready
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer(String(problem.answer));
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track wrong answers
  useEffect(() => {
    if (state.status === 'roundEnd') {
      const wasCorrect = state.isCorrect === true;
      if (!wasCorrect) {
        if (!wrongQueueRef.current.find(p => p.key === problem.key)) {
          wrongQueueRef.current.push(problem);
        }
      } else {
        wrongQueueRef.current = wrongQueueRef.current.filter(p => p.key !== problem.key);
        setShowCoins(true);
        setTimeout(() => setShowCoins(false), 1500);
      }
    }
  }, [state.status, state.selectedAnswer, state.correctAnswer, problem]);

  // New round
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      const p = generateMultiProblem(usedKeysRef.current, wrongQueueRef.current, difficulty);
      usedKeysRef.current.add(p.key);
      if (wrongQueueRef.current.length > 0 && wrongQueueRef.current[0].key === p.key) {
        wrongQueueRef.current = wrongQueueRef.current.slice(1);
      }
      setProblem(p);
      setInput('');
      onSetCorrectAnswer(String(p.answer));
    }
  }, [state.round, onSetCorrectAnswer, difficulty]);

  // Reset on new game session
  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      usedKeysRef.current = new Set();
      wrongQueueRef.current = [];
      const p = generateMultiProblem(usedKeysRef.current, wrongQueueRef.current, difficulty);
      usedKeysRef.current.add(p.key);
      setProblem(p);
      setInput('');
      onSetCorrectAnswer(String(p.answer));
      roundRef.current = 1;
    }
  }, [state.status, state.round, difficulty, onSetCorrectAnswer]);

  const isLocked = state.status !== 'playing' || isSpinning;

  const handleNumberPress = useCallback((n: number) => {
    if (isLocked) return;
    setInput(prev => {
      const newVal = prev + n;
      return newVal.length <= 3 ? newVal : prev;
    });
  }, [isLocked]);

  const handleBackspace = useCallback(() => {
    if (isLocked) return;
    setInput(prev => prev.slice(0, -1));
  }, [isLocked]);

  const handleSubmit = useCallback(() => {
    if (isLocked || !input) return;
    onSelectAnswer(input);
  }, [isLocked, input, onSelectAnswer]);

  // Break answer into digits for reel display
  const answerDigits = String(problem.answer).split('').map(Number);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
      {/* Casino Header */}
      <motion.div
        className="mb-6"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <div className="flex items-center gap-3 bg-gradient-to-r from-purple-900 via-pink-900 to-red-900 px-6 py-3 rounded-full border-2 border-yellow-400/50 shadow-2xl">
          <span className="text-3xl">🎰</span>
          <span className="text-xl font-black text-yellow-300 tracking-wide drop-shadow-lg">
            MULTIPLY CASINO
          </span>
          <span className="text-3xl">🎰</span>
        </div>
      </motion.div>

      {/* Slot Machine Display */}
      <motion.div
        className="mb-8 bg-gradient-to-br from-gray-900 via-purple-950 to-indigo-950 p-8 rounded-3xl border-4 border-yellow-500/40 shadow-2xl relative overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, delay: 0.2 }}
      >
        {/* Decorative lights */}
        <div className="absolute top-2 left-0 right-0 flex justify-around px-4">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-yellow-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.125 }}
            />
          ))}
        </div>

        {/* Problem display with reels */}
        <div className="flex items-center justify-center gap-4">
          <SlotReel value={problem.a} isSpinning={isSpinning} symbol="" />
          <span className="text-5xl font-black text-yellow-400">×</span>
          <SlotReel value={problem.b} isSpinning={isSpinning} symbol="" />
          <span className="text-5xl font-black text-yellow-400">=</span>
          
          {/* Answer display */}
          <div className="flex gap-2">
            {input ? (
              input.split('').map((digit, i) => (
                <motion.div
                  key={`input-${i}`}
                  className="w-16 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-4xl font-black text-white shadow-2xl border-2 border-yellow-300"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {digit}
                </motion.div>
              ))
            ) : (
              <div className="w-16 h-20 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl flex items-center justify-center text-4xl font-black text-gray-400 shadow-2xl border-2 border-gray-600">
                ?
              </div>
            )}
          </div>
        </div>

        {/* Jackpot lights effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ 
            boxShadow: [
              '0 0 20px rgba(234, 179, 8, 0.2)',
              '0 0 40px rgba(234, 179, 8, 0.4)',
              '0 0 20px rgba(234, 179, 8, 0.2)',
            ] 
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Number Keypad (Casino Style) */}
      <div className="w-full max-w-sm">
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <motion.button
              key={n}
              onClick={() => handleNumberPress(n)}
              disabled={isLocked}
              className="h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-2xl font-black rounded-xl shadow-lg border-2 border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isLocked ? { scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' } : {}}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
            >
              {n}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <motion.button
            onClick={handleBackspace}
            disabled={isLocked}
            className="h-16 bg-gradient-to-br from-red-600 to-pink-600 text-white text-lg font-black rounded-xl shadow-lg border-2 border-red-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={!isLocked ? { scale: 1.05 } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
          >
            ←
          </motion.button>
          
          <motion.button
            onClick={() => handleNumberPress(0)}
            disabled={isLocked}
            className="h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-2xl font-black rounded-xl shadow-lg border-2 border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={!isLocked ? { scale: 1.05 } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
          >
            0
          </motion.button>

          <motion.button
            onClick={handleSubmit}
            disabled={isLocked || !input}
            className="h-16 bg-gradient-to-br from-green-600 to-emerald-600 text-white text-lg font-black rounded-xl shadow-lg border-2 border-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={!isLocked && input ? { scale: 1.05, boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' } : {}}
            whileTap={!isLocked && input ? { scale: 0.95 } : {}}
          >
            ✓
          </motion.button>
        </div>
      </div>

      {/* Coin Rain Effect */}
      <CoinRain show={showCoins} />

      {/* Spinning indicator */}
      <AnimatePresence>
        {isSpinning && (
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [1, 1.2, 1], rotate: 360 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            🎰
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

MultiplicationCasinoModule.displayName = 'MultiplicationCasinoModule';

export default MultiplicationCasinoModule;
