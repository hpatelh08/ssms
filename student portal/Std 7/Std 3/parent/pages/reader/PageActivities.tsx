/**
 * parent/pages/reader/PageActivities.tsx
 * ─────────────────────────────────────────────────────
 * Upgraded Quick Activities panel with card layout.
 *
 * Includes:
 *  • Quick comprehension quiz with sparkle animation
 *  • Vocabulary challenge
 *  • Fun facts section
 *  • Card-based tab layout
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ────────────────────────────────────── */

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface VocabChallenge {
  word: string;
  hint: string;
  meaning: string;
}

interface PageActivitiesProps {
  pageNum: number;
  pageText: string;
  bookTitle: string;
  onQuizComplete?: (correct: boolean) => void;
  onVocabInteraction?: (word: string) => void;
}

/* ── Quiz Data Generator ──────────────────────── */

function generateQuizFromText(text: string, pageNum: number): QuizQuestion | null {
  if (!text || text.trim().length < 30) return null;

  const quizBank: QuizQuestion[] = [
    {
      question: 'What sounds can you hear in nature?',
      options: ['Rustling of leaves', 'Honking of cars', 'Ringing of bells', 'Ticking of clock'],
      correctIndex: 0,
    },
    {
      question: 'Where do children like to play?',
      options: ['In the garden', 'In the kitchen', 'On the roof', 'In the cupboard'],
      correctIndex: 0,
    },
    {
      question: 'What do birds do in the morning?',
      options: ['Sing songs', 'Read books', 'Watch TV', 'Cook food'],
      correctIndex: 0,
    },
    {
      question: 'What gives us light during the day?',
      options: ['The Sun', 'The Moon', 'A lamp', 'A candle'],
      correctIndex: 0,
    },
    {
      question: 'What do flowers need to grow?',
      options: ['Water and sunlight', 'Toys and games', 'Books and pencils', 'Shoes and socks'],
      correctIndex: 0,
    },
    {
      question: 'What shape is a ball?',
      options: ['Round', 'Square', 'Triangle', 'Rectangle'],
      correctIndex: 0,
    },
    {
      question: 'Which animal says "meow"?',
      options: ['Cat', 'Dog', 'Cow', 'Lion'],
      correctIndex: 0,
    },
    {
      question: 'What do you use to write?',
      options: ['Pencil', 'Spoon', 'Shoe', 'Pillow'],
      correctIndex: 0,
    },
  ];

  return quizBank[pageNum % quizBank.length];
}

function generateVocabFromText(text: string): VocabChallenge | null {
  if (!text || text.trim().length < 20) return null;

  const words = text.split(/\s+/).filter(w => w.length > 4 && /^[a-zA-Z]+$/.test(w));
  if (words.length === 0) return null;

  const word = words[Math.floor(words.length / 2)] || words[0];
  return {
    word,
    hint: `This word has ${word.length} letters`,
    meaning: `A word from your reading. Can you use it in a sentence?`,
  };
}

const funFacts = [
  'Reading for just 15 minutes a day helps you learn about 1,000 new words every year! 📚',
  'Your brain grows stronger every time you read — like a muscle! 💪',
  'The most popular letter in English is the letter "E". Can you find it on this page? 🔎',
  'Children who read every day become better at everything — even maths! 🧮',
  'Books can take you to places you\'ve never been, without leaving your chair! ✈️',
  'The average person reads about 200-250 words per minute. How fast can you read? ⚡',
];

/* ── Sparkle Animation ────────────────────────── */
const SparkleEffect: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
    transition={{ duration: 0.8 }}
    style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', fontSize: 28, zIndex: 10,
    }}
  >
    ✨
  </motion.div>
);

/* ── Main Component ───────────────────────────── */

