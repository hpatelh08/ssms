/**
 * services/chapterIntelligence.ts
 * ─────────────────────────────────────────────────────
 * AI-powered chapter intelligence: summaries, keywords,
 * practice questions, quizzes, and chapter-scoped chat.
 *
 * Uses the existing Groq API (llama-3.3-70b) with grounded
 * context from the vector store.
 */

import { searchKnowledge, getVectorStoreStatus } from './vectorStore';
import type { TextbookChunk } from '../types';
import type { BookEntry, BookChapter } from '../data/bookConfig';

// ─── Groq API Config ─────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getGroqApiKey(): string {
  return process.env.GROQ_API_KEY || '';
}

// ─── Types ────────────────────────────────────────────────

export interface ChapterSummary {
  summary: string;
  keyPoints: string[];
  vocabulary: string[];
}

export interface ChapterKeywords {
  keywords: { word: string; meaning: string }[];
}

export interface PracticeQuestion {
  question: string;
  answer: string;
  hint?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChapterAIResponse {
  answer: string;
  sources: { chapter: string; page: number; snippet: string }[];
}

// ─── Cache ────────────────────────────────────────────────

const CACHE_PREFIX = 'ssms_chapter_ai_';

function getCacheKey(bookId: string, chapterId: string, type: string): string {
  return `${CACHE_PREFIX}${bookId}_${chapterId}_${type}`;
}

function getFromCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Cache expires after 24 hours
    if (Date.now() - data._ts > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return data.value as T;
  } catch { return null; }
}

function setCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ value, _ts: Date.now() }));
  } catch { /* ignore */ }
}

// ─── Helpers ──────────────────────────────────────────────

async function getChapterContext(
  book: BookEntry,
  chapter: BookChapter,
  maxChunks: number = 8
): Promise<TextbookChunk[]> {
  const status = getVectorStoreStatus();
  if (!status.initialized || status.chunkCount === 0) return [];

  // Search with chapter title as query, filtered to chapter
  const results = await searchKnowledge(
    `${chapter.name} ${book.subject}`,
    maxChunks,
    undefined,
    0.005,
    chapter.name
  );

  if (results.length < 2) {
    // Relaxed search without chapter filter but with book subject
    const relaxed = await searchKnowledge(
      chapter.name,
      maxChunks,
      book.subject as any,
      0.001
    );
    return relaxed.map(r => r.chunk);
  }

  return results.map(r => r.chunk);
}

function buildContextString(chunks: TextbookChunk[]): string {
  return chunks.map((c, i) =>
    `[Source ${i + 1}: ${c.subject}, Chapter: "${c.chapter}", Page ${c.page}]\n${c.content}`
  ).join('\n\n---\n\n');
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) throw new Error('No Groq API key configured');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
}

// ─── Chapter Summary ──────────────────────────────────────

export async function getChapterSummary(
  book: BookEntry,
  chapter: BookChapter
): Promise<ChapterSummary> {
  const cacheKey = getCacheKey(book.id, chapter.id, 'summary');
  const cached = getFromCache<ChapterSummary>(cacheKey);
  if (cached) return cached;

  const chunks = await getChapterContext(book, chapter);
  if (chunks.length === 0) {
    return {
      summary: 'No content found for this chapter. Please ensure the book has been indexed.',
      keyPoints: [],
      vocabulary: [],
    };
  }

  const context = buildContextString(chunks);

  const systemPrompt = `You are a Class 5 teacher creating a chapter summary for parents.
ONLY use the textbook context provided. Do NOT add outside information.
Return a JSON object with:
- "summary": A clear 3-5 sentence summary of the chapter content
- "keyPoints": Array of 4-6 key learning points from this chapter
- "vocabulary": Array of 5-8 important words/terms from this chapter`;

  const raw = await callGroq(systemPrompt, `TEXTBOOK CONTEXT:\n${context}\n\nChapter: "${chapter.name}" from "${book.title}"\n\nCreate a summary.`);
  const result = JSON.parse(raw) as ChapterSummary;

  setCache(cacheKey, result);
  return result;
}

// ─── Chapter Keywords ─────────────────────────────────────

export async function getChapterKeywords(
  book: BookEntry,
  chapter: BookChapter
): Promise<ChapterKeywords> {
  const cacheKey = getCacheKey(book.id, chapter.id, 'keywords');
  const cached = getFromCache<ChapterKeywords>(cacheKey);
  if (cached) return cached;

  const chunks = await getChapterContext(book, chapter);
  if (chunks.length === 0) {
    return { keywords: [] };
  }

  const context = buildContextString(chunks);

  const systemPrompt = `You are a Class 5 teacher. Extract important keywords from this chapter.
ONLY use the textbook context provided.
Return a JSON object with:
- "keywords": Array of objects with "word" (the keyword) and "meaning" (simple definition a 6-year-old can understand)
Include 8-12 keywords.`;

  const raw = await callGroq(systemPrompt, `TEXTBOOK CONTEXT:\n${context}\n\nChapter: "${chapter.name}"\n\nExtract keywords.`);
  const result = JSON.parse(raw) as ChapterKeywords;

  setCache(cacheKey, result);
  return result;
}

