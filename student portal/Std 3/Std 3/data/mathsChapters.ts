/**
 * data/mathsChapters.ts
 * Maths syllabus chapters for AI Buddy - NCERT Math-Magic Class 3 (Std 3)
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
    title: "Chapter 1 - What's in a Name? 🔢",
    url: 'https://youtu.be/qy02gULMTNE?si=oguFGvShiPRc09M4',
    embedId: extractYTId('https://youtu.be/qy02gULMTNE?si=oguFGvShiPRc09M4'),
  },
  {
    id: 'ch2',
    title: 'Chapter 2 - Toy Joy 🧸',
    url: 'https://youtu.be/eEPj6hZQcUk?si=IHKK_jp17Qr3b_m0',
    embedId: extractYTId('https://youtu.be/eEPj6hZQcUk?si=IHKK_jp17Qr3b_m0'),
  },
  {
    id: 'ch3',
    title: 'Chapter 3 - Double Century 💯',
    url: 'https://youtu.be/LRwm5hlCTFI?si=yGN5wVC-KxObb_lX',
    embedId: extractYTId('https://youtu.be/LRwm5hlCTFI?si=yGN5wVC-KxObb_lX'),
  },
  {
    id: 'ch4',
    title: 'Chapter 4 - Vacation With My Nani Maa 👵',
    url: 'https://youtu.be/YzcCN0h7s0M?si=Tob4oyrPWKwCVCt-',
    embedId: extractYTId('https://youtu.be/YzcCN0h7s0M?si=Tob4oyrPWKwCVCt-'),
  },
  {
    id: 'ch5',
    title: 'Chapter 5 - Fun With Shapes 🔷',
    url: 'https://youtu.be/yhwYmqAIxs0?si=0d5IDajg1LPqG1vo',
    embedId: extractYTId('https://youtu.be/yhwYmqAIxs0?si=0d5IDajg1LPqG1vo'),
  },
  {
    id: 'ch6',
    title: 'Chapter 6 - House of Hundreds - 1 🏠',
    url: 'https://youtu.be/jOzEriAmFZs?si=rpxHj2JqSUyRA6wG',
    embedId: extractYTId('https://youtu.be/jOzEriAmFZs?si=rpxHj2JqSUyRA6wG'),
  },
  {
    id: 'ch7',
    title: 'Chapter 7 - Raksha Bandhan 🎀',
    url: 'https://youtu.be/KdF7zk1yfDc?si=V92I1tS5TcLEcF5a',
    embedId: extractYTId('https://youtu.be/KdF7zk1yfDc?si=V92I1tS5TcLEcF5a'),
  },
  {
    id: 'ch8',
    title: 'Chapter 8 - Fair Share ➗',
    url: 'https://youtu.be/BZ2lAou0tRM?si=QU_xpyivj_VdGepQ',
    embedId: extractYTId('https://youtu.be/BZ2lAou0tRM?si=QU_xpyivj_VdGepQ'),
  },
  {
    id: 'ch9',
    title: 'Chapter 9 - House of Hundreds - 2 🏠',
    url: 'https://youtu.be/sjzQCWoGYOc?si=HI71zEwLDieaFMjw',
    embedId: extractYTId('https://youtu.be/sjzQCWoGYOc?si=HI71zEwLDieaFMjw'),
  },
  {
    id: 'ch10',
    title: 'Chapter 10 - Fun at Class Party 🎉',
    url: 'https://youtu.be/XbJxIwzBqRU?si=2OTIx1gwGaR9enkQ',
    embedId: extractYTId('https://youtu.be/XbJxIwzBqRU?si=2OTIx1gwGaR9enkQ'),
  },
  {
    id: 'ch11',
    title: 'Chapter 11 - Filling and Lifting 🫗',
    url: 'https://youtu.be/wQ2EfzYcUe8?si=xxjPaRBgGcVYzWZ_',
    embedId: extractYTId('https://youtu.be/wQ2EfzYcUe8?si=xxjPaRBgGcVYzWZ_'),
  },
  {
    id: 'ch12',
    title: 'Chapter 12 - Give and Take ➕➖',
    url: 'https://youtu.be/-yUNT33A3i4?si=sxi12nBEUqIrwLw9',
    embedId: extractYTId('https://youtu.be/-yUNT33A3i4?si=sxi12nBEUqIrwLw9'),
  },
  {
    id: 'ch13',
    title: 'Chapter 13 - Time Goes On 🕐',
    url: 'https://youtu.be/VzWVGdA8PTQ?si=pBgwK0UIbHagwhVR',
    embedId: extractYTId('https://youtu.be/VzWVGdA8PTQ?si=pBgwK0UIbHagwhVR'),
  },
  {
    id: 'ch14',
    title: 'Chapter 14 - The Surajkund Fair 💰',
    url: 'https://youtu.be/YyzI9NVkoOw?si=4C7qZkjD_-xNP6If',
    embedId: extractYTId('https://youtu.be/YyzI9NVkoOw?si=4C7qZkjD_-xNP6If'),
  },
];
