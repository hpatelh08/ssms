/**
 * SubjectGamesHub – English & Maths chapter-based game hub
 * =========================================================
 * 3-screen flow within a single component:
 *   hub → chapter → game session (full-screen overlay)
 *
 * Unified styling — cards match the main Arcade tiles
 * (glassmorphism, animated glow, 3D tilt, gradient blobs).
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Subject, Difficulty, ChapterDef, GameTypeDef,
  ENGLISH_CHAPTERS, MATHS_CHAPTERS, DIFF_META, BADGE_DEFS,
} from './engine/types';
import { getGameProgress } from './engine/progressStore';
import { DifficultySelector } from './components/DifficultySelector';
import { GameSessionScreen } from './GameSessionScreen';

// ── Props ──

interface Props {
  onGameWin: (xp: number) => void;
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
  onClickSound?: () => void;
}

// ── View state ──

type View =
  | { screen: 'hub' }
  | { screen: 'chapter'; subject: Subject; chapter: ChapterDef }
  | { screen: 'gameType'; subject: Subject; chapter: ChapterDef; game: GameTypeDef }
  | { screen: 'playing'; subject: Subject; chapter: ChapterDef; game: GameTypeDef; difficulty: Difficulty };

// ── Subject Section Header ──

const SectionHeader: React.FC<{ icon: string; title: string; gradient: string }> = ({ icon, title, gradient }) => (
  <motion.div
    className="flex items-center gap-3 mb-4 mt-8"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ type: 'spring', stiffness: 200 }}
  >
    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-lg`}>
      {icon}
    </div>
    <h2 className="text-lg font-black text-gray-800 tracking-tight">{title}</h2>
  </motion.div>
);

// ── Chapter Card (arcade-matched styling) ──

/** Maps chapter gradients to glow colours for the animated box-shadow. */
const GLOW_MAP: Record<string, string> = {
  'from-blue-400 to-cyan-400': 'rgba(56,189,248,0.35)',
  'from-rose-400 to-pink-400': 'rgba(244,63,94,0.35)',
  'from-green-400 to-emerald-400': 'rgba(52,211,153,0.35)',
  'from-orange-400 to-red-400': 'rgba(251,146,60,0.35)',
  'from-yellow-400 to-orange-400': 'rgba(250,204,21,0.35)',
  'from-amber-400 to-orange-400': 'rgba(245,158,11,0.35)',
  'from-amber-500 to-orange-500': 'rgba(245,158,11,0.35)',
  'from-green-500 to-teal-500': 'rgba(20,184,166,0.35)',
  'from-rose-500 to-pink-500': 'rgba(244,63,94,0.35)',
  'from-orange-500 to-amber-500': 'rgba(245,158,11,0.35)',
  'from-cyan-500 to-blue-500': 'rgba(6,182,212,0.35)',
};

const ChapterCard: React.FC<{
  chapter: ChapterDef;
  index: number;
  subject: Subject;
  onClick: () => void;
}> = React.memo(({ chapter, index, subject, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Quick progress check
  const totalGames = chapter.games.length;
  const completedGames = chapter.games.filter(g => {
    const p = getGameProgress(subject, chapter.id, g.id);
    return p.easy.completed || p.intermediate.completed || p.difficult.completed;
  }).length;

  const glow = GLOW_MAP[chapter.gradient] ?? 'rgba(139,92,246,0.35)';
  const glowSoft = glow.replace(/[\d.]+\)$/, '0.18)');

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
      {/* Animated glow */}
      <motion.div
        className="absolute -inset-px rounded-3xl pointer-events-none z-0"
        animate={{
          boxShadow: isHovered
            ? `0 0 18px ${glow}, 0 0 36px ${glowSoft}, 0 6px 24px rgba(0,0,0,0.06)`
            : `0 0 8px ${glowSoft}, 0 2px 12px rgba(0,0,0,0.03)`,
        }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className="relative bg-white/80 backdrop-blur-2xl border border-white/50 rounded-3xl p-5 overflow-hidden shadow-md"
        whileHover={{ rotateY: -2, rotateX: 1.5 }}
        transition={{ type: 'spring', stiffness: 300 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Gradient blobs */}
        <div className={`absolute -top-8 -right-8 w-36 h-36 bg-gradient-to-br ${chapter.gradient} rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
        <div className={`absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-tr ${chapter.gradient} rounded-full opacity-[0.06] blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500`} />

        <div className="flex items-center gap-3.5 relative z-10">
          {/* Icon – gradient box matching ArcadeTile icon */}
          <motion.div
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${chapter.gradient} flex items-center justify-center text-2xl shadow-lg flex-shrink-0 relative`}
            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.08 }}
            transition={{ duration: 0.5 }}
          >
            {chapter.icon}
            <div className="absolute inset-0 rounded-xl bg-white/10" />
            <motion.div
              className="absolute inset-0 rounded-xl border border-white/25"
              animate={isHovered ? { scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] } : {}}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-[13px] truncate">{chapter.title}</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              {totalGames} games • {completedGames > 0 ? `${completedGames} started` : 'Tap to play'}
            </p>
            {/* Mini star progress */}
            <div className="flex items-center gap-0.5 mt-1">
              {chapter.games.map((g, gi) => {
                const gp = getGameProgress(subject, chapter.id, g.id);
                const started = gp.easy.completed || gp.intermediate.completed || gp.difficult.completed;
                return (
                  <motion.span
                    key={gi}
                    className={`text-[9px] ${started ? 'opacity-100' : 'opacity-20'}`}
                    initial={started ? { scale: 0 } : {}}
                    animate={started ? { scale: 1 } : {}}
                    transition={{ delay: gi * 0.1, type: 'spring' }}
                  >
                    ⭐
                  </motion.span>
                );
              })}
            </div>
          </div>

          <motion.div
            className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-0.5"
            animate={{ opacity: isHovered ? 1 : 0.35 }}
          >
            <motion.span
              animate={isHovered ? { x: [0, 4, 0] } : {}}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              ▶
            </motion.span>
          </motion.div>
        </div>
      </motion.div>
    </motion.button>
  );
});
ChapterCard.displayName = 'ChapterCard';

