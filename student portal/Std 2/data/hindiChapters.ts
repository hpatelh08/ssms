/**
 * data/hindiChapters.ts
 * Hindi syllabus chapters for AI Buddy - NCERT Sarangi Class 2 (Std 2)
 * Each chapter has a YouTube video link + embed ID for inline player.
 */

export interface HindiChapterEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
  type: 'कविता' | 'कहानी';
  topics: string;
}

function extractYTId(url: string): string {
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  const long = url.match(/[?&]v=([^?&]+)/);
  if (long) return long[1];
  return '';
}

export const hindiChapters: HindiChapterEntry[] = [
  {
    id: 'hindi1',
    title: 'नीमा की दादी',
    url: 'https://youtu.be/IIxkvmncZsU',
    embedId: extractYTId('https://youtu.be/IIxkvmncZsU'),
    type: 'कहानी',
    topics: 'परिवार, दादी',
  },
  {
    id: 'hindi2',
    title: 'घर',
    url: 'https://youtu.be/Y-_XStVj5gI',
    embedId: extractYTId('https://youtu.be/Y-_XStVj5gI'),
    type: 'कविता',
    topics: 'घर, महत्व',
  },
  {
    id: 'hindi3',
    title: 'माला की चाँदी की पायल',
    url: 'https://youtu.be/B0brHajZ3WE',
    embedId: extractYTId('https://youtu.be/B0brHajZ3WE'),
    type: 'कहानी',
    topics: 'गहने, पायल',
  },
  {
    id: 'hindi4',
    title: 'माँ',
    url: 'https://youtu.be/XAGFLUtOh1w',
    embedId: extractYTId('https://youtu.be/XAGFLUtOh1w'),
    type: 'कविता',
    topics: 'माँ, प्यार',
  },
  {
    id: 'hindi5',
    title: 'थाथू और मैं',
    url: 'https://youtu.be/5hW8Ou9pyKc',
    embedId: extractYTId('https://youtu.be/5hW8Ou9pyKc'),
    type: 'कहानी',
    topics: 'धागा, कहानी',
  },
  {
    id: 'hindi6',
    title: 'चींटा',
    url: 'https://youtu.be/DbtlPF5trNM',
    embedId: extractYTId('https://youtu.be/DbtlPF5trNM'),
    type: 'कविता',
    topics: 'चींटी, मेहनत',
  },
  {
    id: 'hindi7',
    title: 'टिल्लू जी',
    url: 'https://youtu.be/pBCXClxwDs4',
    embedId: extractYTId('https://youtu.be/pBCXClxwDs4'),
    type: 'कहानी',
    topics: 'मज़ा, टिल्लू',
  },
  {
    id: 'hindi8',
    title: 'तीन दोस्त',
    url: 'https://youtu.be/2WLbwVH4gOA',
    embedId: extractYTId('https://youtu.be/2WLbwVH4gOA'),
    type: 'कहानी',
    topics: 'दोस्ती, मित्र',
  },
  {
    id: 'hindi9',
    title: 'दुनिया रंग-बिरंगी',
    url: 'https://youtu.be/e-snI08eqgI',
    embedId: extractYTId('https://youtu.be/e-snI08eqgI'),
    type: 'कविता',
    topics: 'रंग, दुनिया',
  },
  {
    id: 'hindi10',
    title: 'कौन',
    url: 'https://youtu.be/pQRQfVuRYWQ',
    embedId: extractYTId('https://youtu.be/pQRQfVuRYWQ'),
    type: 'कविता',
    topics: 'जिज्ञासा, सवाल',
  },
  {
    id: 'hindi11',
    title: 'बैंगनी जोजो',
    url: 'https://youtu.be/sjfk0SQlnj8',
    embedId: extractYTId('https://youtu.be/sjfk0SQlnj8'),
    type: 'कहानी',
    topics: 'बीज, पौधे',
  },
  {
    id: 'hindi12',
    title: 'तोसिया का सपना',
    url: 'https://youtu.be/h7Bv6OT8WiY',
    embedId: extractYTId('https://youtu.be/h7Bv6OT8WiY'),
    type: 'कहानी',
    topics: 'तोता, सपने',
  },
];
