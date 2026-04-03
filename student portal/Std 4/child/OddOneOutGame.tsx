import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCelebrate } from './useCelebrationController';
import { useAddXP } from './XPProvider';
import { recordJourneyLevel, JOURNEY_GAMES } from './journey/journeyProgress';
import { logActivity } from '../services/activityLogger';
import questionsWithAnswersRaw from '../STD 04/odd_one_out_1000_with_answers.txt?raw';
import wordBuilderPdfLevels from '../STD 04/word_builder_1000.json';

const OOO_STORAGE_KEY = 'oddOneOut_currentLevel';
const XP_PER_LEVEL = 25;
const QUESTIONS_PER_MILESTONE = 5;
const AUTO_ADVANCE_DELAY_MS = 1100;

type OddOneOutQuestion = {
  words: string[];
  answer: string;
  signature: string;
};

type WordBuilderPdfLevel = {
  answers?: string[];
};

type SyntheticBucket = {
  count: number;
  oddWords: string[];
  triples: string[][];
};

function normalizeWord(word: string): string {
  return word.trim().replace(/\s+/g, ' ').toLowerCase();
}

function toDisplayWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildSignature(words: string[]): string {
  return [...words].map(normalizeWord).sort().join('|');
}

function createQuestion(words: string[], answer: string): OddOneOutQuestion | null {
  const normalizedWords = words.map(normalizeWord).filter(Boolean);
  const normalizedAnswer = normalizeWord(answer);

  if (normalizedWords.length !== 4 || !normalizedAnswer || !normalizedWords.includes(normalizedAnswer)) {
    return null;
  }

  return {
    words: normalizedWords.map(toDisplayWord),
    answer: toDisplayWord(normalizedAnswer),
    signature: buildSignature(normalizedWords),
  };
}

function parseQuestionsWithAnswers(raw: string): OddOneOutQuestion[] {
  const unique = new Set<string>();
  const parsed: OddOneOutQuestion[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const withoutNumber = trimmed.replace(/^\d+\.\s*/, '');
    const answerMatch = /Answer:\s*/i.exec(withoutNumber);
    if (!answerMatch || answerMatch.index == null) continue;

    const wordsPart = withoutNumber
      .slice(0, answerMatch.index)
      .replace(/[\s\u2192\-–—>]+$/, '')
      .trim();
    const answerPart = withoutNumber.slice(answerMatch.index + answerMatch[0].length).trim();
    const words = wordsPart.split(',').map((word) => word.trim()).filter(Boolean);
    const question = createQuestion(words, answerPart);

    if (!question || unique.has(question.signature)) continue;

    unique.add(question.signature);
    parsed.push(question);
  }

  return parsed;
}

function createTriples(words: string[]): string[][] {
  const triples: string[][] = [];

  for (let i = 0; i < words.length - 2; i += 1) {
    for (let j = i + 1; j < words.length - 1; j += 1) {
      for (let k = j + 1; k < words.length; k += 1) {
        triples.push([words[i], words[j], words[k]]);
      }
    }
  }

  return triples;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }

  return x || 1;
}

function findPermutationStep(total: number, preferred: number): number {
  if (total <= 1) return 1;

  let step = Math.min(Math.max(2, preferred), total - 1);
  while (step > 1 && gcd(step, total) !== 1) {
    step -= 1;
  }

  return step > 0 ? step : 1;
}

function permuteIndex(index: number, total: number, step: number, offset = 0): number {
  if (total <= 0) return 0;
  return (index * step + offset) % total;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const nextItems = [...items];
  let state = (seed + 1) >>> 0;

  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  for (let i = nextItems.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(rand() * (i + 1));
    [nextItems[i], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[i]];
  }

  return nextItems;
}

const BASE_QUESTIONS = parseQuestionsWithAnswers(questionsWithAnswersRaw);

const FALLBACK_QUESTIONS: OddOneOutQuestion[] = [
  {
    words: ['Cat', 'Dog', 'Ball', 'Cow'],
    answer: 'Ball',
    signature: 'ball|cat|cow|dog',
  },
];

