/**
 * Embedding Service
 * =================
 * Uses Gemini's text-embedding model to generate vector embeddings
 * for text chunks and queries.  Supports batch operations and
 * provides a cosine-similarity search function.
 *
 * When no valid Gemini API key is available, all functions
 * gracefully return empty results so BM25 search still works.
 */

import { GoogleGenAI } from '@google/genai';

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIM = 768;   // dimension of text-embedding-004

let ai: GoogleGenAI | null = null;
let _keyAvailable: boolean | null = null;

function isEmbeddingKeyAvailable(): boolean {
  if (_keyAvailable !== null) return _keyAvailable;
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  _keyAvailable = key.length > 10; // basic sanity check
  if (!_keyAvailable) {
    console.warn('[Embedding] No valid Gemini API key found — semantic embeddings disabled, using BM25 only.');
  }
  return _keyAvailable;
}

function getAI(): GoogleGenAI {
  if (!ai) {
    const key = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

// ─── Types ────────────────────────────────────────────────

export interface EmbeddingVector {
  id: string;
  values: number[];
}

// ─── Core Functions ───────────────────────────────────────

/**
 * Generate an embedding vector for a single piece of text.
 * Returns empty array if no valid API key is available.
 */
export async function embedText(text: string): Promise<number[]> {
  if (!isEmbeddingKeyAvailable()) return [];

  const client = getAI();
  const result = await client.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });
  return result.embeddings?.[0]?.values ?? [];
}

/**
 * Generate embeddings for a batch of texts.
 * Processes in sequential batches to respect rate limits.
 */
export async function embedBatch(
  texts: { id: string; text: string }[],
  onProgress?: (done: number, total: number) => void
): Promise<EmbeddingVector[]> {
  const BATCH_SIZE = 20;
  const results: EmbeddingVector[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async ({ id, text }) => {
      const values = await embedText(text);
      return { id, values };
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, texts.length), texts.length);
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
}

// ─── Similarity ───────────────────────────────────────────

/**
 * Compute cosine similarity between two vectors.
 * Returns a value between -1 and 1 (1 = identical direction).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export { EMBEDDING_DIM };
