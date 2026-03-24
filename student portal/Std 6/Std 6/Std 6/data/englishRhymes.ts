/**
 * data/englishRhymes.ts
 * English learning videos for Class 6 (Std 6)
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
    id: 'en_qa_bottle_dew',
    title: 'A Bottle of Dew - Q&A Part 2',
    url: 'https://youtu.be/g0dI8Foqj9g?si=jBRFQ8zDkagjVUUG',
    embedId: extractYTId('https://youtu.be/g0dI8Foqj9g?si=jBRFQ8zDkagjVUUG'),
    context: 'Question and answers for A Bottle of Dew - Unit 1, Fables and Folk Tales.',
  },
  {
    id: 'en_rama_rescue_p2',
    title: 'Rama to the Rescue - Part 2',
    url: 'https://youtu.be/Rm6qJEEiEuQ?si=N-9M5CNIpnduPON8',
    embedId: extractYTId('https://youtu.be/Rm6qJEEiEuQ?si=N-9M5CNIpnduPON8'),
    context: 'Part 2 explanation of Rama to the Rescue - Unit 1, Fables and Folk Tales.',
  },
  {
    id: 'en_unlikely_friends_p2',
    title: 'The Unlikely Best Friends - Part 2',
    url: 'https://youtu.be/C-Wpigy5VeQ?si=9YLWkdBCDr0qZf5o',
    embedId: extractYTId('https://youtu.be/C-Wpigy5VeQ?si=9YLWkdBCDr0qZf5o'),
    context: 'Part 2 of The Unlikely Best Friends - Unit 2, Friendship.',
  },
  {
    id: 'en_chair_qa',
    title: 'The Chair - Q&A',
    url: 'https://youtu.be/HA9QUmlMkFA?si=yxl0MIBj-UHHdWc9',
    embedId: extractYTId('https://youtu.be/HA9QUmlMkFA?si=yxl0MIBj-UHHdWc9'),
    context: 'Question and answers for The Chair - Unit 2, Friendship.',
  },
  {
    id: 'en_neem_baba_qa',
    title: 'Neem Baba - Q&A',
    url: 'https://youtu.be/3zfyAgqnZ34?si=HfBiBe9XzFNePDl1',
    embedId: extractYTId('https://youtu.be/3zfyAgqnZ34?si=HfBiBe9XzFNePDl1'),
    context: 'Question and answers for Neem Baba - Unit 3, Nurturing Nature.',
  },
  {
    id: 'en_bird_thought_qa',
    title: 'What a Bird Thought - Q&A',
    url: 'https://youtu.be/40O_iDJ-KRE?si=4kkGBXSTQNcIyD9w',
    embedId: extractYTId('https://youtu.be/40O_iDJ-KRE?si=4kkGBXSTQNcIyD9w'),
    context: 'Question and answers for What a Bird Thought - Unit 3, Nurturing Nature.',
  },
  {
    id: 'en_spices_qa',
    title: 'Spices that Heal Us - Q&A',
    url: 'https://youtu.be/VvGwGE6Ch8I?si=nae8D2e9-jjrQFAq',
    embedId: extractYTId('https://youtu.be/VvGwGE6Ch8I?si=nae8D2e9-jjrQFAq'),
    context: 'Question and answers for Spices that Heal Us - Unit 3, Nurturing Nature.',
  },
  {
    id: 'en_change_heart_qa',
    title: 'Change of Heart - Q&A',
    url: 'https://youtu.be/v1QfudEbK4Q?si=f1T7bVSUJJDoFjJk',
    embedId: extractYTId('https://youtu.be/v1QfudEbK4Q?si=f1T7bVSUJJDoFjJk'),
    context: 'Question and answers for Change of Heart - Unit 4, Sports and Wellness.',
  },
];
