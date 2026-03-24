/**
 * data/videoConfig.ts
 * Video learning data for AI Buddy - English, Maths, Hindi & Gujarati.
 * Each video has a YouTube URL, title, and topic context
 * for RAG-grounded AI queries. Aligned to NCERT/GSEB Class 2.
 */

export type VideoSubject = 'English' | 'Maths' | 'Hindi' | 'Gujarati';

export interface VideoEntry {
  id: string;
  title: string;
  url: string;
  /** Extracted YouTube video ID for embedding */
  embedId: string;
  /** Context hint for AI grounding */
  context: string;
}

/* -- Helper to extract YouTube embed ID -- */

function extractYTId(url: string): string {
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  const long = url.match(/[?&]v=([^?&]+)/);
  if (long) return long[1];
  return '';
}

function v(id: string, title: string, url: string, context: string): VideoEntry {
  return { id, title, url, embedId: extractYTId(url), context };
}

/* ---- ENGLISH VIDEOS (NCERT Mridang - Class 2) ---- */

export const englishVideos: VideoEntry[] = [
  v('my_bicycle', 'My Bicycle', 'https://youtu.be/rNvuRJ2cT6I?si=c9BqBBjulYzF0ixk',
    'Story about a child and their bicycle adventure for Class 2 English Unit 1.'),
  v('picture_reading', 'Picture Reading', 'https://youtu.be/S5BRqtzgLDo?si=eIQjm-IVyi8CdyEE',
    'Activity-based lesson where students understand stories through pictures for Class 2 English Unit 1.'),
  v('it_is_fun', 'It is Fun', 'https://youtu.be/0DcF6VL73Fk?si=5lZqVny_q0bOst4o',
    'Story about fun activities and joyful learning for Class 2 English Unit 2.'),
  v('seeing_without_seeing', 'Seeing without Seeing', 'https://youtu.be/yfSO5IWGr2U?si=Gml8_AeP-Vn6_nYP',
    'Lesson about understanding the world beyond just eyesight for Class 2 English Unit 2.'),
  v('come_back_soon', 'Come Back Soon', 'https://youtu.be/VoU6yrkqBRQ?si=UCT4pq_OfAfDU3Ze',
    'Story about visiting places and returning home for Class 2 English Unit 3.'),
  v('between_home_school', 'Between Home and School', 'https://youtu.be/AaU-D6n_Ytc?si=cGyewaxLagZ1bw3o',
    'Lesson about things children observe while traveling between home and school for Class 2 English Unit 3.'),
  v('this_is_my_town', 'This is My Town', 'https://youtu.be/OfpRtJh4jm0?si=MBqpqVPRM2qXzEiM',
    'Story describing a child\'s town and surroundings for Class 2 English Unit 3.'),
  v('show_of_clouds', 'A Show of Clouds', 'https://youtu.be/Rakggfas4FM?si=5trjwhTymOndm6G-',
    'Poem about clouds and their beautiful shapes for Class 2 English Unit 4.'),
  v('my_name', 'My Name', 'https://youtu.be/RN_i3WIPuDE?si=kci5cuxZOxSLvMAB',
    'Story about identity and the importance of names for Class 2 English Unit 4.'),
  v('the_crow', 'The Crow', 'https://www.youtube.com/watch?v=Ykr_sQD_z-c',
    'Story about a crow and its clever behavior for Class 2 English Unit 4.'),
  v('smart_monkey', 'The Smart Monkey', 'https://www.youtube.com/watch?v=-lovmrXI5XQ',
    'Story about a clever monkey and its smart actions for Class 2 English Unit 4.'),
  v('little_drops', 'Little Drops of Water', 'https://www.youtube.com/watch?v=lttP-X5ADMg',
    'Poem about unity and how small efforts create big results for Class 2 English Unit 5.'),
  v('we_are_indians', 'We are all Indians', 'https://youtu.be/fAsGPdaltQY?si=-NWgo2_5xDBE3rxo',
    'Lesson about unity, diversity, and national identity for Class 2 English Unit 5.'),
];

/* ---- MATHS VIDEOS (NCERT Joyful - Class 2) ---- */

export const mathsVideos: VideoEntry[] = [
  v('day_at_beach', 'A Day at the Beach', 'https://youtu.be/njXtTBCG4Vk',
    'Counting in groups, grouping objects for Class 2 Mathematics.'),
  v('shapes_around_us', 'Shapes Around Us', 'https://youtu.be/74JhwbsVXQ8',
    'Introduction to three-dimensional shapes for Class 2 Mathematics.'),
  v('fun_with_numbers', 'Fun with Numbers', 'https://youtu.be/JBSpqULMw4s',
    'Learning numbers from 1 to 100 and number patterns for Class 2 Mathematics.'),
  v('shadow_story', 'Shadow Story', 'https://youtu.be/k9jSiepDZLM',
    'Understanding two-dimensional shapes using shadows for Class 2 Mathematics.'),
  v('playing_with_lines', 'Playing with Lines', 'https://youtu.be/_DSPw0SYE9c',
    'Learning about directions and orientations of lines for Class 2 Mathematics.'),
  v('decoration_festival', 'Decoration for Festival', 'https://youtu.be/b8-SogImN-Q',
    'Addition and subtraction with real-life examples for Class 2 Mathematics.'),
  v('ranis_gift', 'Rani\'s Gift', 'https://www.youtube.com/watch?v=CIb7QImNQi4',
    'Measuring length and comparing sizes for Class 2 Mathematics.'),
  v('grouping_sharing', 'Grouping and Sharing', 'https://youtu.be/-1MKHv_i0Mw',
    'Understanding multiplication and division through grouping for Class 2 Mathematics.'),
  v('which_season', 'Which Season is It?', 'https://youtu.be/7gfog5Q1_P4',
    'Learning about seasons and time for Class 2 Mathematics.'),
  v('fun_at_fair', 'Fun at the Fair', 'https://youtu.be/6rDtEEXOoK4',
    'Understanding money and daily transactions for Class 2 Mathematics.'),
  v('data_handling', 'Data Handling', 'https://youtu.be/XyWbmIsvLzU',
    'Introduction to collecting and reading simple data for Class 2 Mathematics.'),
  v('puzzles', 'Puzzles', 'https://youtu.be/afD8vQUdMlk',
    'Fun puzzles for logical thinking for Class 2 Mathematics.'),
];


