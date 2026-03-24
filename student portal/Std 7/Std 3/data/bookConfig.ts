/**
 * data/bookConfig.ts
 * ─────────────────────────────────────────────────────
 * NCERT & State Board book data for Class 7.
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
   NCERT BOOKS (Class 7)
   ═══════════════════════════════════════════════════ */

const ncertBooks: BookEntry[] = [
  /* ── Main subjects (top row) ── */
  {
    id: 'ncert-eng',
    board: 'ncert',
    subject: 'English',
    title: 'English (NCERT Class 7)',
    coverEmoji: '📖',
    gradient: 'from-orange-300 to-amber-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/ncert/english-book.pdf',
    chapters: [
      { id: 'ne-1', name: 'Lesson 1 – Colours' },
      { id: 'ne-2', name: 'Lesson 2 – Badal and Moti' },
      { id: 'ne-3', name: 'Lesson 3 – Best Friends' },
      { id: 'ne-4', name: 'Lesson 4 – Out in the Garden' },
      { id: 'ne-5', name: 'Lesson 5 – Talking Toys' },
      { id: 'ne-6', name: 'Lesson 6 – Paper Boats' },
      { id: 'ne-7', name: 'Lesson 7 – The Big Laddoo' },
      { id: 'ne-8', name: 'Lesson 8 – Thank God' },
      { id: 'ne-9', name: "Lesson 9 – Madhu's Wish" },
      { id: 'ne-10', name: 'Lesson 10 – Night' },
      { id: 'ne-11', name: 'Lesson 11 – Chanda Mama Counts the Stars' },
      { id: 'ne-12', name: 'Lesson 12 – Chandrayaan' },
    ],
  },
  {
    id: 'ncert-maths',
    board: 'ncert',
    subject: 'Mathematics',
    title: 'Mathematics (NCERT Class 7)',
    coverEmoji: '🔢',
    gradient: 'from-indigo-300 to-blue-400',
    accentColor: '#6366f1',
    pdfUrl: '/books/ncert/math-book-I.pdf',
    chapters: [
      { id: 'nm-1', name: "Ch 1 – What's in a Name?" },
      { id: 'nm-2', name: 'Ch 2 – Toy Joy' },
      { id: 'nm-3', name: 'Ch 3 – Double Century' },
      { id: 'nm-4', name: 'Ch 4 – Vacation With My Nani Maa' },
      { id: 'nm-5', name: 'Ch 5 – Fun With Shapes' },
      { id: 'nm-6', name: 'Ch 6 – House of Hundreds - 1' },
      { id: 'nm-7', name: 'Ch 7 – Raksha Bandhan' },
      { id: 'nm-8', name: 'Ch 8 – Fair Share' },
      { id: 'nm-9', name: 'Ch 9 – House of Hundreds - 2' },
      { id: 'nm-10', name: 'Ch 10 – Fun at Class Party' },
      { id: 'nm-11', name: 'Ch 11 – Filling and Lifting' },
      { id: 'nm-12', name: 'Ch 12 – Give and Take' },
      { id: 'nm-13', name: 'Ch 13 – Time Goes On' },
      { id: 'nm-14', name: 'Ch 14 – The Surajkund Fair' },
    ],
  },
  {
    id: 'ncert-science',
    board: 'ncert',
    subject: 'EVS',
    title: 'EVS (NCERT Class 7)',
    coverEmoji: '🔬',
    gradient: 'from-cyan-300 to-teal-400',
    accentColor: '#06b6d4',
    pdfUrl: '/books/ncert/science-book.pdf',
    chapters: [
      { id: 'ns-1', name: 'Ch 1 – Family and Friends' },
      { id: 'ns-2', name: 'Ch 2 – Going to the Mela' },
      { id: 'ns-3', name: 'Ch 3 – Celebrating Festivals' },
      { id: 'ns-4', name: 'Ch 4 – Getting to Know Plants' },
      { id: 'ns-5', name: 'Ch 5 – Plants and Animals Live Together' },
      { id: 'ns-6', name: 'Ch 6 – Living in Harmony' },
      { id: 'ns-7', name: 'Ch 7 – Water — A Precious Gift' },
      { id: 'ns-8', name: 'Ch 8 – Food We Eat' },
      { id: 'ns-9', name: 'Ch 9 – Staying Healthy and Happy' },
      { id: 'ns-10', name: 'Ch 10 – This World of Things' },
      { id: 'ns-11', name: 'Ch 11 – Making Things' },
      { id: 'ns-12', name: 'Ch 12 – Taking Charge of Waste' },
    ],
  },
  {
    id: 'ncert-hindi',
    board: 'ncert',
    subject: 'Hindi',
    title: 'Hindi Veena (NCERT Class 7)',
    coverEmoji: '🌿',
    gradient: 'from-emerald-300 to-green-400',
    accentColor: '#10b981',
    pdfUrl: '/books/ncert/hindi-book.pdf',
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
  /* ── Other subjects (bottom row) ── */
  {
    id: 'ncert-arts',
    board: 'ncert',
    subject: 'Arts',
    title: 'Bansuri (NCERT Arts)',
    coverEmoji: '🎵',
    gradient: 'from-violet-300 to-purple-400',
    accentColor: '#8b5cf6',
    pdfUrl: '/books/ncert/arts-book.pdf',
    chapters: [
      { id: 'na-1', name: 'Unit 1' },
      { id: 'na-2', name: 'Unit 2' },
      { id: 'na-3', name: 'Unit 3' },
    ],
  },
  {
    id: 'ncert-pe',
    board: 'ncert',
    subject: 'Physical Education',
    title: 'Khel Yoga (NCERT PE)',
    coverEmoji: '🏃',
    gradient: 'from-rose-300 to-pink-400',
    accentColor: '#f43f5e',
    pdfUrl: '/books/ncert/physical-education.pdf',
    chapters: [
      { id: 'np-1', name: 'Unit 1' },
      { id: 'np-2', name: 'Unit 2' },
      { id: 'np-3', name: 'Unit 3' },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   GSEB / STATE BOARD BOOKS (Class 7 — Gujarat)
   ═══════════════════════════════════════════════════ */

const stateBooks: BookEntry[] = [
  {
    id: 'gseb-guj',
    board: 'state',
    subject: 'Gujarati',
    title: 'Gujarati Mayur (GSEB Class 7)',
    coverEmoji: '📙',
    gradient: 'from-fuchsia-300 to-pink-400',
    accentColor: '#ec4899',
    pdfUrl: '/books/gseb/gujarati/gujrati-book-I.pdf',
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
