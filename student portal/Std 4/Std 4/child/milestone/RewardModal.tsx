/**
 * child/milestone/RewardModal.tsx
 * ─────────────────────────────────────────────────────
 * Premium AAA Reward Chest Modal — cinematic treasure reveal.
 *
 * Sequence:
 *  1. Backdrop blur in
 *  2. Chest drops from top with bounce (0→0.4s)
 *  3. Chest shakes (0.4→1.0s)
 *  4. Glow burst (1.0s)
 *  5. Chest opens → reward icon springs out
 *  6. Star particle explosion (radial burst)
 *  7. Confetti rain from top
 *  8. Soft magical chime sound
 *  9. Card reveals with reward details
 *
 * GPU-accelerated, cubic-bezier, no jitter.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LevelView } from './useLevelEngine';

interface Props {
  level: LevelView | null;
  onDismiss: () => void;
  celebrate?: (kind: 'confetti' | 'level') => void;
  triggerMascot?: (
    state: 'happy' | 'excited' | 'celebrate',
    duration?: number,
  ) => void;
  playSound?: (kind: 'celebrate' | 'level') => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/* ═══════════════════════════════════════════════════
   REWARD SOUNDS (Web Audio — self-contained, low volume)
   ═══════════════════════════════════════════════════ */

class RewardSounds {
  private ctx: AudioContext | null = null;
  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /** Magical chime — ascending arpeggio */
  playChestOpen() {
    try {
      const ctx = this.getCtx();
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.6);
      });
    } catch {}
  }

  /** Victory fanfare — triumphant sweep */
  playVictory() {
    try {
      const ctx = this.getCtx();
      const notes = [392, 523, 659, 784, 1047, 1319]; // G4 C5 E5 G5 C6 E6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.9);
      });
    } catch {}
  }

  /** Star sparkle — quick high shimmer */
  playSparkle() {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  dispose() { this.ctx?.close(); }
}

/* ═══════════════════════════════════════════════════
   STAR EXPLOSION — radial burst of star particles
   ═══════════════════════════════════════════════════ */

const StarExplosion: React.FC<{ count: number }> = ({ count }) => (
  <>
    {Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const dist = 80 + Math.random() * 60;
      const emoji = ['⭐', '🌟', '✨', '💫', '⭐', '🌟'][i % 6];
      return (
        <motion.span
          key={`star-exp-${i}`}
          className="absolute text-xl pointer-events-none select-none"
          style={{ left: '50%', top: '35%', willChange: 'transform, opacity' }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            opacity: [1, 1, 0],
            scale: [0, 1.4, 0],
            rotate: 360,
          }}
          transition={{ duration: 1.2, delay: 0.05 * i, ease: 'easeOut' }}
        >
          {emoji}
        </motion.span>
      );
    })}
  </>
);

/* ═══════════════════════════════════════════════════
   CONFETTI RAIN — gentle falling confetti particles
   ═══════════════════════════════════════════════════ */

