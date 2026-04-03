/**
 * child/BrainPuzzlePage.tsx
 * Brain Puzzle Zone — Sudoku, Maze, Logic, Pattern puzzles
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';

// Utility: Log activity to localStorage for parent timeline
function logPuzzleActivity(action: 'game_selected' | 'game_complete', game: string) {
  try {
    const key = 'ssms_audit_log';
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({
      action,
      category: 'brain_puzzle',
      timestamp: new Date().toISOString(),
      data: { game }
    });
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}
import { motion, AnimatePresence } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 320, damping: 26 };

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ═══════════════════════════════════════════
   SUDOKU (4×4 Easy)
   ═══════════════════════════════════════════ */
interface SudokuPuzzle { grid: (number | null)[][]; solution: number[][]; }

const SUDOKU_PUZZLES: SudokuPuzzle[] = [
  {
    grid: [[1,null,null,4],[null,4,1,null],[null,1,4,null],[4,null,null,1]],
    solution: [[1,2,3,4],[2,4,1,3],[3,1,4,2],[4,3,2,1]],
  },
  {
    grid: [[null,2,null,4],[3,null,null,2],[1,null,null,3],[null,3,2,null]],
    solution: [[1,2,3,4],[3,4,1,2],[1,2,4,3],[4,3,2,1]],
  },
  {
    grid: [[null,null,2,3],[2,3,null,null],[null,null,3,2],[3,2,null,null]],
    solution: [[1,4,2,3],[2,3,4,1],[4,1,3,2],[3,2,1,4]],
  },
];

