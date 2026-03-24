import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RetrievalPanelProps {
  chunks: {
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
}

export const RetrievalPanel: React.FC<RetrievalPanelProps> = React.memo(({ chunks, searchMethod, confidence }) => {
  const [expanded, setExpanded] = useState(false);

  if (chunks.length === 0) return null;

  return (
    <div className="border-t border-blue-100/20 pt-4">
      <motion.button
        className="flex items-center justify-between w-full text-left group"
        onClick={() => setExpanded(!expanded)}
        whileTap={{ scale: 0.99 }}
      >
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 group-hover:text-blue-500 transition-colors">
          <span>🔍</span>
          See How AI Found This Answer
          <span className="text-[10px] normal-case font-medium text-gray-300">({chunks.length} sources)</span>
        </span>
        <motion.span
          className="text-gray-400 text-xs"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Search method & confidence */}
            <div className="flex flex-wrap items-center gap-2 mt-3 mb-4">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                searchMethod === 'hybrid' ? 'bg-purple-100/60 text-purple-600' :
                searchMethod === 'semantic' ? 'bg-blue-100/60 text-blue-600' :
                'bg-gray-100/60 text-gray-500'
              }`}>
                {searchMethod === 'hybrid' ? '🧠 Hybrid RAG' :
                 searchMethod === 'semantic' ? '🧠 Semantic RAG' :
                 '🔍 Keyword Search'}
              </span>
              {confidence > 0 && (
                <span className="text-[10px] font-medium text-gray-400">
                  Avg. Relevance: {Math.round(confidence * 100)}%
                </span>
              )}
            </div>

            {/* Retrieved chunks */}
            <div className="space-y-2.5">
              {chunks.map((chunk, i) => (
                <motion.div
                  key={chunk.id}
                  className={`p-3.5 rounded-xl border text-sm relative overflow-hidden ${
                    chunk.subject === 'Math'
                      ? 'bg-purple-50/40 border-purple-100/30'
                      : 'bg-orange-50/40 border-orange-100/30'
                  }`}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  {/* Rank badge */}
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <span className="text-[9px] font-black text-blue-500">#{i + 1}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase ${
                      chunk.subject === 'Math'
                        ? 'bg-purple-100/60 text-purple-500'
                        : 'bg-orange-100/60 text-orange-500'
                    }`}>
                      📘 {chunk.subject}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      📄 Ch: {chunk.chapter} • p.{chunk.page}
                    </span>
                  </div>

                  {/* Chunk content snippet */}
                  <p className="text-xs text-gray-600 leading-relaxed mb-2 pr-8">
                    📑 "{chunk.snippet}{chunk.snippet.length >= 150 ? '...' : ''}"
                  </p>

                  {/* Score bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100/60 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          chunk.score > 0.5
                            ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                            : chunk.score > 0.2
                            ? 'bg-gradient-to-r from-blue-400 to-cyan-400'
                            : 'bg-gradient-to-r from-gray-300 to-gray-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, chunk.score * 100)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 min-w-[40px] text-right">
                      {(chunk.score * 100).toFixed(1)}% • {chunk.method}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

RetrievalPanel.displayName = 'RetrievalPanel';
