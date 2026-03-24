/**
 * data/englishUnits.ts
 * English syllabus units for AI Buddy - NCERT English Reader Std 3
 * Each lesson has a YouTube video link + embed ID for inline player.
 */

export interface UnitEntry {
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

export const englishUnits: UnitEntry[] = [
  {
    id: 'unit1_lesson1',
    title: 'Unit 1 - Colours 🎨',
    url: 'https://youtu.be/cs2FqNFsSBA?si=fOSOhAmM4ocoxlcF',
    embedId: extractYTId('https://youtu.be/cs2FqNFsSBA?si=fOSOhAmM4ocoxlcF'),
  },
  {
    id: 'unit1_lesson2',
    title: 'Unit 1 - Badal and Moti 🐕',
    url: 'https://youtu.be/IcVqt7EipJE?si=CGHAQabtg98BziOl',
    embedId: extractYTId('https://youtu.be/IcVqt7EipJE?si=CGHAQabtg98BziOl'),
  },
  {
    id: 'unit1_lesson3',
    title: 'Unit 1 - Best Friends 👭',
    url: 'https://youtu.be/r8Y7nFR4_k8?si=S1k8JUZfK83zD3n1',
    embedId: extractYTId('https://youtu.be/r8Y7nFR4_k8?si=S1k8JUZfK83zD3n1'),
  },
  {
    id: 'unit2_lesson4',
    title: 'Unit 2 - Out in the Garden 🌿',
    url: 'https://youtu.be/CnD24-a0BYs?si=uI9p1qaqz2ZkHba0',
    embedId: extractYTId('https://youtu.be/CnD24-a0BYs?si=uI9p1qaqz2ZkHba0'),
  },
  {
    id: 'unit2_lesson5',
    title: 'Unit 2 - Talking Toys 🧸',
    url: 'https://youtu.be/4fuzKU0Mz2E?si=DZ_4mmz_YokYIouQ',
    embedId: extractYTId('https://youtu.be/4fuzKU0Mz2E?si=DZ_4mmz_YokYIouQ'),
  },
  {
    id: 'unit2_lesson6',
    title: 'Unit 2 - Paper Boats ⛵',
    url: 'https://youtu.be/7En_cHX6i-0?si=I-Euo9Odz-S2PDQp',
    embedId: extractYTId('https://youtu.be/7En_cHX6i-0?si=I-Euo9Odz-S2PDQp'),
  },
  {
    id: 'unit3_lesson7',
    title: 'Unit 3 - The Big Laddoo 🍬',
    url: 'https://youtu.be/GcHLs8iHjIU?si=Ld7yO9ANDJm7U8Jk',
    embedId: extractYTId('https://youtu.be/GcHLs8iHjIU?si=Ld7yO9ANDJm7U8Jk'),
  },
  {
    id: 'unit3_lesson8',
    title: 'Unit 3 - Thank You 🙏',
    url: 'https://youtu.be/R_DY1LJ3OsI?si=y-AiqfYW7FsBfanl',
    embedId: extractYTId('https://youtu.be/R_DY1LJ3OsI?si=y-AiqfYW7FsBfanl'),
  },
  {
    id: 'unit3_lesson9',
    title: "Unit 3 - Madhu's Wish 🌟",
    url: 'https://youtu.be/XdnRDTvvE9w?si=D_exHchgIdhnzEGH',
    embedId: extractYTId('https://youtu.be/XdnRDTvvE9w?si=D_exHchgIdhnzEGH'),
  },
  {
    id: 'unit4_lesson10',
    title: 'Unit 4 - Night 🌙',
    url: 'https://youtu.be/Ig6T7GJ2_rc?si=lXEKwu1vNe8H_FGm',
    embedId: extractYTId('https://youtu.be/Ig6T7GJ2_rc?si=lXEKwu1vNe8H_FGm'),
  },
  {
    id: 'unit4_lesson11',
    title: 'Unit 4 - Chanda Mama Counts the Stars ✨',
    url: 'https://youtu.be/URF-fsYWRRw?si=INHsTY0zCUIUXbuB',
    embedId: extractYTId('https://youtu.be/URF-fsYWRRw?si=INHsTY0zCUIUXbuB'),
  },
  {
    id: 'unit4_lesson12',
    title: 'Unit 4 - Chandrayaan 🚀',
    url: 'https://youtu.be/f4Lx1QdK0Wc?si=AxKN6igFt83iV0-z',
    embedId: extractYTId('https://youtu.be/f4Lx1QdK0Wc?si=AxKN6igFt83iV0-z'),
  },
];
