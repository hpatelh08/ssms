import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCelebrate } from './useCelebrationController';
import { useAddXP } from './XPProvider';
import { recordJourneyLevel, JOURNEY_GAMES } from './journey/journeyProgress';
import { logActivity } from '../services/activityLogger';
import wordBuilderPdfLevels from '../STD 04/word_builder_1000.json';

const WB_STORAGE_KEY = 'wordBuilder_currentLevel';
const XP_PER_LEVEL = 25;
const AUTO_ADVANCE_DELAY_MS = 1200;

type WordBuilderPdfLevel = {
  letters: string[];
  answers: string[];
};

const WORD_BUILDER_PDF_LEVELS = (wordBuilderPdfLevels as WordBuilderPdfLevel[])
  .filter((entry) => Array.isArray(entry.letters) && Array.isArray(entry.answers) && entry.letters.length > 0)
  .map((entry) => ({
    letters: entry.letters.map((letter) => String(letter).trim().toUpperCase()).filter(Boolean),
    answers: Array.from(new Set(entry.answers.map((word) => String(word).trim().toUpperCase()).filter(Boolean))),
  }));

const FALLBACK_QUESTION_SETS: WordBuilderPdfLevel[] = [
  { letters: ['C', 'A', 'T'], answers: ['CAT', 'ACT'] },
];

const WORD_BUILDER_QUESTION_SETS = WORD_BUILDER_PDF_LEVELS.length
  ? WORD_BUILDER_PDF_LEVELS
  : FALLBACK_QUESTION_SETS;

