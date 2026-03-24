/**
 * 🧠 GameShell — THE ONE BRAIN
 * ==============================
 * Controls ALL 44 game types with one unified flow:
 *   Difficulty → Mini-Level (×5) → Questions (×5) → Celebration → Retry → Done
 *
 * Responsibilities:
 *   ✅ Difficulty selection         ✅ Question generation (5 per mini-level)
 *   ✅ Mini-level tracking          ✅ Answer validation (centralized)
 *   ✅ Sound feedback               ✅ XP awarding
 *   ✅ Celebration modal            ✅ Retry pool for wrong answers
 *   ✅ Progress persistence         ✅ Level transitions
 *
 * NO per-game custom flow. Zero special cases.
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { soundManager } from '../child/SoundManager';
import { recordJourneyLevel, JOURNEY_GAMES } from '../child/journey/journeyProgress';
import { useGlobalPlayTimer } from '../child/GlobalTimerContext';
import type { Question, Difficulty } from './engine/questionGenerator';
import { generateBatch } from './engine/questionGenerator';
import { validateAnswer } from './engine/validation';
import {
  createRetryPool, addWrong, removeCorrect, getRetryBatch, hasRetries,
  type RetryPool,
} from './engine/retryManager';
import { logActivity } from '../services/activityLogger';

import { DifficultySelector, DIFF_META, DIFFICULTIES, XP_PER_DIFFICULTY, XP_MINI_BONUS, XP_DIFF_BONUS, XP_ALL_BONUS, QUESTIONS_PER_MINI, LEVEL_CONFIG, isDifficultyUnlocked, DEV_UNLOCK_ALL } from './DifficultySelector';
import { MiniLevelTracker } from './MiniLevelTracker';
import { QuestionRenderer } from './QuestionRenderer';
import { LevelGrid } from './LevelGrid';
// Progress store (reuse existing localStorage-backed store)
import {
  getGameProgress, saveMiniLevelResult, saveDifficultyTime, allDifficultiesComplete,
} from './subjects/engine/progressStore';

import { ConfettiEffect } from '../components/ui/ConfettiEffect';

// ── Badge defs (inline — same as subjects/engine/types) ───

const BADGE_DEFS: Record<string, { id: string; title: string; icon: string }> = {
  easy_star: { id: 'easy_star', title: 'Easy Star', icon: '⭐' },
  silver:    { id: 'silver',    title: 'Silver Badge', icon: '🥈' },
  golden:    { id: 'golden',    title: 'Golden Master', icon: '🏆' },
};

// ── Types ─────────────────────────────────────────────────

type Phase = 'selectDifficulty' | 'selectLevel' | 'playing' | 'celebration' | 'retry' | 'retryDone' | 'difficultyComplete';

interface Props {
  /** Unique game identifier (e.g. 'shapeQuest', 'letter_match') */
  gameTypeId: string;
  /** Section for progress storage */
  subject: string;
  /** Chapter for progress storage */
  chapter: string;
  /** Game title (displayed in header) */
  title: string;
  /** Game icon */
  icon: string;
  /** Callbacks from PlayWorld wired to providers */
  onExit: () => void;
  onGameWin: (xp: number) => void;
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
  onClickSound?: () => void;
}

// ── Celebration Emojis ────────────────────────────────────

const CELEB_EMOJIS = ['🎉', '✨', '🌈', '💫', '🎊', '⭐'];

/* ── Static animation presets (module-level = zero GC churn) ── */
const ANIM_VISIBLE = { opacity: 1, y: 0 };
const ANIM_HIDDEN = {};
const ANIM_VISIBLE_SCALE = { opacity: 1, scale: 1 };
const STAR_VISIBLE = { scale: 1, rotate: 0 };

