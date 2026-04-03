/**
 * data/mathsChapters.ts
 * Maths syllabus chapters for AI Buddy - NCERT Maths Mela / Math-Magic Class 5 (Std 5)
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
    id: 'maths_ch1',
    title: 'Chapter 1 - We the Travellers — I 🚶',
    url: 'https://youtu.be/TdhSc4kncxU?si=KXMjMG3JvZazySQ4',
    embedId: extractYTId('https://youtu.be/TdhSc4kncxU?si=KXMjMG3JvZazySQ4'),
  },
  {
    id: 'maths_ch2',
    title: 'Chapter 2 - Fractions 🍕',
    url: 'https://youtu.be/DKanWcCq1B4?si=VF0pTEJ_QK7x7XZJ',
    embedId: extractYTId('https://youtu.be/DKanWcCq1B4?si=VF0pTEJ_QK7x7XZJ'),
  },
  {
    id: 'maths_ch3',
    title: 'Chapter 3 - Angles as Turns ↩️',
    url: 'https://youtu.be/QqOfRsMg8Z4?si=e6-vTurXgD8I00sl',
    embedId: extractYTId('https://youtu.be/QqOfRsMg8Z4?si=e6-vTurXgD8I00sl'),
  },
  {
    id: 'maths_ch4',
    title: 'Chapter 4 - We the Travellers — II 🌍',
    url: 'https://youtu.be/3iH8Ll6SgN4?si=M0l5PVtaiIrpdTOE',
    embedId: extractYTId('https://youtu.be/3iH8Ll6SgN4?si=M0l5PVtaiIrpdTOE'),
  },
  {
    id: 'maths_ch5',
    title: 'Chapter 5 - Far and Near 👀',
    url: 'https://youtu.be/aOVAqXL5VOw?si=3PlobdhNqEiuWakx',
    embedId: extractYTId('https://youtu.be/aOVAqXL5VOw?si=3PlobdhNqEiuWakx'),
  },
  {
    id: 'maths_ch6',
    title: 'Chapter 6 - The Dairy Farm 🐄',
    url: 'https://youtu.be/p73f7vI9nGc?si=iZ6efvB9_9hX19PA',
    embedId: extractYTId('https://youtu.be/p73f7vI9nGc?si=iZ6efvB9_9hX19PA'),
  },
  {
    id: 'maths_ch7',
    title: 'Chapter 7 - Shapes and Patterns 🔷',
    url: 'https://youtu.be/XxBl3Y1sJZY?si=uWRrqdhgLZ8RS_Z0',
    embedId: extractYTId('https://youtu.be/XxBl3Y1sJZY?si=uWRrqdhgLZ8RS_Z0'),
  },
  {
    id: 'maths_ch8',
    title: 'Chapter 8 - Weight and Capacity ⚖️',
    url: 'https://youtu.be/6M8U69U-IWo?si=HU9wh72d5jTy3smi',
    embedId: extractYTId('https://youtu.be/6M8U69U-IWo?si=HU9wh72d5jTy3smi'),
  },
  {
    id: 'maths_ch9',
    title: 'Chapter 9 - Coconut Farm 🥥',
    url: 'https://youtu.be/T1t0lp0sIRk?si=DckAGdUmNf2jfUzT',
    embedId: extractYTId('https://youtu.be/T1t0lp0sIRk?si=DckAGdUmNf2jfUzT'),
  },
  {
    id: 'maths_ch10',
    title: 'Chapter 10 - Symmetrical Designs 🔀',
    url: 'https://youtu.be/fAsiIdZhMAA?si=NtLt9om_UC4EZgbY',
    embedId: extractYTId('https://youtu.be/fAsiIdZhMAA?si=NtLt9om_UC4EZgbY'),
  },
  {
    id: 'maths_ch11',
    title: "Chapter 11 - Grandmother's Quilt 🧵",
    url: 'https://youtu.be/w9ffa3yKLZA?si=Sz_5nhfYCLm-h96j',
    embedId: extractYTId('https://youtu.be/w9ffa3yKLZA?si=Sz_5nhfYCLm-h96j'),
  },
  {
    id: 'maths_ch12',
    title: 'Chapter 12 - Racing Seconds ⏱️',
    url: 'https://youtu.be/tZ-WD9kvr94?si=zHe_Vn0v3wx3MIHQ',
    embedId: extractYTId('https://youtu.be/tZ-WD9kvr94?si=zHe_Vn0v3wx3MIHQ'),
  },
  {
    id: 'maths_ch13',
    title: 'Chapter 13 - Animal Jumps 🐇',
    url: 'https://youtu.be/_myVbbc-twI?si=MMHa8Z8IivyDm1VJ',
    embedId: extractYTId('https://youtu.be/_myVbbc-twI?si=MMHa8Z8IivyDm1VJ'),
  },
  {
    id: 'maths_ch14',
    title: 'Chapter 14 - Maps and Locations 🗺️',
    url: 'https://youtu.be/ThLxNcoeuFE?si=WrPmeuB-m8pKn71N',
    embedId: extractYTId('https://youtu.be/ThLxNcoeuFE?si=WrPmeuB-m8pKn71N'),
  },
  {
    id: 'maths_ch15',
    title: 'Chapter 15 - Data Through Pictures 📊',
    url: 'https://youtu.be/Mj0S7VxuVsE?si=zUsAkITpy9JXgp3_',
    embedId: extractYTId('https://youtu.be/Mj0S7VxuVsE?si=zUsAkITpy9JXgp3_'),
  },
];