// ─── Practice Questions ───────────────────────────────────

export async function getPracticeQuestions(
  book: BookEntry,
  chapter: BookChapter
): Promise<PracticeQuestion[]> {
  const cacheKey = getCacheKey(book.id, chapter.id, 'practice');
  const cached = getFromCache<PracticeQuestion[]>(cacheKey);
  if (cached) return cached;

  const chunks = await getChapterContext(book, chapter);
  if (chunks.length === 0) return [];

  const context = buildContextString(chunks);

  const systemPrompt = `You are a Class 5 teacher creating practice questions.
ONLY base questions on the textbook context provided.
Return a JSON object with:
- "questions": Array of 6-8 objects with:
  - "question": A simple question for a 6-7 year old
  - "answer": The correct answer (1-2 sentences)
  - "hint": An optional hint to help the child`;

  const raw = await callGroq(systemPrompt, `TEXTBOOK CONTEXT:\n${context}\n\nChapter: "${chapter.name}" from "${book.title}"\n\nCreate practice questions.`);
  const data = JSON.parse(raw);
  const result = data.questions || [];

  setCache(cacheKey, result);
  return result;
}

// ─── Quiz Questions ───────────────────────────────────────

export async function getQuizQuestions(
  book: BookEntry,
  chapter: BookChapter
): Promise<QuizQuestion[]> {
  const cacheKey = getCacheKey(book.id, chapter.id, 'quiz');
  const cached = getFromCache<QuizQuestion[]>(cacheKey);
  if (cached) return cached;

  const chunks = await getChapterContext(book, chapter);
  if (chunks.length === 0) return [];

  const context = buildContextString(chunks);

  const systemPrompt = `You are a Class 5 teacher creating a multiple-choice quiz.
ONLY base questions on the textbook context provided.
Return a JSON object with:
- "questions": Array of 5 objects with:
  - "question": A simple question for a 6-7 year old
  - "options": Array of exactly 4 answer choices
  - "correctIndex": Index (0-3) of the correct answer
  - "explanation": Brief explanation why the answer is correct`;

  const raw = await callGroq(systemPrompt, `TEXTBOOK CONTEXT:\n${context}\n\nChapter: "${chapter.name}"\n\nCreate a quiz.`);
  const data = JSON.parse(raw);
  const result = data.questions || [];

  setCache(cacheKey, result);
  return result;
}

// ─── Chapter-Scoped AI Chat ───────────────────────────────

export async function askChapterAI(
  book: BookEntry,
  chapter: BookChapter,
  question: string,
  childMode = false
): Promise<ChapterAIResponse> {
  const chunks = await getChapterContext(book, chapter, 6);

  if (chunks.length === 0) {
    return {
      answer: `I couldn't find content for "${chapter.name}" in the indexed books. Please make sure the book has been processed.`,
      sources: [],
    };
  }

  const context = buildContextString(chunks);

  const tone = childMode
    ? `You are a super friendly, fun AI buddy talking to a 6-year-old child.
Use very simple words, short sentences, lots of emojis, and a storytelling tone.
If the child asks "why?" explain with an example from the chapter, like telling a little story.
Use phrases like "Great question! 🌟" and "Let me tell you..."
NEVER use difficult words. Keep answers to 2-3 short paragraphs max.`
    : `You are a friendly Class 5 AI teacher. A parent is asking about chapter "${chapter.name}" from "${book.title}".
Be warm, encouraging, and explain simply.
Keep responses under 4 paragraphs.`;

  const systemPrompt = `${tone}

STRICT RULES:
1. ONLY use information from the TEXTBOOK CONTEXT below.
2. If the answer is not in the context, say "This isn't covered in this chapter."

CONTEXT INFO:
- Book: "${book.title}"
- Chapter: "${chapter.name}"
- Subject: ${book.subject}
- Grade: Class 5 (Standard 5)

Return a JSON object with:
- "answer": Your helpful response
- "sources": Array of objects with "chapter", "page" (number), and "snippet" (brief quote from the context you used)`;

  const raw = await callGroq(systemPrompt, `TEXTBOOK CONTEXT:\n${context}\n\nQuestion: ${question}`);
  return JSON.parse(raw) as ChapterAIResponse;
}

// ─── Learn Mode Content ───────────────────────────────────