// ── Game Type Card (arcade-matched styling) ──

const GameTypeCard: React.FC<{
  game: GameTypeDef;
  subject: Subject;
  chapterId: string;
  index: number;
  onClick: () => void;
}> = React.memo(({ game, subject, chapterId, index, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const progress = getGameProgress(subject, chapterId, game.id);
  const badges = progress.badges;
  const hasBadge = badges.length > 0;

  const diffsDone = [progress.easy.completed, progress.intermediate.completed, progress.difficult.completed].filter(Boolean).length;
  const glowColor = 'rgba(99,102,241,0.30)';
  const glowSoft = 'rgba(99,102,241,0.14)';

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full text-left relative group"
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{ perspective: '800px' }}
    >
      {/* Glow */}
      <motion.div
        className="absolute -inset-px rounded-2xl pointer-events-none z-0"
        animate={{
          boxShadow: isHovered
            ? `0 0 14px ${glowColor}, 0 0 28px ${glowSoft}, 0 4px 16px rgba(0,0,0,0.04)`
            : `0 0 6px ${glowSoft}, 0 1px 8px rgba(0,0,0,0.02)`,
        }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className="relative bg-white/80 backdrop-blur-2xl border border-white/50 rounded-2xl p-4 flex items-center gap-3 overflow-hidden shadow-md"
        whileHover={{ rotateY: -1.5, rotateX: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Gradient blob */}
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full opacity-[0.06] blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500" />

        <motion.div
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-xl flex-shrink-0 shadow-sm relative"
          whileHover={{ rotate: [0, -5, 5, 0], scale: 1.08 }}
          transition={{ duration: 0.5 }}
        >
          {game.icon}
          <motion.div
            className="absolute inset-0 rounded-xl border border-amber-200/40"
            animate={isHovered ? { scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] } : {}}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        </motion.div>

        <div className="flex-1 min-w-0 relative z-10">
          <h4 className="font-bold text-gray-700 text-sm">{game.title}</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            {hasBadge && badges.map(b => {
              const def = BADGE_DEFS[b as keyof typeof BADGE_DEFS];
              return def ? <span key={b} className="text-xs" title={def.title}>{def.icon}</span> : null;
            })}
            {!hasBadge && <span className="text-[10px] text-gray-400">3 difficulties • 5 levels each</span>}
          </div>
          {/* Difficulty dots */}
          <div className="flex items-center gap-1 mt-1">
            {['easy', 'intermediate', 'difficult'].map(d => {
              const done = progress[d as keyof typeof progress] &&
                typeof progress[d as keyof typeof progress] === 'object' &&
                (progress[d as keyof typeof progress] as any).completed;
              return (
                <div key={d} className={`w-2 h-2 rounded-full ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
              );
            })}
          </div>
        </div>

        <motion.div
          className="text-[9px] font-bold text-gray-300 uppercase tracking-widest"
          animate={{ opacity: isHovered ? 1 : 0.35 }}
        >
          <motion.span
            animate={isHovered ? { x: [0, 3, 0] } : {}}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            ▶
          </motion.span>
        </motion.div>
      </motion.div>
    </motion.button>
  );
});
GameTypeCard.displayName = 'GameTypeCard';

// ── Breadcrumb Navigation ──

const Breadcrumb: React.FC<{
  items: { label: string; onClick?: () => void }[];
}> = ({ items }) => (
  <div className="flex items-center gap-1 text-xs font-medium mb-4 flex-wrap">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="text-gray-300 mx-0.5">›</span>}
        {item.onClick ? (
          <button onClick={item.onClick} className="text-amber-500 hover:text-amber-700 transition-colors">
            {item.label}
          </button>
        ) : (
          <span className="text-gray-500">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </div>
);

// ── Main Hub Component ──

export const SubjectGamesHub: React.FC<Props> = ({ onGameWin, onCorrectAnswer, onWrongAnswer, onClickSound }) => {
  const [view, setView] = useState<View>({ screen: 'hub' });

  const goToHub = useCallback(() => setView({ screen: 'hub' }), []);

  const goToChapter = useCallback((subject: Subject, chapter: ChapterDef) => {
    setView({ screen: 'chapter', subject, chapter });
  }, []);

  const goToGameType = useCallback((subject: Subject, chapter: ChapterDef, game: GameTypeDef) => {
    setView({ screen: 'gameType', subject, chapter, game });
  }, []);

  const startGame = useCallback((subject: Subject, chapter: ChapterDef, game: GameTypeDef, difficulty: Difficulty) => {
    setView({ screen: 'playing', subject, chapter, game, difficulty });
  }, []);

  // ── Game Session (full-screen overlay) ──
  if (view.screen === 'playing') {
    return (
      <motion.div
        className="fixed inset-0 z-[100] bg-gradient-to-b from-blue-50/95 via-purple-50/90 to-pink-50/95 backdrop-blur-2xl overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="max-w-lg mx-auto px-4 pt-6 pb-20">
          <GameSessionScreen
            subject={view.subject}
            chapter={view.chapter}
            gameType={view.game}
            difficulty={view.difficulty}
            onExit={() => goToGameType(view.subject, view.chapter, view.game)}
            onGameWin={onGameWin}
            onCorrectAnswer={onCorrectAnswer}
            onWrongAnswer={onWrongAnswer}
            onClickSound={onClickSound}
          />
        </div>
      </motion.div>
    );
  }

  // ── Chapter Detail (game types + difficulty) ──
  if (view.screen === 'gameType') {
    const gp = getGameProgress(view.subject, view.chapter.id, view.game.id);

    return (
      <div className="mt-2">
        <Breadcrumb items={[
          { label: '🎮 Games', onClick: goToHub },
          { label: `${view.chapter.icon} ${view.chapter.title}`, onClick: () => goToChapter(view.subject, view.chapter) },
          { label: `${view.game.icon} ${view.game.title}` },
        ]} />

        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-4xl">{view.game.icon}</span>
          <h2 className="text-xl font-black text-gray-800 mt-2">{view.game.title}</h2>
          <p className="text-xs text-gray-400 mt-1">
            {view.chapter.icon} {view.chapter.title} •{' '}
            {view.subject === 'english' ? '📘 English' : '🔢 Maths'}
          </p>
        </motion.div>

        <DifficultySelector
          onSelect={(d) => startGame(view.subject, view.chapter, view.game, d)}
          progress={{ easy: gp.easy, intermediate: gp.intermediate, difficult: gp.difficult }}
        />

        {/* Badges */}
        {gp.badges.length > 0 && (
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Earned Badges</p>
            <div className="flex justify-center gap-2">
              {gp.badges.map(b => {
                const def = BADGE_DEFS[b as keyof typeof BADGE_DEFS];
                return def ? (
                  <div key={b} className="flex flex-col items-center gap-1 bg-white/60 px-3 py-2 rounded-xl border border-gray-200/30">
                    <span className="text-2xl">{def.icon}</span>
                    <span className="text-[9px] text-gray-500 font-bold">{def.title}</span>
                  </div>
                ) : null;
              })}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  if (view.screen === 'chapter') {
    return (
      <div className="mt-2">
        <Breadcrumb items={[
          { label: '🎮 Games', onClick: goToHub },
          { label: `${view.chapter.icon} ${view.chapter.title}` },
        ]} />

        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={`inline-flex w-16 h-16 rounded-3xl bg-gradient-to-br ${view.chapter.gradient} items-center justify-center text-3xl shadow-xl mb-3`}>
            {view.chapter.icon}
          </div>
          <h2 className="text-xl font-black text-gray-800">{view.chapter.title}</h2>
          <p className="text-xs text-gray-400 mt-1">Pick a game to play</p>
        </motion.div>

        <div className="flex flex-col gap-2.5 max-w-md mx-auto">
          {view.chapter.games.map((game, i) => (
            <GameTypeCard
              key={game.id}
              game={game}
              subject={view.subject}
              chapterId={view.chapter.id}
              index={i}
              onClick={() => goToGameType(view.subject, view.chapter, game)}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Hub (default) ──
  return (
    <div className="mt-2">
      {/* English Games */}
      <SectionHeader icon="📘" title="English Games" gradient="from-blue-500 to-cyan-500" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ENGLISH_CHAPTERS.map((ch, i) => (
          <ChapterCard
            key={ch.id}
            chapter={ch}
            index={i}
            subject="english"
            onClick={() => goToChapter('english', ch)}
          />
        ))}
      </div>

      {/* Maths Games */}
      <SectionHeader icon="🔢" title="Maths Games" gradient="from-amber-500 to-orange-500" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MATHS_CHAPTERS.map((ch, i) => (
          <ChapterCard
            key={ch.id}
            chapter={ch}
            index={i}
            subject="maths"
            onClick={() => goToChapter('maths', ch)}
          />
        ))}
      </div>

      <motion.p
        className="text-center mt-6 mb-2 text-[10px] text-gray-300 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        📚 Chapter-based learning • Progressive difficulty • Earn badges!
      </motion.p>
    </div>
  );
};

export default SubjectGamesHub;
