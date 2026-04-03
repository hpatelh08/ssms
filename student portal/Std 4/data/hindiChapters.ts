/**
 * data/hindiChapters.ts
 * ─────────────────────────────────────────────────────
 * Hindi syllabus units for AI Buddy — Std 4
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

export const hindiChapters: UnitEntry[] = [
    createEntry('hi_u1_1', 'Unit 1: चिड़िया का गीत', 'https://youtu.be/ZikEMVvHypU?si=BdIkw7--LDmq_N84'),
    createEntry('hi_u1_q1', 'Unit 1 Q&A (Part 1)', 'https://youtu.be/kzW0i5ENhKM?si=R_ccQcVUhgeN959A'),
    createEntry('hi_u1_q2', 'Unit 1 Q&A (Part 2)', 'https://youtu.be/uDDOGNa6j8s?si=6c5A7tuP1-fPkr2L'),

    createEntry('hi_u2_1', 'Unit 2: बगीचे का घोंघा', 'https://youtu.be/SKZ9BRhapW4?si=plXA-6_WWRTKQ2Dl'),
    createEntry('hi_u2_q1', 'Unit 2 Q&A', 'https://youtu.be/NaHxexauGhY?si=jDw49d6t9HeBTr-P'),

    createEntry('hi_u3_1', 'Unit 3: नीम', 'https://youtu.be/Gtjs7Z3s1ck?si=NjFdmvzMn_C5Rtoa'),
    createEntry('hi_u3_q1', 'Unit 3 Q&A', 'https://youtu.be/p5O4EbC8fIs?si=Lg4yZZFeTqKBKK7S'),

    createEntry('hi_u4_1', 'Unit 4: हमारा आहार', 'https://youtu.be/9j0Yy16yllU?si=uCeV4H3xRl4at-hs'),
    createEntry('hi_u4_q1', 'Unit 4 Q&A', 'https://youtu.be/OLbEGD1vh-8?si=bsFx39zbxA3dqmh6'),

    createEntry('hi_u5_1', 'Unit 5: आसमान गिरा', 'https://youtu.be/M17KfQlZINs?si=ioyByvTKMsRG90Mr'),
    createEntry('hi_u5_q1', 'Unit 5 Q&A', 'https://youtu.be/8w4MUUYACnU?si=LRzijxKiEFOFMJfC'),

    createEntry('hi_u6_1', 'Unit 6: जयपुर से पत्र', 'https://youtu.be/BRLXB35Hz_4?si=4Mp9IpsdtQ_PAAT7'),
    createEntry('hi_u6_q1', 'Unit 6 Q&A', 'https://youtu.be/cGyDanH-pXM?si=BMZcJLNeV2FYWyMc'),

    createEntry('hi_u7_1', 'Unit 7: नकली हीरे', 'https://youtu.be/z-VaqleKudA?si=-7MzDGB3RPCN8e0p'),
    createEntry('hi_u7_q1', 'Unit 7 Q&A', 'https://youtu.be/eNF4kD0_SJU?si=gkNxs3TwTeixTYoh'),

    createEntry('hi_u8_1', 'Unit 8: ओणम के रंग', 'https://youtu.be/-7sVcqhWk1s?si=BRc8hTe4CZ-vQ6fd'),
    createEntry('hi_u8_q1', 'Unit 8 Q&A', 'https://youtu.be/qIn-yUKD5NA?si=_6svFRjbWoC1opkL'),

    createEntry('hi_u9_1', 'Unit 9: मिठाइयों का सम्मेलन', 'https://youtu.be/Z4uw8FOsi5o?si=2nAvqAEp0yi8_Cm7'),
    createEntry('hi_u9_q1', 'Unit 9 Q&A', 'https://youtu.be/WO4TvOR5ILM?si=-QwgE2EKZyIJ0xa5'),

    createEntry('hi_u10_1', 'Unit 10: कैमरा', 'https://youtu.be/eynV529bqFM?si=T7fFMcd_05bXDwZE'),
    createEntry('hi_u10_q1', 'Unit 10 Q&A', 'https://youtu.be/vLQ4gc6kKBI?si=ZMYGG4M7CrpiogVz'),

    createEntry('hi_u11_1', 'Unit 11: कविता का कमाल', 'https://youtu.be/DNP1zXfvIV8?si=MGDXxe6wCU4BT-Hc'),
    createEntry('hi_u11_q1', 'Unit 11 Q&A', 'https://youtu.be/oUnGl8FkZjk?si=mNb8tkbubibdEKzL'),

    createEntry('hi_u12_1', 'Unit 12: शतरंज में मात', 'https://youtu.be/lOkjsOqMmAA?si=_jjzAPyMp77dNvv5'),
    createEntry('hi_u12_q1', 'Unit 12 Q&A', 'https://youtu.be/QWqby-cBWAg?si=H9jP451IgTnlrDP6'),

    createEntry('hi_u13_1', 'Unit 13: हमारा आदित्य', 'https://youtu.be/Jq6ROM5V0eU?si=IqlrCpGl6tlTE-o0'),
    createEntry('hi_u13_q1', 'Unit 13 Q&A', 'https://youtu.be/t7xqN11BX8o?si=EtxAutQWqiAw2EVi'),
];
