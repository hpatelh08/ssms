/**
 * data/englishUnits.ts
 * ─────────────────────────────────────────────────────
 * English syllabus units for AI Buddy — Class 1
 * Each unit has a YouTube video link + embed ID for inline player.
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
    id: 'unit1',
    title: 'Unit 1 - Me and My Body 🧍',
    url: 'https://youtu.be/1AM7KuFi2mo?si=U_YAzplyFhguM-ZQ&t=3',
    embedId: extractYTId('https://youtu.be/1AM7KuFi2mo?si=U_YAzplyFhguM-ZQ&t=3'),
  },
  {
    id: 'unit2',
    title: 'Unit 2 - My Family 👨‍👩‍👧',
    url: 'https://youtu.be/mvv_5PU00e0?si=ZDoMwvnja_JefyJ6&t=8s',
    embedId: extractYTId('https://youtu.be/mvv_5PU00e0?si=ZDoMwvnja_JefyJ6&t=8s'),
  },
  {
    id: 'unit3',
    title: 'Unit 3 - Animals Around Me 🐄',
    url: 'https://youtu.be/2sn9HLpzx9E?si=WJ865dbB8GJnv6FC',
    embedId: extractYTId('https://youtu.be/2sn9HLpzx9E?si=WJ865dbB8GJnv6FC'),
  },
  {
    id: 'unit4',
    title: 'Unit 4 - Food We Eat 🍎',
    url: 'https://youtu.be/uzNj2fz3fKQ?si=4TJsfl5yt9D6ipIe&t=10s',
    embedId: extractYTId('https://youtu.be/uzNj2fz3fKQ?si=4TJsfl5yt9D6ipIe&t=10s'),
  },
  {
    id: 'unit5',
    title: 'Unit 5 - Seasons and Weather 🌦️',
    url: 'https://youtu.be/LBlzDpAixEs?si=MHuSB4gVkNLw23UU&t=5s',
    embedId: extractYTId('https://youtu.be/LBlzDpAixEs?si=MHuSB4gVkNLw23UU&t=5s'),
  },
  {
    id: 'unit6',
    title: 'Unit 6 - Transport and Travel 🚌',
    url: 'https://youtu.be/BZf6frPNrhg?si=Gc6NHl-t5VwBqm7x&t=7',
    embedId: extractYTId('https://youtu.be/BZf6frPNrhg?si=Gc6NHl-t5VwBqm7x&t=7'),
  },
  {
    id: 'unit7',
    title: 'Unit 7 - Alphabet & Letters 🔤',
    url: 'https://youtu.be/C7oebqj3PCY?si=8j32JdyeHo9GfcNh&t=7',
    embedId: extractYTId('https://youtu.be/C7oebqj3PCY?si=8j32JdyeHo9GfcNh&t=7'),
  },
  {
    id: 'unit8',
    title: 'Unit 8 - Rhymes and Stories 🎵',
    url: 'https://youtu.be/hcOdWqzo_qQ?si=SAy21QyvYfsQVoKS',
    embedId: extractYTId('https://youtu.be/hcOdWqzo_qQ?si=SAy21QyvYfsQVoKS'),
  },
  {
    id: 'unit9',
    title: 'Unit 9 - Good Habits ✅',
    url: 'https://youtu.be/bN36nh-2tuI?si=t1cdqO1FnuRpc2_c',
    embedId: extractYTId('https://youtu.be/bN36nh-2tuI?si=t1cdqO1FnuRpc2_c'),
  },
];
