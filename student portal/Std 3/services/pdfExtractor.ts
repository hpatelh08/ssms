/**
 * services/pdfExtractor.ts
 * ─────────────────────────────────────────────────────
 * Client-side PDF text extraction using pdf.js.
 *
 * Extracts text content from PDF files served locally,
 * returning page-by-page text for downstream chunking.
 *
 * Features:
 *  - Uses pdf.js (pdfjs-dist) for browser-based extraction
 *  - LocalStorage caching to avoid re-extraction
 *  - Progress callback for UI feedback
 *  - Graceful error handling
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker — use local worker that matches installed pdfjs-dist version
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// ─── Types ────────────────────────────────────────────────

export interface ExtractedPage {
  pageNum: number;
  text: string;
}

export interface PDFExtractionResult {
  bookId: string;
  pages: ExtractedPage[];
  totalPages: number;
  extractedAt: string;
}

// ─── Cache ────────────────────────────────────────────────

const CACHE_PREFIX = 'ssms_pdf_text_';
const CACHE_VERSION = 'v2';

function getCacheKey(bookId: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}_${bookId}`;
}

function getCachedExtraction(bookId: string): PDFExtractionResult | null {
  try {
    const raw = localStorage.getItem(getCacheKey(bookId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function cacheExtraction(result: PDFExtractionResult): void {
  try {
    const json = JSON.stringify(result);
    // Only cache if under 2MB (localStorage limit awareness)
    if (json.length < 2 * 1024 * 1024) {
      localStorage.setItem(getCacheKey(result.bookId), json);
      console.log(`[PDF] Cached extraction for ${result.bookId} (${(json.length / 1024).toFixed(0)} KB)`);
    } else {
      console.warn(`[PDF] Extraction too large to cache for ${result.bookId}`);
    }
  } catch (e) {
    console.warn('[PDF] Failed to cache extraction:', e);
  }
}

// ─── Extraction ───────────────────────────────────────────

/**
 * Extract text from a PDF file served at the given URL.
 * Results are cached in localStorage for instant re-use.
 *
 * @param pdfUrl  - URL to the PDF (e.g., '/books/ncert/mridang.pdf')
 * @param bookId  - Unique book identifier for caching
 * @param onProgress - Optional callback (pagesProcessed, totalPages)
 */
export async function extractTextFromPDF(
  pdfUrl: string,
  bookId: string,
  onProgress?: (done: number, total: number) => void
): Promise<PDFExtractionResult> {
  // Check cache first
  const cached = getCachedExtraction(bookId);
  if (cached) {
    console.log(`[PDF] Using cached extraction for ${bookId} (${cached.pages.length} pages)`);
    onProgress?.(cached.totalPages, cached.totalPages);
    return cached;
  }

  console.log(`[PDF] Extracting text from ${pdfUrl}...`);

  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pages: ExtractedPage[] = [];

    for (let i = 1; i <= totalPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: any) => {
            if ('str' in item) return item.str;
            return '';
          })
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (text.length > 10) {
          pages.push({ pageNum: i, text });
        }

        onProgress?.(i, totalPages);
      } catch (pageErr) {
        console.warn(`[PDF] Failed to extract page ${i}:`, pageErr);
        onProgress?.(i, totalPages);
      }
    }

    const result: PDFExtractionResult = {
      bookId,
      pages,
      totalPages,
      extractedAt: new Date().toISOString(),
    };

    // Cache the result
    cacheExtraction(result);

    console.log(`[PDF] Extracted ${pages.length}/${totalPages} pages from ${bookId}`);
    return result;
  } catch (err) {
    console.error(`[PDF] Failed to extract ${pdfUrl}:`, err);
    return {
      bookId,
      pages: [],
      totalPages: 0,
      extractedAt: new Date().toISOString(),
    };
  }
}

/**
 * Clear cached extraction for a specific book or all books.
 */
export function clearExtractionCache(bookId?: string): void {
  if (bookId) {
    localStorage.removeItem(getCacheKey(bookId));
  } else {
    // Clear all cached extractions
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
}
