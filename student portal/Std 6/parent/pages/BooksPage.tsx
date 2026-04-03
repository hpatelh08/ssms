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
  ALL_BOOKS,
  type BoardType,
  type BookEntry,
} from '../../data/bookConfig';
import { extractTextFromPDF } from '../../services/pdfExtractor';
import { chunkBook, mergeBookChunks } from '../../services/bookChunker';
import { initVectorStore, buildEmbeddings, getVectorStoreStatus } from '../../services/vectorStore';
import {
  getReadingInsights,
  formatDuration,
  type ReadingInsights,
} from '../../services/readingInsights';
import {
  getBookProgress,
  type BookProgress,
} from '../../services/progressTracker';
import type { TextbookChunk } from '../../types';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

/* ── localStorage helpers ─────────────────────── */

const USAGE_KEY = 'ssms_book_usage';
const INDEX_STATUS_KEY = 'ssms_book_index_status';

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

/* ── Index status ─────────────────────────────── */

interface IndexStatus {
  indexed: string[];
  totalChunks: number;
  lastIndexedAt?: string;
}

function getIndexStatus(): IndexStatus {
  try {
    const raw = localStorage.getItem(INDEX_STATUS_KEY);
    return raw ? JSON.parse(raw) : { indexed: [], totalChunks: 0 };
  } catch {
    return { indexed: [], totalChunks: 0 };
  }
}

function saveIndexStatus(status: IndexStatus): void {
  try {
    localStorage.setItem(INDEX_STATUS_KEY, JSON.stringify(status));
  } catch { /* ignore */ }
}

/* ═══════════════════════════════════════════════════
   PAGE HEADER
   ═══════════════════════════════════════════════════ */

const PageHeader: React.FC<{
  insights: ReadingInsights;
  ragStatus: { chunkCount: number; embeddingsReady: boolean };
}> = ({ insights, ragStatus }) => (
  <motion.div
    className="relative overflow-hidden rounded-3xl p-6"
    style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08), rgba(236,72,153,0.06))',
      border: '1px solid rgba(255,255,255,0.5)',
      backdropFilter: 'blur(12px)',
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
          background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        📚 Learning Library
      </h1>
      <p className="text-xs mt-1 font-medium" style={{ color: '#6B7AA6' }}>
        Read your NCERT & GSEB textbooks · Realistic page-flip reader 📖
      </p>

      <div className="flex flex-wrap gap-3 mt-4">
        <StatPill icon="⏱️" label="Reading" value={formatDuration(insights.totalReadingTimeMs)} />
        <StatPill icon="📄" label="Pages" value={`${insights.totalPagesViewed}`} />
        <StatPill icon="📖" label="Chapters" value={`${insights.totalChaptersExplored}`} />
        {insights.streak > 0 && (
          <StatPill icon="🔥" label="Streak" value={`${insights.streak} days`} />
        )}
        <StatPill
          icon="🧠"
          label="RAG"
          value={ragStatus.chunkCount > 0 ? `${ragStatus.chunkCount} chunks` : 'Not indexed'}
          accent={ragStatus.embeddingsReady}
        />
      </div>
    </div>
  </motion.div>
);

