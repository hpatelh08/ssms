/**
 * child/home/ColorMagicHeroCard.tsx
 * ─────────────────────────────────────────────────────
 * Full-width hero card for Color Magic.
 * Pink→orange gradient, 24px corners, soft glow.
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSoundPlay } from '../SoundProvider';
import type { ChildScreen } from '../ChildLayout';

interface Props {
  onNavigate: (screen: ChildScreen) => void;
}

export const ColorMagicHeroCard: React.FC<Props> = React.memo(({ onNavigate }) => {
  const play = useSoundPlay();

  const handleClick = useCallback(() => {
    play('click');
    onNavigate('color-magic');
  }, [play, onNavigate]);

  return (
    <motion.button
      onClick={handleClick}
      className="relative w-full overflow-hidden cursor-pointer touch-manipulation rounded-3xl"
      style={{
        height: 220,
        background: 'linear-gradient(135deg, var(--pastel-pink-deep) 0%, var(--pastel-peach) 50%, var(--pastel-yellow) 100%)',
        boxShadow: '0 6px 28px rgba(255,180,200,0.18), 0 2px 6px rgba(180,170,220,0.06)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <div className="absolute" style={{ width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', top: -25, right: -15 }} />
        <div className="absolute" style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', bottom: 20, left: 30 }} />
        {/* Sparkles */}
        {[
          { top: '15%', left: '22%', delay: 0 },
          { top: '55%', left: '68%', delay: 0.8 },
          { top: '30%', left: '82%', delay: 1.4 },
        ].map((s, i) => (
          <motion.span
            key={i}
            className="absolute text-white/30 text-xs pointer-events-none select-none"
            style={{ top: s.top, left: s.left }}
            animate={{ opacity: [0.15, 0.5, 0.15], scale: [0.8, 1.2, 0.8], y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: s.delay }}
          >
            ✦
          </motion.span>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center h-full px-6 sm:px-8">
        <div className="flex flex-col items-start gap-2.5 flex-1">
          <h2
            className="text-white font-black text-2xl sm:text-3xl tracking-tight text-left leading-tight"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >
            Color Magic
          </h2>
          <p
            className="text-white/75 text-sm font-bold text-left"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
          >
            Tap, Fill & Celebrate!
          </p>
          <div
            className="mt-0.5 px-5 py-2 rounded-full font-extrabold text-sm"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#c44d8f', boxShadow: 'var(--shadow-soft)' }}
          >
            Start Coloring 🎨
          </div>
        </div>

        {/* Apple illustration */}
        <div className="flex items-center justify-center shrink-0 ml-4">
          <motion.div
            className="flex items-center justify-center"
            style={{
              width: 100, height: 100, borderRadius: 24,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 3px 16px rgba(0,0,0,0.06)',
            }}
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg viewBox="0 0 80 80" width={68} height={68}>
              <ellipse cx={40} cy={48} rx={26} ry={28} fill="#ef4444" stroke="#fff" strokeWidth={2} />
              <ellipse cx={32} cy={38} rx={8} ry={12} fill="#fca5a5" opacity={0.5} />
              <rect x={38} y={14} width={4} height={12} rx={2} fill="#92400e" />
              <ellipse cx={48} cy={18} rx={8} ry={4} fill="#22c55e" transform="rotate(-20 48 18)" />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.button>
  );
});

ColorMagicHeroCard.displayName = 'ColorMagicHeroCard';
