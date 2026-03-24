/**
 * Vector Store
 * ============
 * In-memory vector store for RAG retrieval.
 * 
 * Two search strategies:
 *  1. **Semantic** (primary)  – Uses Gemini embeddings + cosine similarity.
 *     Embeddings are cached in localStorage for instant subsequent loads.
 *  2. **BM25-like** (fallback) – Keyword-based TF-IDF style scoring.
 *     Used when embeddings are unavailable or as a hybrid boost.
 */

import { TextbookChunk } from '../types';
import {
  embedText,
  embedBatch,
  cosineSimilarity,
  EmbeddingVector,
} from './embeddingService';

// ─── Cache Keys ───────────────────────────────────────────

const EMBEDDINGS_CACHE_KEY = 'ssms_rag_embeddings_v1';
const EMBEDDINGS_HASH_KEY = 'ssms_rag_embeddings_hash_v1';

// ─── State ───────────────────────────────────────────────

interface VectorStoreState {
  chunks: TextbookChunk[];
  embeddings: Map<string, number[]>;   // chunk_id → embedding vector
  initialized: boolean;
  embeddingsReady: boolean;
}

const store: VectorStoreState = {
  chunks: [],
  embeddings: new Map(),
  initialized: false,
  embeddingsReady: false,
};

// ─── Initialization ──────────────────────────────────────

/**
 * Initialize the vector store with textbook chunks.
 * Loads cached embeddings if available, otherwise schedules
 * background embedding generation.
 */
export function initVectorStore(chunks: TextbookChunk[]): void {
  store.chunks = chunks;
  store.initialized = true;
  store.embeddingsReady = false;

  // Try to load cached embeddings
  const cached = loadCachedEmbeddings(chunks);
  if (cached) {
    store.embeddings = cached;
    store.embeddingsReady = true;
    console.log(`[RAG] Loaded ${cached.size} cached embeddings`);
  }
}

/**
 * Generate embeddings for all chunks (background).
 * Call this after init to enable semantic search.
 * Returns a promise that resolves when complete.
 */
export async function buildEmbeddings(
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  if (store.chunks.length === 0) return;

  // Only embed chunks that aren't already cached
  const missingChunks = store.chunks.filter(c => !store.embeddings.has(c.id));

  if (missingChunks.length === 0) {
    store.embeddingsReady = true;
    return;
  }

  console.log(`[RAG] Generating embeddings for ${missingChunks.length} chunks...`);

  try {
    const texts = missingChunks.map(c => ({
      id: c.id,
      text: `[${c.subject}] ${c.chapter}: ${c.content}`,
    }));

    const vectors = await embedBatch(texts, onProgress);

    for (const vec of vectors) {
      if (vec.values.length > 0) {
        store.embeddings.set(vec.id, vec.values);
      }
    }

    store.embeddingsReady = true;

    // Cache embeddings to localStorage
    saveCachedEmbeddings(store.chunks, store.embeddings);

    console.log(`[RAG] Embeddings ready: ${store.embeddings.size} vectors`);
  } catch (error) {
    console.warn('[RAG] Embedding generation failed, using BM25 fallback:', error);
    // BM25 fallback still works without embeddings
  }
}

// ─── Search ──────────────────────────────────────────────

export interface SearchResult {
  chunk: TextbookChunk;
  score: number;
  method: 'semantic' | 'keyword' | 'hybrid';
}

/**
 * Search the knowledge base for chunks relevant to a query.
 * Uses semantic search if embeddings are available, falls back to BM25.
 * Combines both for hybrid scoring when possible.
 *
 * When chapterFilter is provided, candidates are restricted to that
 * exact chapter — no cross-chapter retrieval is allowed.
 */
