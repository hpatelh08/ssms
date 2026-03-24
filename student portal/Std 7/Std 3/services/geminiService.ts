
import { TextbookChunk } from "../types";
import { searchKnowledge, SearchResult, getVectorStoreStatus } from "./vectorStore";
import { logAction } from "../utils/auditLog";

// ─── Groq API Config ─────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getGroqApiKey(): string {
  return process.env.GROQ_API_KEY || '';
}

// ─── Types ────────────────────────────────────────────────

export type ResponseMode = 'parent' | 'student';

export interface RAGResponse {
  explanation: string;
  simplified_explanation: string;
  book: string;
  page_reference: string;
  sources: TextbookChunk[];
  retrieved_chunks: {
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
  practice_questions?: string[];
  mode?: ResponseMode;
}

// ─── Debounce / duplicate-call guard ──────────────────────

let _lastQuery = '';
let _lastQueryTime = 0;
let _pendingPromise: Promise<RAGResponse> | null = null;
const DEBOUNCE_MS = 400;

// ─── Query embedding cache ───────────────────────────────

const _queryEmbeddingCache = new Map<string, number[]>();

export class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = getGroqApiKey();
  }

  /**
   * RAG-powered homework explanation.
   * 1. Semantic + BM25 hybrid search via VectorStore
   * 2. Build grounded context from top chunks
   * 3. Send to Gemini with strict grounding instructions
   * 4. Return structured response with retrieval transparency
   */
  async explainHomework(query: string, _knowledgeBase?: TextbookChunk[], mode: ResponseMode = 'parent'): Promise<RAGResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
      return this.emptyResponse('Please enter a question.');
    }

    // ── Duplicate call guard ──
    const now = Date.now();
    if (trimmed === _lastQuery && now - _lastQueryTime < DEBOUNCE_MS && _pendingPromise) {
      return _pendingPromise;
    }
    _lastQuery = trimmed;
    _lastQueryTime = now;

    const promise = this._doExplain(trimmed, _knowledgeBase, mode);
    _pendingPromise = promise;
    return promise;
  }

  private async _doExplain(query: string, _knowledgeBase?: TextbookChunk[], mode: ResponseMode = 'parent'): Promise<RAGResponse> {
    // ── Step 1: Retrieve relevant chunks via RAG pipeline ──
    const ragStatus = getVectorStoreStatus();
    let searchResults: SearchResult[] = [];

    console.log('[RAG] Query:', query);
    console.log('[RAG] Store status:', ragStatus);

    if (ragStatus.initialized && ragStatus.chunkCount > 0) {
      // Primary RAG path — try with standard threshold first
      searchResults = await searchKnowledge(query, 5);

      console.log({
        query,
        retrieved_chunk_ids: searchResults.map(r => r.chunk.id),
        similarity_scores: searchResults.map(r => ({ id: r.chunk.id, score: +r.score.toFixed(4), method: r.method })),
      });

      // ── Threshold relaxation: if too few results, retry with lower threshold ──
      if (searchResults.length < 2) {
        console.log('[RAG] Few results, retrying with relaxed threshold...');
        searchResults = await searchKnowledge(query, 5, undefined, 0.005);

        console.log('[RAG] Relaxed retry:', {
          count: searchResults.length,
          scores: searchResults.map(r => +r.score.toFixed(4)),
        });
      }
    } else if (_knowledgeBase && _knowledgeBase.length > 0) {
      // Fallback: basic keyword search
      searchResults = this.fallbackKeywordSearch(query, _knowledgeBase);
    }

    const relevantChunks = searchResults.map(r => r.chunk);
    const avgScore = searchResults.length > 0
      ? searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length
      : 0;
    const searchMethod = searchResults[0]?.method || 'none';

    // Build retrieval transparency data
    const retrieved_chunks = searchResults.map(r => ({
      id: r.chunk.id,
      subject: r.chunk.subject,
      chapter: r.chunk.chapter,
      page: r.chunk.page,
      snippet: r.chunk.content.substring(0, 150),
      score: +r.score.toFixed(4),
      method: r.method,
    }));

    // Log the RAG search
    logAction('rag_search', 'ai', {
      query,
      resultsCount: searchResults.length,
      method: searchMethod,
      avgScore: +avgScore.toFixed(3),
      topChunkIds: searchResults.slice(0, 3).map(r => r.chunk.id),
      topScores: searchResults.slice(0, 3).map(r => +r.score.toFixed(4)),
    });

    // ── Edge case: no chunks found ──
    if (relevantChunks.length === 0) {
      logAction('rag_no_results', 'ai', { query });
      return {
        explanation: "This topic is not available in the Std 7 textbooks. The AI could not find any matching content in the uploaded English or Mathematics books.",
        simplified_explanation: "This is not in your school books. Ask your teacher! 📚",
        book: 'N/A',
        page_reference: 'N/A',
        sources: [],
        retrieved_chunks: [],
        searchMethod: 'none',
        confidence: 0,
      };
    }

    // ── Step 2: Build grounded context with clear source numbering ──
    const contextString = relevantChunks.map((c, i) =>
      `[Source ${i + 1}: ${c.subject} Book, Chapter: "${c.chapter}", Page ${c.page}]\n${c.content}`
    ).join('\n\n---\n\n');

    // Determine primary book
    const subjectCounts = relevantChunks.reduce((acc, c) => {
      acc[c.subject] = (acc[c.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const primaryBook = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Page references
    const pages = [...new Set(relevantChunks.map(c => `p.${c.page}`))].join(', ');

    const parentInstruction = `
ROLE: You are the SSMS Standard 3 AI Homework Companion.
AUDIENCE: A parent helping their 6–7-year-old child with homework.

STRICT GROUNDING RULES (MANDATORY):
1. ONLY use information from the TEXTBOOK CONTEXT provided below.
2. NEVER introduce facts, examples, or concepts NOT present in the context.
3. If the context does NOT contain enough information to answer, say clearly:
   "This topic isn't fully covered in the textbook pages I found. Please check with your teacher."
4. ALWAYS cite which Source number(s) you used so the parent can verify.
5. Do NOT hallucinate page numbers, chapter names, or content.

PEDAGOGICAL RULES:
6. Explain CONCEPTS — do NOT give direct final answers to homework questions.
7. Use simple words appropriate for a 6–7-year-old child.
8. Be encouraging, warm, and supportive.
9. Use emojis sparingly to keep the child engaged (1–2 per paragraph max).

OUTPUT FORMAT:
Return a JSON object with exactly two fields:
  - "explanation": A clear, grounded explanation citing the source(s) used. 2–4 short paragraphs. Written for the parent to read to their child.
  - "simplified": ONE simple sentence (max 20 words) a 6-year-old can understand on their own.
`;

    const studentInstruction = `
ROLE: You are a friendly Standard 3 teacher talking directly to a 6–7 year old child.
AUDIENCE: The child themselves.

STRICT RULES:
1. ONLY use information from the TEXTBOOK CONTEXT provided below.
2. If the answer is not in the context, respond ONLY with: "This topic is not in your books. Please ask your teacher!"
3. Do NOT mention source numbers, page numbers, chunk IDs, or retrieval details.
4. Do NOT use words like "powerful tool", "communicate", "express ourselves", or any abstract language.
5. Keep explanation under 6 short simple sentences.
6. Use only words a 6-year-old knows.
7. Be friendly and encouraging but brief.

After the explanation, generate 3–5 simple practice questions that:
- Are answerable STRICTLY from the same textbook context provided.
- Use NO outside knowledge.
- Are simple enough for a 6–7 year old.

OUTPUT FORMAT:
Return a JSON object with exactly three fields:
  - "explanation": Short, simple explanation (max 6 sentences). No source citations. No page numbers.
  - "simplified": ONE simple sentence (max 15 words) the child can understand.
  - "practice_questions": Array of 3–5 simple practice question strings.
`;

    const activeInstruction = mode === 'student' ? studentInstruction : parentInstruction;

    try {
      // ── Step 3: Generate grounded response via Groq (OpenAI-compatible) ──
      const groqResponse = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: activeInstruction },
            {
              role: 'user',
              content: mode === 'student'
                ? `TEXTBOOK CONTEXT:\n${contextString}\n\n---\n\nQuestion: ${query}\n\nAnswer simply for a 6-year-old. Then give practice questions.`
                : `TEXTBOOK CONTEXT:\n${contextString}\n\n---\n\nPARENT/CHILD QUESTION: ${query}`,
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
        throw new Error(`Groq API error (${groqResponse.status}): ${errorBody}`);
      }

      const groqData = await groqResponse.json();
      const rawText = groqData.choices?.[0]?.message?.content || '{}';
      console.log('[RAG] Raw LLM response:', rawText.substring(0, 200));

      const data = JSON.parse(rawText);

      // Log AI response
      logAction('rag_response', 'ai', {
        query,
        sourcesUsed: relevantChunks.length,
        method: searchMethod,
        confidence: +avgScore.toFixed(3),
        primaryBook,
      });

      return {
        explanation: data.explanation || 'No explanation generated.',
        simplified_explanation: data.simplified || 'Please ask your teacher!',
        book: primaryBook,
        page_reference: pages,
        sources: relevantChunks,
        retrieved_chunks,
        searchMethod,
        confidence: avgScore,
        mode,
        ...(mode === 'student' && data.practice_questions ? { practice_questions: data.practice_questions } : {}),
      };
    } catch (error) {
      console.error('[RAG] AI Error:', error);
      logAction('rag_error', 'ai', { query, error: String(error) });
      throw error;
    }
  }

  private emptyResponse(message: string): RAGResponse {
    return {
      explanation: message,
      simplified_explanation: message,
      book: 'N/A',
      page_reference: 'N/A',
      sources: [],
      retrieved_chunks: [],
      searchMethod: 'none',
      confidence: 0,
    };
  }

  /**
   * Fallback keyword search (when vector store is not initialized).
   */
  private fallbackKeywordSearch(query: string, knowledgeBase: TextbookChunk[]): SearchResult[] {
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    return knowledgeBase
      .map(chunk => {
        let score = 0;
        keywords.forEach(word => {
          if (chunk.content.toLowerCase().includes(word)) score += 2;
          if (chunk.chapter.toLowerCase().includes(word)) score += 3;
        });
        return { chunk, score: score / (keywords.length * 5), method: 'keyword' as const };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  // ─── Streaming Method ────────────────────────────────────

  /**
   * Stream a homework explanation via Groq SSE.
   * Delivers tokens in real-time for perceived-instant responses.
   */
  async streamExplainHomework(
    query: string,
    knowledgeBase: TextbookChunk[],
    mode: ResponseMode = 'parent',
    callbacks: {
      onSearching: () => void;
      onSourcesFound: (count: number) => void;
      onTextChunk: (text: string) => void;
      onComplete: (fullText: string, sources: SearchResult[]) => void;
      onError: (err: Error) => void;
    }
  ): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed) { callbacks.onError(new Error('Empty query')); return; }

    // Phase 1: Searching
    callbacks.onSearching();

    const ragStatus = getVectorStoreStatus();
    let searchResults: SearchResult[] = [];

    if (ragStatus.initialized && ragStatus.chunkCount > 0) {
      searchResults = await searchKnowledge(trimmed, 5);
      if (searchResults.length < 2) {
        searchResults = await searchKnowledge(trimmed, 5, undefined, 0.005);
      }
    } else if (knowledgeBase.length > 0) {
      searchResults = this.fallbackKeywordSearch(trimmed, knowledgeBase);
    }

    // Phase 2: Sources found
    callbacks.onSourcesFound(searchResults.length);

    const relevantChunks = searchResults.map(r => r.chunk);

    if (relevantChunks.length === 0) {
      callbacks.onComplete(
        "This topic is not available in the Std 7 textbooks. The AI could not find matching content.",
        []
      );
      return;
    }

    const contextString = relevantChunks.map((c, i) =>
      `[Source ${i + 1}: ${c.subject}, "${c.chapter}", p.${c.page}]\n${c.content}`
    ).join('\n\n---\n\n');

    const systemPrompt = mode === 'student'
      ? `You are a friendly Standard 3 teacher talking to a 6-7 year old child.
RULES: ONLY use info from the TEXTBOOK CONTEXT. Keep it under 6 short sentences. Use simple words.
After the explanation, give 3-5 practice questions from the same context.
Format: First the explanation, then a line "---PRACTICE---", then each question on its own line, then "---SIMPLE---" followed by a one-sentence summary.`
      : `You are the SSMS Standard 3 AI Homework Companion for parents.
RULES: ONLY use info from the TEXTBOOK CONTEXT. Cite Source numbers. 2-4 short paragraphs. Be encouraging.
After the explanation, add "---SIMPLE---" followed by ONE simple sentence (max 20 words) for the child.`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `TEXTBOOK CONTEXT:\n${contextString}\n\n---\n\nQuestion: ${trimmed}`,
            },
          ],
          temperature: 0.15,
          max_tokens: 1024,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq streaming error (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      // Phase 3: Generating (streaming)
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          if (!trimmedLine.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmedLine.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              callbacks.onTextChunk(fullText);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      logAction('rag_stream_complete', 'ai', {
        query: trimmed,
        sourcesCount: searchResults.length,
        responseLength: fullText.length,
      });

      callbacks.onComplete(fullText, searchResults);
    } catch (err) {
      console.error('[Streaming] Error:', err);
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // ─── NCERT Chapter-Aware Streaming Chat ─────────────────

  private normalizeRagSubject(subject: string): string {
    const s = subject.trim().toLowerCase();
    if (s === 'maths' || s === 'mathematics' || s === 'math') return 'Math';
    if (s === 'english') return 'English';
    if (s === 'science' || s === 'evs') return 'Science';
    return subject;
  }

  private normalizeChapterText(text: string): string {
    return text
      .toLowerCase()
      .replace(/chapter\s*\d+/g, ' ')
      .replace(/unit\s*\d+/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private chapterNameSimilarity(a: string, b: string): number {
    const na = this.normalizeChapterText(a);
    const nb = this.normalizeChapterText(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;
    if (na.includes(nb) || nb.includes(na)) return 0.9;

    const tokensA = new Set(na.split(' ').filter(t => t.length > 2));
    const tokensB = new Set(nb.split(' ').filter(t => t.length > 2));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersect = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersect++;
    }
    const union = new Set([...tokensA, ...tokensB]).size;
    return union > 0 ? intersect / union : 0;
  }

  private async retrieveNCERTChapterContext(
    subject: string,
    chapterName: string,
    chapterContext: string,
    userQuery: string,
  ): Promise<{
    resolvedChapter: string;
    results: SearchResult[];
    contextString: string;
    usedFallbackContext: boolean;
  }> {
    const ragSubject = this.normalizeRagSubject(subject);
    const status = getVectorStoreStatus();

    if (!status.initialized || status.chunkCount === 0) {
      return {
        resolvedChapter: chapterName,
        results: [],
        contextString: chapterContext,
        usedFallbackContext: true,
      };
    }

    const retrievalQuery = `${chapterName} ${userQuery}`.trim();

    const chapterProbe = await searchKnowledge(chapterName, 10, ragSubject, 0.001);
    const queryProbe = userQuery.trim()
      ? await searchKnowledge(retrievalQuery, 10, ragSubject, 0.001)
      : [];

    const merged = new Map<string, SearchResult>();
    for (const r of [...chapterProbe, ...queryProbe]) {
      const similarityBoost = this.chapterNameSimilarity(chapterName, r.chunk.chapter) * 0.45;
      const boosted: SearchResult = { ...r, score: r.score + similarityBoost };
      const existing = merged.get(r.chunk.id);
      if (!existing || boosted.score > existing.score) {
        merged.set(r.chunk.id, boosted);
      }
    }

    const mergedRanked = [...merged.values()].sort((a, b) => b.score - a.score);

    let resolvedChapter = chapterName;
    if (mergedRanked.length > 0) {
      const chapterScores = new Map<string, number>();
      for (const r of mergedRanked.slice(0, 8)) {
        chapterScores.set(
          r.chunk.chapter,
          (chapterScores.get(r.chunk.chapter) || 0) + r.score,
        );
      }
      resolvedChapter =
        [...chapterScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || chapterName;
    }

    let finalResults = await searchKnowledge(
      retrievalQuery || chapterName,
      6,
      ragSubject,
      0.001,
      resolvedChapter,
    );

    if (finalResults.length === 0) {
      finalResults = mergedRanked.slice(0, 6);
    }

    const ranked = finalResults
      .map(r => ({
        ...r,
        score: r.score + this.chapterNameSimilarity(chapterName, r.chunk.chapter) * 0.25,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (ranked.length === 0) {
      return {
        resolvedChapter: chapterName,
        results: [],
        contextString: chapterContext,
        usedFallbackContext: true,
      };
    }

    const contextString = ranked
      .map(
        (r, i) =>
          `[Source ${i + 1}: ${r.chunk.subject}, Chapter: "${r.chunk.chapter}", Page ${r.chunk.page}, Score ${r.score.toFixed(3)}]\n${r.chunk.content}`,
      )
      .join('\n\n---\n\n');

    return {
      resolvedChapter,
      results: ranked,
      contextString,
      usedFallbackContext: false,
    };
  }

  /**
   * Stream a context-aware NCERT chat response.
   * The system prompt is dynamically built from the selected
   * subject + chapter so the LLM stays grounded.
   */
  async streamNCERTChat(
    messages: { role: 'user' | 'assistant'; content: string }[],
    subject: string,
    chapterName: string,
    chapterContext: string,
    onChunk: (partialText: string) => void,
    onDone: (fullText: string) => void,
    onError: (err: Error) => void,
  ): Promise<void> {
    const latestUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const retrieval = await this.retrieveNCERTChapterContext(
      subject,
      chapterName,
      chapterContext,
      latestUserMessage,
    );

    logAction('ncert_rag_search', 'ai', {
      subject,
      requestedChapter: chapterName,
      resolvedChapter: retrieval.resolvedChapter,
      usedFallbackContext: retrieval.usedFallbackContext,
      resultsCount: retrieval.results.length,
      topChunkIds: retrieval.results.slice(0, 3).map(r => r.chunk.id),
      topScores: retrieval.results.slice(0, 3).map(r => +r.score.toFixed(4)),
    });

    const systemPrompt = `You are the NCERT Class 7 ${subject} Assistant - a helpful, accurate guide for parents teaching their child.

REQUESTED CHAPTER: "${chapterName}" (${subject})
RESOLVED CHAPTER FROM RAG: "${retrieval.resolvedChapter}"
TEXTBOOK CONTEXT (RAG):
${retrieval.contextString}

STRICT RULES:
1. ONLY provide information relevant to NCERT Class 7 ${subject}, specifically the chapter "${retrieval.resolvedChapter}".
2. If asked about topics outside this chapter or class, respond: "That topic is not in this chapter. Please select the correct chapter from the list above."
3. Use SIMPLE language a 6-year-old can understand. Short sentences. Friendly tone.
4. When the parent asks "Explain simply" - give a 2-3 sentence kid-friendly explanation.
5. When the parent asks for an "Example" - give a concrete, relatable example from daily life.
6. When the parent asks for a "Worksheet" - generate 5 simple practice questions appropriate for Class 7.
7. When the parent asks for a "Parent tip" - give a practical teaching strategy the parent can use at home.
8. Do NOT hallucinate content not present in the RAG context above.
9. Be encouraging and warm. Use 1-2 emojis per response (not more).
10. Keep responses concise - max 4-5 short paragraphs.`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          temperature: 0.2,
          max_tokens: 1024,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          if (!trimmedLine.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmedLine.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              onChunk(fullText);
            }
          } catch {
            // skip malformed SSE
          }
        }
      }

      logAction('ncert_chat_response', 'ai', {
        subject,
        chapter: retrieval.resolvedChapter || chapterName,
        responseLength: fullText.length,
      });

      onDone(fullText);
    } catch (err) {
      console.error('[NCERT Chat] Error:', err);
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
  async generateParentInsight(metrics: {
    level: number;
    xp: number;
    streak: number;
    attendancePercent: number;
    completedGames: number;
    homeworkPercent: number;
    skillBreakdown: { label: string; pct: number }[];
    treeStage: string;
    recentActivities: string[];
    ncertChaptersAccessed: string[];
  }): Promise<string> {
    const systemPrompt = `You are a warm, encouraging AI learning coach for parents of Class 7 (age 8-9) children. 
Generate a SHORT insight summary (3-4 sentences max) based on the child's real metrics below.

RULES:
1. Be warm, positive, and growth-focused — never alarming or negative.
2. Highlight ONE strength and suggest ONE gentle action.
3. Use simple language. 1-2 emojis max.
4. Never mention raw numbers — use phrases like "doing great", "building momentum", "could use a little more practice".
5. If attendance is low, frame it positively: "More days together means more fun learning!"
6. Keep it under 60 words. No bullet points.`;

    const userMsg = `Child's metrics:
- Level ${metrics.level}, ${metrics.xp} XP, ${metrics.streak}-day streak
- Attendance: ${metrics.attendancePercent}%
- Games completed: ${metrics.completedGames}, Homework: ${metrics.homeworkPercent}%
- Skills: ${metrics.skillBreakdown.map(s => `${s.label}: ${s.pct}%`).join(', ')}
- Tree stage: ${metrics.treeStage}
- Recent activities: ${metrics.recentActivities.slice(0, 5).join(', ') || 'None yet'}
- NCERT chapters accessed: ${metrics.ncertChaptersAccessed.join(', ') || 'None yet'}

Write a 3-4 sentence parent insight summary.`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
          temperature: 0.4,
          max_tokens: 200,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error(`Groq API error (${response.status})`);

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();

      logAction('parent_insight_generated', 'ai', {
        level: metrics.level,
        streak: metrics.streak,
        responseLength: text?.length ?? 0,
      });

      return text || 'Your child is on a wonderful learning journey! Keep encouraging them every day. 🌟';
    } catch (err) {
      console.error('[Parent Insight] Error:', err);
      return 'Your child is on a wonderful learning journey! Keep encouraging them every day. 🌟';
    }
  }
}

export const aiService = new AIService();

