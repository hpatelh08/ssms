/**
 * games/curriculum/arcadeGenerators.ts — Parameterised Arcade generators
 * ═════════════════════════════════════════════════════════════════════
 * Each generator accepts GeneratorParams and returns CurriculumQuestion.
 * Cognitive-focused: pattern recognition, memory, speed, visual logic, matching.
 *
 * ⚠ Complements engine/questionGenerator.ts — does NOT replace it.
 */

import type { CurriculumQuestion, GeneratorParams } from './curriculumTypes';
import { uid, pick, pickN, shuffle, randInt } from './curriculumTypes';

// ── Signature helper (DJB2 hash) ──────────────────────────

function sig(parts: (string | number)[]): string {
  const s = parts.join('|');
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `a_${(h >>> 0).toString(36)}`;
}

// ── Shared data banks ─────────────────────────────────────

const SHAPES = [
  { name: 'Circle', emoji: '⚫' }, { name: 'Square', emoji: '⬜' },
  { name: 'Triangle', emoji: '🔺' }, { name: 'Diamond', emoji: '🔷' },
  { name: 'Star', emoji: '⭐' }, { name: 'Hexagon', emoji: '⬡' },
  { name: 'Pentagon', emoji: '⬠' }, { name: 'Oval', emoji: '🥚' },
  { name: 'Arrow', emoji: '➡️' }, { name: 'Cross', emoji: '✚' },
  { name: 'Heart', emoji: '❤️' }, { name: 'Rectangle', emoji: '🟩' },
];

const PAT_EMOJIS = ['🔴', '🔵', '🟢', '🟡', '🟣', '⬛', '⚪', '🟠', '🟤', '🩷'];
const COLOUR_NAMES = ['red', 'blue', 'green', 'yellow', 'purple', 'black', 'white', 'orange', 'brown', 'pink'];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const COUNT_EMOJIS = ['🍎', '⭐', '❤️', '⚽', '🌸', '🐟', '🐦', '📚', '🍬', '🔵', '✏️', '🎈'];

const CVC_WORDS = [
  'cat', 'dog', 'pen', 'pin', 'cup', 'bat', 'hen', 'pig', 'sun', 'map',
  'net', 'hit', 'bun', 'top', 'bag', 'bed', 'hot', 'rug', 'van', 'jet',
  'lip', 'pot', 'gum', 'jam', 'wet', 'tin', 'fox', 'mud', 'red', 'sit',
];

const LONGER_WORDS = [
  'apple', 'table', 'tiger', 'water', 'lemon', 'music', 'river', 'camel',
  'melon', 'pilot', 'robot', 'cabin', 'seven', 'human', 'super', 'mango',
];

const ANIMALS = [
  { name: 'Cat', emoji: '🐱' }, { name: 'Dog', emoji: '🐶' }, { name: 'Bird', emoji: '🐦' },
  { name: 'Fish', emoji: '🐟' }, { name: 'Frog', emoji: '🐸' }, { name: 'Bear', emoji: '🐻' },
  { name: 'Lion', emoji: '🦁' }, { name: 'Elephant', emoji: '🐘' }, { name: 'Rabbit', emoji: '🐰' },
  { name: 'Monkey', emoji: '🐵' }, { name: 'Duck', emoji: '🦆' }, { name: 'Cow', emoji: '🐄' },
];

const OBJECTS = [
  { name: 'ball', emoji: '⚽' }, { name: 'book', emoji: '📚' }, { name: 'star', emoji: '⭐' },
  { name: 'apple', emoji: '🍎' }, { name: 'car', emoji: '🚗' }, { name: 'tree', emoji: '🌳' },
  { name: 'flower', emoji: '🌸' }, { name: 'house', emoji: '🏠' }, { name: 'pencil', emoji: '✏️' },
  { name: 'candy', emoji: '🍬' }, { name: 'cake', emoji: '🎂' }, { name: 'hat', emoji: '🎩' },
];

