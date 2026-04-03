/**
 * 🎨 Color Match — Standalone Self-Contained Game
 * ==================================================
 * Fully self-managed state — zero dependency on GameContainer / GameEngine.
 *
 * Uses centralized child-system hooks directly:
 *   play()          — useSoundPlay    (click, correct, wrong, celebrate)
 *   triggerMascot() — useMascotTrigger (happy, encourage, celebrate)
 *   celebrate()     — useCelebrate    (confetti)
 *   addXP()         — useAddXP        (per-answer + bonus)
 *
 * Safety:
 *   • Double-click guard via ref (synchronous, never stale)
 *   • Sound always fires BEFORE state mutations
 *   • Single timer ref — cleaned up on unmount
 *   • No direct Audio instances
 *   • No array mutation (shuffleArray clones)
 *   • useEffect only for initial mount
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSoundPlay } from '../../child/SoundProvider';
import { useMascotTrigger } from '../../child/useMascotController';
import { useCelebrate } from '../../child/useCelebrationController';
import { useAddXP } from '../../child/XPProvider';

/* ── Constants ─────────────────────────────────── */

const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'] as const;
const MAX_ROUNDS = 5;

const COLOR_HEX: Record<string, string> = {
  Red:    '#ef4444',
  Blue:   '#3b82f6',
  Green:  '#22c55e',
  Yellow: '#eab308',
  Purple: '#7aa344',
  Orange: '#f97316',
};

