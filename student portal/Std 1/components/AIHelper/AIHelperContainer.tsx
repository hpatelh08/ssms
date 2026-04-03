import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextbookChunk, RAGStatus } from '../../types';
import { aiService, RAGResponse, ResponseMode } from '../../services/geminiService';
import { chapterRAGQuery, ChapterRAGResponse } from '../../services/ragService';
import { buildChapterIndex, ChapterInfo } from '../../services/chapterFilter';
import { logAction } from '../../utils/auditLog';
import { AIInput } from './AIInput';
import { AIResponseCard } from './AIResponseCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorState } from './ErrorState';

// ── Types ─────────────────────────────────────────────────

interface HistoryEntry {
  query: string;
  response: RAGResponse;
  timestamp: number;
  subject?: string;
  chapter?: string;
}

interface AIHelperContainerProps {
  knowledgeBase: TextbookChunk[];
  onActionComplete: (xp: number) => void;
  ragStatus: RAGStatus;
}

const HISTORY_KEY = 'ssms_ai_history';
const MAX_HISTORY = 20;

// ── Helpers ───────────────────────────────────────────────

function loadHistory(): HistoryEntry[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    // quota exceeded — silently ignore
  }
}

/** Adapt ChapterRAGResponse to the existing RAGResponse shape for the UI */
function adaptChapterResponse(res: ChapterRAGResponse): RAGResponse {
  return {
    explanation: res.explanation,
    simplified_explanation: res.simplified_explanation,
    book: res.source_chunks[0]?.subject || 'N/A',
    page_reference: res.page_numbers.length > 0 ? res.page_numbers.map(p => `p.${p}`).join(', ') : 'N/A',
    sources: res.source_chunks.map(sc => ({
      id: sc.id,
      subject: sc.subject as 'English' | 'Math',
      content: sc.snippet,
      page: sc.page,
      chapter: sc.chapter,
    })),
    retrieved_chunks: res.source_chunks,
    searchMethod: res.searchMethod,
    confidence: res.confidence,
    mode: res.mode,
    ...(res.practice_questions ? { practice_questions: res.practice_questions } : {}),
  };
}

// ── Component ─────────────────────────────────────────────