export async function searchKnowledge(
  query: string,
  topK: number = 5,
  subjectFilter?: string,
  minThreshold: number = 0.01,
  chapterFilter?: string
): Promise<SearchResult[]> {
  if (!store.initialized || store.chunks.length === 0) {
    console.warn('[RAG] Store not initialized or empty');
    return [];
  }

  let candidates = store.chunks;
  if (subjectFilter) {
    candidates = candidates.filter(c => c.subject === subjectFilter);
  }
  if (chapterFilter) {
    candidates = candidates.filter(c => c.chapter === chapterFilter);
  }

  console.log(`[RAG] Searching ${candidates.length} chunks (embeddings ready: ${store.embeddingsReady}, count: ${store.embeddings.size})`);

  // BM25-like keyword scoring (always available)
  const keywordScores = bm25Search(query, candidates);

  // Semantic scoring (if embeddings available)
  let semanticScores: Map<string, number> = new Map();
  if (store.embeddingsReady && store.embeddings.size > 0) {
    try {
      semanticScores = await semanticSearch(query, candidates);
      console.log(`[RAG] Semantic search returned ${semanticScores.size} scored chunks`);
    } catch (err) {
      console.warn('[RAG] Semantic search failed, using keyword only:', err);
    }
  }

  // Combine scores (hybrid) or use keyword-only
  const combinedScores: SearchResult[] = candidates.map(chunk => {
    const kwScore = keywordScores.get(chunk.id) || 0;
    const semScore = semanticScores.get(chunk.id) || 0;

    if (semScore > 0 && kwScore > 0) {
      return {
        chunk,
        score: semScore * 0.7 + kwScore * 0.3,
        method: 'hybrid' as const,
      };
    } else if (semScore > 0) {
      return { chunk, score: semScore, method: 'semantic' as const };
    } else {
      return { chunk, score: kwScore, method: 'keyword' as const };
    }
  });

  const results = combinedScores
    .filter(r => r.score > minThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  console.log(`[RAG] Search results: ${results.length} chunks above threshold ${minThreshold}`);
  return results;
}

// ─── BM25-like Keyword Search ────────────────────────────

function bm25Search(query: string, chunks: TextbookChunk[]): Map<string, number> {
  const scores = new Map<string, number>();
  
  // Tokenize query
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return scores;

  // Calculate IDF for each query token
  const N = chunks.length;
  const idf = new Map<string, number>();
  
  for (const token of queryTokens) {
    const df = chunks.filter(c => 
      c.content.toLowerCase().includes(token) ||
      c.chapter.toLowerCase().includes(token)
    ).length;
    // IDF with smoothing
    idf.set(token, Math.log((N - df + 0.5) / (df + 0.5) + 1));
  }

  // Score each chunk
  const k1 = 1.2;
  const b = 0.75;
  const avgLen = chunks.reduce((sum, c) => sum + c.content.length, 0) / N;

  for (const chunk of chunks) {
    let score = 0;
    const docLen = chunk.content.length;
    const fullText = `${chunk.content} ${chunk.chapter}`.toLowerCase();

    for (const token of queryTokens) {
      const tf = countOccurrences(fullText, token);
      if (tf > 0) {
        const tokenIdf = idf.get(token) || 0;
        // BM25 formula
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLen / avgLen));
        score += tokenIdf * (numerator / denominator);
      }
    }

    // Bonus for chapter title match
    for (const token of queryTokens) {
      if (chunk.chapter.toLowerCase().includes(token)) {
        score *= 1.3;
      }
    }

    if (score > 0) {
      // Normalize to 0-1 range (approximate)
      scores.set(chunk.id, Math.min(score / (queryTokens.length * 3), 1));
    }
  }

  return scores;
}

function tokenize(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'could', 'shall', 'of', 'in', 'on',
    'at', 'to', 'for', 'with', 'by', 'from', 'as', 'into', 'through',
    'and', 'or', 'but', 'not', 'no', 'so', 'it', 'its', 'this', 'that',
    'what', 'which', 'who', 'how', 'when', 'where', 'why', 'me', 'my',
    'i', 'we', 'you', 'he', 'she', 'they', 'us', 'them',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));
}

