/**
 * parent/components/books/ChapterLearningHub.tsx
 * ─────────────────────────────────────────────────────
 * REWRITTEN — Child-friendly Chapter Learning Hub.
 *
 * 6 tabs:
 *  📖 Learn   — Structured content, read aloud, word pronunciation
 *  📝 Practice — Fill blanks, matching, 3 difficulty × 5 stages
 *  🎮 Play    — Mini learning games (matching, drag-drop, puzzles)
 *  🧠 Quiz    — Adaptive difficulty, MCQ + short + picture
 *  🔁 Revision — Incorrect answers + flashcards + voice revision
 *  🤖 Ask AI  — Child-friendly chapter-aware AI chat + voice
 *
 * Light theme, colorful, rounded, big buttons — child-centric UX.
 * Parent lock indicators when activities are locked.
 * No external redirects. Everything stays in dashboard.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookEntry, BookChapter } from '../../../data/bookConfig';
import { getChapterProgress, getChapterStars, isActivityLocked } from '../../../services/progressTracker';
import { LearnTab } from './LearnTab';
import { PracticeTab } from './PracticeTab';
import { PlayTab } from './PlayTab';
import { QuizTab } from './QuizTab';
import { RevisionTab } from './RevisionTab';
import { AskAITab } from './AskAITab';

const spring = { type: 'spring' as const, stiffness: 260, damping: 26 };

// ─── Tab Config ───────────────────────────────────────────

type TabKey = 'learn' | 'practice' | 'play' | 'quiz' | 'revision' | 'ai';

interface TabDef {
  key: TabKey;
  label: string;
  icon: string;
  color: string;
  lockable: boolean;
}

const TABS: TabDef[] = [
  { key: 'learn',    label: 'Learn',    icon: '📖', color: 'from-blue-400 to-cyan-400',     lockable: false },
  { key: 'practice', label: 'Practice', icon: '📝', color: 'from-emerald-400 to-green-400', lockable: false },
  { key: 'play',     label: 'Play',     icon: '🎮', color: 'from-amber-400 to-orange-400',  lockable: true },
  { key: 'quiz',     label: 'Quiz',     icon: '🧠', color: 'from-purple-400 to-pink-400',   lockable: true },
  { key: 'revision', label: 'Revision', icon: '🔁', color: 'from-teal-400 to-emerald-400',  lockable: false },
  { key: 'ai',       label: 'Ask AI',   icon: '🤖', color: 'from-indigo-400 to-purple-400', lockable: true },
];

// ─── Props ────────────────────────────────────────────────

interface ChapterLearningHubProps {
  book: BookEntry;
  chapter: BookChapter;
  onClose: () => void;
  onBack: () => void;
}

// ─── Main Component ───────────────────────────────────────

export const ChapterLearningHub: React.FC<ChapterLearningHubProps> = ({
  book, chapter, onClose, onBack,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('learn');

  const progress = useMemo(
    () => getChapterProgress(book.id, chapter.id, chapter.name, book.subject),
    [book.id, chapter.id, chapter.name, book.subject]
  );

  const totalStars = useMemo(
    () => getChapterStars(book.id, chapter.id),
    [book.id, chapter.id]
  );

  const handleTabChange = (tab: TabKey) => {
    const def = TABS.find(t => t.key === tab)!;
    if (def.lockable && isActivityLocked(tab)) return;
    setActiveTab(tab);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'learn':    return <LearnTab book={book} chapter={chapter} />;
      case 'practice': return <PracticeTab book={book} chapter={chapter} />;
      case 'play':     return <PlayTab book={book} chapter={chapter} />;
      case 'quiz':     return <QuizTab book={book} chapter={chapter} />;
      case 'revision': return <RevisionTab book={book} chapter={chapter} />;
      case 'ai':       return <AskAITab book={book} chapter={chapter} />;
      default:         return null;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex flex-col"
      style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 40%, #faf5ff 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* ─── Header ─── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ←
          </motion.button>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${book.gradient || 'from-blue-400 to-indigo-500'} flex items-center justify-center shrink-0`}>
            <span className="text-lg">{book.coverEmoji}</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-gray-800 truncate">{chapter.name}</h2>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-gray-400 truncate">{book.title}</p>
              <div className="flex items-center gap-1">
                <span className="text-[10px]">⭐</span>
                <span className="text-[9px] font-bold text-amber-500">{totalStars}/15</span>
                <div className="w-12 h-1 rounded-full bg-gray-200 overflow-hidden ml-1">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                    style={{ width: `${progress.completionPercent}%` }}
                  />
                </div>
                <span className="text-[8px] font-bold text-gray-400">{progress.completionPercent}%</span>
              </div>
            </div>
          </div>
        </div>
        <motion.button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-400 cursor-pointer hover:bg-red-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>
      </div>

      {/* ─── Tab Bar ─── */}
      <div
        className="flex gap-1.5 px-3 py-2 overflow-x-auto shrink-0 scrollbar-hide"
        style={{ background: 'rgba(255,255,255,0.6)' }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const locked = tab.lockable && isActivityLocked(tab.key);
          const starCount = progress.stars[tab.key as keyof typeof progress.stars] ?? 0;

          return (
            <motion.button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                locked ? 'text-gray-300 bg-gray-100'
                  : isActive ? 'text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700 bg-white/60 hover:bg-white'
              }`}
              whileTap={{ scale: 0.96 }}
            >
              {isActive && !locked && (
                <motion.div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${tab.color}`}
                  layoutId="chapter-tab-active"
                  transition={spring}
                  style={{ zIndex: -1 }}
                />
              )}
              <span className="text-sm">{locked ? '🔒' : tab.icon}</span>
              <span>{tab.label}</span>
              {typeof starCount === 'number' && starCount > 0 && !locked && (
                <span className="text-[8px] ml-0.5 opacity-80">
                  {'⭐'.repeat(Math.min(starCount, 3))}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ─── Tab Content ─── */}
      <div className="flex-1 overflow-y-auto px-4 scrollbar-thin">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="h-full"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
