/**
 * data/scienceChapters.ts
 * ─────────────────────────────────────────────────────
 * Science syllabus units for AI Buddy — Std 4
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

export const scienceChapters: UnitEntry[] = [
    createEntry('sci_ch1', 'Chapter 1: Living Together', 'https://youtu.be/K3BI-y1s5pQ?si=_01YdVohca1WJzSN'),
    createEntry('sci_ch2', 'Chapter 2: Exploring Our Neighbourhood', 'https://youtu.be/NDT5O4hGj8U?si=9pU2BSs5Z1gKcNBg'),
    createEntry('sci_ch3', 'Chapter 3: Nature Trail', 'https://youtu.be/l5tPJL2nLtA?si=HiLpXWZhQ6RlovRN'),
    createEntry('sci_ch4', 'Chapter 4: Growing up with Nature', 'https://youtu.be/NLOXTXBXdCs?si=aHrri6CibbJqSD-J'),
    createEntry('sci_ch5', 'Chapter 5: Food for Health', 'https://youtu.be/Po453Fz8zqY?si=OjXjXTXACbJF6sVO'),
    createEntry('sci_ch6', 'Chapter 6: Happy and Healthy Living', 'https://youtu.be/aZDReE7NC5Y?si=7s8Aey5S0ERwPCyz'),
    createEntry('sci_ch7', 'Chapter 7: How Things Work', 'https://youtu.be/eCpS88ioREU?si=saNhA2F6QftVFXe_'),
    createEntry('sci_ch8', 'Chapter 8: How Things are Made', 'https://youtu.be/VpFY72ldDAE?si=BL2RmU86dZbTGTPH'),
    createEntry('sci_ch9', 'Chapter 9: Different Lands, Different Lives', 'https://youtu.be/QZdQrnEqN7I?si=MjyO6nLpo9Vy-Mzt'),
    createEntry('sci_ch10', 'Chapter 10: Our Sky', 'https://youtu.be/3FKvuUZDUJ4?si=5b9zrpVplyA1B70l')
];