export const PageActivities: React.FC<PageActivitiesProps> = ({
  pageNum,
  pageText,
  bookTitle,
  onQuizComplete,
  onVocabInteraction,
}) => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'vocab' | 'fun'>('quiz');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);

  const quiz = useMemo(() => generateQuizFromText(pageText, pageNum), [pageText, pageNum]);
  const vocab = useMemo(() => generateVocabFromText(pageText), [pageText]);
  const funFact = useMemo(() => funFacts[pageNum % funFacts.length], [pageNum]);

  const handleQuizAnswer = useCallback(
    (idx: number) => {
      if (showResult) return;
      setSelectedOption(idx);
      setShowResult(true);
      const correct = idx === quiz?.correctIndex;
      onQuizComplete?.(correct);
      if (correct) {
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 1000);
      }
    },
    [showResult, quiz, onQuizComplete],
  );

  const resetQuiz = useCallback(() => {
    setSelectedOption(null);
    setShowResult(false);
    setShowSparkle(false);
  }, []);

  const tabs = [
    { key: 'quiz' as const, emoji: '📝', label: 'Quiz' },
    { key: 'vocab' as const, emoji: '📖', label: 'Vocabulary' },
    { key: 'fun' as const, emoji: '✨', label: 'Fun Fact' },
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* Tab Cards */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 0 6px' }}>
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); resetQuiz(); }}
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 12,
              border: activeTab === tab.key ? '1.5px solid rgba(99,102,241,0.3)' : '1.5px solid transparent',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                : 'rgba(99,102,241,0.03)',
              color: activeTab === tab.key ? '#fff' : '#6B7280',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span style={{ fontSize: 14 }}>{tab.emoji}</span>
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Content Card */}
      <div style={{ padding: '8px 0 4px' }}>
        <div style={{
          background: 'rgba(249,250,251,0.6)',
          borderRadius: 12,
          border: '1px solid rgba(99,102,241,0.06)',
          padding: '12px 14px',
          position: 'relative',
        }}>
                {/* Sparkle on correct answer */}
                {showSparkle && <SparkleEffect />}

                {/* QUIZ TAB */}
                {activeTab === 'quiz' && quiz && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#2C3A63', marginBottom: 10, lineHeight: 1.5 }}>
                      {quiz.question}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {quiz.options.map((opt, i) => {
                        const isSelected = selectedOption === i;
                        const isCorrect = i === quiz.correctIndex;
                        let bg = 'rgba(255,255,255,0.8)';
                        let borderColor = 'rgba(99,102,241,0.08)';
                        let textColor = '#6B7AA6';

                        if (showResult && isSelected) {
                          bg = isCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)';
                          borderColor = isCorrect ? '#10B981' : '#EF4444';
                          textColor = isCorrect ? '#059669' : '#DC2626';
                        } else if (showResult && isCorrect) {
                          bg = 'rgba(16,185,129,0.08)';
                          borderColor = '#10B98140';
                          textColor = '#059669';
                        }

                        return (
                          <motion.button
                            key={i}
                            onClick={() => handleQuizAnswer(i)}
                            style={{
                              padding: '9px 14px',
                              borderRadius: 10,
                              border: `1.5px solid ${borderColor}`,
                              background: bg,
                              color: textColor,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: showResult ? 'default' : 'pointer',
                              textAlign: 'left' as const,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                            whileHover={!showResult ? { scale: 1.02, background: 'rgba(99,102,241,0.04)' } : {}}
                            whileTap={!showResult ? { scale: 0.98 } : {}}
                          >
                            <span style={{
                              width: 22, height: 22, borderRadius: 6,
                              background: showResult && isCorrect ? '#10B981' : showResult && isSelected && !isCorrect ? '#EF4444' : 'rgba(99,102,241,0.1)',
                              color: showResult && (isCorrect || isSelected) ? '#fff' : '#6366F1',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 800, flexShrink: 0,
                            }}>
                              {showResult && isCorrect ? '✓' : showResult && isSelected && !isCorrect ? '✗' : String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                          </motion.button>
                        );
                      })}
                    </div>
                    {showResult && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: selectedOption === quiz.correctIndex ? '#059669' : '#DC2626',
                          marginTop: 10,
                          textAlign: 'center',
                        }}
                      >
                        {selectedOption === quiz.correctIndex ? '🎉 Great job! You got it right!' : '💪 Good try! Check the correct answer above.'}
                      </motion.p>
                    )}
                  </div>
                )}

                {/* VOCAB TAB */}
                {activeTab === 'vocab' && vocab && (
                  <div>
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #FEF3C7, #FEFCE8)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        marginBottom: 10,
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ fontSize: 18, fontWeight: 900, color: '#92400E', margin: '0 0 4px', letterSpacing: 1 }}>
                        📖 {vocab.word}
                      </p>
                      <p style={{ fontSize: 10, color: '#B45309', margin: 0, fontWeight: 500 }}>
                        {vocab.hint}
                      </p>
                    </div>
                    <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                      {vocab.meaning}
                    </p>
                    <motion.button
                      onClick={() => onVocabInteraction?.(vocab.word)}
                      style={{
                        marginTop: 10,
                        padding: '7px 16px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🔊 Hear Pronunciation
                    </motion.button>
                  </div>
                )}

                {/* FUN FACT TAB */}
                {activeTab === 'fun' && (
                  <div style={{ textAlign: 'center', padding: '6px 0' }}>
                    <span style={{ fontSize: 28, display: 'inline-block', marginBottom: 8 }}>💡</span>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#4338CA', margin: '0 0 6px' }}>
                      Did you know?
                    </p>
                    <p style={{ fontSize: 12, color: '#6B7AA6', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                      {funFact}
                    </p>
                  </div>
                )}
              </div>
            </div>
    </div>
  );
};
