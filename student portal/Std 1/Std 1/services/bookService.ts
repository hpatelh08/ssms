/**
 * services/bookService.ts
 * ─────────────────────────────────────────────────────
 * Book data service — provides book lists by board.
 *
 * Books are served from /public/books/ as static PDFs.
 * Uses BOOK_CONFIG from data/bookConfig as the source of truth.
 */

import { BOOK_CONFIG, ALL_BOOKS, type BoardType, type BookEntry } from '../data/bookConfig';

/** Get all books for a specific board */
export function getBooks(board: BoardType): BookEntry[] {
  return BOOK_CONFIG[board] ?? [];
}

/** Get all books across both boards */
export function getAllBooks(): BookEntry[] {
  return ALL_BOOKS;
}

/** Find a single book by ID */
export function getBookById(id: string): BookEntry | undefined {
  return ALL_BOOKS.find(b => b.id === id);
}

/** Get total book count */
export function getBookCount(): { ncert: number; gseb: number; total: number } {
  const ncert = BOOK_CONFIG.ncert.length;
  const gseb = BOOK_CONFIG.state.length;
  return { ncert, gseb, total: ncert + gseb };
}
