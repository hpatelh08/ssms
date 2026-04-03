/**
 * 🔢 Number Tap — Standalone Self-Contained Game
 * =================================================
 * Age-appropriate counting game for Std 5.
 * 5 rounds, target 1–5, 4 options per round.
 *
 * Uses centralized child-system hooks directly:
 *   play()          — useSoundPlay    (click, correct, wrong, celebrate)
 *   triggerMascot() — useMascotTrigger (happy, encourage, celebrate)
 *   celebrate()     — useCelebrate    (confetti)
 *   addXP()         — useAddXP        (per-answer + bonus)
 *
 * Safety:
 *   • Double-click guard via isLocked state + lockedRef
 *   • Sound fires BEFORE state mutations
 *   • Single timer ref — cleaned up on unmount
 *   • No direct Audio instances
 *   • No array mutation
 *   • Clean deterministic state
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSoundPlay } from '../../child/SoundProvider';
import { useMascotTrigger } from '../../child/useMascotController';
import { useCelebrate } from '../../child/useCelebrationController';
import { useAddXP } from '../../child/XPProvider';
import { logAction } from '../../utils/auditLog';

/* ── Constants ─────────────────────────────────── */

const MAX_ROUNDS = 5;
const MAX_NUMBER = 20;
const OPTIONS_COUNT = 4;
const XP_PER_CORRECT = 10;
const XP_BONUS_COMPLETE = 40;

