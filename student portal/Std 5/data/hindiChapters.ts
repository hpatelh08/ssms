/**
 * data/hindiChapters.ts
 * Hindi syllabus chapters for AI Buddy - NCERT Veena Class 5 (Std 5)
 * Each chapter has a YouTube video link + embed ID for inline player.
 */

export interface HindiChapterEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
  unit: string;
  type: 'कविता' | 'कहानी' | 'संवाद';
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
    title: 'किरण',
    url: 'https://youtu.be/5OLhbq2ot84',
    embedId: extractYTId('https://youtu.be/5OLhbq2ot84'),
    unit: 'पाठ १',
    type: 'कहानी',
    topics: 'चरित्र, वर्णनात्मक लेखन, पठन बोध',
  },
  {
    id: 'hindi2',
    title: 'न्याय की कुर्सी',
    url: 'https://youtu.be/wlskl_YiRuM',
    embedId: extractYTId('https://youtu.be/wlskl_YiRuM'),
    unit: 'पाठ २',
    type: 'कहानी',
    topics: 'न्याय, नैतिक मूल्य, संवाद',
  },
  {
    id: 'hindi3',
    title: 'चाँद का कुरता',
    url: 'https://youtu.be/cMUb6VdxKfQ',
    embedId: extractYTId('https://youtu.be/cMUb6VdxKfQ'),
    unit: 'पाठ ३',
    type: 'कविता',
    topics: 'काव्य भाषा, रूपक, ताल',
  },
  {
    id: 'hindi4',
    title: 'साङकेन',
    url: 'https://youtu.be/2L1gOXgohtE',
    embedId: extractYTId('https://youtu.be/2L1gOXgohtE'),
    unit: 'पाठ ४',
    type: 'कहानी',
    topics: 'संस्कृति, त्योहार, पठन बोध',
  },
  {
    id: 'hindi5',
    title: 'सुंदरीया',
    url: 'https://youtu.be/dX4gGCwc1MY',
    embedId: extractYTId('https://youtu.be/dX4gGCwc1MY'),
    unit: 'पाठ ५',
    type: 'कहानी',
    topics: 'विशेषण, प्रकृति शब्दावली',
  },
  {
    id: 'hindi6',
    title: 'चतुर चित्रकार',
    url: 'https://youtu.be/5Rx2nBkmDuM',
    embedId: extractYTId('https://youtu.be/5Rx2nBkmDuM'),
    unit: 'पाठ ६',
    type: 'कहानी',
    topics: 'चतुराई, कथा लेखन, शब्द भंडार',
  },
  {
    id: 'hindi7',
    title: 'मेरा बचपन',
    url: 'https://youtu.be/1crls-5aU6A',
    embedId: extractYTId('https://youtu.be/1crls-5aU6A'),
    unit: 'पाठ ७',
    type: 'कहानी',
    topics: 'आत्मकथा, भूतकाल, व्यक्तिगत लेखन',
  },
  {
    id: 'hindi8',
    title: 'काजीरंगा राष्ट्रीय उद्यान की यात्रा',
    url: 'https://youtu.be/VEwS1daT7dc',
    embedId: extractYTId('https://youtu.be/VEwS1daT7dc'),
    unit: 'पाठ ८',
    type: 'कहानी',
    topics: 'यात्रा वर्णन, वन्यजीव शब्दावली',
  },
  {
    id: 'hindi9',
    title: 'न्याय',
    url: 'https://youtu.be/9G_Cq04Md0Q',
    embedId: extractYTId('https://youtu.be/9G_Cq04Md0Q'),
    unit: 'पाठ ९',
    type: 'कहानी',
    topics: 'न्याय, नैतिक मूल्य, पठन बोध',
  },
  {
    id: 'hindi10',
    title: 'तीन मछलियाँ',
    url: 'https://youtu.be/Z2uZIVJ-oe8',
    embedId: extractYTId('https://youtu.be/Z2uZIVJ-oe8'),
    unit: 'पाठ १०',
    type: 'कहानी',
    topics: 'लोककथा, बुद्धिमानी, योजना',
  },
  {
    id: 'hindi11',
    title: 'हमारे ये कलामंदिर',
    url: 'https://youtu.be/DGUiIPtN7Qg',
    embedId: extractYTId('https://youtu.be/DGUiIPtN7Qg'),
    unit: 'पाठ ११',
    type: 'कहानी',
    topics: 'कला, सांस्कृतिक विरासत, कर्मवाच्य',
  },
];
