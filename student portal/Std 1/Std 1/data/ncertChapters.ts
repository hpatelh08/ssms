/**
 * data/ncertChapters.ts
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * NCERT Class 1 chapter data for English (Marigold) and
 * Maths (Math-Magic). Each entry maps to a YouTube video
 * link & textbook context reference for the AI assistant.
 */

export type Subject = 'English' | 'Maths';

export interface ChapterInfo {
  id: string;
  subject: Subject;
  chapter: number;
  name: string;
  /** Short textbook context hint sent to Groq for grounding */
  context: string;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ENGLISH â€” NCERT Marigold Class 1
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const englishChapters: ChapterInfo[] = [
  {
    id: 'en-1',
    subject: 'English',
    chapter: 1,
    name: 'A Happy Child',
    context: 'Poem about a happy child enjoying nature â€” swinging, flowers, birds. Teaches simple adjectives and rhyming words.',
  },
  {
    id: 'en-2',
    subject: 'English',
    chapter: 2,
    name: 'Three Little Pigs',
    context: 'Story of three pigs building houses of straw, sticks, and bricks. Teaches sequencing, action words, and moral lessons.',
  },
  {
    id: 'en-3',
    subject: 'English',
    chapter: 3,
    name: 'After a Bath',
    context: 'Poem about a child drying with a towel after a bath. Body parts vocabulary, daily routines, rhyming patterns.',
  },
  {
    id: 'en-4',
    subject: 'English',
    chapter: 4,
    name: 'The Bubble, the Straw and the Shoe',
    context: 'Story about a bubble, straw, and shoe crossing a river. Teaches cooperation, simple dialogue, and descriptive words.',
  },
  {
    id: 'en-5',
    subject: 'English',
    chapter: 5,
    name: 'One Little Kitten',
    context: 'Poem about counting kittens and puppies. Teaches numbers 1-10, animal names, and rhyming.',
  },
  {
    id: 'en-6',
    subject: 'English',
    chapter: 6,
    name: 'Lalu and Peelu',
    context: 'Story about two parrots, one red (Lalu) and one yellow (Peelu). Teaches colours, food items, and simple sentences.',
  },
  {
    id: 'en-7',
    subject: 'English',
    chapter: 7,
    name: 'Once I Saw a Little Bird',
    context: 'Poem about watching a bird hop and fly. Past tense introduction, action verbs (hop, fly, sit), rhyming.',
  },
  {
    id: 'en-8',
    subject: 'English',
    chapter: 8,
    name: 'Mittu and the Yellow Mango',
    context: 'Story about a parrot wanting a yellow mango. Teaches colours, fruits, naming words, and question words.',
  },
  {
    id: 'en-9',
    subject: 'English',
    chapter: 9,
    name: 'Merry-Go-Round',
    context: 'Poem about riding a merry-go-round. Circular motion, describing feelings (happy, dizzy), rhyming.',
  },
  {
    id: 'en-10',
    subject: 'English',
    chapter: 10,
    name: 'Circle',
    context: 'Poem about circles in everyday objects â€” sun, moon, wheel. Shapes in real life, observation skills.',
  },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MATHS â€” NCERT Math-Magic Class 1
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const mathsChapters: ChapterInfo[] = [
  {
    id: 'ma-1',
    subject: 'Maths',
    chapter: 1,
    name: 'Shapes and Space',
    context: 'Identifying shapes â€” circle, triangle, rectangle, square. Spatial concepts â€” inside, outside, above, below.',
  },
  {
    id: 'ma-2',
    subject: 'Maths',
    chapter: 2,
    name: 'Numbers from One to Nine',
    context: 'Counting 1-9, number names, matching quantities to numbers, writing numerals, before-after concepts.',
  },
  {
    id: 'ma-3',
    subject: 'Maths',
    chapter: 3,
    name: 'Addition',
    context: 'Adding numbers up to 9. Using objects, fingers, pictures. The plus (+) sign. Simple word problems.',
  },
  {
    id: 'ma-4',
    subject: 'Maths',
    chapter: 4,
    name: 'Subtraction',
    context: 'Taking away from groups up to 9. The minus (âˆ’) sign. Simple subtraction stories.',
  },
  {
    id: 'ma-5',
    subject: 'Maths',
    chapter: 5,
    name: 'Numbers from Ten to Twenty',
    context: 'Teen numbers 10-20, place value introduction (tens & ones), number line, counting on from 10.',
  },
  {
    id: 'ma-6',
    subject: 'Maths',
    chapter: 6,
    name: 'Time',
    context: 'Daily routine and time â€” morning, afternoon, evening, night. Days of the week. Sequencing events.',
  },
  {
    id: 'ma-7',
    subject: 'Maths',
    chapter: 7,
    name: 'Measurement',
    context: 'Comparing lengths â€” longer, shorter, taller. Comparing weights â€” heavier, lighter. Non-standard units.',
  },
  {
    id: 'ma-8',
    subject: 'Maths',
    chapter: 8,
    name: 'Numbers from Twenty-one to Fifty',
    context: 'Counting 21-50, tens and ones, skip counting by 2s and 5s, number patterns.',
  },
  {
    id: 'ma-9',
    subject: 'Maths',
    chapter: 9,
    name: 'Data Handling',
    context: 'Collecting simple data, making groups, counting and recording, pictograph introduction.',
  },
  {
    id: 'ma-10',
    subject: 'Maths',
    chapter: 10,
    name: 'Patterns',
    context: 'Repeating patterns with shapes, colours, numbers. Identifying what comes next. Creating own patterns.',
  },
  {
    id: 'ma-11',
    subject: 'Maths',
    chapter: 11,
    name: 'Numbers',
    context: 'Numbers up to 100. Place value (tens and ones), comparing numbers (greater/smaller), ordering.',
  },
  {
    id: 'ma-12',
    subject: 'Maths',
    chapter: 12,
    name: 'Money',
    context: 'Indian coins and notes, identifying denominations, simple buying-selling, adding small amounts.',
  },
  {
    id: 'ma-13',
    subject: 'Maths',
    chapter: 13,
    name: 'How Many',
    context: 'Counting in real-life situations, story sums using addition and subtraction, consolidation of concepts.',
  },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   COMBINED
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export const CHAPTER_DATA: Record<Subject, ChapterInfo[]> = {
  English: englishChapters,
  Maths: mathsChapters,
};

export const ALL_CHAPTERS: ChapterInfo[] = [...englishChapters, ...mathsChapters];
