/**
 * services/pdfSource.ts
 * Shared PDF fetch helper for local school books.
 *
 * Loads the PDF as bytes first so PDF.js does not depend on
 * cross-origin range requests or the browser's built-in PDF viewer.
 */

export async function fetchPdfBytes(pdfUrl: string, signal?: AbortSignal): Promise<Uint8Array> {
  const response = await fetch(pdfUrl, {
    signal,
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new Error(`Failed to load PDF (${response.status} ${response.statusText})`);
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