function countOccurrences(text: string, token: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(token, pos)) !== -1) {
    count++;
    pos += token.length;
  }
  return count;
}

// ─── Semantic Search ─────────────────────────────────────

async function semanticSearch(
  query: string,
  chunks: TextbookChunk[]
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();

  // Embed the query
  const queryEmbedding = await embedText(query);
  if (queryEmbedding.length === 0) {
    console.warn('[RAG] Query embedding returned empty');
    return scores;
  }

  // Compare against stored chunk embeddings
  let maxSim = -1;
  let minSim = 2;
  const rawScores: { id: string; similarity: number }[] = [];

  for (const chunk of chunks) {
    const chunkEmbedding = store.embeddings.get(chunk.id);
    if (chunkEmbedding) {
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
      rawScores.push({ id: chunk.id, similarity });
      if (similarity > maxSim) maxSim = similarity;
      if (similarity < minSim) minSim = similarity;
    }
  }

  console.log(`[RAG] Semantic: compared against ${rawScores.length} embeddings, sim range [${minSim.toFixed(4)}, ${maxSim.toFixed(4)}]`);

  // Use softer normalization: anything above 0.2 cosine similarity gets a score
  // Scale 0.2–1.0 → 0.0–1.0
  const floor = 0.2;
  const range = Math.max(0.01, 1.0 - floor);

  for (const { id, similarity } of rawScores) {
    if (similarity > floor) {
      const normalizedScore = (similarity - floor) / range;
      scores.set(id, normalizedScore);
    }
  }

  return scores;
}

// ─── Embedding Cache (localStorage) ─────────────────────

function computeChunksHash(chunks: TextbookChunk[]): string {
  // Simple hash based on chunk count + first/last chunk IDs
  const key = `${chunks.length}_${chunks[0]?.id || ''}_${chunks[chunks.length - 1]?.id || ''}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function saveCachedEmbeddings(
  chunks: TextbookChunk[],
  embeddings: Map<string, number[]>
): void {
  try {
    const data: Record<string, number[]> = {};
    embeddings.forEach((values, id) => {
      data[id] = values;
    });
    
    // Check size before saving (localStorage limit ~5MB)
    const json = JSON.stringify(data);
    if (json.length > 4 * 1024 * 1024) {
      console.warn('[RAG] Embeddings too large for localStorage, skipping cache');
      return;
    }

    localStorage.setItem(EMBEDDINGS_CACHE_KEY, json);
    localStorage.setItem(EMBEDDINGS_HASH_KEY, computeChunksHash(chunks));
    console.log(`[RAG] Cached ${embeddings.size} embeddings (${(json.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.warn('[RAG] Failed to cache embeddings:', e);
  }
}

function loadCachedEmbeddings(
  chunks: TextbookChunk[]
): Map<string, number[]> | null {
  try {
    const hash = localStorage.getItem(EMBEDDINGS_HASH_KEY);
    if (hash !== computeChunksHash(chunks)) {
      console.log('[RAG] Cache hash mismatch, re-embedding needed');
      return null;
    }

    const json = localStorage.getItem(EMBEDDINGS_CACHE_KEY);
    if (!json) return null;

    const data: Record<string, number[]> = JSON.parse(json);
    const map = new Map<string, number[]>();
    for (const [id, values] of Object.entries(data)) {
      map.set(id, values);
    }

    return map;
  } catch {
    return null;
  }
}

// ─── Status ──────────────────────────────────────────────

export function getVectorStoreStatus(): {
  initialized: boolean;
  chunkCount: number;
  embeddingsReady: boolean;
  embeddingCount: number;
} {
  return {
    initialized: store.initialized,
    chunkCount: store.chunks.length,
    embeddingsReady: store.embeddingsReady,
    embeddingCount: store.embeddings.size,
  };
}
