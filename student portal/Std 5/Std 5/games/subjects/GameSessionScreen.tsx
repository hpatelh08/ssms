/**
 * GameSessionScreen – Full game session manager
 * ================================================
 * Manages 5 mini-levels of 5 questions each (25 total per difficulty).
 * Handles scoring, XP, retry pool, celebration, badge unlocks.
 *
 * Unified sound / celebration / XP feedback via callback props
 * that wire into the shared SoundProvider, CelebrationProvider,
 * MascotProvider & XPProvider from the parent tree.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Difficulty, Question, Subject, XP_PER_Q, XP_MINI_BONUS,
  XP_DIFF_BONUS, XP_ALL_BONUS, DIFF_META, GameTypeDef, ChapterDef,
} from './engine/types';
import { generateQuestions, validateAnswer } from './engine/questionGenerator';
import {
  saveMiniLevelResult, saveDifficultyTime,
  allDifficultiesComplete, getGameKey, saveRetryPool, clearRetryPool,
} from './engine/progressStore';
import { MiniLevelTracker } from './components/MiniLevelTracker';
import { QuestionCard } from './components/QuestionCard';
import { CelebrationModal } from './components/CelebrationModal';
import { XPFly } from '../../components/Games/shared/GameUI';
import { ConfettiEffect } from '../../components/ui/ConfettiEffect';

interface Props {
  subject: Subject;
  chapter: ChapterDef;
  gameType: GameTypeDef;
  difficulty: Difficulty;
  onExit: () => void;
  onGameWin: (xp: number) => void;
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
  onClickSound?: () => void;
}

type Phase = 'playing' | 'celebration' | 'retry' | 'retryDone' | 'complete';

export const GameSessionScreen: React.FC<Props> = ({
  subject, chapter, gameType, difficulty, onExit, onGameWin,
  onCorrectAnswer, onWrongAnswer, onClickSound,
}) => {
  const meta = DIFF_META[difficulty];
  const sessionKey = getGameKey(subject, chapter.id, gameType.id);

  // ── Generate 25 questions on mount ──
  const questions = useMemo(
    () => generateQuestions(gameType.id, difficulty),
    [gameType.id, difficulty],
  );

  // ── State ──
  const [phase, setPhase] = useState<Phase>('playing');
  const [currentMiniLevel, setCurrentMiniLevel] = useState(1);
  const [currentQIndex, setCurrentQIndex] = useState(0); // 0-4 within mini-level
  const [score, setScore] = useState(0);
  const [miniLevelScore, setMiniLevelScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [miniLevelXP, setMiniLevelXP] = useState(0);
  const [wrongPool, setWrongPool] = useState<Question[]>([]);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questionResults, setQuestionResults] = useState<Array<boolean | null>>(
    Array.from({ length: 5 }, () => null),
  );
  const [retryResults, setRetryResults] = useState<Array<boolean | null>>([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [retryIndex, setRetryIndex] = useState(0);
  const [retryScore, setRetryScore] = useState(0);
  const [showXPFly, setShowXPFly] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastXPAmount, setLastXPAmount] = useState(0);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Current question ──
  const globalIndex = (currentMiniLevel - 1) * 5 + currentQIndex;
  const currentQuestion: Question | undefined = phase === 'retry'
    ? wrongPool[retryIndex]
    : questions[globalIndex];

  // ── Answer handler ──
  const handleSelect = useCallback((answer: string) => {
    if (!currentQuestion || inputDisabled) return;
    onClickSound?.();             // 🔊 click on selection
    setInputDisabled(true);
    setSelectedAnswer(answer);

    const correct = validateAnswer(answer, currentQuestion.correctAnswer) === true;
    setIsCorrect(correct);
    if (phase === 'retry') {
      setRetryResults(prev => {
        const next =
          prev.length === wrongPool.length
            ? [...prev]
            : Array.from({ length: wrongPool.length }, () => null);
        next[retryIndex] = correct;
        return next;
      });
    } else {
      setQuestionResults(prev => {
        const next =
          prev.length === 5
            ? [...prev]
            : Array.from({ length: 5 }, () => null);
        next[currentQIndex] = correct;
        return next;
      });
    }

    if (correct) {
      const xp = XP_PER_Q[difficulty];
      setScore(s => s + 1);
      setMiniLevelScore(s => s + 1);
      setXpEarned(x => x + xp);
      setMiniLevelXP(x => x + xp);
      setLastXPAmount(xp);

      // 🔊 Unified sound + visual feedback
      onCorrectAnswer?.();
      setShowXPFly(true);
      setShowConfetti(true);
      setTimeout(() => { setShowXPFly(false); setShowConfetti(false); }, 1200);

      if (phase === 'retry') {
        setRetryScore(s => s + 1);
      }
    } else {
      // 🔊 Wrong answer sound
      onWrongAnswer?.();

      if (phase === 'playing') {
        // Add to wrong pool
        setWrongPool(pool => {
          if (pool.find(q => q.id === currentQuestion.id)) return pool;
          return [...pool, currentQuestion];
        });
      }
    }

    // Advance after feedback delay
    timerRef.current = setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setInputDisabled(false);

      if (phase === 'retry') {
        // Retry round
        if (retryIndex + 1 >= wrongPool.length) {
          setPhase('retryDone');
        } else {
          setRetryIndex(ri => ri + 1);
        }
        return;
      }

      // Normal play
      if (currentQIndex + 1 >= 5) {
        // Mini-level complete
        handleMiniLevelComplete();
      } else {
        setCurrentQIndex(qi => qi + 1);
      }
    }, correct ? 1200 : 1500);
  }, [currentQuestion, inputDisabled, difficulty, phase, currentQIndex, retryIndex, wrongPool.length]);

  // ── Mini-level complete ──
  const handleMiniLevelComplete = useCallback(() => {
    const levelScore = miniLevelScore + (isCorrect ? 1 : 0);
    const levelXP = miniLevelXP + XP_MINI_BONUS;

    // Save progress
    const { newBadge: badge } = saveMiniLevelResult(
      subject, chapter.id, gameType.id,
      difficulty, currentMiniLevel,
      levelScore, 5,
    );

    setXpEarned(x => x + XP_MINI_BONUS);
    setCompletedLevels(prev => [...prev, currentMiniLevel]);

    if (badge) setNewBadge(badge);
    setPhase('celebration');
  }, [miniLevelScore, miniLevelXP, subject, chapter.id, gameType.id, difficulty, currentMiniLevel, isCorrect]);

  // ── Continue after celebration ──
  const handleContinue = useCallback(() => {
    setNewBadge(null);

    if (phase === 'retryDone' || phase === 'complete') {
      // Sync all XP
      if (xpEarned > 0) onGameWin(xpEarned);
      clearRetryPool(sessionKey);
      onExit();
      return;
    }

      if (currentMiniLevel >= 5) {
      // All 5 mini-levels done
      const diffXP = XP_DIFF_BONUS;
      let totalBonus = diffXP;
      setXpEarned(x => x + diffXP);

      // Check all-difficulties bonus
      if (allDifficultiesComplete(subject, chapter.id, gameType.id)) {
        totalBonus += XP_ALL_BONUS;
        setXpEarned(x => x + XP_ALL_BONUS);
      }

      // Save time
      saveDifficultyTime(subject, chapter.id, gameType.id, difficulty, Math.round((Date.now() - startTimeRef.current) / 1000));

      // Check if retry needed
      if (wrongPool.length > 0) {
        saveRetryPool(sessionKey, wrongPool.map(q => q.id));
        setRetryIndex(0);
        setRetryScore(0);
        setRetryResults(Array.from({ length: wrongPool.length }, () => null));
        setPhase('retry');
      } else {
        setRetryResults([]);
        setPhase('complete');
      }
    } else {
      // Next mini-level
      setCurrentMiniLevel(ml => ml + 1);
      setCurrentQIndex(0);
      setMiniLevelScore(0);
      setMiniLevelXP(0);
      setQuestionResults(Array.from({ length: 5 }, () => null));
      setRetryResults([]);
      setPhase('playing');
    }
  }, [phase, currentMiniLevel, wrongPool, xpEarned, onGameWin, onExit, sessionKey, subject, chapter.id, gameType.id, difficulty]);

  // ── Cleanup ──
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // ── Guard: no questions generated ──
  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm">Could not generate questions. Please try again.</p>
        <button onClick={onExit} className="mt-4 text-amber-500 font-bold text-sm">← Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] pb-8">
      {/* Unified XP fly & confetti (same as core arcade games) */}
      <ConfettiEffect trigger={showConfetti} />
      <XPFly show={showXPFly} amount={lastXPAmount} />

      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => {
            if (xpEarned > 0) onGameWin(xpEarned);
            onExit();
          }}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
        >
          <span>←</span> Exit
        </button>

        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {gameType.icon} {gameType.title}
          </p>
          <p className="text-[9px] text-gray-300 font-medium">
            {chapter.icon} {chapter.title} • {meta.label}
          </p>
        </div>

        <div className={`px-2.5 py-1 rounded-lg bg-gradient-to-r ${meta.gradient} text-white text-[10px] font-bold`}>
          {meta.emoji} {meta.label}
        </div>
      </motion.div>

      {/* Mini-level tracker */}
      {phase !== 'retry' && phase !== 'retryDone' && (
        <div className="mb-5">
          <MiniLevelTracker
            currentLevel={currentMiniLevel}
            completedLevels={completedLevels}
            difficulty={difficulty}
          />
        </div>
      )}

      {/* Retry header */}
      {phase === 'retry' && (
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="inline-flex items-center gap-2 bg-amber-100/60 px-4 py-2 rounded-2xl border border-amber-200/30">
            <span className="text-lg">🔁</span>
            <span className="font-bold text-amber-700 text-sm">
              Retry Round — {wrongPool.length} question{wrongPool.length > 1 ? 's' : ''} to review
            </span>
          </div>
        </motion.div>
      )}

      {/* Question Card */}
      <AnimatePresence mode="wait">
        {(phase === 'playing' || phase === 'retry') && currentQuestion && (
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            questionIndex={phase === 'retry' ? retryIndex : currentQIndex}
            totalInLevel={phase === 'retry' ? wrongPool.length : 5}
            questionResults={phase === 'retry' ? retryResults : questionResults}
            difficulty={difficulty}
            selectedAnswer={selectedAnswer}
            isCorrect={isCorrect}
            onSelect={handleSelect}
            disabled={inputDisabled}
            xpEarned={xpEarned}
          />
        )}
      </AnimatePresence>

      {/* Celebration Modal */}
      <CelebrationModal
        show={phase === 'celebration'}
        miniLevel={currentMiniLevel}
        score={miniLevelScore}
        total={5}
        xpEarned={miniLevelXP + XP_MINI_BONUS}
        difficulty={difficulty}
        isDifficultyComplete={currentMiniLevel >= 5}
        newBadge={newBadge}
        onContinue={handleContinue}
      />

      {/* Retry Done */}
      <CelebrationModal
        show={phase === 'retryDone'}
        miniLevel={0}
        score={retryScore}
        total={wrongPool.length}
        xpEarned={xpEarned}
        difficulty={difficulty}
        isRetryRound={true}
        onContinue={handleContinue}
      />

      {/* Complete screen */}
      <CelebrationModal
        show={phase === 'complete'}
        miniLevel={5}
        score={score}
        total={25}
        xpEarned={xpEarned}
        difficulty={difficulty}
        isDifficultyComplete={true}
        newBadge={newBadge}
        onContinue={handleContinue}
      />
    </div>
  );
};

export default GameSessionScreen;
