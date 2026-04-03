/**
 * 🔍 Picture Identify – NEW game
 * =================================
 * Show 4 images → "Which one is a [category]?" → tap correct.
 * 5 rounds, shared engine, age-appropriate categories.
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

// ─── Category Data ────────────────────────────────────────

interface PicItem {
  id: string;
  name: string;
  emoji: string;
  category: string;
}

const ITEMS: PicItem[] = [
  // Animals
  { id: 'cat', name: 'Cat', emoji: '🐱', category: 'Animal' },
  { id: 'dog', name: 'Dog', emoji: '🐕', category: 'Animal' },
  { id: 'fish', name: 'Fish', emoji: '🐟', category: 'Animal' },
  { id: 'bird', name: 'Bird', emoji: '🐦', category: 'Animal' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', category: 'Animal' },
  { id: 'elephant', name: 'Elephant', emoji: '🐘', category: 'Animal' },
  // Fruits
  { id: 'apple', name: 'Apple', emoji: '🍎', category: 'Fruit' },
  { id: 'banana', name: 'Banana', emoji: '🍌', category: 'Fruit' },
  { id: 'grapes', name: 'Grapes', emoji: '🍇', category: 'Fruit' },
  { id: 'orange', name: 'Orange', emoji: '🍊', category: 'Fruit' },
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', category: 'Fruit' },
  { id: 'watermelon', name: 'Watermelon', emoji: '🍉', category: 'Fruit' },
  // Vehicles
  { id: 'car', name: 'Car', emoji: '🚗', category: 'Vehicle' },
  { id: 'bus', name: 'Bus', emoji: '🚌', category: 'Vehicle' },
  { id: 'train', name: 'Train', emoji: '🚂', category: 'Vehicle' },
  { id: 'airplane', name: 'Airplane', emoji: '✈️', category: 'Vehicle' },
  { id: 'bicycle', name: 'Bicycle', emoji: '🚲', category: 'Vehicle' },
  { id: 'boat', name: 'Boat', emoji: '⛵', category: 'Vehicle' },
  // Nature
  { id: 'tree', name: 'Tree', emoji: '🌳', category: 'Nature' },
  { id: 'flower', name: 'Flower', emoji: '🌸', category: 'Nature' },
  { id: 'sun', name: 'Sun', emoji: '☀️', category: 'Nature' },
  { id: 'moon', name: 'Moon', emoji: '🌙', category: 'Nature' },
  { id: 'cloud', name: 'Cloud', emoji: '☁️', category: 'Nature' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', category: 'Nature' },
];

const CATEGORIES = ['Animal', 'Fruit', 'Vehicle', 'Nature'];

// ─── Question Generator ──────────────────────────────────

interface PicIdQuestion {
  category: string;
  correctItem: PicItem;
  options: PicItem[];
}

function generateQuestion(prevCategory?: string): PicIdQuestion {
  const availCategories = prevCategory ? CATEGORIES.filter(c => c !== prevCategory) : CATEGORIES;
  const category = pickRandom(availCategories);
  const categoryItems = ITEMS.filter(i => i.category === category);
  const correctItem = pickRandom(categoryItems);
  
  // Get 3 distractors from OTHER categories
  const otherItems = ITEMS.filter(i => i.category !== category);
  const distractors = shuffleArray(otherItems).slice(0, 3);
  const options = shuffleArray([correctItem, ...distractors]);
  
  return { category, correctItem, options };
}

// ─── Props ────────────────────────────────────────────────

interface PictureIdentifyProps {
  onExit: () => void;
  onWin: (xp: number) => void;
  onNextGame?: () => void;
}

// ─── Component ────────────────────────────────────────────

export const PictureIdentify: React.FC<PictureIdentifyProps> = React.memo(({ onExit, onWin, onNextGame }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastCatRef = useRef<string | undefined>();

  const firstQ = useMemo(() => generateQuestion(), []);
  const [question, setQuestion] = useState(firstQ);
  const [state, dispatch] = useReducer(gameReducer, createInitialState(firstQ.correctItem.id));
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
        logAction('game_complete', 'game', { game: 'PictureIdentify', score: state.score });
      } else {
        const q = generateQuestion(lastCatRef.current);
        lastCatRef.current = q.category;
        setQuestion(q);
        dispatch({ type: 'NEXT_ROUND', correctAnswer: q.correctItem.id });
      }
    }, state.feedback === 'correct' ? 1500 : 1100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state.feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((itemId: string) => {
    if (state.inputDisabled) return;
    dispatch({ type: 'SELECT_ANSWER', answer: itemId, correct: question.correctItem.id });
    logAction(itemId === question.correctItem.id ? 'pic_correct' : 'pic_wrong', 'game', {
      category: question.category, selected: itemId, correct: question.correctItem.id,
    });
  }, [state.inputDisabled, question]);

  const handlePlayAgain = useCallback(() => {
    const q = generateQuestion();
    lastCatRef.current = undefined;
    setQuestion(q);
    dispatch({ type: 'PLAY_AGAIN', correctAnswer: q.correctItem.id });
  }, []);

  if (state.gameStatus === 'completed') {
    return (
      <div className="max-w-md mx-auto">
        <ConfettiEffect trigger={true} />
        <GameOverScreen
          score={state.score} totalRounds={state.totalRounds} xpEarned={state.xpEarned}
          startTime={state.startTime} onPlayAgain={handlePlayAgain} onExit={onExit}
          onNextGame={onNextGame} gameTitle="Picture Identify" gameIcon="🔍"
        />
      </div>
    );
  }

  return (
    <>
      <ConfettiEffect trigger={state.confetti} />
      <XPFly show={xpFly} amount={XP_PER_CORRECT} />

      <div className="bg-white/75 backdrop-blur-2xl border border-white/40 p-8 sm:p-10 rounded-[24px] text-center max-w-md mx-auto relative overflow-hidden shadow-xl">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-emerald-400 to-lime-500 rounded-full opacity-10 blur-3xl pointer-events-none" />

        <GameHeader title="Picture Identify" icon="🔍" onExit={onExit}
          round={state.currentRound} totalRounds={state.totalRounds} score={state.score} />

        {/* Category prompt */}
        <motion.div
          className="mb-6"
          key={state.currentRound}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring' }}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Find the</p>
          <motion.div
            className="inline-block bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-black text-xl px-6 py-2 rounded-2xl shadow-lg shadow-emerald-500/20"
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
            const showResult = !!state.feedback && isSelected;
            const isAnswer = state.feedback === 'wrong' && isCorrect;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                disabled={state.inputDisabled}
                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                  showResult && isCorrect
                    ? 'border-green-400 bg-green-50/60 shadow-lg shadow-green-200/30'
                    : showResult && !isCorrect
                    ? 'border-red-300 bg-red-50/30'
                    : isAnswer
                    ? 'border-green-400 bg-green-50/40'
                    : state.inputDisabled
                    ? 'border-gray-100/30 bg-gray-50/30 opacity-50 cursor-not-allowed'
                    : 'border-gray-100/40 bg-white/50 hover:border-emerald-200/60 hover:bg-emerald-50/20'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1, scale: 1,
                  x: showResult && !isCorrect ? [0, -6, 6, -4, 4, 0] : 0,
                }}
                transition={showResult && !isCorrect
                  ? { duration: 0.4 }
                  : { delay: i * 0.08, type: 'spring', stiffness: 300 }
                }
                whileHover={!state.inputDisabled ? { scale: 1.06, y: -3 } : {}}
                whileTap={!state.inputDisabled ? { scale: 0.94 } : {}}
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

        <AnimatePresence>
          {state.feedback && (
            <FeedbackOverlay type={state.feedback} correctAnswer={`${question.correctItem.name} is a ${question.category}`} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

PictureIdentify.displayName = 'PictureIdentify';
