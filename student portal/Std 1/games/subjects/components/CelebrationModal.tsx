/**
 * CelebrationModal – Unified completion celebration
 * ===================================================
 * Matches the shared GameOverScreen styling from the core arcade:
 * - Star rating, stat cards, gradient XP banner
 * - Floating celebration emojis, animated hero trophy
 * - Uses ConfettiEffect (shared component) instead of raw canvas-confetti
 * - Glassmorphism card shell with backdrop blur
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Difficulty, DIFF_META, BADGE_DEFS } from '../engine/types';
import { ConfettiEffect } from '../../../components/ui/ConfettiEffect';

interface Props {
  show: boolean;
  miniLevel: number;
  score: number;
  total: number;
  xpEarned: number;
  difficulty: Difficulty;
  isRetryRound?: boolean;
  isDifficultyComplete?: boolean;
  newBadge?: string | null;
  onContinue: () => void;
}

const CELEBRATION_EMOJIS = ['🎉', '✨', '🌈', '💫', '🎊', '⭐'];

/** Stat card (matches shared GameOverScreen StatCard) */
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

export const CelebrationModal: React.FC<Props> = React.memo(({
  show, miniLevel, score, total, xpEarned, difficulty,
  isRetryRound, isDifficultyComplete, newBadge, onContinue,
}) => {
  const meta = DIFF_META[difficulty];
  const perfect = score === total;
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
  const great = score >= Math.ceil(total * 0.6);
  const [phase, setPhase] = useState(0);

  // Star rating (1-3) – same logic as GameOverScreen
  const stars = perfect ? 3 : great ? 2 : 1;

  useEffect(() => {
    if (!show) { setPhase(0); return; }
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 600);
    const t3 = setTimeout(() => setPhase(3), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [show]);

  // Fun messages based on score (matches GameOverScreen)
  const getMessage = () => {
    if (isDifficultyComplete && perfect) return { title: 'PERFECT CLEAR! 🏆', sub: 'You mastered every single question!', emoji: '🏆' };
    if (isDifficultyComplete) return { title: 'Difficulty Complete! 🌟', sub: 'Amazing work, champion!', emoji: '🌟' };
    if (isRetryRound)         return { title: 'Retry Complete! 💪', sub: 'Great job reviewing!', emoji: '🎯' };
    if (perfect)              return { title: 'PERFECT SCORE! 🏆', sub: 'You got every single one right!', emoji: '🏆' };
    if (accuracy >= 80)       return { title: 'Amazing Work! 🌟', sub: 'You\'re a superstar learner!', emoji: '🌟' };
    if (great)                return { title: 'Great Job! ⭐', sub: 'Keep up the awesome work!', emoji: '⭐' };
    return { title: 'Well Done! 💪', sub: 'Practice makes perfect!', emoji: '🎯' };
  };
  const msg = getMessage();

  const badge = newBadge ? BADGE_DEFS[newBadge as keyof typeof BADGE_DEFS] : null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Confetti (shared component) */}
          <ConfettiEffect trigger={true} />

          <motion.div
            className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[24px] p-8 max-w-sm w-full shadow-2xl overflow-hidden text-center"
            initial={{ scale: 0.6, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.6, y: 40 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            {/* Background celebration gradient (matches GameOverScreen) */}
            <div className={`absolute inset-0 bg-gradient-to-br ${
              perfect ? 'from-yellow-100/40 via-amber-50/20 to-orange-100/30'
              : great ? 'from-blue-100/30 via-purple-50/20 to-cyan-100/30'
              : 'from-green-100/30 via-emerald-50/20 to-teal-100/30'
            } rounded-[24px] pointer-events-none`} />

            {/* Floating celebration emojis (same as GameOverScreen) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {CELEBRATION_EMOJIS.map((e, i) => (
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

            {/* Hero emoji (animated entrance like GameOverScreen) */}
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

            {/* Star rating (same as GameOverScreen) */}
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
                : 'text-gray-800'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {msg.title}
            </motion.h2>
            <motion.p
              className="text-sm text-gray-400 mb-1 relative z-10"
              initial={{ opacity: 0 }}
              animate={phase >= 1 ? { opacity: 1 } : {}}
              transition={{ delay: 0.35 }}
            >
              {msg.sub}
            </motion.p>

            {/* Level info */}
            {!isRetryRound && !isDifficultyComplete && (
              <motion.p
                className="text-xs text-gray-400 mb-4 relative z-10"
                initial={{ opacity: 0 }}
                animate={phase >= 1 ? { opacity: 1 } : {}}
                transition={{ delay: 0.4 }}
              >
                {meta.emoji} Level {miniLevel} Complete
              </motion.p>
            )}

            {/* Stats grid (matches GameOverScreen) */}
            <AnimatePresence>
              {phase >= 2 && (
                <motion.div
                  className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-5 relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <StatCard icon="🎯" label="Score" value={`${score}/${total}`} />
                  <StatCard icon="📊" label="Accuracy" value={`${accuracy}%`} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* XP Banner (matches GameOverScreen gradient style) */}
            <AnimatePresence>
              {phase >= 2 && xpEarned > 0 && (
                <motion.div
                  className="mb-4 relative z-10"
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
                  <span className="text-xs font-black text-amber-700 uppercase tracking-wider">
                    {badge.title} Unlocked!
                  </span>
                </div>
              </motion.div>
            )}

            {/* Next level hint */}
            {phase >= 3 && !isDifficultyComplete && !isRetryRound && miniLevel < 5 && (
              <motion.p
                className="text-xs text-gray-400 mb-3 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Level {miniLevel + 1} unlocked! 🔓
              </motion.p>
            )}

            {/* Tip for imperfect scores */}
            {phase >= 3 && !perfect && !isDifficultyComplete && !isRetryRound && (
              <motion.p
                className="text-xs text-gray-400 mb-3 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                💡 Tip: Wrong answers move to a retry round at the end!
              </motion.p>
            )}

            {/* Continue button */}
            <AnimatePresence>
              {phase >= 3 && (
                <motion.button
                  onClick={onContinue}
                  className={`w-full py-3.5 rounded-2xl font-bold text-white text-base shadow-lg active:scale-95 transition-transform relative z-10
                    bg-gradient-to-r ${
                      isDifficultyComplete
                        ? 'from-amber-500 to-orange-500 shadow-amber-500/25'
                        : `${meta.gradient} shadow-amber-500/25`
                    }`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {isDifficultyComplete ? '🏠 Back to Menu' : isRetryRound ? '🎉 Done!' : 'Continue ▶'}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CelebrationModal.displayName = 'CelebrationModal';
