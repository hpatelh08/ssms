/**
 * parent/pages/reader/AskAIPanel.tsx
 * ─────────────────────────────────────────────────────
 * Upgraded AI Chat Panel with Groq integration.
 *
 * Features:
 *  • Real AI answers via Groq (llama3-70b-8192)
 *  • Minimize / Expand / Close controls
 *  • Quick action buttons (Explain, Summarize, etc.)
 *  • Both-page context awareness
 *  • Child-friendly tone
 *  • Inline mode for desktop side panel
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ────────────────────────────────────── */

interface AskAIPanelProps {
  open: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  pageText: string;
  pageNum: number;
  bookTitle: string;
  bookBoard?: string;
  onQuestionAsked?: (question: string) => void;
  /** When true, renders as inline side panel (no overlay/backdrop) */
  inline?: boolean;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

/* ── Groq AI Integration ──────────────────────── */

const GROQ_API_KEY = (typeof process !== 'undefined' && process.env?.GROQ_API_KEY) || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function askGroqAI(question: string, pageText: string, bookTitle: string, pageNum: number, bookBoard: string): Promise<string> {
  if (!GROQ_API_KEY) {
    return generateFallbackResponse(question, pageText, bookTitle);
  }

  try {
    const systemPrompt = `You are a friendly, encouraging AI tutor helping a Class 4 student (age 6-7) understand a story from their textbook.

Book: ${bookTitle}
Board: ${bookBoard}
Page: ${pageNum}

Rules:
- Use very simple words a 6 year old can understand
- Keep answers short (2-4 sentences max)
- Be warm, encouraging, and fun
- Use emojis occasionally to keep it engaging
- If the page text is empty/unclear, still try to help based on the question
- For word meanings, give a simple definition + a kid-friendly example
- For summaries, focus on what's happening in simple terms`;

    const resp = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `${question}\n\nPage context:\n${pageText || '(No text extracted from this page)'}`,
          },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!resp.ok) {
      console.warn('[AskAI] Groq API error:', resp.status);
      return generateFallbackResponse(question, pageText, bookTitle);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || generateFallbackResponse(question, pageText, bookTitle);
  } catch (err) {
    console.warn('[AskAI] Groq fetch failed:', err);
    return generateFallbackResponse(question, pageText, bookTitle);
  }
}

/* ── Fallback Response Generator ──────────────── */

function generateFallbackResponse(question: string, pageText: string, bookTitle: string): string {
  const q = question.toLowerCase();

  if (q.includes('summarize') || q.includes('summary') || q.includes('about')) {
    if (pageText && pageText.trim().length > 20) {
      const words = pageText.trim().split(/\s+/).slice(0, 20).join(' ');
      return `This page talks about: "${words}…" 📖 Read it slowly to understand the full story!`;
    }
    return `This page from "${bookTitle}" has a wonderful story to discover. Read it carefully! 📖`;
  }
  if (q.includes('explain') || q.includes('meaning') || q.includes('what does')) {
    return `Great vocabulary question! 📚 Try reading the sentence around that word — the words before and after often help explain the meaning.`;
  }
  if (q.includes('what is happening') || q.includes('what\'s happening')) {
    return `Something exciting is happening on this page! 🌟 Look at the pictures and read the words to find out what the characters are doing.`;
  }
  if (q.includes('new words') || q.includes('vocabulary') || q.includes('difficult')) {
    return `You're a word explorer! 🔍 Look for words you haven't seen before — those are your new words to learn today!`;
  }
  if (q.includes('question') || q.includes('practice') || q.includes('quiz')) {
    return `Here's a question for you: What did you learn from this page? Try telling it to someone! That's the best way to remember. 💡`;
  }

  return `That's a wonderful question about "${bookTitle}"! 🌟 This page has many interesting things to discover. Keep reading — you're doing great! 💪`;
}

/* ── Component ────────────────────────────────── */

