/**
 * services/bookChunker.ts
 * ─────────────────────────────────────────────────────
 * Converts extracted PDF page text into TextbookChunk[]
 * suitable for the existing vector store / RAG pipeline.
 *
 * Strategy:
 *  1. Maps book subject from BookEntry config
 *  2. Detects chapter boundaries via BookEntry.chapters list
 *  3. Splits text into ~500-char overlapping chunks
 *  4. Assigns chapter labels and page numbers
 */

import type { TextbookChunk } from '../types';
import type { BookEntry, BookChapter } from '../data/bookConfig';
import type { PDFExtractionResult, ExtractedPage } from './pdfExtractor';

// ─── Config ───────────────────────────────────────────────

const CHUNK_SIZE = 500;     // target characters per chunk
const CHUNK_OVERLAP = 80;   // overlap between adjacent chunks

// ─── Subject Mapping ──────────────────────────────────────

type SubjectType = 'English' | 'Math' | 'Hindi' | 'Gujarati' | 'Activities';

function mapSubject(bookSubject: string): SubjectType {
  const s = bookSubject.toLowerCase();
  if (s.includes('math')) return 'Math';
  if (s.includes('hindi')) return 'Hindi';
  if (s.includes('gujarati')) return 'Gujarati';
  if (s.includes('evs') || s.includes('environment') || s.includes('activit')) return 'Activities';
  return 'English';
}

// ─── Chapter Detection ────────────────────────────────────

interface PageChapterAssignment {
  pageNum: number;
  text: string;
  chapter: string;
}

/**
 * Assign each page to a chapter based on chapter title keywords
 * found in the page text. Uses the BookEntry's chapter list.
 */
function assignChaptersToPages(
  pages: ExtractedPage[],
  chapters: BookChapter[]
): PageChapterAssignment[] {
  if (chapters.length === 0 || pages.length === 0) {
    return pages.map(p => ({
      pageNum: p.pageNum,
      text: p.text,
      chapter: 'General',
    }));
  }

  // Build normalized chapter names for fuzzy matching
  const chapterNames = chapters.map(ch => ({
    original: ch.name,
    normalized: ch.name.toLowerCase().replace(/[^\w\s\u0900-\u097F\u0A80-\u0AFF]/g, '').trim(),
  }));

  let currentChapter = chapters[0].name;
  const assignments: PageChapterAssignment[] = [];

  for (const page of pages) {
    const pageTextLower = page.text.toLowerCase();

    // Check if this page contains a chapter title
    for (const ch of chapterNames) {
      if (ch.normalized.length > 3 && pageTextLower.includes(ch.normalized)) {
        currentChapter = ch.original;
        break;
      }
    }

    assignments.push({
      pageNum: page.pageNum,
      text: page.text,
      chapter: currentChapter,
    });
  }

  return assignments;
}

// ─── Chunking ─────────────────────────────────────────────

/**
 * Split text into overlapping chunks of ~CHUNK_SIZE characters.
 * Tries to break at sentence boundaries.
 */
function splitIntoChunks(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    // Try to break at a sentence boundary
    if (end < text.length) {
      const slice = text.substring(start, end + 50);
      const sentenceEnd = slice.lastIndexOf('. ');
      const questionEnd = slice.lastIndexOf('? ');
      const exclamEnd = slice.lastIndexOf('! ');
      const newlineEnd = slice.lastIndexOf('\n');

      const breakPoint = Math.max(sentenceEnd, questionEnd, exclamEnd, newlineEnd);
      if (breakPoint > CHUNK_SIZE * 0.4) {
        end = start + breakPoint + 1;
      }
    }

    const chunk = text.substring(start, end).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }

    start = end - CHUNK_OVERLAP;
    if (start < 0) start = 0;
    if (start >= text.length) break;
  }

  return chunks;
}

// ─── Main Export ──────────────────────────────────────────

/**
 * Convert a PDF extraction result + book config into TextbookChunk[].
 *
 * @param extraction - The PDF text extraction result
 * @param book       - The BookEntry config for this book
 * @returns Array of TextbookChunks ready for the vector store
 */
export function chunkBook(
  extraction: PDFExtractionResult,
  book: BookEntry
): TextbookChunk[] {
  if (extraction.pages.length === 0) return [];

  const subject = mapSubject(book.subject);
  const assignments = assignChaptersToPages(extraction.pages, book.chapters);
  const chunks: TextbookChunk[] = [];
  let chunkIdx = 0;

  for (const assignment of assignments) {
    const textChunks = splitIntoChunks(assignment.text);

    for (const text of textChunks) {
      chunks.push({
        id: `${book.id}_p${assignment.pageNum}_c${chunkIdx}`,
        subject,
        content: text,
        page: assignment.pageNum,
        chapter: assignment.chapter,
        bookId: book.id,
      });
      chunkIdx++;
    }
  }

  console.log(`[Chunker] ${book.id}: ${chunks.length} chunks from ${extraction.pages.length} pages`);
  return chunks;
}

/**
 * Merge chunks from multiple books into a single array
 * suitable for initVectorStore().
 */
export function mergeBookChunks(...bookChunks: TextbookChunk[][]): TextbookChunk[] {
  return bookChunks.flat();
}
