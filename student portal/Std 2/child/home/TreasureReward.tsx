/**
 * child/home/TreasureReward.tsx
 * ─────────────────────────────────────────────────────
 * Premium Daily Treasure Chest — 3D styled, hover tilt,
 * click bounce + sparkle burst.
 *
 * Click → lid opens → reward floats up → sparkle ring → sound.
 * Once-per-day, persisted in localStorage.
 *
 * Performance: transform + opacity only. React.memo + useCallback.
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundPlay } from '../SoundProvider';
import { useAddXP } from '../XPProvider';
import { useCelebrate } from '../useCelebrationController';
import { useMascotTrigger } from '../useMascotController';

/* ── Design tokens ──────────────────────────────── */

const T = {
  primary: '#48cae4',
  secondary: '#72efdd',
  success: '#80ed99',
  warning: '#90dbf4',
  textPrimary: '#023047',
  textSecondary: '#0b3c5d',
  textBody: '#245b74',
} as const;

/* ── Storage ─────────────────────────────────────── */

const STORAGE_KEY = 'ssms_treasure_chest';

function getTodayKey(): string { return new Date().toISOString().split('T')[0]; }
function hasClaimedToday(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === getTodayKey(); } catch { return false; }
}
function markClaimed(): void {
  try { localStorage.setItem(STORAGE_KEY, getTodayKey()); } catch { /* */ }
}
function getRandomXP(): number { return Math.floor(Math.random() * 16) + 5; }

/* ── Rewards ─────────────────────────────────────── */

const REWARDS = [
  { emoji: '💎', label: 'Diamond' },
  { emoji: '⭐', label: 'Star' },
  { emoji: '🌟', label: 'Bright Star' },
  { emoji: '🪙', label: 'Gold Coin' },
  { emoji: '🎯', label: 'Bullseye' },
  { emoji: '🧩', label: 'Puzzle Piece' },
];

/* ── Sparkle Burst (small, no blur) ──────────────── */

const SparkleRing: React.FC = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none">
    {Array.from({ length: 10 }, (_, i) => {
      const angle = (i * 36) * Math.PI / 180;
      const dist = 38 + (i % 3) * 14;
      const colors = [T.primary, T.secondary, T.success, T.warning, '#90dbf4', '#dff6ff', '#b2f7ef', '#a0e9ff', '#c7f9ff', '#e0fbfc'];
      return (
        <motion.div
          key={i}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: 5, height: 5, borderRadius: '50%',
            background: colors[i], pointerEvents: 'none',
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            scale: [0, 1.5, 0],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.8, delay: 0.2 + i * 0.04, ease: 'easeOut' }}
        />
      );
    })}
  </div>
));
SparkleRing.displayName = 'SparkleRing';

/* ── Main Component ──────────────────────────────── */

