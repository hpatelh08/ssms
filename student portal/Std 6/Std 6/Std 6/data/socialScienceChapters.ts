/**
 * data/socialScienceChapters.ts
 * Social Science syllabus chapters for Class 6
 */

export interface SocialScienceChapterEntry {
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

export const socialScienceChapters: SocialScienceChapterEntry[] = [
  { id: 'ss_ch1_locating_p1', title: 'Unit 1: Locating Places on the Earth - Part 1', url: 'https://youtu.be/NNRHbzcCj7M?si=lf76S_zttWIIgQBX', embedId: extractYTId('https://youtu.be/NNRHbzcCj7M?si=lf76S_zttWIIgQBX') },
  { id: 'ss_ch1_locating_p2', title: 'Unit 1: Locating Places on the Earth - Part 2', url: 'https://youtu.be/P5JPYUE3yNU?si=zV5jjkJN6QiSiBU7', embedId: extractYTId('https://youtu.be/P5JPYUE3yNU?si=zV5jjkJN6QiSiBU7') },
  { id: 'ss_ch1_locating_p3', title: 'Unit 1: Locating Places on the Earth - Part 3', url: 'https://youtu.be/tajowD4rkIs?si=nnzaxgyppINRDR6y', embedId: extractYTId('https://youtu.be/tajowD4rkIs?si=nnzaxgyppINRDR6y') },
  { id: 'ss_ch1_locating_p4', title: 'Unit 1: Locating Places on the Earth - Part 4', url: 'https://youtu.be/vRwgXiYx0kA?si=mZFpaiYi9waOYIAe', embedId: extractYTId('https://youtu.be/vRwgXiYx0kA?si=mZFpaiYi9waOYIAe') },
  { id: 'ss_ch2_oceans_p1', title: 'Unit 2: Oceans and Continents - Part 1', url: 'https://youtu.be/SOrmVlz55BM?si=QFpNvJ4hGJBdOoKg', embedId: extractYTId('https://youtu.be/SOrmVlz55BM?si=QFpNvJ4hGJBdOoKg') },
  { id: 'ss_ch2_oceans_p2', title: 'Unit 2: Oceans and Continents - Part 2', url: 'https://youtu.be/CY9w9GbZh5c?si=0fBWvuN0YE9o91LJ', embedId: extractYTId('https://youtu.be/CY9w9GbZh5c?si=0fBWvuN0YE9o91LJ') },
  { id: 'ss_ch2_oceans_p3', title: 'Unit 2: Oceans and Continents - Part 3', url: 'https://youtu.be/bIKEc0uCOCs?si=hyrlLWMSFRR1pWAz', embedId: extractYTId('https://youtu.be/bIKEc0uCOCs?si=hyrlLWMSFRR1pWAz') },
  { id: 'ss_ch3_landforms_p1', title: 'Unit 3: Landforms and Life - Part 1', url: 'https://youtu.be/PrqAp1UquFI?si=UZke-DJx6GsNIZfo', embedId: extractYTId('https://youtu.be/PrqAp1UquFI?si=UZke-DJx6GsNIZfo') },
  { id: 'ss_ch3_landforms_p2', title: 'Unit 3: Landforms and Life - Part 2', url: 'https://youtu.be/ZKAsNyG682A?si=oxFCUvg7NeX7FE73', embedId: extractYTId('https://youtu.be/ZKAsNyG682A?si=oxFCUvg7NeX7FE73') },
  { id: 'ss_ch3_landforms_p3', title: 'Unit 3: Landforms and Life - Part 3', url: 'https://youtu.be/NUKL0zWnBw4?si=8Jz-o-5eC8TR7AK4', embedId: extractYTId('https://youtu.be/NUKL0zWnBw4?si=8Jz-o-5eC8TR7AK4') },
  { id: 'ss_ch3_landforms_p4', title: 'Unit 3: Landforms and Life - Part 4', url: 'https://youtu.be/XwHTtrZiFA8?si=PFHoorydN8xtubQL', embedId: extractYTId('https://youtu.be/XwHTtrZiFA8?si=PFHoorydN8xtubQL') },
  { id: 'ss_ch4_timeline_p1', title: 'Unit 4: Timeline and Sources of History - Part 1', url: 'https://youtu.be/d1r8WgTlpec?si=oKvP-fMWmwkg0z7o', embedId: extractYTId('https://youtu.be/d1r8WgTlpec?si=oKvP-fMWmwkg0z7o') },
  { id: 'ss_ch4_timeline_p2', title: 'Unit 4: Timeline and Sources of History - Part 2', url: 'https://youtu.be/JFiOG4kG9Bk?si=Bnw29MjqrvXcjgaN', embedId: extractYTId('https://youtu.be/JFiOG4kG9Bk?si=Bnw29MjqrvXcjgaN') },
  { id: 'ss_ch4_timeline_p3', title: 'Unit 4: Timeline and Sources of History - Part 3', url: 'https://youtu.be/1GysS_ryYAE?si=ZjEvVyzoooKPvhGD', embedId: extractYTId('https://youtu.be/1GysS_ryYAE?si=ZjEvVyzoooKPvhGD') },
  { id: 'ss_ch5_india_p1', title: 'Unit 5: India, That Is Bharat - Part 1', url: 'https://youtu.be/EkLD4YwIk60?si=2hsuMLwYFtGcBHec', embedId: extractYTId('https://youtu.be/EkLD4YwIk60?si=2hsuMLwYFtGcBHec') },
  { id: 'ss_ch5_india_p2', title: 'Unit 5: India, That Is Bharat - Part 2', url: 'https://youtu.be/ebErrfXTCfQ?si=ocwkS5hhX_bEOU52', embedId: extractYTId('https://youtu.be/ebErrfXTCfQ?si=ocwkS5hhX_bEOU52') },
  { id: 'ss_ch6_civilisation_p1', title: 'Unit 6: The Beginnings of Indian Civilisation - Part 1', url: 'https://youtu.be/E3DR_ZsJuEA?si=FuPhwoUGKD0l8YmY', embedId: extractYTId('https://youtu.be/E3DR_ZsJuEA?si=FuPhwoUGKD0l8YmY') },
  { id: 'ss_ch6_civilisation_p2', title: 'Unit 6: The Beginnings of Indian Civilisation - Part 2', url: 'https://youtu.be/LKIO5PhYaM0?si=YjOYGKPyD9lcX9vF', embedId: extractYTId('https://youtu.be/LKIO5PhYaM0?si=YjOYGKPyD9lcX9vF') },
  { id: 'ss_ch6_civilisation_p3', title: 'Unit 6: The Beginnings of Indian Civilisation - Part 3', url: 'https://youtu.be/jUdh8rkwf0Y?si=vILqqitCjsEu9MmG', embedId: extractYTId('https://youtu.be/jUdh8rkwf0Y?si=vILqqitCjsEu9MmG') },
  { id: 'ss_ch7_cultural_p1', title: "Unit 7: India's Cultural Roots - Part 1", url: 'https://youtu.be/NsVff3D2lXc?si=3vyGp5xSqWZrMIFX', embedId: extractYTId('https://youtu.be/NsVff3D2lXc?si=3vyGp5xSqWZrMIFX') },
  { id: 'ss_ch7_cultural_p2', title: "Unit 7: India's Cultural Roots - Part 2", url: 'https://youtu.be/DpC89SCEGYM?si=7mjw0B7mUzzk1xkq', embedId: extractYTId('https://youtu.be/DpC89SCEGYM?si=7mjw0B7mUzzk1xkq') },
  { id: 'ss_ch7_cultural_p3', title: "Unit 7: India's Cultural Roots - Part 3", url: 'https://youtu.be/7euIX5kXX7g?si=xINcr_pb-oaDys_D', embedId: extractYTId('https://youtu.be/7euIX5kXX7g?si=xINcr_pb-oaDys_D') },
  { id: 'ss_ch7_cultural_p4', title: "Unit 7: India's Cultural Roots - Part 4", url: 'https://youtu.be/Q5WtPoUPjGM?si=47bNt0e-YDKUif0x', embedId: extractYTId('https://youtu.be/Q5WtPoUPjGM?si=47bNt0e-YDKUif0x') },
  { id: 'ss_ch8_unity_p1', title: "Unit 8: Unity in Diversity, or 'Many in the One' - Part 1", url: 'https://youtu.be/vksFgH3OmGk?si=2CPmo1jpHBWdvXqa', embedId: extractYTId('https://youtu.be/vksFgH3OmGk?si=2CPmo1jpHBWdvXqa') },
  { id: 'ss_ch8_unity_p2', title: "Unit 8: Unity in Diversity, or 'Many in the One' - Part 2", url: 'https://youtu.be/td_sZZWCdbg?si=1u5TGVYqkEvYqyee', embedId: extractYTId('https://youtu.be/td_sZZWCdbg?si=1u5TGVYqkEvYqyee') },
  { id: 'ss_ch8_unity_p3', title: "Unit 8: Unity in Diversity, or 'Many in the One' - Part 3", url: 'https://youtu.be/I5QbF_sgQNQ?si=wSItZQ6R3esYlDTi', embedId: extractYTId('https://youtu.be/I5QbF_sgQNQ?si=wSItZQ6R3esYlDTi') },
  { id: 'ss_ch9_family_p1', title: 'Unit 9: Family and Community - Part 1', url: 'https://youtu.be/gVqs_8AGvO8?si=WhcAl6dmMvGgP6R0', embedId: extractYTId('https://youtu.be/gVqs_8AGvO8?si=WhcAl6dmMvGgP6R0') },
  { id: 'ss_ch9_family_p2', title: 'Unit 9: Family and Community - Part 2', url: 'https://youtu.be/naIR6mRBRZU?si=_0gVGxJGVHxnkFhI', embedId: extractYTId('https://youtu.be/naIR6mRBRZU?si=_0gVGxJGVHxnkFhI') },
  { id: 'ss_ch10_governance_p1', title: 'Unit 10: Grassroots Democracy — Part 1: Governance - Part 1', url: 'https://youtu.be/tYB70zBJYP8?si=C2mwrxuCEgA2hZMV', embedId: extractYTId('https://youtu.be/tYB70zBJYP8?si=C2mwrxuCEgA2hZMV') },
  { id: 'ss_ch10_governance_p2', title: 'Unit 10: Grassroots Democracy — Part 1: Governance - Part 2', url: 'https://youtu.be/ot_Tg0_80wM?si=6WT754mAJ0kXZ8Si', embedId: extractYTId('https://youtu.be/ot_Tg0_80wM?si=6WT754mAJ0kXZ8Si') },
  { id: 'ss_ch10_governance_p3', title: 'Unit 10: Grassroots Democracy — Part 1: Governance - Part 3', url: 'https://youtu.be/NIvuNdMbkfM?si=Gyu0Q5C0XsLsVsEC', embedId: extractYTId('https://youtu.be/NIvuNdMbkfM?si=Gyu0Q5C0XsLsVsEC') },
  { id: 'ss_ch11_rural_p1', title: 'Unit 11: Grassroots Democracy — Part 2: Local Government in Rural Areas - Part 1', url: 'https://youtu.be/B-ijHkS3_H8?si=bZn07hDT-pESzHCw', embedId: extractYTId('https://youtu.be/B-ijHkS3_H8?si=bZn07hDT-pESzHCw') },
  { id: 'ss_ch11_rural_p2', title: 'Unit 11: Grassroots Democracy — Part 2: Local Government in Rural Areas - Part 2', url: 'https://youtu.be/HPOz4lQzcuw?si=E1GTrGQyerFYmRX-', embedId: extractYTId('https://youtu.be/HPOz4lQzcuw?si=E1GTrGQyerFYmRX-') },
  { id: 'ss_ch12_urban_p1', title: 'Unit 12: Grassroots Democracy — Part 3: Local Government in Urban Areas - Part 1', url: 'https://youtu.be/lSVj9gs-DcE?si=D33iq1dCpUTjWXYT', embedId: extractYTId('https://youtu.be/lSVj9gs-DcE?si=D33iq1dCpUTjWXYT') },
  { id: 'ss_ch12_urban_p2', title: 'Unit 12: Grassroots Democracy — Part 3: Local Government in Urban Areas - Part 2', url: 'https://youtu.be/SKLu00DnfR4?si=e0TZObj8pj5f7P__', embedId: extractYTId('https://youtu.be/SKLu00DnfR4?si=e0TZObj8pj5f7P__') },
  { id: 'ss_ch13_value_p1', title: 'Unit 13: The Value of Work - Part 1', url: 'https://youtu.be/3Q8MCi8LbA8?si=5YXxFJO08LSX_aNv', embedId: extractYTId('https://youtu.be/3Q8MCi8LbA8?si=5YXxFJO08LSX_aNv') },
  { id: 'ss_ch13_value_p2', title: 'Unit 13: The Value of Work - Part 2', url: 'https://youtu.be/eNNp886LfAU?si=4Nxnf1lFLHxr9wiw', embedId: extractYTId('https://youtu.be/eNNp886LfAU?si=4Nxnf1lFLHxr9wiw') },
  { id: 'ss_ch13_value_p3', title: 'Unit 13: The Value of Work - Part 3', url: 'https://youtu.be/a4I-TgXYeCk?si=QK3GpmUSqEQqymQG', embedId: extractYTId('https://youtu.be/a4I-TgXYeCk?si=QK3GpmUSqEQqymQG') },
  { id: 'ss_ch14_economic_p1', title: 'Unit 14: Economic Activities Around Us - Part 1', url: 'https://youtu.be/yO_hWQ49VPg?si=97tVGakncTGtPIww', embedId: extractYTId('https://youtu.be/yO_hWQ49VPg?si=97tVGakncTGtPIww') },
  { id: 'ss_ch14_economic_p2', title: 'Unit 14: Economic Activities Around Us - Part 2', url: 'https://youtu.be/eSsEVG3ZNJQ?si=Srnmhbbf6k_bc8l5', embedId: extractYTId('https://youtu.be/eSsEVG3ZNJQ?si=Srnmhbbf6k_bc8l5') },
  { id: 'ss_ch14_economic_p3', title: 'Unit 14: Economic Activities Around Us - Part 3', url: 'https://youtu.be/u9RfLgOpco4?si=DaKwteqTDGGhF56K', embedId: extractYTId('https://youtu.be/u9RfLgOpco4?si=DaKwteqTDGGhF56K') },
];
