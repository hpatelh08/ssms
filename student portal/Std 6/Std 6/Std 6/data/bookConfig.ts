/**
 * data/bookConfig.ts
 * ─────────────────────────────────────────────────────
 * NCERT & State Board book data for Class 6.
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
   NCERT BOOKS (Class 6)
   ═══════════════════════════════════════════════════ */

const ncertBooks: BookEntry[] = [
  {
    id: 'ncert-eng-class6',
    board: 'ncert',
    subject: 'English',
    title: 'English',
    coverEmoji: '📖',
    gradient: 'from-orange-300 to-amber-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/ncert/NCERT_English.pdf',
    chapters: [
      { id: 'ne6-1', name: 'Unit 1: Fables and Folk Tales' },
      { id: 'ne6-2', name: 'Unit 2: Friendship' },
      { id: 'ne6-3', name: 'Unit 3: Nurturing Nature' },
      { id: 'ne6-4', name: 'Unit 4: Sports and Wellness' },
      { id: 'ne6-5', name: 'Unit 5: Culture and Tradition' },
    ],
  },
  {
    id: 'ncert-hindi-class6',
    board: 'ncert',
    subject: 'Hindi',
    title: 'Hindi',
    coverEmoji: '🌿',
    gradient: 'from-emerald-300 to-green-400',
    accentColor: '#10b981',
    pdfUrl: '/books/ncert/NCERT_Hindi.pdf',
    chapters: [
      { id: 'nh6-1', name: 'Unit 1: मातृभूमम' },
      { id: 'nh6-2', name: 'Unit 2: गोल' },
      { id: 'nh6-3', name: 'Unit 3: पहली बूंद' },
      { id: 'nh6-4', name: 'Unit 4: हार की जीत' },
      { id: 'nh6-5', name: 'Unit 5: रहीम के दोहे' },
      { id: 'nh6-6', name: 'Unit 6: मेरी माँ' },
      { id: 'nh6-7', name: 'Unit 7: जलाते चलो' },
      { id: 'nh6-8', name: 'Unit 8: समरिया और मबहू नृत्य' },
      { id: 'nh6-9', name: 'Unit 9: मैया मैं नमहं माखन खायो' },
      { id: 'nh6-10', name: 'Unit 10: परीक्षा' },
      { id: 'nh6-11', name: 'Unit 11: चेतक की वीरता' },
      { id: 'nh6-12', name: 'Unit 12: हिंद महासागर में छोटा-सा महंदुस्तान' },
      { id: 'nh6-13', name: 'Unit 13: पेड़ की बात' },
    ],
  },
  {
    id: 'ncert-kriti-class6',
    board: 'ncert',
    subject: 'Kriti',
    title: 'Kriti',
    coverEmoji: '🎨',
    gradient: 'from-purple-300 to-fuchsia-400',
    accentColor: '#a855f7',
    pdfUrl: '/books/ncert/NCERT_Kriti.pdf',
    chapters: [
      { id: 'nk6-1', name: 'Unit 1: Objects and Still Life' },
      { id: 'nk6-2', name: 'Unit 2: Changing the Typical Picture' },
      { id: 'nk6-3', name: 'Unit 3: Portraying People' },
      { id: 'nk6-4', name: 'Unit 4: Paper Crafts' },
      { id: 'nk6-5', name: 'Unit 5: Seals to Prints' },
      { id: 'nk6-6', name: 'Unit 6: Music and your Emotions' },
      { id: 'nk6-7', name: 'Unit 7: Musical Instruments' },
      { id: 'nk6-8', name: 'Unit 8: Taal or Talam...' },
      { id: 'nk6-9', name: 'Unit 9: Melodies of Diversity' },
      { id: 'nk6-10', name: 'Unit 10: Songwriting' },
      { id: 'nk6-11', name: 'Unit 11: Music and Society' },
      { id: 'nk6-12', name: 'Unit 12: My Body in Motion' },
      { id: 'nk6-13', name: 'Unit 13: Breaking Barriers with Dance' },
      { id: 'nk6-14', name: 'Unit 14: Harmony in Motion' },
      { id: 'nk6-15', name: 'Unit 15: Dances of Our Land' },
      { id: 'nk6-16', name: 'Unit 16: Emotions Unveiled!' },
      { id: 'nk6-17', name: 'Unit 17: Let’s Design' },
      { id: 'nk6-18', name: 'Unit 18: In the Company of Theatre' },
      { id: 'nk6-19', name: 'Unit 19: Stories of Shadows and Strings' },
      { id: 'nk6-20', name: 'Unit 20: The Grand Finale' },
      { id: 'nk6-21', name: 'Unit 21: Integration of All Art Forms' },
      { id: 'nk6-22', name: 'Unit 22: Assessment' },
    ],
  },
  {
    id: 'ncert-math-class6',
    board: 'ncert',
    subject: 'Mathematics',
    title: 'Mathematics',
    coverEmoji: '🔢',
    gradient: 'from-violet-300 to-indigo-400',
    accentColor: '#7c3aed',
    pdfUrl: '/books/ncert/NCERT_Mathematics.pdf',
    chapters: [
      { id: 'nm6-1', name: 'Unit 1: PATTERNS IN MATHEMATICS' },
      { id: 'nm6-2', name: 'Unit 2: Lines and Angles' },
      { id: 'nm6-3', name: 'Unit 3: NUMBER PLAY' },
      { id: 'nm6-4', name: 'Unit 4: Data Handling and Presentation' },
      { id: 'nm6-5', name: 'Unit 5: Prime Time' },
      { id: 'nm6-6', name: 'Unit 6: PERIMETER AND AREA' },
      { id: 'nm6-7', name: 'Unit 7: Fractions' },
      { id: 'nm6-8', name: 'Unit 8: Playing with ConstruCtions' },
      { id: 'nm6-9', name: 'Unit 9: symmetry' },
      { id: 'nm6-10', name: 'Unit 10: THE OTHER SIDE OF ZERO' },
    ],
  },
  {
    id: 'ncert-pe-class6',
    board: 'ncert',
    subject: 'Physical Education',
    title: 'Physical Education',
    coverEmoji: '⚽',
    gradient: 'from-rose-300 to-pink-400',
    accentColor: '#f43f5e',
    pdfUrl: '/books/ncert/NCERT_physical education.pdf',
    chapters: [
      { id: 'npe6-1', name: 'UNIT 1: Importance of Physical Education' },
      { id: 'npe6-2', name: 'UNIT 2: Motor Fitness' },
      { id: 'npe6-3', name: 'UNIT 3: Fundamental Skills of Kho-Kho' },
      { id: 'npe6-4', name: 'UNIT 4: Fundamental Skills of Handball' },
      { id: 'npe6-5', name: 'UNIT 5: Yoga' },
    ],
  },
  {
    id: 'ncert-sci-class6',
    board: 'ncert',
    subject: 'Science',
    title: 'Science',
    coverEmoji: '🔬',
    gradient: 'from-cyan-300 to-teal-400',
    accentColor: '#0d9488',
    pdfUrl: '/books/ncert/NCERT_Science.pdf',
    chapters: [
      { id: 'ns6-1', name: 'Unit 1: The Wonderful World of Science' },
      { id: 'ns6-2', name: 'Unit 2: Diversity in the Living World' },
      { id: 'ns6-3', name: 'Unit 3: Mindful Eating: A Path to a Healthy Body' },
      { id: 'ns6-4', name: 'Unit 4: Exploring Magnets' },
      { id: 'ns6-5', name: 'Unit 5: Measurement of Length and Motion' },
      { id: 'ns6-6', name: 'Unit 6: Materials Around Us' },
      { id: 'ns6-7', name: 'Unit 7: Temperature and its Measurement' },
      { id: 'ns6-8', name: 'Unit 8: A Journey through States of Water' },
      { id: 'ns6-9', name: 'Unit 9: Methods of Separation in Everyday Life' },
      { id: 'ns6-10', name: 'Unit 10: Living Creatures' },
      { id: 'ns6-11', name: 'Unit 11: Nature’s Treasures' },
      { id: 'ns6-12', name: 'Unit 12: Beyond Earth' },
    ],
  },
  {
    id: 'ncert-ss-class6',
    board: 'ncert',
    subject: 'Social Science',
    title: 'Social Science',
    coverEmoji: '🌍',
    gradient: 'from-yellow-300 to-orange-400',
    accentColor: '#ea580c',
    pdfUrl: '/books/ncert/NCERT_Social Science.pdf',
    chapters: [
      { id: 'nss6-1', name: 'Unit 1: Locating Places on the Earth' },
      { id: 'nss6-2', name: 'Unit 2: Oceans and Continents' },
      { id: 'nss6-3', name: 'Unit 3: Landforms and Life' },
      { id: 'nss6-4', name: 'Unit 4: Timeline and Sources of History' },
      { id: 'nss6-5', name: 'Unit 5: India, That Is Bharat' },
      { id: 'nss6-6', name: 'Unit 6: The Beginnings of Indian Civilisation' },
      { id: 'nss6-7', name: 'Unit 7: India\'s Cultural Roots' },
      { id: 'nss6-8', name: 'Unit 8: Unity in Diversity' },
      { id: 'nss6-9', name: 'Unit 9: Family and Community' },
      { id: 'nss6-10', name: 'Unit 10: Grassroots Democracy 1' },
      { id: 'nss6-11', name: 'Unit 11: Grassroots Democracy 2' },
      { id: 'nss6-12', name: 'Unit 12: Grassroots Democracy 3' },
      { id: 'nss6-13', name: 'Unit 13: The Value of Work' },
      { id: 'nss6-14', name: 'Unit 14: Economic Activities Around Us' },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   GSEB / STATE BOARD BOOKS (Class 6 — Gujarat)
   ═══════════════════════════════════════════════════ */

const stateBooks: BookEntry[] = [
  /* ── GSEB Gujarati ── */
  {
    id: 'gseb-guj-sem1',
    board: 'state',
    subject: 'Gujarati',
    title: 'Gujarati (Semester 1)',
    coverEmoji: '📙',
    gradient: 'from-sky-300 to-blue-400',
    accentColor: '#0ea5e9',
    pdfUrl: '/books/gseb/gujarati/GSEB-Class-6-Gujarati-Language-Textbook-Semester-1.pdf',
    chapters: [
      { id: 'g6-1', name: '1. રેલવે-સ્ટેશન' },
      { id: 'g6-2', name: '2. હિંદમાતાને સંબોધન' },
      { id: 'g6-3', name: '3. દ્વિદલ' },
      { id: 'g6-4', name: '4. રવિશંકર મહારાજ' },
      { id: 'g6-5', name: '5. મહેનતની મોસમ' },
      { id: 'g6-6', name: '6. લેખણ ઝાલી નો રહી' },
      { id: 'g6-7', name: '7. પગલે-પગલે' },
      { id: 'g6-8', name: '8. બિરબલની યુક્તિ' },
      { id: 'g6-9', name: '9. પાદર' },
    ],
  },
  {
    id: 'gseb-guj-sem2',
    board: 'state',
    subject: 'Gujarati',
    title: 'Gujarati (Semester 2)',
    coverEmoji: '📒',
    gradient: 'from-teal-300 to-cyan-400',
    accentColor: '#06b6d4',
    pdfUrl: '/books/gseb/gujarati/GSEB-Class-6-Gujarati-Language-Textbook-Semester-2.pdf',
    chapters: [
      { id: 'g6-10', name: '10. આલાલીલા વાંસડિયા' },
      { id: 'g6-11', name: '11. એક જાદુઈ પત્રની વાર્તા' },
      { id: 'g6-12', name: '12. રાવણનું મિથ્યાભિમાન' },
      { id: 'g6-13', name: '13. સાગરકાંઠાનો પ્રવાસ' },
      { id: 'g6-14', name: '14. સારા અક્ષર' },
      { id: 'g6-15', name: '15. ગુજરાત મોરી મોરી રે' },
      { id: 'g6-16', name: '16. માતૃહૃદય' },
      { id: 'g6-17', name: '17. સુગંધ કચ્છની..!' },
      { id: 'g6-18', name: '18. શુભાષિત' },
    ],
  },

  /* ── GSEB English (NCERT Poorvi) ── */
  {
    id: 'gseb-eng-class6',
    board: 'state',
    subject: 'English',
    title: 'English',
    coverEmoji: '📖',
    gradient: 'from-orange-300 to-amber-400',
    accentColor: '#f59e0b',
    pdfUrl: '/books/ncert/NCERT_English.pdf',
    chapters: [
      { id: 'ge6-1', name: 'Unit 1: Fables and Folk Tales' },
      { id: 'ge6-2', name: 'Unit 2: Friendship' },
      { id: 'ge6-3', name: 'Unit 3: Nurturing Nature' },
      { id: 'ge6-4', name: 'Unit 4: Sports and Wellness' },
      { id: 'ge6-5', name: 'Unit 5: Culture and Tradition' },
    ],
  },

  /* ── GSEB Hindi ── */
  {
    id: 'gseb-hindi-class6',
    board: 'state',
    subject: 'Hindi',
    title: 'Hindi',
    coverEmoji: '🌿',
    gradient: 'from-emerald-300 to-green-400',
    accentColor: '#10b981',
    pdfUrl: '/books/ncert/NCERT_Hindi.pdf',
    chapters: [
      { id: 'gh6-1', name: 'Unit 1: મातृभूमम' },
      { id: 'gh6-2', name: 'Unit 2: gor' },
      { id: 'gh6-3', name: 'Unit 3: पहली बूंद' },
      { id: 'gh6-4', name: 'Unit 4: हार की जीत' },
      { id: 'gh6-5', name: 'Unit 5: रहीम के दोहे' },
      { id: 'gh6-6', name: 'Unit 6: मेरी माँ' },
      { id: 'gh6-7', name: 'Unit 7: जलाते चलो' },
      { id: 'gh6-8', name: 'Unit 8: समरिया और बिहू नृत्य' },
      { id: 'gh6-9', name: 'Unit 9: मैया मैं नहिं माखन खायो' },
      { id: 'gh6-10', name: 'Unit 10: परीक्षा' },
      { id: 'gh6-11', name: 'Unit 11: चेतक की वीरता' },
      { id: 'gh6-12', name: 'Unit 12: हिंद महासागर में छोटा-सा हिंदुस्तान' },
      { id: 'gh6-13', name: 'Unit 13: पेड़ की बात' },
    ],
  },

  /* ── GSEB Kriti (Arts) ── */
  {
    id: 'gseb-kriti-class6',
    board: 'state',
    subject: 'Kriti',
    title: 'Kriti',
    coverEmoji: '🎨',
    gradient: 'from-purple-300 to-fuchsia-400',
    accentColor: '#a855f7',
    pdfUrl: '/books/ncert/NCERT_Kriti.pdf',
    chapters: [
      { id: 'gk6-1', name: 'Unit 1: Objects and Still Life' },
      { id: 'gk6-2', name: 'Unit 2: Changing the Typical Picture' },
      { id: 'gk6-3', name: 'Unit 3: Portraying People' },
      { id: 'gk6-4', name: 'Unit 4: Paper Crafts' },
      { id: 'gk6-5', name: 'Unit 5: Seals to Prints' },
      { id: 'gk6-6', name: 'Unit 6: Music and your Emotions' },
      { id: 'gk6-7', name: 'Unit 7: Musical Instruments' },
      { id: 'gk6-8', name: 'Unit 8: Taal or Talam and Raga or Ragam' },
      { id: 'gk6-9', name: 'Unit 9: Melodies of Diversity' },
      { id: 'gk6-10', name: 'Unit 10: Songwriting' },
      { id: 'gk6-11', name: 'Unit 11: Music and Society' },
      { id: 'gk6-12', name: 'Unit 12: My Body in Motion' },
      { id: 'gk6-13', name: 'Unit 13: Breaking Barriers with Dance' },
      { id: 'gk6-14', name: 'Unit 14: Harmony in Motion' },
      { id: 'gk6-15', name: 'Unit 15: Dances of Our Land' },
      { id: 'gk6-16', name: 'Unit 16: Emotions Unveiled!' },
      { id: 'gk6-17', name: "Unit 17: Let's Design" },
      { id: 'gk6-18', name: 'Unit 18: In the Company of Theatre' },
      { id: 'gk6-19', name: 'Unit 19: Stories of Shadows and Strings' },
      { id: 'gk6-20', name: 'Unit 20: The Grand Finale' },
      { id: 'gk6-21', name: 'Unit 21: Integration of All Art Forms' },
      { id: 'gk6-22', name: 'Unit 22: Assessment' },
    ],
  },

  /* ── GSEB Mathematics ── */
  {
    id: 'gseb-math-class6',
    board: 'state',
    subject: 'Mathematics',
    title: 'Mathematics',
    coverEmoji: '🔢',
    gradient: 'from-violet-300 to-indigo-400',
    accentColor: '#7c3aed',
    pdfUrl: '/books/ncert/NCERT_Mathematics.pdf',
    chapters: [
      { id: 'gm6-1', name: 'Unit 1: Patterns in Mathematics' },
      { id: 'gm6-2', name: 'Unit 2: Lines and Angles' },
      { id: 'gm6-3', name: 'Unit 3: Number Play' },
      { id: 'gm6-4', name: 'Unit 4: Data Handling and Presentation' },
      { id: 'gm6-5', name: 'Unit 5: Prime Time' },
      { id: 'gm6-6', name: 'Unit 6: Perimeter and Area' },
      { id: 'gm6-7', name: 'Unit 7: Fractions' },
      { id: 'gm6-8', name: 'Unit 8: Playing with Constructions' },
      { id: 'gm6-9', name: 'Unit 9: Symmetry' },
      { id: 'gm6-10', name: 'Unit 10: The Other Side of Zero' },
    ],
  },

  /* ── GSEB Physical Education ── */
  {
    id: 'gseb-pe-class6',
    board: 'state',
    subject: 'Physical Education',
    title: 'Physical Education',
    coverEmoji: '⚽',
    gradient: 'from-rose-300 to-pink-400',
    accentColor: '#f43f5e',
    pdfUrl: '/books/ncert/NCERT_physical education.pdf',
    chapters: [
      { id: 'gpe6-1', name: 'Unit 1: Importance of Physical Education' },
      { id: 'gpe6-2', name: 'Unit 2: Motor Fitness' },
      { id: 'gpe6-3', name: 'Unit 3: Fundamental Skills of Kho-Kho' },
      { id: 'gpe6-4', name: 'Unit 4: Fundamental Skills of Handball' },
      { id: 'gpe6-5', name: 'Unit 5: Yoga' },
    ],
  },

  /* ── GSEB Science ── */
  {
    id: 'gseb-sci-class6',
    board: 'state',
    subject: 'Science',
    title: 'Science',
    coverEmoji: '🔬',
    gradient: 'from-cyan-300 to-teal-400',
    accentColor: '#0d9488',
    pdfUrl: '/books/ncert/NCERT_Science.pdf',
    chapters: [
      { id: 'gs6-1', name: 'Unit 1: The Wonderful World of Science' },
      { id: 'gs6-2', name: 'Unit 2: Diversity in the Living World' },
      { id: 'gs6-3', name: 'Unit 3: Mindful Eating: A Path to a Healthy Body' },
      { id: 'gs6-4', name: 'Unit 4: Exploring Magnets' },
      { id: 'gs6-5', name: 'Unit 5: Measurement of Length and Motion' },
      { id: 'gs6-6', name: 'Unit 6: Materials Around Us' },
      { id: 'gs6-7', name: 'Unit 7: Temperature and its Measurement' },
      { id: 'gs6-8', name: 'Unit 8: A Journey through States of Water' },
      { id: 'gs6-9', name: 'Unit 9: Methods of Separation in Everyday Life' },
      { id: 'gs6-10', name: 'Unit 10: Living Creatures' },
      { id: 'gs6-11', name: "Unit 11: Nature's Treasures" },
      { id: 'gs6-12', name: 'Unit 12: Beyond Earth' },
    ],
  },

  /* ── GSEB Social Science ── */
  {
    id: 'gseb-ss-class6',
    board: 'state',
    subject: 'Social Science',
    title: 'Social Science',
    coverEmoji: '🌍',
    gradient: 'from-yellow-300 to-orange-400',
    accentColor: '#ea580c',
    pdfUrl: '/books/ncert/NCERT_Social Science.pdf',
    chapters: [
      { id: 'gss6-1', name: 'Unit 1: Locating Places on the Earth' },
      { id: 'gss6-2', name: 'Unit 2: Oceans and Continents' },
      { id: 'gss6-3', name: 'Unit 3: Landforms and Life' },
      { id: 'gss6-4', name: 'Unit 4: Timeline and Sources of History' },
      { id: 'gss6-5', name: 'Unit 5: India, That Is Bharat' },
      { id: 'gss6-6', name: 'Unit 6: The Beginnings of Indian Civilisation' },
      { id: 'gss6-7', name: "Unit 7: India's Cultural Roots" },
      { id: 'gss6-8', name: 'Unit 8: Unity in Diversity' },
      { id: 'gss6-9', name: 'Unit 9: Family and Community' },
      { id: 'gss6-10', name: 'Unit 10: Grassroots Democracy 1' },
      { id: 'gss6-11', name: 'Unit 11: Grassroots Democracy 2' },
      { id: 'gss6-12', name: 'Unit 12: Grassroots Democracy 3' },
      { id: 'gss6-13', name: 'Unit 13: The Value of Work' },
      { id: 'gss6-14', name: 'Unit 14: Economic Activities Around Us' },
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
