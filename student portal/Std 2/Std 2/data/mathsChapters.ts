/**
 * data/mathsChapters.ts
 * Maths syllabus chapters for AI Buddy - NCERT Joyful Mathematics Class 2 (Std 2)
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
    title: 'Chapter 1 - A Day at the Beach 🏖️',
    url: 'https://youtu.be/njXtTBCG4Vk',
    embedId: extractYTId('https://youtu.be/njXtTBCG4Vk'),
  },
  {
    id: 'ch2',
    title: 'Chapter 2 - Shapes Around Us 🔷',
    url: 'https://youtu.be/74JhwbsVXQ8',
    embedId: extractYTId('https://youtu.be/74JhwbsVXQ8'),
  },
  {
    id: 'ch3',
    title: 'Chapter 3 - Fun with Numbers 🔢',
    url: 'https://youtu.be/JBSpqULMw4s',
    embedId: extractYTId('https://youtu.be/JBSpqULMw4s'),
  },
  {
    id: 'ch4',
    title: 'Chapter 4 - Shadow Story 🌑',
    url: 'https://youtu.be/k9jSiepDZLM',
    embedId: extractYTId('https://youtu.be/k9jSiepDZLM'),
  },
  {
    id: 'ch5',
    title: 'Chapter 5 - Playing with Lines 📏',
    url: 'https://youtu.be/_DSPw0SYE9c',
    embedId: extractYTId('https://youtu.be/_DSPw0SYE9c'),
  },
  {
    id: 'ch6',
    title: 'Chapter 6 - Decoration for Festival 🎉',
    url: 'https://youtu.be/b8-SogImN-Q',
    embedId: extractYTId('https://youtu.be/b8-SogImN-Q'),
  },
  {
    id: 'ch7',
    title: 'Chapter 7 - Rani\'s Gift 🎁',
    url: 'https://www.youtube.com/watch?v=CIb7QImNQi4',
    embedId: extractYTId('https://www.youtube.com/watch?v=CIb7QImNQi4'),
  },
  {
    id: 'ch8',
    title: 'Chapter 8 - Grouping and Sharing 👥',
    url: 'https://youtu.be/-1MKHv_i0Mw',
    embedId: extractYTId('https://youtu.be/-1MKHv_i0Mw'),
  },
  {
    id: 'ch9',
    title: 'Chapter 9 - Which Season is It? ☀️',
    url: 'https://youtu.be/7gfog5Q1_P4',
    embedId: extractYTId('https://youtu.be/7gfog5Q1_P4'),
  },
  {
    id: 'ch10',
    title: 'Chapter 10 - Fun at the Fair 🎪',
    url: 'https://youtu.be/6rDtEEXOoK4',
    embedId: extractYTId('https://youtu.be/6rDtEEXOoK4'),
  },
  {
    id: 'ch11',
    title: 'Chapter 11 - Data Handling 📊',
    url: 'https://youtu.be/XyWbmIsvLzU',
    embedId: extractYTId('https://youtu.be/XyWbmIsvLzU'),
  },
  {
    id: 'ch12',
    title: 'Chapter 12 - Puzzles 🧩',
    url: 'https://youtu.be/afD8vQUdMlk',
    embedId: extractYTId('https://youtu.be/afD8vQUdMlk'),
  },
];
