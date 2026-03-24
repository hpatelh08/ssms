/**
 * 🔢 Count Objects – Bonus game
 * ================================
 * Show a group of emoji objects → "How many?" → pick correct number.
 * 5 rounds, counts 1-15, shared engine.
 */

import React, { useReducer, useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfettiEffect } from '../../ui/ConfettiEffect';
import { logAction } from '../../../utils/auditLog';
import {
  gameReducer, createInitialState, shuffleArray, pickRandom,
  XP_PER_CORRECT, XP_BONUS_COMPLETE,
} from '../shared/useGameReducer';
import { GameHeader, GameOverScreen, FeedbackOverlay, XPFly } from '../shared/GameUI';

// ─── Object Data ──────────────────────────────────────────

const COUNT_EMOJIS = ['🍎', '⭐', '🌸', '🐟', '🦋', '🎈', '🍀', '🐝', '🌺', '🍊'];

// ─── Question Generator ──────────────────────────────────

interface CountQuestion {
  emoji: string;
  count: number;
  options: number[];
  objectName: string;
}

const EMOJI_NAMES: Record<string, string> = {
  '🍎': 'apples', '⭐': 'stars', '🌸': 'flowers', '🐟': 'fish',
  '🦋': 'butterflies', '🎈': 'balloons', '🍀': 'clovers', '🐝': 'bees',
  '🌺': 'flowers', '🍊': 'oranges',
};

function generateQuestion(prevCount?: number): CountQuestion {
  const availCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const count = pickRandom(prevCount !== undefined ? availCounts.filter(c => c !== prevCount) : availCounts);
  const emoji = pickRandom(COUNT_EMOJIS);
  const objectName = EMOJI_NAMES[emoji] || 'items';
  
  // Generate 3 distractors close to the real count
  const distractorPool = availCounts.filter(n => n !== count);
  // Prefer numbers near the correct count
  distractorPool.sort((a, b) => Math.abs(a - count) - Math.abs(b - count));
  const distractors = distractorPool.slice(0, 3);
  const options = shuffleArray([count, ...distractors]);
  
  return { emoji, count, options, objectName };
}

// ─── Props ────────────────────────────────────────────────

interface CountObjectsProps {
  onExit: () => void;
  onWin: (xp: number) => void;
  onNextGame?: () => void;
}

// ─── Component ────────────────────────────────────────────

export const CountObjects: React.FC<CountObjectsProps> = React.memo(({ onExit, onWin, onNextGame }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastCountRef = useRef<number | undefined>();

  const firstQ = useMemo(() => generateQuestion(), []);
  const [question, setQuestion] = useState(firstQ);
  const [state, dispatch] = useReducer(gameReducer, createInitialState(String(firstQ.count)));
  const [xpFly, setXpFly] = useState(false);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  useEffect(() => {
    if (!state.feedback) return;
    if (state.feedback === 'correct') {
      setXpFly(true);
      setTimeout(() => setXpFly(false), 1200);
    }
    timerRef.current = setTimeout(() => {
      const nextRound = state.currentRound + 1;
      if (nextRound > state.totalRounds) {
        dispatch({ type: 'GAME_COMPLETE' });
        onWin(state.xpEarned + XP_BONUS_COMPLETE);
        logAction('game_complete', 'game', { game: 'CountObjects', score: state.score });
      } else {
        const q = generateQuestion(lastCountRef.current);
        lastCountRef.current = q.count;
        setQuestion(q);
        dispatch({ type: 'NEXT_ROUND', correctAnswer: String(q.count) });
      }
    }, state.feedback === 'correct' ? 1500 : 1100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state.feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((num: number) => {
    if (state.inputDisabled) return;
    dispatch({ type: 'SELECT_ANSWER', answer: String(num), correct: String(question.count) });
    logAction(num === question.count ? 'count_correct' : 'count_wrong', 'game', {
      count: question.count, selected: num,
    });
  }, [state.inputDisabled, question.count]);

  const handlePlayAgain = useCallback(() => {
    const q = generateQuestion();
    lastCountRef.current = undefined;
    setQuestion(q);
    dispatch({ type: 'PLAY_AGAIN', correctAnswer: String(q.count) });
  }, []);

  if (state.gameStatus === 'completed') {
    return (
      <div className="max-w-md mx-auto">
        <ConfettiEffect trigger={true} />
        <GameOverScreen
          score={state.score} totalRounds={state.totalRounds} xpEarned={state.xpEarned}
          startTime={state.startTime} onPlayAgain={handlePlayAgain} onExit={onExit}
          onNextGame={onNextGame} gameTitle="Count Objects" gameIcon="🔢"
        />
      </div>
    );
  }

  // Create layout for objects
  const emojiArray = Array.from({ length: question.count }, (_, i) => i);

  return (
    <>
      <ConfettiEffect trigger={state.confetti} />
      <XPFly show={xpFly} amount={XP_PER_CORRECT} />

      <div className="bg-white/75 backdrop-blur-2xl border border-white/40 p-8 sm:p-10 rounded-[24px] text-center max-w-md mx-auto relative overflow-hidden shadow-xl">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full opacity-10 blur-3xl pointer-events-none" />

        <GameHeader title="Count Objects" icon="🔢" onExit={onExit}
          round={state.currentRound} totalRounds={state.totalRounds} score={state.score} />

        {/* Objects display area */}
        <motion.div
          className="mb-6"
          key={state.currentRound}
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
            const showResult = !!state.feedback && isSelected;
            const isAnswer = state.feedback === 'wrong' && isCorrect;

            return (
              <motion.button
                key={num}
                onClick={() => handleSelect(num)}
                disabled={state.inputDisabled}
                className={`py-4 rounded-2xl border-2 font-black text-2xl transition-all ${
                  showResult && isCorrect
                    ? 'border-green-400 bg-green-50/60 text-green-600 shadow-lg'
                    : showResult && !isCorrect
                    ? 'border-red-300 bg-red-50/30 text-red-400'
                    : isAnswer
                    ? 'border-green-400 bg-green-50/40 text-green-600'
                    : state.inputDisabled
                    ? 'border-gray-100/30 bg-gray-50/30 opacity-50 cursor-not-allowed text-gray-400'
                    : 'border-gray-100/40 bg-white/50 text-blue-900 hover:border-rose-200/60 hover:bg-rose-50/20'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1, y: 0,
                  x: showResult && !isCorrect ? [0, -6, 6, -4, 4, 0] : 0,
                }}
                transition={showResult && !isCorrect
                  ? { duration: 0.4 }
                  : { delay: i * 0.06, type: 'spring', stiffness: 300 }
                }
                whileHover={!state.inputDisabled ? { scale: 1.1, y: -2 } : {}}
                whileTap={!state.inputDisabled ? { scale: 0.9 } : {}}
              >
                {num}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {state.feedback && (
            <FeedbackOverlay type={state.feedback} correctAnswer={`There are ${question.count} ${question.objectName}`} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

CountObjects.displayName = 'CountObjects';
