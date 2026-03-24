/**
 * 🔤 Word Builder – Shared engine + Hint System
 * ================================================
 * Scrambled word with picture clue.
 * Fill in missing letters to complete the word.
 * HINT SYSTEM: After 2 wrong, auto-reveal first letter.
 * Manual hint: show meaning, highlight missing position.
 */

import React, { useReducer, useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfettiEffect } from '../../ui/ConfettiEffect';
import { logAction } from '../../../utils/auditLog';
import {
  gameReducer, createInitialState, shuffleArray, XP_PER_CORRECT, XP_BONUS_COMPLETE,
} from '../shared/useGameReducer';
import { GameHeader, GameOverScreen, FeedbackOverlay, XPFly } from '../shared/GameUI';

// ─── Word Data ────────────────────────────────────────────

interface WordDef {
  word: string;
  emoji: string;
  meaning: string;
}

const WORDS: WordDef[] = [
  { word: 'APPLE', emoji: '🍎', meaning: 'A red fruit' },
  { word: 'SCHOOL', emoji: '🏫', meaning: 'Where you learn' },
  { word: 'FRIEND', emoji: '🤝', meaning: 'Someone you like' },
  { word: 'GARDEN', emoji: '🌻', meaning: 'Where flowers grow' },
  { word: 'BRIDGE', emoji: '🌉', meaning: 'It crosses a river' },
  { word: 'PLANET', emoji: '🪐', meaning: 'A body in space' },
  { word: 'KITCHEN', emoji: '🍳', meaning: 'Where food is cooked' },
  { word: 'ELEPHANT', emoji: '🐘', meaning: 'The biggest land animal' },
  { word: 'BASKET', emoji: '🧺', meaning: 'Used to carry things' },
  { word: 'MONKEY', emoji: '🐒', meaning: 'It swings on trees' },
  { word: 'PENCIL', emoji: '✏️', meaning: 'You write with it' },
  { word: 'RABBIT', emoji: '🐇', meaning: 'It hops around' },
  { word: 'FLOWER', emoji: '🌸', meaning: 'It blooms in spring' },
  { word: 'VILLAGE', emoji: '🏘️', meaning: 'A small town' },
  { word: 'BICYCLE', emoji: '🚲', meaning: 'You pedal to ride' },
  { word: 'MARKET', emoji: '🏪', meaning: 'Where you buy things' },
  { word: 'PARROT', emoji: '🦜', meaning: 'A colorful bird that talks' },
  { word: 'FOREST', emoji: '🌲', meaning: 'Full of many trees' },
  { word: 'ISLAND', emoji: '🏝️', meaning: 'Land surrounded by water' },
  { word: 'ROCKET', emoji: '🚀', meaning: 'It flies to space' },
];

// ─── Question Generator ──────────────────────────────────

interface WordQuestion {
  wordDef: WordDef;
  hiddenIndices: number[];
  display: string[];  // array of chars or '_'
}

function generateWordQuestion(prevWord?: string): WordQuestion {
  const pool = prevWord ? WORDS.filter(w => w.word !== prevWord) : WORDS;
  const wordDef = pool[Math.floor(Math.random() * pool.length)];
  const word = wordDef.word;
  
  // Hide 1-2 letters based on word length
  const indices = Array.from({ length: word.length }, (_, i) => i);
  const hideable = indices.filter(i => i > 0); // never hide first letter initially
  const hideCount = word.length <= 3 ? 1 : 2;
  const hiddenIndices = shuffleArray(hideable).slice(0, hideCount);
  
  const display = word.split('').map((c, i) => hiddenIndices.includes(i) ? '_' : c);
  
  return { wordDef, hiddenIndices, display };
}

// ─── Props ────────────────────────────────────────────────

interface WordBuilderProps {
  onExit: () => void;
  onWin: (xp: number) => void;
  onNextGame?: () => void;
}

// ─── Component ────────────────────────────────────────────

