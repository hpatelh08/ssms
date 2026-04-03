/**
 * parent/components/books/AskAITab.tsx
 * ─────────────────────────────────────────────────────
 * Child-friendly AI Chat — chapter-aware, voice-enabled.
 *
 * Features:
 *  - AI chat grounded in chapter content
 *  - Child mode (emojis, simple language, storytelling)
 *  - Voice input via STT (microphone button)
 *  - Voice output via TTS (read answers aloud)
 *  - Suggested questions to get started
 *  - Chat history within session
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookEntry, BookChapter } from '../../../data/bookConfig';
import { askChapterAI, type ChapterAIResponse } from '../../../services/chapterIntelligence';
import { recordAIUsage, startActivityTimer, stopActivityTimer } from '../../../services/progressTracker';
import {
  speak, stop as stopSpeech, isSpeaking,
  startListening, stopListening, isSTTAvailable,
  detectLanguage,
} from '../../../services/voiceService';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  sources?: ChapterAIResponse['sources'];
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  { emoji: '📖', text: 'What is this chapter about?' },
  { emoji: '🌟', text: 'Tell me the main story!' },
  { emoji: '🔤', text: 'What new words can I learn?' },
  { emoji: '🎯', text: 'What should I remember?' },
  { emoji: '🤔', text: 'Why is this important?' },
  { emoji: '🎨', text: 'Tell me something fun!' },
];

interface Props {
  book: BookEntry;
  chapter: BookChapter;
}

export const AskAITab: React.FC<Props> = ({ book, chapter }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sttAvailable = isSTTAvailable();

  useEffect(() => {
    startActivityTimer(book.id, chapter.id, 'ai');
    return () => { stopActivityTimer(); };
  }, [book.id, chapter.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await askChapterAI(book, chapter, text.trim(), true);
      const aiMsg: ChatMessage = {
        role: 'ai',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      recordAIUsage(book.id, chapter.id);
    } catch {
      const errMsg: ChatMessage = {
        role: 'ai',
        content: '😕 Oops! I couldn\'t think of an answer right now. Please try again!',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [book, chapter, loading]);

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    startListening({
      lang: detectLanguage('') || 'en-IN',
      continuous: false,
      onResult: (result) => {
        if (result.isFinal) {
          setInput(result.transcript);
          setIsListening(false);
          // Auto-send on final result
          if (result.transcript.trim()) {
            setTimeout(() => sendMessage(result.transcript.trim()), 300);
          }
        } else {
          setInput(result.transcript);
        }
      },
      onEnd: () => setIsListening(false),
      onError: () => setIsListening(false),
    });
  }, [isListening, sendMessage]);

  const handleReadAloud = useCallback((text: string, msgIdx: number) => {
    if (isSpeaking()) {
      stopSpeech();
      setSpeakingMsgIdx(null);
      return;
    }

    setSpeakingMsgIdx(msgIdx);
    const lang = detectLanguage(text);
    speak(text, {
      lang,
      rate: 0.75,
      pitch: 1.1,
      onEnd: () => setSpeakingMsgIdx(null),
      onError: () => setSpeakingMsgIdx(null),
    });
  }, []);

  const handleSuggestedQ = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  // ─── Render ─────────────────────────────────────────────

  return (
    <motion.div
      className="flex flex-col max-w-lg mx-auto"
      style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="text-center py-3">
        <span className="text-2xl">🤖</span>
        <p className="text-[10px] font-bold text-gray-400 mt-1">
          Ask me anything about <span className="text-green-500">{chapter.name}</span>!
        </p>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 space-y-3 scrollbar-thin">
        {/* Welcome message */}
        {messages.length === 0 && !loading && (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.span
              className="text-5xl inline-block"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🌟
            </motion.span>
            <p className="text-sm font-bold text-gray-700 mt-3">
              Hi there! I'm your AI study buddy! 👋
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Ask me anything about "{chapter.name}" — I love helping!
            </p>

            {/* Suggested questions */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              {SUGGESTED_QUESTIONS.map((sq, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleSuggestedQ(sq.text)}
                  className="p-3 rounded-2xl bg-white border border-gray-100 text-left cursor-pointer hover:border-green-200 hover:bg-green-50/30 transition-all"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">{sq.emoji}</span>
                  <p className="text-[10px] font-medium text-gray-600 mt-1 leading-tight">{sq.text}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-green-500 to-lime-500 text-white'
                    : 'bg-white border border-gray-100'
                }`}
                style={msg.role === 'ai' ? { boxShadow: '0 2px 12px rgba(0,0,0,0.04)' } : undefined}
              >
                {msg.role === 'ai' && <span className="text-lg mr-1">🤖</span>}
                <p className={`text-[12px] leading-relaxed font-medium ${
                  msg.role === 'user' ? 'text-white' : 'text-gray-700'
                }`}>
                  {msg.content}
                </p>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.sources.slice(0, 2).map((s, si) => (
                      <span key={si} className="text-[8px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                        📄 p.{s.page}
                      </span>
                    ))}
                  </div>
                )}

                {/* Read aloud button (AI messages only) */}
                {msg.role === 'ai' && (
                  <motion.button
                    onClick={() => handleReadAloud(msg.content, idx)}
                    className="mt-2 text-[9px] font-bold text-green-400 cursor-pointer hover:text-green-500"
                    whileTap={{ scale: 0.95 }}
                  >
                    {speakingMsgIdx === idx ? '⏸️ Stop Reading' : '🔊 Read Aloud'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-1.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <span className="text-lg">🤖</span>
              <motion.span className="w-2 h-2 rounded-full bg-green-400" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
              <motion.span className="w-2 h-2 rounded-full bg-green-300" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
              <motion.span className="w-2 h-2 rounded-full bg-green-200" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="pt-3 pb-2 px-1">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 p-1.5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          {/* Voice input */}
          {sttAvailable && (
            <motion.button
              onClick={handleVoiceInput}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm cursor-pointer ${
                isListening
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-500'
              }`}
              whileTap={{ scale: 0.9 }}
              animate={isListening ? { scale: [1, 1.1, 1] } : {}}
              transition={isListening ? { duration: 0.8, repeat: Infinity } : undefined}
            >
              {isListening ? '⏹️' : '🎤'}
            </motion.button>
          )}

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(input); }}
            placeholder={isListening ? 'Listening...' : 'Ask me anything...'}
            className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-300 font-medium px-2"
            disabled={loading}
          />

          {/* Send button */}
          <motion.button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-green-500 to-lime-500 flex items-center justify-center text-white text-sm cursor-pointer disabled:opacity-30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ➤
          </motion.button>
        </div>

        {/* Voice hint */}
        {isListening && (
          <motion.p
            className="text-[9px] text-red-400 text-center mt-1.5 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🎤 Listening... Speak now!
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};