const WordBuilderGame: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const celebrate = useCelebrate();
  const addXP = useAddXP();

  const [level, setLevel] = useState<number>(() => {
    try {
      return Math.max(1, parseInt(localStorage.getItem(WB_STORAGE_KEY) || '1', 10));
    } catch {
      return 1;
    }
  });
  const [input, setInput] = useState('');
  const [usedIndexes, setUsedIndexes] = useState<number[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'error' | 'success' | 'info'>('info');
  const [found, setFound] = useState<Set<string>>(new Set());
  const isAdvancingRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(WB_STORAGE_KEY, String(level));
    } catch {
      /* ignore */
    }
  }, [level]);

  const questionNumber = level;
  const levelData =
    WORD_BUILDER_QUESTION_SETS[(questionNumber - 1) % WORD_BUILDER_QUESTION_SETS.length] ??
    FALLBACK_QUESTION_SETS[0];
  const letters = levelData.letters;
  const validWords = levelData.answers;
  const allWordsFound = validWords.length > 0 && found.size === validWords.length;
  const hasProgress = found.size > 0;

  const clearComposer = useCallback(() => {
    setInput('');
    setUsedIndexes([]);
  }, []);

  const resetQuestion = useCallback(() => {
    clearComposer();
    setWords([]);
    setFound(new Set());
    setMessage('');
    setMessageTone('info');
  }, [clearComposer]);

  const advanceToNextQuestion = useCallback(() => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    if (hasProgress) {
      celebrate('confetti');
      addXP(XP_PER_LEVEL);
      recordJourneyLevel(JOURNEY_GAMES.WORD_BUILDER);
      logActivity('worldBuilder', 3);
    }

    setLevel((prev) => prev + 1);
    resetQuestion();
  }, [addXP, celebrate, hasProgress, resetQuestion]);

  useEffect(() => {
    isAdvancingRef.current = false;
  }, [questionNumber]);

  useEffect(() => {
    if (!allWordsFound) return undefined;

    setMessage('Excellent! Loading the next question...');
    setMessageTone('success');

    const timer = window.setTimeout(() => {
      advanceToNextQuestion();
    }, AUTO_ADVANCE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [advanceToNextQuestion, allWordsFound]);

  const handleLetterClick = (idx: number) => {
    if (usedIndexes.includes(idx)) return;
    setInput((prev) => prev + letters[idx]);
    setUsedIndexes((prev) => [...prev, idx]);
    setMessage('');
    setMessageTone('info');
  };

  const handleBackspace = () => {
    if (!input.length) return;
    setUsedIndexes((prev) => prev.slice(0, -1));
    setInput((prev) => prev.slice(0, -1));
    setMessage('');
    setMessageTone('info');
  };

  const handleClear = () => {
    clearComposer();
    setMessage('');
    setMessageTone('info');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const word = input.trim().toUpperCase();
    if (word.length < 3) {
      setMessage('Word must be at least 3 letters.');
      setMessageTone('error');
      return;
    }
    if (!validWords.includes(word)) {
      setMessage('This word is not in this question.');
      setMessageTone('error');
      return;
    }
    if (found.has(word)) {
      setMessage('Already found.');
      setMessageTone('error');
      return;
    }

    setWords((prev) => [...prev, word]);
    setFound((prev) => {
      const next = new Set(prev);
      next.add(word);
      return next;
    });
    clearComposer();

    if (found.size + 1 >= validWords.length) {
      setMessage('Excellent! You found every word.');
    } else {
      setMessage('Nice one! Keep building.');
    }
    setMessageTone('success');
  };

  const messageColor =
    messageTone === 'success' ? '#16a34a' : messageTone === 'error' ? '#ef4444' : '#475569';

  return (
    <div
      style={{
        maxWidth: 440,
        margin: '48px auto',
        background: 'linear-gradient(135deg, #f0f4ff 60%, #e0f7fa 100%)',
        borderRadius: 24,
        boxShadow: '0 8px 32px #c7d2fe99',
        padding: 32,
        textAlign: 'center',
        position: 'relative',
        border: '2px solid #a5b4fc',
      }}
    >
      {onBack ? (
        <button
          type="button"
          style={{
            position: 'absolute',
            left: 18,
            top: 18,
            background: '#fff',
            border: '1.5px solid #818cf8',
            borderRadius: 8,
            padding: '4px 12px',
            fontWeight: 700,
            color: '#6366f1',
            cursor: 'pointer',
            zIndex: 2,
          }}
          onClick={onBack}
        >
          {'<-'} Back
        </button>
      ) : null}

      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#4f46e5', marginBottom: 12, letterSpacing: 1 }}>
        Word Builder
      </h2>
      <div style={{ marginBottom: 10, fontWeight: 700, color: '#6366f1', fontSize: 18 }}>
        Question {questionNumber}
      </div>
      <div style={{ marginBottom: 18, color: '#818cf8', fontWeight: 700, fontSize: 14 }}>
        New letter sets keep coming continuously.
      </div>
      <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 28, color: '#0ea5e9' }}>
        Make as many words as you can using these letters:
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
        {letters.map((letter, index) => (
          <button
            key={`${letter}-${index}`}
            type="button"
            onClick={() => handleLetterClick(index)}
            disabled={usedIndexes.includes(index)}
            style={{
              display: 'inline-block',
              background: usedIndexes.includes(index) ? '#a5b4fc' : '#6366f1',
              color: '#fff',
              fontWeight: 900,
              fontSize: 28,
              borderRadius: 10,
              padding: '10px 18px',
              boxShadow: '0 2px 8px #a5b4fc',
              letterSpacing: 2,
              opacity: usedIndexes.includes(index) ? 0.5 : 1,
              cursor: usedIndexes.includes(index) ? 'not-allowed' : 'pointer',
              border: 'none',
              marginRight: 2,
              marginLeft: 2,
              transition: 'background 0.18s, opacity 0.18s',
            }}
          >
            {letter}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            minWidth: 120,
            minHeight: 44,
            background: '#f3f4f6',
            border: '2px solid #818cf8',
            borderRadius: 10,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 2,
            color: '#3730a3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 16px',
          }}
        >
          {input || <span style={{ color: '#a5b4fc', fontWeight: 600 }}>Click letters</span>}
        </div>
        <button
          type="button"
          onClick={handleBackspace}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: '#fca5a5',
            color: '#fff',
            fontWeight: 800,
            fontSize: 18,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 1px 4px #fca5a5',
          }}
        >
          Del
        </button>
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: '#a5b4fc',
            color: '#fff',
            fontWeight: 800,
            fontSize: 18,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 1px 4px #a5b4fc',
          }}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => handleSubmit()}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            background: 'linear-gradient(90deg, #6366f1 60%, #38bdf8 100%)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 18,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 1px 4px #a5b4fc',
          }}
        >
          Add
        </button>
      </div>

      {message ? (
        <div style={{ color: messageColor, fontWeight: 700, marginBottom: 10 }}>
          {message}
        </div>
      ) : null}

      <div style={{ marginBottom: 10, color: '#6366f1', fontWeight: 800 }}>
        Found {words.length} / {validWords.length}
      </div>

      <div style={{ marginBottom: 18 }}>
        <h4 style={{ fontSize: 16, color: '#6366f1', fontWeight: 800, marginBottom: 8 }}>
          Your Words
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {words.map((word, index) => (
            <span
              key={`${word}-${index}`}
              style={{
                background: '#bbf7d0',
                color: '#166534',
                fontWeight: 800,
                fontSize: 16,
                borderRadius: 8,
                padding: '6px 14px',
                letterSpacing: 1,
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={advanceToNextQuestion}
        style={{
          padding: '12px 36px',
          borderRadius: 14,
          background: 'linear-gradient(90deg, #6366f1 60%, #38bdf8 100%)',
          color: '#fff',
          fontWeight: 800,
          fontSize: 17,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 8px #a5b4fc',
          marginTop: 8,
          letterSpacing: 0.5,
        }}
      >
        {hasProgress ? 'Next Question' : 'Skip Question'}
      </button>
    </div>
  );
};

export default WordBuilderGame;
