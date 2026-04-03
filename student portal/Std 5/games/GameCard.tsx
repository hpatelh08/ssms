/**
 * 🃏 Premium GameCard — ONE card for ALL games
 * ===============================================
 * CSS-first hover effects (group-hover), no isHovered state.
 * Motion limited to outer button entrance + whileHover/whileTap.
 * Glow colors memoized. Warm palette: coral/peach/mint/cream.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { XP_REWARDS } from '../utils/xpEngine';

/* ── CSS keyframes (injected once) ── */
const GC_KF_ID = 'gc-card-perf-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(GC_KF_ID)) {
  const s = document.createElement('style');
  s.id = GC_KF_ID;
  s.textContent = `
    @keyframes gc-tag-pulse { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.08) } }
    @keyframes gc-xp-sparkle { 0%,100%{ transform:rotate(0) scale(1) } 33%{ transform:rotate(15deg) scale(1.2) } 66%{ transform:rotate(-15deg) scale(1) } }
    @keyframes gc-arrow-nudge { 0%,100%{ transform:translateX(0) } 50%{ transform:translateX(5px) } }
  `;
  document.head.appendChild(s);
}

export interface GameCardDef {
  id: string;
  gameTypeId: string;
  title: string;
  icon: string;
  desc: string;
  gradient: string;
  glowColor: string;
  tag: string;
  section: 'arcade' | 'english' | 'maths' | 'science';
  subject: string;
  chapter: string;
  seq: number;
}

interface Props {
  game: GameCardDef;
  index: number;
  stars: number;
  onClick: () => void;
}

/* ── Premium Star Progress ── */
const StarProgress: React.FC<{ stars: number; max?: number }> = ({ stars, max = 3 }) => (
  <div className="flex items-center gap-1 mt-2">
    {Array.from({ length: max }, (_, i) => (
      <motion.span
        key={i}
        className={`text-xs ${i < stars ? 'opacity-100 drop-shadow-sm' : 'opacity-15'}`}
        initial={i < stars ? { scale: 0, rotate: -180 } : {}}
        animate={i < stars ? { scale: 1, rotate: 0 } : {}}
        transition={{ delay: i * 0.12, type: 'spring', stiffness: 400 }}
      >
        ⭐
      </motion.span>
    ))}
  </div>
);

export const GameCard: React.FC<Props> = React.memo(({ game, index, stars, onClick }) => {
  const isNew = game.tag === 'NEW';
  const isBonus = game.tag === 'BONUS';

  /* Memoize glow variants to avoid regex per render */
  const { strongGlow, deepGlow } = useMemo(() => ({
    strongGlow: game.glowColor.replace(/[\d.]+\)$/, '0.5)'),
    deepGlow: game.glowColor.replace(/[\d.]+\)$/, '0.35)'),
  }), [game.glowColor]);

  return (
    <motion.button
      onClick={onClick}
      className="relative group text-left w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* ── Layer 1: Shadow — CSS transition on hover via group ── */}
      <div
        className="absolute -inset-1 rounded-[26px] pointer-events-none z-0 transition-shadow duration-300"
        style={{
          boxShadow: `0 4px 14px ${game.glowColor}, 0 2px 8px rgba(88,129,74,0.10)`,
        }}
      />

      {/* ── Layer 2: Main body — no motion.div, no 3D tilt ── */}
      <div
        className="relative rounded-3xl p-4 flex flex-col items-center text-center overflow-hidden"
        style={{
          background: 'rgba(249, 255, 245, 0.9)',
          border: '1px solid rgba(153, 187, 136, 0.28)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72), inset 0 -1px 0 rgba(88,129,74,0.06)',
        }}
      >
        {/* Inner gloss arc */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[180%] h-40 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.8) 0%, transparent 70%)',
          }}
        />

        {/* Gradient blobs */}
        <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${game.gradient} rounded-full opacity-[0.12] blur-2xl group-hover:opacity-25 transition-opacity duration-500 pointer-events-none`} />
        <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr ${game.gradient} rounded-full opacity-[0.08] blur-2xl group-hover:opacity-18 transition-opacity duration-500 pointer-events-none`} />

        {/* Seq badge */}
        <div
          className="absolute top-2.5 left-2.5 text-[8px] font-black rounded-lg flex items-center justify-center"
          style={{ width: 20, height: 20, background: 'rgba(236, 247, 226, 0.9)', color: '#5d8a62', border: '1px solid rgba(153, 187, 136, 0.28)' }}
        >
          {game.seq}
        </div>

        {/* Tag — CSS pulse */}
        {(isNew || isBonus) && (
          <div
            className={`absolute top-2 right-2.5 text-white text-[8px] font-black px-2 py-0.5 rounded-lg shadow-md z-10 ${
              isNew
                ? 'bg-gradient-to-r from-green-400 to-emerald-400 shadow-green-400/25'
                : 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-amber-400/25'
            }`}
            style={{ animation: 'gc-tag-pulse 2.5s ease-in-out infinite', willChange: 'transform' }}
          >
            {game.tag}
          </div>
        )}

        {/* ── Icon — plain div, CSS shadow transition ── */}
        <div
          className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-2xl mb-3 z-10 transition-shadow duration-300`}
          style={{
            boxShadow: `0 4px 12px ${game.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          <span>{game.icon}</span>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent" />
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-extrabold mb-0.5 relative z-10 leading-tight" style={{ color: '#2f5f3d' }}>{game.title}</h3>
        <p className="text-[10px] mb-2 relative z-10 leading-snug" style={{ color: '#64866d' }}>{game.desc}</p>

        {/* XP badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl relative z-10 border shadow-sm" style={{ background: 'linear-gradient(90deg, rgba(228,245,218,0.9), rgba(245,250,230,0.9))', borderColor: 'rgba(153,187,136,0.35)', boxShadow: '0 2px 8px rgba(122,163,68,0.18)' }}>
          <span
            className="text-[10px]"
            style={{ color: '#6b923e', animation: 'gc-xp-sparkle 3s ease-in-out infinite', willChange: 'transform', display: 'inline-block' }}
          >
            ✨
          </span>
          <span className="font-bold text-[10px]" style={{ color: '#4f7f34' }}>+{XP_REWARDS.GAME_WIN} XP</span>
        </div>

        {/* Star progress */}
        <StarProgress stars={stars} />

        {/* Play indicator — CSS group-hover */}
        <div
          className="mt-2 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 opacity-30 text-slate-300 group-hover:opacity-100 transition-all duration-200"
          style={{ color: 'rgba(83,119,96,0.4)' }}
        >
          <span>▶</span>
          Tap to Play
        </div>
      </div>
    </motion.button>
  );
});

GameCard.displayName = 'GameCard';

