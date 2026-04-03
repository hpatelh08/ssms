/**
 * Chapter Filter Service
 * ======================
 * Extracts unique chapters from the knowledge base, groups by subject,
 * normalizes names, and provides chapter-locked filtering for the RAG pipeline.
 *
 * Key guarantees:
 *  - No cross-chapter retrieval
 *  - No cross-subject retrieval
 *  - Memoized chapter list (computed once per knowledge base)
 */

import { TextbookChunk } from '../types';

// ─── Types ────────────────────────────────────────────────

export type SubjectKey = 'English' | 'Math' | 'Hindi' | 'Gujarati' | 'Activities';

export interface ChapterInfo {
  /** Raw chapter string from data (e.g. "Unit 1 \nMy Family and Me") */
  raw: string;
  /** Cleaned display name (e.g. "Unit 1 – My Family and Me") */
  label: string;
  /** Subject this chapter belongs to */
  subject: SubjectKey;
  /** Number of chunks in this chapter */
  chunkCount: number;
  /** Page range [min, max] */
  pageRange: [number, number];
}

export interface ChapterIndex {
  English: ChapterInfo[];
  Math: ChapterInfo[];
  Hindi: ChapterInfo[];
  Gujarati: ChapterInfo[];
  Activities: ChapterInfo[];
}

// ─── Normalization ────────────────────────────────────────

/**
 * Clean a raw chapter string into a human-readable label.
 * Handles newlines, extra whitespace, and common formatting quirks.
 */
function normalizeChapterName(raw: string): string {
  return raw
    .replace(/\n/g, ' – ')     // newlines → dash separator
    .replace(/\s+/g, ' ')      // collapse whitespace
    .replace(/–\s*–/g, '–')    // double dashes
    .trim();
}

// ─── Memoized Index ───────────────────────────────────────

let _cachedIndex: ChapterIndex | null = null;
let _cachedChunksLength = 0;

/**
 * Build a chapter index from the knowledge base.
 * Result is memoized — recomputed only if chunk count changes.
 */
export function buildChapterIndex(chunks: TextbookChunk[]): ChapterIndex {
  if (_cachedIndex && _cachedChunksLength === chunks.length) {
    return _cachedIndex;
  }

  const map = new Map<string, { raw: string; subject: SubjectKey; count: number; pages: number[] }>();

  for (const chunk of chunks) {
    const key = `${chunk.subject}::${chunk.chapter}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      existing.pages.push(chunk.page);
    } else {
      map.set(key, { raw: chunk.chapter, subject: chunk.subject as SubjectKey, count: 1, pages: [chunk.page] });
    }
  }

  const buckets: Record<SubjectKey, ChapterInfo[]> = {
    English: [], Math: [], Hindi: [], Gujarati: [], Activities: [],
  };

  for (const entry of map.values()) {
    const pages = entry.pages.sort((a, b) => a - b);
    const info: ChapterInfo = {
      raw: entry.raw,
      label: normalizeChapterName(entry.raw),
      subject: entry.subject,
      chunkCount: entry.count,
      pageRange: [pages[0], pages[pages.length - 1]],
    };
    (buckets[entry.subject] || buckets.English).push(info);
  }

  // Sort each bucket by first page number
  for (const arr of Object.values(buckets)) {
    arr.sort((a, b) => a.pageRange[0] - b.pageRange[0]);
  }

  _cachedIndex = buckets as ChapterIndex;
  _cachedChunksLength = chunks.length;

  const subjectCounts = Object.entries(buckets).map(([k, v]) => `${v.length} ${k}`).filter(s => !s.startsWith('0')).join(', ');
  console.log(`[ChapterFilter] Indexed ${subjectCounts}`);
  return _cachedIndex;
}

/**
 * Get chapters for a specific subject.
 */
export function getChaptersForSubject(
  chunks: TextbookChunk[],
  subject: string
): ChapterInfo[] {
  const index = buildChapterIndex(chunks);
  if (subject in index) {
    return index[subject as SubjectKey];
  }
  return [];
}

/**
 * Filter chunks strictly by subject AND chapter.
 * This is the core chapter-lock enforcement.
 * Returns ONLY chunks that match both subject and chapter exactly.
 */
export function filterChunksByChapter(
  chunks: TextbookChunk[],
  subject: string,
  chapterRaw: string
): TextbookChunk[] {
  return chunks.filter(c => c.subject === subject && c.chapter === chapterRaw);
}

/**
 * Validate that a chapter selection is valid.
 */
export function isValidChapterSelection(
  chunks: TextbookChunk[],
  subject: string,
  chapterRaw: string
): boolean {
  const index = buildChapterIndex(chunks);
  const chapters = subject in index ? index[subject as SubjectKey] : [];
  return chapters.some(ch => ch.raw === chapterRaw);
}

/**
 * Reset the cached index (useful if knowledge base changes).
 */
export function resetChapterIndex(): void {
  _cachedIndex = null;
  _cachedChunksLength = 0;
}
