/**
 * parent/components/books/ChapterListView.tsx
 * ─────────────────────────────────────────────────────
 * Child-friendly chapter card list for a book.
 * Shows: chapter name, stars, progress %, listen button.
 *
 * Replaces the old plain chapter selector modal.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookEntry, BookChapter } from '../../../data/bookConfig';
import { getChapterProgress, getChapterStars } from '../../../services/progressTracker';
import { pronounceWord, getLanguageForSubject } from '../../../services/voiceService';

const spring = { type: 'spring' as const, stiffness: 280, damping: 28 };

// Chapter illustrations — map chapter index to emoji
const CHAPTER_ICONS = ['📗', '📘', '📙', '📕', '📓', '📔', '🔖', '📒', '📝', '📚',
  '🌈', '🌟', '🎨', '🎵', '🦋', '🌻', '🐝', '🐾', '🎪', '🏠',
  '🌍', '🎭', '🎯', '🖍️', '✏️', '🎈', '🧩', '🎁', '🤹', '🌸'];

interface ChapterListViewProps {
  book: BookEntry;
  onSelectChapter: (book: BookEntry, chapter: BookChapter) => void;
  onClose: () => void;
}

export const ChapterListView: React.FC<ChapterListViewProps> = ({
  book, onSelectChapter, onClose,
}) => {
  const lang = useMemo(() => getLanguageForSubject(book.subject), [book.subject]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.10)',
        }}
        initial={{ scale: 0.92, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 30 }}
        transition={spring}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-3 flex items-center gap-4 border-b border-gray-100">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${book.gradient} flex items-center justify-center shadow-md`}>
            <span className="text-2xl">{book.coverEmoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-black text-gray-800">{book.title}</h2>
            <p className="text-[11px] text-gray-400 font-medium">
              {book.chapters.length} chapters · Pick one to start learning!
            </p>
          </div>
          <motion.button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ✕
          </motion.button>
        </div>

        {/* Chapter Cards */}
        <div className="px-4 py-4 overflow-y-auto max-h-[68vh] space-y-3 scrollbar-thin">
          <AnimatePresence>
            {book.chapters.map((ch, idx) => (
              <ChapterCard
                key={ch.id}
                book={book}
                chapter={ch}
                index={idx}
                icon={CHAPTER_ICONS[idx % CHAPTER_ICONS.length]}
                lang={lang}
                onSelect={() => onSelectChapter(book, ch)}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Chapter Card ─────────────────────────────────────────

const ChapterCard: React.FC<{
  book: BookEntry;
  chapter: BookChapter;
  index: number;
  icon: string;
  lang: string;
  onSelect: () => void;
}> = ({ book, chapter, index, icon, lang, onSelect }) => {
  const progress = useMemo(
    () => getChapterProgress(book.id, chapter.id, chapter.name, book.subject),
    [book.id, chapter.id, chapter.name, book.subject]
  );

  const totalStars = useMemo(
    () => getChapterStars(book.id, chapter.id),
    [book.id, chapter.id]
  );

  const handleListen = (e: React.MouseEvent) => {
    e.stopPropagation();
    pronounceWord(chapter.name, lang);
  };

  return (
    <motion.button
      onClick={onSelect}
      className="w-full rounded-2xl p-4 flex items-center gap-3.5 text-left cursor-pointer group transition-all"
      style={{
        background: progress.completionPercent > 0
          ? 'linear-gradient(135deg, rgba(16,185,129,0.04), rgba(59,130,246,0.04))'
          : 'rgba(249,250,251,0.8)',
        border: progress.completionPercent >= 80
          ? '2px solid rgba(16,185,129,0.2)'
          : '1px solid rgba(229,231,235,0.6)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ x: 4, scale: 1.015, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Chapter icon */}
      <div
        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${book.gradient} flex items-center justify-center text-xl shrink-0 shadow-sm`}
      >
        {progress.completionPercent >= 80 ? '✅' : icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-bold text-gray-700 truncate group-hover:text-green-600 transition-colors">
            {chapter.name}
          </p>
          {/* Stars */}
          {totalStars > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              {[1, 2, 3].map(s => (
                <span key={s} className="text-[10px]">
                  {totalStars >= s * 5 ? '⭐' : '☆'}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress.completionPercent}%` }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
            />
          </div>
          <span className="text-[9px] font-bold text-gray-400 shrink-0">
            {progress.completionPercent}%
          </span>
        </div>

        {/* Activity badges */}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {progress.learn && <Badge text="📖 Learned" color="blue" />}
          {progress.practice && <Badge text={`📝 ${progress.practice}`} color="green" />}
          {progress.play && <Badge text="🎮 Played" color="amber" />}
          {progress.quiz > 0 && <Badge text={`🧠 ${progress.quiz}%`} color="purple" />}
          {progress.revision && <Badge text="🔁 Revised" color="teal" />}
        </div>
      </div>

      {/* Listen button + arrow */}
      <div className="flex items-center gap-1.5 shrink-0">
        <motion.div
          onClick={handleListen}
          className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-sm cursor-pointer hover:bg-green-100"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          🔊
        </motion.div>
        <span className="text-gray-300 text-sm group-hover:text-green-400 transition-colors">→</span>
      </div>
    </motion.button>
  );
};

// ─── Badge Helper ─────────────────────────────────────────

const Badge: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-500',
    green: 'bg-emerald-50 text-emerald-500',
    amber: 'bg-amber-50 text-amber-500',
    purple: 'bg-green-50 text-green-500',
    teal: 'bg-teal-50 text-teal-500',
  };

  return (
    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${colors[color] || colors.blue}`}>
      {text}
    </span>
  );
};