const OPTION_COLORS = [
  { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
  { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
];

/* ── Helpers ───────────────────────────────────── */

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateOptions(target: number): number[] {
  const others = new Set<number>();
  while (others.size < OPTIONS_COUNT - 1) {
    const n = Math.floor(Math.random() * MAX_NUMBER) + 1;
    if (n !== target) others.add(n);
  }
  return shuffleArray([target, ...Array.from(others)]);
}

/* ── Props ─────────────────────────────────────── */

interface NumberTapProps {
  onExit: () => void;
  onNextGame?: () => void;
}

/* ── Component ─────────────────────────────────── */

export const NumberTapStandalone: React.FC<NumberTapProps> = React.memo(({ onExit, onNextGame }) => {
  const play = useSoundPlay();
  const triggerMascot = useMascotTrigger();
  const celebrateFn = useCelebrate();
  const addXP = useAddXP();

  /* ── Game State ── */
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [targetNumber, setTargetNumber] = useState<number>(1);
  const [options, setOptions] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; selected: number } | null>(null);
  const [showWin, setShowWin] = useState(false);

  /* ── Refs ── */
  const lockedRef = useRef(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout>>();

  /* ── Timer cleanup on unmount ── */
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  /* ── generateRound ─────────────────────────── */
  const generateRound = useCallback(() => {
    const target = Math.floor(Math.random() * MAX_NUMBER) + 1;
    setTargetNumber(target);
    setOptions(generateOptions(target));
    setIsLocked(false);
    lockedRef.current = false;
    setFeedback(null);
  }, []);

  /* ── Mount: first round ── */
  useEffect(() => {
    generateRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── handleGameWin ─────────────────────────── */
  const handleGameWin = useCallback(() => {
    // Order: sound → mascot → celebration → XP
    play('celebrate');
    triggerMascot('celebrate', 2500);
    celebrateFn('confetti');
    addXP(XP_BONUS_COMPLETE);
    logAction('game_complete', 'game', { game: 'NumberTap', score: score + 1, xp: XP_BONUS_COMPLETE });
    setShowWin(true);

    timerRef.current = setTimeout(() => {
      // Full reset
      setCurrentRound(1);
      setScore(0);
      setShowWin(false);
      setFeedback(null);
      setIsLocked(false);
      lockedRef.current = false;
      // Generate fresh round after reset
      const target = Math.floor(Math.random() * MAX_NUMBER) + 1;
      setTargetNumber(target);
      setOptions(generateOptions(target));
    }, 1500);
  }, [play, triggerMascot, celebrateFn, addXP, score]);

  /* ── handleSelect ──────────────────────────── */
  const handleSelect = useCallback((selected: number) => {
    // Double-click guard
    if (lockedRef.current) return;
    lockedRef.current = true;
    setIsLocked(true);

    // Click sound first
    play('click');

    const isCorrect = selected === targetNumber;

    if (isCorrect) {
      play('correct');
      triggerMascot('happy');
      addXP(XP_PER_CORRECT);
      setScore(prev => prev + 1);
      setFeedback({ type: 'correct', selected });
    } else {
      play('wrong');
      triggerMascot('encourage');
      setFeedback({ type: 'wrong', selected });
    }

    // After delay: next round or win
    timerRef.current = setTimeout(() => {
      if (currentRound < MAX_ROUNDS) {
        setCurrentRound(prev => prev + 1);
        generateRound();
      } else {
        handleGameWin();
      }
    }, 700);
  }, [targetNumber, currentRound, play, triggerMascot, addXP, generateRound, handleGameWin]);

  /* ── Win Screen ────────────────────────────── */
  if (showWin) {
    return (
      <div style={shellStyle}>
        <motion.div
          style={winCardStyle}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
            Great Job!
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px' }}>
            You got {score} out of {MAX_ROUNDS} right!
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={onExit} style={btnSecondaryStyle}>Back</button>
            {onNextGame && (
              <button onClick={onNextGame} style={btnPrimaryStyle}>Next Game ▶</button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Game UI ───────────────────────────────── */
  return (
    <div style={shellStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onExit} style={exitBtnStyle}>✕</button>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
          🔢 Tap the Number!
        </h2>
        <span style={roundBadgeStyle}>
          {currentRound}/{MAX_ROUNDS}
        </span>
      </div>

      {/* Progress bar */}
      <div style={progressTrackStyle}>
        <motion.div
          style={progressFillStyle}
          animate={{ width: `${(currentRound / MAX_ROUNDS) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
      </div>

      {/* Target prompt */}
      <motion.div
        key={currentRound}
        style={promptStyle}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>Find:</span>
        <span style={targetStyle}>{targetNumber}</span>
      </motion.div>

      {/* Options grid */}
      <div style={gridStyle}>
        {options.map((num, i) => {
          const colors = OPTION_COLORS[i % OPTION_COLORS.length];
          const isFeedbackTarget = feedback?.selected === num;
          const isCorrectOption = num === targetNumber;

          let borderColor = colors.border;
          if (feedback) {
            if (isFeedbackTarget && feedback.type === 'correct') borderColor = '#22c55e';
            else if (isFeedbackTarget && feedback.type === 'wrong') borderColor = '#ef4444';
            else if (feedback.type === 'wrong' && isCorrectOption) borderColor = '#22c55e';
          }

          return (
            <motion.button
              key={`${currentRound}-${num}-${i}`}
              onClick={() => handleSelect(num)}
              disabled={isLocked}
              style={{
                ...optionBtnStyle,
                background: colors.bg,
                borderColor,
                color: colors.text,
                opacity: isLocked && !isFeedbackTarget && !isCorrectOption ? 0.5 : 1,
              }}
              whileHover={!isLocked ? { scale: 1.06, y: -2 } : {}}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 250, damping: 20 }}
            >
              <span style={{ fontSize: '36px', fontWeight: 800 }}>{num}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Score bar */}
      <div style={scoreBarStyle}>
        <span>⭐ Score: {score}</span>
        <span>Round {currentRound} of {MAX_ROUNDS}</span>
      </div>
    </div>
  );
});

NumberTapStandalone.displayName = 'NumberTapStandalone';

/* ── Styles ──────────────────────────────────────── */

const shellStyle: React.CSSProperties = {
  maxWidth: 420,
  margin: '0 auto',
  padding: '16px',
  minHeight: '100%',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '8px',
};

const exitBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  cursor: 'pointer',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
  flexShrink: 0,
};

const roundBadgeStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#3f8f3a',
  background: '#eef2ff',
  padding: '3px 10px',
  borderRadius: '999px',
};

const progressTrackStyle: React.CSSProperties = {
  height: 4,
  borderRadius: 2,
  background: '#e5e7eb',
  marginBottom: 20,
  overflow: 'hidden',
};

const progressFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 2,
  background: 'linear-gradient(90deg, #8fcf94, #3f8f3a)',
};

const promptStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 24,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
};

const targetStyle: React.CSSProperties = {
  fontSize: '56px',
  fontWeight: 900,
  color: '#2f6f3a',
  lineHeight: 1.1,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  marginBottom: 20,
};

const optionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 90,
  borderRadius: 20,
  border: '3px solid',
  cursor: 'pointer',
  transition: 'border-color 0.15s ease',
  outline: 'none',
};

const scoreBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  fontWeight: 600,
  color: '#9ca3af',
  padding: '0 4px',
};

const winCardStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 24px',
  background: '#ffffff',
  borderRadius: 24,
  border: '1px solid #e5e7eb',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  marginTop: 40,
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: '10px 22px',
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #8fcf94, #3f8f3a)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: '10px 22px',
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  color: '#6b7280',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
};
