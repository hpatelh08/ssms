/**
 * 🔡 Match Letters – Bonus game
 * ================================
 * Match uppercase to lowercase letters (A→a, B→b).
 * Show 4 uppercase letters + 4 lowercase → tap matching pairs.
 * 5 rounds, 4 pairs per round, shared engine.
 */

import React, { useReducer, useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfettiEffect } from '../../ui/ConfettiEffect';
import { logAction } from '../../../utils/auditLog';
import {
  gameReducer, createInitialState, shuffleArray,
  XP_PER_CORRECT, XP_BONUS_COMPLETE,
} from '../shared/useGameReducer';
import { GameHeader, GameOverScreen, FeedbackOverlay, XPFly } from '../shared/GameUI';

// ─── Letter Data ──────────────────────────────────────────

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ─── Question Generator ──────────────────────────────────

interface LetterPair {
  upper: string;
  lower: string;
  matched: boolean;
}

interface MatchQuestion {
  pairs: LetterPair[];
  upperOrder: string[];
  lowerOrder: string[];
}

function generateQuestion(prevLetters?: string[]): MatchQuestion {
  const available = prevLetters
    ? ALL_LETTERS.filter(l => !prevLetters.includes(l))
    : ALL_LETTERS;
  const selected = shuffleArray(available).slice(0, 4);
  const pairs: LetterPair[] = selected.map(l => ({
    upper: l,
    lower: l.toLowerCase(),
    matched: false,
  }));
  const upperOrder = shuffleArray(selected);
  const lowerOrder = shuffleArray(selected.map(l => l.toLowerCase()));
  return { pairs, upperOrder, lowerOrder };
}

// ─── Props ────────────────────────────────────────────────

interface MatchLettersProps {
  onExit: () => void;
  onWin: (xp: number) => void;
  onNextGame?: () => void;
}

// ─── Component ────────────────────────────────────────────

