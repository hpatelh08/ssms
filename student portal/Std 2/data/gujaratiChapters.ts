/**
 * data/gujaratiChapters.ts
 * Gujarati syllabus chapters for AI Buddy - GSEB Bulbul Class 2 (Std 2)
 * Each chapter has a YouTube video link + embed ID for inline player.
 */

export interface GujaratiChapterEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
  type: 'વાર્તા' | 'કવિતા';
  topics: string;
}

function extractYTId(url: string): string {
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  const long = url.match(/[?&]v=([^?&]+)/);
  if (long) return long[1];
  return '';
}

export const gujaratiChapters: GujaratiChapterEntry[] = [
  {
    id: 'guj1',
    title: 'ટાયર ફાટ્યું ફટાક',
    url: 'https://youtu.be/p-QEXWKKtrA',
    embedId: extractYTId('https://youtu.be/p-QEXWKKtrA'),
    type: 'વાર્તા',
    topics: 'ટાયર, વાર્તા',
  },
  {
    id: 'guj2',
    title: 'વાંદરા માથે ફૂગાનો ટોપો',
    url: 'https://www.youtube.com/watch?v=IMbCks9pckc',
    embedId: extractYTId('https://www.youtube.com/watch?v=IMbCks9pckc'),
    type: 'વાર્તા',
    topics: 'વાંદરો, રમૂજ',
  },
  {
    id: 'guj3',
    title: 'ચકલીની ચાંચમાં ચમચી',
    url: 'https://www.youtube.com/watch?v=rhY5vTm2HkE',
    embedId: extractYTId('https://www.youtube.com/watch?v=rhY5vTm2HkE'),
    type: 'વાર્તા',
    topics: 'ચકલી, ચમચી',
  },
  {
    id: 'guj4',
    title: 'ગિલી ગિલી છૂ',
    url: 'https://youtu.be/-y2L1utn_z8',
    embedId: extractYTId('https://youtu.be/-y2L1utn_z8'),
    type: 'કવિતા',
    topics: 'રમત, અવાજ',
  },
  {
    id: 'guj5',
    title: 'રિમઝિમ... રિમઝિમ',
    url: 'https://www.youtube.com/watch?v=ftasbCesm1g',
    embedId: extractYTId('https://www.youtube.com/watch?v=ftasbCesm1g'),
    type: 'કવિતા',
    topics: 'વરસાદ, કવિતા',
  },
  {
    id: 'guj6',
    title: 'વાઘની ટૂંકી રિસેસ',
    url: 'https://youtu.be/ZL1gV8wS18s',
    embedId: extractYTId('https://youtu.be/ZL1gV8wS18s'),
    type: 'વાર્તા',
    topics: 'વાઘ, રમૂજ',
  },
  {
    id: 'guj7',
    title: 'વન સાદ કરે છે',
    url: 'https://youtu.be/vkz-XR03VaA',
    embedId: extractYTId('https://youtu.be/vkz-XR03VaA'),
    type: 'કવિતા',
    topics: 'જંગલ, પ્રકૃતિ',
  },
];
