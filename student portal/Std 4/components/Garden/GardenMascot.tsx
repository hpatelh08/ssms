// GardenMascot.tsx — Cute animated sunflower mascot with reactions
// Features: idle bobbing, watering can animation, bird landing, sparkle bursts
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GardenMascotProps {
  streak: number;
  isWatering: boolean;
  onWater: () => void;
  totalPresent: number;
}

// ─── Speech Bubble ────────────────────────────────────────────
const SpeechBubble: React.FC<{ message: string; show: boolean }> = React.memo(({ message, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm text-blue-900 text-[11px] font-bold px-4 py-2 rounded-2xl shadow-lg border border-blue-100/30 whitespace-nowrap z-30"
        initial={{ opacity: 0, y: 10, scale: 0.7 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 5, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {message}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white/95 rotate-45 border-r border-b border-blue-100/30" />
      </motion.div>
    )}
  </AnimatePresence>
));
SpeechBubble.displayName = 'SpeechBubble';

// ─── Bird ─────────────────────────────────────────────────────
const LandingBird: React.FC<{ show: boolean }> = React.memo(({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="absolute -top-6 -right-3 text-lg"
        initial={{ x: 60, y: -40, opacity: 0, rotate: -20 }}
        animate={{ x: 0, y: 0, opacity: 1, rotate: [0, -5, 3, 0] }}
        exit={{ x: 40, y: -30, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 120,
          damping: 12,
          rotate: { duration: 2, repeat: Infinity },
        }}
      >
        🐦
      </motion.div>
    )}
  </AnimatePresence>
));
LandingBird.displayName = 'LandingBird';

// ─── Watering Can ─────────────────────────────────────────────
const WateringButton: React.FC<{ isWatering: boolean; onWater: () => void }> = React.memo(({ isWatering, onWater }) => (
  <motion.button
    onClick={onWater}
    className="relative flex items-center gap-2 bg-gradient-to-r from-blue-400/90 to-cyan-400/90 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-blue-400/20 border border-blue-300/30 hover:shadow-xl hover:shadow-blue-400/30 transition-shadow"
    whileHover={{ scale: 1.08, y: -2 }}
    whileTap={{ scale: 0.92 }}
    disabled={isWatering}
    style={{ opacity: isWatering ? 0.7 : 1 }}
  >
    <motion.span
      className="text-lg"
      animate={isWatering ? { rotate: [-20, 20, -20], y: [0, -3, 0] } : { rotate: 0 }}
      transition={{ duration: 0.6, repeat: isWatering ? Infinity : 0 }}
    >
      🚿
    </motion.span>
    {isWatering ? 'Watering...' : 'Water Garden'}

    {/* Water drops when watering */}
    <AnimatePresence>
      {isWatering && [0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="absolute text-[10px]"
          style={{ left: 20 + i * 8, top: -2 }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: [0, 20] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }}
        >
          💧
        </motion.span>
      ))}
    </AnimatePresence>
  </motion.button>
));
WateringButton.displayName = 'WateringButton';

// ─── Main Mascot ──────────────────────────────────────────────
export const GardenMascot: React.FC<GardenMascotProps> = React.memo(({ streak, isWatering, onWater, totalPresent }) => {
  const [showBubble, setShowBubble] = useState(false);
  const [birdLanded, setBirdLanded] = useState(false);

  const getMessage = () => {
    if (isWatering) return '💦 Splash splash! So refreshing!';
    if (streak >= 14) return '🌈 You are LEGENDARY!';
    if (streak >= 7) return '🌳 A beautiful tree has grown!';
    if (streak >= 5) return '🌸 Your garden is blooming!';
    if (streak >= 3) return '🌿 Growing strong!';
    if (totalPresent > 0) return '🌱 Keep coming back!';
    return '👋 Welcome to your garden!';
  };

  // Mascot emoji based on streak
  const mascotEmoji = streak >= 7 ? '🌻' : streak >= 3 ? '🌼' : '🌱';
  const mascotSize = streak >= 7 ? 'text-6xl' : streak >= 3 ? 'text-5xl' : 'text-4xl';

  return (
    <div className="flex items-end justify-between gap-4 relative z-10">
      {/* Mascot character */}
      <motion.div
        className="relative cursor-pointer"
        onHoverStart={() => { setShowBubble(true); setBirdLanded(true); }}
        onHoverEnd={() => { setShowBubble(false); setBirdLanded(false); }}
        onClick={() => { setShowBubble(prev => !prev); setBirdLanded(prev => !prev); }}
      >
        <SpeechBubble message={getMessage()} show={showBubble || isWatering} />

        <motion.div
          className="relative"
          animate={{
            y: [0, -5, 0],
            rotate: [0, -3, 3, 0],
          }}
          transition={{
            y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          {/* Glow behind mascot */}
          <motion.div
            className="absolute inset-0 rounded-full blur-xl -z-10"
            style={{
              background: streak >= 7
                ? 'radial-gradient(circle, rgba(34,197,94,0.3), transparent)'
                : 'radial-gradient(circle, rgba(251,191,36,0.2), transparent)',
              transform: 'scale(2)',
            }}
            animate={{ scale: [1.8, 2.2, 1.8], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <span
            className={`${mascotSize} block select-none`}
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
          >
            {mascotEmoji}
          </span>

          <LandingBird show={birdLanded && streak >= 5} />
        </motion.div>

        {/* Sparkle burst on interaction */}
        <AnimatePresence>
          {showBubble && streak >= 3 && (
            <>
              {[0, 1, 2, 3].map(i => (
                <motion.span
                  key={`sparkle-${i}`}
                  className="absolute text-xs pointer-events-none"
                  style={{ left: '50%', top: '50%' }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: [0, (i % 2 ? 1 : -1) * (15 + i * 8)],
                    y: [0, -(10 + i * 10)],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                >
                  ✨
                </motion.span>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Water Garden Button */}
      <WateringButton isWatering={isWatering} onWater={onWater} />
    </div>
  );
});

GardenMascot.displayName = 'GardenMascot';
