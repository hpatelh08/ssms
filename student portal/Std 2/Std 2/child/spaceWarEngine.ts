/**
 * child/spaceWarEngine.ts
 * ─────────────────────────────────────────────────────
 * Space War Education Game Engine — Std 3
 *
 * Core mechanic: Asteroids carry wrong answers, the player
 * must shoot the correct-answer asteroid before it reaches
 * the spaceship. Questions come from Maths, English, Science
 * (NCERT Class 2 aligned).
 *
 * Progression:
 *   Sector 1 (1–50):   Easy maths, single-digit addition
 *   Sector 2 (51–120): Two-digit operations, basic English
 *   Sector 3 (121–200): Science questions, word problems
 *   Sector 4 (201–350): Mixed subjects, faster asteroids
 *   Sector 5 (351+):   Boss rounds, multi-step problems
 */

/* ── Types ─────────────────────────────────────── */

export interface SpaceQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  subject: 'maths' | 'english' | 'science';
  difficulty: number;
}

export interface Asteroid {
  id: string;
  label: string;
  isCorrect: boolean;
  x: number;
  y: number;
  speed: number;
  angle: number;
  shape: string; // emoji representation of asteroid shape
  color: string; // color gradient for the asteroid
}

export interface SpaceWarState {
  level: number;
  sector: number;
  sectorName: string;
  score: number;
  streak: number;
  lives: number;
  maxLives: number;
  question: SpaceQuestion;
  asteroids: Asteroid[];
  phase: 'ready' | 'playing' | 'correct' | 'wrong' | 'boss' | 'level-complete' | 'game-over';
  totalCorrect: number;
  totalWrong: number;
  xpEarned: number;
  bossHP: number;
  bossMaxHP: number;
}

/* ── Sector system ─────────────────────────────── */

interface Sector {
  name: string;
  icon: string;
  color: string;
  minLevel: number;
  maxLevel: number;
  subjects: ('maths' | 'english' | 'science')[];
  asteroidSpeed: number;
  asteroidCount: number;
}

const SECTORS: Sector[] = [
  { name: 'Mercury Belt',   icon: '☿️', color: '#f97316', minLevel: 1,   maxLevel: 50,   subjects: ['maths'],              asteroidSpeed: 0.3, asteroidCount: 3 },
  { name: 'Venus Cloud',    icon: '♀️', color: '#eab308', minLevel: 51,  maxLevel: 120,  subjects: ['maths', 'english'],   asteroidSpeed: 0.5, asteroidCount: 4 },
  { name: 'Mars Canyon',    icon: '♂️', color: '#ef4444', minLevel: 121, maxLevel: 200,  subjects: ['maths', 'science'],   asteroidSpeed: 0.6, asteroidCount: 4 },
  { name: 'Jupiter Storm',  icon: '♃',  color: '#f59e0b', minLevel: 201, maxLevel: 350,  subjects: ['maths', 'english', 'science'], asteroidSpeed: 0.7, asteroidCount: 5 },
  { name: 'Saturn Ring',    icon: '♄',  color: '#8b5cf6', minLevel: 351, maxLevel: 99999, subjects: ['maths', 'english', 'science'], asteroidSpeed: 0.8, asteroidCount: 5 },
];

export function getSector(level: number): Sector {
  return SECTORS.find(s => level >= s.minLevel && level <= s.maxLevel) ?? SECTORS[SECTORS.length - 1];
}

export function getSectorIndex(level: number): number {
  const idx = SECTORS.findIndex(s => level >= s.minLevel && level <= s.maxLevel);
  return idx >= 0 ? idx : SECTORS.length - 1;
}

