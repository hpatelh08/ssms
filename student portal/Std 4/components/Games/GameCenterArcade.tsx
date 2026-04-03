/**
 * 🕹️ Learning Arcade – 8-Game Center (Redesigned)
 * ==================================================
 * Premium arcade grid with 8 games in strict sequence:
 *  1. ShapeQuest  2. NumberTap  3. MathPuzzle  4. WordBuilder
 *  5. GuessTheWord  6. PictureIdentify  7. CountObjects  8. MatchLetters
 *
 * Features: 3D tilt cards, hover glow, floating particles,
 * immersive transitions, sequential game flow, XP integration.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logAction } from '../../utils/auditLog';
import { XP_REWARDS } from '../../utils/xpEngine';

// ─── Game imports ─────────────────────────────────────────
import { ShapeQuest } from './ShapeQuest/ShapeQuest';
// ColorMatch removed — replaced by NumberTap (standalone via Orchestrator)
import { MathPuzzle } from './MathPuzzle/MathPuzzle';
import { WordBuilder } from './WordBuilder/WordBuilder';
import { GuessTheWord } from './GuessTheWord/GuessTheWord';
import { PictureIdentify } from './PictureIdentify/PictureIdentify';
import { CountObjects } from './CountObjects/CountObjects';
import { MatchLetters } from './MatchLetters/MatchLetters';

// ─── Game ID type ─────────────────────────────────────────

type GameId = 'NONE' | 'SHAPES' | 'NUMBERS' | 'MATH' | 'WORDS' | 'GUESS' | 'PICTURE' | 'COUNT' | 'LETTERS';

// ─── Game Card Definitions ────────────────────────────────

interface GameDef {
  id: GameId;
  seq: number;
  icon: string;
  title: string;
  desc: string;
  gradient: string;
  glowColor: string;
  tag: string;
}

const GAMES: GameDef[] = [
  {
    id: 'SHAPES', seq: 1, icon: '🔺', title: 'Shape Quest',
    desc: 'Match the correct shape!', gradient: 'from-cyan-500 via-blue-400 to-blue-500',
    glowColor: 'rgba(6,182,212,0.3)', tag: 'Shapes',
  },
  {
    id: 'NUMBERS', seq: 2, icon: '🔢', title: 'Number Tap',
    desc: 'Tap the right number!', gradient: 'from-indigo-500 via-violet-400 to-purple-500',
    glowColor: 'rgba(99,102,241,0.3)', tag: 'Numbers',
  },
  {
    id: 'MATH', seq: 3, icon: '➕', title: 'Math Puzzle',
    desc: 'Solve addition challenges!', gradient: 'from-purple-500 via-purple-400 to-indigo-500',
    glowColor: 'rgba(139,92,246,0.3)', tag: 'Numbers',
  },
  {
    id: 'WORDS', seq: 4, icon: '🔤', title: 'Word Builder',
    desc: 'Find the missing letters!', gradient: 'from-orange-500 via-amber-400 to-yellow-500',
    glowColor: 'rgba(249,115,22,0.3)', tag: 'English',
  },
  {
    id: 'GUESS', seq: 5, icon: '🖼️', title: 'Guess The Word',
    desc: 'Name the picture!', gradient: 'from-green-500 via-emerald-400 to-teal-500',
    glowColor: 'rgba(16,185,129,0.3)', tag: 'NEW',
  },
  {
    id: 'PICTURE', seq: 6, icon: '🔍', title: 'Picture Identify',
    desc: 'Find the right category!', gradient: 'from-violet-500 via-purple-400 to-fuchsia-500',
    glowColor: 'rgba(139,92,246,0.3)', tag: 'NEW',
  },
  {
    id: 'COUNT', seq: 7, icon: '🔢', title: 'Count Objects',
    desc: 'How many can you count?', gradient: 'from-rose-500 via-pink-400 to-red-500',
    glowColor: 'rgba(244,63,94,0.3)', tag: 'BONUS',
  },
  {
    id: 'LETTERS', seq: 8, icon: '🔡', title: 'Match Letters',
    desc: 'Match A→a, B→b!', gradient: 'from-sky-500 via-blue-400 to-indigo-500',
    glowColor: 'rgba(14,165,233,0.3)', tag: 'BONUS',
  },
];

// ─── Floating Particles ──────────────────────────────────

const PARTICLE_EMOJIS = ['✨', '⭐', '🌟', '💫', '🎯', '🏆', '🎮', '🎨'];

const FloatingParticles: React.FC = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {Array.from({ length: 8 }, (_, i) => (
      <motion.span
        key={i}
        className="absolute text-xl opacity-20"
        style={{ left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 80}%` }}
        animate={{
          y: [0, -30, 0], x: [0, Math.random() * 20 - 10, 0],
          rotate: [0, 360], opacity: [0.1, 0.25, 0.1],
        }}
        transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
      >
        {PARTICLE_EMOJIS[i % PARTICLE_EMOJIS.length]}
      </motion.span>
    ))}
  </div>
));
FloatingParticles.displayName = 'FloatingParticles';

// ─── Arcade Game Tile ─────────────────────────────────────

interface ArcadeTileProps {
  game: GameDef;
  index: number;
  onClick: () => void;
}

const ArcadeTile: React.FC<ArcadeTileProps> = React.memo(({ game, index, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isNew = game.tag === 'NEW';
  const isBonus = game.tag === 'BONUS';

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group text-left w-full"
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.96 }}
      style={{ perspective: '800px' }}
    >
      {/* Glow */}
      <motion.div
        className="absolute -inset-[2px] rounded-[24px] pointer-events-none z-0"
        animate={{ boxShadow: isHovered ? `0 0 30px ${game.glowColor}, 0 0 60px ${game.glowColor}` : '0 0 0 transparent' }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className="relative bg-white/75 backdrop-blur-2xl border border-white/40 rounded-[24px] p-5 flex flex-col items-center text-center overflow-hidden"
        whileHover={{ rotateY: -3, rotateX: 2 }}
        transition={{ type: 'spring', stiffness: 300 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Gradient blobs */}
        <div className={`absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-br ${game.gradient} rounded-full opacity-10 blur-3xl group-hover:opacity-25 transition-opacity duration-500`} />

        {/* Seq badge */}
        <div className="absolute top-2.5 left-3 bg-gray-100/60 text-gray-400 text-[9px] font-black w-5 h-5 rounded-lg flex items-center justify-center">
          {game.seq}
        </div>

        {/* Tag */}
        {(isNew || isBonus) && (
          <motion.div
            className={`absolute top-2.5 right-3 text-white text-[8px] font-black px-2 py-0.5 rounded-lg shadow-sm z-10 ${
              isNew ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'
            }`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {game.tag}
          </motion.div>
        )}

        {/* Icon */}
        <motion.div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-3xl mb-3 shadow-xl relative`}
          whileHover={{ rotate: [0, -5, 5, 0], scale: 1.08 }}
          transition={{ duration: 0.5 }}
        >
          {game.icon}
          <div className="absolute inset-0 rounded-2xl bg-white/10" />
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-white/30"
            animate={isHovered ? { scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>

        <h3 className="text-sm font-bold text-blue-900 mb-0.5 relative z-10">{game.title}</h3>
        <p className="text-[10px] text-blue-400 mb-2 relative z-10">{game.desc}</p>

        {/* XP badge */}
        <div className="flex items-center gap-1 bg-amber-100/60 px-3 py-1.5 rounded-lg relative z-10 border border-amber-200/30">
          <span className="text-amber-500 text-xs">✨</span>
          <span className="font-bold text-amber-600 text-[10px]">+{XP_REWARDS.GAME_WIN} XP</span>
        </div>

        {/* Play indicator */}
        <motion.div
          className="mt-2 text-[9px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1"
          animate={{ opacity: isHovered ? 1 : 0.4 }}
        >
          <motion.span animate={isHovered ? { x: [0, 4, 0] } : {}} transition={{ duration: 0.6, repeat: Infinity }}>▶</motion.span>
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
}

export const GameCenter: React.FC<GameCenterProps> = ({ onGameWin }) => {
  const [activeGame, setActiveGame] = useState<GameId>('NONE');

  const handleExit = useCallback(() => setActiveGame('NONE'), []);

  const handleSelectGame = useCallback((id: GameId) => {
    setActiveGame(id);
    logAction('game_started', 'game', { game: id.toLowerCase() });
  }, []);

  // Sequential "Next Game" handler
  const handleNextGame = useCallback(() => {
    const currentIndex = GAMES.findIndex(g => g.id === activeGame);
    if (currentIndex >= 0 && currentIndex < GAMES.length - 1) {
      const nextGame = GAMES[currentIndex + 1];
      setActiveGame(nextGame.id);
      logAction('next_game', 'game', { from: activeGame, to: nextGame.id });
    } else {
      setActiveGame('NONE');
    }
  }, [activeGame]);

  // ─── Render active game ─────────────────────────────────
  const renderGame = () => {
    const gameProps = { onExit: handleExit, onWin: onGameWin, onNextGame: handleNextGame };
    switch (activeGame) {
      case 'SHAPES':  return <ShapeQuest {...gameProps} />;
      case 'NUMBERS': return null; // NumberTap runs standalone via Orchestrator
      case 'MATH':    return <MathPuzzle {...gameProps} />;
      case 'WORDS':   return <WordBuilder {...gameProps} />;
      case 'GUESS':   return <GuessTheWord {...gameProps} />;
      case 'PICTURE': return <PictureIdentify {...gameProps} />;
      case 'COUNT':   return <CountObjects {...gameProps} />;
      case 'LETTERS': return <MatchLetters {...gameProps} />;
      default:        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {activeGame !== 'NONE' ? (
        <motion.div
          key={activeGame}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          {renderGame()}
        </motion.div>
      ) : (
        <motion.div
          key="menu"
          className="max-w-3xl mx-auto relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Arcade Header */}
          <motion.div
            className="text-center mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="inline-flex items-center gap-3 mb-2">
              <motion.span
                className="text-4xl"
                animate={{ rotate: [0, 10, -10, 0], y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🕹️
              </motion.span>
              <h1 className="text-2xl font-black text-blue-900 tracking-tight">Learning Arcade</h1>
            </div>
            <p className="text-sm text-gray-400 font-medium">8 games to explore — earn XP! ✨</p>
          </motion.div>

          <FloatingParticles />

          {/* 2x4 Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
            {GAMES.map((game, i) => (
              <ArcadeTile key={game.id} game={game} index={i} onClick={() => handleSelectGame(game.id)} />
            ))}
          </div>

          <motion.p
            className="text-center mt-6 text-[10px] text-gray-300 font-medium"
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
