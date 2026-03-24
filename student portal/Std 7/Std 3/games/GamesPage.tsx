/**
 * 🕹️ GamesPage — THE ONE PAGE
 * ==============================
 * Replaces GameOrchestrator completely.
 * One unified grid for ALL 44 games using the same GameCard.
 * Clicking any card → GameShell (the ONE brain).
 *
 * Layout preserved:
 *   Hero Banner → Daily Challenge → Top 8 grid → English grid → Maths grid
 *
 * DO NOT TOUCH VISUAL STYLE — identical to old GameOrchestrator.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── CSS keyframe injection (GamesPage — runs once) ── */
const GP_STYLE_ID = 'gp-perf-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(GP_STYLE_ID)) {
  const _s = document.createElement('style');
  _s.id = GP_STYLE_ID;
  _s.textContent = `
    @keyframes gp-particle { 0%,100%{opacity:.06;transform:translateY(0) rotate(0)} 50%{opacity:.15;transform:translateY(-30px) rotate(180deg)} }
    @keyframes gp-icon-bob { 0%,100%{transform:rotate(0) scale(1)} 25%{transform:rotate(5deg) scale(1.04)} 75%{transform:rotate(-5deg) scale(1)} }
    @keyframes gp-trophy-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
    @keyframes gp-daily-glow { 0%,100%{box-shadow:0 0 16px rgba(245,158,11,0.2),0 0 32px rgba(245,158,11,0.1)} 50%{box-shadow:0 0 24px rgba(245,158,11,0.35),0 0 48px rgba(245,158,11,0.18)} }
    @keyframes gp-fire-bob { 0%,100%{transform:rotate(0)} 50%{transform:rotate(3deg)} }
    @keyframes gp-study-icon-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
    @keyframes gp-arrow-nudge { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }
  `;
  document.head.appendChild(_s);
}
import { useAuth } from '../auth/AuthContext';
import { XP_REWARDS } from '../utils/xpEngine';
import { logAction } from '../utils/auditLog';
import { GAME_CONFIGS } from './types';
import { ENGLISH_CHAPTERS, MATHS_CHAPTERS, SCIENCE_CHAPTERS } from './subjects/engine/types';
import { getGameProgress } from './subjects/engine/progressStore';
import { GameCard, type GameCardDef } from './GameCard';
import { GameShell } from './GameShell';
import GamesHub, { type HubSection } from './hub/GamesHub';
import GameSection from './hub/GameSection';

// localStorage key used to signal parent layout to auto-open books
const BOOKS_NAV_KEY = 'ssms_navigate_to_books';

// ═══════════════════════════════════════════════════════════
// Helper: Build flat GameCardDef[] from chapter definitions
// ═══════════════════════════════════════════════════════════

function glowFromGradient(gradient: string): string {
  const colorMap: Record<string, string> = {
    'blue':    'rgba(59,130,246,0.3)',
    'cyan':    'rgba(6,182,212,0.3)',
    'purple':  'rgba(139,92,246,0.3)',
    'pink':    'rgba(236,72,153,0.3)',
    'green':   'rgba(16,185,129,0.3)',
    'emerald': 'rgba(16,185,129,0.3)',
    'orange':  'rgba(249,115,22,0.3)',
    'red':     'rgba(244,63,94,0.3)',
    'amber':   'rgba(245,158,11,0.3)',
    'yellow':  'rgba(234,179,8,0.3)',
    'indigo':  'rgba(99,102,241,0.3)',
    'violet':  'rgba(139,92,246,0.3)',
    'teal':    'rgba(20,184,166,0.3)',
    'fuchsia': 'rgba(192,38,211,0.3)',
    'rose':    'rgba(244,63,94,0.3)',
    'sky':     'rgba(14,165,233,0.3)',
  };
  for (const [key, val] of Object.entries(colorMap)) {
    if (gradient.includes(key)) return val;
  }
  return 'rgba(99,102,241,0.3)';
}

// Top 8 Arcade cards
const ARCADE_CARDS: GameCardDef[] = GAME_CONFIGS.map(g => ({
  id: `arcade-${g.id}`,
  gameTypeId: g.id,
  title: g.title,
  icon: g.icon,
  desc: g.desc,
  gradient: g.gradient,
  glowColor: g.glowColor,
  tag: g.tag,
  section: 'arcade' as const,
  subject: 'arcade',
  chapter: 'arcade',
  seq: g.seq,
}));

