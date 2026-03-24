/**
 * 🖼️ Guess The Word – NEW game
 * ================================
 * Show a picture (emoji) → pick the correct word from 4 options.
 * 5 rounds, shared engine, XP rewards.
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

// ─── Word Data ────────────────────────────────────────────

interface PicWord {
  id: string;
  word: string;
  emoji: string;
}

const PIC_WORDS: PicWord[] = [
  { id: 'apple', word: 'APPLE', emoji: '🍎' },
  { id: 'banana', word: 'BANANA', emoji: '🍌' },
  { id: 'cat', word: 'CAT', emoji: '🐱' },
  { id: 'dog', word: 'DOG', emoji: '🐕' },
  { id: 'elephant', word: 'ELEPHANT', emoji: '🐘' },
  { id: 'fish', word: 'FISH', emoji: '🐟' },
  { id: 'grapes', word: 'GRAPES', emoji: '🍇' },
  { id: 'house', word: 'HOUSE', emoji: '🏠' },
  { id: 'ice_cream', word: 'ICE CREAM', emoji: '🍦' },
  { id: 'juice', word: 'JUICE', emoji: '🧃' },
  { id: 'kite', word: 'KITE', emoji: '🪁' },
  { id: 'lion', word: 'LION', emoji: '🦁' },
  { id: 'monkey', word: 'MONKEY', emoji: '🐒' },
  { id: 'nest', word: 'NEST', emoji: '🪹' },
  { id: 'orange', word: 'ORANGE', emoji: '🍊' },
  { id: 'penguin', word: 'PENGUIN', emoji: '🐧' },
  { id: 'rainbow', word: 'RAINBOW', emoji: '🌈' },
  { id: 'star', word: 'STAR', emoji: '⭐' },
  { id: 'train', word: 'TRAIN', emoji: '🚂' },
  { id: 'umbrella', word: 'UMBRELLA', emoji: '☂️' },
];

// ─── Question Generator ──────────────────────────────────

interface GuessTWQuestion {
  target: PicWord;
  options: string[];
}

function generateQuestion(prevId?: string): GuessTWQuestion {
  const pool = prevId ? PIC_WORDS.filter(p => p.id !== prevId) : PIC_WORDS;
  const target = pickRandom(pool);
  const distractors = shuffleArray(PIC_WORDS.filter(p => p.id !== target.id))
    .slice(0, 3)
    .map(p => p.word);
  const options = shuffleArray([target.word, ...distractors]);
  return { target, options };
}

// ─── Props ────────────────────────────────────────────────

interface GuessTheWordProps {
  onExit: () => void;
  onWin: (xp: number) => void;
  onNextGame?: () => void;
}

// ─── Component ────────────────────────────────────────────

export const GuessTheWord: React.FC<GuessTheWordProps> = React.memo(({ onExit, onWin, onNextGame }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastIdRef = useRef<string | undefined>();

  const firstQ = useMemo(() => generateQuestion(), []);
  const [question, setQuestion] = useState(firstQ);
  const [state, dispatch] = useReducer(gameReducer, createInitialState(firstQ.target.word));
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
        logAction('game_complete', 'game', { game: 'GuessTheWord', score: state.score });
      } else {
        const q = generateQuestion(lastIdRef.current);
        lastIdRef.current = q.target.id;
        setQuestion(q);
        dispatch({ type: 'NEXT_ROUND', correctAnswer: q.target.word });
      }
    }, state.feedback === 'correct' ? 1500 : 1100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state.feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((word: string) => {
    if (state.inputDisabled) return;
    dispatch({ type: 'SELECT_ANSWER', answer: word, correct: question.target.word });
    logAction(word === question.target.word ? 'guess_correct' : 'guess_wrong', 'game', { target: question.target.word, selected: word });
  }, [state.inputDisabled, question.target.word]);

  const handlePlayAgain = useCallback(() => {
    const q = generateQuestion();
    lastIdRef.current = undefined;
    setQuestion(q);
    dispatch({ type: 'PLAY_AGAIN', correctAnswer: q.target.word });
  }, []);

  if (state.gameStatus === 'completed') {
    return (
      <div className="max-w-md mx-auto">
        <ConfettiEffect trigger={true} />
        <GameOverScreen
          score={state.score} totalRounds={state.totalRounds} xpEarned={state.xpEarned}
          startTime={state.startTime} onPlayAgain={handlePlayAgain} onExit={onExit}
          onNextGame={onNextGame} gameTitle="Guess The Word" gameIcon="🖼️"
        />
      </div>
    );
  }

  return (
    <>
      <ConfettiEffect trigger={state.confetti} />
      <XPFly show={xpFly} amount={XP_PER_CORRECT} />

      <div className="bg-white/75 backdrop-blur-2xl border border-white/40 p-8 sm:p-10 rounded-[24px] text-center max-w-md mx-auto relative overflow-hidden shadow-xl">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-green-400 to-teal-500 rounded-full opacity-10 blur-3xl pointer-events-none" />

        <GameHeader title="Guess The Word" icon="🖼️" onExit={onExit}
          round={state.currentRound} totalRounds={state.totalRounds} score={state.score} results={state.roundResults} />

        {/* Picture display */}
        <motion.div
          className="mb-6"
          key={state.currentRound}
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">What is this?</p>
          <div className="inline-flex items-center justify-center w-36 h-36 bg-white/80 rounded-3xl border-2 border-dashed border-green-200/50 shadow-lg shadow-green-100/20">
            <motion.span
              className="text-8xl"
              animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {question.target.emoji}
            </motion.span>
          </div>
        </motion.div>

        {/* Word options */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {question.options.map((word, i) => {
            const isSelected = state.selectedAnswer === word;
            const isCorrect = word === question.target.word;
            const showResult = !!state.feedback && isSelected;
            const isAnswer = state.feedback === 'wrong' && isCorrect;

            return (
              <motion.button
                key={word}
                onClick={() => handleSelect(word)}
                disabled={state.inputDisabled}
                className={`py-4 px-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                  showResult && isCorrect
                    ? 'border-green-400 bg-green-50/60 text-green-600 shadow-lg shadow-green-200/30'
                    : showResult && !isCorrect
                    ? 'border-red-300 bg-red-50/30 text-red-400'
                    : isAnswer
                    ? 'border-green-400 bg-green-50/40 text-green-600'
                    : state.inputDisabled
                    ? 'border-gray-100/30 bg-gray-50/30 opacity-50 cursor-not-allowed text-gray-400'
                    : 'border-gray-100/40 bg-white/50 text-blue-900 hover:border-green-200/60 hover:bg-green-50/20'
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
                whileHover={!state.inputDisabled ? { scale: 1.04, y: -2 } : {}}
                whileTap={!state.inputDisabled ? { scale: 0.94 } : {}}
              >
                {word}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {state.feedback && (
            <FeedbackOverlay type={state.feedback} correctAnswer={question.target.word} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

GuessTheWord.displayName = 'GuessTheWord';
