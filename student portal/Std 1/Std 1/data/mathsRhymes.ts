/**
 * data/mathsRhymes.ts
 * ─────────────────────────────────────────────────────
 * Maths rhyme videos for AI Buddy — Class 1
 * Strictly Maths-only. No cross-subject mixing.
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
    id: 'patterns',
    title: 'Fun with Patterns 🔁',
    url: 'https://youtu.be/uLcn8TDIefM?si=ZWQScCWQKvgzW6o6',
    embedId: extractYTId('https://youtu.be/uLcn8TDIefM?si=ZWQScCWQKvgzW6o6'),
    context: 'Repeating patterns with shapes, colours, and numbers. Finding what comes next in a sequence.',
  },
  {
    id: 'clock_time',
    title: 'Clock & Time Song 🕐',
    url: 'https://youtu.be/r2K1Py9U87I?si=kpqKwKtN692CrZlt',
    embedId: extractYTId('https://youtu.be/r2K1Py9U87I?si=kpqKwKtN692CrZlt'),
    context: 'Reading a clock, telling time, daily routine (morning, afternoon, evening, night). Days of the week.',
  },
];
