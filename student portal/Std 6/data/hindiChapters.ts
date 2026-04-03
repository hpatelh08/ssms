/**
 * data/hindiChapters.ts
 * Hindi syllabus chapters for Class 6 (Bal Ram Katha / Vasant)
 */

export interface HindiChapterEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
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
    id: 'hi_ch1_matribhumi',
    title: 'Unit 1: मातृभूमि (कविता) - सोहनलाल द्विवेदी',
    url: 'https://youtu.be/SpRa_Ok3Weg?si=ifeQqSbseQ5xLJ46',
    embedId: extractYTId('https://youtu.be/SpRa_Ok3Weg?si=ifeQqSbseQ5xLJ46'),
  },
  {
    id: 'hi_ch2_gol',
    title: 'Unit 2: गोल (संस्मरण) - मेजर ध्यानचंद',
    url: 'https://youtu.be/78Gg8TxSKtw?si=Eb32EgH9JhRNHXIv',
    embedId: extractYTId('https://youtu.be/78Gg8TxSKtw?si=Eb32EgH9JhRNHXIv'),
  },
  {
    id: 'hi_ch3_pehli_boond',
    title: 'Unit 3: पहली बूंद (कविता) - गोपालकृष्ण कौल',
    url: 'https://youtu.be/RtM0JcQHTCY?si=W7EyisNiRJ4aruIL',
    embedId: extractYTId('https://youtu.be/RtM0JcQHTCY?si=W7EyisNiRJ4aruIL'),
  },
  {
    id: 'hi_ch4_haar_ki_jeet',
    title: 'Unit 4: हार की जीत (कहानी) - सुदर्शन',
    url: 'https://youtu.be/nMINKxm3nks?si=vPXEfr7PRRxA5Naz',
    embedId: extractYTId('https://youtu.be/nMINKxm3nks?si=vPXEfr7PRRxA5Naz'),
  },
  {
    id: 'hi_ch5_rahim_dohe',
    title: 'Unit 5: रहीम के दोहे - अब्दुर्रहीम खानखाना',
    url: 'https://youtu.be/6bCSqdrTd5U?si=dM99kjdIMM1MM1dO',
    embedId: extractYTId('https://youtu.be/6bCSqdrTd5U?si=dM99kjdIMM1MM1dO'),
  },
  {
    id: 'hi_ch6_meri_maa',
    title: 'Unit 6: मेरी माँ (आत्मकथा) - रामप्रसाद बिस्मिल',
    url: 'https://youtu.be/EWkNUAtyOkM?si=Uz7CWzhlB1jho2cL',
    embedId: extractYTId('https://youtu.be/EWkNUAtyOkM?si=Uz7CWzhlB1jho2cL'),
  },
  {
    id: 'hi_ch7_jalate_chalo_p1',
    title: 'Unit 7: जलाते चलो (कविता) - Part 1',
    url: 'https://youtu.be/0WGnyzsGmcU?si=hAev-apTdTwk2dgi',
    embedId: extractYTId('https://youtu.be/0WGnyzsGmcU?si=hAev-apTdTwk2dgi'),
  },
  {
    id: 'hi_ch7_jalate_chalo_p2',
    title: 'Unit 7: जलाते चलो (कविता) - Part 2',
    url: 'https://youtu.be/vMS6096YyKA?si=pBkp0K4dVoMwh2zJ',
    embedId: extractYTId('https://youtu.be/vMS6096YyKA?si=pBkp0K4dVoMwh2zJ'),
  },
  {
    id: 'hi_ch8_satriya_p1',
    title: 'Unit 8: सत्रिया और बिहू नृत्य (निबंध) - Part 1',
    url: 'https://youtu.be/jkvvIpo-1Rg?si=MAz99Un8eP1iGxlR',
    embedId: extractYTId('https://youtu.be/jkvvIpo-1Rg?si=MAz99Un8eP1iGxlR'),
  },
  {
    id: 'hi_ch8_satriya_p2',
    title: 'Unit 8: सत्रिया और बिहू नृत्य (निबंध) - Part 2',
    url: 'https://youtu.be/IX9oSsGeZrE?si=P0Dg9iVmVroqkezN',
    embedId: extractYTId('https://youtu.be/IX9oSsGeZrE?si=P0Dg9iVmVroqkezN'),
  },
  {
    id: 'hi_ch8_satriya_p3',
    title: 'Unit 8: सत्रिया और बिहू नृत्य (निबंध) - Part 3',
    url: 'https://youtu.be/S-CAuU-NdPY?si=uciKsUNd7u8yxP8P',
    embedId: extractYTId('https://youtu.be/S-CAuU-NdPY?si=uciKsUNd7u8yxP8P'),
  },
  {
    id: 'hi_ch9_maiya_p1',
    title: 'Unit 9: मैया मैं नहीं माखन खायो (पद) - Part 1',
    url: 'https://youtu.be/NhKsdlWaVr8?si=vUn-psHE2m1LFKu6',
    embedId: extractYTId('https://youtu.be/NhKsdlWaVr8?si=vUn-psHE2m1LFKu6'),
  },
  {
    id: 'hi_ch9_maiya_p2',
    title: 'Unit 9: मैया मैं नहीं माखन खायो (पद) - Part 2',
    url: 'https://youtu.be/B5SeKyBPWU8?si=kh7AkfzXS33sxHki',
    embedId: extractYTId('https://youtu.be/B5SeKyBPWU8?si=kh7AkfzXS33sxHki'),
  },
  {
    id: 'hi_ch10_pariksha_p1',
    title: 'Unit 10: परीक्षा (कहानी) - Part 1',
    url: 'https://youtu.be/koJlm5zTCZQ?si=MqHn89JeF3WIO6fW',
    embedId: extractYTId('https://youtu.be/koJlm5zTCZQ?si=MqHn89JeF3WIO6fW'),
  },
  {
    id: 'hi_ch10_pariksha_p2',
    title: 'Unit 10: परीक्षा (कहानी) - Part 2',
    url: 'https://youtu.be/Ofk7lB_Jeu4?si=bvst1a5SVhLNMBid',
    embedId: extractYTId('https://youtu.be/Ofk7lB_Jeu4?si=bvst1a5SVhLNMBid'),
  },
  {
    id: 'hi_ch11_chetak_p1',
    title: 'Unit 11: चेतक की वीरता (कविता) - Part 1',
    url: 'https://youtu.be/ZqHu696vhVU?si=xD3-VXFOxVA1uSlG',
    embedId: extractYTId('https://youtu.be/ZqHu696vhVU?si=xD3-VXFOxVA1uSlG'),
  },
  {
    id: 'hi_ch11_chetak_p2',
    title: 'Unit 11: चेतक की वीरता (कविता) - Part 2',
    url: 'https://youtu.be/Rl1CIsQc6Qg?si=N8f56xf8fxhiuvW5',
    embedId: extractYTId('https://youtu.be/Rl1CIsQc6Qg?si=N8f56xf8fxhiuvW5'),
  },
  {
    id: 'hi_ch12_hind_p1',
    title: 'Unit 12: हिंद महासागर में छोटा-सा हिंदुस्तान - Part 1',
    url: 'https://youtu.be/a8hWy6Bp84Q?si=2m-p-850t6rmc0fN',
    embedId: extractYTId('https://youtu.be/a8hWy6Bp84Q?si=2m-p-850t6rmc0fN'),
  },
  {
    id: 'hi_ch12_hind_p2',
    title: 'Unit 12: हिंद महासागर में छोटा-सा हिंदुस्तान - Part 2',
    url: 'https://youtu.be/kuvW6a6uELc?si=oFUtbvek0kA4pcpM',
    embedId: extractYTId('https://youtu.be/kuvW6a6uELc?si=oFUtbvek0kA4pcpM'),
  },
  {
    id: 'hi_ch13_ped_ki_baat',
    title: 'Unit 13: पेड़ की बात (निबंध) - जगदीशचंद्र बसु',
    url: 'https://youtu.be/nh1W-hb24LE?si=IpBGUhbrw2iCzMDT',
    embedId: extractYTId('https://youtu.be/nh1W-hb24LE?si=IpBGUhbrw2iCzMDT'),
  },
];
