
import { TextbookChunk } from "../types";
import { searchKnowledge, SearchResult, getVectorStoreStatus } from "./vectorStore";
import { logAction } from "../utils/auditLog";

// â”€â”€â”€ Groq API Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const CHAT_ANALYTICS_KEY = 'ssms_ai_question_analytics_v1';

function getGroqApiKey(): string {
  return process.env.GROQ_API_KEY || '';
}

function normalizeSubjectForChunks(subject: string): string {
  if (subject === 'Maths') return 'Math';
  return subject;
}

function recordQuestionAnalytics(question: string, subject: string, chapter: string): void {
  try {
    const raw = localStorage.getItem(CHAT_ANALYTICS_KEY);
    const data = raw
      ? JSON.parse(raw)
      : { byQuestion: {} as Record<string, number>, bySubject: {} as Record<string, number>, byChapter: {} as Record<string, number> };

    const normalizedQ = question.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 140);
    if (normalizedQ) {
      data.byQuestion[normalizedQ] = (data.byQuestion[normalizedQ] || 0) + 1;
    }

    data.bySubject[subject] = (data.bySubject[subject] || 0) + 1;
    data.byChapter[`${subject}::${chapter}`] = (data.byChapter[`${subject}::${chapter}`] || 0) + 1;

    localStorage.setItem(CHAT_ANALYTICS_KEY, JSON.stringify(data));
  } catch {
    // ignore analytics failures
  }
}

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Debounce / duplicate-call guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let _lastQuery = '';
let _lastQueryTime = 0;
let _pendingPromise: Promise<RAGResponse> | null = null;
const DEBOUNCE_MS = 400;