const WORD_POOL = (() => {
  const pool = new Set<string>();

  for (const question of BASE_QUESTIONS) {
    question.words.forEach((word) => pool.add(normalizeWord(word)));
  }

  for (const level of wordBuilderPdfLevels as WordBuilderPdfLevel[]) {
    if (!Array.isArray(level.answers)) continue;
    level.answers.forEach((word) => {
      const normalized = normalizeWord(String(word));
      if (normalized) pool.add(normalized);
    });
  }

  return Array.from(pool).sort();
})();

const WORDS_BY_INITIAL = (() => {
  const buckets = new Map<string, string[]>();

  for (const word of WORD_POOL) {
    const initial = word.charAt(0);
    if (!initial) continue;

    const current = buckets.get(initial) ?? [];
    current.push(word);
    buckets.set(initial, current);
  }

  return Array.from(buckets.entries())
    .map(([initial, words]) => ({
      initial,
      words: words.sort(),
    }))
    .filter((bucket) => bucket.words.length >= 3)
    .sort((a, b) => a.initial.localeCompare(b.initial));
})();

const SYNTHETIC_BUCKETS: SyntheticBucket[] = WORDS_BY_INITIAL
  .map((bucket) => {
    const triples = createTriples(bucket.words);
    const oddWords = WORD_POOL.filter((word) => word.charAt(0) !== bucket.initial);

    return {
      triples,
      oddWords,
      count: triples.length * oddWords.length,
    };
  })
  .filter((bucket) => bucket.count > 0);

const TOTAL_SYNTHETIC_QUESTIONS = SYNTHETIC_BUCKETS.reduce((sum, bucket) => sum + bucket.count, 0);
const SYNTHETIC_STEP = findPermutationStep(TOTAL_SYNTHETIC_QUESTIONS, 7919);
const SYNTHETIC_OFFSET = TOTAL_SYNTHETIC_QUESTIONS > 0 ? 97 % TOTAL_SYNTHETIC_QUESTIONS : 0;

function getSyntheticQuestion(index: number): OddOneOutQuestion {
  if (!TOTAL_SYNTHETIC_QUESTIONS) {
    return FALLBACK_QUESTIONS[index % FALLBACK_QUESTIONS.length];
  }

  let remaining = permuteIndex(index, TOTAL_SYNTHETIC_QUESTIONS, SYNTHETIC_STEP, SYNTHETIC_OFFSET);

  for (const bucket of SYNTHETIC_BUCKETS) {
    if (remaining >= bucket.count) {
      remaining -= bucket.count;
      continue;
    }

    const tripleIndex = Math.floor(remaining / bucket.oddWords.length);
    const oddIndex = remaining % bucket.oddWords.length;
    const answerWord = bucket.oddWords[oddIndex];
    const orderedWords = seededShuffle([...bucket.triples[tripleIndex], answerWord], index + 31);
    const question = createQuestion(orderedWords, answerWord);

    if (question) return question;
    break;
  }

  return FALLBACK_QUESTIONS[index % FALLBACK_QUESTIONS.length];
}

function getOddOneOutQuestion(index: number): OddOneOutQuestion {
  if (index < BASE_QUESTIONS.length) {
    return BASE_QUESTIONS[index];
  }

  return getSyntheticQuestion(index - BASE_QUESTIONS.length);
}

