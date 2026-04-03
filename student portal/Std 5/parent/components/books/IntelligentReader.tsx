/**
 * parent/components/books/IntelligentReader.tsx
 * ─────────────────────────────────────────────────────
 * ELITE NCERT-STYLE VERTICAL PDF VIEWER
 *
 * Production-grade vertical-scroll textbook engine.
 * • IntersectionObserver page detection (useInView)
 * • Virtualized rendering (±3 pages around current)
 * • Sticky toolbar: zoom, fit-to-width, search, bookmarks
 * • Floating zoom bubble + page indicator
 * • ResizeObserver for responsive fit-to-width
 * • Keyboard shortcuts (Ctrl+F, Ctrl+G, Esc, Ctrl±)
 * • No iframe, no default PDF.js UI, no page-flip
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  memo,
} from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { type BookEntry } from '../../../data/bookConfig';
import { startReadingSession, endReadingSession } from '../../../services/readingInsights';

/* ─── PDF worker (Vite ?url import for reliable bundling) ── */
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/* ─────────────────────────────────────────────────
   DESIGN TOKENS
   ───────────────────────────────────────────────── */
const SHELL_BG = '#f3f4f6';
const TOOLBAR_BG = 'rgba(255,255,255,0.92)';
const PAGE_GAP = 20;
const VIRTUALIZE_BUFFER = 3;
const ZOOM_STEP = 0.15;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const BOOKMARK_KEY_PREFIX = 'ncert_bookmarks_';

/* ─────────────────────────────────────────────────
   BOOKMARK HELPERS (localStorage)
   ───────────────────────────────────────────────── */
