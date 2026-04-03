/**
 * data/gujaratiChapters.ts
 * Gujarati syllabus chapters for AI Buddy - GSEB Kukut Class 5 (Std 5)
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
    title: 'પતંગા પાઈ',
    url: 'https://youtu.be/kesHZel062Q?si=GQl1LnlOzMD8Auwu',
    embedId: extractYTId('https://youtu.be/kesHZel062Q?si=GQl1LnlOzMD8Auwu'),
    type: 'કવિતા',
    topics: 'પ્રકૃતિ, પતંગ, કાવ્ય અભિવ્યક્તિ',
  },
  {
    id: 'guj2',
    title: 'તમારું મન આપો',
    url: 'https://youtu.be/BOqRojEumE0?si=FAqV7y0Aa78YHcpw',
    embedId: extractYTId('https://youtu.be/BOqRojEumE0?si=FAqV7y0Aa78YHcpw'),
    type: 'વાર્તા',
    topics: 'ધ્યાન, મન, શીખવું',
  },
  {
    id: 'guj3',
    title: 'છ પગ ને બે પાંખ',
    url: 'https://youtu.be/xrg2Nn43sZM?si=0YLKcrndnKvdylE6',
    embedId: extractYTId('https://youtu.be/xrg2Nn43sZM?si=0YLKcrndnKvdylE6'),
    type: 'વાર્તા',
    topics: 'કીડા, પ્રાણીઓ, પ્રકૃતિ',
  },
  {
    id: 'guj4',
    title: 'આપશો તો બતાવો',
    url: 'https://youtu.be/OL1fVnZoDUA?si=KKGKbfZIDUjAffBb',
    embedId: extractYTId('https://youtu.be/OL1fVnZoDUA?si=KKGKbfZIDUjAffBb'),
    type: 'વાર્તા',
    topics: 'સહયોગ, વહેંચણી, સામાજિક મૂલ્ય',
  },
  {
    id: 'guj5',
    title: 'ઠંડક - બળતરા',
    url: 'https://youtu.be/RSnRGi9hvNQ?si=r_BrjSDk6Hsxj6yN',
    embedId: extractYTId('https://youtu.be/RSnRGi9hvNQ?si=r_BrjSDk6Hsxj6yN'),
    type: 'કવિતા',
    topics: 'વિરોધી શબ્દો, ઠંડી-ગરમી, કાવ્ય ભાષા',
  },
  {
    id: 'guj6',
    title: 'જીવતા હો અને જીવો',
    url: 'https://youtu.be/iaBR8NVeenI?si=5ponDyw932rWBn4p',
    embedId: extractYTId('https://youtu.be/iaBR8NVeenI?si=5ponDyw932rWBn4p'),
    type: 'વાર્તા',
    topics: 'જીવન, સ્વતંત્રતા, નૈતિક મૂલ્ય',
  },
  {
    id: 'guj7',
    title: 'પ્રશ્નોમાં પરાક્રમ',
    url: 'https://youtu.be/NCuqCgp-njc?si=rnuB7rz2dwgUhHju',
    embedId: extractYTId('https://youtu.be/NCuqCgp-njc?si=rnuB7rz2dwgUhHju'),
    type: 'કવિતા',
    topics: 'જિજ્ઞાસા, પ્રશ્ન, સાહસ',
  },
  {
    id: 'guj8',
    title: 'ચોટી મુંગી ઘૂઘૂઘૂ',
    url: 'https://youtu.be/blojJfw9LUw?si=9qdaqK6m9aVo_H4G',
    embedId: extractYTId('https://youtu.be/blojJfw9LUw?si=9qdaqK6m9aVo_H4G'),
    type: 'કવિતા',
    topics: 'કીડી, પ્રાણી, રમૂજ',
  },
  {
    id: 'guj9',
    title: 'શુભ રાત્રી',
    url: 'https://youtu.be/xyeDjaHpWJA?si=bRU6irVjMZdHSMfX',
    embedId: extractYTId('https://youtu.be/xyeDjaHpWJA?si=bRU6irVjMZdHSMfX'),
    type: 'કવિતા',
    topics: 'રાત, ઊંઘ, સ્વપ્ન',
  },
];
