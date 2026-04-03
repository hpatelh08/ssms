/**
 * 🔺 Shape Quest Module
 * =======================
 * Match shapes with progressive difficulty.
 * - Session dedup: no repeated target shapes within a game
 * - Wrong answers re-queued for learning reinforcement
 * - Color + rotation randomized per question
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameModuleProps, shuffleArray, pickRandom } from '../types';

// ─── Shape Definitions ───────────────────────────────────

interface ShapeDef {
  id: string;
  name: string;
  svg: (size: number, color: string) => React.ReactNode;
}

const SHAPES: ShapeDef[] = [
  { id: 'circle', name: 'Circle', svg: (s, c) => <svg width={s} height={s} viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill={c} stroke="white" strokeWidth="3" /></svg> },
  { id: 'square', name: 'Square', svg: (s, c) => <svg width={s} height={s} viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="4" fill={c} stroke="white" strokeWidth="3" /></svg> },
  { id: 'triangle', name: 'Triangle', svg: (s, c) => <svg width={s} height={s} viewBox="0 0 100 100"><polygon points="50,8 92,88 8,88" fill={c} stroke="white" strokeWidth="3" /></svg> },
  { id: 'diamond', name: 'Diamond', svg: (s, c) => <svg width={s} height={s} viewBox="0 0 100 100"><polygon points="50,5 95,50 50,95 5,50" fill={c} stroke="white" strokeWidth="3" /></svg> },
  { id: 'star', name: 'Star', svg: (s, c) => <svg width={s} height={s} viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,90 50,70 21,90 32,57 5,35 39,35" fill={c} stroke="white" strokeWidth="3" /></svg> },
  { id: 'hexagon', name: 'Hexagon', svg: (s, c) => <svg width={s} height={s} viewBox="0 0 100 100"><polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill={c} stroke="white" strokeWidth="3" /></svg> },
  { id: 'pentagon', name: 'Pentagon', svg: (s, c) => <svg width={s} height={s} viewBox="0 0 100 100"><polygon points="50,5 97,38 79,92 21,92 3,38" fill={c} stroke="white" strokeWidth="3" /></svg> },
  { id: 'oval', name: 'Oval', svg: (s, c) => <svg width={s} height={s} viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="44" ry="28" fill={c} stroke="white" strokeWidth="3" /></svg> },
  { id: 'arrow', name: 'Arrow', svg: (s, c) => <svg width={s} height={s} viewBox="0 0 100 100"><polygon points="50,5 90,50 70,50 70,95 30,95 30,50 10,50" fill={c} stroke="white" strokeWidth="3" /></svg> },
  { id: 'cross', name: 'Cross', svg: (s, c) => <svg width={s} height={s} viewBox="0 0 100 100"><polygon points="35,5 65,5 65,35 95,35 95,65 65,65 65,95 35,95 35,65 5,65 5,35 35,35" fill={c} stroke="white" strokeWidth="3" /></svg> },
];

const COLORS = ['#3b82f6', '#5f8b3d', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#ef4444', '#eab308'];

// ─── Question Generator ──────────────────────────────────

interface ShapeQuestion {
  target: ShapeDef;
  color: string;
  options: ShapeDef[];
  rotation: number;
}

function generateQuestion(round: number, usedIds: Set<string>, wrongQueue: ShapeDef[], diff: 'easy' | 'intermediate' | 'difficult' = 'easy'): ShapeQuestion {
  const fullPool = diff === 'easy' ? SHAPES.slice(0, 6) : SHAPES;

  let target: ShapeDef;
  if (wrongQueue.length > 0) {
    target = wrongQueue[0];
  } else {
    const unused = fullPool.filter(s => !usedIds.has(s.id));
    const pool = unused.length > 0 ? unused : fullPool;
    target = pool[Math.floor(Math.random() * pool.length)];
  }

  const color = pickRandom(COLORS);
  const optCount = diff === 'easy' ? 3 : diff === 'intermediate' ? 4 : 5;
  const distractors = shuffleArray(fullPool.filter(s => s.id !== target.id)).slice(0, optCount - 1);
  const options = shuffleArray([target, ...distractors]);
  const rotation = diff !== 'easy' ? [0, 45, 90, 135, 180][Math.floor(Math.random() * 5)] : 0;
  return { target, color, options, rotation };
}

// ─── Component ────────────────────────────────────────────

export const ShapeQuestModule: React.FC<GameModuleProps> = React.memo(({ state, onSelectAnswer, onSetCorrectAnswer, difficulty }) => {
  const roundRef = useRef(state.round);
  const usedIdsRef = useRef<Set<string>>(new Set());
  const wrongQueueRef = useRef<ShapeDef[]>([]);

  const [question, setQuestion] = useState<ShapeQuestion>(() => {
    const q = generateQuestion(1, usedIdsRef.current, wrongQueueRef.current, difficulty);
    usedIdsRef.current.add(q.target.id);
    return q;
  });

  // Set correct answer when engine is ready
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer(question.target.id);
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track wrong answers
  useEffect(() => {
    if (state.status === 'roundEnd') {
      const wasWrong = state.selectedAnswer !== state.correctAnswer;
      if (wasWrong) {
        if (!wrongQueueRef.current.find(s => s.id === question.target.id)) {
          wrongQueueRef.current.push(question.target);
        }
      } else {
        wrongQueueRef.current = wrongQueueRef.current.filter(s => s.id !== question.target.id);
      }
    }
  }, [state.status, state.selectedAnswer, state.correctAnswer, question.target]);

  // Generate new question on round change
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      const q = generateQuestion(state.round, usedIdsRef.current, wrongQueueRef.current, difficulty);
      usedIdsRef.current.add(q.target.id);
      if (wrongQueueRef.current.length > 0 && wrongQueueRef.current[0].id === q.target.id) {
        wrongQueueRef.current = wrongQueueRef.current.slice(1);
      }
      setQuestion(q);
      onSetCorrectAnswer(q.target.id);
    }
  }, [state.round, onSetCorrectAnswer, difficulty]);

  // Reset on new game session (FIX: also set correct answer to prevent first-question bug)
  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      usedIdsRef.current = new Set();
      wrongQueueRef.current = [];
      const q = generateQuestion(1, usedIdsRef.current, wrongQueueRef.current, difficulty);
      usedIdsRef.current.add(q.target.id);
      setQuestion(q);
      onSetCorrectAnswer(q.target.id);
      roundRef.current = 1;
    }
  }, [state.status, state.round, difficulty, onSetCorrectAnswer]);

  const isLocked = state.status !== 'playing';

  return (
    <>
      {/* Target shape display */}
      <motion.div
        className="mb-6"
        key={`${state.round}-${question.target.id}`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring' }}
      >
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Find this shape!</p>
        <div className="inline-flex items-center justify-center w-32 h-32 bg-white/80 rounded-3xl border-2 border-dashed border-cyan-200/50 shadow-lg shadow-cyan-100/20">
          <motion.div
            style={{ transform: `rotate(${question.rotation}deg)` }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {question.target.svg(80, question.color)}
          </motion.div>
        </div>
        <p className="text-lg font-bold text-gray-700 mt-2">{question.target.name}</p>
      </motion.div>

      {/* Shape options */}
      <div className="flex flex-wrap justify-center gap-3 max-w-sm mx-auto">
        {question.options.map((shape, i) => {
          const isSelected = state.selectedAnswer === shape.id;
          const isCorrect = shape.id === question.target.id;
          const showResult = state.status === 'roundEnd' && isSelected;
          const isAnswer = state.status === 'roundEnd' && state.selectedAnswer !== state.correctAnswer && isCorrect;

          return (
            <motion.button
              key={shape.id}
              onClick={() => !isLocked && onSelectAnswer(shape.id)}
              disabled={isLocked}
              className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all ${
                showResult && isCorrect ? 'border-green-400 bg-green-50/60 shadow-lg shadow-green-200/30'
                : showResult && !isCorrect ? 'border-red-300 bg-red-50/30'
                : isAnswer ? 'border-green-400 bg-green-50/40'
                : isLocked ? 'border-gray-100/30 bg-gray-50/30 opacity-50 cursor-not-allowed'
                : 'border-gray-100/40 bg-white/50 hover:border-cyan-200/60'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1, y: 0,
                x: showResult && !isCorrect ? [0, -6, 6, -4, 4, 0] : 0,
              }}
              transition={showResult && !isCorrect ? { duration: 0.4 } : { delay: i * 0.06, type: 'spring', stiffness: 300 }}
              whileHover={!isLocked ? { scale: 1.08, y: -3 } : {}}
              whileTap={!isLocked ? { scale: 0.94 } : {}}
            >
              {shape.svg(48, '#cbd5e1')}
            </motion.button>
          );
        })}
      </div>
    </>
  );
});
ShapeQuestModule.displayName = 'ShapeQuestModule';
