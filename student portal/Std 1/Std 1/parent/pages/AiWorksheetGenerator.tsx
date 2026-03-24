/**
 * parent/pages/AiWorksheetGenerator.tsx
 * ─────────────────────────────────────────────────────
 * AI Practice Lab — Generates worksheets via Groq AI
 *
 * Features:
 *  • Subject & topic selection (English, Maths, EVS, Hindi)
 *  • Worksheet types: MCQ, Fill-in-the-blank, Match-the-following, Word Puzzle
 *  • Difficulty: Easy / Medium / Hard
 *  • Groq AI generates questions in real-time
 *  • Interactive answer mode with scoring
 *  • Print / PDF export via jsPDF
 *  • History of generated worksheets in localStorage
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

/* ── Design Tokens ────────────────────────────────── */

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: '0 6px 28px rgba(99,102,241,0.06)',
};

/* ── Groq AI ──────────────────────────────────────── */

const GROQ_API_KEY = (typeof process !== 'undefined' && process.env?.GROQ_API_KEY) || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/* ── Types ────────────────────────────────────────── */

type WorksheetType = 'mcq' | 'fill-blank' | 'match' | 'word-puzzle';
type Difficulty = 'easy' | 'medium' | 'hard';
type SubjectKey = 'english' | 'maths' | 'evs' | 'hindi';

interface MCQQuestion {
  type: 'mcq';
  question: string;
  options: string[];
  answer: number; // index
}

interface FillBlankQuestion {
  type: 'fill-blank';
  sentence: string;
  answer: string;
}

interface MatchQuestion {
  type: 'match';
  leftColumn: string[];
  rightColumn: string[];
  correctPairs: number[]; // index mapping left→right
}

interface WordPuzzleQuestion {
  type: 'word-puzzle';
  clue: string;
  answer: string;
  hint: string;
}

type Question = MCQQuestion | FillBlankQuestion | MatchQuestion | WordPuzzleQuestion;

interface Worksheet {
  id: string;
  subject: SubjectKey;
  topic: string;
  worksheetType: WorksheetType;
  difficulty: Difficulty;
  questions: Question[];
  createdAt: string;
  title: string;
}

/* ── Subject config ───────────────────────────────── */

const SUBJECTS: {
  key: SubjectKey;
  label: string;
  icon: string;
  color: string;
  gradient: string;
  topics: string[];
}[] = [
  {
    key: 'english', label: 'English', icon: '📖', color: '#6366F1',
    gradient: 'linear-gradient(135deg, rgba(237,233,254,0.8), rgba(224,231,255,0.7))',
    topics: ['Alphabets & Phonics', 'Simple Words', 'Sentence Formation', 'Rhyming Words', 'Opposites', 'Articles (a/an)', 'Plurals', 'Action Words', 'Describing Words', 'Comprehension'],
  },
  {
    key: 'maths', label: 'Maths', icon: '🔢', color: '#F59E0B',
    gradient: 'linear-gradient(135deg, rgba(254,249,195,0.7), rgba(254,240,138,0.6))',
    topics: ['Numbers 1-100', 'Counting Objects', 'Addition', 'Subtraction', 'Shapes', 'Patterns', 'Comparison (More/Less)', 'Time (Clock)', 'Money', 'Measurements'],
  },
  {
    key: 'evs', label: 'EVS', icon: '🌿', color: '#10B981',
    gradient: 'linear-gradient(135deg, rgba(209,250,229,0.7), rgba(167,243,208,0.6))',
    topics: ['My Family', 'My Body', 'Animals', 'Plants', 'Food & Nutrition', 'Seasons & Weather', 'Water', 'My School', 'Transport', 'Festivals'],
  },
  {
    key: 'hindi', label: 'Hindi', icon: '🔤', color: '#EC4899',
    gradient: 'linear-gradient(135deg, rgba(252,231,243,0.7), rgba(251,207,232,0.6))',
    topics: ['Swar (स्वर)', 'Vyanjan (व्यंजन)', 'Matra Practice', 'Simple Words', 'Poems (Kavita)', 'Picture Description', 'Opposites (Vilom)', 'Animal Names', 'Color Names', 'Fruit & Vegetable Names'],
  },
];

const WORKSHEET_TYPES: { key: WorksheetType; label: string; icon: string; desc: string }[] = [
  { key: 'mcq', label: 'Multiple Choice', icon: '🅰️', desc: 'Pick the correct answer from 4 options' },
  { key: 'fill-blank', label: 'Fill in the Blank', icon: '✏️', desc: 'Complete the sentence with the right word' },
  { key: 'match', label: 'Match the Following', icon: '🔗', desc: 'Draw lines to match related items' },
  { key: 'word-puzzle', label: 'Word Puzzle', icon: '🧩', desc: 'Solve clues to find hidden words' },
];

