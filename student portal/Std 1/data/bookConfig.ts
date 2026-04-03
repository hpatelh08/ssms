/**
 * data/bookConfig.ts
 * ─────────────────────────────────────────────────────
 * NCERT & State Board book data for Class 1.
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
   NCERT BOOKS (Class 1)
   ═══════════════════════════════════════════════════ */

const ncertBooks: BookEntry[] = [
  {
    id: 'ncert-eng',
    board: 'ncert',
    subject: 'English',
    title: 'Mridang (English)',
    coverEmoji: '📖',
    gradient: 'from-orange-300 to-amber-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/ncert/mridang.pdf',
    chapters: [
      { id: 'ne-1', name: 'A Happy Child' },
      { id: 'ne-2', name: 'Three Little Pigs' },
      { id: 'ne-3', name: 'After a Bath' },
      { id: 'ne-4', name: 'The Bubble, the Straw and the Shoe' },
      { id: 'ne-5', name: 'One Little Kitten' },
      { id: 'ne-6', name: 'Lalu and Peelu' },
      { id: 'ne-7', name: 'Once I Saw a Little Bird' },
      { id: 'ne-8', name: 'Mittu and the Yellow Mango' },
      { id: 'ne-9', name: 'Merry-Go-Round' },
      { id: 'ne-10', name: 'Circle' },
    ],
  },
  {
    id: 'ncert-math',
    board: 'ncert',
    subject: 'Maths',
    title: 'Joyful Mathematics',
    coverEmoji: '🔢',
    gradient: 'from-violet-300 to-indigo-400',
    accentColor: '#7c3aed',
    pdfUrl: '/books/ncert/joyful-mathematics.pdf',
    chapters: [
      { id: 'nm-1', name: 'Shapes and Space' },
      { id: 'nm-2', name: 'Numbers from One to Nine' },
      { id: 'nm-3', name: 'Addition' },
      { id: 'nm-4', name: 'Subtraction' },
      { id: 'nm-5', name: 'Numbers from Ten to Twenty' },
      { id: 'nm-6', name: 'Time' },
      { id: 'nm-7', name: 'Measurement' },
      { id: 'nm-8', name: 'Numbers from Twenty-one to Fifty' },
      { id: 'nm-9', name: 'Data Handling' },
      { id: 'nm-10', name: 'Patterns' },
      { id: 'nm-11', name: 'Numbers' },
      { id: 'nm-12', name: 'Money' },
      { id: 'nm-13', name: 'How Many' },
    ],
  },
  {
    id: 'ncert-hindi',
    board: 'ncert',
    subject: 'Hindi',
    title: 'Sarangani (Hindi)',
    coverEmoji: '🌿',
    gradient: 'from-emerald-300 to-green-400',
    accentColor: '#10b981',
    pdfUrl: '/books/ncert/sarangani.pdf',
    chapters: [
      { id: 'nh-1', name: 'झूला' },
      { id: 'nh-2', name: 'आम की कहानी' },
      { id: 'nh-3', name: 'सात पूँछ का चूहा' },
      { id: 'nh-4', name: 'पत्ते ही पत्ते' },
      { id: 'nh-5', name: 'पकौड़ी' },
    ],
  },
  {
    id: 'ncert-eng-class1',
    board: 'ncert',
    subject: 'English',
    title: 'English Class 1',
    coverEmoji: '📝',
    gradient: 'from-sky-300 to-blue-400',
    accentColor: '#0ea5e9',
    pdfUrl: '/books/ncert/english-class-1.pdf',
    chapters: [
      { id: 'nec-1', name: 'Unit 1' },
      { id: 'nec-2', name: 'Unit 2' },
    ],
  },
  {
    id: 'ncert-math-class1',
    board: 'ncert',
    subject: 'Maths',
    title: 'Mathematics Class 1',
    coverEmoji: '➕',
    gradient: 'from-rose-300 to-pink-400',
    accentColor: '#f43f5e',
    pdfUrl: '/books/ncert/mathematics-class-1.pdf',
    chapters: [
      { id: 'nmc-1', name: 'Unit 1' },
      { id: 'nmc-2', name: 'Unit 2' },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   GSEB / STATE BOARD BOOKS (Class 1 — Gujarat)
   ═══════════════════════════════════════════════════ */

const stateBooks: BookEntry[] = [
  /* ── GSEB English ── */
  {
    id: 'gseb-eng-mridang',
    board: 'state',
    subject: 'English',
    title: 'Mridang (GSEB English)',
    coverEmoji: '📘',
    gradient: 'from-sky-300 to-blue-400',
    accentColor: '#0ea5e9',
    pdfUrl: '/books/gseb/english/mridang.pdf',
    chapters: [
      { id: 'ge-1', name: 'Unit 1' },
      { id: 'ge-2', name: 'Unit 2' },
    ],
  },
  {
    id: 'gseb-eng-math',
    board: 'state',
    subject: 'Maths',
    title: 'Joyful Mathematics (GSEB)',
    coverEmoji: '🔢',
    gradient: 'from-pink-300 to-rose-400',
    accentColor: '#f43f5e',
    pdfUrl: '/books/gseb/english/joyful-mathematics.pdf',
    chapters: [
      { id: 'gm-1', name: 'Numbers' },
      { id: 'gm-2', name: 'Shapes' },
    ],
  },
  /* ── GSEB Gujarati ── */
  {
    id: 'gseb-guj-aanandadayi',
    board: 'state',
    subject: 'Gujarati',
    title: 'Aanandadayi (ગુજરાતી)',
    coverEmoji: '📙',
    gradient: 'from-amber-300 to-orange-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/gseb/gujarati/aanandadayi.pdf',
    chapters: [
      { id: 'gg-1', name: 'પાઠ ૧' },
      { id: 'gg-2', name: 'પાઠ ૨' },
    ],
  },
  {
    id: 'gseb-guj-ajamayashi',
    board: 'state',
    subject: 'Gujarati',
    title: 'Ajamayashi (ગુજરાતી)',
    coverEmoji: '📒',
    gradient: 'from-yellow-300 to-amber-400',
    accentColor: '#eab308',
    pdfUrl: '/books/gseb/gujarati/ajamayashi.pdf',
    chapters: [
      { id: 'ga-1', name: 'પાઠ ૧' },
      { id: 'ga-2', name: 'પાઠ ૨' },
    ],
  },
  {
    id: 'gseb-guj-kalakaliyo',
    board: 'state',
    subject: 'Gujarati',
    title: 'Kalakaliyo (ગુજરાતી)',
    coverEmoji: '🎨',
    gradient: 'from-purple-300 to-fuchsia-400',
    accentColor: '#a855f7',
    pdfUrl: '/books/gseb/gujarati/kalakaliyo.pdf',
    chapters: [
      { id: 'gk-1', name: 'પાઠ ૧' },
    ],
  },
  /* ── GSEB Hindi ── */
  {
    id: 'gseb-hindi-aanandamay',
    board: 'state',
    subject: 'Hindi',
    title: 'Aanandamay (हिंदी)',
    coverEmoji: '📕',
    gradient: 'from-red-300 to-rose-400',
    accentColor: '#ef4444',
    pdfUrl: '/books/gseb/hindi/aanandamay.pdf',
    chapters: [
      { id: 'gh-1', name: 'पाठ १' },
      { id: 'gh-2', name: 'पाठ २' },
    ],
  },
  {
    id: 'gseb-hindi-sarangi',
    board: 'state',
    subject: 'Hindi',
    title: 'Sarangi (हिंदी)',
    coverEmoji: '🎵',
    gradient: 'from-emerald-300 to-teal-400',
    accentColor: '#14b8a6',
    pdfUrl: '/books/gseb/hindi/sarangi.pdf',
    chapters: [
      { id: 'gs-1', name: 'पाठ १' },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   COMBINED EXPORT
   ═══════════════════════════════════════════════════ */

export const BOOK_CONFIG: Record<BoardType, BookEntry[]> = {
  ncert: ncertBooks,
  state: stateBooks,
};

export const ALL_BOOKS: BookEntry[] = [...ncertBooks, ...stateBooks];