const AIHelperContainer: React.FC<AIHelperContainerProps> = ({
  knowledgeBase,
  onActionComplete,
  ragStatus,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGResponse | null>(null);
  const [activeQuery, setActiveQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // ── Streaming state ─────────────────────────────────────
  const [streamingText, setStreamingText] = useState('');
  const [streamPhase, setStreamPhase] = useState<'idle' | 'searching' | 'sources-found' | 'generating'>('idle');
  const [streamSourcesCount, setStreamSourcesCount] = useState(0);

  // ── User Mode (Student / Parent) ────────────────────────
  const [userMode, setUserMode] = useState<ResponseMode>('student');

  // ── Chapter Selection State ─────────────────────────────
  const [selectedSubject, setSelectedSubject] = useState<'English' | 'Math' | ''>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');

  // Build chapter index (memoized)
  const chapterIndex = useMemo(() => buildChapterIndex(knowledgeBase), [knowledgeBase]);

  // Get chapters for selected subject
  const availableChapters: ChapterInfo[] = useMemo(() => {
    if (!selectedSubject) return [];
    return chapterIndex[selectedSubject] || [];
  }, [chapterIndex, selectedSubject]);

  // Reset chapter when subject changes
  useEffect(() => {
    setSelectedChapter('');
  }, [selectedSubject]);

  // Persist history
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Is chapter-locked mode active?
  const isChapterLocked = !!(selectedSubject && selectedChapter);

  // ── Helper: finalize response (history, XP, scroll, logging) ──

  const finalizeResponse = useCallback((response: RAGResponse, trimmed: string) => {
    setResult(response);

    const entry: HistoryEntry = {
      query: trimmed,
      response,
      timestamp: Date.now(),
      subject: selectedSubject || undefined,
      chapter: selectedChapter || undefined,
    };
    setHistory(prev => [entry, ...prev.filter(h => h.query !== trimmed)].slice(0, MAX_HISTORY));

    if (response.confidence > 0) {
      onActionComplete(10);
    }

    logAction('ai_query_complete', 'ai', {
      query: trimmed,
      confidence: response.confidence,
      sourcesCount: response.sources.length,
      searchMethod: response.searchMethod,
      mode: isChapterLocked ? 'chapter-locked' : 'global',
      subject: selectedSubject || 'global',
      chapter: selectedChapter || 'none',
    });

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }, [selectedSubject, selectedChapter, isChapterLocked, onActionComplete]);

  // ── Submit query ────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveQuery(trimmed);
    setStreamingText('');
    setStreamPhase('idle');
    setStreamSourcesCount(0);

    logAction('ai_query_start', 'ai', {
      query: trimmed,
      subject: selectedSubject || 'global',
      chapter: selectedChapter || 'none',
      mode: isChapterLocked ? 'chapter-locked' : 'global',
    });

    try {
      if (isChapterLocked) {
        // ── Chapter-locked RAG path (non-streaming) ──
        const chapterResponse = await chapterRAGQuery(
          trimmed,
          selectedSubject as 'English' | 'Math',
          selectedChapter,
          knowledgeBase,
          userMode
        );
        const response = adaptChapterResponse(chapterResponse);
        finalizeResponse(response, trimmed);
      } else {
        // ── Global RAG path — STREAMING ──
        await aiService.streamExplainHomework(trimmed, knowledgeBase, userMode, {
          onSearching: () => setStreamPhase('searching'),
          onSourcesFound: (count) => {
            setStreamPhase('sources-found');
            setStreamSourcesCount(count);
            // Brief pause then switch to generating
            setTimeout(() => setStreamPhase('generating'), 600);
          },
          onTextChunk: (text) => {
            setStreamingText(text);
          },
          onComplete: (fullText, searchResults) => {
            // Parse streaming output into RAGResponse
            const relevantChunks = searchResults.map(r => r.chunk);
            const avgScore = searchResults.length > 0
              ? searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length
              : 0;
            const retrieved_chunks = searchResults.map(r => ({
              id: r.chunk.id,
              subject: r.chunk.subject,
              chapter: r.chunk.chapter,
              page: r.chunk.page,
              snippet: r.chunk.content.substring(0, 150),
              score: +r.score.toFixed(4),
              method: r.method,
            }));

            // Split on delimiter markers
            let explanation = fullText;
            let simplified = '';
            let practice_questions: string[] = [];

            const simpleIdx = fullText.indexOf('---SIMPLE---');
            const practiceIdx = fullText.indexOf('---PRACTICE---');

            if (practiceIdx !== -1 && simpleIdx !== -1) {
              explanation = fullText.substring(0, practiceIdx).trim();
              const practiceSection = fullText.substring(practiceIdx + 14, simpleIdx).trim();
              practice_questions = practiceSection.split('\n').map(q => q.trim()).filter(q => q.length > 0);
              simplified = fullText.substring(simpleIdx + 12).trim();
            } else if (simpleIdx !== -1) {
              explanation = fullText.substring(0, simpleIdx).trim();
              simplified = fullText.substring(simpleIdx + 12).trim();
            }

            const primaryBook = relevantChunks[0]?.subject || 'Unknown';
            const pages = [...new Set(relevantChunks.map(c => `p.${c.page}`))].join(', ');

            const response: RAGResponse = {
              explanation,
              simplified_explanation: simplified || 'Ask your teacher for more details!',
              book: primaryBook,
              page_reference: pages || 'N/A',
              sources: relevantChunks,
              retrieved_chunks,
              searchMethod: searchResults[0]?.method || 'none',
              confidence: avgScore,
              mode: userMode,
              ...(practice_questions.length > 0 ? { practice_questions } : {}),
            };

            setStreamingText('');
            setStreamPhase('idle');
            finalizeResponse(response, trimmed);
          },
          onError: (err) => {
            throw err;
          },
        });
      }
    } catch (err) {
      console.error('[AIHelper] Error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      logAction('ai_query_error', 'ai', { query: trimmed, error: String(err) });
    } finally {
      setLoading(false);
      setStreamPhase('idle');
    }
  }, [query, loading, knowledgeBase, onActionComplete, selectedSubject, selectedChapter, isChapterLocked, userMode, finalizeResponse]);

  // ── Follow-up question ─────────────────────────────────

  const handleFollowUp = useCallback((question: string) => {
    setQuery(question);
    setTimeout(() => {
      setQuery(question);
    }, 50);
  }, []);

  // ── Explain simpler ────────────────────────────────────

  const handleExplainSimpler = useCallback(() => {
    if (!activeQuery) return;
    setQuery(`Explain more simply: ${activeQuery}`);
  }, [activeQuery]);

  // ── Clear chat ─────────────────────────────────────────

  const handleClear = useCallback(() => {
    setQuery('');
    setResult(null);
    setError(null);
    setActiveQuery('');
  }, []);

  // ── Load from history ──────────────────────────────────

  const handleLoadHistory = useCallback((entry: HistoryEntry) => {
    setQuery(entry.query);
    setResult(entry.response);
    setActiveQuery(entry.query);
    setShowHistory(false);
    // Restore chapter selection if available
    if (entry.subject) setSelectedSubject(entry.subject as 'English' | 'Math');
    if (entry.chapter) setSelectedChapter(entry.chapter);
  }, []);

  // ── Clear history ──────────────────────────────────────

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 py-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Hero Header ─────────────────────────────── */}
      <div className="text-center space-y-2">
        <motion.div
          className="inline-flex items-center gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-2xl">🤖</span>
          </div>
          <div className="text-left">
            <h1 className="text-xl font-black text-gray-800 tracking-tight">AI Homework Helper</h1>
            <p className="text-[11px] text-gray-400 font-medium">Powered by NCERT Std 1 Textbooks</p>
          </div>
        </motion.div>

        {/* RAG Status Indicator */}
        <motion.div
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className={`w-2 h-2 rounded-full ${
            ragStatus.embeddingsReady ? 'bg-green-400 animate-pulse' : 
            ragStatus.initialized ? 'bg-amber-400 animate-pulse' : 'bg-gray-300'
          }`} />
          <span className="text-[10px] font-medium text-gray-400">
            {ragStatus.embeddingsReady
              ? `RAG Active • ${ragStatus.chunkCount} chunks • ${ragStatus.embeddingCount} embeddings`
              : ragStatus.initialized
              ? `Chunks loaded • Building embeddings${ragStatus.embeddingProgress ? ` (${ragStatus.embeddingProgress.done}/${ragStatus.embeddingProgress.total})` : '...'}`
              : 'Initializing knowledge base...'}
          </span>
        </motion.div>
      </div>

      {/* ── Student / Parent Mode Toggle ──────────── */}
      <motion.div
        className="bg-white/50 backdrop-blur-sm rounded-2xl border border-indigo-100/30 p-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">👤</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Response Mode
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setUserMode('student')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              userMode === 'student'
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md shadow-green-500/25 scale-[1.02]'
                : 'bg-gray-100/60 text-gray-400 hover:bg-green-50/40 hover:text-green-500'
            }`}
          >
            🧒 Student Mode
          </button>
          <button
            onClick={() => setUserMode('parent')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              userMode === 'parent'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                : 'bg-gray-100/60 text-gray-400 hover:bg-blue-50/40 hover:text-blue-500'
            }`}
          >
            👤 Parent Mode
          </button>
        </div>
        <p className="text-[9px] text-gray-400 font-medium mt-2 text-center">
          {userMode === 'student'
            ? '🟢 Simple answers for your child — no technical details, includes practice questions'
            : '🔵 Full transparency — sources, page numbers, retrieval confidence'}
        </p>
      </motion.div>

      {/* ── Chapter Selection Panel ─────────────────── */}
      <motion.div
        className="bg-white/50 backdrop-blur-sm rounded-2xl border border-blue-100/30 p-4 space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">📘</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Chapter-Locked RAG Mode
          </span>
          {isChapterLocked && (
            <span className="ml-auto text-[9px] px-2 py-0.5 bg-green-100/60 text-green-600 rounded-full font-bold">
              🔒 Locked
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Subject Selector */}
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as 'English' | 'Math' | '')}
              className="w-full px-3 py-2.5 bg-white/60 border border-blue-100/30 rounded-xl text-sm text-blue-900 focus:border-blue-400 outline-none transition-colors cursor-pointer"
            >
              <option value="">Select Subject...</option>
              <option value="English">📙 English</option>
              <option value="Math">📐 Mathematics</option>
            </select>
          </div>

          {/* Chapter Selector */}
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Chapter
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              disabled={!selectedSubject}
              className="w-full px-3 py-2.5 bg-white/60 border border-blue-100/30 rounded-xl text-sm text-blue-900 focus:border-blue-400 outline-none transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">{selectedSubject ? 'Select Chapter...' : 'Select subject first'}</option>
              {availableChapters.map((ch) => (
                <option key={ch.raw} value={ch.raw}>
                  {ch.label} ({ch.chunkCount} chunks, p.{ch.pageRange[0]}–{ch.pageRange[1]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chapter info badge */}
        <AnimatePresence>
          {isChapterLocked && (
            <motion.div
              className="flex items-center gap-2 pt-1"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-[9px] text-gray-400 font-medium">
                AI will answer ONLY from this chapter. No cross-chapter retrieval.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {!isChapterLocked && (
          <p className="text-[9px] text-amber-500/70 font-medium italic">
            💡 Select a subject and chapter for deterministic, chapter-restricted answers. Without selection, global search is used.
          </p>
        )}
      </motion.div>

      {/* ── Toolbar: History + Clear ─────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all ${
            showHistory
              ? 'bg-blue-100/60 text-blue-600'
              : 'bg-gray-100/40 text-gray-400 hover:text-gray-600 hover:bg-gray-100/60'
          }`}
        >
          📜 Recent ({history.length})
        </button>

        {(result || error) && (
          <button
            onClick={handleClear}
            className="text-[10px] px-3 py-1.5 rounded-lg bg-gray-100/40 text-gray-400 hover:text-red-500 hover:bg-red-50/40 font-bold transition-all"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── History Panel ────────────────────────────── */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-gray-100/30 p-4 space-y-2 max-h-[200px] overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent Questions</span>
                <button
                  onClick={handleClearHistory}
                  className="text-[9px] text-gray-300 hover:text-red-400 font-medium transition-colors"
                >
                  Clear All
                </button>
              </div>
              {history.map((entry, i) => (
                <motion.button
                  key={entry.timestamp}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50/40 transition-colors group"
                  onClick={() => handleLoadHistory(entry)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <p className="text-xs text-gray-600 font-medium group-hover:text-blue-600 truncate">
                    {entry.query}
                  </p>
                  <p className="text-[9px] text-gray-300 font-medium">
                    {new Date(entry.timestamp).toLocaleString()} • {entry.response.book}
                    {entry.chapter && ` • ${entry.chapter.replace(/\n/g, ' ')}`}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Section ────────────────────────────── */}
      <AIInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {/* ── Loading / Streaming State ────────────────── */}
      <AnimatePresence>
        {loading && !streamingText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <LoadingSkeleton
              phase={streamPhase === 'idle' ? 'searching' : streamPhase}
              sourcesCount={streamSourcesCount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Streaming Text Preview ────────────────────── */}
      <AnimatePresence>
        {streamingText && loading && (
          <motion.div
            className="bg-white/60 backdrop-blur-sm rounded-2xl border border-blue-100/30 p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <span className="text-xs">✍️</span>
              </motion.div>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Generating response...</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {streamingText}
              <motion.span
                className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 align-middle"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error State ──────────────────────────────── */}
      <AnimatePresence>
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ErrorState message={error} onRetry={handleSubmit} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Response Card ────────────────────────────── */}
      <div ref={resultRef}>
        <AnimatePresence>
          {result && !loading && (
            <AIResponseCard
              response={result}
              query={activeQuery}
              onExplainSimpler={handleExplainSimpler}
              onAskFollowUp={handleFollowUp}
              userMode={userMode}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Governance Footer ────────────────────────── */}
      <motion.div
        className="flex items-center justify-center gap-2 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span className="text-[9px] font-medium text-gray-300 tracking-wide">
          {isChapterLocked
            ? `Chapter-Locked RAG • ${selectedSubject} • No cross-chapter retrieval`
            : 'Zero-Hallucination RAG Mode Active • Grounded in NCERT Textbooks Only'}
        </span>
      </motion.div>
    </motion.div>
  );
};

export { AIHelperContainer };
export default AIHelperContainer;
