/**
 * data/hindiChapters.ts
 * Hindi syllabus chapters for AI Buddy - NCERT Veena Class 3 (Std 3)
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
  // Unit 1: इकाई एक – हमारा पर्यावरण
  {
    id: 'hindi1',
    title: 'सीखो',
    url: 'https://youtu.be/bZVs6WDYoeI?si=8VXrL05iOsC8Sc_f',
    embedId: extractYTId('https://youtu.be/bZVs6WDYoeI?si=8VXrL05iOsC8Sc_f'),
    unit: 'Unit 1: इकाई एक – हमारा पर्यावरण',
    type: 'कविता',
    topics: 'सीखना, ज्ञान',
  },
  {
    id: 'hindi2',
    title: 'चींटी',
    url: 'https://youtu.be/hRQW2aoMev8?si=jul-cIed4Wimv0Lp',
    embedId: extractYTId('https://youtu.be/hRQW2aoMev8?si=jul-cIed4Wimv0Lp'),
    unit: 'Unit 1: इकाई एक – हमारा पर्यावरण',
    type: 'कहानी',
    topics: 'प्रकृति, जानवर',
  },
  {
    id: 'hindi3',
    title: 'कितने पैर?',
    url: 'https://youtu.be/GLbC4XoVLjQ?si=SQXvQWy_fSUmQhAo',
    embedId: extractYTId('https://youtu.be/GLbC4XoVLjQ?si=SQXvQWy_fSUmQhAo'),
    unit: 'Unit 1: इकाई एक – हमारा पर्यावरण',
    type: 'कहानी',
    topics: 'गिनती, जानवर',
  },
  {
    id: 'hindi4',
    title: 'बया हमारी चिड़िया रानी!',
    url: 'https://youtu.be/Wkv74hn6SiM?si=5lepXTKJnfodLfZF',
    embedId: extractYTId('https://youtu.be/Wkv74hn6SiM?si=5lepXTKJnfodLfZF'),
    unit: 'Unit 1: इकाई एक – हमारा पर्यावरण',
    type: 'कहानी',
    topics: 'पक्षी, प्रकृति',
  },
  {
    id: 'hindi5',
    title: 'आम का पेड़',
    url: 'https://youtu.be/SDkcryWvk84?si=GGr14IzB04f_7ONk',
    embedId: extractYTId('https://youtu.be/SDkcryWvk84?si=GGr14IzB04f_7ONk'),
    unit: 'Unit 1: इकाई एक – हमारा पर्यावरण',
    type: 'कहानी',
    topics: 'पेड़, फल, प्रकृति',
  },

  // Unit 2: इकाई दो – हमारे मित्र
  {
    id: 'hindi6',
    title: 'बीरबल की खिचड़ी',
    url: 'https://youtu.be/fXAN16c89Qk?si=dYKKsskDueTn82Ro',
    embedId: extractYTId('https://youtu.be/fXAN16c89Qk?si=dYKKsskDueTn82Ro'),
    unit: 'Unit 2: इकाई दो – हमारे मित्र',
    type: 'कहानी',
    topics: 'बुद्धि, हास्य',
  },
  {
    id: 'hindi7',
    title: 'मित्र को पत्र',
    url: 'https://youtu.be/tkmG86jIZb8?si=PbjPswYcCW7Wqbh2',
    embedId: extractYTId('https://youtu.be/tkmG86jIZb8?si=PbjPswYcCW7Wqbh2'),
    unit: 'Unit 2: इकाई दो – हमारे मित्र',
    type: 'कहानी',
    topics: 'दोस्ती, पत्र लेखन',
  },
  {
    id: 'hindi8',
    title: 'चतुर गीदड़',
    url: 'https://youtu.be/8JScgQopCmE?si=eNGUCz0izLrTeq9R',
    embedId: extractYTId('https://youtu.be/8JScgQopCmE?si=eNGUCz0izLrTeq9R'),
    unit: 'Unit 2: इकाई दो – हमारे मित्र',
    type: 'कहानी',
    topics: 'चतुराई, जानवर',
  },
  {
    id: 'hindi9',
    title: 'प्रकृति पर्व — फूलदेई',
    url: 'https://youtu.be/7YSwZ30D470?si=NvTesEXpHCJ9wYT5',
    embedId: extractYTId('https://youtu.be/7YSwZ30D470?si=NvTesEXpHCJ9wYT5'),
    unit: 'Unit 2: इकाई दो – हमारे मित्र',
    type: 'कहानी',
    topics: 'त्योहार, संस्कृति',
  },

  // Unit 3: इकाई तीन – आओ खेलें
  {
    id: 'hindi10',
    title: 'रस्साकशी',
    url: 'https://youtu.be/GfjVN1GGU88?si=vfa2vjWX2DnPJOII',
    embedId: extractYTId('https://youtu.be/GfjVN1GGU88?si=vfa2vjWX2DnPJOII'),
    unit: 'Unit 3: इकाई तीन – आओ खेलें',
    type: 'कहानी',
    topics: 'खेल, टीमवर्क',
  },
  {
    id: 'hindi11',
    title: 'एक जादुई पिटारा',
    url: 'https://youtu.be/q2TsJAIcg0s?si=xiv-VKQ-dn0NnIgY',
    embedId: extractYTId('https://youtu.be/q2TsJAIcg0s?si=xiv-VKQ-dn0NnIgY'),
    unit: 'Unit 3: इकाई तीन – आओ खेलें',
    type: 'कहानी',
    topics: 'जादू, कल्पना',
  },

  // Unit 4: इकाई चार – अपना-अपना काम
  {
    id: 'hindi12',
    title: 'अपना-अपना काम',
    url: 'https://youtu.be/J-FQ9vu0Zdw?si=5ClsmOP72C31h5eR',
    embedId: extractYTId('https://youtu.be/J-FQ9vu0Zdw?si=5ClsmOP72C31h5eR'),
    unit: 'Unit 4: इकाई चार – अपना-अपना काम',
    type: 'कहानी',
    topics: 'काम, जिम्मेदारी',
  },
  {
    id: 'hindi13',
    title: 'पेड़ों की अम्मा \'तिमक्का\'',
    url: 'https://youtu.be/knCzWGqoN0c?si=eYv_KuUlZYmgY8Ae',
    embedId: extractYTId('https://youtu.be/knCzWGqoN0c?si=eYv_KuUlZYmgY8Ae'),
    unit: 'Unit 4: इकाई चार – अपना-अपना काम',
    type: 'कहानी',
    topics: 'पर्यावरण, प्रेरणा',
  },
  {
    id: 'hindi14',
    title: 'किसान की होशियारी',
    url: 'https://youtu.be/S5-pR1G7ly8?si=WJ-Oqp1ARc2zPKGL',
    embedId: extractYTId('https://youtu.be/S5-pR1G7ly8?si=WJ-Oqp1ARc2zPKGL'),
    unit: 'Unit 4: इकाई चार – अपना-अपना काम',
    type: 'कहानी',
    topics: 'किसान, बुद्धिमानी',
  },

  // Unit 5: इकाई पाँच – हमारा देश
  {
    id: 'hindi15',
    title: 'भारत',
    url: 'https://youtu.be/nf3_mzrAiQs?si=mYHgFbA0aiqV0BNQ',
    embedId: extractYTId('https://youtu.be/nf3_mzrAiQs?si=mYHgFbA0aiqV0BNQ'),
    unit: 'Unit 5: इकाई पाँच – हमारा देश',
    type: 'कविता',
    topics: 'देशभक्ति, भारत',
  },
  {
    id: 'hindi16',
    title: 'चंद्रयान (संवाद)',
    url: 'https://youtu.be/IiXeAK4jUk0?si=mqikdaADJGvog1gq',
    embedId: extractYTId('https://youtu.be/IiXeAK4jUk0?si=mqikdaADJGvog1gq'),
    unit: 'Unit 5: इकाई पाँच – हमारा देश',
    type: 'संवाद',
    topics: 'अंतरिक्ष, विज्ञान',
  },
  {
    id: 'hindi17',
    title: 'बोलने वाली मूँद',
    url: 'https://youtu.be/z6d5AN0tSy8?si=4Rt_cSM6KCC6BO3K',
    embedId: extractYTId('https://youtu.be/z6d5AN0tSy8?si=4Rt_cSM6KCC6BO3K'),
    unit: 'Unit 5: इकाई पाँच – हमारा देश',
    type: 'कहानी',
    topics: 'कल्पना, कहानी',
  },
  {
    id: 'hindi18',
    title: 'हम अनेक किन्तु एक',
    url: 'https://youtu.be/Yfb3lBmR4fc?si=owt5rjEcX9T8d_bv',
    embedId: extractYTId('https://youtu.be/Yfb3lBmR4fc?si=owt5rjEcX9T8d_bv'),
    unit: 'Unit 5: इकाई पाँच – हमारा देश',
    type: 'कविता',
    topics: 'एकता, विविधता',
  },
];
