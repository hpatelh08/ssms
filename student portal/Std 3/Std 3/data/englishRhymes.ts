/**
 * data/englishRhymes.ts
 * English rhyme / poem videos for AI Buddy - Class 3
 * Aligned with NCERT Marigold Class 3 poems and age-appropriate content.
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

export const englishRhymes: RhymeEntry[] = [
  {
    id: 'my_school',
    title: 'My School 🏫',
    url: 'https://youtu.be/EFYhL_9APBc?si=JMeefSEqxgRS_8zQ',
    embedId: extractYTId('https://youtu.be/EFYhL_9APBc?si=JMeefSEqxgRS_8zQ'),
    context: 'Poem about creativity - making something beautiful from waste. Vocabulary: scraps, leftover, create, design, colorful for Class 3.',
  },
  {
    id: 'bird_talk',
    title: 'Bird Talk Poem 🦜',
    url: 'https://youtu.be/GbiJGDyy_PE?si=VytBvjaWG7tvJryf',
    embedId: extractYTId('https://youtu.be/GbiJGDyy_PE?si=VytBvjaWG7tvJryf'),
    context: 'Poem where birds talk about human habits. Rhyming words, conversation style, opposites (grow/walk, sing/wing) for Class 3.',
  },
  {
    id: 'little_by_little',
    title: 'Little by Little Poem 🌳',
    url: 'https://youtu.be/UJyQfhPGldY?si=HYSv05kfRuVXJ14F',
    embedId: extractYTId('https://youtu.be/UJyQfhPGldY?si=HYSv05kfRuVXJ14F'),
    context: 'Growth of an acorn to oak tree. Vocabulary: acorn, oak, mighty, patient, nature\'s cycle for Class 3.',
  },
  {
    id: 'sea_song',
    title: 'Sea Song Poem 🌊',
    url: 'https://youtu.be/-IsIkAYWY2Y?si=iluh9ABy4qYaxWiF',
    embedId: extractYTId('https://youtu.be/-IsIkAYWY2Y?si=iluh9ABy4qYaxWiF'),
    context: 'Magical poem about finding a seashell that sings. Vocabulary: shell, ocean, waves, whisper, echo, wonder for Class 3.',
  },
  {
    id: 'balloon_man',
    title: 'The Balloon Man Poem 🎈',
    url: 'https://youtu.be/u_OMiPIE5Qg?si=SIrtKmKa97683xdu',
    embedId: extractYTId('https://youtu.be/u_OMiPIE5Qg?si=SIrtKmKa97683xdu'),
    context: 'Poem about a balloon seller in the market. Vocabulary: market, colourful, floating, prices, children\'s joy for Class 3.',
  },
  {
    id: 'trains_poem',
    title: 'Trains Poem 🚂',
    url: 'https://youtu.be/Djzv57hTdfE?si=MjjO9MZ2a7OSr3qC',
    embedId: extractYTId('https://youtu.be/Djzv57hTdfE?si=MjjO9MZ2a7OSr3qC'),
    context: 'Poem about railways and travel. Vocabulary: engine, carriage, tunnel, bridge, station, journey, far-off places for Class 3.',
  },
];