export interface LearnContent {
  sections: {
    type: 'story' | 'poem' | 'activity' | 'wordplay' | 'conversation' | 'introduction';
    title: string;
    content: string;
    emoji: string;
  }[];
  funFacts: string[];
}

export async function getLearnContent(
  book: BookEntry,
  chapter: BookChapter
): Promise<LearnContent> {
  const cacheKey = getCacheKey(book.id, chapter.id, 'learn');
  const cached = getFromCache<LearnContent>(cacheKey);
  if (cached) return cached;

  const chunks = await getChapterContext(book, chapter, 10);
  if (chunks.length === 0) {
    return { sections: [{ type: 'introduction', title: chapter.name, content: 'No content found. Please index the book first.', emoji: '📖' }], funFacts: [] };
  }

  const context = buildContextString(chunks);

  const systemPrompt = `You are a Class 5 teacher preparing a fun, engaging lesson for a 6-year-old.
Break the chapter content into bite-sized learning sections.
ONLY use the textbook context provided.
Use simple language, short sentences, and lots of emojis.

Return a JSON object with:
- "sections": Array of objects with:
  - "type": One of "story", "poem", "activity", "wordplay", "conversation", "introduction"
  - "title": Section title (fun, child-friendly)
  - "content": The actual content written for a 6-year-old (can be multi-paragraph, use \\n for line breaks)
  - "emoji": A single relevant emoji
- "funFacts": Array of 2-3 fun facts from this chapter that kids would love

Create 3-6 sections. Make it feel like a magical learning adventure!`;

  const raw = await callGroq(systemPrompt, `TEXTBOOK CONTEXT:\n${context}\n\nChapter: "${chapter.name}" from "${book.title}" (${book.subject})\n\nCreate an engaging lesson.`);
  const result = JSON.parse(raw) as LearnContent;
  setCache(cacheKey, result);
  return result;
}

// ─── Practice with Difficulty Levels ──────────────────────

export type PracticeDifficulty = 'easy' | 'medium' | 'hard';

export interface PracticeExercise {
  type: 'fill_blank' | 'match' | 'word_build' | 'sentence' | 'sound';
  question: string;
  answer: string;
  options?: string[];   // for matching / MCQ
  hint?: string;
  emoji: string;
}

export async function getPracticeExercises(
  book: BookEntry,
  chapter: BookChapter,
  difficulty: PracticeDifficulty = 'easy',
  stage: number = 1
): Promise<PracticeExercise[]> {
  const cacheKey = getCacheKey(book.id, chapter.id, `practice_${difficulty}_${stage}`);
  const cached = getFromCache<PracticeExercise[]>(cacheKey);
  if (cached) return cached;

  const chunks = await getChapterContext(book, chapter);
  if (chunks.length === 0) return [];

  const context = buildContextString(chunks);

  const difficultyGuide: Record<PracticeDifficulty, string> = {
    easy: 'Very simple questions. Single words, basic matching. A 5-year-old should be able to answer.',
    medium: 'Moderate questions. Short sentences, fill-in-the-blanks with 2-3 word answers.',
    hard: 'Challenging but fair. Sentence completion, word building, reasoning questions for a bright 7-year-old.',
  };

  const systemPrompt = `You are a Class 5 teacher creating practice exercises.
ONLY base questions on the textbook context.
Difficulty: ${difficulty.toUpperCase()} — ${difficultyGuide[difficulty]}
This is stage ${stage} of 5, so vary the questions from other stages.

Return a JSON object with:
- "exercises": Array of 5 objects with:
  - "type": One of "fill_blank", "match", "word_build", "sentence", "sound"
  - "question": The exercise question
  - "answer": The correct answer
  - "options": Array of 4 choices (for match type) - optional
  - "hint": A helpful hint - optional
  - "emoji": A fun relevant emoji`;

  const raw = await callGroq(systemPrompt, `TEXTBOOK CONTEXT:\n${context}\n\nChapter: "${chapter.name}" (${book.subject})\nDifficulty: ${difficulty}, Stage: ${stage}\n\nCreate exercises.`);
  const data = JSON.parse(raw);
  const result = (data.exercises || []) as PracticeExercise[];
  setCache(cacheKey, result);
  return result;
}

// ─── Adaptive Quiz ────────────────────────────────────────

export interface AdaptiveQuizQuestion {
  type: 'mcq' | 'short' | 'picture';
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  explanation: string;
  difficulty: PracticeDifficulty;
  emoji: string;
}

