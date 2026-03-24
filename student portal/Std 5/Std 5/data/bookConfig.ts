/**
 * data/bookConfig.ts
 * ─────────────────────────────────────────────────────
 * NCERT & State Board book data for Class 5 (Std 5).
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
   NCERT BOOKS (Class 5)
   ═══════════════════════════════════════════════════ */

const ncertBooks: BookEntry[] = [
  /* ── Main subjects (top row) ── */
  {
    id: 'ncert-eng',
    board: 'ncert',
    subject: 'English',
    title: 'English Santoor (NCERT Class 5)',
    coverEmoji: '📖',
    gradient: 'from-orange-300 to-amber-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/std5/ncert/english.pdf',
    chapters: [
      { id: 'ne-1', name: "Lesson 1 – Papa's Spectacles" },
      { id: 'ne-2', name: 'Lesson 2 – Gone with the Scooter' },
      { id: 'ne-3', name: 'Lesson 3 – The Rainbow' },
      { id: 'ne-4', name: 'Lesson 4 – The Wise Parrot' },
      { id: 'ne-5', name: 'Lesson 5 – The Frog' },
      { id: 'ne-6', name: 'Lesson 6 – What a Tank!' },
      { id: 'ne-7', name: 'Lesson 7 – Gilli Danda' },
      { id: 'ne-8', name: 'Lesson 8 – The Decision of the Panchayat' },
      { id: 'ne-9', name: 'Lesson 9 – Vocation' },
      { id: 'ne-10', name: 'Lesson 10 – Glass Bangles' },
    ],
  },
  {
    id: 'ncert-maths',
    board: 'ncert',
    subject: 'Mathematics',
    title: 'Maths Mela (NCERT Class 5)',
    coverEmoji: '🔢',
    gradient: 'from-indigo-300 to-blue-400',
    accentColor: '#6366f1',
    pdfUrl: '/books/std5/ncert/mathematics.pdf',
    chapters: [
      { id: 'nm-1', name: 'Ch 1 – We the Travellers — I' },
      { id: 'nm-2', name: 'Ch 2 – Fractions' },
      { id: 'nm-3', name: 'Ch 3 – Angles as Turns' },
      { id: 'nm-4', name: 'Ch 4 – We the Travellers — II' },
      { id: 'nm-5', name: 'Ch 5 – Far and Near' },
      { id: 'nm-6', name: 'Ch 6 – The Dairy Farm' },
      { id: 'nm-7', name: 'Ch 7 – Shapes and Patterns' },
      { id: 'nm-8', name: 'Ch 8 – Weight and Capacity' },
      { id: 'nm-9', name: 'Ch 9 – Coconut Farm' },
      { id: 'nm-10', name: 'Ch 10 – Symmetrical Designs' },
      { id: 'nm-11', name: "Ch 11 – Grandmother's Quilt" },
      { id: 'nm-12', name: 'Ch 12 – Racing Seconds' },
      { id: 'nm-13', name: 'Ch 13 – Animal Jumps' },
      { id: 'nm-14', name: 'Ch 14 – Maps and Locations' },
      { id: 'nm-15', name: 'Ch 15 – Data Through Pictures' },
    ],
  },
  {
    id: 'ncert-science',
    board: 'ncert',
    subject: 'EVS',
    title: 'Our Wondrous World (NCERT EVS Class 5)',
    coverEmoji: '🔬',
    gradient: 'from-cyan-300 to-teal-400',
    accentColor: '#06b6d4',
    pdfUrl: '/books/std5/ncert/science.pdf',
    chapters: [
      { id: 'ns-1', name: 'Ch 1 – Water: The Essence of Life' },
      { id: 'ns-2', name: 'Ch 2 – Journey of a River' },
      { id: 'ns-3', name: 'Ch 3 – The Mystery of Food' },
      { id: 'ns-4', name: 'Ch 4 – Our School: A Happy Place' },
      { id: 'ns-5', name: 'Ch 5 – Our Vibrant Country' },
      { id: 'ns-6', name: 'Ch 6 – Some Unique Places' },
      { id: 'ns-7', name: 'Ch 7 – Energy: How Things Work' },
      { id: 'ns-8', name: 'Ch 8 – Clothes: How Things are Made' },
      { id: 'ns-9', name: 'Ch 9 – Rhythms of Nature' },
      { id: 'ns-10', name: 'Ch 10 – Earth: Our Shared Home' },
    ],
  },
  {
    id: 'ncert-hindi',
    board: 'ncert',
    subject: 'Hindi',
    title: 'Hindi Veena (NCERT Class 5)',
    coverEmoji: '🌿',
    gradient: 'from-emerald-300 to-green-400',
    accentColor: '#10b981',
    pdfUrl: '/books/std5/ncert/hindi.pdf',
    chapters: [
      { id: 'nh-1', name: 'पाठ 1 – किरण' },
      { id: 'nh-2', name: 'पाठ 2 – न्याय की कुर्सी' },
      { id: 'nh-3', name: 'पाठ 3 – चाँद का कुरता' },
      { id: 'nh-4', name: 'पाठ 4 – साङकेन' },
      { id: 'nh-5', name: 'पाठ 5 – सुंदरीया' },
      { id: 'nh-6', name: 'पाठ 6 – चतुर चित्रकार' },
      { id: 'nh-7', name: 'पाठ 7 – मेरा बचपन' },
      { id: 'nh-8', name: 'पाठ 8 – काजीरंगा राष्ट्रीय उद्यान की यात्रा' },
      { id: 'nh-9', name: 'पाठ 9 – न्याय' },
      { id: 'nh-10', name: 'पाठ 10 – तीन मछलियाँ' },
      { id: 'nh-11', name: 'पाठ 11 – हमारे ये कलामंदिर' },
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
    pdfUrl: '/books/std5/ncert/bansuri.pdf',
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
    pdfUrl: '/books/std5/ncert/khel-yoga.pdf',
    chapters: [
      { id: 'np-1', name: 'Unit 1' },
      { id: 'np-2', name: 'Unit 2' },
      { id: 'np-3', name: 'Unit 3' },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   GSEB / STATE BOARD BOOKS (Class 5 — Gujarat)
   ═══════════════════════════════════════════════════ */

const stateBooks: BookEntry[] = [
  /* ── Main subjects (top row) ── */
  {
    id: 'gseb-eng',
    board: 'state',
    subject: 'English',
    title: 'New Explore with Us (GSEB Class 5)',
    coverEmoji: '📖',
    gradient: 'from-orange-300 to-amber-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/std5/gseb/english.pdf',
    chapters: [
      { id: 'ge-1',  name: 'Unit 1 – Good Morning' },
      { id: 'ge-2',  name: 'Unit 2 – The Little Sparrow' },
      { id: 'ge-3',  name: 'Unit 3 – A Kind Heart' },
      { id: 'ge-4',  name: 'Unit 4 – The Magic Pot' },
      { id: 'ge-5',  name: 'Unit 5 – Our Festival' },
      { id: 'ge-6',  name: 'Unit 6 – The Honest Boy' },
      { id: 'ge-7',  name: 'Unit 7 – Seasons' },
      { id: 'ge-8',  name: 'Unit 8 – Animals Around Us' },
      { id: 'ge-9',  name: 'Unit 9 – A Trip to the Village' },
      { id: 'ge-10', name: 'Unit 10 – Let Us Celebrate' },
    ],
  },
  {
    id: 'gseb-maths',
    board: 'state',
    subject: 'Mathematics',
    title: 'Ganit (GSEB Class 5)',
    coverEmoji: '🔢',
    gradient: 'from-indigo-300 to-blue-400',
    accentColor: '#6366f1',
    pdfUrl: '/books/std5/gseb/mathematics.pdf',
    chapters: [
      { id: 'gm-1',  name: 'Ch 1 – Numbers up to 1 Crore' },
      { id: 'gm-2',  name: 'Ch 2 – Addition and Subtraction' },
      { id: 'gm-3',  name: 'Ch 3 – Multiplication' },
      { id: 'gm-4',  name: 'Ch 4 – Division' },
      { id: 'gm-5',  name: 'Ch 5 – Fractions' },
      { id: 'gm-6',  name: 'Ch 6 – Decimal Numbers' },
      { id: 'gm-7',  name: 'Ch 7 – Average' },
      { id: 'gm-8',  name: 'Ch 8 – Money and Unitary Method' },
      { id: 'gm-9',  name: 'Ch 9 – Profit and Loss' },
      { id: 'gm-10', name: 'Ch 10 – Measurements' },
      { id: 'gm-11', name: 'Ch 11 – Time' },
      { id: 'gm-12', name: 'Ch 12 – Angles and Lines' },
      { id: 'gm-13', name: 'Ch 13 – Shapes and Area' },
      { id: 'gm-14', name: 'Ch 14 – Symmetry' },
      { id: 'gm-15', name: 'Ch 15 – Data Handling' },
    ],
  },
  {
    id: 'gseb-evs',
    board: 'state',
    subject: 'EVS',
    title: 'Aas Paas (GSEB EVS Class 5)',
    coverEmoji: '🔬',
    gradient: 'from-cyan-300 to-teal-400',
    accentColor: '#06b6d4',
    pdfUrl: '/books/std5/gseb/evs.pdf',
    chapters: [
      { id: 'gv-1',  name: 'Ch 1 – Our Earth and Environment' },
      { id: 'gv-2',  name: 'Ch 2 – Water and Its Importance' },
      { id: 'gv-3',  name: 'Ch 3 – Food and Nutrition' },
      { id: 'gv-4',  name: 'Ch 4 – Plants Around Us' },
      { id: 'gv-5',  name: 'Ch 5 – Animals and Their Habitat' },
      { id: 'gv-6',  name: 'Ch 6 – Human Body and Health' },
      { id: 'gv-7',  name: 'Ch 7 – Our Family and Society' },
      { id: 'gv-8',  name: 'Ch 8 – Gujarat: Our State' },
      { id: 'gv-9',  name: 'Ch 9 – Transport and Communication' },
      { id: 'gv-10', name: 'Ch 10 – Safety and First Aid' },
    ],
  },
  /* ── Other subjects (bottom row) ── */
  {
    id: 'gseb-hindi',
    board: 'state',
    subject: 'Hindi',
    title: 'Apni Baat (GSEB Hindi Class 5)',
    coverEmoji: '🌿',
    gradient: 'from-emerald-300 to-green-400',
    accentColor: '#10b981',
    pdfUrl: '/books/std5/gseb/hindi.pdf',
    chapters: [
      { id: 'gh-1',  name: 'पाठ 1 – दोस्त की मदद' },
      { id: 'gh-2',  name: 'पाठ 2 – हमारा गाँव' },
      { id: 'gh-3',  name: 'पाठ 3 – बरसात का मौसम' },
      { id: 'gh-4',  name: 'पाठ 4 – नन्हा बादल' },
      { id: 'gh-5',  name: 'पाठ 5 – गुजरात की झलकियाँ' },
      { id: 'gh-6',  name: 'पाठ 6 – मेरा परिवार' },
      { id: 'gh-7',  name: 'पाठ 7 – जंगल की सैर' },
      { id: 'gh-8',  name: 'पाठ 8 – सच्चा मित्र' },
      { id: 'gh-9',  name: 'पाठ 9 – पर्यावरण रक्षा' },
      { id: 'gh-10', name: 'पाठ 10 – हमारे त्योहार' },
      { id: 'gh-11', name: 'पाठ 11 – बड़ों का सम्मान' },
    ],
  },
  {
    id: 'gseb-guj',
    board: 'state',
    subject: 'Gujarati',
    title: 'Gujarati Kukut (GSEB Class 5)',
    coverEmoji: '📙',
    gradient: 'from-amber-300 to-orange-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/std5/gseb/gujarati.pdf',
    chapters: [
      { id: 'gg-1',  name: 'પાઠ ૧ – ઘૂઘવતો દરિયો' },
      { id: 'gg-2',  name: 'પાઠ ૨ – બે વરસાદ ને પાંચ પીપળ' },
      { id: 'gg-3',  name: 'પાઠ ૩ – સવારે સળવળ' },
      { id: 'gg-4',  name: 'પાઠ ૪ – તડકો અધમણ ડાંગર ઝરમર' },
      { id: 'gg-5',  name: 'પાઠ ૫ – ધોયો અને ખાધો' },
      { id: 'gg-6',  name: 'પાઠ ૬ – અખિયોં કી ડિબિયામાં' },
      { id: 'gg-7',  name: 'પાઠ ૭ – ઢેબરાંનો ન્યાય' },
      { id: 'gg-8',  name: 'પાઠ ૮ – લીલાછમ ખેતરનો રખેવાળ' },
      { id: 'gg-9',  name: 'પાઠ ૯ – મારે પણ આવો ભાઈ હોય' },
      { id: 'gg-10', name: 'પાઠ ૧૦ – ડુંગરનો ભેરુ' },
    ],
  },
  {
    id: 'gseb-arts',
    board: 'state',
    subject: 'Arts',
    title: 'Chitrakala (GSEB Arts Class 5)',
    coverEmoji: '🎵',
    gradient: 'from-violet-300 to-purple-400',
    accentColor: '#8b5cf6',
    pdfUrl: '/books/std5/gseb/arts.pdf',
    chapters: [
      { id: 'ga-1', name: 'Unit 1 – Drawing and Colouring' },
      { id: 'ga-2', name: 'Unit 2 – Folk Art of Gujarat' },
      { id: 'ga-3', name: 'Unit 3 – Craft and Creative Work' },
    ],
  },
  {
    id: 'gseb-pe',
    board: 'state',
    subject: 'Physical Education',
    title: 'Sharirik Shikshan (GSEB PE Class 5)',
    coverEmoji: '🏃',
    gradient: 'from-rose-300 to-pink-400',
    accentColor: '#f43f5e',
    pdfUrl: '/books/std5/gseb/pe.pdf',
    chapters: [
      { id: 'gp-1', name: 'Unit 1 – Physical Fitness and Exercises' },
      { id: 'gp-2', name: 'Unit 2 – Games and Sports' },
      { id: 'gp-3', name: 'Unit 3 – Yoga and Health' },
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
