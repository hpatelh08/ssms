/**
 * 🎨 Color Match – Redesigned with shared engine
 * ================================================
 * Child matches an object to its correct color.
 * 5 rounds, 4 color options per round, XP rewards.
 * Uses shared useGameReducer — fixes stuck-at-2/5 bug.
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

// ─── Color & Object Definitions ──────────────────────────

interface ColorDef { id: string; name: string; hex: string; }
interface ObjectDef { id: string; name: string; emoji: string; correctColorId: string; }

const COLORS: ColorDef[] = [
  { id: 'red', name: 'Red', hex: '#ef4444' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6' },
  { id: 'green', name: 'Green', hex: '#22c55e' },
  { id: 'yellow', name: 'Yellow', hex: '#eab308' },
  { id: 'orange', name: 'Orange', hex: '#f97316' },
  { id: 'purple', name: 'Purple', hex: '#7aa344' },
  { id: 'pink', name: 'Pink', hex: '#ec4899' },
  { id: 'white', name: 'White', hex: '#f8fafc' },
  { id: 'brown', name: 'Brown', hex: '#92400e' },
];

const OBJECTS: ObjectDef[] = [
  { id: 'apple', name: 'Apple', emoji: '🍎', correctColorId: 'red' },
  { id: 'sky', name: 'Sky', emoji: '🌤️', correctColorId: 'blue' },
  { id: 'leaf', name: 'Leaf', emoji: '🍃', correctColorId: 'green' },
  { id: 'sun', name: 'Sun', emoji: '☀️', correctColorId: 'yellow' },
  { id: 'orange_fruit', name: 'Orange', emoji: '🍊', correctColorId: 'orange' },
  { id: 'grapes', name: 'Grapes', emoji: '🍇', correctColorId: 'purple' },
  { id: 'flower', name: 'Flower', emoji: '🌸', correctColorId: 'pink' },
  { id: 'cloud', name: 'Cloud', emoji: '☁️', correctColorId: 'white' },
  { id: 'tree', name: 'Tree', emoji: '🌳', correctColorId: 'green' },
  { id: 'fire', name: 'Fire', emoji: '🔥', correctColorId: 'orange' },
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', correctColorId: 'red' },
  { id: 'banana', name: 'Banana', emoji: '🍌', correctColorId: 'yellow' },
  { id: 'ocean', name: 'Ocean', emoji: '🌊', correctColorId: 'blue' },
  { id: 'chocolate', name: 'Chocolate', emoji: '🍫', correctColorId: 'brown' },
];

// ─── Question Generator ──────────────────────────────────

interface ColorQuestion {
  object: ObjectDef;
  correctColor: ColorDef;
  options: ColorDef[];
}

function generateQuestion(prevObjId?: string): ColorQuestion {
  const available = prevObjId ? OBJECTS.filter(o => o.id !== prevObjId) : OBJECTS;
  const obj = pickRandom(available);
  const correctColor = COLORS.find(c => c.id === obj.correctColorId)!;
  const distractors = shuffleArray(COLORS.filter(c => c.id !== correctColor.id)).slice(0, 3);
  const options = shuffleArray([correctColor, ...distractors]);
  return { object: obj, correctColor, options };
}

// ─── Props ────────────────────────────────────────────────

interface ColorMatchProps {
  onExit: () => void;
  onWin: (xp: number) => void;
  onNextGame?: () => void;
}

// ─── Component ────────────────────────────────────────────

export const ColorMatch: React.FC<ColorMatchProps> = React.memo(({ onExit, onWin, onNextGame }) => {
  const lastObjRef = useRef<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const firstQ = useMemo(() => generateQuestion(), []);
  const [question, setQuestion] = useState(firstQ);
  const [state, dispatch] = useReducer(gameReducer, createInitialState(firstQ.correctColor.id));
  const [xpFly, setXpFly] = useState(false);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // Feedback → advance
  useEffect(() => {
    if (!state.feedback) return;
    if (state.feedback === 'correct') {
      setXpFly(true);
      setTimeout(() => setXpFly(false), 1200);
      logAction('game_won', 'game', { game: 'color_match', object: question.object.id, round: state.currentRound });
    }
    timerRef.current = setTimeout(() => {
      const nextRound = state.currentRound + 1;
      if (nextRound > state.totalRounds) {
        dispatch({ type: 'GAME_COMPLETE' });
        onWin(state.xpEarned + XP_BONUS_COMPLETE);
        logAction('game_complete', 'game', { game: 'ColorMatch', score: state.score, xp: state.xpEarned + XP_BONUS_COMPLETE });
      } else {
        const q = generateQuestion(lastObjRef.current);
        lastObjRef.current = q.object.id;
        setQuestion(q);
        dispatch({ type: 'NEXT_ROUND', correctAnswer: q.correctColor.id });
      }
    }, state.feedback === 'correct' ? 1500 : 1100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state.feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((colorId: string) => {
    if (state.inputDisabled) return;
    dispatch({ type: 'SELECT_ANSWER', answer: colorId, correct: question.correctColor.id });
  }, [state.inputDisabled, question.correctColor.id]);

  const handlePlayAgain = useCallback(() => {
    const q = generateQuestion();
    lastObjRef.current = undefined;
    setQuestion(q);
    dispatch({ type: 'PLAY_AGAIN', correctAnswer: q.correctColor.id });
  }, []);

  // ─── Game Over ──────────────────────────────────────────
  if (state.gameStatus === 'completed') {
    return (
      <div className="max-w-md mx-auto">
        <ConfettiEffect trigger={true} />
        <GameOverScreen
          score={state.score} totalRounds={state.totalRounds} xpEarned={state.xpEarned}
          startTime={state.startTime} onPlayAgain={handlePlayAgain} onExit={onExit}
          onNextGame={onNextGame} gameTitle="Color Match" gameIcon="🎨"
        />
      </div>
    );
  }

  // ─── Playing ────────────────────────────────────────────
  return (
    <>
      <ConfettiEffect trigger={state.confetti} />
      <XPFly show={xpFly} amount={XP_PER_CORRECT} />

      <div className="bg-white/75 backdrop-blur-2xl border border-white/40 p-8 sm:p-10 rounded-[24px] text-center max-w-md mx-auto relative overflow-hidden shadow-xl">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-pink-400 to-lime-500 rounded-full opacity-10 blur-3xl pointer-events-none" />

        <GameHeader title="Color Match" icon="🎨" onExit={onExit}
          round={state.currentRound} totalRounds={state.totalRounds} score={state.score} />

        {/* Object display */}
        <motion.div
          className="mb-6"
          key={state.currentRound}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">What color is this?</p>
          <div className="inline-flex items-center justify-center w-32 h-32 bg-white/80 rounded-3xl border-2 border-dashed border-pink-200/50 shadow-lg shadow-pink-100/20">
            <motion.span className="text-7xl" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              {question.object.emoji}
            </motion.span>
          </div>
          <p className="text-lg font-bold text-blue-800 mt-2">{question.object.name}</p>
        </motion.div>

        {/* Color option buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5 max-w-sm mx-auto">
          {question.options.map((color, i) => {
            const isSelected = state.selectedAnswer === color.id;
            const isCorrect = color.id === question.correctColor.id;
            const showResult = !!state.feedback && isSelected;
            const isAnswer = state.feedback === 'wrong' && isCorrect;

            return (
              <motion.button
                key={color.id}
                onClick={() => handleSelect(color.id)}
                disabled={state.inputDisabled}
                className={`relative px-4 py-5 rounded-2xl border-2 font-bold text-sm transition-all ${
                  showResult && isCorrect
                    ? 'border-green-400 ring-4 ring-green-200/50'
                    : showResult && !isCorrect
                    ? 'border-red-300'
                    : isAnswer
                    ? 'border-green-400 ring-2 ring-green-200/40'
                    : state.inputDisabled
                    ? 'border-gray-100/30 bg-gray-50/30 opacity-60 cursor-not-allowed'
                    : 'border-gray-100/30 bg-white/50 hover:border-pink-200/60'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1, y: 0,
                  x: showResult && !isCorrect ? [0, -6, 6, -4, 4, 0] : 0,
                  scale: showResult && isCorrect ? [1, 1.08, 1] : 1,
                }}
                transition={showResult && !isCorrect
                  ? { duration: 0.4 }
                  : { delay: i * 0.06, type: 'spring', stiffness: 300 }
                }
                whileHover={!state.inputDisabled ? { scale: 1.04 } : {}}
                whileTap={!state.inputDisabled ? { scale: 0.94 } : {}}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl shadow-inner border border-white/40"
                    style={{ backgroundColor: color.hex }}
                    animate={showResult && isCorrect ? {
                      boxShadow: ['0 0 0 0 transparent', `0 0 20px 5px ${color.hex}60`, '0 0 0 0 transparent'],
                    } : {}}
                    transition={{ duration: 0.8, repeat: showResult && isCorrect ? Infinity : 0 }}
                  />
                  <span className={`${showResult && isCorrect ? 'text-green-600' : showResult && !isCorrect ? 'text-red-400' : 'text-gray-600'}`}>
                    {color.name}
                  </span>
                </div>
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

        {/* Feedback overlay */}
        <AnimatePresence>
          {state.feedback && (
            <FeedbackOverlay
              type={state.feedback}
              correctAnswer={`${question.object.name} is ${question.correctColor.name}`}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

ColorMatch.displayName = 'ColorMatch';
