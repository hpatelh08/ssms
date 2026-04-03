/**
 * parent/components/books/LearnTab.tsx
 * ─────────────────────────────────────────────────────
 * Learn Mode — Chapter content broken into bite-sized sections.
 *
 * Features:
 *  - Auto-extracted structured content (story, poem, activity, etc.)
 *  - Large child-friendly font
 *  - Read Aloud button with word highlighting
 *  - Click word to hear pronunciation
 *  - Emoji reactions
 *  - Section navigation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookEntry, BookChapter } from '../../../data/bookConfig';
import { getLearnContent, type LearnContent } from '../../../services/chapterIntelligence';
import {
  speak, stop, isSpeaking, pronounceWord,
  getLanguageForSubject, detectLanguage,
} from '../../../services/voiceService';
import { completeLearn, startActivityTimer, stopActivityTimer } from '../../../services/progressTracker';

const spring = { type: 'spring' as const, stiffness: 260, damping: 26 };

const SECTION_ICONS: Record<string, string> = {
  story: '📖',
  poem: '🎵',
  activity: '🎨',
  wordplay: '🔤',
  conversation: '💬',
  introduction: '🌟',
};

const REACTIONS = ['🌟', '❤️', '😊', '🎉', '👏', '🤩'];

interface Props {
  book: BookEntry;
  chapter: BookChapter;
}

export const LearnTab: React.FC<Props> = ({ book, chapter }) => {
  const [content, setContent] = useState<LearnContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(0);
  const [highlightedWord, setHighlightedWord] = useState(-1);
  const [isReading, setIsReading] = useState(false);
  const [reactions, setReactions] = useState<Map<number, string>>(new Map());

  // Start timer on mount
  useEffect(() => {
    startActivityTimer(book.id, chapter.id, 'learn');
    return () => {
      stopActivityTimer();
      stop();
    };
  }, [book.id, chapter.id]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getLearnContent(book, chapter);
      setContent(result);
    } catch {
      setError('Failed to load chapter content. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [book, chapter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const lang = getLanguageForSubject(book.subject);

  // Read aloud with word highlighting
  const handleReadAloud = useCallback((text: string) => {
    if (isReading) {
      stop();
      setIsReading(false);
      setHighlightedWord(-1);
      return;
    }

    const detectedLang = detectLanguage(text);
    setIsReading(true);
    speak(text, {
      lang: detectedLang,
      rate: 0.7,
      onWord: (_word, charIdx) => setHighlightedWord(charIdx),
      onEnd: () => { setIsReading(false); setHighlightedWord(-1); },
      onError: () => { setIsReading(false); setHighlightedWord(-1); },
    });
  }, [isReading]);

  // Click on a word to pronounce it
  const handleWordClick = useCallback((word: string) => {
    const clean = word.replace(/[^\w\u0900-\u097F\u0A80-\u0AFF]/g, '');
    if (clean.length > 0) {
      pronounceWord(clean, detectLanguage(clean));
    }
  }, []);

  // Mark learn as complete
  const handleComplete = useCallback(() => {
    completeLearn(book.id, chapter.id);
    stopActivityTimer();
  }, [book.id, chapter.id]);

  // Add reaction
  const addReaction = useCallback((sectionIdx: number, emoji: string) => {
    setReactions(prev => new Map(prev).set(sectionIdx, emoji));
  }, []);

  if (loading) return <LoadingSpinner label="Preparing your lesson..." />;
  if (error) return <ErrorCard message={error} onRetry={fetchData} />;
  if (!content) return null;

  const section = content.sections[activeSection];

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-4 pb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Section Navigation Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {content.sections.map((sec, i) => (
          <motion.button
            key={i}
            onClick={() => { setActiveSection(i); stop(); setIsReading(false); setHighlightedWord(-1); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
              i === activeSection
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg'
                : 'bg-white/70 text-gray-500 hover:bg-white border border-gray-100'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <span>{SECTION_ICONS[sec.type] || '📖'}</span>
            {sec.title}
          </motion.button>
        ))}
      </div>

      {/* Main Content Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={spring}
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.span
                className="text-3xl"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {SECTION_ICONS[section.type] || '📖'}
              </motion.span>
              <div>
                <h3 className="text-lg font-black text-gray-800">{section.title}</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {section.type}
                </span>
              </div>
            </div>

            {/* Read Aloud Button */}
            <motion.button
              onClick={() => handleReadAloud(section.content)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[12px] font-bold cursor-pointer ${
                isReading
                  ? 'bg-red-100 text-red-600 border border-red-200'
                  : 'bg-blue-100 text-blue-600 border border-blue-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isReading ? '⏹️ Stop' : '🔊 Read Aloud'}
            </motion.button>
          </div>

          {/* Content with clickable words */}
          <div className="text-[16px] leading-[2] text-gray-700 font-medium">
            {section.content.split('\n').map((line, li) => (
              <p key={li} className="mb-3">
                {line.split(/(\s+)/).map((word, wi) => {
                  const charPos = section.content.indexOf(word);
                  const isHighlighted = highlightedWord >= 0 && Math.abs(charPos - highlightedWord) < word.length + 2;
                  const isClickable = word.trim().length > 0;

                  return (
                    <span
                      key={`${li}-${wi}`}
                      className={`
                        ${isClickable ? 'cursor-pointer hover:bg-amber-100 rounded-lg px-0.5 transition-colors' : ''}
                        ${isHighlighted ? 'bg-yellow-200 rounded-lg px-0.5 font-bold' : ''}
                      `}
                      onClick={() => isClickable && handleWordClick(word)}
                    >
                      {word}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>

          {/* Emoji Reactions */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 mb-2">How did you like this? 👇</p>
            <div className="flex gap-2">
              {REACTIONS.map(emoji => (
                <motion.button
                  key={emoji}
                  onClick={() => addReaction(activeSection, emoji)}
                  className={`text-2xl rounded-xl p-2 cursor-pointer transition-all ${
                    reactions.get(activeSection) === emoji
                      ? 'bg-amber-100 scale-110 shadow-md'
                      : 'hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Fun Facts */}
      {content.funFacts.length > 0 && (
        <motion.div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.08))',
            border: '1px solid rgba(251,191,36,0.2)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-sm font-black text-amber-700 mb-3 flex items-center gap-2">
            💡 Fun Facts!
          </h4>
          {content.funFacts.map((fact, i) => (
            <p key={i} className="text-[13px] text-amber-800/70 mb-2 flex gap-2">
              <span className="shrink-0">⭐</span>
              {fact}
            </p>
          ))}
        </motion.div>
      )}

      {/* Navigation + Complete */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <motion.button
            onClick={() => setActiveSection(i => Math.max(0, i - 1))}
            disabled={activeSection === 0}
            className="px-4 py-2 rounded-2xl text-[12px] font-bold text-gray-500 bg-white/70 border border-gray-100 cursor-pointer disabled:opacity-30"
            whileHover={{ scale: activeSection > 0 ? 1.05 : 1 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Previous
          </motion.button>
          <motion.button
            onClick={() => setActiveSection(i => Math.min(content.sections.length - 1, i + 1))}
            disabled={activeSection === content.sections.length - 1}
            className="px-4 py-2 rounded-2xl text-[12px] font-bold text-green-600 bg-green-50 border border-green-100 cursor-pointer disabled:opacity-30"
            whileHover={{ scale: activeSection < content.sections.length - 1 ? 1.05 : 1 }}
            whileTap={{ scale: 0.95 }}
          >
            Next →
          </motion.button>
        </div>

        {activeSection === content.sections.length - 1 && (
          <motion.button
            onClick={handleComplete}
            className="px-5 py-2.5 rounded-2xl text-[12px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            ✅ I Learned This!
          </motion.button>
        )}
      </div>

      <p className="text-center text-[10px] text-gray-400">
        💡 Tap any word to hear how it sounds!
      </p>
    </motion.div>
  );
};

// Shared UI helpers
const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <motion.div className="flex flex-col items-center justify-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <motion.div className="text-4xl" animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
      ✨
    </motion.div>
    <p className="text-sm text-gray-400 mt-4 font-medium">{label}</p>
  </motion.div>
);

const ErrorCard: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <motion.div className="flex flex-col items-center justify-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <span className="text-3xl mb-3">😕</span>
    <p className="text-sm text-gray-500 mb-4">{message}</p>
    <motion.button
      onClick={onRetry}
      className="px-4 py-2 rounded-2xl bg-green-100 text-green-600 text-xs font-bold cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Try Again
    </motion.button>
  </motion.div>
);
