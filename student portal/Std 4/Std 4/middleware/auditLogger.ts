/**
 * RAG Audit Logger Middleware
 * ===========================
 * Enhanced logging for chapter-locked RAG interactions.
 * Logs: user_id, subject, chapter, question, retrieved_chunk_ids,
 * similarity_scores, timestamp, LLM call status, fallback status.
 *
 * Stored in localStorage for parent transparency panel access.
 */

// ─── Types ────────────────────────────────────────────────

export interface RAGAuditEntry {
  id: string;
  timestamp: string;
  subject: string;
  chapter: string;
  question: string;
  retrieved_chunk_ids: string[];
  similarity_scores: number[];
  llm_called: boolean;
  fallback: boolean;
  elapsed_ms?: number;
  user_id?: string;
}

// ─── Storage ──────────────────────────────────────────────

const STORAGE_KEY = 'ssms_rag_audit_log';
const MAX_ENTRIES = 200;

/**
 * Log a RAG interaction with full retrieval details.
 */
export function logRAGInteraction(entry: Omit<RAGAuditEntry, 'id'>): void {
  try {
    const log = getRAGAuditLog();
    const newEntry: RAGAuditEntry = {
      ...entry,
      id: `rag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
    };

    log.unshift(newEntry);

    // Cap size
    const trimmed = log.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

    console.log(`[RAGAudit] Logged: ${entry.subject}/${entry.chapter} — "${entry.question.slice(0, 40)}..." (${entry.retrieved_chunk_ids.length} chunks, LLM: ${entry.llm_called}, Fallback: ${entry.fallback})`);
  } catch (e) {
    console.warn('[RAGAudit] Failed to log:', e);
  }
}

/**
 * Get all RAG audit entries.
 */
export function getRAGAuditLog(): RAGAuditEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get RAG audit entries filtered by subject and/or chapter.
 */
export function getFilteredRAGAudit(
  subject?: string,
  chapter?: string
): RAGAuditEntry[] {
  const log = getRAGAuditLog();
  return log.filter(entry => {
    if (subject && entry.subject !== subject) return false;
    if (chapter && entry.chapter !== chapter) return false;
    return true;
  });
}

/**
 * Get summary stats from the RAG audit log.
 */
export function getRAGAuditStats(): {
  totalQueries: number;
  llmCalls: number;
  fallbacks: number;
  avgChunksRetrieved: number;
  bySubject: Record<string, number>;
} {
  const log = getRAGAuditLog();
  const totalQueries = log.length;
  const llmCalls = log.filter(e => e.llm_called).length;
  const fallbacks = log.filter(e => e.fallback).length;
  const avgChunksRetrieved = totalQueries > 0
    ? log.reduce((sum, e) => sum + e.retrieved_chunk_ids.length, 0) / totalQueries
    : 0;

  const bySubject: Record<string, number> = {};
  for (const entry of log) {
    bySubject[entry.subject] = (bySubject[entry.subject] || 0) + 1;
  }

  return { totalQueries, llmCalls, fallbacks, avgChunksRetrieved, bySubject };
}

/**
 * Clear the RAG audit log.
 */
export function clearRAGAuditLog(): void {
  localStorage.removeItem(STORAGE_KEY);
}