// English cards — flatten chapters into sequential cards
let engSeq = 1;
const ENGLISH_CARDS: GameCardDef[] = ENGLISH_CHAPTERS.flatMap(ch =>
  ch.games.map(g => ({
    id: `eng-${ch.id}-${g.id}`,
    gameTypeId: g.id,
    title: g.title,
    icon: g.icon,
    desc: `${ch.title}`,
    gradient: ch.gradient,
    glowColor: glowFromGradient(ch.gradient),
    tag: ch.icon,
    section: 'english' as const,
    subject: 'english',
    chapter: ch.id,
    seq: engSeq++,
  })),
);

// Maths cards — flatten chapters into sequential cards
let mathSeq = 1;
const MATHS_CARDS: GameCardDef[] = MATHS_CHAPTERS.flatMap(ch =>
  ch.games.map(g => ({
    id: `math-${ch.id}-${g.id}`,
    gameTypeId: g.id,
    title: g.title,
    icon: g.icon,
    desc: `${ch.title}`,
    gradient: ch.gradient,
    glowColor: glowFromGradient(ch.gradient),
    tag: ch.icon,
    section: 'maths' as const,
    subject: 'maths',
    chapter: ch.id,
    seq: mathSeq++,
  })),
);

// Science cards — flatten chapters into sequential cards
let sciSeq = 1;
const SCIENCE_CARDS: GameCardDef[] = SCIENCE_CHAPTERS.flatMap(ch =>
  ch.games.map(g => ({
    id: `sci-${ch.id}-${g.id}`,
    gameTypeId: g.id,
    title: g.title,
    icon: g.icon,
    desc: `${ch.title}`,
    gradient: ch.gradient,
    glowColor: glowFromGradient(ch.gradient),
    tag: ch.icon,
    section: 'science' as const,
    subject: 'science',
    chapter: ch.id,
    seq: sciSeq++,
  })),
);

// ═══════════════════════════════════════════════════════════
// Floating Particles (identical to old GameOrchestrator)
// ═══════════════════════════════════════════════════════════

const PARTICLE_EMOJIS = ['✨', '⭐', '🌟', '💫', '🎯', '🏆', '🎮', '🎨', '🚀', '🎪', '🌈', '🎶'];

/* CSS-only particles — no JS animation loop */
const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  emoji: PARTICLE_EMOJIS[i % PARTICLE_EMOJIS.length],
  left: `${8 + (i * 11.3) % 84}%`,
  top: `${8 + (i * 13.7) % 84}%`,
  size: 12 + (i % 4) * 3,
  dur: 6 + (i % 3) * 2,
  delay: i * 0.6,
}));

const FloatingParticles: React.FC = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {PARTICLES.map((p, i) => (
      <span
        key={i}
        style={{
          position: 'absolute',
          left: p.left,
          top: p.top,
          fontSize: p.size,
          opacity: 0,
          animation: `gp-particle ${p.dur}s ${p.delay}s ease-in-out infinite`,
          willChange: 'transform, opacity',
        }}
      >
        {p.emoji}
      </span>
    ))}
  </div>
));
FloatingParticles.displayName = 'FloatingParticles';

// ═══════════════════════════════════════════════════════════
// Arcade Hero Banner (identical to old)
// ═══════════════════════════════════════════════════════════

const ArcadeHeroBanner: React.FC<{ name: string }> = React.memo(({ name }) => (
  <motion.div
    className="relative rounded-3xl overflow-hidden mb-5"
    initial={{ y: -24, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 160, damping: 20 }}
  >
    <div
      className="absolute inset-0 rounded-3xl"
      style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 30%, #ec4899 60%, #f59e0b 100%)',
        backgroundSize: '300% 300%',
        animation: 'arcadeGradientShift 8s ease infinite',
      }}
    />
    <div className="absolute inset-0 bg-white/8" />

    <div className="relative px-5 py-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-3.5">
        <div
          className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl shadow-lg border border-white/25"
          style={{ animation: 'gp-icon-bob 4s ease-in-out infinite' }}
        >
          🕹️
        </div>
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
        <span
          className="text-xl"
          style={{ display: 'inline-block', animation: 'gp-trophy-bob 2.5s ease-in-out infinite' }}
        >
          🏆
        </span>
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