const DIFFICULTIES: { key: Difficulty; label: string; icon: string; color: string; questions: number }[] = [
  { key: 'easy', label: 'Easy', icon: '🌟', color: '#10B981', questions: 5 },
  { key: 'medium', label: 'Medium', icon: '⭐', color: '#F59E0B', questions: 8 },
  { key: 'hard', label: 'Hard', icon: '🔥', color: '#EF4444', questions: 10 },
];

/* ── Worksheet history (localStorage) ─────────────── */

const HISTORY_KEY = 'ssms_worksheet_history';

function loadHistory(): Worksheet[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToHistory(ws: Worksheet) {
  const history = loadHistory();
  history.unshift(ws);
  // Keep last 20
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

/* ── Groq AI Worksheet Generation ─────────────────── */

async function generateWorksheetAI(
  subject: SubjectKey,
  topic: string,
  wsType: WorksheetType,
  difficulty: Difficulty,
  questionCount: number,
): Promise<Question[]> {
  const subjectLabel = SUBJECTS.find(s => s.key === subject)?.label || subject;

  const typeInstructions: Record<WorksheetType, string> = {
    'mcq': `Generate ${questionCount} multiple-choice questions. Each question must have exactly 4 options labeled A, B, C, D. Return as JSON array where each item has: {"type":"mcq","question":"...","options":["A)...","B)...","C)...","D)..."],"answer":0} where answer is the 0-based index of the correct option.`,
    'fill-blank': `Generate ${questionCount} fill-in-the-blank questions. Use "___" to mark the blank in each sentence. Return as JSON array where each item has: {"type":"fill-blank","sentence":"The cat sat on the ___.","answer":"mat"}`,
    'match': `Generate 1 match-the-following exercise with ${questionCount} pairs. Return as JSON array with exactly 1 item: {"type":"match","leftColumn":["item1","item2",...], "rightColumn":["match1","match2",...], "correctPairs":[0,1,2,...]} where correctPairs[i] is the index in rightColumn that matches leftColumn[i]. Shuffle the rightColumn so pairs are NOT in order.`,
    'word-puzzle': `Generate ${questionCount} word puzzle clues. Each clue should help the student guess a word. Return as JSON array where each item has: {"type":"word-puzzle","clue":"I am a fruit, I am yellow and monkeys love me","answer":"banana","hint":"Starts with B"}`,
  };

  const systemPrompt = `You are an expert Class 1 (age 6-7) worksheet creator for Indian CBSE/NCERT curriculum.
Subject: ${subjectLabel}
Topic: ${topic}
Difficulty: ${difficulty}

Rules:
- Use simple language appropriate for 6-7 year old children
- For ${difficulty} difficulty: ${difficulty === 'easy' ? 'very basic concepts, simple vocabulary' : difficulty === 'medium' ? 'moderate complexity, slightly challenging' : 'more challenging but still age-appropriate'}
- Make questions engaging and fun
- Use Indian context where appropriate (Indian names, foods, festivals, etc.)
- Return ONLY valid JSON, no markdown, no code fences, no explanation text

${typeInstructions[wsType]}

Return ONLY the JSON array. No other text.`;

  if (!GROQ_API_KEY) {
    return generateFallbackQuestions(subject, topic, wsType, questionCount);
  }

  try {
    const resp = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate the ${wsType} worksheet for the topic "${topic}" in ${subjectLabel} now.` },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!resp.ok) {
      console.warn('[Worksheet] Groq API error:', resp.status);
      return generateFallbackQuestions(subject, topic, wsType, questionCount);
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response — handle possible markdown wrapping
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Question[];
      return parsed;
    }

    return generateFallbackQuestions(subject, topic, wsType, questionCount);
  } catch (err) {
    console.warn('[Worksheet] Groq fetch failed:', err);
    return generateFallbackQuestions(subject, topic, wsType, questionCount);
  }
}

/* ── Fallback Questions (offline mode) ────────────── */

function generateFallbackQuestions(
  _subject: SubjectKey,
  topic: string,
  wsType: WorksheetType,
  count: number,
): Question[] {
  const questions: Question[] = [];

  if (wsType === 'mcq') {
    const templates = [
      { q: `What is the first letter of "${topic}"?`, opts: ['A', 'B', 'C', 'D'], ans: 0 },
      { q: `Which subject does "${topic}" belong to?`, opts: ['English', 'Maths', 'Science', 'Art'], ans: 0 },
      { q: 'How many legs does a cat have?', opts: ['2', '4', '6', '8'], ans: 1 },
      { q: 'What color is the sky?', opts: ['Red', 'Green', 'Blue', 'Yellow'], ans: 2 },
      { q: 'Which is the biggest?', opts: ['Ant', 'Cat', 'Dog', 'Elephant'], ans: 3 },
      { q: 'How many days in a week?', opts: ['5', '6', '7', '8'], ans: 2 },
      { q: 'Which animal says "moo"?', opts: ['Dog', 'Cat', 'Cow', 'Bird'], ans: 2 },
      { q: 'What comes after number 5?', opts: ['4', '6', '7', '3'], ans: 1 },
      { q: 'Which shape has 3 sides?', opts: ['Square', 'Circle', 'Triangle', 'Rectangle'], ans: 2 },
      { q: 'What do plants need to grow?', opts: ['Toys', 'Water', 'Books', 'Crayons'], ans: 1 },
    ];
    for (let i = 0; i < Math.min(count, templates.length); i++) {
      const t = templates[i];
      questions.push({ type: 'mcq', question: t.q, options: t.opts, answer: t.ans });
    }
  } else if (wsType === 'fill-blank') {
    const templates = [
      { s: 'The ___ shines in the sky.', a: 'sun' },
      { s: 'We drink ___ when we are thirsty.', a: 'water' },
      { s: 'A cat has ___ legs.', a: 'four' },
      { s: 'The color of grass is ___.', a: 'green' },
      { s: 'We use our ___ to see.', a: 'eyes' },
      { s: 'There are ___ days in a week.', a: 'seven' },
      { s: 'A ___ gives us milk.', a: 'cow' },
      { s: 'We go to ___ to study.', a: 'school' },
      { s: 'Ice cream is ___ (hot/cold).', a: 'cold' },
      { s: 'The opposite of big is ___.', a: 'small' },
    ];
    for (let i = 0; i < Math.min(count, templates.length); i++) {
      questions.push({ type: 'fill-blank', sentence: templates[i].s, answer: templates[i].a });
    }
  } else if (wsType === 'match') {
    questions.push({
      type: 'match',
      leftColumn: ['Dog', 'Cat', 'Cow', 'Hen', 'Duck'].slice(0, count),
      rightColumn: ['Quack', 'Bark', 'Moo', 'Meow', 'Cluck'].slice(0, count),
      correctPairs: [1, 3, 2, 4, 0].slice(0, count),
    });
  } else {
    const templates = [
      { clue: 'I am round and orange. You can eat me.', answer: 'orange', hint: 'A fruit' },
      { clue: 'I have 4 legs and say "woof"', answer: 'dog', hint: 'A pet animal' },
      { clue: 'I am yellow. Monkeys love me.', answer: 'banana', hint: 'A fruit' },
      { clue: 'I fall from clouds when it rains.', answer: 'water', hint: 'We drink this' },
      { clue: 'I am a shape with 4 equal sides.', answer: 'square', hint: 'Not a circle' },
      { clue: 'I am the biggest animal on land.', answer: 'elephant', hint: 'Has a trunk' },
      { clue: 'I have wings and can fly.', answer: 'bird', hint: 'Lives in a nest' },
      { clue: 'I have 12 numbers on my face.', answer: 'clock', hint: 'Shows time' },
      { clue: 'Children play with me. I am round.', answer: 'ball', hint: 'Used in sports' },
      { clue: 'I am white and come from a cow.', answer: 'milk', hint: 'Good for bones' },
    ];
    for (let i = 0; i < Math.min(count, templates.length); i++) {
      questions.push({ type: 'word-puzzle', ...templates[i] });
    }
  }

  return questions;
}

/* ── PDF Export ────────────────────────────────────── */

function exportWorksheetPDF(ws: Worksheet) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(ws.title, pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subject: ${SUBJECTS.find(s => s.key === ws.subject)?.label} | Topic: ${ws.topic} | Difficulty: ${ws.difficulty}`, pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date(ws.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Divider
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  doc.setFontSize(11);

  ws.questions.forEach((q, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    if (q.type === 'mcq') {
      doc.setFont('helvetica', 'bold');
      doc.text(`Q${idx + 1}. ${q.question}`, 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      q.options.forEach((opt) => {
        doc.text(`    ${opt}`, 24, y);
        y += 6;
      });
      y += 4;
    } else if (q.type === 'fill-blank') {
      doc.setFont('helvetica', 'bold');
      doc.text(`Q${idx + 1}. ${q.sentence}`, 20, y);
      y += 10;
    } else if (q.type === 'match') {
      doc.setFont('helvetica', 'bold');
      doc.text(`Match the Following:`, 20, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      q.leftColumn.forEach((left, i) => {
        const right = q.rightColumn[i] || '';
        doc.text(`${i + 1}. ${left}`, 24, y);
        doc.text(right, 120, y);
        y += 7;
      });
      y += 4;
    } else if (q.type === 'word-puzzle') {
      doc.setFont('helvetica', 'bold');
      doc.text(`Q${idx + 1}. ${q.clue}`, 20, y);
      y += 6;
      doc.setFont('helvetica', 'italic');
      doc.text(`    Hint: ${q.hint}`, 24, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`    Answer: ____________`, 24, y);
      y += 10;
    }
  });

  // Answer Key on new page
  doc.addPage();
  y = 20;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Answer Key', pageWidth / 2, y, { align: 'center' });
  y += 12;
  doc.setFontSize(11);

  ws.questions.forEach((q, idx) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'normal');
    if (q.type === 'mcq') {
      doc.text(`Q${idx + 1}: ${q.options[q.answer]}`, 20, y);
    } else if (q.type === 'fill-blank') {
      doc.text(`Q${idx + 1}: ${q.answer}`, 20, y);
    } else if (q.type === 'match') {
      doc.text(`Match answers:`, 20, y);
      y += 7;
      q.leftColumn.forEach((left, i) => {
        doc.text(`  ${left} → ${q.rightColumn[q.correctPairs[i]]}`, 24, y);
        y += 6;
      });
    } else if (q.type === 'word-puzzle') {
      doc.text(`Q${idx + 1}: ${q.answer}`, 20, y);
    }
    y += 7;
  });

  // Footer
  doc.setFontSize(8);
  doc.text('Generated by SSMS AI Learning Companion', pageWidth / 2, 285, { align: 'center' });

  doc.save(`Worksheet_${ws.subject}_${ws.topic.replace(/\s/g, '_')}.pdf`);
}

/* ═══════════════════════════════════════════════════
   COMPONENT: QUESTION RENDERER
   ═══════════════════════════════════════════════════ */

const MCQRenderer: React.FC<{
  q: MCQQuestion; idx: number;
  userAnswer: number | null;
  onAnswer: (idx: number, ans: number) => void;
  showResult: boolean;
}> = ({ q, idx, userAnswer, onAnswer, showResult }) => (
  <motion.div
    className="rounded-2xl p-5"
    style={glass}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay: idx * 0.05 }}
  >
    <p className="text-[13px] font-bold text-gray-700 mb-3">
      <span className="text-indigo-500 mr-2">Q{idx + 1}.</span>
      {q.question}
    </p>
    <div className="grid grid-cols-2 gap-2">
      {q.options.map((opt, oi) => {
        const isSelected = userAnswer === oi;
        const isCorrect = q.answer === oi;
        let bg = 'rgba(255,255,255,0.5)';
        let border = '1px solid rgba(0,0,0,0.06)';
        if (showResult && isSelected && isCorrect) {
          bg = 'rgba(16,185,129,0.12)';
          border = '1px solid rgba(16,185,129,0.3)';
        } else if (showResult && isSelected && !isCorrect) {
          bg = 'rgba(239,68,68,0.10)';
          border = '1px solid rgba(239,68,68,0.3)';
        } else if (showResult && isCorrect) {
          bg = 'rgba(16,185,129,0.08)';
          border = '1px solid rgba(16,185,129,0.2)';
        } else if (isSelected) {
          bg = 'rgba(99,102,241,0.10)';
          border = '1px solid rgba(99,102,241,0.25)';
        }
        return (
          <motion.button
            key={oi}
            onClick={() => !showResult && onAnswer(idx, oi)}
            className="rounded-xl px-4 py-2.5 text-left text-[12px] font-medium text-gray-700 cursor-pointer"
            style={{ background: bg, border }}
            whileHover={!showResult ? { scale: 1.02 } : {}}
            whileTap={!showResult ? { scale: 0.98 } : {}}
          >
            {opt}
            {showResult && isCorrect && <span className="ml-2">✅</span>}
            {showResult && isSelected && !isCorrect && <span className="ml-2">❌</span>}
          </motion.button>
        );
      })}
    </div>
  </motion.div>
);

const FillBlankRenderer: React.FC<{
  q: FillBlankQuestion; idx: number;
  userAnswer: string;
  onAnswer: (idx: number, ans: string) => void;
  showResult: boolean;
}> = ({ q, idx, userAnswer, onAnswer, showResult }) => {
  const isCorrect = showResult && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
  return (
    <motion.div
      className="rounded-2xl p-5"
      style={glass}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: idx * 0.05 }}
    >
      <p className="text-[13px] font-bold text-gray-700 mb-3">
        <span className="text-amber-500 mr-2">Q{idx + 1}.</span>
        {q.sentence}
      </p>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => !showResult && onAnswer(idx, e.target.value)}
          placeholder="Type your answer..."
          className="flex-1 rounded-xl px-4 py-2.5 text-[12px] font-medium text-gray-700 outline-none"
          style={{
            background: showResult
              ? isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'
              : 'rgba(255,255,255,0.5)',
            border: showResult
              ? isCorrect ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)'
              : '1px solid rgba(0,0,0,0.06)',
          }}
          readOnly={showResult}
        />
        {showResult && (
          <span className="text-[11px] font-bold" style={{ color: isCorrect ? '#10B981' : '#EF4444' }}>
            {isCorrect ? '✅ Correct!' : `❌ Answer: ${q.answer}`}
          </span>
        )}
      </div>
    </motion.div>
  );
};