// ═══════════════════════════════════════════════════════════
// CHAPTER 1 — PATTERN RECOGNITION
// ═══════════════════════════════════════════════════════════

function genShapeQuest(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? SHAPES.slice(0, 6) : SHAPES;
  const target = pick(pool);
  const dist = pickN(pool.filter(s => s.name !== target.name), p.optionCount - 1)
    .map(s => `${s.emoji} ${s.name}`);
  const correct = `${target.emoji} ${target.name}`;
  return {
    id: uid(), chapter: 'pattern_recognition', gameType: 'shapeQuest',
    signature: sig(['shapeQuest', target.name]),
    text: `${target.emoji} Find the ${target.name}!`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `It looks like this: ${target.emoji}`,
  };
}

function genContinuePattern(p: GeneratorParams): CurriculumQuestion {
  const patLen = p.difficulty === 'easy' ? 2 : p.difficulty === 'intermediate' ? 3 : 4;
  const items = pickN(PAT_EMOJIS, patLen);
  const reps = 3;
  const full = Array(reps).fill(items).flat();
  const showLen = patLen * 2 + (patLen - 1);
  const display = full.slice(0, showLen).join(' ');
  const nextIdx = showLen % patLen;
  const correct = items[nextIdx];
  const dist = pickN(PAT_EMOJIS.filter(i => i !== correct), p.optionCount - 1);
  return {
    id: uid(), chapter: 'pattern_recognition', gameType: 'continue_pattern',
    signature: sig(['a_continue_pat', ...items, showLen]),
    text: `What comes next?\n${display}  ?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genPatternRule(p: GeneratorParams): CurriculumQuestion {
  const patLen = p.difficulty === 'easy' ? 2 : 3;
  const items = pickN(PAT_EMOJIS, patLen);
  const pattern = items.join(' ');
  const full = Array(3).fill(items).flat().join(' ');
  const correct = pattern;
  const wrongs: string[] = [];
  let tries = 0;
  while (wrongs.length < p.optionCount - 1 && tries < 20) {
    tries++;
    const wrong = pickN(PAT_EMOJIS, patLen).join(' ');
    if (wrong !== correct && !wrongs.includes(wrong)) wrongs.push(wrong);
  }
  return {
    id: uid(), chapter: 'pattern_recognition', gameType: 'pattern_rule',
    signature: sig(['a_pat_rule', ...items]),
    text: `What is the repeating unit?\n${full}`,
    options: shuffle([correct, ...wrongs]), correctAnswer: correct,
  };
}

function genPatternSpot(p: GeneratorParams): CurriculumQuestion {
  const patLen = p.difficulty === 'easy' ? 2 : 3;
  const items = pickN(PAT_EMOJIS, patLen);
  const reps = 3;
  const full = Array(reps).fill(items).flat();
  // Replace one item with wrong one
  const breakIdx = randInt(patLen, full.length - 1);
  const original = full[breakIdx];
  let wrong = pick(PAT_EMOJIS.filter(e => e !== original));
  full[breakIdx] = wrong;
  const correct = String(breakIdx + 1); // 1-based position
  const dist: string[] = [];
  while (dist.length < p.optionCount - 1) {
    const w = String(randInt(1, full.length));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return {
    id: uid(), chapter: 'pattern_recognition', gameType: 'pattern_spot',
    signature: sig(['pat_spot', ...items, breakIdx]),
    text: `Which position breaks the pattern?\n${full.map((e, i) => `${i + 1}:${e}`).join(' ')}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `The pattern should repeat: ${items.join(' ')}`,
  };
}