/* ---- HINDI VIDEOS (NCERT Sarangi - Class 2) ---- */

export const hindiVideos: VideoEntry[] = [
  v('neema_ki_dadi', 'नीमा की दादी', 'https://youtu.be/IIxkvmncZsU',
    'Family story about grandmother for Class 2 Hindi Unit 1.'),
  v('ghar', 'घर', 'https://youtu.be/Y-_XStVj5gI',
    'Lesson about the importance of home for Class 2 Hindi Unit 1.'),
  v('mala_ki_payal', 'माला की चाँदी की पायल', 'https://youtu.be/B0brHajZ3WE',
    'Story about Mala\'s anklet for Class 2 Hindi Unit 1.'),
  v('maa', 'माँ', 'https://youtu.be/XAGFLUtOh1w',
    'Poem about love for mother for Class 2 Hindi Unit 1.'),
  v('thaathu_aur_main', 'थाथू और मैं', 'https://youtu.be/5hW8Ou9pyKc',
    'Story about threads for Class 2 Hindi Unit 1.'),
  v('cheenta', 'चींटा', 'https://youtu.be/DbtlPF5trNM',
    'Poem about the hardworking ant for Class 2 Hindi Unit 1.'),
  v('tillu_ji', 'टिल्लू जी', 'https://youtu.be/pBCXClxwDs4',
    'Fun story about Tillu Ji for Class 2 Hindi Unit 1.'),
  v('teen_dost', 'तीन दोस्त', 'https://youtu.be/2WLbwVH4gOA',
    'Story about three friends for Class 2 Hindi Unit 2.'),
  v('duniya_rang_birangi', 'दुनिया रंग-बिरंगी', 'https://youtu.be/e-snI08eqgI',
    'Poem about the colorful world for Class 2 Hindi Unit 2.'),
  v('kaun', 'कौन', 'https://youtu.be/pQRQfVuRYWQ',
    'Poem encouraging curiosity for Class 2 Hindi Unit 2.'),
  v('baingani_jojo', 'बैंगनी जोजो', 'https://youtu.be/sjfk0SQlnj8',
    'Story about seeds growing into plants for Class 2 Hindi Unit 2.'),
  v('tosiya_ka_sapna', 'तोसिया का सपना', 'https://youtu.be/h7Bv6OT8WiY',
    'Story about parrots and dreams for Class 2 Hindi Unit 2.'),
];

/* ---- GUJARATI (GSEB Bulbul - Class 2) ---- */

export const gujaratiVideos: VideoEntry[] = [
  v('tyre_fatyu', 'ટાયર ફાટ્યું ફટાક', 'https://youtu.be/p-QEXWKKtrA',
    'Story about a tyre bursting for Class 2 Gujarati.'),
  v('vaandara_mathe', 'વાંદરા માથે ફૂગાનો ટોપો', 'https://www.youtube.com/watch?v=IMbCks9pckc',
    'Funny monkey story for Class 2 Gujarati.'),
  v('chakli_ni_chanch', 'ચકલીની ચાંચમાં ચમચી', 'https://www.youtube.com/watch?v=rhY5vTm2HkE',
    'Story about a sparrow and a spoon for Class 2 Gujarati.'),
  v('gili_gili_chhu', 'ગિલી ગિલી છૂ', 'https://youtu.be/-y2L1utn_z8',
    'Playful poem with sounds for Class 2 Gujarati.'),
  v('rimjhim', 'રિમઝિમ... રિમઝિમ', 'https://www.youtube.com/watch?v=ftasbCesm1g',
    'Poem about rain for Class 2 Gujarati.'),
  v('vaagh_ni_recess', 'વાઘની ટૂંકી રિસેસ', 'https://youtu.be/ZL1gV8wS18s',
    'Fun tiger story for Class 2 Gujarati.'),
  v('van_saad_kare', 'વન સાદ કરે છે', 'https://youtu.be/vkz-XR03VaA',
    'Poem about the forest and nature for Class 2 Gujarati.'),
];

/* ---- COMBINED ---- */

export const VIDEO_DATA: Record<VideoSubject, VideoEntry[]> = {
  English: englishVideos,
  Maths: mathsVideos,
  Hindi: hindiVideos,
  Gujarati: gujaratiVideos,
};

export const ALL_VIDEOS: VideoEntry[] = [...englishVideos, ...mathsVideos, ...hindiVideos, ...gujaratiVideos];
