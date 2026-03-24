/**
 * data/mathsRhymes.ts
 * Maths rhyme / song videos for AI Buddy - Class 3
 * Aligned with NCERT Joyful Mathematics Class 2 topics.
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

export const mathsRhymes: RhymeEntry[] = [
  {
    id: 'multiplication_tables',
    title: 'Multiplication Tables Song 2-10 ✖️',
    url: 'https://youtu.be/oPINS56lDes?si=1K_XA9cARN-MCVM3',
    embedId: extractYTId('https://youtu.be/oPINS56lDes?si=1K_XA9cARN-MCVM3'),
    context: 'Learning tables 2-10 with fun rhythms. Skip counting, multiplication facts, mental math for Class 3.',
  },
  {
    id: 'measurement_song',
    title: 'Measurement Song 📏',
    url: 'https://youtu.be/ypVQDZL18SQ?si=ganDTAdcvlx1iany',
    embedId: extractYTId('https://youtu.be/ypVQDZL18SQ?si=ganDTAdcvlx1iany'),
    context: 'Length, mass, capacity - centimetres, metres, kilograms, litres. Comparing and estimating for Class 3.',
  },
  {
    id: 'fraction_fun',
    title: 'Fraction Fun Song 🍰',
    url: 'https://youtu.be/bzz_drUsu6I?si=0uNGZAQ9qJAB2wbV',
    embedId: extractYTId('https://youtu.be/bzz_drUsu6I?si=0uNGZAQ9qJAB2wbV'),
    context: 'Halves, quarters, thirds, eighths. Equal sharing, parts of a whole, pizza examples for Class 3.',
  },
  {
    id: 'money_matters',
    title: 'Money Matters Song 💰',
    url: 'https://youtu.be/YxRg6n93nRk?si=0KdikS6G-ifvG9wT',
    embedId: extractYTId('https://youtu.be/YxRg6n93nRk?si=0KdikS6G-ifvG9wT'),
    context: 'Indian currency - rupees and paise. Addition, subtraction, making change, shopping problems for Class 3.',
  },
  {
    id: 'geometry_shapes',
    title: 'Geometry Shapes Song 🔷',
    url: 'https://youtu.be/VdzzE20zQC8?si=TGDBYQb09SPlB8oa',
    embedId: extractYTId('https://youtu.be/VdzzE20zQC8?si=TGDBYQb09SPlB8oa'),
    context: '2D and 3D shapes - edges, corners, faces. Cube, cuboid, sphere, cylinder. Properties of shapes for Class 3.',
  },
  {
    id: 'data_handling',
    title: 'Data Handling Song 📊',
    url: 'https://youtu.be/cWBL5PxiYcs?si=Stpaau-foQ0-eVHg',
    embedId: extractYTId('https://youtu.be/cWBL5PxiYcs?si=Stpaau-foQ0-eVHg'),
    context: 'Tally marks, pictographs, bar graphs. Collecting and organizing data for Class 3.',
  },
];
