/**
 * data/englishRhymes.ts
 * ─────────────────────────────────────────────────────
 * English rhyme videos for AI Buddy — Class 1
 * Strictly English-only. No cross-subject mixing.
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

export const englishRhymes: RhymeEntry[] = [
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star ⭐',
    url: 'https://youtu.be/Yj18L9KNUCE?si=AZumkWfhCg7Ok6Ug',
    embedId: extractYTId('https://youtu.be/Yj18L9KNUCE?si=AZumkWfhCg7Ok6Ug'),
    context: 'Nursery rhyme Twinkle Twinkle Little Star with lyrics, singing, and rhyming word practice.',
  },
  {
    id: 'week_names',
    title: 'Days of the Week Song 📅',
    url: 'https://youtu.be/hcOdWqzo_qQ?si=suGrNvmcwo7fE6c4',
    embedId: extractYTId('https://youtu.be/hcOdWqzo_qQ?si=suGrNvmcwo7fE6c4'),
    context: 'Days of the week: Monday through Sunday. Spelling, sequencing, and daily routine vocabulary.',
  },
  {
    id: 'a_to_z',
    title: 'A to Z Alphabet Song 🔤',
    url: 'https://youtu.be/hq3yfQnllfQ?si=ojk4petB0IowIwy2',
    embedId: extractYTId('https://youtu.be/hq3yfQnllfQ?si=ojk4petB0IowIwy2'),
    context: 'Complete English alphabet A to Z with sounds, pictures, and letter recognition.',
  },
];