export const MatchLetters: React.FC<MatchLettersProps> = React.memo(({ onExit, onWin, onNextGame }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const prevLettersRef = useRef<string[]>([]);

  const firstQ = useMemo(() => generateQuestion(), []);
  const [question, setQuestion] = useState(firstQ);
  const [state, dispatch] = useReducer(gameReducer, createInitialState('match'));
  const [xpFly, setXpFly] = useState(false);

  // Matching state (within a round)
  const [selectedUpper, setSelectedUpper] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [roundComplete, setRoundComplete] = useState(false);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // When all 4 pairs matched → score correct + advance
  useEffect(() => {
    if (matched.size === 4 && !roundComplete) {
      setRoundComplete(true);
      dispatch({ type: 'SELECT_ANSWER', answer: 'all_matched', correct: 'all_matched' });
      logAction('match_round_complete', 'game', { round: state.currentRound });
    }
  }, [matched.size, roundComplete, state.currentRound]);

  // Feedback → advance
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
        logAction('game_complete', 'game', { game: 'MatchLetters', score: state.score });
      } else {
        const q = generateQuestion(prevLettersRef.current);
        prevLettersRef.current = q.upperOrder;
        setQuestion(q);
        setSelectedUpper(null);
        setMatched(new Set());
        setWrongPair(null);
        setRoundComplete(false);
        dispatch({ type: 'NEXT_ROUND', correctAnswer: 'match' });
      }
    }, state.feedback === 'correct' ? 1500 : 1100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state.feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpperClick = useCallback((letter: string) => {
    if (state.inputDisabled || matched.has(letter)) return;
    setSelectedUpper(letter);
    setWrongPair(null);
  }, [state.inputDisabled, matched]);

  const handleLowerClick = useCallback((lower: string) => {
    if (state.inputDisabled || !selectedUpper || matched.has(selectedUpper)) return;
    
    const expectedLower = selectedUpper.toLowerCase();
    if (lower === expectedLower) {
      // Correct match
      setMatched(prev => new Set([...prev, selectedUpper]));
      setSelectedUpper(null);
      setWrongPair(null);
    } else {
      // Wrong match
      setWrongPair([selectedUpper, lower]);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedUpper(null);
      }, 600);
    }
  }, [state.inputDisabled, selectedUpper, matched]);

  const handlePlayAgain = useCallback(() => {
    const q = generateQuestion();
    prevLettersRef.current = [];
    setQuestion(q);
    setSelectedUpper(null);
    setMatched(new Set());
    setWrongPair(null);
    setRoundComplete(false);
    dispatch({ type: 'PLAY_AGAIN', correctAnswer: 'match' });
  }, []);

  if (state.gameStatus === 'completed') {
    return (
      <div className="max-w-md mx-auto">
        <ConfettiEffect trigger={true} />
        <GameOverScreen
          score={state.score} totalRounds={state.totalRounds} xpEarned={state.xpEarned}
          startTime={state.startTime} onPlayAgain={handlePlayAgain} onExit={onExit}
          onNextGame={onNextGame} gameTitle="Match Letters" gameIcon="🔡"
        />
      </div>
    );
  }

  return (
    <>
      <ConfettiEffect trigger={state.confetti} />
      <XPFly show={xpFly} amount={XP_PER_CORRECT} />

      <div className="bg-white/75 backdrop-blur-2xl border border-white/40 p-8 sm:p-10 rounded-[24px] text-center max-w-md mx-auto relative overflow-hidden shadow-xl">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full opacity-10 blur-3xl pointer-events-none" />

        <GameHeader title="Match Letters" icon="🔡" onExit={onExit}
          round={state.currentRound} totalRounds={state.totalRounds} score={state.score} />

        <motion.p
          className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5"
          key={state.currentRound}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Tap an uppercase letter, then its lowercase match!
        </motion.p>

        {/* Match counter */}
        <div className="flex justify-center gap-2 mb-5">
          {Array.from({ length: 4 }, (_, i) => (
            <motion.div
              key={i}
              className={`w-8 h-2 rounded-full ${i < matched.size ? 'bg-green-400' : 'bg-gray-200/60'}`}
              animate={i === matched.size ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ))}
          <span className="text-[10px] font-bold text-gray-400 ml-1">{matched.size}/4</span>
        </div>

        {/* Uppercase row */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Uppercase</p>
          <div className="flex justify-center gap-3">
            {question.upperOrder.map((letter) => {
              const isMatched = matched.has(letter);
              const isSelected = selectedUpper === letter;
              const isWrong = wrongPair?.[0] === letter;

              return (
                <motion.button
                  key={letter}
                  onClick={() => handleUpperClick(letter)}
                  disabled={isMatched || state.inputDisabled}
                  className={`w-14 h-14 rounded-2xl border-2 font-black text-2xl transition-all ${
                    isMatched
                      ? 'border-green-300 bg-green-50/60 text-green-400 opacity-60'
                      : isSelected
                      ? 'border-blue-400 bg-blue-50/60 text-blue-600 shadow-lg shadow-blue-200/30'
                      : isWrong
                      ? 'border-red-300 bg-red-50/30 text-red-400'
                      : 'border-gray-200/60 bg-white/60 text-blue-900 hover:border-blue-200/60'
                  }`}
                  animate={isWrong ? { x: [0, -4, 4, -2, 2, 0] } : {}}
                  transition={{ duration: 0.3 }}
                  whileHover={!isMatched ? { scale: 1.08, y: -2 } : {}}
                  whileTap={!isMatched ? { scale: 0.95 } : {}}
                >
                  {letter}
                  {isMatched && <motion.span className="absolute text-xs" initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Lowercase row */}
        <div>
          <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2">Lowercase</p>
          <div className="flex justify-center gap-3">
            {question.lowerOrder.map((lower) => {
              const upper = lower.toUpperCase();
              const isMatched = matched.has(upper);
              const isWrong = wrongPair?.[1] === lower;

              return (
                <motion.button
                  key={lower}
                  onClick={() => handleLowerClick(lower)}
                  disabled={isMatched || state.inputDisabled || !selectedUpper}
                  className={`w-14 h-14 rounded-2xl border-2 font-black text-2xl transition-all ${
                    isMatched
                      ? 'border-green-300 bg-green-50/60 text-green-400 opacity-60'
                      : isWrong
                      ? 'border-red-300 bg-red-50/30 text-red-400'
                      : !selectedUpper
                      ? 'border-gray-200/40 bg-gray-50/30 text-gray-400 cursor-not-allowed opacity-50'
                      : 'border-gray-200/60 bg-white/60 text-green-700 hover:border-green-200/60'
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
          {selectedUpper && !state.feedback && (
            <motion.p
              className="text-sm text-blue-500 font-bold mt-4"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Now tap the lowercase <span className="text-green-500">"{selectedUpper.toLowerCase()}"</span>
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state.feedback && (
            <FeedbackOverlay type={state.feedback} correctAnswer="All letters matched!" />
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

MatchLetters.displayName = 'MatchLetters';
