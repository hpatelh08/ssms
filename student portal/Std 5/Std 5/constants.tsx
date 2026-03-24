
import { Badge, TextbookChunk, TeacherMessage, HomeworkItem } from './types';
import { PDF_KNOWLEDGE_BASE } from './data/knowledgeChunks';

export const INITIAL_BADGES: Badge[] = [
  { id: '1', name: 'First Step', icon: '🐣', description: 'Started your learning journey!' },
  { id: '2', name: 'Math Wizard', icon: '🔢', description: 'Completed 10 math puzzles.' },
  { id: '3', name: 'Word Master', icon: '📚', description: 'Found 50 English words.' },
  { id: '4', name: 'Early Bird', icon: '☀️', description: 'Logged in 3 days in a row.' },
];

export const INITIAL_HOMEWORK: HomeworkItem[] = [
  { id: 'hw1', title: 'Read Chapter 1 aloud', subject: 'English', isDone: false },
  { id: 'hw2', title: 'Practice adding numbers to 10', subject: 'Math', isDone: false },
  { id: 'hw3', title: 'Draw 3 circles and 2 squares', subject: 'Math', isDone: false }
];

/**
 * Knowledge base sourced from PDF textbooks.
 * 3200+ chunks auto-extracted from:
 *   • NCERT English Class 5
 *   • NCERT Hindi Class 5
 *   • NCERT Science Class 5
 */
export const INITIAL_KNOWLEDGE: TextbookChunk[] = PDF_KNOWLEDGE_BASE;

export const INITIAL_MESSAGES: TeacherMessage[] = [
  { id: '1', sender: 'Mrs. Smith', text: 'Great progress in phonics today! Remember to practice "A" and "B" sounds.', date: '2024-05-15' },
  { id: '2', sender: 'Principal Jones', text: 'School assembly this Friday at 9:00 AM. Wear your sports uniform.', date: '2024-05-14' }
];

export const SUBJECT_COLORS = {
  English: 'bg-orange-100 text-orange-600 border-orange-200',
  Math: 'bg-purple-100 text-purple-600 border-purple-200'
};
