/**
 * data/mathsChapters.ts
 * ─────────────────────────────────────────────────────
 * Maths syllabus chapters for AI Buddy — Class 1
 * Each chapter has a YouTube video link + embed ID for inline player.
 */

export interface MathsChapterEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
}

function extractYTId(url: string): string {
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  const long = url.match(/[?&]v=([^?&]+)/);
  if (long) return long[1];
  return '';
}

export const mathsChapters: MathsChapterEntry[] = [
  {
    id: 'ch1',
    title: 'Chapter 1 - Position Words 📍',
    url: 'https://youtu.be/_VK-kXkXTBc?si=1a7zgAu3B0pFPr1-',
    embedId: extractYTId('https://youtu.be/_VK-kXkXTBc?si=1a7zgAu3B0pFPr1-'),
  },
  {
    id: 'ch2',
    title: 'Chapter 2 - Shapes 🔷',
    url: 'https://youtu.be/jlzX8jt0Now?si=a9OXgkOMkfSyWGG9',
    embedId: extractYTId('https://youtu.be/jlzX8jt0Now?si=a9OXgkOMkfSyWGG9'),
  },
  {
    id: 'ch3',
    title: 'Chapter 3 - Numbers 1 to 9 🔢',
    url: 'https://youtu.be/K1CzqkbGI2w?si=BNHg_nodnmGTZ5If',
    embedId: extractYTId('https://youtu.be/K1CzqkbGI2w?si=BNHg_nodnmGTZ5If'),
  },
  {
    id: 'ch4',
    title: 'Chapter 4 - Numbers 10 to 20 🔢',
    url: 'https://youtu.be/U2evJySE4wM?si=EBH_tqLWv1DbYBtg',
    embedId: extractYTId('https://youtu.be/U2evJySE4wM?si=EBH_tqLWv1DbYBtg'),
  },
  {
    id: 'ch5',
    title: 'Chapter 5 - Addition ➕',
    url: 'https://youtu.be/VScM8Z8Jls0?si=L4_aSkDdokXcz6RM',
    embedId: extractYTId('https://youtu.be/VScM8Z8Jls0?si=L4_aSkDdokXcz6RM'),
  },
  {
    id: 'ch6',
    title: 'Chapter 6 - Subtraction ➖',
    url: 'https://youtu.be/YLPbduEc4sA?si=UdrTddE9Ek-tYXDt',
    embedId: extractYTId('https://youtu.be/YLPbduEc4sA?si=UdrTddE9Ek-tYXDt'),
  },
  {
    id: 'ch7',
    title: 'Chapter 7 - Heavy and Light ⚖️',
    url: 'https://youtu.be/qUOQrXmfwDM?si=qO-EF73zaYi7q7Iq',
    embedId: extractYTId('https://youtu.be/qUOQrXmfwDM?si=qO-EF73zaYi7q7Iq'),
  },
  {
    id: 'ch8',
    title: 'Chapter 8 - Big Numbers 21–99 🔢',
    url: 'https://youtu.be/0ZhwYYZS9bE?si=kNhb4GW5qqC6zFQR',
    embedId: extractYTId('https://youtu.be/0ZhwYYZS9bE?si=kNhb4GW5qqC6zFQR'),
  },
  {
    id: 'ch9',
    title: 'Chapter 9 - Counting in 5s & 10s 🔟',
    url: 'https://youtu.be/EemjeA2Djjw?si=0VkPoIbuqOwU3ce-',
    embedId: extractYTId('https://youtu.be/EemjeA2Djjw?si=0VkPoIbuqOwU3ce-'),
  },
];