export const AskAIPanel: React.FC<AskAIPanelProps> = ({
  open,
  onClose,
  onMinimize,
  pageText,
  pageNum,
  bookTitle,
  bookBoard = 'NCERT',
  onQuestionAsked,
  inline = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendQuestion = useCallback(async (question: string) => {
    if (!question.trim() || isThinking) return;

    const q = question.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q, timestamp: Date.now() }]);
    onQuestionAsked?.(q);
    setIsThinking(true);

    try {
      const response = await askGroqAI(q, pageText, bookTitle, pageNum, bookBoard);
      setMessages((prev) => [...prev, { role: 'ai', text: response, timestamp: Date.now() }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Oops! I had trouble thinking. Please try again! 🤔', timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
    }
  }, [isThinking, pageText, bookTitle, pageNum, bookBoard, onQuestionAsked]);

  const handleSend = useCallback(() => {
    sendQuestion(input);
  }, [input, sendQuestion]);

  const quickActions = [
    { label: '✨ Explain simply', question: 'Explain what is on this page in very simple words.' },
    { label: '📝 Summarize page', question: 'Summarize what is happening on this page.' },
    { label: '🔍 What is happening?', question: 'What is happening here on this page?' },
    { label: '📖 New words', question: 'What are the new or difficult words on this page? Explain them simply.' },
    { label: '❓ Practice question', question: 'Generate a simple practice question based on this page for a Class 4 student.' },
  ];

  /* ── Panel Content (shared between inline and overlay modes) ── */
  const panelContent = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(255,255,255,0.98)',
      backdropFilter: inline ? 'none' : 'blur(20px)',
    }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: 'linear-gradient(135deg, #fef3c7, #DBEAFE)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1F2937', margin: 0 }}>
              🤖 Ask AI about this page
            </h3>
            <p style={{ fontSize: 10, color: '#6B7280', margin: '2px 0 0', fontWeight: 500 }}>
              Page {pageNum} · {bookTitle}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {onMinimize && (
              <motion.button
                onClick={onMinimize}
                title="Minimize"
                style={{
                  width: 26, height: 26, borderRadius: 8, border: 'none',
                  background: 'rgba(0,0,0,0.06)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#6B7280',
                }}
                whileTap={{ scale: 0.9 }}
              >—</motion.button>
            )}
            <motion.button
              onClick={onClose}
              title="Close"
              style={{
                width: 26, height: 26, borderRadius: 8, border: 'none',
                background: 'rgba(0,0,0,0.06)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#6B7280',
              }}
              whileTap={{ scale: 0.9 }}
            >✕</motion.button>
          </div>
        </div>
      </div>

      {/* Messages + Quick Actions */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <span style={{ fontSize: 36 }}>🤖</span>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 8, fontWeight: 600 }}>
              Ask me anything about this page!
            </p>
            <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
              I can explain words, summarize, or answer questions.
            </p>

            {/* Quick action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
              {quickActions.map((a) => (
                <motion.button
                  key={a.label}
                  onClick={() => sendQuestion(a.question)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(99,102,241,0.15)',
                    background: 'rgba(99,102,241,0.04)',
                    color: '#d97706',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  whileHover={{ scale: 1.02, background: 'rgba(99,102,241,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {a.label}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 10,
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'ai' && (
              <span style={{ fontSize: 16, marginRight: 6, flexShrink: 0, marginTop: 4 }}>🤖</span>
            )}
            <div
              style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background:
                  msg.role === 'user'
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'rgba(243,244,246,0.8)',
                color: msg.role === 'user' ? '#fff' : '#1F2937',
                fontSize: 12,
                lineHeight: 1.7,
                fontWeight: 500,
                border: msg.role === 'ai' ? '1px solid rgba(0,0,0,0.04)' : 'none',
              }}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}

        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}
          >
            <span style={{ fontSize: 16 }}>🤖</span>
            <div style={{ display: 'flex', gap: 4, padding: '8px 14px', background: '#F3F4F6', borderRadius: 12 }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick follow-up buttons after messages */}
        {messages.length > 0 && !isThinking && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, marginBottom: 4 }}>
            {quickActions.slice(0, 3).map((a) => (
              <motion.button
                key={a.label}
                onClick={() => sendQuestion(a.question)}
                style={{
                  padding: '4px 10px', borderRadius: 16,
                  border: '1px solid rgba(99,102,241,0.15)',
                  background: 'rgba(99,102,241,0.04)',
                  color: '#f59e0b', fontSize: 9, fontWeight: 600,
                  cursor: 'pointer',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {a.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          gap: 8,
          flexShrink: 0,
          background: 'rgba(255,255,255,0.9)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask a question about this page..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 12,
            border: '1.5px solid rgba(0,0,0,0.08)',
            fontSize: 12,
            outline: 'none',
            background: 'rgba(249,250,251,0.8)',
          }}
        />
        <motion.button
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          style={{
            width: 40, height: 40, borderRadius: 12,
            border: 'none', background: '#f59e0b',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            opacity: !input.trim() || isThinking ? 0.4 : 1,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >↑</motion.button>
      </div>
    </div>
  );

  /* ── Inline mode (desktop side panel — no overlay) ── */
  if (inline) {
    return open ? panelContent : null;
  }

  /* ── Overlay mode (mobile or standalone) ── */
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.2)', zIndex: 180,
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: Math.min(400, window.innerWidth - 16),
              zIndex: 185,
              boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
              borderRadius: '20px 0 0 20px',
              overflow: 'hidden',
            }}
          >
            {panelContent}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
