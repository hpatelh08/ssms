/**
 * child/home/DailySurprise.tsx
 * ─────────────────────────────────────────────────────
 * Daily Surprise Box — once-per-day XP reward.
 * Unified 24px radius, soft glow, confetti burst.
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundPlay } from '../SoundProvider';
import { useAddXP } from '../XPProvider';
import { useCelebrate } from '../useCelebrationController';
import { useMascotTrigger } from '../useMascotController';

/* ── Storage helpers ─────────────────────────────── */

const STORAGE_KEY = 'ssms_daily_surprise';

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function hasClaimedToday(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === getTodayKey();
  } catch {
    return false;
  }
}

function markClaimed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, getTodayKey());
  } catch { /* ignore */ }
}

function getRandomXP(): number {
  return Math.floor(Math.random() * 11) + 5;
}

/* ── Confetti Piece ──────────────────────────────── */

const CONFETTI_COLORS = ['#f472b6', '#fbbf24', '#4ade80', '#60a5fa', '#a78bfa', '#f97316', '#facc15', '#ec4899', '#34d399', '#818cf8'];

const ConfettiPiece: React.FC<{ index: number }> = React.memo(({ index }) => {
  const angle = (index * 15 + Math.random() * 10) * Math.PI / 180;
  const dist = 40 + Math.random() * 45;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 5 + Math.random() * 4;
  const shapes = ['rounded-lg', 'rounded-full', 'rounded-md'];

  return (
    <motion.div
      className={`absolute pointer-events-none ${shapes[index % 3]}`}
      style={{
        width: size,
        height: size * (0.6 + Math.random() * 0.8),
        backgroundColor: color,
        left: '50%',
        top: '50%',
      }}
      initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
      animate={{
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 20,
        rotate: 360 + Math.random() * 360,
        scale: 0,
        opacity: 0,
      }}
      transition={{
        duration: 0.8 + Math.random() * 0.4,
        delay: index * 0.02,
        ease: 'easeOut',
      }}
    />
  );
});
ConfettiPiece.displayName = 'ConfettiPiece';

/* ── Main Component ──────────────────────────────── */

export const DailySurprise: React.FC = React.memo(() => {
  const play = useSoundPlay();
  const addXP = useAddXP();
  const celebrate = useCelebrate();
  const triggerMascot = useMascotTrigger();

  const [claimed, setClaimed] = useState(hasClaimedToday);
  const [opening, setOpening] = useState(false);
  const [xpReward, setXpReward] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (!hasClaimedToday()) setClaimed(false);
    }, 60000);
    return () => clearInterval(checkInterval);
  }, []);

  const handleOpen = useCallback(() => {
    if (claimed || opening) return;

    setOpening(true);
    play('celebrate');

    setTimeout(() => {
      const xp = getRandomXP();
      setXpReward(xp);
      setShowConfetti(true);
      addXP(xp);
      celebrate('confetti');
      triggerMascot('celebrate', 2000);
      markClaimed();
      setClaimed(true);

      confettiTimer.current = setTimeout(() => {
        setShowConfetti(false);
        setOpening(false);
      }, 1600);
    }, 450);
  }, [claimed, opening, play, addXP, celebrate, triggerMascot]);

  useEffect(() => {
    return () => {
      if (confettiTimer.current) clearTimeout(confettiTimer.current);
    };
  }, []);

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl w-full"
      style={{
        padding: claimed ? '20px 28px' : '24px 28px',
        background: claimed
          ? 'linear-gradient(135deg, #f8f9fa 0%, #f0f1f5 100%)'
          : 'linear-gradient(135deg, var(--pastel-purple-soft) 0%, var(--pastel-yellow-soft) 50%, var(--pastel-blue-soft) 100%)',
        boxShadow: claimed
          ? 'var(--shadow-soft)'
          : 'var(--shadow-card)',
        border: claimed
          ? '1px solid var(--border-soft)'
          : '1px solid rgba(200,180,240,0.2)',
      }}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 140 }}
    >
      {/* Confetti explosion */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            {Array.from({ length: 20 }, (_, i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {claimed ? (
        <div className="flex items-center gap-4">
          <span style={{ fontSize: 28 }}>🎁</span>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)' }}>
              {xpReward ? `Hooray! +${xpReward} XP!` : 'Surprise claimed!'}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginTop: 3 }}>
              Come back tomorrow for more! ✨
            </div>
          </div>
          {xpReward && (
            <motion.span
              style={{ fontSize: 16, fontWeight: 800, color: '#d946ef' }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              +{xpReward}
            </motion.span>
          )}
        </div>
      ) : (
        <motion.button
          onClick={handleOpen}
          className="flex items-center justify-center gap-4 w-full touch-manipulation"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          disabled={opening}
        >
          <div className="relative">
            <motion.span
              style={{ fontSize: 36, display: 'inline-block' }}
              animate={opening ? { scale: [1, 1.3, 0.8] } : { rotate: [0, -8, 8, -8, 0] }}
              transition={opening ? { duration: 0.4 } : { duration: 2, repeat: Infinity, repeatDelay: 2 }}
            >
              🎁
            </motion.span>
          </div>
          <div className="text-left flex-1">
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-accent-purple)' }}>
              Daily Surprise!
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pastel-purple-deep)', marginTop: 3 }}>
              Tap to open your gift! 🎉
            </div>
          </div>
          <motion.span
            style={{ fontSize: 22 }}
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5 }}
          >
            ✨
          </motion.span>
        </motion.button>
      )}
    </motion.div>
  );
});

DailySurprise.displayName = 'DailySurprise';