/* ── Question Banks (NCERT Class 2) ─────────────── */

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMathsQuestion(difficulty: number): SpaceQuestion {
  const id = `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // All operations for Std 3: addition, subtraction, multiplication, division
  const operations = ['+', '-', '×', '÷'] as const;
  const op = operations[randomInt(0, 3)];

  if (difficulty <= 1) {
    // Simple operations with 1-digit numbers
    let a: number, b: number, answer: number;
    
    if (op === '+') {
      a = randomInt(1, 9); b = randomInt(1, 9);
      answer = a + b;
    } else if (op === '-') {
      a = randomInt(5, 15); b = randomInt(1, a - 1);
      answer = a - b;
    } else if (op === '×') {
      a = randomInt(2, 5); b = randomInt(1, 5);
      answer = a * b;
    } else { // ÷
      b = randomInt(2, 5);
      a = b * randomInt(1, 5); // ensure divisible
      answer = a / b;
    }
    
    const wrongs = new Set<number>();
    while (wrongs.size < 3) {
      const w = answer + randomInt(-5, 5);
      if (w !== answer && w > 0) wrongs.add(w);
    }
    const options = shuffle([answer.toString(), ...[...wrongs].map(String)]);
    return { id, question: `${a} ${op} ${b} = ?`, options, correctIndex: options.indexOf(answer.toString()), subject: 'maths', difficulty };
  }

  if (difficulty <= 2) {
    // Two-digit operations
    let a: number, b: number, answer: number;
    
    if (op === '+') {
      a = randomInt(10, 50); b = randomInt(5, 30);
      answer = a + b;
    } else if (op === '-') {
      a = randomInt(20, 60); b = randomInt(5, a - 5);
      answer = a - b;
    } else if (op === '×') {
      a = randomInt(2, 10); b = randomInt(2, 10);
      answer = a * b;
    } else { // ÷
      b = randomInt(2, 10);
      a = b * randomInt(2, 10);
      answer = a / b;
    }
    
    const wrongs = new Set<number>();
    while (wrongs.size < 3) {
      const w = answer + randomInt(-8, 8);
      if (w !== answer && w >= 0) wrongs.add(w);
    }
    const options = shuffle([answer.toString(), ...[...wrongs].map(String)]);
    return { id, question: `${a} ${op} ${b} = ?`, options, correctIndex: options.indexOf(answer.toString()), subject: 'maths', difficulty };
  }

  if (difficulty <= 3) {
    // Advanced operations
    let a: number, b: number, answer: number;
    
    if (op === '+') {
      a = randomInt(50, 100); b = randomInt(10, 50);
      answer = a + b;
    } else if (op === '-') {
      a = randomInt(50, 100); b = randomInt(10, a - 10);
      answer = a - b;
    } else if (op === '×') {
      a = randomInt(5, 12); b = randomInt(5, 12);
      answer = a * b;
    } else { // ÷
      b = randomInt(5, 12);
      a = b * randomInt(5, 12);
      answer = a / b;
    }
    
    const wrongs = new Set<number>();
    while (wrongs.size < 3) {
      const w = answer + randomInt(-10, 10);
      if (w !== answer && w > 0) wrongs.add(w);
    }
    const options = shuffle([answer.toString(), ...[...wrongs].map(String)]);
    return { id, question: `${a} ${op} ${b} = ?`, options, correctIndex: options.indexOf(answer.toString()), subject: 'maths', difficulty };
  }

  // Word problems with all operations
  const items = ['apples', 'books', 'marbles', 'pencils', 'stars', 'coins'];
  const item = items[randomInt(0, items.length - 1)];
  let question: string, answer: number;
  
  if (op === '+') {
    const a = randomInt(15, 50), b = randomInt(5, 20);
    answer = a + b;
    question = `Ram has ${a} ${item}. He gets ${b} more. How many?`;
  } else if (op === '-') {
    const a = randomInt(30, 60), b = randomInt(10, 25);
    answer = a - b;
    question = `Sita had ${a} ${item}. She gave away ${b}. How many left?`;
  } else if (op === '×') {
    const a = randomInt(3, 8), b = randomInt(3, 8);
    answer = a * b;
    question = `${a} boxes with ${b} ${item} each. Total?`;
  } else { // ÷
    const b = randomInt(3, 8);
    const a = b * randomInt(3, 8);
    answer = a / b;
    question = `${a} ${item} shared among ${b} friends. Each gets?`;
  }
  
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const w = answer + randomInt(-10, 10);
    if (w !== answer && w > 0) wrongs.add(w);
  }
  const options = shuffle([answer.toString(), ...[...wrongs].map(String)]);
  return { id, question, options, correctIndex: options.indexOf(answer.toString()), subject: 'maths', difficulty };
}

const ENGLISH_QS: { q: string; opts: string[]; ci: number }[] = [
  { q: 'Plural of "child"?', opts: ['childs', 'children', 'childen', 'childes'], ci: 1 },
  { q: 'Opposite of "hot"?', opts: ['warm', 'cold', 'cool', 'wet'], ci: 1 },
  { q: '"She ___ to school daily."', opts: ['go', 'goes', 'going', 'gone'], ci: 1 },
  { q: 'Which is a noun?', opts: ['run', 'quick', 'table', 'slowly'], ci: 2 },
  { q: 'Rhyming word for "cat"?', opts: ['car', 'bat', 'cup', 'dog'], ci: 1 },
  { q: '"The Sun ___ in the east."', opts: ['rise', 'rises', 'rising', 'risen'], ci: 1 },
  { q: 'Which is an action word?', opts: ['beautiful', 'jump', 'tree', 'blue'], ci: 1 },
  { q: 'Opposite of "big"?', opts: ['huge', 'tall', 'small', 'wide'], ci: 2 },
  { q: '"I ___ my homework."', opts: ['do', 'does', 'did', 'done'], ci: 0 },
  { q: 'Plural of "box"?', opts: ['boxs', 'boxes', 'boxen', 'box'], ci: 1 },
  { q: '"The cat is ___ the table."', opts: ['in', 'on', 'under', 'at'], ci: 2 },
  { q: 'Which starts with vowel?', opts: ['tree', 'apple', 'ball', 'car'], ci: 1 },
  { q: 'Past tense of "play"?', opts: ['plays', 'playing', 'played', 'play'], ci: 2 },
  { q: '"He ___ a good boy."', opts: ['am', 'is', 'are', 'be'], ci: 1 },
  { q: 'Singular of "teeth"?', opts: ['teeths', 'tooth', 'teath', 'teethes'], ci: 1 },
  { q: 'Opposite of "happy"?', opts: ['glad', 'sad', 'angry', 'mad'], ci: 1 },
  { q: '"They ___ playing."', opts: ['is', 'am', 'are', 'was'], ci: 2 },
  { q: 'Which is a verb?', opts: ['flower', 'beautiful', 'write', 'garden'], ci: 2 },
  { q: 'Fill: "___ elephant is big."', opts: ['A', 'An', 'The', 'Some'], ci: 1 },
  { q: 'Opposite of "fast"?', opts: ['quick', 'slow', 'rapid', 'hard'], ci: 1 },
];

function generateEnglishQuestion(difficulty: number): SpaceQuestion {
  const id = `e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const q = ENGLISH_QS[randomInt(0, ENGLISH_QS.length - 1)];
  return { id, question: q.q, options: q.opts, correctIndex: q.ci, subject: 'english', difficulty };
}

