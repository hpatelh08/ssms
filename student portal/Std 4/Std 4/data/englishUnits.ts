/**
 * data/englishUnits.ts
 * ─────────────────────────────────────────────────────
 * English syllabus units for AI Buddy — Std 4
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

function createEntry(id: string, title: string, url: string): UnitEntry {
  return { id, title, url, embedId: extractYTId(url) };
}

export const englishUnits: UnitEntry[] = [
  createEntry('en_u1_1', '1. Together We Can', 'https://youtu.be/6iYVza7cLow?si=JHZJzoxIaHoOkbVe'),
  createEntry('en_u1_2', '2. The Tinkling Bells', 'https://youtu.be/klQJ9WNLX98?si=bUma2LGsvPS9pgyi'),
  createEntry('en_u1_3', '3. Be Smart, Be Safe', 'https://youtu.be/Dk54IXQL1hY?si=ML_PWQ6v0ZGEIReK'),
  createEntry('en_u2_4', '4. One Thing at a Time', 'https://youtu.be/wIux1z5wEZQ?si=o6pPSVpq65wvSz4Q'),
  createEntry('en_u2_5', '5. The Old Stag', 'https://youtu.be/MfSYsrHE16o?si=y5mLgRuxnGwLUf_o'),
  createEntry('en_u2_6', '6. Braille', 'https://youtu.be/MhLUflpDFVI?si=k6ZrMafEciNcY1-d'),
  createEntry('en_u3_7', '7. Fit Body, Fit Mind, Fit Nation', 'https://youtu.be/xZcFAnRQx7A?si=UGcs9oNHgSTmCmZ2'),
  createEntry('en_u3_8', '8. The Lagori Champions', 'https://youtu.be/Hnw2MHWnEcA?si=-Yo4Ote20ggOBcIK'),
  createEntry('en_u3_9', '9. Hekko', 'https://youtu.be/iu4X-pt9n5A?si=5fptnJ5pFLYDAdRb'),
  createEntry('en_u4_10', '10. The Swing', 'https://youtu.be/JoYi6vuQjf0?si=m3kjFRWu9cGUYrKJ'),
  createEntry('en_u4_11', '11. A Journey to the Magical Mountains', 'https://youtu.be/2Wzup8Cq3X0?si=DTtvMpMNohPENzA9'),
  createEntry('en_u4_12', '12. Maheshwar', 'https://youtu.be/mD7ssxOHW8Q?si=xQyAYF94ybAS46e4'),
];