// ═══════════════════════════════════════════════════════════
// Daily Challenge Card (identical to old)
// ═══════════════════════════════════════════════════════════

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
        {!isDone && (
          <div
            className="absolute -inset-0.5 rounded-3xl pointer-events-none z-0"
            style={{ animation: 'gp-daily-glow 3s ease-in-out infinite' }}
          />
        )}

        <div className="relative bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-200/50 rounded-3xl px-4 py-3.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-md"
              style={!isDone ? { animation: 'gp-fire-bob 2.5s ease-in-out infinite' } : {}}
            >
              {isDone ? '🏅' : '🔥'}
            </div>
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

          <div className="flex items-center gap-1.5">
            {Array.from({ length: target }, (_, i) => (
              <motion.div
                key={i}
                className={`rounded-full flex items-center justify-center text-[9px] font-black border ${
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

// ═══════════════════════════════════════════════════════════
// Section Header
// ═══════════════════════════════════════════════════════════

const SectionHeader: React.FC<{ icon: string; title: string; subtitle: string; gradient: string }> = React.memo(
  ({ icon, title, subtitle, gradient }) => (
    <motion.div
      className="flex items-center gap-3 mb-4 mt-8"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 20 }}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-md`}>
        {icon}
      </div>
      <div>
        <h2 className="text-base font-black text-gray-800 tracking-tight">{title}</h2>
        <p className="text-[10px] text-gray-400 font-semibold">{subtitle}</p>
      </div>
    </motion.div>
  ),
);
SectionHeader.displayName = 'SectionHeader';

// ═══════════════════════════════════════════════════════════
// Study Material Card — auto-switches to Parent → Books
// ═══════════════════════════════════════════════════════════

const StudyMaterialCard: React.FC<{ onClick: () => void }> = React.memo(({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const glowColor = 'rgba(244,63,94,0.3)';
  const strongGlow = 'rgba(244,63,94,0.55)';

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group text-left w-full col-span-2 sm:col-span-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow */}
      <motion.div
        className="absolute -inset-px rounded-3xl pointer-events-none z-0"
        animate={{
          boxShadow: isHovered
            ? `0 0 18px ${strongGlow}, 0 0 36px ${glowColor}, 0 6px 24px rgba(0,0,0,0.06)`
            : `0 0 8px ${glowColor}, 0 2px 12px rgba(0,0,0,0.03)`,
        }}
        transition={{ duration: 0.3 }}
      />

      <div
        className="relative bg-white/90 border border-white/50 rounded-3xl p-5 flex items-center gap-5 overflow-hidden shadow-md"
      >
        {/* Gradient blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full opacity-8 blur-2xl group-hover:opacity-15 transition-opacity duration-500" />

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-3xl shadow-lg shrink-0 relative"
          style={{ animation: 'gp-study-icon-bob 3s ease-in-out infinite' }}
        >
          📚
          <div className="absolute inset-0 rounded-2xl bg-white/10" />
        </div>

        <div className="flex-1 min-w-0 relative z-10">
          <h3 className="text-[15px] font-black text-gray-800 mb-0.5">Study Material</h3>
          <p className="text-[11px] text-gray-400 mb-1">Read your magical NCERT & GSEB books 📖</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-rose-500 bg-rose-50/70 px-2 py-0.5 rounded-lg border border-rose-200/25">NCERT + GSEB</span>
            <span className="text-[10px] font-bold text-amber-500 bg-amber-50/70 px-2 py-0.5 rounded-lg border border-amber-200/25">📖 12 Books</span>
          </div>
        </div>

        {/* Arrow */}
        <div
          className="text-gray-300 text-xl shrink-0"
          style={isHovered ? { animation: 'gp-arrow-nudge 0.6s ease-in-out infinite' } : {}}
        >
          →
        </div>
      </div>
    </motion.button>
  );
});
StudyMaterialCard.displayName = 'StudyMaterialCard';

// ═══════════════════════════════════════════════════════════
// GameCenter Export — replaces old GameOrchestrator.GameCenter
// ═══════════════════════════════════════════════════════════

interface GameCenterProps {
  onGameWin: (xp: number) => void;
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
  onClickSound?: () => void;
}