const SCIENCE_QS: { q: string; opts: string[]; ci: number }[] = [
  { q: 'Which planet is closest to the Sun?', opts: ['Venus', 'Mercury', 'Mars', 'Earth'], ci: 1 },
  { q: 'How many legs does a spider have?', opts: ['6', '8', '10', '4'], ci: 1 },
  { q: 'What do plants need to grow?', opts: ['Darkness', 'Sunlight', 'Stones', 'Ice'], ci: 1 },
  { q: 'Which is the largest planet?', opts: ['Saturn', 'Jupiter', 'Neptune', 'Earth'], ci: 1 },
  { q: 'Water boils at ___ °C?', opts: ['50', '100', '200', '0'], ci: 1 },
  { q: 'Which animal gives us milk?', opts: ['Dog', 'Cow', 'Cat', 'Bird'], ci: 1 },
  { q: 'Roots of a plant grow ___?', opts: ['Up', 'Sideways', 'Down', 'In circles'], ci: 2 },
  { q: 'The moon goes around the ___?', opts: ['Sun', 'Earth', 'Mars', 'Stars'], ci: 1 },
  { q: 'How many bones in the human body?', opts: ['106', '206', '306', '406'], ci: 1 },
  { q: 'Which sense organ helps us see?', opts: ['Ears', 'Eyes', 'Nose', 'Tongue'], ci: 1 },
  { q: 'Which gas do we breathe in?', opts: ['CO2', 'Nitrogen', 'Oxygen', 'Hydrogen'], ci: 2 },
  { q: 'Rain comes from ___?', opts: ['Rivers', 'Clouds', 'Mountains', 'Trees'], ci: 1 },
  { q: 'Baby frog is called ___?', opts: ['Kitten', 'Cub', 'Tadpole', 'Puppy'], ci: 2 },
  { q: 'Which planet has rings?', opts: ['Mars', 'Venus', 'Saturn', 'Mercury'], ci: 2 },
  { q: 'Air is a ___?', opts: ['Solid', 'Liquid', 'Gas', 'Metal'], ci: 2 },
  { q: 'Sun is a ___?', opts: ['Planet', 'Star', 'Moon', 'Comet'], ci: 1 },
  { q: 'Which season comes after summer?', opts: ['Winter', 'Spring', 'Rainy', 'Autumn'], ci: 2 },
  { q: 'How many planets in solar system?', opts: ['7', '8', '9', '10'], ci: 1 },
  { q: 'Which organ pumps blood?', opts: ['Brain', 'Lungs', 'Heart', 'Liver'], ci: 2 },
  { q: 'Ice is ___ form of water?', opts: ['Liquid', 'Gas', 'Solid', 'Plasma'], ci: 2 },
];