const StatPill: React.FC<{ icon: string; label: string; value: string; accent?: boolean }> = ({
  icon, label, value, accent,
}) => (
  <div
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px]"
    style={{
      background: accent ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.5)',
      border: accent ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.3)',
    }}
  >
    <span>{icon}</span>
    <span className="font-medium" style={{ color: '#6B7AA6' }}>{label}:</span>
    <span className={`font-bold ${accent ? 'text-emerald-600' : ''}`} style={accent ? undefined : { color: '#2C3A63' }}>{value}</span>
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
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 4px 16px rgba(99,102,241,0.06)',
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
              style={isActive ? undefined : { color: '#6B7AA6' }}
              whileTap={{ scale: 0.96 }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  layoutId="board-pill-bg"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{b.icon} {b.label}</span>
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

const IndexButton: React.FC<{
  indexing: boolean;
  indexProgress: string;
  onIndex: () => void;
  indexed: boolean;
}> = ({ indexing, indexProgress, onIndex, indexed }) => (
  <motion.div className="flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
    <motion.button
      onClick={onIndex}
      disabled={indexing}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[12px] font-bold cursor-pointer transition-all ${
        indexed ? 'text-emerald-600' : indexing ? 'text-amber-600' : 'text-indigo-600'
      }`}
      style={{
        background: indexed ? 'rgba(16,185,129,0.08)' : indexing ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
        border: indexed ? '1px solid rgba(16,185,129,0.15)' : indexing ? '1px solid rgba(245,158,11,0.15)' : '1px solid rgba(99,102,241,0.15)',
      }}
      whileHover={{ scale: indexing ? 1 : 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {indexing ? (
        <>
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>⚙️</motion.span>
          {indexProgress}
        </>
      ) : indexed ? <>✅ Books Indexed for AI</> : <>🧠 Index Books for AI (RAG)</>}
    </motion.button>
  </motion.div>
);

/* ── Subject colour palette ──────────────────────── */

const SUBJECT_COLORS: Record<string, { primary: string; light: string; glow: string }> = {
  English:  { primary: '#F59E0B', light: 'rgba(245,158,11,0.10)', glow: 'rgba(245,158,11,0.25)' },
  Maths:    { primary: '#6366F1', light: 'rgba(99,102,241,0.10)', glow: 'rgba(99,102,241,0.25)' },
  Hindi:    { primary: '#22C55E', light: 'rgba(34,197,94,0.10)',  glow: 'rgba(34,197,94,0.25)' },
  Gujarati: { primary: '#EC4899', light: 'rgba(236,72,153,0.10)', glow: 'rgba(236,72,153,0.25)' },
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
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.6)',
      boxShadow: '0 8px 32px rgba(99,102,241,0.07), 0 2px 8px rgba(99,102,241,0.03)',
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
      <p className="text-[11px] font-medium mb-4 relative" style={{ color: '#6B7AA6' }}>
        Class 6 Textbook
      </p>

      {/* Reading progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-[10px] font-bold mb-1.5" style={{ color: '#6B7AA6' }}>
          <span>📖 Reading Progress</span>
          <span style={{ color: book.accentColor }}>{bookProgress.completionPercent}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: sc.light }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${book.accentColor}, ${book.accentColor}99)` }}
            initial={{ width: 0 }}
            animate={{ width: `${bookProgress.completionPercent}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
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
        background: 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.4)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <h3 className="text-sm font-black flex items-center gap-2" style={{ color: '#2C3A63' }}>
        📊 Reading Insights
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InsightCard icon="📖" label="Sessions" value={`${insights.totalSessions}`} />
        <InsightCard icon="⏱️" label="This Week" value={formatDuration(insights.weeklyReadingMs)} />
        <InsightCard icon="📄" label="Pages Read" value={`${insights.totalPagesViewed}`} />
      </div>

      {insights.recentSessions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase mb-2" style={{ color: '#6B7AA6' }}>Recent Sessions</p>
          <div className="space-y-1.5">
            {insights.recentSessions.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50/50 text-[11px]">
                <span className="font-medium truncate" style={{ color: '#2C3A63' }}>{s.bookTitle}</span>
                <span style={{ color: '#6B7AA6' }}>{formatDuration(s.durationMs)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.favoriteBook && (
        <p className="text-[10px]" style={{ color: '#6B7AA6' }}>
          ❤️ Favorite: <span className="font-bold" style={{ color: '#2C3A63' }}>{insights.favoriteBook}</span>
        </p>
      )}
    </motion.div>
  );
};

const InsightCard: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.4)' }}>
    <span className="text-lg">{icon}</span>
    <p className="text-[13px] font-black mt-1" style={{ color: '#2C3A63' }}>{value}</p>
    <p className="text-[9px] font-medium" style={{ color: '#6B7AA6' }}>{label}</p>
  </div>
);

/* ═══════════════════════════════════════════════════
   MAIN PAGE EXPORT
   ═══════════════════════════════════════════════════ */

interface BooksPageProps {
  onNavigate?: (screen: string) => void;
  onOpenBook?: (book: BookEntry) => void;
}

const resolveBookPdfUrl = (rawUrl: string): string => {
  if (!rawUrl) return rawUrl;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const path = rawUrl.replace(/^\/+/, '');
  return `${base}/${path}`;
};

export const BooksPage: React.FC<BooksPageProps> = ({ onOpenBook }) => {
  const [board, setBoard] = useState<BoardType>('ncert');
  const [lastOpened, setLastOpened] = useState<string | null>(null);

  // Indexing
  const [indexing, setIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState('');
  const [indexStatus, setIndexStatus] = useState<IndexStatus>(getIndexStatus);
  const [ragStatus, setRagStatus] = useState(getVectorStoreStatus);

  // Insights
  const [insights, setInsights] = useState<ReadingInsights>(getReadingInsights);

  useEffect(() => { setLastOpened(getLastOpened()); }, []);

  const books = useMemo(() => BOOK_CONFIG[board], [board]);

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
    if (onOpenBook) onOpenBook(book);
  }, [onOpenBook]);

  const handleIndexBooks = useCallback(async () => {
    if (indexing) return;
    setIndexing(true);
    setIndexProgress('Starting...');

    try {
      const allChunks: TextbookChunk[][] = [];
      const indexedIds: string[] = [];

      for (let i = 0; i < ALL_BOOKS.length; i++) {
        const book = ALL_BOOKS[i];
        setIndexProgress(`Extracting ${book.title} (${i + 1}/${ALL_BOOKS.length})...`);
        try {
          const extraction = await extractTextFromPDF(
            resolveBookPdfUrl(book.pdfUrl),
            book.id,
            (done, total) => { setIndexProgress(`${book.title}: page ${done}/${total}`); }
          );
          if (extraction.pages.length > 0) {
            allChunks.push(chunkBook(extraction, book));
            indexedIds.push(book.id);
          }
        } catch { /* skip failed book */ }
      }

      const merged = mergeBookChunks(...allChunks);
      if (merged.length > 0) {
        setIndexProgress(`Initializing vector store (${merged.length} chunks)...`);
        initVectorStore(merged);
        setIndexProgress('Building embeddings...');
        await buildEmbeddings((done, total) => { setIndexProgress(`Embedding ${done}/${total}...`); });

        const status: IndexStatus = {
          indexed: indexedIds,
          totalChunks: merged.length,
          lastIndexedAt: new Date().toISOString(),
        };
        saveIndexStatus(status);
        setIndexStatus(status);
        setRagStatus(getVectorStoreStatus());
      }
      setIndexProgress('');
    } catch {
      setIndexProgress('Indexing failed. Try again.');
    } finally {
      setIndexing(false);
    }
  }, [indexing]);

  // ─── Render ─────────────────────────────────────

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6 pb-4">
        <PageHeader insights={insights} ragStatus={ragStatus} />
        <BoardSelector active={board} onChange={setBoard} />

        <IndexButton
          indexing={indexing}
          indexProgress={indexProgress}
          onIndex={handleIndexBooks}
          indexed={indexStatus.totalChunks > 0}
        />

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
