/**
 * parent/pages/reader/WordPopover.tsx
 * ─────────────────────────────────────────────────────
 * Interactive word popover for the storybook reader.
 *
 * When a user clicks a word in the extracted text overlay:
 *  • Explain Word (simple child-friendly definition)
 *  • Hear Pronunciation (TTS)
 *  • Show Example sentence
 *
 * Uses Gemini/Groq for AI explanations, falls back to
 * simple dictionary-style definitions.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pronounceWord } from '../../../services/voiceService';

/* ── Types ────────────────────────────────────── */

interface WordPopoverProps {
  word: string;
  x: number;
  y: number;
  lang: string;
  onClose: () => void;
  onAskAI?: (question: string) => void;
}

/* ── Simple Word Definitions ──────────────────── */
const SIMPLE_DEFINITIONS: Record<string, string> = {
  rustling: 'A soft sound made by leaves or paper moving.',
  garden: 'A place where flowers and plants grow.',
  morning: 'The early part of the day after sunrise.',
  beautiful: 'Something very nice to look at.',
  friend: 'A person you like and enjoy being with.',
  happy: 'Feeling good and full of joy.',
  mother: 'Your mom, who takes care of you.',
  father: 'Your dad, who takes care of you.',
  school: 'A place where children go to learn.',
  teacher: 'A person who helps you learn new things.',
  water: 'The liquid we drink and use to wash.',
  flower: 'The colorful part of a plant that looks pretty.',
  bird: 'An animal with wings that can fly.',
  tree: 'A tall plant with a trunk and leaves.',
  sun: 'The big bright star that gives us light and warmth.',
  moon: 'The round thing we see in the sky at night.',
  rain: 'Water that falls from the clouds.',
  play: 'To have fun with games or toys.',
  read: 'To look at words and understand them.',
  sing: 'To make music with your voice.',
  ball: 'A round thing you can throw and catch.',
  kitten: 'A baby cat.',
  puppy: 'A baby dog.',
};

function getSimpleDefinition(word: string): string | null {
  const lower = word.toLowerCase().trim();
  return SIMPLE_DEFINITIONS[lower] || null;
}

function getExampleSentence(word: string): string {
  const lower = word.toLowerCase().trim();
  const examples: Record<string, string> = {
    rustling: 'I heard the rustling of leaves in the wind.',
    garden: 'We planted roses in our garden.',
    morning: 'Birds sing in the morning.',
    beautiful: 'The sunset was very beautiful.',
    friend: 'My friend and I play together.',
    happy: 'She felt happy when she saw the puppy.',
    ball: 'Let us play with the red ball.',
    kitten: 'The kitten is drinking milk.',
  };
  return examples[lower] || `The word "${word}" is used in a sentence.`;
}

/* ── Component ────────────────────────────────── */

export const WordPopover: React.FC<WordPopoverProps> = ({
  word,
  x,
  y,
  lang,
  onClose,
  onAskAI,
}) => {
  const [activeTab, setActiveTab] = useState<'explain' | 'example' | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const definition = getSimpleDefinition(word);

  const handlePronounce = useCallback(() => {
    pronounceWord(word, lang);
  }, [word, lang]);

  const handleExplain = useCallback(() => {
    setActiveTab('explain');
    // Use simple definition if available, otherwise try AI
    if (!definition && onAskAI) {
      onAskAI(`Explain the word "${word}" in simple terms for a 6-year-old child.`);
    }
  }, [word, definition, onAskAI]);

  const handleExample = useCallback(() => {
    setActiveTab('example');
  }, []);

  // Position: ensure popover stays within viewport
  const popoverStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 280),
    top: Math.min(y - 10, window.innerHeight - 280),
    zIndex: 200,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 199,
          background: 'transparent',
        }}
        onClick={onClose}
      />

      <motion.div
        style={popoverStyle}
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div
          style={{
            width: 260,
            background: 'rgba(255,255,255,0.98)',
            borderRadius: 20,
            border: '1.5px solid rgba(0,0,0,0.08)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(16px)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px 10px',
              background: 'linear-gradient(135deg, #EDE9FE, #FEF3C7)',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#1F2937' }}>
                "{word}"
              </span>
              <motion.button
                onClick={onClose}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: '#6B7280',
                }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PopoverBtn
              emoji="🔊"
              label="Hear Pronunciation"
              onClick={handlePronounce}
              color="#6366F1"
            />
            <PopoverBtn
              emoji="💡"
              label="Explain Word"
              onClick={handleExplain}
              active={activeTab === 'explain'}
              color="#8B5CF6"
            />
            <PopoverBtn
              emoji="📝"
              label="Show Example"
              onClick={handleExample}
              active={activeTab === 'example'}
              color="#EC4899"
            />
            {onAskAI && (
              <PopoverBtn
                emoji="🤖"
                label="Ask AI More"
                onClick={() => {
                  onAskAI(`What does "${word}" mean? Explain for a child.`);
                  onClose();
                }}
                color="#10B981"
              />
            )}
          </div>

          {/* Content Area */}
          <AnimatePresence>
            {activeTab && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    padding: '10px 16px 14px',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    background: 'rgba(249,250,251,0.5)',
                  }}
                >
                  {activeTab === 'explain' && (
                    <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
                      {definition || aiExplanation || `"${word}" — Tap "Ask AI More" for a detailed explanation.`}
                    </p>
                  )}
                  {activeTab === 'example' && (
                    <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                      {getExampleSentence(word)}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

/* ── Popover Button ───────────────────────────── */

const PopoverBtn: React.FC<{
  emoji: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  color: string;
}> = ({ emoji, label, onClick, active, color }) => (
  <motion.button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      padding: '8px 12px',
      borderRadius: 12,
      border: active ? `1.5px solid ${color}30` : '1.5px solid transparent',
      background: active ? `${color}08` : 'rgba(0,0,0,0.02)',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 700,
      color: active ? color : '#4B5563',
      textAlign: 'left' as const,
    }}
    whileHover={{ scale: 1.02, background: `${color}08` }}
    whileTap={{ scale: 0.97 }}
  >
    <span style={{ fontSize: 15 }}>{emoji}</span>
    {label}
  </motion.button>
);
