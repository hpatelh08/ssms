/**
 * data/gujaratiRhymes.ts
 * Gujarati rhyme / song videos for AI Buddy - Class 3
 * Aligned with GSEB Gujarati Class 2 poems and traditional rhymes.
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

export const gujaratiRhymes: RhymeEntry[] = [
  {
    id: 'chandalo_mama',
    title: 'ચંદલો મામા (Chandalo Mama) 🌙',
    url: 'https://youtu.be/LBiJiymeswc?si=Tx7DLEr2K1hj4JkN',
    embedId: extractYTId('https://youtu.be/LBiJiymeswc?si=Tx7DLEr2K1hj4JkN'),
    context: 'Traditional Gujarati rhyme about moon (Chandlo Mama). Asking for butter and milk. Rhyming words, cultural elements for Class 3.',
  },
  {
    id: 'haathi_raja',
    title: 'હાથી રાજા (Haathi Raja) 🐘',
    url: 'https://youtu.be/90szgBgq1sA?si=pTEH-3Jrk8yAInAP',
    embedId: extractYTId('https://youtu.be/90szgBgq1sA?si=pTEH-3Jrk8yAInAP'),
    context: 'Popular elephant rhyme. Describing elephant\'s features - long trunk, big ears. Animal vocabulary in Gujarati for Class 3.',
  },
  {
    id: 'dholi_ghodo',
    title: 'ધોળી ઘોડો (Dholi Ghodo) 🐴',
    url: 'https://youtu.be/Qi3pK8lZYwk?si=-xTLKTGhjtpDfKaK',
    embedId: extractYTId('https://youtu.be/Qi3pK8lZYwk?si=-xTLKTGhjtpDfKaK'),
    context: 'White horse rhyme - riding to village and city. Action words, travel vocabulary, rhythmic patterns for Class 3.',
  },
  {
    id: 'chakli_chakli',
    title: 'ચકલી ચકલી (Chakli Chakli) 🐦',
    url: 'https://youtu.be/JN9n5t-RvmU?si=8usDxiUsgflGlsyB',
    embedId: extractYTId('https://youtu.be/JN9n5t-RvmU?si=8usDxiUsgflGlsyB'),
    context: 'Sparrow rhyme - asking what it eats. Grains names (jowar, bajri, wheat). Bird vocabulary for Class 3.',
  },
  {
    id: 'aav_varsad',
    title: 'આવ વરસાદ (Aav Varsad) ☔',
    url: 'https://youtu.be/jb0FD6hmDds?si=YYLJxGiWArIT4rFI',
    embedId: extractYTId('https://youtu.be/jb0FD6hmDds?si=YYLJxGiWArIT4rFI'),
    context: 'Rain invitation rhyme. Calling rain to fill ponds, water fields. Monsoon vocabulary in Gujarati for Class 3.',
  },
  {
    id: 'morli_morli',
    title: 'મોરલી મોરલી (Morli Morli) 🦚',
    url: 'https://youtu.be/nyY0xIz6u8Y?si=JXxGrVHdHFOvV2R2',
    embedId: extractYTId('https://youtu.be/nyY0xIz6u8Y?si=JXxGrVHdHFOvV2R2'),
    context: 'Peacock rhyme - describing peacock\'s dance in rain. Colors, feathers, rain joy. Gujarat state bird for Class 3.',
  },
];
