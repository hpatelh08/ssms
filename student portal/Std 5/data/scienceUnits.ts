/**
 * data/scienceUnits.ts
 * EVS (Environmental Studies) syllabus units for AI Buddy - NCERT Looking Around Std 5
 * Each chapter has a YouTube video link + embed ID for inline player.
 */

export interface ScienceUnitEntry {
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

export const scienceUnits: ScienceUnitEntry[] = [
  // Unit 1 — Life Around Us
  {
    id: 'evs_ch1',
    title: 'Chapter 1 - Water: The Essence of Life 💧',
    url: 'https://youtu.be/0vvWmjEdTxU',
    embedId: extractYTId('https://youtu.be/0vvWmjEdTxU'),
  },
  {
    id: 'evs_ch2',
    title: 'Chapter 2 - Journey of a River 🌊',
    url: 'https://youtu.be/Yye2_nUWmII',
    embedId: extractYTId('https://youtu.be/Yye2_nUWmII'),
  },
  // Unit 2 — Health and Well-being
  {
    id: 'evs_ch3',
    title: 'Chapter 3 - The Mystery of Food 🥗',
    url: 'https://youtu.be/KFQ3xOYnzpM',
    embedId: extractYTId('https://youtu.be/KFQ3xOYnzpM'),
  },
  {
    id: 'evs_ch4',
    title: 'Chapter 4 - Our School: A Happy Place 🏫',
    url: 'https://youtu.be/SKg0MKLm-gI',
    embedId: extractYTId('https://youtu.be/SKg0MKLm-gI'),
  },
  // Unit 3 — Incredible India
  {
    id: 'evs_ch5',
    title: 'Chapter 5 - Our Vibrant Country 🇮🇳',
    url: 'https://youtu.be/dbniKiwT6dA',
    embedId: extractYTId('https://youtu.be/dbniKiwT6dA'),
  },
  {
    id: 'evs_ch6',
    title: 'Chapter 6 - Some Unique Places 🏛️',
    url: 'https://youtu.be/X7lm8_uGgSI',
    embedId: extractYTId('https://youtu.be/X7lm8_uGgSI'),
  },
  // Unit 4 — Things Around Us
  {
    id: 'evs_ch7',
    title: 'Chapter 7 - Energy: How Things Work 🔌',
    url: 'https://youtu.be/V9tQxm71qQg',
    embedId: extractYTId('https://youtu.be/V9tQxm71qQg'),
  },
  {
    id: 'evs_ch8',
    title: 'Chapter 8 - Clothes: How Things are Made 🧵',
    url: 'https://youtu.be/PjAyz8KB7VY',
    embedId: extractYTId('https://youtu.be/PjAyz8KB7VY'),
  },
  // Unit 5 — Our Amazing Planet
  {
    id: 'evs_ch9',
    title: 'Chapter 9 - Rhythms of Nature 🪐',
    url: 'https://youtu.be/jlgFqdX1KUk',
    embedId: extractYTId('https://youtu.be/jlgFqdX1KUk'),
  },
  {
    id: 'evs_ch10',
    title: 'Chapter 10 - Earth: Our Shared Home 🌍',
    url: 'https://youtu.be/I_A6DrZ--nM',
    embedId: extractYTId('https://youtu.be/I_A6DrZ--nM'),
  },
];
