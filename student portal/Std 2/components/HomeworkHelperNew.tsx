import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../services/geminiService';
import { TextbookChunk, RAGStatus } from '../types';
import { GlassCard } from './ui/GlassCard';
import { FloatingIcon } from './ui/FloatingIcon';
import { logAction } from '../utils/auditLog';
import { XP_REWARDS } from '../utils/xpEngine';

interface HomeworkHelperProps {
  knowledgeBase: TextbookChunk[];
  onActionComplete: (xp: number) => void;
  ragStatus?: RAGStatus;
}

export const HomeworkHelper: React.FC<HomeworkHelperProps> = ({ knowledgeBase, onActionComplete, ragStatus }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    explanation: string;
    simplified: string;
    sources: TextbookChunk[];
    searchMethod?: string;
    confidence?: number;
  } | null>(null);
  const [showSimplified, setShowSimplified] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Typing animation effect
  useEffect(() => {
    if (!result) return;
    const text = showSimplified ? result.simplified : result.explanation;
    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [result, showSimplified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    logAction('ai_query_submitted', 'ai', { query: query.trim() });

    try {
      const res = await aiService.explainHomework(query, knowledgeBase);
      setResult(res);
      onActionComplete(XP_REWARDS.AI_QUERY);
      logAction('ai_response_received', 'ai', {
        query: query.trim(),
        sourcesUsed: res.sources.map(s => `${s.subject}:${s.chapter}:p${s.page}`),
        responseLength: res.explanation.length,
      });
    } catch (err) {
      console.error(err);
      logAction('ai_error', 'ai', { query: query.trim(), error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Query Card */}
      <GlassCard variant="strong" hover={false} className="p-6 lg:p-8 relative overflow-hidden">
        {/* AI Glow Accent */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <FloatingIcon icon="📖" size="md" glow="blue" animate={false} />
            <div>
              <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                AI Homework Helper
                <motion.span
                  className="inline-block w-2 h-2 rounded-full bg-cyan-400"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </h2>
            </div>
          </div>
          <p className="text-blue-400 text-sm mb-2 ml-[52px]">
            Parents: Enter the homework topic. AI explains using only school textbooks.
          </p>

          {/* RAG Status Indicator */}
          <div className="ml-[52px] mb-6 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
              ragStatus?.initialized
                ? 'bg-green-100/60 text-green-700'
                : 'bg-yellow-100/60 text-yellow-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ragStatus?.initialized ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              {ragStatus?.initialized
                ? `${ragStatus.chunkCount.toLocaleString()} textbook passages loaded`
                : 'Loading knowledge base...'}
            </span>
            {ragStatus?.embeddingsReady && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-blue-100/50 text-blue-600">
                🧠 Semantic search active
              </span>
            )}
            {ragStatus?.embeddingProgress && !ragStatus?.embeddingsReady && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-purple-100/50 text-purple-600">
                ⏳ Building AI index... {ragStatus.embeddingProgress.done}/{ragStatus.embeddingProgress.total}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., How do I explain addition to my child?"
                className="w-full p-4 bg-white/40 border-2 border-blue-100/40 rounded-2xl focus:border-blue-300 focus:bg-white/60 focus:outline-none transition-all min-h-[100px] text-blue-900 placeholder-blue-300 resize-none"
              />
              <motion.div
                className="absolute bottom-3 right-3 text-[10px] text-blue-300 font-medium"
                animate={{ opacity: query.length > 0 ? 1 : 0.5 }}
              >
                {query.length > 0 ? '✓ Ready' : 'Type a question...'}
              </motion.div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all relative overflow-hidden"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    className="inline-block w-1.5 h-1.5 bg-white rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="inline-block w-1.5 h-1.5 bg-white rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.span
                    className="inline-block w-1.5 h-1.5 bg-white rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  />
                  <span className="ml-2">AI is thinking</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>✨</span>
                  <span>Explain for Homework</span>
                </span>
              )}
            </motion.button>
          </form>
        </div>
      </GlassCard>

      {/* Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <GlassCard variant="strong" hover={false} className="p-6 lg:p-8 relative overflow-hidden">
              {/* AI Glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 rounded-t-3xl" />

              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="text-xl"
                  >
                    ✨
                  </motion.span>
                  Explanation
                </h3>

                {/* Explain Simply Toggle */}
                <motion.button
                  onClick={() => setShowSimplified(!showSimplified)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    showSimplified
                      ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white border-green-300 shadow-lg shadow-green-400/20'
                      : 'bg-white/60 text-blue-500 border-blue-100/50 hover:bg-blue-50/60'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showSimplified ? '🧒 Kid View' : '👤 Parent View'}
                </motion.button>
              </div>

              {/* AI Response with typing effect */}
              <div className="relative p-5 bg-gradient-to-br from-blue-50/40 to-cyan-50/30 rounded-2xl border border-blue-100/30 text-blue-900 mb-5 leading-relaxed min-h-[80px]">
                {displayedText}
                {isTyping && (
                  <motion.span
                    className="inline-block w-0.5 h-5 bg-blue-500 ml-0.5 align-text-bottom"
                    animate={{ opacity: [0, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* XP Earned indicator */}
              <motion.div
                className="flex items-center justify-center gap-2 mb-5 bg-amber-50/40 py-2 rounded-xl border border-amber-100/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-amber-500">✨</span>
                <span className="text-xs font-bold text-amber-600">+{XP_REWARDS.AI_QUERY} XP earned for research!</span>
              </motion.div>

              {/* Expandable Sources Section */}
              {result.sources.length > 0 && (
                <div className="border-t border-blue-100/30 pt-4">
                  <motion.button
                    className="flex items-center justify-between w-full text-left mb-3"
                    onClick={() => setShowSources(!showSources)}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="text-sm">📚</span>
                      Book References ({result.sources.length})
                    </span>
                    <motion.span
                      className="text-gray-400 text-xs"
                      animate={{ rotate: showSources ? 180 : 0 }}
                    >
                      ▼
                    </motion.span>
                  </motion.button>

                  <AnimatePresence>
                    {showSources && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden space-y-2"
                      >
                        {result.sources.map((src, i) => (
                          <motion.div
                            key={i}
                            className={`p-3 rounded-xl border text-sm ${
                              src.subject === 'Math'
                                ? 'bg-purple-50/40 border-purple-100/30'
                                : 'bg-orange-50/40 border-orange-100/30'
                            }`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase ${
                                src.subject === 'Math'
                                  ? 'bg-purple-100/60 text-purple-500'
                                  : 'bg-orange-100/60 text-orange-500'
                              }`}>
                                {src.subject}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                Ch: {src.chapter} • p.{src.page}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed mt-1">
                              "{src.content.substring(0, 120)}{src.content.length > 120 ? '...' : ''}"
                            </p>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Governance Footer */}
              <div className="mt-5 pt-3 border-t border-blue-100/20">
                {result.searchMethod && (
                  <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      result.searchMethod === 'hybrid' ? 'bg-purple-100/50 text-purple-600' :
                      result.searchMethod === 'semantic' ? 'bg-blue-100/50 text-blue-600' :
                      'bg-gray-100/50 text-gray-500'
                    }`}>
                      {result.searchMethod === 'hybrid' ? '🧠 Hybrid RAG' :
                       result.searchMethod === 'semantic' ? '🧠 Semantic RAG' :
                       '🔍 Keyword Search'}
                    </span>
                    {result.confidence !== undefined && result.confidence > 0 && (
                      <span className="text-[10px] font-medium text-gray-400">
                        Relevance: {Math.round(result.confidence * 100)}%
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="italic text-[10px] text-gray-400">
                    AI answers are generated strictly from approved school books. No external data.
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
