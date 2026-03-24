/**
 * data/gujaratiChapters.ts
 * Gujarati syllabus chapters for AI Buddy - GSEB Mayur Class 3 (Std 3)
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
    title: 'નાક-કાન વગર ગા',
    url: 'https://youtu.be/88lv57KNvNM?si=gW9FXlaxsZS0i4iJ',
    embedId: extractYTId('https://youtu.be/88lv57KNvNM?si=gW9FXlaxsZS0i4iJ'),
    type: 'વાર્તા',
    topics: 'કલ્પના, હાસ્ય',
  },
  {
    id: 'guj2',
    title: 'નારાજ વનરાજ',
    url: 'https://youtu.be/wy2PfHbwjio?si=vEksmwdI4XFOMxYl',
    embedId: extractYTId('https://youtu.be/wy2PfHbwjio?si=vEksmwdI4XFOMxYl'),
    type: 'વાર્તા',
    topics: 'પ્રકૃતિ, પ્રાણી',
  },
  {
    id: 'guj3',
    title: 'મકાન વગરના વાનર',
    url: 'https://youtu.be/oJ8TZBnn_fY?si=0bJ4Z4FoVMqes5uf',
    embedId: extractYTId('https://youtu.be/oJ8TZBnn_fY?si=0bJ4Z4FoVMqes5uf'),
    type: 'વાર્તા',
    topics: 'પ્રાણી, જીવનશૈલી',
  },
  {
    id: 'guj4',
    title: 'લાલકણને ખાઈ ગઈ બાજરી',
    url: 'https://youtu.be/1JTxyu2xxDc?si=2-_NuBELf32LAre1',
    embedId: extractYTId('https://youtu.be/1JTxyu2xxDc?si=2-_NuBELf32LAre1'),
    type: 'વાર્તા',
    topics: 'ખોરાક, લોકકથા',
  },
  {
    id: 'guj5',
    title: 'તીનું તમતમતું ગીત',
    url: 'https://youtu.be/E49SZH55Pm0?si=Us9nueTQC44kVQCe',
    embedId: extractYTId('https://youtu.be/E49SZH55Pm0?si=Us9nueTQC44kVQCe'),
    type: 'કવિતા',
    topics: 'સંગીત, આનંદ',
  },
  {
    id: 'guj6',
    title: 'મરજી બનો, મઝા કરો',
    url: 'https://youtu.be/ZUYyyCwK1xQ?si=LHLw335wAblmw-m2',
    embedId: extractYTId('https://youtu.be/ZUYyyCwK1xQ?si=LHLw335wAblmw-m2'),
    type: 'વાર્તા',
    topics: 'મિત્રતા, આનંદ',
  },
  {
    id: 'guj7',
    title: 'મિયાંઉ...મિયાંઉ, અહી આવ',
    url: 'https://youtu.be/Ha37-ydFrLc?si=AJdn-4uROglAkkSK',
    embedId: extractYTId('https://youtu.be/Ha37-ydFrLc?si=AJdn-4uROglAkkSK'),
    type: 'વાર્તા',
    topics: 'પ્રાણી, રમૂજ',
  },
];
