/**
 * parent/pages/BooksPage.tsx
 * ─────────────────────────────────────────────────────
 * Minimal, clean Learning Library.
 *
 * Each book card: Icon · Title · Subtitle · Progress bar · ONE "Read Book" button.
 * No chapter-hub button. No Ask-AI button.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BOOK_CONFIG,
  type BoardType,
  type BookEntry,
} from '../../data/bookConfig';
// IntelligentReader replaced by full-screen BookReaderPage (immersive mode)
import {
  getReadingInsights,
  formatDuration,
  type ReadingInsights,
} from '../../services/readingInsights';
import {
  getBookProgress,
  type BookProgress,
} from '../../services/progressTracker';
import BookReaderPage from './BookReaderPage';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };
const PANEL_BASE = 'linear-gradient(180deg, rgba(7,12,28,0.9) 0%, rgba(15,23,42,0.8) 100%)';
const SUBPANEL_BASE = 'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(30,41,59,0.74) 100%)';
const PANEL_BORDER = 'rgba(148,163,184,0.16)';
const PANEL_SHADOW = '0 18px 48px rgba(2,6,23,0.26)';
const panelBackground = (overlay?: string) => (overlay ? `${overlay}, ${PANEL_BASE}` : PANEL_BASE);
const subPanelBackground = (overlay?: string) => (overlay ? `${overlay}, ${SUBPANEL_BASE}` : SUBPANEL_BASE);

/* ── localStorage helpers ─────────────────────── */

const USAGE_KEY = 'ssms_book_usage';

interface BookUsageEntry {
  bookId: string;
  action: 'pdf_open';
  timestamp: string;
}

function logBookUsage(bookId: string) {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    const log: BookUsageEntry[] = raw ? JSON.parse(raw) : [];
    log.push({ bookId, action: 'pdf_open', timestamp: new Date().toISOString() });
    localStorage.setItem(USAGE_KEY, JSON.stringify(log));
  } catch { /* ignore */ }
}

function getLastOpened(): string | null {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return null;
    const log: BookUsageEntry[] = JSON.parse(raw);
    return log.length > 0 ? log[log.length - 1].bookId : null;
  } catch { return null; }
}

/* ═══════════════════════════════════════════════════
   PAGE HEADER
   ═══════════════════════════════════════════════════ */

