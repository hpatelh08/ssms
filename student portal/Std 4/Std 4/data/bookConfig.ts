/**
 * data/bookConfig.ts
 * ─────────────────────────────────────────────────────
 * NCERT & State Board book data for Class 4.
 *
 * Each book has:
 *  - title, cover emoji, subject colour
 *  - PDF link (local path served from /public/books/)
 *  - Chapters list (no external redirects)
 *
 * Used by the Parent "Learning Library" page.
 */

export type BoardType = 'ncert' | 'state';

export interface BookChapter {
  id: string;
  name: string;
}

export interface BookEntry {
  id: string;
  board: BoardType;
  subject: string;
  title: string;
  coverEmoji: string;
  gradient: string;
  accentColor: string;
  pdfUrl: string;
  chapters: BookChapter[];
}

/* ═══════════════════════════════════════════════════
   NCERT BOOKS (Class 4)
   ═══════════════════════════════════════════════════ */

const ncertBooks: BookEntry[] = [
  {
    id: 'ncert-eng',
    board: 'ncert',
    subject: 'English',
    title: 'Marigold (English)',
    coverEmoji: '📖',
    gradient: 'from-orange-300 to-amber-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/ncert/NCERT_English.pdf',
    chapters: [
      { id: 'ne-1', name: 'Unit 1' },
      { id: 'ne-2', name: 'Unit 2' },
      { id: 'ne-3', name: 'Unit 3' },
      { id: 'ne-4', name: 'Unit 4' },
      { id: 'ne-5', name: 'Unit 5' },
    ],
  },
  {
    id: 'ncert-math',
    board: 'ncert',
    subject: 'Maths',
    title: 'Math-Magic',
    coverEmoji: '🔢',
    gradient: 'from-violet-300 to-indigo-400',
    accentColor: '#7c3aed',
    pdfUrl: '/books/ncert/NCERT_Mathematics.pdf',
    chapters: [
      { id: 'nm-1', name: 'Chapter 1' },
      { id: 'nm-2', name: 'Chapter 2' },
      { id: 'nm-3', name: 'Chapter 3' },
      { id: 'nm-4', name: 'Chapter 4' },
      { id: 'nm-5', name: 'Chapter 5' },
    ],
  },
  {
    id: 'ncert-hindi',
    board: 'ncert',
    subject: 'Hindi',
    title: 'Rimjhim (Hindi)',
    coverEmoji: '🌿',
    gradient: 'from-emerald-300 to-green-400',
    accentColor: '#10b981',
    pdfUrl: '/books/ncert/NCERT_Hindi.pdf',
    chapters: [
      { id: 'nh-1', name: 'पाठ १' },
      { id: 'nh-2', name: 'पाठ २' },
      { id: 'nh-3', name: 'पाठ ३' },
      { id: 'nh-4', name: 'पाठ ४' },
    ],
  },
  {
    id: 'ncert-science',
    board: 'ncert',
    subject: 'Science',
    title: 'Looking Around',
    coverEmoji: '🔬',
    gradient: 'from-sky-300 to-blue-400',
    accentColor: '#0ea5e9',
    pdfUrl: '/books/ncert/NCERT_Science.pdf',
    chapters: [
      { id: 'ns-1', name: 'Chapter 1' },
      { id: 'ns-2', name: 'Chapter 2' },
      { id: 'ns-3', name: 'Chapter 3' },
      { id: 'ns-4', name: 'Chapter 4' },
    ],
  },
  {
    id: 'ncert-art',
    board: 'ncert',
    subject: 'Art',
    title: 'Art Education',
    coverEmoji: '🎨',
    gradient: 'from-pink-300 to-rose-400',
    accentColor: '#f43f5e',
    pdfUrl: '/books/ncert/NCERT_Art.pdf',
    chapters: [
      { id: 'na-1', name: 'Chapter 1' },
      { id: 'na-2', name: 'Chapter 2' },
    ],
  },
  {
    id: 'ncert-yoga',
    board: 'ncert',
    subject: 'Physical Education',
    title: 'Khel Yoga',
    coverEmoji: '🧘‍♂️',
    gradient: 'from-purple-300 to-fuchsia-400',
    accentColor: '#a855f7',
    pdfUrl: '/books/ncert/NCERT_Khel_Yoga.pdf',
    chapters: [
      { id: 'ny-1', name: 'Chapter 1' },
      { id: 'ny-2', name: 'Chapter 2' },
    ],
  }
];

/* ═══════════════════════════════════════════════════
   GSEB / STATE BOARD BOOKS (Class 4 — Gujarat)
   ═══════════════════════════════════════════════════ */

const stateBooks: BookEntry[] = [
  /* ── GSEB Gujarati ── */
  {
    id: 'gseb-guj-class4',
    board: 'state',
    subject: 'Gujarati',
    title: 'Gujarati (Second Language)',
    coverEmoji: '📙',
    gradient: 'from-amber-300 to-orange-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/gseb/gujarati/Gujarat_Gujarati.pdf',
    chapters: [
      { id: 'gg-1', name: 'પાઠ ૧' },
      { id: 'gg-2', name: 'પાઠ ૨' },
    ],
  }
];

/* ── Mirror NCERT books into GSEB tab (same PDFs, state board section visibility) ── */
const gsebMirroredNcertBooks: BookEntry[] = ncertBooks.map((book) => ({
  ...book,
  id: `gseb-${book.id}`,
  board: 'state',
  title: `${book.title} (GSEB)`,
  chapters: book.chapters.map((ch) => ({
    ...ch,
    id: `g-${ch.id}`,
  })),
}));

const stateBooksWithNcertMirror: BookEntry[] = [...stateBooks, ...gsebMirroredNcertBooks];

/* ═══════════════════════════════════════════════════
   COMBINED EXPORT
   ═══════════════════════════════════════════════════ */

export const BOOK_CONFIG: Record<BoardType, BookEntry[]> = {
  ncert: ncertBooks,
  state: stateBooksWithNcertMirror,
};

export const ALL_BOOKS: BookEntry[] = [...ncertBooks, ...stateBooksWithNcertMirror];
