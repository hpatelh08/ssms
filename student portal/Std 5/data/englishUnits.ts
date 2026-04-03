/**
 * data/englishUnits.ts
 * English syllabus units for AI Buddy - NCERT Marigold / Santoor Std 5
 * Each lesson has a YouTube video link + embed ID for inline player.
 */

export interface UnitEntry {
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

export const englishUnits: UnitEntry[] = [
  // Unit 1 — Let's Have Fun
  {
    id: 'unit1_ch1',
    title: "Unit 1 - Papa's Spectacles 👓",
    url: 'https://youtu.be/a7edy5J8ihk?si=nIKE2L7rqddmptZX',
    embedId: extractYTId('https://youtu.be/a7edy5J8ihk?si=nIKE2L7rqddmptZX'),
  },
  {
    id: 'unit1_ch2',
    title: 'Unit 1 - Gone with the Scooter 🛵',
    url: 'https://youtu.be/m3DGaWYUB60?si=JWDxbjDJG3Fbld5o',
    embedId: extractYTId('https://youtu.be/m3DGaWYUB60?si=JWDxbjDJG3Fbld5o'),
  },
  // Unit 2 — My Colourful World
  {
    id: 'unit2_ch3',
    title: 'Unit 2 - The Rainbow 🌈',
    url: 'https://youtu.be/EcOFwtgYj1Q',
    embedId: extractYTId('https://youtu.be/EcOFwtgYj1Q'),
  },
  {
    id: 'unit2_ch4',
    title: 'Unit 2 - The Wise Parrot 🦜',
    url: 'https://youtu.be/wME8kYe3Noo?si=9ieMlc9gFwyQkrOG',
    embedId: extractYTId('https://youtu.be/wME8kYe3Noo?si=9ieMlc9gFwyQkrOG'),
  },
  // Unit 3 — Water
  {
    id: 'unit3_ch5',
    title: 'Unit 3 - The Frog 🐸',
    url: 'https://youtu.be/Jua19hf-0XI?si=RP8KXWhhW30rW6kv',
    embedId: extractYTId('https://youtu.be/Jua19hf-0XI?si=RP8KXWhhW30rW6kv'),
  },
  {
    id: 'unit3_ch6',
    title: 'Unit 3 - What a Tank! 💧',
    url: 'https://youtu.be/QKnfgkvKwo0?si=hPGoJoSnfQ10vmy0',
    embedId: extractYTId('https://youtu.be/QKnfgkvKwo0?si=hPGoJoSnfQ10vmy0'),
  },
  // Unit 4 — Ups and Downs
  {
    id: 'unit4_ch7',
    title: 'Unit 4 - Gilli Danda 🏏',
    url: 'https://youtu.be/EnozmxSChb0?si=m1gFu5AAyRbk8kZN',
    embedId: extractYTId('https://youtu.be/EnozmxSChb0?si=m1gFu5AAyRbk8kZN'),
  },
  {
    id: 'unit4_ch8',
    title: 'Unit 4 - The Decision of the Panchayat ⚖️',
    url: 'https://youtu.be/t2NWg8cosTc?si=gItAqUbJ1lcKUg5b',
    embedId: extractYTId('https://youtu.be/t2NWg8cosTc?si=gItAqUbJ1lcKUg5b'),
  },
  // Unit 5 — Work is Worship
  {
    id: 'unit5_ch9',
    title: 'Unit 5 - Vocation 🙏',
    url: 'https://youtu.be/A0a4mHXJ8k0?si=32Fjuunvk9egNkJx',
    embedId: extractYTId('https://youtu.be/A0a4mHXJ8k0?si=32Fjuunvk9egNkJx'),
  },
  {
    id: 'unit5_ch10',
    title: 'Unit 5 - Glass Bangles 💜',
    url: 'https://youtu.be/AWAcu6e5eaE?si=hG8E1Rt1JHR18URM',
    embedId: extractYTId('https://youtu.be/AWAcu6e5eaE?si=hG8E1Rt1JHR18URM'),
  },
];
