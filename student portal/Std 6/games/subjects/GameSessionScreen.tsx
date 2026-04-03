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

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Difficulty, Question, Subject, XP_PER_Q, XP_MINI_BONUS,
  XP_DIFF_BONUS, XP_ALL_BONUS, DIFF_META, GameTypeDef, ChapterDef, LEVEL_COUNTS, QUESTIONS_PER_LEVEL,
} from './engine/types';
import { generateQuestions, validateAnswer } from './engine/questionGenerator';
import {
  saveMiniLevelResult, saveDifficultyTime,
  allDifficultiesComplete, getGameKey, getGameProgress, clearRetryPool,
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
  const totalLevels = LEVEL_COUNTS[difficulty] || 5;
  const usedQuestionKeysRef = useRef<Set<string>>(new Set());
  const buildNextQuestions = useCallback(
    () => generateQuestions(gameType.id, difficulty, QUESTIONS_PER_LEVEL, usedQuestionKeysRef.current, sessionKey),
    [difficulty, gameType.id, sessionKey],
  );

  // ── Generate 25 questions on mount ──
  const [questions, setQuestions] = useState<Question[]>(() => buildNextQuestions());

  // ── State ──
  const [phase, setPhase] = useState<Phase>('playing');
  const [currentMiniLevel, setCurrentMiniLevel] = useState(1);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [miniLevelScore, setMiniLevelScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [miniLevelXP, setMiniLevelXP] = useState(0);
  const [wrongPool, setWrongPool] = useState<Question[]>([]);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [retryIndex, setRetryIndex] = useState(0);
  const [retryScore, setRetryScore] = useState(0);
  const [showXPFly, setShowXPFly] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastXPAmount, setLastXPAmount] = useState(0);
  const [celebrationXP, setCelebrationXP] = useState(0);
  const [isDifficultyMilestone, setIsDifficultyMilestone] = useState(false);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Current question ──
  const currentQuestion: Question | undefined = phase === 'retry'
    ? wrongPool[retryIndex]
    : questions[currentQIndex];

  // ── Answer handler ──
  const handleSelect = useCallback((answer: string) => {
    if (!currentQuestion || inputDisabled) return;
    onClickSound?.();             // 🔊 click on selection
    setInputDisabled(true);
    setSelectedAnswer(answer);

    const correct = validateAnswer(answer, currentQuestion.correctAnswer);
    setIsCorrect(correct);

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
      if (currentQIndex + 1 >= QUESTIONS_PER_LEVEL) {
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
    const progressBefore = getGameProgress(subject, chapter.id, gameType.id);
    const hadCompletedMilestone = progressBefore[difficulty].completed;

    // Save progress
    const { newBadge: badge } = saveMiniLevelResult(
      subject, chapter.id, gameType.id,
      difficulty, currentMiniLevel,
      levelScore, QUESTIONS_PER_LEVEL,
    );

    const reachedMilestoneNow = !hadCompletedMilestone
      && getGameProgress(subject, chapter.id, gameType.id)[difficulty].completed;
    let levelBonus = XP_MINI_BONUS;

    if (reachedMilestoneNow) {
      levelBonus += XP_DIFF_BONUS;
      if (allDifficultiesComplete(subject, chapter.id, gameType.id)) {
        levelBonus += XP_ALL_BONUS;
      }
      saveDifficultyTime(subject, chapter.id, gameType.id, difficulty, Math.round((Date.now() - startTimeRef.current) / 1000));
    }

    setXpEarned(x => x + levelBonus);
    setCelebrationXP(miniLevelXP + levelBonus);
    setCompletedLevels(prev => (prev.includes(currentMiniLevel) ? prev : [...prev, currentMiniLevel]));
    setIsDifficultyMilestone(reachedMilestoneNow);

    if (badge) setNewBadge(badge);
    setPhase('celebration');
  }, [miniLevelScore, miniLevelXP, subject, chapter.id, gameType.id, difficulty, currentMiniLevel, isCorrect]);

  // ── Continue after celebration ──
  const handleContinue = useCallback(() => {
    setNewBadge(null);
    setIsDifficultyMilestone(false);

    if (phase === 'retryDone' || phase === 'complete') {
      // Sync all XP
      if (xpEarned > 0) onGameWin(xpEarned);
      clearRetryPool(sessionKey);
      onExit();
      return;
    }

    setQuestions(buildNextQuestions());
    setCurrentMiniLevel(ml => ml + 1);
    setCurrentQIndex(0);
    setMiniLevelScore(0);
    setMiniLevelXP(0);
    setWrongPool([]);
    setRetryIndex(0);
    setRetryScore(0);
    setPhase('playing');
  }, [buildNextQuestions, onExit, onGameWin, phase, sessionKey, xpEarned]);

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
            totalLevels={totalLevels}
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
            totalInLevel={phase === 'retry' ? wrongPool.length : QUESTIONS_PER_LEVEL}
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
        totalLevels={totalLevels}
        score={miniLevelScore}
        total={QUESTIONS_PER_LEVEL}
        xpEarned={celebrationXP}
        difficulty={difficulty}
        isDifficultyComplete={false}
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
        miniLevel={totalLevels}
        totalLevels={totalLevels}
        score={score}
        total={questions.length}
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
