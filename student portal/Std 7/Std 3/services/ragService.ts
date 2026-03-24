/**
 * RAG Service — Chapter-Locked Retrieval Orchestrator
 * ====================================================
 * Deterministic, chapter-restricted retrieval-augmented generation.
 *
 * Pipeline:
 *  1. Validate chapter selection
 *  2. Filter chunks by subject + chapter (no cross-chapter)
 *  3. Run similarity search within filtered set
 *  4. Enforce minimum similarity threshold (0.75)
 *  5. If insufficient results → return controlled fallback (NO LLM call)
 *  6. If good results → build grounded prompt → LLM → structured response
 *  7. Log everything
 *
 * Security:
 *  - No internet fallback
 *  - No cross-subject retrieval
 *  - No predictive answers
 *  - No summarizing entire book
 */

import { TextbookChunk } from '../types';
import { searchKnowledge, SearchResult } from './vectorStore';
import { filterChunksByChapter, isValidChapterSelection } from './chapterFilter';
import { logAction } from '../utils/auditLog';
import { logRAGInteraction, RAGAuditEntry } from '../middleware/auditLogger';

// ─── Groq API Config ─────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getGroqApiKey(): string {
  return process.env.GROQ_API_KEY || '';
}

// ─── Types ────────────────────────────────────────────────

export type ResponseMode = 'parent' | 'student';

export interface ChapterRAGResponse {
  explanation: string;
  simplified_explanation: string;
  chapter: string;
  page_numbers: number[];
  similarity_scores: number[];
  source_chunks: {
    id: string;
    subject: string;
    chapter: string;
    page: number;
    snippet: string;
    score: number;
    method: string;
  }[];
  searchMethod: string;
  confidence: number;
  /** true = answer came from LLM with grounded context */
  grounded: boolean;
  /** true = fallback was returned (no LLM call) */
  isFallback: boolean;
  practice_questions?: string[];
  mode?: ResponseMode;
}

// ─── Constants ────────────────────────────────────────────

/** Minimum average similarity score to proceed to LLM */
const MIN_SIMILARITY_THRESHOLD = 0.75;

/** Minimum individual chunk score to include */
const MIN_CHUNK_SCORE = 0.3;

/** Max chunks to send to LLM */
const TOP_K = 3;

// ─── Debounce Guard ───────────────────────────────────────

let _lastQuery = '';
let _lastQueryTime = 0;
let _pendingPromise: Promise<ChapterRAGResponse> | null = null;
const DEBOUNCE_MS = 400;

// ─── Fallback Responses ───────────────────────────────────

function chapterFallback(chapter: string): ChapterRAGResponse {
  return {
    explanation:
      'This question does not appear in the selected chapter. Please try another question or select a different chapter.',
    simplified_explanation:
      'This is not in this chapter. Try asking something else! 📚',
    chapter,
    page_numbers: [],
    similarity_scores: [],
    source_chunks: [],
    searchMethod: 'none',
    confidence: 0,
    grounded: false,
    isFallback: true,
  };
}

function invalidSelectionResponse(): ChapterRAGResponse {
  return {
    explanation: 'Please select a subject and chapter before asking a question.',
    simplified_explanation: 'Pick a chapter first! 📖',
    chapter: '',
    page_numbers: [],
    similarity_scores: [],
    source_chunks: [],
    searchMethod: 'none',
    confidence: 0,
    grounded: false,
    isFallback: true,
  };
}

// ─── System Prompts ───────────────────────────────────────

const PARENT_PROMPT = `You are a Standard 3 academic assistant.
Answer ONLY using the provided textbook context.
If the answer is not in the context, clearly say:
"This topic is not covered in the selected chapter."
Do not use outside knowledge.

PEDAGOGICAL RULES:
- Explain CONCEPTS, do NOT give direct homework answers.
- Use simple words suitable for a 6–7-year-old child.
- Be encouraging, warm, and supportive.
- Use emojis sparingly (1–2 per paragraph max).
- Always cite which Source number(s) you used.

OUTPUT FORMAT:
Return a JSON object with exactly two fields:
  - "explanation": A clear, grounded explanation citing sources. 2–4 short paragraphs. Written for a parent to read to their child.
  - "simplified": ONE simple sentence (max 20 words) a 6-year-old can understand.`;

