/**
 * data/gujaratiChapters.ts
 * ─────────────────────────────────────────────────────
 * Gujarati syllabus units for AI Buddy — Std 4
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

export const gujaratiChapters: UnitEntry[] = [
    createEntry('gu_u1_1', 'Unit 1: તમે શું ખાશો? - Part 1', 'https://youtu.be/ZxhnVnJNuiM?si=I28XmGvVagNQOL7G'),
    createEntry('gu_u1_2', 'Unit 1: તમે શું ખાશો? - Part 2', 'https://youtu.be/J5QiJ6u7evc?si=56SZ64qqD30C1cDI'),
    createEntry('gu_u1_3', 'Unit 1: તમે શું ખાશો? - Part 3', 'https://youtu.be/2RnEEM0QJnQ?si=MZX5Oq3nR_-WmEPu'),
    createEntry('gu_u1_4', 'Unit 1: તમે શું ખાશો? - Part 4', 'https://youtu.be/xqU3fV18t8c?si=vBA1vWvfx788w6PZ'),

    createEntry('gu_u2_1', 'Unit 2: ચાંદો પાણીમાં કોરોકટ્ટ! - Part 1', 'https://youtu.be/bbwLfZYxMhw?si=lFtWadHPA_uLHOLS'),
    createEntry('gu_u2_2', 'Unit 2: ચાંદો પાણીમાં કોરોકટ્ટ! - Part 2', 'https://youtu.be/2VguIrmBZKI?si=PSl3danvPOicyJc-'),
    createEntry('gu_u2_3', 'Unit 2: ચાંદો પાણીમાં કોરોકટ્ટ! - Part 3', 'https://youtu.be/Xfxfx-4gaSc?si=5K6iAOqNy91_EJG7'),
    createEntry('gu_u2_4', 'Unit 2: ચાંદો પાણીમાં કોરોકટ્ટ! - Part 4', 'https://youtu.be/0jdzmEJPFQo?si=JY4f566QCIfKFNO3'),

    createEntry('gu_u3_1', 'Unit 3: ખારા દરિયામાં મારી હોડી - Part 1', 'https://youtu.be/aseFteM18tE?si=SucRK0Po293gsGHR'),
    createEntry('gu_u3_2', 'Unit 3: ખારા દરિયામાં મારી હોડી - Part 2', 'https://youtu.be/cWNbdNcf4xI?si=N03M_PbTd9iqvOop'),

    createEntry('gu_u4_1', 'Unit 4: પાઠશાળામાં રમે પતરંગો', 'https://youtu.be/QYNtXDk83nA?si=dPHAbjWDu-iOGAlg'),
    createEntry('gu_u5_1', 'Unit 5: ખીણમાં તારા : સાપુતારા', 'https://youtu.be/GhTJm11siRk?si=08g71LUc61KS_d_Y'),
    createEntry('gu_u6_1', 'Unit 6: તમનેય ચંદ્રક મળે', 'https://youtu.be/TaZ8pqNstv8?si=28_OFovwAHfGVKHg'),
    createEntry('gu_u7_1', 'Unit 7: આ પાઠનું નામ આવડે છે?', 'https://youtu.be/PRo3m9ZoSNA?si=VfMAp0Xj8xSVOzZ_'),
    createEntry('gu_u8_1', 'Unit 8: ઘર ઘર કી કહાની', 'https://youtu.be/dI4a6mBNxg4?si=Xfl6BlHc-CTHc3XH')
];