function shuffleArray<T>(arr: readonly T[] | T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Props ─────────────────────────────────────── */

interface ColorMatchProps {
  onExit: () => void;
  onNextGame?: () => void;
}

/* ── Component ─────────────────────────────────── */

export const ColorMatchStandalone: React.FC<ColorMatchProps> = React.memo(({ onExit, onNextGame }) => {
  const play = useSoundPlay();
  const triggerMascot = useMascotTrigger();
  const celebrateFn = useCelebrate();
  const addXP = useAddXP();

  /* ── Game State ── */
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [targetColor, setTargetColor] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; color: string } | null>(null);
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
    const target = COLORS[Math.floor(Math.random() * COLORS.length)];
    const others = shuffleArray(COLORS.filter(c => c !== target)).slice(0, 3);
    setTargetColor(target);
    setOptions(shuffleArray([target, ...others]));
    setIsLocked(false);
    setFeedback(null);
    lockedRef.current = false;
  }, []);

  /* ── Mount → first round ── */
  useEffect(() => { generateRound(); }, [generateRound]);

  /* ── handleGameWin ─────────────────────────── */
  const handleGameWin = useCallback(() => {
    // ✅ Standard win order: sound → mascot → celebration → XP
    play('celebrate');
    triggerMascot('celebrate', 2500);
    celebrateFn('confetti');
    addXP(40);
    setShowWin(true);

    timerRef.current = setTimeout(() => {
      setShowWin(false);
      setCurrentRound(1);
      setScore(0);
      generateRound();
    }, 1500);
  }, [play, triggerMascot, celebrateFn, addXP, generateRound]);

  /* ── handleSelect ──────────────────────────── */
  const handleSelect = useCallback((color: string) => {
    // Double-click guard — ref is synchronous, never stale
    if (lockedRef.current) return;
    lockedRef.current = true;
    setIsLocked(true);

    // 🔊 Click sound FIRST — inside user-gesture context
    play('click');

    const isCorrect = color === targetColor;

    if (isCorrect) {
      play('correct');              // sound before state
      triggerMascot('happy');
      setScore(prev => prev + 1);
      setFeedback({ type: 'correct', color });
      addXP(10);                    // XP last
    } else {
      play('wrong');                // sound before state
      triggerMascot('encourage');
      setFeedback({ type: 'wrong', color });
    }

    timerRef.current = setTimeout(() => {
      if (currentRound < MAX_ROUNDS) {
        setCurrentRound(prev => prev + 1);
        generateRound();
      } else {
        handleGameWin();
      }
    }, 700);
  }, [targetColor, currentRound, play, triggerMascot, addXP, generateRound, handleGameWin]);

  /* ═══════════════════════════════════════════
     ██ RENDER
     ═══════════════════════════════════════════ */

  /* ── Win Screen ── */
  if (showWin) {
    return (
      <motion.div
        className="bg-white/80 backdrop-blur-2xl border border-white/40 p-10 rounded-[24px] text-center max-w-md mx-auto shadow-2xl"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <motion.span
          className="text-7xl block mb-4"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🏆
        </motion.span>
        <h2 className="text-3xl font-black text-gray-800 mb-2">Amazing!</h2>
        <p className="text-lg text-amber-500 mb-1">
          You scored <span className="font-black text-gray-800">{score}/{MAX_ROUNDS}</span>
        </p>
        <div className="inline-flex items-center gap-1 bg-amber-100/70 px-4 py-2 rounded-xl mt-2">
          <span className="text-amber-500">✨</span>
          <span className="font-bold text-amber-600 text-sm">+40 Bonus XP</span>
        </div>
        <div className="flex gap-3 mt-6 justify-center">
          <motion.button
            onClick={() => { play('click'); onExit(); }}
            className="px-5 py-2.5 rounded-xl bg-gray-100/60 text-gray-500 font-bold text-sm hover:bg-gray-200/60 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            Back to Arcade
          </motion.button>
          {onNextGame && (
            <motion.button
              onClick={() => { play('click'); onNextGame(); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-200/40"
              whileTap={{ scale: 0.95 }}
            >
              Next Game ▶
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  /* ── Game Board ── */
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/75 backdrop-blur-2xl border border-white/40 p-8 sm:p-10 rounded-[24px] text-center relative overflow-hidden shadow-xl">
        {/* Gradient blob */}
        <div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ backgroundColor: COLOR_HEX[targetColor] || '#7aa344' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <motion.button
            onClick={() => { play('click'); onExit(); }}
            className="w-10 h-10 rounded-xl bg-gray-100/60 hover:bg-gray-200/60 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors text-lg"
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
          <h1 className="text-base font-black text-gray-800">🎨 Match the Color!</h1>
          <div className="w-10" />
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100/60 rounded-full mb-5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500"
            initial={false}
            animate={{ width: `${(currentRound / MAX_ROUNDS) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </div>

        {/* Round + Score */}
        <div className="flex items-center justify-between mb-6 text-sm relative z-10">
          <span className="font-bold text-gray-800">Round {currentRound} / {MAX_ROUNDS}</span>
          <span className="font-bold text-amber-500">⭐ {score}</span>
        </div>

        {/* Target Color Display */}
        <motion.div
          key={`target-${currentRound}`}
          className="mb-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Find this color
          </p>
          <motion.div
            className="inline-flex items-center justify-center w-28 h-28 rounded-3xl border-4 border-white/60 shadow-xl"
            style={{ backgroundColor: COLOR_HEX[targetColor] }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <p className="text-2xl font-black text-gray-800 mt-3">{targetColor}</p>
        </motion.div>

        {/* Color Option Buttons */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          {options.map((color, i) => {
            const isSelected    = feedback?.color === color;
            const isCorrectColor = color === targetColor;
            const showCorrect   = feedback && isSelected && feedback.type === 'correct';
            const showWrongSel  = feedback && isSelected && feedback.type === 'wrong';
            const revealCorrect = feedback?.type === 'wrong' && isCorrectColor && !isSelected;

            return (
              <motion.button
                key={`${currentRound}-${color}`}
                onClick={() => handleSelect(color)}
                disabled={isLocked}
                className={`relative px-4 py-5 rounded-2xl font-bold text-base text-white shadow-md transition-shadow ${
                  showCorrect
                    ? 'ring-4 ring-green-400 shadow-green-200/60'
                    : showWrongSel
                      ? 'ring-4 ring-red-400 shadow-red-200/60 brightness-75'
                      : revealCorrect
                        ? 'ring-3 ring-green-400/50'
                        : isLocked
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:shadow-lg'
                }`}
                style={{ backgroundColor: COLOR_HEX[color] }}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  x: showWrongSel ? [0, -6, 6, -4, 4, 0] : 0,
                  scale: showCorrect ? [1, 1.1, 1] : 1,
                }}
                transition={
                  showWrongSel
                    ? { duration: 0.4 }
                    : { delay: i * 0.05, type: 'spring', stiffness: 300 }
                }
                whileHover={!isLocked ? { scale: 1.06, y: -3 } : {}}
                whileTap={!isLocked ? { scale: 0.93 } : {}}
              >
                <span className="drop-shadow-sm">{color}</span>
                {showCorrect && (
                  <motion.span
                    className="absolute top-1.5 right-2.5 text-sm"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    ✅
                  </motion.span>
                )}
                {showWrongSel && (
                  <motion.span
                    className="absolute top-1.5 right-2.5 text-sm"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    ❌
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ColorMatchStandalone.displayName = 'ColorMatchStandalone';