// â”€â”€â”€ Query embedding cache â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // â”€â”€ Duplicate call guard â”€â”€
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
    // â”€â”€ Step 1: Retrieve relevant chunks via RAG pipeline â”€â”€
    const ragStatus = getVectorStoreStatus();
    let searchResults: SearchResult[] = [];

    console.log('[RAG] Query:', query);
    console.log('[RAG] Store status:', ragStatus);

    if (ragStatus.initialized && ragStatus.chunkCount > 0) {
      // Primary RAG path â€” try with standard threshold first
      searchResults = await searchKnowledge(query, 5);

      console.log({
        query,
        retrieved_chunk_ids: searchResults.map(r => r.chunk.id),
        similarity_scores: searchResults.map(r => ({ id: r.chunk.id, score: +r.score.toFixed(4), method: r.method })),
      });

      // â”€â”€ Threshold relaxation: if too few results, retry with lower threshold â”€â”€
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

    // â”€â”€ Edge case: no chunks found â”€â”€
    if (relevantChunks.length === 0) {
      logAction('rag_no_results', 'ai', { query });
      return {
        explanation: "This topic is not available in the Std 4 textbooks. The AI could not find any matching content in the uploaded English or Mathematics books.",
        simplified_explanation: "This is not in your school books. Ask your teacher! ðŸ“š",
        book: 'N/A',
        page_reference: 'N/A',
        sources: [],
        retrieved_chunks: [],
        searchMethod: 'none',
        confidence: 0,
      };
    }

    // â”€â”€ Step 2: Build grounded context with clear source numbering â”€â”€
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
ROLE: You are the SSMS Standard 1 AI Homework Companion.
AUDIENCE: A parent helping their 6â€“7-year-old child with homework.

STRICT GROUNDING RULES (MANDATORY):
1. ONLY use information from the TEXTBOOK CONTEXT provided below.
2. NEVER introduce facts, examples, or concepts NOT present in the context.
3. If the context does NOT contain enough information to answer, say clearly:
   "This topic isn't fully covered in the textbook pages I found. Please check with your teacher."
4. ALWAYS cite which Source number(s) you used so the parent can verify.
5. Do NOT hallucinate page numbers, chapter names, or content.

PEDAGOGICAL RULES:
6. Explain CONCEPTS â€” do NOT give direct final answers to homework questions.
7. Use simple words appropriate for a 6â€“7-year-old child.
8. Be encouraging, warm, and supportive.
9. Use emojis sparingly to keep the child engaged (1â€“2 per paragraph max).

OUTPUT FORMAT:
Return a JSON object with exactly two fields:
  - "explanation": A clear, grounded explanation citing the source(s) used. 2â€“4 short paragraphs. Written for the parent to read to their child.
  - "simplified": ONE simple sentence (max 20 words) a 6-year-old can understand on their own.
`;

    const studentInstruction = `
ROLE: You are a friendly Standard 1 teacher talking directly to a 6â€“7 year old child.
AUDIENCE: The child themselves.

STRICT RULES:
1. ONLY use information from the TEXTBOOK CONTEXT provided below.
2. If the answer is not in the context, respond ONLY with: "This topic is not in your books. Please ask your teacher!"
3. Do NOT mention source numbers, page numbers, chunk IDs, or retrieval details.
4. Do NOT use words like "powerful tool", "communicate", "express ourselves", or any abstract language.
5. Keep explanation under 6 short simple sentences.
6. Use only words a 6-year-old knows.
7. Be friendly and encouraging but brief.

After the explanation, generate 3â€“5 simple practice questions that:
- Are answerable STRICTLY from the same textbook context provided.
- Use NO outside knowledge.
- Are simple enough for a 6â€“7 year old.

OUTPUT FORMAT:
Return a JSON object with exactly three fields:
  - "explanation": Short, simple explanation (max 6 sentences). No source citations. No page numbers.
  - "simplified": ONE simple sentence (max 15 words) the child can understand.
  - "practice_questions": Array of 3â€“5 simple practice question strings.
`;

    const activeInstruction = mode === 'student' ? studentInstruction : parentInstruction;

    try {
      // â”€â”€ Step 3: Generate grounded response via Groq (OpenAI-compatible) â”€â”€
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

  // â”€â”€â”€ Streaming Method â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        "This topic is not available in the Std 4 textbooks. The AI could not find matching content.",
        []
      );
      return;
    }

    const contextString = relevantChunks.map((c, i) =>
      `[Source ${i + 1}: ${c.subject}, "${c.chapter}", p.${c.page}]\n${c.content}`
    ).join('\n\n---\n\n');

    const systemPrompt = mode === 'student'
      ? `You are a friendly Standard 1 teacher talking to a 6-7 year old child.
RULES: ONLY use info from the TEXTBOOK CONTEXT. Keep it under 6 short sentences. Use simple words.
After the explanation, give 3-5 practice questions from the same context.
Format: First the explanation, then a line "---PRACTICE---", then each question on its own line, then "---SIMPLE---" followed by a one-sentence summary.`
      : `You are the SSMS Standard 1 AI Homework Companion for parents.
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

  // â”€â”€â”€ NCERT Chapter-Aware Streaming Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content?.trim() || '';
    if (!lastUserMessage) {
      onError(new Error('Empty question'));
      return;
    }

    const subjectKey = normalizeSubjectForChunks(subject);
    recordQuestionAnalytics(lastUserMessage, subject, chapterName);

    let chapterResults: SearchResult[] = [];
    let nearestChapter = '';

    try {
      chapterResults = await searchKnowledge(lastUserMessage, 5, subjectKey, 0.005, chapterName);

      if (chapterResults.length === 0) {
        const nearest = await searchKnowledge(lastUserMessage, 3, subjectKey, 0.003);
        nearestChapter = nearest[0]?.chunk?.chapter || '';
      }
    } catch {
      chapterResults = [];
    }

    const retrievedContext = chapterResults.length > 0
      ? chapterResults
          .map((r, i) => `Source ${i + 1}\nType: PDF\nBook: Class 4 ${r.chunk.subject}\nChapter: ${r.chunk.chapter}\nPage: ${r.chunk.page}\nText: ${r.chunk.content}`)
          .join('\n\n---\n\n')
      : `Source 1\nType: Chapter Notes\nBook: Class 4 ${subject}\nChapter: ${chapterName}\nPage: N/A\nText: ${chapterContext}`;

    if (chapterResults.length === 0 && !chapterContext.trim()) {
      const fallbackText = [
        'Direct Answer: I could not find the exact answer in the provided study material.',
        'Explanation: Please try a different chapter/topic and ask again.',
        `Example: Try asking from chapter "${nearestChapter || chapterName}".`,
        `Source: No matching PDF/chapter transcript found for ${subject} · ${chapterName}.`,
        '',
        `Recommended Chapter: ${nearestChapter || chapterName}`,
      ].join('\n');

      onChunk(fallbackText);
      onDone(fallbackText);
      return;
    }

    const systemPrompt = `You are a student learning assistant for a school website.

Your job is to answer student questions only from the retrieved study material context, including PDFs, chapter notes, and chapter video transcripts.

Rules:
- Answer only from provided context.
- Keep language simple and easy for school students.
- If the question is math-related, explain step by step.
- If the answer is not found in the provided context, clearly say you could not find it in the study material.
- Do not hallucinate or invent facts.
- Mention source names used in the answer.
- If video context is used, mention the video title.
- If PDF context is used, mention the book/chapter/page if available.
- Keep answers helpful, educational, and short first, then detailed if needed.
- Understand Hindi/English/Hinglish mixed questions, but ALWAYS respond in English only.
- In "Related Questions for Revision", do NOT use the word "example" and do NOT ask "give an example" type questions.

Answer format (must follow):
Direct Answer
Explanation
Example (if useful)
Source

Also include at end:
- Recommended Chapter (if answer missing from current chapter, suggest nearest)

Never use outside knowledge.`;

    const userPrompt = `Student Standard: 4

Subject: ${subject}

Chapter: ${chapterName}

User Question: ${lastUserMessage}

Retrieved Context: ${retrievedContext}

Recent Chat Memory:
${messages.slice(-8).map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Fallback nearest chapter: ${nearestChapter || 'Not found'}

Instruction: Answer only from retrieved context in simple student-friendly English.`;

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
            { role: 'user', content: userPrompt },
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
        chapter: chapterName,
        responseLength: fullText.length,
      });

      onDone(fullText);
    } catch (err) {
      console.error('[NCERT Chat] Error:', err);
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // â”€â”€â”€ AI Parent Insight Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Generate a short, warm, actionable parent insight summary
   * from the child's real-time metrics. Non-streaming (short response).
   */
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
    const systemPrompt = `You are a warm, encouraging AI learning coach for parents of Class 4 (age 6-7) children. 
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

      return text || 'Your child is on a wonderful learning journey! Keep encouraging them every day. ðŸŒŸ';
    } catch (err) {
      console.error('[Parent Insight] Error:', err);
      return 'Your child is on a wonderful learning journey! Keep encouraging them every day. ðŸŒŸ';
    }
  }
}

export const aiService = new AIService();