function generateScienceQuestion(difficulty: number): SpaceQuestion {
  const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const q = SCIENCE_QS[randomInt(0, SCIENCE_QS.length - 1)];
  return { id, question: q.q, options: q.opts, correctIndex: q.ci, subject: 'science', difficulty };
}

/* ── Level generation ──────────────────────────── */

function getDifficulty(level: number): number {
  if (level <= 50) return 1;
  if (level <= 120) return 2;
  if (level <= 200) return 3;
  return 4;
}

export function generateQuestion(level: number): SpaceQuestion {
  const sector = getSector(level);
  const sub = sector.subjects[randomInt(0, sector.subjects.length - 1)];
  const diff = getDifficulty(level);
  switch (sub) {
    case 'english': return generateEnglishQuestion(diff);
    case 'science': return generateScienceQuestion(diff);
    default: return generateMathsQuestion(diff);
  }
}

// Different asteroid shapes and colors for variety
const ASTEROID_VARIANTS = [
  { shape: '🪨', color: 'radial-gradient(circle at 30% 30%, #78716c, #57534e, #292524)' },
  { shape: '☄️', color: 'radial-gradient(circle at 30% 30%, #dc2626, #991b1b, #450a0a)' },
  { shape: '🌑', color: 'radial-gradient(circle at 30% 30%, #6b7280, #374151, #1f2937)' },
  { shape: '💎', color: 'radial-gradient(circle at 30% 30%, #0ea5e9, #0284c7, #075985)' },
  { shape: '🔷', color: 'radial-gradient(circle at 30% 30%, #3b82f6, #2563eb, #1e40af)' },
  { shape: '🟤', color: 'radial-gradient(circle at 30% 30%, #92400e, #78350f, #451a03)' },
  { shape: '🟣', color: 'radial-gradient(circle at 30% 30%, #8b5cf6, #7c3aed, #6d28d9)' },
  { shape: '🔶', color: 'radial-gradient(circle at 30% 30%, #f97316, #ea580c, #c2410c)' },
];

export function generateAsteroids(question: SpaceQuestion, sector: Sector): Asteroid[] {
  return question.options.map((opt, i) => {
    const variant = ASTEROID_VARIANTS[randomInt(0, ASTEROID_VARIANTS.length - 1)];
    return {
      id: `ast_${i}_${Math.random().toString(36).slice(2, 6)}`,
      label: opt,
      isCorrect: i === question.correctIndex,
      x: 20 + i * (60 / Math.max(question.options.length - 1, 1)),
      y: -10 - randomInt(0, 20),
      speed: sector.asteroidSpeed + Math.random() * 0.2,
      angle: randomInt(-15, 15),
      shape: variant.shape,
      color: variant.color,
    };
  });
}

