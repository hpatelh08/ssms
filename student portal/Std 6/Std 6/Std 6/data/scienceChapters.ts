/**
 * data/scienceChapters.ts
 * Science syllabus chapters for Class 6 (Curiosity)
 */

export interface ScienceChapterEntry {
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

export const scienceChapters: ScienceChapterEntry[] = [
  { id: 'sc_ch1_wonderful_world', title: 'Unit 1: The Wonderful World of Science', url: 'https://youtu.be/6UomGsBw9BY?si=V7ZQ_6EPPC-gnqF4', embedId: extractYTId('https://youtu.be/6UomGsBw9BY?si=V7ZQ_6EPPC-gnqF4') },
  { id: 'sc_ch2_diversity_p1', title: 'Unit 2: Diversity in the Living World - Part 1', url: 'https://youtu.be/ZIMDXbmfoTA?si=HCCyr-ow5Em3y7yH', embedId: extractYTId('https://youtu.be/ZIMDXbmfoTA?si=HCCyr-ow5Em3y7yH') },
  { id: 'sc_ch2_diversity_p2', title: 'Unit 2: Diversity in the Living World - Part 2', url: 'https://youtu.be/gpKqQ2-pzYw?si=q4V8ycg7-yO_prlJ', embedId: extractYTId('https://youtu.be/gpKqQ2-pzYw?si=q4V8ycg7-yO_prlJ') },
  { id: 'sc_ch2_diversity_p3', title: 'Unit 2: Diversity in the Living World - Part 3', url: 'https://youtu.be/OfuaatS3SR4?si=YQgc2VDKGFFDkQhT', embedId: extractYTId('https://youtu.be/OfuaatS3SR4?si=YQgc2VDKGFFDkQhT') },
  { id: 'sc_ch2_diversity_p4', title: 'Unit 2: Diversity in the Living World - Part 4', url: 'https://youtu.be/ixFMiLw-c-o?si=53sPDRrV-eJlUhMd', embedId: extractYTId('https://youtu.be/ixFMiLw-c-o?si=53sPDRrV-eJlUhMd') },
  { id: 'sc_ch3_mindful_p1', title: 'Unit 3: Mindful Eating: A Path to a Healthy Body - Part 1', url: 'https://youtu.be/-izev_7VBQY?si=-fUND113YFPSWqow', embedId: extractYTId('https://youtu.be/-izev_7VBQY?si=-fUND113YFPSWqow') },
  { id: 'sc_ch3_mindful_p2', title: 'Unit 3: Mindful Eating: A Path to a Healthy Body - Part 2', url: 'https://youtu.be/TmW3eiDwOkA?si=3bhMxCGeDZiNHvjw', embedId: extractYTId('https://youtu.be/TmW3eiDwOkA?si=3bhMxCGeDZiNHvjw') },
  { id: 'sc_ch3_mindful_p3', title: 'Unit 3: Mindful Eating: A Path to a Healthy Body - Part 3', url: 'https://youtu.be/cz9EAm5ODUA?si=gEj4g-L6lex7-A_B', embedId: extractYTId('https://youtu.be/cz9EAm5ODUA?si=gEj4g-L6lex7-A_B') },
  { id: 'sc_ch4_magnets_p1', title: 'Unit 4: Exploring Magnets - Part 1', url: 'https://youtu.be/FjGeY5JxPOw?si=SFKJPTqarxwkwNO5', embedId: extractYTId('https://youtu.be/FjGeY5JxPOw?si=SFKJPTqarxwkwNO5') },
  { id: 'sc_ch4_magnets_p2', title: 'Unit 4: Exploring Magnets - Part 2', url: 'https://youtu.be/8u2LbF3SHTE?si=FdKIKgbuuGlQyIAN', embedId: extractYTId('https://youtu.be/8u2LbF3SHTE?si=FdKIKgbuuGlQyIAN') },
  { id: 'sc_ch5_measurement_p1', title: 'Unit 5: Measurement of Length and Motion - Part 1', url: 'https://youtu.be/YrcG1ebaeS4?si=AE5G7U38vLCY5kxm', embedId: extractYTId('https://youtu.be/YrcG1ebaeS4?si=AE5G7U38vLCY5kxm') },
  { id: 'sc_ch5_measurement_p2', title: 'Unit 5: Measurement of Length and Motion - Part 2', url: 'https://youtu.be/M9xSP3YIE6U?si=WTiqHiZM1AcVFwFr', embedId: extractYTId('https://youtu.be/M9xSP3YIE6U?si=WTiqHiZM1AcVFwFr') },
  { id: 'sc_ch6_materials_p1', title: 'Unit 6: Materials Around Us - Part 1', url: 'https://youtu.be/Y4mdNb90GKY?si=oakPiD7AS0Le_wcR', embedId: extractYTId('https://youtu.be/Y4mdNb90GKY?si=oakPiD7AS0Le_wcR') },
  { id: 'sc_ch6_materials_p2', title: 'Unit 6: Materials Around Us - Part 2', url: 'https://youtu.be/W7dmfDwbdtQ?si=Ya1VgQcTuDDMRqfI', embedId: extractYTId('https://youtu.be/W7dmfDwbdtQ?si=Ya1VgQcTuDDMRqfI') },
  { id: 'sc_ch6_materials_p3', title: 'Unit 6: Materials Around Us - Part 3', url: 'https://youtu.be/W8CU7MpAwcc?si=w2jC6yC38L3NmD0A', embedId: extractYTId('https://youtu.be/W8CU7MpAwcc?si=w2jC6yC38L3NmD0A') },
  { id: 'sc_ch7_temperature_p1', title: 'Unit 7: Temperature and its Measurement - Part 1', url: 'https://youtu.be/ix-Yk414ub8?si=F4a8MDevYlNu19SH', embedId: extractYTId('https://youtu.be/ix-Yk414ub8?si=F4a8MDevYlNu19SH') },
  { id: 'sc_ch7_temperature_p2', title: 'Unit 7: Temperature and its Measurement - Part 2', url: 'https://youtu.be/HzCdrLKF3VY?si=tRfYIVvBNKK1T76P', embedId: extractYTId('https://youtu.be/HzCdrLKF3VY?si=tRfYIVvBNKK1T76P') },
  { id: 'sc_ch7_temperature_p3', title: 'Unit 7: Temperature and its Measurement - Part 3', url: 'https://youtu.be/JbEHAm5Pbuo?si=9WJcOxehLvoke5DZ', embedId: extractYTId('https://youtu.be/JbEHAm5Pbuo?si=9WJcOxehLvoke5DZ') },
  { id: 'sc_ch8_water_p1', title: 'Unit 8: A Journey through States of Water - Part 1', url: 'https://youtu.be/NzEblAtA4jo?si=pbZFlZW60bcO5YiJ', embedId: extractYTId('https://youtu.be/NzEblAtA4jo?si=pbZFlZW60bcO5YiJ') },
  { id: 'sc_ch8_water_p2', title: 'Unit 8: A Journey through States of Water - Part 2', url: 'https://youtu.be/p5DwrzILLyk?si=5QzRqBUQD3w4J2IS', embedId: extractYTId('https://youtu.be/p5DwrzILLyk?si=5QzRqBUQD3w4J2IS') },
  { id: 'sc_ch8_water_p3', title: 'Unit 8: A Journey through States of Water - Part 3', url: 'https://youtu.be/iVH1Pig566c?si=PBjlzirRxXN8f6MI', embedId: extractYTId('https://youtu.be/iVH1Pig566c?si=PBjlzirRxXN8f6MI') },
  { id: 'sc_ch8_water_p4', title: 'Unit 8: A Journey through States of Water - Part 4', url: 'https://youtu.be/M_2jeVjkk64?si=VZ3lVtjk216pNnt_', embedId: extractYTId('https://youtu.be/M_2jeVjkk64?si=VZ3lVtjk216pNnt_') },
  { id: 'sc_ch9_separation_p1', title: 'Unit 9: Methods of Separation in Everyday Life - Part 1', url: 'https://youtu.be/DARa8IQYiWI?si=pXa2zlCXyXSXLkhz', embedId: extractYTId('https://youtu.be/DARa8IQYiWI?si=pXa2zlCXyXSXLkhz') },
  { id: 'sc_ch9_separation_p2', title: 'Unit 9: Methods of Separation in Everyday Life - Part 2', url: 'https://youtu.be/IjKJdfOmK1U?si=N3QKwcgOSCGNRkPW', embedId: extractYTId('https://youtu.be/IjKJdfOmK1U?si=N3QKwcgOSCGNRkPW') },
  { id: 'sc_ch9_separation_p3', title: 'Unit 9: Methods of Separation in Everyday Life - Part 3', url: 'https://youtu.be/cSNKdODaesc?si=tMgX3NLUqI82Q9IE', embedId: extractYTId('https://youtu.be/cSNKdODaesc?si=tMgX3NLUqI82Q9IE') },
  { id: 'sc_ch9_separation_p4', title: 'Unit 9: Methods of Separation in Everyday Life - Part 4', url: 'https://youtu.be/lHQAT40AaFQ?si=RNSqJuPXOHHX5LNN', embedId: extractYTId('https://youtu.be/lHQAT40AaFQ?si=RNSqJuPXOHHX5LNN') },
  { id: 'sc_ch9_separation_p5', title: 'Unit 9: Methods of Separation in Everyday Life - Part 5', url: 'https://youtu.be/mgBkjENfosE?si=JA5rtqfAinl481EC', embedId: extractYTId('https://youtu.be/mgBkjENfosE?si=JA5rtqfAinl481EC') },
  { id: 'sc_ch10_living_p1', title: 'Unit 10: Living Creatures: Exploring their Characteristics - Part 1', url: 'https://youtu.be/mO8zjYC5kLw?si=ValNbuamqcQfnpqc', embedId: extractYTId('https://youtu.be/mO8zjYC5kLw?si=ValNbuamqcQfnpqc') },
  { id: 'sc_ch10_living_p2', title: 'Unit 10: Living Creatures: Exploring their Characteristics - Part 2', url: 'https://youtu.be/FR1kRd02gAg?si=HDIGHWBj__VgOmYr', embedId: extractYTId('https://youtu.be/FR1kRd02gAg?si=HDIGHWBj__VgOmYr') },
  { id: 'sc_ch10_living_p3', title: 'Unit 10: Living Creatures: Exploring their Characteristics - Part 3', url: 'https://youtu.be/yNPvvZgh60k?si=QWG3FyeorV5NawoX', embedId: extractYTId('https://youtu.be/yNPvvZgh60k?si=QWG3FyeorV5NawoX') },
  { id: 'sc_ch10_living_p4', title: 'Unit 10: Living Creatures: Exploring their Characteristics - Part 4', url: 'https://youtu.be/TkJ3-qS4lt4?si=zkamvWj3BCrMKJ08', embedId: extractYTId('https://youtu.be/TkJ3-qS4lt4?si=zkamvWj3BCrMKJ08') },
  { id: 'sc_ch10_living_p5', title: 'Unit 10: Living Creatures: Exploring their Characteristics - Part 5', url: 'https://youtu.be/gAJuEmrv1mw?si=Lp_aQ5P9R0u24nnL', embedId: extractYTId('https://youtu.be/gAJuEmrv1mw?si=Lp_aQ5P9R0u24nnL') },
  { id: 'sc_ch11_nature_p1', title: "Unit 11: Nature's Treasures - Part 1", url: 'https://youtu.be/LLgs5g3OfDE?si=0iyjUe1odlS87CMH', embedId: extractYTId('https://youtu.be/LLgs5g3OfDE?si=0iyjUe1odlS87CMH') },
  { id: 'sc_ch11_nature_p2', title: "Unit 11: Nature's Treasures - Part 2", url: 'https://youtu.be/af220BBK4Os?si=KqVG_igKQitBekAd', embedId: extractYTId('https://youtu.be/af220BBK4Os?si=KqVG_igKQitBekAd') },
  { id: 'sc_ch11_nature_p3', title: "Unit 11: Nature's Treasures - Part 3", url: 'https://youtu.be/2LDc0MfEy3w?si=cRTV3j86Bhn3iHd5', embedId: extractYTId('https://youtu.be/2LDc0MfEy3w?si=cRTV3j86Bhn3iHd5') },
  { id: 'sc_ch11_nature_p4', title: "Unit 11: Nature's Treasures - Part 4", url: 'https://youtu.be/paXO2TIpIUQ?si=jf6rTC9nKgtT5sf7', embedId: extractYTId('https://youtu.be/paXO2TIpIUQ?si=jf6rTC9nKgtT5sf7') },
  { id: 'sc_ch11_nature_p5', title: "Unit 11: Nature's Treasures - Part 5", url: 'https://youtu.be/Rf5NnN7oi3U?si=FFQHH0Ywz09GYPGr', embedId: extractYTId('https://youtu.be/Rf5NnN7oi3U?si=FFQHH0Ywz09GYPGr') },
  { id: 'sc_ch12_beyond_p1', title: 'Unit 12: Beyond Earth - Part 1', url: 'https://youtu.be/o9SBjXeYMzE?si=WYEwYDzSrS9TEwKN', embedId: extractYTId('https://youtu.be/o9SBjXeYMzE?si=WYEwYDzSrS9TEwKN') },
  { id: 'sc_ch12_beyond_p2', title: 'Unit 12: Beyond Earth - Part 2', url: 'https://youtu.be/CPEptxedlOQ?si=Ng8h2TT464owgRkS', embedId: extractYTId('https://youtu.be/CPEptxedlOQ?si=Ng8h2TT464owgRkS') },
  { id: 'sc_ch12_beyond_p3', title: 'Unit 12: Beyond Earth - Part 3', url: 'https://youtu.be/iAmQFT8zfsE?si=D6Fk0xFKTfrcFoXw', embedId: extractYTId('https://youtu.be/iAmQFT8zfsE?si=D6Fk0xFKTfrcFoXw') },
];