export const GameCenter: React.FC<GameCenterProps> = ({
  onGameWin, onCorrectAnswer, onWrongAnswer, onClickSound,
}) => {
  const { user, setRole } = useAuth();
  const [activeGame, setActiveGame] = useState<GameCardDef | null>(null);
  const [hubSection, setHubSection] = useState<HubSection | 'hub'>('hub');
  const [dailyProgress, setDailyProgress] = useState(getDailyProgress);

  // Refresh daily on mount
  useEffect(() => {
    setDailyProgress(getDailyProgress());
  }, []);

  // ── Handlers ──

  const handleSelectGame = useCallback((game: GameCardDef) => {
    onClickSound?.();
    setActiveGame(game);
    logAction('game_selected', 'game', { game: game.gameTypeId, section: game.section });
  }, [onClickSound]);

  const handleExit = useCallback(() => setActiveGame(null), []);

  const handleGameWin = useCallback((xp: number) => {
    onGameWin(xp);
    setDailyProgress(incrementDaily());
  }, [onGameWin]);

  // ── Star count from progress store ──
  const getStars = useCallback((game: GameCardDef): number => {
    const gp = getGameProgress(game.subject, game.chapter, game.gameTypeId);
    let stars = 0;
    if (gp.easy.completed) stars++;
    if (gp.intermediate.completed) stars++;
    if (gp.difficult.completed) stars++;
    return stars;
  }, []);

  // ── Hub navigation ──
  const handleHubNavigate = useCallback((section: HubSection) => {
    onClickSound?.();
    // NCERT Library → direct redirect to Parent Dashboard Books (no intermediate screen)
    if (section === 'library') {
      logAction('hub_section_selected', 'navigation', { section: 'library' });
      logAction('study_material_click', 'navigation', {});
      try { localStorage.setItem(BOOKS_NAV_KEY, Date.now().toString()); } catch { /* ignore */ }
      setRole('parent');
      return;
    }
    setHubSection(section);
    logAction('hub_section_selected', 'navigation', { section });
  }, [onClickSound, setRole]);

  const handleBackToHub = useCallback(() => {
    onClickSound?.();
    setHubSection('hub');
  }, [onClickSound]);

  // ── Section config for Arcade / English / Maths ──
  const sectionConfig: Record<'arcade' | 'maths' | 'english' | 'science', {
    title: string; subtitle: string; icon: string; gradient: string; cards: GameCardDef[];
  }> = useMemo(() => ({
    arcade: {
      title: 'Arcade Arena', subtitle: 'Quick brain games for everyday fun!',
      icon: '🎮', gradient: 'linear-gradient(135deg, #FF7F50, #FF6347)', cards: ARCADE_CARDS,
    },
    maths: {
      title: 'Maths World', subtitle: 'Numbers, Shapes & Data — 18 games!',
      icon: '🔢', gradient: 'linear-gradient(135deg, #FFD166, #FFB347)', cards: MATHS_CARDS,
    },
    english: {
      title: 'English Kingdom', subtitle: 'Letters, Words & Sentences — 18 games!',
      icon: '📚', gradient: 'linear-gradient(135deg, #A8E6CF, #72D8A0)', cards: ENGLISH_CARDS,
    },
    science: {
      title: 'EVS Lab', subtitle: 'Explore Nature & Our World — 18 games!',
      icon: '🔬', gradient: 'linear-gradient(135deg, #86EFAC, #4ADE80)', cards: SCIENCE_CARDS,
    },
  }), []);

  return (
    <AnimatePresence mode="wait">
      {activeGame ? (
        /* ─── Active Game (GameShell) ─── */
        <motion.div
          key={activeGame.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="py-4"
          style={{ borderRadius: 0 }}
        >
          <GameShell
            gameTypeId={activeGame.gameTypeId}
            subject={activeGame.subject}
            chapter={activeGame.chapter}
            title={activeGame.title}
            icon={activeGame.icon}
            onExit={handleExit}
            onGameWin={handleGameWin}
            onCorrectAnswer={onCorrectAnswer}
            onWrongAnswer={onWrongAnswer}
            onClickSound={onClickSound}
          />
        </motion.div>
      ) : hubSection === 'hub' ? (
        /* ─── Games Hub (4 section cards) ─── */
        <motion.div
          key="hub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <GamesHub
            onNavigate={handleHubNavigate}
            studentName={user.name}
          />
        </motion.div>
      ) : (
        /* ─── Arcade / Maths / English sections ─── */
        <motion.div
          key={hubSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <GameSection
            {...sectionConfig[hubSection]}
            getStars={getStars}
            onSelectGame={handleSelectGame}
            onBack={handleBackToHub}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameCenter;