/* ── State management ──────────────────────────── */

const STORAGE_KEY = 'space_war_state_v1';

interface SavedProgress {
  level: number;
  score: number;
  totalCorrect: number;
  totalWrong: number;
}

export function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as SavedProgress;
      if (typeof p.level === 'number') return p;
    }
  } catch { /* ignore */ }
  return { level: 1, score: 0, totalCorrect: 0, totalWrong: 0 };
}

export function saveProgress(p: SavedProgress): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
  catch { /* quota */ }
}

export function createInitialState(saved?: SavedProgress): SpaceWarState {
  const progress = saved ?? loadProgress();
  const level = progress.level;
  const sector = getSector(level);
  const question = generateQuestion(level);
  const isBoss = level % 10 === 0;

  return {
    level,
    sector: getSectorIndex(level),
    sectorName: sector.name,
    score: progress.score,
    streak: 0,
    lives: 3,
    maxLives: 3,
    question,
    asteroids: generateAsteroids(question, sector),
    phase: 'ready',
    totalCorrect: progress.totalCorrect,
    totalWrong: progress.totalWrong,
    xpEarned: 0,
    bossHP: isBoss ? 3 : 0,
    bossMaxHP: isBoss ? 3 : 0,
  };
}

export function nextLevel(state: SpaceWarState): SpaceWarState {
  const nextLvl = state.level + 1;
  const sector = getSector(nextLvl);
  const question = generateQuestion(nextLvl);
  const isBoss = nextLvl % 10 === 0;

  saveProgress({
    level: nextLvl,
    score: state.score,
    totalCorrect: state.totalCorrect,
    totalWrong: state.totalWrong,
  });

  return {
    ...state,
    level: nextLvl,
    sector: getSectorIndex(nextLvl),
    sectorName: sector.name,
    question,
    asteroids: generateAsteroids(question, sector),
    phase: isBoss ? 'boss' : 'ready',
    xpEarned: 0,
    bossHP: isBoss ? 3 + Math.floor(nextLvl / 50) : 0,
    bossMaxHP: isBoss ? 3 + Math.floor(nextLvl / 50) : 0,
  };
}

export function handleAnswer(state: SpaceWarState, asteroidId: string): SpaceWarState {
  const asteroid = state.asteroids.find(a => a.id === asteroidId);
  if (!asteroid) return state;

  if (asteroid.isCorrect) {
    const streakBonus = Math.min(state.streak, 5) * 5;
    const xp = 10 + streakBonus + (state.level % 10 === 0 ? 30 : 0);
    return {
      ...state,
      score: state.score + 10 + streakBonus,
      streak: state.streak + 1,
      totalCorrect: state.totalCorrect + 1,
      xpEarned: xp,
      phase: 'correct',
    };
  }

  const newLives = state.lives - 1;
  return {
    ...state,
    streak: 0,
    lives: newLives,
    totalWrong: state.totalWrong + 1,
    phase: newLives <= 0 ? 'game-over' : 'wrong',
  };
}

export function handleBossAnswer(state: SpaceWarState, asteroidId: string): SpaceWarState {
  const asteroid = state.asteroids.find(a => a.id === asteroidId);
  if (!asteroid) return state;

  if (asteroid.isCorrect) {
    const newHP = state.bossHP - 1;
    if (newHP <= 0) {
      const xp = 50 + state.level;
      return {
        ...state,
        score: state.score + 50,
        totalCorrect: state.totalCorrect + 1,
        bossHP: 0,
        xpEarned: xp,
        phase: 'correct',
      };
    }
    // Boss still alive — new question
    const question = generateQuestion(state.level);
    const sector = getSector(state.level);
    return {
      ...state,
      score: state.score + 15,
      totalCorrect: state.totalCorrect + 1,
      bossHP: newHP,
      question,
      asteroids: generateAsteroids(question, sector),
    };
  }

  const newLives = state.lives - 1;
  return {
    ...state,
    streak: 0,
    lives: newLives,
    totalWrong: state.totalWrong + 1,
    phase: newLives <= 0 ? 'game-over' : 'wrong',
  };
}

export { SECTORS };
