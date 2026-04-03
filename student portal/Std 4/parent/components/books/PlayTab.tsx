/**
 * parent/components/books/PlayTab.tsx
 * ─────────────────────────────────────────────────────
 * Play Mode — Mini learning games derived from chapter content.
 *
 * Games:
 *  - Drag & Drop (match words to meanings)
 *  - Word Puzzle (unscramble letters)
 *  - Letter Build (arrange letters to form words)
 *  - Picture Match (match descriptions to emojis)
 *  - Sound Match (find rhyming words)
 *
 * Same celebration/reward UX as the main Game Center.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookEntry, BookChapter } from '../../../data/bookConfig';
import { getMiniGames, type MiniGame } from '../../../services/chapterIntelligence';
import { completePlay, startActivityTimer, stopActivityTimer } from '../../../services/progressTracker';

const spring = { type: 'spring' as const, stiffness: 260, damping: 26 };

const GAME_ICONS: Record<string, { emoji: string; color: string; bg: string }> = {
  drag_drop: { emoji: '🎯', color: '-amber-', bg: '-amber- -orange-' },
  word_puzzle: { emoji: '🧩', color: 'text-pink-600', bg: 'from-pink-400 to-rose-500' },
  letter_build: { emoji: '🔤', color: 'text-amber-600', bg: 'from-amber-400 to-orange-500' },
  picture_match: { emoji: '🖼️', color: 'text-emerald-600', bg: 'from-emerald-400 to-green-500' },
  sound_match: { emoji: '🔊', color: '-yellow-', bg: '-yellow- -emerald-' },
};

interface Props {
  book: BookEntry;
  chapter: BookChapter;
}

export const PlayTab: React.FC<Props> = ({ book, chapter }) => {
  const [games, setGames] = useState<MiniGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeGame, setActiveGame] = useState<number | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    startActivityTimer(book.id, chapter.id, 'play');
    return () => { stopActivityTimer(); };
  }, [book.id, chapter.id]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getMiniGames(book, chapter);
      setGames(result);
    } catch {
      setError('Failed to create games.');
    } finally {
      setLoading(false);
    }
  }, [book, chapter]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  const handleGameFinish = useCallback((score: number, total: number) => {
    const pct = Math.round((score / total) * 100);
    setGameScore(pct);
    setGameComplete(true);
    completePlay(book.id, chapter.id, pct);
  }, [book.id, chapter.id]);

  if (loading) return <GameLoading />;
  if (error) return <GameError message={error} onRetry={fetchGames} />;

  // Game complete celebration
  if (gameComplete) {
    return (
      <motion.div
        className="max-w-md mx-auto flex flex-col items-center py-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.span
          className="text-7xl mb-4"
          animate={{ scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] }}
          transition={{ duration: 1 }}
        >
          {gameScore >= 80 ? '🏆' : gameScore >= 50 ? '🌟' : '💪'}
        </motion.span>
        <h3 className="text-xl font-black text-gray-800">Game Complete!</h3>
        <p className="text-sm text-gray-500 mt-1">Score: {gameScore}%</p>
        <div className="flex gap-1 mt-3">
          {[1, 2, 3].map(s => (
            <motion.span key={s} className="text-2xl" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: s * 0.2 }}>
              {gameScore >= s * 30 ? '⭐' : '☆'}
            </motion.span>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <motion.button
            onClick={() => { setGameComplete(false); setActiveGame(null); }}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 bg-white border border-gray-200 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎮 More Games
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Active game
  if (activeGame !== null && games[activeGame]) {
    return (
      <MatchingGame
        game={games[activeGame]}
        onFinish={handleGameFinish}
        onBack={() => setActiveGame(null)}
      />
    );
  }

  // Game selection
  return (
    <motion.div
      className="max-w-lg mx-auto py-6 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-center mb-4">
        <motion.span
          className="text-5xl inline-block"
          animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          🎮
        </motion.span>
        <h3 className="text-lg font-black text-gray-800 mt-2">Play & Learn!</h3>
        <p className="text-xs text-gray-400">Choose a game to play</p>
      </div>

      {games.map((game, i) => {
        const info = GAME_ICONS[game.type] || GAME_ICONS.drag_drop;
        return (
          <motion.button
            key={i}
            onClick={() => setActiveGame(i)}
            className="w-full rounded-3xl p-5 flex items-center gap-4 cursor-pointer text-left"
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${info.bg} flex items-center justify-center shadow-md`}
              animate={{ rotate: [0, 3, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <span className="text-2xl">{game.emoji || info.emoji}</span>
            </motion.div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-black ${info.color}`}>{game.title}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">{game.instruction}</p>
              <span className="text-[9px] font-bold text-gray-300 uppercase">
                {game.type.replace('_', ' ')} · {game.items.length} items
              </span>
            </div>
            <span className="text-gray-300 text-lg">▶</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

// ─── Matching Game Component ──────────────────────────────

const MatchingGame: React.FC<{
  game: MiniGame;
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
}> = ({ game, onFinish, onBack }) => {
  const items = useMemo(() => game.items.filter(i => i.text && i.match), [game.items]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Shuffled right-side items
  const rightItems = useMemo(() => {
    const arr = items.map(i => ({ id: i.id, match: i.match || '' }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [items]);

  const handleLeftClick = useCallback((id: string) => {
    if (matched.has(id)) return;
    setSelected(prev => prev === id ? null : id);
    setWrong(null);
  }, [matched]);

  const handleRightClick = useCallback((matchValue: string, matchId: string) => {
    if (!selected) return;
    setAttempts(a => a + 1);

    const item = items.find(i => i.id === selected);
    if (item && item.match === matchValue) {
      setMatched(prev => new Set(prev).add(selected));
      setScore(s => s + 1);
      setSelected(null);
      setWrong(null);

      // Check if all matched
      if (matched.size + 1 >= items.length) {
        setTimeout(() => onFinish(score + 1, items.length), 800);
      }
    } else {
      setWrong(matchId);
      setTimeout(() => setWrong(null), 800);
    }
  }, [selected, items, matched, score, onFinish]);

  const info = GAME_ICONS[game.type] || GAME_ICONS.drag_drop;

  return (
    <motion.div
      className="max-w-2xl mx-auto py-4 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>
        <div className="text-center">
          <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
            {game.emoji} {game.title}
          </h3>
          <p className="text-[10px] text-gray-400">{game.instruction}</p>
        </div>
        <span className="text-xs font-bold text-gray-500">
          {matched.size}/{items.length}
        </span>
      </div>

      {/* Progress */}
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${info.bg}`}
          animate={{ width: `${(matched.size / items.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Matching Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left column - items */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-gray-400 text-center mb-1">TAP TO SELECT</p>
          {items.map(item => (
            <motion.button
              key={item.id}
              onClick={() => handleLeftClick(item.id)}
              disabled={matched.has(item.id)}
              className={`w-full p-3.5 rounded-2xl text-[13px] font-bold cursor-pointer transition-all text-center ${
                matched.has(item.id)
                  ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-200 opacity-60'
                  : selected === item.id
                  ? '-amber- -amber- border-2 -amber- shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
              whileHover={matched.has(item.id) ? {} : { scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              layout
            >
              {item.emoji && <span className="mr-1.5">{item.emoji}</span>}
              {item.text}
              {matched.has(item.id) && <span className="ml-2">✅</span>}
            </motion.button>
          ))}
        </div>

        {/* Right column - matches */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-gray-400 text-center mb-1">MATCH WITH</p>
          {rightItems.map(item => {
            const isMatched = Array.from(matched).some(mId => items.find(i => i.id === mId)?.match === item.match);
            return (
              <motion.button
                key={item.id + '-match'}
                onClick={() => handleRightClick(item.match, item.id)}
                disabled={isMatched || !selected}
                className={`w-full p-3.5 rounded-2xl text-[13px] font-bold cursor-pointer transition-all text-center ${
                  isMatched
                    ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-200 opacity-60'
                    : wrong === item.id
                    ? 'bg-red-100 text-red-600 border-2 border-red-300'
                    : selected
                    ? '-orange- -orange- border -orange- hover:-orange-'
                    : 'bg-gray-50 text-gray-500 border border-gray-200'
                }`}
                whileHover={isMatched || !selected ? {} : { scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={wrong === item.id ? { x: [0, -5, 5, -5, 0] } : {}}
                layout
              >
                {item.match}
                {isMatched && <span className="ml-2">✅</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Score */}
      <p className="text-center text-[11px] text-gray-400 font-bold">
        {selected ? '👆 Now tap the matching item on the right!' : '👈 Tap an item on the left to start matching'}
      </p>
    </motion.div>
  );
};

// Helpers
const GameLoading: React.FC = () => (
  <motion.div className="flex flex-col items-center justify-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <motion.div className="text-4xl" animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>🎮</motion.div>
    <p className="text-sm text-gray-400 mt-4 font-medium">Creating games...</p>
  </motion.div>
);

const GameError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <motion.div className="flex flex-col items-center justify-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <span className="text-3xl mb-3">😕</span>
    <p className="text-sm text-gray-500 mb-4">{message}</p>
    <motion.button onClick={onRetry} className="px-4 py-2 rounded-2xl -amber- -amber- text-xs font-bold cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      Try Again
    </motion.button>
  </motion.div>
);