export const TreasureReward: React.FC = React.memo(() => {
  const play = useSoundPlay();
  const addXP = useAddXP();
  const celebrate = useCelebrate();
  const triggerMascot = useMascotTrigger();

  const [claimed, setClaimed] = useState(hasClaimedToday);
  const [phase, setPhase] = useState<'idle' | 'opening' | 'reveal' | 'done'>('idle');
  const [reward, setReward] = useState<{ emoji: string; label: string; xp: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { if (claimed) setPhase('done'); }, [claimed]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleOpen = useCallback(() => {
    if (claimed || phase !== 'idle') return;
    play('celebrate');
    setPhase('opening');

    timerRef.current = setTimeout(() => {
      const xp = getRandomXP();
      const r = REWARDS[Math.floor(Math.random() * REWARDS.length)];
      setReward({ ...r, xp });
      setPhase('reveal');
      addXP(xp);
      celebrate('confetti');
      triggerMascot('celebrate', 2000);
      markClaimed();
      setClaimed(true);
      timerRef.current = setTimeout(() => setPhase('done'), 2500);
    }, 600);
  }, [claimed, phase, play, addXP, celebrate, triggerMascot]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span style={{ fontSize: 20 }}>🎁</span>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: T.textPrimary }}>
          Daily Treasure
        </h2>
      </div>

      {/* Chest card — premium elevated */}
      <motion.div
        className="relative overflow-hidden"
        style={{
          padding: phase === 'done' && !reward ? '24px 28px' : '30px 28px',
          borderRadius: 28,
          background: phase === 'done'
            ? 'linear-gradient(145deg, #dff6ff 0%, #c7f9ff 60%, #e0fbfc 100%)'
            : 'linear-gradient(145deg, #dff6ff 0%, #b2f7ef 52%, #e0fbfc 100%)',
          boxShadow: '0 12px 30px rgba(0, 150, 199, 0.14)',
          border: `1.5px solid ${phase === 'done' ? 'rgba(144,219,244,0.28)' : 'rgba(144,219,244,0.36)'}`,
        }}
        whileHover={phase === 'idle' ? { rotateY: 2, rotateX: -1, transition: { duration: 0.3 } } : undefined}
      >
        {/* Sparkle ring on reveal */}
        <AnimatePresence>
          {phase === 'reveal' && <SparkleRing />}
        </AnimatePresence>

        {phase === 'done' ? (
          /* ─── Claimed state ─── */
          <div className="flex items-center gap-4">
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'rgba(255,255,255,0.42)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 30 }}>{reward?.emoji ?? '🎁'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary }}>
                {reward ? `${reward.label} Unlocked! +${reward.xp} XP` : 'Treasure claimed!'}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textBody, marginTop: 3 }}>
                Come back tomorrow for more rewards! ✨
              </div>
            </div>
            {reward && (
              <motion.span
                style={{ fontSize: 16, fontWeight: 900, color: T.primary }}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.4, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >+{reward.xp}</motion.span>
            )}
          </div>
        ) : (
          /* ─── Chest interaction — 3D styled ─── */
          <motion.button
            onClick={handleOpen}
            className="flex items-center justify-center gap-5 w-full touch-manipulation"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            disabled={phase !== 'idle'}
          >
            {/* 3D Chest */}
            <div className="relative flex-shrink-0" style={{ width: 68, height: 68 }}>
              {/* Body */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 42, borderRadius: '4px 4px 14px 14px',
                background: 'linear-gradient(180deg, #d4a050, #b8860b)',
                border: '2px solid #a67c38',
                boxShadow: 'inset 0 -5px 10px rgba(0,0,0,0.10), 0 6px 16px rgba(184,134,11,0.25)',
              }}>
                {/* Lock */}
                <div style={{
                  position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)',
                  width: 14, height: 14, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${T.warning}, #e8a820)`,
                  border: '2px solid #c49030',
                  boxShadow: `0 0 10px ${T.warning}60`,
                }} />
                {/* Metal band */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 10,
                  height: 3, background: 'linear-gradient(90deg, #c49030, #e8b84c, #c49030)',
                }} />
              </div>
              {/* Lid */}
              <motion.div
                style={{
                  position: 'absolute', top: 0, left: -3, right: -3,
                  height: 30, borderRadius: '12px 12px 4px 4px',
                  background: 'linear-gradient(180deg, #ecc360, #d4a050)',
                  border: '2px solid #c49030',
                  transformOrigin: 'bottom center',
                  boxShadow: '0 -2px 8px rgba(236,195,96,0.3)',
                }}
                animate={
                  phase === 'opening'
                    ? { rotateX: -110, y: -10, opacity: 0.7 }
                    : phase === 'idle'
                    ? { rotateX: [0, -6, 0] }
                    : {}
                }
                transition={
                  phase === 'opening'
                    ? { duration: 0.5, ease: 'easeOut' }
                    : { duration: 2, repeat: Infinity, repeatDelay: 2 }
                }
              />
              {/* Glow */}
              {phase === 'idle' && (
                <div className="elite-chest-glow" style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  width: 34, height: 22,
                  background: `radial-gradient(circle, ${T.warning}50, transparent 60%)`,
                  borderRadius: '50%',
                }} />
              )}
            </div>

            {/* Text */}
            <div className="text-left flex-1">
              <div style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary }}>
                {phase === 'opening' ? 'Opening...' : 'Open Treasure Chest!'}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textBody, marginTop: 4 }}>
                {phase === 'idle' ? "Tap to discover today's reward! 🎉" : 'Something magical awaits...'}
              </div>
            </div>

            {/* Floating reward on reveal */}
            <AnimatePresence>
              {phase === 'reveal' && reward && (
                <motion.div
                  className="absolute"
                  style={{ top: '30%', left: '15%', fontSize: 40 }}
                  initial={{ y: 20, opacity: 0, scale: 0.5 }}
                  animate={{ y: -35, opacity: 1, scale: [0.5, 1.3, 1] }}
                  exit={{ y: -60, opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  {reward.emoji}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.span
              style={{ fontSize: 24, flexShrink: 0 }}
              animate={{ rotate: [0, -8, 8, -8, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >✨</motion.span>
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
});

TreasureReward.displayName = 'TreasureReward';
