/**
 * data/englishUnits.ts
 * English syllabus units for AI Buddy - NCERT Mridang Class 2
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
    title: 'Unit 1 - My Bicycle 🚲',
    url: 'https://youtu.be/rNvuRJ2cT6I?si=c9BqBBjulYzF0ixk',
    embedId: extractYTId('https://youtu.be/rNvuRJ2cT6I?si=c9BqBBjulYzF0ixk'),
  },
  {
    id: 'unit1_lesson2',
    title: 'Unit 1 - Picture Reading 📖',
    url: 'https://youtu.be/S5BRqtzgLDo?si=eIQjm-IVyi8CdyEE',
    embedId: extractYTId('https://youtu.be/S5BRqtzgLDo?si=eIQjm-IVyi8CdyEE'),
  },
  {
    id: 'unit2_lesson3',
    title: 'Unit 2 - It is Fun 🎉',
    url: 'https://youtu.be/0DcF6VL73Fk?si=5lZqVny_q0bOst4o',
    embedId: extractYTId('https://youtu.be/0DcF6VL73Fk?si=5lZqVny_q0bOst4o'),
  },
  {
    id: 'unit2_lesson4',
    title: 'Unit 2 - Seeing without Seeing 👁️',
    url: 'https://youtu.be/yfSO5IWGr2U?si=Gml8_AeP-Vn6_nYP',
    embedId: extractYTId('https://youtu.be/yfSO5IWGr2U?si=Gml8_AeP-Vn6_nYP'),
  },
  {
    id: 'unit3_lesson5',
    title: 'Unit 3 - Come Back Soon 👋',
    url: 'https://youtu.be/VoU6yrkqBRQ?si=UCT4pq_OfAfDU3Ze',
    embedId: extractYTId('https://youtu.be/VoU6yrkqBRQ?si=UCT4pq_OfAfDU3Ze'),
  },
  {
    id: 'unit3_lesson6',
    title: 'Unit 3 - Between Home and School 🏠🏫',
    url: 'https://youtu.be/AaU-D6n_Ytc?si=cGyewaxLagZ1bw3o',
    embedId: extractYTId('https://youtu.be/AaU-D6n_Ytc?si=cGyewaxLagZ1bw3o'),
  },
  {
    id: 'unit3_lesson7',
    title: 'Unit 3 - This is My Town 🏘️',
    url: 'https://youtu.be/OfpRtJh4jm0?si=MBqpqVPRM2qXzEiM',
    embedId: extractYTId('https://youtu.be/OfpRtJh4jm0?si=MBqpqVPRM2qXzEiM'),
  },
  {
    id: 'unit4_lesson8',
    title: 'Unit 4 - A Show of Clouds ☁️',
    url: 'https://youtu.be/Rakggfas4FM?si=5trjwhTymOndm6G-',
    embedId: extractYTId('https://youtu.be/Rakggfas4FM?si=5trjwhTymOndm6G-'),
  },
  {
    id: 'unit4_lesson9',
    title: 'Unit 4 - My Name 📛',
    url: 'https://youtu.be/RN_i3WIPuDE?si=kci5cuxZOxSLvMAB',
    embedId: extractYTId('https://youtu.be/RN_i3WIPuDE?si=kci5cuxZOxSLvMAB'),
  },
  {
    id: 'unit4_lesson10',
    title: 'Unit 4 - The Crow 🐦‍⬛',
    url: 'https://www.youtube.com/watch?v=Ykr_sQD_z-c',
    embedId: extractYTId('https://www.youtube.com/watch?v=Ykr_sQD_z-c'),
  },
  {
    id: 'unit4_lesson11',
    title: 'Unit 4 - The Smart Monkey 🐵',
    url: 'https://www.youtube.com/watch?v=-lovmrXI5XQ',
    embedId: extractYTId('https://www.youtube.com/watch?v=-lovmrXI5XQ'),
  },
  {
    id: 'unit5_lesson12',
    title: 'Unit 5 - Little Drops of Water 💧',
    url: 'https://www.youtube.com/watch?v=lttP-X5ADMg',
    embedId: extractYTId('https://www.youtube.com/watch?v=lttP-X5ADMg'),
  },
  {
    id: 'unit5_lesson13',
    title: 'Unit 5 - We are all Indians 🇮🇳',
    url: 'https://youtu.be/fAsGPdaltQY?si=-NWgo2_5xDBE3rxo',
    embedId: extractYTId('https://youtu.be/fAsGPdaltQY?si=-NWgo2_5xDBE3rxo'),
  },
];
