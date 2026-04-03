/**
 * data/ncertChapters.ts
 * Chapter metadata used by Ask AI chapter suggestion chips.
 * English/Maths/Science chapters are aligned with STD 04/all subject chapter.txt.
 */

export type Subject = 'English' | 'Maths' | 'Hindi' | 'Gujarati' | 'Science';

export interface ChapterInfo {
  id: string;
  subject: Subject;
  chapter: number;
  name: string;
  context: string;
}

const englishChapters: ChapterInfo[] = [
  { id: 'en-1', subject: 'English', chapter: 1, name: 'Together We Can', context: 'Unit 1: My Land.' },
  { id: 'en-2', subject: 'English', chapter: 2, name: 'The Tinkling Bells', context: 'Unit 1: My Land.' },
  { id: 'en-3', subject: 'English', chapter: 3, name: 'Be Smart, Be Safe', context: 'Unit 1: My Land.' },
  { id: 'en-4', subject: 'English', chapter: 4, name: 'One Thing at a Time', context: 'Unit 2: My Beautiful World.' },
  { id: 'en-5', subject: 'English', chapter: 5, name: 'The Old Stag', context: 'Unit 2: My Beautiful World.' },
  { id: 'en-6', subject: 'English', chapter: 6, name: 'Braille', context: 'Unit 2: My Beautiful World.' },
  { id: 'en-7', subject: 'English', chapter: 7, name: 'Fit Body, Fit Mind, Fit Nation', context: 'Unit 3: Fun with Games.' },
  { id: 'en-8', subject: 'English', chapter: 8, name: 'The Lagori Champions', context: 'Unit 3: Fun with Games.' },
  { id: 'en-9', subject: 'English', chapter: 9, name: 'Hekko', context: 'Unit 3: Fun with Games.' },
  { id: 'en-10', subject: 'English', chapter: 10, name: 'The Swing', context: 'Unit 4: Up High.' },
  { id: 'en-11', subject: 'English', chapter: 11, name: 'A Journey to the Magical Mountains', context: 'Unit 4: Up High.' },
  { id: 'en-12', subject: 'English', chapter: 12, name: 'Maheshwar', context: 'Unit 4: Up High.' },
];

const mathsChapters: ChapterInfo[] = [
  { id: 'ma-1', subject: 'Maths', chapter: 1, name: 'Shapes Around Us', context: 'Unit 1.' },
  { id: 'ma-2', subject: 'Maths', chapter: 2, name: 'Hide and Seek', context: 'Unit 2.' },
  { id: 'ma-3', subject: 'Maths', chapter: 3, name: 'Pattern Around Us', context: 'Unit 3.' },
  { id: 'ma-4', subject: 'Maths', chapter: 4, name: 'Thousands Around Us', context: 'Unit 4.' },
  { id: 'ma-5', subject: 'Maths', chapter: 5, name: 'Sharing and Measuring', context: 'Unit 5.' },
  { id: 'ma-6', subject: 'Maths', chapter: 6, name: 'Measuring Length', context: 'Unit 6.' },
  { id: 'ma-7', subject: 'Maths', chapter: 7, name: 'The Cleanest Village', context: 'Unit 7.' },
  { id: 'ma-8', subject: 'Maths', chapter: 8, name: 'Weigh it, Pour it', context: 'Unit 8.' },
  { id: 'ma-9', subject: 'Maths', chapter: 9, name: 'Equal Groups', context: 'Unit 9.' },
  { id: 'ma-10', subject: 'Maths', chapter: 10, name: 'Elephants, Tigers, and Leopards', context: 'Unit 10.' },
  { id: 'ma-11', subject: 'Maths', chapter: 11, name: 'Fun with Symmetry', context: 'Unit 11.' },
  { id: 'ma-12', subject: 'Maths', chapter: 12, name: 'Ticking Clocks and Turning Calendar', context: 'Unit 12.' },
  { id: 'ma-13', subject: 'Maths', chapter: 13, name: 'The Transport Museum', context: 'Unit 13.' },
  { id: 'ma-14', subject: 'Maths', chapter: 14, name: 'Data Handling', context: 'Unit 14.' },
];

const hindiChapters: ChapterInfo[] = [
  { id: 'hi-1', subject: 'Hindi', chapter: 1, name: 'Chapter 1', context: 'Hindi chapter 1.' },
  { id: 'hi-2', subject: 'Hindi', chapter: 2, name: 'Chapter 2', context: 'Hindi chapter 2.' },
  { id: 'hi-3', subject: 'Hindi', chapter: 3, name: 'Chapter 3', context: 'Hindi chapter 3.' },
  { id: 'hi-4', subject: 'Hindi', chapter: 4, name: 'Chapter 4', context: 'Hindi chapter 4.' },
  { id: 'hi-5', subject: 'Hindi', chapter: 5, name: 'Chapter 5', context: 'Hindi chapter 5.' },
];

const gujaratiChapters: ChapterInfo[] = [
  { id: 'gu-1', subject: 'Gujarati', chapter: 1, name: 'Chapter 1', context: 'Gujarati chapter 1.' },
  { id: 'gu-2', subject: 'Gujarati', chapter: 2, name: 'Chapter 2', context: 'Gujarati chapter 2.' },
  { id: 'gu-3', subject: 'Gujarati', chapter: 3, name: 'Chapter 3', context: 'Gujarati chapter 3.' },
];

const scienceChapters: ChapterInfo[] = [
  { id: 'sci-1', subject: 'Science', chapter: 1, name: 'Living Together', context: 'Unit 1: Our Community.' },
  { id: 'sci-2', subject: 'Science', chapter: 2, name: 'Exploring Our Neighbourhood', context: 'Unit 1: Our Community.' },
  { id: 'sci-3', subject: 'Science', chapter: 3, name: 'Nature Trail', context: 'Unit 2: Life Around Us.' },
  { id: 'sci-4', subject: 'Science', chapter: 4, name: 'Growing up with Nature', context: 'Unit 2: Life Around Us.' },
  { id: 'sci-5', subject: 'Science', chapter: 5, name: 'Food for Health', context: 'Unit 3: Health and Well-being.' },
  { id: 'sci-6', subject: 'Science', chapter: 6, name: 'Happy and Healthy Living', context: 'Unit 3: Health and Well-being.' },
  { id: 'sci-7', subject: 'Science', chapter: 7, name: 'How Things Work', context: 'Unit 4: Things Around Us.' },
  { id: 'sci-8', subject: 'Science', chapter: 8, name: 'How Things are Made', context: 'Unit 4: Things Around Us.' },
  { id: 'sci-9', subject: 'Science', chapter: 9, name: 'Different Lands, Different Lives', context: 'Unit 5: Our Environment.' },
  { id: 'sci-10', subject: 'Science', chapter: 10, name: 'Our Sky', context: 'Unit 5: Our Environment.' },
];

export const CHAPTER_DATA: Record<Subject, ChapterInfo[]> = {
  English: englishChapters,
  Maths: mathsChapters,
  Hindi: hindiChapters,
  Gujarati: gujaratiChapters,
  Science: scienceChapters,
};

export const ALL_CHAPTERS: ChapterInfo[] = [
  ...englishChapters,
  ...mathsChapters,
  ...hindiChapters,
  ...gujaratiChapters,
  ...scienceChapters,
];