const SudokuGame: React.FC = () => {
  // Log game start on mount
  useEffect(() => { logPuzzleActivity('game_selected', 'Sudoku'); }, []);
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = SUDOKU_PUZZLES[puzzleIdx];
  const [userGrid, setUserGrid] = useState<(number | null)[][]>(
    puzzle.grid.map(r => [...r])
  );
  const [won, setWon] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const reset = useCallback(() => {
    if (won) logPuzzleActivity('game_complete', 'Sudoku');
    const next = (puzzleIdx + 1) % SUDOKU_PUZZLES.length;
    setPuzzleIdx(next);
    setUserGrid(SUDOKU_PUZZLES[next].grid.map(r => [...r]));
    setWon(false);
    setErrors(new Set());
    // Log new game start
    setTimeout(() => logPuzzleActivity('game_selected', 'Sudoku'), 0);
  }, [puzzleIdx, won]);

  const handleInput = (r: number, c: number, val: string) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 1 || n > 4) return;
    const newGrid = userGrid.map(row => [...row]);
    newGrid[r][c] = n;
    setUserGrid(newGrid);
    // check errors
    const newErrors = new Set<string>();
    newGrid.forEach((row, ri) => row.forEach((cell, ci) => {
      if (cell !== null && cell !== puzzle.solution[ri][ci]) newErrors.add(`${ri}-${ci}`);
    }));
    setErrors(newErrors);
    // check win
    const complete = newGrid.every((row, ri) => row.every((cell, ci) => cell === puzzle.solution[ri][ci]));
    if (complete) {
      setWon(true);
      logPuzzleActivity('game_complete', 'Sudoku');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-3">Fill each row, column, and 2×2 box with numbers 1–4 (no repeats!)</p>
      </div>
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {userGrid.map((row, ri) => row.map((cell, ci) => {
          const isFixed = puzzle.grid[ri][ci] !== null;
          const isError = errors.has(`${ri}-${ci}`);
          const borderR = (ri + 1) % 2 === 0 && ri < 3 ? '2px solid #6366f1' : undefined;
          const borderC = (ci + 1) % 2 === 0 && ci < 3 ? '2px solid #6366f1' : undefined;
          return (
            <motion.div
              key={`${ri}-${ci}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: (ri * 4 + ci) * 0.02 }}
              className="relative"
              style={{ borderBottom: borderR, borderRight: borderC }}
            >
              {isFixed ? (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                  {cell}
                </div>
              ) : (
                <input
                  type="number" min={1} max={4}
                  value={cell ?? ''}
                  onChange={e => handleInput(ri, ci, e.target.value)}
                  className="w-14 h-14 rounded-xl text-center text-xl font-bold outline-none transition-all"
                  style={{
                    background: isError ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.8)',
                    border: `2px solid ${isError ? '#ef4444' : cell ? '#10b981' : 'rgba(226,232,240,0.6)'}`,
                    color: isError ? '#ef4444' : '#1e293b',
                  }}
                />
              )}
            </motion.div>
          );
        }))}
      </div>
      <AnimatePresence>
        {won && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center mt-2">
            <div className="text-4xl mb-1">🎉</div>
            <p className="font-black text-green-600 text-lg">Solved it!</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={reset}
              className="mt-3 px-6 py-2 rounded-2xl text-white text-sm font-bold"
              style={{ background: '#6366f1' }}>Next Puzzle →</motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {!won && (
        <motion.button whileTap={{ scale: 0.95 }} onClick={reset}
          className="px-5 py-2 rounded-2xl text-sm font-bold"
          style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1.5px solid rgba(99,102,241,0.2)' }}>
          New Puzzle
        </motion.button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAZE PUZZLE
   ═══════════════════════════════════════════ */
type Dir = 'up' | 'down' | 'left' | 'right';

interface MazeDef {
  grid: number[][];   // 0=path 1=wall
  start: [number, number];
  end: [number, number];
}

const MAZES: MazeDef[] = [
  {
    grid: [
      [0,1,0,0,0],
      [0,1,0,1,0],
      [0,0,0,1,0],
      [1,1,0,0,0],
      [0,0,0,1,0],
    ],
    start: [0,0], end: [4,4],
  },
  {
    grid: [
      [0,0,0,1,0],
      [1,1,0,1,0],
      [0,0,0,0,0],
      [0,1,1,1,0],
      [0,0,0,0,0],
    ],
    start: [0,0], end: [4,4],
  },
  {
    grid: [
      [0,1,0,0,0],
      [0,1,0,1,0],
      [0,0,0,1,0],
      [1,0,1,1,0],
      [0,0,0,0,0],
    ],
    start: [0,0], end: [4,4],
  },
];

const MazeGame: React.FC = () => {
  useEffect(() => { logPuzzleActivity('game_selected', 'Maze'); }, []);
  const [mazeIdx, setMazeIdx] = useState(0);
  const maze = MAZES[mazeIdx];
  const [pos, setPos] = useState<[number,number]>([...maze.start] as [number,number]);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);

  const reset = useCallback(() => {
    if (won) logPuzzleActivity('game_complete', 'Maze');
    const next = (mazeIdx + 1) % MAZES.length;
    setMazeIdx(next);
    setPos([...MAZES[next].start] as [number,number]);
    setWon(false);
    setMoves(0);
    setTimeout(() => logPuzzleActivity('game_selected', 'Maze'), 0);
  }, [mazeIdx, won]);

  const move = useCallback((dir: Dir) => {
    if (won) return;
    setPos(([r, c]) => {
      const [nr, nc] = dir === 'up' ? [r-1,c] : dir === 'down' ? [r+1,c] : dir === 'left' ? [r,c-1] : [r,c+1];
      if (nr < 0 || nr >= maze.grid.length || nc < 0 || nc >= maze.grid[0].length) return [r,c];
      if (maze.grid[nr][nc] === 1) return [r,c];
      if (nr === maze.end[0] && nc === maze.end[1]) {
        setWon(true);
        logPuzzleActivity('game_complete', 'Maze');
      }
      setMoves(m => m + 1);
      return [nr,nc];
    });
  }, [won, maze]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move('up');
      else if (e.key === 'ArrowDown') move('down');
      else if (e.key === 'ArrowLeft') move('left');
      else if (e.key === 'ArrowRight') move('right');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [move]);

  const CELL = 52;
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs text-gray-500">Guide 🐉 from Start to 🏆 — use buttons or arrow keys!</p>
      <p className="text-xs font-bold text-indigo-500">Moves: {moves}</p>

      {/* Maze grid */}
      <div className="rounded-2xl p-2" style={{ border: '2px solid rgba(99,102,241,0.3)', background: 'rgba(241,245,249,0.9)', display: 'inline-block' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {maze.grid.map((row, r) => (
            <div key={r} style={{ display: 'flex', gap: 3 }}>
              {row.map((cell, c) => {
                const isPlayer = pos[0] === r && pos[1] === c;
                const isEnd = maze.end[0] === r && maze.end[1] === c;
                return (
                  <div key={c} style={{
                    width: CELL, height: CELL,
                    borderRadius: 8,
                    background: cell === 1
                      ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                      : isPlayer
                      ? 'rgba(16,185,129,0.2)'
                      : isEnd
                      ? 'rgba(245,158,11,0.2)'
                      : 'rgba(255,255,255,0.9)',
                    border: cell === 1 ? 'none' : `1.5px solid ${isPlayer ? '#10b981' : isEnd ? '#f59e0b' : 'rgba(203,213,225,0.8)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24,
                    boxShadow: cell === 1 ? '0 2px 6px rgba(99,102,241,0.35)' : 'none',
                  }}>
                    {isPlayer ? '🐉' : isEnd ? '🏆' : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Controls — D-pad */}
      <div className="flex flex-col items-center gap-1">
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => move('up')}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)' }}>⬆️</motion.button>
        <div className="flex gap-1">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => move('left')}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)' }}>⬅️</motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => move('down')}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)' }}>⬇️</motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => move('right')}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)' }}>➡️</motion.button>
        </div>
      </div>

      <AnimatePresence>
        {won && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
            <div className="text-4xl mb-1">🏆</div>
            <p className="font-black text-green-600 text-lg">Maze Solved in {moves} moves!</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={reset}
              className="mt-3 px-6 py-2 rounded-2xl text-white text-sm font-bold"
              style={{ background: '#6366f1' }}>Next Maze →</motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {!won && (
        <motion.button whileTap={{ scale: 0.95 }} onClick={reset}
          className="px-5 py-2 rounded-2xl text-sm font-bold"
          style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1.5px solid rgba(99,102,241,0.2)' }}>
          New Maze
        </motion.button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   LOGIC PUZZLE
   ═══════════════════════════════════════════ */
interface LogicQ { question: string; options: string[]; answer: number; explanation: string; }

const LOGIC_QUESTIONS: LogicQ[] = [
  { question: 'If all Bloops are Razzles, and all Razzles are Lazzles, are all Bloops definitely Lazzles?', options: ['Yes', 'No', 'Maybe'], answer: 0, explanation: 'Yes! Bloops → Razzles → Lazzles. So all Bloops are Lazzles.' },
  { question: 'A clock shows 3:00. What angle is between the hour and minute hands?', options: ['45°', '60°', '90°', '180°'], answer: 2, explanation: 'At 3:00, the hour hand points at 3 and the minute hand at 12 — that is exactly 90°.' },
  { question: 'If it takes 5 machines 5 minutes to make 5 toys, how long does it take 100 machines to make 100 toys?', options: ['100 minutes', '5 minutes', '10 minutes', '50 minutes'], answer: 1, explanation: 'Each machine makes 1 toy in 5 minutes. So 100 machines make 100 toys in — still 5 minutes!' },
  { question: 'A farmer has 17 sheep. All but 9 die. How many are left?', options: ['8', '9', '17', '0'], answer: 1, explanation: '"All but 9" means 9 survive. The answer is 9.' },
  { question: 'Which number should come next? 2, 4, 8, 16, __', options: ['18', '24', '32', '20'], answer: 2, explanation: 'Each number is doubled. 16 × 2 = 32.' },
  { question: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?', options: ['A Dream', 'A Map', 'A Cloud', 'A Mirror'], answer: 1, explanation: 'A Map shows cities, mountains, and water without the real things!' },
  { question: 'If you have 3 apples and you take away 2, how many apples do YOU have?', options: ['1', '2', '3', '0'], answer: 1, explanation: 'You took 2 apples — so you have 2 apples with you!' },
  { question: 'A rooster sits on a roof. It lays an egg — which way does it roll?', options: ['Left', 'Right', 'It doesn\'t roll', 'Roosters don\'t lay eggs!'], answer: 3, explanation: 'Roosters are male birds. They don\'t lay eggs! 🐓' },
];

type LogicQuestionDraft = {
  key: string;
  question: string;
  correct: string;
  distractors: string[];
  explanation: string;
};

const LOGIC_SUBJECTS = [
  { a: 'Sparks', b: 'Thinkers', c: 'Learners' },
  { a: 'Mintos', b: 'Readers', c: 'Students' },
  { a: 'Riddlers', b: 'Puzzle Fans', c: 'Smart Kids' },
  { a: 'Blooms', b: 'Helpers', c: 'Friends' },
];

const LOGIC_RIDDLES: LogicQuestionDraft[] = [
  {
    key: 'logic_riddle_map',
    question: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?',
    correct: 'A map',
    distractors: ['A dream', 'A cloud', 'A mirror'],
    explanation: 'A map can show cities, mountains, and water without the real things.',
  },
  {
    key: 'logic_riddle_rooster',
    question: 'A rooster sits on a roof. It lays an egg. Which way does the egg roll?',
    correct: "Roosters don't lay eggs",
    distractors: ['Left', 'Right', "It doesn't roll"],
    explanation: 'A rooster is male, so it cannot lay eggs.',
  },
];

function buildLogicQuestion(draft: LogicQuestionDraft): LogicQ {
  const options = shuffle([draft.correct, ...draft.distractors]);
  return {
    question: draft.question,
    options,
    answer: options.indexOf(draft.correct),
    explanation: draft.explanation,
  };
}

function generateLogicQuestion(usedKeys: Set<string>): LogicQ {
  for (let attempt = 0; attempt < 300; attempt++) {
    const mode = randInt(0, 5);
    let draft: LogicQuestionDraft;

    if (mode === 0) {
      const chain = pick(LOGIC_SUBJECTS);
      const askPositive = randInt(0, 1) === 0;
      draft = askPositive
        ? {
            key: `logic_chain_yes_${chain.a}_${chain.b}_${chain.c}`,
            question: `If all ${chain.a} are ${chain.b}, and all ${chain.b} are ${chain.c}, are all ${chain.a} definitely ${chain.c}?`,
            correct: 'Yes',
            distractors: ['No', 'Maybe'],
            explanation: `Yes. If all ${chain.a} are ${chain.b}, and all ${chain.b} are ${chain.c}, then all ${chain.a} are ${chain.c}.`,
          }
        : {
            key: `logic_chain_no_${chain.a}_${chain.b}`,
            question: `If all ${chain.a} are ${chain.b}, does that mean all ${chain.b} are ${chain.a}?`,
            correct: 'No',
            distractors: ['Yes', 'Maybe'],
            explanation: `No. Knowing all ${chain.a} are ${chain.b} does not prove that every ${chain.b} is a ${chain.a}.`,
          };
    } else if (mode === 1) {
      const hour = randInt(1, 11);
      const correctAngle = Math.min(hour * 30, 360 - hour * 30);
      draft = {
        key: `logic_clock_${hour}`,
        question: `A clock shows ${hour}:00. What angle is between the hour hand and the minute hand?`,
        correct: `${correctAngle} degrees`,
        distractors: [`${Math.max(0, correctAngle - 30)} degrees`, `${correctAngle + 30} degrees`, '180 degrees'],
        explanation: `Each hour mark is 30 degrees, so at ${hour}:00 the angle is ${correctAngle} degrees.`,
      };
    } else if (mode === 2) {
      const minutes = pick([3, 4, 5, 6, 8, 10]);
      const machines = pick([3, 4, 5, 6, 8, 10]);
      const toys = pick([12, 24, 36, 48, 60]);
      draft = {
        key: `logic_machine_${minutes}_${machines}_${toys}`,
        question: `If ${machines} machines make ${machines} toys in ${minutes} minutes, how long do ${toys} machines take to make ${toys} toys?`,
        correct: `${minutes} minutes`,
        distractors: [`${minutes * 2} minutes`, `${minutes + machines} minutes`, `${toys} minutes`],
        explanation: `Each machine still makes one toy in ${minutes} minutes, so ${toys} machines also take ${minutes} minutes.`,
      };
    } else if (mode === 3) {
      const total = randInt(15, 60);
      const left = randInt(3, total - 4);
      draft = {
        key: `logic_survive_${total}_${left}`,
        question: `A farmer has ${total} sheep. All but ${left} die. How many are left?`,
        correct: String(left),
        distractors: [String(total - left), String(total), '0'],
        explanation: `"All but ${left}" means ${left} sheep survive.`,
      };
    } else if (mode === 4) {
      const start = pick([2, 3, 4, 5, 6, 7, 8]);
      const factor = pick([2, 3]);
      const seq = [start, start * factor, start * factor * factor, start * factor * factor * factor];
      const answer = seq[seq.length - 1] * factor;
      draft = {
        key: `logic_pattern_${start}_${factor}`,
        question: `Which number should come next? ${seq.join(', ')}, __`,
        correct: String(answer),
        distractors: [String(answer - factor), String(answer + start), String(answer - start)],
        explanation: `Each number is multiplied by ${factor}, so the next number is ${answer}.`,
      };
    } else {
      const apples = randInt(3, 12);
      const taken = randInt(1, apples - 1);
      draft = randInt(0, 1) === 0
        ? {
            key: `logic_apples_${apples}_${taken}`,
            question: `If you have ${apples} apples and you take away ${taken}, how many apples do you have?`,
            correct: String(taken),
            distractors: [String(apples - taken), String(apples), '0'],
            explanation: `You took ${taken} apples, so those ${taken} apples are with you.`,
          }
        : pick(LOGIC_RIDDLES);
    }

    if (usedKeys.has(draft.key)) continue;
    usedKeys.add(draft.key);
    return buildLogicQuestion(draft);
  }

  usedKeys.clear();
  return generateLogicQuestion(usedKeys);
}

const LogicGame: React.FC = () => {
  useEffect(() => { logPuzzleActivity('game_selected', 'Logic Puzzle'); }, []);
  const usedKeysRef = useRef<Set<string>>(new Set());
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState<LogicQ>(() => generateLogicQuestion(usedKeysRef.current));
  const idx = 0;
  const finished = false;

  const handleAnswer = (opt: number) => {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === q.answer) setScore(s => s + 1);
  };

  const next = () => {
    logPuzzleActivity('game_complete', 'Logic Puzzle');
    setRound((value) => value + 1);
    setSelected(null);
    setQ(generateLogicQuestion(usedKeysRef.current));
  };

  const restart = () => {
    usedKeysRef.current.clear();
    setRound(0);
    setSelected(null);
    setScore(0);
    setQ(generateLogicQuestion(usedKeysRef.current));
    logPuzzleActivity('game_selected', 'Logic Puzzle');
  };

  if (finished) return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4">
      <div className="text-5xl mb-3">{score >= 6 ? '🏆' : score >= 4 ? '🌟' : '💪'}</div>
      <h3 className="text-xl font-black text-gray-800">You scored {score}/{LOGIC_QUESTIONS.length}!</h3>
      <p className="text-sm text-gray-500 mt-1">{score >= 6 ? 'Brilliant thinker!' : score >= 4 ? 'Great logic skills!' : 'Keep practising!'}</p>
      <motion.button whileTap={{ scale: 0.95 }} onClick={restart}
        className="mt-4 px-6 py-2 rounded-2xl text-white text-sm font-bold"
        style={{ background: '#8b5cf6' }}>Play Again</motion.button>
    </motion.div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400">Question {round + 1}</span>
          <span className="text-[11px] font-bold" style={{ color: '#8b5cf6' }}>Endless Mode</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: '#8b5cf6' }}>Score: {score}</span>
          <motion.button whileTap={{ scale: 0.95 }} onClick={restart}
            className="px-3 py-1.5 rounded-2xl text-[11px] font-bold"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>
            Restart
          </motion.button>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${round}-${q.question}`} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={spring}>
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)' }}>
            <p className="font-bold text-gray-800 text-sm leading-relaxed">{q.question}</p>
          </div>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const isChosen = selected === i;
              const isRight = i === q.answer;
              const bg = selected === null ? 'rgba(255,255,255,0.8)' : isRight ? 'rgba(16,185,129,0.15)' : isChosen ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.5)';
              const border = selected === null ? 'rgba(226,232,240,0.6)' : isRight ? '#10b981' : isChosen ? '#ef4444' : 'rgba(226,232,240,0.4)';
              return (
                <motion.button key={i} whileTap={{ scale: 0.97 }} onClick={() => handleAnswer(i)}
                  className="text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: bg, border: `1.5px solid ${border}`, color: selected !== null && isRight ? '#10b981' : '#374151' }}>
                  {selected !== null && isRight ? '✅ ' : selected !== null && isChosen && !isRight ? '❌ ' : ''}{opt}
                </motion.button>
              );
            })}
          </div>
          {selected !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-2xl text-xs text-gray-600"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              💡 {q.explanation}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
      {selected !== null && (
        <motion.button whileTap={{ scale: 0.95 }} onClick={next} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="self-end px-6 py-2 rounded-2xl text-white text-sm font-bold"
          style={{ background: '#8b5cf6' }}>
          {idx + 1 >= LOGIC_QUESTIONS.length ? 'See Results' : 'Next →'}
        </motion.button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   PATTERN PUZZLE
   ═══════════════════════════════════════════ */
interface PatternQ { sequence: (string | number)[]; options: (string | number)[]; answer: string | number; hint: string; }

const PATTERN_QUESTIONS: PatternQ[] = [
  { sequence: [2, 4, 8, 16, '?'], options: [18, 32, 24, 20], answer: 32, hint: 'Each number is multiplied by 2.' },
  { sequence: ['🔴', '🔵', '🟡', '🔴', '🔵', '?'], options: ['🔴', '🟡', '🟢', '🔵'], answer: '🟡', hint: 'The colours repeat in a cycle: Red, Blue, Yellow.' },
  { sequence: [1, 4, 9, 16, '?'], options: [20, 25, 36, 18], answer: 25, hint: 'These are perfect squares: 1², 2², 3², 4², 5².' },
  { sequence: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '?'], options: ['⭐⭐⭐⭐', '⭐⭐⭐⭐⭐', '⭐⭐⭐⭐⭐⭐', '⭐⭐⭐'], answer: '⭐⭐⭐⭐⭐', hint: 'One more star is added each time.' },
  { sequence: [3, 6, 12, 24, '?'], options: [36, 42, 48, 28], answer: 48, hint: 'Each number is doubled.' },
  { sequence: ['🐛', '🦋', '🐛', '🦋', '🐛', '?'], options: ['🐛', '🦋', '🌸', '🐝'], answer: '🦋', hint: 'The pattern alternates: Caterpillar, Butterfly.' },
  { sequence: [100, 90, 80, 70, '?'], options: [65, 55, 60, 50], answer: 60, hint: 'Each number decreases by 10.' },
  { sequence: ['🟥', '🟧', '🟨', '🟩', '?'], options: ['🟦', '🟥', '🟪', '⬛'], answer: '🟦', hint: 'The colours follow rainbow order: Red, Orange, Yellow, Green, Blue.' },
];

type PatternQuestionDraft = {
  key: string;
  sequence: (string | number)[];
  answer: string | number;
  distractors: (string | number)[];
  hint: string;
};

const PATTERN_CYCLES: string[][] = [
  ['RED', 'BLUE', 'YELLOW'],
  ['SUN', 'MOON', 'STAR'],
  ['CAT', 'DOG'],
  ['LEFT', 'RIGHT'],
  ['CLAP', 'SNAP', 'TAP'],
];

const PATTERN_FILLERS = ['TREE', 'RIVER', 'BELL', 'CLOUD', 'DRUM', 'WIND'];

function buildPatternQuestion(draft: PatternQuestionDraft): PatternQ {
  const optionMap = new Map<string, string | number>();
  [draft.answer, ...draft.distractors].forEach((value) => {
    optionMap.set(`${typeof value}:${String(value)}`, value);
  });
  return {
    sequence: draft.sequence,
    options: shuffle(Array.from(optionMap.values())),
    answer: draft.answer,
    hint: draft.hint,
  };
}

function generatePatternQuestion(usedKeys: Set<string>): PatternQ {
  for (let attempt = 0; attempt < 400; attempt++) {
    const mode = randInt(0, 5);
    let draft: PatternQuestionDraft;

    if (mode === 0) {
      const start = randInt(2, 40);
      const step = randInt(2, 12);
      const seq = [start, start + step, start + step * 2, start + step * 3];
      const answer = start + step * 4;
      draft = {
        key: `pattern_add_${start}_${step}`,
        sequence: [...seq, '?'],
        answer,
        distractors: [answer - step, answer + step, answer + step * 2],
        hint: `Add ${step} each time.`,
      };
    } else if (mode === 1) {
      const start = randInt(40, 120);
      const step = randInt(3, 15);
      const seq = [start, start - step, start - step * 2, start - step * 3];
      const answer = start - step * 4;
      draft = {
        key: `pattern_sub_${start}_${step}`,
        sequence: [...seq, '?'],
        answer,
        distractors: [answer + step, answer - step, answer - step * 2],
        hint: `Subtract ${step} each time.`,
      };
    } else if (mode === 2) {
      const start = randInt(2, 9);
      const factor = pick([2, 3, 4]);
      const seq = [start, start * factor, start * factor * factor, start * factor * factor * factor];
      const answer = seq[seq.length - 1] * factor;
      draft = {
        key: `pattern_mul_${start}_${factor}`,
        sequence: [...seq, '?'],
        answer,
        distractors: [answer - factor, answer + factor, answer + start],
        hint: `Multiply by ${factor} each time.`,
      };
    } else if (mode === 3) {
      const base = randInt(1, 6);
      const seq = [base ** 2, (base + 1) ** 2, (base + 2) ** 2, (base + 3) ** 2];
      const answer = (base + 4) ** 2;
      draft = {
        key: `pattern_square_${base}`,
        sequence: [...seq, '?'],
        answer,
        distractors: [answer - 1, answer + 5, (base + 3) ** 2],
        hint: 'These are square numbers.',
      };
    } else if (mode === 4) {
      const start = randInt(1, 12);
      const firstJump = randInt(2, 5);
      const seq = [start];
      let current = start;
      let jump = firstJump;
      for (let i = 0; i < 3; i++) {
        current += jump;
        seq.push(current);
        jump += 1;
      }
      const answer = current + jump;
      draft = {
        key: `pattern_jump_${start}_${firstJump}`,
        sequence: [...seq, '?'],
        answer,
        distractors: [answer - 1, answer + 1, answer + jump],
        hint: `The jump grows each time: +${firstJump}, +${firstJump + 1}, +${firstJump + 2}...`,
      };
    } else {
      if (randInt(0, 1) === 0) {
        const cycle = pick(PATTERN_CYCLES);
        const offset = randInt(0, cycle.length - 1);
        const sequence = Array.from({ length: 5 }, (_, index) => cycle[(offset + index) % cycle.length]);
        const answer = cycle[(offset + 5) % cycle.length];
        const distractors: string[] = [];
        for (const item of cycle) {
          if (item !== answer) distractors.push(item);
        }
        for (const filler of PATTERN_FILLERS) {
          if (distractors.length >= 3) break;
          if (filler !== answer && !distractors.includes(filler)) distractors.push(filler);
        }
        draft = {
          key: `pattern_cycle_${cycle.join('_')}_${offset}`,
          sequence: [...sequence, '?'],
          answer,
          distractors: distractors.slice(0, 3),
          hint: 'The words repeat in the same order.',
        };
      } else {
        const char = pick(['A', 'B', 'X', 'O', '#']);
        draft = {
          key: `pattern_repeat_${char}`,
          sequence: [char, char.repeat(2), char.repeat(3), char.repeat(4), '?'],
          answer: char.repeat(5),
          distractors: [char.repeat(4), char.repeat(6), char.repeat(3)],
          hint: `One more "${char}" is added each time.`,
        };
      }
    }

    if (usedKeys.has(draft.key)) continue;
    usedKeys.add(draft.key);
    return buildPatternQuestion(draft);
  }

  usedKeys.clear();
  return generatePatternQuestion(usedKeys);
}

const PatternGame: React.FC = () => {
  useEffect(() => { logPuzzleActivity('game_selected', 'Pattern Puzzle'); }, []);
  const usedKeysRef = useRef<Set<string>>(new Set());
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | number | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [q, setQ] = useState<PatternQ>(() => generatePatternQuestion(usedKeysRef.current));
  const idx = 0;
  const finished = false;

  const handleAnswer = (opt: string | number) => {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === q.answer) setScore(s => s + 1);
    setShowHint(false);
  };

  const next = () => {
    logPuzzleActivity('game_complete', 'Pattern Puzzle');
    setRound((value) => value + 1);
    setSelected(null);
    setShowHint(false);
    setQ(generatePatternQuestion(usedKeysRef.current));
  };

  const restart = () => {
    usedKeysRef.current.clear();
    setRound(0);
    setSelected(null);
    setScore(0);
    setShowHint(false);
    setQ(generatePatternQuestion(usedKeysRef.current));
    logPuzzleActivity('game_selected', 'Pattern Puzzle');
  };

  if (finished) return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4">
      <div className="text-5xl mb-3">{score >= 6 ? '🧩' : score >= 4 ? '🌟' : '💪'}</div>
      <h3 className="text-xl font-black text-gray-800">You scored {score}/{PATTERN_QUESTIONS.length}!</h3>
      <p className="text-sm text-gray-500 mt-1">{score >= 6 ? 'Pattern master!' : score >= 4 ? 'Great spotting!' : 'Keep practising!'}</p>
      <motion.button whileTap={{ scale: 0.95 }} onClick={restart}
        className="mt-4 px-6 py-2 rounded-2xl text-white text-sm font-bold"
        style={{ background: '#f59e0b' }}>Play Again</motion.button>
    </motion.div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400">Puzzle {round + 1}</span>
          <span className="text-[11px] font-bold" style={{ color: '#f59e0b' }}>Endless Mode</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>Score: {score}</span>
          <motion.button whileTap={{ scale: 0.95 }} onClick={restart}
            className="px-3 py-1.5 rounded-2xl text-[11px] font-bold"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
            Restart
          </motion.button>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${round}-${q.sequence.join('|')}`} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={spring}>
          {/* Sequence display */}
          <div className="rounded-2xl p-4 mb-3 flex flex-wrap gap-2 justify-center items-center"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
            {q.sequence.map((s, i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08 }}
                className="px-3 py-2 rounded-xl font-bold text-lg"
                style={{
                  background: s === '?' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.9)',
                  border: `1.5px solid ${s === '?' ? '#f59e0b' : 'rgba(226,232,240,0.6)'}`,
                  color: s === '?' ? '#f59e0b' : '#1e293b',
                  minWidth: 44, textAlign: 'center',
                }}>
                {String(s)}
              </motion.span>
            ))}
          </div>
          <p className="text-sm font-bold text-gray-600 text-center mb-3">What comes next?</p>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, i) => {
              const isChosen = selected !== null && selected === opt;
              const isRight = opt === q.answer;
              const bg = selected === null ? 'rgba(255,255,255,0.8)' : isRight ? 'rgba(16,185,129,0.15)' : isChosen ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.5)';
              const border = selected === null ? 'rgba(226,232,240,0.6)' : isRight ? '#10b981' : isChosen ? '#ef4444' : 'rgba(226,232,240,0.4)';
              return (
                <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(opt)}
                  className="py-3 rounded-2xl text-lg font-bold"
                  style={{ background: bg, border: `1.5px solid ${border}` }}>
                  {selected !== null && isRight ? '✅ ' : ''}{String(opt)}
                </motion.button>
              );
            })}
          </div>
          {!selected && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowHint(h => !h)}
              className="mt-2 text-xs font-bold px-4 py-1.5 rounded-2xl w-full"
              style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
              {showHint ? 'Hide Hint' : '💡 Show Hint'}
            </motion.button>
          )}
          <AnimatePresence>
            {(showHint || selected !== null) && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-2 p-3 rounded-2xl text-xs text-gray-600"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                💡 {q.hint}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
      {selected !== null && (
        <motion.button whileTap={{ scale: 0.95 }} onClick={next} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="self-end px-6 py-2 rounded-2xl text-white text-sm font-bold"
          style={{ background: '#f59e0b' }}>
          {idx + 1 >= PATTERN_QUESTIONS.length ? 'See Results' : 'Next →'}
        </motion.button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
interface Game { id: string; label: string; icon: string; color: string; bg: string; border: string; description: string; }

const GAMES: Game[] = [
  { id: 'sudoku',  label: 'Sudoku',         icon: '🔢', color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.25)',  description: 'Fill the 4×4 grid with numbers 1–4' },
  { id: 'maze',    label: 'Maze',           icon: '🌀', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', description: 'Guide the dragon through the maze' },
  { id: 'logic',   label: 'Logic Puzzle',   icon: '🧠', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)', description: 'Tricky questions to sharpen your mind' },
  { id: 'pattern', label: 'Pattern Puzzle', icon: '🧩', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  description: 'Find what comes next in the sequence' },
];

const BrainPuzzlePage: React.FC = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const game = GAMES.find(g => g.id === activeGame);

  return (
    <div className="min-h-screen px-4 py-6 pb-28 lg:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="text-center mb-6">
        <motion.div className="text-5xl mb-2"
          animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          🧠
        </motion.div>
        <h1 className="text-2xl font-black text-gray-800">Brain Puzzle Zone</h1>
        <p className="text-sm text-gray-500 mt-1">Fun puzzles that improve your thinking!</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!activeGame ? (
          /* Game selection */
          <motion.div key="menu" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={spring}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAMES.map((g, i) => (
              <motion.button key={g.id} whileTap={{ scale: 0.96 }} onClick={() => setActiveGame(g.id)}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.07 }}
                className="text-left p-5 rounded-3xl flex items-start gap-4"
                style={{ background: g.bg, border: `1.5px solid ${g.border}`, backdropFilter: 'blur(8px)' }}>
                <motion.div className="text-4xl shrink-0"
                  animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}>
                  {g.icon}
                </motion.div>
                <div>
                  <p className="font-black text-gray-800 text-base">{g.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>
                  <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full text-white"
                    style={{ background: g.color }}>Play →</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          /* Active game */
          <motion.div key={activeGame} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={spring}>
            {/* Back bar */}
            <div className="flex items-center gap-3 mb-5">
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => setActiveGame(null)}
                className="px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-1.5"
                style={{ background: game!.bg, color: game!.color, border: `1.5px solid ${game!.border}` }}>
                ← Back
              </motion.button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{game!.icon}</span>
                <span className="font-black text-gray-800">{game!.label}</span>
              </div>
            </div>
            <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.7)', border: `1.5px solid ${game!.border}`, backdropFilter: 'blur(10px)' }}>
              {activeGame === 'sudoku'  && <SudokuGame />}
              {activeGame === 'maze'    && <MazeGame />}
              {activeGame === 'logic'   && <LogicGame />}
              {activeGame === 'pattern' && <PatternGame />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrainPuzzlePage;