/* ── CSS keyframe injection (runs once) ── */
const GS_STYLE_ID = 'gs-perf-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(GS_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = GS_STYLE_ID;
  s.textContent = `
    @keyframes gs-icon-bob { 0%,100%{transform:rotate(0) scale(1)} 25%{transform:rotate(5deg) scale(1.05)} 75%{transform:rotate(-5deg) scale(1)} }
    @keyframes gs-celeb-emoji { 0%{opacity:0; transform:translateY(20px) scale(0.5)} 30%{opacity:0.3; transform:translateY(-10px) scale(1.1)} 60%{opacity:0.15; transform:translateY(0) scale(0.9) rotate(15deg)} 100%{opacity:0.15; transform:translateY(0) scale(0.9) rotate(-10deg)} }
    @keyframes gs-hero-bob { 0%,100%{transform:translateY(0) rotate(0)} 25%{transform:translateY(-8px) rotate(5deg)} 75%{transform:translateY(0) rotate(-5deg)} }
    @keyframes gs-xp-sparkle { 0%,100%{transform:rotate(0) scale(1)} 33%{transform:rotate(20deg) scale(1.2)} 66%{transform:rotate(-20deg) scale(1)} }
  `;
  document.head.appendChild(s);
}

// ── Stat Card (matches arcade GameOverScreen) ─────────────

const StatCard: React.FC<{ icon: string; label: string; value: string; highlight?: boolean }> = React.memo(
  ({ icon, label, value, highlight }) => (
    <motion.div
      className={`rounded-2xl p-3 text-center ${
        highlight
          ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border border-amber-200/30'
          : 'bg-white/50 border border-gray-100/30'
      }`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', delay: 0.1 }}
    >
      <span className="text-lg block mb-0.5">{icon}</span>
      <span className={`text-lg font-black block ${highlight ? 'text-amber-600' : 'text-gray-800'}`}>{value}</span>
      <span className="text-[9px] font-bold text-gray-400 uppercase">{label}</span>
    </motion.div>
  ),
);
StatCard.displayName = 'StatCard';

/* ── Static header style (module-level) ── */
const HEADER_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  border: '1.5px solid rgba(255,255,255,0.5)',
  boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
};

/** Format level for display — safe for 10,000+ levels */
function formatLevel(level: number): string {
  if (level > 9999) return `${Math.floor(level / 1000)}K+`;
  return String(level);
}
const CELEB_CARD_STYLE: React.CSSProperties = {
  boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
};

// ════════════════════════════════════════════════════════════
// GAME SHELL COMPONENT
// ════════════════════════════════════════════════════════════