function getBookmarks(bookId: string): number[] {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY_PREFIX + bookId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function setBookmarks(bookId: string, pages: number[]): void {
  localStorage.setItem(BOOKMARK_KEY_PREFIX + bookId, JSON.stringify(pages));
}

/* ─────────────────────────────────────────────────
   VIRTUALIZED PDF PAGE with IntersectionObserver
   ─────────────────────────────────────────────────
   ⚠ No per-page <Document> — pages share the single
     <Document> rendered in IntelligentReader.
   ───────────────────────────────────────────────── */
interface VPageProps {
  pageNum: number;
  pageWidth: number;
  isVisible: boolean;
  onInView: (pageNum: number, inView: boolean) => void;
}

const VirtualPage: React.FC<VPageProps> = memo(
  ({ pageNum, pageWidth, isVisible, onInView }) => {
    const { ref, inView } = useInView({
      threshold: 0.25,
      rootMargin: '200px 0px',
    });

    useEffect(() => {
      onInView(pageNum, inView);
    }, [inView, pageNum, onInView]);

    return (
      <div
        ref={ref}
        id={`pdf-page-${pageNum}`}
        className="flex-shrink-0 flex items-center justify-center"
        style={{ minHeight: isVisible ? undefined : pageWidth * 1.414 }}
      >
        {isVisible ? (
          <div
            className="bg-white rounded-lg overflow-hidden"
            style={{
              boxShadow:
                '0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
              width: pageWidth,
            }}
          >
            <Page
              pageNumber={pageNum}
              width={pageWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={
                <div
                  className="flex items-center justify-center bg-gray-50"
                  style={{ width: pageWidth, height: pageWidth * 1.414 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <motion.div
                      className="w-8 h-8 rounded-full border-2 border-green-300 border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                    <span className="text-xs text-gray-400 font-medium">
                      Page {pageNum}
                    </span>
                  </div>
                </div>
              }
              error={
                <div
                  className="flex items-center justify-center bg-red-50"
                  style={{ width: pageWidth, height: pageWidth * 1.414 }}
                >
                  <div className="text-center">
                    <span className="text-2xl">⚠️</span>
                    <p className="text-xs text-red-400 mt-1">
                      Page {pageNum} failed
                    </p>
                  </div>
                </div>
              }
            />
          </div>
        ) : (
          <div
            className="bg-white/60 rounded-lg"
            style={{
              width: pageWidth,
              height: pageWidth * 1.414,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-gray-300 font-medium">
                Page {pageNum}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  },
);
VirtualPage.displayName = 'VirtualPage';

/* ─────────────────────────────────────────────────
   FLOATING PAGE INDICATOR
   ───────────────────────────────────────────────── */
const FloatingPageIndicator: React.FC<{
  current: number;
  total: number;
}> = memo(({ current, total }) => (
  <motion.div
    className="fixed bottom-6 right-6 z-[98] flex items-center gap-2 px-4 py-2 rounded-full"
    style={{
      background: 'rgba(255,255,255,0.95)',
      border: '1.5px solid rgba(199,210,254,0.5)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}
    key={current}
    initial={{ scale: 0.85, opacity: 0.6 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
  >
    <span className="text-xs font-black text-green-600 tabular-nums">
      {current}
    </span>
    <span className="text-[10px] text-gray-300 font-bold">/</span>
    <span className="text-xs font-bold text-gray-400 tabular-nums">{total}</span>
  </motion.div>
));
FloatingPageIndicator.displayName = 'FloatingPageIndicator';

/* ─────────────────────────────────────────────────
   FLOATING ZOOM BUBBLE (shows briefly on zoom)
   ───────────────────────────────────────────────── */
const ZoomBubble: React.FC<{ zoom: number; visible: boolean }> = memo(
  ({ zoom, visible }) => (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-24 left-1/2 z-[99] -translate-x-1/2 px-5 py-2 rounded-full"
          style={{
            background: 'rgba(55,48,163,0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(55,48,163,0.3)',
          }}
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-sm font-bold text-white tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  ),
);
ZoomBubble.displayName = 'ZoomBubble';

/* ═══════════════════════════════════════════════════
   MAIN: IntelligentReader — Elite PDF Viewer
   ═══════════════════════════════════════════════════ */

interface IntelligentReaderProps {
  book: BookEntry;
  onClose: () => void;
}

export const IntelligentReader: React.FC<IntelligentReaderProps> = ({
  book,
  onClose,
}) => {
  /* ── Core State ─────────────────────────────── */
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfError, setPdfError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  /* ── Zoom ───────────────────────────────────── */
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [zoomBubbleVisible, setZoomBubbleVisible] = useState(false);
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Bookmarks ──────────────────────────────── */
  const [bookmarks, setBookmarksState] = useState<number[]>(() =>
    getBookmarks(book.id),
  );
  const [showBookmarks, setShowBookmarks] = useState(false);

  /* ── Search ─────────────────────────────────── */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [goToPageInput, setGoToPageInput] = useState('');
  const [showGoToPage, setShowGoToPage] = useState(false);

  /* ── Refs ────────────────────────────────────── */
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(700);
  const visiblePagesRef = useRef<Set<number>>(new Set());
  const isScrollingToRef = useRef(false);

  const pdfFile = useMemo(() => book.pdfUrl, [book.pdfUrl]);

  /* ── Computed page width ────────────────────── */
  const pageWidth = useMemo(() => {
    const maxW = fitWidth ? containerWidth - 48 : 700;
    return Math.round(Math.min(Math.max(maxW * zoom, 280), 2200));
  }, [containerWidth, zoom, fitWidth]);

  /* ── ResizeObserver for fit-to-width ────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── PDF load ───────────────────────────────── */
  const onDocLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      setPdfError(false);
      setTimeout(() => setIsReady(true), 150);
    },
    [],
  );

  /* ── Reading session ────────────────────────── */
  useEffect(() => {
    startReadingSession(book.id, book.title);
    return () => {
      endReadingSession();
    };
  }, [book.id, book.title]);

  /* ── IntersectionObserver page tracking ─────── */
  const handlePageInView = useCallback(
    (pageNum: number, inView: boolean) => {
      if (isScrollingToRef.current) return;
      const set = visiblePagesRef.current;
      if (inView) set.add(pageNum);
      else set.delete(pageNum);
      if (set.size > 0) {
        const minPage = Math.min(...set);
        setCurrentPage(minPage);
      }
    },
    [],
  );

  /* ── Determine which pages to render ────────── */
  const renderedPages = useMemo(() => {
    if (!numPages) return [];
    const all: boolean[] = new Array(numPages).fill(false);
    // Always render the first 2 pages immediately (prevents blank start)
    all[0] = true;
    if (numPages > 1) all[1] = true;
    const lo = Math.max(1, currentPage - VIRTUALIZE_BUFFER);
    const hi = Math.min(numPages, currentPage + VIRTUALIZE_BUFFER);
    for (let i = lo; i <= hi; i++) all[i - 1] = true;
    // Also render bookmarked pages if they're nearby
    bookmarks.forEach((b) => {
      if (b >= lo - 1 && b <= hi + 1 && b >= 1 && b <= numPages)
        all[b - 1] = true;
    });
    return all;
  }, [numPages, currentPage, bookmarks]);

  /* ── Zoom controls ──────────────────────────── */
  const showZoomBubble = useCallback(() => {
    setZoomBubbleVisible(true);
    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    zoomTimerRef.current = setTimeout(
      () => setZoomBubbleVisible(false),
      1200,
    );
  }, []);

  const zoomIn = useCallback(() => {
    setFitWidth(false);
    setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX));
    showZoomBubble();
  }, [showZoomBubble]);

  const zoomOut = useCallback(() => {
    setFitWidth(false);
    setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN));
    showZoomBubble();
  }, [showZoomBubble]);

  const zoomReset = useCallback(() => {
    setZoom(1);
    setFitWidth(true);
    showZoomBubble();
  }, [showZoomBubble]);

  /* ── Scroll to page ─────────────────────────── */
  const scrollToPage = useCallback((page: number) => {
    const el = document.getElementById(`pdf-page-${page}`);
    if (el && scrollRef.current) {
      isScrollingToRef.current = true;
      setCurrentPage(page);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isScrollingToRef.current = false;
      }, 800);
    }
  }, []);

  /* ── Go-to-page handler ────────────────────── */
  const handleGoToPage = useCallback(() => {
    const p = parseInt(goToPageInput, 10);
    if (p >= 1 && numPages && p <= numPages) {
      scrollToPage(p);
      setShowGoToPage(false);
      setGoToPageInput('');
    }
  }, [goToPageInput, numPages, scrollToPage]);

  /* ── Bookmark toggle ────────────────────────── */
  const toggleBookmark = useCallback(() => {
    setBookmarksState((prev) => {
      const next = prev.includes(currentPage)
        ? prev.filter((p) => p !== currentPage)
        : [...prev, currentPage].sort((a, b) => a - b);
      setBookmarks(book.id, next);
      return next;
    });
  }, [currentPage, book.id]);

  /* ── Download ───────────────────────────────── */
  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = book.pdfUrl;
    a.download = book.title.replace(/[^a-zA-Z0-9 ]/g, '') + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [book.pdfUrl, book.title]);

  /* ── Keyboard shortcuts ─────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setShowGoToPage((o) => !o);
      }
      if (e.key === '+' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        zoomOut();
      }
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        zoomReset();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, zoomIn, zoomOut, zoomReset]);

  /* ── Search highlight via inline style ─────── */
  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const allSpans = container.querySelectorAll(
      '.react-pdf__Page__textContent span',
    );
    allSpans.forEach((span) => {
      const el = span as HTMLElement;
      if (
        searchQuery.length >= 2 &&
        el.textContent?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        el.style.backgroundColor = 'rgba(250, 204, 21, 0.45)';
        el.style.borderRadius = '2px';
      } else {
        el.style.backgroundColor = '';
        el.style.borderRadius = '';
      }
    });
  }, [searchQuery, currentPage]);

  const isBookmarked = bookmarks.includes(currentPage);

  /* ═════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════ */
  return (
    <>
      {/* Dim backdrop */}
      <motion.div
        className="fixed inset-0 z-[90]"
        style={{ background: 'rgba(0,0,0,0.12)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* ── Viewer Shell ── */}
      <motion.div
        className="fixed top-0 right-0 z-[95] flex flex-col"
        style={{
          height: '100vh',
          width: '100%',
          background: SHELL_BG,
          overflow: 'hidden',
        }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        {/* ─── STICKY TOOLBAR ─── */}
        <motion.header
          className="relative z-30 flex items-center justify-between px-3 lg:px-5 shrink-0"
          style={{
            height: 56,
            background: TOOLBAR_BG,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
          }}
          initial={{ y: -56 }}
          animate={{ y: 0 }}
          transition={{
            delay: 0.1,
            type: 'spring',
            stiffness: 240,
            damping: 24,
          }}
        >
          {/* LEFT — Back + Title */}
          <div className="flex items-center gap-2.5 min-w-0 shrink">
            <motion.button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl cursor-pointer shrink-0"
              style={{
                background: 'rgba(243,244,246,0.8)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.94 }}
            >
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
                Back
              </span>
            </motion.button>

            <div
              className={`w-7 h-7 rounded-lg bg-gradient-to-br ${book.gradient} flex items-center justify-center shadow-sm shrink-0`}
            >
              <span className="text-sm">{book.coverEmoji}</span>
            </div>

            <div className="min-w-0 hidden sm:block">
              <h2 className="text-sm font-bold text-gray-800 truncate leading-tight">
                {book.title}
              </h2>
              <p className="text-[10px] text-gray-400 font-medium">
                NCERT · Class 5
              </p>
            </div>
          </div>

          {/* CENTER — Page nav + Zoom */}
          <div className="flex items-center gap-1.5">
            {/* Page navigator */}
            <div
              className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.03)' }}
            >
              <ToolbarBtn
                icon="chevron-up"
                onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                small
              />
              <button
                onClick={() => setShowGoToPage((g) => !g)}
                className="px-2 py-0.5 text-xs font-bold text-gray-700 tabular-nums cursor-pointer hover:bg-white/60 rounded transition-colors"
              >
                {currentPage}{' '}
                <span className="text-gray-300 font-medium">
                  / {numPages ?? '–'}
                </span>
              </button>
              <ToolbarBtn
                icon="chevron-down"
                onClick={() =>
                  scrollToPage(Math.min(numPages ?? 1, currentPage + 1))
                }
                disabled={currentPage >= (numPages ?? 1)}
                small
              />
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-5 bg-gray-200 mx-1" />

            {/* Zoom controls */}
            <div className="flex items-center gap-0.5">
              <ToolbarBtn
                icon="minus"
                onClick={zoomOut}
                disabled={zoom <= ZOOM_MIN}
                small
              />
              <button
                onClick={zoomReset}
                className="px-2 py-0.5 text-[11px] font-bold text-gray-600 tabular-nums cursor-pointer hover:bg-white/60 rounded transition-colors min-w-[44px] text-center"
              >
                {Math.round(zoom * 100)}%
              </button>
              <ToolbarBtn
                icon="plus"
                onClick={zoomIn}
                disabled={zoom >= ZOOM_MAX}
                small
              />
              <ToolbarBtn
                icon="fit-width"
                onClick={zoomReset}
                active={fitWidth}
                tip="Fit to width"
                small
              />
            </div>
          </div>

          {/* RIGHT — Actions */}
          <div className="flex items-center gap-1">
            <ToolbarBtn
              icon="search"
              onClick={() => setSearchOpen((o) => !o)}
              active={searchOpen}
              tip="Search (Ctrl+F)"
            />
            <ToolbarBtn
              icon="bookmark"
              onClick={toggleBookmark}
              active={isBookmarked}
              tip={isBookmarked ? 'Remove bookmark' : 'Bookmark page'}
            />
            {bookmarks.length > 0 && (
              <ToolbarBtn
                icon="bookmarks"
                onClick={() => setShowBookmarks((o) => !o)}
                active={showBookmarks}
                tip="View bookmarks"
              />
            )}
            <ToolbarBtn
              icon="download"
              onClick={handleDownload}
              tip="Download"
            />
          </div>
        </motion.header>

        {/* ─── SEARCH BAR (conditional) ─── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              className="relative z-20 flex items-center gap-3 px-4 py-2.5"
              style={{
                background: 'rgba(255,255,255,0.95)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                backdropFilter: 'blur(12px)',
              }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                className="w-4 h-4 text-gray-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in document…"
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-300"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-300 hover:text-gray-500 cursor-pointer text-xs font-bold"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── GO-TO-PAGE POPUP ─── */}
        <AnimatePresence>
          {showGoToPage && (
            <motion.div
              className="absolute top-14 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.98)',
                border: '1.5px solid rgba(0,0,0,0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
            >
              <span className="text-xs text-gray-500 font-medium">
                Go to page
              </span>
              <input
                type="number"
                min={1}
                max={numPages ?? 1}
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGoToPage();
                  if (e.key === 'Escape') setShowGoToPage(false);
                }}
                className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-sm text-center font-bold text-gray-700 outline-none focus:border-green-300"
                autoFocus
                placeholder="1"
              />
              <button
                onClick={handleGoToPage}
                className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold cursor-pointer hover:bg-green-600 transition-colors"
              >
                Go
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── BOOKMARKS DROPDOWN ─── */}
        <AnimatePresence>
          {showBookmarks && bookmarks.length > 0 && (
            <motion.div
              className="absolute top-14 right-4 z-[100] rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.98)',
                border: '1.5px solid rgba(0,0,0,0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                minWidth: 180,
                maxHeight: 260,
              }}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
            >
              <div className="px-4 py-2.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500">
                  Bookmarks
                </span>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 210 }}>
                {bookmarks.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      scrollToPage(p);
                      setShowBookmarks(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm cursor-pointer hover:bg-green-50 transition-colors flex items-center justify-between ${
                      p === currentPage
                        ? 'bg-green-50 text-green-600 font-bold'
                        : 'text-gray-600'
                    }`}
                  >
                    <span>Page {p}</span>
                    {p === currentPage && (
                      <span className="text-[10px] text-green-400">
                        current
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── CONTENT AREA ─── */}
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{ height: 'calc(100vh - 120px)', minHeight: 0 }}
        >
          {/* Error state */}
          {pdfError && (
            <motion.div
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center">
                <span className="text-5xl inline-block mb-4">📚</span>
                <p className="text-base font-bold text-gray-600 mb-2">
                  Could not open this book
                </p>
                <p className="text-sm text-gray-400 mb-5">
                  Check your connection and try again
                </p>
                <motion.button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold cursor-pointer shadow-md"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Go Back
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── SINGLE SHARED DOCUMENT (loads PDF once, provides context to all Pages) ── */}
          {!pdfError && (
            <Document
              file={pdfFile}
              onLoadSuccess={onDocLoadSuccess}
              onLoadError={(err) => {
                console.error('[IntelligentReader] PDF load error:', err);
                setPdfError(true);
              }}
              loading={
                <motion.div
                  className="flex items-center justify-center h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-center">
                    <motion.div
                      className="w-12 h-12 mx-auto rounded-full border-[3px] border-green-200 border-t-emerald-500"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                    <p className="text-sm font-semibold text-gray-400 mt-4">
                      Loading document…
                    </p>
                    <p className="text-[11px] text-gray-300 mt-1">
                      {book.title}
                    </p>
                  </div>
                </motion.div>
              }
              error={null}
            >
              {/* ── VERTICAL SCROLL AREA (renders inside shared Document context) ── */}
              {numPages && isReady && (
                <motion.div
                  ref={scrollRef}
                  className="h-full overflow-y-auto overflow-x-auto"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    height: '100%',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div
                    className="flex flex-col items-center py-6"
                    style={{ gap: PAGE_GAP }}
                  >
                    {Array.from({ length: numPages }, (_, i) => (
                      <VirtualPage
                        key={`page-${i + 1}`}
                        pageNum={i + 1}
                        pageWidth={pageWidth}
                        isVisible={renderedPages[i]}
                        onInView={handlePageInView}
                      />
                    ))}
                    {/* End spacer */}
                    <div className="h-12" />
                  </div>
                </motion.div>
              )}
            </Document>
          )}
        </div>

        {/* ── Mobile bottom bar ── */}
        {numPages && isReady && (
          <div
            className="md:hidden shrink-0 flex items-center justify-between px-4 py-2"
            style={{
              background: TOOLBAR_BG,
              borderTop: '1px solid rgba(0,0,0,0.06)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <button
              onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold disabled:opacity-30 cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => setShowGoToPage((g) => !g)}
              className="text-xs font-bold text-gray-700 tabular-nums cursor-pointer"
            >
              {currentPage} / {numPages}
            </button>
            <button
              onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold disabled:opacity-30 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}

        {/* ── Floating page indicator (desktop) ── */}
        <div className="hidden md:block">
          {numPages && isReady && (
            <FloatingPageIndicator current={currentPage} total={numPages} />
          )}
        </div>

        {/* ── Zoom bubble ── */}
        <ZoomBubble zoom={zoom} visible={zoomBubbleVisible} />
      </motion.div>
    </>
  );
};

/* ═══════════════════════════════════════════════════
   TOOLBAR BUTTON COMPONENT
   ═══════════════════════════════════════════════════ */

const ICONS: Record<string, React.ReactNode> = {
  'chevron-up': (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ),
  'chevron-down': (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  ),
  minus: (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </svg>
  ),
  plus: (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  'fit-width': (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
      />
    </svg>
  ),
  search: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  bookmark: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  ),
  bookmarks: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L4 21V7z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 3h6a2 2 0 012 2v14"
        opacity={0.5}
      />
    </svg>
  ),
  download: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
};

const ToolbarBtn: React.FC<{
  icon: string;
  onClick: () => void;
  tip?: string;
  active?: boolean;
  disabled?: boolean;
  small?: boolean;
}> = ({ icon, onClick, tip, active, disabled, small }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed rounded-lg transition-colors ${
      small ? 'w-7 h-7' : 'w-8 h-8'
    } ${
      active
        ? 'bg-green-50 text-green-600 border border-green-200'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-transparent'
    }`}
    whileHover={!disabled ? { scale: 1.08 } : {}}
    whileTap={!disabled ? { scale: 0.92 } : {}}
    title={tip}
  >
    {ICONS[icon] ?? <span className="text-xs">{icon}</span>}
  </motion.button>
);
