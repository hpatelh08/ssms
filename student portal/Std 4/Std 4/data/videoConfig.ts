/**
 * data/videoConfig.ts
 * ─────────────────────────────────────────────────────
 * Video learning data for AI Buddy — English & Maths.
 * Each video has a YouTube URL, title, and topic context
 * for RAG-grounded AI queries.
 */

export type VideoSubject = 'English' | 'Maths' | 'Hindi' | 'Gujarati' | 'Science';

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
    'Interactive English quiz for Class 4 covering vocabulary, sounds, and basic sentence skills.'),
  v('opposite_words', 'Opposite Words', 'https://youtu.be/tCpL1ExEFAg?si=HKll-I5hqP4EtkZW',
    'Learning opposite words (antonyms) like big-small, hot-cold, happy-sad for Class 4 English.'),
  v('four_letter', 'Four Letter Words', 'https://youtu.be/jYzL8LTQXhU?si=_G_eju_ce8dOhqqP',
    'Reading and spelling four-letter words: cake, bike, kite, etc. Phonics and spelling practice.'),
  v('week_names', 'Week Names', 'https://youtu.be/hcOdWqzo_qQ?si=suGrNvmcwo7fE6c4',
    'Days of the week: Monday through Sunday. Spelling, sequencing, and daily routine vocabulary.'),
  v('twinkle', 'Twinkle Twinkle', 'https://youtu.be/Yj18L9KNUCE?si=AZumkWfhCg7Ok6Ug',
    'Nursery rhyme Twinkle Twinkle Little Star with lyrics, singing, and rhyming word practice.'),
  v('a_to_z', 'A to Z Alphabet', 'https://youtu.be/hq3yfQnllfQ?si=ojk4petB0IowIwy2',
    'Complete English alphabet A to Z with sounds, pictures, and letter recognition.'),
  v('animals', 'Animals', 'https://youtu.be/4jeHK_9NiXI?si=d0GC0bIsP2KdRi1k',
    'Animal names, sounds, and habitats. Domestic and wild animals vocabulary for Class 4.'),
  v('body_parts', 'Body Parts', 'https://youtu.be/SUt8q0EKbms?si=WScMHdlv6uO0vP45',
    'Human body parts: head, shoulders, knees, toes. Vocabulary and action words.'),
  v('simple_sentences', 'Simple Sentences', 'https://youtu.be/MCQoWGAmj7w?si=klNiT4MI3iIJfxiB',
    'Forming simple sentences for Class 4: subject + verb + object. Reading and writing basics.'),
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
    'Addition for Class 4: adding single-digit numbers, the plus sign, simple word problems.'),
  v('shapes', 'Shapes', 'https://youtu.be/NhHaV4HDgOg?si=mGlhL3hY4an9AeMY',
    'Basic shapes: circle, square, triangle, rectangle. Identifying shapes in everyday objects.'),
  v('patterns', 'Patterns', 'https://youtu.be/uLcn8TDIefM?si=ZWQScCWQKvgzW6o6',
    'Repeating patterns with shapes, colours, and numbers. Finding what comes next in a sequence.'),
  v('clock_time', 'Clock & Time', 'https://youtu.be/r2K1Py9U87I?si=kpqKwKtN692CrZlt',
    'Reading a clock, telling time, daily routine (morning, afternoon, evening, night). Days of the week.'),
  v('subtraction', 'Subtraction', 'https://youtu.be/rqiu_xcvSk4?si=L_ythpAtyqlgpUn-',
    'Subtraction for Class 4: taking away, the minus sign, simple word problems, counting back.'),
];

/* ═══════════════════════════════════════════════════
   HINDI VIDEOS
   ═══════════════════════════════════════════════════ */

export const hindiVideos: VideoEntry[] = [
  v('hi_u1', 'चिड़िया का गीत', 'https://youtu.be/ZikEMVvHypU?si=BdIkw7--LDmq_N84', 'Hindi Unit 1: Chidiya Ka Geet (Song of the Bird) with Q&A.'),
  v('hi_u2', 'बगीचे का घोंघा', 'https://youtu.be/SKZ9BRhapW4?si=plXA-6_WWRTKQ2Dl', 'Hindi Unit 2: Bageeche Ka Ghongha (Snail of the Garden).'),
  v('hi_u3', 'नीम', 'https://youtu.be/Gtjs7Z3s1ck?si=NjFdmvzMn_C5Rtoa', 'Hindi Unit 3: Neem (The Neem Tree).'),
  v('hi_u4', 'हमारा आहार', 'https://youtu.be/9j0Yy16yllU?si=uCeV4H3xRl4at-hs', 'Hindi Unit 4: Hamara Aahaar (Our Diet/Food).'),
  v('hi_u5', 'आसमान गिरा', 'https://youtu.be/M17KfQlZINs?si=ioyByvTKMsRG90Mr', 'Hindi Unit 5: Aasman Gira (The Sky Fell).'),
];

/* ═══════════════════════════════════════════════════
   GUJARATI VIDEOS
   ═══════════════════════════════════════════════════ */

export const gujaratiVideos: VideoEntry[] = [
  v('gu_u1', 'તમે શું ખાશો?', 'https://youtu.be/ZxhnVnJNuiM?si=I28XmGvVagNQOL7G', 'Gujarati Unit 1: Tame Shu Khasho? (What will you eat?).'),
  v('gu_u2', 'ચાંદો પાણીમાં કોરોકટ્ટ!', 'https://youtu.be/bbwLfZYxMhw?si=lFtWadHPA_uLHOLS', 'Gujarati Unit 2: Chando Panima Korokatt!'),
  v('gu_u3', 'ખારા દરિયામાં મારી હોડી', 'https://youtu.be/aseFteM18tE?si=SucRK0Po293gsGHR', 'Gujarati Unit 3: Khara Dariyama Mari Hodi (My Boat in the Salty Sea).'),
];

/* ═══════════════════════════════════════════════════
   SCIENCE VIDEOS
   ═══════════════════════════════════════════════════ */

export const scienceVideos: VideoEntry[] = [
  v('sci_u1', 'Living Together', 'https://youtu.be/K3BI-y1s5pQ?si=_01YdVohca1WJzSN', 'Science Chapter 1: Living Together (Our Community).'),
  v('sci_u2', 'Exploring Our Neighbourhood', 'https://youtu.be/NDT5O4hGj8U?si=9pU2BSs5Z1gKcNBg', 'Science Chapter 2: Exploring Our Neighbourhood.'),
  v('sci_u3', 'Nature Trail', 'https://youtu.be/l5tPJL2nLtA?si=HiLpXWZhQ6RlovRN', 'Science Chapter 3: Nature Trail (Life Around Us).'),
  v('sci_u4', 'Growing up with Nature', 'https://youtu.be/NLOXTXBXdCs?si=aHrri6CibbJqSD-J', 'Science Chapter 4: Growing up with Nature.'),
  v('sci_u5', 'Food for Health', 'https://youtu.be/Po453Fz8zqY?si=OjXjXTXACbJF6sVO', 'Science Chapter 5: Food for Health (Health and Well-being).'),
];

/* ═══════════════════════════════════════════════════
   COMBINED
   ═══════════════════════════════════════════════════ */

export const VIDEO_DATA: Record<VideoSubject, VideoEntry[]> = {
  English: englishVideos,
  Maths: mathsVideos,
  Hindi: hindiVideos,
  Gujarati: gujaratiVideos,
  Science: scienceVideos,
};

export const ALL_VIDEOS: VideoEntry[] = [...englishVideos, ...mathsVideos, ...hindiVideos, ...gujaratiVideos, ...scienceVideos];
