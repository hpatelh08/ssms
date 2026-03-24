/**
 * � Shape Quest – Redesigned with shared engine
 * ================================================
 * Match shapes with progressive difficulty.
 * Level 1-2: 3 options, basic shapes
 * Level 3-4: 4 options + rotation
 * Level 5: 5 options + rotation + all shapes
 * Uses shared useGameReducer for state.
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

// ─── Shape Definitions ───────────────────────────────────

interface ShapeDef {
  id: string;
  name: string;
  svg: (size: number, color: string) => React.ReactNode;
}

const SHAPES: ShapeDef[] = [
  {
    id: 'circle', name: 'Circle',
    svg: (s, c) => (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill={c} stroke="white" strokeWidth="3" />
      </svg>
    ),
  },
  {
    id: 'square', name: 'Square',
    svg: (s, c) => (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <rect x="12" y="12" width="76" height="76" rx="4" fill={c} stroke="white" strokeWidth="3" />
      </svg>
    ),
  },
  {
    id: 'triangle', name: 'Triangle',
    svg: (s, c) => (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <polygon points="50,8 92,88 8,88" fill={c} stroke="white" strokeWidth="3" />
      </svg>
    ),
  },
  {
    id: 'diamond', name: 'Diamond',
    svg: (s, c) => (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <polygon points="50,5 95,50 50,95 5,50" fill={c} stroke="white" strokeWidth="3" />
      </svg>
    ),
  },
  {
    id: 'star', name: 'Star',
    svg: (s, c) => (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <polygon points="50,5 61,35 95,35 68,57 79,90 50,70 21,90 32,57 5,35 39,35" fill={c} stroke="white" strokeWidth="3" />
      </svg>
    ),
  },
  {
    id: 'hexagon', name: 'Hexagon',
    svg: (s, c) => (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill={c} stroke="white" strokeWidth="3" />
      </svg>
    ),
  },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4'];

// ─── Question Generator ──────────────────────────────────

interface ShapeQuestion {
  target: ShapeDef;
  color: string;
  options: ShapeDef[];
  rotation: number;
}

function getLevel(round: number): number {
  if (round <= 2) return 1;
  if (round <= 4) return 2;
  return 3;
}

function generateQuestion(round: number, lastId?: string): ShapeQuestion {
  const level = getLevel(round);
  const pool = level <= 1 ? SHAPES.slice(0, 4) : SHAPES;
  const target = pickRandom(pool, pool.find(s => s.id === lastId));
  const color = pickRandom(COLORS);
  const optCount = level <= 1 ? 3 : level === 2 ? 4 : 5;
  const distractors = shuffleArray(pool.filter(s => s.id !== target.id)).slice(0, optCount - 1);
  const options = shuffleArray([target, ...distractors]);
  const rotation = level >= 2 ? [0, 45, 90, 135, 180][Math.floor(Math.random() * 5)] : 0;
  return { target, color, options, rotation };
}

// ─── Props ────────────────────────────────────────────────

interface ShapeQuestProps {
  onExit: () => void;
  onWin: (xp: number) => void;
  onNextGame?: () => void;
}

// ─── Component ────────────────────────────────────────────

export const ShapeQuest: React.FC<ShapeQuestProps> = React.memo(({ onExit, onWin, onNextGame }) => {
  const lastShapeRef = useRef<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const firstQ = useMemo(() => generateQuestion(1), []);
  const [question, setQuestion] = useState(firstQ);
  const [state, dispatch] = useReducer(gameReducer, createInitialState(firstQ.target.id));
  const [xpFly, setXpFly] = useState(false);

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // Handle feedback → advance
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
        logAction('game_complete', 'game', { game: 'ShapeQuest', score: state.score, xp: state.xpEarned + XP_BONUS_COMPLETE });
      } else {
        const q = generateQuestion(nextRound, lastShapeRef.current);
        lastShapeRef.current = q.target.id;
        setQuestion(q);
        dispatch({ type: 'NEXT_ROUND', correctAnswer: q.target.id });
      }
    }, state.feedback === 'correct' ? 1500 : 1100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state.feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((shapeId: string) => {
    if (state.inputDisabled) return;
    dispatch({ type: 'SELECT_ANSWER', answer: shapeId, correct: question.target.id });
    logAction(shapeId === question.target.id ? 'shape_correct' : 'shape_wrong', 'game', { shape: question.target.name });
  }, [state.inputDisabled, question.target.id, question.target.name]);

  const handlePlayAgain = useCallback(() => {
    const q = generateQuestion(1);
    lastShapeRef.current = undefined;
    setQuestion(q);
    dispatch({ type: 'PLAY_AGAIN', correctAnswer: q.target.id });
  }, []);

  // ─── Game Over ──────────────────────────────────────────
  if (state.gameStatus === 'completed') {
    return (
      <div className="max-w-md mx-auto">
        <ConfettiEffect trigger={true} />
        <GameOverScreen
          score={state.score} totalRounds={state.totalRounds} xpEarned={state.xpEarned}
          startTime={state.startTime} onPlayAgain={handlePlayAgain} onExit={onExit}
          onNextGame={onNextGame} gameTitle="Shape Quest" gameIcon="🔺"
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
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-10 blur-3xl pointer-events-none" />

        <GameHeader title="Shape Quest" icon="🔺" onExit={onExit}
          round={state.currentRound} totalRounds={state.totalRounds} score={state.score} />

        {/* Target shape display */}
        <motion.div
          className="mb-6"
          key={state.currentRound}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring' }}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Find this shape</p>
          <div className="inline-flex items-center justify-center w-28 h-28 bg-white/80 rounded-3xl border-2 border-dashed border-cyan-200/50 shadow-lg shadow-cyan-100/20"
               style={{ transform: `rotate(${question.rotation}deg)` }}>
            {question.target.svg(80, question.color)}
          </div>
          <p className="text-lg font-bold text-blue-800 mt-2">{question.target.name}</p>
          {question.rotation > 0 && (
            <p className="text-[10px] text-gray-300 mt-0.5">Hint: shape may be rotated!</p>
          )}
        </motion.div>

        {/* Shape option buttons */}
        <div className={`grid ${question.options.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-3 mb-5 max-w-sm mx-auto`}>
          {question.options.map((shape, i) => {
            const isSelected = state.selectedAnswer === shape.id;
            const isCorrect = shape.id === question.target.id;
            const showResult = !!state.feedback && isSelected;

            return (
              <motion.button
                key={shape.id}
                onClick={() => handleSelect(shape.id)}
                disabled={state.inputDisabled}
                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-colors ${
                  showResult && isCorrect
                    ? 'border-green-400 bg-green-50/60 shadow-lg shadow-green-200/40'
                    : showResult && !isCorrect
                    ? 'border-red-300 bg-red-50/30'
                    : state.feedback && isCorrect
                    ? 'border-green-400 bg-green-50/40'
                    : 'border-gray-100/40 bg-white/50 hover:border-cyan-200/60 hover:bg-cyan-50/30'
                } ${state.inputDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{
                  opacity: 1, y: 0, scale: 1,
                  x: showResult && !isCorrect ? [0, -8, 8, -6, 6, 0] : 0,
                }}
                transition={showResult && !isCorrect
                  ? { duration: 0.4, ease: 'easeInOut' }
                  : { delay: i * 0.08, type: 'spring', stiffness: 300 }
                }
                whileHover={!state.inputDisabled ? { scale: 1.05 } : {}}
                whileTap={!state.inputDisabled ? { scale: 0.92 } : {}}
              >
                <div className="pointer-events-none">{shape.svg(64, '#94a3b8')}</div>
                <span className="text-[10px] font-bold text-gray-400 mt-1">{shape.name}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback overlay */}
        <AnimatePresence>
          {state.feedback && (
            <FeedbackOverlay type={state.feedback} correctAnswer={question.target.name} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

ShapeQuest.displayName = 'ShapeQuest';
