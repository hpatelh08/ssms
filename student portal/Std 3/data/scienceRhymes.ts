/**
 * data/scienceRhymes.ts
 * Science (EVS) rhyme / song videos for AI Buddy - Class 3
 * Aligned with NCERT Looking Around Class 3 topics.
 */

export interface RhymeEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
  context: string;
}

function extractYTId(url: string): string {
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  const long = url.match(/[?&]v=([^?&]+)/);
  if (long) return long[1];
  return '';
}

export const scienceRhymes: RhymeEntry[] = [
  {
    id: 'living_nonliving',
    title: 'Living & Non-living Song 🌱',
    url: 'https://youtu.be/BlCycQVdDDM?si=9a8QGULoQKJH1gys',
    embedId: extractYTId('https://youtu.be/BlCycQVdDDM?si=9a8QGULoQKJH1gys'),
    context: 'Characteristics of living things - grow, breathe, need food, move. Differences from non-living for Class 3.',
  },
  {
    id: 'bird_features',
    title: 'Birds - Beaks & Claws Song 🦅',
    url: 'https://youtu.be/GPPV10wDNHA?si=5U8Aq9tKmSwpXzME',
    embedId: extractYTId('https://youtu.be/GPPV10wDNHA?si=5U8Aq9tKmSwpXzME'),
    context: 'Different types of beaks and claws. How birds eat, scratch, hold things. Adaptations for Class 3.',
  },
  {
    id: 'our_body',
    title: 'Our Body Parts Song 💪',
    url: 'https://youtu.be/_9UG0g9YOR8?si=o855ZuEus6D6nVQt',
    embedId: extractYTId('https://youtu.be/_9UG0g9YOR8?si=o855ZuEus6D6nVQt'),
    context: 'External and internal body parts. Functions of organs - heart, lungs, stomach. Sense organs for Class 3.',
  },
  {
    id: 'food_groups',
    title: 'Food Groups Song 🥕',
    url: 'https://youtu.be/brKhjZS_Nnw?si=qctAqaGx8jHIB7uI',
    embedId: extractYTId('https://youtu.be/brKhjZS_Nnw?si=qctAqaGx8jHIB7uI'),
    context: 'Energy-giving, body-building, protective foods. Balanced diet, nutrients for Class 3.',
  },
  {
    id: 'water_cycle',
    title: 'Water Cycle Song 💧',
    url: 'https://youtu.be/TWb4KlM2vts?si=drDXZEg13qjIbNIp',
    embedId: extractYTId('https://youtu.be/TWb4KlM2vts?si=drDXZEg13qjIbNIp'),
    context: 'Evaporation, condensation, precipitation. Clouds, rain, rivers, seas. Water conservation for Class 3.',
  },
  {
    id: 'solar_system',
    title: 'Our Solar System Song 🌍',
    url: 'https://youtu.be/F2prtmPEjOc?si=Hmab11NuWTLz2G3a',
    embedId: extractYTId('https://youtu.be/F2prtmPEjOc?si=Hmab11NuWTLz2G3a'),
    context: '8 planets, sun, moon. Day and night, seasons, stars. Basic astronomy for Class 3.',
  },
];