const ConfettiRain: React.FC<{ count: number }> = ({ count }) => (
  <>
    {Array.from({ length: count }, (_, i) => {
      const x = (i * 37 + 11) % 100;
      const size = 8 + (i % 4) * 3;
      const colors = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#ef4444'];
      const color = colors[i % colors.length];
      return (
        <motion.div
          key={`conf-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: `${x}%`,
            top: '-3%',
            width: size,
            height: size * 0.6,
            borderRadius: '2px',
            background: color,
            willChange: 'transform, opacity',
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: ['0%', '110vh'],
            opacity: [0, 1, 1, 0],
            rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
            x: [0, (i % 2 === 0 ? 30 : -30)],
          }}
          transition={{
            duration: 2.5 + (i % 5) * 0.3,
            delay: i * 0.06,
            ease: 'easeIn',
          }}
        />
      );
    })}
  </>
);

/* ═══════════════════════════════════════════════════
   GLOW BURST — radial light flash
   ═══════════════════════════════════════════════════ */

const GlowBurst: React.FC = () => (
  <motion.div
    className="absolute pointer-events-none"
    style={{
      left: '50%',
      top: '30%',
      width: 300,
      height: 300,
      marginLeft: -150,
      marginTop: -150,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,215,0,0.2) 30%, transparent 70%)',
      willChange: 'transform, opacity',
    }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [0, 1.6, 1.2], opacity: [0, 1, 0] }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
  />
);

/* ═══════════════════════════════════════════════════
   CHEST ICON — animated treasure chest
   ═══════════════════════════════════════════════════ */

const ChestSequence: React.FC<{
  rewardIcon: string;
  isBoss: boolean;
  onOpened: () => void;
}> = ({ rewardIcon, isBoss, onOpened }) => {
  const [phase, setPhase] = useState<'drop' | 'shake' | 'burst' | 'reveal'>('drop');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('shake'), 400);
    const t2 = setTimeout(() => setPhase('burst'), 1000);
    const t3 = setTimeout(() => { setPhase('reveal'); onOpened(); }, 1250);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onOpened]);

  return (
    <div className="relative flex items-center justify-center" style={{ height: 120 }}>
      {/* Glow burst on open */}
      {phase === 'burst' && <GlowBurst />}

      {/* Chest / Reward icon */}
      <motion.span
        className="text-7xl block select-none"
        style={{ willChange: 'transform' }}
        initial={{ y: -200, opacity: 0, scale: 0.5 }}
        animate={
          phase === 'drop'
            ? { y: 0, opacity: 1, scale: 1, rotate: 0 }
            : phase === 'shake'
              ? {
                  y: 0, opacity: 1, scale: 1,
                  rotate: [0, -8, 8, -6, 6, -4, 4, 0],
                  x: [0, -4, 4, -3, 3, -2, 2, 0],
                }
              : phase === 'burst'
                ? { y: 0, opacity: 1, scale: [1, 1.4, 0], rotate: 0 }
                : { y: 0, opacity: 0, scale: 0 }
        }
        transition={
          phase === 'drop'
            ? { type: 'spring', stiffness: 300, damping: 15 }
            : phase === 'shake'
              ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.25, ease: 'easeIn' }
        }
      >
        {isBoss ? '👑' : '🎁'}
      </motion.span>

      {/* Revealed reward icon */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.span
            className="absolute text-7xl select-none"
            style={{ willChange: 'transform' }}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
          >
            {rewardIcon}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════ */

const RewardModal: React.FC<Props> = ({
  level,
  onDismiss,
  celebrate,
  triggerMascot,
  playSound,
}) => {
  const isBoss = level?.type === 'boss';
  const soundsRef = useRef<RewardSounds | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showStars, setShowStars] = useState(false);

  // Initialize sounds
  useEffect(() => {
    soundsRef.current = new RewardSounds();
    return () => { soundsRef.current?.dispose(); soundsRef.current = null; };
  }, []);

  // Reset state when level changes
  useEffect(() => {
    if (level) {
      setShowCard(false);
      setShowConfetti(false);
      setShowStars(false);
    }
  }, [level?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire celebration effects once on mount
  useEffect(() => {
    if (!level) return;
    try {
      if (isBoss) {
        celebrate?.('level');
        triggerMascot?.('celebrate', 4000);
        playSound?.('level');
      } else {
        celebrate?.('confetti');
        triggerMascot?.('excited', 3000);
        playSound?.('celebrate');
      }
    } catch { /* swallow – effects are non-critical */ }
  }, [level?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // When chest opens → trigger reveals
  const handleChestOpened = useCallback(() => {
    setShowStars(true);
    setShowConfetti(true);
    if (isBoss) {
      soundsRef.current?.playVictory();
    } else {
      soundsRef.current?.playChestOpen();
    }
    setTimeout(() => soundsRef.current?.playSparkle(), 300);
    setTimeout(() => setShowCard(true), 500);
  }, [isBoss]);

  return (
    <AnimatePresence>
      {level && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ willChange: 'opacity' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: isBoss
                ? 'radial-gradient(circle at center, rgba(255,215,0,0.15) 0%, rgba(0,0,0,0.5) 100%)'
                : 'radial-gradient(circle at center, rgba(168,85,247,0.1) 0%, rgba(0,0,0,0.45) 100%)',
            }}
            onClick={showCard ? onDismiss : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Confetti rain */}
          <AnimatePresence>
            {showConfetti && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-[201]">
                <ConfettiRain count={isBoss ? 40 : 24} />
              </div>
            )}
          </AnimatePresence>

          {/* Star explosion */}
          <AnimatePresence>
            {showStars && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-[202]">
                <StarExplosion count={isBoss ? 16 : 10} />
              </div>
            )}
          </AnimatePresence>

          {/* Main content */}
          <div className="relative z-[203] flex flex-col items-center max-w-sm w-full">
            {/* Chest animation sequence */}
            <ChestSequence
              rewardIcon={level.reward.icon}
              isBoss={isBoss}
              onOpened={handleChestOpened}
            />

            {/* Card reveals after chest opens */}
            <AnimatePresence>
              {showCard && (
                <motion.div
                  className={`w-full rounded-3xl p-6 pt-4 text-center overflow-hidden mt-4 ${
                    isBoss
                      ? 'bg-gradient-to-b from-amber-50 via-yellow-50 to-white border-2 border-yellow-300'
                      : 'bg-white/95 border border-white/60'
                  }`}
                  style={{
                    willChange: 'transform, opacity',
                    boxShadow: isBoss
                      ? '0 8px 24px rgba(255,215,0,0.15), 0 12px 28px rgba(0,0,0,0.1)'
                      : '0 8px 24px rgba(168,85,247,0.1), 0 12px 28px rgba(0,0,0,0.08)',
                  }}
                  initial={{ scale: 0.4, y: 30, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                >
                  {/* Boss golden shimmer */}
                  {isBoss && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, transparent 50%, rgba(255,215,0,0.15) 100%)',
                      }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}

                  {/* Congrats */}
                  <motion.h2
                    className={`text-2xl font-extrabold mb-1 ${
                      isBoss ? 'text-amber-600' : 'text-purple-600'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {isBoss ? '🏆 BOSS DEFEATED!' : '🎉 Amazing Job!'}
                  </motion.h2>

                  <motion.p
                    className="text-gray-600 text-sm mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    You completed{' '}
                    <span className="font-bold text-gray-800">{level.title}</span>!
                  </motion.p>

                  {/* Reward box */}
                  <motion.div
                    className={`rounded-2xl p-4 mb-4 ${
                      isBoss
                        ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200'
                        : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100'
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25, type: 'spring', stiffness: 300 }}
                  >
                    <motion.span
                      className="text-4xl block mb-2"
                      animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                    >
                      {level.reward.icon}
                    </motion.span>
                    <p className="text-sm font-bold text-gray-700 mb-0.5">
                      {level.reward.label}
                    </p>
                    <p className="text-xs text-gray-500 italic">
                      {level.reward.magicText}
                    </p>
                  </motion.div>

                  {/* Dismiss button */}
                  <motion.button
                    onClick={onDismiss}
                    className={`w-full rounded-xl py-3.5 font-bold text-white text-lg shadow-lg transition-all ${
                      isBoss
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600'
                        : 'bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600'
                    }`}
                    style={{
                      boxShadow: isBoss
                        ? '0 4px 12px rgba(245,158,11,0.2)'
                        : '0 4px 12px rgba(168,85,247,0.15)',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {isBoss ? '👑 Onward!' : '✨ Yay!'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(RewardModal);