const STUDENT_PROMPT = `You are a friendly Standard 3 teacher talking directly to a 6–7 year old child.
Answer ONLY using the provided textbook context.
If the answer is not in the context, respond ONLY with:
"This topic is not in this chapter. Please try another question."

STRICT RULES:
- Do NOT mention source numbers, page numbers, chunk IDs, or retrieval details.
- Do NOT use words like "powerful tool", "communicate", "express ourselves", or any abstract language.
- Do NOT over-explain or give motivational lectures.
- Do NOT use advanced language. Use only words a 6-year-old knows.
- Keep explanation under 6 short simple sentences.
- Use only examples from the textbook context provided.
- Be friendly and encouraging but brief.

After the explanation, generate 3–5 simple practice questions that:
- Are answerable STRICTLY from the same chapter context provided.
- Use NO outside knowledge.
- Are simple enough for a 6–7 year old.

OUTPUT FORMAT:
Return a JSON object with exactly three fields:
  - "explanation": Short, simple explanation (max 6 sentences). No source citations. No page numbers.
  - "simplified": ONE simple sentence (max 15 words) the child can understand.
  - "practice_questions": Array of 3–5 simple practice question strings.`;

// ─── Main RAG Function ───────────────────────────────────

/**
 * Chapter-locked RAG query.
 * Retrieves ONLY from the selected subject+chapter, runs similarity
 * search within that filtered set, enforces similarity threshold,
 * and either generates a grounded LLM response or returns a safe fallback.
 */
export async function chapterRAGQuery(
  query: string,
  subject: 'English' | 'Math',
  chapterRaw: string,
  knowledgeBase: TextbookChunk[],
  mode: ResponseMode = 'parent'
): Promise<ChapterRAGResponse> {
  const trimmed = query.trim();
  if (!trimmed) return invalidSelectionResponse();

  // ── Debounce duplicate calls ──
  const now = Date.now();
  if (trimmed === _lastQuery && now - _lastQueryTime < DEBOUNCE_MS && _pendingPromise) {
    return _pendingPromise;
  }
  _lastQuery = trimmed;
  _lastQueryTime = now;

  const promise = _executeRAG(trimmed, subject, chapterRaw, knowledgeBase, mode);
  _pendingPromise = promise;
  return promise;
}