const OddOneOutGame: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const celebrate = useCelebrate();
  const addXP = useAddXP();

  const [level, setLevel] = useState<number>(() => {
    try {
      return Math.max(1, parseInt(localStorage.getItem(OOO_STORAGE_KEY) || '1', 10));
    } catch {
      return 1;
    }
  });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const isAdvancingRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(OOO_STORAGE_KEY, String(level));
    } catch {
      /* ignore */
    }
  }, [level]);

  const absoluteQuestionIndex = Math.max(0, (level - 1) * QUESTIONS_PER_MILESTONE + questionIndex);
  const question = getOddOneOutQuestion(absoluteQuestionIndex);
  const isMilestoneQuestion = questionIndex === QUESTIONS_PER_MILESTONE - 1;

  const handleAdvance = useCallback(() => {
    if (isAdvancingRef.current || !showResult) return;
    isAdvancingRef.current = true;

    setSelected(null);
    setShowResult(false);

    if (isMilestoneQuestion) {
      celebrate('confetti');
      addXP(XP_PER_LEVEL);
      recordJourneyLevel(JOURNEY_GAMES.ODD_ONE_OUT);
      logActivity('oddOneOut', 3);
      setQuestionIndex(0);
      setLevel((prev) => prev + 1);
      return;
    }

    setQuestionIndex((prev) => prev + 1);
  }, [addXP, celebrate, isMilestoneQuestion, showResult]);

  useEffect(() => {
    if (!showResult) {
      isAdvancingRef.current = false;
      return undefined;
    }

    const timer = window.setTimeout(() => {
      handleAdvance();
    }, AUTO_ADVANCE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [handleAdvance, showResult]);

  const handleSelect = (word: string) => {
    if (selected) return;
    setSelected(word);
    setShowResult(true);
  };

  if (!question) return null;

  const nonRepeatCount = BASE_QUESTIONS.length + TOTAL_SYNTHETIC_QUESTIONS;

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
        Odd One Out
      </h2>
      <div style={{ marginBottom: 10, fontWeight: 700, color: '#6366f1', fontSize: 18 }}>
        Question {absoluteQuestionIndex + 1}
      </div>
      <div style={{ marginBottom: 10, color: '#818cf8', fontWeight: 700, fontSize: 14 }}>
        Repeat-free mode active.
      </div>
      <div style={{ marginBottom: 18, color: '#64748b', fontWeight: 700, fontSize: 12 }}>
        Unique local pool: {nonRepeatCount.toLocaleString()}+ questions
      </div>
      <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 28, color: '#0ea5e9' }}>
        Choose the word that is different:
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
          justifyContent: 'center',
          marginBottom: 32,
        }}
      >
        {question.words.map((word) => {
          const isCorrect = word === question.answer;
          const isSelected = selected === word;
          const highlightCorrect = showResult && isCorrect;
          const highlightWrong = isSelected && !isCorrect;

          return (
            <button
              key={`${question.signature}-${word}`}
              type="button"
              onClick={() => handleSelect(word)}
              disabled={Boolean(selected)}
              style={{
                padding: '16px 0',
                borderRadius: 16,
                border: highlightCorrect
                  ? '2.5px solid #22c55e'
                  : highlightWrong
                    ? '2.5px solid #ef4444'
                    : '2.5px solid #818cf8',
                background: highlightCorrect
                  ? 'linear-gradient(90deg, #bbf7d0 60%, #dbeafe 100%)'
                  : highlightWrong
                    ? 'linear-gradient(90deg, #fecaca 60%, #f3f4f6 100%)'
                    : 'linear-gradient(90deg, #f3f4f6 60%, #e0e7ff 100%)',
                color: '#3730a3',
                fontWeight: 800,
                fontSize: 18,
                cursor: selected ? 'not-allowed' : 'pointer',
                boxShadow: highlightCorrect
                  ? '0 0 0 4px #bbf7d0'
                  : highlightWrong
                    ? '0 0 0 4px #fecaca'
                    : '0 2px 8px #e0e7ff',
                outline: 'none',
                transition: 'all 0.18s',
              }}
            >
              {word}
            </button>
          );
        })}
      </div>

      {showResult ? (
        <div style={{ marginBottom: 18 }}>
          {selected === question.answer ? (
            <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>
              Correct! Great job!
            </span>
          ) : (
            <span style={{ color: '#ef4444', fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>
              The answer is "{question.answer}".
            </span>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: 18, color: '#64748b', fontWeight: 700, fontSize: 15 }}>
          Answer this question to continue.
        </div>
      )}

      <button
        type="button"
        onClick={handleAdvance}
        disabled={!showResult}
        style={{
          padding: '12px 36px',
          borderRadius: 14,
          background: showResult ? 'linear-gradient(90deg, #6366f1 60%, #38bdf8 100%)' : '#cbd5e1',
          color: '#fff',
          fontWeight: 800,
          fontSize: 17,
          border: 'none',
          cursor: showResult ? 'pointer' : 'not-allowed',
          boxShadow: showResult ? '0 2px 8px #a5b4fc' : 'none',
          marginTop: 8,
          letterSpacing: 0.5,
        }}
      >
        Next Question
      </button>
    </div>
  );
};

export default OddOneOutGame;
