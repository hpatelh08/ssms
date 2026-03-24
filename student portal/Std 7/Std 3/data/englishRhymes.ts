/**
 * data/englishRhymes.ts
 * Std 7 English poem videos from the new provided list.
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
    id: 'eng_try_again_poem',
    title: 'Try Again (Poem)',
    url: 'https://www.youtube.com/watch?v=lyt90mR5a0w',
    embedId: extractYTId('https://www.youtube.com/watch?v=lyt90mR5a0w'),
    context: 'Std 7 English poem: Try Again.',
  },
  {
    id: 'eng_try_again_qa',
    title: 'Try Again (Poem) - Q&A',
    url: 'https://www.youtube.com/watch?v=MBoaOZkuUZ8',
    embedId: extractYTId('https://www.youtube.com/watch?v=MBoaOZkuUZ8'),
    context: 'Question-answer support for Try Again poem.',
  },
  {
    id: 'eng_funny_man_poem',
    title: 'A Funny Man (Poem)',
    url: 'https://www.youtube.com/watch?v=Pn6l40V1Hhk',
    embedId: extractYTId('https://www.youtube.com/watch?v=Pn6l40V1Hhk'),
    context: 'Std 7 English poem: A Funny Man.',
  },
  {
    id: 'eng_funny_man_qa',
    title: 'A Funny Man (Poem) - Q&A',
    url: 'https://www.youtube.com/watch?v=1qFBLIRNOV4',
    embedId: extractYTId('https://www.youtube.com/watch?v=1qFBLIRNOV4'),
    context: 'Question-answer support for A Funny Man poem.',
  },
  {
    id: 'eng_paper_boats_poem',
    title: 'Paper Boats (Poem)',
    url: 'https://www.youtube.com/watch?v=eFr-RbpDHew',
    embedId: extractYTId('https://www.youtube.com/watch?v=eFr-RbpDHew'),
    context: 'Std 7 English poem: Paper Boats.',
  },
  {
    id: 'eng_paper_boats_qa',
    title: 'Paper Boats (Poem) - Q&A',
    url: 'https://www.youtube.com/watch?v=NUgZJidAdm0',
    embedId: extractYTId('https://www.youtube.com/watch?v=NUgZJidAdm0'),
    context: 'Question-answer support for Paper Boats poem.',
  },
  {
    id: 'eng_travel_poem',
    title: 'Travel (Poem)',
    url: 'https://www.youtube.com/watch?v=_PKHBy-DN0M',
    embedId: extractYTId('https://www.youtube.com/watch?v=_PKHBy-DN0M'),
    context: 'Std 7 English poem: Travel.',
  },
  {
    id: 'eng_travel_qa',
    title: 'Travel (Poem) - Q&A',
    url: 'https://www.youtube.com/watch?v=yZWcvu6TZ8o',
    embedId: extractYTId('https://www.youtube.com/watch?v=yZWcvu6TZ8o'),
    context: 'Question-answer support for Travel poem.',
  },
  {
    id: 'eng_my_dear_poem',
    title: 'My Dear Soldiers (Poem)',
    url: 'https://www.youtube.com/watch?v=5IeBj3l86-g',
    embedId: extractYTId('https://www.youtube.com/watch?v=5IeBj3l86-g'),
    context: 'Std 7 English poem: My Dear Soldiers.',
  },
  {
    id: 'eng_my_dear_qa',
    title: 'My Dear Soldiers (Poem) - Q&A',
    url: 'https://www.youtube.com/watch?v=lqfmRfgLBr4',
    embedId: extractYTId('https://www.youtube.com/watch?v=lqfmRfgLBr4'),
    context: 'Question-answer support for My Dear Soldiers poem.',
  },
];
