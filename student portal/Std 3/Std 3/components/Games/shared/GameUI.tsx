/**
 * 🎨 Shared Game UI Components
 * ================================
 * Reusable UI blocks used by every game:
 * - RoundProgress bar
 * - GameOverScreen with stats
 * - XP fly animation
 * - FeedbackOverlay (correct/wrong)
 * - GameHeader with exit + progress
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getElapsedSeconds, getAccuracy } from './useGameReducer';

// ─── Round Progress Bar ───────────────────────────────────

interface RoundProgressProps {
  currentRound: number;
  totalRounds: number;
  score: number;
  results?: Array<boolean | null>;
}

export const RoundProgress: React.FC<RoundProgressProps> = React.memo(({ currentRound, totalRounds, score, results }) => (
  <div className="flex items-center gap-1.5 w-full">
    {Array.from({ length: totalRounds }, (_, i) => {
      const roundNum = i + 1;
      const isCurrent = roundNum === currentRound;
      const result = results?.[i] ?? null;
      const isPast = roundNum < currentRound;
      const isCorrect = result === true || (!results && isPast && i < score);
      const isWrong = result === false || (!results && isPast && i >= score);

      return (
        <motion.div
          key={i}
          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
            isCurrent
              ? 'bg-blue-400 shadow-sm shadow-blue-400/40'
              : isCorrect
              ? 'bg-green-400'
              : isWrong
              ? 'bg-red-300'
              : 'bg-gray-200/60'
          }`}
          animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
          transition={isCurrent ? { duration: 1.5, repeat: Infinity } : {}}
        />
      );
    })}
    <span className="text-[10px] font-bold text-gray-400 ml-1 tabular-nums">
      {currentRound}/{totalRounds}
    </span>
  </div>
));
RoundProgress.displayName = 'RoundProgress';

// ─── Feedback Overlay ─────────────────────────────────────

interface FeedbackOverlayProps {
  type: 'correct' | 'wrong';
  correctAnswer?: string;
}

export const FeedbackOverlay: React.FC<FeedbackOverlayProps> = React.memo(({ type, correctAnswer }) => (
  <motion.div
    className={`absolute inset-0 z-20 rounded-3xl flex items-center justify-center pointer-events-none ${
      type === 'correct'
        ? 'bg-green-500/10 border-2 border-green-400/30'
        : 'bg-amber-500/10 border-2 border-amber-400/30'
    }`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    <motion.div
      className="text-center"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <span className="text-4xl block mb-1">{type === 'correct' ? '✅' : '💡'}</span>
      <span className={`text-sm font-bold ${type === 'correct' ? 'text-green-600' : 'text-amber-600'}`}>
        {type === 'correct' ? 'Correct!' : correctAnswer ? `It's ${correctAnswer}!` : 'Try again!'}
      </span>
    </motion.div>
  </motion.div>
));
FeedbackOverlay.displayName = 'FeedbackOverlay';

// ─── XP Fly Animation ────────────────────────────────────

export const XPFly: React.FC<{ show: boolean; amount?: number }> = React.memo(({ show, amount = 20 }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
        initial={{ opacity: 1, y: 40, scale: 0.5 }}
        animate={{ opacity: 0, y: -30, scale: 1.3 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-4 py-2 rounded-2xl shadow-xl shadow-yellow-500/30">
          <span className="text-white font-black text-sm">+{amount} XP ⭐</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
));
XPFly.displayName = 'XPFly';

// ─── Game Over Screen ─────────────────────────────────────

interface GameOverProps {
  score: number;
  totalRounds: number;
  xpEarned: number;
  startTime: number;
  onPlayAgain: () => void;
  onExit: () => void;
  onNextGame?: () => void;
  gameTitle: string;
  gameIcon: string;
}

export const GameOverScreen: React.FC<GameOverProps> = ({
  score, totalRounds, xpEarned, startTime,
  onPlayAgain, onExit, onNextGame, gameTitle, gameIcon,
}) => {
  const elapsed = getElapsedSeconds(startTime);
  const accuracy = getAccuracy(score, totalRounds);
  const perfect = score === totalRounds;
  const great = score >= Math.ceil(totalRounds * 0.6);

  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 600);
    const t3 = setTimeout(() => setPhase(3), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Fun messages based on score
  const getMessage = () => {
    if (perfect) return { title: 'PERFECT SCORE! 🏆', sub: 'You got every single one right!', emoji: '🏆' };
    if (accuracy >= 80) return { title: 'Amazing Work! 🌟', sub: 'You\'re a superstar learner!', emoji: '🌟' };
    if (great) return { title: 'Great Job! ⭐', sub: 'Keep up the awesome work!', emoji: '⭐' };
    return { title: 'Well Done! 💪', sub: 'Practice makes perfect!', emoji: '🎯' };
  };
  const msg = getMessage();

  // Star rating (1-3)
  const stars = perfect ? 3 : great ? 2 : 1;

  return (
    <motion.div
      className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[24px] p-8 text-center overflow-hidden shadow-2xl"
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
    >
      {/* Background celebration gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${
        perfect ? 'from-yellow-100/40 via-amber-50/20 to-orange-100/30' 
        : great ? 'from-blue-100/30 via-purple-50/20 to-cyan-100/30'
        : 'from-green-100/30 via-emerald-50/20 to-teal-100/30'
      } rounded-[24px] pointer-events-none`} />

      {/* Floating celebration emojis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['🎉', '✨', '🌈', '💫', '🎊', '⭐'].map((e, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl opacity-0"
            style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={phase >= 1 ? {
              opacity: [0, 0.3, 0.15],
              y: [20, -10, 0],
              rotate: [0, 15, -10],
              scale: [0.5, 1.1, 0.9],
            } : {}}
            transition={{ delay: i * 0.12, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          >
            {e}
          </motion.span>
        ))}
      </div>

      {/* Trophy / Medal with animated entrance */}
      <motion.div
        className="relative z-10 mb-2"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
      >
        <motion.span
          className="text-7xl inline-block"
          animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {msg.emoji}
        </motion.span>
      </motion.div>

      {/* Star rating */}
      <motion.div
        className="flex justify-center gap-1.5 mb-3 relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        {[1, 2, 3].map(s => (
          <motion.span
            key={s}
            className={`text-3xl ${s <= stars ? '' : 'grayscale opacity-30'}`}
            initial={{ scale: 0, rotate: -180 }}
            animate={phase >= 1 ? { scale: 1, rotate: 0 } : {}}
            transition={{ delay: 0.15 + s * 0.15, type: 'spring', stiffness: 400 }}
          >
            ⭐
          </motion.span>
        ))}
      </motion.div>

      {/* Title & subtitle */}
      <motion.h2
        className={`text-2xl font-black mb-1 relative z-10 ${
          perfect ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent'
          : 'text-blue-900'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {msg.title}
      </motion.h2>
      <motion.p
        className="text-sm text-blue-400 mb-1 relative z-10"
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : {}}
        transition={{ delay: 0.35 }}
      >
        {msg.sub}
      </motion.p>
      <motion.p
        className="text-xs text-gray-400 mb-5 relative z-10"
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : {}}
        transition={{ delay: 0.4 }}
      >
        {gameIcon} {gameTitle} Complete
      </motion.p>

      {/* Stats grid */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-6 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <StatCard icon="🎯" label="Score" value={`${score}/${totalRounds}`} />
            <StatCard icon="📊" label="Accuracy" value={`${accuracy}%`} />
            <StatCard icon="⏱️" label="Time" value={`${elapsed}s`} />
            <StatCard icon="⭐" label="XP Earned" value={`+${xpEarned}`} highlight />
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP Banner */}
      <AnimatePresence>
        {phase >= 2 && xpEarned > 0 && (
          <motion.div
            className="mb-5 relative z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 px-5 py-2.5 rounded-2xl shadow-lg shadow-amber-500/25">
              <motion.span
                className="text-xl"
                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ✨
              </motion.span>
              <span className="text-white font-black text-lg">+{xpEarned} XP</span>
              <motion.span
                className="text-xl"
                animate={{ rotate: [0, -20, 20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              >
                ✨
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encouragement message */}
      {phase >= 3 && !perfect && (
        <motion.p
          className="text-xs text-gray-400 mb-4 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          💡 Tip: Play again to beat your score and earn more XP!
        </motion.p>
      )}

      {/* Action buttons */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto relative z-10"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={onPlayAgain}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg shadow-blue-500/25 text-sm hover:shadow-xl hover:shadow-blue-500/30 transition-shadow"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              🔄 Play Again
            </motion.button>
            {onNextGame && (
              <motion.button
                onClick={onNextGame}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg shadow-purple-500/25 text-sm hover:shadow-xl hover:shadow-purple-500/30 transition-shadow"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                <motion.span
                  className="inline-block"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  ▶
                </motion.span>{' '}
                Next Game
              </motion.button>
            )}
            <motion.button
              onClick={onExit}
              className="flex-1 bg-gray-100/60 text-gray-500 font-bold py-3.5 px-5 rounded-2xl text-sm hover:bg-gray-200/60 transition-colors"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              🏠 Menu
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

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
      <span className={`text-lg font-black block ${highlight ? 'text-amber-600' : 'text-blue-900'}`}>{value}</span>
      <span className="text-[9px] font-bold text-gray-400 uppercase">{label}</span>
    </motion.div>
  )
);
StatCard.displayName = 'StatCard';

// ─── Game Header ──────────────────────────────────────────

interface GameHeaderProps {
  title: string;
  icon: string;
  onExit: () => void;
  round: number;
  totalRounds: number;
  score: number;
  results?: Array<boolean | null>;
}

export const GameHeader: React.FC<GameHeaderProps> = React.memo(({ title, icon, onExit, round, totalRounds, score, results }) => (
  <div className="mb-5">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2 className="text-lg font-black text-blue-900">{title}</h2>
      </div>
      <motion.button
        onClick={onExit}
        className="text-gray-300 hover:text-gray-500 text-sm font-bold px-3 py-1.5 rounded-xl hover:bg-gray-100/40 transition-colors"
        whileTap={{ scale: 0.9 }}
      >
        ✕ Exit
      </motion.button>
    </div>
    <RoundProgress currentRound={round} totalRounds={totalRounds} score={score} results={results} />
  </div>
));
GameHeader.displayName = 'GameHeader';
