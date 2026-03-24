/**
 * data/mathsChapters.ts
 * ─────────────────────────────────────────────────────
 * Maths syllabus chapters for AI Buddy — Std 4
 */

import { UnitEntry } from './englishUnits';

function extractYTId(url: string): string {
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  const long = url.match(/[?&]v=([^?&]+)/);
  if (long) return long[1];
  return '';
}

function createEntry(id: string, title: string, url: string): UnitEntry {
  return { id, title, url, embedId: extractYTId(url) };
}

export const mathsChapters: UnitEntry[] = [
  createEntry('ma_u1_1', 'Unit 1: Shapes Around Us - Page 1 to 4', 'https://youtu.be/2iHsrTTkVMw?si=2gBVBLZsMfjcwZ15'),
  createEntry('ma_u1_2', 'Unit 1: Shapes Around Us - Page 5 to 9', 'https://youtu.be/1_6-RFFhNPI?si=ew2HKREEOCXtn3cC'),
  createEntry('ma_u1_3', 'Unit 1: Shapes Around Us - Page 10 to 13', 'https://youtu.be/gZcV62y0Tmg?si=tlYD_LNBWcO_7uq6'),
  createEntry('ma_u1_4', 'Unit 1: Shapes Around Us - Page 14 to 19', 'https://youtu.be/x871UAPNT5E?si=0MKEVmhgIicS8l3T'),
  createEntry('ma_u1_5', 'Unit 1: Shapes Around Us - Page 19 to 21', 'https://youtu.be/Jsgwgkp9z4U?si=cSe4rMouYiW1OTGJ'),

  createEntry('ma_u2_1', 'Unit 2: Hide and Seek', 'https://youtu.be/ZQAeIpCASaY?si=wwPsxThJfPaIAOXi'),

  createEntry('ma_u3_1', 'Unit 3: Pattern Around Us', 'https://youtu.be/wV5GX68OtbQ?si=NnqMrsJrm-1hmdtz'),

  createEntry('ma_u4_1', 'Unit 4: Thousands Around Us - Part 1', 'https://youtu.be/GRIJbBBaA20?si=bAW9D-m6LkJqfOdK'),
  createEntry('ma_u4_2', 'Unit 4: Thousands Around Us - Part 2', 'https://youtu.be/xAPTSGx6hfE?si=OtNfeE8ziDYqept6'),
  createEntry('ma_u4_3', 'Unit 4: Thousands Around Us - Part 3', 'https://youtu.be/6DVmMzvAaCE?si=7T8A5I5c32CoKtTZ'),
  createEntry('ma_u4_4', 'Unit 4: Thousands Around Us - Part 4', 'https://youtu.be/28NSiM1RKAQ?si=1C1u0qGSGdvtDtII'),

  createEntry('ma_u5_1', 'Unit 5: Sharing and Measuring - Part 1', 'https://youtu.be/GUP-ppAfO8s?si=00f1O1wNYlApVMqY'),
  createEntry('ma_u5_2', 'Unit 5: Sharing and Measuring - Part 2', 'https://youtu.be/lSkI7mc7bWI?si=AAeSnRKADiOXXOt0'),

  createEntry('ma_u6_1', 'Unit 6: Measuring Length', 'https://youtu.be/3nkYIWwpRo4?si=mZ_9y2Wi2L_0s9Zc'),

  createEntry('ma_u7_1', 'Unit 7: The Cleanest Village', 'https://youtu.be/pVcOUTGNZzQ?si=DbhVr03E5HfbHxGz'),
  createEntry('ma_u8_1', 'Unit 8: Weigh it, Pour it', 'https://youtu.be/6cCzw_pbmfs?si=yGHGYNhGlJWRyf_3'),
  createEntry('ma_u9_1', 'Unit 9: Equal Groups', 'https://youtu.be/_ghsPinoZl0?si=rvupHZCAtsPsstDp'),
  createEntry('ma_u10_1', 'Unit 10: Elephants, Tigers, and Leopards', 'https://youtu.be/AWZ5ldSJICw?si=_vWksdITxWTQVxwq'),
  createEntry('ma_u11_1', 'Unit 11: Fun with Symmetry', 'https://youtu.be/sK1e2Nv8xKY?si=HiTYGuXpFN3208pG'),
  createEntry('ma_u12_1', 'Unit 12: Ticking Clocks and Turning Calendar', 'https://youtu.be/6k8BsTg2guk?si=6BK4ALi7fWHSqzDA'),
  createEntry('ma_u13_1', 'Unit 13: The Transport Museum', 'https://youtu.be/mct2t8lWJ-M?si=WUR2G__2I7Tei98S'),
  createEntry('ma_u14_1', 'Unit 14: Data Handling', 'https://youtu.be/vGyyxC9hCb4?si=yWdR2Mb5nnHkHyIr')
];
