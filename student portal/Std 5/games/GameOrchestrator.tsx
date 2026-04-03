/**
 * 🕹️ Game Orchestrator – Arcade Edition
 * =================================================
 * Energetic arcade experience with:
 * - Animated hero banner with student name
 * - Enhanced game cards with stronger glow & press effects
 * - Per-card progress indicators (stars)
 * - Daily Challenge card (gold, 3-game bonus)
 * - Rich floating particle background
 */

import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GAME_CONFIGS, GAME_SEQUENCE, GameConfig } from './types';
import { UnifiedGameShell } from './UnifiedGameShell';
import { logAction } from '../utils/auditLog';
import { XP_REWARDS } from '../utils/xpEngine';
import { useAuth } from '../auth/AuthContext';

// Lazy-load subject games hub (heavy)
const SubjectGamesHub = React.lazy(() =>
  import('./subjects/SubjectGamesHub').then(m => ({ default: m.SubjectGamesHub })),
);

// ─── Progress Helpers (localStorage-backed) ──────────────

const PROGRESS_KEY = 'arcade_game_stars';

function loadStars(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveStars(stars: Record<string, number>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(stars));
}

const DAILY_KEY = 'arcade_daily_challenge';

function getDailyProgress(): { date: string; count: number } {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === new Date().toDateString()) return parsed;
    }
  } catch { /* ignore */ }
  return { date: new Date().toDateString(), count: 0 };
}

function incrementDaily(): { date: string; count: number } {
  const dp = getDailyProgress();
  const updated = { date: new Date().toDateString(), count: dp.count + 1 };
  localStorage.setItem(DAILY_KEY, JSON.stringify(updated));
  return updated;
}

// ─── Floating Particles (Enhanced) ───────────────────────

const PARTICLE_EMOJIS = ['✨', '⭐', '🌟', '💫', '🎯', '🏆', '🎮', '🎨', '🚀', '🎪', '🌈', '🎶'];

const FloatingParticles: React.FC = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {Array.from({ length: 10 }, (_, i) => (
      <motion.span
        key={i}
        className="absolute opacity-10"
        style={{
          left: `${8 + Math.random() * 84}%`,
          top: `${8 + Math.random() * 84}%`,
          fontSize: `${12 + Math.random() * 10}px`,
        }}
        animate={{
          y: [0, -30 - Math.random() * 20, 0],
          x: [0, Math.random() * 20 - 10, 0],
          rotate: [0, 360],
          opacity: [0.06, 0.15, 0.06],
        }}
        transition={{
          duration: 6 + Math.random() * 4,
          repeat: Infinity,
          delay: i * 0.6,
          ease: 'easeInOut',
        }}
      >
        {PARTICLE_EMOJIS[i % PARTICLE_EMOJIS.length]}
      </motion.span>
    ))}
  </div>
));
FloatingParticles.displayName = 'FloatingParticles';

// ─── Arcade Hero Banner ──────────────────────────────────

const ArcadeHeroBanner: React.FC<{ name: string }> = React.memo(({ name }) => (
  <motion.div
    className="relative rounded-3xl overflow-hidden mb-5"
    initial={{ y: -24, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 160, damping: 20 }}
  >
    {/* Gradient background */}
    <div
      className="absolute inset-0 rounded-3xl"
      style={{
        background: 'linear-gradient(135deg, #3f8f3a 0%, #7aa344 30%, #ec4899 60%, #f59e0b 100%)',
        backgroundSize: '300% 300%',
        animation: 'arcadeGradientShift 8s ease infinite',
      }}
    />
    <div className="absolute inset-0 bg-white/8 backdrop-blur-sm" />

    <div className="relative px-5 py-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-3.5">
        <motion.div
          className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center text-2xl shadow-lg border border-white/25"
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          🕹️
        </motion.div>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight drop-shadow-md">
            {name}'s Learning Arcade
          </h1>
          <p className="text-[11px] text-white/60 font-semibold mt-0.5">
            Choose a game and earn stars! ⭐
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <motion.span
          className="text-xl"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          🏆
        </motion.span>
      </div>
    </div>

    <style>{`
      @keyframes arcadeGradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `}</style>
  </motion.div>
));
ArcadeHeroBanner.displayName = 'ArcadeHeroBanner';

// ─── Star Progress Indicator ─────────────────────────────

const StarProgress: React.FC<{ stars: number; max?: number }> = ({ stars, max = 3 }) => (
  <div className="flex items-center gap-0.5 mt-1.5">
    {Array.from({ length: max }, (_, i) => (
      <motion.span
        key={i}
        className={`text-[11px] ${i < stars ? 'opacity-100' : 'opacity-20'}`}
        initial={i < stars ? { scale: 0 } : {}}
        animate={i < stars ? { scale: 1 } : {}}
        transition={{ delay: i * 0.1, type: 'spring' }}
      >
        ⭐
      </motion.span>
    ))}
  </div>
);

// ─── Daily Challenge Card ────────────────────────────────