const PageHeader: React.FC<{
  insights: ReadingInsights;
}> = ({ insights }) => (
  <motion.div
    className="relative overflow-hidden rounded-3xl p-6"
    style={{
      background: panelBackground('linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.08), rgba(236,72,153,0.08))'),
      border: `1px solid ${PANEL_BORDER}`,
      backdropFilter: 'blur(12px)',
      boxShadow: PANEL_SHADOW,
    }}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay: 0.04 }}
  >
    <motion.span
      className="absolute top-3 right-4 text-3xl opacity-20"
      animate={{ y: [0, -5, 0], rotate: [0, 3, -3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      📚
    </motion.span>

    <div className="relative z-10">
      <h1
        className="text-xl font-black tracking-tight flex items-center gap-2"
        style={{
          background: 'linear-gradient(90deg, #A5B4FC, #C4B5FD, #F9A8D4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        📚 Learning Library
      </h1>
      <p className="text-[13px] mt-1 font-semibold" style={{ color: '#cbd5e1' }}>
        Read your NCERT & GSEB textbooks · Realistic page-flip reader 📖
      </p>

      <div className="flex flex-wrap gap-3 mt-4">
        <StatPill icon="⏱️" label="Reading" value={formatDuration(insights.totalReadingTimeMs)} />
        <StatPill icon="📄" label="Pages" value={`${insights.totalPagesViewed}`} />
        <StatPill icon="📖" label="Chapters" value={`${insights.totalChaptersExplored}`} />
        {insights.streak > 0 && (
          <StatPill icon="🔥" label="Streak" value={`${insights.streak} days`} />
        )}
      </div>
    </div>
  </motion.div>
);

const StatPill: React.FC<{ icon: string; label: string; value: string; accent?: boolean }> = ({
  icon, label, value, accent,
}) => (
  <div
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
    style={{
      background: accent ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.12)',
      border: accent ? '1px solid rgba(16,185,129,0.34)' : `1px solid ${PANEL_BORDER}`,
    }}
  >
    <span>{icon}</span>
    <span className="font-semibold" style={{ color: '#cbd5e1' }}>{label}:</span>
    <span className={`font-black ${accent ? 'text-emerald-300' : ''}`} style={accent ? undefined : { color: '#f8fafc' }}>{value}</span>
  </div>
);

/* ═══════════════════════════════════════════════════
   BOARD SELECTOR
   ═══════════════════════════════════════════════════ */

const BoardSelector: React.FC<{ active: BoardType; onChange: (b: BoardType) => void }> = ({ active, onChange }) => {
  const boards: { key: BoardType; label: string; icon: string }[] = [
    { key: 'ncert', label: 'NCERT', icon: '🏛️' },
    { key: 'state', label: 'GSEB', icon: '🏫' },
  ];

  return (
    <motion.div
      className="flex justify-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.08 }}
    >
      <div
        className="inline-flex rounded-full p-1.5 gap-1"
        style={{
          background: subPanelBackground('linear-gradient(135deg, rgba(99,102,241,0.2), rgba(129,140,248,0.08))'),
          backdropFilter: 'blur(12px)',
          border: `1px solid ${PANEL_BORDER}`,
          boxShadow: PANEL_SHADOW,
        }}
      >
        {boards.map(b => {
          const isActive = active === b.key;
          return (
            <motion.button
              key={b.key}
              onClick={() => onChange(b.key)}
              className={`relative px-5 py-2 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                isActive ? 'text-white shadow-md' : 'hover:opacity-80'
              }`}
              style={isActive ? undefined : { color: '#94A3B8' }}
              whileTap={{ scale: 0.96 }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  layoutId="board-pill-bg"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span
                className="relative z-10 flex items-center gap-1 text-[12px] font-semibold"
                style={{ color: isActive ? '#F8FAFC' : '#94A3B8' }}
              >
                <span className="text-lg">{b.icon}</span>
                <span>{b.label}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   INDEX BOOKS BUTTON
   ═══════════════════════════════════════════════════ */

/* ── Subject colour palette ──────────────────────── */

const SUBJECT_COLORS: Record<string, { primary: string; light: string; glow: string }> = {
  English:              { primary: '#F59E0B', light: 'rgba(245,158,11,0.10)', glow: 'rgba(245,158,11,0.25)' },
  Maths:                { primary: '#6366F1', light: 'rgba(99,102,241,0.10)', glow: 'rgba(99,102,241,0.25)' },
  Mathematics:          { primary: '#6366F1', light: 'rgba(99,102,241,0.10)', glow: 'rgba(99,102,241,0.25)' },
  Hindi:                { primary: '#22C55E', light: 'rgba(34,197,94,0.10)',  glow: 'rgba(34,197,94,0.25)' },
  Gujarati:             { primary: '#EC4899', light: 'rgba(236,72,153,0.10)', glow: 'rgba(236,72,153,0.25)' },
  EVS:                  { primary: '#06B6D4', light: 'rgba(6,182,212,0.10)',  glow: 'rgba(6,182,212,0.25)' },
  Science:              { primary: '#06B6D4', light: 'rgba(6,182,212,0.10)',  glow: 'rgba(6,182,212,0.25)' },
  Arts:                 { primary: '#8B5CF6', light: 'rgba(139,92,246,0.10)', glow: 'rgba(139,92,246,0.25)' },
  'Physical Education': { primary: '#F43F5E', light: 'rgba(244,63,94,0.10)', glow: 'rgba(244,63,94,0.25)' },
};

const getSubjectColors = (subject: string) =>
  SUBJECT_COLORS[subject] || { primary: '#6366F1', light: 'rgba(99,102,241,0.10)', glow: 'rgba(99,102,241,0.25)' };

/* ═══════════════════════════════════════════════════
   BOOK CARD — Minimal. Icon · Title · Subtitle · Progress · Read Book.
   ═══════════════════════════════════════════════════ */

const BookCard: React.FC<{
  book: BookEntry;
  isLastOpened: boolean;
  bookProgress: BookProgress;
  onReadBook: (book: BookEntry) => void;
}> = ({ book, isLastOpened, bookProgress, onReadBook }) => {
  const sc = getSubjectColors(book.subject);
  return (
  <motion.div
    className="rounded-3xl relative overflow-hidden"
    style={{
      background: panelBackground('linear-gradient(135deg, rgba(99,102,241,0.12), rgba(15,23,42,0.72))'),
      backdropFilter: 'blur(16px)',
      border: `1px solid ${PANEL_BORDER}`,
      boxShadow: PANEL_SHADOW,
    }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={spring}
    whileHover={{ y: -6, boxShadow: `0 18px 40px ${sc.glow}, 0 6px 16px ${sc.light}` }}
  >
    {/* Book Cover Banner */}
    <div
      className={`relative h-36 bg-gradient-to-br ${book.gradient} flex items-center justify-center overflow-hidden`}
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/10" />

      <motion.span
        className="text-5xl relative z-10"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(99,102,241,0.15))' }}
        animate={{ y: [0, -4, 0], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {book.coverEmoji}
      </motion.span>

      {/* Last-opened badge */}
      {isLastOpened && (
        <span
          className="absolute top-3 right-3 text-[9px] font-bold text-white px-2.5 py-1 rounded-full z-10"
          style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}
        >
          ✨ Last Read
        </span>
      )}

      {/* Board badge */}
      <span
        className="absolute top-3 left-3 text-[9px] font-bold text-white/90 px-2 py-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)' }}
      >
        {book.board === 'ncert' ? '🏛️ NCERT' : '🏫 GSEB'}
      </span>

      {/* Subject pill at bottom */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span
          className="text-[10px] font-bold text-white/80 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)' }}
        >
          {book.subject}
        </span>
        <span
          className="text-[10px] font-bold text-white/80 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)' }}
        >
          📑 {book.chapters.length} chapters
        </span>
      </div>
    </div>

    {/* Card body */}
    <div className="p-5 relative overflow-hidden">
      {/* Subtle floating shapes */}
      <div className="absolute top-2 right-2 w-16 h-16 rounded-full pointer-events-none" style={{ background: sc.primary, opacity: 0.08 }} />
      <div className="absolute bottom-4 left-1 w-10 h-10 rounded-2xl rotate-12 pointer-events-none" style={{ background: sc.primary, opacity: 0.06 }} />
      {/* Title */}
      <h3 className="text-[15px] font-black mb-1 leading-tight relative" style={{ color: sc.primary }}>
        {book.title}
      </h3>
      <p className="text-[12px] font-semibold mb-4 relative" style={{ color: '#C7D2FE' }}>
        Class 3 Textbook
      </p>

      <div className="mb-5 rounded-xl px-2.5 py-2" style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${PANEL_BORDER}` }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold" style={{ color: '#CBD5E1' }}>📖 Reading Progress</span>
          <span className="text-[11px] font-black" style={{ color: book.accentColor }}>
            {bookProgress.totalChapters} chapters
          </span>
        </div>
      </div>

      {/* Read Book button */}
      <motion.button
        onClick={() => onReadBook(book)}
        className="w-full py-3.5 rounded-2xl text-[13px] font-bold text-white shadow-lg cursor-pointer relative z-10"
        style={{
          background: `linear-gradient(135deg, ${book.accentColor}, ${book.accentColor}CC)`,
          boxShadow: `0 4px 20px ${book.accentColor}40`,
        }}
        whileHover={{ scale: 1.03, boxShadow: `0 8px 32px ${book.accentColor}60` }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        📖 Open Flipbook Reader
      </motion.button>
    </div>
  </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   READING INSIGHTS
   ═══════════════════════════════════════════════════ */

const InsightsPanel: React.FC<{ insights: ReadingInsights }> = ({ insights }) => {
  if (insights.totalSessions === 0) return null;

  return (
    <motion.div
    className="rounded-3xl p-6 space-y-4"
    style={{
      background: panelBackground('linear-gradient(135deg, rgba(99,102,241,0.14), rgba(15,23,42,0.72))'),
      backdropFilter: 'blur(12px)',
      border: `1px solid ${PANEL_BORDER}`,
      boxShadow: PANEL_SHADOW,
    }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <h3 className="text-sm font-black flex items-center gap-2" style={{ color: '#E2E8F0' }}>
        📊 Reading Insights
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InsightCard icon="📖" label="Sessions" value={`${insights.totalSessions}`} />
        <InsightCard icon="⏱️" label="This Week" value={formatDuration(insights.weeklyReadingMs)} />
        <InsightCard icon="📄" label="Pages Read" value={`${insights.totalPagesViewed}`} />
      </div>

      {insights.recentSessions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase mb-2" style={{ color: '#94A3B8' }}>Recent Sessions</p>
          <div className="space-y-1.5">
            {insights.recentSessions.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl text-[11px]" style={{ background: 'rgba(15,23,42,0.62)', border: `1px solid ${PANEL_BORDER}` }}>
                <span className="font-medium truncate" style={{ color: '#E2E8F0' }}>{s.bookTitle}</span>
                <span style={{ color: '#94A3B8' }}>{formatDuration(s.durationMs)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.favoriteBook && (
        <p className="text-[10px]" style={{ color: '#94A3B8' }}>
          ❤️ Favorite: <span className="font-bold" style={{ color: '#E2E8F0' }}>{insights.favoriteBook}</span>
        </p>
      )}
    </motion.div>
  );
};

const InsightCard: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(15,23,42,0.62)', border: `1px solid ${PANEL_BORDER}` }}>
    <span className="text-lg">{icon}</span>
    <p className="text-[13px] font-black mt-1" style={{ color: '#E2E8F0' }}>{value}</p>
    <p className="text-[9px] font-medium" style={{ color: '#94A3B8' }}>{label}</p>
  </div>
);

/* ═══════════════════════════════════════════════════
   MAIN PAGE EXPORT
   ═══════════════════════════════════════════════════ */

interface BooksPageProps {
  onNavigate?: (screen: string) => void;
  onOpenBook?: (book: BookEntry) => void;
}

export const BooksPage: React.FC<BooksPageProps> = ({ onOpenBook }) => {
  const [board, setBoard] = useState<BoardType>('ncert');
  const [lastOpened, setLastOpened] = useState<string | null>(null);
  const [readerBook, setReaderBook] = useState<BookEntry | null>(null);

  // Insights
  const [insights, setInsights] = useState<ReadingInsights>(getReadingInsights);

  useEffect(() => { setLastOpened(getLastOpened()); }, []);

  // Refresh stats when returning from reader
  useEffect(() => {
    if (!readerBook) {
      setInsights(getReadingInsights());
    }
  }, [readerBook]);

    const books = useMemo(() => {
      const base = [...BOOK_CONFIG.ncert];
      if (board === 'state') {
        base.splice(4, 0, ...BOOK_CONFIG.state);
      }
      return base;
    }, [board]);

  const bookProgressMap = useMemo(() => {
    const map: Record<string, BookProgress> = {};
    for (const b of books) {
      map[b.id] = getBookProgress(b.id, b.title, b.subject, b.chapters.length);
    }
    return map;
  }, [books]);

  // ─── Handlers ───────────────────────────────────

  const handleReadBook = useCallback((book: BookEntry) => {
    logBookUsage(book.id);
    setLastOpened(book.id);
    // Launch immersive full-screen reader via parent layout
    if (onOpenBook) {
      onOpenBook(book);
    } else {
      setReaderBook(book);
    }
  }, [onOpenBook]);

  // ─── Render ─────────────────────────────────────

  if (readerBook && !onOpenBook) {
    return <BookReaderPage book={readerBook} onBack={() => setReaderBook(null)} />;
  }

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6 pb-4">
        <PageHeader insights={insights} />
        <BoardSelector active={board} onChange={setBoard} />

        {/* Book Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          <AnimatePresence mode="popLayout">
            {books.map((book, i) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ ...spring, delay: i * 0.06 }}
              >
                <BookCard
                  book={book}
                  isLastOpened={lastOpened === book.id}
                  bookProgress={bookProgressMap[book.id] || {
                    bookId: book.id, bookTitle: book.title, subject: book.subject,
                    totalChapters: book.chapters.length, completedChapters: 0,
                    completionPercent: 0, totalStars: 0, maxStars: book.chapters.length * 15,
                    totalTimeMs: 0, lastActivityAt: null, lastChapterId: null, lastChapterName: null,
                  }}
                  onReadBook={handleReadBook}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Reading Insights */}
        <InsightsPanel insights={insights} />
      </div>

    </>
  );
};