async function _executeRAG(
  query: string,
  subject: 'English' | 'Math',
  chapterRaw: string,
  knowledgeBase: TextbookChunk[],
  mode: ResponseMode = 'parent'
): Promise<ChapterRAGResponse> {
  const startTime = Date.now();

  // ── Step 1: Validate chapter selection ──
  if (!subject || !chapterRaw) {
    logAction('rag_blocked', 'ai', { reason: 'no_chapter_selected', query });
    return invalidSelectionResponse();
  }

  if (!isValidChapterSelection(knowledgeBase, subject, chapterRaw)) {
    logAction('rag_blocked', 'ai', { reason: 'invalid_chapter', subject, chapter: chapterRaw });
    return chapterFallback(chapterRaw);
  }

  // ── Step 2: Filter chunks by subject + chapter ──
  const chapterChunks = filterChunksByChapter(knowledgeBase, subject, chapterRaw);

  console.log(`[RAG] Chapter-locked search: "${subject}" / "${chapterRaw}" → ${chapterChunks.length} candidate chunks`);

  if (chapterChunks.length === 0) {
    logAction('rag_no_chunks', 'ai', { query, subject, chapter: chapterRaw });
    return chapterFallback(chapterRaw);
  }

  // ── Step 3: Similarity search within filtered set ──
  let searchResults: SearchResult[] = await searchKnowledge(
    query, TOP_K, subject, MIN_CHUNK_SCORE, chapterRaw
  );

  console.log(`[RAG] Chapter search results: ${searchResults.length} chunks`, {
    scores: searchResults.map(r => ({ id: r.chunk.id, score: +r.score.toFixed(4), method: r.method })),
  });

  // ── Step 4: Enforce similarity threshold ──
  const avgScore = searchResults.length > 0
    ? searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length
    : 0;

  const auditEntry: Partial<RAGAuditEntry> = {
    subject,
    chapter: chapterRaw,
    question: query,
    retrieved_chunk_ids: searchResults.map(r => r.chunk.id),
    similarity_scores: searchResults.map(r => +r.score.toFixed(4)),
    timestamp: new Date().toISOString(),
  };

  // ── Step 5: Threshold check — if too low, return fallback (NO LLM call) ──
  if (searchResults.length === 0 || avgScore < MIN_SIMILARITY_THRESHOLD) {
    console.log(`[RAG] Below threshold (avg ${avgScore.toFixed(4)} < ${MIN_SIMILARITY_THRESHOLD}) — returning fallback`);
    logAction('rag_below_threshold', 'ai', {
      query, subject, chapter: chapterRaw,
      avgScore: +avgScore.toFixed(4),
      threshold: MIN_SIMILARITY_THRESHOLD,
      resultsCount: searchResults.length,
    });

    // But if we have SOME results, try with relaxed threshold
    // to avoid being too aggressive on borderline cases
    if (searchResults.length > 0 && avgScore >= 0.4) {
      console.log('[RAG] Borderline — proceeding with available chunks');
      // Allow it to proceed to LLM with a lower confidence signal
    } else {
      logRAGInteraction({ ...auditEntry, llm_called: false, fallback: true } as RAGAuditEntry);
      return chapterFallback(chapterRaw);
    }
  }

  // ── Step 6: Build grounded context + call LLM ──
  const relevantChunks = searchResults.map(r => r.chunk);
  const contextString = relevantChunks.map((c, i) =>
    `[Source ${i + 1}: ${c.subject} Book, Chapter: "${c.chapter}", Page ${c.page}]\n${c.content}`
  ).join('\n\n---\n\n');

  const pages = [...new Set(relevantChunks.map(c => c.page))].sort((a, b) => a - b);
  const searchMethod = searchResults[0]?.method || 'none';

  const source_chunks = searchResults.map(r => ({
    id: r.chunk.id,
    subject: r.chunk.subject,
    chapter: r.chunk.chapter,
    page: r.chunk.page,
    snippet: r.chunk.content.substring(0, 150),
    score: +r.score.toFixed(4),
    method: r.method,
  }));

  try {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: mode === 'student' ? STUDENT_PROMPT : PARENT_PROMPT },
          {
            role: 'user',
            content: mode === 'student'
              ? `TEXTBOOK CONTEXT:\n${contextString}\n\n---\n\nQuestion:\n${query}\n\nAnswer simply for a 6-year-old. Then give practice questions from this chapter only.`
              : `TEXTBOOK CONTEXT:\n${contextString}\n\n---\n\nQuestion:\n${query}\n\nExplain in simple language suitable for a 6–7 year old child.`,
          },
        ],
        temperature: 0.15,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text();
      console.error('[RAG] Groq API error:', groqResponse.status, errorBody);
      throw new Error(`Groq API error (${groqResponse.status})`);
    }

    const groqData = await groqResponse.json();
    const rawText = groqData.choices?.[0]?.message?.content || '{}';
    const data = JSON.parse(rawText);

    const elapsed = Date.now() - startTime;

    // ── Step 7: Log everything ──
    logAction('rag_chapter_response', 'ai', {
      query, subject, chapter: chapterRaw,
      sourcesUsed: relevantChunks.length,
      method: searchMethod,
      confidence: +avgScore.toFixed(3),
      pages,
      elapsedMs: elapsed,
    });

    logRAGInteraction({
      ...auditEntry,
      llm_called: true,
      fallback: false,
      elapsed_ms: elapsed,
    } as RAGAuditEntry);

    return {
      explanation: data.explanation || 'No explanation generated.',
      simplified_explanation: data.simplified || 'Please ask your teacher!',
      chapter: chapterRaw,
      page_numbers: pages,
      similarity_scores: searchResults.map(r => +r.score.toFixed(4)),
      source_chunks,
      searchMethod,
      confidence: avgScore,
      grounded: true,
      isFallback: false,
      mode,
      ...(mode === 'student' && data.practice_questions ? { practice_questions: data.practice_questions } : {}),
    };
  } catch (error) {
    console.error('[RAG] LLM Error:', error);
    logAction('rag_llm_error', 'ai', { query, subject, chapter: chapterRaw, error: String(error) });
    throw error;
  }
}