function genSequenceComplete(p: GeneratorParams): CurriculumQuestion {
  // Number + shape mixed sequences
  const type = pick(['number', 'shape'] as const);
  if (type === 'number') {
    const step = p.difficulty === 'easy' ? pick([1, 2]) : pick([2, 3, 5]);
    const start = randInt(1, 20);
    const len = 5;
    const blankIdx = randInt(2, len - 1);
    const seq: string[] = [];
    let answer = 0;
    for (let i = 0; i < len; i++) {
      const v = start + i * step;
      if (i === blankIdx) { seq.push('?'); answer = v; } else seq.push(String(v));
    }
    const correct = String(answer);
    const dist: string[] = [];
    while (dist.length < p.optionCount - 1) {
      const w = String(answer + pick([-3, -2, -1, 1, 2, 3]));
      if (w !== correct && !dist.includes(w)) dist.push(w);
    }
    return {
      id: uid(), chapter: 'pattern_recognition', gameType: 'sequence_complete',
      signature: sig(['seq_comp_num', start, step, blankIdx]),
      text: `Complete the sequence:\n${seq.join(', ')}`,
      options: shuffle([correct, ...dist]), correctAnswer: correct,
    };
  }
  // Shape sequence
  const patLen = p.difficulty === 'easy' ? 2 : 3;
  const shapes = pickN(SHAPES, patLen);
  const reps = 3;
  const full = Array(reps).fill(shapes).flat();
  const revealLen = patLen * 2;
  const display = full.slice(0, revealLen).map(s => s.emoji).join(' ');
  const correct = full[revealLen].emoji + ' ' + full[revealLen].name;
  const dist = pickN(SHAPES.filter(s => s.name !== full[revealLen].name), p.optionCount - 1)
    .map(s => s.emoji + ' ' + s.name);
  return {
    id: uid(), chapter: 'pattern_recognition', gameType: 'sequence_complete',
    signature: sig(['seq_comp_shape', ...shapes.map(s => s.name)]),
    text: `What comes next?\n${display}  ?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 2 — MEMORY
// ═══════════════════════════════════════════════════════════

function genPictureIdentify(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? ANIMALS.slice(0, 6) : ANIMALS;
  const target = pick(pool);
  const dist = pickN(pool.filter(a => a.name !== target.name).map(a => a.name), p.optionCount - 1);
  return {
    id: uid(), chapter: 'memory', gameType: 'pictureIdentify',
    signature: sig(['pic_id', target.name]),
    text: `${target.emoji} What animal is this?`,
    options: shuffle([target.name, ...dist]), correctAnswer: target.name,
  };
}

function genMemoryMatch(p: GeneratorParams): CurriculumQuestion {
  const count = p.difficulty === 'easy' ? 3 : p.difficulty === 'intermediate' ? 4 : 5;
  const selected = pickN(OBJECTS, count);
  const display = selected.map(o => o.emoji).join('  ');
  const removed = pick(selected);
  const remaining = selected.filter(o => o.name !== removed.name).map(o => o.emoji).join('  ');
  const correct = removed.emoji + ' ' + removed.name;
  const dist = pickN(OBJECTS.filter(o => !selected.includes(o)), p.optionCount - 1)
    .map(o => o.emoji + ' ' + o.name);
  return {
    id: uid(), chapter: 'memory', gameType: 'memory_match',
    signature: sig(['mem_match', ...selected.map(o => o.name), removed.name]),
    text: `Remember these: ${display}\n\nNow one is missing: ${remaining}\nWhich one is gone?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genSequenceRecall(p: GeneratorParams): CurriculumQuestion {
  const len = p.difficulty === 'easy' ? 3 : p.difficulty === 'intermediate' ? 4 : 5;
  const items = pickN(PAT_EMOJIS, len);
  const display = items.join(' → ');
  const correct = display;
  const wrongs: string[] = [];
  let tries = 0;
  while (wrongs.length < p.optionCount - 1 && tries < 20) {
    tries++;
    const wrong = shuffle(items).join(' → ');
    if (wrong !== correct && !wrongs.includes(wrong)) wrongs.push(wrong);
  }
  return {
    id: uid(), chapter: 'memory', gameType: 'sequence_recall',
    signature: sig(['seq_recall', ...items]),
    text: `Remember this order:\n${display}\n\nWhich is the correct order?`,
    options: shuffle([correct, ...wrongs]), correctAnswer: correct,
  };
}

function genSpotDiff(p: GeneratorParams): CurriculumQuestion {
  const count = p.difficulty === 'easy' ? 4 : p.difficulty === 'intermediate' ? 5 : 6;
  const items = pickN(OBJECTS, count);
  const row1 = items.map(o => o.emoji).join('  ');
  const changeIdx = randInt(0, count - 1);
  const replacement = pick(OBJECTS.filter(o => !items.includes(o)));
  const row2Items = [...items];
  row2Items[changeIdx] = replacement;
  const row2 = row2Items.map(o => o.emoji).join('  ');
  const correct = `Position ${changeIdx + 1}: ${items[changeIdx].emoji} → ${replacement.emoji}`;
  const dist: string[] = [];
  for (let i = 0; i < count && dist.length < p.optionCount - 1; i++) {
    if (i !== changeIdx) {
      dist.push(`Position ${i + 1}: ${items[i].emoji} → ${pick(OBJECTS.filter(o => !items.includes(o))).emoji}`);
    }
  }
  return {
    id: uid(), chapter: 'memory', gameType: 'spot_diff',
    signature: sig(['spot_diff', ...items.map(o => o.name), changeIdx]),
    text: `Spot the difference!\nRow 1: ${row1}\nRow 2: ${row2}`,
    options: shuffle([correct, ...dist.slice(0, p.optionCount - 1)]), correctAnswer: correct,
  };
}

function genMemoryChain(p: GeneratorParams): CurriculumQuestion {
  const len = p.difficulty === 'easy' ? 3 : p.difficulty === 'intermediate' ? 5 : 7;
  const pool = COLOUR_NAMES.slice(0, p.difficulty === 'easy' ? 4 : 8);
  const chain = Array.from({ length: len }, () => pick(pool));
  const askIdx = p.difficulty === 'easy' ? 0 : randInt(0, len - 1);
  const correct = chain[askIdx];
  const dist = pickN(pool.filter(c => c !== correct), p.optionCount - 1);
  return {
    id: uid(), chapter: 'memory', gameType: 'memory_chain',
    signature: sig(['mem_chain', ...chain, askIdx]),
    text: `Remember: ${chain.join(', ')}\n\nWhat was item #${askIdx + 1}?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 3 — SPEED PROCESSING
// ═══════════════════════════════════════════════════════════

function genNumberTap(p: GeneratorParams): CurriculumQuestion {
  const max = p.difficulty === 'easy' ? 10 : p.difficulty === 'intermediate' ? 20 : 50;
  const target = randInt(1, max);
  const dist: string[] = [];
  while (dist.length < p.optionCount - 1) {
    const v = String(randInt(1, max));
    if (v !== String(target) && !dist.includes(v)) dist.push(v);
  }
  return {
    id: uid(), chapter: 'speed_processing', gameType: 'numberTap',
    signature: sig(['numTap', target]),
    text: `🔢 Quick! Find: ${target}`,
    options: shuffle([String(target), ...dist]), correctAnswer: String(target),
  };
}

function genMathPuzzle(p: GeneratorParams): CurriculumQuestion {
  const half = Math.min(25, Math.floor(p.numRange[1] / 2));
  const op = p.difficulty === 'easy' ? '+' : pick(['+', '−']);
  const a = randInt(1, half);
  const b = op === '+' ? randInt(1, half) : randInt(1, a);
  const answer = op === '+' ? a + b : a - b;
  const correct = String(answer);
  const dist: string[] = [];
  while (dist.length < p.optionCount - 1) {
    const w = String(answer + pick([-3, -2, -1, 1, 2, 3]));
    if (w !== correct && !dist.includes(w) && parseInt(w) >= 0) dist.push(w);
  }
  return {
    id: uid(), chapter: 'speed_processing', gameType: 'mathPuzzle',
    signature: sig(['mathPuz', a, op, b]),
    text: `⚡ Quick math: ${a} ${op} ${b} = ?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genSpeedCount(p: GeneratorParams): CurriculumQuestion {
  const emoji = pick(COUNT_EMOJIS);
  const count = p.difficulty === 'easy' ? randInt(1, 5) : p.difficulty === 'intermediate' ? randInt(3, 8) : randInt(5, 12);
  const display = Array(count).fill(emoji).join(' ');
  const correct = String(count);
  const dist: string[] = [];
  while (dist.length < p.optionCount - 1) {
    const w = String(randInt(Math.max(1, count - 3), count + 3));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return {
    id: uid(), chapter: 'speed_processing', gameType: 'speed_count',
    signature: sig(['speed_count', emoji, count]),
    text: `⚡ Quick count!\n${display}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genQuickSort(p: GeneratorParams): CurriculumQuestion {
  const count = p.difficulty === 'easy' ? 3 : p.difficulty === 'intermediate' ? 4 : 5;
  const nums = Array.from({ length: count }, () => randInt(1, 50));
  const sorted = [...nums].sort((a, b) => a - b);
  const correct = sorted.join(', ');
  const wrongs: string[] = [];
  let tries = 0;
  while (wrongs.length < p.optionCount - 1 && tries < 20) {
    tries++;
    const wrong = shuffle(nums).join(', ');
    if (wrong !== correct && !wrongs.includes(wrong)) wrongs.push(wrong);
  }
  return {
    id: uid(), chapter: 'speed_processing', gameType: 'quick_sort',
    signature: sig(['quick_sort', ...nums]),
    text: `⚡ Sort smallest to largest:\n${nums.join(', ')}`,
    options: shuffle([correct, ...wrongs]), correctAnswer: correct,
  };
}

function genRapidMatch(p: GeneratorParams): CurriculumQuestion {
  const a = randInt(1, 20);
  const b = randInt(1, 20);
  const sum = a + b;
  const correct = `${a} + ${b}`;
  const wrongs: string[] = [];
  let tries = 0;
  while (wrongs.length < p.optionCount - 1 && tries < 20) {
    tries++;
    const wa = randInt(1, 20);
    const wb = randInt(1, 20);
    if (wa + wb !== sum) {
      const expr = `${wa} + ${wb}`;
      if (!wrongs.includes(expr)) wrongs.push(expr);
    }
  }
  return {
    id: uid(), chapter: 'speed_processing', gameType: 'rapid_match',
    signature: sig(['rapid_match', a, b]),
    text: `⚡ Which equals ${sum}?`,
    options: shuffle([correct, ...wrongs]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 4 — VISUAL LOGIC
// ═══════════════════════════════════════════════════════════

function genCountObjects(p: GeneratorParams): CurriculumQuestion {
  const emoji = pick(COUNT_EMOJIS);
  const maxC = p.difficulty === 'easy' ? 5 : p.difficulty === 'intermediate' ? 9 : 15;
  const count = randInt(1, maxC);
  const display = Array(count).fill(emoji).join(' ');
  const correct = String(count);
  const dist: string[] = [];
  while (dist.length < p.optionCount - 1) {
    const w = String(randInt(Math.max(1, count - 3), count + 3));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return {
    id: uid(), chapter: 'visual_logic', gameType: 'countObjects',
    signature: sig(['countObj', emoji, count]),
    text: `🔢 Count: ${display}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genOddOneOut(p: GeneratorParams): CurriculumQuestion {
  if (p.difficulty === 'easy') {
    // Colour-based odd one out
    const mainEmoji = pick(PAT_EMOJIS);
    const oddEmoji = pick(PAT_EMOJIS.filter(e => e !== mainEmoji));
    const count = 4;
    const oddPos = randInt(0, count - 1);
    const emojis = Array(count).fill(mainEmoji);
    emojis[oddPos] = oddEmoji;
    const correct = `Position ${oddPos + 1}: ${oddEmoji}`;
    const dist: string[] = [];
    for (let i = 0; i < count && dist.length < p.optionCount - 1; i++) {
      if (i !== oddPos) dist.push(`Position ${i + 1}: ${emojis[i]}`);
    }
    return {
      id: uid(), chapter: 'visual_logic', gameType: 'odd_one_out',
      signature: sig(['odd_out', mainEmoji, oddEmoji, oddPos]),
      text: `Which is the odd one out?\n${emojis.map((e, i) => `${i + 1}:${e}`).join('  ')}`,
      options: shuffle([correct, ...dist]), correctAnswer: correct,
    };
  }
  // Category-based
  const categories = [
    { name: 'fruit', items: ['🍎', '🍌', '🍊', '🍇'] },
    { name: 'animal', items: ['🐱', '🐶', '🐦', '🐟'] },
    { name: 'vehicle', items: ['🚗', '🚌', '🚲', '✈️'] },
  ];
  const mainCat = pick(categories);
  const oddCat = pick(categories.filter(c => c.name !== mainCat.name));
  const mainItems = pickN(mainCat.items, p.optionCount - 1);
  const oddItem = pick(oddCat.items);
  const correct = oddItem;
  return {
    id: uid(), chapter: 'visual_logic', gameType: 'odd_one_out',
    signature: sig(['odd_out_cat', mainCat.name, oddItem]),
    text: `Which does NOT belong?\n${shuffle([...mainItems, oddItem]).join('  ')}`,
    options: shuffle([oddItem, ...mainItems.slice(0, p.optionCount - 1)]), correctAnswer: correct,
  };
}

function genMirrorMatch(p: GeneratorParams): CurriculumQuestion {
  // Simplified mirror/symmetry using emoji pairs
  const items = pickN(SHAPES.slice(0, 6), 3);
  const row = items.map(s => s.emoji).join(' ');
  const mirrored = [...items].reverse().map(s => s.emoji).join(' ');
  const correct = mirrored;
  const wrongs: string[] = [];
  let tries = 0;
  while (wrongs.length < p.optionCount - 1 && tries < 20) {
    tries++;
    const wrong = shuffle(items).map(s => s.emoji).join(' ');
    if (wrong !== correct && !wrongs.includes(wrong)) wrongs.push(wrong);
  }
  return {
    id: uid(), chapter: 'visual_logic', gameType: 'mirror_match',
    signature: sig(['mirror', ...items.map(s => s.name)]),
    text: `Mirror this row:\n${row}\n\nWhich is the mirror?`,
    options: shuffle([correct, ...wrongs]), correctAnswer: correct,
  };
}

function genGridLogic(p: GeneratorParams): CurriculumQuestion {
  // 2×2 or 3×3 grid with one missing
  const size = p.difficulty === 'easy' ? 2 : 3;
  const pool = pickN(PAT_EMOJIS, size);
  const grid: string[][] = [];
  for (let r = 0; r < size; r++) {
    const row: string[] = [];
    for (let c = 0; c < size; c++) row.push(pool[(r + c) % pool.length]);
    grid.push(row);
  }
  const blankR = randInt(0, size - 1);
  const blankC = randInt(0, size - 1);
  const correct = grid[blankR][blankC];
  grid[blankR][blankC] = '❓';
  const display = grid.map(row => row.join(' ')).join('\n');
  const dist = pickN(PAT_EMOJIS.filter(e => e !== correct), p.optionCount - 1);
  return {
    id: uid(), chapter: 'visual_logic', gameType: 'grid_logic',
    signature: sig(['grid', size, blankR, blankC, ...pool]),
    text: `What goes in place of ❓?\n${display}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genShadowMatch(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? ANIMALS.slice(0, 6) : ANIMALS;
  const target = pick(pool);
  const desc = `a ${target.name} shadow 🌑`;
  const dist = pickN(pool.filter(a => a.name !== target.name).map(a => a.name), p.optionCount - 1);
  return {
    id: uid(), chapter: 'visual_logic', gameType: 'shadow_match',
    signature: sig(['shadow', target.name]),
    text: `This shadow looks like ${desc}.\nWhat animal is it?`,
    options: shuffle([target.name, ...dist]), correctAnswer: target.name,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 5 — MATCHING INTELLIGENCE
// ═══════════════════════════════════════════════════════════

function genWordBuilder(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? CVC_WORDS.slice(0, 15) : p.difficulty === 'intermediate' ? CVC_WORDS : [...CVC_WORDS, ...LONGER_WORDS];
  const word = pick(pool);
  const letters = shuffle(word.split('')).join(' ');
  const correct = word;
  const dist = pickN(pool.filter(w => w !== word), p.optionCount - 1);
  return {
    id: uid(), chapter: 'matching_intelligence', gameType: 'wordBuilder',
    signature: sig(['wordBuild', word]),
    text: `🔤 Unscramble: ${letters}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genGuessTheWord(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? CVC_WORDS.slice(0, 15) : [...CVC_WORDS, ...LONGER_WORDS];
  const word = pick(pool);
  const hideCount = p.difficulty === 'easy' ? 1 : Math.min(2, word.length - 2);
  const indices = new Set<number>();
  while (indices.size < hideCount) indices.add(randInt(0, word.length - 1));
  const display = word.split('').map((c, i) => indices.has(i) ? '_' : c).join('');
  const correct = word;
  const dist = pickN(pool.filter(w => w !== word), p.optionCount - 1);
  return {
    id: uid(), chapter: 'matching_intelligence', gameType: 'guessTheWord',
    signature: sig(['guessWord', word, ...indices]),
    text: `Guess the word: ${display}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genMatchLetters(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? LETTERS.slice(0, 13) : LETTERS;
  const letter = pick(pool);
  const lower = letter.toLowerCase();
  const dir = p.difficulty === 'difficult' ? pick(['toLower', 'toUpper'] as const) : 'toLower';
  if (dir === 'toLower') {
    const dist = pickN(pool.filter(l => l !== letter).map(l => l.toLowerCase()), p.optionCount - 1);
    return {
      id: uid(), chapter: 'matching_intelligence', gameType: 'matchLetters',
      signature: sig(['matchLet', letter, dir]),
      text: `🔡 Match: "${letter}" → lowercase`,
      options: shuffle([lower, ...dist]), correctAnswer: lower,
    };
  }
  const dist = pickN(pool.filter(l => l !== letter), p.optionCount - 1);
  return {
    id: uid(), chapter: 'matching_intelligence', gameType: 'matchLetters',
    signature: sig(['matchLet', letter, dir]),
    text: `🔠 Match: "${lower}" → uppercase`,
    options: shuffle([letter, ...dist]), correctAnswer: letter,
  };
}

function genCrossMatch(p: GeneratorParams): CurriculumQuestion {
  // Match animal to its sound/habitat
  const MATCHES: { item: string; match: string; category: string }[] = [
    { item: '🐱 Cat', match: 'Meow', category: 'sound' },
    { item: '🐶 Dog', match: 'Woof', category: 'sound' },
    { item: '🐄 Cow', match: 'Moo', category: 'sound' },
    { item: '🐸 Frog', match: 'Croak', category: 'sound' },
    { item: '🦁 Lion', match: 'Roar', category: 'sound' },
    { item: '🐦 Bird', match: 'Tweet', category: 'sound' },
    { item: '🐍 Snake', match: 'Hiss', category: 'sound' },
    { item: '🐝 Bee', match: 'Buzz', category: 'sound' },
    { item: '🐟 Fish', match: 'Water', category: 'habitat' },
    { item: '🐒 Monkey', match: 'Tree', category: 'habitat' },
    { item: '🐻 Bear', match: 'Cave', category: 'habitat' },
    { item: '🐦 Bird', match: 'Nest', category: 'habitat' },
  ];
  const entry = pick(MATCHES);
  const correct = entry.match;
  const dist = pickN(MATCHES.filter(m => m.match !== correct).map(m => m.match), p.optionCount - 1);
  const qType = entry.category === 'sound' ? 'What sound does' : 'Where does';
  const qEnd = entry.category === 'sound' ? 'make?' : 'live?';
  return {
    id: uid(), chapter: 'matching_intelligence', gameType: 'cross_match',
    signature: sig(['cross_match', entry.item, entry.category]),
    text: `${qType} ${entry.item} ${qEnd}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genCategorySort(p: GeneratorParams): CurriculumQuestion {
  const CATEGORIES: Record<string, string[]> = {
    Fruits: ['🍎 Apple', '🍌 Banana', '🍊 Orange', '🍇 Grapes', '🍓 Strawberry'],
    Animals: ['🐱 Cat', '🐶 Dog', '🐦 Bird', '🐟 Fish', '🐸 Frog'],
    Vehicles: ['🚗 Car', '🚌 Bus', '🚲 Bike', '✈️ Plane', '🚂 Train'],
    Clothing: ['👕 Shirt', '👖 Pants', '👟 Shoes', '🧢 Cap', '🧣 Scarf'],
  };
  const cats = Object.keys(CATEGORIES);
  const targetCat = pick(cats);
  const targetItem = pick(CATEGORIES[targetCat]);
  const correct = targetCat;
  const dist = cats.filter(c => c !== targetCat).slice(0, p.optionCount - 1);
  return {
    id: uid(), chapter: 'matching_intelligence', gameType: 'category_sort',
    signature: sig(['cat_sort', targetItem, targetCat]),
    text: `"${targetItem}" belongs to which group?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// REGISTRY + PUBLIC API
// ═══════════════════════════════════════════════════════════

type CurrGenFn = (p: GeneratorParams) => CurriculumQuestion;

export const ARCADE_GENERATORS: Record<string, CurrGenFn> = {
  // Pattern Recognition
  shapeQuest: genShapeQuest, continue_pattern: genContinuePattern,
  pattern_rule: genPatternRule, pattern_spot: genPatternSpot, sequence_complete: genSequenceComplete,
  // Memory
  pictureIdentify: genPictureIdentify, memory_match: genMemoryMatch,
  sequence_recall: genSequenceRecall, spot_diff: genSpotDiff, memory_chain: genMemoryChain,
  // Speed Processing
  numberTap: genNumberTap, mathPuzzle: genMathPuzzle,
  speed_count: genSpeedCount, quick_sort: genQuickSort, rapid_match: genRapidMatch,
  // Visual Logic
  countObjects: genCountObjects, odd_one_out: genOddOneOut,
  mirror_match: genMirrorMatch, grid_logic: genGridLogic, shadow_match: genShadowMatch,
  // Matching Intelligence
  wordBuilder: genWordBuilder, guessTheWord: genGuessTheWord,
  matchLetters: genMatchLetters, cross_match: genCrossMatch, category_sort: genCategorySort,
};

/**
 * Generate a batch of curriculum Arcade questions.
 */
export function generateArcadeBatch(
  gameTypeId: string,
  params: GeneratorParams,
  count: number,
  usedSignatures: Set<string>,
): CurriculumQuestion[] {
  const gen = ARCADE_GENERATORS[gameTypeId];
  if (!gen) {
    console.warn(`[ArcadeGen] No curriculum generator for: ${gameTypeId}`);
    return [];
  }

  const questions: CurriculumQuestion[] = [];
  let attempts = 0;

  while (questions.length < count && attempts < count * 25) {
    attempts++;
    try {
      const q = gen(params);
      if (!usedSignatures.has(q.signature)) {
        usedSignatures.add(q.signature);
        questions.push(q);
      }
    } catch { /* skip bad generation */ }
  }

  return questions;
}

/** All registered Arcade game type IDs */
export function allArcadeGameTypes(): string[] {
  return Object.keys(ARCADE_GENERATORS);
}
