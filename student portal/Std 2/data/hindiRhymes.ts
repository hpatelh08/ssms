/**
 * data/hindiRhymes.ts
 * Hindi rhyme / song videos for AI Buddy - Class 3
 * Aligned with NCERT Sarangi Class 2 poems.
 */

export interface RhymeEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
  context: string;
}

function extractYTId(url: string): string {
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  const long = url.match(/[?&]v=([^?&]+)/);
  if (long) return long[1];
  return '';
}

export const hindiRhymes: RhymeEntry[] = [
  {
    id: 'kakkoo',
    title: 'कक्कू (Kakkoo) 🐦',
    url: 'https://youtu.be/k83ME73sPUw?si=aUl8ka3x9i62eakj',
    embedId: extractYTId('https://youtu.be/k83ME73sPUw?si=aUl8ka3x9i62eakj'),
    context: 'NCERT Class 2 Hindi poem about a boy named Kakkoo who loves birds. Nature connection, freedom themes for Class 2.',
  },
  {
    id: 'shekhibaaz_makhi',
    title: 'शेखीबाज़ मक्खी (Shekhibaaz Makhi) 🪰',
    url: 'https://youtu.be/O137OVkImZ0?si=HOWeFGfKpVfPPqdW',
    embedId: extractYTId('https://youtu.be/O137OVkImZ0?si=HOWeFGfKpVfPPqdW'),
    context: 'NCERT poem about a boastful fly. Moral story - don\'t show off. Animal characteristics, humility lesson for Class 3.',
  },
  {
    id: 'chaand_wali_amma',
    title: 'चाँद वाली अम्मा (Chaand Wali Amma) 🌙',
    url: 'https://youtu.be/QZMT2Uv25Q4?si=VmtCgEAq0Gg1gOK2',
    embedId: extractYTId('https://youtu.be/QZMT2Uv25Q4?si=VmtCgEAq0Gg1gOK2'),
    context: 'NCERT poem about an old woman who talks to the moon. Imagination, care, love for Class 3.',
  },
  {
    id: 'man_karta_hai',
    title: 'मन करता है (Man Karta Hai) 💭',
    url: 'https://youtu.be/36k_LFJzKQU?si=mcbAyAUF20RwqVgm',
    embedId: extractYTId('https://youtu.be/36k_LFJzKQU?si=mcbAyAUF20RwqVgm'),
    context: 'NCERT poem about wishes and imagination. What children want to become - bird, butterfly, flower for Class 3.',
  },
  {
    id: 'bahadur_bitto',
    title: 'बहादुर बित्तो (Bahadur Bitto) 🐭',
    url: 'https://youtu.be/GtJ35x8MjiQ?si=7cAbNOTJnX-oeTHw',
    embedId: extractYTId('https://youtu.be/GtJ35x8MjiQ?si=7cAbNOTJnX-oeTHw'),
    context: 'NCERT poem about a brave little mouse. Courage, size doesn\'t matter, problem-solving for Class 3.',
  },
  {
    id: 'tipatipva',
    title: 'टिपतिपवा (Tipatipva) 🌧️',
    url: 'https://youtu.be/6gKJY1BeqAA?si=DvHx-LIlWdVXwnRF',
    embedId: extractYTId('https://youtu.be/6gKJY1BeqAA?si=DvHx-LIlWdVXwnRF'),
    context: 'NCERT poem about raindrops. Water cycle, monsoon, nature\'s beauty. Onomatopoeia (tip-tip sounds) for Class 3.',
  },
];
