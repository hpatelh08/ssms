/**
 * data/bookConfig.ts
 * ─────────────────────────────────────────────────────
 * NCERT & State Board book data for Class 3.
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
   NCERT BOOKS (Class 3)
   ═══════════════════════════════════════════════════ */

const ncertBooks: BookEntry[] = [
  /* ── Main subjects (top row) ── */
  {
    id: 'ncert-eng',
    board: 'ncert',
    subject: 'English',
    title: 'English Mridang (NCERT Class 2)',
    coverEmoji: '📖',
    gradient: 'from-orange-300 to-amber-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/NCERT/English.pdf',
    chapters: [
      { id: 'ne-1', name: 'Unit 1 – My Bicycle' },
      { id: 'ne-2', name: 'Unit 1 – Picture Reading' },
      { id: 'ne-3', name: 'Unit 2 – It is Fun' },
      { id: 'ne-4', name: 'Unit 2 – Seeing without Seeing' },
      { id: 'ne-5', name: 'Unit 3 – Come Back Soon' },
      { id: 'ne-6', name: 'Unit 3 – Between Home and School' },
      { id: 'ne-7', name: 'Unit 3 – This is My Town' },
      { id: 'ne-8', name: 'Unit 4 – A Show of Clouds' },
      { id: 'ne-9', name: 'Unit 4 – My Name' },
      { id: 'ne-10', name: 'Unit 4 – The Crow' },
      { id: 'ne-11', name: 'Unit 4 – The Smart Monkey' },
      { id: 'ne-12', name: 'Unit 5 – Little Drops of Water' },
      { id: 'ne-13', name: 'Unit 5 – We are all Indians' },
    ],
  },
  {
    id: 'ncert-maths',
    board: 'ncert',
    subject: 'Mathematics',
    title: 'Mathematics Joyful (NCERT Class 2)',
    coverEmoji: '🔢',
    gradient: 'from-indigo-300 to-blue-400',
    accentColor: '#6366f1',
    pdfUrl: '/books/NCERT/Mathematics.pdf',
    chapters: [
      { id: 'nm-1', name: 'Ch 1 – A Day at the Beach' },
      { id: 'nm-2', name: 'Ch 2 – Shapes Around Us' },
      { id: 'nm-3', name: 'Ch 3 – Fun with Numbers' },
      { id: 'nm-4', name: 'Ch 4 – Shadow Story' },
      { id: 'nm-5', name: 'Ch 5 – Playing with Lines' },
      { id: 'nm-6', name: 'Ch 6 – Decoration for Festival' },
      { id: 'nm-7', name: "Ch 7 – Rani's Gift" },
      { id: 'nm-8', name: 'Ch 8 – Grouping and Sharing' },
      { id: 'nm-9', name: 'Ch 9 – Which Season is It?' },
      { id: 'nm-10', name: 'Ch 10 – Fun at the Fair' },
      { id: 'nm-11', name: 'Ch 11 – Data Handling' },
      { id: 'nm-12', name: 'Ch 12 – Puzzles' },
    ],
  },
  {
    id: 'ncert-hindi',
    board: 'ncert',
    subject: 'Hindi',
    title: 'Hindi Sarangi (NCERT Class 2)',
    coverEmoji: '🌿',
    gradient: 'from-emerald-300 to-green-400',
    accentColor: '#10b981',
    pdfUrl: '/books/NCERT/Hindi.pdf',
    chapters: [
      { id: 'nh-1', name: 'पाठ 1 – सीखो' },
      { id: 'nh-2', name: 'पाठ 2 – चींटी' },
      { id: 'nh-3', name: 'पाठ 3 – कितने पैर?' },
      { id: 'nh-4', name: 'पाठ 4 – बया हमारी चिड़िया रानी!' },
      { id: 'nh-5', name: 'पाठ 5 – आम का पेड़' },
      { id: 'nh-6', name: 'पाठ 6 – बीरबल की खिचड़ी' },
      { id: 'nh-7', name: 'पाठ 7 – मित्र को पत्र' },
      { id: 'nh-8', name: 'पाठ 8 – चतुर गीदड़' },
      { id: 'nh-9', name: 'पाठ 9 – प्रकृति पर्व — फूलदेई' },
      { id: 'nh-10', name: 'पाठ 10 – रस्साकशी' },
      { id: 'nh-11', name: 'पाठ 11 – एक जादुई पिटारा' },
      { id: 'nh-12', name: 'पाठ 12 – अपना-अपना काम' },
      { id: 'nh-13', name: 'पाठ 13 – पेड़ों की अम्मा तिमक्का' },
      { id: 'nh-14', name: 'पाठ 14 – किसान की होशियारी' },
      { id: 'nh-15', name: 'पाठ 15 – भारत' },
      { id: 'nh-16', name: 'पाठ 16 – चंद्रयान (संवाद)' },
      { id: 'nh-17', name: 'पाठ 17 – बोलने वाली मूँद' },
      { id: 'nh-18', name: 'पाठ 18 – हम अनेक किन्तु एक' },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   GSEB / STATE BOARD BOOKS (Class 3 — Gujarat)
   ═══════════════════════════════════════════════════ */

const stateBooks: BookEntry[] = [
  {
    id: 'gseb-guj',
    board: 'state',
    subject: 'Gujarati',
    title: 'Gujarati Bulbul (GSEB Class 2)',
    coverEmoji: '📙',
    gradient: 'from-amber-300 to-orange-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/GSEB/Gujarati.pdf',
    chapters: [
      { id: 'gg-1', name: 'પાઠ ૧ – નાક-કાન વગર ગા' },
      { id: 'gg-2', name: 'પાઠ ૨ – નારાજ વનરાજ' },
      { id: 'gg-3', name: 'પાઠ ૩ – મકાન વગરના વાનર' },
      { id: 'gg-4', name: 'પાઠ ૪ – લાલકણને ખાઈ ગઈ બાજરી' },
      { id: 'gg-5', name: 'પાઠ ૫ – તીનું તમતમતું ગીત' },
      { id: 'gg-6', name: 'પાઠ ૬ – મરજી બનો, મઝા કરો' },
      { id: 'gg-7', name: 'પાઠ ૭ – મિયાંઉ...મિયાંઉ, અહી આવ' },
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
