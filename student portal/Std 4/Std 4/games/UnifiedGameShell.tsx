/**
 * 🎮 Unified Game Shell
 * ======================
 * Wraps GameContainer with the full difficulty → mini-level → celebration flow.
 * Works identically for ALL 8 arcade games.
 *
 * Flow:
 *   selectDifficulty → playing (mini-level 1–5, each = 5 questions via GameContainer)
 *     → miniLevelCelebration → next mini-level → difficultyComplete → back to select
 *
 * Reuses subject components: DifficultySelector, MiniLevelTracker, CelebrationModal
 * Reuses progressStore for persistence (subject = 'arcade').
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Difficulty, DIFFICULTIES, DIFF_META, GAME_CONFIGS,
  XP_PER_DIFFICULTY, XP_MINI_BONUS, XP_DIFF_BONUS, XP_ALL_BONUS,
  QUESTIONS_PER_MINI_LEVEL, MINI_LEVELS_PER_DIFFICULTY,
} from './types';
import { GameContainer } from './GameContainer';
import { DifficultySelector } from './subjects/components/DifficultySelector';
import { MiniLevelTracker } from './subjects/components/MiniLevelTracker';
import { CelebrationModal } from './subjects/components/CelebrationModal';
import {
  getGameProgress, saveMiniLevelResult, saveDifficultyTime, allDifficultiesComplete,
} from './subjects/engine/progressStore';
import { DifficultyProgress } from './subjects/engine/types';
import { syncXP } from './xpIntegration';
import { logAction } from '../utils/auditLog';

// ─── Types ────────────────────────────────────────────────

type ShellPhase = 'selectDifficulty' | 'playing' | 'celebration' | 'difficultyComplete';

interface UnifiedGameShellProps {
  gameId: string;
  onExit: () => void;
  onGameWin: (xp: number) => void;
  onNextGame?: () => void;
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
  onClickSound?: () => void;
}

// ─── Component ────────────────────────────────────────────

export const UnifiedGameShell: React.FC<UnifiedGameShellProps> = ({
  gameId, onExit, onGameWin, onNextGame, onCorrectAnswer, onWrongAnswer, onClickSound,
}) => {
  const config = GAME_CONFIGS.find(g => g.id === gameId);

  // ─── State ──────────────────────────────────────────────
  const [phase, setPhase] = useState<ShellPhase>('selectDifficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [miniLevel, setMiniLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [sessionXP, setSessionXP] = useState(0);
  const [celebrationData, setCelebrationData] = useState({ score: 0, total: 0, xp: 0 });
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [isDiffComplete, setIsDiffComplete] = useState(false);
  const diffStartTime = useRef(Date.now());

  // Key to force GameContainer remount per mini-level
  const containerKey = `${gameId}-${difficulty}-${miniLevel}`;

  // ─── Progress (from progressStore) ──────────────────────
  // For arcade games: subject='arcade', chapter=gameId, gameType=gameId
  const SUBJECT = 'arcade';

  const loadProgress = useCallback(() => {
    return getGameProgress(SUBJECT, gameId, gameId);
  }, [gameId]);

  const [progress, setProgress] = useState(() => loadProgress());

  // Build progress record for DifficultySelector
  const difficultyProgress = useMemo<Record<Difficulty, DifficultyProgress>>(() => ({
    easy: progress.easy,
    intermediate: progress.intermediate,
    difficult: progress.difficult,
  }), [progress]);

  // ─── Select Difficulty ──────────────────────────────────
  const handleSelectDifficulty = useCallback((d: Difficulty) => {
    setDifficulty(d);

    // Determine first incomplete mini-level
    const dp = progress[d];
    let first = 1;
    for (let i = 1; i <= MINI_LEVELS_PER_DIFFICULTY; i++) {
      if (!dp.miniLevels[i]?.completed) { first = i; break; }
      if (i === MINI_LEVELS_PER_DIFFICULTY) first = MINI_LEVELS_PER_DIFFICULTY; // all done, replay last
    }

    const done = [];
    for (let i = 1; i <= MINI_LEVELS_PER_DIFFICULTY; i++) {
      if (dp.miniLevels[i]?.completed) done.push(i);
    }

    setMiniLevel(first);
    setCompletedLevels(done);
    setSessionXP(0);
    setNewBadge(null);
    setIsDiffComplete(false);
    diffStartTime.current = Date.now();
    setPhase('playing');

    logAction('difficulty_selected', 'game', { game: gameId, difficulty: d, startLevel: first });
  }, [progress, gameId]);

  // ─── Mini-Level Complete (called by GameContainer) ──────
  const handleMiniLevelComplete = useCallback((score: number, total: number, xp: number) => {
    // Add mini-level bonus
    const totalXP = xp + XP_MINI_BONUS;
    setSessionXP(prev => prev + totalXP);

    // Save to progress store
    const result = saveMiniLevelResult(SUBJECT, gameId, gameId, difficulty, miniLevel, score, total);
    setNewBadge(result.newBadge);

    // Update completed levels
    const newCompleted = [...completedLevels];
    if (!newCompleted.includes(miniLevel)) newCompleted.push(miniLevel);
    setCompletedLevels(newCompleted);

    // Check if all 5 levels are now done
    const allDone = newCompleted.length >= MINI_LEVELS_PER_DIFFICULTY;

    if (allDone) {
      // Difficulty complete!
      const timeTaken = Date.now() - diffStartTime.current;
      saveDifficultyTime(SUBJECT, gameId, gameId, difficulty, timeTaken);

      // Add difficulty bonus
      const diffBonus = XP_DIFF_BONUS;
      const allBonus = allDifficultiesComplete(SUBJECT, gameId, gameId) ? XP_ALL_BONUS : 0;
      const finalXP = totalXP + diffBonus + allBonus;

      setCelebrationData({ score, total: total, xp: finalXP });
      setIsDiffComplete(true);

      // Sync XP
      syncXP(gameId, sessionXP + finalXP, onGameWin);

      logAction('difficulty_complete', 'game', {
        game: gameId, difficulty, xp: sessionXP + finalXP, timeTaken,
      });
    } else {
      setCelebrationData({ score, total, xp: totalXP });
      setIsDiffComplete(false);
    }

    // Reload progress
    setProgress(getGameProgress(SUBJECT, gameId, gameId));
    setPhase('celebration');
  }, [gameId, difficulty, miniLevel, completedLevels, sessionXP, onGameWin]);

  // ─── Continue from celebration ──────────────────────────
  const handleCelebrationContinue = useCallback(() => {
    if (isDiffComplete) {
      // Go back to difficulty selector
      setProgress(getGameProgress(SUBJECT, gameId, gameId));
      setPhase('selectDifficulty');
    } else {
      // Advance to next mini-level
      setMiniLevel(prev => prev + 1);
      setPhase('playing');
    }
  }, [isDiffComplete, gameId]);

  // ─── Back button from playing → select ──────────────────
  const handleBackToSelect = useCallback(() => {
    // Sync any earned XP before going back
    if (sessionXP > 0) {
      syncXP(gameId, sessionXP, onGameWin);
    }
    setProgress(getGameProgress(SUBJECT, gameId, gameId));
    setPhase('selectDifficulty');
  }, [gameId, sessionXP, onGameWin]);

  // ─── Guard ──────────────────────────────────────────────
  if (!config) return null;

  const meta = DIFF_META[difficulty];

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {/* ── PHASE: SELECT DIFFICULTY ── */}
        {phase === 'selectDifficulty' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* Game header */}
            <div className="text-center mb-6">
              <motion.button
                onClick={onExit}
                className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-white/60 backdrop-blur-xl border border-white/40 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ←
              </motion.button>

              <motion.div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} text-3xl mb-3 shadow-lg`}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                {config.icon}
              </motion.div>
              <h2 className="text-xl font-black text-gray-800">{config.title}</h2>
              <p className="text-xs text-gray-400 mt-1">{config.desc}</p>
            </div>

            <DifficultySelector
              onSelect={handleSelectDifficulty}
              progress={difficultyProgress}
            />
          </motion.div>
        )}

        {/* ── PHASE: PLAYING ── */}
        {phase === 'playing' && (
          <motion.div
            key={containerKey}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* Mini-level tracker above game */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <motion.button
                  onClick={handleBackToSelect}
                  className="w-8 h-8 rounded-xl bg-white/60 backdrop-blur-xl border border-white/40 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ←
                </motion.button>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{meta.emoji}</span>
                  <span className="text-xs font-bold text-gray-500">{meta.label}</span>
                </div>
                <div className="w-8" /> {/* spacer */}
              </div>
              <MiniLevelTracker
                currentLevel={miniLevel}
                completedLevels={completedLevels}
                difficulty={difficulty}
              />
            </div>

            <GameContainer
              key={containerKey}
              gameId={gameId}
              difficulty={difficulty}
              onExit={handleBackToSelect}
              onGameWin={onGameWin}
              onMiniLevelComplete={handleMiniLevelComplete}
              onCorrectAnswer={onCorrectAnswer}
              onWrongAnswer={onWrongAnswer}
              onClickSound={onClickSound}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CELEBRATION MODAL (overlays) ── */}
      <CelebrationModal
        show={phase === 'celebration'}
        miniLevel={miniLevel}
        score={celebrationData.score}
        total={celebrationData.total}
        xpEarned={celebrationData.xp}
        difficulty={difficulty}
        isDifficultyComplete={isDiffComplete}
        newBadge={newBadge}
        onContinue={handleCelebrationContinue}
      />
    </div>
  );
};

export default UnifiedGameShell;