export const WordBuilder: React.FC<WordBuilderProps> = React.memo(({ onExit, onWin, onNextGame }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const firstQ = useMemo(() => generateWordQuestion(), []);
  const [question, setQuestion] = useState(firstQ);
  const [guess, setGuess] = useState('');
  const [wrongCount, setWrongCount] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintText, setHintText] = useState('');
  const [state, dispatch] = useReducer(gameReducer, createInitialState(question.wordDef.word));
  const [xpFly, setXpFly] = useState(false);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

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
        logAction('game_complete', 'game', { game: 'WordBuilder', score: state.score });
      } else {
        const q = generateWordQuestion(question.wordDef.word);
        setQuestion(q);
        setGuess('');
        setWrongCount(0);
        setHintUsed(false);
        setHintText('');
        dispatch({ type: 'NEXT_ROUND', correctAnswer: q.wordDef.word });
      }
    }, state.feedback === 'correct' ? 1500 : 1100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state.feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAnswer = useCallback(() => {
    if (state.inputDisabled || !guess) return;
    const correct = question.wordDef.word;
    const isRight = guess.toUpperCase() === correct;
    
    if (!isRight) {
      setWrongCount(prev => {
        const next = prev + 1;
        // Auto-hint after 2 wrong
        if (next >= 2 && !hintUsed) {
          setHintUsed(true);
          setHintText(`💡 Hint: It starts with "${correct[0]}" — ${question.wordDef.meaning}`);
        }
        return next;
      });
    }
    
    dispatch({ type: 'SELECT_ANSWER', answer: guess.toUpperCase(), correct });
    logAction(isRight ? 'word_correct' : 'word_wrong', 'game', { word: correct, guess });
  }, [state.inputDisabled, guess, question, hintUsed]);

  const showHint = useCallback(() => {
    if (hintUsed) return;
    setHintUsed(true);
    const word = question.wordDef.word;
    setHintText(`💡 ${question.wordDef.meaning} — starts with "${word[0]}"`);
    logAction('hint_used', 'game', { game: 'WordBuilder', word });
  }, [hintUsed, question]);

  const handlePlayAgain = useCallback(() => {
    const q = generateWordQuestion();
    setQuestion(q);
    setGuess('');
    setWrongCount(0);
    setHintUsed(false);
    setHintText('');
    dispatch({ type: 'PLAY_AGAIN', correctAnswer: q.wordDef.word });
  }, []);

  // ─── Game Over ──────────────────────────────────────────
  if (state.gameStatus === 'completed') {
    return (
      <div className="max-w-md mx-auto">
        <ConfettiEffect trigger={true} />
        <GameOverScreen
          score={state.score} totalRounds={state.totalRounds} xpEarned={state.xpEarned}
          startTime={state.startTime} onPlayAgain={handlePlayAgain} onExit={onExit}
          onNextGame={onNextGame} gameTitle="Word Builder" gameIcon="🔤"
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
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full opacity-10 blur-3xl pointer-events-none" />

        <GameHeader title="Word Builder" icon="🔤" onExit={onExit}
          round={state.currentRound} totalRounds={state.totalRounds} score={state.score} results={state.roundResults} />

        {/* Picture clue */}
        <motion.div
          className="mb-4"
          key={state.currentRound}
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
          className="text-3xl sm:text-4xl font-bold tracking-[0.3em] text-blue-900 mb-4 uppercase"
          key={`word-${state.currentRound}`}
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

        <p className="text-blue-400 mb-3 text-xs">What word is this?</p>

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
            onChange={(e) => !state.inputDisabled && setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            disabled={state.inputDisabled}
            className="flex-1 p-4 bg-orange-50/40 border-2 border-orange-100/50 rounded-2xl text-center text-2xl font-bold uppercase focus:border-orange-300 outline-none text-blue-900 disabled:opacity-50"
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
          disabled={!guess || state.inputDisabled}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Submit Word ✨
        </motion.button>

        {/* Wrong count indicator */}
        {wrongCount > 0 && !state.feedback && (
          <p className="text-xs text-gray-400 mt-2">
            {wrongCount >= 2 ? '🤔 Check the hint above!' : `Attempts: ${wrongCount}`}
          </p>
        )}

        <AnimatePresence>
          {state.feedback && (
            <FeedbackOverlay type={state.feedback} correctAnswer={question.wordDef.word} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

WordBuilder.displayName = 'WordBuilder';