export async function getAdaptiveQuiz(
  book: BookEntry,
  chapter: BookChapter,
  difficulty: PracticeDifficulty = 'easy'
): Promise<AdaptiveQuizQuestion[]> {
  const cacheKey = getCacheKey(book.id, chapter.id, `adaptive_quiz_${difficulty}`);
  const cached = getFromCache<AdaptiveQuizQuestion[]>(cacheKey);
  if (cached) return cached;

  const chunks = await getChapterContext(book, chapter);
  if (chunks.length === 0) return [];

  const context = buildContextString(chunks);

  const systemPrompt = `You are a Class 5 teacher creating an adaptive quiz for a 6-year-old.
ONLY base questions on the textbook context.
Difficulty: ${difficulty.toUpperCase()}

Return a JSON object with:
- "questions": Array of 10 objects. Include:
  - 6 MCQ questions (type: "mcq") with "options" (4 choices) and "correctIndex" (0-3)
  - 2 short answer questions (type: "short") with "correctAnswer"
  - 2 picture-description questions (type: "picture") with "correctAnswer" — describe a scene from the chapter and ask about it
  
Each object must have:
  - "type": "mcq" | "short" | "picture"
  - "question": The question text
  - "options": Array of 4 strings (only for mcq)
  - "correctIndex": Number 0-3 (only for mcq)
  - "correctAnswer": String (for short and picture types)
  - "explanation": Brief explanation
  - "difficulty": "${difficulty}"
  - "emoji": A fun emoji for this question`;

  const raw = await callGroq(systemPrompt, `TEXTBOOK CONTEXT:\n${context}\n\nChapter: "${chapter.name}" (${book.subject}, ${difficulty})\n\nCreate adaptive quiz.`);
  const data = JSON.parse(raw);
  const result = (data.questions || []) as AdaptiveQuizQuestion[];
  setCache(cacheKey, result);
  return result;
}

// ─── Play Mode Games ──────────────────────────────────────

export interface MiniGame {
  type: 'drag_drop' | 'word_puzzle' | 'letter_build' | 'picture_match' | 'sound_match';
  title: string;
  instruction: string;
  items: { id: string; text: string; match?: string; emoji?: string }[];
  emoji: string;
}

export async function getMiniGames(
  book: BookEntry,
  chapter: BookChapter
): Promise<MiniGame[]> {
  const cacheKey = getCacheKey(book.id, chapter.id, 'minigames');
  const cached = getFromCache<MiniGame[]>(cacheKey);
  if (cached) return cached;

  const chunks = await getChapterContext(book, chapter);
  if (chunks.length === 0) return [];

  const context = buildContextString(chunks);

  const systemPrompt = `You are a game designer creating mini learning games for a 6-year-old based on chapter content.
ONLY use the textbook context.

Return a JSON object with:
- "games": Array of 4-5 objects with:
  - "type": One of "drag_drop", "word_puzzle", "letter_build", "picture_match", "sound_match"
  - "title": Fun game title
  - "instruction": Simple instruction for the child
  - "items": Array of 6-8 objects with:
    - "id": Unique string like "item1"
    - "text": The word or phrase
    - "match": What it should be matched/paired with (for matching games)
    - "emoji": A relevant emoji
  - "emoji": A game emoji

For drag_drop: items have text (word) and match (category/meaning).
For word_puzzle: items have text (scrambled letters) and match (correct word).
For letter_build: items have text (letter) and match (they combine to form the word in instruction).
For picture_match: items have text (description) and match (emoji that represents it).
For sound_match: items have text (word) and match (rhyming word or sound).`;

  const raw = await callGroq(systemPrompt, `TEXTBOOK CONTEXT:\n${context}\n\nChapter: "${chapter.name}" (${book.subject})\n\nCreate mini games.`);
  const data = JSON.parse(raw);
  const result = (data.games || []) as MiniGame[];
  setCache(cacheKey, result);
  return result;
}

// ─── Flashcards ───────────────────────────────────────────

export interface Flashcard {
  front: string;
  back: string;
  emoji: string;
}

export async function getFlashcards(
  book: BookEntry,
  chapter: BookChapter
): Promise<Flashcard[]> {
  const cacheKey = getCacheKey(book.id, chapter.id, 'flashcards');
  const cached = getFromCache<Flashcard[]>(cacheKey);
  if (cached) return cached;

  const chunks = await getChapterContext(book, chapter);
  if (chunks.length === 0) return [];

  const context = buildContextString(chunks);

  const systemPrompt = `You are a Class 5 teacher creating flashcards for young children.
ONLY use the textbook context provided.
Return a JSON object with:
- "flashcards": Array of 8-10 objects with:
  - "front": A question or prompt (keep it simple)
  - "back": The answer or explanation
  - "emoji": A single relevant emoji`;

  const raw = await callGroq(systemPrompt, `TEXTBOOK CONTEXT:\n${context}\n\nChapter: "${chapter.name}"\n\nCreate flashcards.`);
  const data = JSON.parse(raw);
  const result = data.flashcards || [];

  setCache(cacheKey, result);
  return result;
}
