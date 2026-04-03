import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RAGResponse, ResponseMode } from '../../services/geminiService';
import { RetrievalPanel } from './RetrievalPanel';

interface AIResponseCardProps {
  response: RAGResponse;
  query: string;
  onExplainSimpler?: () => void;
  onAskFollowUp?: (question: string) => void;
  userMode?: ResponseMode;
}

export const AIResponseCard: React.FC<AIResponseCardProps> = React.memo(({
  response,
  query,
  onExplainSimpler,
  onAskFollowUp,
  userMode = 'parent',
}) => {
  const [viewMode, setViewMode] = useState<'parent' | 'kid'>('parent');

  // In student mode, always show the direct explanation (no parent/kid toggle)
  const isStudentMode = userMode === 'student';
  const [copied, setCopied] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayText = isStudentMode ? response.explanation : (viewMode === 'parent' ? response.explanation : response.simplified_explanation);

  // Typing animation
  useEffect(() => {
    setTypedText('');
    setIsTyping(true);
    setShowSparkle(false);
    let i = 0;
    const text = displayText;

    const type = () => {
      if (i < text.length) {
        // Type faster: 3-5 chars per tick
        const chunkSize = Math.min(3 + Math.floor(Math.random() * 3), text.length - i);
        setTypedText(text.substring(0, i + chunkSize));
        i += chunkSize;
        typingRef.current = setTimeout(type, 12);
      } else {
        setIsTyping(false);
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 2000);
      }
    };

    typingRef.current = setTimeout(type, 300);

    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, [displayText]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = displayText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [displayText]);

  const handleReadAloud = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(displayText);
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  }, [displayText]);

  // Suggested follow-ups based on response
  const followUps = React.useMemo(() => {
    const suggestions: string[] = [];
    if (response.book && response.book !== 'N/A') {
      if (response.sources.length > 0) {
        const chapter = response.sources[0].chapter;
        suggestions.push(`What else is in ${chapter}?`);
      }
      suggestions.push(`More about this topic from ${response.book}`);
    }
    suggestions.push('Can you explain this differently?');
    return suggestions.slice(0, 3);
  }, [response]);

  const isNoResult = response.searchMethod === 'none' && response.confidence === 0;

  return (
    <motion.div
      className="relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Sparkle animation on answer complete */}
      <AnimatePresence>
        {showSparkle && (
          <motion.div
            className="absolute -top-2 -right-2 z-20"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 10 }}
          >
            <span className="text-3xl">✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main card */}
      <div className={`rounded-3xl border p-6 shadow-lg backdrop-blur-sm ${
        isNoResult
          ? 'bg-amber-50/40 border-amber-200/40'
          : 'bg-gradient-to-br from-white/70 via-blue-50/30 to-cyan-50/30 border-blue-100/30'
      }`}>

        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isNoResult ? 'bg-amber-100' : isStudentMode ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-blue-500 to-cyan-400'
            }`}>
              <span className="text-sm">{isNoResult ? '⚠️' : isStudentMode ? '🧒' : '🤖'}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">
                {isNoResult ? 'Not Found in Textbooks' : isStudentMode ? 'Your Answer' : 'AI Answer'}
              </p>
              {!isNoResult && !isStudentMode && response.book !== 'N/A' && (
                <p className="text-[10px] text-gray-400 font-medium">
                  📘 {response.book} • {response.page_reference}
                </p>
              )}
            </div>
          </div>

          {/* Parent/Kid View Toggle — only in parent mode */}
          {!isNoResult && !isStudentMode && (
            <div className="flex items-center bg-gray-100/60 rounded-xl p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode('parent')}
                className={`text-[9px] px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewMode === 'parent'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                👩 Parent
              </button>
              <button
                onClick={() => setViewMode('kid')}
                className={`text-[9px] px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewMode === 'kid'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                👶 Kid
              </button>
            </div>
          )}
        </div>

        {/* Query echo */}
        <div className="mb-4 px-4 py-2.5 bg-blue-50/40 rounded-xl border border-blue-100/20">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">Question</p>
          <p className="text-xs text-blue-700 font-medium">"{query}"</p>
        </div>

        {/* Answer body with typing animation */}
        <div className="mb-4 min-h-[60px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className={`text-sm leading-relaxed whitespace-pre-wrap ${
                viewMode === 'kid'
                  ? 'text-purple-800 text-base font-medium'
                  : 'text-gray-700'
              }`}
            >
              {typedText}
              {isTyping && (
                <motion.span
                  className="inline-block w-[2px] h-4 bg-blue-500 ml-0.5 align-text-bottom"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action buttons — only show after typing completes */}
        <AnimatePresence>
          {!isTyping && !isNoResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {/* Action row */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopy}
                  className="text-[10px] px-3 py-1.5 rounded-lg bg-gray-100/60 hover:bg-gray-200/60 text-gray-500 font-medium transition-colors"
                >
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
                <button
                  onClick={handleReadAloud}
                  className="text-[10px] px-3 py-1.5 rounded-lg bg-gray-100/60 hover:bg-gray-200/60 text-gray-500 font-medium transition-colors"
                >
                  🔊 Read Aloud
                </button>
                {onExplainSimpler && (
                  <button
                    onClick={onExplainSimpler}
                    className="text-[10px] px-3 py-1.5 rounded-lg bg-blue-100/60 hover:bg-blue-200/60 text-blue-600 font-bold transition-colors"
                  >
                    🧒 Explain Simpler
                  </button>
                )}
              </div>

              {/* Confidence badge & XP — hide confidence in student mode */}
              <div className="flex items-center justify-between">
                {!isStudentMode && (
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-1 rounded-full font-bold ${
                      response.confidence > 0.5
                        ? 'bg-green-100 text-green-600'
                        : response.confidence > 0.2
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {response.confidence > 0.5 ? '🟢' : response.confidence > 0.2 ? '🔵' : '⚪'}
                      {' '}Confidence: {Math.round(response.confidence * 100)}%
                    </span>
                  </div>
                )}
                <motion.div
                  className="flex items-center gap-1 text-[10px] font-bold text-amber-500"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                >
                  ⭐ +10 XP
                </motion.div>
              </div>

              {/* Practice Questions — only in student mode */}
              {isStudentMode && response.practice_questions && response.practice_questions.length > 0 && (
                <motion.div
                  className="mt-2 p-4 bg-gradient-to-br from-green-50/60 to-emerald-50/60 rounded-2xl border border-green-100/40"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-2">
                    📝 Practice Questions
                  </p>
                  <ol className="space-y-1.5">
                    {response.practice_questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-green-500 mt-0.5 min-w-[16px]">{i + 1}.</span>
                        <span className="text-xs text-green-800 font-medium">{q}</span>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}

              {/* Retrieval transparency panel — hide in student mode */}
              {!isStudentMode && response.retrieved_chunks.length > 0 && (
                <RetrievalPanel
                  chunks={response.retrieved_chunks}
                  searchMethod={response.searchMethod}
                  confidence={response.confidence}
                />
              )}

              {/* Follow-up suggestions */}
              {onAskFollowUp && followUps.length > 0 && (
                <div className="border-t border-blue-100/20 pt-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    💡 Ask Next
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {followUps.map((q) => (
                      <button
                        key={q}
                        onClick={() => onAskFollowUp(q)}
                        className="text-[10px] px-3 py-1.5 rounded-xl bg-blue-50/50 hover:bg-blue-100/50 text-blue-600 font-medium border border-blue-100/30 hover:border-blue-200/40 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

AIResponseCard.displayName = 'AIResponseCard';