const MatchRenderer: React.FC<{
  q: MatchQuestion; idx: number;
  userPairs: number[];
  onAnswer: (idx: number, pairs: number[]) => void;
  showResult: boolean;
}> = ({ q, idx, userPairs, onAnswer, showResult }) => {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  const handleRightClick = (rightIdx: number) => {
    if (showResult || selectedLeft === null) return;
    const newPairs = [...userPairs];
    newPairs[selectedLeft] = rightIdx;
    onAnswer(idx, newPairs);
    setSelectedLeft(null);
  };

  return (
    <motion.div
      className="rounded-2xl p-5"
      style={glass}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.05 }}
    >
      <p className="text-[13px] font-bold text-gray-700 mb-1">
        <span className="text-green-500 mr-2">🔗</span>
        Match the Following
      </p>
      <p className="text-[10px] text-gray-400 mb-4">Click a left item, then click the matching right item</p>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          {q.leftColumn.map((left, li) => {
            const isSelected = selectedLeft === li;
            const paired = userPairs[li] !== -1;
            const correct = showResult && userPairs[li] === q.correctPairs[li];
            const wrong = showResult && paired && userPairs[li] !== q.correctPairs[li];
            return (
              <motion.button
                key={li}
                onClick={() => !showResult && setSelectedLeft(li)}
                className="w-full rounded-xl px-4 py-2.5 text-left text-[12px] font-medium cursor-pointer"
                style={{
                  background: correct ? 'rgba(16,185,129,0.12)' : wrong ? 'rgba(239,68,68,0.10)' : isSelected ? 'rgba(99,102,241,0.12)' : paired ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.5)',
                  border: isSelected ? '2px solid rgba(99,102,241,0.4)' : '1px solid rgba(0,0,0,0.06)',
                  color: '#374151',
                }}
                whileHover={!showResult ? { scale: 1.02 } : {}}
              >
                {li + 1}. {left}
                {paired && !showResult && <span className="ml-1 text-purple-400">→ {q.rightColumn[userPairs[li]]}</span>}
                {correct && <span className="ml-1">✅</span>}
                {wrong && <span className="ml-1">❌</span>}
              </motion.button>
            );
          })}
        </div>
        <div className="space-y-2">
          {q.rightColumn.map((right, ri) => (
            <motion.button
              key={ri}
              onClick={() => handleRightClick(ri)}
              className="w-full rounded-xl px-4 py-2.5 text-left text-[12px] font-medium cursor-pointer"
              style={{
                background: selectedLeft !== null ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(0,0,0,0.06)',
                color: '#374151',
              }}
              whileHover={selectedLeft !== null && !showResult ? { scale: 1.02, background: 'rgba(99,102,241,0.12)' } : {}}
            >
              {String.fromCharCode(65 + ri)}. {right}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const WordPuzzleRenderer: React.FC<{
  q: WordPuzzleQuestion; idx: number;
  userAnswer: string;
  onAnswer: (idx: number, ans: string) => void;
  showResult: boolean;
  showHint: boolean;
  onToggleHint: () => void;
}> = ({ q, idx, userAnswer, onAnswer, showResult, showHint, onToggleHint }) => {
  const isCorrect = showResult && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
  return (
    <motion.div
      className="rounded-2xl p-5"
      style={glass}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: idx * 0.05 }}
    >
      <p className="text-[13px] font-bold text-gray-700 mb-2">
        <span className="text-purple-500 mr-2">🧩 Q{idx + 1}.</span>
        {q.clue}
      </p>
      {showHint && (
        <p className="text-[11px] text-amber-500 font-medium mb-2">💡 Hint: {q.hint}</p>
      )}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => !showResult && onAnswer(idx, e.target.value)}
          placeholder="Guess the word..."
          className="flex-1 rounded-xl px-4 py-2.5 text-[12px] font-medium text-gray-700 outline-none"
          style={{
            background: showResult
              ? isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'
              : 'rgba(255,255,255,0.5)',
            border: showResult
              ? isCorrect ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)'
              : '1px solid rgba(0,0,0,0.06)',
          }}
          readOnly={showResult}
        />
        {!showResult && (
          <motion.button
            onClick={onToggleHint}
            className="px-3 py-2 rounded-xl text-[11px] font-bold cursor-pointer"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: 'none' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💡 Hint
          </motion.button>
        )}
        {showResult && (
          <span className="text-[11px] font-bold" style={{ color: isCorrect ? '#10B981' : '#EF4444' }}>
            {isCorrect ? '✅ Correct!' : `❌ Answer: ${q.answer}`}
          </span>
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

interface Props {
  onBack: () => void;
}

export const AiWorksheetGenerator: React.FC<Props> = ({ onBack }) => {
  // Step: 'config' | 'generating' | 'worksheet' | 'results'
  const [step, setStep] = useState<'config' | 'generating' | 'worksheet' | 'results'>('config');
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>('english');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState<WorksheetType>('mcq');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);

  // Answers
  const [mcqAnswers, setMcqAnswers] = useState<(number | null)[]>([]);
  const [textAnswers, setTextAnswers] = useState<string[]>([]);
  const [matchPairs, setMatchPairs] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [hintStates, setHintStates] = useState<boolean[]>([]);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  const subjectConfig = useMemo(
    () => SUBJECTS.find(s => s.key === selectedSubject)!,
    [selectedSubject],
  );

  const questionCount = DIFFICULTIES.find(d => d.key === selectedDifficulty)?.questions || 5;

  // Generate worksheet
  const handleGenerate = useCallback(async () => {
    if (!selectedTopic) return;
    setStep('generating');

    const questions = await generateWorksheetAI(
      selectedSubject,
      selectedTopic,
      selectedType,
      selectedDifficulty,
      questionCount,
    );

    const ws: Worksheet = {
      id: `ws_${Date.now()}`,
      subject: selectedSubject,
      topic: selectedTopic,
      worksheetType: selectedType,
      difficulty: selectedDifficulty,
      questions,
      createdAt: new Date().toISOString(),
      title: `${SUBJECTS.find(s => s.key === selectedSubject)?.label} - ${selectedTopic}`,
    };

    setWorksheet(ws);
    saveToHistory(ws);

    // Initialize answer states
    setMcqAnswers(new Array(questions.length).fill(null));
    setTextAnswers(new Array(questions.length).fill(''));
    if (selectedType === 'match' && questions[0]?.type === 'match') {
      setMatchPairs(new Array(questions[0].leftColumn.length).fill(-1));
    }
    setHintStates(new Array(questions.length).fill(false));
    setShowResult(false);
    setScore(null);

    setStep('worksheet');
  }, [selectedSubject, selectedTopic, selectedType, selectedDifficulty, questionCount]);

  // Check answers
  const handleCheckAnswers = useCallback(() => {
    if (!worksheet) return;
    let correct = 0;
    let total = 0;

    worksheet.questions.forEach((q, i) => {
      if (q.type === 'mcq') {
        total++;
        if (mcqAnswers[i] === q.answer) correct++;
      } else if (q.type === 'fill-blank') {
        total++;
        if (textAnswers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim()) correct++;
      } else if (q.type === 'match') {
        q.leftColumn.forEach((_, li) => {
          total++;
          if (matchPairs[li] === q.correctPairs[li]) correct++;
        });
      } else if (q.type === 'word-puzzle') {
        total++;
        if (textAnswers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim()) correct++;
      }
    });

    setShowResult(true);
    setScore({ correct, total });
    setStep('results');
  }, [worksheet, mcqAnswers, textAnswers, matchPairs]);

  // Reset
  const handleReset = useCallback(() => {
    setStep('config');
    setWorksheet(null);
    setMcqAnswers([]);
    setTextAnswers([]);
    setMatchPairs([]);
    setShowResult(false);
    setScore(null);
    setHintStates([]);
  }, []);

  // MCQ answer handler
  const handleMCQAnswer = useCallback((idx: number, ans: number) => {
    setMcqAnswers(prev => { const n = [...prev]; n[idx] = ans; return n; });
  }, []);

  // Text answer handler
  const handleTextAnswer = useCallback((idx: number, ans: string) => {
    setTextAnswers(prev => { const n = [...prev]; n[idx] = ans; return n; });
  }, []);

  // Match answer handler
  const handleMatchAnswer = useCallback((_idx: number, pairs: number[]) => {
    setMatchPairs(pairs);
  }, []);

  // Hint toggle
  const toggleHint = useCallback((idx: number) => {
    setHintStates(prev => { const n = [...prev]; n[idx] = !n[idx]; return n; });
  }, []);

  return (
    <div className="w-full px-2 lg:px-4 py-8 space-y-6 relative" ref={contentRef}>
      {/* Header */}
      <motion.div
        className="flex items-center gap-4 mb-2"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <motion.button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer"
          style={{ ...glass }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </motion.button>
        <div>
          <h1 className="text-2xl font-black text-gray-800">AI Practice Lab</h1>
          <p className="text-[11px] text-gray-400 font-bold">Generate custom worksheets with AI ✨</p>
        </div>
        {worksheet && step !== 'config' && (
          <motion.button
            onClick={() => exportWorksheetPDF(worksheet)}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[12px] font-bold text-white cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
              border: 'none',
            }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            📥 Download PDF
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ═══════ STEP 1: CONFIGURATION ═══════ */}
        {step === 'config' && (
          <motion.div
            key="config"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={spring}
          >
            {/* Subject Selection */}
            <div className="rounded-3xl p-6" style={glass}>
              <h2 className="text-[14px] font-black text-gray-700 mb-4 flex items-center gap-2">
                <span>📚</span> Choose Subject
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SUBJECTS.map(s => (
                  <motion.button
                    key={s.key}
                    onClick={() => { setSelectedSubject(s.key); setSelectedTopic(''); }}
                    className="rounded-2xl p-4 text-center cursor-pointer"
                    style={{
                      background: selectedSubject === s.key ? s.gradient : 'rgba(255,255,255,0.4)',
                      border: selectedSubject === s.key ? `2px solid ${s.color}30` : '1px solid rgba(0,0,0,0.04)',
                      boxShadow: selectedSubject === s.key ? `0 4px 16px ${s.color}15` : 'none',
                    }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="text-2xl block mb-2">{s.icon}</span>
                    <span className="text-[12px] font-bold" style={{ color: selectedSubject === s.key ? s.color : '#6B7280' }}>
                      {s.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Topic Selection */}
            <div className="rounded-3xl p-6" style={glass}>
              <h2 className="text-[14px] font-black text-gray-700 mb-4 flex items-center gap-2">
                <span>{subjectConfig.icon}</span> Choose Topic
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {subjectConfig.topics.map(topic => (
                  <motion.button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className="rounded-xl px-4 py-3 text-[11px] font-medium text-center cursor-pointer"
                    style={{
                      background: selectedTopic === topic ? `${subjectConfig.color}15` : 'rgba(255,255,255,0.4)',
                      border: selectedTopic === topic ? `2px solid ${subjectConfig.color}30` : '1px solid rgba(0,0,0,0.04)',
                      color: selectedTopic === topic ? subjectConfig.color : '#6B7280',
                      fontWeight: selectedTopic === topic ? 700 : 500,
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {topic}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Worksheet Type */}
            <div className="rounded-3xl p-6" style={glass}>
              <h2 className="text-[14px] font-black text-gray-700 mb-4 flex items-center gap-2">
                <span>📝</span> Worksheet Type
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {WORKSHEET_TYPES.map(wt => (
                  <motion.button
                    key={wt.key}
                    onClick={() => setSelectedType(wt.key)}
                    className="rounded-2xl p-4 text-left cursor-pointer"
                    style={{
                      background: selectedType === wt.key ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.4)',
                      border: selectedType === wt.key ? '2px solid rgba(99,102,241,0.2)' : '1px solid rgba(0,0,0,0.04)',
                    }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="text-xl block mb-2">{wt.icon}</span>
                    <span className="text-[12px] font-bold block" style={{ color: selectedType === wt.key ? '#6366F1' : '#6B7280' }}>
                      {wt.label}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-1">{wt.desc}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="rounded-3xl p-6" style={glass}>
              <h2 className="text-[14px] font-black text-gray-700 mb-4 flex items-center gap-2">
                <span>🎯</span> Difficulty Level
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {DIFFICULTIES.map(d => (
                  <motion.button
                    key={d.key}
                    onClick={() => setSelectedDifficulty(d.key)}
                    className="rounded-2xl p-4 text-center cursor-pointer"
                    style={{
                      background: selectedDifficulty === d.key ? `${d.color}12` : 'rgba(255,255,255,0.4)',
                      border: selectedDifficulty === d.key ? `2px solid ${d.color}30` : '1px solid rgba(0,0,0,0.04)',
                    }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="text-xl block mb-1">{d.icon}</span>
                    <span className="text-[13px] font-bold block" style={{ color: selectedDifficulty === d.key ? d.color : '#6B7280' }}>
                      {d.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{d.questions} questions</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <motion.button
              onClick={handleGenerate}
              disabled={!selectedTopic}
              className="w-full rounded-2xl py-5 text-center cursor-pointer relative overflow-hidden"
              style={{
                background: selectedTopic
                  ? `linear-gradient(135deg, ${subjectConfig.color}, ${subjectConfig.color}cc)`
                  : 'rgba(200,200,200,0.3)',
                boxShadow: selectedTopic ? `0 6px 24px ${subjectConfig.color}25` : 'none',
                color: selectedTopic ? '#fff' : '#aaa',
                border: 'none',
              }}
              whileHover={selectedTopic ? { y: -3, scale: 1.01 } : {}}
              whileTap={selectedTopic ? { scale: 0.98 } : {}}
            >
              <span className="text-[15px] font-bold flex items-center justify-center gap-2">
                ✨ Generate AI Worksheet
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* ═══════ STEP 2: GENERATING ═══════ */}
        {step === 'generating' && (
          <motion.div
            key="generating"
            className="flex flex-col items-center justify-center py-24"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={spring}
          >
            <motion.div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6"
              style={{
                background: `linear-gradient(135deg, ${subjectConfig.color}20, ${subjectConfig.color}10)`,
                boxShadow: `0 8px 32px ${subjectConfig.color}15`,
              }}
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🤖
            </motion.div>
            <h2 className="text-lg font-black text-gray-800 mb-2">AI is crafting your worksheet...</h2>
            <p className="text-[12px] text-gray-400 font-medium">
              {subjectConfig.label} · {selectedTopic} · {selectedType} · {selectedDifficulty}
            </p>
            <motion.div
              className="mt-6 w-48 h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.05)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${subjectConfig.color}, ${subjectConfig.color}88)` }}
                animate={{ width: ['0%', '60%', '80%', '95%'] }}
                transition={{ duration: 3, times: [0, 0.4, 0.7, 1] }}
              />
            </motion.div>
          </motion.div>
        )}

        {/* ═══════ STEP 3: WORKSHEET ═══════ */}
        {(step === 'worksheet' || step === 'results') && worksheet && (
          <motion.div
            key="worksheet"
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={spring}
          >
            {/* Worksheet Header */}
            <div className="rounded-3xl p-6" style={{
              background: subjectConfig.gradient,
              border: `1px solid ${subjectConfig.color}20`,
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-800">{worksheet.title}</h2>
                  <p className="text-[11px] text-gray-500 font-medium mt-1">
                    {WORKSHEET_TYPES.find(w => w.key === worksheet.worksheetType)?.label} · {worksheet.difficulty} · {worksheet.questions.length} questions
                  </p>
                </div>
                <div className="flex items-center gap-2 text-3xl">
                  {subjectConfig.icon}
                </div>
              </div>
            </div>

            {/* Score Banner (results mode) */}
            {step === 'results' && score && (
              <motion.div
                className="rounded-3xl p-6 text-center"
                style={{
                  background: score.correct / score.total >= 0.7
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(52,211,153,0.08))'
                    : score.correct / score.total >= 0.4
                      ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.08))'
                      : 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(244,114,182,0.06))',
                  border: '1px solid rgba(255,255,255,0.5)',
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring}
              >
                <motion.span
                  className="text-5xl block mb-3"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  {score.correct / score.total >= 0.7 ? '🏆' : score.correct / score.total >= 0.4 ? '⭐' : '💪'}
                </motion.span>
                <h3 className="text-xl font-black text-gray-800">
                  {score.correct} / {score.total} Correct!
                </h3>
                <p className="text-[12px] text-gray-500 font-medium mt-1">
                  {score.correct / score.total >= 0.7 ? 'Excellent work! Keep it up! 🎉' : score.correct / score.total >= 0.4 ? 'Good effort! Practice makes perfect! ✨' : 'Keep trying! You\'ll get better! 💪'}
                </p>
                <div className="flex justify-center gap-3 mt-4">
                  <motion.button
                    onClick={handleReset}
                    className="px-6 py-2.5 rounded-2xl text-[12px] font-bold cursor-pointer"
                    style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: 'none' }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    📝 New Worksheet
                  </motion.button>
                  <motion.button
                    onClick={() => exportWorksheetPDF(worksheet)}
                    className="px-6 py-2.5 rounded-2xl text-[12px] font-bold text-white cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', border: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    📥 Save as PDF
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Questions */}
            <div className="space-y-4">
              {worksheet.questions.map((q, idx) => {
                if (q.type === 'mcq') {
                  return (
                    <MCQRenderer
                      key={idx}
                      q={q}
                      idx={idx}
                      userAnswer={mcqAnswers[idx] ?? null}
                      onAnswer={handleMCQAnswer}
                      showResult={showResult}
                    />
                  );
                } else if (q.type === 'fill-blank') {
                  return (
                    <FillBlankRenderer
                      key={idx}
                      q={q}
                      idx={idx}
                      userAnswer={textAnswers[idx] || ''}
                      onAnswer={handleTextAnswer}
                      showResult={showResult}
                    />
                  );
                } else if (q.type === 'match') {
                  return (
                    <MatchRenderer
                      key={idx}
                      q={q}
                      idx={idx}
                      userPairs={matchPairs}
                      onAnswer={handleMatchAnswer}
                      showResult={showResult}
                    />
                  );
                } else if (q.type === 'word-puzzle') {
                  return (
                    <WordPuzzleRenderer
                      key={idx}
                      q={q}
                      idx={idx}
                      userAnswer={textAnswers[idx] || ''}
                      onAnswer={handleTextAnswer}
                      showResult={showResult}
                      showHint={hintStates[idx] || false}
                      onToggleHint={() => toggleHint(idx)}
                    />
                  );
                }
                return null;
              })}
            </div>

            {/* Check Answers / Try Again buttons */}
            {step === 'worksheet' && (
              <motion.button
                onClick={handleCheckAnswers}
                className="w-full rounded-2xl py-4 text-center cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${subjectConfig.color}, ${subjectConfig.color}cc)`,
                  boxShadow: `0 6px 24px ${subjectConfig.color}25`,
                  color: '#fff',
                  border: 'none',
                }}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-[14px] font-bold flex items-center justify-center gap-2">
                  ✅ Check My Answers
                </span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiWorksheetGenerator;