const DailyChallengeCard: React.FC<{ completed: number; target?: number }> = React.memo(
  ({ completed, target = 3 }) => {
    const isDone = completed >= target;
    return (
      <motion.div
        className="relative rounded-3xl overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 180, damping: 22 }}
      >
        {/* Soft gold glow */}
        {!isDone && (
          <motion.div
            className="absolute -inset-0.5 rounded-3xl pointer-events-none z-0"
            animate={{
              boxShadow: [
                '0 0 16px rgba(245,158,11,0.2), 0 0 32px rgba(245,158,11,0.1)',
                '0 0 24px rgba(245,158,11,0.35), 0 0 48px rgba(245,158,11,0.18)',
                '0 0 16px rgba(245,158,11,0.2), 0 0 32px rgba(245,158,11,0.1)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <div className="relative bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-200/50 rounded-3xl px-4 py-3.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-md"
              animate={!isDone ? { rotate: [0, 3, -3, 0] } : {}}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              {isDone ? '🏅' : '🔥'}
            </motion.div>
            <div>
              <h3 className="text-sm font-black text-amber-800">
                {isDone ? 'Challenge Complete!' : 'Daily Challenge'}
              </h3>
              <p className="text-[10px] text-amber-600/70 font-medium">
                {isDone
                  ? 'Amazing! You earned bonus XP today!'
                  : `Play ${target} games today → Bonus ${XP_REWARDS.GAME_WIN * 2} XP`}
              </p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: target }, (_, i) => (
              <motion.div
                key={i}
                className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-black border ${
                  i < completed
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 text-white shadow-sm'
                    : 'bg-white/50 border-amber-200/40 text-amber-300'
                }`}
                style={{ width: 18, height: 18 }}
                initial={i < completed ? { scale: 0 } : {}}
                animate={i < completed ? { scale: 1 } : {}}
                transition={{ delay: i * 0.12, type: 'spring' }}
              >
                {i < completed ? '✓' : (i + 1)}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  },
);
DailyChallengeCard.displayName = 'DailyChallengeCard';

// ─── Arcade Game Tile (Enhanced) ─────────────────────────

interface ArcadeTileProps {
  game: GameConfig;
  index: number;
  stars: number;
  onClick: () => void;
}

const ArcadeTile: React.FC<ArcadeTileProps> = React.memo(({ game, index, stars, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isNew = game.tag === 'NEW';
  const isBonus = game.tag === 'BONUS';

  // Build a stronger glow color from the existing one (bump alpha)
  const strongGlow = game.glowColor.replace(/[\d.]+\)$/, '0.55)');

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group text-left w-full"
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 22 }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      style={{ perspective: '800px' }}
    >
      {/* Soft colored glow */}
      <motion.div
        className="absolute -inset-px rounded-3xl pointer-events-none z-0"
        animate={{
          boxShadow: isHovered
            ? `0 0 18px ${strongGlow}, 0 0 36px ${game.glowColor}, 0 6px 24px rgba(0,0,0,0.06)`
            : `0 0 8px ${game.glowColor}, 0 2px 12px rgba(0,0,0,0.03)`,
        }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className="relative bg-white/80 backdrop-blur-2xl border border-white/50 rounded-3xl p-4 flex flex-col items-center text-center overflow-hidden shadow-md"
        whileHover={{ rotateY: -2, rotateX: 1.5 }}
        transition={{ type: 'spring', stiffness: 300 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Gradient blobs */}
        <div
          className={`absolute -top-8 -right-8 w-36 h-36 bg-gradient-to-br ${game.gradient} rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`}
        />
        <div
          className={`absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr ${game.gradient} rounded-full opacity-8 blur-2xl group-hover:opacity-15 transition-opacity duration-500`}
        />

        {/* Seq badge */}
        <div className="absolute top-2 left-2.5 bg-gray-100/50 text-gray-400 text-[8px] font-black w-4.5 h-4.5 rounded-md flex items-center justify-center" style={{ width: 18, height: 18 }}>
          {game.seq}
        </div>

        {/* Tag */}
        {(isNew || isBonus) && (
          <motion.div
            className={`absolute top-2 right-2.5 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm z-10 ${
              isNew
                ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                : 'bg-gradient-to-r from-amber-400 to-orange-400'
            }`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            {game.tag}
          </motion.div>
        )}

        {/* Icon */}
        <motion.div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-2xl mb-2.5 shadow-lg relative`}
          whileHover={{ rotate: [0, -5, 5, 0], scale: 1.08 }}
          transition={{ duration: 0.5 }}
        >
          {game.icon}
          <div className="absolute inset-0 rounded-xl bg-white/10" />
          <motion.div
            className="absolute inset-0 rounded-xl border border-white/25"
            animate={isHovered ? { scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] } : {}}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        </motion.div>

        <h3 className="text-[13px] font-bold text-gray-800 mb-0.5 relative z-10">
          {game.title}
        </h3>
        <p className="text-[10px] text-gray-400 mb-2 relative z-10">{game.desc}</p>

        {/* XP badge */}
        <div className="flex items-center gap-1 bg-amber-50/70 px-2.5 py-1 rounded-lg relative z-10 border border-amber-200/25">
          <span className="text-amber-500 text-[10px]">✨</span>
          <span className="font-bold text-amber-600 text-[10px]">+{XP_REWARDS.GAME_WIN} XP</span>
        </div>

        {/* Star progress */}
        <StarProgress stars={stars} />

        {/* Play indicator */}
        <motion.div
          className="mt-1.5 text-[9px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1"
          animate={{ opacity: isHovered ? 1 : 0.35 }}
        >
          <motion.span
            animate={isHovered ? { x: [0, 4, 0] } : {}}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            ▶
          </motion.span>
          Tap to Play
        </motion.div>
      </motion.div>
    </motion.button>
  );
});
ArcadeTile.displayName = 'ArcadeTile';

// ─── Main GameCenter Export ──────────────────────────────

interface GameCenterProps {
  onGameWin: (xp: number) => void;
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
  onClickSound?: () => void;
}

export const GameCenter: React.FC<GameCenterProps> = ({ onGameWin, onCorrectAnswer, onWrongAnswer, onClickSound }) => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const { user } = useAuth();
  const [gameStars, setGameStars] = useState<Record<string, number>>(loadStars);
  const [dailyProgress, setDailyProgress] = useState(getDailyProgress);

  // Sync stars from localStorage on mount
  useEffect(() => {
    setGameStars(loadStars());
    setDailyProgress(getDailyProgress());
  }, []);

  const handleExit = useCallback(() => setActiveGameId(null), []);

  const handleSelectGame = useCallback((id: string) => {
    setActiveGameId(id);
    logAction('game_selected', 'game', { game: id });
  }, []);

  // Wrap onGameWin to also track stars & daily progress
  const handleGameWin = useCallback((xp: number) => {
    onGameWin(xp);
    if (activeGameId) {
      setGameStars(prev => {
        const updated = { ...prev, [activeGameId]: Math.min((prev[activeGameId] || 0) + 1, 3) };
        saveStars(updated);
        return updated;
      });
      setDailyProgress(incrementDaily());
    }
  }, [activeGameId, onGameWin]);

  // Sequential "Next Game" handler
  const handleNextGame = useCallback(() => {
    if (!activeGameId) return;
    const idx = GAME_SEQUENCE.indexOf(activeGameId);
    if (idx >= 0 && idx < GAME_SEQUENCE.length - 1) {
      const nextId = GAME_SEQUENCE[idx + 1];
      setActiveGameId(nextId);
      logAction('next_game', 'game', { from: activeGameId, to: nextId });
    } else {
      setActiveGameId(null);
    }
  }, [activeGameId]);

  return (
    <AnimatePresence mode="wait">
      {activeGameId ? (
        <motion.div
          key={activeGameId}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <UnifiedGameShell
            gameId={activeGameId}
            onExit={handleExit}
            onGameWin={handleGameWin}
            onNextGame={handleNextGame}
            onCorrectAnswer={onCorrectAnswer}
            onWrongAnswer={onWrongAnswer}
            onClickSound={onClickSound}
          />
        </motion.div>
      ) : (
        <motion.div
          key="menu"
          className="w-full max-w-[1100px] mx-auto relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Slow radial background pulse */}
          <motion.div
            className="absolute inset-0 -z-10 rounded-3xl pointer-events-none"
            animate={{
              background: [
                'radial-gradient(ellipse at 20% 50%, rgba(95,139,61,0.04) 0%, transparent 70%)',
                'radial-gradient(ellipse at 80% 50%, rgba(236,72,153,0.04) 0%, transparent 70%)',
                'radial-gradient(ellipse at 50% 30%, rgba(63,143,58,0.04) 0%, transparent 70%)',
                'radial-gradient(ellipse at 20% 50%, rgba(95,139,61,0.04) 0%, transparent 70%)',
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />

          <FloatingParticles />

          {/* Arcade Hero Banner */}
          <ArcadeHeroBanner name={user.name} />

          {/* Daily Challenge */}
          <div className="mb-4">
            <DailyChallengeCard completed={dailyProgress.count} />
          </div>

          {/* 2×4 Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
            {GAME_CONFIGS.map((game, i) => (
              <ArcadeTile
                key={game.id}
                game={game}
                index={i}
                stars={gameStars[game.id] || 0}
                onClick={() => handleSelectGame(game.id)}
              />
            ))}
          </div>

          {/* ─── Subject Games (English + Maths) ─── */}
          <Suspense fallback={
            <div className="text-center py-8 text-gray-400 text-xs">Loading subject games…</div>
          }>
            <SubjectGamesHub
              onGameWin={handleGameWin}
              onCorrectAnswer={onCorrectAnswer}
              onWrongAnswer={onWrongAnswer}
              onClickSound={onClickSound}
            />
          </Suspense>

          {/* Governance note */}
          <motion.p
            className="text-center mt-5 text-[10px] text-gray-300 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            🛡️ No rankings • No comparison • Pure learning fun
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameCenter;
