/**
 * data/videoConfig.ts
 * ─────────────────────────────────────────────────────
 * Video learning data for AI Buddy — English & Maths.
 * Each video has a YouTube URL, title, and topic context
 * for RAG-grounded AI queries.
 */

export type VideoSubject = 'English' | 'Maths';

export interface VideoEntry {
  id: string;
  title: string;
  url: string;
  /** Extracted YouTube video ID for embedding */
  embedId: string;
  /** Context hint for AI grounding */
  context: string;
}

/* ── Helper to extract YouTube embed ID ────────── */

function extractYTId(url: string): string {
  // Handle youtu.be/ID and youtube.com/watch?v=ID
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  const long = url.match(/[?&]v=([^?&]+)/);
  if (long) return long[1];
  return '';
}

function v(id: string, title: string, url: string, context: string): VideoEntry {
  return { id, title, url, embedId: extractYTId(url), context };
}

/* ═══════════════════════════════════════════════════
   ENGLISH VIDEOS
   ═══════════════════════════════════════════════════ */

export const englishVideos: VideoEntry[] = [
  v('english_quiz', 'English Quiz', 'https://youtu.be/ps59tnyzgV8?si=n5Ks49cZZM1_pZkT',
    'Interactive English quiz for Class 1 covering vocabulary, sounds, and basic sentence skills.'),
  v('opposite_words', 'Opposite Words', 'https://youtu.be/tCpL1ExEFAg?si=HKll-I5hqP4EtkZW',
    'Learning opposite words (antonyms) like big-small, hot-cold, happy-sad for Class 1 English.'),
  v('four_letter', 'Four Letter Words', 'https://youtu.be/jYzL8LTQXhU?si=_G_eju_ce8dOhqqP',
    'Reading and spelling four-letter words: cake, bike, kite, etc. Phonics and spelling practice.'),
  v('week_names', 'Week Names', 'https://youtu.be/hcOdWqzo_qQ?si=suGrNvmcwo7fE6c4',
    'Days of the week: Monday through Sunday. Spelling, sequencing, and daily routine vocabulary.'),
  v('twinkle', 'Twinkle Twinkle', 'https://youtu.be/Yj18L9KNUCE?si=AZumkWfhCg7Ok6Ug',
    'Nursery rhyme Twinkle Twinkle Little Star with lyrics, singing, and rhyming word practice.'),
  v('a_to_z', 'A to Z Alphabet', 'https://youtu.be/hq3yfQnllfQ?si=ojk4petB0IowIwy2',
    'Complete English alphabet A to Z with sounds, pictures, and letter recognition.'),
  v('animals', 'Animals', 'https://youtu.be/4jeHK_9NiXI?si=d0GC0bIsP2KdRi1k',
    'Animal names, sounds, and habitats. Domestic and wild animals vocabulary for Class 1.'),
  v('body_parts', 'Body Parts', 'https://youtu.be/SUt8q0EKbms?si=WScMHdlv6uO0vP45',
    'Human body parts: head, shoulders, knees, toes. Vocabulary and action words.'),
  v('simple_sentences', 'Simple Sentences', 'https://youtu.be/MCQoWGAmj7w?si=klNiT4MI3iIJfxiB',
    'Forming simple sentences for Class 1: subject + verb + object. Reading and writing basics.'),
  v('fruits_vegetables', 'Fruits & Vegetables', 'https://youtu.be/UcGm_PM2IwY?si=v0CtGW4NDlUGqaPH',
    'Names of common fruits and vegetables. Colours, shapes, and healthy eating vocabulary.'),
];

/* ═══════════════════════════════════════════════════
   MATHS VIDEOS
   ═══════════════════════════════════════════════════ */

export const mathsVideos: VideoEntry[] = [
  v('numbers_1_100', 'Numbers 1 to 100', 'https://youtu.be/GFcF-8IxtP4?si=xWe__hsDVAOp81a-',
    'Counting numbers from 1 to 100. Number names, place value introduction, skip counting.'),
  v('addition', 'Addition', 'https://youtu.be/mjlsSYLLOSE?si=5hmlL3hnxuO-oDvI',
    'Addition for Class 1: adding single-digit numbers, the plus sign, simple word problems.'),
  v('shapes', 'Shapes', 'https://youtu.be/NhHaV4HDgOg?si=mGlhL3hY4an9AeMY',
    'Basic shapes: circle, square, triangle, rectangle. Identifying shapes in everyday objects.'),
  v('patterns', 'Patterns', 'https://youtu.be/uLcn8TDIefM?si=ZWQScCWQKvgzW6o6',
    'Repeating patterns with shapes, colours, and numbers. Finding what comes next in a sequence.'),
  v('clock_time', 'Clock & Time', 'https://youtu.be/r2K1Py9U87I?si=kpqKwKtN692CrZlt',
    'Reading a clock, telling time, daily routine (morning, afternoon, evening, night). Days of the week.'),
  v('subtraction', 'Subtraction', 'https://youtu.be/rqiu_xcvSk4?si=L_ythpAtyqlgpUn-',
    'Subtraction for Class 1: taking away, the minus sign, simple word problems, counting back.'),
];

/* ═══════════════════════════════════════════════════
   COMBINED
   ═══════════════════════════════════════════════════ */

export const VIDEO_DATA: Record<VideoSubject, VideoEntry[]> = {
  English: englishVideos,
  Maths: mathsVideos,
};

export const ALL_VIDEOS: VideoEntry[] = [...englishVideos, ...mathsVideos];
