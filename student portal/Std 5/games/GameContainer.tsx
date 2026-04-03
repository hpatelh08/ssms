/**
 * 🎮 Game Container (Shared Chrome)
 * ====================================
 * Wraps any game module with:
 * - Unified game engine (single reducer)
 * - Glassmorphism card shell
 * - Game header with progress bar
 * - Feedback overlay (correct/wrong)
 * - Confetti on correct answers
 * - XP fly animation
 * - Game-over screen with stats
 * - Timer cleanup on unmount
 * - XP sync (once only on complete)
 *
 * Modules render ONLY their question content.
 * All state management lives here.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine } from './useGameEngine';
import { syncXP } from './xpIntegration';
import { GAME_CONFIGS, GameModuleProps, Difficulty } from './types';
import { logAction } from '../utils/auditLog';
import { ConfettiEffect } from '../components/ui/ConfettiEffect';
import { GameHeader, GameOverScreen, FeedbackOverlay, XPFly } from '../components/Games/shared/GameUI';

// ─── Module imports ───────────────────────────────────────

import { ShapeQuestModule } from './modules/ShapeQuest';
import { MathPuzzleModule } from './modules/MathPuzzle';
import { WordBuilderModule } from './modules/WordBuilder';
import { GuessTheWordModule } from './modules/GuessTheWord';
import { PictureIdentifyModule } from './modules/PictureIdentify';
import { CountObjectsModule } from './modules/CountObjects';
import { MatchLettersModule } from './modules/MatchLetters';
import { NumberTapModule } from './modules/NumberTapModule';
import { NumberAfterModule } from './modules/NumberAfter';
import { NumberBeforeModule } from './modules/NumberBefore';
import { LetterAfterModule } from './modules/LetterAfter';
import { LetterBeforeModule } from './modules/LetterBefore';

const MODULE_MAP: Record<string, React.ComponentType<GameModuleProps>> = {
  shapeQuest: ShapeQuestModule,
  numberTap: NumberTapModule,
  mathPuzzle: MathPuzzleModule,
  wordBuilder: WordBuilderModule,
  guessTheWord: GuessTheWordModule,
  pictureIdentify: PictureIdentifyModule,
  countObjects: CountObjectsModule,
  matchLetters: MatchLettersModule,
  numberAfter: NumberAfterModule,
  numberBefore: NumberBeforeModule,
  letterAfter: LetterAfterModule,
  letterBefore: LetterBeforeModule,
};

// ─── Props ────────────────────────────────────────────────

interface GameContainerProps {
  gameId: string;
  difficulty?: Difficulty;
  onExit: () => void;
  onGameWin: (xp: number) => void;
  onNextGame?: () => void;
  onMiniLevelComplete?: (score: number, total: number, xp: number) => void;
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
  onClickSound?: () => void;
}

// ─── Component ────────────────────────────────────────────

export const GameContainer: React.FC<GameContainerProps> = ({ gameId, difficulty: diffProp = 'easy' as Difficulty, onExit, onGameWin, onNextGame, onMiniLevelComplete, onCorrectAnswer, onWrongAnswer, onClickSound }) => {
  const {
    state,
    startGame,
    setCorrectAnswer,
    selectAnswer,
    nextRound,
    resetGame,
  } = useGameEngine();

  const [xpFly, setXpFly] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const xpSyncedRef = useRef(false);

  const config = GAME_CONFIGS.find(g => g.id === gameId);
  const ModuleComponent = MODULE_MAP[gameId];

  // ─── Start game on mount, cleanup on unmount ────────────
  useEffect(() => {
    startGame(gameId, diffProp, 5);
    xpSyncedRef.current = false;
    logAction('game_started', 'game', { game: gameId, difficulty: diffProp });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      resetGame();
    };
  }, [gameId, diffProp, startGame, resetGame]);

  // ─── Handle feedback timing → advance to next round ────
  useEffect(() => {
    if (state.status !== 'roundEnd') return;

    const isCorrect = state.selectedAnswer === state.correctAnswer;

    // 🔊 Sound FIRST — before any visual state change
    if (isCorrect) {
      onCorrectAnswer?.();
      setShowConfetti(true);
      setXpFly(true);
      const clearTimer = setTimeout(() => {
        setShowConfetti(false);
        setXpFly(false);
      }, 1200);
      // Cleanup inner timer
      return () => clearTimeout(clearTimer);
    } else {
      onWrongAnswer?.();
    }
  }, [state.status, state.selectedAnswer, state.correctAnswer, onCorrectAnswer, onWrongAnswer]);

  // Separate effect for round advancement to avoid cleanup conflicts
  useEffect(() => {
    if (state.status !== 'roundEnd') return;

    const isCorrect = state.selectedAnswer === state.correctAnswer;
    const delay = isCorrect ? 1500 : 1100;

    timerRef.current = setTimeout(() => {
      nextRound();
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.status, state.selectedAnswer, state.correctAnswer, nextRound]);

  // ─── XP sync on complete (ONCE only) ───────────────────
  useEffect(() => {
    if (state.status === 'complete' && !xpSyncedRef.current) {
      xpSyncedRef.current = true;

      // If shell manages mini-level flow, delegate up instead of syncing XP directly
      if (onMiniLevelComplete) {
        onMiniLevelComplete(state.score, state.totalRounds, state.xpEarned);
      } else {
        syncXP(gameId, state.xpEarned, onGameWin);
      }

      logAction('game_complete', 'game', {
        game: gameId,
        difficulty: diffProp,
        score: state.score,
        xp: state.xpEarned,
        rounds: state.totalRounds,
      });
    }
  }, [state.status, state.xpEarned, state.score, gameId, diffProp, onGameWin, onMiniLevelComplete, state.totalRounds]);

  // ─── Play Again handler ────────────────────────────────
  const handlePlayAgain = useCallback(() => {
    xpSyncedRef.current = false;
    startGame(gameId, diffProp, 5);
  }, [gameId, diffProp, startGame]);

  // ─── Wrap selectAnswer with click sound ─────────────────
  const handleSelectWithClick = useCallback((answer: string) => {
    onClickSound?.();   // 🔊 click sound FIRST, before state change
    selectAnswer(answer);
  }, [selectAnswer, onClickSound]);

  // ─── Module props (stable callbacks) ───────────────────
  const moduleProps: GameModuleProps = {
    state,
    onSelectAnswer: handleSelectWithClick,
    onSetCorrectAnswer: setCorrectAnswer,
    difficulty: diffProp,
  };

  // ─── Guard: missing config or module ────────────────────
  if (!config || !ModuleComponent) return null;

  // ─── Game Over Screen (skip if shell manages flow) ─────
  if (state.status === 'complete' && !onMiniLevelComplete) {
    return (
      <div className="max-w-md mx-auto">
        <ConfettiEffect trigger={true} />
        <GameOverScreen
          score={state.score}
          totalRounds={state.totalRounds}
          xpEarned={state.xpEarned}
          startTime={state.startTime}
          onPlayAgain={handlePlayAgain}
          onExit={onExit}
          onNextGame={onNextGame}
          gameTitle={config.title}
          gameIcon={config.icon}
        />
      </div>
    );
  }

  // ─── Derive feedback type ──────────────────────────────
  const isCorrect = state.selectedAnswer === state.correctAnswer;
  const feedbackType = state.status === 'roundEnd'
    ? (isCorrect ? 'correct' as const : 'wrong' as const)
    : null;

  // ─── Playing / RoundEnd Render ─────────────────────────
  return (
    <>
      <ConfettiEffect trigger={showConfetti} />
      <XPFly show={xpFly} amount={20} />

      <div className="bg-white/75 backdrop-blur-2xl border border-white/40 p-8 sm:p-10 rounded-[24px] text-center max-w-md mx-auto relative overflow-hidden shadow-xl">
        {/* Background gradient blob (game-specific) */}
        <div className={`absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br ${config.gradient} rounded-full opacity-10 blur-3xl pointer-events-none`} />

        {/* Shared header with progress */}
        <GameHeader
          title={config.title}
          icon={config.icon}
          onExit={onExit}
          round={state.round}
          totalRounds={state.totalRounds}
          score={state.score}
        />

        {/* Game module renders question content */}
        <ModuleComponent {...moduleProps} />

        {/* Feedback overlay (centralized) */}
        <AnimatePresence>
          {feedbackType && (
            <FeedbackOverlay
              type={feedbackType}
              correctAnswer={
                feedbackType === 'wrong' && state.correctAnswer
                  ? state.correctAnswer
                  : undefined
              }
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