export const GameShell: React.FC<Props> = ({
  gameTypeId, subject, chapter, title, icon,
  onExit, onGameWin, onCorrectAnswer, onWrongAnswer, onClickSound,
}) => {
  // ── Ref-based double-click guard (synchronous, not batched) ──
  const answeringRef = useRef(false);
  // ── Core state ──
  const [phase, setPhase] = useState<Phase>('selectDifficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [miniLevel, setMiniLevel] = useState(1);
  const [completedMiniLevels, setCompletedMiniLevels] = useState<number[]>([]);

  // ── Questions state ──
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [disabled, setDisabled] = useState(false);

  // ── Scoring ──
  const [miniScore, setMiniScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [celebXP, setCelebXP] = useState(0);

  // ── Retry pool ──
  const retryPoolRef = useRef<RetryPool>(createRetryPool());
  const [isRetryRound, setIsRetryRound] = useState(false);

  // ── Celebration ──
  const [showCeleb, setShowCeleb] = useState(false);
  const [celebPhase, setCelebPhase] = useState(0);
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [isDiffComplete, setIsDiffComplete] = useState(false);

  // ── Timers ──
  const diffStartRef = useRef(0);
  const usedIdsRef = useRef<Set<string>>(new Set());
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Progress (for difficulty selector) — only when needed ──
  const progressData = useMemo(() => {
    if (phase !== 'selectDifficulty' && phase !== 'selectLevel') return { easy: undefined as any, intermediate: undefined as any, difficult: undefined as any };
    const gp = getGameProgress(subject, chapter, gameTypeId);
    return { easy: gp.easy, intermediate: gp.intermediate, difficult: gp.difficult };
  }, [subject, chapter, gameTypeId, phase]);

  // ── Start a difficulty → show level grid (with unlock guard) ──
  const handleSelectDifficulty = useCallback((d: Difficulty) => {
    // Enforce 70% unlock threshold (bypassed when DEV_UNLOCK_ALL = true)
    if (!DEV_UNLOCK_ALL) {
      const gp = getGameProgress(subject, chapter, gameTypeId);
      const prog = { easy: gp.easy, intermediate: gp.intermediate, difficult: gp.difficult };
      if (!isDifficultyUnlocked(prog, d)) return;
    }

    setDifficulty(d);
    setMiniLevel(1);
    setCompletedMiniLevels([]);
    setTotalXP(0);
    retryPoolRef.current = createRetryPool();
    usedIdsRef.current = new Set();
    diffStartRef.current = Date.now();
    setIsRetryRound(false);
    setPhase('selectLevel');
  }, [subject, chapter, gameTypeId]);

  // ── Select a specific level from the grid ──
  const handleSelectLevel = useCallback((level: number) => {
    setMiniLevel(level);
    setMiniScore(0);
    answeringRef.current = false;          // reset double-click guard
    const batch = generateBatch(gameTypeId, difficulty, QUESTIONS_PER_MINI, usedIdsRef.current);
    setQuestions(batch);
    setQIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setDisabled(false);
    setPhase('playing');
  }, [gameTypeId, difficulty]);

  // ── Select answer (use refs for stable closure) ──
  const miniScoreRef = useRef(miniScore);
  miniScoreRef.current = miniScore;
  const isCorrectRef = useRef(isCorrect);
  isCorrectRef.current = isCorrect;

  // ── Mini-level complete (declared before handleSelectAnswer so it can be referenced) ──
  const handleMiniLevelComplete = useCallback(() => {
    const score = miniScoreRef.current; // already incremented in handleSelectAnswer
    const xpBonus = XP_MINI_BONUS;
    logActivity('games', 2);
    setTotalXP(prev => prev + xpBonus);

    const maxLevels = LEVEL_CONFIG[difficulty];

    if (!isRetryRound) {
      // Save progress
      const result = saveMiniLevelResult(
        subject, chapter, gameTypeId,
        difficulty, miniLevel,
        score, QUESTIONS_PER_MINI,
      );
      setNewBadge(result.newBadge);

      // Record journey level completion
      const gameCategory = subject === 'maths' ? JOURNEY_GAMES.MATH
        : subject === 'english' ? JOURNEY_GAMES.ENGLISH
        : JOURNEY_GAMES.ARCADE;
      recordJourneyLevel(gameCategory);

      setCompletedMiniLevels(prev => [...prev, miniLevel]);

      // Check if this was the last level for this difficulty
      const gp = getGameProgress(subject, chapter, gameTypeId);
      const completedCount = Object.values(gp[difficulty].miniLevels).filter(m => m.completed).length;
      const allLevelsDone = completedCount >= maxLevels;

      if (allLevelsDone) {
        // Difficulty complete!
        const timeTaken = Math.round((Date.now() - diffStartRef.current) / 1000);
        saveDifficultyTime(subject, chapter, gameTypeId, difficulty, timeTaken);
        const diffBonus = XP_DIFF_BONUS;
        const allBonus = allDifficultiesComplete(subject, chapter, gameTypeId) ? XP_ALL_BONUS : 0;
        setTotalXP(prev => prev + diffBonus + allBonus);
        soundManager.playCelebrate();
        setCelebXP(xpBonus + diffBonus + allBonus);
        setShowCeleb(true);
        setIsDiffComplete(true);
        setPhase('difficultyComplete');
        onGameWin(totalXP + xpBonus + diffBonus + allBonus);
      } else {
        // Level complete — show celebration, then back to level grid
        soundManager.playCelebrate();
        setCelebXP(xpBonus);
        setShowCeleb(true);
        setIsDiffComplete(false);
        setPhase('celebration');
      }
    } else {
      // Retry round complete
      soundManager.playCelebrate();
      setCelebXP(xpBonus);
      setShowCeleb(true);
      setIsDiffComplete(false);
      setPhase('retryDone');
    }
  }, [isRetryRound, subject, chapter, gameTypeId, difficulty, miniLevel, totalXP, onGameWin]);

  const handleSelectAnswer = useCallback((answer: string) => {
    // Ref-based guard: synchronous, survives React batching
    if (answeringRef.current) return;
    if (disabled || selectedAnswer !== null) return;
    answeringRef.current = true;

    const q = questions[qIndex];
    if (!q) { answeringRef.current = false; return; }

    const correct = validateAnswer(answer, q.correctAnswer);
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setDisabled(true);

    if (correct) {
      const xp = XP_PER_DIFFICULTY[difficulty];
      setMiniScore(prev => prev + 1);
      setTotalXP(prev => prev + xp);
      soundManager.playCorrect();
      onCorrectAnswer?.();
    } else {
      retryPoolRef.current = addWrong(retryPoolRef.current, q);
      soundManager.playWrong();
      onWrongAnswer?.();
    }

    // Auto-advance after delay
    answerTimeoutRef.current = setTimeout(() => {
      answeringRef.current = false;          // unlock for next question
      const nextIdx = qIndex + 1;
      if (nextIdx < questions.length) {
        setQIndex(nextIdx);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setDisabled(false);
      } else {
        handleMiniLevelComplete();
      }
    }, 1200);
  }, [disabled, selectedAnswer, questions, qIndex, difficulty, handleMiniLevelComplete, onCorrectAnswer, onWrongAnswer]);

  // ── Continue from celebration ──
  const handleContinue = useCallback(() => {
    setShowCeleb(false);
    setCelebPhase(0);
    setNewBadge(null);

    if (phase === 'difficultyComplete' || phase === 'retryDone') {
      // Go back to difficulty select
      setPhase('selectDifficulty');
      return;
    }

    // After level celebration → back to level grid to pick next level
    setPhase('selectLevel');
  }, [phase]);

  // ── Cleanup timeouts ──
  useEffect(() => {
    return () => {
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
    };
  }, []);

  // ── Timer: start when playing, pause when on selection/result screens ──
  const { startTimer, pauseTimer } = useGlobalPlayTimer();
  useEffect(() => {
    if (phase === 'playing' || phase === 'retry' || phase === 'celebration') {
      startTimer();
    } else {
      pauseTimer();
    }
  }, [phase, startTimer, pauseTimer]);

  // Ensure timer pauses when this component unmounts (user clicks ← Back)
  useEffect(() => {
    return () => { pauseTimer(); };
  }, [pauseTimer]);

  // ── Celebration phase animation ──
  useEffect(() => {
    if (!showCeleb) { setCelebPhase(0); return; }
    const t1 = setTimeout(() => setCelebPhase(1), 200);
    const t2 = setTimeout(() => setCelebPhase(2), 600);
    const t3 = setTimeout(() => setCelebPhase(3), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [showCeleb]);

  // ── Current question ──
  const currentQ = questions[qIndex] || null;

  // Celebration data — memoized to avoid recomputing every render
  const celebData = useMemo(() => {
    if (!showCeleb) return null;
    const score = miniScore;           // already incremented — no +1
    const total = questions.length || QUESTIONS_PER_MINI;
    const perfect = score === total;
    const great = score >= Math.ceil(total * 0.6);
    const stars = perfect ? 3 : great ? 2 : 1;
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

    let msg: { title: string; sub: string; emoji: string };
    if (isDiffComplete && perfect) msg = { title: 'PERFECT CLEAR! 🏆', sub: 'You mastered every single question!', emoji: '🏆' };
    else if (isDiffComplete) msg = { title: 'Difficulty Complete! 🌟', sub: 'Amazing work, champion!', emoji: '🌟' };
    else if (isRetryRound) msg = { title: 'Retry Complete! 💪', sub: 'Great job reviewing!', emoji: '🎯' };
    else if (perfect) msg = { title: 'PERFECT SCORE! 🏆', sub: 'You got every single one right!', emoji: '🏆' };
    else if (accuracy >= 80) msg = { title: 'Amazing Work! 🌟', sub: "You're a superstar learner!", emoji: '🌟' };
    else if (great) msg = { title: 'Great Job! ⭐', sub: 'Keep up the awesome work!', emoji: '⭐' };
    else msg = { title: 'Well Done! 💪', sub: 'Practice makes perfect!', emoji: '🎯' };

    return { score, total, perfect, great, stars, accuracy, msg };
  }, [showCeleb, miniScore, isCorrect, questions.length, isDiffComplete, isRetryRound]);

  const celebScore = celebData?.score ?? 0;
  const celebTotal = celebData?.total ?? QUESTIONS_PER_MINI;
  const celebPerfect = celebData?.perfect ?? false;
  const celebGreat = celebData?.great ?? false;
  const celebStars = celebData?.stars ?? 1;
  const celebAccuracy = celebData?.accuracy ?? 0;
  const celebMsg = celebData?.msg ?? { title: '', sub: '', emoji: '🎯' };
  const badge = newBadge ? BADGE_DEFS[newBadge] : null;
  const meta = DIFF_META[difficulty];

  // Level grid phase uses wider container
  const isLevelPhase = phase === 'selectLevel';
  const containerMax = isLevelPhase ? 1400 : 1100;

  return (
    <div style={{ width: '100%', maxWidth: containerMax, margin: '0 auto', padding: isLevelPhase ? '0' : '0 clamp(8px, 2vw, 20px)', boxSizing: 'border-box', transition: 'max-width 0.3s ease' }}>
      {/* ─── Premium Header (hidden during level grid — header is inside LevelGrid) ─── */}
      {!isLevelPhase && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '0 16px', boxSizing: 'border-box' }}>
          <div
            style={{
              ...HEADER_STYLE,
              width: '100%',
              maxWidth: 1400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              padding: '12px 18px',
              borderRadius: 16,
              marginBottom: 20,
              boxSizing: 'border-box',
            }}
          >
            <motion.button
              onClick={() => { onClickSound?.(); onExit(); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#8B7355', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 0 }}
              whileHover={{ x: -3, color: '#6B5B45' }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back
            </motion.button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span
                style={{ fontSize: 20, display: 'inline-block', animation: 'gs-icon-bob 4s ease-in-out infinite', flexShrink: 0 }}
              >
                {icon}
              </span>
              <h2 style={{ fontWeight: 800, color: '#374151', fontSize: 14, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{title}</h2>
            </div>
            <div style={{ width: 64, flexShrink: 0 }} /> {/* spacer */}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ─── Phase: Select Difficulty ─── */}
        {phase === 'selectDifficulty' && (
          <motion.div
            key="diff"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="py-8"
          >
            <DifficultySelector onSelect={handleSelectDifficulty} progress={progressData} />
          </motion.div>
        )}

        {/* ─── Phase: Select Level (Grid) ─── */}
        {phase === 'selectLevel' && (
          <motion.div
            key="levels"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="py-4"
          >
            <LevelGrid
              difficulty={difficulty}
              progress={progressData[difficulty]}
              onSelectLevel={handleSelectLevel}
              onBack={() => setPhase('selectDifficulty')}
            />
          </motion.div>
        )}

        {/* ─── Phase: Playing / Retry ─── */}
        {(phase === 'playing' || phase === 'retry') && currentQ && (
          <motion.div
            key={`play-${miniLevel}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Mini-level tracker */}
            <div className="mb-5">
              <MiniLevelTracker
                currentLevel={isRetryRound ? 0 : miniLevel}
                completedLevels={completedMiniLevels}
                difficulty={difficulty}
              />
              {isRetryRound && (
                <p className="text-center text-xs text-amber-600 font-bold mt-2">
                  🔄 Retry Round — review your wrong answers!
                </p>
              )}
            </div>

            <QuestionRenderer
              question={currentQ}
              questionIndex={qIndex}
              totalInLevel={questions.length}
              difficulty={difficulty}
              selectedAnswer={selectedAnswer}
              isCorrect={isCorrect}
              onSelect={handleSelectAnswer}
              disabled={disabled}
              xpEarned={totalXP}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Celebration Modal (all phases) ─── */}
      <AnimatePresence>
        {showCeleb && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ConfettiEffect trigger={true} />

            <motion.div
              className="relative bg-white/90 border border-white/50 rounded-[28px] p-8 max-w-sm w-full overflow-hidden text-center"
              style={CELEB_CARD_STYLE}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* BG gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${
                celebPerfect ? 'from-yellow-100/40 via-amber-50/20 to-orange-100/30'
                : celebGreat ? 'from-green-100/30 via-emerald-50/20 to-teal-100/30'
                : 'from-orange-100/30 via-amber-50/20 to-yellow-100/30'
              } rounded-[24px] pointer-events-none`} />

              {/* Floating emojis — CSS */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {CELEB_EMOJIS.slice(0, 4).map((e) => (
                  <span
                    key={e}
                    className="absolute text-2xl"
                    style={{
                      left: `${15 + CELEB_EMOJIS.indexOf(e) * 18}%`,
                      top: `${20 + (CELEB_EMOJIS.indexOf(e) % 3) * 25}%`,
                      opacity: 0,
                      animation: `gs-celeb-emoji 2s ease-in-out ${CELEB_EMOJIS.indexOf(e) * 0.15}s infinite`,
                      willChange: 'opacity, transform',
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>

              {/* Hero emoji */}
              <motion.div
                className="relative z-10 mb-3"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 250, damping: 10, delay: 0.1 }}
              >
                <span
                  className="inline-block"
                  style={{ fontSize: 80, animation: 'gs-hero-bob 2.5s ease-in-out infinite', willChange: 'transform', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.1))' }}
                >
                  {celebMsg.emoji}
                </span>
              </motion.div>

              {/* Stars */}
              <motion.div
                className="flex justify-center gap-3 mb-4 relative z-10"
                initial={{ opacity: 0, y: 10 }}
                animate={celebPhase >= 1 ? ANIM_VISIBLE : ANIM_HIDDEN}
                transition={{ duration: 0.4 }}
              >
                {[1, 2, 3].map(s => (
                  <motion.span
                    key={s}
                    className="text-5xl"
                    style={{
                      filter: s <= celebStars ? 'drop-shadow(0 4px 12px rgba(245,158,11,0.4))' : 'none',
                      opacity: s <= celebStars ? 1 : 0.35,
                    }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={celebPhase >= 1 ? STAR_VISIBLE : ANIM_HIDDEN}
                    transition={{ delay: 0.15 + s * 0.15, type: 'spring', stiffness: 300, damping: 10 }}
                  >
                    {s <= celebStars ? '⭐' : '☆'}
                  </motion.span>
                ))}
              </motion.div>

              {/* Title */}
              <motion.h2
                className={`text-2xl font-black mb-1 relative z-10 ${
                  celebPerfect ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent' : 'text-gray-800'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={celebPhase >= 1 ? ANIM_VISIBLE : ANIM_HIDDEN}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {celebMsg.title}
              </motion.h2>
              <motion.p
                className="text-sm text-gray-500 mb-1 relative z-10"
                initial={{ opacity: 0 }}
                animate={celebPhase >= 1 ? { opacity: 1 } : ANIM_HIDDEN}
                transition={{ delay: 0.35 }}
              >
                {celebMsg.sub}
              </motion.p>

              {/* Level info */}
              {!isRetryRound && !isDiffComplete && (
                <motion.p
                  className="text-xs text-gray-400 mb-4 relative z-10"
                  style={{ whiteSpace: 'nowrap' }}
                  initial={{ opacity: 0 }}
                  animate={celebPhase >= 1 ? { opacity: 1 } : ANIM_HIDDEN}
                  transition={{ delay: 0.4 }}
                >
                  {meta.emoji} Level {formatLevel(miniLevel)} Complete
                </motion.p>
              )}

              {/* Stats */}
              {celebPhase >= 2 && (
                <motion.div
                  className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-5 relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={ANIM_VISIBLE}
                  transition={{ duration: 0.4 }}
                >
                  <StatCard icon="🎯" label="Score" value={`${celebScore}/${celebTotal}`} />
                  <StatCard icon="📊" label="Accuracy" value={`${celebAccuracy}%`} />
                </motion.div>
              )}

              {/* XP Banner — pulse animation */}
              {celebPhase >= 2 && celebXP > 0 && (
                <motion.div
                  className="mb-5 relative z-10"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={ANIM_VISIBLE_SCALE}
                  transition={{ type: 'spring', stiffness: 250, damping: 12, delay: 0.1 }}
                >
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 px-7 py-3 rounded-2xl shadow-lg shadow-amber-500/30" style={{ boxShadow: '0 6px 24px rgba(245,158,11,0.35)' }}>
                      <span className="text-2xl" style={{ animation: 'gs-xp-sparkle 1.5s ease-in-out infinite', willChange: 'transform', display: 'inline-block' }}>✨</span>
                      <span className="text-white font-black text-xl">+{celebXP} XP</span>
                      <span className="text-2xl" style={{ animation: 'gs-xp-sparkle 1.5s ease-in-out 0.3s infinite', willChange: 'transform', display: 'inline-block' }}>✨</span>
                    </div>
                  </motion.div>
                )}


              {/* Badge unlock */}
              {badge && (
                <motion.div
                  className="mb-4 relative z-10"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring', stiffness: 300 }}
                >
                  <div className="inline-flex flex-col items-center gap-1 bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 px-5 py-3 rounded-2xl">
                    <span className="text-3xl">{badge.icon}</span>
                    <span className="text-xs font-black text-amber-700 uppercase tracking-wider">{badge.title} Unlocked!</span>
                  </div>
                </motion.div>
              )}

              {/* Next level hint */}
              {celebPhase >= 3 && !isDiffComplete && !isRetryRound && miniLevel < LEVEL_CONFIG[difficulty] && (
                <motion.p className="text-xs text-gray-400 mb-3 relative z-10" style={{ whiteSpace: 'nowrap' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Level {formatLevel(miniLevel + 1)} unlocked! 🔓
                </motion.p>
              )}

              {/* Retry tip */}
              {celebPhase >= 3 && !celebPerfect && !isDiffComplete && !isRetryRound && (
                <motion.p className="text-xs text-gray-400 mb-3 relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  💡 Tip: Retry wrong answers to improve your score!
                </motion.p>
              )}

              {/* Continue button */}
              {celebPhase >= 3 && (
                <motion.button
                  onClick={handleContinue}
                  className={`w-full py-3.5 rounded-2xl font-bold text-white text-base shadow-lg active:scale-95 transition-transform relative z-10
                    bg-gradient-to-r ${isDiffComplete ? 'from-amber-500 to-orange-500 shadow-amber-500/25' : `${meta.gradient} shadow-green-500/25`}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={ANIM_VISIBLE}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {isDiffComplete ? '🏠 Back to Menu' : isRetryRound ? '🎉 Done!' : '📋 Level Select ▶'}
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

GameShell.displayName = 'GameShell';
